#!/usr/bin/env node

import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { postStorageRowWithDiagnostics } from "./runtime/storage-row-contract.mjs";
import { enableStrictNonInteractiveMode, logAutonomousDecision } from "./runtime/non-interactive-mode.mjs";
import { bootstrapLocalRuntimeEnv } from "./runtime/local-runtime-env.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");

function text(value) {
  return value == null ? "" : String(value).trim();
}

const DEFAULT_DRAFT_STORAGE_URL =
  text(process.env.DRAFT_STORAGE_API_URL)
  || "https://tsarents.app.n8n.cloud/api/v1/data-tables/o3VHi3uQOI2y0z1o/rows";
const DEFAULT_YOUTUBE_BRIDGE_WEBHOOK_URL =
  text(process.env.YOUTUBE_BRIDGE_WEBHOOK_URL)
  || "http://46.225.170.55:5678/webhook/adr-youtube-execution-bridge-run";

const DEFAULT_PACKAGE_DIR = path.join(
  repoRoot,
  "autonomous-production-test-runs",
  "run-1776795738021",
  "autonomous-question-1776796001654",
);
const DEFAULT_TABLE_URL = DEFAULT_DRAFT_STORAGE_URL;
const DEFAULT_WEBHOOK_URL = DEFAULT_YOUTUBE_BRIDGE_WEBHOOK_URL;

enableStrictNonInteractiveMode("run-package-youtube-publish");

function printHelp() {
  console.log(`Usage: node scripts/run-package-youtube-publish.mjs [options]

Options:
  --package-dir <dir>      Render package directory with g3_bridge_row.json
                           (default: ${DEFAULT_PACKAGE_DIR})
  --draft-id-suffix <txt>  Append a unique suffix to draft/package ids before publish
  --n8n-api-key <key>      N8N API key (or N8N_API_KEY)
  --table-url <url>        N8N table URL (default: ${DEFAULT_TABLE_URL})
  --webhook-url <url>      YouTube bridge webhook (default: ${DEFAULT_WEBHOOK_URL})
  --poll-ms <ms>           Poll interval for publish result (default: 8000)
  --timeout-ms <ms>        Publish timeout (default: 480000)
  --help                   Show this help
`);
}

function parseArgs(argv) {
  const args = {
    packageDir: DEFAULT_PACKAGE_DIR,
    draftIdSuffix: "",
    n8nApiKey: process.env.N8N_API_KEY || "",
    tableUrl: DEFAULT_TABLE_URL,
    webhookUrl: DEFAULT_WEBHOOK_URL,
    pollMs: 8000,
    timeoutMs: 8 * 60 * 1000,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === "--package-dir") args.packageDir = path.resolve(argv[++i]);
    else if (token === "--draft-id-suffix") args.draftIdSuffix = argv[++i];
    else if (token === "--n8n-api-key") args.n8nApiKey = argv[++i];
    else if (token === "--table-url") args.tableUrl = argv[++i];
    else if (token === "--webhook-url") args.webhookUrl = argv[++i];
    else if (token === "--poll-ms") args.pollMs = Number(argv[++i]) || 8000;
    else if (token === "--timeout-ms") args.timeoutMs = Number(argv[++i]) || 8 * 60 * 1000;
    else if (token === "--help" || token === "-h") {
      printHelp();
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${token}`);
    }
  }

  if (!args.n8nApiKey) {
    throw new Error("Missing N8N API key. Pass --n8n-api-key or set N8N_API_KEY.");
  }

  return args;
}

function feedbackValue(feedback, key) {
  const match = text(feedback).match(new RegExp(`${key}=([^\\s]+)`));
  return match ? text(match[1]) : "";
}

async function loadJson(filePath) {
  return JSON.parse(await readFile(filePath, "utf8"));
}

async function loadJsonWithFallback(primaryPath, fallbackPath = "") {
  try {
    return await loadJson(primaryPath);
  } catch (error) {
    if (text(fallbackPath)) {
      return loadJson(fallbackPath);
    }
    throw error;
  }
}

async function writeJson(filePath, value) {
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

async function sleep(ms) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

function buildAutoDraftSuffix() {
  const stamp = new Date().toISOString().replace(/[-:TZ.]/g, "").slice(0, 14);
  return `auto${stamp}`;
}

async function loadExistingDraftRows(draftId, args) {
  const response = await fetch(`${args.tableUrl}?limit=250`, {
    headers: { "X-N8N-API-KEY": args.n8nApiKey },
  });
  if (!response.ok) {
    throw new Error(`Storage probe failed: ${response.status} ${await response.text()}`);
  }
  const payload = await response.json();
  const rows = Array.isArray(payload?.data) ? payload.data : [];
  return rows.filter((row) => text(row.draft_id) === text(draftId));
}

function rowShowsUploadedState(row) {
  const status = text(row?.published_status);
  return status === "youtube_uploaded"
    || Boolean(text(row?.youtube_video_id))
    || Boolean(text(row?.youtube_url))
    || Boolean(feedbackValue(row?.feedback, "youtube_video_id"))
    || Boolean(feedbackValue(row?.feedback, "youtube_link"));
}

function rowShowsPriorPublishLifecycle(row) {
  const status = text(row?.published_status);
  return Boolean(status)
    || Boolean(text(row?.final_mp4_url))
    || Boolean(text(row?.youtube_video_id))
    || Boolean(text(row?.youtube_url))
    || Boolean(text(row?.feedback));
}

async function triggerBridge({ draftId, traceId, requestedBy, packagePayload }, args) {
  const payload = packagePayload && typeof packagePayload === "object"
    ? {
        ...packagePayload,
        draft_id: draftId,
        trace_id: traceId,
        source_ref: draftId,
        requested_by: requestedBy,
      }
    : {
        draft_id: draftId,
        trace_id: traceId,
        source_ref: draftId,
        requested_by: requestedBy,
      };
  const response = await fetch(args.webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
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

  const normalizedYoutubeVideoId = text(finalRow.youtube_video_id || feedbackValue(finalRow.feedback, "youtube_video_id"));
  const normalizedYoutubeUrl = text(finalRow.youtube_url || feedbackValue(finalRow.feedback, "youtube_link"));

  publishReady.youtube_video_id = normalizedYoutubeVideoId;
  publishReady.youtube_url = normalizedYoutubeUrl;
  publishReady.published_status = text(finalRow.published_status);
  bridgeRow.youtube_video_id = normalizedYoutubeVideoId;
  bridgeRow.youtube_url = normalizedYoutubeUrl;
  bridgeRow.published_status = text(finalRow.published_status);

  await Promise.all([
    writeJson(publishReadyPath, publishReady),
    writeJson(bridgeRowPath, bridgeRow),
    writeJson(summaryPath, finalRow),
  ]);
}

async function main() {
  await bootstrapLocalRuntimeEnv(repoRoot);
  const args = parseArgs(process.argv.slice(2));
  const packageDir = args.packageDir;
  const bridgeRowPath = path.join(packageDir, "g3_bridge_row.json");
  const renderTaskPath = path.join(packageDir, "render_task.json");
  const renderTaskFallbackPath = path.join(path.dirname(packageDir), "render_task.json");
  const publishReadyPath = path.join(packageDir, "publish_ready_package.json");
  const [bridgeRow, renderTask, publishReady] = await Promise.all([
    loadJson(bridgeRowPath),
    loadJsonWithFallback(renderTaskPath, renderTaskFallbackPath),
    loadJson(publishReadyPath),
  ]);

  let effectiveDraftIdSuffix = text(args.draftIdSuffix);
  if (!effectiveDraftIdSuffix) {
    const existingRows = await loadExistingDraftRows(text(bridgeRow.draft_id), args);
    if (existingRows.some((row) => rowShowsUploadedState(row) || rowShowsPriorPublishLifecycle(row))) {
      effectiveDraftIdSuffix = buildAutoDraftSuffix();
    }
  }

  if (effectiveDraftIdSuffix) {
    const nextDraftId = `${text(bridgeRow.draft_id)}-${effectiveDraftIdSuffix}`;
    bridgeRow.draft_id = nextDraftId;
    publishReady.publish_ready_id = `${text(publishReady.publish_ready_id)}-${effectiveDraftIdSuffix}`;
    publishReady.job_id = text(publishReady.job_id) ? `${text(publishReady.job_id)}-${effectiveDraftIdSuffix}` : nextDraftId;
    bridgeRow.created_at = new Date().toISOString();
    bridgeRow.published_status = "approved_for_shortform_distribution";
    bridgeRow.published_at = "";
    publishReady.published_status = "";
    publishReady.youtube_video_id = "";
    publishReady.youtube_url = "";
    await Promise.all([
      writeJson(bridgeRowPath, bridgeRow),
      writeJson(publishReadyPath, publishReady),
    ]);
  }

  if (!text(bridgeRow.final_mp4_url) && !/final_mp4_url=/.test(text(bridgeRow.feedback))) {
    throw new Error("Package does not contain final_mp4_url; pick a rendered package.");
  }

  logAutonomousDecision("selected package youtube publish", {
    package_dir: packageDir,
    draft_id: text(bridgeRow.draft_id),
    render_task_id: text(renderTask.render_task_id),
  });

  await postStorageRowWithDiagnostics(bridgeRow, {
    endpoint: args.tableUrl,
    apiKey: args.n8nApiKey,
    diagnosticsDir: packageDir,
    rowFilePath: bridgeRowPath,
  });

  await triggerBridge(
    {
      draftId: text(bridgeRow.draft_id),
      traceId: text(renderTask.trace_id || publishReady.trace_id),
      requestedBy: "run_package_youtube_publish",
      packagePayload: bridgeRow,
    },
    args,
  );

  const finalRow = await pollFinalRow(text(bridgeRow.draft_id), args);
  await stampPublishResult(packageDir, finalRow);
  const normalizedYoutubeVideoId = text(finalRow.youtube_video_id || feedbackValue(finalRow.feedback, "youtube_video_id"));
  const normalizedYoutubeUrl = text(finalRow.youtube_url || feedbackValue(finalRow.feedback, "youtube_link"));
  logAutonomousDecision("package youtube publish completed", {
    published_status: text(finalRow.published_status),
    youtube_url: normalizedYoutubeUrl,
  });

  console.log(`PACKAGE_DIR=${packageDir}`);
  console.log(`DRAFT_ID=${text(bridgeRow.draft_id)}`);
  console.log(`PUBLISHED_STATUS=${text(finalRow.published_status)}`);
  console.log(`YOUTUBE_URL=${normalizedYoutubeUrl}`);
  console.log(`YOUTUBE_VIDEO_ID=${normalizedYoutubeVideoId}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
