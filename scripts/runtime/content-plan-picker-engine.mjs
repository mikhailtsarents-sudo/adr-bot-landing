function text(value) {
  return value == null ? "" : String(value).trim();
}

function toArray(value) {
  return Array.isArray(value) ? value : [];
}

function buildCandidateFromEntry(entry) {
  const payload = entry?.source_payload || {};
  const sourceType = text(entry?.source_type);
  if (sourceType === "QUESTION" || sourceType === "WORD" || sourceType === "NEWS") {
    return {
      ...payload,
      trace_id: text(payload.trace_id || entry.queue_entry_id),
      source_type: sourceType,
      source_id: text(payload.source_id || entry.source_id),
      source_version: text(payload.source_version || entry.source_version || ""),
      source_path: text(payload.source_path || entry.source_path || payload.execution?.approved_news_path || payload.execution?.news_package_path || ""),
      planning_queue_entry_id: entry.queue_entry_id,
      planning_slot_index: entry.slot_index,
      planning_selected_family: entry.selected_family,
      planning_mode: entry.planning_mode,
      planning_queue_score: entry.queue_score,
      planning_window: entry.recommended_window,
    };
  }
  return null;
}

function isProductionReady(entry) {
  return text(entry?.downstream_readiness) === "render_ready";
}

export function pickContentPlanEntries(planPayload) {
  const entries = toArray(planPayload?.entries);
  const planningEntry = entries[0] || null;
  const productionEntry = entries.find((entry) => isProductionReady(entry)) || null;
  const productionCandidates = entries
    .filter((entry) => isProductionReady(entry))
    .map((entry) => buildCandidateFromEntry(entry))
    .filter(Boolean);

  return {
    planning_entry: planningEntry,
    production_entry: productionEntry,
    production_candidates: productionCandidates,
  };
}
