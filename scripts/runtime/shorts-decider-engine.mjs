import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { loadQuestionCatalog, loadQuestionAutopilotHistory, selectQuestionAutopilotCandidate } from "./question-autopilot-engine.mjs";
import { loadWordCatalog, loadWordAutopilotHistory, selectWordAutopilotCandidate } from "./word-autopilot-engine.mjs";
import { loadNewsCatalog, loadNewsAutopilotHistory, selectNewsAutopilotCandidate } from "./news-autopilot-engine.mjs";

function text(value) {
  return value == null ? "" : String(value).trim();
}

function num(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function clamp(value, min = -100, max = 250) {
  return Math.max(min, Math.min(max, Math.round(value)));
}

async function loadJson(filePath, fallback = null) {
  try {
    return JSON.parse(await readFile(filePath, "utf8"));
  } catch {
    return fallback;
  }
}

export async function writeJson(filePath, payload) {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}

function getEntryTimestamp(entry) {
  const value =
    text(entry?.published_at)
    || text(entry?.selected_at)
    || text(entry?.created_at)
    || text(entry?.issued_at);
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function buildRecentFamilyEntries(historyEntries, recentLimit = 6) {
  return [...historyEntries]
    .sort((left, right) => getEntryTimestamp(right) - getEntryTimestamp(left))
    .slice(0, Math.max(0, recentLimit));
}

function familyBaseScore(family) {
  if (family === "QUESTION") return 66;
  if (family === "WORD") return 58;
  if (family === "NEWS") return 60;
  return 50;
}

function mapRecommendedFormatsToFamily(formats = [], intentKind = "") {
  const normalized = Array.isArray(formats)
    ? formats.map((entry) => text(entry).toLowerCase()).filter(Boolean)
    : [];
  if (normalized.includes("term_short_video") || normalized.includes("telegram_vocab_drill")) return "WORD";
  if (normalized.includes("quiz_short_video") || normalized.includes("telegram_quiz_entry")) return "QUESTION";
  if (normalized.includes("trust_building_short_video")) return "QUESTION";
  return mapIntentKindToFamily(intentKind);
}

function mapIntentKindToFamily(intentKind) {
  const normalized = text(intentKind).toLowerCase();
  if (normalized === "vocabulary") return "WORD";
  if (normalized === "question") return "QUESTION";
  if (normalized === "learning") return "QUESTION";
  return "";
}

function resolvePlanEntryFamily(entry) {
  const selectedFamily = text(entry?.selected_family);
  if (["QUESTION", "WORD", "NEWS"].includes(selectedFamily)) return selectedFamily;

  const sourceType = text(entry?.source_type);
  if (["QUESTION", "WORD", "NEWS"].includes(sourceType)) return sourceType;

  return mapRecommendedFormatsToFamily(
    entry?.source_payload?.recommended_formats,
    entry?.source_payload?.intent_kind,
  );
}

function buildPlanHintEntry({ family, boost, label, note, slotIndex = 0, sourceId = "" }) {
  if (!["QUESTION", "WORD", "NEWS"].includes(text(family))) return null;
  return {
    family: text(family),
    boost: num(boost, 0),
    label: text(label),
    note: text(note),
    slot_index: num(slotIndex, 0),
    source_id: text(sourceId),
  };
}

function summarizeSeoHints(contentPlanQueue) {
  const entries = Array.isArray(contentPlanQueue?.entries) ? contentPlanQueue.entries : [];
  const hints = new Map();

  for (const entry of entries.slice(0, 7)) {
    const slotWeight = Math.max(2, 18 - ((num(entry.slot_index, 1) - 1) * 3));
    let family = text(entry.selected_family);

    if (family === "SEARCH_INTENT") {
      family = mapIntentKindToFamily(entry?.source_payload?.intent_kind);
    }

    if (!["QUESTION", "WORD", "NEWS"].includes(family)) continue;
    const current = hints.get(family) || { boost: 0, reasons: [] };
    const reasonLabel =
      text(entry.source_payload?.intent_key)
      || text(entry.source_label)
      || text(entry.source_id)
      || family;
    current.boost += slotWeight;
    current.reasons.push({
      family,
      slot_index: num(entry.slot_index, 0),
      boost: slotWeight,
      source_id: text(entry.source_id),
      reason: reasonLabel,
    });
    hints.set(family, current);
  }

  return hints;
}

function summarizePlanSelectionHints(contentPlanQueue, planSelection = {}) {
  const hints = new Map();
  const addHint = (hint) => {
    if (!hint) return;
    const current = hints.get(hint.family) || { boost: 0, reasons: [] };
    current.boost += hint.boost;
    current.reasons.push(hint);
    hints.set(hint.family, current);
  };

  const planningEntry = planSelection.planning_entry || null;
  const planningFamily = resolvePlanEntryFamily(planningEntry);
  addHint(buildPlanHintEntry({
    family: planningFamily,
    boost: 18,
    label: "planning_slot",
    note: text(planningEntry?.source_payload?.intent_key)
      || text(planningEntry?.source_label)
      || "Current planning slot from content plan queue.",
    slotIndex: planningEntry?.slot_index,
    sourceId: planningEntry?.source_id,
  }));

  const productionEntry = planSelection.production_entry || null;
  const productionFamily = resolvePlanEntryFamily(productionEntry);
  addHint(buildPlanHintEntry({
    family: productionFamily,
    boost: 30,
    label: "production_slot",
    note: text(productionEntry?.source_payload?.intent_key)
      || text(productionEntry?.source_label)
      || "Nearest render-ready production slot.",
    slotIndex: productionEntry?.slot_index,
    sourceId: productionEntry?.source_id,
  }));

  const productionCandidates = Array.isArray(planSelection.production_candidates)
    ? planSelection.production_candidates
    : [];
  productionCandidates.slice(0, 4).forEach((candidate, index) => {
    const boost = Math.max(6, 18 - (index * 4));
    addHint(buildPlanHintEntry({
      family: resolvePlanEntryFamily(candidate),
      boost,
      label: "production_candidate",
      note: text(candidate?.source_payload?.intent_key)
        || text(candidate?.source_label)
        || text(candidate?.source_id)
        || "Render-ready candidate from production batch.",
      slotIndex: candidate?.planning_slot_index || candidate?.slot_index,
      sourceId: candidate?.source_id,
    }));
  });

  const fallbackHints = summarizeSeoHints(contentPlanQueue);
  for (const [family, payload] of fallbackHints.entries()) {
    const current = hints.get(family) || { boost: 0, reasons: [] };
    current.boost += payload.boost;
    current.reasons.push(...payload.reasons.map((entry) => ({
      family,
      boost: entry.boost,
      label: "queue_hint",
      note: entry.reason,
      slot_index: entry.slot_index,
      source_id: entry.source_id,
    })));
    hints.set(family, current);
  }

  return hints;
}

function buildFamilyScore(family, availability, planHints, recentFamilyEntries) {
  if (!availability?.is_available) {
    return {
      family,
      is_available: false,
      score: -999,
      score_breakdown: [{ label: "availability", value: -999, note: "No valid candidates available." }],
    };
  }

  const breakdown = [];
  let score = familyBaseScore(family);
  breakdown.push({ label: "base", value: score, note: "Baseline reliability and production confidence." });

  const unseenBonus = Math.min(10, num(availability.unseen_count, 0) * 4);
  if (unseenBonus) {
    score += unseenBonus;
    breakdown.push({ label: "unseen_bonus", value: unseenBonus, note: "Unpublished candidates are available." });
  }

  const reusableBonus = Math.min(6, num(availability.reusable_count, 0) * 2);
  if (reusableBonus) {
    score += reusableBonus;
    breakdown.push({ label: "reusable_bonus", value: reusableBonus, note: "Non-recent fallback candidates are available." });
  }

  const familyHint = planHints.get(family);
  if (familyHint?.boost) {
    score += familyHint.boost;
    breakdown.push({
      label: "plan_hint",
      value: familyHint.boost,
      note: familyHint.reasons
        .map((entry) => `${entry.label || "hint"}: ${entry.note} (+${entry.boost})`)
        .join("; "),
    });
  }

  const mostRecentFamily = text(recentFamilyEntries[0]?.family);
  if (mostRecentFamily === family) {
    score -= 24;
    breakdown.push({ label: "repeat_penalty", value: -24, note: "This family was used in the most recent slot." });
  }

  const recentThree = recentFamilyEntries.slice(0, 3).filter((entry) => text(entry.family) === family).length;
  if (recentThree >= 2) {
    score -= 14;
    breakdown.push({ label: "streak_penalty", value: -14, note: "This family already appears too often in the last 3 slots." });
  }

  if (family === "NEWS" && !familyHint?.boost) {
    score -= 8;
    breakdown.push({ label: "news_guardrail", value: -8, note: "NEWS should win mainly when freshness or SEO hints support it." });
  }

  return {
    family,
    is_available: true,
    score: clamp(score),
    score_breakdown: breakdown,
    availability,
    seo_hint_reasons: familyHint?.reasons || [],
  };
}

async function evaluateQuestionFamily(options) {
  const catalog = await loadQuestionCatalog(options.questionDir);
  const history = await loadQuestionAutopilotHistory(options.questionHistoryPath);
  const selection = selectQuestionAutopilotCandidate(catalog, history, { recentLimit: options.recentLimit });
  return {
    family: "QUESTION",
    history_entries: history,
    catalog_size: catalog.length,
    is_available: Boolean(selection.selected),
    selected_source_id: text(selection.selected?.source_id),
    candidate_pool_size: num(selection.candidate_pool_size, 0),
    unseen_count: num(selection.unseen_count, 0),
    reusable_count: num(selection.reusable_count, 0),
    recent_blocked_ids: selection.recent_blocked_ids || [],
    ranked_source_ids: selection.ranked_source_ids || [],
    fallback_mode: text(selection.fallback_mode),
    selected_preview: selection.selected
      ? {
          source_id: text(selection.selected.source_id),
          source_label: text(selection.selected.source_label),
        }
      : null,
  };
}

async function evaluateWordFamily(options) {
  const catalog = await loadWordCatalog(options.wordDir);
  const history = await loadWordAutopilotHistory(options.wordHistoryPath);
  const selection = selectWordAutopilotCandidate(catalog, history, { recentLimit: options.recentLimit });
  return {
    family: "WORD",
    history_entries: history,
    catalog_size: catalog.length,
    is_available: Boolean(selection.selected),
    selected_source_id: text(selection.selected?.source_id),
    candidate_pool_size: num(selection.candidate_pool_size, 0),
    unseen_count: num(selection.unseen_count, 0),
    reusable_count: num(selection.reusable_count, 0),
    recent_blocked_ids: selection.recent_blocked_ids || [],
    ranked_source_ids: selection.ranked_source_ids || [],
    fallback_mode: text(selection.fallback_mode),
    selected_preview: selection.selected
      ? {
          source_id: text(selection.selected.source_id),
          source_label: text(selection.selected.source_label),
        }
      : null,
  };
}

async function evaluateNewsFamily(options) {
  const catalog = await loadNewsCatalog({
    newsDir: options.newsDir,
    tableUrl: options.newsTableUrl,
    n8nApiKey: options.n8nApiKey,
  });
  const history = await loadNewsAutopilotHistory(options.newsHistoryPath);
  const selection = selectNewsAutopilotCandidate(catalog, history, { recentLimit: options.recentLimit });
  return {
    family: "NEWS",
    history_entries: history,
    catalog_size: catalog.length,
    is_available: Boolean(selection.selected),
    selected_source_id: text(selection.selected?.source_id),
    candidate_pool_size: num(selection.candidate_pool_size, 0),
    unseen_count: num(selection.unseen_count, 0),
    reusable_count: num(selection.reusable_count, 0),
    recent_blocked_ids: selection.recent_blocked_ids || [],
    ranked_source_ids: selection.ranked_source_ids || [],
    fallback_mode: text(selection.fallback_mode),
    selected_preview: selection.selected
      ? {
          source_id: text(selection.selected.source_id),
          source_label: text(selection.selected.source_label),
          draft_id: text(selection.selected.payload?.draft_id),
        }
      : null,
  };
}

export async function loadShortsFamilyHistory(historyPath) {
  const payload = await loadJson(historyPath, { history: [] });
  return Array.isArray(payload?.history) ? payload.history : [];
}

export async function saveShortsFamilyHistory(historyPath, historyEntries) {
  await writeJson(historyPath, { history: historyEntries });
}

export function appendShortsFamilyHistory(historyEntries, entry) {
  return [
    ...historyEntries,
    {
      family: text(entry.family),
      selected_at: text(entry.selected_at || new Date().toISOString()),
      trace_id: text(entry.trace_id),
      selected_source_id: text(entry.selected_source_id),
      youtube_url: text(entry.youtube_url),
      downstream_report_path: text(entry.downstream_report_path),
    },
  ];
}

export async function evaluateShortsFamilies(options) {
  const settled = await Promise.allSettled([
    evaluateQuestionFamily(options),
    evaluateWordFamily(options),
    evaluateNewsFamily(options),
  ]);

  const families = ["QUESTION", "WORD", "NEWS"];
  const availability = [];
  for (let index = 0; index < settled.length; index += 1) {
    const result = settled[index];
    if (result.status === "fulfilled") {
      availability.push(result.value);
    } else {
      availability.push({
        family: families[index],
        history_entries: [],
        catalog_size: 0,
        is_available: false,
        candidate_pool_size: 0,
        unseen_count: 0,
        reusable_count: 0,
        recent_blocked_ids: [],
        ranked_source_ids: [],
        fallback_mode: "load_failed",
        error: text(result.reason?.message || result.reason),
      });
    }
  }
  return availability;
}

export function buildShortsDecision(availabilityEntries, contentPlanQueue, familyHistoryEntries, options = {}) {
  const planHints = summarizePlanSelectionHints(contentPlanQueue, options.planSelection);
  const recentFamilyEntries = buildRecentFamilyEntries(familyHistoryEntries, num(options.familyRecentLimit, 6));
  const scoredFamilies = availabilityEntries
    .map((entry) => buildFamilyScore(entry.family, entry, planHints, recentFamilyEntries))
    .sort((left, right) => right.score - left.score);

  const winner = scoredFamilies.find((entry) => entry.is_available);
  if (!winner) {
    return {
      decision_state: "blocked",
      selected_family: "",
      blocking_reason: "No available Shorts executor candidates are ready right now.",
      family_scores: scoredFamilies,
    };
  }

  const fallbackFamilies = scoredFamilies
    .filter((entry) => entry.is_available && entry.family !== winner.family)
    .map((entry) => entry.family);

  return {
    decision_state: "pass",
    selected_family: winner.family,
    selected_source_id: text(winner.availability?.selected_source_id),
    priority_reason: `Selected ${winner.family} based on executor availability, anti-repeat, and SEO/content-plan weighting.`,
    next_step: `Run ${winner.family} autopilot cycle for this slot.`,
    family_scores: scoredFamilies,
    planning_entry_id: text(options.planSelection?.planning_entry?.queue_entry_id),
    planning_target_family: resolvePlanEntryFamily(options.planSelection?.planning_entry),
    production_entry_id: text(options.planSelection?.production_entry?.queue_entry_id),
    production_target_family: resolvePlanEntryFamily(options.planSelection?.production_entry),
    selected_family_score: winner.score,
    selected_family_breakdown: winner.score_breakdown,
    fallback_families: fallbackFamilies,
    recent_family_history: recentFamilyEntries,
  };
}
