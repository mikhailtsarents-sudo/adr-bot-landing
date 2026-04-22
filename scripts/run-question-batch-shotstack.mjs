#!/usr/bin/env node

import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");

const DEFAULT_PACKAGES_ROOT = "/tmp/adr-question-batch5-v2";
const DEFAULT_API_BASE = process.env.SHOTSTACK_API_BASE || "https://api.shotstack.io/edit/v1";
const DEFAULT_POLL_INTERVAL_MS = 8000;
const DEFAULT_TIMEOUT_MS = 8 * 60 * 1000;

function printHelp() {
  console.log(`Usage: node scripts/run-question-batch-shotstack.mjs [options]

Options:
  --packages-root <dir>   Root with prepared question render packages (default: ${DEFAULT_PACKAGES_ROOT})
  --api-key <key>         Shotstack API key (or use SHOTSTACK_API_KEY)
  --api-base <url>        Shotstack API base (default: ${DEFAULT_API_BASE})
  --poll-ms <ms>          Poll interval in milliseconds (default: ${DEFAULT_POLL_INTERVAL_MS})
  --timeout-ms <ms>       Per-render timeout in milliseconds (default: ${DEFAULT_TIMEOUT_MS})
  --help                  Show this help
`);
}

function parseArgs(argv) {
  const args = {
    packagesRoot: DEFAULT_PACKAGES_ROOT,
    apiKey: process.env.SHOTSTACK_API_KEY || "",
    apiBase: DEFAULT_API_BASE,
    pollMs: DEFAULT_POLL_INTERVAL_MS,
    timeoutMs: DEFAULT_TIMEOUT_MS,
    textOnly: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === "--packages-root") args.packagesRoot = path.resolve(argv[++i]);
    else if (token === "--api-key") args.apiKey = argv[++i];
    else if (token === "--api-base") args.apiBase = argv[++i].replace(/\/$/, "");
    else if (token === "--poll-ms") args.pollMs = Number(argv[++i]);
    else if (token === "--timeout-ms") args.timeoutMs = Number(argv[++i]);
    else if (token === "--text-only") args.textOnly = true;
    else if (token === "--help" || token === "-h") {
      printHelp();
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${token}`);
    }
  }

  if (!args.apiKey) {
    throw new Error("Shotstack API key is required. Pass --api-key or set SHOTSTACK_API_KEY.");
  }

  return args;
}

async function loadJson(filePath) {
  return JSON.parse(await readFile(filePath, "utf8"));
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

  const text = await response.text();
  let json;
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    json = { raw: text };
  }

  if (!response.ok) {
    throw new Error(`Shotstack HTTP ${response.status} at ${url}: ${JSON.stringify(json)}`);
  }

  return json;
}

async function listPackageDirs(rootDir) {
  const entries = await readdir(rootDir, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(rootDir, entry.name))
    .sort();
}

async function submitRender(packageDir, args) {
  const payloadPath = path.join(packageDir, "shotstack_render_payload.json");
  const scenarioPath = path.join(packageDir, "scenario.json");
  const renderTaskPath = path.join(packageDir, "render_task.json");
  const payload = await loadJson(payloadPath);
  const scenario = await loadJson(scenarioPath);
  const renderTask = await loadJson(renderTaskPath);
  const submitPayload = args.textOnly ? buildTextOnlyPayload(payload) : payload;

  const submitUrl = `${args.apiBase}/render`;
  const submitResult = await shotstackRequest(submitUrl, args.apiKey, {
    method: "POST",
    body: JSON.stringify(submitPayload),
  });

  const renderId = submitResult?.response?.id || submitResult?.id || "";
  if (!renderId) {
    throw new Error(`Shotstack submit did not return render id for ${packageDir}`);
  }

  const statusUrl = `${args.apiBase}/render/${renderId}`;
  const startedAt = Date.now();
  let latest = submitResult;

  while (Date.now() - startedAt < args.timeoutMs) {
    latest = await shotstackRequest(statusUrl, args.apiKey);
    const status = latest?.response?.status || latest?.status || "";
    if (status === "done" || status === "failed") {
      break;
    }
    await sleep(args.pollMs);
  }

  const finalStatus = latest?.response?.status || latest?.status || "unknown";
  const summary = {
    source_id: renderTask.source_id,
    render_task_id: renderTask.render_task_id,
    title: renderTask.title,
    scenario_id: scenario.scenario_id,
    package_dir: packageDir,
    payload_path: payloadPath,
    render_id: renderId,
    status: finalStatus,
    render_url: latest?.response?.url || latest?.url || "",
    owner: latest?.response?.owner || "",
    duration: latest?.response?.duration ?? null,
    error: latest?.response?.error || latest?.error || "",
    checked_at: new Date().toISOString(),
  };

  await writeFile(
    path.join(packageDir, "shotstack_render_receipt.json"),
    `${JSON.stringify({ submit_payload: submitPayload, submit: submitResult, status: latest, summary }, null, 2)}\n`,
    "utf8",
  );

  return summary;
}

function buildTextOnlyPayload(payload) {
  const textTrack = Array.isArray(payload?.timeline?.tracks)
    ? payload.timeline.tracks.find((track) =>
        Array.isArray(track?.clips) && track.clips.some((clip) => clip?.asset?.type === "title"),
      )
    : null;

  if (!textTrack) {
    return payload;
  }

  return {
    ...payload,
    timeline: {
      ...payload.timeline,
      background: "#111827",
      tracks: [
        {
          clips: textTrack.clips.map((clip) => ({
            ...clip,
            asset: {
              ...clip.asset,
              style: "minimal",
              size: "medium",
              position: "center",
              color: "#F9FAFB",
            },
            offset: {
              y: 0,
            },
          })),
        },
      ],
    },
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const packageDirs = await listPackageDirs(args.packagesRoot);

  if (packageDirs.length === 0) {
    throw new Error(`No package dirs found in ${args.packagesRoot}`);
  }

  const results = [];
  for (const packageDir of packageDirs) {
    const result = await submitRender(packageDir, args);
    results.push(result);
    console.log(`${result.source_id}: ${result.status}${result.render_url ? ` -> ${result.render_url}` : ""}`);
  }

  const summaryPath = path.join(args.packagesRoot, "shotstack_batch_render_summary.json");
  await mkdir(args.packagesRoot, { recursive: true });
  await writeFile(
    summaryPath,
    `${JSON.stringify(
      {
        generated_at: new Date().toISOString(),
        api_base: args.apiBase,
        count: results.length,
        success_count: results.filter((item) => item.status === "done").length,
        failed_count: results.filter((item) => item.status === "failed").length,
        results,
      },
      null,
      2,
    )}\n`,
    "utf8",
  );

  console.log(`summary=${summaryPath}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
