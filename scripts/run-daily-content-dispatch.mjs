#!/usr/bin/env node

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const DEFAULT_OUTPUT_ROOT = path.join(repoRoot, "daily-dispatch-runs");

function printHelp() {
  console.log(`Usage: npm run run:daily-content-dispatch -- --decision <decision.json> [options]

Options:
  --decision <file>     Decision JSON produced by run-daily-content-chooser
  --output-root <dir>   Output root (default: ${DEFAULT_OUTPUT_ROOT})
  --verify-remote       Pass remote verification to downstream runners where supported
  --keep-temp           Preserve downstream temporary files where supported
  --help                Show this help

The selected candidate must include enough execution metadata:
  WORD / QUESTION:
    selected_candidate.source_path (path to normalized source JSON)
  NEWS shadow path:
    selected_candidate.execution.shadow_inputs.{approved_news_path,scenario_request_path,scenario_response_path,canva_brief_path}
  NEWS canva/shotstack path:
    selected_candidate.execution.news_package_path
`);
}

function parseArgs(argv) {
  const args = {
    decisionPath: "",
    outputRoot: DEFAULT_OUTPUT_ROOT,
    verifyRemote: false,
    keepTemp: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === "--decision") args.decisionPath = path.resolve(argv[++i]);
    else if (token === "--output-root") args.outputRoot = path.resolve(argv[++i]);
    else if (token === "--verify-remote") args.verifyRemote = true;
    else if (token === "--keep-temp") args.keepTemp = true;
    else if (token === "--help" || token === "-h") {
      printHelp();
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${token}`);
    }
  }

  if (!args.decisionPath) {
    throw new Error("Missing --decision <decision.json>.");
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

function requirePath(candidate, fieldName) {
  const resolved = candidate?.[fieldName] || candidate?.trace?.[fieldName];
  if (!text(resolved)) {
    throw new Error(`Selected candidate is missing ${fieldName}.`);
  }
  return path.resolve(resolved);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const decision = await loadJson(args.decisionPath);
  const candidate = decision.selected_candidate;

  if (!candidate || decision.decision_state === "blocked") {
    throw new Error("Decision is blocked or missing selected_candidate.");
  }

  const slug = slugify(`${decision.selected_source_type}-${decision.selected_source_id}-${Date.now()}`) || "daily-dispatch";
  const outputDir = path.join(args.outputRoot, slug);
  await mkdir(outputDir, { recursive: true });

  let dispatchMode = "";
  let runner = "";
  let runnerOutput = "";

  if (decision.selected_source_type === "WORD") {
    const sourcePath = requirePath(candidate, "source_path");
    runner = "run-word-render-package.mjs";
    dispatchMode = "word_render_package";
    runnerOutput = runNodeScript(path.join(repoRoot, "scripts", runner), [
      "--input",
      sourcePath,
      "--output-root",
      outputDir,
      ...(args.verifyRemote ? ["--verify-remote"] : []),
      ...(args.keepTemp ? ["--keep-temp"] : []),
    ]);
  } else if (decision.selected_source_type === "QUESTION") {
    const sourcePath = requirePath(candidate, "source_path");
    runner = "run-question-render-package.mjs";
    dispatchMode = "question_render_package";
    runnerOutput = runNodeScript(path.join(repoRoot, "scripts", runner), [
      "--input",
      sourcePath,
      "--output-root",
      outputDir,
      ...(args.verifyRemote ? ["--verify-remote"] : []),
      ...(args.keepTemp ? ["--keep-temp"] : []),
    ]);
  } else if (decision.selected_source_type === "NEWS") {
    const execution = candidate.execution || {};
    if (text(execution.news_package_path)) {
      runner = "run-news-specific-canva-shotstack.mjs";
      dispatchMode = "news_canva_shotstack";
      runnerOutput = runNodeScript(path.join(repoRoot, "scripts", runner), [
        "--input",
        path.resolve(execution.news_package_path),
        "--output-dir",
        outputDir,
        ...(args.verifyRemote ? ["--verify-remote"] : []),
      ]);
    } else if (execution.shadow_inputs) {
      const shadow = execution.shadow_inputs;
      const required = [
        "approved_news_path",
        "scenario_request_path",
        "scenario_response_path",
        "canva_brief_path",
      ];
      for (const key of required) {
        if (!text(shadow[key])) {
          throw new Error(`NEWS shadow dispatch is missing ${key}.`);
        }
      }
      runner = "run-news-shadow-branch.mjs";
      dispatchMode = "news_shadow_branch";
      runnerOutput = runNodeScript(path.join(repoRoot, "scripts", runner), [
        "--approved-news",
        path.resolve(shadow.approved_news_path),
        "--scenario-request",
        path.resolve(shadow.scenario_request_path),
        "--scenario-response",
        path.resolve(shadow.scenario_response_path),
        "--canva-brief",
        path.resolve(shadow.canva_brief_path),
        "--output-root",
        outputDir,
      ]);
    } else {
      throw new Error(
        "NEWS decision lacks execution.news_package_path or execution.shadow_inputs, so dispatch cannot continue safely.",
      );
    }
  } else {
    throw new Error(`Unsupported selected_source_type: ${decision.selected_source_type}`);
  }

  const report = {
    trace_id: decision.trace_id,
    decision_path: args.decisionPath,
    selected_source_type: decision.selected_source_type,
    selected_source_id: decision.selected_source_id,
    dispatch_mode: dispatchMode,
    runner,
    runner_output: runnerOutput,
    created_at: new Date().toISOString(),
  };

  const reportPath = path.join(outputDir, "dispatch_report.json");
  await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

  console.log(`output_dir=${outputDir}`);
  console.log(`dispatch_report=${reportPath}`);
  console.log(`dispatch_mode=${dispatchMode}`);
  console.log(`runner=${runner}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
