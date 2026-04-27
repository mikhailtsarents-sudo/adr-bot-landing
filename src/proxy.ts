import { NextResponse, type NextRequest } from "next/server";

import { DEFAULT_LANG, SUPPORTED_LANGS, type LangCode } from "@/lib/i18n/translations";
import { LANDING_ROUTE_BY_LANG } from "@/lib/landing-locales";

const STORAGE_KEY = "site_language";

function isSupportedLang(value: string | undefined | null): value is LangCode {
  return !!value && (SUPPORTED_LANGS as readonly string[]).includes(value);
}

function detectPreferredLang(request: NextRequest): LangCode {
  const saved = request.cookies.get(STORAGE_KEY)?.value?.toLowerCase();
  if (isSupportedLang(saved)) {
    return saved;
  }

  const acceptLanguage = request.headers.get("accept-language") || "";
  const candidates = acceptLanguage
    .split(",")
    .map((part) => part.trim().split(";")[0]?.slice(0, 2).toLowerCase())
    .filter(Boolean);

  for (const candidate of candidates) {
    if (isSupportedLang(candidate)) {
      return candidate;
    }
  }

  return DEFAULT_LANG;
}

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (pathname !== "/") {
    return NextResponse.next();
  }

  const preferredLang = detectPreferredLang(request);
  if (preferredLang === DEFAULT_LANG) {
    return NextResponse.next();
  }

  const url = request.nextUrl.clone();
  url.pathname = LANDING_ROUTE_BY_LANG[preferredLang];
  url.search = search;
  return NextResponse.redirect(url, 307);
}

export const config = {
  matcher: ["/"],
};
