#!/usr/bin/env node

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  buildContentPlanMarkdown,
  buildContentPlanQueue,
  buildUnifiedSourcePool,
} from "./runtime/content-plan-queue-engine.mjs";
import { enableStrictNonInteractiveMode, logAutonomousDecision } from "./runtime/non-interactive-mode.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const controlCenterRoot = path.resolve(repoRoot, "..", "adr-control-center");
const DEFAULT_OUTPUT_ROOT = path.join(controlCenterRoot, "runtime", "queues", "content-plan");
const DEFAULT_CONTENT_EXECUTION_PATH = path.join(controlCenterRoot, "runtime", "queues", "content-decision-worker", "latest", "content_execution_queue.latest.json");
const DEFAULT_EXAMPLES_DIR = path.join(repoRoot, "examples");
const DEFAULT_QUESTION_DIR = path.join(DEFAULT_EXAMPLES_DIR, "question-batch-wave-1");
const DEFAULT_NEWS_BATCH_PATH = path.join(DEFAULT_EXAMPLES_DIR, "daily-content-candidates.json");

enableStrictNonInteractiveMode("run-content-plan-queue");

function printHelp() {
  console.log(`Usage: node scripts/run-content-plan-queue.mjs [options]

Options:
  --output-root <dir>          Output root (default: ${DEFAULT_OUTPUT_ROOT})
  --content-execution <file>   Content execution queue JSON (default: ${DEFAULT_CONTENT_EXECUTION_PATH})
  --examples-dir <dir>         Examples dir for WORD sources (default: ${DEFAULT_EXAMPLES_DIR})
  --question-dir <dir>         Question source dir (default: ${DEFAULT_QUESTION_DIR})
  --news-batch <file>          Candidate batch with NEWS items (default: ${DEFAULT_NEWS_BATCH_PATH})
  --rotation-mode <value>      balanced, search_heavy, evergreen_heavy (default: balanced)
  --horizon <n>                Number of queue slots to build (default: 7)
  --slug <value>               Explicit run slug
  --help                       Show this help
`);
}

function parseArgs(argv) {
  const args = {
    outputRoot: DEFAULT_OUTPUT_ROOT,
    contentExecutionPath: DEFAULT_CONTENT_EXECUTION_PATH,
    examplesDir: DEFAULT_EXAMPLES_DIR,
    questionDir: DEFAULT_QUESTION_DIR,
    newsBatchPath: DEFAULT_NEWS_BATCH_PATH,
    rotationMode: "balanced",
    horizon: 7,
    slug: "",
  };

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === "--output-root") args.outputRoot = path.resolve(argv[++i]);
    else if (token === "--content-execution") args.contentExecutionPath = path.resolve(argv[++i]);
    else if (token === "--examples-dir") args.examplesDir = path.resolve(argv[++i]);
    else if (token === "--question-dir") args.questionDir = path.resolve(argv[++i]);
    else if (token === "--news-batch") args.newsBatchPath = path.resolve(argv[++i]);
    else if (token === "--rotation-mode") args.rotationMode = argv[++i];
    else if (token === "--horizon") args.horizon = Number(argv[++i]);
    else if (token === "--slug") args.slug = argv[++i];
    else if (token === "--help" || token === "-h") {
      printHelp();
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${token}`);
    }
  }

  return args;
}

function text(value) {
  return value == null ? "" : String(value).trim();
}

function slugify(value) {
  return text(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

async function writeJson(filePath, payload) {
  await writeFile(filePath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const createdAt = new Date().toISOString();
  const slug = slugify(args.slug || `content-plan-${Date.now()}`) || `content-plan-${Date.now()}`;
  const outputDir = path.join(args.outputRoot, slug);
  const latestDir = path.join(args.outputRoot, "latest");
  await mkdir(outputDir, { recursive: true });
  await mkdir(latestDir, { recursive: true });

  const sourcePool = await buildUnifiedSourcePool({
    contentExecutionPath: args.contentExecutionPath,
    questionDir: args.questionDir,
    examplesDir: args.examplesDir,
    newsCandidateBatchPath: args.newsBatchPath,
  });

  const queuePayload = buildContentPlanQueue(sourcePool.items, {
    rotationMode: args.rotationMode,
    horizon: args.horizon,
  });

  const summary = {
    created_at: createdAt,
    rotation_mode: queuePayload.rotation_mode,
    horizon: queuePayload.horizon,
    total_source_count: sourcePool.items.length,
    source_counts: sourcePool.counts,
    top_entry_id: queuePayload.entries[0]?.queue_entry_id || "",
    top_entry_family: queuePayload.entries[0]?.selected_family || "",
  };

  const sourcePoolPath = path.join(outputDir, "content_source_pool.json");
  const queuePath = path.join(outputDir, "content_plan_queue.json");
  const summaryPath = path.join(outputDir, "content_plan_summary.json");
  const markdownPath = path.join(outputDir, "content_plan_queue.md");
  const latestSourcePoolPath = path.join(latestDir, "content_source_pool.latest.json");
  const latestQueuePath = path.join(latestDir, "content_plan_queue.latest.json");
  const latestSummaryPath = path.join(latestDir, "content_plan_summary.latest.json");
  const latestMarkdownPath = path.join(latestDir, "content_plan_queue.latest.md");

  await writeJson(sourcePoolPath, sourcePool);
  await writeJson(queuePath, queuePayload);
  await writeJson(summaryPath, summary);
  await writeFile(markdownPath, buildContentPlanMarkdown(queuePayload), "utf8");
  await writeJson(latestSourcePoolPath, sourcePool);
  await writeJson(latestQueuePath, queuePayload);
  await writeJson(latestSummaryPath, summary);
  await writeFile(latestMarkdownPath, buildContentPlanMarkdown(queuePayload), "utf8");

  logAutonomousDecision("content plan queue generated", {
    output_dir: outputDir,
    total_source_count: sourcePool.items.length,
    top_entry_id: summary.top_entry_id,
  });

  console.log(`output_dir=${outputDir}`);
  console.log(`content_source_pool=${sourcePoolPath}`);
  console.log(`content_plan_queue=${queuePath}`);
  console.log(`content_plan_summary=${summaryPath}`);
  console.log(`content_plan_markdown=${markdownPath}`);
  console.log(`latest_content_source_pool=${latestSourcePoolPath}`);
  console.log(`latest_content_plan_queue=${latestQueuePath}`);
  console.log(`latest_content_plan_summary=${latestSummaryPath}`);
  console.log(`latest_content_plan_markdown=${latestMarkdownPath}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
