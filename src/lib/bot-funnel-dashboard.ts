import type { BotFunnelRow } from "@/lib/bot-funnel-storage";

export type DashboardPeriodKey = "today" | "days_7" | "days_30";

const FUNNEL_STEPS = [
  "bot_started",
  "course_selected",
  "word_session_started",
  "quiz_started",
  "word_response",
  "quiz_answer_submitted",
] as const;

type FunnelStep = (typeof FUNNEL_STEPS)[number];

export type FunnelStepRow = {
  step: string;
  count: number;
  drop_off_pct: number | null;
};

export type ReferralSummary = {
  granted: number;
  rejected: number;
  grant_rate: number;
  offer_views: number;
  unlock_clicks: number;
  counted_screens: number;
  duplicate_screens: number;
  top_referrers_30d: SourceBreakdown[];
  rejection_reasons_30d: SourceBreakdown[];
  grant_variants_30d: SourceBreakdown[];
};

export type SourceBreakdown = {
  source: string;
  count: number;
};

export type BotFunnelPeriodBucket = {
  period_key: DashboardPeriodKey;
  label_ru: string;
  window_days: number;
  since: string;
  until: string;
  total_events: number;
  bot_starts: number;
  course_selected: number;
  first_actions: number;
  learning_actions: number;
  buy_intent: number;
  referral_granted: number;
  referral_rejected: number;
  start_to_first_action_rate: number;
  start_to_buy_intent_rate: number;
};

export type BotFunnelDashboard = {
  refreshed_at: string;
  timezone: string;
  total_events: number;
  total_events_30d: number;
  periods: BotFunnelPeriodBucket[];
  period_map: Record<DashboardPeriodKey, BotFunnelPeriodBucket>;
  funnel_30d: FunnelStepRow[];
  referral_30d: ReferralSummary;
  top_sources_30d: SourceBreakdown[];
  top_kurs_30d: SourceBreakdown[];
  event_mix_30d: { event_type: string; count: number }[];
  youtube_starts_30d: number;
  direct_starts_30d: number;
};

function parseMetadata(row: BotFunnelRow): Record<string, unknown> {
  const raw = row.metadata_json;
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function metadataText(
  row: BotFunnelRow,
  ...keys: string[]
): string {
  const metadata = parseMetadata(row);
  for (const key of keys) {
    const value = metadata[key];
    if (value != null && `${value}`.trim()) {
      return `${value}`.trim();
    }
  }
  return "";
}

function getStartOfDayInTimezone(daysAgo: number, timeZone: string): Date {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const localDateStr = formatter.format(now);
  const base = new Date(`${localDateStr}T00:00:00`);
  base.setDate(base.getDate() - daysAgo);
  return base;
}

function count(rows: BotFunnelRow[], predicate: (r: BotFunnelRow) => boolean): number {
  return rows.filter(predicate).length;
}

function roundRate(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Number(value.toFixed(4));
}

function buildPeriodBucket({
  rows,
  periodKey,
  labelRu,
  windowDays,
  since,
  until,
}: {
  rows: BotFunnelRow[];
  periodKey: DashboardPeriodKey;
  labelRu: string;
  windowDays: number;
  since: Date;
  until: Date;
}): BotFunnelPeriodBucket {
  const scopedRows = rows.filter((r) => {
    const ts = r.occurred_at || r.received_at || r.createdAt || "";
    if (!ts) return false;
    const parsed = new Date(ts);
    return parsed >= since && parsed <= until;
  });

  const botStarts = count(scopedRows, (r) => r.event_type === "bot_started");
  const courseSelected = count(scopedRows, (r) => r.event_type === "course_selected");
  const firstActions = count(
    scopedRows,
    (r) => r.event_type === "word_session_started" || r.event_type === "quiz_started",
  );
  const learningActions = count(
    scopedRows,
    (r) => r.event_type === "word_response" || r.event_type === "quiz_answer_submitted",
  );
  const buyIntent = count(scopedRows, (r) => r.event_type === "full_access_buy_click");
  const referralGranted = count(scopedRows, (r) => r.event_type === "referral_granted");
  const referralRejected = count(scopedRows, (r) => r.event_type === "referral_rejected");

  return {
    period_key: periodKey,
    label_ru: labelRu,
    window_days: windowDays,
    since: since.toISOString(),
    until: until.toISOString(),
    total_events: scopedRows.length,
    bot_starts: botStarts,
    course_selected: courseSelected,
    first_actions: firstActions,
    learning_actions: learningActions,
    buy_intent: buyIntent,
    referral_granted: referralGranted,
    referral_rejected: referralRejected,
    start_to_first_action_rate: roundRate(botStarts > 0 ? firstActions / botStarts : 0),
    start_to_buy_intent_rate: roundRate(botStarts > 0 ? buyIntent / botStarts : 0),
  };
}

export function buildBotFunnelDashboard(
  rows: BotFunnelRow[],
  options: { timeZone?: string } = {},
): BotFunnelDashboard {
  const timeZone = options.timeZone ?? "Europe/Berlin";
  const now = new Date();
  const sinceToday = getStartOfDayInTimezone(0, timeZone);
  const since7d = getStartOfDayInTimezone(6, timeZone);
  const since30d = getStartOfDayInTimezone(30, timeZone);

  const rows30d = rows.filter((r) => {
    const ts = r.occurred_at || r.received_at || r.createdAt || "";
    return ts ? new Date(ts) >= since30d : false;
  });

  // Funnel — ordered steps with drop-off
  const stepCounts: Record<string, number> = {};
  for (const step of FUNNEL_STEPS) {
    stepCounts[step] = count(rows30d, (r) => r.event_type === step);
  }

  const topStep = stepCounts["bot_started"] || stepCounts["course_selected"] || 1;
  const funnel_30d: FunnelStepRow[] = FUNNEL_STEPS.map((step, i) => {
    const prev = i === 0 ? topStep : stepCounts[FUNNEL_STEPS[i - 1]];
    const current = stepCounts[step];
    return {
      step,
      count: current,
      drop_off_pct: prev > 0 && i > 0 ? Math.round((1 - current / prev) * 100) : null,
    };
  });

  // Referral
  const referralGranted = count(rows30d, (r) => r.event_type === "referral_granted");
  const referralRejected = count(rows30d, (r) => r.event_type === "referral_rejected");
  const referralTotal = referralGranted + referralRejected;
  const referralOfferViews = count(
    rows30d,
    (r) => r.event_type === "referral_option_click",
  );
  const referralUnlockClicks = count(
    rows30d,
    (r) => r.event_type === "referral_unlock_click",
  );
  const referralCountedScreens = count(
    rows30d,
    (r) => r.event_type === "referral_counted",
  );
  const referralDuplicateScreens = count(
    rows30d,
    (r) => r.event_type === "referral_duplicate_screen",
  );

  const referrerCounts: Record<string, number> = {};
  const rejectionReasonCounts: Record<string, number> = {};
  const grantVariantCounts: Record<string, number> = {};
  for (const row of rows30d) {
    if (row.event_type === "referral_granted") {
      const referrerId = metadataText(
        row,
        "referral_referrer_id",
        "tracker_referral_referrer_id",
      );
      if (referrerId) {
        referrerCounts[referrerId] = (referrerCounts[referrerId] ?? 0) + 1;
      }
      const variant = metadataText(row, "referral_offer_variant");
      if (variant) {
        grantVariantCounts[variant] = (grantVariantCounts[variant] ?? 0) + 1;
      }
    }
    if (row.event_type === "referral_rejected") {
      const reason = metadataText(row, "referral_rejection_reason");
      rejectionReasonCounts[reason || "unknown"] =
        (rejectionReasonCounts[reason || "unknown"] ?? 0) + 1;
    }
  }

  const top_referrers_30d: SourceBreakdown[] = Object.entries(referrerCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([source, count]) => ({ source, count }));
  const rejection_reasons_30d: SourceBreakdown[] = Object.entries(rejectionReasonCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([source, count]) => ({ source, count }));
  const grant_variants_30d: SourceBreakdown[] = Object.entries(grantVariantCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([source, count]) => ({ source, count }));

  // Top entry sources
  const sourceCounts: Record<string, number> = {};
  for (const r of rows30d) {
    const src = r.entry_source_type || "unknown";
    sourceCounts[src] = (sourceCounts[src] ?? 0) + 1;
  }
  const top_sources_30d: SourceBreakdown[] = Object.entries(sourceCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([source, count]) => ({ source, count }));

  // Top kurs
  const kursCounts: Record<string, number> = {};
  for (const r of rows30d) {
    if (r.kurs) kursCounts[r.kurs] = (kursCounts[r.kurs] ?? 0) + 1;
  }
  const top_kurs_30d: SourceBreakdown[] = Object.entries(kursCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([source, count]) => ({ source, count }));

  // Event mix
  const typeCounts: Record<string, number> = {};
  for (const r of rows30d) {
    const t = r.event_type || "unknown";
    typeCounts[t] = (typeCounts[t] ?? 0) + 1;
  }
  const event_mix_30d = Object.entries(typeCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([event_type, count]) => ({ event_type, count }));

  const periods = [
    buildPeriodBucket({
      rows,
      periodKey: "today",
      labelRu: "Сегодня",
      windowDays: 1,
      since: sinceToday,
      until: now,
    }),
    buildPeriodBucket({
      rows,
      periodKey: "days_7",
      labelRu: "7 дней",
      windowDays: 7,
      since: since7d,
      until: now,
    }),
    buildPeriodBucket({
      rows,
      periodKey: "days_30",
      labelRu: "30 дней",
      windowDays: 30,
      since: since30d,
      until: now,
    }),
  ];

  const period_map = {
    today: periods[0],
    days_7: periods[1],
    days_30: periods[2],
  } satisfies Record<DashboardPeriodKey, BotFunnelPeriodBucket>;

  return {
    refreshed_at: new Date().toISOString(),
    timezone: timeZone,
    total_events: rows.length,
    total_events_30d: rows30d.length,
    periods,
    period_map,
    funnel_30d,
    referral_30d: {
      granted: referralGranted,
      rejected: referralRejected,
      grant_rate: referralTotal > 0 ? Math.round((referralGranted / referralTotal) * 100) : 0,
      offer_views: referralOfferViews,
      unlock_clicks: referralUnlockClicks,
      counted_screens: referralCountedScreens,
      duplicate_screens: referralDuplicateScreens,
      top_referrers_30d,
      rejection_reasons_30d,
      grant_variants_30d,
    },
    top_sources_30d,
    top_kurs_30d,
    event_mix_30d,
    youtube_starts_30d: count(rows30d, (r) => r.entry_source_type === "youtube"),
    direct_starts_30d: count(rows30d, (r) => r.entry_source_type === "direct"),
  };
}
