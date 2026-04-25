const adrIngestUrl = process.env.ADR_INGEST_URL ?? "";
const adrIngestApiKey = process.env.ADR_INGEST_API_KEY ?? "";

export type ReminderStateBreakdown = {
  source: string;
  count: number;
};

export type ReminderStateSummary = {
  total_users: number;
  normal_users: number;
  rare_users: number;
  dormant_users: number;
  disabled_users: number;
  exam_mode_users: number;
  snoozed_users: number;
  language_override_users: number;
};

export type ReminderStateSnapshot = {
  summary: ReminderStateSummary;
  reminder_modes: ReminderStateBreakdown[];
  reminder_segments: ReminderStateBreakdown[];
  reminder_languages: ReminderStateBreakdown[];
};

function number(value: unknown) {
  const parsed = Number(value || 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

export async function readReminderStateSnapshot(): Promise<ReminderStateSnapshot> {
  if (!adrIngestUrl || !adrIngestApiKey) {
    throw new Error("Missing reminder state storage config");
  }

  const response = await fetch(`${adrIngestUrl}/v1/reminders/summary`, {
    method: "GET",
    headers: { "X-ADR-API-KEY": adrIngestApiKey },
    cache: "no-store",
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`adr-ingest reminder summary failed with ${response.status}: ${body.slice(0, 400)}`);
  }

  const json = (await response.json()) as Partial<ReminderStateSnapshot> & {
    summary?: Partial<ReminderStateSummary>;
  };

  return {
    summary: {
      total_users: number(json.summary?.total_users),
      normal_users: number(json.summary?.normal_users),
      rare_users: number(json.summary?.rare_users),
      dormant_users: number(json.summary?.dormant_users),
      disabled_users: number(json.summary?.disabled_users),
      exam_mode_users: number(json.summary?.exam_mode_users),
      snoozed_users: number(json.summary?.snoozed_users),
      language_override_users: number(json.summary?.language_override_users),
    },
    reminder_modes: Array.isArray(json.reminder_modes) ? json.reminder_modes : [],
    reminder_segments: Array.isArray(json.reminder_segments) ? json.reminder_segments : [],
    reminder_languages: Array.isArray(json.reminder_languages) ? json.reminder_languages : [],
  };
}
