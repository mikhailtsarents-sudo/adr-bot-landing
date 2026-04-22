#!/usr/bin/env node

import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { postStorageRowWithDiagnostics } from "./runtime/storage-row-contract.mjs";
import { enableStrictNonInteractiveMode, logAutonomousDecision } from "./runtime/non-interactive-mode.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");

const DEFAULT_INPUT_PATH = path.join(
  repoRoot,
  "examples",
  "question-batch-wave-1",
  "q-test-001-driver-documents.json",
);
const DEFAULT_OUTPUT_ROOT = "/tmp/question-single-youtube-debug";
const DEFAULT_FIXED_SCENARIO = "scenario_license";
const DEFAULT_SHOTSTACK_API_BASE = "https://api.shotstack.io/edit/v1";
const DEFAULT_TABLE_URL = "https://tsarents.app.n8n.cloud/api/v1/data-tables/o3VHi3uQOI2y0z1o/rows";
const DEFAULT_WEBHOOK_URL = "https://tsarents.app.n8n.cloud/webhook/adr-youtube-execution-bridge-run";
const DEFAULT_VISIBILITY = "unlisted";

enableStrictNonInteractiveMode("run-question-single-youtube-debug");

function printHelp() {
  console.log(`Usage: node scripts/run-question-single-youtube-debug.mjs [options]

Options:
  --input <file>              QUESTION source JSON (default: ${DEFAULT_INPUT_PATH})
  --output-root <dir>         Output root for single debug packages (default: ${DEFAULT_OUTPUT_ROOT})
  --fixed-scenario <id>       Fixed scenario id (default: ${DEFAULT_FIXED_SCENARIO})
  --shotstack-api-key <key>   Shotstack API key (or SHOTSTACK_API_KEY)
  --shotstack-api-base <url>  Shotstack API base (default: ${DEFAULT_SHOTSTACK_API_BASE})
  --n8n-api-key <key>         N8N API key (or N8N_API_KEY)
  --table-url <url>           N8N table URL (default: ${DEFAULT_TABLE_URL})
  --webhook-url <url>         YouTube bridge webhook (default: ${DEFAULT_WEBHOOK_URL})
  --use-approved-preview-bundle  Reuse an already approved preview bundle instead of regenerating visuals
  --approved-preview-bundle <f>  Path to approved public_preview_result.json
  --variation-type <value>    Optional variation type override
  --variation-value <value>   Optional variation value override
  --variation-payload <json>  Optional variation payload JSON
  --max-attempts <n>          Max generation attempts before failing (default: 3)
  --poll-ms <ms>              Poll interval for render/publish (default: 8000)
  --timeout-ms <ms>           Render/publish timeout (default: 480000)
  --verify-remote             Verify generated asset URL before render
  --keep-temp                 Keep intermediate temp files
  --help                      Show this help
`);
}

function parseArgs(argv) {
  const args = {
    inputPath: DEFAULT_INPUT_PATH,
    outputRoot: DEFAULT_OUTPUT_ROOT,
    fixedScenario: DEFAULT_FIXED_SCENARIO,
    shotstackApiKey: process.env.SHOTSTACK_API_KEY || "",
    shotstackApiBase: DEFAULT_SHOTSTACK_API_BASE,
    n8nApiKey: process.env.N8N_API_KEY || "",
    tableUrl: DEFAULT_TABLE_URL,
    webhookUrl: DEFAULT_WEBHOOK_URL,
    useApprovedPreviewBundle: false,
    approvedPreviewBundlePath: "",
    variationType: "",
    variationValue: "",
    variationPayload: null,
    maxAttempts: 3,
    pollMs: 8000,
    timeoutMs: 8 * 60 * 1000,
    verifyRemote: false,
    keepTemp: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === "--input") args.inputPath = path.resolve(argv[++i]);
    else if (token === "--output-root") args.outputRoot = path.resolve(argv[++i]);
    else if (token === "--fixed-scenario") args.fixedScenario = argv[++i];
    else if (token === "--shotstack-api-key") args.shotstackApiKey = argv[++i];
    else if (token === "--shotstack-api-base") args.shotstackApiBase = argv[++i].replace(/\/$/, "");
    else if (token === "--n8n-api-key") args.n8nApiKey = argv[++i];
    else if (token === "--table-url") args.tableUrl = argv[++i];
    else if (token === "--webhook-url") args.webhookUrl = argv[++i];
    else if (token === "--use-approved-preview-bundle") args.useApprovedPreviewBundle = true;
    else if (token === "--approved-preview-bundle") args.approvedPreviewBundlePath = path.resolve(argv[++i]);
    else if (token === "--variation-type") args.variationType = argv[++i];
    else if (token === "--variation-value") args.variationValue = argv[++i];
    else if (token === "--variation-payload") args.variationPayload = JSON.parse(argv[++i]);
    else if (token === "--max-attempts") args.maxAttempts = Number(argv[++i]) || 3;
    else if (token === "--poll-ms") args.pollMs = Number(argv[++i]) || 8000;
    else if (token === "--timeout-ms") args.timeoutMs = Number(argv[++i]) || 8 * 60 * 1000;
    else if (token === "--verify-remote") args.verifyRemote = true;
    else if (token === "--keep-temp") args.keepTemp = true;
    else if (token === "--help" || token === "-h") {
      printHelp();
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${token}`);
    }
  }

  if (!args.shotstackApiKey) {
    throw new Error("Missing Shotstack API key. Pass --shotstack-api-key or set SHOTSTACK_API_KEY.");
  }
  if (!args.n8nApiKey) {
    throw new Error("Missing N8N API key. Pass --n8n-api-key or set N8N_API_KEY.");
  }

  return args;
}

async function loadJson(filePath) {
  return JSON.parse(await readFile(filePath, "utf8"));
}

async function writeJson(filePath, value) {
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
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

function parseKeyValueOutput(raw) {
  return String(raw || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .reduce((acc, line) => {
      const idx = line.indexOf("=");
      if (idx > 0) {
        acc[line.slice(0, idx)] = line.slice(idx + 1);
      }
      return acc;
    }, {});
}

function runNodeScript(scriptPath, scriptArgs) {
  const result = spawnSync(process.execPath, [scriptPath, ...scriptArgs], {
    cwd: repoRoot,
    encoding: "utf8",
    stdio: "pipe",
    maxBuffer: 20 * 1024 * 1024,
    env: process.env,
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

  return {
    stdout: result.stdout || "",
    stderr: result.stderr || "",
    fields: parseKeyValueOutput(result.stdout || ""),
  };
}

async function sleep(ms) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function shotstackRequest(url, apiKey, init = {}) {
  const response = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      ...(init.headers || {}),
    },
  });

  const body = await response.text();
  let json;
  try {
    json = body ? JSON.parse(body) : {};
  } catch {
    json = { raw: body };
  }

  if (!response.ok) {
    throw new Error(`Shotstack HTTP ${response.status}: ${JSON.stringify(json)}`);
  }

  return json;
}

async function submitSingleRender(packageDir, args) {
  const payload = await loadJson(path.join(packageDir, "shotstack_render_payload.json"));
  const renderTask = await loadJson(path.join(packageDir, "render_task.json"));
  const submitResult = await shotstackRequest(`${args.shotstackApiBase}/render`, args.shotstackApiKey, {
    method: "POST",
    body: JSON.stringify(payload),
  });

  const renderId = submitResult?.response?.id || submitResult?.id || "";
  if (!renderId) {
    throw new Error(`Shotstack submit did not return render id for ${packageDir}`);
  }

  const startedAt = Date.now();
  let latest = submitResult;
  while (Date.now() - startedAt < args.timeoutMs) {
    latest = await shotstackRequest(`${args.shotstackApiBase}/render/${renderId}`, args.shotstackApiKey);
    const status = latest?.response?.status || latest?.status || "";
    if (status === "done" || status === "failed") {
      break;
    }
    await sleep(args.pollMs);
  }

  const summary = {
    source_id: renderTask.source_id,
    trace_id: renderTask.trace_id,
    render_task_id: renderTask.render_task_id,
    scenario_id: renderTask.scenario_id,
    package_dir: packageDir,
    render_id: renderId,
    status: latest?.response?.status || latest?.status || "unknown",
    render_url: latest?.response?.url || latest?.url || "",
    error: latest?.response?.error || latest?.error || "",
    checked_at: new Date().toISOString(),
  };

  await writeJson(path.join(packageDir, "shotstack_render_receipt.json"), {
    submit: submitResult,
    status: latest,
    summary,
  });

  if (summary.status !== "done" || !summary.render_url) {
    throw new Error(`Single render failed: ${summary.status}${summary.error ? ` (${summary.error})` : ""}`);
  }

  return summary;
}

function collectVisualValidationIssues({ generatedVisual, manifest, svgContent }) {
  const issues = [];
  const validation = manifest?.real_scene_validation || {};

  if (generatedVisual?.fallback_used) {
    issues.push("fallback_used");
  }
  if (validation.pass === false) {
    issues.push("real_scene_validation_failed");
  }
  if (!validation.driver_present) {
    issues.push("driver_missing");
  }
  if (!validation.inspector_present) {
    issues.push("inspector_missing");
  }
  if (!validation.vehicle_context_present) {
    issues.push("vehicle_context_missing");
  }
  if (validation.embedded_ui_overlay) {
    issues.push("embedded_ui_overlay_present");
  }
  if (validation.embedded_story_text_present) {
    issues.push("embedded_story_text_present");
  }

  const forbiddenPhrases = [
    "SHOW DOCUMENTS",
    "NO LICENSE?",
    "TRAINING SCENARIO",
    "ROADSIDE CHECK",
    "VIDEO ",
  ];
  for (const phrase of forbiddenPhrases) {
    if (svgContent.includes(phrase)) {
      issues.push(`forbidden_phrase:${phrase}`);
    }
  }

  return issues;
}

async function validatePackageForRealScene(packageDir) {
  const generatedVisual = await loadJson(path.join(packageDir, "generated_visual.json"));
  const manifest = await loadJson(generatedVisual.manifest_path);
  const svgContent = await readFile(path.join(generatedVisual.generated_dir, "bg.svg"), "utf8");
  const issues = collectVisualValidationIssues({ generatedVisual, manifest, svgContent });
  return {
    pass: issues.length === 0,
    issues,
    generatedVisual,
    manifest,
  };
}

async function postStorageRow(row, args) {
  return postStorageRowWithDiagnostics(row, {
    endpoint: args.tableUrl,
    apiKey: args.n8nApiKey,
    diagnosticsDir: args.currentPackageDir,
    rowFilePath: path.join(args.currentPackageDir, "g3_bridge_row.json"),
  });
}

async function triggerBridge({ draftId, traceId, requestedBy }, args) {
  const response = await fetch(args.webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      draft_id: draftId,
      trace_id: traceId,
      source_ref: draftId,
      requested_by: requestedBy,
    }),
  });
  if (!response.ok) {
    throw new Error(`Bridge trigger failed: ${response.status} ${await response.text()}`);
  }
}

async function pollFinalRow(draftId, args) {
  const deadline = Date.now() + args.timeoutMs;
  while (Date.now() < deadline) {
    const response = await fetch(`${args.tableUrl}?limit=250`, {
      headers: { "X-N8N-API-KEY": args.n8nApiKey },
    });
    if (!response.ok) {
      throw new Error(`Storage poll failed: ${response.status} ${await response.text()}`);
    }
    const payload = await response.json();
    const rows = Array.isArray(payload?.data) ? payload.data : [];
    const latest = rows
      .filter((row) => text(row.draft_id) === draftId)
      .sort((a, b) => Number(a.id || 0) - Number(b.id || 0))
      .pop();
    const status = text(latest?.published_status);
    if (
      status === "youtube_uploaded" ||
      status === "youtube_upload_failed_terminal" ||
      status === "youtube_upload_failed_retryable"
    ) {
      return latest;
    }
    await sleep(args.pollMs);
  }
  throw new Error("Timed out waiting for YouTube publish result");
}

async function stampPublishResult(packageDir, finalRow) {
  const publishReadyPath = path.join(packageDir, "publish_ready_package.json");
  const bridgeRowPath = path.join(packageDir, "g3_bridge_row.json");
  const summaryPath = path.join(packageDir, "youtube_publish_result.json");
  const [publishReady, bridgeRow] = await Promise.all([
    loadJson(publishReadyPath),
    loadJson(bridgeRowPath),
  ]);

  publishReady.youtube_video_id = text(finalRow.youtube_video_id);
  publishReady.youtube_url = text(finalRow.youtube_url);
  publishReady.published_status = text(finalRow.published_status);
  bridgeRow.youtube_video_id = text(finalRow.youtube_video_id);
  bridgeRow.youtube_url = text(finalRow.youtube_url);
  bridgeRow.published_status = text(finalRow.published_status);

  await Promise.all([
    writeJson(publishReadyPath, publishReady),
    writeJson(bridgeRowPath, bridgeRow),
    writeJson(summaryPath, finalRow),
  ]);
}

async function generateSinglePackage(args, attempt) {
  const attemptTag = `a${String(attempt).padStart(2, "0")}`;
  const baseVariationType = text(args.variationType) || "single_video_debug";
  const baseVariationValue = text(args.variationValue) || `real_scene_${args.fixedScenario}`;
  const slug = [
    slugify(args.fixedScenario),
    "single",
    "youtube",
    "debug",
    attemptTag,
    Date.now().toString(36),
  ]
    .filter(Boolean)
    .join("-");
  const scriptArgs = [
    "--input",
    args.inputPath,
    "--output-root",
    args.outputRoot,
    "--fixed-scenario",
    args.fixedScenario,
    "--variation-type",
    baseVariationType,
    "--variation-value",
    `${baseVariationValue}_${attemptTag}`,
    "--slug",
    slug,
    "--visibility",
    DEFAULT_VISIBILITY,
  ];
  if (args.variationPayload) {
    scriptArgs.push("--variation-payload", JSON.stringify(args.variationPayload));
  }
  if (args.useApprovedPreviewBundle) {
    scriptArgs.push("--use-approved-preview-bundle");
  }
  if (text(args.approvedPreviewBundlePath)) {
    scriptArgs.push("--approved-preview-bundle", args.approvedPreviewBundlePath);
  }
  if (args.verifyRemote) {
    scriptArgs.push("--verify-remote");
  }
  if (args.keepTemp) {
    scriptArgs.push("--keep-temp");
  }

  const result = runNodeScript(path.join(repoRoot, "scripts", "run-question-render-package.mjs"), scriptArgs);
  const packageDir = result.fields.output_dir;
  if (!text(packageDir)) {
    throw new Error("run-question-render-package did not return output_dir");
  }
  const validation = await validatePackageForRealScene(packageDir);
  return {
    attempt,
    packageDir,
    validation,
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  logAutonomousDecision("selected single youtube debug settings", {
    input_path: args.inputPath,
    fixed_scenario: args.fixedScenario,
    use_approved_preview_bundle: Boolean(args.useApprovedPreviewBundle),
  });
  let selected = null;

  for (let attempt = 1; attempt <= args.maxAttempts; attempt += 1) {
    const candidate = await generateSinglePackage(args, attempt);
    if (candidate.validation.pass) {
      selected = candidate;
      break;
    }
  }

  if (!selected) {
    throw new Error("No single-video attempt passed real-scene validation.");
  }
  logAutonomousDecision("selected validated package", {
    package_dir: selected.packageDir,
    attempt: selected.attempt,
  });

  const packageDir = selected.packageDir;
  args.currentPackageDir = packageDir;
  const renderTask = await loadJson(path.join(packageDir, "render_task.json"));
  const renderSummary = await submitSingleRender(packageDir, args);

  runNodeScript(path.join(repoRoot, "scripts", "finalize-render-package.mjs"), [
    "--package-dir",
    packageDir,
    "--final-mp4-url",
    renderSummary.render_url,
    "--render-receipt",
    renderSummary.render_id,
    "--render-source-url",
    renderSummary.render_url,
  ]);

  const bridgeRow = await loadJson(path.join(packageDir, "g3_bridge_row.json"));
  await postStorageRow(bridgeRow, args);
  await triggerBridge(
    {
      draftId: text(bridgeRow.draft_id),
      traceId: text(renderTask.trace_id),
      requestedBy: "question_single_youtube_debug",
    },
    args,
  );

  const finalRow = await pollFinalRow(text(bridgeRow.draft_id), args);
  await stampPublishResult(packageDir, finalRow);
  logAutonomousDecision("youtube publish completed", {
    youtube_url: text(finalRow.youtube_url),
  });

  console.log(`YOUTUBE_URL=${text(finalRow.youtube_url)}`);
  console.log(`RENDER_READY_URL=${renderSummary.render_url}`);
  console.log(`PACKAGE_DIR=${packageDir}`);
  console.log(`RENDER_SUMMARY=rendered in attempt ${selected.attempt} with status ${renderSummary.status}`);
  console.log(`PUBLISH_SUMMARY=${text(finalRow.published_status) || "unknown"}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
