import { getQuestionTemplateProfile } from "./question-quality.mjs";

const DEFAULT_ROLE = "default";

const CAPTION_PRESETS = {
  hook: {
    style: "future",
    size: "small",
    color: "#F8FAFC",
    background: "#0F172A",
    position: "center",
    offset: { x: 0, y: 0.1 },
  },
  question: {
    style: "subtitle",
    size: "x-small",
    color: "#F8FAFC",
    background: "#111827",
    position: "center",
    offset: { x: 0, y: 0.04 },
  },
  answers: {
    style: "minimal",
    size: "x-small",
    color: "#111827",
    background: "#FDE68A",
    position: "center",
    offset: { x: 0, y: 0.02 },
  },
  timer: {
    style: "marker",
    size: "x-small",
    color: "#FDE68A",
    background: "#111827",
    position: "center",
    offset: { x: 0, y: 0.02 },
  },
  answer: {
    style: "vogue",
    size: "small",
    color: "#111827",
    background: "#FDE68A",
    position: "center",
    offset: { x: 0, y: 0.08 },
  },
  cta: {
    style: "blockbuster",
    size: "small",
    color: "#111827",
    background: "#FDE68A",
    position: "center",
    offset: { x: 0, y: 0.14 },
  },
  transcript: {
    style: "subtitle",
    size: "small",
    color: "#F8FAFC",
    background: "#111827",
    position: "center",
    offset: { x: 0, y: 0.12 },
  },
  [DEFAULT_ROLE]: {
    style: "subtitle",
    size: "small",
    color: "#F8FAFC",
    background: "#111827",
    position: "center",
    offset: { x: 0, y: 0.1 },
  },
};

function text(value) {
  return value == null ? "" : String(value).trim();
}

function normalizeWhitespace(value) {
  return text(value).replace(/\s+/g, " ").trim();
}

function normalizeRole(role) {
  const value = text(role).toLowerCase();
  return value && CAPTION_PRESETS[value] ? value : DEFAULT_ROLE;
}

export function getCaptionPreset(role) {
  return CAPTION_PRESETS[normalizeRole(role)];
}

function splitCaptionLines(value, maxLineLength = 18, maxLines = 4) {
  const words = normalizeWhitespace(value).split(" ").filter(Boolean);
  if (words.length === 0) return "";

  const lines = [];
  let current = "";

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length <= maxLineLength || !current) {
      current = next;
      continue;
    }
    lines.push(current);
    current = word;
    if (lines.length >= maxLines) break;
  }

  if (current && lines.length < maxLines) {
    lines.push(current);
  }

  if (lines.length === maxLines && words.length > 0) {
    const consumedWords = lines.join(" ").split(" ").filter(Boolean).length;
    if (consumedWords < words.length) {
      lines[maxLines - 1] = `${lines[maxLines - 1].replace(/[.…]+$/, "")}…`;
    }
  }

  return lines.join("\n");
}

function formatAnswersCaptionText(value, maxLineLength = 18, maxLines = 6) {
  const answerLines = String(value || "")
    .split("\n")
    .map((line) => normalizeWhitespace(line))
    .filter(Boolean);

  const output = [];
  for (const answerLine of answerLines) {
    const match = answerLine.match(/^([A-D]:)\s*(.*)$/i);
    const label = match ? match[1].toUpperCase() : "";
    const body = match ? match[2] : answerLine;
    const wrapped = splitCaptionLines(body, Math.max(8, maxLineLength - (label ? label.length + 1 : 0)), 2)
      .split("\n")
      .filter(Boolean);

    if (wrapped.length === 0) continue;
    output.push(label ? `${label} ${wrapped[0]}` : wrapped[0]);
    for (const continuation of wrapped.slice(1)) {
      output.push(continuation);
    }
    if (output.length >= maxLines) break;
  }

  if (output.length > maxLines) {
    return output.slice(0, maxLines - 1).concat(`${output[maxLines - 1].replace(/[.…]+$/, "")}…`).join("\n");
  }

  if (answerLines.length > 0 && output.length === maxLines) {
    return output.slice(0, maxLines - 1).concat(`${output[maxLines - 1].replace(/[.…]+$/, "")}…`).join("\n");
  }

  return output.join("\n");
}

function getRoleTextBudget(role, templateVariant) {
  const profile = getQuestionTemplateProfile(templateVariant || "quiz_safe");
  const normalizedRole = normalizeRole(role);

  if (normalizedRole === "answers") {
    return {
      maxLineLength: Math.min(profile.bodyMaxLineLength, 14),
      maxLines: Math.min(profile.answerMaxVisibleLines, 6),
    };
  }

  if (normalizedRole === "question") {
    return {
      maxLineLength: Math.min(profile.bodyMaxLineLength, 16),
      maxLines: 5,
    };
  }

  if (normalizedRole === "hook") {
    return {
      maxLineLength: 18,
      maxLines: 3,
    };
  }

  if (normalizedRole === "answer") {
    return {
      maxLineLength: 16,
      maxLines: 4,
    };
  }

  if (normalizedRole === "cta") {
    return {
      maxLineLength: 18,
      maxLines: 4,
    };
  }

  return {
    maxLineLength: 18,
    maxLines: 3,
  };
}

export function buildCaptionClip({ role, text: captionText, start, length, templateVariant }) {
  const preset = getCaptionPreset(role);
  const budget = getRoleTextBudget(role, templateVariant);
  const normalizedRole = normalizeRole(role);
  const bodyText =
    normalizedRole === "answers"
      ? formatAnswersCaptionText(captionText, budget.maxLineLength, budget.maxLines)
      : splitCaptionLines(captionText, budget.maxLineLength, budget.maxLines);
  return {
    asset: {
      type: "title",
      text: bodyText,
      style: preset.style,
      size: preset.size,
      color: preset.color,
      background: preset.background,
      position: preset.position,
    },
    start: Number(start || 0),
    length: Number(Math.max(length || 0, 0.1).toFixed(2)),
    offset: {
      x: preset.offset.x,
      y: preset.offset.y,
    },
  };
}

export function buildSceneCaptionClips(timeline, sceneTextEntries, templateVariant) {
  const textByRole = new Map(sceneTextEntries.map((entry) => [entry.role, entry.text]));
  return timeline
    .map((scene) => {
      const captionText = textByRole.get(scene.role);
      if (!text(captionText)) {
        return null;
      }

      return buildCaptionClip({
        role: scene.role,
        text: captionText,
        start: scene.start_sec,
        length: scene.end_sec - scene.start_sec,
        templateVariant,
      });
    })
    .filter(Boolean);
}

export function buildTranscriptCaptionClips(dialogues) {
  return dialogues
    .map((dialogue) =>
      buildCaptionClip({
        role: "transcript",
        text: dialogue.text,
        start: dialogue.start,
        length: dialogue.length,
      }),
    )
    .filter((clip) => text(clip?.asset?.text));
}
