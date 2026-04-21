"use client";

import {
  analyticsEventNames,
  buildTelegramRedirectHref,
  inferPageType,
  type AnalyticsEventPayload,
} from "@/lib/analytics";
import { track } from "@vercel/analytics";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

type TrackedTelegramLinkProps = {
  href?: string;
  source: string;
  className?: string;
  children: ReactNode;
  tabIndex?: number;
  locale?: string;
};

export function TrackedTelegramLink({
  href,
  source,
  className,
  children,
  tabIndex,
  locale,
}: TrackedTelegramLinkProps) {
  const pathname = usePathname();

  const resolvedHref =
    href ??
    buildTelegramRedirectHref({
      source,
      pathname: pathname || "/",
      locale,
    });

  function handleClick() {
    const payload: AnalyticsEventPayload = {
      event: analyticsEventNames.telegramCtaClick,
      source,
      page_path: pathname || "/",
      page_type: inferPageType(pathname || "/"),
      locale,
      target: resolvedHref,
      referrer: typeof document !== "undefined" ? document.referrer : undefined,
      occurred_at: new Date().toISOString(),
    };

    track(analyticsEventNames.telegramCtaClick, {
      source,
      page_path: payload.page_path,
      page_type: payload.page_type,
      locale,
      target: resolvedHref,
    });

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

  return (
    <a
      href={resolvedHref}
      className={className}
      onClick={handleClick}
      tabIndex={tabIndex}
    >
      {children}
    </a>
  );
}
