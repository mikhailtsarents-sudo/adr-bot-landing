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

export type ConversionLocaleRow = {
  locale: string;
  views: number;
  cta_clicks: number;
  redirects: number;
  cta_rate_from_views: number;
  redirect_rate_from_views: number;
  redirect_rate_from_cta: number;
};

export type ConversionPageRow = {
  page_path: string;
  locale: string;
  views: number;
  cta_clicks: number;
  redirects: number;
  cta_rate_from_views: number;
  redirect_rate_from_views: number;
  redirect_rate_from_cta: number;
};

export type ConversionCtaSourceRow = {
  source: string;
  cta_clicks: number;
  redirects: number;
  redirect_rate_from_cta: number;
  top_locale: string;
};

export type ConversionControlDashboard = {
  largest_dropoff_step: "views_to_cta" | "cta_to_redirect" | "balanced";
  views_to_cta_gap: number;
  cta_to_redirect_gap: number;
  locale_breakdown_30d: ConversionLocaleRow[];
  page_breakdown_30d: ConversionPageRow[];
  cta_source_breakdown_30d: ConversionCtaSourceRow[];
  recommendations: string[];
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
  conversion_control_30d: ConversionControlDashboard;
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

function buildConversionControl(latest30d: StoredAnalyticsRow[], funnel30d: AnalyticsDashboard["funnel_30d"]): ConversionControlDashboard {
  const localeMap = new Map<string, { views: number; cta_clicks: number; redirects: number }>();
  const pageMap = new Map<string, { page_path: string; locale: string; views: number; cta_clicks: number; redirects: number }>();
  const sourceMap = new Map<string, { cta_clicks: number; redirects: number; localeCounts: Map<string, number> }>();

  for (const row of latest30d) {
    const locale = text(row.locale) || "unknown";
    const pagePath = text(row.page_path) || "unknown";
    const source = text(row.source) || "unknown";

    const localeBucket = localeMap.get(locale) || { views: 0, cta_clicks: 0, redirects: 0 };
    const pageKey = `${locale}::${pagePath}`;
    const pageBucket = pageMap.get(pageKey) || {
      page_path: pagePath,
      locale,
      views: 0,
      cta_clicks: 0,
      redirects: 0,
    };

    if (row.event === analyticsEventNames.sitePageView) {
      localeBucket.views += 1;
      pageBucket.views += 1;
    } else if (row.event === analyticsEventNames.telegramCtaClick) {
      const sourceBucket = sourceMap.get(source) || {
        cta_clicks: 0,
        redirects: 0,
        localeCounts: new Map<string, number>(),
      };
      localeBucket.cta_clicks += 1;
      pageBucket.cta_clicks += 1;
      sourceBucket.cta_clicks += 1;
      sourceBucket.localeCounts.set(locale, (sourceBucket.localeCounts.get(locale) || 0) + 1);
      sourceMap.set(source, sourceBucket);
    } else if (row.event === analyticsEventNames.telegramRedirect) {
      const sourceBucket = sourceMap.get(source) || {
        cta_clicks: 0,
        redirects: 0,
        localeCounts: new Map<string, number>(),
      };
      localeBucket.redirects += 1;
      pageBucket.redirects += 1;
      sourceBucket.redirects += 1;
      sourceBucket.localeCounts.set(locale, (sourceBucket.localeCounts.get(locale) || 0) + 1);
      sourceMap.set(source, sourceBucket);
    }

    localeMap.set(locale, localeBucket);
    pageMap.set(pageKey, pageBucket);
  }

  const localeBreakdown = [...localeMap.entries()]
    .map(([locale, bucket]) => ({
      locale,
      views: bucket.views,
      cta_clicks: bucket.cta_clicks,
      redirects: bucket.redirects,
      cta_rate_from_views: roundRate(bucket.views > 0 ? bucket.cta_clicks / bucket.views : 0),
      redirect_rate_from_views: roundRate(bucket.views > 0 ? bucket.redirects / bucket.views : 0),
      redirect_rate_from_cta: roundRate(bucket.cta_clicks > 0 ? bucket.redirects / bucket.cta_clicks : 0),
    }))
    .sort((left, right) => right.redirects - left.redirects || right.cta_clicks - left.cta_clicks || left.locale.localeCompare(right.locale))
    .slice(0, 12);

  const pageBreakdown = [...pageMap.values()]
    .map((bucket) => ({
      ...bucket,
      cta_rate_from_views: roundRate(bucket.views > 0 ? bucket.cta_clicks / bucket.views : 0),
      redirect_rate_from_views: roundRate(bucket.views > 0 ? bucket.redirects / bucket.views : 0),
      redirect_rate_from_cta: roundRate(bucket.cta_clicks > 0 ? bucket.redirects / bucket.cta_clicks : 0),
    }))
    .sort((left, right) => right.redirects - left.redirects || right.cta_clicks - left.cta_clicks || left.page_path.localeCompare(right.page_path))
    .slice(0, 15);

  const ctaSourceBreakdown = [...sourceMap.entries()]
    .map(([source, bucket]) => {
      const topLocale =
        [...bucket.localeCounts.entries()].sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))[0]?.[0] ||
        "unknown";

      return {
        source,
        cta_clicks: bucket.cta_clicks,
        redirects: bucket.redirects,
        redirect_rate_from_cta: roundRate(bucket.cta_clicks > 0 ? bucket.redirects / bucket.cta_clicks : 0),
        top_locale: topLocale,
      };
    })
    .sort((left, right) => right.redirects - left.redirects || right.cta_clicks - left.cta_clicks || left.source.localeCompare(right.source))
    .slice(0, 20);

  const viewsToCtaGap = Math.max(0, funnel30d.site_page_views - funnel30d.telegram_cta_clicks);
  const ctaToRedirectGap = Math.max(0, funnel30d.telegram_cta_clicks - funnel30d.telegram_redirects);
  const largestDropoffStep =
    viewsToCtaGap > ctaToRedirectGap
      ? "views_to_cta"
      : ctaToRedirectGap > viewsToCtaGap
        ? "cta_to_redirect"
        : "balanced";

  const recommendations: string[] = [];
  if (funnel30d.cta_rate_from_views < 0.08) {
    recommendations.push("CTA rate from views is still low. Keep strengthening above-the-fold proof and Telegram-first framing.");
  }
  if (funnel30d.redirect_rate_from_cta < 0.7) {
    recommendations.push("Clicks are not converting into redirects cleanly enough. Recheck redirect friction, language clarity, and mobile CTA placement.");
  }
  const weakLocales = localeBreakdown.filter((row) => row.views >= 20 && row.cta_rate_from_views < 0.05).map((row) => row.locale);
  if (weakLocales.length > 0) {
    recommendations.push(`Lowest-converting locales right now: ${weakLocales.join(", ")}. Review copy quality and trust cues there first.`);
  }
  const dominantSource = ctaSourceBreakdown[0];
  if (dominantSource && dominantSource.cta_clicks > 0) {
    const totalCtaClicks = ctaSourceBreakdown.reduce((sum, row) => sum + row.cta_clicks, 0);
    if (totalCtaClicks > 0 && dominantSource.cta_clicks / totalCtaClicks >= 0.6) {
      recommendations.push(`CTA demand is concentrated in ${dominantSource.source}. Avoid overfitting to one entry point; strengthen secondary CTA positions too.`);
    }
  }
  if (recommendations.length === 0) {
    recommendations.push("No acute conversion blocker detected in the last 30 days. Keep monitoring locale and CTA-source mix.");
  }

  return {
    largest_dropoff_step: largestDropoffStep,
    views_to_cta_gap: viewsToCtaGap,
    cta_to_redirect_gap: ctaToRedirectGap,
    locale_breakdown_30d: localeBreakdown,
    page_breakdown_30d: pageBreakdown,
    cta_source_breakdown_30d: ctaSourceBreakdown,
    recommendations,
  };
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

  const funnel30d = {
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
  };

  return {
    refreshed_at: new Date(nowTs).toISOString(),
    source: "n8n_data_table_site_analytics",
    timezone: timeZone,
    total_rows_considered: filteredRows.length,
    periods,
    period_map: periodMap,
    funnel_30d: funnel30d,
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
    conversion_control_30d: buildConversionControl(latest30d, funnel30d),
  };
}
