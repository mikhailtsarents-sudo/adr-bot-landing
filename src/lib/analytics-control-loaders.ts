import { buildAnalyticsDashboard } from "@/lib/analytics-dashboard";
import { buildBotFunnelDashboard } from "@/lib/bot-funnel-dashboard";
import { hasBotFunnelStorageConfig, readBotFunnelRows } from "@/lib/bot-funnel-storage";
import { buildReminderPhase12LivePreview } from "@/lib/reminder-phase12-preview";
import { readReminderCandidates, readReminderStateSnapshot } from "@/lib/reminder-state-storage";
import { readAnalyticsRows } from "@/lib/analytics-storage";

export type AnalyticsControlBundle = {
  timeZone: string;
  analyticsDashboard: ReturnType<typeof buildAnalyticsDashboard>;
  botDashboard: ReturnType<typeof buildBotFunnelDashboard>;
};

export function parseControlRequest(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = Number(searchParams.get("limit") || "2000");
  const timeZone =
    searchParams.get("timezone") ||
    process.env.ANALYTICS_DASHBOARD_TIMEZONE ||
    "Europe/Berlin";

  return {
    timeZone,
    boundedLimit: Number.isFinite(limit) ? Math.min(Math.max(limit, 1), 5000) : 2000,
  };
}

export async function readAnalyticsControlBundle(request: Request): Promise<AnalyticsControlBundle> {
  if (!hasBotFunnelStorageConfig()) {
    throw new Error("bot_funnel_not_configured");
  }

  const { boundedLimit, timeZone } = parseControlRequest(request);

  const [siteRows, botRows] = await Promise.all([
    readAnalyticsRows({ limit: boundedLimit }),
    readBotFunnelRows({ limit: boundedLimit }),
  ]);

  let reminderState = null;
  let reminderPhase12LivePreview = null;
  try {
    reminderState = await readReminderStateSnapshot();
    const reminderCandidates = await readReminderCandidates(500);
    reminderPhase12LivePreview = buildReminderPhase12LivePreview(reminderCandidates);
  } catch {
    reminderState = null;
    reminderPhase12LivePreview = null;
  }

  return {
    timeZone,
    analyticsDashboard: buildAnalyticsDashboard(siteRows, { timeZone }),
    botDashboard: buildBotFunnelDashboard(botRows, {
      timeZone,
      reminderState,
      reminderPhase12LivePreview,
    }),
  };
}
