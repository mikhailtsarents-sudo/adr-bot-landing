import { buildAnalyticsDashboard } from "@/lib/analytics-dashboard";
import { readAnalyticsRows } from "@/lib/analytics-storage";
import { buildBotFunnelDashboard } from "@/lib/bot-funnel-dashboard";
import { hasBotFunnelStorageConfig, readBotFunnelRows } from "@/lib/bot-funnel-storage";
import { buildReconciliationDashboard } from "@/lib/reconciliation-dashboard";
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
    const boundedLimit = Number.isFinite(limit) ? Math.min(Math.max(limit, 1), 5000) : 2000;
    const timeZone =
      searchParams.get("timezone") ||
      process.env.ANALYTICS_DASHBOARD_TIMEZONE ||
      "Europe/Berlin";

    const [analyticsRows, botRows] = await Promise.all([
      readAnalyticsRows({ limit: boundedLimit }),
      readBotFunnelRows({ limit: boundedLimit }),
    ]);

    const analyticsDashboard = buildAnalyticsDashboard(analyticsRows, { timeZone });
    const botDashboard = buildBotFunnelDashboard(botRows, { timeZone });
    const dashboard = buildReconciliationDashboard(analyticsDashboard, botDashboard);

    return NextResponse.json(
      { ok: true, dashboard },
      { headers: { "Cache-Control": "no-store, max-age=0" } },
    );
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "unknown_error" },
      { status: 500 },
    );
  }
}
