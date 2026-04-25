#!/usr/bin/env node

import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { enableStrictNonInteractiveMode, logAutonomousDecision } from "./runtime/non-interactive-mode.mjs";
import { listValidProductionSourceItems, selectAutomaticSourceItem } from "./runtime/source-pickup.mjs";
import { postStorageRowWithDiagnostics } from "./runtime/storage-row-contract.mjs";
import { bootstrapPhotorealRuntimeEnv } from "./runtime/photoreal-runtime-env.mjs";
import { resolveTemporaryUploadProviders } from "./runtime/temporary-upload.mjs";
import {
  resolveDraftStorageApiUrl,
  resolveN8nApiKey,
  resolveYoutubeBridgeWebhookUrl,
} from "./runtime/selfhost-n8n-defaults.mjs";

enableStrictNonInteractiveMode("run-autonomous-production-test");

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const outputRoot = path.join(repoRoot, "autonomous-production-test-runs", `run-${Date.now()}`);
const shotstackApiBase = "https://api.shotstack.io/edit/v1";
const visibility = "unlisted";
const fixedScenario = "";
let tableUrl = "";
let webhookUrl = "";

function text(value) { return value == null ? "" : String(value).trim(); }

function parseKeyValueOutput(raw) {
  return String(raw || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .reduce((acc, line) => {
      const idx = line.indexOf("=");
      if (idx > 0) acc[line.slice(0, idx)] = line.slice(idx + 1);
      return acc;
    }, {});
}

function readDotEnv(raw) {
  const env = {};
  for (const line of String(raw || "").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx <= 0) continue;
    const key = trimmed.slice(0, idx).trim();
    let value = trimmed.slice(idx + 1).trim();
    if ((value.startsWith("\"") && value.endsWith("\"")) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    env[key] = value;
  }
  return env;
}

function runNodeScript(scriptPath, scriptArgs, env) {
  const result = spawnSync(process.execPath, [scriptPath, ...scriptArgs], {
    cwd: repoRoot,
    encoding: "utf8",
    stdio: "pipe",
    maxBuffer: 50 * 1024 * 1024,
    env,
  });
  if (result.status !== 0) {
    const error = new Error(
      [
        `Script failed: ${path.basename(scriptPath)}`,
        result.stdout?.trim() ? `stdout:\n${result.stdout.trim()}` : null,
        result.stderr?.trim() ? `stderr:\n${result.stderr.trim()}` : null,
      ].filter(Boolean).join("\n"),
    );
    error.stdout = result.stdout || "";
    error.stderr = result.stderr || "";
    throw error;
  }
  return { stdout: result.stdout || "", fields: parseKeyValueOutput(result.stdout || "") };
}

async function loadJson(filePath) {
  return JSON.parse(await readFile(filePath, "utf8"));
}

async function writeJson(filePath, value) {
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

async function writeShotstackRenderRequestArtifact(packageDir, payload, apiKey) {
  const artifactPath = path.join(packageDir, "shotstack-render-request.json");
  const diagnostics = {
    SHOTSTACK_API_KEY_present: Boolean(text(apiKey)),
    shotstack_endpoint: `${shotstackApiBase}/render`,
    render_headers_has_x_api_key: Boolean(text(apiKey)),
  };
  await writeJson(artifactPath, {
    endpoint: `${shotstackApiBase}/render`,
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": Boolean(text(apiKey)) ? "[present]" : "",
    },
    payload,
    diagnostics,
  });
  return artifactPath;
}

async function writeShotstackRenderResponseArtifact(packageDir, responsePayload) {
  const artifactPath = path.join(packageDir, "shotstack-render-response.json");
  await writeJson(artifactPath, responsePayload);
  return artifactPath;
}

async function writeShotstackRenderStatusPollArtifact(packageDir, pollPayload) {
  const artifactPath = path.join(packageDir, "shotstack-render-status-poll.json");
  await writeJson(artifactPath, pollPayload);
  return artifactPath;
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
  try { json = body ? JSON.parse(body) : {}; } catch { json = { raw: body }; }
  if (!response.ok) {
    const error = new Error(`Shotstack HTTP ${response.status}: ${JSON.stringify(json)}`);
    error.shotstack = {
      endpoint: url,
      method: text(init?.method) || "GET",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": Boolean(text(apiKey)) ? "[present]" : "",
      },
      http_status: response.status,
      raw_response_body: body,
      parsed_response_body: json,
    };
    throw error;
  }
  return {
    http_status: response.status,
    raw_response_body: body,
    parsed_response_body: json,
  };
}

function collectShotstackAssetUrls(payload) {
  const urls = [];
  for (const sound of Array.isArray(payload?.timeline?.soundtrack) ? payload.timeline.soundtrack : []) {
    if (text(sound?.src)) urls.push(sound.src);
  }
  for (const track of Array.isArray(payload?.timeline?.tracks) ? payload.timeline.tracks : []) {
    for (const clip of Array.isArray(track?.clips) ? track.clips : []) {
      if (text(clip?.asset?.src)) urls.push(clip.asset.src);
    }
  }
  return urls;
}

function validateShotstackPayload(payload) {
  const assetUrls = collectShotstackAssetUrls(payload);
  const tracks = Array.isArray(payload?.timeline?.tracks) ? payload.timeline.tracks : [];
  const clips = tracks.flatMap((track) => (Array.isArray(track?.clips) ? track.clips : []));
  const output = payload?.output || {};
  const issues = [];

  if (assetUrls.length === 0) issues.push("all asset URLs missing");
  if (assetUrls.some((url) => !text(url))) issues.push("empty asset URL present");
  if (!text(output?.format)) issues.push("output format missing");
  if (tracks.length === 0) issues.push("timeline tracks empty");
  if (clips.length === 0) issues.push("timeline clips empty");

  if (issues.length > 0) {
    throw new Error(`Shotstack payload validation failed: ${issues.join("; ")}`);
  }
}

function extractShotstackFailureDetail(payload) {
  return text(
    payload?.response?.error
    || payload?.response?.message
    || payload?.response?.data?.message
    || payload?.error
    || payload?.message
    || payload?.data?.message
    || payload?.raw,
  );
}

async function triggerBridge({ draftId, traceId, requestedBy }) {
  const response = await fetch(webhookUrl, {
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

async function pollFinalRow(draftId, n8nApiKey, timeoutMs = 8 * 60 * 1000, pollMs = 8000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const response = await fetch(`${tableUrl}?limit=250`, {
      headers: { "X-N8N-API-KEY": n8nApiKey },
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
    if (status === "youtube_uploaded" || status === "youtube_upload_failed_terminal" || status === "youtube_upload_failed_retryable") {
      return latest;
    }
    await sleep(pollMs);
  }
  throw new Error("Timed out waiting for YouTube publish result");
}

function inferFailureStage(message) {
  const safe = text(message).toLowerCase();
  if (safe.includes("photorealistic frame generation exhausted") || safe.includes("raster validation") || safe.includes("preview")) return "preview_generation";
  if (safe.includes("shotstack") || safe.includes("render failed")) return "video_render";
  if (safe.includes("storage insert failed")) return "storage_insert";
  if (safe.includes("bridge trigger failed") || safe.includes("youtube") || safe.includes("timed out waiting for youtube")) return "youtube_upload";
  return "unknown";
}

function buildRunnerInvocation(selected, runDir, approvedPreviewBundlePath = "") {
  const variationValue = `autonomous_${Date.now()}`;
  if (selected.source_type === "QUESTION") {
    return {
      scriptPath: path.join(repoRoot, "scripts", "run-question-render-package.mjs"),
      scriptArgs: [
        "--input", selected.source_path,
        "--output-root", runDir,
        "--fixed-scenario", fixedScenario,
        "--variation-type", "autonomous_source_pickup",
        "--variation-value", variationValue,
        "--slug", `autonomous-question-${Date.now()}`,
        "--visibility", visibility,
        "--verify-remote",
        ...(text(approvedPreviewBundlePath)
          ? ["--use-approved-preview-bundle", "--approved-preview-bundle", approvedPreviewBundlePath]
          : []),
      ],
    };
  }

  if (selected.source_type === "WORD") {
    return {
      scriptPath: path.join(repoRoot, "scripts", "run-word-render-package.mjs"),
      scriptArgs: [
        "--input", selected.source_path,
        "--output-root", runDir,
      ],
    };
  }

  if (selected.source_type === "NEWS") {
    return {
      scriptPath: path.join(repoRoot, "scripts", "run-approved-news-live-branch.mjs"),
      scriptArgs: [
        "--input", selected.source_path,
        "--output-root", runDir,
      ],
    };
  }

  throw new Error(`Unsupported source type: ${selected.source_type}`);
}

async function findLatestFileByName(rootDir, fileName) {
  const matches = [];

  async function walk(currentDir) {
    const entries = await readdir(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        await walk(fullPath);
      } else if (entry.isFile() && entry.name === fileName) {
        matches.push(fullPath);
      }
    }
  }

  await walk(rootDir);
  return matches.sort().pop() || "";
}

async function runStablePreviewWorkflow(selected, env, runDir) {
  const previewRoot = path.join(runDir, "preview");
  await mkdir(previewRoot, { recursive: true });
  logAutonomousDecision("selected stable preview workflow", {
    source_type: selected.source_type,
    source_id: selected.source_id,
    preview_root: previewRoot,
  });

  let previewRun = null;
  let previewRunError = null;
  try {
    previewRun = runNodeScript(
      path.join(repoRoot, "scripts", "run-question-public-preview-debug.mjs"),
      [
        "--input", selected.source_path,
        "--output-root", previewRoot,
        "--fixed-scenario", fixedScenario,
        "--max-attempts", "1",
        "--preview-count", "3",
      ],
      env,
    );
  } catch (error) {
    previewRunError = error;
  }

  const previewResultPath = await findLatestFileByName(previewRoot, "public_preview_result.json");
  if (!text(previewResultPath)) {
    if (previewRunError) {
      throw previewRunError;
    }
    throw new Error("Stable preview workflow did not produce public_preview_result.json");
  }

  const previewResult = await loadJson(previewResultPath);
  const previewPass = Boolean(
    previewResult?.validation?.preview_pass ?? previewResult?.preview_pass,
  );
  const allFramesPass = Boolean(
    previewResult?.validation?.all_frames_pass ?? previewResult?.all_frames_pass,
  );
  const providerUsed = text(
    previewResult?.validation?.provider_used ?? previewResult?.provider_used,
  );
  const providerAttempts = Array.isArray(
    previewResult?.validation?.provider_attempts ?? previewResult?.provider_attempts,
  )
    ? (previewResult?.validation?.provider_attempts ?? previewResult?.provider_attempts)
    : [];
  const failedReasonsByFrame = Array.isArray(
    previewResult?.validation?.failed_reasons_by_frame ?? previewResult?.failed_reasons_by_frame,
  )
    ? (previewResult?.validation?.failed_reasons_by_frame ?? previewResult?.failed_reasons_by_frame)
    : [];
  const firstFailingStage = text(previewResult?.first_failing_stage);

  return {
    previewRoot,
    previewRun,
    previewRunError,
    previewResultPath,
    previewResult,
    previewPass,
    allFramesPass,
    providerUsed,
    providerAttempts,
    failedReasonsByFrame,
    firstFailingStage,
  };
}

function applyTestTitlePrefix(metadata, publishReady, bridgeRow) {
  const prefix = (value) => text(value).startsWith("TEST ") ? text(value) : `TEST ${text(value)}`;
  if (metadata) {
    metadata.title = prefix(metadata.title);
    metadata.title_variant_a = prefix(metadata.title_variant_a || metadata.title);
    metadata.title_variant_b = prefix(metadata.title_variant_b || metadata.title);
    metadata.title_variant_c = prefix(metadata.title_variant_c || metadata.title);
  }
  if (publishReady) {
    publishReady.title = prefix(publishReady.title);
    publishReady.title_variant_a = prefix(publishReady.title_variant_a || publishReady.title);
    publishReady.title_variant_b = prefix(publishReady.title_variant_b || publishReady.title);
    publishReady.title_variant_c = prefix(publishReady.title_variant_c || publishReady.title);
  }
  if (bridgeRow) {
    bridgeRow.headline = prefix(bridgeRow.headline);
    bridgeRow.source_title = prefix(bridgeRow.source_title || bridgeRow.headline);
  }
}

const runtimeBootstrap = await bootstrapPhotorealRuntimeEnv(repoRoot);
let dotenv = {};
try {
  dotenv = readDotEnv(await readFile(path.join(repoRoot, ".env.local"), "utf8"));
} catch {
  dotenv = {};
}
const env = {
  ...process.env,
  ...dotenv,
  SHOTSTACK_API_KEY:
    process.env.SHOTSTACK_API_KEY
    || dotenv.SHOTSTACK_API_KEY
    || process.env.SHOTSTACK_API_TOKEN
    || dotenv.SHOTSTACK_API_TOKEN
    || "",
  N8N_API_KEY: resolveN8nApiKey({ ...dotenv, ...process.env }),
  ADR_STRICT_NON_INTERACTIVE: "true",
};
tableUrl = resolveDraftStorageApiUrl(env);
webhookUrl = resolveYoutubeBridgeWebhookUrl(env);

if (!text(env.SHOTSTACK_API_KEY)) {
  throw new Error("Missing Shotstack API key. Set SHOTSTACK_API_KEY or SHOTSTACK_API_TOKEN in env.");
}
if (!text(env.N8N_API_KEY)) {
  throw new Error("Missing storage API key. Set INTERNAL_N8N_API_KEY, ADR_INGEST_API_KEY, or N8N_API_KEY in env.");
}

await mkdir(outputRoot, { recursive: true });
const resultPath = path.join(outputRoot, "autonomous-production-test-result.json");
const validItems = await listValidProductionSourceItems(repoRoot);
const cliSourceArg = process.argv.slice(2).find((a, i, arr) => arr[i-1] === "--source");
const selected = cliSourceArg
  ? (validItems.find((item) => item.source_path.includes(cliSourceArg)) || await selectAutomaticSourceItem(repoRoot))
  : await selectAutomaticSourceItem(repoRoot);
const selectedSource = selected.payload?.payload?.question_text
  || selected.payload?.payload?.de_term
  || selected.payload?.payload?.title_de
  || selected.source_label;
const resolvedTempUploadProviders = resolveTemporaryUploadProviders().map((provider) => ({
  id: text(provider?.id),
  label: text(provider?.label),
  upload_url: text(provider?.upload_url),
}));

logAutonomousDecision("selected source item", {
  source_type: selected.source_type,
  source_id: selected.source_id,
  source_path: selected.source_path,
});
logAutonomousDecision("resolved temporary upload providers", {
  providers: resolvedTempUploadProviders.map((provider) => ({
    id: provider.id,
    host: provider.upload_url,
  })),
});

const baseResult = {
  automatic_source_pickup: true,
  selected_source_type: selected.source_type,
  selected_source_id: selected.source_id,
  selected_source_path: selected.source_path,
  selected_source_text: selectedSource,
  discovered_valid_item_count: validItems.length,
  resolved_temp_upload_providers: resolvedTempUploadProviders,
  preview_result_path: "",
  preview_pass: false,
  all_frames_pass: false,
  provider_used: "",
  provider_attempts: [],
  failed_reasons_by_frame: [],
  preview_first_failing_stage: "",
  upload_attempts: [],
  upload_failure_stage: "",
  failing_frame_id: "",
  temporary_upload_attempts_path: "",
  temporary_upload_last_error_path: "",
  video_render_path: "",
  publish_status: "blocked",
  youtube_video_url: "",
  failure_stage: "",
  uncaught_error_message: "",
};

let renderRequestArtifactPath = "";
let renderResponseArtifactPath = "";
let renderStatusPollArtifactPath = "";

try {
  if (resolvedTempUploadProviders.length < 2) {
    const error = new Error("insufficient_temporary_upload_provider_redundancy");
    error.failureStage = "startup_configuration";
    error.resolvedTempUploadProviders = resolvedTempUploadProviders;
    throw error;
  }

  let previewResultPath = "";
  let previewPass = false;
  let previewAllFramesPass = false;
  let previewProviderUsed = "";
  let previewProviderAttempts = [];
  let previewFailedReasonsByFrame = [];
  let previewFirstFailingStage = "";
  let previewUploadAttempts = [];
  let previewUploadFailureStage = "";
  let previewFailingFrameId = "";
  let previewUploadAttemptsPath = "";
  let previewUploadLastErrorPath = "";

  if (selected.source_type === "QUESTION") {
    const preview = await runStablePreviewWorkflow(selected, env, outputRoot);
    previewResultPath = preview.previewResultPath;
    previewPass = preview.previewPass;
    previewAllFramesPass = preview.allFramesPass;
    previewProviderUsed = preview.providerUsed;
    previewProviderAttempts = preview.providerAttempts;
    previewFailedReasonsByFrame = preview.failedReasonsByFrame;
    previewFirstFailingStage = preview.firstFailingStage;
    previewUploadAttempts = Array.isArray(preview.previewResult?.upload_attempts) ? preview.previewResult.upload_attempts : [];
    previewUploadFailureStage = text(preview.previewResult?.upload_failure_stage);
    previewFailingFrameId = text(preview.previewResult?.failing_frame_id);
    previewUploadAttemptsPath = text(preview.previewResult?.temporary_upload_attempts_path);
    previewUploadLastErrorPath = text(preview.previewResult?.temporary_upload_last_error_path);
    logAutonomousDecision(previewPass && previewAllFramesPass ? "stable preview workflow passed" : "stable preview workflow blocked", {
      preview_result_path: previewResultPath,
      preview_pass: previewPass,
      all_frames_pass: previewAllFramesPass,
      provider_used: previewProviderUsed,
      preview_frame_urls: Array.isArray(preview.previewResult?.preview_frame_urls)
        ? preview.previewResult.preview_frame_urls
        : [],
    });
    if (!previewPass || !previewAllFramesPass) {
      const error = new Error(
        text(preview.previewResult?.uncaught_error_message)
          || `Stable preview workflow blocked: preview_pass=${previewPass} all_frames_pass=${previewAllFramesPass}`,
      );
      error.previewResult = preview.previewResult;
      error.previewResultPath = previewResultPath;
      error.previewPass = previewPass;
      error.allFramesPass = previewAllFramesPass;
      error.providerUsed = previewProviderUsed;
      error.providerAttempts = previewProviderAttempts;
      error.failedReasonsByFrame = previewFailedReasonsByFrame;
      error.firstFailingStage = previewFirstFailingStage;
      error.uploadAttempts = previewUploadAttempts;
      error.uploadFailureStage = previewUploadFailureStage;
      error.failingFrameId = previewFailingFrameId;
      error.temporaryUploadAttemptsPath = previewUploadAttemptsPath;
      error.temporaryUploadLastErrorPath = previewUploadLastErrorPath;
      throw error;
    }
  }

  const runner = buildRunnerInvocation(selected, outputRoot, previewResultPath);
  const renderRun = runNodeScript(runner.scriptPath, runner.scriptArgs, env);
  const packageDir = renderRun.fields.output_dir;
  if (!text(packageDir)) {
    throw new Error("Render runner did not return output_dir");
  }

  const metadataPath = path.join(packageDir, "metadata.json");
  const publishReadyPath = path.join(packageDir, "publish_ready_package.json");
  const bridgeRowPath = path.join(packageDir, "g3_bridge_row.json");
  const renderTaskPath = path.join(packageDir, "render_task.json");

  const [metadata, publishReady, bridgeRow, renderTask] = await Promise.all([
    loadJson(metadataPath).catch(() => ({})),
    loadJson(publishReadyPath),
    loadJson(bridgeRowPath),
    loadJson(renderTaskPath),
  ]);

  applyTestTitlePrefix(metadata, publishReady, bridgeRow);
  await Promise.all([
    writeJson(metadataPath, metadata),
    writeJson(publishReadyPath, publishReady),
    writeJson(bridgeRowPath, bridgeRow),
  ]);

  const payload = await loadJson(path.join(packageDir, "shotstack_render_payload.json"));
  validateShotstackPayload(payload);
  renderRequestArtifactPath = await writeShotstackRenderRequestArtifact(packageDir, payload, env.SHOTSTACK_API_KEY);
  logAutonomousDecision("prepared shotstack render request", {
    shotstack_endpoint: `${shotstackApiBase}/render`,
    SHOTSTACK_API_KEY_present: Boolean(text(env.SHOTSTACK_API_KEY)),
    render_headers_has_x_api_key: Boolean(text(env.SHOTSTACK_API_KEY)),
    diagnostics_loaded_from: runtimeBootstrap.loaded_from,
    request_artifact_path: renderRequestArtifactPath,
  });
  const submit = await shotstackRequest(`${shotstackApiBase}/render`, env.SHOTSTACK_API_KEY, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  renderResponseArtifactPath = await writeShotstackRenderResponseArtifact(packageDir, {
    endpoint: `${shotstackApiBase}/render`,
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": Boolean(text(env.SHOTSTACK_API_KEY)) ? "[present]" : "",
    },
    http_status: submit.http_status,
    raw_response_body: submit.raw_response_body,
    parsed_response_body: submit.parsed_response_body,
    render_job_id: text(submit?.parsed_response_body?.response?.id || submit?.parsed_response_body?.id),
  });
  const renderId = submit?.parsed_response_body?.response?.id || submit?.parsed_response_body?.id || "";
  if (!renderId) {
    throw new Error("Shotstack submit did not return render id");
  }

  let latest = submit;
  const startedAt = Date.now();
  const pollHistory = [];
  while (Date.now() - startedAt < 8 * 60 * 1000) {
    latest = await shotstackRequest(`${shotstackApiBase}/render/${renderId}`, env.SHOTSTACK_API_KEY);
    const status = latest?.parsed_response_body?.response?.status || latest?.parsed_response_body?.status || "";
    pollHistory.push({
      endpoint: `${shotstackApiBase}/render/${renderId}`,
      method: "GET",
      http_status: latest.http_status,
      raw_response_body: latest.raw_response_body,
      parsed_response_body: latest.parsed_response_body,
      status,
      error: extractShotstackFailureDetail(latest.parsed_response_body),
      checked_at: new Date().toISOString(),
    });
    if (status === "done" || status === "failed") {
      break;
    }
    await sleep(8000);
  }
  renderStatusPollArtifactPath = await writeShotstackRenderStatusPollArtifact(packageDir, {
    render_job_id: renderId,
    statuses: pollHistory.map((entry) => entry.status),
    polls: pollHistory,
    final_status: text(latest?.parsed_response_body?.response?.status || latest?.parsed_response_body?.status || "unknown"),
    final_error: extractShotstackFailureDetail(latest?.parsed_response_body),
  });
  const renderUrl = latest?.parsed_response_body?.response?.url || latest?.parsed_response_body?.url || "";
  const renderStatus = latest?.parsed_response_body?.response?.status || latest?.parsed_response_body?.status || "unknown";
  if (renderStatus !== "done" || !renderUrl) {
    const providerError = extractShotstackFailureDetail(latest?.parsed_response_body);
    const error = new Error(`Render failed: ${renderStatus}${providerError ? ` (${providerError})` : ""}`);
    error.renderRequestArtifactPath = renderRequestArtifactPath;
    error.renderResponseArtifactPath = renderResponseArtifactPath;
    error.renderStatusPollArtifactPath = renderStatusPollArtifactPath;
    throw error;
  }

  runNodeScript(path.join(repoRoot, "scripts", "finalize-render-package.mjs"), [
    "--package-dir", packageDir,
    "--final-mp4-url", renderUrl,
    "--render-receipt", renderId,
    "--render-source-url", renderUrl,
  ], env);

  const finalBridgeRow = await loadJson(bridgeRowPath);
  await postStorageRowWithDiagnostics(finalBridgeRow, {
    endpoint: tableUrl,
    apiKey: env.N8N_API_KEY,
    diagnosticsDir: packageDir,
    rowFilePath: bridgeRowPath,
  });
  await triggerBridge({
    draftId: text(finalBridgeRow.draft_id),
    traceId: text(renderTask.trace_id),
    requestedBy: "autonomous_production_test",
  });
  const finalRow = await pollFinalRow(text(finalBridgeRow.draft_id), env.N8N_API_KEY);

  const result = {
    ...baseResult,
    preview_result_path: previewResultPath,
    preview_pass: previewPass,
    all_frames_pass: previewAllFramesPass,
    provider_used: previewProviderUsed,
    provider_attempts: previewProviderAttempts,
    failed_reasons_by_frame: previewFailedReasonsByFrame,
    preview_first_failing_stage: previewFirstFailingStage,
    upload_attempts: previewUploadAttempts,
    upload_failure_stage: previewUploadFailureStage,
    failing_frame_id: previewFailingFrameId,
    temporary_upload_attempts_path: previewUploadAttemptsPath,
    temporary_upload_last_error_path: previewUploadLastErrorPath,
    shotstack_render_request_path: renderRequestArtifactPath,
    shotstack_render_response_path: renderResponseArtifactPath,
    shotstack_render_status_poll_path: renderStatusPollArtifactPath,
    video_render_path: renderUrl,
    publish_status: text(finalRow.published_status) || "unknown",
    youtube_video_url: text(finalRow.youtube_url || "").trim() || (() => {
      const match = String(finalRow.feedback || "").match(/youtube_link=(https:\/\/\S+)/);
      return match ? match[1] : "";
    })(),
    failure_stage: "",
    uncaught_error_message: "",
  };
  await writeJson(resultPath, result);
  console.log(`RESULT_JSON=${resultPath}`);
} catch (error) {
  const result = {
    ...baseResult,
    preview_result_path: text(error?.previewResultPath),
    preview_pass: Boolean(error?.previewPass),
    all_frames_pass: Boolean(error?.allFramesPass),
    provider_used: text(error?.providerUsed),
    provider_attempts: Array.isArray(error?.providerAttempts) ? error.providerAttempts : [],
    failed_reasons_by_frame: Array.isArray(error?.failedReasonsByFrame) ? error.failedReasonsByFrame : [],
    preview_first_failing_stage: text(error?.firstFailingStage),
    upload_attempts: Array.isArray(error?.uploadAttempts) ? error.uploadAttempts : [],
    upload_failure_stage: text(error?.uploadFailureStage),
    failing_frame_id: text(error?.failingFrameId),
    temporary_upload_attempts_path: text(error?.temporaryUploadAttemptsPath),
    temporary_upload_last_error_path: text(error?.temporaryUploadLastErrorPath),
    publish_status: "blocked",
    failure_stage: text(error?.firstFailingStage) || inferFailureStage(error?.message || error),
    uncaught_error_message: text(error?.message || error),
    shotstack_render_request_path: text(error?.renderRequestArtifactPath) || renderRequestArtifactPath,
    shotstack_render_response_path: text(error?.renderResponseArtifactPath) || renderResponseArtifactPath,
    shotstack_render_status_poll_path: text(error?.renderStatusPollArtifactPath) || renderStatusPollArtifactPath,
    resolved_temp_upload_providers: Array.isArray(error?.resolvedTempUploadProviders)
      ? error.resolvedTempUploadProviders
      : resolvedTempUploadProviders,
  };
  if (text(error?.failureStage)) {
    result.failure_stage = text(error.failureStage);
  }
  await writeJson(resultPath, result);
  console.log(`RESULT_JSON=${resultPath}`);
  process.exitCode = 1;
}
