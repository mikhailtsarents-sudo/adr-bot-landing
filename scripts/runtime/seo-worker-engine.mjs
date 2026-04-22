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

function normalizeSlug(value) {
  const safe = text(value);
  if (!safe) return "";
  return safe.startsWith("/") ? safe.slice(1) : safe;
}

function inferTaskType(brief, existingSlugs) {
  const slug = normalizeSlug(brief.recommended_slug);
  if (existingSlugs.has(slug)) return "refresh_existing_page";
  if (brief.brief_type === "seo_page_refresh") return "refresh_existing_page";
  return "create_new_page";
}

function buildSectionPlan(brief) {
  if (brief.intent_kind === "vocabulary") {
    return [
      "Hero with one clear ADR vocabulary promise",
      "Short explanation of what the user will learn",
      "6-10 term preview block",
      "Why Telegram continues the drill",
      "FAQ",
      "CTA",
    ];
  }
  if (brief.intent_kind === "question") {
    return [
      "Hero with one clear question-training promise",
      "Short answer on what the page solves",
      "3-5 sample questions with short explanations",
      "Why Telegram is the next step",
      "FAQ",
      "CTA",
    ];
  }
  return [
    "Hero with one clear beginner-learning promise",
    "Short explanation of the intent",
    "Sample block with 2-3 examples or mini-lessons",
    "Why Telegram is the next step",
    "FAQ",
    "CTA",
  ];
}

function buildSampleStrategy(brief) {
  if (brief.intent_kind === "vocabulary") {
    return "Use 6-10 terms only. Enough to prove usefulness, not enough to replace the bot.";
  }
  if (brief.intent_kind === "question") {
    return "Use 3-5 sample questions only with short explanations.";
  }
  return "Use 2-3 short examples or mini-lessons. Keep the page useful but incomplete by design.";
}

function buildInternalLinkSuggestions(brief, existingSlugs) {
  const suggestions = ["/"];
  const slug = text(brief.recommended_slug);

  if (brief.intent_kind === "vocabulary" && existingSlugs.has("adr-begriffe")) {
    suggestions.push("/adr-begriffe");
  }
  if (brief.intent_kind === "question" && existingSlugs.has("adr-pruefungsfragen-lernen")) {
    suggestions.push("/adr-pruefungsfragen-lernen");
  }
  if (brief.intent_kind === "learning" && existingSlugs.has("technisches-deutsch-adr")) {
    suggestions.push("/technisches-deutsch-adr");
  }
  if (slug && !suggestions.includes(slug)) {
    suggestions.push(slug);
  }

  return [...new Set(suggestions)];
}

export function buildSeoExecutionQueue(briefQueue, options = {}) {
  const briefs = Array.isArray(briefQueue) ? briefQueue : [];
  const existingSlugs = new Set((options.existingSlugs || []).map((slug) => normalizeSlug(slug)).filter(Boolean));
  const createdAt = options.createdAt || new Date().toISOString();

  return briefs.map((brief) => {
    const recommendedSlug = text(brief.recommended_slug || "");
    const normalizedSlug = normalizeSlug(recommendedSlug);
    const taskType = inferTaskType(brief, existingSlugs);
    const pageExists = existingSlugs.has(normalizedSlug);

    return {
      task_id: `seo-worker-${taskType}-${slugify(brief.intent_key || brief.brief_id || recommendedSlug)}`,
      created_at: createdAt,
      worker: "seo_expansion_worker",
      status: "pending",
      source: "intent_to_content_machine",
      source_brief_id: brief.brief_id,
      priority_rank: brief.priority_rank,
      opportunity_score: brief.opportunity_score,
      task_type: taskType,
      page_exists: pageExists,
      existing_page_path: pageExists ? `/${normalizedSlug}` : "",
      recommended_slug: recommendedSlug || `/${normalizedSlug}`,
      intent_key: brief.intent_key,
      intent_label: brief.intent_label,
      intent_kind: brief.intent_kind,
      brief_type: brief.brief_type,
      working_title: brief.working_title,
      objective: brief.objective,
      rationale: brief.rationale,
      section_plan: buildSectionPlan(brief),
      sample_content_strategy: buildSampleStrategy(brief),
      internal_link_suggestions: buildInternalLinkSuggestions(brief, existingSlugs),
      next_actions: Array.isArray(brief.next_actions) ? brief.next_actions : [],
      evidence: brief.evidence || {},
      telegram_cta_source: `seo_worker_${slugify(normalizedSlug || brief.intent_key)}`,
      requires_design_approval: true,
      requires_yura_review: true,
      release_checks_owner: "analytics_monitor",
    };
  });
}

export function buildSeoMarkdownBrief(task) {
  const lines = [];
  lines.push(`# SEO Worker Brief: ${task.working_title || task.intent_key}`);
  lines.push("");
  lines.push(`- Task ID: ${task.task_id}`);
  lines.push(`- Task type: ${task.task_type}`);
  lines.push(`- Recommended slug: ${task.recommended_slug}`);
  lines.push(`- Existing page: ${task.page_exists ? "yes" : "no"}`);
  lines.push(`- Intent kind: ${task.intent_kind}`);
  lines.push(`- Priority rank: ${task.priority_rank}`);
  lines.push(`- Opportunity score: ${task.opportunity_score}`);
  lines.push("");
  lines.push("## Objective");
  lines.push("");
  lines.push(task.objective || "");
  lines.push("");
  lines.push("## Rationale");
  lines.push("");
  lines.push(task.rationale || "No rationale captured.");
  lines.push("");
  lines.push("## Section Plan");
  lines.push("");
  for (const item of task.section_plan || []) {
    lines.push(`- ${item}`);
  }
  lines.push("");
  lines.push("## Sample Strategy");
  lines.push("");
  lines.push(task.sample_content_strategy || "");
  lines.push("");
  lines.push("## Internal Links");
  lines.push("");
  for (const item of task.internal_link_suggestions || []) {
    lines.push(`- ${item}`);
  }
  lines.push("");
  lines.push("## Next Actions");
  lines.push("");
  for (const item of task.next_actions || []) {
    lines.push(`- ${item}`);
  }
  lines.push("");
  lines.push("## Coordination");
  lines.push("");
  lines.push("- Requires design approval before publication.");
  lines.push("- Requires Yura review for public wording.");
  lines.push("- Requires Analytics Monitor check after release.");
  lines.push("");
  return `${lines.join("\n")}\n`;
}
