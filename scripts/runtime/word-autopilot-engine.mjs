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

function isValidWordPayload(payload) {
  return text(payload?.source_type || "WORD") === "WORD"
    && text(payload?.payload?.de_term)
    && text(payload?.payload?.simple_explanation)
    && payload?.payload?.translations
    && typeof payload.payload.translations === "object";
}

export async function loadWordCatalog(wordDir) {
  const entries = await readdir(wordDir);
  const files = entries.filter((fileName) => fileName.endsWith(".json")).sort();
  const items = [];

  for (const fileName of files) {
    const sourcePath = path.join(wordDir, fileName);
    const payload = await loadJson(sourcePath);
    if (!isValidWordPayload(payload)) continue;
    items.push({
      source_type: "WORD",
      source_id: text(payload.source_id) || path.basename(fileName, ".json"),
      source_path: sourcePath,
      source_label: text(payload?.payload?.de_term).slice(0, 160),
      payload,
    });
  }

  return items;
}

export async function loadWordAutopilotHistory(historyPath) {
  const payload = await loadJson(historyPath, { history: [] });
  return Array.isArray(payload?.history) ? payload.history : [];
}

export async function saveWordAutopilotHistory(historyPath, historyEntries) {
  await writeJson(historyPath, { history: historyEntries });
}

export function selectWordAutopilotCandidate(catalog, historyEntries, options = {}) {
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

export function buildWordDecision(selected, selectionMeta, traceId) {
  if (!selected) {
    return {
      trace_id: traceId,
      decision_state: "blocked",
      selected_source_type: "BLOCKED",
      selected_source_id: "",
      selected_candidate: null,
      blocking_reason: "No valid word candidates available.",
    };
  }

  return {
    trace_id: traceId,
    decision_state: "pass",
    selected_source_type: "WORD",
    selected_source_id: selected.source_id,
    selected_source_version: text(selected.payload?.source_version),
    selected_family: "WORD",
    template_id: "T2",
    priority_reason: "Word autopilot selected the least recently published valid word item.",
    next_step: "Run WORD render package runner and continue into publish handoff.",
    selection_meta: selectionMeta,
    selected_candidate: {
      source_type: "WORD",
      source_id: selected.source_id,
      source_path: selected.source_path,
      source_version: text(selected.payload?.source_version),
      payload: selected.payload?.payload || {},
    },
  };
}

export function appendPublishedWordHistory(historyEntries, selected, metadata = {}) {
  const next = [...historyEntries];
  next.push({
    source_id: text(selected?.source_id),
    source_path: text(selected?.source_path),
    selected_at: text(metadata.selected_at || new Date().toISOString()),
    published_at: text(metadata.published_at || new Date().toISOString()),
    trace_id: text(metadata.trace_id),
    youtube_url: text(metadata.youtube_url),
    package_dir: text(metadata.package_dir),
  });
  return next;
}
