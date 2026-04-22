#!/usr/bin/env node

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { pickContentPlanEntries } from "./runtime/content-plan-picker-engine.mjs";
import { enableStrictNonInteractiveMode, logAutonomousDecision } from "./runtime/non-interactive-mode.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const controlCenterRoot = path.resolve(repoRoot, "..", "adr-control-center");
const DEFAULT_INPUT_PATH = path.join(controlCenterRoot, "runtime", "queues", "content-plan", "latest", "content_plan_queue.latest.json");
const DEFAULT_OUTPUT_ROOT = path.join(controlCenterRoot, "runtime", "queues", "content-plan-picker");

enableStrictNonInteractiveMode("run-content-plan-picker");

function printHelp() {
  console.log(`Usage: node scripts/run-content-plan-picker.mjs [options]

Options:
  --input <file>        Content plan queue JSON (default: ${DEFAULT_INPUT_PATH})
  --output-root <dir>   Output root (default: ${DEFAULT_OUTPUT_ROOT})
  --slug <value>        Explicit run slug
  --help                Show this help
`);
}

function parseArgs(argv) {
  const args = {
    inputPath: DEFAULT_INPUT_PATH,
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
  const planPayload = await loadJson(args.inputPath);
  const picked = pickContentPlanEntries(planPayload);
  const createdAt = new Date().toISOString();
  const slug = slugify(args.slug || `content-plan-picker-${Date.now()}`) || `content-plan-picker-${Date.now()}`;
  const outputDir = path.join(args.outputRoot, slug);
  const latestDir = path.join(args.outputRoot, "latest");
  await mkdir(outputDir, { recursive: true });
  await mkdir(latestDir, { recursive: true });

  const planningPath = path.join(outputDir, "planning_selection.json");
  const productionPath = path.join(outputDir, "production_selection.json");
  const batchPath = path.join(outputDir, "production_candidate_batch.json");
  const summaryPath = path.join(outputDir, "content_plan_picker_summary.json");
  const latestPlanningPath = path.join(latestDir, "planning_selection.latest.json");
  const latestProductionPath = path.join(latestDir, "production_selection.latest.json");
  const latestBatchPath = path.join(latestDir, "production_candidate_batch.latest.json");
  const latestSummaryPath = path.join(latestDir, "content_plan_picker_summary.latest.json");

  const productionBatch = { candidates: picked.production_candidates };
  const summary = {
    created_at: createdAt,
    input_path: args.inputPath,
    planning_entry_id: picked.planning_entry?.queue_entry_id || "",
    planning_family: picked.planning_entry?.selected_family || "",
    production_entry_id: picked.production_entry?.queue_entry_id || "",
    production_family: picked.production_entry?.selected_family || "",
    production_candidate_count: picked.production_candidates.length,
  };

  await writeJson(planningPath, picked.planning_entry || {});
  await writeJson(productionPath, picked.production_entry || {});
  await writeJson(batchPath, productionBatch);
  await writeJson(summaryPath, summary);
  await writeJson(latestPlanningPath, picked.planning_entry || {});
  await writeJson(latestProductionPath, picked.production_entry || {});
  await writeJson(latestBatchPath, productionBatch);
  await writeJson(latestSummaryPath, summary);

  logAutonomousDecision("content plan picker generated", {
    output_dir: outputDir,
    planning_entry_id: summary.planning_entry_id,
    production_entry_id: summary.production_entry_id,
    production_candidate_count: summary.production_candidate_count,
  });

  console.log(`output_dir=${outputDir}`);
  console.log(`planning_selection=${planningPath}`);
  console.log(`production_selection=${productionPath}`);
  console.log(`production_candidate_batch=${batchPath}`);
  console.log(`summary=${summaryPath}`);
  console.log(`latest_planning_selection=${latestPlanningPath}`);
  console.log(`latest_production_selection=${latestProductionPath}`);
  console.log(`latest_production_candidate_batch=${latestBatchPath}`);
  console.log(`latest_summary=${latestSummaryPath}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
