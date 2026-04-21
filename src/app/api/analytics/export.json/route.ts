import { analyticsEventNames, type AnalyticsEventName } from "@/lib/analytics";
import { readAnalyticsRows } from "@/lib/analytics-storage";
import { NextResponse } from "next/server";

const allowedEvents = new Set<AnalyticsEventName>([
  analyticsEventNames.sitePageView,
  analyticsEventNames.telegramCtaClick,
  analyticsEventNames.telegramRedirect,
]);

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Number(searchParams.get("limit") || "500");
    const eventParam = searchParams.get("event");
    const event =
      eventParam && allowedEvents.has(eventParam as AnalyticsEventName)
        ? (eventParam as AnalyticsEventName)
        : undefined;

    const rows = await readAnalyticsRows({
      limit: Number.isFinite(limit) ? Math.min(Math.max(limit, 1), 5000) : 500,
      event,
    });

    return NextResponse.json(
      {
        ok: true,
        count: rows.length,
        rows,
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
