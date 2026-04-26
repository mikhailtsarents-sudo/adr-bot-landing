import type { BotFunnelRow } from "@/lib/bot-funnel-storage";
import type { ReminderPhase12LivePreview } from "@/lib/reminder-phase12-preview";
import type { ReminderStateSnapshot } from "@/lib/reminder-state-storage";

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
  reminder_sent: number;
  reminder_clicked: number;
  reminder_snoozed: number;
  reminder_reactivated: number;
  reminder_opted_out: number;
  reminder_delivery_failed: number;
  callback_received: number;
  callback_answered: number;
  callback_rendered: number;
  callback_completed: number;
  callback_failed: number;
  start_to_first_action_rate: number;
  start_to_buy_intent_rate: number;
  reminder_click_rate: number;
  reminder_reactivation_rate: number;
  callback_answer_rate: number;
  callback_render_rate: number;
  callback_completion_rate: number;
  callback_failure_rate: number;
};

export type ReminderSummary = {
  sent: number;
  clicked: number;
  snoozed: number;
  reactivated: number;
  opted_out: number;
  delivery_failed: number;
  click_rate: number;
  reactivation_rate: number;
};

export type MonetizationSummary = {
  limit_offer_views: number;
  full_access_offer_opens: number;
  buy_intent_clicks: number;
  referral_path_clicks: number;
  continue_later_clicks: number;
  referral_offer_views: number;
  referral_unlock_clicks: number;
  referral_granted: number;
  referral_rejected: number;
  full_access_offer_open_rate: number;
  buy_intent_rate_from_limit: number;
  referral_path_rate_from_limit: number;
  continue_later_rate_from_limit: number;
  referral_unlock_rate_from_offer: number;
  referral_grant_rate_from_unlock: number;
  top_limit_reasons_30d: SourceBreakdown[];
  referral_offer_variants_30d: SourceBreakdown[];
};

export type MonetizationDiagnosisSummary = {
  limit_users: number;
  acted_from_limit_users: number;
  no_action_after_limit_users: number;
  no_action_after_limit_rate: number;
  referral_offer_users: number;
  waiting_without_unlock_users: number;
  waiting_without_unlock_rate: number;
  referral_unlock_users: number;
  unresolved_after_unlock_users: number;
  unresolved_after_unlock_rate: number;
  top_loss_stage: string;
  top_loss_rate: number;
  recommended_focus: string;
};

export type CallbackTelemetrySummary = {
  received: number;
  answered: number;
  rendered: number;
  completed: number;
  failed: number;
  answer_rate: number;
  render_rate: number;
  completion_rate: number;
  failure_rate: number;
  avg_completion_ms: number;
  p95_completion_ms: number;
  top_handlers_30d: SourceBreakdown[];
  failed_handlers_30d: SourceBreakdown[];
  render_modes_30d: SourceBreakdown[];
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
  reminder_30d: ReminderSummary;
  monetization_30d: MonetizationSummary;
  monetization_diagnosis_30d: MonetizationDiagnosisSummary;
  callback_telemetry_30d: CallbackTelemetrySummary;
  reminder_state: ReminderStateSnapshot["summary"] & {
    reminder_modes: SourceBreakdown[];
    reminder_segments: SourceBreakdown[];
    reminder_languages: SourceBreakdown[];
  };
  reminder_phase12_30d: {
    cadence_modifiers: SourceBreakdown[];
    weak_tracks: SourceBreakdown[];
    preferred_hours: SourceBreakdown[];
  };
  reminder_phase12_live_preview: ReminderPhase12LivePreview;
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

function metadataNumber(
  row: BotFunnelRow,
  ...keys: string[]
): number {
  const metadata = parseMetadata(row);
  for (const key of keys) {
    const value = metadata[key];
    const numeric = Number(value);
    if (Number.isFinite(numeric)) {
      return numeric;
    }
  }
  return 0;
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

function uniqueUsers(rows: BotFunnelRow[], predicate: (r: BotFunnelRow) => boolean): Set<string> {
  const values = new Set<string>();
  for (const row of rows) {
    if (!predicate(row)) continue;
    const userId = String(row.user_id || "").trim();
    if (!userId) continue;
    values.add(userId);
  }
  return values;
}

function intersectionSize(left: Set<string>, right: Set<string>): number {
  let total = 0;
  for (const value of left) {
    if (right.has(value)) total += 1;
  }
  return total;
}

function unionSets(...sets: Set<string>[]): Set<string> {
  const values = new Set<string>();
  for (const entrySet of sets) {
    for (const value of entrySet) {
      values.add(value);
    }
  }
  return values;
}

function roundRate(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Number(value.toFixed(4));
}

function breakdown(values: string[], limit = 10): SourceBreakdown[] {
  const counts: Record<string, number> = {};
  for (const value of values) {
    const key = value || "unknown";
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([source, count]) => ({ source, count }));
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
  const reminderSent = count(scopedRows, (r) => r.event_type === "reminder_sent");
  const reminderClicked = count(scopedRows, (r) => r.event_type === "reminder_clicked");
  const reminderSnoozed = count(scopedRows, (r) => r.event_type === "reminder_snoozed");
  const reminderReactivated = count(scopedRows, (r) => r.event_type === "reminder_reactivated");
  const reminderOptedOut = count(scopedRows, (r) => r.event_type === "reminder_opted_out");
  const reminderDeliveryFailed = count(scopedRows, (r) => r.event_type === "reminder_delivery_failed");
  const callbackReceived = count(scopedRows, (r) => r.event_type === "callback_received");
  const callbackAnswered = count(scopedRows, (r) => r.event_type === "callback_answered");
  const callbackRendered = count(scopedRows, (r) => r.event_type === "callback_rendered");
  const callbackCompleted = count(scopedRows, (r) => r.event_type === "callback_completed");
  const callbackFailed = count(scopedRows, (r) => r.event_type === "callback_failed");
  const startUsers = uniqueUsers(scopedRows, (r) => r.event_type === "bot_started");
  const firstActionUsers = uniqueUsers(
    scopedRows,
    (r) => r.event_type === "word_session_started" || r.event_type === "quiz_started",
  );
  const buyIntentUsers = uniqueUsers(scopedRows, (r) => r.event_type === "full_access_buy_click");
  const reminderSentUsers = uniqueUsers(scopedRows, (r) => r.event_type === "reminder_sent");
  const reminderClickedUsers = uniqueUsers(scopedRows, (r) => r.event_type === "reminder_clicked");
  const reminderReactivatedUsers = uniqueUsers(scopedRows, (r) => r.event_type === "reminder_reactivated");
  const startToFirstActionUsers = intersectionSize(startUsers, firstActionUsers);
  const startToBuyIntentUsers = intersectionSize(startUsers, buyIntentUsers);
  const reminderClickedFromSentUsers = intersectionSize(reminderSentUsers, reminderClickedUsers);
  const reminderReactivatedFromSentUsers = intersectionSize(reminderSentUsers, reminderReactivatedUsers);

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
    reminder_sent: reminderSent,
    reminder_clicked: reminderClicked,
    reminder_snoozed: reminderSnoozed,
    reminder_reactivated: reminderReactivated,
    reminder_opted_out: reminderOptedOut,
    reminder_delivery_failed: reminderDeliveryFailed,
    callback_received: callbackReceived,
    callback_answered: callbackAnswered,
    callback_rendered: callbackRendered,
    callback_completed: callbackCompleted,
    callback_failed: callbackFailed,
    start_to_first_action_rate: roundRate(startUsers.size > 0 ? startToFirstActionUsers / startUsers.size : 0),
    start_to_buy_intent_rate: roundRate(startUsers.size > 0 ? startToBuyIntentUsers / startUsers.size : 0),
    reminder_click_rate: roundRate(reminderSentUsers.size > 0 ? reminderClickedFromSentUsers / reminderSentUsers.size : 0),
    reminder_reactivation_rate: roundRate(reminderSentUsers.size > 0 ? reminderReactivatedFromSentUsers / reminderSentUsers.size : 0),
    callback_answer_rate: roundRate(callbackReceived > 0 ? callbackAnswered / callbackReceived : 0),
    callback_render_rate: roundRate(callbackReceived > 0 ? callbackRendered / callbackReceived : 0),
    callback_completion_rate: roundRate(callbackReceived > 0 ? callbackCompleted / callbackReceived : 0),
    callback_failure_rate: roundRate(callbackReceived > 0 ? callbackFailed / callbackReceived : 0),
  };
}

export function buildBotFunnelDashboard(
  rows: BotFunnelRow[],
  options: {
    timeZone?: string;
    reminderState?: ReminderStateSnapshot | null;
    reminderPhase12LivePreview?: ReminderPhase12LivePreview | null;
  } = {},
): BotFunnelDashboard {
  const timeZone = options.timeZone ?? "Europe/Berlin";
  const reminderState = options.reminderState ?? null;
  const reminderPhase12LivePreview = options.reminderPhase12LivePreview ?? null;
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
    stepCounts[step] = uniqueUsers(rows30d, (r) => r.event_type === step).size;
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
  const limitOfferViews = count(rows30d, (r) => r.event_type === "limit_offer_view");
  const fullAccessOfferOpens = count(rows30d, (r) => r.event_type === "limit_full_access_click");
  const buyIntentClicks = count(rows30d, (r) => r.event_type === "full_access_buy_click");
  const referralPathClicks = count(rows30d, (r) => r.event_type === "limit_referral_click");
  const continueLaterClicks = count(rows30d, (r) => r.event_type === "limit_later_click");
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
  const reminderSent = count(rows30d, (r) => r.event_type === "reminder_sent");
  const reminderClicked = count(rows30d, (r) => r.event_type === "reminder_clicked");
  const reminderSnoozed = count(rows30d, (r) => r.event_type === "reminder_snoozed");
  const reminderReactivated = count(rows30d, (r) => r.event_type === "reminder_reactivated");
  const reminderOptedOut = count(rows30d, (r) => r.event_type === "reminder_opted_out");
  const reminderDeliveryFailed = count(rows30d, (r) => r.event_type === "reminder_delivery_failed");
  const callbackReceived30d = count(rows30d, (r) => r.event_type === "callback_received");
  const callbackAnswered30d = count(rows30d, (r) => r.event_type === "callback_answered");
  const callbackRendered30d = count(rows30d, (r) => r.event_type === "callback_rendered");
  const callbackCompleted30d = count(rows30d, (r) => r.event_type === "callback_completed");
  const callbackFailed30d = count(rows30d, (r) => r.event_type === "callback_failed");
  const reminderSentUsers30d = uniqueUsers(rows30d, (r) => r.event_type === "reminder_sent");
  const reminderClickedUsers30d = uniqueUsers(rows30d, (r) => r.event_type === "reminder_clicked");
  const reminderReactivatedUsers30d = uniqueUsers(rows30d, (r) => r.event_type === "reminder_reactivated");
  const limitOfferViewUsers30d = uniqueUsers(rows30d, (r) => r.event_type === "limit_offer_view");
  const fullAccessOfferOpenUsers30d = uniqueUsers(rows30d, (r) => r.event_type === "limit_full_access_click");
  const buyIntentUsers30d = uniqueUsers(rows30d, (r) => r.event_type === "full_access_buy_click");
  const referralPathUsers30d = uniqueUsers(rows30d, (r) => r.event_type === "limit_referral_click");
  const continueLaterUsers30d = uniqueUsers(rows30d, (r) => r.event_type === "limit_later_click");
  const referralOfferViewUsers30d = uniqueUsers(rows30d, (r) => r.event_type === "referral_option_click");
  const referralUnlockUsers30d = uniqueUsers(rows30d, (r) => r.event_type === "referral_unlock_click");
  const referralGrantedUsers30d = uniqueUsers(rows30d, (r) => r.event_type === "referral_granted");
  const referralRejectedUsers30d = uniqueUsers(rows30d, (r) => r.event_type === "referral_rejected");
  const reminderSentRows = rows30d.filter((r) => r.event_type === "reminder_sent");
  const callbackReceivedRows30d = rows30d.filter((r) => r.event_type === "callback_received");
  const callbackFailedRows30d = rows30d.filter((r) => r.event_type === "callback_failed");
  const callbackRenderedRows30d = rows30d.filter((r) => r.event_type === "callback_rendered");
  const callbackCompletedRows30d = rows30d.filter((r) => r.event_type === "callback_completed");
  const cadenceModifiers30d = breakdown(
    reminderSentRows.map((r) => metadataText(r, "cadence_modifier")).filter(Boolean),
  );
  const weakTracks30d = breakdown(
    reminderSentRows.map((r) => metadataText(r, "weak_kurs_30d")).filter(Boolean),
  );
  const preferredHours30d = breakdown(
    reminderSentRows.map((r) => metadataText(r, "preferred_learning_hour_berlin")).filter(Boolean),
  );
  const callbackCompletionDurations30d = callbackCompletedRows30d
    .map((r) => metadataNumber(r, "callback_duration_ms"))
    .filter((value) => value > 0)
    .sort((a, b) => a - b);
  const callbackAvgCompletionMs30d = callbackCompletionDurations30d.length > 0
    ? Math.round(
        callbackCompletionDurations30d.reduce((sum, value) => sum + value, 0) /
          callbackCompletionDurations30d.length,
      )
    : 0;
  const callbackP95CompletionMs30d = callbackCompletionDurations30d.length > 0
    ? callbackCompletionDurations30d[
        Math.min(
          callbackCompletionDurations30d.length - 1,
          Math.floor(callbackCompletionDurations30d.length * 0.95),
        )
      ]
    : 0;
  const callbackTopHandlers30d = breakdown(
    callbackReceivedRows30d.map((r) => metadataText(r, "callback_handler")).filter(Boolean),
  );
  const callbackFailedHandlers30d = breakdown(
    callbackFailedRows30d.map((r) => metadataText(r, "callback_handler")).filter(Boolean),
  );
  const callbackRenderModes30d = breakdown(
    callbackRenderedRows30d.map((r) => metadataText(r, "callback_render_mode")).filter(Boolean),
  );
  const topLimitReasons30d = breakdown(
    rows30d
      .filter((r) => r.event_type === "limit_offer_view")
      .map((r) => metadataText(r, "limit_reason", "full_access_limit_reason"))
      .filter(Boolean),
  );
  const referralOfferVariants30d = breakdown(
    rows30d
      .filter((r) => r.event_type === "referral_option_click")
      .map((r) => metadataText(r, "referral_offer_variant"))
      .filter(Boolean),
  );
  const limitActionUsers30d = unionSets(
    fullAccessOfferOpenUsers30d,
    buyIntentUsers30d,
    referralPathUsers30d,
    continueLaterUsers30d,
  );
  const noActionAfterLimitUsers30d = Math.max(0, limitOfferViewUsers30d.size - intersectionSize(limitOfferViewUsers30d, limitActionUsers30d));
  const waitingWithoutUnlockUsers30d = Math.max(
    0,
    referralOfferViewUsers30d.size - intersectionSize(referralOfferViewUsers30d, referralUnlockUsers30d),
  );
  const resolvedAfterUnlockUsers30d = intersectionSize(
    referralUnlockUsers30d,
    unionSets(referralGrantedUsers30d, referralRejectedUsers30d),
  );
  const unresolvedAfterUnlockUsers30d = Math.max(0, referralUnlockUsers30d.size - resolvedAfterUnlockUsers30d);
  const topLossCandidates = [
    {
      stage: "no_action_after_limit",
      rate: limitOfferViewUsers30d.size > 0
        ? Math.round((noActionAfterLimitUsers30d / limitOfferViewUsers30d.size) * 100)
        : 0,
    },
    {
      stage: "waiting_without_unlock",
      rate: referralOfferViewUsers30d.size > 0
        ? Math.round((waitingWithoutUnlockUsers30d / referralOfferViewUsers30d.size) * 100)
        : 0,
    },
    {
      stage: "unresolved_after_unlock",
      rate: referralUnlockUsers30d.size > 0
        ? Math.round((unresolvedAfterUnlockUsers30d / referralUnlockUsers30d.size) * 100)
        : 0,
    },
  ].sort((left, right) => right.rate - left.rate);
  const topLossStage = topLossCandidates[0]?.stage || "";
  const topLossRate = topLossCandidates[0]?.rate || 0;
  const recommendedFocus = topLossStage === "no_action_after_limit"
    ? "limit_screen_choice"
    : topLossStage === "waiting_without_unlock"
      ? "referral_offer_clarity"
      : topLossStage === "unresolved_after_unlock"
        ? "referral_resolution"
        : "observe";

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
    reminder_30d: {
      sent: reminderSent,
      clicked: reminderClicked,
      snoozed: reminderSnoozed,
      reactivated: reminderReactivated,
      opted_out: reminderOptedOut,
      delivery_failed: reminderDeliveryFailed,
      click_rate: reminderSentUsers30d.size > 0
        ? Math.round((intersectionSize(reminderSentUsers30d, reminderClickedUsers30d) / reminderSentUsers30d.size) * 100)
        : 0,
      reactivation_rate: reminderSentUsers30d.size > 0
        ? Math.round((intersectionSize(reminderSentUsers30d, reminderReactivatedUsers30d) / reminderSentUsers30d.size) * 100)
        : 0,
    },
    monetization_30d: {
      limit_offer_views: limitOfferViews,
      full_access_offer_opens: fullAccessOfferOpens,
      buy_intent_clicks: buyIntentClicks,
      referral_path_clicks: referralPathClicks,
      continue_later_clicks: continueLaterClicks,
      referral_offer_views: referralOfferViews,
      referral_unlock_clicks: referralUnlockClicks,
      referral_granted: referralGranted,
      referral_rejected: referralRejected,
      full_access_offer_open_rate: limitOfferViewUsers30d.size > 0
        ? Math.round((intersectionSize(limitOfferViewUsers30d, fullAccessOfferOpenUsers30d) / limitOfferViewUsers30d.size) * 100)
        : 0,
      buy_intent_rate_from_limit: limitOfferViewUsers30d.size > 0
        ? Math.round((intersectionSize(limitOfferViewUsers30d, buyIntentUsers30d) / limitOfferViewUsers30d.size) * 100)
        : 0,
      referral_path_rate_from_limit: limitOfferViewUsers30d.size > 0
        ? Math.round((intersectionSize(limitOfferViewUsers30d, referralPathUsers30d) / limitOfferViewUsers30d.size) * 100)
        : 0,
      continue_later_rate_from_limit: limitOfferViewUsers30d.size > 0
        ? Math.round((intersectionSize(limitOfferViewUsers30d, continueLaterUsers30d) / limitOfferViewUsers30d.size) * 100)
        : 0,
      referral_unlock_rate_from_offer: referralOfferViewUsers30d.size > 0
        ? Math.round((intersectionSize(referralOfferViewUsers30d, referralUnlockUsers30d) / referralOfferViewUsers30d.size) * 100)
        : 0,
      referral_grant_rate_from_unlock: referralUnlockUsers30d.size > 0
        ? Math.round((intersectionSize(referralUnlockUsers30d, referralGrantedUsers30d) / referralUnlockUsers30d.size) * 100)
        : 0,
      top_limit_reasons_30d: topLimitReasons30d,
      referral_offer_variants_30d: referralOfferVariants30d,
    },
    monetization_diagnosis_30d: {
      limit_users: limitOfferViewUsers30d.size,
      acted_from_limit_users: intersectionSize(limitOfferViewUsers30d, limitActionUsers30d),
      no_action_after_limit_users: noActionAfterLimitUsers30d,
      no_action_after_limit_rate: limitOfferViewUsers30d.size > 0
        ? Math.round((noActionAfterLimitUsers30d / limitOfferViewUsers30d.size) * 100)
        : 0,
      referral_offer_users: referralOfferViewUsers30d.size,
      waiting_without_unlock_users: waitingWithoutUnlockUsers30d,
      waiting_without_unlock_rate: referralOfferViewUsers30d.size > 0
        ? Math.round((waitingWithoutUnlockUsers30d / referralOfferViewUsers30d.size) * 100)
        : 0,
      referral_unlock_users: referralUnlockUsers30d.size,
      unresolved_after_unlock_users: unresolvedAfterUnlockUsers30d,
      unresolved_after_unlock_rate: referralUnlockUsers30d.size > 0
        ? Math.round((unresolvedAfterUnlockUsers30d / referralUnlockUsers30d.size) * 100)
        : 0,
      top_loss_stage: topLossStage,
      top_loss_rate: topLossRate,
      recommended_focus: recommendedFocus,
    },
    callback_telemetry_30d: {
      received: callbackReceived30d,
      answered: callbackAnswered30d,
      rendered: callbackRendered30d,
      completed: callbackCompleted30d,
      failed: callbackFailed30d,
      answer_rate: callbackReceived30d > 0 ? Math.round((callbackAnswered30d / callbackReceived30d) * 100) : 0,
      render_rate: callbackReceived30d > 0 ? Math.round((callbackRendered30d / callbackReceived30d) * 100) : 0,
      completion_rate: callbackReceived30d > 0 ? Math.round((callbackCompleted30d / callbackReceived30d) * 100) : 0,
      failure_rate: callbackReceived30d > 0 ? Math.round((callbackFailed30d / callbackReceived30d) * 100) : 0,
      avg_completion_ms: callbackAvgCompletionMs30d,
      p95_completion_ms: callbackP95CompletionMs30d,
      top_handlers_30d: callbackTopHandlers30d,
      failed_handlers_30d: callbackFailedHandlers30d,
      render_modes_30d: callbackRenderModes30d,
    },
    reminder_state: {
      total_users: Number(reminderState?.summary.total_users || 0),
      normal_users: Number(reminderState?.summary.normal_users || 0),
      rare_users: Number(reminderState?.summary.rare_users || 0),
      dormant_users: Number(reminderState?.summary.dormant_users || 0),
      disabled_users: Number(reminderState?.summary.disabled_users || 0),
      exam_mode_users: Number(reminderState?.summary.exam_mode_users || 0),
      snoozed_users: Number(reminderState?.summary.snoozed_users || 0),
      language_override_users: Number(reminderState?.summary.language_override_users || 0),
      reminder_modes: reminderState?.reminder_modes ?? [],
      reminder_segments: reminderState?.reminder_segments ?? [],
      reminder_languages: reminderState?.reminder_languages ?? [],
    },
    reminder_phase12_30d: {
      cadence_modifiers: cadenceModifiers30d,
      weak_tracks: weakTracks30d,
      preferred_hours: preferredHours30d,
    },
    reminder_phase12_live_preview: {
      candidate_total: Number(reminderPhase12LivePreview?.candidate_total || 0),
      due_now: Number(reminderPhase12LivePreview?.due_now || 0),
      due_segments: reminderPhase12LivePreview?.due_segments ?? [],
      due_modifiers: reminderPhase12LivePreview?.due_modifiers ?? [],
      skip_reasons: reminderPhase12LivePreview?.skip_reasons ?? [],
    },
    top_sources_30d,
    top_kurs_30d,
    event_mix_30d,
    youtube_starts_30d: count(rows30d, (r) => r.entry_source_type === "youtube"),
    direct_starts_30d: count(rows30d, (r) => r.entry_source_type === "direct"),
  };
}
