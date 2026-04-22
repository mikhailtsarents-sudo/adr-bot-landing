#!/usr/bin/env node

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildContentExecutionQueue, buildContentMarkdownBrief } from "./runtime/content-worker-engine.mjs";
import { enableStrictNonInteractiveMode, logAutonomousDecision } from "./runtime/non-interactive-mode.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const controlCenterRoot = path.resolve(repoRoot, "..", "adr-control-center");
const DEFAULT_INPUT_PATH = path.join(controlCenterRoot, "runtime", "queues", "intent-machine", "latest", "content_brief_queue.latest.json");
const DEFAULT_OUTPUT_ROOT = path.join(controlCenterRoot, "runtime", "queues", "content-decision-worker");

enableStrictNonInteractiveMode("run-content-decision-worker");

function printHelp() {
  console.log(`Usage: node scripts/run-content-decision-worker.mjs [options]

Options:
  --input <file>        Content brief queue JSON (default: ${DEFAULT_INPUT_PATH})
  --output-root <dir>   Output root for content worker artifacts (default: ${DEFAULT_OUTPUT_ROOT})
  --slug <value>        Explicit run slug
  --top <n>             Limit how many top tasks to process
  --help                Show this help
`);
}

function parseArgs(argv) {
  const args = {
    inputPath: DEFAULT_INPUT_PATH,
    outputRoot: DEFAULT_OUTPUT_ROOT,
    slug: "",
    top: 0,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === "--input") args.inputPath = path.resolve(argv[++i]);
    else if (token === "--output-root") args.outputRoot = path.resolve(argv[++i]);
    else if (token === "--slug") args.slug = argv[++i];
    else if (token === "--top") args.top = Number(argv[++i]);
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

async function loadJson(filePath) {
  return JSON.parse(await readFile(filePath, "utf8"));
}

async function writeJson(filePath, payload) {
  await writeFile(filePath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const queue = await loadJson(args.inputPath);
  const selectedQueue = Number.isFinite(args.top) && args.top > 0 ? queue.slice(0, args.top) : queue;
  const createdAt = new Date().toISOString();
  const slug = slugify(args.slug || `content-decision-worker-${Date.now()}`) || `content-decision-worker-${Date.now()}`;
  const outputDir = path.join(args.outputRoot, slug);
  const latestDir = path.join(args.outputRoot, "latest");
  const briefsDir = path.join(outputDir, "briefs");

  await mkdir(outputDir, { recursive: true });
  await mkdir(latestDir, { recursive: true });
  await mkdir(briefsDir, { recursive: true });

  const executionQueue = buildContentExecutionQueue(selectedQueue, {
    createdAt,
  });

  for (const task of executionQueue) {
    const safeName = slugify(task.intent_key || task.task_id) || task.task_id;
    await writeFile(path.join(briefsDir, `${safeName}.md`), buildContentMarkdownBrief(task), "utf8");
  }

  const summary = {
    created_at: createdAt,
    input_path: args.inputPath,
    task_count: executionQueue.length,
    telegram_task_count: executionQueue.filter((task) => task.primary_channel === "telegram").length,
    top_task_id: executionQueue[0]?.task_id || "",
  };

  const queuePath = path.join(outputDir, "content_execution_queue.json");
  const summaryPath = path.join(outputDir, "content_worker_summary.json");
  const latestQueuePath = path.join(latestDir, "content_execution_queue.latest.json");
  const latestSummaryPath = path.join(latestDir, "content_worker_summary.latest.json");

  await writeJson(queuePath, executionQueue);
  await writeJson(summaryPath, summary);
  await writeJson(latestQueuePath, executionQueue);
  await writeJson(latestSummaryPath, summary);

  logAutonomousDecision("content decision worker queue generated", {
    output_dir: outputDir,
    task_count: executionQueue.length,
    top_task_id: summary.top_task_id,
  });

  console.log(`output_dir=${outputDir}`);
  console.log(`content_execution_queue=${queuePath}`);
  console.log(`content_worker_summary=${summaryPath}`);
  console.log(`latest_content_execution_queue=${latestQueuePath}`);
  console.log(`latest_content_worker_summary=${latestSummaryPath}`);
  console.log(`briefs_dir=${briefsDir}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
