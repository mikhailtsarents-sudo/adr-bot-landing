function text(value) {
  return value == null ? "" : String(value).trim();
}

function normalizeWhitespace(value) {
  return text(value)
    .replace(/\s+/g, " ")
    .replace(/\s*([?!.;,])\s*/g, "$1 ")
    .trim();
}

function truncateAtWordBoundary(value, maxLength) {
  const source = normalizeWhitespace(value);
  if (!source || source.length <= maxLength) return source;
  const slice = source.slice(0, maxLength + 1);
  const lastBoundary = Math.max(slice.lastIndexOf(" "), slice.lastIndexOf("?"));
  const shortened = (lastBoundary > 16 ? slice.slice(0, lastBoundary) : source.slice(0, maxLength)).trimEnd();
  return shortened;
}

function shortenQuestion(value, maxLength) {
  const shortened = truncateAtWordBoundary(value, maxLength);
  if (!shortened) return "";
  return shortened.endsWith("?") ? shortened : `${shortened}?`;
}

function shortenAnswer(value, maxLength) {
  return truncateAtWordBoundary(value, maxLength).replace(/[?!.]+$/, "").trim();
}

function countWords(value) {
  return normalizeWhitespace(value).split(" ").filter(Boolean).length;
}

function clamp(value, min = 0, max = 10) {
  return Math.min(max, Math.max(min, value));
}

export const QUESTION_TEMPLATE_PROFILES = {
  quiz_fast: {
    id: "quiz_fast",
    label: "Fast",
    questionMaxLength: 54,
    answerMaxLength: 24,
    bodyMaxLineLength: 22,
    answerMaxVisibleLines: 3,
    phaseOffsets: {
      question: { bodyY: 0.06, shadowY: 0.05, labelY: -0.08 },
      answer: { bodyY: 0.12, shadowY: 0.11, labelY: -0.02 },
      reveal: { bodyY: 0.12, shadowY: 0.11, labelY: -0.02 },
      cta: { bodyY: 0.18, shadowY: 0.17, labelY: 0.03 },
    },
  },
  quiz_standard: {
    id: "quiz_standard",
    label: "Standard",
    questionMaxLength: 78,
    answerMaxLength: 34,
    bodyMaxLineLength: 18,
    answerMaxVisibleLines: 4,
    phaseOffsets: {
      question: { bodyY: 0.03, shadowY: 0.02, labelY: -0.1 },
      answer: { bodyY: 0.1, shadowY: 0.09, labelY: -0.03 },
      reveal: { bodyY: 0.1, shadowY: 0.09, labelY: -0.03 },
      cta: { bodyY: 0.18, shadowY: 0.17, labelY: 0.04 },
    },
  },
  quiz_split: {
    id: "quiz_split",
    label: "Split",
    questionMaxLength: 104,
    answerMaxLength: 42,
    bodyMaxLineLength: 14,
    answerMaxVisibleLines: 6,
    phaseOffsets: {
      question: { bodyY: -0.02, shadowY: -0.03, labelY: -0.14 },
      answer: { bodyY: 0.08, shadowY: 0.07, labelY: -0.05 },
      reveal: { bodyY: 0.08, shadowY: 0.07, labelY: -0.05 },
      cta: { bodyY: 0.16, shadowY: 0.15, labelY: 0.02 },
    },
  },
  quiz_safe: {
    id: "quiz_safe",
    label: "Safe",
    questionMaxLength: 120,
    answerMaxLength: 48,
    bodyMaxLineLength: 12,
    answerMaxVisibleLines: 7,
    phaseOffsets: {
      question: { bodyY: -0.06, shadowY: -0.07, labelY: -0.16 },
      answer: { bodyY: 0.06, shadowY: 0.05, labelY: -0.06 },
      reveal: { bodyY: 0.06, shadowY: 0.05, labelY: -0.06 },
      cta: { bodyY: 0.14, shadowY: 0.13, labelY: 0.0 },
    },
  },
};

export function getQuestionTemplateProfile(templateVariant = "quiz_standard") {
  return QUESTION_TEMPLATE_PROFILES[templateVariant] || QUESTION_TEMPLATE_PROFILES.quiz_standard;
}

export function selectQuestionTemplateVariant(questionText, answers = []) {
  const questionLength = normalizeWhitespace(questionText).length;
  const longestAnswer = Math.max(0, ...answers.map((answer) => normalizeWhitespace(answer).length));

  if (questionLength <= 54 && longestAnswer <= 24) {
    return "quiz_fast";
  }
  if (questionLength <= 78 && longestAnswer <= 34) {
    return "quiz_standard";
  }
  return "quiz_split";
}

export function getFallbackTemplateVariant(templateVariant) {
  if (templateVariant === "quiz_fast") return "quiz_standard";
  if (templateVariant === "quiz_standard") return "quiz_split";
  return "quiz_safe";
}

export function buildQuestionShortformContract(questionInput) {
  const payload = questionInput?.payload || {};
  const questionText = normalizeWhitespace(payload.question_text);
  const answers = Array.isArray(payload.answer_options) ? payload.answer_options.map((item) => normalizeWhitespace(item)) : [];
  const correctAnswer = normalizeWhitespace(payload.correct_answer);
  const explanation = normalizeWhitespace(payload.simple_explanation);
  const cta = "Schaffst du 5 ADR-Fragen?";

  const hook = shortenQuestion(questionText, 54);
  const questionShort = shortenQuestion(questionText, 84);
  const answersShort = answers.slice(0, 4).map((answer) => shortenAnswer(answer, 34));
  const correctShort = shortenAnswer(correctAnswer, 42);
  const explanationShort = truncateAtWordBoundary(explanation, 84);
  const templateVariant = selectQuestionTemplateVariant(questionShort, answersShort);
  const fallbackTemplateVariant = getFallbackTemplateVariant(templateVariant);

  return {
    hook,
    question_short: questionShort,
    answers_short: answersShort,
    correct_short: correctShort,
    explanation_short: explanationShort,
    cta,
    template_variant: templateVariant,
    fallback_template_variant: fallbackTemplateVariant,
    metrics: {
      question_length: questionShort.length,
      question_words: countWords(questionShort),
      longest_answer_length: Math.max(0, ...answersShort.map((answer) => answer.length)),
      longest_answer_words: Math.max(0, ...answersShort.map((answer) => countWords(answer))),
      answers_count: answersShort.length,
      cta_length: cta.length,
    },
  };
}

export function buildQuestionQaReport({
  shortform,
  templateVariant,
  fallbackTemplateVariant,
}) {
  const variant = templateVariant || shortform?.template_variant || "quiz_standard";
  const profile = getQuestionTemplateProfile(variant);
  const answers = Array.isArray(shortform?.answers_short) ? shortform.answers_short : [];
  const question = normalizeWhitespace(shortform?.question_short);
  const hook = normalizeWhitespace(shortform?.hook);
  const cta = normalizeWhitespace(shortform?.cta);

  const checks = {
    hook_present: Boolean(hook),
    question_present: Boolean(question),
    answers_present: answers.length >= 3,
    cta_present: Boolean(cta),
    question_fits_variant: question.length <= profile.questionMaxLength,
    answers_fit_variant: answers.every((answer) => answer.length <= profile.answerMaxLength),
    answer_count_supported: answers.length <= 4,
  };

  const readabilityScore = clamp(
    10 -
      Math.max(0, question.length - profile.questionMaxLength) / 8 -
      Math.max(0, ...answers.map((answer) => answer.length - profile.answerMaxLength)) / 6,
  );
  const hookClarityScore = clamp(hook.length <= 54 && countWords(hook) <= 10 ? 9 : 7);
  const focusScore = clamp(profile.bodyMaxLineLength >= 14 ? 8 : 9);
  const ctaClarityScore = clamp(cta.length <= 64 ? 9 : 7);
  const contrastScore = 8;

  const score = Number(
    (
      hookClarityScore * 0.2 +
      readabilityScore * 0.35 +
      contrastScore * 0.15 +
      focusScore * 0.15 +
      ctaClarityScore * 0.15
    ).toFixed(2)
  );

  const status =
    checks.hook_present &&
    checks.question_present &&
    checks.answers_present &&
    checks.cta_present &&
    checks.question_fits_variant &&
    checks.answers_fit_variant &&
    checks.answer_count_supported &&
    score >= 7
      ? "pass"
      : variant !== "quiz_safe"
        ? "fallback_required"
        : "blocked";

  return {
    qa_version: "question_shorts_v1",
    template_variant: variant,
    fallback_template_variant: fallbackTemplateVariant || getFallbackTemplateVariant(variant),
    checks,
    score_fields: {
      hook_clarity: hookClarityScore,
      readability: readabilityScore,
      contrast: contrastScore,
      focus: focusScore,
      cta_clarity: ctaClarityScore,
    },
    score,
    threshold: 7,
    status,
  };
}

export function buildQuestionVariantAttempts(primaryVariant, fallbackVariant) {
  const chain = [primaryVariant, fallbackVariant || getFallbackTemplateVariant(primaryVariant), "quiz_safe"]
    .map((item) => text(item))
    .filter(Boolean);
  return [...new Set(chain)].slice(0, 3);
}
