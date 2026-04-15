#!/usr/bin/env node

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const DEFAULT_OUTPUT_ROOT = path.join(repoRoot, "daily-live-runs");

function printHelp() {
  console.log(`Usage: node scripts/run-daily-live-wrapper.mjs --input <batch.json> [options]

Options:
  --input <file>        Candidate batch JSON for chooser
  --output-root <dir>   Root directory for live wrapper outputs (default: ${DEFAULT_OUTPUT_ROOT})
  --date <yyyy-mm-dd>   Decision date override
  --verify-remote       Pass remote verification to downstream runners where supported
  --keep-temp           Preserve downstream temporary files where supported
  --force               Ignore existing day lock and run again
  --help                Show this help
`);
}

function parseArgs(argv) {
  const args = {
    inputPath: "",
    outputRoot: DEFAULT_OUTPUT_ROOT,
    decisionDate: "",
    verifyRemote: false,
    keepTemp: false,
    force: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === "--input") args.inputPath = path.resolve(argv[++i]);
    else if (token === "--output-root") args.outputRoot = path.resolve(argv[++i]);
    else if (token === "--date") args.decisionDate = argv[++i];
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

  if (!args.inputPath) {
    throw new Error("Missing --input <batch.json>.");
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

async function main() {
  const args = parseArgs(process.argv.slice(2));
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
    verify_remote: args.verifyRemote,
    keep_temp: args.keepTemp,
    force: args.force,
  });

  try {
    const cycleOutput = runNodeScript(path.join(repoRoot, "scripts", "run-daily-content-cycle.mjs"), [
      "--input",
      args.inputPath,
      "--output-root",
      outputDir,
      "--date",
      decisionDate,
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
      cycle_run_dir: cycleRunDir,
      cycle_report: cycleReport,
      decision_path: decisionPath,
      dispatch_report: dispatchReport,
      dispatch_mode: dispatchMode,
      selected_source_type: decision?.selected_source_type || "",
      selected_source_id: decision?.selected_source_id || "",
      decision_state: decision?.decision_state || "",
      trace_id: decision?.trace_id || "",
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
    console.log(`status=completed`);
  } catch (error) {
    const failedReport = {
      decision_date: decisionDate,
      status: "failed",
      started_at: startedAt,
      failed_at: new Date().toISOString(),
      input_path: args.inputPath,
      error: error.message,
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
