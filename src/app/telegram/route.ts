import { forwardAnalyticsEvent } from "@/lib/analytics-server";
import { analyticsEventNames } from "@/lib/analytics";
import { NextResponse } from "next/server";

const telegramHref = "https://t.me/Adr_wort_trainer_bot";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const source = searchParams.get("source") || "unknown";
  const from = searchParams.get("from") || undefined;
  const locale = searchParams.get("locale") || undefined;
  const start = searchParams.get("start") || undefined;
  const targetHref = start ? `${telegramHref}?start=${encodeURIComponent(start)}` : telegramHref;

  try {
    await forwardAnalyticsEvent({
      event: analyticsEventNames.telegramRedirect,
      source,
      page_path: from,
      locale,
      target: targetHref,
      user_agent: request.headers.get("user-agent") || undefined,
      referrer: request.headers.get("referer") || undefined,
    });
  } catch (error) {
    console.error("[telegram-redirect]", error);
  }

  return NextResponse.redirect(targetHref, 307);
}
