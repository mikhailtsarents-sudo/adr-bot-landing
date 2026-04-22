import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { selectWithAntiRepeat } from "./content-selection-history.mjs";

function text(value) {
  return value == null ? "" : String(value).trim();
}

function num(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

async function loadJson(filePath, fallback = null) {
  try {
    return JSON.parse(await readFile(filePath, "utf8"));
  } catch {
    return fallback;
  }
}

async function writeJson(filePath, payload) {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}

function rowShowsUploadedState(row) {
  return text(row?.published_status) === "youtube_uploaded"
    || Boolean(text(row?.youtube_video_id))
    || Boolean(text(row?.youtube_url));
}

function looksLikeSmoke(row) {
  const haystack = [
    text(row?.draft_id),
    text(row?.headline),
    text(row?.source_title),
    text(row?.source_name),
  ]
    .join(" ")
    .toLowerCase();

  return haystack.includes("smoke");
}

function isValidApprovedNewsRow(row) {
  const topicType = text(row?.topic_type || row?.source_type).toLowerCase();
  const status = text(row?.published_status).toLowerCase();

  if (topicType !== "news") return false;
  if (!["approved_for_shortform_distribution", "youtube_upload_failed_retryable"].includes(status)) return false;
  if (rowShowsUploadedState(row)) return false;
  if (looksLikeSmoke(row)) return false;

  return Boolean(
    text(row?.draft_id)
    && text(row?.headline)
    && text(row?.source_title)
    && (text(row?.post_text) || text(row?.feedback) || text(row?.cta)),
  );
}

function normalizeNewsItem(row, sourcePath = "") {
  const sourceId = text(row?.story_id) || text(row?.draft_id) || `news-row-${text(row?.id)}`;
  return {
    source_type: "NEWS",
    source_id: sourceId,
    source_path: text(sourcePath),
    source_label: text(row?.headline).slice(0, 160),
    payload: row,
  };
}

export async function loadNewsCatalog(options = {}) {
  const items = [];
  const localDir = text(options.newsDir);
  if (localDir) {
    try {
      const entries = await readdir(localDir);
      const files = entries.filter((fileName) => fileName.endsWith(".json")).sort();
      for (const fileName of files) {
        const sourcePath = path.join(localDir, fileName);
        const payload = await loadJson(sourcePath);
        if (!isValidApprovedNewsRow(payload)) continue;
        items.push(normalizeNewsItem(payload, sourcePath));
      }
    } catch {
      // Ignore missing local dir and continue with remote source when configured.
    }
  }

  const tableUrl = text(options.tableUrl);
  const n8nApiKey = text(options.n8nApiKey);
  if (tableUrl && n8nApiKey) {
    const response = await fetch(`${tableUrl}${tableUrl.includes("?") ? "&" : "?"}limit=250`, {
      headers: { "X-N8N-API-KEY": n8nApiKey },
    });

    if (!response.ok) {
      throw new Error(`NEWS storage fetch failed: ${response.status} ${await response.text()}`);
    }

    const payload = await response.json();
    const rows = Array.isArray(payload?.data) ? payload.data : [];
    for (const row of rows) {
      if (!isValidApprovedNewsRow(row)) continue;
      items.push(normalizeNewsItem(row));
    }
  }

  const deduped = new Map();
  for (const item of items) {
    const key = text(item.source_id);
    if (!key) continue;
    const previous = deduped.get(key);
    const previousTs = Date.parse(text(previous?.payload?.created_at || previous?.payload?.createdAt) || 0) || 0;
    const currentTs = Date.parse(text(item?.payload?.created_at || item?.payload?.createdAt) || 0) || 0;
    if (!previous || currentTs >= previousTs) deduped.set(key, item);
  }

  return [...deduped.values()].sort((left, right) => {
    const leftTs = Date.parse(text(left?.payload?.created_at || left?.payload?.createdAt) || 0) || 0;
    const rightTs = Date.parse(text(right?.payload?.created_at || right?.payload?.createdAt) || 0) || 0;
    return leftTs - rightTs;
  });
}

export async function loadNewsAutopilotHistory(historyPath) {
  const payload = await loadJson(historyPath, { history: [] });
  return Array.isArray(payload?.history) ? payload.history : [];
}

export async function saveNewsAutopilotHistory(historyPath, historyEntries) {
  await writeJson(historyPath, { history: historyEntries });
}

export function selectNewsAutopilotCandidate(catalog, historyEntries, options = {}) {
  const selected = selectWithAntiRepeat(catalog, historyEntries, {
    recentLimit: Math.max(0, num(options.recentLimit, 3)),
    keyField: "source_id",
    random: options.random || Math.random,
  });
  return {
    ...selected,
    ranked_source_ids: selected.ranked_ids,
  };
}

export function buildNewsDecision(selected, selectionMeta, traceId) {
  if (!selected) {
    return {
      trace_id: traceId,
      decision_state: "blocked",
      selected_source_type: "BLOCKED",
      selected_source_id: "",
      selected_candidate: null,
      blocking_reason: "No valid approved news candidates available.",
    };
  }

  return {
    trace_id: traceId,
    decision_state: "pass",
    selected_source_type: "NEWS",
    selected_source_id: selected.source_id,
    selected_source_version: text(selected.payload?.version),
    selected_family: "NEWS",
    template_id: "T5",
    priority_reason: "News autopilot selected the least recently published approved news item.",
    next_step: "Run approved NEWS live branch and continue into YouTube publish handoff.",
    selection_meta: selectionMeta,
    selected_candidate: {
      source_type: "NEWS",
      source_id: selected.source_id,
      source_path: selected.source_path,
      source_version: text(selected.payload?.version),
      payload: selected.payload,
    },
  };
}

export function appendPublishedNewsHistory(historyEntries, selected, metadata = {}) {
  const next = [...historyEntries];
  next.push({
    source_id: text(selected?.source_id),
    draft_id: text(selected?.payload?.draft_id),
    row_id: text(selected?.payload?.id),
    selected_at: text(metadata.selected_at || new Date().toISOString()),
    published_at: text(metadata.published_at || new Date().toISOString()),
    trace_id: text(metadata.trace_id),
    youtube_url: text(metadata.youtube_url),
    package_dir: text(metadata.package_dir),
  });
  return next;
}
