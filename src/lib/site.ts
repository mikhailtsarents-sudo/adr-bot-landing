export const siteConfig = {
  name: "ADR Bot",
  description:
    "ADR Bot bietet einen kostenlosen Start in Telegram und optionalen Vollzugriff fuer die ADR-Pruefungsvorbereitung auf Deutsch. Der Bot hilft bei Fachbegriffen, Pruefungsdeutsch und typischen ADR-Fragen.",
  defaultLocale: "de-DE",
  keywords: [
    "ADR Prüfung Deutsch",
    "ADR Prüfungsvorbereitung",
    "ADR lernen Deutsch",
    "Gefahrgut Prüfung Deutsch",
    "ADR Schein machen",
    "ADR Schein Deutsch",
    "ADR Kurs Deutsch",
    "ADR Test Deutsch",
    "ADR Telegram Bot",
    "ADR Begriffe Deutsch",
    "Technisches Deutsch ADR",
    "ADR Prüfung Hilfe",
    "ADR Fragen Deutsch",
    "ADR Gefahrgut lernen",
  ],
};

const rawSiteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://example.com";

function normalizeSiteUrl(url: string) {
  if (url === "https://adr-bot.de") {
    return "https://www.adr-bot.de";
  }

  return url.replace(/\/$/, "");
}

export const siteUrl = normalizeSiteUrl(rawSiteUrl);

export const isPlaceholderSiteUrl = siteUrl === "https://example.com";

export const allowIndexing =
  process.env.NEXT_PUBLIC_ALLOW_INDEXING === "true" && !isPlaceholderSiteUrl;
