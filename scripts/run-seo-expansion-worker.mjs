#!/usr/bin/env node

import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildSeoExecutionQueue, buildSeoMarkdownBrief } from "./runtime/seo-worker-engine.mjs";
import { enableStrictNonInteractiveMode, logAutonomousDecision } from "./runtime/non-interactive-mode.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const controlCenterRoot = path.resolve(repoRoot, "..", "adr-control-center");
const DEFAULT_INPUT_PATH = path.join(controlCenterRoot, "runtime", "queues", "intent-machine", "latest", "seo_brief_queue.latest.json");
const DEFAULT_OUTPUT_ROOT = path.join(controlCenterRoot, "runtime", "queues", "seo-expansion-worker");
const DEFAULT_AUTO_RULES_PATH = path.join(controlCenterRoot, "runtime", "config", "intent-seo-auto-rules.json");
const APP_DIR = path.join(repoRoot, "src", "app");

enableStrictNonInteractiveMode("run-seo-expansion-worker");

function printHelp() {
  console.log(`Usage: node scripts/run-seo-expansion-worker.mjs [options]

Options:
  --input <file>        SEO brief queue JSON (default: ${DEFAULT_INPUT_PATH})
  --output-root <dir>   Output root for SEO worker artifacts (default: ${DEFAULT_OUTPUT_ROOT})
  --slug <value>        Explicit run slug
  --top <n>             Limit how many top tasks to process
  --apply-refresh       Apply refreshes to existing SEO pages after queue generation
  --refresh-top <n>     Limit how many existing pages to refresh (default: 3)
  --apply-create        Apply creation for new SEO pages after queue generation
  --create-top <n>      Limit how many new pages to create (default: 1)
  --auto-rules <file>   JSON config with auto-apply thresholds (default: ${DEFAULT_AUTO_RULES_PATH})
  --dry-run-actions     Build reports but do not write refresh/create changes
  --help                Show this help
`);
}

function parseArgs(argv) {
  const args = {
    inputPath: DEFAULT_INPUT_PATH,
    outputRoot: DEFAULT_OUTPUT_ROOT,
    slug: "",
    top: 0,
    applyRefresh: false,
    refreshTop: 3,
    applyCreate: false,
    createTop: 1,
    autoRulesPath: DEFAULT_AUTO_RULES_PATH,
    dryRunActions: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === "--input") args.inputPath = path.resolve(argv[++i]);
    else if (token === "--output-root") args.outputRoot = path.resolve(argv[++i]);
    else if (token === "--slug") args.slug = argv[++i];
    else if (token === "--top") args.top = Number(argv[++i]);
    else if (token === "--apply-refresh") args.applyRefresh = true;
    else if (token === "--refresh-top") args.refreshTop = Number(argv[++i]);
    else if (token === "--apply-create") args.applyCreate = true;
    else if (token === "--create-top") args.createTop = Number(argv[++i]);
    else if (token === "--auto-rules") args.autoRulesPath = path.resolve(argv[++i]);
    else if (token === "--dry-run-actions") args.dryRunActions = true;
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
  });

  if (result.status !== 0) {
    throw new Error(
      [
        `Script failed: ${path.basename(scriptPath)}`,
        result.stdout?.trim() ? `stdout:\n${result.stdout.trim()}` : null,
        result.stderr?.trim() ? `stderr:\n${result.stderr.trim()}` : null,
      ]
        .filter(Boolean)
        .join("\n"),
    );
  }

  return result.stdout.trim();
}

function parseOutputPath(stdout, key) {
  const line = stdout
    .split("\n")
    .map((entry) => entry.trim())
    .find((entry) => entry.startsWith(`${key}=`));
  return line ? line.slice(key.length + 1) : "";
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

async function loadOptionalJson(filePath, fallback) {
  try {
    return JSON.parse(await readFile(filePath, "utf8"));
  } catch {
    return fallback;
  }
}

async function writeJson(filePath, payload) {
  await writeFile(filePath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}

async function detectExistingSlugs() {
  const entries = await readdir(APP_DIR, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .filter((name) => !name.startsWith("(") && !name.startsWith("@") && !name.startsWith("_") && name !== "ru");
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const queue = await loadJson(args.inputPath);
  const existingSlugs = await detectExistingSlugs();
  const autoRules = await loadOptionalJson(args.autoRulesPath, {});
  const selectedQueue = Number.isFinite(args.top) && args.top > 0 ? queue.slice(0, args.top) : queue;
  const createdAt = new Date().toISOString();
  const slug = slugify(args.slug || `seo-expansion-worker-${Date.now()}`) || `seo-expansion-worker-${Date.now()}`;
  const outputDir = path.join(args.outputRoot, slug);
  const latestDir = path.join(args.outputRoot, "latest");
  const briefsDir = path.join(outputDir, "briefs");

  await mkdir(outputDir, { recursive: true });
  await mkdir(latestDir, { recursive: true });
  await mkdir(briefsDir, { recursive: true });

  const executionQueue = buildSeoExecutionQueue(selectedQueue, {
    existingSlugs,
    createdAt,
    autoRules,
  });

  for (const task of executionQueue) {
    const safeName = slugify(task.recommended_slug || task.intent_key || task.task_id) || task.task_id;
    await writeFile(path.join(briefsDir, `${safeName}.md`), buildSeoMarkdownBrief(task), "utf8");
  }

  const summary = {
    created_at: createdAt,
    input_path: args.inputPath,
    auto_rules_path: args.autoRulesPath,
    task_count: executionQueue.length,
    existing_page_count: executionQueue.filter((task) => task.page_exists).length,
    new_page_count: executionQueue.filter((task) => !task.page_exists).length,
    auto_apply_eligible_count: executionQueue.filter((task) => task.auto_apply_eligible).length,
    top_task_id: executionQueue[0]?.task_id || "",
  };

  const queuePath = path.join(outputDir, "seo_execution_queue.json");
  const summaryPath = path.join(outputDir, "seo_worker_summary.json");
  const latestQueuePath = path.join(latestDir, "seo_execution_queue.latest.json");
  const latestSummaryPath = path.join(latestDir, "seo_worker_summary.latest.json");

  await writeJson(queuePath, executionQueue);
  await writeJson(summaryPath, summary);
  await writeJson(latestQueuePath, executionQueue);
  await writeJson(latestSummaryPath, summary);

  let refreshOutput = "";
  if (args.applyRefresh) {
    const refreshArgs = [
      "--input",
      latestQueuePath,
      "--slug",
      slug,
      "--top",
      String(Number.isFinite(args.refreshTop) && args.refreshTop > 0 ? args.refreshTop : 3),
      "--only-auto-eligible",
    ];
    if (args.dryRunActions) {
      refreshArgs.push("--dry-run");
    }
    refreshOutput = runNodeScript(path.join(repoRoot, "scripts", "run-seo-page-refresh.mjs"), refreshArgs);
  }
  let createOutput = "";
  if (args.applyCreate) {
    const createArgs = [
      "--input",
      latestQueuePath,
      "--slug",
      slug,
      "--top",
      String(Number.isFinite(args.createTop) && args.createTop > 0 ? args.createTop : 1),
      "--only-auto-eligible",
    ];
    if (args.dryRunActions) {
      createArgs.push("--dry-run");
    }
    createOutput = runNodeScript(path.join(repoRoot, "scripts", "run-seo-page-create.mjs"), createArgs);
  }

  logAutonomousDecision("seo expansion worker queue generated", {
    output_dir: outputDir,
    task_count: executionQueue.length,
    top_task_id: summary.top_task_id,
  });

  console.log(`output_dir=${outputDir}`);
  console.log(`seo_execution_queue=${queuePath}`);
  console.log(`seo_worker_summary=${summaryPath}`);
  console.log(`latest_seo_execution_queue=${latestQueuePath}`);
  console.log(`latest_seo_worker_summary=${latestSummaryPath}`);
  console.log(`briefs_dir=${briefsDir}`);
  console.log(`seo_refresh_report=${parseOutputPath(refreshOutput, "latest_seo_refresh_report")}`);
  console.log(`seo_create_report=${parseOutputPath(createOutput, "latest_seo_create_report")}`);
  console.log(`auto_rules_path=${args.autoRulesPath}`);
  console.log(`dry_run_actions=${args.dryRunActions}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
