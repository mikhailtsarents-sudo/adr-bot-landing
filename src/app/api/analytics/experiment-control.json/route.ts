import { readAnalyticsControlBundle } from "@/lib/analytics-control-loaders";
import { buildExperimentControlDashboard } from "@/lib/experiment-control-dashboard";
import { buildMonetizationControlDashboard } from "@/lib/monetization-control-dashboard";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { analyticsDashboard, botDashboard } = await readAnalyticsControlBundle(request);
    const monetizationControl = buildMonetizationControlDashboard(botDashboard);
    const experimentControl = buildExperimentControlDashboard(
      analyticsDashboard,
      botDashboard,
      monetizationControl,
    );

    return NextResponse.json(
      {
        ok: true,
        refreshed_at: experimentControl.refreshed_at,
        timezone: experimentControl.timezone,
        dashboard: experimentControl,
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
