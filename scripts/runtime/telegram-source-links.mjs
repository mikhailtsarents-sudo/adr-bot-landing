const DEFAULT_BOT_PUBLIC_USERNAME = String(process.env.BOT_PUBLIC_USERNAME || "Adr_wort_trainer_bot")
  .trim()
  .replace(/^@+/, "");

function text(value) {
  return value == null ? "" : String(value).trim();
}

function slugify(value, fallback = "unknown") {
  const normalized = text(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return normalized || fallback;
}

export function buildTelegramStartUrl(startToken, botUsername = DEFAULT_BOT_PUBLIC_USERNAME) {
  const safeToken = text(startToken);
  const safeBotUsername = text(botUsername).replace(/^@+/, "");
  if (!safeBotUsername) return "";
  if (!safeToken) return `https://t.me/${safeBotUsername}`;
  return `https://t.me/${safeBotUsername}?start=${encodeURIComponent(safeToken)}`;
}

const FAMILY_PREFIX = { QUESTION: "question", WORD: "word", NEWS: "news" };

export function buildYoutubeStartToken({ contentId, surface = "shorts", contentFamily = "" } = {}) {
  const familySlug = FAMILY_PREFIX[String(contentFamily).toUpperCase()]
    ? slugify(FAMILY_PREFIX[String(contentFamily).toUpperCase()], "shorts")
    : slugify(surface, "shorts");
  return `yt--${familySlug}--${slugify(contentId, "unknown")}`;
}

export function buildYoutubeTelegramAttribution({
  contentId,
  surface = "shorts",
  contentFamily = "",
  botUsername = DEFAULT_BOT_PUBLIC_USERNAME,
} = {}) {
  const startToken = buildYoutubeStartToken({ contentId, surface, contentFamily });
  const telegramUrl = buildTelegramStartUrl(startToken, botUsername);
  return {
    startToken,
    telegramUrl,
    descriptionLines: [
      "Open the Telegram bot for more ADR practice:",
      telegramUrl,
    ],
  };
}

export function buildTikTokStartToken({ contentId, contentFamily = "" } = {}) {
  const familySlug = FAMILY_PREFIX[String(contentFamily).toUpperCase()]
    ? FAMILY_PREFIX[String(contentFamily).toUpperCase()]
    : "shorts";
  return `tt--${familySlug}--${slugify(contentId, "unknown")}`;
}

export function appendYoutubeTelegramAttribution(description, options = {}) {
  const safeDescription = text(description);
  const attribution = buildYoutubeTelegramAttribution(options);
  if (!attribution.telegramUrl) {
    return {
      description: safeDescription,
      ctaUrl: "",
      startToken: attribution.startToken,
    };
  }

  if (
    safeDescription.includes(attribution.telegramUrl) ||
    safeDescription.includes(attribution.startToken)
  ) {
    return {
      description: safeDescription,
      ctaUrl: attribution.telegramUrl,
      startToken: attribution.startToken,
    };
  }

  return {
    description: [safeDescription, ...attribution.descriptionLines]
      .filter(Boolean)
      .join("\n\n"),
    ctaUrl: attribution.telegramUrl,
    startToken: attribution.startToken,
  };
}
