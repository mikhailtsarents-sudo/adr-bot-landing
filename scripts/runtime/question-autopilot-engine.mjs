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

function isValidQuestionPayload(payload) {
  return text(payload?.source_type || "QUESTION") === "QUESTION"
    && text(payload?.payload?.question_text)
    && text(payload?.payload?.correct_answer)
    && Array.isArray(payload?.payload?.answer_options)
    && payload.payload.answer_options.length >= 3
    && text(payload?.payload?.simple_explanation);
}

export async function loadQuestionCatalog(questionDir) {
  const entries = await readdir(questionDir);
  const files = entries.filter((fileName) => fileName.endsWith(".json")).sort();
  const items = [];

  for (const fileName of files) {
    const sourcePath = path.join(questionDir, fileName);
    const payload = await loadJson(sourcePath);
    if (!isValidQuestionPayload(payload)) continue;
    items.push({
      source_type: "QUESTION",
      source_id: text(payload.source_id) || path.basename(fileName, ".json"),
      source_path: sourcePath,
      source_label: text(payload?.payload?.question_text).slice(0, 160),
      payload,
    });
  }

  return items;
}

export async function loadQuestionAutopilotHistory(historyPath) {
  const payload = await loadJson(historyPath, { history: [] });
  return Array.isArray(payload?.history) ? payload.history : [];
}

export async function saveQuestionAutopilotHistory(historyPath, historyEntries) {
  await writeJson(historyPath, { history: historyEntries });
}

export function selectQuestionAutopilotCandidate(catalog, historyEntries, options = {}) {
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

export function buildQuestionDecision(selected, selectionMeta, traceId) {
  if (!selected) {
    return {
      trace_id: traceId,
      decision_state: "blocked",
      selected_source_type: "BLOCKED",
      selected_source_id: "",
      selected_candidate: null,
      blocking_reason: "No valid question candidates available.",
    };
  }

  return {
    trace_id: traceId,
    decision_state: "pass",
    selected_source_type: "QUESTION",
    selected_source_id: selected.source_id,
    selected_source_version: text(selected.payload?.source_version),
    selected_family: "QUESTION",
    template_id: "T1",
    priority_reason: "Question autopilot selected the least recently published valid question.",
    next_step: "Run QUESTION render package runner and continue into publish handoff.",
    selection_meta: selectionMeta,
    selected_candidate: {
      source_type: "QUESTION",
      source_id: selected.source_id,
      source_path: selected.source_path,
      source_version: text(selected.payload?.source_version),
      payload: selected.payload?.payload || {},
    },
  };
}

export function appendPublishedQuestionHistory(historyEntries, selected, metadata = {}) {
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
