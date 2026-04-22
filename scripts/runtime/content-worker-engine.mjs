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

function humanizeAngle(value) {
  const normalized = text(value)
    .replace(/^\//, "")
    .replace(/[-_/]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!normalized) return "ADR Deutsch";
  return normalized
    .split(" ")
    .map((part) => {
      const lower = part.toLowerCase();
      if (lower === "adr") return "ADR";
      if (lower === "app") return "App";
      return lower;
    })
    .join(" ");
}

function inferTaskType(brief) {
  if (brief.content_type === "telegram_vocab_drill") return "prepare_telegram_vocab_drill";
  if (brief.content_type === "telegram_quiz_entry") return "prepare_telegram_quiz_entry";
  if (brief.content_type === "telegram_onboarding_angle") return "prepare_telegram_onboarding_angle";
  if (brief.content_type === "telegram_conversion_offer") return "prepare_telegram_conversion_offer";
  return "prepare_content_angle";
}

function buildPrimaryChannel(brief) {
  if (String(brief.content_type || "").startsWith("telegram_")) {
    return "telegram";
  }
  return "content_planner";
}

function buildContentGoal(brief) {
  if (brief.content_type === "telegram_vocab_drill") {
    return "Turn the intent into a compact Telegram vocabulary drill that proves usefulness quickly.";
  }
  if (brief.content_type === "telegram_quiz_entry") {
    return "Turn the intent into a short Telegram quiz entry that moves the user into active practice.";
  }
  if (brief.content_type === "telegram_onboarding_angle") {
    return "Turn the intent into a Telegram onboarding angle that lowers friction for first-time users.";
  }
  if (brief.content_type === "telegram_conversion_offer") {
    return "Turn the intent into a Telegram conversion offer with one clear next step.";
  }
  return "Turn the intent into a concrete content decision without guessing manually.";
}

function buildHookOptions(brief) {
  const angle = humanizeAngle(brief.angle || brief.intent_key || brief.intent_label);
  if (brief.intent_kind === "vocabulary") {
    return [
      `Welche Begriffe aus ${angle} verwechseln viele Fahrer am Anfang?`,
      `3 ADR-Fachwoerter auf Deutsch, die du heute wirklich brauchst`,
      `Mini-Wortschatz fuer ADR auf Deutsch: schnell reinfinden statt ueberfordert sein`,
    ];
  }
  if (brief.intent_kind === "question") {
    return [
      `Eine typische ADR-Pruefungsfrage auf Deutsch, kurz erklaert`,
      `Woran scheitern viele bei ADR-Fragen auf Deutsch?`,
      `Mini-Quiz fuer ADR auf Deutsch: Einstieg ohne Ueberforderung`,
    ];
  }
  return [
    `ADR auf Deutsch starten, ohne von Fachsprache erschlagen zu werden`,
    `Wie du schneller in technisches Deutsch fuer ADR reinkommst`,
    `Ein einfacher Einstieg in ADR-Deutsch fuer den Alltag`,
  ];
}

function buildFormatNotes(brief) {
  if (brief.content_type === "telegram_vocab_drill") {
    return [
      "Use 3-5 terms only.",
      "Keep each explanation short and practical.",
      "End with one clear CTA to continue inside the bot.",
    ];
  }
  if (brief.content_type === "telegram_quiz_entry") {
    return [
      "Use one lead question plus 2-3 short follow-up prompts.",
      "Keep answers concise and confidence-building.",
      "Guide the user into the next quiz step inside Telegram.",
    ];
  }
  return [
    "Keep the piece short and friction-light.",
    "Focus on reassurance, clarity, and one next action.",
    "Avoid broad theory dumps.",
  ];
}

function buildMessageSkeleton(brief) {
  if (brief.content_type === "telegram_vocab_drill") {
    return [
      "Hook with one practical ADR vocabulary pain point.",
      "Show 3-5 terms with one-line explanations.",
      "Invite the user to continue the drill in Telegram.",
    ];
  }
  if (brief.content_type === "telegram_quiz_entry") {
    return [
      "Open with one realistic ADR-style question.",
      "Reveal a short explanation, not a long lecture.",
      "Move the user to the next quiz step in Telegram.",
    ];
  }
  return [
    "Start with the user problem in plain language.",
    "Offer one small trust-building example.",
    "Close with a direct Telegram next step.",
  ];
}

function buildCoordinationNotes(brief) {
  const notes = [
    "Do not route this task into YouTube Shorts or TikTok generation.",
    "Keep the output usable for Telegram and site-content planning first.",
  ];
  if (brief.intent_kind === "vocabulary") {
    notes.push("Vocabulary items should stay compact enough not to replace the bot.");
  }
  if (brief.intent_kind === "question") {
    notes.push("Question-led tasks should feel like a quiz entry, not a full lesson.");
  }
  return notes;
}

export function buildContentExecutionQueue(briefQueue, options = {}) {
  const briefs = Array.isArray(briefQueue) ? briefQueue : [];
  const createdAt = options.createdAt || new Date().toISOString();

  return briefs.map((brief) => {
    const normalizedSlug = normalizeSlug(brief.intent_label || brief.intent_key);
    const taskType = inferTaskType(brief);
    return {
      task_id: `content-worker-${taskType}-${slugify(brief.intent_key || brief.brief_id || normalizedSlug)}`,
      created_at: createdAt,
      worker: "content_decision_worker",
      status: "pending",
      source: "intent_to_content_machine",
      source_brief_id: brief.brief_id,
      priority_rank: brief.priority_rank,
      opportunity_score: brief.opportunity_score,
      task_type: taskType,
      primary_channel: buildPrimaryChannel(brief),
      intent_key: brief.intent_key,
      intent_label: brief.intent_label,
      intent_kind: brief.intent_kind,
      content_type: brief.content_type,
      angle: brief.angle,
      objective: brief.objective,
      content_goal: buildContentGoal(brief),
      rationale: brief.rationale,
      hook_options: buildHookOptions(brief),
      format_notes: buildFormatNotes(brief),
      message_skeleton: buildMessageSkeleton(brief),
      next_actions: Array.isArray(brief.next_actions) ? brief.next_actions : [],
      coordination_notes: buildCoordinationNotes(brief),
      evidence: brief.evidence || {},
      telegram_cta_source: `content_worker_${slugify(normalizedSlug || brief.intent_key)}`,
      requires_design_approval: false,
      requires_yura_review: true,
      release_checks_owner: "content_monitor",
    };
  });
}

export function buildContentMarkdownBrief(task) {
  const lines = [];
  lines.push(`# Content Worker Brief: ${task.angle || task.intent_key}`);
  lines.push("");
  lines.push(`- Task ID: ${task.task_id}`);
  lines.push(`- Task type: ${task.task_type}`);
  lines.push(`- Primary channel: ${task.primary_channel}`);
  lines.push(`- Content type: ${task.content_type}`);
  lines.push(`- Intent kind: ${task.intent_kind}`);
  lines.push(`- Priority rank: ${task.priority_rank}`);
  lines.push(`- Opportunity score: ${task.opportunity_score}`);
  lines.push("");
  lines.push("## Goal");
  lines.push("");
  lines.push(task.content_goal || task.objective || "");
  lines.push("");
  lines.push("## Rationale");
  lines.push("");
  lines.push(task.rationale || "No rationale captured.");
  lines.push("");
  lines.push("## Hook Options");
  lines.push("");
  for (const item of task.hook_options || []) {
    lines.push(`- ${item}`);
  }
  lines.push("");
  lines.push("## Format Notes");
  lines.push("");
  for (const item of task.format_notes || []) {
    lines.push(`- ${item}`);
  }
  lines.push("");
  lines.push("## Message Skeleton");
  lines.push("");
  for (const item of task.message_skeleton || []) {
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
  for (const item of task.coordination_notes || []) {
    lines.push(`- ${item}`);
  }
  lines.push("");
  lines.push("- Requires Yura review for public wording.");
  lines.push("- Requires Content Monitor check after release.");
  lines.push("");
  return `${lines.join("\n")}\n`;
}
