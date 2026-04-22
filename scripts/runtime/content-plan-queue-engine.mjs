import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

function text(value) {
  return value == null ? "" : String(value).trim();
}

function num(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
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

function clamp(value) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

async function loadJson(filePath) {
  return JSON.parse(await readFile(filePath, "utf8"));
}

function summarizeSearchIntent(task) {
  return text(task.content_goal || task.objective || task.angle || task.intent_key);
}

function buildSearchIntentScore(task) {
  const score =
    num(task.opportunity_score, 0) * 0.55 +
    Math.min(num(task.priority_rank, 10), 10) * -2 +
    num(task.evidence?.telegram_redirects, 0) * 8 +
    (task.primary_channel === "telegram" ? 12 : 0);
  return clamp(score);
}

function buildQuestionScore(item) {
  const payload = item.payload || {};
  const score =
    52 +
    (text(payload.question_text) ? 14 : 0) +
    (text(payload.simple_explanation) ? 12 : 0) +
    (Array.isArray(payload.answer_options) && payload.answer_options.length >= 3 ? 8 : 0) +
    (text(item.priority_hint).toLowerCase().includes("high") ? 8 : 0);
  return clamp(score);
}

function buildWordScore(item) {
  const payload = item.payload || {};
  const score =
    48 +
    (text(payload.de_term) ? 14 : 0) +
    (text(payload.simple_explanation) ? 14 : 0) +
    (payload.translations ? 8 : 0);
  return clamp(score);
}

function buildNewsScore(item) {
  const payload = item.payload || {};
  const score =
    58 +
    (text(item.approval_state || payload.approval_state) === "approved" ? 18 : 0) +
    (text(payload.title_de || payload.headline) ? 10 : 0) +
    (text(payload.summary_de || payload.post_text) ? 8 : 0) +
    (text(item.execution?.news_package_path) ? 8 : 0);
  return clamp(score);
}

function buildQuestionLabel(item) {
  return text(item.payload?.question_text || item.source_id).slice(0, 140);
}

function buildWordLabel(item) {
  return text(item.payload?.de_term || item.source_id).slice(0, 140);
}

function buildNewsLabel(item) {
  return text(item.payload?.title_de || item.payload?.headline || item.source_id).slice(0, 140);
}

function buildRotationTemplates() {
  return {
    balanced: ["SEARCH_INTENT", "QUESTION", "WORD", "SEARCH_INTENT", "NEWS", "QUESTION", "WORD"],
    search_heavy: ["SEARCH_INTENT", "QUESTION", "SEARCH_INTENT", "WORD", "SEARCH_INTENT", "NEWS", "QUESTION"],
    evergreen_heavy: ["QUESTION", "WORD", "SEARCH_INTENT", "QUESTION", "WORD", "NEWS", "SEARCH_INTENT"],
  };
}

async function loadQuestionSources(questionDir) {
  const entries = await readdir(questionDir);
  const files = entries.filter((fileName) => fileName.endsWith(".json")).sort();
  const items = [];
  for (const fileName of files) {
    const sourcePath = path.join(questionDir, fileName);
    const payload = await loadJson(sourcePath);
    if (text(payload?.source_type || "QUESTION") !== "QUESTION") continue;
    if (!text(payload?.payload?.question_text) || !text(payload?.payload?.correct_answer)) continue;
    items.push({
      queue_source_family: "QUESTION",
      queue_source_type: "QUESTION",
      source_id: text(payload.source_id) || path.basename(fileName, ".json"),
      source_path: sourcePath,
      source_version: text(payload.source_version),
      source_label: buildQuestionLabel(payload),
      queue_score: buildQuestionScore(payload),
      downstream_readiness: "render_ready",
      planning_mode: "evergreen_question",
      rationale: "Question source is already structured and usable for content generation.",
      payload,
    });
  }
  return items;
}

async function loadWordSources(examplesDir) {
  const entries = await readdir(examplesDir);
  const files = entries.filter((fileName) => /^word-.*-source\.json$/i.test(fileName)).sort();
  const items = [];
  for (const fileName of files) {
    const sourcePath = path.join(examplesDir, fileName);
    const payload = await loadJson(sourcePath);
    if (text(payload?.source_type || "WORD") !== "WORD") continue;
    if (!text(payload?.payload?.de_term) || !text(payload?.payload?.simple_explanation)) continue;
    items.push({
      queue_source_family: "WORD",
      queue_source_type: "WORD",
      source_id: text(payload.source_id) || path.basename(fileName, ".json"),
      source_path: sourcePath,
      source_version: text(payload.source_version),
      source_label: buildWordLabel(payload),
      queue_score: buildWordScore(payload),
      downstream_readiness: "render_ready",
      planning_mode: "evergreen_vocabulary",
      rationale: "Word source is already structured and reusable as evergreen learning content.",
      payload,
    });
  }
  return items;
}

async function loadNewsCandidates(candidateBatchPath) {
  try {
    const batch = await loadJson(candidateBatchPath);
    const candidates = Array.isArray(batch?.candidates) ? batch.candidates : Array.isArray(batch) ? batch : [];
    return candidates
      .filter((item) => text(item.source_type) === "NEWS")
      .map((item) => ({
        queue_source_family: "NEWS",
        queue_source_type: "NEWS",
        source_id: text(item.source_id || item.news_id || item.trace_id),
        source_path: text(item.source_path || item.execution?.approved_news_path || item.execution?.news_package_path),
        source_version: text(item.source_version),
        source_label: buildNewsLabel(item),
        queue_score: buildNewsScore(item),
        downstream_readiness: text(item.execution?.news_package_path) ? "render_ready" : "planning_ready",
        planning_mode: "fresh_news",
        rationale: "Approved or packaged news should be surfaced early while still fresh.",
        payload: item,
      }));
  } catch {
    return [];
  }
}

async function loadSearchIntentTasks(contentExecutionPath) {
  try {
    const items = await loadJson(contentExecutionPath);
    const list = Array.isArray(items) ? items : [];
    return list.map((task) => ({
      queue_source_family: "SEARCH_INTENT",
      queue_source_type: "SEARCH_INTENT",
      source_id: text(task.intent_key || task.task_id),
      source_path: "",
      source_version: text(task.created_at),
      source_label: text(task.angle || task.intent_label || task.intent_key),
      queue_score: buildSearchIntentScore(task),
      downstream_readiness: "planning_ready",
      planning_mode: "search_demand",
      rationale: "This topic is backed by real search and on-site demand signals.",
      payload: task,
    }));
  } catch {
    return [];
  }
}

function sortItems(items) {
  return [...items].sort((left, right) => {
    if (right.queue_score !== left.queue_score) {
      return right.queue_score - left.queue_score;
    }
    return text(left.source_id).localeCompare(text(right.source_id));
  });
}

function familyHeadline(family) {
  if (family === "SEARCH_INTENT") return "Search-intent slot";
  if (family === "QUESTION") return "Question slot";
  if (family === "WORD") return "Vocabulary slot";
  if (family === "NEWS") return "News slot";
  return "Content slot";
}

function explainFamilyUse(family) {
  if (family === "SEARCH_INTENT") return "Use current demand to keep the plan tied to real user interest.";
  if (family === "QUESTION") return "Use evergreen practice content to keep the queue educational and stable.";
  if (family === "WORD") return "Use vocabulary slots to make the feed lighter and easier to consume.";
  if (family === "NEWS") return "Use news sparingly so freshness helps without overwhelming evergreen learning.";
  return "";
}

function pickFallbackFamily(remainingByFamily, previousFamily) {
  const families = [...remainingByFamily.entries()]
    .filter(([, items]) => items.length > 0)
    .sort((left, right) => right[1][0].queue_score - left[1][0].queue_score)
    .map(([family]) => family);
  return families.find((family) => family !== previousFamily) || families[0] || "";
}

export function buildContentPlanQueue(sourcePool, options = {}) {
  const rotationMode = text(options.rotationMode || "balanced");
  const horizon = Math.max(1, num(options.horizon, 7));
  const templates = buildRotationTemplates();
  const pattern = templates[rotationMode] || templates.balanced;
  const poolByFamily = new Map();
  for (const item of sourcePool) {
    const family = text(item.queue_source_family);
    const list = poolByFamily.get(family) || [];
    list.push(item);
    poolByFamily.set(family, list);
  }
  for (const [family, list] of poolByFamily.entries()) {
    poolByFamily.set(family, sortItems(list));
  }

  const plan = [];
  let previousFamily = "";
  for (let index = 0; index < horizon; index += 1) {
    const desiredFamily = pattern[index % pattern.length];
    const selectedFamily = (poolByFamily.get(desiredFamily) || []).length > 0
      ? desiredFamily
      : pickFallbackFamily(poolByFamily, previousFamily);
    if (!selectedFamily) break;
    const selected = poolByFamily.get(selectedFamily).shift();
    if (!selected) break;
    const dayOffset = index;
    plan.push({
      queue_entry_id: `content-plan-${index + 1}-${slugify(selected.source_id || selected.source_label)}`,
      slot_index: index + 1,
      day_offset: dayOffset,
      recommended_window: dayOffset === 0 ? "today" : `day+${dayOffset}`,
      desired_family: desiredFamily,
      selected_family: selectedFamily,
      cadence_explanation: explainFamilyUse(selectedFamily),
      slot_label: familyHeadline(selectedFamily),
      source_id: selected.source_id,
      source_type: selected.queue_source_type,
      source_label: selected.source_label,
      source_path: selected.source_path,
      queue_score: selected.queue_score,
      planning_mode: selected.planning_mode,
      downstream_readiness: selected.downstream_readiness,
      rationale: selected.rationale,
      consumer_summary: selectedFamily === "SEARCH_INTENT"
        ? summarizeSearchIntent(selected.payload)
        : selected.source_label,
      source_payload: selected.payload,
    });
    previousFamily = selectedFamily;
  }

  return {
    rotation_mode: rotationMode,
    horizon,
    cadence_pattern: pattern,
    entries: plan,
  };
}

export async function buildUnifiedSourcePool(options) {
  const [
    searchIntentItems,
    questionItems,
    wordItems,
    newsItems,
  ] = await Promise.all([
    loadSearchIntentTasks(options.contentExecutionPath),
    loadQuestionSources(options.questionDir),
    loadWordSources(options.examplesDir),
    loadNewsCandidates(options.newsCandidateBatchPath),
  ]);

  const all = sortItems([
    ...searchIntentItems,
    ...questionItems,
    ...wordItems,
    ...newsItems,
  ]);

  const counts = {
    SEARCH_INTENT: searchIntentItems.length,
    QUESTION: questionItems.length,
    WORD: wordItems.length,
    NEWS: newsItems.length,
  };

  return {
    items: all,
    counts,
  };
}

export function buildContentPlanMarkdown(queuePayload) {
  const lines = [];
  lines.push("# Content Plan Queue");
  lines.push("");
  lines.push(`- Rotation mode: ${queuePayload.rotation_mode}`);
  lines.push(`- Horizon: ${queuePayload.horizon} slots`);
  lines.push(`- Pattern: ${(queuePayload.cadence_pattern || []).join(" -> ")}`);
  lines.push("");
  lines.push("## Slots");
  lines.push("");
  for (const entry of queuePayload.entries || []) {
    lines.push(`### Slot ${entry.slot_index}: ${entry.selected_family}`);
    lines.push("");
    lines.push(`- Window: ${entry.recommended_window}`);
    lines.push(`- Source: ${entry.source_type} / ${entry.source_id}`);
    lines.push(`- Label: ${entry.source_label}`);
    lines.push(`- Planning mode: ${entry.planning_mode}`);
    lines.push(`- Downstream readiness: ${entry.downstream_readiness}`);
    lines.push(`- Queue score: ${entry.queue_score}`);
    lines.push(`- Why this family here: ${entry.cadence_explanation}`);
    lines.push(`- Why this item: ${entry.rationale}`);
    lines.push(`- Consumer summary: ${entry.consumer_summary}`);
    lines.push("");
  }
  return `${lines.join("\n")}\n`;
}
