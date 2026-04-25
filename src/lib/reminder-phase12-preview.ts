import type { ReminderCandidateRow, ReminderStateBreakdown } from "@/lib/reminder-state-storage";

export type ReminderPhase12LivePreview = {
  candidate_total: number;
  due_now: number;
  due_segments: ReminderStateBreakdown[];
  due_modifiers: ReminderStateBreakdown[];
  skip_reasons: ReminderStateBreakdown[];
};

function text(value: unknown) {
  return value == null ? "" : String(value).trim();
}

function breakdown(values: string[], limit = 10): ReminderStateBreakdown[] {
  const counts: Record<string, number> = {};
  for (const value of values) {
    const key = value || "unknown";
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([source, count]) => ({ source, count }));
}

function berlinHour(now = new Date()) {
  return Number(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: "Europe/Berlin",
      hour: "2-digit",
      hour12: false,
    }).format(now),
  );
}

function berlinWeekday(now = new Date()) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "Europe/Berlin",
    weekday: "short",
  }).format(now);
}

function berlinMonthDay(now = new Date()) {
  const month = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Berlin", month: "2-digit" }).format(now);
  const day = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Berlin", day: "2-digit" }).format(now);
  return `${month}-${day}`;
}

function berlinYear(now = new Date()) {
  return Number(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: "Europe/Berlin",
      year: "numeric",
    }).format(now),
  );
}

function addUtcDays(date: Date, days: number) {
  const next = new Date(date.getTime());
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function formatMonthDayFromDate(date: Date) {
  return `${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`;
}

function easterSundayUtc(year: number) {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(Date.UTC(year, month - 1, day));
}

function inQuietHours(now = new Date()) {
  const hour = berlinHour(now);
  return hour >= 22 || hour < 8;
}

function inSoftSkipWindow(now = new Date()) {
  const weekday = berlinWeekday(now);
  const hour = berlinHour(now);
  return (weekday === "Fri" && hour >= 18) || (weekday === "Sat" && hour < 11);
}

function inHolidaySkipWindow(now = new Date()) {
  const fixed = ["01-01", "05-01", "10-03", "12-24", "12-25", "12-26", "12-31"];
  const easter = easterSundayUtc(berlinYear(now));
  const movable = [
    formatMonthDayFromDate(addUtcDays(easter, -2)),
    formatMonthDayFromDate(addUtcDays(easter, 1)),
    formatMonthDayFromDate(addUtcDays(easter, 39)),
    formatMonthDayFromDate(addUtcDays(easter, 50)),
  ];
  return [...fixed, ...movable].includes(berlinMonthDay(now));
}

function hoursBetween(now: Date, isoOrDate?: string) {
  const value = isoOrDate ? new Date(isoOrDate) : null;
  if (!value || Number.isNaN(value.getTime())) return Number.POSITIVE_INFINITY;
  return (now.getTime() - value.getTime()) / (60 * 60 * 1000);
}

function daysBetween(now: Date, isoOrDate?: string) {
  const value = isoOrDate ? new Date(isoOrDate) : null;
  if (!value || Number.isNaN(value.getTime())) return Number.POSITIVE_INFINITY;
  return (now.getTime() - value.getTime()) / (24 * 60 * 60 * 1000);
}

function examDaysLeft(now: Date, dateValue?: string) {
  const raw = text(dateValue);
  if (!raw) return null;
  const target = new Date(`${raw}T12:00:00+02:00`);
  if (Number.isNaN(target.getTime())) return null;
  return Math.floor((target.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
}

function deriveReminderSegment(candidate: ReminderCandidateRow) {
  if (candidate.reminder_mode === "rare") return "rare_mode";
  if (candidate.exam_mode_enabled && candidate.exam_date) return "exam_mode";
  if (Number(candidate.meaningful_actions_total || 0) <= 0) return "start_no_action";
  if (candidate.full_access) return "full_access_inactive";
  return "free_inactive";
}

function deriveCadenceModifier(segment: string, candidate: ReminderCandidateRow) {
  if (segment === "exam_mode" || segment === "rare_mode" || segment === "start_no_action") {
    return { modifier: "none", factor: 1 };
  }
  const learning7d = Number(candidate.recent_learning_actions_7d || 0);
  const learning30d = Number(candidate.recent_learning_actions_30d || 0);
  const activeDays7d = Number(candidate.recent_active_days_7d || 0);
  if (learning7d >= 10 || activeDays7d >= 4) return { modifier: "sprint", factor: 1.5 };
  if (learning30d > 0 && learning30d <= 2 && activeDays7d <= 1) return { modifier: "slow_burn", factor: 2 };
  return { modifier: "none", factor: 1 };
}

function roundCadenceDay(value: number) {
  return Math.max(1, Math.round(value));
}

function cadenceDaysForSegment(segment: string, candidate: ReminderCandidateRow, now: Date) {
  if (segment === "start_no_action") return [1, 4, 10];
  if (segment === "rare_mode") return [60];
  if (segment === "exam_mode") {
    const daysLeft = examDaysLeft(now, candidate.exam_date);
    if (daysLeft == null) return [4];
    if (daysLeft < 0) return [];
    if (daysLeft < 7) return [candidate.exam_reminder_intensity === "intensive" ? 1 : 2];
    if (daysLeft < 30) return [2];
    return [4];
  }
  const baseCadence = segment === "full_access_inactive" ? [4, 10, 21] : [5, 14, 30];
  const { factor } = deriveCadenceModifier(segment, candidate);
  return factor === 1 ? baseCadence : baseCadence.map((days) => roundCadenceDay(days * factor));
}

function baseTimestampForSegment(segment: string, candidate: ReminderCandidateRow) {
  if (segment === "start_no_action") return candidate.last_started_at || candidate.first_started_at;
  if (segment === "exam_mode") return candidate.last_exam_reminder_sent_at || candidate.last_meaningful_activity_at || candidate.last_started_at;
  return candidate.last_meaningful_activity_at || candidate.last_started_at || candidate.first_started_at;
}

function withinPreferredHourWindow(now: Date, preferredHour?: number, toleranceHours = 2) {
  const hour = Number(preferredHour);
  if (!Number.isFinite(hour) || hour < 0 || hour > 23) return true;
  const currentHour = berlinHour(now);
  const directGap = Math.abs(currentHour - hour);
  const wrappedGap = 24 - directGap;
  return Math.min(directGap, wrappedGap) <= toleranceHours;
}

function previewDecision(candidate: ReminderCandidateRow, now: Date) {
  if (!text(candidate.effective_chat_id || candidate.chat_id)) return { send: false, reason: "missing_chat_id" };
  if (candidate.reminder_mode === "disabled") return { send: false, reason: "disabled" };
  if (candidate.reminder_mode === "dormant") return { send: false, reason: "dormant" };
  if (inQuietHours(now)) return { send: false, reason: "quiet_hours" };
  if (inSoftSkipWindow(now)) return { send: false, reason: "soft_skip_window" };
  if (inHolidaySkipWindow(now)) return { send: false, reason: "holiday_skip" };
  const snoozeUntil = text(candidate.snooze_until);
  if (snoozeUntil && new Date(snoozeUntil) > now) return { send: false, reason: "snoozed" };
  if (hoursBetween(now, candidate.last_reminder_sent_at) < 72) return { send: false, reason: "recent_reminder" };
  if (Number(candidate.reminder_sent_30d || 0) >= 3 && candidate.reminder_mode !== "rare" && !candidate.exam_mode_enabled) {
    return { send: false, reason: "monthly_cap" };
  }
  if (hoursBetween(now, candidate.last_broadcast_received_at) < 24) return { send: false, reason: "recent_broadcast" };
  if (hoursBetween(now, candidate.last_payment_event_at) < 24) return { send: false, reason: "recent_payment" };

  const segment = deriveReminderSegment(candidate);
  const cadenceDays = cadenceDaysForSegment(segment, candidate, now);
  if (!cadenceDays.length) return { send: false, reason: "no_cadence", segment, modifier: "none" };

  const cadenceModifier = deriveCadenceModifier(segment, candidate);
  const sequenceStep = Math.max(0, Number(candidate.reminder_sequence_step || 0));
  const cadenceIndex = Math.min(sequenceStep, cadenceDays.length - 1);
  const thresholdDays = cadenceDays[cadenceIndex];
  const daysSinceBase = daysBetween(now, baseTimestampForSegment(segment, candidate));
  if (!Number.isFinite(daysSinceBase) || daysSinceBase < thresholdDays) {
    return { send: false, reason: "not_due_yet", segment, modifier: cadenceModifier.modifier };
  }
  if (Number(candidate.ignored_reminders_count || 0) >= 3 && candidate.reminder_mode !== "rare" && segment !== "exam_mode") {
    return { send: false, reason: "too_many_ignored", segment, modifier: cadenceModifier.modifier };
  }
  if (segment !== "start_no_action" && segment !== "exam_mode" && !withinPreferredHourWindow(now, candidate.preferred_learning_hour_berlin)) {
    return { send: false, reason: "preferred_hour_window", segment, modifier: cadenceModifier.modifier };
  }
  return { send: true, reason: "due", segment, modifier: cadenceModifier.modifier };
}

export function buildReminderPhase12LivePreview(
  candidates: ReminderCandidateRow[],
  now = new Date(),
): ReminderPhase12LivePreview {
  const decisions = candidates.map((candidate) => previewDecision(candidate, now));
  const due = decisions.filter((decision) => decision.send);
  const skipped = decisions.filter((decision) => !decision.send);
  return {
    candidate_total: candidates.length,
    due_now: due.length,
    due_segments: breakdown(due.map((decision) => text(decision.segment))),
    due_modifiers: breakdown(due.map((decision) => text(decision.modifier))),
    skip_reasons: breakdown(skipped.map((decision) => text(decision.reason))),
  };
}
