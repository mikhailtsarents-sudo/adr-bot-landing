#!/usr/bin/env node

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { enableStrictNonInteractiveMode, logAutonomousDecision } from "./runtime/non-interactive-mode.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const DEFAULT_OUTPUT_ROOT = path.join(repoRoot, "daily-cycle-runs");
enableStrictNonInteractiveMode("run-daily-content-cycle");

function printHelp() {
  console.log(`Usage: npm run run:daily-content-cycle -- --input <batch.json> [options]

Options:
  --input <file>        Candidate batch JSON for chooser
  --content-plan <file> Content plan queue JSON to adapt into a production batch
  --output-root <dir>   Root directory for chooser + dispatch outputs (default: ${DEFAULT_OUTPUT_ROOT})
  --date <yyyy-mm-dd>   Decision date override
  --skip-dispatch       Stop after chooser/decision without starting render dispatch
  --verify-remote       Pass remote verification to downstream runners where supported
  --keep-temp           Preserve downstream temporary files where supported
  --help                Show this help
`);
}

function parseArgs(argv) {
  const args = {
    inputPath: "",
    contentPlanPath: "",
    outputRoot: DEFAULT_OUTPUT_ROOT,
    decisionDate: "",
    skipDispatch: false,
    verifyRemote: false,
    keepTemp: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === "--input") args.inputPath = path.resolve(argv[++i]);
    else if (token === "--content-plan") args.contentPlanPath = path.resolve(argv[++i]);
    else if (token === "--output-root") args.outputRoot = path.resolve(argv[++i]);
    else if (token === "--date") args.decisionDate = argv[++i];
    else if (token === "--skip-dispatch") args.skipDispatch = true;
    else if (token === "--verify-remote") args.verifyRemote = true;
    else if (token === "--keep-temp") args.keepTemp = true;
    else if (token === "--help" || token === "-h") {
      printHelp();
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${token}`);
    }
  }

  if (!args.inputPath && !args.contentPlanPath) {
    throw new Error("Missing --input <batch.json> or --content-plan <content_plan_queue.json>.");
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
  logAutonomousDecision("selected daily cycle input", {
    input_path: args.inputPath,
    content_plan_path: args.contentPlanPath,
  });
  const cycleLabel =
    slugify(`daily-cycle-${args.decisionDate || new Date().toISOString().slice(0, 10)}`) ||
    `daily-cycle-${Date.now()}`;
  const outputDir = path.join(args.outputRoot, cycleLabel);
  await mkdir(outputDir, { recursive: true });

  let chooserInputPath = args.inputPath;
  let contentPlanPickerOutput = "";
  if (args.contentPlanPath) {
    contentPlanPickerOutput = runNodeScript(path.join(repoRoot, "scripts", "run-content-plan-picker.mjs"), [
      "--input",
      args.contentPlanPath,
      "--slug",
      cycleLabel,
    ]);
    chooserInputPath = parseOutputPath(contentPlanPickerOutput, "latest_production_candidate_batch");
  }

  if (!chooserInputPath) {
    throw new Error("Daily cycle could not resolve chooser input path.");
  }

  const chooserOutput = runNodeScript(path.join(repoRoot, "scripts", "run-daily-content-chooser.mjs"), [
    "--input",
    chooserInputPath,
    "--output-root",
    outputDir,
    ...(args.decisionDate ? ["--date", args.decisionDate] : []),
  ]);

  const decisionPath = parseOutputPath(chooserOutput, "decision");
  if (!decisionPath) {
    throw new Error("Chooser did not emit decision path.");
  }

  const dispatchOutput = args.skipDispatch
    ? ""
    : runNodeScript(path.join(repoRoot, "scripts", "run-daily-content-dispatch.mjs"), [
      "--decision",
      decisionPath,
      "--output-root",
      outputDir,
      ...(args.verifyRemote ? ["--verify-remote"] : []),
      ...(args.keepTemp ? ["--keep-temp"] : []),
    ]);

  const report = {
    chooser_output: chooserOutput,
    content_plan_picker_output: contentPlanPickerOutput,
    chooser_input_path: chooserInputPath,
    dispatch_output: dispatchOutput,
    decision_path: decisionPath,
    dispatch_report: parseOutputPath(dispatchOutput, "dispatch_report"),
    dispatch_mode: args.skipDispatch ? "skipped" : parseOutputPath(dispatchOutput, "dispatch_mode"),
    skip_dispatch: args.skipDispatch,
    created_at: new Date().toISOString(),
  };

  const cycleReportPath = path.join(outputDir, "daily_cycle_report.json");
  await writeFile(cycleReportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

  console.log(`output_dir=${outputDir}`);
  console.log(`chooser_input=${chooserInputPath}`);
  console.log(`decision=${decisionPath}`);
  console.log(`dispatch_report=${report.dispatch_report || ""}`);
  console.log(`dispatch_mode=${report.dispatch_mode || ""}`);
  console.log(`skip_dispatch=${args.skipDispatch ? "true" : "false"}`);
  console.log(`cycle_report=${cycleReportPath}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
