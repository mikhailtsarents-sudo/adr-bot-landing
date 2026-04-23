export const analyticsEventNames = {
  sitePageView: "site_page_view",
  telegramCtaClick: "telegram_cta_click",
  telegramRedirect: "telegram_redirect",
} as const;

export type AnalyticsEventName =
  (typeof analyticsEventNames)[keyof typeof analyticsEventNames];

export type AnalyticsPageType = "landing" | "seo" | "legal" | "other";

export type AnalyticsEventPayload = {
  event: AnalyticsEventName;
  source: string;
  page_path?: string;
  page_slug?: string;
  page_type?: AnalyticsPageType;
  locale?: string;
  target?: string;
  referrer?: string;
  user_agent?: string;
  occurred_at?: string;
};

function sanitizeTelegramStartChunk(value: string, fallback: string, maxLength = 24) {
  const normalized = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return (normalized || fallback).slice(0, maxLength);
}

export function buildTelegramStartToken({
  source,
  pathname,
}: {
  source: string;
  pathname: string;
}) {
  const sourceChunk = sanitizeTelegramStartChunk(source, "site");
  const pathChunk = sanitizeTelegramStartChunk(pathname === "/" ? "home" : pathname, "home");
  return `site--${sourceChunk}--${pathChunk}`;
}

export function inferPageType(pathname: string): AnalyticsPageType {
  if (pathname === "/" || pathname === "/ru") {
    return "landing";
  }

  if (
    [
      "/adr-pruefung-auf-deutsch",
      "/basiskurs-preview",
      "/aufbaukurs-tank-preview",
      "/adr-begriffe",
      "/adr-faq-fuer-fahrer",
    ].includes(pathname)
  ) {
    return "seo";
  }

  if (["/impressum", "/datenschutz", "/legal"].includes(pathname)) {
    return "legal";
  }

  return "other";
}

export function buildTelegramRedirectHref({
  source,
  pathname,
  locale,
}: {
  source: string;
  pathname: string;
  locale?: string;
}) {
  const params = new URLSearchParams({
    source,
    from: pathname,
    start: buildTelegramStartToken({ source, pathname }),
  });

  if (locale) {
    params.set("locale", locale);
  }

  return `/telegram?${params.toString()}`;
}
