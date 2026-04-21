"use client";

import {
  analyticsEventNames,
  type AnalyticsEventPayload,
  inferPageType,
} from "@/lib/analytics";
import { track } from "@vercel/analytics";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

type PageViewTrackerProps = {
  source: string;
  pageSlug?: string;
  locale?: string;
};

function postAnalyticsEvent(payload: AnalyticsEventPayload) {
  const body = JSON.stringify(payload);

  if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
    const blob = new Blob([body], { type: "application/json" });
    navigator.sendBeacon("/api/analytics/event", blob);
    return;
  }

  void fetch("/api/analytics/event", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body,
    keepalive: true,
  });
}

export function PageViewTracker({
  source,
  pageSlug,
  locale,
}: PageViewTrackerProps) {
  const pathname = usePathname();
  const sentRef = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname) {
      return;
    }

    const dedupeKey = `${source}:${pathname}:${locale ?? ""}`;
    if (sentRef.current === dedupeKey) {
      return;
    }

    sentRef.current = dedupeKey;

    const payload: AnalyticsEventPayload = {
      event: analyticsEventNames.sitePageView,
      source,
      page_path: pathname,
      page_slug: pageSlug,
      page_type: inferPageType(pathname),
      locale,
      referrer: typeof document !== "undefined" ? document.referrer : undefined,
      occurred_at: new Date().toISOString(),
    };

    track(analyticsEventNames.sitePageView, {
      source,
      page_path: pathname,
      page_slug: pageSlug,
      page_type: payload.page_type,
      locale,
    });

    postAnalyticsEvent(payload);
  }, [locale, pageSlug, pathname, source]);

  return null;
}
