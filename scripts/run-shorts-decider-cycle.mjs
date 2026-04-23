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

  if (decision.decision_state === "blocked") {
    console.log(`output_dir=${outputDir}`);
    console.log(`shorts_decision=${decisionPath}`);
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

  const report = {
    created_at: new Date().toISOString(),
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
  };
  const reportPath = path.join(outputDir, "shorts_decider_report.json");
  await writeJson(reportPath, report);

  console.log(`output_dir=${outputDir}`);
  console.log(`shorts_decision=${decisionPath}`);
  console.log(`shorts_decider_report=${reportPath}`);
  console.log(`selected_family=${decision.selected_family}`);
  console.log(`selected_source_id=${decision.selected_source_id}`);
  if (downstreamReportPath) console.log(`downstream_report=${downstreamReportPath}`);
  if (youtubeUrl) console.log(`youtube_urls=${youtubeUrl}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
