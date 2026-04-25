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
import { enableStrictNonInteractiveMode } from "./runtime/non-interactive-mode.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const seoPagesPath = path.join(repoRoot, "src", "lib", "seo-pages.ts");
const reportsDir = path.join(repoRoot, "reports");
const genericRelatedPaths = new Set([
  "/",
  "/adr-pruefung-auf-deutsch",
  "/adr-begriffe",
  "/basiskurs-preview",
  "/adr-faq-fuer-fahrer",
]);
const defaultGscSiteUrl = "https://www.adr-bot.de/";

enableStrictNonInteractiveMode("run-seo-page-audit");

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
  console.log(`Usage: node scripts/run-seo-page-audit.mjs [options]

Options:
  --slug <value>            Output slug
  --analytics-limit <n>     Max analytics rows to fetch (default: 2000)
  --gsc-row-limit <n>       Max Search Console rows to fetch (default: 500)
  --gsc-site-url <value>    Search Console siteUrl override
  --help                    Show this help
`);
}

function parseArgs(argv) {
  const args = {
    slug: "",
    analyticsLimit: 2000,
    gscRowLimit: 500,
    gscSiteUrl: "",
  };

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === "--slug") args.slug = argv[++i];
    else if (token === "--analytics-limit") args.analyticsLimit = Number(argv[++i]);
    else if (token === "--gsc-row-limit") args.gscRowLimit = Number(argv[++i]);
    else if (token === "--gsc-site-url") args.gscSiteUrl = argv[++i];
    else if (token === "--help" || token === "-h") {
      printHelp();
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${token}`);
    }
  }

  return args;
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
        if (escaped) {
          escaped = false;
        } else if (char === "\\") {
          escaped = true;
        } else if (char === quote) {
          quote = "";
        }
      } else if (char === "\"" || char === "'" || char === "`") {
        quote = char;
      } else if (char === "{") {
        depth += 1;
      } else if (char === "}") {
        depth -= 1;
        if (depth === 0) {
          const blockText = source.slice(blockStart, cursor + 1);
          blocks.push({ exportName, blockText });
          break;
        }
      }
      cursor += 1;
    }
  }

  return blocks;
}

function extractField(blockText, fieldName) {
  const pattern = new RegExp(`${fieldName}:\\s*"([^"]*)"`);
  return text(blockText.match(pattern)?.[1] || "");
}

function extractArrayBlock(blockText, fieldName) {
  const fieldPattern = new RegExp(`${fieldName}:\\s*\\[`);
  const match = fieldPattern.exec(blockText);
  if (!match) return "";
  const start = blockText.indexOf("[", match.index);
  let cursor = start;
  let depth = 0;
  let quote = "";
  let escaped = false;

  while (cursor < blockText.length) {
    const char = blockText[cursor];
    if (quote) {
      if (escaped) {
        escaped = false;
      } else if (char === "\\") {
        escaped = true;
      } else if (char === quote) {
        quote = "";
      }
    } else if (char === "\"" || char === "'" || char === "`") {
      quote = char;
    } else if (char === "[") {
      depth += 1;
    } else if (char === "]") {
      depth -= 1;
      if (depth === 0) {
        return blockText.slice(start, cursor + 1);
      }
    }
    cursor += 1;
  }

  return "";
}

function countMatches(value, pattern) {
  return [...String(value || "").matchAll(pattern)].length;
}

function extractQuotedItems(arrayBlock) {
  return [...String(arrayBlock || "").matchAll(/"([^"]+)"/g)].map((match) => match[1]);
}

function tokenize(value) {
  return text(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .split(/\s+/)
    .filter((token) => token && token.length > 2);
}

function tokenSetForPage(page) {
  const values = [
    page.pageTitle,
    page.metaTitle,
    page.metaDescription,
    ...(page.keywords || []),
  ];
  return new Set(values.flatMap(tokenize));
}

function similarity(leftTokens, rightTokens) {
  const intersection = [...leftTokens].filter((token) => rightTokens.has(token)).length;
  const union = new Set([...leftTokens, ...rightTokens]).size;
  if (!union) return 0;
  return intersection / union;
}

function formatPercent(value) {
  return `${Math.round(num(value) * 100)}%`;
}

function buildMarkdownReport(report) {
  const lines = [];
  lines.push("# SEO Page Audit");
  lines.push("");
  lines.push(`- Created at: ${report.created_at}`);
  lines.push(`- SEO pages audited: ${report.page_count}`);
  lines.push(`- Analytics status: ${report.source_status.analytics.status} (${report.source_status.analytics.count})`);
  lines.push(`- Search Console status: ${report.source_status.search_console.status} (${report.source_status.search_console.count})`);
  if (report.source_status.search_console.message) {
    lines.push(`- Search Console note: ${report.source_status.search_console.message}`);
  }
  lines.push("");

  lines.push("## Top pages by views (30d)");
  lines.push("");
  if (!report.top_by_views.length) {
    lines.push("- No analytics-backed page views found.");
  } else {
    for (const row of report.top_by_views) {
      lines.push(`- ${row.path}: ${row.views} views, ${row.cta_clicks} CTA, ${row.redirects} redirects`);
    }
  }
  lines.push("");

  lines.push("## Top pages by redirects (30d)");
  lines.push("");
  if (!report.top_by_redirects.length) {
    lines.push("- No redirect data found.");
  } else {
    for (const row of report.top_by_redirects) {
      lines.push(`- ${row.path}: ${row.redirects} redirects from ${row.views} views (${formatPercent(row.redirect_rate_from_views)})`);
    }
  }
  lines.push("");

  lines.push("## Overlap pairs");
  lines.push("");
  if (!report.overlap_pairs.length) {
    lines.push("- No high-similarity pairs found.");
  } else {
    for (const row of report.overlap_pairs.slice(0, 8)) {
      lines.push(`- ${row.left} <-> ${row.right}: similarity ${Math.round(row.similarity * 100)}%`);
    }
  }
  lines.push("");

  lines.push("## Thin / weak pages");
  lines.push("");
  if (!report.thin_pages.length) {
    lines.push("- No thin pages by current heuristics.");
  } else {
    for (const row of report.thin_pages) {
      lines.push(`- ${row.path}: ${row.reasons.join(", ")}`);
    }
  }
  lines.push("");

  lines.push("## FAQ gaps");
  lines.push("");
  if (!report.faq_gaps.length) {
    lines.push("- No FAQ gaps.");
  } else {
    for (const row of report.faq_gaps) {
      lines.push(`- ${row.path}: ${row.faq_count} FAQ entries`);
    }
  }
  lines.push("");

  lines.push("## Internal linking gaps");
  lines.push("");
  if (!report.linking_gaps.length) {
    lines.push("- No internal linking gaps.");
  } else {
    for (const row of report.linking_gaps) {
      lines.push(`- ${row.path}: ${row.reason}`);
    }
  }
  lines.push("");

  lines.push("## Search Console winners");
  lines.push("");
  if (!report.top_by_impressions.length) {
    lines.push("- No Search Console data available in this run.");
  } else {
    for (const row of report.top_by_impressions) {
      lines.push(`- ${row.path}: ${row.impressions} impressions, ${row.clicks} clicks, CTR ${formatPercent(row.ctr)}`);
    }
  }
  lines.push("");

  return `${lines.join("\n")}\n`;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const runtimeEnv = await bootstrapLocalRuntimeEnv(repoRoot);
  const source = await readFile(seoPagesPath, "utf8");
  const pageBlocks = parseSeoPageBlocks(source);

  const pages = pageBlocks.map(({ exportName, blockText }) => {
    const keywordsBlock = extractArrayBlock(blockText, "keywords");
    const relatedLinksBlock = extractArrayBlock(blockText, "relatedLinks");
    const faqsBlock = extractArrayBlock(blockText, "faqs");
    const sampleQuestionsBlock = extractArrayBlock(blockText, "sampleQuestions");
    const sampleTermsBlock = extractArrayBlock(blockText, "sampleTerms");
    const relatedHrefs = [...String(relatedLinksBlock || "").matchAll(/href:\s*"([^"]+)"/g)].map((match) => match[1]);

    return {
      export_name: exportName,
      slug: extractField(blockText, "slug"),
      path: extractField(blockText, "path"),
      pageTitle: extractField(blockText, "pageTitle"),
      metaTitle: extractField(blockText, "metaTitle"),
      metaDescription: extractField(blockText, "metaDescription"),
      telegramSource: extractField(blockText, "telegramSource"),
      keywords: extractQuotedItems(keywordsBlock),
      faq_count: countMatches(faqsBlock, /question:\s*"/g),
      sample_question_count: countMatches(sampleQuestionsBlock, /question:\s*"/g),
      sample_term_count: countMatches(sampleTermsBlock, /term:\s*"/g),
      related_link_count: relatedHrefs.length,
      generic_related_count: relatedHrefs.filter((href) => genericRelatedPaths.has(href)).length,
      related_hrefs: relatedHrefs,
      tokens: tokenSetForPage({
        pageTitle: extractField(blockText, "pageTitle"),
        metaTitle: extractField(blockText, "metaTitle"),
        metaDescription: extractField(blockText, "metaDescription"),
        keywords: extractQuotedItems(keywordsBlock),
      }),
    };
  });

  const ingestUrl = process.env.ADR_INGEST_URL || "";
  const analyticsBaseUrl = ingestUrl
    ? `${ingestUrl.replace(/\/+$/, "")}/v1/analytics/rows`
    : (process.env.N8N_BASE_URL || "");
  const analyticsApiKey = process.env.ADR_INGEST_API_KEY || process.env.N8N_API_KEY || "";
  const analyticsTableId = ingestUrl ? "" : (process.env.N8N_ANALYTICS_TABLE_ID || "");

  const sourceStatus = {
    analytics: { status: "pending", count: 0, message: "" },
    search_console: { status: "pending", count: 0, message: "" },
  };

  let analyticsRows = [];
  try {
    analyticsRows = normalizeSiteAnalyticsRows(
      await fetchAnalyticsRowsFromTable({
        baseUrl: analyticsBaseUrl,
        apiKey: analyticsApiKey,
        tableId: analyticsTableId,
        limit: Number.isFinite(args.analyticsLimit) ? args.analyticsLimit : 2000,
      }),
    );
    sourceStatus.analytics = { status: "ok", count: analyticsRows.length, message: "" };
  } catch (error) {
    sourceStatus.analytics = {
      status: "failed",
      count: 0,
      message: text(error?.message || error),
    };
  }

  const sinceTs = Date.now() - 29 * 24 * 60 * 60 * 1000;
  const analytics30d = analyticsRows.filter((row) => {
    const raw = text(row.occurred_at) || text(row.received_at);
    const parsed = Date.parse(raw);
    return Number.isFinite(parsed) && parsed >= sinceTs;
  });

  const pageStats = new Map();
  for (const page of pages) {
    pageStats.set(page.path, {
      views: 0,
      cta_clicks: 0,
      redirects: 0,
    });
  }

  for (const row of analytics30d) {
    const pathKey = text(row.page_path);
    const stats = pageStats.get(pathKey);
    if (!stats) continue;
    if (row.event === "site_page_view") stats.views += 1;
    else if (row.event === "telegram_cta_click") stats.cta_clicks += 1;
    else if (row.event === "telegram_redirect") stats.redirects += 1;
  }

  const gscSiteUrl = text(args.gscSiteUrl || process.env.GSC_SITE_URL || defaultGscSiteUrl);
  const gscStartDate = new Date(Date.now() - 29 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const gscEndDate = new Date().toISOString().slice(0, 10);
  let searchConsoleRows = [];
  try {
    searchConsoleRows = await fetchSearchConsoleRows({
      accessToken: process.env.GSC_ACCESS_TOKEN || "",
      serviceAccountKeyPath: process.env.GSC_SERVICE_ACCOUNT_KEY_PATH || "",
      siteUrl: gscSiteUrl,
      startDate: gscStartDate,
      endDate: gscEndDate,
      rowLimit: Number.isFinite(args.gscRowLimit) ? args.gscRowLimit : 500,
    });
    sourceStatus.search_console = {
      status: "ok",
      count: searchConsoleRows.length,
      message: "",
    };
  } catch (error) {
    sourceStatus.search_console = {
      status: "skipped",
      count: 0,
      message: text(error?.message || error),
    };
  }

  const gscByPath = new Map();
  for (const row of searchConsoleRows) {
    try {
      const pathname = new URL(row.page).pathname;
      const entry = gscByPath.get(pathname) || {
        clicks: 0,
        impressions: 0,
        ctr_weighted_clicks: 0,
      };
      entry.clicks += num(row.clicks);
      entry.impressions += num(row.impressions);
      entry.ctr_weighted_clicks += num(row.clicks);
      gscByPath.set(pathname, entry);
    } catch {
      // ignore malformed URLs
    }
  }

  const pagesWithMetrics = pages.map((page) => {
    const stats = pageStats.get(page.path) || { views: 0, cta_clicks: 0, redirects: 0 };
    const gsc = gscByPath.get(page.path) || { clicks: 0, impressions: 0 };
    const redirectRateFromViews = stats.views > 0 ? stats.redirects / stats.views : 0;
    const ctaRateFromViews = stats.views > 0 ? stats.cta_clicks / stats.views : 0;
    const ctr = gsc.impressions > 0 ? gsc.clicks / gsc.impressions : 0;

    return {
      ...page,
      views: stats.views,
      cta_clicks: stats.cta_clicks,
      redirects: stats.redirects,
      redirect_rate_from_views: round(redirectRateFromViews),
      cta_rate_from_views: round(ctaRateFromViews),
      gsc_clicks: gsc.clicks,
      gsc_impressions: gsc.impressions,
      gsc_ctr: round(ctr),
    };
  });

  const overlapPairs = [];
  for (let i = 0; i < pagesWithMetrics.length; i += 1) {
    for (let j = i + 1; j < pagesWithMetrics.length; j += 1) {
      const left = pagesWithMetrics[i];
      const right = pagesWithMetrics[j];
      const overlap = similarity(left.tokens, right.tokens);
      if (overlap >= 0.3) {
        overlapPairs.push({
          left: left.path,
          right: right.path,
          similarity: round(overlap),
        });
      }
    }
  }

  const thinPages = pagesWithMetrics
    .map((page) => {
      const reasons = [];
      if (page.sample_question_count + page.sample_term_count < 4) {
        reasons.push("small sample block");
      }
      if (page.faq_count < 3) {
        reasons.push("thin FAQ layer");
      }
      if (page.related_link_count < 3) {
        reasons.push("few related links");
      }
      if (page.views === 0) {
        reasons.push("no views in 30d");
      }
      return {
        path: page.path,
        reasons,
      };
    })
    .filter((page) => page.reasons.length > 0)
    .sort((left, right) => right.reasons.length - left.reasons.length || left.path.localeCompare(right.path));

  const linkingGaps = pagesWithMetrics
    .map((page) => {
      if (page.related_link_count < 3) {
        return { path: page.path, reason: "less than 3 related links" };
      }
      if (page.generic_related_count === page.related_link_count) {
        return { path: page.path, reason: "all related links are generic hubs" };
      }
      if (page.generic_related_count >= 2 && page.related_link_count <= 3) {
        return { path: page.path, reason: "generic hubs dominate related links" };
      }
      return null;
    })
    .filter(Boolean);

  const report = {
    created_at: new Date().toISOString(),
    runtime_env: runtimeEnv,
    source_status: sourceStatus,
    page_count: pagesWithMetrics.length,
    top_by_views: [...pagesWithMetrics]
      .sort((left, right) => right.views - left.views || left.path.localeCompare(right.path))
      .slice(0, 10)
      .map((page) => ({
        path: page.path,
        views: page.views,
        cta_clicks: page.cta_clicks,
        redirects: page.redirects,
      })),
    top_by_redirects: [...pagesWithMetrics]
      .filter((page) => page.redirects > 0)
      .sort((left, right) => right.redirects - left.redirects || left.path.localeCompare(right.path))
      .slice(0, 10)
      .map((page) => ({
        path: page.path,
        views: page.views,
        redirects: page.redirects,
        redirect_rate_from_views: page.redirect_rate_from_views,
      })),
    faq_gaps: [...pagesWithMetrics]
      .filter((page) => page.faq_count < 3)
      .map((page) => ({ path: page.path, faq_count: page.faq_count })),
    linking_gaps: linkingGaps,
    thin_pages: thinPages.slice(0, 12),
    overlap_pairs: overlapPairs
      .sort((left, right) => right.similarity - left.similarity || left.left.localeCompare(right.left))
      .slice(0, 12),
    top_by_impressions: [...pagesWithMetrics]
      .filter((page) => page.gsc_impressions > 0)
      .sort((left, right) => right.gsc_impressions - left.gsc_impressions || left.path.localeCompare(right.path))
      .slice(0, 10)
      .map((page) => ({
        path: page.path,
        impressions: page.gsc_impressions,
        clicks: page.gsc_clicks,
        ctr: page.gsc_ctr,
      })),
    pages: pagesWithMetrics.map((page) => ({
      path: page.path,
      pageTitle: page.pageTitle,
      metaTitle: page.metaTitle,
      telegramSource: page.telegramSource,
      faq_count: page.faq_count,
      sample_question_count: page.sample_question_count,
      sample_term_count: page.sample_term_count,
      related_link_count: page.related_link_count,
      generic_related_count: page.generic_related_count,
      views: page.views,
      cta_clicks: page.cta_clicks,
      redirects: page.redirects,
      redirect_rate_from_views: page.redirect_rate_from_views,
      gsc_impressions: page.gsc_impressions,
      gsc_clicks: page.gsc_clicks,
      gsc_ctr: page.gsc_ctr,
    })),
  };

  const outputSlug = slugify(args.slug || `seo-page-audit-${Date.now()}`) || `seo-page-audit-${Date.now()}`;
  const outputDir = path.join(reportsDir, outputSlug);
  await mkdir(outputDir, { recursive: true });
  await writeFile(path.join(outputDir, "seo_page_audit.json"), `${JSON.stringify(report, null, 2)}\n`, "utf8");
  await writeFile(path.join(outputDir, "seo_page_audit.md"), buildMarkdownReport(report), "utf8");

  console.log(JSON.stringify({
    ok: true,
    output_dir: outputDir,
    page_count: report.page_count,
    analytics_status: report.source_status.analytics.status,
    analytics_count: report.source_status.analytics.count,
    search_console_status: report.source_status.search_console.status,
    search_console_count: report.source_status.search_console.count,
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
