#!/usr/bin/env node

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  buildLiveIntentSnapshot,
  fetchAnalyticsRowsFromTable,
  fetchSearchConsoleRows,
  normalizeSiteAnalyticsRows,
} from "./runtime/intent-signal-sources.mjs";
import { bootstrapLocalRuntimeEnv } from "./runtime/local-runtime-env.mjs";
import { enableStrictNonInteractiveMode, logAutonomousDecision } from "./runtime/non-interactive-mode.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const DEFAULT_OUTPUT_ROOT = path.join(repoRoot, "intent-signal-runs");

enableStrictNonInteractiveMode("run-intent-signal-snapshot");

function printHelp() {
  console.log(`Usage: node scripts/run-intent-signal-snapshot.mjs [options]

Options:
  --output-root <dir>         Output root for generated snapshots (default: ${DEFAULT_OUTPUT_ROOT})
  --slug <value>              Explicit run slug
  --analytics-limit <n>       Max analytics rows to fetch from n8n table (default: 250)
  --gsc-row-limit <n>         Max Search Console rows to fetch (default: 250)
  --gsc-site-url <value>      Search Console siteUrl override
  --gsc-start-date <yyyy-mm-dd> Start date override
  --gsc-end-date <yyyy-mm-dd> End date override
  --telegram-feedback <file>  Optional local JSON with Telegram feedback rows
  --content-feedback <file>   Optional local JSON with content feedback rows
  --help                      Show this help

Environment variables:
  N8N_BASE_URL
  N8N_API_KEY
  N8N_ANALYTICS_TABLE_ID
  GSC_ACCESS_TOKEN
  GSC_SERVICE_ACCOUNT_KEY_PATH
  GSC_SITE_URL
  GSC_START_DATE
  GSC_END_DATE
`);
}

function parseArgs(argv) {
  const args = {
    outputRoot: DEFAULT_OUTPUT_ROOT,
    slug: "",
    analyticsLimit: 250,
    gscRowLimit: 250,
    gscSiteUrl: process.env.GSC_SITE_URL || "",
    gscStartDate: process.env.GSC_START_DATE || "",
    gscEndDate: process.env.GSC_END_DATE || "",
    telegramFeedbackPath: "",
    contentFeedbackPath: "",
  };

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === "--output-root") args.outputRoot = path.resolve(argv[++i]);
    else if (token === "--slug") args.slug = argv[++i];
    else if (token === "--analytics-limit") args.analyticsLimit = Number(argv[++i]);
    else if (token === "--gsc-row-limit") args.gscRowLimit = Number(argv[++i]);
    else if (token === "--gsc-site-url") args.gscSiteUrl = argv[++i];
    else if (token === "--gsc-start-date") args.gscStartDate = argv[++i];
    else if (token === "--gsc-end-date") args.gscEndDate = argv[++i];
    else if (token === "--telegram-feedback") args.telegramFeedbackPath = path.resolve(argv[++i]);
    else if (token === "--content-feedback") args.contentFeedbackPath = path.resolve(argv[++i]);
    else if (token === "--help" || token === "-h") {
      printHelp();
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${token}`);
    }
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

function defaultDateRange() {
  const end = new Date();
  const start = new Date(end.getTime() - 27 * 24 * 60 * 60 * 1000);
  return {
    startDate: start.toISOString().slice(0, 10),
    endDate: end.toISOString().slice(0, 10),
  };
}

function classifySourceFailure(message) {
  const safe = text(message).toLowerCase();
  if (safe.includes("missing ")) {
    return "skipped";
  }
  return "failed";
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const runtimeEnv = await bootstrapLocalRuntimeEnv(repoRoot);
  const defaults = defaultDateRange();
  const gscSiteUrl = args.gscSiteUrl || process.env.GSC_SITE_URL || "";
  const gscStartDate = args.gscStartDate || defaults.startDate;
  const gscEndDate = args.gscEndDate || defaults.endDate;
  const warnings = [];
  const sourceStatus = {
    analytics: { status: "pending", count: 0, message: "" },
    search_console: { status: "pending", count: 0, message: "" },
  };

  let analyticsRows = [];
  try {
    const ingestUrl = process.env.ADR_INGEST_URL || "";
    const analyticsBaseUrl = ingestUrl
      ? `${ingestUrl.replace(/\/+$/, "")}/v1/analytics/rows`
      : (process.env.N8N_BASE_URL || "");
    const analyticsApiKey = process.env.ADR_INGEST_API_KEY || process.env.N8N_API_KEY || "";
    const analyticsTableId = ingestUrl ? "" : (process.env.N8N_ANALYTICS_TABLE_ID || "");
    analyticsRows = await fetchAnalyticsRowsFromTable({
      baseUrl: analyticsBaseUrl,
      apiKey: analyticsApiKey,
      tableId: analyticsTableId,
      limit: Number.isFinite(args.analyticsLimit) ? args.analyticsLimit : 250,
    });
    sourceStatus.analytics = {
      status: "ok",
      count: analyticsRows.length,
      message: "",
    };
  } catch (error) {
    sourceStatus.analytics = {
      status: classifySourceFailure(error.message),
      count: 0,
      message: error.message,
    };
    warnings.push(`analytics: ${error.message}`);
  }

  let searchConsoleRows = [];
  try {
    searchConsoleRows = await fetchSearchConsoleRows({
      accessToken: process.env.GSC_ACCESS_TOKEN || "",
      serviceAccountKeyPath: process.env.GSC_SERVICE_ACCOUNT_KEY_PATH || "",
      siteUrl: gscSiteUrl,
      startDate: gscStartDate,
      endDate: gscEndDate,
      rowLimit: Number.isFinite(args.gscRowLimit) ? args.gscRowLimit : 250,
    });
    sourceStatus.search_console = {
      status: "ok",
      count: searchConsoleRows.length,
      message: "",
    };
  } catch (error) {
    sourceStatus.search_console = {
      status: classifySourceFailure(error.message),
      count: 0,
      message: error.message,
    };
    warnings.push(`search_console: ${error.message}`);
  }

  const snapshot = await buildLiveIntentSnapshot({
    analytics: normalizeSiteAnalyticsRows(analyticsRows),
    searchConsole: searchConsoleRows,
    telegramFeedbackPath: args.telegramFeedbackPath,
    contentFeedbackPath: args.contentFeedbackPath,
  });

  const slug = slugify(args.slug || `intent-signal-snapshot-${Date.now()}`) || `intent-signal-snapshot-${Date.now()}`;
  const outputDir = path.join(args.outputRoot, slug);
  await mkdir(outputDir, { recursive: true });

  const snapshotPath = path.join(outputDir, "intent_signal_snapshot.json");
  const metaPath = path.join(outputDir, "snapshot_meta.json");
  const totalSignals =
    snapshot.site_analytics.length +
    snapshot.search_console.length +
    snapshot.telegram_feedback.length +
    snapshot.content_feedback.length;

  if (totalSignals === 0) {
    throw new Error(
      [
        "No intent signals were collected.",
        warnings.length > 0 ? `Warnings: ${warnings.join(" | ")}` : null,
      ]
        .filter(Boolean)
        .join(" "),
    );
  }

  await writeFile(snapshotPath, `${JSON.stringify(snapshot, null, 2)}\n`, "utf8");
  await writeFile(
    metaPath,
    `${JSON.stringify(
      {
        created_at: new Date().toISOString(),
        analytics_count: snapshot.site_analytics.length,
        search_console_count: snapshot.search_console.length,
        telegram_feedback_count: snapshot.telegram_feedback.length,
        content_feedback_count: snapshot.content_feedback.length,
        gsc_site_url: gscSiteUrl,
        gsc_start_date: gscStartDate,
        gsc_end_date: gscEndDate,
        runtime_env_loaded_from: runtimeEnv.loaded_from,
        source_status: sourceStatus,
        warnings,
      },
      null,
      2,
    )}\n`,
    "utf8",
  );

  logAutonomousDecision("intent signal snapshot generated", {
    output_dir: outputDir,
    analytics_count: snapshot.site_analytics.length,
    search_console_count: snapshot.search_console.length,
    runtime_env_loaded_from: runtimeEnv.loaded_from,
  });

  console.log(`output_dir=${outputDir}`);
  console.log(`snapshot=${snapshotPath}`);
  console.log(`meta=${metaPath}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
