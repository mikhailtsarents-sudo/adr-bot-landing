function text(value) {
  return value == null ? "" : String(value).trim();
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
    .slice(0, 100);
}

function humanizeIntentLabel(label) {
  const safe = text(label);
  if (!safe) return "";
  if (safe.startsWith("/")) {
    return safe
      .slice(1)
      .split("-")
      .filter(Boolean)
      .join(" ");
  }
  return safe;
}

function inferBriefType(item) {
  const formats = Array.isArray(item.recommended_formats) ? item.recommended_formats : [];
  if (formats.includes("seo_vocab_page")) return "seo_vocab_page";
  if (formats.includes("seo_page_refresh")) return "seo_page_refresh";
  if (formats.includes("seo_landing_page")) return "seo_landing_page";
  if (formats.includes("seo_product_page")) return "seo_product_page";
  return "seo_page";
}

function inferContentType(item) {
  const formats = Array.isArray(item.recommended_formats) ? item.recommended_formats : [];
  if (formats.includes("telegram_vocab_drill")) return "telegram_vocab_drill";
  if (formats.includes("telegram_quiz_entry")) return "telegram_quiz_entry";
  if (formats.includes("telegram_onboarding_angle")) return "telegram_onboarding_angle";
  if (formats.includes("telegram_conversion_offer")) return "telegram_conversion_offer";
  if (formats.includes("term_short_video")) return "term_short_video_angle";
  if (formats.includes("quiz_short_video")) return "quiz_short_video_angle";
  if (formats.includes("trust_building_short_video")) return "trust_building_short_video_angle";
  if (formats.includes("product_explainer_video")) return "product_explainer_video_angle";
  return "content_angle";
}

function inferRecommendedSlug(item) {
  const label = text(item.intent_label);
  if (label.startsWith("/")) return label;
  const key = slugify(item.intent_label || item.intent_key);
  return key ? `/${key}` : "";
}

function buildRationale(item) {
  const evidence = item.evidence || {};
  const parts = [];
  if (Number(evidence.search_impressions || 0) > 0) {
    parts.push(`${evidence.search_impressions} impressions`);
  }
  if (Number(evidence.search_clicks || 0) > 0) {
    parts.push(`${evidence.search_clicks} clicks`);
  }
  if (Number(evidence.page_views || 0) > 0) {
    parts.push(`${evidence.page_views} page views`);
  }
  if (Number(evidence.telegram_redirects || 0) > 0) {
    parts.push(`${evidence.telegram_redirects} Telegram redirects`);
  }
  if (Number(evidence.content_views || 0) > 0) {
    parts.push(`${evidence.content_views} content views`);
  }
  return parts.join(", ");
}

export function buildSeoBriefQueue(backlog, options = {}) {
  const items = Array.isArray(backlog) ? backlog : [];
  const createdAt = options.createdAt || new Date().toISOString();
  return items.map((item) => {
    const briefType = inferBriefType(item);
    const humanLabel = humanizeIntentLabel(item.intent_label || item.intent_key);
    return {
      brief_id: `seo-${briefType}-${item.rank}-${slugify(item.intent_key || item.intent_label || String(item.rank))}`,
      created_at: createdAt,
      source: "intent_to_content_machine",
      status: "pending",
      priority_rank: item.rank,
      opportunity_score: item.opportunity_score,
      intent_key: item.intent_key,
      intent_label: item.intent_label,
      intent_kind: item.intent_kind,
      brief_type: briefType,
      recommended_slug: inferRecommendedSlug(item),
      working_title: humanLabel || item.intent_key,
      objective: `Strengthen the project around the intent "${humanLabel || item.intent_key}" without guessing manually.`,
      rationale: buildRationale(item),
      next_actions: Array.isArray(item.next_actions) ? item.next_actions : [],
      evidence: item.evidence || {},
      recommended_formats: Array.isArray(item.recommended_formats) ? item.recommended_formats : [],
    };
  });
}

export function buildContentBriefQueue(backlog, options = {}) {
  const items = Array.isArray(backlog) ? backlog : [];
  const createdAt = options.createdAt || new Date().toISOString();
  return items.map((item) => {
    const contentType = inferContentType(item);
    const humanLabel = humanizeIntentLabel(item.intent_label || item.intent_key);
    return {
      brief_id: `content-${contentType}-${item.rank}-${slugify(item.intent_key || item.intent_label || String(item.rank))}`,
      created_at: createdAt,
      source: "intent_to_content_machine",
      status: "pending",
      priority_rank: item.rank,
      opportunity_score: item.opportunity_score,
      intent_key: item.intent_key,
      intent_label: item.intent_label,
      intent_kind: item.intent_kind,
      content_type: contentType,
      angle: humanLabel || item.intent_key,
      objective: `Use this intent as an input for the next content decision layer.`,
      rationale: buildRationale(item),
      next_actions: Array.isArray(item.next_actions) ? item.next_actions : [],
      evidence: item.evidence || {},
      recommended_formats: Array.isArray(item.recommended_formats) ? item.recommended_formats : [],
    };
  });
}
