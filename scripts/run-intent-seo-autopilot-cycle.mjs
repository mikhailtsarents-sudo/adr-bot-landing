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
const controlCenterRoot = path.resolve(repoRoot, "..", "adr-control-center");
const DEFAULT_OUTPUT_ROOT = path.join(repoRoot, "intent-seo-autopilot-runs");
const DEFAULT_RULES_PATH = path.join(controlCenterRoot, "runtime", "config", "intent-seo-auto-rules.json");

enableStrictNonInteractiveMode("run-intent-seo-autopilot-cycle");

function printHelp() {
  console.log(`Usage: node scripts/run-intent-seo-autopilot-cycle.mjs [options]

Options:
  --output-root <dir>         Output root (default: ${DEFAULT_OUTPUT_ROOT})
  --slug <value>              Explicit run slug
  --seo-rules <file>          SEO auto-apply rules JSON (default: ${DEFAULT_RULES_PATH})
  --seo-refresh-top <n>       Max SEO refresh tasks to apply (default: 3)
  --seo-create-top <n>        Max SEO create tasks to apply (default: 1)
  --skip-seo-refresh          Do not apply SEO refresh actions
  --skip-seo-create           Do not apply SEO create actions
  --dry-run                   Build the full cycle without mutating SEO pages
  --help                      Show this help

Any unknown options are forwarded to run-intent-to-content-live-cycle.mjs.
`);
}

function parseArgs(argv) {
  const args = {
    outputRoot: DEFAULT_OUTPUT_ROOT,
    slug: "",
    seoRulesPath: DEFAULT_RULES_PATH,
    seoRefreshTop: 3,
    seoCreateTop: 1,
    skipSeoRefresh: false,
    skipSeoCreate: false,
    dryRun: false,
    passthrough: [],
  };

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === "--output-root") args.outputRoot = path.resolve(argv[++i]);
    else if (token === "--slug") args.slug = argv[++i];
    else if (token === "--seo-rules") args.seoRulesPath = path.resolve(argv[++i]);
    else if (token === "--seo-refresh-top") args.seoRefreshTop = Number(argv[++i]);
    else if (token === "--seo-create-top") args.seoCreateTop = Number(argv[++i]);
    else if (token === "--skip-seo-refresh") args.skipSeoRefresh = true;
    else if (token === "--skip-seo-create") args.skipSeoCreate = true;
    else if (token === "--dry-run") args.dryRun = true;
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
  const slug = slugify(args.slug || `intent-seo-autopilot-${Date.now()}`) || `intent-seo-autopilot-${Date.now()}`;
  const outputDir = path.join(args.outputRoot, slug);
  await mkdir(outputDir, { recursive: true });

  const liveCycleOutput = runNodeScript(path.join(repoRoot, "scripts", "run-intent-to-content-live-cycle.mjs"), [
    "--output-root",
    outputDir,
    "--slug",
    "live-cycle",
    "--seo-rules",
    args.seoRulesPath,
    "--seo-refresh-top",
    String(Number.isFinite(args.seoRefreshTop) && args.seoRefreshTop > 0 ? args.seoRefreshTop : 3),
    "--seo-create-top",
    String(Number.isFinite(args.seoCreateTop) && args.seoCreateTop > 0 ? args.seoCreateTop : 1),
    ...(args.skipSeoRefresh ? ["--skip-seo-refresh"] : []),
    ...(args.skipSeoCreate ? ["--skip-seo-create"] : []),
    ...(args.dryRun ? ["--dry-run-seo-actions"] : []),
    ...args.passthrough,
  ]);

  const report = {
    created_at: new Date().toISOString(),
    slug,
    output_dir: outputDir,
    runtime_env_loaded_from: runtimeEnv.loaded_from,
    seo_rules_path: args.seoRulesPath,
    dry_run: args.dryRun,
    skip_seo_refresh: args.skipSeoRefresh,
    skip_seo_create: args.skipSeoCreate,
    snapshot: parseOutputPath(liveCycleOutput, "snapshot"),
    backlog: parseOutputPath(liveCycleOutput, "backlog"),
    handoff_seo_brief_queue: parseOutputPath(liveCycleOutput, "handoff_seo_brief_queue"),
    handoff_content_brief_queue: parseOutputPath(liveCycleOutput, "handoff_content_brief_queue"),
    seo_execution_queue: parseOutputPath(liveCycleOutput, "seo_execution_queue"),
    seo_refresh_report: parseOutputPath(liveCycleOutput, "seo_refresh_report"),
    seo_create_report: parseOutputPath(liveCycleOutput, "seo_create_report"),
    content_execution_queue: parseOutputPath(liveCycleOutput, "content_execution_queue"),
    content_plan_queue: parseOutputPath(liveCycleOutput, "content_plan_queue"),
    content_plan_summary: parseOutputPath(liveCycleOutput, "content_plan_summary"),
    cycle_report: parseOutputPath(liveCycleOutput, "cycle_report"),
  };

  const reportPath = path.join(outputDir, "intent_seo_autopilot_report.json");
  await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

  logAutonomousDecision("intent seo autopilot cycle completed", {
    output_dir: outputDir,
    dry_run: args.dryRun,
    seo_rules_path: args.seoRulesPath,
    content_plan_queue: report.content_plan_queue,
  });

  console.log(`output_dir=${outputDir}`);
  console.log(`intent_seo_autopilot_report=${reportPath}`);
  console.log(`snapshot=${report.snapshot}`);
  console.log(`backlog=${report.backlog}`);
  console.log(`seo_execution_queue=${report.seo_execution_queue}`);
  console.log(`seo_refresh_report=${report.seo_refresh_report}`);
  console.log(`seo_create_report=${report.seo_create_report}`);
  console.log(`content_execution_queue=${report.content_execution_queue}`);
  console.log(`content_plan_queue=${report.content_plan_queue}`);
  console.log(`content_plan_summary=${report.content_plan_summary}`);
  console.log(`cycle_report=${report.cycle_report}`);
  console.log(`dry_run=${args.dryRun}`);
  console.log(`skip_seo_refresh=${args.skipSeoRefresh}`);
  console.log(`skip_seo_create=${args.skipSeoCreate}`);
  console.log(`seo_rules_path=${args.seoRulesPath}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
