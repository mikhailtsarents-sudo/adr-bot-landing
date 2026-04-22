#!/usr/bin/env node

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { bootstrapLocalRuntimeEnv } from "./runtime/local-runtime-env.mjs";
import { enableStrictNonInteractiveMode, logAutonomousDecision } from "./runtime/non-interactive-mode.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const DEFAULT_OUTPUT_ROOT = path.join(repoRoot, "daily-live-runs");
const DEFAULT_CONTENT_PLAN_PATH = path.join(repoRoot, "..", "adr-control-center", "runtime", "queues", "content-plan", "latest", "content_plan_queue.latest.json");
enableStrictNonInteractiveMode("run-daily-live-wrapper");

function printHelp() {
  console.log(`Usage: node scripts/run-daily-live-wrapper.mjs --input <batch.json> [options]

Options:
  --input <file>        Candidate batch JSON for chooser
  --use-content-plan    Use the latest unified content plan queue instead of a manual batch input
  --content-plan <file> Explicit content plan queue JSON
  --output-root <dir>   Root directory for live wrapper outputs (default: ${DEFAULT_OUTPUT_ROOT})
  --date <yyyy-mm-dd>   Decision date override
  --skip-dispatch       Stop after chooser/decision without starting render dispatch
  --intent-mode <mode>  auto, off, or required (default: auto)
  --intent-analytics-limit <n>      Forwarded to intent snapshot builder
  --intent-gsc-row-limit <n>        Forwarded to intent snapshot builder
  --intent-gsc-site-url <value>     Forwarded to intent snapshot builder
  --intent-gsc-start-date <value>   Forwarded to intent snapshot builder
  --intent-gsc-end-date <value>     Forwarded to intent snapshot builder
  --intent-telegram-feedback <file> Optional local Telegram feedback JSON
  --intent-content-feedback <file>  Optional local content feedback JSON
  --verify-remote       Pass remote verification to downstream runners where supported
  --keep-temp           Preserve downstream temporary files where supported
  --force               Ignore existing day lock and run again
  --help                Show this help
`);
}

function parseArgs(argv) {
  const args = {
    inputPath: "",
    useContentPlan: false,
    contentPlanPath: DEFAULT_CONTENT_PLAN_PATH,
    outputRoot: DEFAULT_OUTPUT_ROOT,
    decisionDate: "",
    skipDispatch: false,
    intentMode: "auto",
    intentAnalyticsLimit: "",
    intentGscRowLimit: "",
    intentGscSiteUrl: "",
    intentGscStartDate: "",
    intentGscEndDate: "",
    intentTelegramFeedbackPath: "",
    intentContentFeedbackPath: "",
    verifyRemote: false,
    keepTemp: false,
    force: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === "--input") args.inputPath = path.resolve(argv[++i]);
    else if (token === "--use-content-plan") args.useContentPlan = true;
    else if (token === "--content-plan") args.contentPlanPath = path.resolve(argv[++i]);
    else if (token === "--output-root") args.outputRoot = path.resolve(argv[++i]);
    else if (token === "--date") args.decisionDate = argv[++i];
    else if (token === "--skip-dispatch") args.skipDispatch = true;
    else if (token === "--intent-mode") args.intentMode = text(argv[++i]).toLowerCase() || "auto";
    else if (token === "--intent-analytics-limit") args.intentAnalyticsLimit = argv[++i];
    else if (token === "--intent-gsc-row-limit") args.intentGscRowLimit = argv[++i];
    else if (token === "--intent-gsc-site-url") args.intentGscSiteUrl = argv[++i];
    else if (token === "--intent-gsc-start-date") args.intentGscStartDate = argv[++i];
    else if (token === "--intent-gsc-end-date") args.intentGscEndDate = argv[++i];
    else if (token === "--intent-telegram-feedback") args.intentTelegramFeedbackPath = path.resolve(argv[++i]);
    else if (token === "--intent-content-feedback") args.intentContentFeedbackPath = path.resolve(argv[++i]);
    else if (token === "--verify-remote") args.verifyRemote = true;
    else if (token === "--keep-temp") args.keepTemp = true;
    else if (token === "--force") args.force = true;
    else if (token === "--help" || token === "-h") {
      printHelp();
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${token}`);
    }
  }

  if (!args.inputPath && !args.useContentPlan) {
    throw new Error("Missing --input <batch.json> or enable --use-content-plan.");
  }
  if (!["auto", "off", "required"].includes(args.intentMode)) {
    throw new Error("Unsupported --intent-mode. Use auto, off, or required.");
  }

  return args;
}

function text(value) {
  return value == null ? "" : String(value).trim();
}

async function loadJson(filePath) {
  return JSON.parse(await readFile(filePath, "utf8"));
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

function parseOutputValue(stdout, key) {
  const line = stdout
    .split("\n")
    .map((entry) => entry.trim())
    .find((entry) => entry.startsWith(`${key}=`));
  return line ? line.slice(key.length + 1) : "";
}

async function ensureDir(dirPath) {
  await mkdir(dirPath, { recursive: true });
}

async function writeJson(filePath, payload) {
  await writeFile(filePath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}

function parseOptionalPath(stdout, key) {
  return parseOutputValue(stdout, key) || "";
}

function buildIntentArgs(args, outputDir) {
  const intentArgs = [
    "--output-root",
    path.join(outputDir, "intent"),
    "--slug",
    "daily-intent",
  ];

  if (text(args.intentAnalyticsLimit)) intentArgs.push("--analytics-limit", args.intentAnalyticsLimit);
  if (text(args.intentGscRowLimit)) intentArgs.push("--gsc-row-limit", args.intentGscRowLimit);
  if (text(args.intentGscSiteUrl)) intentArgs.push("--gsc-site-url", args.intentGscSiteUrl);
  if (text(args.intentGscStartDate)) intentArgs.push("--gsc-start-date", args.intentGscStartDate);
  if (text(args.intentGscEndDate)) intentArgs.push("--gsc-end-date", args.intentGscEndDate);
  if (text(args.intentTelegramFeedbackPath)) intentArgs.push("--telegram-feedback", args.intentTelegramFeedbackPath);
  if (text(args.intentContentFeedbackPath)) intentArgs.push("--content-feedback", args.intentContentFeedbackPath);

  return intentArgs;
}

function maybeRunIntentCycle(args, outputDir) {
  if (args.intentMode === "off") {
    return {
      status: "skipped",
      mode: args.intentMode,
      reason: "intent_mode_off",
    };
  }

  try {
    const intentOutput = runNodeScript(path.join(repoRoot, "scripts", "run-intent-to-content-live-cycle.mjs"), buildIntentArgs(args, outputDir));
    return {
      status: "completed",
      mode: args.intentMode,
      output_dir: parseOptionalPath(intentOutput, "output_dir"),
      snapshot: parseOptionalPath(intentOutput, "snapshot"),
      json_report: parseOptionalPath(intentOutput, "json_report"),
      markdown_report: parseOptionalPath(intentOutput, "markdown_report"),
      backlog: parseOptionalPath(intentOutput, "backlog"),
      seo_brief_queue: parseOptionalPath(intentOutput, "seo_brief_queue"),
      content_brief_queue: parseOptionalPath(intentOutput, "content_brief_queue"),
      seo_execution_queue: parseOptionalPath(intentOutput, "seo_execution_queue"),
      seo_worker_summary: parseOptionalPath(intentOutput, "seo_worker_summary"),
      content_execution_queue: parseOptionalPath(intentOutput, "content_execution_queue"),
      content_worker_summary: parseOptionalPath(intentOutput, "content_worker_summary"),
      content_plan_queue: parseOptionalPath(intentOutput, "content_plan_queue"),
      content_plan_summary: parseOptionalPath(intentOutput, "content_plan_summary"),
      content_plan_markdown: parseOptionalPath(intentOutput, "content_plan_markdown"),
      cycle_report: parseOptionalPath(intentOutput, "cycle_report"),
    };
  } catch (error) {
    if (args.intentMode === "required") {
      throw error;
    }
    return {
      status: "failed",
      mode: args.intentMode,
      error: error.message,
    };
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const runtimeEnv = await bootstrapLocalRuntimeEnv(repoRoot);
  logAutonomousDecision("selected daily live wrapper input", {
    input_path: args.inputPath,
    content_plan_path: args.contentPlanPath,
    use_content_plan: args.useContentPlan,
    force: args.force,
    intent_mode: args.intentMode,
  });
  const decisionDate = args.decisionDate || new Date().toISOString().slice(0, 10);
  const outputDir = path.join(args.outputRoot, decisionDate);
  const lockDir = path.join(args.outputRoot, "day-locks");
  const lockPath = path.join(lockDir, `${decisionDate}.json`);
  const reportPath = path.join(outputDir, "daily_live_wrapper_report.json");

  await ensureDir(outputDir);
  await ensureDir(lockDir);

  let existingLock = null;
  try {
    existingLock = await loadJson(lockPath);
  } catch {
    existingLock = null;
  }

  if (!args.force && existingLock?.status === "completed") {
    throw new Error(
      `Day lock already completed for ${decisionDate}. Existing cycle_report: ${text(existingLock.cycle_report) || "n/a"}`,
    );
  }

  if (!args.force && existingLock?.status === "running") {
    throw new Error(`Day lock is already running for ${decisionDate}. Use --force only if you intentionally want to override it.`);
  }

  const startedAt = new Date().toISOString();
  await writeJson(lockPath, {
    decision_date: decisionDate,
    status: "running",
    started_at: startedAt,
    input_path: args.inputPath,
    intent_mode: args.intentMode,
    verify_remote: args.verifyRemote,
    keep_temp: args.keepTemp,
    skip_dispatch: args.skipDispatch,
    force: args.force,
  });

  let intentRun = {
    status: args.intentMode === "off" ? "skipped" : "pending",
    mode: args.intentMode,
  };

  try {
    intentRun = maybeRunIntentCycle(args, outputDir);
    const cycleOutput = runNodeScript(path.join(repoRoot, "scripts", "run-daily-content-cycle.mjs"), [
      ...(args.useContentPlan ? ["--content-plan", args.contentPlanPath] : ["--input", args.inputPath]),
      "--output-root",
      outputDir,
      "--date",
      decisionDate,
      ...(args.skipDispatch ? ["--skip-dispatch"] : []),
      ...(args.verifyRemote ? ["--verify-remote"] : []),
      ...(args.keepTemp ? ["--keep-temp"] : []),
    ]);

    const cycleReport = parseOutputValue(cycleOutput, "cycle_report");
    const cycleRunDir = parseOutputValue(cycleOutput, "output_dir");
    const decisionPath = parseOutputValue(cycleOutput, "decision");
    const dispatchReport = parseOutputValue(cycleOutput, "dispatch_report");
    const dispatchMode = parseOutputValue(cycleOutput, "dispatch_mode");
    const decision = decisionPath ? await loadJson(decisionPath) : null;

    const wrapperReport = {
      decision_date: decisionDate,
      status: "completed",
      started_at: startedAt,
      completed_at: new Date().toISOString(),
      input_path: args.inputPath,
      content_plan_path: args.contentPlanPath,
      use_content_plan: args.useContentPlan,
      cycle_run_dir: cycleRunDir,
      cycle_report: cycleReport,
      decision_path: decisionPath,
      dispatch_report: dispatchReport,
      dispatch_mode: dispatchMode,
      selected_source_type: decision?.selected_source_type || "",
      selected_source_id: decision?.selected_source_id || "",
      decision_state: decision?.decision_state || "",
      trace_id: decision?.trace_id || "",
      intent_mode: args.intentMode,
      intent_status: intentRun.status,
      intent_cycle_report: intentRun.cycle_report || "",
      intent_backlog: intentRun.backlog || "",
      intent_seo_brief_queue: intentRun.seo_brief_queue || "",
      intent_content_brief_queue: intentRun.content_brief_queue || "",
      seo_execution_queue: intentRun.seo_execution_queue || "",
      seo_worker_summary: intentRun.seo_worker_summary || "",
      content_execution_queue: intentRun.content_execution_queue || "",
      content_worker_summary: intentRun.content_worker_summary || "",
      content_plan_queue: intentRun.content_plan_queue || "",
      content_plan_summary: intentRun.content_plan_summary || "",
      content_plan_markdown: intentRun.content_plan_markdown || "",
      seo_refresh_report: intentRun.seo_refresh_report || "",
      seo_create_report: intentRun.seo_create_report || "",
      intent_markdown_report: intentRun.markdown_report || "",
      intent_json_report: intentRun.json_report || "",
      intent_snapshot: intentRun.snapshot || "",
      intent_error: intentRun.error || "",
      runtime_env_loaded_from: runtimeEnv.loaded_from,
      content_plan_mode: args.useContentPlan ? "content_plan" : "manual_batch",
      skip_dispatch: args.skipDispatch,
      verify_remote: args.verifyRemote,
      keep_temp: args.keepTemp,
      force: args.force,
    };

    await writeJson(reportPath, wrapperReport);
    await writeJson(lockPath, wrapperReport);

    console.log(`decision_date=${decisionDate}`);
    console.log(`output_dir=${outputDir}`);
    console.log(`cycle_run_dir=${cycleRunDir}`);
    console.log(`cycle_report=${cycleReport}`);
    console.log(`wrapper_report=${reportPath}`);
    console.log(`lock=${lockPath}`);
    console.log(`selected_source_type=${wrapperReport.selected_source_type}`);
    console.log(`selected_source_id=${wrapperReport.selected_source_id}`);
    console.log(`dispatch_mode=${dispatchMode}`);
    console.log(`intent_status=${wrapperReport.intent_status}`);
    console.log(`intent_backlog=${wrapperReport.intent_backlog}`);
    console.log(`intent_seo_brief_queue=${wrapperReport.intent_seo_brief_queue}`);
    console.log(`intent_content_brief_queue=${wrapperReport.intent_content_brief_queue}`);
    console.log(`seo_execution_queue=${wrapperReport.seo_execution_queue}`);
    console.log(`content_execution_queue=${wrapperReport.content_execution_queue}`);
    console.log(`content_plan_queue=${wrapperReport.content_plan_queue}`);
    console.log(`seo_refresh_report=${wrapperReport.seo_refresh_report}`);
    console.log(`seo_create_report=${wrapperReport.seo_create_report}`);
    console.log(`status=completed`);
  } catch (error) {
    const failedReport = {
      decision_date: decisionDate,
      status: "failed",
      started_at: startedAt,
      failed_at: new Date().toISOString(),
      input_path: args.inputPath,
      content_plan_path: args.contentPlanPath,
      use_content_plan: args.useContentPlan,
      error: error.message,
      intent_mode: args.intentMode,
      intent_status: intentRun.status,
      intent_cycle_report: intentRun.cycle_report || "",
      intent_backlog: intentRun.backlog || "",
      intent_seo_brief_queue: intentRun.seo_brief_queue || "",
      intent_content_brief_queue: intentRun.content_brief_queue || "",
      seo_execution_queue: intentRun.seo_execution_queue || "",
      seo_worker_summary: intentRun.seo_worker_summary || "",
      content_execution_queue: intentRun.content_execution_queue || "",
      content_worker_summary: intentRun.content_worker_summary || "",
      content_plan_queue: intentRun.content_plan_queue || "",
      content_plan_summary: intentRun.content_plan_summary || "",
      content_plan_markdown: intentRun.content_plan_markdown || "",
      seo_refresh_report: intentRun.seo_refresh_report || "",
      seo_create_report: intentRun.seo_create_report || "",
      intent_markdown_report: intentRun.markdown_report || "",
      intent_json_report: intentRun.json_report || "",
      intent_snapshot: intentRun.snapshot || "",
      intent_error: intentRun.error || "",
      runtime_env_loaded_from: runtimeEnv.loaded_from,
      content_plan_mode: args.useContentPlan ? "content_plan" : "manual_batch",
      skip_dispatch: args.skipDispatch,
      verify_remote: args.verifyRemote,
      keep_temp: args.keepTemp,
      force: args.force,
    };
    await writeJson(reportPath, failedReport);
    await writeJson(lockPath, failedReport);
    throw error;
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
