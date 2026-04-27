#!/usr/bin/env node

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  fetchAnalyticsRowsFromTable,
  fetchSearchConsoleRows,
  normalizeSiteAnalyticsRows,
} from "./runtime/intent-signal-sources.mjs";
import { bootstrapLocalRuntimeEnv } from "./runtime/local-runtime-env.mjs";
import { enableStrictNonInteractiveMode, logAutonomousDecision } from "./runtime/non-interactive-mode.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const seoPagesPath = path.join(repoRoot, "src", "lib", "seo-pages.ts");
const DEFAULT_OUTPUT_ROOT = path.join(repoRoot, "seo-performance-runs");
const DEFAULT_GSC_SITE_URL = "https://www.adr-bot.de/";

enableStrictNonInteractiveMode("run-seo-performance-board");

function text(value) {
  return value == null ? "" : String(value).trim();
}

function num(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function round(value, digits = 4) {
  if (!Number.isFinite(value)) return 0;
  return Number(value.toFixed(digits));
}

function slugify(value) {
  return text(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function printHelp() {
  console.log(`Usage: node scripts/run-seo-performance-board.mjs [options]

Options:
  --output-root <dir>         Output root (default: ${DEFAULT_OUTPUT_ROOT})
  --slug <value>              Output slug
  --analytics-limit <n>       Max analytics rows to fetch (default: 2000)
  --gsc-row-limit <n>         Max Search Console rows to fetch (default: 2000)
  --gsc-site-url <value>      Search Console siteUrl override
  --gsc-start-date <yyyy-mm-dd> Search Console start date override
  --gsc-end-date <yyyy-mm-dd> Search Console end date override
  --allow-missing-gsc         Allow report generation without Search Console data
  --help                      Show this help
`);
}

function parseArgs(argv) {
  const defaults = defaultDateRange();
  const args = {
    outputRoot: DEFAULT_OUTPUT_ROOT,
    slug: "",
    analyticsLimit: 2000,
    gscRowLimit: 2000,
    gscSiteUrl: process.env.GSC_SITE_URL || DEFAULT_GSC_SITE_URL,
    gscStartDate: process.env.GSC_START_DATE || defaults.startDate,
    gscEndDate: process.env.GSC_END_DATE || defaults.endDate,
    allowMissingGsc: false,
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
    else if (token === "--allow-missing-gsc") args.allowMissingGsc = true;
    else if (token === "--help" || token === "-h") {
      printHelp();
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${token}`);
    }
  }

  return args;
}

function defaultDateRange() {
  const end = new Date();
  const start = new Date(end.getTime() - 27 * 24 * 60 * 60 * 1000);
  return {
    startDate: endDateString(start),
    endDate: endDateString(end),
  };
}

function endDateString(value) {
  return new Date(value).toISOString().slice(0, 10);
}

function classifySourceFailure(message) {
  const safe = text(message).toLowerCase();
  if (safe.includes("missing ")) return "skipped";
  return "failed";
}

function isMissingGscConfiguration(message) {
  const safe = text(message).toLowerCase();
  return (
    safe.includes("missing gsc_access_token") ||
    safe.includes("missing gsc_access_token or gsc_service_account_key_path") ||
    safe.includes("missing gsc_site_url")
  );
}

function parseSeoPageBlocks(source) {
  const blocks = [];
  const exportPattern = /export const (\w+): SeoPageConfig = \{/g;
  let match;

  while ((match = exportPattern.exec(source)) !== null) {
    const exportName = match[1];
    const blockStart = source.indexOf("{", match.index);
    let cursor = blockStart;
    let depth = 0;
    let quote = "";
    let escaped = false;

    while (cursor < source.length) {
      const char = source[cursor];
      if (quote) {
        if (escaped) escaped = false;
        else if (char === "\\") escaped = true;
        else if (char === quote) quote = "";
      } else if (char === "\"" || char === "'" || char === "`") {
        quote = char;
      } else if (char === "{") {
        depth += 1;
      } else if (char === "}") {
        depth -= 1;
        if (depth === 0) {
          blocks.push({ exportName, blockText: source.slice(blockStart, cursor + 1) });
          break;
        }
      }
      cursor += 1;
    }
  }

  return blocks;
}

function extractField(blockText, fieldName) {
  return text(blockText.match(new RegExp(`${fieldName}:\\s*"([^"]*)"`))?.[1] || "");
}

async function loadSeoPages() {
  const raw = await readFile(seoPagesPath, "utf8");
  const blocks = parseSeoPageBlocks(raw);
  return blocks
    .map(({ exportName, blockText }) => ({
      exportName,
      slug: extractField(blockText, "slug"),
      path: extractField(blockText, "path"),
      pageTitle: extractField(blockText, "pageTitle"),
      metaTitle: extractField(blockText, "metaTitle"),
      telegramSource: extractField(blockText, "telegramSource"),
    }))
    .filter((page) => page.path && !page.path.includes("preview"));
}

function aggregateAnalyticsByPath(rows) {
  const map = new Map();
  for (const row of rows) {
    const pathKey = text(row.page_path || row.target || "");
    if (!pathKey) continue;
    if (!map.has(pathKey)) {
      map.set(pathKey, {
        page: pathKey,
        views: 0,
        cta_clicks: 0,
        redirects: 0,
      });
    }
    const bucket = map.get(pathKey);
    if (row.event === "site_page_view") bucket.views += 1;
    if (row.event === "telegram_cta_click") bucket.cta_clicks += 1;
    if (row.event === "telegram_redirect") bucket.redirects += 1;
  }
  return map;
}

function aggregateGscByPage(rows) {
  const map = new Map();
  for (const row of rows) {
    const rawPage = text(row.page);
    if (!rawPage) continue;
    const pageUrl = new URL(rawPage, DEFAULT_GSC_SITE_URL);
    const pathKey = text(pageUrl.pathname || "");
    if (!pathKey) continue;
    if (!map.has(pathKey)) {
      map.set(pathKey, {
        page: pathKey,
        clicks: 0,
        impressions: 0,
        weighted_position_sum: 0,
        query_count: 0,
      });
    }
    const bucket = map.get(pathKey);
    const clicks = num(row.clicks);
    const impressions = num(row.impressions);
    const position = num(row.position);
    bucket.clicks += clicks;
    bucket.impressions += impressions;
    bucket.weighted_position_sum += position * Math.max(impressions, 1);
    bucket.query_count += 1;
  }

  for (const bucket of map.values()) {
    bucket.ctr = bucket.impressions > 0 ? round(bucket.clicks / bucket.impressions) : 0;
    bucket.avg_position = bucket.impressions > 0
      ? round(bucket.weighted_position_sum / bucket.impressions, 2)
      : 0;
    delete bucket.weighted_position_sum;
  }

  return map;
}

function aggregateQueries(rows) {
  const queryMap = new Map();
  for (const row of rows) {
    const query = text(row.query);
    const rawPage = text(row.page);
    if (!query || !rawPage) continue;
    const pageUrl = new URL(rawPage, DEFAULT_GSC_SITE_URL);
    const pathKey = text(pageUrl.pathname || "");
    if (!queryMap.has(query)) {
      queryMap.set(query, {
        query,
        clicks: 0,
        impressions: 0,
        weighted_position_sum: 0,
        pages: new Map(),
      });
    }
    const bucket = queryMap.get(query);
    const clicks = num(row.clicks);
    const impressions = num(row.impressions);
    const position = num(row.position);
    bucket.clicks += clicks;
    bucket.impressions += impressions;
    bucket.weighted_position_sum += position * Math.max(impressions, 1);
    const pageBucket = bucket.pages.get(pathKey) || { page: pathKey, clicks: 0, impressions: 0 };
    pageBucket.clicks += clicks;
    pageBucket.impressions += impressions;
    bucket.pages.set(pathKey, pageBucket);
  }

  return [...queryMap.values()].map((bucket) => ({
    query: bucket.query,
    clicks: bucket.clicks,
    impressions: bucket.impressions,
    ctr: bucket.impressions > 0 ? round(bucket.clicks / bucket.impressions) : 0,
    avg_position: bucket.impressions > 0 ? round(bucket.weighted_position_sum / bucket.impressions, 2) : 0,
    pages: [...bucket.pages.values()].sort((left, right) => right.impressions - left.impressions),
  }));
}

function buildPerformanceBoard({ seoPages, analyticsRows, gscRows, sourceStatus, runtimeEnvLoadedFrom, args }) {
  const analyticsByPath = aggregateAnalyticsByPath(analyticsRows);
  const gscByPage = aggregateGscByPage(gscRows);
  const combinedPages = seoPages.map((page) => {
    const analytics = analyticsByPath.get(page.path) || { views: 0, cta_clicks: 0, redirects: 0 };
    const gsc = gscByPage.get(page.path) || { clicks: 0, impressions: 0, ctr: 0, avg_position: 0, query_count: 0 };
    return {
      ...page,
      views: analytics.views,
      cta_clicks: analytics.cta_clicks,
      redirects: analytics.redirects,
      clicks: gsc.clicks,
      impressions: gsc.impressions,
      ctr: gsc.ctr,
      avg_position: gsc.avg_position,
      query_count: gsc.query_count,
      redirect_rate_from_clicks: gsc.clicks > 0 ? round(analytics.redirects / gsc.clicks) : 0,
    };
  });

  const queryPerformance = aggregateQueries(gscRows);
  const topPagesByImpressions = [...combinedPages]
    .filter((page) => page.impressions > 0)
    .sort((left, right) => right.impressions - left.impressions)
    .slice(0, 10);
  const topPagesByClicks = [...combinedPages]
    .filter((page) => page.clicks > 0)
    .sort((left, right) => right.clicks - left.clicks)
    .slice(0, 10);
  const lowCtrOpportunities = [...combinedPages]
    .filter((page) => page.impressions >= 20 && page.ctr > 0 && page.ctr < 0.03)
    .sort((left, right) => right.impressions - left.impressions)
    .slice(0, 10);
  const highCtrLowImpressionPages = [...combinedPages]
    .filter((page) => page.impressions > 0 && page.impressions <= 50 && page.ctr >= 0.08)
    .sort((left, right) => right.ctr - left.ctr || right.impressions - left.impressions)
    .slice(0, 10);
  const zeroVisibilityPages = combinedPages
    .filter((page) => page.impressions <= 0)
    .map((page) => ({
      path: page.path,
      slug: page.slug,
      pageTitle: page.pageTitle,
      redirects: page.redirects,
      views: page.views,
    }))
    .slice(0, 20);
  const impressionToRedirectGaps = [...combinedPages]
    .filter((page) => page.impressions >= 20 && page.redirects <= 0)
    .sort((left, right) => right.impressions - left.impressions)
    .slice(0, 10);
  const topQueriesByImpressions = [...queryPerformance]
    .sort((left, right) => right.impressions - left.impressions)
    .slice(0, 15);
  const topQueriesByClicks = [...queryPerformance]
    .sort((left, right) => right.clicks - left.clicks)
    .slice(0, 15);
  const cannibalizationCandidates = queryPerformance
    .filter((row) => row.pages.length >= 2 && row.impressions >= 10)
    .map((row) => ({
      query: row.query,
      impressions: row.impressions,
      clicks: row.clicks,
      ctr: row.ctr,
      avg_position: row.avg_position,
      page_count: row.pages.length,
      pages: row.pages.slice(0, 5),
    }))
    .sort((left, right) => right.impressions - left.impressions || right.page_count - left.page_count)
    .slice(0, 15);

  return {
    created_at: new Date().toISOString(),
    source_status: sourceStatus,
    runtime_env_loaded_from: runtimeEnvLoadedFrom,
    gsc_site_url: args.gscSiteUrl,
    gsc_start_date: args.gscStartDate,
    gsc_end_date: args.gscEndDate,
    gsc_required: !args.allowMissingGsc,
    seo_page_count: seoPages.length,
    gsc_page_count: [...gscByPage.keys()].length,
    top_pages_by_impressions: topPagesByImpressions,
    top_pages_by_clicks: topPagesByClicks,
    low_ctr_opportunities: lowCtrOpportunities,
    high_ctr_low_impression_pages: highCtrLowImpressionPages,
    impression_to_redirect_gaps: impressionToRedirectGaps,
    zero_visibility_pages: zeroVisibilityPages,
    top_queries_by_impressions: topQueriesByImpressions,
    top_queries_by_clicks: topQueriesByClicks,
    cannibalization_candidates: cannibalizationCandidates,
  };
}

function formatPercent(value) {
  return `${Math.round(num(value) * 100)}%`;
}

function buildMarkdown(board) {
  const lines = [];
  lines.push("# SEO Performance Board");
  lines.push("");
  lines.push(`- Created at: ${board.created_at}`);
  lines.push(`- Runtime env loaded from: ${text(board.runtime_env_loaded_from) || "not_found"}`);
  lines.push(`- Search Console status: ${board.source_status.search_console.status} (${board.source_status.search_console.count})`);
  lines.push(`- Search Console required: ${board.gsc_required ? "yes" : "no"}`);
  lines.push(`- Analytics status: ${board.source_status.analytics.status} (${board.source_status.analytics.count})`);
  lines.push(`- GSC range: ${board.gsc_start_date} -> ${board.gsc_end_date}`);
  lines.push(`- SEO pages known: ${board.seo_page_count}`);
  lines.push(`- SEO pages with GSC visibility: ${board.gsc_page_count}`);
  lines.push("");

  const sections = [
    ["Top pages by impressions", board.top_pages_by_impressions, (row) => `- ${row.path}: ${row.impressions} impressions, ${row.clicks} clicks, CTR ${formatPercent(row.ctr)}, redirects ${row.redirects}`],
    ["Top pages by clicks", board.top_pages_by_clicks, (row) => `- ${row.path}: ${row.clicks} clicks, ${row.impressions} impressions, CTR ${formatPercent(row.ctr)}, redirects ${row.redirects}`],
    ["Low CTR opportunities", board.low_ctr_opportunities, (row) => `- ${row.path}: ${row.impressions} impressions, CTR ${formatPercent(row.ctr)}, position ${row.avg_position}`],
    ["High CTR but low impression pages", board.high_ctr_low_impression_pages, (row) => `- ${row.path}: CTR ${formatPercent(row.ctr)}, ${row.impressions} impressions, ${row.clicks} clicks`],
    ["Impression to redirect gaps", board.impression_to_redirect_gaps, (row) => `- ${row.path}: ${row.impressions} impressions, ${row.clicks} clicks, redirects ${row.redirects}`],
    ["Zero visibility pages", board.zero_visibility_pages, (row) => `- ${row.path}: ${row.views} views, ${row.redirects} redirects, no GSC impressions yet`],
    ["Top queries by impressions", board.top_queries_by_impressions, (row) => `- ${row.query}: ${row.impressions} impressions, ${row.clicks} clicks, CTR ${formatPercent(row.ctr)}`],
    ["Top queries by clicks", board.top_queries_by_clicks, (row) => `- ${row.query}: ${row.clicks} clicks, ${row.impressions} impressions, CTR ${formatPercent(row.ctr)}`],
  ];

  for (const [title, rows, formatRow] of sections) {
    lines.push(`## ${title}`);
    lines.push("");
    if (!rows.length) {
      lines.push("- No data.");
    } else {
      for (const row of rows) {
        lines.push(formatRow(row));
      }
    }
    lines.push("");
  }

  lines.push("## Cannibalization candidates");
  lines.push("");
  if (!board.cannibalization_candidates.length) {
    lines.push("- No multi-page query overlaps above the current threshold.");
  } else {
    for (const row of board.cannibalization_candidates) {
      lines.push(`- ${row.query}: ${row.impressions} impressions across ${row.page_count} pages`);
      for (const page of row.pages) {
        lines.push(`  - ${page.page}: ${page.impressions} impressions, ${page.clicks} clicks`);
      }
    }
  }
  lines.push("");

  return `${lines.join("\n")}\n`;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const runtimeEnv = await bootstrapLocalRuntimeEnv(repoRoot);
  const slug = slugify(args.slug || `seo-performance-board-${Date.now()}`) || `seo-performance-board-${Date.now()}`;
  const outputDir = path.join(args.outputRoot, slug);
  await mkdir(outputDir, { recursive: true });

  const sourceStatus = {
    analytics: { status: "pending", count: 0, message: "" },
    search_console: { status: "pending", count: 0, message: "" },
  };
  const warnings = [];

  let analyticsRows = [];
  try {
    const ingestUrl = process.env.ADR_INGEST_URL || "";
    const analyticsBaseUrl = ingestUrl
      ? `${ingestUrl.replace(/\/+$/, "")}/v1/analytics/rows`
      : (process.env.N8N_BASE_URL || "");
    const analyticsApiKey = process.env.ADR_INGEST_API_KEY || process.env.N8N_API_KEY || "";
    const analyticsTableId = ingestUrl ? "" : (process.env.N8N_ANALYTICS_TABLE_ID || "");
    const raw = await fetchAnalyticsRowsFromTable({
      baseUrl: analyticsBaseUrl,
      apiKey: analyticsApiKey,
      tableId: analyticsTableId,
      limit: Number.isFinite(args.analyticsLimit) ? args.analyticsLimit : 2000,
    });
    analyticsRows = normalizeSiteAnalyticsRows(raw);
    sourceStatus.analytics = { status: "ok", count: analyticsRows.length, message: "" };
  } catch (error) {
    sourceStatus.analytics = {
      status: classifySourceFailure(error.message),
      count: 0,
      message: error.message,
    };
    warnings.push(`analytics: ${error.message}`);
  }

  let gscRows = [];
  try {
    gscRows = await fetchSearchConsoleRows({
      accessToken: process.env.GSC_ACCESS_TOKEN || "",
      serviceAccountKeyPath: process.env.GSC_SERVICE_ACCOUNT_KEY_PATH || "",
      siteUrl: args.gscSiteUrl,
      startDate: args.gscStartDate,
      endDate: args.gscEndDate,
      rowLimit: Number.isFinite(args.gscRowLimit) ? args.gscRowLimit : 2000,
    });
    sourceStatus.search_console = { status: "ok", count: gscRows.length, message: "" };
  } catch (error) {
    const message = text(error?.message || error);
    const missingConfig = isMissingGscConfiguration(message);
    sourceStatus.search_console = {
      status: args.allowMissingGsc && missingConfig ? "skipped" : "failed",
      count: 0,
      message,
    };
    warnings.push(`search_console: ${message}`);
    if (!args.allowMissingGsc) {
      throw new Error(`Search Console is required for SEO performance board. ${message}`);
    }
  }

  if (analyticsRows.length <= 0 && gscRows.length <= 0) {
    throw new Error(
      [
        "SEO performance board could not collect analytics or Search Console data.",
        warnings.length ? `Warnings: ${warnings.join(" | ")}` : "",
      ]
        .filter(Boolean)
        .join(" "),
    );
  }

  const seoPages = await loadSeoPages();
  const board = buildPerformanceBoard({
    seoPages,
    analyticsRows,
    gscRows,
    sourceStatus,
    runtimeEnvLoadedFrom: runtimeEnv.loaded_from,
    args,
  });

  const jsonPath = path.join(outputDir, "seo_performance_board.json");
  const mdPath = path.join(outputDir, "seo_performance_board.md");
  const metaPath = path.join(outputDir, "seo_performance_meta.json");

  await writeFile(jsonPath, `${JSON.stringify(board, null, 2)}\n`, "utf8");
  await writeFile(mdPath, buildMarkdown(board), "utf8");
  await writeFile(
    metaPath,
    `${JSON.stringify(
      {
        created_at: new Date().toISOString(),
        runtime_env_loaded_from: runtimeEnv.loaded_from,
        source_status: sourceStatus,
        warnings,
        output_dir: outputDir,
      },
      null,
      2,
    )}\n`,
    "utf8",
  );

  logAutonomousDecision("seo performance board generated", {
    output_dir: outputDir,
    gsc_rows: gscRows.length,
    analytics_rows: analyticsRows.length,
  });

  console.log(`output_dir=${outputDir}`);
  console.log(`json=${jsonPath}`);
  console.log(`markdown=${mdPath}`);
  console.log(`meta=${metaPath}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
