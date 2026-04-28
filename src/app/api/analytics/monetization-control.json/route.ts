import { readAnalyticsControlBundle } from "@/lib/analytics-control-loaders";
import { buildMonetizationControlDashboard } from "@/lib/monetization-control-dashboard";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { botDashboard } = await readAnalyticsControlBundle(request);
    const monetizationControl = buildMonetizationControlDashboard(botDashboard);

    return NextResponse.json(
      {
        ok: true,
        refreshed_at: monetizationControl.refreshed_at,
        timezone: monetizationControl.timezone,
        dashboard: monetizationControl,
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
