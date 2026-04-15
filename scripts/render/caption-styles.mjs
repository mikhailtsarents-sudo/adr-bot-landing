const DEFAULT_ROLE = "default";

const CAPTION_PRESETS = {
  hook: {
    style: "future",
    size: "medium",
    color: "#F8FAFC",
    background: "#0F172A",
    position: "center",
    offset: { x: 0, y: 0.16 },
  },
  question: {
    style: "subtitle",
    size: "small",
    color: "#F8FAFC",
    background: "#111827",
    position: "center",
    offset: { x: 0, y: 0.11 },
  },
  answers: {
    style: "minimal",
    size: "small",
    color: "#111827",
    background: "#FDE68A",
    position: "center",
    offset: { x: 0, y: 0.06 },
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
    size: "medium",
    color: "#111827",
    background: "#FDE68A",
    position: "center",
    offset: { x: 0, y: 0.12 },
  },
  cta: {
    style: "blockbuster",
    size: "medium",
    color: "#111827",
    background: "#FDE68A",
    position: "center",
    offset: { x: 0, y: 0.18 },
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

function normalizeRole(role) {
  const value = text(role).toLowerCase();
  return value && CAPTION_PRESETS[value] ? value : DEFAULT_ROLE;
}

export function getCaptionPreset(role) {
  return CAPTION_PRESETS[normalizeRole(role)];
}

export function buildCaptionClip({ role, text: captionText, start, length }) {
  const preset = getCaptionPreset(role);
  return {
    asset: {
      type: "title",
      text: text(captionText),
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

export function buildSceneCaptionClips(timeline, sceneTextEntries) {
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
