export const siteConfig = {
  name: "ADR Bot",
  description:
    "ADR Bot helps drivers and logistics professionals prepare for the ADR exam in German through clearer terminology, practical wording support, and a structured Telegram-based learning flow.",
  defaultLocale: "de-DE",
  keywords: [
    "ADR Prüfung Deutsch",
    "ADR Prüfungsvorbereitung",
    "ADR lernen Deutsch",
    "Gefahrgut Prüfung Deutsch",
    "ADR Telegram Bot",
    "ADR Begriffe Deutsch",
    "Technisches Deutsch ADR",
    "ADR Prüfung Hilfe",
  ],
};

export const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://example.com";

export const isPlaceholderSiteUrl = siteUrl === "https://example.com";

export const allowIndexing =
  process.env.NEXT_PUBLIC_ALLOW_INDEXING === "true" && !isPlaceholderSiteUrl;
