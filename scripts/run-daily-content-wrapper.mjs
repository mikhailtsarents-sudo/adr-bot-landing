#!/usr/bin/env node

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const DEFAULT_OUTPUT_ROOT = path.join(repoRoot, "daily-wrapper-runs");

function printHelp() {
  console.log(`Usage: npm run run:daily-content-wrapper -- --input <batch.json> [options]

Options:
  --input <file>        Candidate batch JSON for chooser
  --output-root <dir>   Root directory for wrapper + cycle outputs (default: ${DEFAULT_OUTPUT_ROOT})
  --date <yyyy-mm-dd>   Decision date override
  --verify-remote       Pass remote verification to downstream runners where supported
  --keep-temp           Preserve downstream temporary files where supported
  --force               Override an existing same-day lock for manual recovery
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

async function loadJson(filePath) {
  return JSON.parse(await readFile(filePath, "utf8"));
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

function parseOutputPath(stdout, key) {
  const line = stdout
    .split("\n")
    .map((entry) => entry.trim())
    .find((entry) => entry.startsWith(`${key}=`));
  return line ? line.slice(key.length + 1) : "";
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

function buildWrapperEnvelope({
  wrapperId,
  dayKey,
  inputPath,
  outputDir,
  decisionPath,
  cycleReportPath,
  dispatchReportPath,
  decision,
  dispatchReport,
}) {
  return {
    wrapper_id: wrapperId,
    day_key: dayKey,
    trace_id: decision?.trace_id || wrapperId,
    status: "completed",
    publish_allowed: decision?.publish_allowed !== false && decision?.decision_state !== "blocked",
    decision_state: decision?.decision_state || "",
    selected_family: decision?.selected_family || "",
    selected_source_type: decision?.selected_source_type || "",
    selected_source_id: decision?.selected_source_id || "",
    selected_source_version: decision?.selected_source_version || "",
    template_id: decision?.template_id || "",
    priority_score: decision?.priority_score ?? 0,
    blocking_reason: decision?.blocking_reason || "",
    next_step: decision?.next_step || "",
    dispatch_mode: dispatchReport?.dispatch_mode || "",
    runner: dispatchReport?.runner || "",
    decision_path: decisionPath,
    cycle_report_path: cycleReportPath,
    dispatch_report_path: dispatchReportPath,
    input_path: inputPath,
    output_dir: outputDir,
    created_at: new Date().toISOString(),
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const dayKey = args.decisionDate || new Date().toISOString().slice(0, 10);
  const wrapperId = `daily-wrapper-${dayKey}`;
  const wrapperSlug = slugify(wrapperId) || `daily-wrapper-${Date.now()}`;
  const outputDir = path.join(args.outputRoot, wrapperSlug);
  await mkdir(outputDir, { recursive: true });

  const lockPath = path.join(outputDir, "day_lock.json");
  const lockState = {
    wrapper_id: wrapperId,
    day_key: dayKey,
    status: "running",
    started_at: new Date().toISOString(),
    pid: process.pid,
    input_path: args.inputPath,
    output_dir: outputDir,
  };

  if (!args.force) {
    let existing = null;
    try {
      existing = await loadJson(lockPath);
    } catch (error) {
      if (error?.code === "ENOENT") {
        // no-op; no lock yet
      } else {
        throw error;
      }
    }
    if (existing) {
      throw new Error(
        `Day lock already exists for ${dayKey} (${existing.status || "unknown"}). Use --force only for manual recovery.`,
      );
    }
  }

  await writeFile(lockPath, `${JSON.stringify(lockState, null, 2)}\n`, {
    encoding: "utf8",
    flag: args.force ? "w" : "wx",
  });

  let cycleOutput = "";
  let decisionPath = "";
  let dispatchReportPath = "";
  let cycleReportPath = "";

  try {
    cycleOutput = runNodeScript(path.join(repoRoot, "scripts", "run-daily-content-cycle.mjs"), [
      "--input",
      args.inputPath,
      "--output-root",
      outputDir,
      ...(args.decisionDate ? ["--date", args.decisionDate] : []),
      ...(args.verifyRemote ? ["--verify-remote"] : []),
      ...(args.keepTemp ? ["--keep-temp"] : []),
    ]);

    decisionPath = parseOutputPath(cycleOutput, "decision");
    dispatchReportPath = parseOutputPath(cycleOutput, "dispatch_report");
    cycleReportPath = parseOutputPath(cycleOutput, "cycle_report");

    if (!decisionPath || !dispatchReportPath || !cycleReportPath) {
      throw new Error("Daily cycle did not emit the expected wrapper handoff paths.");
    }

    const decision = await loadJson(decisionPath);
    const dispatchReport = await loadJson(dispatchReportPath);
    const envelope = buildWrapperEnvelope({
      wrapperId,
      dayKey,
      inputPath: args.inputPath,
      outputDir,
      decisionPath,
      cycleReportPath,
      dispatchReportPath,
      decision,
      dispatchReport,
    });

    const envelopePath = path.join(outputDir, "daily_winner_envelope.json");
    await writeFile(envelopePath, `${JSON.stringify(envelope, null, 2)}\n`, "utf8");

    await writeFile(
      lockPath,
      `${JSON.stringify(
        {
          ...lockState,
          status: "completed",
          completed_at: new Date().toISOString(),
          decision_path: decisionPath,
          dispatch_report_path: dispatchReportPath,
          cycle_report_path: cycleReportPath,
          envelope_path: envelopePath,
          selected_source_type: envelope.selected_source_type,
          selected_source_id: envelope.selected_source_id,
          dispatch_mode: envelope.dispatch_mode,
        },
        null,
        2,
      )}\n`,
      "utf8",
    );

    console.log(`output_dir=${outputDir}`);
    console.log(`day_lock=${lockPath}`);
    console.log(`decision=${decisionPath}`);
    console.log(`dispatch_report=${dispatchReportPath}`);
    console.log(`cycle_report=${cycleReportPath}`);
    console.log(`daily_winner_envelope=${envelopePath}`);
    console.log(`selected_source_type=${envelope.selected_source_type}`);
    console.log(`selected_source_id=${envelope.selected_source_id || ""}`);
    console.log(`dispatch_mode=${envelope.dispatch_mode || ""}`);
    console.log(`publish_allowed=${envelope.publish_allowed ? "true" : "false"}`);
  } catch (error) {
    await writeFile(
      lockPath,
      `${JSON.stringify(
        {
          ...lockState,
          status: "failed",
          failed_at: new Date().toISOString(),
          error: error.message,
          cycle_output: cycleOutput,
          decision_path: decisionPath,
          dispatch_report_path: dispatchReportPath,
          cycle_report_path: cycleReportPath,
        },
        null,
        2,
      )}\n`,
      "utf8",
    ).catch(() => {});
    throw error;
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
