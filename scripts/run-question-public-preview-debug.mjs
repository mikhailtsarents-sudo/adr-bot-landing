#!/usr/bin/env node

import dns from "node:dns/promises";
import http from "node:http";
import https from "node:https";
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { bootstrapPhotorealRuntimeEnv } from "./runtime/photoreal-runtime-env.mjs";
import { enableStrictNonInteractiveMode, logAutonomousDecision } from "./runtime/non-interactive-mode.mjs";
import { uploadFileToTemporaryHost } from "./runtime/temporary-upload.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");

const DEFAULT_INPUT_PATH = path.join(
  repoRoot,
  "examples",
  "question-batch-wave-1",
  "q-test-001-driver-documents.json",
);
const DEFAULT_OUTPUT_ROOT = "/tmp/question-public-preview-debug";
const DEFAULT_FIXED_SCENARIO = "scenario_license";
const DEFAULT_MAX_ATTEMPTS = 4;
const DEFAULT_PREVIEW_COUNT = 5;
const DEFAULT_NODE_EGRESS_TIMEOUT_MS = 5000;
const DEFAULT_SMOKE_PROVIDER_PRIORITY = "external_fallback_1,openai_primary,external_fallback_2";
const DEFAULT_SMOKE_VALIDATION_PROVIDER_PRIORITY = "openai_primary";
const DEFAULT_SMOKE_FRAME_TIMEOUT_MS = 70000;
const DEFAULT_SMOKE_PROVIDER_TIMEOUT_MS = 210000;

enableStrictNonInteractiveMode("run-question-public-preview-debug");

function printHelp() {
  console.log(`Usage: node scripts/run-question-public-preview-debug.mjs [options]

Options:
  --input <file>            QUESTION source JSON (default: ${DEFAULT_INPUT_PATH})
  --output-root <dir>       Output root for preview packages (default: ${DEFAULT_OUTPUT_ROOT})
  --fixed-scenario <id>     Fixed scenario id (default: ${DEFAULT_FIXED_SCENARIO})
  --variation-type <value>  Optional variation type override
  --variation-value <value> Optional variation value override
  --variation-payload <j>   Optional variation payload JSON
  --preview-count <n>       Number of preview frames (default: ${DEFAULT_PREVIEW_COUNT})
  --max-attempts <n>        Max regeneration attempts (default: ${DEFAULT_MAX_ATTEMPTS})
  --verify-remote           Verify generated asset URL before building previews
  --keep-temp               Keep temp files
  --batched-provider-probe-only  Run only the batched multi-image provider probe from this launcher
  --probe-timeout-ms <n>    Timeout for batched provider probe (default: 180000)
  --single-scene-generation-probe-only  Run only the single-scene generation probe from this launcher
  --help                    Show this help
`);
}

function parseArgs(argv) {
  const args = {
    inputPath: DEFAULT_INPUT_PATH,
    outputRoot: DEFAULT_OUTPUT_ROOT,
    fixedScenario: DEFAULT_FIXED_SCENARIO,
    variationType: "",
    variationValue: "",
    variationPayload: null,
    previewCount: DEFAULT_PREVIEW_COUNT,
    maxAttempts: DEFAULT_MAX_ATTEMPTS,
    verifyRemote: false,
    keepTemp: false,
    batchedProviderProbeOnly: false,
    probeTimeoutMs: 180000,
    singleSceneGenerationProbeOnly: false,
    smokeProviderPriority: DEFAULT_SMOKE_PROVIDER_PRIORITY,
    smokeValidationProviderPriority: DEFAULT_SMOKE_VALIDATION_PROVIDER_PRIORITY,
    smokeDisableProviders: "",
    smokeFrameTimeoutMs: DEFAULT_SMOKE_FRAME_TIMEOUT_MS,
    smokeProviderTimeoutMs: DEFAULT_SMOKE_PROVIDER_TIMEOUT_MS,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === "--input") args.inputPath = path.resolve(argv[++i]);
    else if (token === "--output-root") args.outputRoot = path.resolve(argv[++i]);
    else if (token === "--fixed-scenario") args.fixedScenario = argv[++i];
    else if (token === "--variation-type") args.variationType = argv[++i];
    else if (token === "--variation-value") args.variationValue = argv[++i];
    else if (token === "--variation-payload") args.variationPayload = JSON.parse(argv[++i]);
    else if (token === "--preview-count") args.previewCount = Math.max(3, Math.min(5, Number(argv[++i]) || DEFAULT_PREVIEW_COUNT));
    else if (token === "--max-attempts") args.maxAttempts = Math.max(1, Number(argv[++i]) || DEFAULT_MAX_ATTEMPTS);
    else if (token === "--verify-remote") args.verifyRemote = true;
    else if (token === "--keep-temp") args.keepTemp = true;
    else if (token === "--batched-provider-probe-only") args.batchedProviderProbeOnly = true;
    else if (token === "--probe-timeout-ms") args.probeTimeoutMs = Math.max(1000, Number(argv[++i]) || 180000);
    else if (token === "--single-scene-generation-probe-only") args.singleSceneGenerationProbeOnly = true;
    else if (token === "--smoke-provider-priority") args.smokeProviderPriority = text(argv[++i]) || DEFAULT_SMOKE_PROVIDER_PRIORITY;
    else if (token === "--smoke-validation-provider-priority") args.smokeValidationProviderPriority = text(argv[++i]) || DEFAULT_SMOKE_VALIDATION_PROVIDER_PRIORITY;
    else if (token === "--smoke-disable-providers") args.smokeDisableProviders = text(argv[++i]);
    else if (token === "--smoke-frame-timeout-ms") args.smokeFrameTimeoutMs = Math.max(1000, Number(argv[++i]) || DEFAULT_SMOKE_FRAME_TIMEOUT_MS);
    else if (token === "--smoke-provider-timeout-ms") args.smokeProviderTimeoutMs = Math.max(args.smokeFrameTimeoutMs, Number(argv[++i]) || DEFAULT_SMOKE_PROVIDER_TIMEOUT_MS);
    else if (token === "--help" || token === "-h") {
      printHelp();
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${token}`);
    }
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
      if (idx > 0) acc[line.slice(0, idx)] = line.slice(idx + 1);
      return acc;
    }, {});
}

function runNodeScript(scriptPath, scriptArgs, envOverrides = {}) {
  const result = spawnSync(process.execPath, [scriptPath, ...scriptArgs], {
    cwd: repoRoot,
    encoding: "utf8",
    stdio: "pipe",
    maxBuffer: 20 * 1024 * 1024,
    env: {
      ...process.env,
      ...envOverrides,
    },
  });

  const parsedFields = parseKeyValueOutput(result.stdout || "");
  if (result.status !== 0) {
    const error = new Error(
      [
        `Script failed: ${path.basename(scriptPath)}`,
        result.stdout?.trim() ? `stdout:\n${result.stdout.trim()}` : null,
        result.stderr?.trim() ? `stderr:\n${result.stderr.trim()}` : null,
      ]
        .filter(Boolean)
        .join("\n"),
    );
    error.scriptPath = scriptPath;
    error.scriptArgs = scriptArgs;
    error.scriptStdout = result.stdout || "";
    error.scriptStderr = result.stderr || "";
    error.scriptFields = parsedFields;
    error.exitStatus = result.status;
    throw error;
  }

  return {
    stdout: result.stdout || "",
    fields: parsedFields,
  };
}

async function fetchRemoteUrlStatus(url) {
  try {
    const response = await fetch(url, { method: "HEAD" });
    return response.status || 0;
  } catch {}
  try {
    const response = await fetch(url, { method: "GET" });
    return response.status || 0;
  } catch {
    return 0;
  }
}

function buildBlockedProviderConfigResult(providerConfiguration) {
  return {
    status: "blocked",
    preview_frame_urls: [],
    provider_used: "",
    provider_attempts: [],
    first_failing_stage: "generation",
    all_frames_pass: false,
    per_frame_pass: [],
    failed_reasons_by_frame: [],
    photoreal_debug_rollup_path: "",
    upload_attempts: [],
    upload_failure_stage: "",
    failing_frame_id: "",
    temporary_upload_attempts_path: "",
    temporary_upload_last_error_path: "",
    reason: text(providerConfiguration?.reason),
    provider_configuration_diagnostics: Array.isArray(providerConfiguration?.provider_configuration_diagnostics)
      ? providerConfiguration.provider_configuration_diagnostics
      : [],
  };
}

function buildConfiguredPhotorealProviderEndpoints() {
  const openAiKey = text(process.env.OPENAI_API_KEY || process.env.OPENAI_API_TOKEN);
  return [
    {
      provider_id: "openai_primary",
      endpoint_url: "https://api.openai.com/v1/images/generations",
      configured: Boolean(openAiKey),
    },
    {
      provider_id: "external_fallback_1",
      endpoint_url: text(process.env.QUESTION_PHOTOREAL_FALLBACK_1_URL),
      configured: Boolean(text(process.env.QUESTION_PHOTOREAL_FALLBACK_1_URL)),
    },
    {
      provider_id: "external_fallback_2",
      endpoint_url: text(process.env.QUESTION_PHOTOREAL_FALLBACK_2_URL),
      configured: Boolean(text(process.env.QUESTION_PHOTOREAL_FALLBACK_2_URL)),
    },
  ].filter((provider) => provider.configured && provider.endpoint_url);
}

function classifyNodeEgressFailure(diagnostic) {
  if (!diagnostic.dns_ok) return "dns";
  if (!diagnostic.connect_ok) return "connect";
  if (String(diagnostic.endpoint_url).startsWith("https://") && !diagnostic.tls_ok) return "tls";
  return "unknown";
}

function withNodeTimeout(promiseFactory, timeoutMs, onTimeout) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      try {
        onTimeout?.();
      } catch {}
      const error = new Error(`node egress timeout after ${timeoutMs}ms`);
      error.code = "TIMEOUT";
      reject(error);
    }, timeoutMs);

    promiseFactory()
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((error) => {
        clearTimeout(timer);
        reject(error);
      });
  });
}

async function runNodeEgressCheckForProvider(provider, timeoutMs) {
  const diagnostic = {
    provider_id: provider.provider_id,
    endpoint_url: provider.endpoint_url,
    dns_ok: false,
    connect_ok: false,
    tls_ok: false,
    http_response_received: false,
    probe_method: "",
    endpoint_method_not_supported: false,
    auth_required_but_reachable: false,
    status: null,
    elapsed_ms: 0,
  };
  const startedAt = Date.now();
  const parsed = new URL(provider.endpoint_url);
  const requestClient = parsed.protocol === "https:" ? https : http;

  try {
    await dns.lookup(parsed.hostname);
    diagnostic.dns_ok = true;
  } catch {
    diagnostic.elapsed_ms = Date.now() - startedAt;
    return diagnostic;
  }

  try {
    const methodsToTry = ["OPTIONS", "GET"];
    let lastError = null;

    for (const method of methodsToTry) {
      diagnostic.probe_method = method;
      try {
        await withNodeTimeout(
          () =>
            new Promise((resolve, reject) => {
              const req = requestClient.request(
                parsed,
                {
                  method,
                },
                (res) => {
                  diagnostic.http_response_received = true;
                  diagnostic.status = res.statusCode || null;
                  diagnostic.endpoint_method_not_supported = res.statusCode === 405;
                  diagnostic.auth_required_but_reachable = res.statusCode === 401 || res.statusCode === 403;
                  res.resume();
                  resolve();
                },
              );

              req.on("socket", (socket) => {
                socket.once("connect", () => {
                  diagnostic.connect_ok = true;
                });
                if (parsed.protocol === "https:") {
                  socket.once("secureConnect", () => {
                    diagnostic.tls_ok = true;
                  });
                } else {
                  diagnostic.tls_ok = true;
                }
              });
              req.once("error", reject);
              req.end();
            }),
          timeoutMs,
          undefined,
        );

        if (diagnostic.http_response_received) {
          break;
        }
      } catch (error) {
        lastError = error;
      }
    }

    if (!diagnostic.http_response_received && lastError) {
      throw lastError;
    }
  } catch {
    diagnostic.elapsed_ms = Date.now() - startedAt;
    return diagnostic;
  }

  diagnostic.elapsed_ms = Date.now() - startedAt;
  return diagnostic;
}

async function runNodePhotorealEgressPreflight(outputRoot, timeoutMs = DEFAULT_NODE_EGRESS_TIMEOUT_MS) {
  const configuredProviders = buildConfiguredPhotorealProviderEndpoints();
  const diagnostics = [];
  for (const provider of configuredProviders) {
    diagnostics.push(await runNodeEgressCheckForProvider(provider, timeoutMs));
  }

  const usableProviders = diagnostics.filter(
    (item) =>
      item.dns_ok &&
      item.connect_ok &&
      item.tls_ok &&
      item.http_response_received &&
      (
        item.status == null ||
        [200, 201, 202, 204, 401, 403, 404, 405].includes(item.status)
      ),
  );
  const artifact = {
    diagnostics,
    pass: usableProviders.length > 0,
    reason: usableProviders.length > 0 ? "" : "node_egress_unavailable",
  };

  const artifactPath = path.join(outputRoot, "photoreal-node-egress-check.json");
  await mkdir(outputRoot, { recursive: true });
  await writeJson(artifactPath, artifact);
  return {
    ...artifact,
    artifact_path: artifactPath,
    failing_layer: diagnostics.length > 0 ? classifyNodeEgressFailure(diagnostics[0]) : "unknown",
  };
}

function buildBlockedNodeEgressResult(egressCheck) {
  return {
    status: "blocked",
    preview_frame_urls: [],
    provider_used: "",
    provider_attempts: [],
    first_failing_stage: "generation",
    all_frames_pass: false,
    per_frame_pass: [],
    failed_reasons_by_frame: [],
    photoreal_debug_rollup_path: "",
    reason: "node_egress_unavailable",
    node_egress_check_path: text(egressCheck?.artifact_path),
    node_egress_diagnostics: Array.isArray(egressCheck?.diagnostics) ? egressCheck.diagnostics : [],
    failing_layer: text(egressCheck?.failing_layer) || "unknown",
  };
}

async function writeSharedRuntimeDiagnostics(outputRoot, diagnostics) {
  const artifactPath = path.join(outputRoot, "photoreal-runtime-diagnostics.json");
  await mkdir(outputRoot, { recursive: true });
  await writeJson(artifactPath, diagnostics);
  return artifactPath;
}

async function findLatestFullSmokeRuntimeDiagnostics() {
  const previewRunsRoot = path.join(repoRoot, "preview-smoke-runs");
  let entries = [];
  try {
    entries = await readdir(previewRunsRoot, { withFileTypes: true });
  } catch {
    return "";
  }

  const candidates = entries
    .filter((entry) => entry.isDirectory() && entry.name.startsWith("full-smoke-"))
    .map((entry) => path.join(previewRunsRoot, entry.name, "photoreal-runtime-diagnostics.json"))
    .sort();

  return candidates.length > 0 ? candidates[candidates.length - 1] : "";
}

function runtimePresenceSnapshot(diagnostics) {
  return {
    OPENAI_API_KEY_present: Boolean(diagnostics?.OPENAI_API_KEY_present),
    OPENAI_API_TOKEN_present: Boolean(diagnostics?.OPENAI_API_TOKEN_present),
    QUESTION_PHOTOREAL_FALLBACK_1_URL_present: Boolean(diagnostics?.QUESTION_PHOTOREAL_FALLBACK_1_URL_present),
    QUESTION_PHOTOREAL_FALLBACK_1_TOKEN_present: Boolean(diagnostics?.QUESTION_PHOTOREAL_FALLBACK_1_TOKEN_present),
    QUESTION_PHOTOREAL_FALLBACK_1_MODEL_present: Boolean(diagnostics?.QUESTION_PHOTOREAL_FALLBACK_1_MODEL_present),
  };
}

function runtimePresenceMatches(a, b) {
  const left = runtimePresenceSnapshot(a);
  const right = runtimePresenceSnapshot(b);
  return Object.keys(left).every((key) => left[key] === right[key]);
}

async function runBatchedProviderProbeOnly(args) {
  const { probePhotorealBatchedProviders } = await import("./render/question-photoreal-generator.mjs");
  const baselinePath = await findLatestFullSmokeRuntimeDiagnostics();
  let baselineDiagnostics = null;
  if (baselinePath) {
    try {
      baselineDiagnostics = await loadJson(baselinePath);
    } catch {
      baselineDiagnostics = null;
    }
  }

  if (baselineDiagnostics && !runtimePresenceMatches(args.runtimeDiagnostics, baselineDiagnostics)) {
    const blockedResult = {
      reason: "runtime_env_mismatch",
      shared_runtime_diagnostics_path: args.runtimeDiagnosticsPath,
      baseline_runtime_diagnostics_path: baselinePath,
      current_runtime_presence: runtimePresenceSnapshot(args.runtimeDiagnostics),
      baseline_runtime_presence: runtimePresenceSnapshot(baselineDiagnostics),
      providers: [],
    };
    const outputPath = path.join(args.outputRoot, "photoreal-batched-provider-probe.json");
    await writeJson(outputPath, blockedResult);
    console.log(`runtime_diagnostics_json=${args.runtimeDiagnosticsPath}`);
    console.log(`probe_json=${outputPath}`);
    return;
  }

  const result = await probePhotorealBatchedProviders({
    questionText: "Where is your driver's license?",
    timeoutMs: args.probeTimeoutMs,
  });
  const outputPath = path.join(args.outputRoot, "photoreal-batched-provider-probe.json");
  await writeJson(outputPath, result);

  console.log(`runtime_diagnostics_json=${args.runtimeDiagnosticsPath}`);
  console.log(`probe_json=${outputPath}`);
  for (const provider of Array.isArray(result.providers) ? result.providers : []) {
    console.log(
      [
        "summary",
        `provider_id=${provider.provider_id}`,
        `available=${provider.available}`,
        `why_unavailable=${text(provider.why_unavailable) || "none"}`,
        `supports_multi_image_generation=${provider.supports_multi_image_generation === true}`,
        `result=${text(provider.result) || "invalid_response"}`,
        `status=${provider.http_status == null ? "n/a" : provider.http_status}`,
        `image_count_returned=${provider.image_count_returned ?? 0}`,
        `elapsed_ms=${provider.elapsed_ms ?? 0}`,
      ].join(" "),
    );
  }
}

async function runSingleSceneGenerationProbeOnly(args) {
  const { buildPhotorealProviderProbeRequests, probePhotorealProviders } = await import("./render/question-photoreal-generator.mjs");
  const probeEntries = buildPhotorealProviderProbeRequests({
    questionText: "Where is your driver's license?",
  }).filter((entry) => (
    ["openai_primary", "external_fallback_1"].includes(text(entry?.provider?.id)) &&
    Boolean(entry?.provider?.available)
  ));

  const requestBodyDebugPathByProvider = {};
  for (const entry of probeEntries) {
    const providerId = text(entry?.provider?.id);
    const debugPath = path.join(args.outputRoot, `${providerId}-scene1.request.json`);
    await writeJson(debugPath, {
      provider_id: providerId,
      provider_kind: text(entry?.provider?.kind),
      request_url: text(entry?.request?.url),
      request_body: entry?.request?.body || {},
    });
    requestBodyDebugPathByProvider[providerId] = debugPath;
  }

  const probeResult = await probePhotorealProviders({
    questionText: "Where is your driver's license?",
    timeoutMs: 60000,
  });

  const artifact = {
    timeout_ms: 60000,
    providers: (Array.isArray(probeResult?.providers) ? probeResult.providers : [])
      .filter((provider) => ["openai_primary", "external_fallback_1"].includes(text(provider?.provider_id)))
      .filter((provider) => Boolean(provider?.available))
      .map((provider) => ({
        provider_id: provider.provider_id,
        available: Boolean(provider.available),
        request_url: text(provider.request_url),
        timeout_ms: Number(provider.timeout_ms) || 60000,
        elapsed_ms: Number(provider.elapsed_ms) || 0,
        http_status: provider.http_status == null ? null : provider.http_status,
        result: text(provider.result) || "invalid_response",
        first_1000_chars_of_response_body: text(provider.first_1000_chars_of_response_body).slice(0, 1000),
        request_body_debug_path: text(requestBodyDebugPathByProvider[provider.provider_id]),
      })),
  };

  const outputPath = path.join(args.outputRoot, "photoreal-single-scene-generation-probe.json");
  await writeJson(outputPath, artifact);

  console.log(`probe_json=${outputPath}`);
  for (const provider of artifact.providers) {
    console.log(
      [
        "summary",
        `provider_id=${provider.provider_id}`,
        `available=${provider.available}`,
        `result=${text(provider.result) || "invalid_response"}`,
        `status=${provider.http_status == null ? "n/a" : provider.http_status}`,
        `elapsed_ms=${provider.elapsed_ms ?? 0}`,
      ].join(" "),
    );
  }
}

function collectVisualValidationIssues({ generatedVisual, manifest }) {
  const issues = [];
  const validation = manifest?.real_scene_validation || {};

  if (!generatedVisual?.preview_pass) issues.push("preview_pass_false");
  if (generatedVisual?.fallback_used) issues.push("fallback_used");
  if (validation.pass === false) issues.push("real_scene_validation_failed");
  if (!validation.preview_pass) issues.push("validation_preview_pass_false");
  if (!validation.all_frames_pass) issues.push("all_frames_pass_false");
  if (!validation.human_presence && !validation.driver_present && !validation.inspector_present) issues.push("human_presence_missing");
  if (!validation.face_present) issues.push("face_missing");
  if (!validation.hands_present) issues.push("hands_missing");
  if (!validation.context_present) issues.push("context_missing");
  return issues;
}

async function validatePackageForRealScene(packageDir) {
  const generatedVisual = await loadJson(path.join(packageDir, "generated_visual.json"));
  const manifest = await loadJson(generatedVisual.manifest_path);
  const issues = collectVisualValidationIssues({ generatedVisual, manifest });
  return {
    pass: issues.length === 0,
    issues,
    generatedVisual,
    manifest,
  };
}

async function generateSinglePackage(args, attempt) {
  const attemptTag = `a${String(attempt).padStart(2, "0")}`;
  const baseVariationType = text(args.variationType) || "single_preview_debug";
  const baseVariationValue = text(args.variationValue) || `real_scene_${args.fixedScenario}`;
  const slug = [
    slugify(args.fixedScenario),
    "preview",
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
    "unlisted",
  ];
  if (args.variationPayload) {
    scriptArgs.push("--variation-payload", JSON.stringify(args.variationPayload));
  }
  if (args.verifyRemote) {
    scriptArgs.push("--verify-remote");
  }
  if (args.keepTemp) {
    scriptArgs.push("--keep-temp");
  }

  const result = runNodeScript(
    path.join(repoRoot, "scripts", "run-question-render-package.mjs"),
    scriptArgs,
    {
      QUESTION_PHOTOREAL_PROVIDER_PRIORITY: text(args.smokeProviderPriority),
      QUESTION_PHOTOREAL_VALIDATION_PROVIDER_PRIORITY: text(args.smokeValidationProviderPriority),
      QUESTION_PHOTOREAL_DISABLED_PROVIDERS: text(args.smokeDisableProviders),
      QUESTION_PHOTOREAL_FRAME_TIMEOUT_MS: String(args.smokeFrameTimeoutMs),
      QUESTION_PHOTOREAL_PROVIDER_TIMEOUT_MS: String(args.smokeProviderTimeoutMs),
    },
  );
  const packageDir = result.fields.output_dir;
  if (!text(packageDir)) {
    throw new Error("run-question-render-package did not return output_dir");
  }
  const validation = await validatePackageForRealScene(packageDir);
  return { attempt, packageDir, validation };
}

async function buildValidatedPreviewSet(packageDir, generatedVisual, manifest, count) {
  const sceneFrames = Array.isArray(generatedVisual?.scene_frame_manifest)
    ? generatedVisual.scene_frame_manifest.map((entry, index) => ({
        id: text(entry?.canonical_id) || `scene${index + 1}`,
        scene_index: Number(entry?.scene_index) || index + 1,
        role: text(entry?.role),
        local_path: text(entry?.local_path),
        provider_id: text(entry?.provider_id),
      }))
    : [];
  const manifestAligned =
    sceneFrames.length >= count &&
    sceneFrames.every((entry, index) => entry.id === `scene${index + 1}`) &&
    sceneFrames.every((entry) => text(entry.local_path) && text(entry.provider_id));
  const accepted = manifestAligned ? sceneFrames.slice(0, count) : [];
  const validationFrames = Array.isArray(manifest?.real_scene_validation?.vision_frames)
    ? manifest.real_scene_validation.vision_frames
    : [];
  const pass =
    manifestAligned &&
    Boolean(generatedVisual?.preview_pass) &&
    Boolean(manifest?.real_scene_validation?.preview_pass) &&
    Boolean(manifest?.real_scene_validation?.all_frames_pass) &&
    accepted.length >= count;
  return {
    analyzed: validationFrames,
    accepted,
    pass,
  };
}

async function uploadAndValidatePreviews(previews, diagnosticsDir) {
  const urls = [];
  for (const preview of previews) {
    const upload = await uploadFileToTemporaryHost(preview.local_path, {
      diagnosticsDir,
      frameId: text(preview.id) || path.basename(preview.local_path),
    });
    const url = upload.uploadedUrl;
    const status = await fetchRemoteUrlStatus(url);
    if (status !== 200) {
      throw new Error(`Preview URL did not validate with HTTP 200: ${url} status=${status}`);
    }
    urls.push(url);
  }
  return urls;
}

async function pathExists(filePath) {
  try {
    await readFile(filePath);
    return true;
  } catch {
    return false;
  }
}

async function enrichBlockedResultFromArtifacts(blockedResult, candidatePaths) {
  const generatedVisualPath = candidatePaths.find((value) => text(value).endsWith("generated_visual.json") && Boolean(value));
  const packageDir = candidatePaths.find((value) => Boolean(value) && !text(value).endsWith("generated_visual.json")) || "";

  if (generatedVisualPath && (await pathExists(generatedVisualPath))) {
    try {
      const generatedVisual = await loadJson(generatedVisualPath);
      const manifestPath = text(generatedVisual?.manifest_path);
      const manifest = manifestPath && (await pathExists(manifestPath))
        ? await loadJson(manifestPath)
        : null;
      const realSceneValidation = manifest?.real_scene_validation || {};

      blockedResult.provider_used = text(generatedVisual?.provider_used || realSceneValidation?.provider_used);
      blockedResult.provider_attempts = Array.isArray(generatedVisual?.provider_attempts)
        ? generatedVisual.provider_attempts
        : Array.isArray(realSceneValidation?.provider_attempts)
          ? realSceneValidation.provider_attempts
          : [];
      blockedResult.all_frames_pass = Boolean(realSceneValidation?.all_frames_pass);
      blockedResult.per_frame_pass = Array.isArray(realSceneValidation?.per_frame_pass)
        ? realSceneValidation.per_frame_pass
        : [];
      blockedResult.failed_reasons_by_frame = Array.isArray(realSceneValidation?.failed_reasons_by_frame)
        ? realSceneValidation.failed_reasons_by_frame
        : [];
      blockedResult.photoreal_debug_rollup_path = text(
        generatedVisual?.photoreal_debug_rollup_path ||
        realSceneValidation?.photoreal_debug_rollup_path,
      );
    } catch {}
  }

  if (packageDir) {
    const uploadAttemptsPath = path.join(packageDir, "temporary-upload-attempts.json");
    const uploadLastErrorPath = path.join(packageDir, "temporary-upload-last-error.json");
    try {
      if (await pathExists(uploadAttemptsPath)) {
        const uploadAttempts = await loadJson(uploadAttemptsPath);
        blockedResult.upload_attempts = Array.isArray(uploadAttempts?.uploads) ? uploadAttempts.uploads : [];
        blockedResult.temporary_upload_attempts_path = uploadAttemptsPath;
      }
      if (await pathExists(uploadLastErrorPath)) {
        const lastError = await loadJson(uploadLastErrorPath);
        blockedResult.upload_failure_stage = text(lastError?.upload_failure_stage);
        blockedResult.failing_frame_id = text(lastError?.frame_id);
        blockedResult.temporary_upload_last_error_path = uploadLastErrorPath;
      }
    } catch {}
  }

  if (!text(blockedResult.first_failing_stage)) {
    blockedResult.first_failing_stage =
      text(blockedResult.provider_attempts?.[0]?.failure_stage) ||
      text(blockedResult.upload_failure_stage) ||
      "generation";
  }

  return blockedResult;
}

async function writeBlockedResultFromError(args, error) {
  const generatedVisualPath = text(error?.scriptFields?.generated_visual);
  const outputDir = text(error?.scriptFields?.output_dir);
  const fallbackGeneratedVisualPath = outputDir
    ? path.join(outputDir, "generated_visual.json")
    : "";
  const resultPath = path.join(args.outputRoot, "public_preview_result.json");

  const blockedResult = {
    status: "blocked",
    preview_frame_urls: [],
    provider_used: "",
    provider_attempts: [],
    first_failing_stage: "generation",
    all_frames_pass: false,
    per_frame_pass: [],
    failed_reasons_by_frame: [],
    photoreal_debug_rollup_path: "",
    upload_attempts: [],
    upload_failure_stage: "",
    failing_frame_id: "",
    temporary_upload_attempts_path: "",
    temporary_upload_last_error_path: "",
    uncaught_error_message: text(error?.message || error),
  };

  const uncaughtMessage = text(error?.message || error).toLowerCase();
  if (
    uncaughtMessage.includes("raster validation exhausted") ||
    uncaughtMessage.includes("empty_validator_output") ||
    uncaughtMessage.includes("raster vision validation")
  ) {
    blockedResult.first_failing_stage = "validator";
  }

  await enrichBlockedResultFromArtifacts(blockedResult, [
    generatedVisualPath,
    fallbackGeneratedVisualPath,
    outputDir,
  ]);

  if (!Array.isArray(blockedResult.provider_attempts)) {
    blockedResult.provider_attempts = [];
  }

  await mkdir(args.outputRoot, { recursive: true });
  await writeJson(resultPath, blockedResult);
  return resultPath;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  logAutonomousDecision("selected preview smoke settings", {
    input_path: args.inputPath,
    fixed_scenario: args.fixedScenario,
    smoke_provider_priority: args.smokeProviderPriority,
    smoke_validation_provider_priority: args.smokeValidationProviderPriority,
  });
  try {
    const runtimeDiagnostics = await bootstrapPhotorealRuntimeEnv(repoRoot);
    runtimeDiagnostics.launcher_script_path = __filename;
    const runtimeDiagnosticsPath = await writeSharedRuntimeDiagnostics(args.outputRoot, runtimeDiagnostics);
    args.runtimeDiagnostics = runtimeDiagnostics;
    args.runtimeDiagnosticsPath = runtimeDiagnosticsPath;

    if (args.batchedProviderProbeOnly) {
      await runBatchedProviderProbeOnly(args);
      return;
    }
    if (args.singleSceneGenerationProbeOnly) {
      await runSingleSceneGenerationProbeOnly(args);
      return;
    }

    const { inspectPhotorealProviderConfiguration } = await import("./render/question-photoreal-generator.mjs");
    const providerConfiguration = inspectPhotorealProviderConfiguration({
      requireConfiguredFallbackForSmokeRun: true,
    });
    if (!providerConfiguration.pass) {
      const blockedResult = buildBlockedProviderConfigResult(providerConfiguration);
      const resultPath = path.join(args.outputRoot, "public_preview_result.json");
      await mkdir(args.outputRoot, { recursive: true });
      await writeJson(resultPath, blockedResult);
      console.log(JSON.stringify(blockedResult, null, 2));
      return;
    }

    const nodeEgressCheck = await runNodePhotorealEgressPreflight(args.outputRoot);
    if (!nodeEgressCheck.pass) {
      const blockedResult = buildBlockedNodeEgressResult(nodeEgressCheck);
      const resultPath = path.join(args.outputRoot, "public_preview_result.json");
      await writeJson(resultPath, blockedResult);
      console.log(JSON.stringify(blockedResult, null, 2));
      return;
    }

    let selected = null;
    let selectedPreviewSet = null;

    for (let attempt = 1; attempt <= args.maxAttempts; attempt += 1) {
      const candidate = await generateSinglePackage(args, attempt);
      if (!candidate.validation.pass) {
        continue;
      }
      const previewSet = await buildValidatedPreviewSet(
        candidate.packageDir,
        candidate.validation.generatedVisual,
        candidate.validation.manifest,
        args.previewCount,
      );
      if (previewSet.pass) {
        selected = candidate;
        selectedPreviewSet = previewSet;
        logAutonomousDecision("validator passed", {
          package_dir: candidate.packageDir,
          accepted_frames: selectedPreviewSet.accepted.length,
        });
        break;
      }
    }

    if (!selected) {
      throw new Error("No preview attempt passed final raster realism validation.");
    }

    const manifest = selected.validation.manifest;
    const previewUrls = await uploadAndValidatePreviews(selectedPreviewSet.accepted, selected.packageDir);

    const response = {
      preview_frame_urls: previewUrls,
      validation: {
        preview_pass: Boolean(manifest?.real_scene_validation?.preview_pass),
        all_frames_pass: Boolean(manifest?.real_scene_validation?.all_frames_pass),
        per_frame_pass: Array.isArray(manifest?.real_scene_validation?.per_frame_pass)
          ? manifest.real_scene_validation.per_frame_pass
          : [],
        failed_reasons_by_frame: Array.isArray(manifest?.real_scene_validation?.failed_reasons_by_frame)
          ? manifest.real_scene_validation.failed_reasons_by_frame
          : [],
        context_present: Boolean(manifest?.real_scene_validation?.context_present),
        human_presence: Boolean(manifest?.real_scene_validation?.human_presence),
        driver_present: Boolean(manifest?.real_scene_validation?.driver_present),
        inspector_present: Boolean(manifest?.real_scene_validation?.inspector_present),
        face_present: Boolean(manifest?.real_scene_validation?.face_present),
        hands_present: Boolean(manifest?.real_scene_validation?.hands_present),
        document_present: Boolean(manifest?.real_scene_validation?.document_present),
        car_interior_present_any: Boolean(manifest?.real_scene_validation?.car_interior_present_any),
        vehicle_context_present_any: Boolean(manifest?.real_scene_validation?.vehicle_context_present_any),
        provider_used: text(manifest?.real_scene_validation?.provider_used),
        provider_attempts: Array.isArray(manifest?.real_scene_validation?.provider_attempts)
          ? manifest.real_scene_validation.provider_attempts
          : [],
      },
    };

    await writeJson(path.join(selected.packageDir, "public_preview_result.json"), response);
    console.log(JSON.stringify(response, null, 2));
  } catch (error) {
    const argsForFailure = typeof args === "object" && args ? args : { outputRoot: DEFAULT_OUTPUT_ROOT };
    const resultPath = await writeBlockedResultFromError(argsForFailure, error);
    const blockedResult = await loadJson(resultPath);
    console.log(JSON.stringify(blockedResult, null, 2));
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
