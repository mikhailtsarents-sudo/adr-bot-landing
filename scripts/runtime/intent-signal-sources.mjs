import { readFile } from "node:fs/promises";
import { resolveSearchConsoleAccessToken } from "./gsc-auth.mjs";

function text(value) {
  return value == null ? "" : String(value).trim();
}

function num(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toIsoDate(value) {
  const safe = text(value);
  if (!safe) return "";
  return safe.slice(0, 10);
}

const botUserAgentPatterns = [
  /claudebot/i,
  /gptbot/i,
  /chatgpt-user/i,
  /googleother/i,
  /ccbot/i,
  /bytespider/i,
  /petalbot/i,
  /facebookexternalhit/i,
  /slackbot/i,
  /linkedinbot/i,
  /twitterbot/i,
  /bingbot/i,
  /crawler/i,
  /spider/i,
  /bot\b/i,
];

function isBotLikeUserAgent(userAgent) {
  const value = text(userAgent);
  if (!value) return false;
  return botUserAgentPatterns.some((pattern) => pattern.test(value));
}

function shouldCountTelegramRedirect(row) {
  if (text(row?.event) !== "telegram_redirect") {
    return true;
  }

  return !isBotLikeUserAgent(row?.user_agent);
}

export async function loadJsonIfExists(filePath) {
  if (!text(filePath)) return [];
  try {
    const raw = await readFile(filePath, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : Array.isArray(parsed?.rows) ? parsed.rows : [];
  } catch {
    return [];
  }
}

export async function fetchAnalyticsRowsFromTable({
  baseUrl,
  apiKey,
  tableId,
  limit = 250,
}) {
  if (!text(baseUrl) || !text(apiKey)) {
    throw new Error("Missing base URL or API key for live analytics fetch.");
  }

  // When tableId is empty, baseUrl is the full endpoint (adr-ingest); otherwise build n8n Cloud path.
  const url = text(tableId)
    ? new URL(`${baseUrl.replace(/\/+$/g, "")}/api/v1/data-tables/${tableId}/rows`)
    : new URL(baseUrl.replace(/\/+$/, ""));
  url.searchParams.set("limit", String(Math.max(1, Math.min(limit, 250))));

  const headers = text(tableId)
    ? { "X-N8N-API-KEY": apiKey }
    : { "X-ADR-API-KEY": apiKey, "X-N8N-API-KEY": apiKey };

  const response = await fetch(url.toString(), {
    method: "GET",
    headers,
    cache: "no-store",
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Live analytics table fetch failed with ${response.status}: ${body.slice(0, 400)}`);
  }

  const json = await response.json();
  return Array.isArray(json?.data) ? json.data : [];
}

export function normalizeSiteAnalyticsRows(rows) {
  return rows
    .filter((row) => shouldCountTelegramRedirect(row))
    .map((row) => ({
      event: text(row.event),
      source: text(row.source),
      page_path: text(row.page_path),
      page_slug: text(row.page_slug),
      page_type: text(row.page_type),
      locale: text(row.locale),
      target: text(row.target),
      occurred_at: text(row.occurred_at),
      received_at: text(row.received_at || row.createdAt),
    }));
}

export async function fetchSearchConsoleRows({
  accessToken,
  serviceAccountKeyPath = "",
  siteUrl,
  startDate,
  endDate,
  rowLimit = 250,
}) {
  if (!text(siteUrl)) {
    throw new Error("Missing GSC_SITE_URL for live Search Console fetch.");
  }
  if (!text(startDate) || !text(endDate)) {
    throw new Error("Search Console fetch requires startDate and endDate.");
  }

  const auth = await resolveSearchConsoleAccessToken({
    accessToken,
    serviceAccountKeyPath,
  });

  const response = await fetch(
    `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${auth.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        startDate: toIsoDate(startDate),
        endDate: toIsoDate(endDate),
        dimensions: ["query", "page"],
        rowLimit: Math.max(1, Math.min(rowLimit, 25000)),
      }),
      cache: "no-store",
    },
  );

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Search Console query failed with ${response.status}: ${body.slice(0, 500)}`);
  }

  const json = await response.json();
  const rows = Array.isArray(json?.rows) ? json.rows : [];

  return rows.map((row) => ({
    query: text(row.keys?.[0]),
    page: text(row.keys?.[1]),
    clicks: num(row.clicks, 0),
    impressions: num(row.impressions, 0),
    ctr: num(row.ctr, 0),
    position: num(row.position, 0),
  }));
}

export async function buildLiveIntentSnapshot({
  analytics,
  searchConsole,
  telegramFeedbackPath = "",
  contentFeedbackPath = "",
}) {
  const [telegramFeedback, contentFeedback] = await Promise.all([
    loadJsonIfExists(telegramFeedbackPath),
    loadJsonIfExists(contentFeedbackPath),
  ]);

  return {
    created_at: new Date().toISOString(),
    search_console: searchConsole,
    site_analytics: analytics,
    telegram_feedback: telegramFeedback,
    content_feedback: contentFeedback,
  };
}
