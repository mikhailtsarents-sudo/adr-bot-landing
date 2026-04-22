#!/usr/bin/env node

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildPreparedNewsQueue } from "./runtime/news-content-creator-engine.mjs";
import { loadNewsAutopilotHistory } from "./runtime/news-autopilot-engine.mjs";
import { enableStrictNonInteractiveMode, logAutonomousDecision } from "./runtime/non-interactive-mode.mjs";
import { bootstrapLocalRuntimeEnv } from "./runtime/local-runtime-env.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const controlCenterRoot = path.resolve(repoRoot, "..", "adr-control-center");
const DEFAULT_NEWS_DIR = path.join(repoRoot, "examples", "approved-news");
const DEFAULT_OUTPUT_ROOT = path.join(controlCenterRoot, "runtime", "queues", "news-content-creator");
const DEFAULT_PUBLISH_HISTORY_PATH = path.join(
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
const DEFAULT_TABLE_URL =
  process.env.DRAFT_STORAGE_API_URL
  || "https://tsarents.app.n8n.cloud/api/v1/data-tables/o3VHi3uQOI2y0z1o/rows";

enableStrictNonInteractiveMode("run-news-content-creator");

function text(value) {
  return value == null ? "" : String(value).trim();
}

async function loadJson(filePath, fallback) {
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

function printHelp() {
  console.log(`Usage: node scripts/run-news-content-creator.mjs [options]

Options:
  --news-dir <dir>           Local approved NEWS row catalog
  --table-url <url>          Live approved NEWS rows table URL
  --output-root <dir>        Queue output root
  --publish-history <file>   Successful publish history JSON
  --issued-history <file>    Already-issued news history JSON
  --horizon <n>              Number of prepared news items to keep ready (default: 5)
  --recent-limit <n>         Avoid the most recent N issued/published news items when possible (default: 3)
  --help                     Show this help
`);
}

function parseArgs(argv) {
  const args = {
    newsDir: DEFAULT_NEWS_DIR,
    tableUrl: DEFAULT_TABLE_URL,
    outputRoot: DEFAULT_OUTPUT_ROOT,
    publishHistoryPath: DEFAULT_PUBLISH_HISTORY_PATH,
    issuedHistoryPath: DEFAULT_ISSUED_HISTORY_PATH,
    horizon: 5,
    recentLimit: 3,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === "--news-dir") args.newsDir = path.resolve(argv[++i]);
    else if (token === "--table-url") args.tableUrl = argv[++i];
    else if (token === "--output-root") args.outputRoot = path.resolve(argv[++i]);
    else if (token === "--publish-history") args.publishHistoryPath = path.resolve(argv[++i]);
    else if (token === "--issued-history") args.issuedHistoryPath = path.resolve(argv[++i]);
    else if (token === "--horizon") args.horizon = Math.max(1, Number(argv[++i]) || 5);
    else if (token === "--recent-limit") args.recentLimit = Math.max(0, Number(argv[++i]) || 3);
    else if (token === "--help" || token === "-h") {
      printHelp();
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${token}`);
    }
  }

  return args;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  await bootstrapLocalRuntimeEnv(repoRoot);
  const publishedPayload = await loadNewsAutopilotHistory(args.publishHistoryPath);
  const issuedPayload = await loadJson(args.issuedHistoryPath, { history: [] });
  const issuedHistory = Array.isArray(issuedPayload?.history) ? issuedPayload.history : [];

  const queueResult = await buildPreparedNewsQueue({
    newsDir: args.newsDir,
    tableUrl: args.tableUrl,
    n8nApiKey: process.env.N8N_API_KEY,
    horizon: args.horizon,
    recentLimit: args.recentLimit,
    publishedHistory: publishedPayload,
    issuedHistory,
  });

  const createdAt = new Date().toISOString();
  const slug = `news-content-creator-${Date.now()}`;
  const outputDir = path.join(args.outputRoot, slug);
  const latestDir = path.join(args.outputRoot, "latest");
  await mkdir(outputDir, { recursive: true });
  await mkdir(latestDir, { recursive: true });

  const entriesPayload = {
    created_at: createdAt,
    news_dir: args.newsDir,
    table_url: args.tableUrl,
    entries: queueResult.queue,
  };
  const summary = {
    created_at: createdAt,
    prepared_count: queueResult.prepared_count,
    catalog_size: queueResult.catalog_size,
    recent_limit: queueResult.recent_limit,
    horizon: queueResult.horizon,
    issued_count: queueResult.issued_count,
    published_count: queueResult.published_count,
    next_source_id: text(queueResult.queue[0]?.source_id),
    next_draft_id: text(queueResult.queue[0]?.source_payload?.draft_id),
  };

  const queuePath = path.join(outputDir, "prepared_news_queue.json");
  const summaryPath = path.join(outputDir, "news_content_creator_summary.json");
  const latestQueuePath = path.join(latestDir, "prepared_news_queue.latest.json");
  const latestSummaryPath = path.join(latestDir, "news_content_creator_summary.latest.json");

  await writeJson(queuePath, entriesPayload);
  await writeJson(summaryPath, summary);
  await writeJson(latestQueuePath, entriesPayload);
  await writeJson(latestSummaryPath, summary);

  logAutonomousDecision("news content creator refreshed queue", {
    prepared_count: summary.prepared_count,
    next_source_id: summary.next_source_id,
    next_draft_id: summary.next_draft_id,
    recent_limit: summary.recent_limit,
  });

  console.log(`output_dir=${outputDir}`);
  console.log(`prepared_news_queue=${queuePath}`);
  console.log(`summary=${summaryPath}`);
  console.log(`latest_prepared_news_queue=${latestQueuePath}`);
  console.log(`latest_summary=${latestSummaryPath}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
