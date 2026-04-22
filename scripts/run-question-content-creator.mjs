#!/usr/bin/env node

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildPreparedQuestionQueue } from "./runtime/question-content-creator-engine.mjs";
import { loadQuestionAutopilotHistory } from "./runtime/question-autopilot-engine.mjs";
import { enableStrictNonInteractiveMode, logAutonomousDecision } from "./runtime/non-interactive-mode.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const controlCenterRoot = path.resolve(repoRoot, "..", "adr-control-center");
const DEFAULT_QUESTION_DIR = path.join(repoRoot, "examples", "question-batch-wave-1");
const DEFAULT_OUTPUT_ROOT = path.join(controlCenterRoot, "runtime", "queues", "question-content-creator");
const DEFAULT_PUBLISH_HISTORY_PATH = path.join(
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

enableStrictNonInteractiveMode("run-question-content-creator");

function text(value) {
  return value == null ? "" : String(value).trim();
}

async function loadJson(filePath, fallback) {
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

function printHelp() {
  console.log(`Usage: node scripts/run-question-content-creator.mjs [options]

Options:
  --question-dir <dir>       Question source catalog
  --output-root <dir>        Queue output root
  --publish-history <file>   Successful publish history JSON
  --issued-history <file>    Already-issued question history JSON
  --horizon <n>              Number of prepared questions to keep ready (default: 5)
  --recent-limit <n>         Avoid the most recent N issued/published questions when possible (default: 3)
  --help                     Show this help
`);
}

function parseArgs(argv) {
  const args = {
    questionDir: DEFAULT_QUESTION_DIR,
    outputRoot: DEFAULT_OUTPUT_ROOT,
    publishHistoryPath: DEFAULT_PUBLISH_HISTORY_PATH,
    issuedHistoryPath: DEFAULT_ISSUED_HISTORY_PATH,
    horizon: 5,
    recentLimit: 3,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === "--question-dir") args.questionDir = path.resolve(argv[++i]);
    else if (token === "--output-root") args.outputRoot = path.resolve(argv[++i]);
    else if (token === "--publish-history") args.publishHistoryPath = path.resolve(argv[++i]);
    else if (token === "--issued-history") args.issuedHistoryPath = path.resolve(argv[++i]);
    else if (token === "--horizon") args.horizon = Math.max(1, Number(argv[++i]) || 5);
    else if (token === "--recent-limit") args.recentLimit = Math.max(0, Number(argv[++i]) || 3);
    else if (token === "--help" || token === "-h") {
      printHelp();
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${token}`);
    }
  }

  return args;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const publishedPayload = await loadQuestionAutopilotHistory(args.publishHistoryPath);
  const issuedPayload = await loadJson(args.issuedHistoryPath, { history: [] });
  const issuedHistory = Array.isArray(issuedPayload?.history) ? issuedPayload.history : [];

  const queueResult = await buildPreparedQuestionQueue(args.questionDir, {
    horizon: args.horizon,
    recentLimit: args.recentLimit,
    publishedHistory: publishedPayload,
    issuedHistory,
  });

  const createdAt = new Date().toISOString();
  const slug = `question-content-creator-${Date.now()}`;
  const outputDir = path.join(args.outputRoot, slug);
  const latestDir = path.join(args.outputRoot, "latest");
  await mkdir(outputDir, { recursive: true });
  await mkdir(latestDir, { recursive: true });

  const entriesPayload = {
    created_at: createdAt,
    question_dir: args.questionDir,
    entries: queueResult.queue,
  };
  const summary = {
    created_at: createdAt,
    prepared_count: queueResult.prepared_count,
    catalog_size: queueResult.catalog_size,
    recent_limit: queueResult.recent_limit,
    horizon: queueResult.horizon,
    issued_count: queueResult.issued_count,
    published_count: queueResult.published_count,
    next_source_id: text(queueResult.queue[0]?.source_id),
  };

  const queuePath = path.join(outputDir, "prepared_question_queue.json");
  const summaryPath = path.join(outputDir, "question_content_creator_summary.json");
  const latestQueuePath = path.join(latestDir, "prepared_question_queue.latest.json");
  const latestSummaryPath = path.join(latestDir, "question_content_creator_summary.latest.json");

  await writeJson(queuePath, entriesPayload);
  await writeJson(summaryPath, summary);
  await writeJson(latestQueuePath, entriesPayload);
  await writeJson(latestSummaryPath, summary);

  logAutonomousDecision("question content creator refreshed queue", {
    prepared_count: summary.prepared_count,
    next_source_id: summary.next_source_id,
    recent_limit: summary.recent_limit,
  });

  console.log(`output_dir=${outputDir}`);
  console.log(`prepared_question_queue=${queuePath}`);
  console.log(`summary=${summaryPath}`);
  console.log(`latest_prepared_question_queue=${latestQueuePath}`);
  console.log(`latest_summary=${latestSummaryPath}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
