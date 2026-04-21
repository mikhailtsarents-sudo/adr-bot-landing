import { forwardAnalyticsEvent } from "@/lib/analytics-server";
import {
  analyticsEventNames,
  type AnalyticsEventName,
  type AnalyticsEventPayload,
} from "@/lib/analytics";
import { NextResponse } from "next/server";

const allowedEvents = new Set<AnalyticsEventName>([
  analyticsEventNames.sitePageView,
  analyticsEventNames.telegramCtaClick,
  analyticsEventNames.telegramRedirect,
]);

function normalizeEvent(payload: Partial<AnalyticsEventPayload>): AnalyticsEventPayload | null {
  if (!payload.event || !allowedEvents.has(payload.event)) {
    return null;
  }

  if (!payload.source) {
    return null;
  }

  return {
    event: payload.event,
    source: String(payload.source),
    page_path: payload.page_path ? String(payload.page_path) : undefined,
    page_slug: payload.page_slug ? String(payload.page_slug) : undefined,
    page_type: payload.page_type,
    locale: payload.locale ? String(payload.locale) : undefined,
    target: payload.target ? String(payload.target) : undefined,
    referrer: payload.referrer ? String(payload.referrer) : undefined,
    user_agent: payload.user_agent ? String(payload.user_agent) : undefined,
    occurred_at: payload.occurred_at ? String(payload.occurred_at) : undefined,
  };
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as Partial<AnalyticsEventPayload>;
    const normalized = normalizeEvent(payload);

    if (!normalized) {
      return NextResponse.json({ ok: false, error: "invalid_payload" }, { status: 400 });
    }

    await forwardAnalyticsEvent(normalized);
    return NextResponse.json({ ok: true }, { status: 202 });
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
