#!/usr/bin/env node

import { cp, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");

const DEFAULT_TABLE_URL = "https://tsarents.app.n8n.cloud/api/v1/data-tables/o3VHi3uQOI2y0z1o/rows";
const DEFAULT_WEBHOOK_URL = "https://tsarents.app.n8n.cloud/webhook/adr-youtube-execution-bridge-run";

function parseArgs(argv) {
  const args = {
    sourcePackageDir: "",
    rawVideoUrl: "",
    assUrl: "",
    draftId: "",
    traceId: "",
    renderTaskId: "",
    publishReadyId: "",
    requestedBy: "codex_question_heygen_avatar_live",
    n8nApiKey: process.env.N8N_API_KEY || "",
    shotstackApiKey: process.env.SHOTSTACK_API_KEY || "",
    tableUrl: DEFAULT_TABLE_URL,
    webhookUrl: DEFAULT_WEBHOOK_URL,
    apiBase: "https://api.shotstack.io/stage",
    runRoot: "/tmp/question-heygen-avatar-live",
    pollMs: 8000,
    timeoutMs: 8 * 60 * 1000,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === "--source-package-dir") args.sourcePackageDir = path.resolve(argv[++i]);
    else if (token === "--raw-video-url") args.rawVideoUrl = argv[++i];
    else if (token === "--ass-url") args.assUrl = argv[++i];
    else if (token === "--draft-id") args.draftId = argv[++i];
    else if (token === "--trace-id") args.traceId = argv[++i];
    else if (token === "--render-task-id") args.renderTaskId = argv[++i];
    else if (token === "--publish-ready-id") args.publishReadyId = argv[++i];
    else if (token === "--requested-by") args.requestedBy = argv[++i];
    else if (token === "--n8n-api-key") args.n8nApiKey = argv[++i];
    else if (token === "--shotstack-api-key") args.shotstackApiKey = argv[++i];
    else if (token === "--table-url") args.tableUrl = argv[++i];
    else if (token === "--webhook-url") args.webhookUrl = argv[++i];
    else if (token === "--api-base") args.apiBase = argv[++i].replace(/\/$/, "");
    else if (token === "--run-root") args.runRoot = path.resolve(argv[++i]);
    else if (token === "--poll-ms") args.pollMs = Number(argv[++i]);
    else if (token === "--timeout-ms") args.timeoutMs = Number(argv[++i]);
    else if (token === "--help" || token === "-h") {
      printHelp();
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${token}`);
    }
  }

  for (const key of [
    "sourcePackageDir",
    "rawVideoUrl",
    "assUrl",
    "draftId",
    "traceId",
    "renderTaskId",
    "publishReadyId",
    "n8nApiKey",
    "shotstackApiKey",
  ]) {
    if (!String(args[key] || "").trim()) {
      throw new Error(`Missing required argument or env: ${key}`);
    }
  }

  return args;
}

function printHelp() {
  console.log(`Usage: node scripts/run-question-heygen-avatar-live.mjs \\
  --source-package-dir <dir> \\
  --raw-video-url <url> \\
  --ass-url <url> \\
  --draft-id <id> \\
  --trace-id <id> \\
  --render-task-id <id> \\
  --publish-ready-id <id> \\
  [--n8n-api-key <key>] [--shotstack-api-key <key>]`);
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

function normalizeFeedback(feedback, pairs) {
  let output = text(feedback);
  for (const [key, value] of pairs) {
    output = output
      .split(/\s+/)
      .filter(Boolean)
      .filter((part) => !part.startsWith(`${key}=`))
      .join(" ");
    if (text(value)) {
      output = `${output}${output ? " " : ""}${key}=${text(value)}`;
    }
  }
  return output;
}

function parseAssTime(raw) {
  const match = String(raw).match(/^(\d+):(\d+):(\d+)\.(\d+)$/);
  if (!match) return 0;
  const [, h, m, s, cs] = match;
  return Number(h) * 3600 + Number(m) * 60 + Number(s) + Number(cs) / 100;
}

function sanitizeAssText(raw) {
  return String(raw)
    .replace(/\{[^}]*\}/g, "")
    .replace(/\\N/g, "\n")
    .replace(/\\n/g, "\n")
    .replace(/\s+\n/g, "\n")
    .replace(/\n\s+/g, "\n")
    .trim();
}

function parseAssDialogues(assContent) {
  return String(assContent)
    .split(/\r?\n/)
    .filter((line) => line.startsWith("Dialogue:"))
    .map((line) => {
      const payload = line.slice("Dialogue: ".length);
      const parts = payload.split(",", 10);
      const start = parseAssTime(parts[1]);
      const end = parseAssTime(parts[2]);
      const textPart = payload.split(",", 10).slice(9).join(",");
      return {
        start,
        end,
        length: Number(Math.max(end - start, 0.1).toFixed(2)),
        text: sanitizeAssText(textPart),
      };
    })
    .filter((item) => item.text);
}

function buildAvatarPayload(dialogues, rawVideoUrl) {
  const totalDuration = Number(
    Math.max(...dialogues.map((item) => item.end), 10).toFixed(2),
  );

  return {
    timeline: {
      background: "#0b1020",
      tracks: [
        {
          clips: [
            {
              asset: {
                type: "video",
                src: rawVideoUrl,
              },
              start: 0,
              length: totalDuration,
              fit: "cover",
              position: "center",
            },
          ],
        },
        {
          clips: dialogues.map((item) => ({
            asset: {
              type: "title",
              text: item.text,
              style: "minimal",
              size: "small",
              color: "#FFFFFF",
              position: "bottom",
            },
            start: item.start,
            length: item.length,
            offset: {
              y: 0.68,
            },
          })),
        },
      ],
    },
    output: {
      format: "mp4",
      fps: 25,
      size: {
        width: 1080,
        height: 1920,
      },
    },
  };
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

  const bodyText = await response.text();
  let json;
  try {
    json = bodyText ? JSON.parse(bodyText) : {};
  } catch {
    json = { raw: bodyText };
  }

  if (!response.ok) {
    throw new Error(`Shotstack HTTP ${response.status}: ${JSON.stringify(json)}`);
  }
  return json;
}

async function sleep(ms) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function submitShotstackRender(payload, args) {
  const submit = await shotstackRequest(`${args.apiBase}/render`, args.shotstackApiKey, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  const renderId = submit?.response?.id || submit?.id || "";
  if (!renderId) throw new Error("Shotstack submit did not return render id");

  const startedAt = Date.now();
  let latest = submit;
  while (Date.now() - startedAt < args.timeoutMs) {
    latest = await shotstackRequest(`${args.apiBase}/render/${renderId}`, args.shotstackApiKey);
    const status = latest?.response?.status || latest?.status || "";
    if (status === "done" || status === "failed") break;
    await sleep(args.pollMs);
  }

  const finalStatus = latest?.response?.status || latest?.status || "unknown";
  if (finalStatus !== "done") {
    throw new Error(`Shotstack render failed: ${JSON.stringify(latest)}`);
  }

  return {
    renderId,
    renderUrl: latest?.response?.url || latest?.url || "",
    status: latest,
    submit,
  };
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
}

async function postStorageRow(row, args) {
  const response = await fetch(args.tableUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-N8N-API-KEY": args.n8nApiKey,
    },
    body: JSON.stringify({ data: [row] }),
  });
  if (!response.ok) {
    throw new Error(`Storage insert failed: ${response.status} ${await response.text()}`);
  }
}

async function triggerBridge(args) {
  const response = await fetch(args.webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      draft_id: args.draftId,
      trace_id: args.traceId,
      source_ref: args.draftId,
      requested_by: args.requestedBy,
    }),
  });
  if (!response.ok) {
    throw new Error(`Bridge trigger failed: ${response.status} ${await response.text()}`);
  }
}

async function pollFinalRow(args) {
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
      .filter((row) => String(row.draft_id || "") === args.draftId)
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
  throw new Error("Timed out waiting for final storage row");
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const sourceDir = args.sourcePackageDir;
  const packageDir = path.join(args.runRoot, args.draftId);

  await mkdir(args.runRoot, { recursive: true });
  await cp(sourceDir, packageDir, { recursive: true, force: true });

  const g3Path = path.join(packageDir, "g3_bridge_row.json");
  const publishReadyPath = path.join(packageDir, "publish_ready_package.json");
  const payloadPath = path.join(packageDir, "shotstack_render_payload.json");
  const receiptPath = path.join(packageDir, "shotstack_render_receipt.json");
  const assPath = path.join(packageDir, "heygen_caption.ass");

  const [g3Row, publishReady] = await Promise.all([
    loadJson(g3Path),
    loadJson(publishReadyPath),
  ]);

  const assResponse = await fetch(args.assUrl);
  if (!assResponse.ok) {
    throw new Error(`Failed to fetch ASS: ${assResponse.status}`);
  }
  const assContent = await assResponse.text();
  await writeFile(assPath, assContent, "utf8");

  const dialogues = parseAssDialogues(assContent);
  if (dialogues.length === 0) {
    throw new Error("No dialogues parsed from ASS");
  }

  const payload = buildAvatarPayload(dialogues, args.rawVideoUrl);
  await writeJson(payloadPath, payload);

  const render = await submitShotstackRender(payload, args);
  await writeJson(receiptPath, {
    submit: render.submit,
    status: render.status,
    summary: {
      render_id: render.renderId,
      render_url: render.renderUrl,
      generated_at: new Date().toISOString(),
    },
  });

  g3Row.draft_id = args.draftId;
  g3Row.trace_id = args.traceId;
  g3Row.render_task_id = args.renderTaskId;
  g3Row.created_at = new Date().toISOString();
  g3Row.published_status = "approved_for_shortform_distribution";
  g3Row.published_at = "";
  g3Row.final_mp4_url = "";
  g3Row.feedback = normalizeFeedback(g3Row.feedback, [
    ["trace_id", args.traceId],
    ["render_task_id", args.renderTaskId],
    ["render_status", "assets_packaged"],
    ["final_mp4_url", ""],
  ]);

  publishReady.publish_ready_id = args.publishReadyId;
  publishReady.job_id = args.traceId;
  publishReady.trace_id = args.traceId;
  publishReady.render_task_id = args.renderTaskId;
  publishReady.render_receipt = "";
  publishReady.final_mp4_url = "";
  publishReady.publish_state = "publish_ready";
  publishReady.delivery_state = "not_sent";
  publishReady.render_status = "assets_packaged";

  await writeJson(g3Path, g3Row);
  await writeJson(publishReadyPath, publishReady);

  runNodeScript(path.join(repoRoot, "scripts", "finalize-render-package.mjs"), [
    "--package-dir",
    packageDir,
    "--final-mp4-url",
    render.renderUrl,
    "--render-receipt",
    render.renderId,
    "--render-source-url",
    render.renderUrl,
  ]);

  const finalRow = await loadJson(g3Path);
  await postStorageRow(
    {
      draft_id: finalRow.draft_id,
      story_id: finalRow.story_id,
      version: finalRow.version,
      created_at: finalRow.created_at,
      source_title: finalRow.source_title,
      source_url: finalRow.source_url,
      source_name: finalRow.source_name,
      topic_type: finalRow.topic_type,
      headline: finalRow.headline,
      post_text: finalRow.post_text,
      cta: finalRow.cta,
      hashtags: finalRow.hashtags,
      image_prompt: finalRow.image_prompt,
      image_url: finalRow.image_url,
      approval_status: finalRow.approval_status,
      published_status: finalRow.published_status,
      feedback: finalRow.feedback,
      published_at: finalRow.published_at,
    },
    args,
  );
  await triggerBridge(args);
  const finalStorageRow = await pollFinalRow(args);

  console.log(JSON.stringify({
    package_dir: packageDir,
    render_id: render.renderId,
    render_url: render.renderUrl,
    final_status: finalStorageRow.published_status,
    youtube_video_id: finalStorageRow.youtube_video_id || "",
    youtube_url: finalStorageRow.youtube_url || "",
    row: finalStorageRow,
  }, null, 2));
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
