import { analyticsEventNames, shouldCountTelegramRedirect } from "@/lib/analytics";
import type { StoredAnalyticsRow } from "@/lib/analytics-storage";

export type DashboardPeriodKey = "today" | "days_7" | "days_30";

export type DashboardBucket = {
  period_key: DashboardPeriodKey;
  label_ru: string;
  window_days: number;
  since: string;
  until: string;
  total_events: number;
  site_page_views: number;
  telegram_cta_clicks: number;
  telegram_redirects: number;
  unique_sources: number;
  unique_page_paths: number;
  redirect_rate_from_views: number;
  redirect_rate_from_cta: number;
  excluded_bot_redirects: number;
};

export type DashboardDimensionRow = {
  key: string;
  count: number;
};

export type DashboardEventMixRow = {
  event: string;
  count: number;
};

export type AnalyticsDashboard = {
  refreshed_at: string;
  source: string;
  timezone: string;
  total_rows_considered: number;
  periods: DashboardBucket[];
  period_map: Record<DashboardPeriodKey, DashboardBucket>;
  funnel_30d: {
    site_page_views: number;
    telegram_cta_clicks: number;
    telegram_redirects: number;
    cta_rate_from_views: number;
    redirect_rate_from_views: number;
    redirect_rate_from_cta: number;
  };
  event_mix_30d: DashboardEventMixRow[];
  top_sources_30d: DashboardDimensionRow[];
  top_pages_30d: DashboardDimensionRow[];
  top_page_types_30d: DashboardDimensionRow[];
  top_redirect_sources_30d: DashboardDimensionRow[];
  latest_events: Array<{
    event: string;
    source: string;
    page_path: string;
    occurred_at: string;
  }>;
  latest_redirects: Array<{
    source: string;
    page_path: string;
    occurred_at: string;
  }>;
  excluded_bot_redirects_30d: number;
};

function text(value: unknown) {
  return value == null ? "" : String(value).trim();
}

function parseTimestamp(row: StoredAnalyticsRow) {
  const raw = text(row.occurred_at) || text(row.received_at) || text(row.createdAt);
  const parsed = Date.parse(raw);
  return Number.isFinite(parsed) ? parsed : 0;
}

function inRange(timestamp: number, since: number, until: number) {
  return timestamp >= since && timestamp <= until;
}

function roundRate(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Number(value.toFixed(4));
}

function parseOffsetToMinutes(offsetText: string) {
  const match = offsetText.match(/^GMT([+-])(\d{1,2})(?::?(\d{2}))?$/);
  if (!match) return 0;

  const sign = match[1] === "-" ? -1 : 1;
  const hours = Number(match[2] || "0");
  const minutes = Number(match[3] || "0");
  return sign * (hours * 60 + minutes);
}

function getTimezoneOffsetMinutes(timestamp: number, timeZone: string) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    timeZoneName: "shortOffset",
    hour: "2-digit",
  });
  const offsetPart = formatter
    .formatToParts(new Date(timestamp))
    .find((part) => part.type === "timeZoneName");
  return parseOffsetToMinutes(offsetPart?.value ?? "GMT+0");
}

function getZonedDateParts(timestamp: number, timeZone: string) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = formatter.formatToParts(new Date(timestamp));

  return {
    year: Number(parts.find((part) => part.type === "year")?.value ?? "1970"),
    month: Number(parts.find((part) => part.type === "month")?.value ?? "01"),
    day: Number(parts.find((part) => part.type === "day")?.value ?? "01"),
  };
}

function getStartOfDayInTimezone(timestamp: number, timeZone: string) {
  const { year, month, day } = getZonedDateParts(timestamp, timeZone);
  const utcMidnight = Date.UTC(year, month - 1, day, 0, 0, 0, 0);
  const offsetMinutes = getTimezoneOffsetMinutes(utcMidnight, timeZone);
  return utcMidnight - offsetMinutes * 60 * 1000;
}

function shiftDays(timestamp: number, days: number) {
  return timestamp + days * 24 * 60 * 60 * 1000;
}

function topCounts(values: string[], limit = 8): DashboardDimensionRow[] {
  const counter = new Map<string, number>();
  for (const value of values) {
    const key = text(value);
    if (!key) continue;
    counter.set(key, (counter.get(key) || 0) + 1);
  }

  return [...counter.entries()]
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .slice(0, Math.max(0, limit))
    .map(([key, count]) => ({ key, count }));
}

function buildPeriodBucket({
  rows,
  periodKey,
  labelRu,
  windowDays,
  sinceTs,
  untilTs,
}: {
  rows: StoredAnalyticsRow[];
  periodKey: DashboardPeriodKey;
  labelRu: string;
  windowDays: number;
  sinceTs: number;
  untilTs: number;
}): DashboardBucket {
  const rawPeriodRows = rows.filter((row) => inRange(parseTimestamp(row), sinceTs, untilTs));
  const filtered = rawPeriodRows.filter((row) => shouldCountTelegramRedirect(row));

  const sitePageViews = filtered.filter((row) => row.event === analyticsEventNames.sitePageView).length;
  const telegramCtaClicks = filtered.filter((row) => row.event === analyticsEventNames.telegramCtaClick).length;
  const telegramRedirects = filtered.filter((row) => row.event === analyticsEventNames.telegramRedirect).length;
  const excludedBotRedirects = rawPeriodRows.filter(
    (row) =>
      row.event === analyticsEventNames.telegramRedirect &&
      !shouldCountTelegramRedirect(row),
  ).length;

  const uniqueSources = new Set(filtered.map((row) => text(row.source)).filter(Boolean)).size;
  const uniquePagePaths = new Set(filtered.map((row) => text(row.page_path)).filter(Boolean)).size;

  return {
    period_key: periodKey,
    label_ru: labelRu,
    window_days: windowDays,
    since: new Date(sinceTs).toISOString(),
    until: new Date(untilTs).toISOString(),
    total_events: filtered.length,
    site_page_views: sitePageViews,
    telegram_cta_clicks: telegramCtaClicks,
    telegram_redirects: telegramRedirects,
    unique_sources: uniqueSources,
    unique_page_paths: uniquePagePaths,
    redirect_rate_from_views: roundRate(sitePageViews > 0 ? telegramRedirects / sitePageViews : 0),
    redirect_rate_from_cta: roundRate(telegramCtaClicks > 0 ? telegramRedirects / telegramCtaClicks : 0),
    excluded_bot_redirects: excludedBotRedirects,
  };
}

function buildEventMix(rows: StoredAnalyticsRow[]): DashboardEventMixRow[] {
  return topCounts(rows.map((row) => text(row.event)), 16).map((row) => ({
    event: row.key,
    count: row.count,
  }));
}

export function buildAnalyticsDashboard(
  rows: StoredAnalyticsRow[],
  options?: { timeZone?: string },
): AnalyticsDashboard {
  const nowTs = Date.now();
  const timeZone = options?.timeZone || process.env.ANALYTICS_DASHBOARD_TIMEZONE || "Europe/Berlin";
  const orderedRows = [...rows].sort((left, right) => parseTimestamp(right) - parseTimestamp(left));
  const filteredRows = orderedRows.filter((row) => shouldCountTelegramRedirect(row));
  const startOfTodayTs = getStartOfDayInTimezone(nowTs, timeZone);
  const startOf7dTs = shiftDays(startOfTodayTs, -6);
  const startOf30dTs = shiftDays(startOfTodayTs, -29);
  const latest30d = filteredRows.filter((row) => inRange(parseTimestamp(row), startOf30dTs, nowTs));
  const excludedBotRedirects30d = orderedRows.filter(
    (row) =>
      inRange(parseTimestamp(row), startOf30dTs, nowTs) &&
      row.event === analyticsEventNames.telegramRedirect &&
      !shouldCountTelegramRedirect(row),
  ).length;

  const periods = [
    buildPeriodBucket({
      rows: filteredRows,
      periodKey: "today",
      labelRu: "Сегодня",
      windowDays: 1,
      sinceTs: startOfTodayTs,
      untilTs: nowTs,
    }),
    buildPeriodBucket({
      rows: filteredRows,
      periodKey: "days_7",
      labelRu: "7 дней",
      windowDays: 7,
      sinceTs: startOf7dTs,
      untilTs: nowTs,
    }),
    buildPeriodBucket({
      rows: filteredRows,
      periodKey: "days_30",
      labelRu: "30 дней",
      windowDays: 30,
      sinceTs: startOf30dTs,
      untilTs: nowTs,
    }),
  ];

  const periodMap = {
    today: periods[0],
    days_7: periods[1],
    days_30: periods[2],
  } satisfies Record<DashboardPeriodKey, DashboardBucket>;

  const latestRedirects = filteredRows
    .filter((row) => row.event === analyticsEventNames.telegramRedirect)
    .slice(0, 10)
    .map((row) => ({
      source: text(row.source),
      page_path: text(row.page_path),
      occurred_at: text(row.occurred_at) || text(row.received_at) || text(row.createdAt),
    }));

  return {
    refreshed_at: new Date(nowTs).toISOString(),
    source: "n8n_data_table_site_analytics",
    timezone: timeZone,
    total_rows_considered: filteredRows.length,
    periods,
    period_map: periodMap,
    funnel_30d: {
      site_page_views: periodMap.days_30.site_page_views,
      telegram_cta_clicks: periodMap.days_30.telegram_cta_clicks,
      telegram_redirects: periodMap.days_30.telegram_redirects,
      cta_rate_from_views: roundRate(
        periodMap.days_30.site_page_views > 0
          ? periodMap.days_30.telegram_cta_clicks / periodMap.days_30.site_page_views
          : 0,
      ),
      redirect_rate_from_views: periodMap.days_30.redirect_rate_from_views,
      redirect_rate_from_cta: periodMap.days_30.redirect_rate_from_cta,
    },
    event_mix_30d: buildEventMix(latest30d),
    top_sources_30d: topCounts(latest30d.map((row) => text(row.source))),
    top_pages_30d: topCounts(latest30d.map((row) => text(row.page_path))),
    top_page_types_30d: topCounts(latest30d.map((row) => text(row.page_type))),
    top_redirect_sources_30d: topCounts(
      latest30d
        .filter((row) => row.event === analyticsEventNames.telegramRedirect)
        .map((row) => text(row.source)),
    ),
    latest_events: filteredRows.slice(0, 15).map((row) => ({
      event: text(row.event),
      source: text(row.source),
      page_path: text(row.page_path),
      occurred_at: text(row.occurred_at) || text(row.received_at) || text(row.createdAt),
    })),
    latest_redirects: latestRedirects,
    excluded_bot_redirects_30d: excludedBotRedirects30d,
  };
}
