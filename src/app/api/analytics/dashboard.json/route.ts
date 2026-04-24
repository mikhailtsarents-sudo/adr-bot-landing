import { buildAnalyticsDashboard } from "@/lib/analytics-dashboard";
import { readAnalyticsRows } from "@/lib/analytics-storage";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Number(searchParams.get("limit") || "2000");
    const timeZone =
      searchParams.get("timezone") ||
      process.env.ANALYTICS_DASHBOARD_TIMEZONE ||
      "Europe/Berlin";

    const rows = await readAnalyticsRows({
      limit: Number.isFinite(limit) ? Math.min(Math.max(limit, 1), 5000) : 2000,
    });

    const dashboard = buildAnalyticsDashboard(rows, { timeZone });

    return NextResponse.json(
      {
        ok: true,
        dashboard,
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
