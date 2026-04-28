import { readAnalyticsControlBundle } from "@/lib/analytics-control-loaders";
import { buildExperimentControlDashboard } from "@/lib/experiment-control-dashboard";
import { buildMonetizationControlDashboard } from "@/lib/monetization-control-dashboard";
import { buildOperatorDecisionDashboard } from "@/lib/operator-decision-dashboard";
import { buildReportingSummaryDashboard } from "@/lib/reporting-summary-dashboard";
import { buildRuntimeHealthDashboard } from "@/lib/runtime-health-dashboard";
import { readRuntimeHealthSnapshot } from "@/lib/runtime-health-storage";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const [bundle, runtimeSnapshot] = await Promise.all([
      readAnalyticsControlBundle(request),
      readRuntimeHealthSnapshot(),
    ]);

    const runtimeHealth = buildRuntimeHealthDashboard(runtimeSnapshot);
    const operatorDecision = buildOperatorDecisionDashboard(bundle.analyticsDashboard, bundle.botDashboard);
    const monetizationControl = buildMonetizationControlDashboard(bundle.botDashboard);
    const experimentControl = buildExperimentControlDashboard(
      bundle.analyticsDashboard,
      bundle.botDashboard,
      monetizationControl,
    );
    const reportingSummary = buildReportingSummaryDashboard({
      runtimeHealth,
      analyticsDashboard: bundle.analyticsDashboard,
      botDashboard: bundle.botDashboard,
      operatorDecision,
      monetizationControl,
      experimentControl,
    });

    return NextResponse.json(
      {
        ok: true,
        refreshed_at: reportingSummary.refreshed_at,
        timezone: reportingSummary.timezone,
        dashboard: reportingSummary,
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
