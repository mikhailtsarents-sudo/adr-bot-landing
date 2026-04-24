import type { BotFunnelRow } from "@/lib/bot-funnel-storage";

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
};

export type SourceBreakdown = {
  source: string;
  count: number;
};

export type BotFunnelDashboard = {
  refreshed_at: string;
  total_events: number;
  total_events_30d: number;
  funnel_30d: FunnelStepRow[];
  referral_30d: ReferralSummary;
  top_sources_30d: SourceBreakdown[];
  top_kurs_30d: SourceBreakdown[];
  event_mix_30d: { event_type: string; count: number }[];
  youtube_starts_30d: number;
  direct_starts_30d: number;
};

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

export function buildBotFunnelDashboard(
  rows: BotFunnelRow[],
  options: { timeZone?: string } = {},
): BotFunnelDashboard {
  const timeZone = options.timeZone ?? "Europe/Berlin";
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

  return {
    refreshed_at: new Date().toISOString(),
    total_events: rows.length,
    total_events_30d: rows30d.length,
    funnel_30d,
    referral_30d: {
      granted: referralGranted,
      rejected: referralRejected,
      grant_rate: referralTotal > 0 ? Math.round((referralGranted / referralTotal) * 100) : 0,
    },
    top_sources_30d,
    top_kurs_30d,
    event_mix_30d,
    youtube_starts_30d: count(rows30d, (r) => r.entry_source_type === "youtube"),
    direct_starts_30d: count(rows30d, (r) => r.entry_source_type === "direct"),
  };
}
