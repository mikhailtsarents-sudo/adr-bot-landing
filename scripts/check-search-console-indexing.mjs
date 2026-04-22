#!/usr/bin/env node

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { resolveSearchConsoleAccessToken } from "./runtime/gsc-auth.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");

const DEFAULT_SITE_URL = "sc-domain:https://www.adr-bot.de/";
const DEFAULT_PROPERTY_URL = "https://www.adr-bot.de/";
const DEFAULT_URLS = [
  "https://www.adr-bot.de/adr-pruefung-auf-deutsch",
  "https://www.adr-bot.de/basiskurs-preview",
  "https://www.adr-bot.de/aufbaukurs-tank-preview",
];
const DEFAULT_REPORTS_DIR = path.join(repoRoot, "reports");
const DEFAULT_JSON_PATH = path.join(DEFAULT_REPORTS_DIR, "seo_index_watch.json");
const DEFAULT_TXT_PATH = path.join(DEFAULT_REPORTS_DIR, "seo_index_watch_latest.txt");

function printHelp() {
  console.log(`Usage: npm run check:gsc-indexing -- [options]

Options:
  --site-url <value>        Search Console siteUrl for API (default: ${DEFAULT_SITE_URL})
  --property-url <value>    Human-readable property URL (default: ${DEFAULT_PROPERTY_URL})
  --url <value>             URL to inspect (repeatable)
  --access-token <token>    Google OAuth access token for Search Console API
  --json-out <path>         Path to JSON report
  --txt-out <path>          Path to text summary report
  --help                    Show this help

Environment variables:
  GSC_ACCESS_TOKEN
  GSC_SERVICE_ACCOUNT_KEY_PATH
  GSC_SITE_URL
  GSC_PROPERTY_URL
`);
}

function parseArgs(argv) {
  const args = {
    siteUrl: process.env.GSC_SITE_URL || DEFAULT_SITE_URL,
    propertyUrl: process.env.GSC_PROPERTY_URL || DEFAULT_PROPERTY_URL,
    accessToken: process.env.GSC_ACCESS_TOKEN || null,
    serviceAccountKeyPath: process.env.GSC_SERVICE_ACCOUNT_KEY_PATH || null,
    urls: [],
    jsonOut: DEFAULT_JSON_PATH,
    txtOut: DEFAULT_TXT_PATH,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === "--site-url") args.siteUrl = argv[++i];
    else if (token === "--property-url") args.propertyUrl = argv[++i];
    else if (token === "--url") args.urls.push(argv[++i]);
    else if (token === "--access-token") args.accessToken = argv[++i];
    else if (token === "--service-account-key") args.serviceAccountKeyPath = argv[++i];
    else if (token === "--json-out") args.jsonOut = path.resolve(argv[++i]);
    else if (token === "--txt-out") args.txtOut = path.resolve(argv[++i]);
    else if (token === "--help" || token === "-h") {
      printHelp();
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${token}`);
    }
  }

  if (args.urls.length === 0) args.urls = DEFAULT_URLS;
  return args;
}

function normalizeCoverageState(result) {
  const verdict = result?.coverageState || "UNKNOWN";
  const verdictLower = verdict.toLowerCase();
  const indexed =
    verdictLower.includes("submitted and indexed") ||
    verdictLower.includes("indexed") ||
    verdictLower.includes("indexiert");

  return {
    verdict,
    indexed,
  };
}

async function inspectUrl({ siteUrl, accessToken, inspectionUrl }) {
  const response = await fetch(
    "https://searchconsole.googleapis.com/v1/urlInspection/index:inspect",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inspectionUrl,
        siteUrl,
      }),
    },
  );

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Search Console API failed for ${inspectionUrl}: ${response.status} ${body}`);
  }

  const payload = await response.json();
  const indexStatus = payload.inspectionResult?.indexStatusResult || {};
  const { verdict, indexed } = normalizeCoverageState(indexStatus);

  return {
    url: inspectionUrl,
    inspected_at: new Date().toISOString(),
    verdict,
    indexed,
    last_crawl_time: indexStatus.lastCrawlTime || null,
    page_fetch_state: indexStatus.pageFetchState || null,
    robots_txt_state: indexStatus.robotsTxtState || null,
    indexing_state: indexStatus.indexingState || null,
    google_canonical: indexStatus.googleCanonical || null,
    user_canonical: indexStatus.userCanonical || null,
    referring_sitemaps: indexStatus.referringUrls || [],
  };
}

async function loadPreviousReport(jsonPath) {
  try {
    const raw = await readFile(jsonPath, "utf8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function buildSummaryLines(report) {
  const lines = [];
  for (const item of report.urls) {
    const marker = item.indexed ? "INDEXED" : "NOT_INDEXED";
    lines.push(`${item.url}=${marker}`);
  }
  if (report.newlyIndexed.length > 0) {
    lines.push("");
    lines.push("newly_indexed:");
    for (const url of report.newlyIndexed) lines.push(`- ${url}`);
  }
  return `${lines.join("\n")}\n`;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const auth = await resolveSearchConsoleAccessToken({
    accessToken: args.accessToken,
    serviceAccountKeyPath: args.serviceAccountKeyPath,
  });

  await mkdir(path.dirname(args.jsonOut), { recursive: true });
  await mkdir(path.dirname(args.txtOut), { recursive: true });

  const previous = await loadPreviousReport(args.jsonOut);
  const previousIndexed = new Set(
    (previous?.urls || []).filter((item) => item.indexed).map((item) => item.url),
  );

  const urls = [];
  for (const inspectionUrl of args.urls) {
    const result = await inspectUrl({
      siteUrl: args.siteUrl,
      accessToken: auth.accessToken,
      inspectionUrl,
    });
    urls.push(result);
  }

  const newlyIndexed = urls
    .filter((item) => item.indexed && !previousIndexed.has(item.url))
    .map((item) => item.url);

  const report = {
    property_url: args.propertyUrl,
    site_url: args.siteUrl,
    checked_at: new Date().toISOString(),
    urls,
    indexed_count: urls.filter((item) => item.indexed).length,
    all_indexed: urls.every((item) => item.indexed),
    newlyIndexed,
  };

  await writeFile(args.jsonOut, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  await writeFile(args.txtOut, buildSummaryLines(report), "utf8");

  for (const item of urls) {
    console.log(`${item.url}=${item.indexed ? "INDEXED" : "NOT_INDEXED"}`);
  }
  console.log(`all_indexed=${report.all_indexed ? "true" : "false"}`);
  if (newlyIndexed.length > 0) {
    console.log(`newly_indexed=${newlyIndexed.join(",")}`);
  }
  console.log(`json_report=${args.jsonOut}`);
  console.log(`text_report=${args.txtOut}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
