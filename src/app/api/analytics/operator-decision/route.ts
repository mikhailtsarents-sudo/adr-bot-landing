import { readAnalyticsControlBundle } from "@/lib/analytics-control-loaders";
import { buildOperatorDecisionDashboard } from "@/lib/operator-decision-dashboard";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { analyticsDashboard, botDashboard } = await readAnalyticsControlBundle(request);
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
      { status: error instanceof Error && error.message === "bot_funnel_not_configured" ? 503 : 500 },
    );
  }
}
