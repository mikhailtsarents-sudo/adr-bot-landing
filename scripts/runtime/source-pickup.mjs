import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

function text(value) {
  return value == null ? "" : String(value).trim();
}

async function loadJson(filePath) {
  return JSON.parse(await readFile(filePath, "utf8"));
}

function isValidQuestionSource(item) {
  return text(item?.source_type || "QUESTION") === "QUESTION"
    && text(item?.payload?.question_text)
    && text(item?.payload?.correct_answer);
}

function isValidWordSource(item) {
  return text(item?.source_type || "WORD") === "WORD"
    && text(item?.payload?.de_term)
    && text(item?.payload?.simple_explanation);
}

function isValidNewsSource(item) {
  return text(item?.source_type || "NEWS") === "NEWS"
    && (
      text(item?.source_path)
      || text(item?.execution?.approved_news_path)
      || text(item?.execution?.news_package_path)
    );
}

async function loadQuestionCatalog(questionDir) {
  const entries = await readdir(questionDir);
  const files = entries.filter((fileName) => fileName.endsWith(".json")).sort();
  const items = [];
  for (const fileName of files) {
    const sourcePath = path.join(questionDir, fileName);
    const payload = await loadJson(sourcePath);
    if (!isValidQuestionSource(payload)) {
      continue;
    }
    items.push({
      source_type: "QUESTION",
      source_id: text(payload.source_id) || path.basename(fileName, ".json"),
      source_path: sourcePath,
      source_label: text(payload?.payload?.question_text).slice(0, 120),
      payload,
    });
  }
  return items;
}

async function loadWordCatalog(examplesDir) {
  const entries = await readdir(examplesDir);
  const files = entries.filter((fileName) => /^word-.*-source\.json$/i.test(fileName)).sort();
  const items = [];
  for (const fileName of files) {
    const sourcePath = path.join(examplesDir, fileName);
    const payload = await loadJson(sourcePath);
    if (!isValidWordSource(payload)) {
      continue;
    }
    items.push({
      source_type: "WORD",
      source_id: text(payload.source_id) || path.basename(fileName, ".json"),
      source_path: sourcePath,
      source_label: text(payload?.payload?.de_term).slice(0, 120),
      payload,
    });
  }
  return items;
}

async function loadDailyCandidates(candidateBatchPath) {
  try {
    const batch = await loadJson(candidateBatchPath);
    const candidates = Array.isArray(batch?.candidates) ? batch.candidates : [];
    return candidates
      .filter((item) => isValidQuestionSource(item) || isValidWordSource(item) || isValidNewsSource(item))
      .map((item) => ({
        source_type: text(item.source_type),
        source_id: text(item.source_id),
        source_path: text(item.source_path || item.execution?.approved_news_path || item.execution?.news_package_path),
        source_label: text(
          item?.payload?.question_text
          || item?.payload?.de_term
          || item?.payload?.title_de
          || item?.payload?.headline
          || item?.source_id,
        ).slice(0, 120),
        payload: item,
      }));
  } catch {
    return [];
  }
}

export async function listValidProductionSourceItems(repoRoot) {
  const examplesDir = path.join(repoRoot, "examples");
  const questionDir = path.join(examplesDir, "question-batch-wave-1");
  const candidateBatchPath = path.join(examplesDir, "daily-content-candidates.json");

  const [questions, words, batchCandidates] = await Promise.all([
    loadQuestionCatalog(questionDir),
    loadWordCatalog(examplesDir),
    loadDailyCandidates(candidateBatchPath),
  ]);

  const byKey = new Map();
  for (const item of [...questions, ...words, ...batchCandidates]) {
    const key = `${item.source_type}:${item.source_id}:${item.source_path}`;
    if (!byKey.has(key)) {
      byKey.set(key, item);
    }
  }

  return [...byKey.values()].sort((left, right) => {
    const sourceOrder = { QUESTION: 0, WORD: 1, NEWS: 2 };
    if (sourceOrder[left.source_type] !== sourceOrder[right.source_type]) {
      return sourceOrder[left.source_type] - sourceOrder[right.source_type];
    }
    return left.source_id.localeCompare(right.source_id);
  });
}

export async function selectAutomaticSourceItem(repoRoot) {
  const items = await listValidProductionSourceItems(repoRoot);
  if (items.length === 0) {
    throw new Error("No valid production source items found.");
  }
  return items[0];
}
