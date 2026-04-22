#!/usr/bin/env node

import { mkdir, writeFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { bootstrapLocalRuntimeEnv } from "./runtime/local-runtime-env.mjs";
import { enableStrictNonInteractiveMode, logAutonomousDecision } from "./runtime/non-interactive-mode.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const DEFAULT_OUTPUT_ROOT = path.join(repoRoot, "intent-live-cycle-runs");

enableStrictNonInteractiveMode("run-intent-to-content-live-cycle");

function printHelp() {
  console.log(`Usage: node scripts/run-intent-to-content-live-cycle.mjs [options]

Options:
  --output-root <dir>         Output root for live cycle runs (default: ${DEFAULT_OUTPUT_ROOT})
  --slug <value>              Explicit run slug
  --analytics-limit <n>       Forwarded to snapshot builder
  --gsc-row-limit <n>         Forwarded to snapshot builder
  --gsc-site-url <value>      Forwarded to snapshot builder
  --gsc-start-date <value>    Forwarded to snapshot builder
  --gsc-end-date <value>      Forwarded to snapshot builder
  --telegram-feedback <file>  Optional local Telegram feedback JSON
  --content-feedback <file>   Optional local content feedback JSON
  --help                      Show this help
`);
}

function parseArgs(argv) {
  const args = {
    outputRoot: DEFAULT_OUTPUT_ROOT,
    slug: "",
    passthrough: [],
  };

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === "--output-root") args.outputRoot = path.resolve(argv[++i]);
    else if (token === "--slug") args.slug = argv[++i];
    else if (token === "--help" || token === "-h") {
      printHelp();
      process.exit(0);
    } else {
      args.passthrough.push(token);
      const next = argv[i + 1];
      if (next && !next.startsWith("--")) {
        args.passthrough.push(next);
        i += 1;
      }
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

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const runtimeEnv = await bootstrapLocalRuntimeEnv(repoRoot);
  const slug = slugify(args.slug || `intent-live-cycle-${Date.now()}`) || `intent-live-cycle-${Date.now()}`;
  const outputDir = path.join(args.outputRoot, slug);
  await mkdir(outputDir, { recursive: true });

  const snapshotOutput = runNodeScript(path.join(repoRoot, "scripts", "run-intent-signal-snapshot.mjs"), [
    "--output-root",
    outputDir,
    "--slug",
    "signals",
    ...args.passthrough,
  ]);

  const snapshotPath = parseOutputPath(snapshotOutput, "snapshot");
  if (!snapshotPath) {
    throw new Error("Snapshot builder did not emit snapshot path.");
  }

  const analysisOutput = runNodeScript(path.join(repoRoot, "scripts", "run-intent-to-content-machine.mjs"), [
    "--input",
    snapshotPath,
    "--output-root",
    outputDir,
    "--slug",
    "analysis",
  ]);

  const backlogPath = parseOutputPath(analysisOutput, "backlog");
  const handoffOutput = backlogPath
    ? runNodeScript(path.join(repoRoot, "scripts", "run-intent-handoff-queue.mjs"), [
      "--input",
      backlogPath,
      "--slug",
      slug,
    ])
    : "";
  const seoWorkerOutput = parseOutputPath(handoffOutput, "latest_seo_brief_queue")
    ? runNodeScript(path.join(repoRoot, "scripts", "run-seo-expansion-worker.mjs"), [
      "--input",
      parseOutputPath(handoffOutput, "latest_seo_brief_queue"),
      "--slug",
      slug,
      "--apply-refresh",
      "--refresh-top",
      "3",
      "--apply-create",
      "--create-top",
      "1",
    ])
    : "";
  const contentWorkerOutput = parseOutputPath(handoffOutput, "latest_content_brief_queue")
    ? runNodeScript(path.join(repoRoot, "scripts", "run-content-decision-worker.mjs"), [
      "--input",
      parseOutputPath(handoffOutput, "latest_content_brief_queue"),
      "--slug",
      slug,
    ])
    : "";
  const contentPlanOutput = parseOutputPath(contentWorkerOutput, "latest_content_execution_queue")
    ? runNodeScript(path.join(repoRoot, "scripts", "run-content-plan-queue.mjs"), [
      "--content-execution",
      parseOutputPath(contentWorkerOutput, "latest_content_execution_queue"),
      "--slug",
      slug,
    ])
    : "";

  const cycleReportPath = path.join(outputDir, "intent_live_cycle_report.json");
  await writeFile(
    cycleReportPath,
    `${JSON.stringify(
      {
        created_at: new Date().toISOString(),
        snapshot_output: snapshotOutput,
        analysis_output: analysisOutput,
        handoff_output: handoffOutput,
        seo_worker_output: seoWorkerOutput,
        snapshot_path: snapshotPath,
        json_report: parseOutputPath(analysisOutput, "json_report"),
        markdown_report: parseOutputPath(analysisOutput, "markdown_report"),
        backlog: backlogPath,
        seo_brief_queue: parseOutputPath(analysisOutput, "seo_brief_queue"),
        content_brief_queue: parseOutputPath(analysisOutput, "content_brief_queue"),
        handoff_seo_brief_queue: parseOutputPath(handoffOutput, "latest_seo_brief_queue"),
        handoff_content_brief_queue: parseOutputPath(handoffOutput, "latest_content_brief_queue"),
        handoff_summary: parseOutputPath(handoffOutput, "latest_summary"),
        seo_execution_queue: parseOutputPath(seoWorkerOutput, "latest_seo_execution_queue"),
        seo_worker_summary: parseOutputPath(seoWorkerOutput, "latest_seo_worker_summary"),
        seo_worker_briefs_dir: parseOutputPath(seoWorkerOutput, "briefs_dir"),
        seo_refresh_report: parseOutputPath(seoWorkerOutput, "seo_refresh_report"),
        seo_create_report: parseOutputPath(seoWorkerOutput, "seo_create_report"),
        content_execution_queue: parseOutputPath(contentWorkerOutput, "latest_content_execution_queue"),
        content_worker_summary: parseOutputPath(contentWorkerOutput, "latest_content_worker_summary"),
        content_worker_briefs_dir: parseOutputPath(contentWorkerOutput, "briefs_dir"),
        content_plan_queue: parseOutputPath(contentPlanOutput, "latest_content_plan_queue"),
        content_plan_summary: parseOutputPath(contentPlanOutput, "latest_content_plan_summary"),
        content_plan_markdown: parseOutputPath(contentPlanOutput, "latest_content_plan_markdown"),
        content_source_pool: parseOutputPath(contentPlanOutput, "latest_content_source_pool"),
        runtime_env_loaded_from: runtimeEnv.loaded_from,
      },
      null,
      2,
    )}\n`,
    "utf8",
  );

  logAutonomousDecision("intent live cycle generated", {
    output_dir: outputDir,
    snapshot_path: snapshotPath,
    runtime_env_loaded_from: runtimeEnv.loaded_from,
  });

  console.log(`output_dir=${outputDir}`);
  console.log(`snapshot=${snapshotPath}`);
  console.log(`json_report=${parseOutputPath(analysisOutput, "json_report")}`);
  console.log(`markdown_report=${parseOutputPath(analysisOutput, "markdown_report")}`);
  console.log(`backlog=${backlogPath}`);
  console.log(`seo_brief_queue=${parseOutputPath(analysisOutput, "seo_brief_queue")}`);
  console.log(`content_brief_queue=${parseOutputPath(analysisOutput, "content_brief_queue")}`);
  console.log(`handoff_seo_brief_queue=${parseOutputPath(handoffOutput, "latest_seo_brief_queue")}`);
  console.log(`handoff_content_brief_queue=${parseOutputPath(handoffOutput, "latest_content_brief_queue")}`);
  console.log(`handoff_summary=${parseOutputPath(handoffOutput, "latest_summary")}`);
  console.log(`seo_execution_queue=${parseOutputPath(seoWorkerOutput, "latest_seo_execution_queue")}`);
  console.log(`seo_worker_summary=${parseOutputPath(seoWorkerOutput, "latest_seo_worker_summary")}`);
  console.log(`seo_worker_briefs_dir=${parseOutputPath(seoWorkerOutput, "briefs_dir")}`);
  console.log(`seo_refresh_report=${parseOutputPath(seoWorkerOutput, "seo_refresh_report")}`);
  console.log(`seo_create_report=${parseOutputPath(seoWorkerOutput, "seo_create_report")}`);
  console.log(`content_execution_queue=${parseOutputPath(contentWorkerOutput, "latest_content_execution_queue")}`);
  console.log(`content_worker_summary=${parseOutputPath(contentWorkerOutput, "latest_content_worker_summary")}`);
  console.log(`content_worker_briefs_dir=${parseOutputPath(contentWorkerOutput, "briefs_dir")}`);
  console.log(`content_plan_queue=${parseOutputPath(contentPlanOutput, "latest_content_plan_queue")}`);
  console.log(`content_plan_summary=${parseOutputPath(contentPlanOutput, "latest_content_plan_summary")}`);
  console.log(`content_plan_markdown=${parseOutputPath(contentPlanOutput, "latest_content_plan_markdown")}`);
  console.log(`content_source_pool=${parseOutputPath(contentPlanOutput, "latest_content_source_pool")}`);
  console.log(`cycle_report=${cycleReportPath}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
