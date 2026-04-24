import { forwardAnalyticsEvent } from "@/lib/analytics-server";
import { analyticsEventNames, isBotLikeUserAgent } from "@/lib/analytics";
import { NextResponse } from "next/server";

const telegramHref = "https://t.me/Adr_wort_trainer_bot";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const source = searchParams.get("source") || "unknown";
  const from = searchParams.get("from") || undefined;
  const locale = searchParams.get("locale") || undefined;
  const start = searchParams.get("start") || undefined;
  const targetHref = start ? `${telegramHref}?start=${encodeURIComponent(start)}` : telegramHref;
  const userAgent = request.headers.get("user-agent") || "";
  const shouldTrackRedirect = !isBotLikeUserAgent(userAgent);

  try {
    if (shouldTrackRedirect) {
      await forwardAnalyticsEvent({
        event: analyticsEventNames.telegramRedirect,
        source,
        page_path: from,
        locale,
        target: targetHref,
        user_agent: userAgent || undefined,
        referrer: request.headers.get("referer") || undefined,
      });
    }
  } catch (error) {
    console.error("[telegram-redirect]", error);
  }

  const response = NextResponse.redirect(targetHref, 307);
  response.headers.set("Cache-Control", "no-store, max-age=0");
  response.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
  return response;
}
