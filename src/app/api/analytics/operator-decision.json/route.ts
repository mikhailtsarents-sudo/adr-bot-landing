import { buildAnalyticsDashboard } from "@/lib/analytics-dashboard";
import { buildBotFunnelDashboard } from "@/lib/bot-funnel-dashboard";
import { hasBotFunnelStorageConfig, readBotFunnelRows } from "@/lib/bot-funnel-storage";
import { buildOperatorDecisionDashboard } from "@/lib/operator-decision-dashboard";
import { buildReminderPhase12LivePreview } from "@/lib/reminder-phase12-preview";
import { readReminderCandidates, readReminderStateSnapshot } from "@/lib/reminder-state-storage";
import { readAnalyticsRows } from "@/lib/analytics-storage";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    if (!hasBotFunnelStorageConfig()) {
      return NextResponse.json(
        { ok: false, error: "bot_funnel_not_configured" },
        { status: 503 },
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = Number(searchParams.get("limit") || "2000");
    const timeZone =
      searchParams.get("timezone") ||
      process.env.ANALYTICS_DASHBOARD_TIMEZONE ||
      "Europe/Berlin";

    const boundedLimit = Number.isFinite(limit) ? Math.min(Math.max(limit, 1), 5000) : 2000;

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

    const analyticsDashboard = buildAnalyticsDashboard(siteRows, { timeZone });
    const botDashboard = buildBotFunnelDashboard(botRows, {
      timeZone,
      reminderState,
      reminderPhase12LivePreview,
    });
    const operatorDecision = buildOperatorDecisionDashboard(analyticsDashboard, botDashboard);

    return NextResponse.json(
      {
        ok: true,
        refreshed_at: operatorDecision.refreshed_at,
        timezone: operatorDecision.timezone,
        source: {
          site: analyticsDashboard.source,
          bot: "adr_bot_funnel_events",
        },
        dashboard: operatorDecision,
      },
      {
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      },
    );
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "unknown_error",
      },
      { status: 500 },
    );
  }
}
