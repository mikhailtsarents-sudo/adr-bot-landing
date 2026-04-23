#!/usr/bin/env node

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import {
  appendPublishedNewsHistory,
  buildNewsDecision,
  loadNewsAutopilotHistory,
  saveNewsAutopilotHistory,
} from "./runtime/news-autopilot-engine.mjs";
import {
  appendIssuedNewsHistory,
  consumePreparedNews,
} from "./runtime/news-content-creator-engine.mjs";
import { enableStrictNonInteractiveMode, logAutonomousDecision } from "./runtime/non-interactive-mode.mjs";
import { bootstrapLocalRuntimeEnv } from "./runtime/local-runtime-env.mjs";
import { normalizeRenderedNewsVideo } from "./runtime/news-rendered-video-normalizer.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const controlCenterRoot = path.resolve(repoRoot, "..", "adr-control-center");
const DEFAULT_OUTPUT_ROOT = path.join(repoRoot, "news-autopilot-runs");
const DEFAULT_CREATOR_OUTPUT_ROOT = path.join(controlCenterRoot, "runtime", "queues", "news-content-creator");
const DEFAULT_HISTORY_PATH = path.join(
  controlCenterRoot,
  "runtime",
  "queues",
  "news-autopilot",
  "latest",
  "news_publish_history.latest.json",
);
const DEFAULT_ISSUED_HISTORY_PATH = path.join(
  controlCenterRoot,
  "runtime",
  "queues",
  "news-content-creator",
  "latest",
  "news_issue_history.latest.json",
);
const DEFAULT_PREPARED_QUEUE_PATH = path.join(
  DEFAULT_CREATOR_OUTPUT_ROOT,
  "latest",
  "prepared_news_queue.latest.json",
);

enableStrictNonInteractiveMode("run-news-autopilot-cycle");

function text(value) {
  return value == null ? "" : String(value).trim();
}

function parseOutputPath(stdout, key) {
  const line = String(stdout || "")
    .split("\n")
    .map((entry) => entry.trim())
    .find((entry) => entry.startsWith(`${key}=`));
  return line ? line.slice(key.length + 1) : "";
}

function printHelp() {
  console.log(`Usage: node scripts/run-news-autopilot-cycle.mjs [options]

Options:
  --prepared-queue <file> Queue JSON from news content creator (default: ${DEFAULT_PREPARED_QUEUE_PATH})
  --issued-history <file> Issued news history JSON (default: ${DEFAULT_ISSUED_HISTORY_PATH})
  --creator-output-root <dir> Content creator output root (default: ${DEFAULT_CREATOR_OUTPUT_ROOT})
  --history <file>       Publish history JSON (default: ${DEFAULT_HISTORY_PATH})
  --output-root <dir>    Output root (default: ${DEFAULT_OUTPUT_ROOT})
  --recent-limit <n>     Avoid the most recent N published news items when possible (default: 3)
  --no-seed-upstream     Do not auto-discover and seed a fresh news row when queue is empty
  --skip-publish         Stop after approved-news package/finalize, skip YouTube publish
  --help                 Show this help
`);
}

function parseArgs(argv) {
  const args = {
    preparedQueuePath: DEFAULT_PREPARED_QUEUE_PATH,
    issuedHistoryPath: DEFAULT_ISSUED_HISTORY_PATH,
    creatorOutputRoot: DEFAULT_CREATOR_OUTPUT_ROOT,
    historyPath: DEFAULT_HISTORY_PATH,
    outputRoot: DEFAULT_OUTPUT_ROOT,
    recentLimit: 3,
    seedUpstreamWhenEmpty: true,
    skipPublish: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === "--prepared-queue") args.preparedQueuePath = path.resolve(argv[++i]);
    else if (token === "--issued-history") args.issuedHistoryPath = path.resolve(argv[++i]);
    else if (token === "--creator-output-root") args.creatorOutputRoot = path.resolve(argv[++i]);
    else if (token === "--history") args.historyPath = path.resolve(argv[++i]);
    else if (token === "--output-root") args.outputRoot = path.resolve(argv[++i]);
    else if (token === "--recent-limit") args.recentLimit = Math.max(0, Number(argv[++i]) || 3);
    else if (token === "--no-seed-upstream") args.seedUpstreamWhenEmpty = false;
    else if (token === "--skip-publish") args.skipPublish = true;
    else if (token === "--help" || token === "-h") {
      printHelp();
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${token}`);
    }
  }

  return args;
}

function runNodeScript(scriptPath, scriptArgs) {
  const result = spawnSync(process.execPath, [scriptPath, ...scriptArgs], {
    cwd: repoRoot,
    encoding: "utf8",
    stdio: "pipe",
    maxBuffer: 50 * 1024 * 1024,
  });

  if (result.status !== 0) {
    throw new Error(
      [
        `Script failed: ${path.basename(scriptPath)}`,
        result.stdout?.trim() ? `stdout:\n${result.stdout.trim()}` : null,
        result.stderr?.trim() ? `stderr:\n${result.stderr.trim()}` : null,
      ].filter(Boolean).join("\n"),
    );
  }

  return result.stdout || "";
}

async function loadJson(filePath, fallback = null) {
  try {
    return JSON.parse(await readFile(filePath, "utf8"));
  } catch {
    return fallback;
  }
}

async function writeJson(filePath, payload) {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}

async function patchPackageRenderSource(packageDir, normalizedVideoUrl) {
  const publishReadyPath = path.join(packageDir, "publish_ready_package.json");
  const bridgeRowPath = path.join(packageDir, "g3_bridge_row.json");
  const metadataPath = path.join(packageDir, "metadata.json");
  const [publishReady, bridgeRow, metadata] = await Promise.all([
    loadJson(publishReadyPath, {}),
    loadJson(bridgeRowPath, {}),
    loadJson(metadataPath, {}),
  ]);

  publishReady.final_mp4_url = normalizedVideoUrl;
  publishReady.render_source_url = normalizedVideoUrl;
  bridgeRow.final_mp4_url = normalizedVideoUrl;
  bridgeRow.render_source_url = normalizedVideoUrl;
  metadata.render_source_url = normalizedVideoUrl;

  await Promise.all([
    writeJson(publishReadyPath, publishReady),
    writeJson(bridgeRowPath, bridgeRow),
    writeJson(metadataPath, metadata),
  ]);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const startedAt = new Date().toISOString();
  await bootstrapLocalRuntimeEnv(repoRoot);

  const creatorOutput = runNodeScript(
    path.join(repoRoot, "scripts", "run-news-content-creator.mjs"),
    [
      "--output-root", args.creatorOutputRoot,
      "--publish-history", args.historyPath,
      "--issued-history", args.issuedHistoryPath,
      "--recent-limit", String(args.recentLimit),
    ],
  );

  const preparedQueuePath = parseOutputPath(creatorOutput, "latest_prepared_news_queue") || args.preparedQueuePath;
  let preparedQueue = await loadJson(preparedQueuePath, { entries: [] });
  const historyEntries = await loadNewsAutopilotHistory(args.historyPath);
  const issuedPayload = await loadJson(args.issuedHistoryPath, { history: [] });
  const issuedHistory = Array.isArray(issuedPayload?.history) ? issuedPayload.history : [];
  let consumed = consumePreparedNews(preparedQueue);

  if (!consumed.selected && args.seedUpstreamWhenEmpty) {
    logAutonomousDecision("news queue empty, attempting upstream seed");
    runNodeScript(
      path.join(repoRoot, "scripts", "run-news-upstream-cycle.mjs"),
      ["--output-root", path.join(args.outputRoot, "upstream-seed-runs")],
    );

    const creatorOutputAfterSeed = runNodeScript(
      path.join(repoRoot, "scripts", "run-news-content-creator.mjs"),
      [
        "--output-root", args.creatorOutputRoot,
        "--publish-history", args.historyPath,
        "--issued-history", args.issuedHistoryPath,
        "--recent-limit", String(args.recentLimit),
      ],
    );
    const reseededQueuePath = parseOutputPath(creatorOutputAfterSeed, "latest_prepared_news_queue") || preparedQueuePath;
    preparedQueue = await loadJson(reseededQueuePath, { entries: [] });
    consumed = consumePreparedNews(preparedQueue);
  }

  const selectedEntry = consumed.selected;
  const selectionMeta = selectedEntry?.selection_meta || {};
  const selected = selectedEntry
    ? {
        source_id: selectedEntry.source_id,
        source_path: selectedEntry.source_path,
        source_label: selectedEntry.source_label,
        payload: selectedEntry.source_payload,
      }
    : null;
  const traceId = `news-autopilot-${Date.now()}-${text(selected?.source_id || "blocked")}`;
  const decision = buildNewsDecision(selected, selectionMeta, traceId);

  const outputDir = path.join(args.outputRoot, traceId);
  await mkdir(outputDir, { recursive: true });
  const decisionPath = path.join(outputDir, "decision.json");
  await writeJson(decisionPath, decision);

  if (decision.decision_state === "blocked") {
    console.log(`output_dir=${outputDir}`);
    console.log(`decision=${decisionPath}`);
    console.log(`decision_state=blocked`);
    return;
  }

  logAutonomousDecision("news autopilot selected source", {
    source_id: decision.selected_source_id,
    draft_id: text(selected?.payload?.draft_id),
    fallback_mode: selectionMeta.fallback_mode || "",
    recent_limit: args.recentLimit,
  });

  const nextIssuedHistory = appendIssuedNewsHistory(issuedHistory, selectedEntry, {
    issued_at: startedAt,
    trace_id: traceId,
  });
  await writeJson(args.issuedHistoryPath, { history: nextIssuedHistory });

  const approvedRowPath = path.join(outputDir, "approved_row.json");
  await writeJson(approvedRowPath, selected.payload);

  const branchOutput = runNodeScript(
    path.join(repoRoot, "scripts", "run-news-render-package.mjs"),
    [
      "--input", approvedRowPath,
      "--output-root", outputDir,
    ],
  );

  const publishReadyPath = parseOutputPath(branchOutput, "publish_ready");
  const reportPath = parseOutputPath(branchOutput, "report");
  const renderPackageDir = parseOutputPath(branchOutput, "render_package");
  let postRenderReportPath = "";
  let normalizationReportPath = "";

  let youtubeUrl = "";
  if (!args.skipPublish && text(renderPackageDir)) {
    const packagesRoot = path.dirname(renderPackageDir);
    const postRenderOutput = runNodeScript(
      path.join(repoRoot, "scripts", "run-post-render-pipeline.mjs"),
      ["--packages-root", packagesRoot, "--skip-youtube"],
    );
    postRenderReportPath = path.join(packagesRoot, "shotstack_batch_render_summary.json");
    const publishReady = await loadJson(path.join(renderPackageDir, "publish_ready_package.json"), {});
    const normalization = await normalizeRenderedNewsVideo({
      remoteUrl: text(publishReady.final_mp4_url || publishReady.render_source_url),
      traceId,
      diagnosticsDir: renderPackageDir,
      outputRoot: path.join(outputDir, "normalized-news-video"),
    });
    normalizationReportPath = normalization.reportPath;
    await patchPackageRenderSource(renderPackageDir, normalization.normalizedVideoUrl);

    const youtubeOutput = runNodeScript(
      path.join(repoRoot, "scripts", "run-package-youtube-publish.mjs"),
      ["--package-dir", renderPackageDir],
    );
    const publishUrlMatch = String(youtubeOutput).match(/YOUTUBE_URL=([^\n]+)/);
    youtubeUrl = publishUrlMatch ? text(publishUrlMatch[1]) : "";
  }

  if (!args.skipPublish) {
    const nextHistory = appendPublishedNewsHistory(historyEntries, selected, {
      selected_at: startedAt,
      published_at: new Date().toISOString(),
      trace_id: traceId,
      youtube_url: youtubeUrl,
      package_dir: renderPackageDir,
    });
    await saveNewsAutopilotHistory(args.historyPath, nextHistory);
  }

  const report = {
    created_at: new Date().toISOString(),
    trace_id: traceId,
    prepared_queue_path: preparedQueuePath,
    history_path: args.historyPath,
    issued_history_path: args.issuedHistoryPath,
    selected_source_id: decision.selected_source_id,
    selected_draft_id: text(selected?.payload?.draft_id),
    selected_row_id: text(selected?.payload?.id),
    fallback_mode: selectionMeta.fallback_mode || "",
    recent_limit: args.recentLimit,
    candidate_pool_size: selectionMeta.candidate_pool_size || 0,
    unseen_count: selectionMeta.unseen_count || 0,
    reusable_count: selectionMeta.reusable_count || 0,
    recent_blocked_ids: selectionMeta.recent_blocked_ids || [],
    ranked_source_ids: selectionMeta.ranked_source_ids || [],
    approved_row_path: approvedRowPath,
    news_branch_report_path: reportPath,
    post_render_report_path: postRenderReportPath,
    normalization_report_path: normalizationReportPath,
    render_package_dir: renderPackageDir,
    publish_ready_path: publishReadyPath,
    youtube_url: youtubeUrl,
    skip_publish: args.skipPublish,
  };
  const autopilotReportPath = path.join(outputDir, "news_autopilot_report.json");
  await writeJson(autopilotReportPath, report);

  console.log(`output_dir=${outputDir}`);
  console.log(`decision=${decisionPath}`);
  console.log(`news_autopilot_report=${autopilotReportPath}`);
  console.log(`selected_source_id=${decision.selected_source_id}`);
  console.log(`selected_draft_id=${text(selected?.payload?.draft_id)}`);
  if (youtubeUrl) console.log(`youtube_urls=${youtubeUrl}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
