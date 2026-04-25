#!/usr/bin/env node

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import {
  appendPublishedQuestionHistory,
  buildQuestionDecision,
  loadQuestionAutopilotHistory,
  saveQuestionAutopilotHistory,
} from "./runtime/question-autopilot-engine.mjs";
import {
  appendIssuedQuestionHistory,
  consumePreparedQuestion,
} from "./runtime/question-content-creator-engine.mjs";
import { enableStrictNonInteractiveMode, logAutonomousDecision } from "./runtime/non-interactive-mode.mjs";
import { bootstrapLocalRuntimeEnv } from "./runtime/local-runtime-env.mjs";
import { bootstrapPhotorealRuntimeEnv } from "./runtime/photoreal-runtime-env.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const controlCenterRoot = path.resolve(repoRoot, "..", "adr-control-center");
const DEFAULT_OUTPUT_ROOT = path.join(repoRoot, "question-autopilot-runs");
const DEFAULT_CREATOR_OUTPUT_ROOT = path.join(controlCenterRoot, "runtime", "queues", "question-content-creator");
const DEFAULT_QUESTION_DIR = path.join(repoRoot, "examples", "question-batch-wave-1");
const DEFAULT_HISTORY_PATH = path.join(
  controlCenterRoot,
  "runtime",
  "queues",
  "question-autopilot",
  "latest",
  "question_publish_history.latest.json",
);
const DEFAULT_ISSUED_HISTORY_PATH = path.join(
  controlCenterRoot,
  "runtime",
  "queues",
  "question-content-creator",
  "latest",
  "question_issue_history.latest.json",
);
const DEFAULT_PREPARED_QUEUE_PATH = path.join(
  DEFAULT_CREATOR_OUTPUT_ROOT,
  "latest",
  "prepared_question_queue.latest.json",
);

enableStrictNonInteractiveMode("run-question-autopilot-cycle");

function text(value) {
  return value == null ? "" : String(value).trim();
}

function num(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function parseOutputPath(stdout, key) {
  const line = String(stdout || "")
    .split("\n")
    .map((entry) => entry.trim())
    .find((entry) => entry.startsWith(`${key}=`));
  return line ? line.slice(key.length + 1) : "";
}

function printHelp() {
  console.log(`Usage: node scripts/run-question-autopilot-cycle.mjs [options]

Options:
  --prepared-queue <file> Queue JSON from question content creator (default: ${DEFAULT_PREPARED_QUEUE_PATH})
  --issued-history <file> Issued question history JSON (default: ${DEFAULT_ISSUED_HISTORY_PATH})
  --creator-output-root <dir> Content creator output root (default: ${DEFAULT_CREATOR_OUTPUT_ROOT})
  --history <file>       Publish history JSON (default: ${DEFAULT_HISTORY_PATH})
  --output-root <dir>    Output root (default: ${DEFAULT_OUTPUT_ROOT})
  --question-dir <dir>   Question source catalog (default: ${DEFAULT_QUESTION_DIR})
  --recent-limit <n>     Avoid the most recent N published questions when possible (default: 3)
  --keep-temp            Preserve downstream temporary files where supported
  --verify-remote        Pass remote verification to downstream runners where supported
  --skip-publish         Stop after render/finalize, skip YouTube publish
  --help                 Show this help
`);
}

function parseArgs(argv) {
  const args = {
    questionDir: DEFAULT_QUESTION_DIR,
    preparedQueuePath: DEFAULT_PREPARED_QUEUE_PATH,
    issuedHistoryPath: DEFAULT_ISSUED_HISTORY_PATH,
    creatorOutputRoot: DEFAULT_CREATOR_OUTPUT_ROOT,
    historyPath: DEFAULT_HISTORY_PATH,
    outputRoot: DEFAULT_OUTPUT_ROOT,
    recentLimit: 3,
    keepTemp: false,
    verifyRemote: false,
    skipPublish: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === "--question-dir") args.questionDir = path.resolve(argv[++i]);
    else if (token === "--prepared-queue") args.preparedQueuePath = path.resolve(argv[++i]);
    else if (token === "--issued-history") args.issuedHistoryPath = path.resolve(argv[++i]);
    else if (token === "--creator-output-root") args.creatorOutputRoot = path.resolve(argv[++i]);
    else if (token === "--history") args.historyPath = path.resolve(argv[++i]);
    else if (token === "--output-root") args.outputRoot = path.resolve(argv[++i]);
    else if (token === "--recent-limit") args.recentLimit = Math.max(0, Number(argv[++i]) || 3);
    else if (token === "--keep-temp") args.keepTemp = true;
    else if (token === "--verify-remote") args.verifyRemote = true;
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

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const startedAt = new Date().toISOString();
  await bootstrapLocalRuntimeEnv(repoRoot);
  await bootstrapPhotorealRuntimeEnv(repoRoot);
  const creatorOutput = runNodeScript(
    path.join(repoRoot, "scripts", "run-question-content-creator.mjs"),
    [
      "--question-dir", args.questionDir,
      "--output-root", args.creatorOutputRoot,
      "--publish-history", args.historyPath,
      "--issued-history", args.issuedHistoryPath,
      "--recent-limit", String(args.recentLimit),
    ],
  );
  const preparedQueuePath = parseOutputPath(creatorOutput, "latest_prepared_question_queue") || args.preparedQueuePath;
  const preparedQueue = await loadJson(preparedQueuePath, { entries: [] });
  const historyEntries = await loadQuestionAutopilotHistory(args.historyPath);
  const issuedPayload = await loadJson(args.issuedHistoryPath, { history: [] });
  const issuedHistory = Array.isArray(issuedPayload?.history) ? issuedPayload.history : [];
  const consumed = consumePreparedQuestion(preparedQueue);
  const selectedEntry = consumed.selected;
  const selectionMeta = selectedEntry?.selection_meta || {};
  const selected = selectedEntry
    ? {
        source_id: selectedEntry.source_id,
        source_path: selectedEntry.source_path,
        source_label: selectedEntry.source_label,
        payload: selectedEntry.source_payload,
      }
    : null;
  const traceId = `question-autopilot-${Date.now()}-${text(selected?.source_id || "blocked")}`;
  const decision = buildQuestionDecision(selected, selectionMeta, traceId);

  const outputDir = path.join(args.outputRoot, traceId);
  await mkdir(outputDir, { recursive: true });
  const decisionPath = path.join(outputDir, "decision.json");
  await writeJson(decisionPath, decision);

  if (decision.decision_state === "blocked") {
    console.log(`output_dir=${outputDir}`);
    console.log(`decision=${decisionPath}`);
    console.log(`decision_state=blocked`);
    return;
  }

  logAutonomousDecision("question autopilot selected source", {
    source_id: decision.selected_source_id,
    fallback_mode: selectionMeta.fallback_mode || "",
    recent_limit: args.recentLimit,
  });

  const nextIssuedHistory = appendIssuedQuestionHistory(issuedHistory, selectedEntry, {
    issued_at: startedAt,
    trace_id: traceId,
  });
  await writeJson(args.issuedHistoryPath, { history: nextIssuedHistory });

  const dispatchArgs = [
    "--decision", decisionPath,
    "--output-root", outputDir,
    ...(args.verifyRemote ? ["--verify-remote"] : []),
    ...(args.keepTemp ? ["--keep-temp"] : []),
    ...(args.skipPublish ? [] : ["--full-pipeline"]),
  ];

  const dispatchOutput = runNodeScript(
    path.join(repoRoot, "scripts", "run-daily-content-dispatch.mjs"),
    dispatchArgs,
  );

  const dispatchReportPath = parseOutputPath(dispatchOutput, "dispatch_report");
  const dispatchMode = parseOutputPath(dispatchOutput, "dispatch_mode");
  const publishUrlMatch = String(dispatchOutput).match(/youtube_urls=([^\n]+)/);
  const youtubeUrl = publishUrlMatch ? text(publishUrlMatch[1].split(",")[0]) : "";

  if (!args.skipPublish) {
    const nextHistory = appendPublishedQuestionHistory(historyEntries, selected, {
      selected_at: startedAt,
      published_at: new Date().toISOString(),
      trace_id: traceId,
      youtube_url: youtubeUrl,
      package_dir: outputDir,
    });
    await saveQuestionAutopilotHistory(args.historyPath, nextHistory);
  }

  const report = {
    created_at: new Date().toISOString(),
    trace_id: traceId,
    prepared_queue_path: preparedQueuePath,
    history_path: args.historyPath,
    issued_history_path: args.issuedHistoryPath,
    selected_source_id: decision.selected_source_id,
    fallback_mode: selectionMeta.fallback_mode || "",
    recent_limit: args.recentLimit,
    candidate_pool_size: selectionMeta.candidate_pool_size || 0,
    unseen_count: selectionMeta.unseen_count || 0,
    reusable_count: selectionMeta.reusable_count || 0,
    recent_blocked_ids: selectionMeta.recent_blocked_ids || [],
    ranked_source_ids: selectionMeta.ranked_source_ids || [],
    dispatch_mode: dispatchMode,
    dispatch_report_path: dispatchReportPath,
    youtube_url: youtubeUrl,
    skip_publish: args.skipPublish,
  };
  const reportPath = path.join(outputDir, "question_autopilot_report.json");
  await writeJson(reportPath, report);

  console.log(`output_dir=${outputDir}`);
  console.log(`decision=${decisionPath}`);
  console.log(`dispatch_report=${dispatchReportPath}`);
  console.log(`question_autopilot_report=${reportPath}`);
  console.log(`selected_source_id=${decision.selected_source_id}`);
  console.log(`fallback_mode=${selectionMeta.fallback_mode}`);
  console.log(`history_path=${args.historyPath}`);
  if (youtubeUrl) {
    console.log(`youtube_url=${youtubeUrl}`);
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
