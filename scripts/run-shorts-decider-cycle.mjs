#!/usr/bin/env node

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { pickContentPlanEntries } from "./runtime/content-plan-picker-engine.mjs";
import {
  appendShortsFamilyHistory,
  buildShortsDecision,
  evaluateShortsFamilies,
  loadShortsFamilyHistory,
  saveShortsFamilyHistory,
} from "./runtime/shorts-decider-engine.mjs";
import { enableStrictNonInteractiveMode, logAutonomousDecision } from "./runtime/non-interactive-mode.mjs";
import { bootstrapLocalRuntimeEnv } from "./runtime/local-runtime-env.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const controlCenterRoot = path.resolve(repoRoot, "..", "adr-control-center");

const DEFAULT_OUTPUT_ROOT = path.join(repoRoot, "shorts-decider-runs");
const DEFAULT_CONTENT_PLAN_OUTPUT_ROOT = path.join(controlCenterRoot, "runtime", "queues", "content-plan");
const DEFAULT_CONTENT_PLAN_PATH = path.join(DEFAULT_CONTENT_PLAN_OUTPUT_ROOT, "latest", "content_plan_queue.latest.json");
const DEFAULT_FAMILY_HISTORY_PATH = path.join(
  controlCenterRoot,
  "runtime",
  "queues",
  "shorts-decider",
  "latest",
  "shorts_family_history.latest.json",
);
const DEFAULT_QUESTION_DIR = path.join(repoRoot, "examples", "question-batch-wave-1");
const DEFAULT_WORD_DIR = path.join(repoRoot, "examples");
const DEFAULT_NEWS_DIR = path.join(repoRoot, "examples", "approved-news");
const DEFAULT_NEWS_TABLE_URL =
  process.env.DRAFT_STORAGE_API_URL
  || "https://tsarents.app.n8n.cloud/api/v1/data-tables/o3VHi3uQOI2y0z1o/rows";
const DEFAULT_QUESTION_HISTORY_PATH = path.join(
  controlCenterRoot,
  "runtime",
  "queues",
  "question-autopilot",
  "latest",
  "question_publish_history.latest.json",
);
const DEFAULT_WORD_HISTORY_PATH = path.join(
  controlCenterRoot,
  "runtime",
  "queues",
  "word-autopilot",
  "latest",
  "word_publish_history.latest.json",
);
const DEFAULT_NEWS_HISTORY_PATH = path.join(
  controlCenterRoot,
  "runtime",
  "queues",
  "news-autopilot",
  "latest",
  "news_publish_history.latest.json",
);

enableStrictNonInteractiveMode("run-shorts-decider-cycle");

function text(value) {
  return value == null ? "" : String(value).trim();
}

function parseOutputPath(stdout, key) {
  const line = String(stdout || "")
    .split("\n")
    .map((entry) => entry.trim())
    .find((entry) => entry.startsWith(`${key}=`));
  return line ? line.slice(key.length + 1) : "";
}

function topBreakdownEntries(breakdown, limit = 3) {
  if (!Array.isArray(breakdown)) return [];
  const ranked = [...breakdown]
    .filter((entry) => text(entry?.label) !== "base")
    .sort((left, right) => Math.abs(Number(right?.value || 0)) - Math.abs(Number(left?.value || 0)));
  return ranked.slice(0, Math.max(0, limit));
}

function buildSelectedReason(decision) {
  const reasons = topBreakdownEntries(decision?.selected_family_breakdown, 3)
    .map((entry) => text(entry?.note || entry?.label))
    .filter(Boolean);
  if (reasons.length) return reasons.join(" ");
  return text(decision?.priority_reason || decision?.blocking_reason || "No extra reason recorded.");
}

function inferExecutionState({ decisionState, skipExecute, skipPublish, downstreamError, downstreamReportPath, youtubeUrl }) {
  if (decisionState === "blocked") return "blocked_before_execute";
  if (downstreamError) return "executor_failed";
  if (skipExecute) return "decision_only";
  if (youtubeUrl) return "published";
  if (downstreamReportPath && skipPublish) return "executed_skip_publish";
  if (downstreamReportPath) return "executed";
  if (skipPublish) return "skip_publish_requested";
  return "executed_without_publish_confirmation";
}

function buildAlertPayload(summary, context) {
  const base = {
    alert_needed: false,
    alert_code: "",
    alert_severity: "info",
    recommended_alert_message: "",
  };

  if (summary.execution_state === "blocked_before_execute") {
    return {
      alert_needed: true,
      alert_code: "slot_blocked_before_execute",
      alert_severity: "high",
      recommended_alert_message: `Слот заблокирован: ${summary.blocking_reason || "не удалось выбрать готовый контент."}`,
    };
  }

  if (summary.execution_state === "executor_failed") {
    return {
      alert_needed: true,
      alert_code: "slot_executor_failed",
      alert_severity: "high",
      recommended_alert_message: `Слот упал после выбора ${summary.selected_family || "семейства"}: ${summary.downstream_error || "ошибка downstream executor."}`,
    };
  }

  if (summary.execution_state === "executed_without_publish_confirmation" && !context.skip_publish) {
    return {
      alert_needed: true,
      alert_code: "slot_publish_confirmation_missing",
      alert_severity: "medium",
      recommended_alert_message: `Слот ${summary.selected_family || "unknown"} отработал без явного подтверждения публикации. Нужна ручная проверка downstream path.`,
    };
  }

  return base;
}

function buildSlotSummary(decision, context) {
  const executionState = inferExecutionState({
    decisionState: decision?.decision_state,
    skipExecute: context.skip_execute,
    skipPublish: context.skip_publish,
    downstreamError: context.downstream_error,
    downstreamReportPath: context.downstream_report_path,
    youtubeUrl: context.youtube_url,
  });

  const selectedFamily = text(decision?.selected_family);
  const selectedSourceId = text(decision?.selected_source_id);
  const familyScores = Array.isArray(decision?.family_scores) ? decision.family_scores : [];
  const winningScore = familyScores.find((entry) => text(entry?.family) === selectedFamily);
  const fallbackFamilies = Array.isArray(decision?.fallback_families) ? decision.fallback_families : [];

  const summary = {
    slot_started_at: context.created_at,
    trace_id: context.trace_id,
    decision_state: text(decision?.decision_state),
    execution_state: executionState,
    selected_family: selectedFamily,
    selected_source_id: selectedSourceId,
    selected_family_score: Number.isFinite(Number(decision?.selected_family_score))
      ? Number(decision.selected_family_score)
      : Number(winningScore?.score || 0),
    selected_reason: buildSelectedReason(decision),
    planning_target_family: text(decision?.planning_target_family),
    production_target_family: text(decision?.production_target_family),
    fallback_families: fallbackFamilies,
    youtube_url: text(context.youtube_url),
    downstream_report_path: text(context.downstream_report_path),
    blocking_reason: text(decision?.blocking_reason),
    downstream_error: text(context.downstream_error),
    alert_needed: false,
    alert_code: "",
    alert_severity: "info",
    recommended_alert_message: "",
  };

  Object.assign(summary, buildAlertPayload(summary, context));

  return summary;
}

function buildSlotMarkdown(decision, summary, context) {
  const lines = [];
  lines.push("# Shorts Slot Report");
  lines.push("");
  lines.push(`- Время слота: \`${summary.slot_started_at}\``);
  lines.push(`- Trace ID: \`${summary.trace_id}\``);
  lines.push(`- Статус выбора: \`${summary.decision_state}\``);
  lines.push(`- Статус выполнения: \`${summary.execution_state}\``);
  lines.push("");

  if (summary.decision_state === "blocked") {
    lines.push("## Итог");
    lines.push("");
    lines.push(`- Публикация не запускалась: ${summary.blocking_reason || "не найден готовый кандидат."}`);
  } else {
    lines.push("## Что выбрали");
    lines.push("");
    lines.push(`- Семейство: \`${summary.selected_family || "n/a"}\``);
    lines.push(`- Source ID: \`${summary.selected_source_id || "n/a"}\``);
    if (Number.isFinite(summary.selected_family_score)) {
      lines.push(`- Score: \`${summary.selected_family_score}\``);
    }
    lines.push(`- Почему: ${summary.selected_reason || "Причина не записана."}`);
    if (summary.planning_target_family || summary.production_target_family) {
      lines.push(`- План / production hint: \`${summary.planning_target_family || "-"} / ${summary.production_target_family || "-"}\``);
    }
    if (summary.fallback_families.length) {
      lines.push(`- Fallback families: ${summary.fallback_families.join(", ")}`);
    }
    lines.push("");
    lines.push("## Что произошло дальше");
    lines.push("");
    if (context.skip_execute) {
      lines.push("- Downstream executor не запускался (`--skip-execute`).");
    } else if (summary.execution_state === "executor_failed") {
      lines.push(`- Downstream executor упал: ${summary.downstream_error || "ошибка без текста."}`);
    } else if (summary.youtube_url) {
      lines.push(`- Публикация подтверждена: ${summary.youtube_url}`);
    } else if (summary.downstream_report_path) {
      lines.push(`- Downstream отработал, report: \`${summary.downstream_report_path}\``);
      if (context.skip_publish) {
        lines.push("- Publish был сознательно пропущен (`--skip-publish`).");
      } else {
        lines.push("- YouTube URL из этого запуска не был выведен в stdout.");
      }
    } else if (context.skip_publish) {
      lines.push("- Publish был пропущен до загрузки на YouTube.");
    } else {
      lines.push("- Downstream слой не вернул явный report path.");
    }
  }

  lines.push("");
  lines.push("## Alert");
  lines.push("");
  lines.push(`- Нужно ли тревожить оператора: ${summary.alert_needed ? "Да" : "Нет"}`);
  lines.push(`- Alert code: ${summary.alert_code || "none"}`);
  lines.push(`- Severity: ${summary.alert_severity || "info"}`);
  if (summary.alert_needed) {
    lines.push(`- Короткое сообщение: ${summary.recommended_alert_message}`);
  } else {
    lines.push("- Успешные слоты не шлют отдельное Telegram-уведомление.");
  }
  lines.push("");
  lines.push("## Артефакты");
  lines.push("");
  lines.push(`- content_plan_path: \`${text(context.content_plan_path)}\``);
  lines.push(`- shorts_decision_json: \`${text(context.shorts_decision_path)}\``);
  if (summary.downstream_report_path) lines.push(`- downstream_report: \`${summary.downstream_report_path}\``);

  return `${lines.join("\n")}\n`;
}

function printHelp() {
  console.log(`Usage: node scripts/run-shorts-decider-cycle.mjs [options]

Options:
  --output-root <dir>            Output root (default: ${DEFAULT_OUTPUT_ROOT})
  --content-plan-output-root <d> Output root for refreshed content plan queue (default: ${DEFAULT_CONTENT_PLAN_OUTPUT_ROOT})
  --content-plan <file>          Explicit content plan queue JSON (default: ${DEFAULT_CONTENT_PLAN_PATH})
  --family-history <file>        Family-level publish history JSON (default: ${DEFAULT_FAMILY_HISTORY_PATH})
  --question-dir <dir>           Question catalog (default: ${DEFAULT_QUESTION_DIR})
  --word-dir <dir>               WORD catalog (default: ${DEFAULT_WORD_DIR})
  --news-dir <dir>               Local approved NEWS dir (default: ${DEFAULT_NEWS_DIR})
  --news-table-url <url>         Live NEWS storage table URL
  --question-history <file>      QUESTION publish history JSON
  --word-history <file>          WORD publish history JSON
  --news-history <file>          NEWS publish history JSON
  --recent-limit <n>             Recent anti-repeat window for per-family selectors (default: 3)
  --family-recent-limit <n>      Recent anti-repeat window for family rotation (default: 6)
  --skip-execute                 Decide only, do not run any downstream executor
  --skip-publish                 Forwarded to downstream executor when executed
  --help                         Show this help
`);
}

function parseArgs(argv) {
  const args = {
    outputRoot: DEFAULT_OUTPUT_ROOT,
    contentPlanOutputRoot: DEFAULT_CONTENT_PLAN_OUTPUT_ROOT,
    contentPlanPath: DEFAULT_CONTENT_PLAN_PATH,
    familyHistoryPath: DEFAULT_FAMILY_HISTORY_PATH,
    questionDir: DEFAULT_QUESTION_DIR,
    wordDir: DEFAULT_WORD_DIR,
    newsDir: DEFAULT_NEWS_DIR,
    newsTableUrl: DEFAULT_NEWS_TABLE_URL,
    questionHistoryPath: DEFAULT_QUESTION_HISTORY_PATH,
    wordHistoryPath: DEFAULT_WORD_HISTORY_PATH,
    newsHistoryPath: DEFAULT_NEWS_HISTORY_PATH,
    recentLimit: 3,
    familyRecentLimit: 6,
    skipExecute: false,
    skipPublish: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === "--output-root") args.outputRoot = path.resolve(argv[++i]);
    else if (token === "--content-plan-output-root") args.contentPlanOutputRoot = path.resolve(argv[++i]);
    else if (token === "--content-plan") args.contentPlanPath = path.resolve(argv[++i]);
    else if (token === "--family-history") args.familyHistoryPath = path.resolve(argv[++i]);
    else if (token === "--question-dir") args.questionDir = path.resolve(argv[++i]);
    else if (token === "--word-dir") args.wordDir = path.resolve(argv[++i]);
    else if (token === "--news-dir") args.newsDir = path.resolve(argv[++i]);
    else if (token === "--news-table-url") args.newsTableUrl = argv[++i];
    else if (token === "--question-history") args.questionHistoryPath = path.resolve(argv[++i]);
    else if (token === "--word-history") args.wordHistoryPath = path.resolve(argv[++i]);
    else if (token === "--news-history") args.newsHistoryPath = path.resolve(argv[++i]);
    else if (token === "--recent-limit") args.recentLimit = Math.max(0, Number(argv[++i]) || 3);
    else if (token === "--family-recent-limit") args.familyRecentLimit = Math.max(0, Number(argv[++i]) || 6);
    else if (token === "--skip-execute") args.skipExecute = true;
    else if (token === "--skip-publish") args.skipPublish = true;
    else if (token === "--help" || token === "-h") {
      printHelp();
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${token}`);
    }
  }

  return args;
}

function runNodeScript(scriptPath, scriptArgs) {
  const result = spawnSync(process.execPath, [scriptPath, ...scriptArgs], {
    cwd: repoRoot,
    encoding: "utf8",
    stdio: "pipe",
    maxBuffer: 50 * 1024 * 1024,
  });

  if (result.status !== 0) {
    throw new Error(
      [
        `Script failed: ${path.basename(scriptPath)}`,
        result.stdout?.trim() ? `stdout:\n${result.stdout.trim()}` : null,
        result.stderr?.trim() ? `stderr:\n${result.stderr.trim()}` : null,
      ].filter(Boolean).join("\n"),
    );
  }

  return result.stdout || "";
}

async function loadJson(filePath, fallback = null) {
  try {
    return JSON.parse(await readFile(filePath, "utf8"));
  } catch {
    return fallback;
  }
}

async function writeJson(filePath, payload) {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}

function buildExecutorInvocation(family, args) {
  const common = [];
  if (args.skipPublish) common.push("--skip-publish");

  if (family === "QUESTION") {
    return {
      scriptPath: path.join(repoRoot, "scripts", "run-question-autopilot-cycle.mjs"),
      scriptArgs: common,
    };
  }
  if (family === "WORD") {
    return {
      scriptPath: path.join(repoRoot, "scripts", "run-word-autopilot-cycle.mjs"),
      scriptArgs: common,
    };
  }
  if (family === "NEWS") {
    return {
      scriptPath: path.join(repoRoot, "scripts", "run-news-autopilot-cycle.mjs"),
      scriptArgs: common,
    };
  }
  throw new Error(`Unsupported family: ${family}`);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  await bootstrapLocalRuntimeEnv(repoRoot);

  const contentPlanStdout = runNodeScript(
    path.join(repoRoot, "scripts", "run-content-plan-queue.mjs"),
    ["--output-root", args.contentPlanOutputRoot],
  );
  const refreshedContentPlanPath =
    parseOutputPath(contentPlanStdout, "latest_content_plan_queue")
    || args.contentPlanPath;
  const contentPlanQueue = await loadJson(refreshedContentPlanPath, { entries: [] });
  const planSelection = pickContentPlanEntries(contentPlanQueue);
  const familyHistoryEntries = await loadShortsFamilyHistory(args.familyHistoryPath);

  const availabilityEntries = await evaluateShortsFamilies({
    questionDir: args.questionDir,
    wordDir: args.wordDir,
    newsDir: args.newsDir,
    newsTableUrl: args.newsTableUrl,
    n8nApiKey: process.env.N8N_API_KEY,
    questionHistoryPath: args.questionHistoryPath,
    wordHistoryPath: args.wordHistoryPath,
    newsHistoryPath: args.newsHistoryPath,
    recentLimit: args.recentLimit,
  });

  const traceId = `shorts-decider-${Date.now()}`;
  const decision = buildShortsDecision(availabilityEntries, contentPlanQueue, familyHistoryEntries, {
    familyRecentLimit: args.familyRecentLimit,
    planSelection,
  });

  const outputDir = path.join(args.outputRoot, traceId);
  await mkdir(outputDir, { recursive: true });
  const decisionPath = path.join(outputDir, "shorts_decision.json");
  await writeJson(decisionPath, {
    created_at: new Date().toISOString(),
    trace_id: traceId,
    content_plan_path: refreshedContentPlanPath,
    content_plan_rotation_mode: text(contentPlanQueue?.rotation_mode),
    planning_entry_id: text(planSelection?.planning_entry?.queue_entry_id),
    planning_target_family: text(decision.planning_target_family),
    production_entry_id: text(planSelection?.production_entry?.queue_entry_id),
    production_target_family: text(decision.production_target_family),
    production_candidate_count: Array.isArray(planSelection?.production_candidates) ? planSelection.production_candidates.length : 0,
    recent_limit: args.recentLimit,
    family_recent_limit: args.familyRecentLimit,
    availability_entries: availabilityEntries,
    ...decision,
  });

  const reportPath = path.join(outputDir, "shorts_decider_report.json");
  const markdownReportPath = path.join(outputDir, "shorts_slot_report.md");

  if (decision.decision_state === "blocked") {
    const blockedSummary = buildSlotSummary(decision, {
      created_at: new Date().toISOString(),
      trace_id: traceId,
      content_plan_path: refreshedContentPlanPath,
      shorts_decision_path: decisionPath,
      skip_execute: args.skipExecute,
      skip_publish: args.skipPublish,
      downstream_report_path: "",
      youtube_url: "",
      downstream_error: "",
    });
    const blockedReport = {
      created_at: blockedSummary.slot_started_at,
      trace_id: traceId,
      content_plan_path: refreshedContentPlanPath,
      family_history_path: args.familyHistoryPath,
      planning_entry_id: text(planSelection?.planning_entry?.queue_entry_id),
      planning_target_family: text(decision.planning_target_family),
      production_entry_id: text(planSelection?.production_entry?.queue_entry_id),
      production_target_family: text(decision.production_target_family),
      selected_family: "",
      selected_source_id: "",
      skip_execute: args.skipExecute,
      skip_publish: args.skipPublish,
      downstream_report_path: "",
      youtube_url: "",
      slot_summary: blockedSummary,
    };
    await writeJson(reportPath, blockedReport);
    await writeFile(
      markdownReportPath,
      buildSlotMarkdown(decision, blockedSummary, {
        content_plan_path: refreshedContentPlanPath,
        shorts_decision_path: decisionPath,
        skip_execute: args.skipExecute,
        skip_publish: args.skipPublish,
      }),
      "utf8",
    );
    console.log(`output_dir=${outputDir}`);
    console.log(`shorts_decision=${decisionPath}`);
    console.log(`shorts_decider_report=${reportPath}`);
    console.log(`shorts_slot_report=${markdownReportPath}`);
    console.log(`decision_state=blocked`);
    return;
  }

  logAutonomousDecision("shorts decider selected family", {
    trace_id: traceId,
    selected_family: decision.selected_family,
    selected_source_id: decision.selected_source_id,
  });

  let downstreamStdout = "";
  let downstreamReportPath = "";
  let youtubeUrl = "";
  let downstreamError = "";

  try {
    if (!args.skipExecute) {
      const invocation = buildExecutorInvocation(decision.selected_family, args);
      downstreamStdout = runNodeScript(invocation.scriptPath, invocation.scriptArgs);
      downstreamReportPath =
        parseOutputPath(downstreamStdout, `${decision.selected_family.toLowerCase()}_autopilot_report`)
        || parseOutputPath(downstreamStdout, "dispatch_report");
      const publishUrlMatch = String(downstreamStdout).match(/youtube_urls=([^\n]+)/);
      youtubeUrl = publishUrlMatch ? text(publishUrlMatch[1].split(",")[0]) : "";

      if (!args.skipPublish) {
        const nextFamilyHistory = appendShortsFamilyHistory(familyHistoryEntries, {
          family: decision.selected_family,
          selected_at: new Date().toISOString(),
          trace_id: traceId,
          selected_source_id: decision.selected_source_id,
          youtube_url: youtubeUrl,
          downstream_report_path: downstreamReportPath,
        });
        await saveShortsFamilyHistory(args.familyHistoryPath, nextFamilyHistory);
      }
    }
  } catch (error) {
    downstreamError = text(error?.message || error);
  }

  const reportCreatedAt = new Date().toISOString();
  const slotSummary = buildSlotSummary(decision, {
    created_at: reportCreatedAt,
    trace_id: traceId,
    content_plan_path: refreshedContentPlanPath,
    shorts_decision_path: decisionPath,
    skip_execute: args.skipExecute,
    skip_publish: args.skipPublish,
    downstream_report_path: downstreamReportPath,
    youtube_url: youtubeUrl,
    downstream_error: downstreamError,
  });

  const report = {
    created_at: reportCreatedAt,
    trace_id: traceId,
    content_plan_path: refreshedContentPlanPath,
    family_history_path: args.familyHistoryPath,
    planning_entry_id: text(planSelection?.planning_entry?.queue_entry_id),
    planning_target_family: text(decision.planning_target_family),
    production_entry_id: text(planSelection?.production_entry?.queue_entry_id),
    production_target_family: text(decision.production_target_family),
    selected_family: decision.selected_family,
    selected_source_id: decision.selected_source_id,
    skip_execute: args.skipExecute,
    skip_publish: args.skipPublish,
    downstream_report_path: downstreamReportPath,
    youtube_url: youtubeUrl,
    downstream_error: downstreamError,
    slot_summary: slotSummary,
  };
  await writeJson(reportPath, report);
  await writeFile(
    markdownReportPath,
    buildSlotMarkdown(decision, slotSummary, {
      content_plan_path: refreshedContentPlanPath,
      shorts_decision_path: decisionPath,
      skip_execute: args.skipExecute,
      skip_publish: args.skipPublish,
      downstream_report_path: downstreamReportPath,
      youtube_url: youtubeUrl,
      downstream_error: downstreamError,
    }),
    "utf8",
  );

  console.log(`output_dir=${outputDir}`);
  console.log(`shorts_decision=${decisionPath}`);
  console.log(`shorts_decider_report=${reportPath}`);
  console.log(`shorts_slot_report=${markdownReportPath}`);
  console.log(`selected_family=${decision.selected_family}`);
  console.log(`selected_source_id=${decision.selected_source_id}`);
  if (downstreamReportPath) console.log(`downstream_report=${downstreamReportPath}`);
  if (youtubeUrl) console.log(`youtube_urls=${youtubeUrl}`);
  if (downstreamError) {
    console.error(downstreamError);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
