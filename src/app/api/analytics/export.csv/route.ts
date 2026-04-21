import { analyticsEventNames, type AnalyticsEventName } from "@/lib/analytics";
import { readAnalyticsRows } from "@/lib/analytics-storage";

const allowedEvents = new Set<AnalyticsEventName>([
  analyticsEventNames.sitePageView,
  analyticsEventNames.telegramCtaClick,
  analyticsEventNames.telegramRedirect,
]);

const headers = [
  "event",
  "source",
  "page_path",
  "page_slug",
  "page_type",
  "locale",
  "target",
  "referrer",
  "user_agent",
  "occurred_at",
  "received_at",
];

function escapeCsv(value: string) {
  if (/[",\n]/.test(value)) {
    return `"${value.replaceAll('"', '""')}"`;
  }

  return value;
}

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

    const csv = [
      headers.join(","),
      ...rows.map((row) =>
        headers
          .map((header) => escapeCsv(String(row[header as keyof typeof row] ?? "")))
          .join(","),
      ),
    ].join("\n");

    return new Response(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch (error) {
    return new Response(
      error instanceof Error ? error.message : "unknown_error",
      { status: 500 },
    );
  }
}
