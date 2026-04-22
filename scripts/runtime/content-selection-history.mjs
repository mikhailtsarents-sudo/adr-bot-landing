function text(value) {
  return value == null ? "" : String(value).trim();
}

function num(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function getEntryTimestamp(entry) {
  const ts = Date.parse(text(entry?.published_at) || text(entry?.selected_at) || "");
  return Number.isFinite(ts) ? ts : 0;
}

export function buildSelectionHistoryIndex(entries, keyField = "source_id") {
  const index = new Map();
  for (const entry of entries) {
    const key = text(entry?.[keyField]);
    if (!key) continue;
    const previous = index.get(key);
    if (!previous || getEntryTimestamp(entry) >= getEntryTimestamp(previous)) {
      index.set(key, entry);
    }
  }
  return index;
}

export function buildRecentSelectionSet(entries, options = {}) {
  const recentLimit = Math.max(0, num(options.recentLimit, 3));
  const keyField = text(options.keyField || "source_id");
  const recent = [...entries]
    .sort((left, right) => getEntryTimestamp(right) - getEntryTimestamp(left))
    .slice(0, recentLimit)
    .map((entry) => text(entry?.[keyField]))
    .filter(Boolean);
  return new Set(recent);
}

export function selectWithAntiRepeat(items, historyEntries, options = {}) {
  const random = options.random || Math.random;
  const keyField = text(options.keyField || "source_id");
  const historyIndex = buildSelectionHistoryIndex(historyEntries, keyField);
  const recentSet = buildRecentSelectionSet(historyEntries, { recentLimit: options.recentLimit, keyField });
  const randomValues = new Map(items.map((item) => [text(item?.[keyField]), random()]));

  const unseen = items.filter((item) => !historyIndex.has(text(item?.[keyField])));
  const reusable = items.filter((item) => !recentSet.has(text(item?.[keyField])));
  const pool = unseen.length > 0
    ? unseen
    : reusable.length > 0
      ? reusable
      : items;

  const ranked = [...pool].sort((left, right) => {
    const leftKey = text(left?.[keyField]);
    const rightKey = text(right?.[keyField]);
    const leftHistory = historyIndex.get(leftKey);
    const rightHistory = historyIndex.get(rightKey);
    const leftTs = getEntryTimestamp(leftHistory);
    const rightTs = getEntryTimestamp(rightHistory);
    if (leftTs !== rightTs) return leftTs - rightTs;
    return (randomValues.get(leftKey) || 0) - (randomValues.get(rightKey) || 0);
  });

  return {
    selected: ranked[0] || null,
    candidate_pool_size: pool.length,
    unseen_count: unseen.length,
    reusable_count: reusable.length,
    recent_blocked_ids: [...recentSet],
    fallback_mode:
      unseen.length > 0
        ? "prefer_unseen"
        : reusable.length > 0
          ? "avoid_recent_repeats"
          : "catalog_exhausted_allow_repeat",
    ranked_ids: ranked.map((item) => text(item?.[keyField])).filter(Boolean),
  };
}
