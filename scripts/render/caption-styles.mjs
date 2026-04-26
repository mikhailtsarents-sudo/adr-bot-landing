import { computeTextLayout } from "./text-layout-engine.mjs";

const FONT_IMPORT = "@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@700;800;900&display=swap');";

// Role-based typography system: font weight, letter-spacing, text-transform
const ROLE_TYPOGRAPHY = {
  hook:     { weight: 900, tracking: "-1px",  transform: "none",       shadow: "heavy" },
  question: { weight: 900, tracking: "-0.5px", transform: "none",      shadow: "heavy" },
  answers:  { weight: 800, tracking: "0px",   transform: "none",       shadow: "medium" },
  timer:    { weight: 900, tracking: "2px",   transform: "uppercase",  shadow: "heavy" },
  answer:   { weight: 900, tracking: "-0.5px", transform: "none",      shadow: "heavy" },
  cta:      { weight: 800, tracking: "0px",   transform: "none",       shadow: "medium" },
};

const TEXT_SHADOWS = {
  heavy:  "0 4px 16px rgba(0,0,0,0.99),0 2px 6px rgba(0,0,0,0.97)",
  medium: "0 3px 12px rgba(0,0,0,0.95),0 1px 4px rgba(0,0,0,0.85)",
};

function typo(role) {
  return ROLE_TYPOGRAPHY[String(role || "").toLowerCase()] || ROLE_TYPOGRAPHY.answers;
}

// Spacing between per-line clips in offset.y units (fraction of frame height 1920px)
function lineStep(fontSize) {
  return (fontSize * 3 + 16) / 1920;
}

// Highlight the first ALL-CAPS word (≥4 chars) with accent color
function highlightAccentWord(html, accentColor = "#FACC15") {
  return html.replace(
    /\b([A-ZÄÖÜ]{4,})\b/,
    `<span style="color:${accentColor}">\$1</span>`,
  );
}

// Single-line HTML clip — the core building block (proven stable in Shotstack)
function buildLineClip({ html, color, fontSize, start, length, offsetY, role = "answers", accentWord = false }) {
  const h = fontSize * 3;
  const t = typo(role);
  const renderedHtml = accentWord ? highlightAccentWord(html) : html;
  const css =
    `${FONT_IMPORT}` +
    `body{margin:0;padding:0;background:transparent;text-align:center;}` +
    `p{color:${color};font-family:'Montserrat',Arial,sans-serif;font-size:${fontSize}px;` +
    `font-weight:${t.weight};line-height:${h}px;margin:0;padding:0;` +
    `text-shadow:${TEXT_SHADOWS[t.shadow] || TEXT_SHADOWS.medium};` +
    `word-break:break-word;overflow-wrap:anywhere;` +
    `letter-spacing:${t.tracking};text-transform:${t.transform};}`;

  return {
    asset: { type: "html", html: `<p>${renderedHtml}</p>`, css, width: 960, height: h },
    position: "center",
    start: Number((start || 0).toFixed(2)),
    length: Number(Math.max(length || 0.1, 0.1).toFixed(2)),
    offset: { x: 0, y: Number(offsetY.toFixed(6)) },
  };
}

// Telegram CTA — glassmorphism overlay, reusable across all video types
function buildCtaClips({ start, length, headline }) {
  const cardWidth = 960;
  const cardHeight = 370;

  const css = [
    FONT_IMPORT,
    `*{box-sizing:border-box;margin:0;padding:0;}`,
    `body{background:transparent;width:${cardWidth}px;height:${cardHeight}px;`,
    `display:flex;align-items:center;justify-content:center;}`,
    `.card{background:rgba(10,18,32,0.58);`,
    `border:1.5px solid rgba(255,255,255,0.18);`,
    `border-radius:44px;`,
    `padding:30px 42px;`,
    `box-shadow:0 8px 40px rgba(0,0,0,0.6),inset 0 1px 0 rgba(255,255,255,0.12);`,
    `display:flex;flex-direction:column;align-items:center;gap:14px;width:100%;}`,
    `.headline{font-family:'Montserrat',Arial,sans-serif;font-size:64px;font-weight:900;`,
    `color:#F5EDD8;`,
    `-webkit-text-stroke:1.5px rgba(0,0,0,0.75);`,
    `text-shadow:0 3px 12px rgba(0,0,0,0.95),0 1px 4px rgba(0,0,0,0.85);`,
    `letter-spacing:-1px;text-align:center;}`,
    `.sub{font-family:'Montserrat',Arial,sans-serif;font-size:38px;font-weight:700;`,
    `color:#229ED9;text-shadow:0 2px 8px rgba(0,0,0,0.8);text-align:center;}`,
    `@keyframes jump{`,
    `0%,100%{transform:scale(1) translateY(0);`,
    `box-shadow:0 8px 28px rgba(34,158,217,0.55),0 2px 8px rgba(0,0,0,0.5);}`,
    `50%{transform:scale(1.04) translateY(-5px);`,
    `box-shadow:0 16px 44px rgba(34,158,217,0.85),0 4px 12px rgba(0,0,0,0.6);}}`,
    `.btn{display:inline-flex;align-items:center;gap:10px;`,
    `background:#229ED9;color:#fff;`,
    `font-family:'Montserrat',Arial,sans-serif;font-size:42px;font-weight:800;`,
    `padding:16px 46px;border-radius:60px;border:none;`,
    `animation:jump 0.8s ease-in-out infinite;white-space:nowrap;}`,
  ].join("");

  const headlineText = headline || "Kostenlos \u00fcben";
  const html = [
    `<div class="card">`,
    `<div class="headline">${esc(headlineText)}</div>`,
    `<div class="sub">im Telegram-Bot</div>`,
    `<div class="btn">\u2708 Jetzt starten \u2192</div>`,
    `</div>`,
  ].join("");

  return [{
    asset: { type: "html", html, css, width: cardWidth, height: cardHeight },
    position: "center",
    start: Number((start || 0).toFixed(2)),
    length: Number(Math.max(length || 0.1, 0.1).toFixed(2)),
    offset: { x: 0, y: -0.27 },
  }];
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

// Frosted glass pill backdrop — semi-transparent rounded card behind text lines
function buildFrostedGlassBackdrop({ start, length, offsetY = -0.05, lineCount = 1, fontSize = 52 }) {
  const lineH = fontSize * 3;
  const textBlockH = lineCount * lineH + Math.max(lineCount - 1, 0) * 8;
  const padV = 28;
  const cardH = textBlockH + padV * 2;
  const cardW = 880;
  const outerH = cardH + 48;
  const css =
    `body{margin:0;padding:0;background:transparent;width:960px;height:${outerH}px;` +
    `display:flex;align-items:center;justify-content:center;}` +
    `.pill{width:${cardW}px;height:${cardH}px;` +
    `background:rgba(8,14,26,0.54);` +
    `border:1px solid rgba(255,255,255,0.13);` +
    `border-radius:28px;` +
    `box-shadow:0 6px 36px rgba(0,0,0,0.6),inset 0 1px 0 rgba(255,255,255,0.07);}`;
  return {
    asset: { type: "html", html: `<div class="pill"></div>`, css, width: 960, height: outerH },
    position: "center",
    start: Number((start || 0).toFixed(2)),
    length: Number(Math.max(length || 0.1, 0.1).toFixed(2)),
    offset: { x: 0, y: Number(offsetY.toFixed(6)) },
  };
}

// Build per-line clips for a given role/text/timing
export function buildCaptionClip({ role, text: captionText, start, length }) {
  const r = String(role || "").toLowerCase();
  const s = Number(start || 0);
  const l = Number(Math.max(length || 0.1, 0.1));

  if (r === "cta") {
    return buildCtaClips({ start: s, length: l, headline: captionText || undefined });
  }

  if (r === "answers") {
    const answerLines = buildAnswerLines(captionText);
    if (answerLines.length === 0) return [];
    const fs = 42;
    const step = lineStep(fs);
    const baseY = -0.05;
    return [
      buildFrostedGlassBackdrop({ start: s, length: l, offsetY: baseY, lineCount: answerLines.length, fontSize: fs }),
      ...answerLines.map((html, i) =>
        buildLineClip({ html, color: "#FFFFFF", fontSize: fs, start: s, length: l,
          offsetY: baseY + (i - (answerLines.length - 1) / 2) * step, role: r }),
      ),
    ];
  }

  if (r === "hook" || r === "question") {
    const { fontSize: fs, lines } = computeTextLayout(r, captionText);
    if (lines.length === 0) return [];
    const step = lineStep(fs);
    const baseY = -0.05;
    return [
      buildFrostedGlassBackdrop({ start: s, length: l, offsetY: baseY, lineCount: lines.length, fontSize: fs }),
      ...lines.map((line, i) =>
        buildLineClip({ html: esc(line), color: "#FFFFFF", fontSize: fs, start: s, length: l,
          offsetY: baseY + (i - (lines.length - 1) / 2) * step, role: r, accentWord: r === "hook" }),
      ),
    ];
  }

  if (r === "timer") {
    const { fontSize: fs, lines } = computeTextLayout(r, captionText);
    if (lines.length === 0) return [];
    const step = lineStep(fs);
    return [
      buildFrostedGlassBackdrop({ start: s, length: l, offsetY: 0, lineCount: lines.length, fontSize: fs }),
      ...lines.map((line, i) =>
        buildLineClip({ html: esc(line), color: "#FACC15", fontSize: fs, start: s, length: l,
          offsetY: (i - (lines.length - 1) / 2) * step, role: r }),
      ),
    ];
  }

  if (r === "answer") {
    const { fontSize: fs, lines } = computeTextLayout(r, captionText);
    if (lines.length === 0) return [];
    const step = lineStep(fs);
    return [
      buildFrostedGlassBackdrop({ start: s, length: l, offsetY: 0, lineCount: lines.length, fontSize: fs }),
      ...lines.map((line, i) =>
        buildLineClip({ html: esc(line), color: "#4ADE80", fontSize: fs, start: s, length: l,
          offsetY: (i - (lines.length - 1) / 2) * step, role: r }),
      ),
    ];
  }

  // Default (transcript etc)
  const lines = splitLines(captionText, 22, 2);
  if (lines.length === 0) return [];
  const fs = 46;
  const step = lineStep(fs);
  return lines.map((line, i) =>
    buildLineClip({ html: esc(line), color: "#F8FAFC", fontSize: fs, start: s, length: l,
      offsetY: 0.3 + (i - (lines.length - 1) / 2) * step }),
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
