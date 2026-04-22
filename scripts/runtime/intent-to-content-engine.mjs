import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

function text(value) {
  return value == null ? "" : String(value).trim();
}

function slugify(value) {
  return text(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function toArray(value) {
  if (Array.isArray(value)) {
    return value.filter((item) => item != null);
  }
  return value == null ? [] : [value];
}

function uniqueList(values) {
  return [...new Set(values.map((item) => text(item)).filter(Boolean))];
}

function clampScore(value, fallback) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }
  return Math.max(0, Math.min(100, Math.round(parsed)));
}

export async function loadJson(filePath) {
  return JSON.parse(await readFile(filePath, "utf8"));
}

export async function writeJson(filePath, value) {
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function normalizeSourceType(rawIntent) {
  const raw = text(
    rawIntent.source_type
    || rawIntent.type
    || rawIntent.intent_type
    || rawIntent.kind
    || rawIntent.source?.type,
  ).toUpperCase();

  if (["QUESTION", "QUESTIONS", "Q"].includes(raw)) return "QUESTION";
  if (["WORD", "WORDS", "TERM", "VOCAB"].includes(raw)) return "WORD";
  if (["NEWS", "ARTICLE", "UPDATE"].includes(raw)) return "NEWS";
  throw new Error(`Unsupported source type: ${raw || "[missing]"}`);
}

function normalizeDifficulty(rawIntent, sourceType) {
  const raw = text(rawIntent.difficulty || rawIntent.level).toLowerCase();
  if (["easy", "medium", "hard"].includes(raw)) {
    return raw;
  }
  if (sourceType === "WORD") return "easy";
  if (sourceType === "NEWS") return "medium";
  return "easy";
}

function normalizeAudience(rawIntent) {
  return text(rawIntent.audience || rawIntent.target_audience || "ADR");
}

function collectTopicTags(rawIntent) {
  return uniqueList([
    ...toArray(rawIntent.topic_tags),
    ...toArray(rawIntent.tags),
    ...toArray(rawIntent.keywords),
    ...toArray(rawIntent.payload?.keywords),
    text(rawIntent.payload?.category),
  ]);
}

function classifyQuestionFamily(normalizedPayload, rawIntent) {
  const trapLevel = text(
    normalizedPayload.trap_level
    || rawIntent.trap_level
    || rawIntent.payload?.trap_level,
  ).toLowerCase();
  const category = text(normalizedPayload.category).toLowerCase();
  const questionText = text(normalizedPayload.question_text).toLowerCase();
  const hint = text(rawIntent.classification_hint || rawIntent.priority_hint).toLowerCase();

  if (
    ["medium", "high", "trap", "tricky"].includes(trapLevel)
    || hint.includes("trap")
    || hint.includes("mistake")
    || questionText.includes("fehler")
  ) {
    return "ERROR";
  }

  if (
    category.includes("scenario")
    || category.includes("situation")
    || questionText.includes("was machen sie")
    || questionText.includes("wie verhalten")
    || questionText.includes("in dieser situation")
  ) {
    return "SITUATION";
  }

  return "QUESTION";
}

function normalizeQuestionPayload(rawIntent) {
  const payload = rawIntent.payload || rawIntent.source || {};
  const questionText = text(payload.question_text || rawIntent.question_text || rawIntent.prompt);
  const answerOptions = toArray(payload.answer_options || rawIntent.answer_options).map((item) => text(item)).filter(Boolean);
  const correctAnswer = text(payload.correct_answer || rawIntent.correct_answer || rawIntent.answer);
  const simpleExplanation = text(payload.simple_explanation || rawIntent.simple_explanation || rawIntent.explanation);

  if (!questionText) {
    throw new Error("QUESTION item is missing question_text.");
  }
  if (!correctAnswer) {
    throw new Error("QUESTION item is missing correct_answer.");
  }

  return {
    question_text: questionText,
    answer_options: answerOptions,
    correct_answer: correctAnswer,
    simple_explanation: simpleExplanation,
    category: text(payload.category || rawIntent.category),
    keywords: uniqueList([
      ...toArray(payload.keywords),
      ...toArray(rawIntent.keywords),
    ]),
    trap_level: text(payload.trap_level || rawIntent.trap_level || "low").toLowerCase() || "low",
  };
}

function normalizeWordPayload(rawIntent) {
  const payload = rawIntent.payload || rawIntent.source || {};
  const deTerm = text(payload.de_term || rawIntent.de_term || rawIntent.term);
  const simpleExplanation = text(payload.simple_explanation || rawIntent.simple_explanation || rawIntent.explanation);
  const translations = payload.translations && typeof payload.translations === "object"
    ? payload.translations
    : {};

  if (!deTerm) {
    throw new Error("WORD item is missing de_term.");
  }
  if (!simpleExplanation) {
    throw new Error("WORD item is missing simple_explanation.");
  }

  return {
    de_term: deTerm,
    simple_explanation: simpleExplanation,
    translations,
    category: text(payload.category || rawIntent.category),
    keywords: uniqueList([
      ...toArray(payload.keywords),
      ...toArray(rawIntent.keywords),
    ]),
  };
}

function normalizeNewsPayload(rawIntent) {
  const payload = rawIntent.payload || rawIntent.source || {};
  const title = text(payload.title_de || rawIntent.title_de || rawIntent.title || rawIntent.headline);
  const summary = text(payload.summary_de || rawIntent.summary_de || rawIntent.summary);
  const source = text(payload.source || rawIntent.source_name || rawIntent.publisher);
  const topic = text(payload.topic || rawIntent.topic || rawIntent.category);
  const approvalState = text(payload.approval_state || rawIntent.approval_state || "approved");

  if (!title) {
    throw new Error("NEWS item is missing title_de.");
  }

  return {
    title_de: title,
    summary_de: summary,
    source,
    topic,
    topic_tags: uniqueList([
      ...toArray(payload.topic_tags),
      ...toArray(rawIntent.topic_tags),
      ...toArray(rawIntent.tags),
    ]),
    approval_state: approvalState || "approved",
    gpt_scenario_ready: payload.gpt_scenario_ready === true || rawIntent.gpt_scenario_ready === true,
    asset_policy: text(payload.asset_policy || rawIntent.asset_policy),
    approved_at: text(payload.approved_at || rawIntent.approved_at || rawIntent.created_at),
  };
}

function buildNormalizedPayload(rawIntent, sourceType) {
  if (sourceType === "QUESTION") return normalizeQuestionPayload(rawIntent);
  if (sourceType === "WORD") return normalizeWordPayload(rawIntent);
  return normalizeNewsPayload(rawIntent);
}

function buildSourceId(rawIntent, sourceType, index, normalizedPayload) {
  const explicit = text(rawIntent.source_id || rawIntent.id);
  if (explicit) return explicit;
  if (sourceType === "WORD") return slugify(`word-${normalizedPayload.de_term}`) || `word-${index + 1}`;
  if (sourceType === "NEWS") return slugify(`news-${normalizedPayload.title_de}`) || `news-${index + 1}`;
  return slugify(`question-${normalizedPayload.question_text}`) || `question-${index + 1}`;
}

function buildSourceVersion(rawIntent) {
  return text(rawIntent.source_version || rawIntent.version || "intent-intake-v1");
}

function buildPriorityHint(rawIntent, sourceType) {
  const explicit = text(rawIntent.priority_hint).toLowerCase();
  if (explicit) return explicit;
  return sourceType === "NEWS" ? "high" : "normal";
}

function buildScores(rawIntent, sourceType, contentFamily) {
  return {
    source_quality_score: clampScore(rawIntent.source_quality_score, sourceType === "NEWS" ? 80 : 75),
    story_relevance_score: clampScore(rawIntent.story_relevance_score, sourceType === "NEWS" ? 82 : 68),
    publishability_score: clampScore(rawIntent.publishability_score, sourceType === "NEWS" ? 78 : 72),
    teaching_value_score: clampScore(
      rawIntent.teaching_value_score,
      contentFamily === "WORD" ? 70 : 76,
    ),
    freshness_score: clampScore(rawIntent.freshness_score, sourceType === "NEWS" ? 85 : 60),
    risk_score: clampScore(rawIntent.risk_score, sourceType === "NEWS" ? 15 : 12),
  };
}

function buildChooserPayload(sourceType, normalizedPayload) {
  if (sourceType === "QUESTION") {
    return {
      question_text: normalizedPayload.question_text,
      answer_options: normalizedPayload.answer_options,
      correct_answer: normalizedPayload.correct_answer,
      simple_explanation: normalizedPayload.simple_explanation,
      category: normalizedPayload.category,
      keywords: normalizedPayload.keywords,
      trap_level: normalizedPayload.trap_level,
    };
  }

  if (sourceType === "WORD") {
    return {
      de_term: normalizedPayload.de_term,
      simple_explanation: normalizedPayload.simple_explanation,
      translations: normalizedPayload.translations,
      category: normalizedPayload.category,
      keywords: normalizedPayload.keywords,
    };
  }

  return {
    title_de: normalizedPayload.title_de,
    summary_de: normalizedPayload.summary_de,
    source: normalizedPayload.source,
    topic: normalizedPayload.topic,
    approval_state: normalizedPayload.approval_state,
    gpt_scenario_ready: normalizedPayload.gpt_scenario_ready,
    asset_policy: normalizedPayload.asset_policy,
    approved_at: normalizedPayload.approved_at,
  };
}

function buildSourceRecord({
  rawIntent,
  sourceType,
  sourceId,
  sourceVersion,
  contentFamily,
  difficulty,
  audience,
  topicTags,
  normalizedPayload,
}) {
  return {
    source_type: sourceType,
    source_id: sourceId,
    source_version: sourceVersion,
    content_family: contentFamily,
    base_lang: text(rawIntent.base_lang || "de"),
    target_lang: text(rawIntent.target_lang || ""),
    audience,
    topic_tags: topicTags,
    difficulty,
    payload: normalizedPayload,
    trace: {
      intake_label: text(rawIntent.label || rawIntent.intent_label),
      intake_id: text(rawIntent.intent_id || rawIntent.id),
      source_origin: text(rawIntent.source_origin || rawIntent.origin || "intent-intake"),
    },
  };
}

function buildCandidateRecord({
  rawIntent,
  sourceType,
  sourceId,
  sourceVersion,
  contentFamily,
  difficulty,
  audience,
  topicTags,
  chooserPayload,
  sourcePath,
  scores,
}) {
  const traceId = text(rawIntent.trace_id) || `${sourceId}-intent-trace`;
  return {
    trace_id: traceId,
    source_type: sourceType,
    source_id: sourceId,
    source_version: sourceVersion,
    content_family: contentFamily,
    audience,
    difficulty,
    topic_tags: topicTags,
    priority_hint: buildPriorityHint(rawIntent, sourceType),
    source_path: sourcePath,
    payload: chooserPayload,
    classification: {
      content_family: contentFamily,
      classified_at: new Date().toISOString(),
    },
    trace: {
      source_path: sourcePath,
      source_origin: text(rawIntent.source_origin || rawIntent.origin || "intent-intake"),
      intent_id: text(rawIntent.intent_id || rawIntent.id),
    },
    ...scores,
  };
}

export async function buildIntentToContentBatch({
  input,
  outputRoot,
  now = new Date(),
}) {
  const intents = Array.isArray(input) ? input : Array.isArray(input?.intents) ? input.intents : [];
  if (intents.length === 0) {
    throw new Error("Intent intake must be an array or an object with a non-empty intents array.");
  }

  const normalizedSourceDir = path.join(outputRoot, "normalized-sources");
  await mkdir(normalizedSourceDir, { recursive: true });

  const candidates = [];
  const sources = [];

  for (let index = 0; index < intents.length; index += 1) {
    const rawIntent = intents[index];
    const sourceType = normalizeSourceType(rawIntent);
    const normalizedPayload = buildNormalizedPayload(rawIntent, sourceType);
    const sourceId = buildSourceId(rawIntent, sourceType, index, normalizedPayload);
    const sourceVersion = buildSourceVersion(rawIntent);
    const difficulty = normalizeDifficulty(rawIntent, sourceType);
    const audience = normalizeAudience(rawIntent);
    const topicTags = collectTopicTags(rawIntent);
    const contentFamily = sourceType === "QUESTION"
      ? classifyQuestionFamily(normalizedPayload, rawIntent)
      : sourceType;
    const chooserPayload = buildChooserPayload(sourceType, normalizedPayload);

    const sourceRecord = buildSourceRecord({
      rawIntent,
      sourceType,
      sourceId,
      sourceVersion,
      contentFamily,
      difficulty,
      audience,
      topicTags,
      normalizedPayload,
    });

    const sourcePath = path.join(normalizedSourceDir, `${sourceId}-source.json`);
    await writeJson(sourcePath, sourceRecord);

    const candidate = buildCandidateRecord({
      rawIntent,
      sourceType,
      sourceId,
      sourceVersion,
      contentFamily,
      difficulty,
      audience,
      topicTags,
      chooserPayload,
      sourcePath,
      scores: buildScores(rawIntent, sourceType, contentFamily),
    });

    candidates.push(candidate);
    sources.push({
      source_id: sourceId,
      source_type: sourceType,
      content_family: contentFamily,
      source_path: sourcePath,
    });
  }

  const batch = {
    created_at: now.toISOString(),
    intake_count: intents.length,
    source_count: sources.length,
    candidates,
    sources,
  };

  const summary = {
    created_at: now.toISOString(),
    intake_count: intents.length,
    by_source_type: sources.reduce((acc, item) => {
      acc[item.source_type] = (acc[item.source_type] || 0) + 1;
      return acc;
    }, {}),
    by_content_family: sources.reduce((acc, item) => {
      acc[item.content_family] = (acc[item.content_family] || 0) + 1;
      return acc;
    }, {}),
  };

  return {
    batch,
    summary,
    normalizedSourceDir,
  };
}
