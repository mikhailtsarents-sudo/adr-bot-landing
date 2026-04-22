#!/usr/bin/env node

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildContentBriefQueue, buildSeoBriefQueue } from "./runtime/intent-briefing-engine.mjs";
import { enableStrictNonInteractiveMode, logAutonomousDecision } from "./runtime/non-interactive-mode.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const controlCenterRoot = path.resolve(repoRoot, "..", "adr-control-center");
const DEFAULT_OUTPUT_ROOT = path.join(controlCenterRoot, "runtime", "queues", "intent-machine");

enableStrictNonInteractiveMode("run-intent-handoff-queue");

function printHelp() {
  console.log(`Usage: node scripts/run-intent-handoff-queue.mjs --input <intent_backlog.json> [options]

Options:
  --input <file>        Intent backlog JSON
  --output-root <dir>   Output root for handoff queues (default: ${DEFAULT_OUTPUT_ROOT})
  --slug <value>        Explicit output slug
  --help                Show this help
`);
}

function parseArgs(argv) {
  const args = {
    inputPath: "",
    outputRoot: DEFAULT_OUTPUT_ROOT,
    slug: "",
  };

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === "--input") args.inputPath = path.resolve(argv[++i]);
    else if (token === "--output-root") args.outputRoot = path.resolve(argv[++i]);
    else if (token === "--slug") args.slug = argv[++i];
    else if (token === "--help" || token === "-h") {
      printHelp();
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${token}`);
    }
  }

  if (!args.inputPath) {
    throw new Error("Missing --input <intent_backlog.json>.");
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
  const backlog = await loadJson(args.inputPath);
  const createdAt = new Date().toISOString();
  const slug = slugify(args.slug || `intent-handoff-${Date.now()}`) || `intent-handoff-${Date.now()}`;
  const outputDir = path.join(args.outputRoot, slug);
  const latestDir = path.join(args.outputRoot, "latest");
  await mkdir(outputDir, { recursive: true });
  await mkdir(latestDir, { recursive: true });

  const seoBriefQueue = buildSeoBriefQueue(backlog, { createdAt });
  const contentBriefQueue = buildContentBriefQueue(backlog, { createdAt });
  const summary = {
    created_at: createdAt,
    input_path: args.inputPath,
    seo_brief_count: seoBriefQueue.length,
    content_brief_count: contentBriefQueue.length,
    top_seo_brief_id: seoBriefQueue[0]?.brief_id || "",
    top_content_brief_id: contentBriefQueue[0]?.brief_id || "",
  };

  const seoPath = path.join(outputDir, "seo_brief_queue.json");
  const contentPath = path.join(outputDir, "content_brief_queue.json");
  const summaryPath = path.join(outputDir, "intent_handoff_summary.json");
  const latestSeoPath = path.join(latestDir, "seo_brief_queue.latest.json");
  const latestContentPath = path.join(latestDir, "content_brief_queue.latest.json");
  const latestSummaryPath = path.join(latestDir, "intent_handoff_summary.latest.json");

  await writeJson(seoPath, seoBriefQueue);
  await writeJson(contentPath, contentBriefQueue);
  await writeJson(summaryPath, summary);
  await writeJson(latestSeoPath, seoBriefQueue);
  await writeJson(latestContentPath, contentBriefQueue);
  await writeJson(latestSummaryPath, summary);

  logAutonomousDecision("intent handoff queue generated", {
    output_dir: outputDir,
    seo_brief_count: seoBriefQueue.length,
    content_brief_count: contentBriefQueue.length,
  });

  console.log(`output_dir=${outputDir}`);
  console.log(`seo_brief_queue=${seoPath}`);
  console.log(`content_brief_queue=${contentPath}`);
  console.log(`summary=${summaryPath}`);
  console.log(`latest_seo_brief_queue=${latestSeoPath}`);
  console.log(`latest_content_brief_queue=${latestContentPath}`);
  console.log(`latest_summary=${latestSummaryPath}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
