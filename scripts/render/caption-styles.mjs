const FONT_IMPORT = "@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@700;800;900&display=swap');";

// Spacing between per-line clips in offset.y units (fraction of frame height 1920px)
function lineStep(fontSize) {
  return (fontSize * 3 + 16) / 1920;
}

// Single-line HTML clip — the core building block (proven stable in Shotstack)
function buildLineClip({ html, color, fontSize, start, length, offsetY }) {
  const h = fontSize * 3;
  const css =
    `${FONT_IMPORT}` +
    `body{margin:0;padding:0;background:transparent;text-align:center;}` +
    `p{color:${color};font-family:'Montserrat',Arial,sans-serif;font-size:${fontSize}px;` +
    `font-weight:900;line-height:${h}px;margin:0;padding:0;` +
    `text-shadow:0 4px 16px rgba(0,0,0,0.99),0 2px 6px rgba(0,0,0,0.97);` +
    `word-break:break-word;overflow-wrap:anywhere;letter-spacing:-0.5px;}`;

  return {
    asset: { type: "html", html: `<p>${html}</p>`, css, width: 960, height: h },
    position: "center",
    start: Number((start || 0).toFixed(2)),
    length: Number(Math.max(length || 0.1, 0.1).toFixed(2)),
    offset: { x: 0, y: Number(offsetY.toFixed(6)) },
  };
}

// Telegram CTA — standard template, same in every video
function buildCtaClips({ start, length }) {
  const fs = 50;
  const s = lineStep(fs);
  const h = fs * 3;
  const animCss =
    `${FONT_IMPORT}` +
    `@keyframes jump{` +
    `0%,100%{transform:scale(1) translateY(0);box-shadow:0 8px 28px rgba(34,158,217,0.55),0 2px 8px rgba(0,0,0,0.5);}` +
    `50%{transform:scale(1.04) translateY(-5px);box-shadow:0 16px 44px rgba(34,158,217,0.85),0 4px 12px rgba(0,0,0,0.6);}}` +
    `body{margin:0;padding:0;background:transparent;text-align:center;}` +
    `p{display:inline-block;background:#229ED9;color:#FFFFFF;` +
    `font-family:'Montserrat',Arial,sans-serif;font-size:${fs}px;font-weight:800;` +
    `line-height:${h - 20}px;margin:0;padding:10px 32px;` +
    `word-break:break-word;animation:jump 0.8s ease-in-out infinite;}`;

  const makeCtaClip = (text, offsetY, radius) => ({
    asset: {
      type: "html",
      html: `<p style="border-radius:${radius}">${text}</p>`,
      css: animCss,
      width: 960,
      height: h,
    },
    position: "center",
    start: Number((start || 0).toFixed(2)),
    length: Number(Math.max(length || 0.1, 0.1).toFixed(2)),
    offset: { x: 0, y: Number(offsetY.toFixed(6)) },
  });

  return [
    makeCtaClip("Im Telegram-Bot", 0 - s / 2, "20px 20px 8px 8px"),
    makeCtaClip("kostenlos starten \u2197", 0 + s / 2, "8px 8px 20px 20px"),
  ];
}

// Split text into lines of max maxLineLength chars
function splitLines(value, maxLineLength, maxLines) {
  const words = String(value || "")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean);
  if (words.length === 0) return [];

  const lines = [];
  let current = "";
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length <= maxLineLength || !current) {
      current = next;
    } else {
      lines.push(current);
      current = word;
      if (lines.length >= maxLines) break;
    }
  }
  if (current && lines.length < maxLines) lines.push(current);
  return lines;
}

// Escape HTML entities
function esc(str) {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// Build answer lines with yellow label accent
function buildAnswerLines(text) {
  return String(text || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const m = line.match(/^([A-D]:)\s*(.*)$/i);
      if (m) {
        return `<span style="color:#FACC15;font-weight:900">${m[1].toUpperCase()}</span> ${esc(m[2])}`;
      }
      return esc(line);
    });
}

// Build per-line clips for a given role/text/timing
export function buildCaptionClip({ role, text: captionText, start, length }) {
  const r = String(role || "").toLowerCase();
  const s = Number(start || 0);
  const l = Number(Math.max(length || 0.1, 0.1));

  if (r === "cta") {
    return buildCtaClips({ start: s, length: l });
  }

  if (r === "answers") {
    const answerLines = buildAnswerLines(captionText);
    if (answerLines.length === 0) return [];
    const fs = 42;
    const step = lineStep(fs);
    const baseY = -0.05;
    return answerLines.map((html, i) =>
      buildLineClip({
        html,
        color: "#FFFFFF",
        fontSize: fs,
        start: s,
        length: l,
        offsetY: baseY + (i - (answerLines.length - 1) / 2) * step,
      }),
    );
  }

  if (r === "hook" || r === "question") {
    const lines = splitLines(captionText, 22, 3);
    if (lines.length === 0) return [];
    const fs = 52;
    const step = lineStep(fs);
    const baseY = -0.05;
    return lines.map((line, i) =>
      buildLineClip({
        html: esc(line),
        color: "#FFFFFF",
        fontSize: fs,
        start: s,
        length: l,
        offsetY: baseY + (i - (lines.length - 1) / 2) * step,
      }),
    );
  }

  if (r === "timer") {
    const lines = splitLines(captionText, 22, 2);
    if (lines.length === 0) return [];
    const fs = 54;
    const step = lineStep(fs);
    return lines.map((line, i) =>
      buildLineClip({
        html: esc(line),
        color: "#FACC15",
        fontSize: fs,
        start: s,
        length: l,
        offsetY: (i - (lines.length - 1) / 2) * step,
      }),
    );
  }

  if (r === "answer") {
    const lines = splitLines(captionText, 24, 2);
    if (lines.length === 0) return [];
    const fs = 52;
    const step = lineStep(fs);
    return lines.map((line, i) =>
      buildLineClip({
        html: esc(line),
        color: "#4ADE80",
        fontSize: fs,
        start: s,
        length: l,
        offsetY: (i - (lines.length - 1) / 2) * step,
      }),
    );
  }

  // Default (transcript etc)
  const lines = splitLines(captionText, 22, 2);
  if (lines.length === 0) return [];
  const fs = 46;
  const step = lineStep(fs);
  return lines.map((line, i) =>
    buildLineClip({
      html: esc(line),
      color: "#F8FAFC",
      fontSize: fs,
      start: s,
      length: l,
      offsetY: 0.3 + (i - (lines.length - 1) / 2) * step,
    }),
  );
}

export function buildSceneCaptionClips(timeline, sceneTextEntries) {
  const textByRole = new Map((sceneTextEntries || []).map((e) => [e.role, e.text]));
  const clips = [];

  for (const scene of timeline) {
    const captionText = textByRole.get(scene.role);
    if (!captionText || !String(captionText).trim()) continue;

    const sceneClips = buildCaptionClip({
      role: scene.role,
      text: captionText,
      start: scene.start_sec,
      length: scene.end_sec - scene.start_sec,
    });

    clips.push(...(Array.isArray(sceneClips) ? sceneClips : [sceneClips]));
  }

  return clips;
}

// Kept for backward compatibility
export function getCaptionPreset(role) {
  return { style: "subtitle", size: "small", color: "#F8FAFC", background: "", position: "bottom", offset: { x: 0, y: -0.04 } };
}

export function buildTranscriptCaptionClips(dialogues) {
  return (dialogues || []).flatMap((d) =>
    buildCaptionClip({ role: "transcript", text: d.text, start: d.start, length: d.length }),
  );
}
