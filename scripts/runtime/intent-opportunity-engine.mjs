function text(value) {
  return value == null ? "" : String(value).trim();
}

function num(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function clamp(value, min = 0, max = 100) {
  return Math.max(min, Math.min(max, Math.round(value)));
}

function toArray(value) {
  return Array.isArray(value) ? value : [];
}

function slugify(value) {
  return text(value)
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function normalizePagePath(value) {
  const source = text(value);
  if (!source) return "";
  try {
    if (source.startsWith("http://") || source.startsWith("https://")) {
      return new URL(source).pathname || "";
    }
  } catch {}
  return source.startsWith("/") ? source : `/${source}`;
}

function normalizeIntentLabel(value) {
  return text(value)
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[?!.:,;()]/g, "")
    .trim();
}

function shouldIgnoreSignalLabel(value) {
  const safe = normalizeIntentLabel(value);
  if (!safe) return true;
  if (
    safe === "/manual"
    || safe === "manual"
    || safe.includes("manual test")
    || safe.includes("local e2e test")
    || safe.includes("test event")
  ) {
    return true;
  }
  return false;
}

function shouldIgnoreSiteAnalyticsRow(row) {
  const event = text(row.event).toLowerCase();
  const pagePath = normalizePagePath(row.page_path || row.page || row.pagePath);
  const source = text(row.source).toLowerCase();
  if (event === "manual_test") return true;
  if (pagePath === "/manual") return true;
  if (source.includes("test")) return true;
  return false;
}

function inferIntentKind(label) {
  const safe = normalizeIntentLabel(label);
  if (!safe) return "generic";
  if (
    safe.includes("frage")
    || safe.includes("pruefung")
    || safe.includes("prüfung")
    || safe.includes("test")
    || safe.includes("antwort")
  ) {
    return "question";
  }
  if (
    safe.includes("begriff")
    || safe.includes("woerter")
    || safe.includes("wörter")
    || safe.includes("wort")
    || safe.includes("vokabel")
  ) {
    return "vocabulary";
  }
  if (
    safe.includes("deutsch")
    || safe.includes("lernen")
    || safe.includes("hilfe")
    || safe.includes("vorbereitung")
    || safe.includes("kurs")
  ) {
    return "learning";
  }
  if (safe.includes("bot") || safe.includes("telegram") || safe.includes("app")) {
    return "product";
  }
  return "generic";
}

function inferRecommendedFormats(intentKind) {
  if (intentKind === "question") {
    return ["seo_page_refresh", "quiz_short_video", "telegram_quiz_entry"];
  }
  if (intentKind === "vocabulary") {
    return ["seo_vocab_page", "term_short_video", "telegram_vocab_drill"];
  }
  if (intentKind === "learning") {
    return ["seo_landing_page", "trust_building_short_video", "telegram_onboarding_angle"];
  }
  if (intentKind === "product") {
    return ["seo_product_page", "product_explainer_video", "telegram_conversion_offer"];
  }
  return ["seo_page", "short_video", "telegram_angle"];
}

function buildIntentKey({ query, pagePath, explicitKey }) {
  if (text(explicitKey)) return slugify(explicitKey);
  if (text(query)) return slugify(normalizeIntentLabel(query));
  if (text(pagePath)) return slugify(normalizePagePath(pagePath).replace(/\//g, " "));
  return "";
}

function getOrCreateIntent(map, key, defaults) {
  if (!map.has(key)) {
    map.set(key, {
      intent_key: key,
      intent_label: defaults.intent_label || key,
      intent_kind: defaults.intent_kind || "generic",
      search_console: {
        queries: [],
        pages: [],
        clicks: 0,
        impressions: 0,
        ctr_weighted: 0,
        position_weighted: 0,
      },
      site_analytics: {
        page_views: 0,
        telegram_cta_clicks: 0,
        telegram_redirects: 0,
        pages: [],
      },
      telegram_feedback: {
        signals: [],
        start_count: 0,
        completion_count: 0,
        positive_count: 0,
      },
      content_feedback: {
        items: [],
        views: 0,
        conversions: 0,
        retention_score_sum: 0,
        retention_score_count: 0,
      },
      recommended_formats: inferRecommendedFormats(defaults.intent_kind || "generic"),
    });
  }
  return map.get(key);
}

function addUnique(list, value) {
  if (!text(value)) return;
  if (!list.includes(value)) list.push(value);
}

function aggregateSearchConsole(intent, row) {
  const clicks = num(row.clicks);
  const impressions = num(row.impressions);
  const ctr = num(row.ctr);
  const position = num(row.position);
  intent.search_console.clicks += clicks;
  intent.search_console.impressions += impressions;
  intent.search_console.ctr_weighted += ctr * Math.max(impressions, 1);
  intent.search_console.position_weighted += position * Math.max(impressions, 1);
  addUnique(intent.search_console.queries, text(row.query));
  addUnique(intent.search_console.pages, normalizePagePath(row.page));
}

function aggregateSiteAnalytics(intent, row) {
  const pagePath = normalizePagePath(row.page_path || row.page || row.pagePath);
  addUnique(intent.site_analytics.pages, pagePath);
  const event = text(row.event);
  if (event === "site_page_view") intent.site_analytics.page_views += 1;
  if (event === "telegram_cta_click") intent.site_analytics.telegram_cta_clicks += 1;
  if (event === "telegram_redirect") intent.site_analytics.telegram_redirects += 1;
}

function aggregateTelegramFeedback(intent, row) {
  const sentiment = text(row.sentiment).toLowerCase();
  intent.telegram_feedback.start_count += num(row.start_count, 0);
  intent.telegram_feedback.completion_count += num(row.completion_count, 0);
  if (sentiment === "positive" || row.helpful === true) {
    intent.telegram_feedback.positive_count += 1;
  }
  const note = text(row.note || row.feedback || row.summary);
  if (note) intent.telegram_feedback.signals.push(note);
}

function aggregateContentFeedback(intent, row) {
  intent.content_feedback.views += num(row.views, 0);
  intent.content_feedback.conversions += num(row.conversions, 0);
  const retentionScore = num(row.retention_score, NaN);
  if (Number.isFinite(retentionScore)) {
    intent.content_feedback.retention_score_sum += retentionScore;
    intent.content_feedback.retention_score_count += 1;
  }
  intent.content_feedback.items.push({
    title: text(row.title),
    url: text(row.url),
    format: text(row.format),
  });
}

function finalizeIntent(intent) {
  const impressions = intent.search_console.impressions;
  const ctr = impressions > 0 ? intent.search_console.ctr_weighted / Math.max(impressions, 1) : 0;
  const avgPosition = impressions > 0 ? intent.search_console.position_weighted / Math.max(impressions, 1) : 0;
  const pageViews = intent.site_analytics.page_views;
  const telegramRedirects = intent.site_analytics.telegram_redirects;
  const clickToTelegramRate = pageViews > 0 ? telegramRedirects / pageViews : 0;
  const contentRetention = intent.content_feedback.retention_score_count > 0
    ? intent.content_feedback.retention_score_sum / intent.content_feedback.retention_score_count
    : 0;

  const demandScore = clamp(
    Math.log10(impressions + 1) * 32
    + Math.log10(intent.search_console.clicks + 1) * 20
    + Math.max(0, 25 - avgPosition),
  );
  const conversionScore = clamp(
    clickToTelegramRate * 220
    + Math.log10(telegramRedirects + 1) * 16
    + Math.log10(intent.telegram_feedback.start_count + 1) * 18,
  );
  const feedbackScore = clamp(
    intent.telegram_feedback.positive_count * 16
    + Math.log10(intent.content_feedback.conversions + 1) * 18
    + contentRetention,
  );
  const gapScore = clamp(
    Math.max(0, 0.12 - ctr) * 400
    + Math.max(0, pageViews - telegramRedirects * 3)
    + Math.max(0, 35 - contentRetention),
  );
  const opportunityScore = clamp(
    demandScore * 0.4
    + gapScore * 0.3
    + conversionScore * 0.15
    + feedbackScore * 0.15,
  );

  const recommendations = [];
  if (impressions >= 80 && ctr < 0.05) {
    recommendations.push("Refresh SEO title/meta and tighten the promise for this intent.");
  }
  if (pageViews >= 15 && clickToTelegramRate < 0.08) {
    recommendations.push("Strengthen the Telegram CTA and make the next step more concrete on the page.");
  }
  if (intent.content_feedback.views > 0 && contentRetention < 45) {
    recommendations.push("Rework short-form hook because content demand exists but retention is weak.");
  }
  if (intent.intent_kind === "question") {
    recommendations.push("Turn this intent into a question-led page section and a quiz-style short video.");
  } else if (intent.intent_kind === "vocabulary") {
    recommendations.push("Package this intent as a glossary page plus quick term explainer short.");
  } else if (intent.intent_kind === "learning") {
    recommendations.push("Expand this intent with a focused landing page and beginner onboarding angle.");
  } else if (intent.intent_kind === "product") {
    recommendations.push("Use this intent to explain why the bot/app is useful and lower friction to first Telegram start.");
  }

  return {
    ...intent,
    metrics: {
      search_clicks: intent.search_console.clicks,
      search_impressions: impressions,
      weighted_ctr: Number(ctr.toFixed(4)),
      avg_position: Number(avgPosition.toFixed(2)),
      page_views: pageViews,
      telegram_cta_clicks: intent.site_analytics.telegram_cta_clicks,
      telegram_redirects: telegramRedirects,
      telegram_start_count: intent.telegram_feedback.start_count,
      telegram_completion_count: intent.telegram_feedback.completion_count,
      content_views: intent.content_feedback.views,
      content_conversions: intent.content_feedback.conversions,
      content_retention_score: Number(contentRetention.toFixed(2)),
      click_to_telegram_rate: Number(clickToTelegramRate.toFixed(4)),
    },
    scores: {
      demand_score: demandScore,
      conversion_score: conversionScore,
      feedback_score: feedbackScore,
      gap_score: gapScore,
      opportunity_score: opportunityScore,
    },
    recommendations,
  };
}

function summarizeTopActions(opportunities) {
  return opportunities.slice(0, 5).map((item) => {
    const topAction = item.recommendations[0] || "Review manually.";
    return `${item.intent_label}: ${topAction}`;
  });
}

export function analyzeIntentSignals(snapshot) {
  const map = new Map();
  const pageToIntentKey = new Map();
  const searchConsole = toArray(snapshot?.search_console);
  const siteAnalytics = toArray(snapshot?.site_analytics);
  const telegramFeedback = toArray(snapshot?.telegram_feedback);
  const contentFeedback = toArray(snapshot?.content_feedback);

  for (const row of searchConsole) {
    const query = text(row.query);
    const pagePath = normalizePagePath(row.page);
    const label = query || pagePath;
    if (!label || shouldIgnoreSignalLabel(label)) continue;
    const intentKind = inferIntentKind(label);
    const key = buildIntentKey({ query, pagePath });
    if (!key) continue;
    const intent = getOrCreateIntent(map, key, {
      intent_label: label,
      intent_kind: intentKind,
    });
    aggregateSearchConsole(intent, row);
    if (pagePath) {
      pageToIntentKey.set(pagePath, key);
    }
  }

  for (const row of siteAnalytics) {
    if (shouldIgnoreSiteAnalyticsRow(row)) continue;
    const explicitKey = text(row.intent_key);
    const pagePath = normalizePagePath(row.page_path || row.page);
    const source = text(row.source).replace(/[_-]+/g, " ");
    const label = explicitKey || pagePath || source;
    if (!label || shouldIgnoreSignalLabel(label)) continue;
    const intentKind = inferIntentKind(label);
    const key =
      pageToIntentKey.get(pagePath)
      || buildIntentKey({ explicitKey, pagePath, query: "" });
    if (!key) continue;
    const intent = getOrCreateIntent(map, key, {
      intent_label: label,
      intent_kind: intentKind,
    });
    aggregateSiteAnalytics(intent, row);
  }

  for (const row of telegramFeedback) {
    const explicitKey = text(row.intent_key);
    const label = explicitKey || text(row.intent_label || row.topic || row.query);
    if (!label || shouldIgnoreSignalLabel(label)) continue;
    const intentKind = inferIntentKind(label);
    const key = buildIntentKey({ explicitKey, query: label });
    if (!key) continue;
    const intent = getOrCreateIntent(map, key, {
      intent_label: label,
      intent_kind: intentKind,
    });
    aggregateTelegramFeedback(intent, row);
  }

  for (const row of contentFeedback) {
    const explicitKey = text(row.intent_key);
    const label = explicitKey || text(row.intent_label || row.query || row.title);
    if (!label || shouldIgnoreSignalLabel(label)) continue;
    const intentKind = inferIntentKind(label);
    const key = buildIntentKey({ explicitKey, query: label });
    if (!key) continue;
    const intent = getOrCreateIntent(map, key, {
      intent_label: label,
      intent_kind: intentKind,
    });
    aggregateContentFeedback(intent, row);
  }

  const opportunities = [...map.values()]
    .map((intent) => finalizeIntent(intent))
    .sort((left, right) => right.scores.opportunity_score - left.scores.opportunity_score);

  return {
    created_at: new Date().toISOString(),
    summary: {
      intent_count: opportunities.length,
      top_actions: summarizeTopActions(opportunities),
      signal_counts: {
        search_console: searchConsole.length,
        site_analytics: siteAnalytics.length,
        telegram_feedback: telegramFeedback.length,
        content_feedback: contentFeedback.length,
      },
    },
    opportunities,
  };
}
