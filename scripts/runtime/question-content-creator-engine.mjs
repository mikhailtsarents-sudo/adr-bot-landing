import { loadQuestionCatalog } from "./question-autopilot-engine.mjs";
import { selectWithAntiRepeat } from "./content-selection-history.mjs";

function text(value) {
  return value == null ? "" : String(value).trim();
}

function num(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export async function buildPreparedQuestionQueue(questionDir, options = {}) {
  const horizon = Math.max(1, num(options.horizon, 5));
  const recentLimit = Math.max(0, num(options.recentLimit, 3));
  const publishedHistory = Array.isArray(options.publishedHistory) ? options.publishedHistory : [];
  const issuedHistory = Array.isArray(options.issuedHistory) ? options.issuedHistory : [];
  const catalog = await loadQuestionCatalog(questionDir);

  const queue = [];
  let syntheticHistory = [
    ...publishedHistory.map((entry) => ({ ...entry })),
    ...issuedHistory.map((entry) => ({ ...entry })),
  ];

  for (let index = 0; index < horizon; index += 1) {
    const selection = selectWithAntiRepeat(catalog, syntheticHistory, {
      recentLimit,
      keyField: "source_id",
    });
    if (!selection.selected) break;

    const selected = selection.selected;
    const queueEntry = {
      queue_entry_id: `question-queue-${index + 1}-${selected.source_id}`,
      slot_index: index + 1,
      source_type: "QUESTION",
      source_id: selected.source_id,
      source_path: selected.source_path,
      source_label: selected.source_label,
      source_payload: selected.payload,
      selection_meta: {
        fallback_mode: selection.fallback_mode,
        candidate_pool_size: selection.candidate_pool_size,
        unseen_count: selection.unseen_count,
        reusable_count: selection.reusable_count,
        recent_blocked_ids: selection.recent_blocked_ids,
      },
    };
    queue.push(queueEntry);

    syntheticHistory = [
      ...syntheticHistory,
      {
        source_id: selected.source_id,
        selected_at: new Date().toISOString(),
      },
    ];
  }

  return {
    prepared_count: queue.length,
    queue,
    catalog_size: catalog.length,
    recent_limit: recentLimit,
    horizon,
    issued_count: issuedHistory.length,
    published_count: publishedHistory.length,
  };
}

export function consumePreparedQuestion(queuePayload) {
  const entries = Array.isArray(queuePayload?.entries) ? queuePayload.entries : [];
  const selected = entries[0] || null;
  return {
    selected,
    remaining_entries: selected ? entries.slice(1) : entries,
  };
}

export function appendIssuedQuestionHistory(issuedHistory, queueEntry, metadata = {}) {
  return [
    ...(Array.isArray(issuedHistory) ? issuedHistory : []),
    {
      source_id: text(queueEntry?.source_id),
      queue_entry_id: text(queueEntry?.queue_entry_id),
      issued_at: text(metadata.issued_at || new Date().toISOString()),
      trace_id: text(metadata.trace_id),
    },
  ];
}
