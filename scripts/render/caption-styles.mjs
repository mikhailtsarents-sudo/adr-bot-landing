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

// Spacing between per-line clips in offset.y units (fraction of frame height 1920px).
// No inter-line gap: clips are flush so the frosted-glass backdrop shows no visible stripe.
function lineStep(fontSize) {
  return (fontSize * 3) / 1920;
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

// Per-family CTA config: accent colour, headline, sub-line, button label, badge
const CTA_BY_FAMILY = {
  QUESTION: { accent: '#229ED9', accentRgb: '34,158,217', headline: 'Schaffst du die<br>ADR-Pr&uuml;fung?', sub: 'Kostenlos im Telegram &uuml;ben', btn: 'Jetzt kostenlos starten', badge: 'ADR Quiz Bot', btnGrad: 'linear-gradient(135deg,#2AABEE,#168BD2)' },
  WORD:     { accent: '#4ADE80', accentRgb: '74,222,128',  headline: 'ADR-W&ouml;rter lernen',           sub: '1 Begriff pro Tag &bull; kostenlos',  btn: 'Im Bot &uuml;ben',          badge: 'ADR Vokabeln', btnGrad: 'linear-gradient(135deg,#22c55e,#16a34a)' },
  NEWS:     { accent: '#FACC15', accentRgb: '250,204,21',  headline: 'ADR-News nicht verpassen',         sub: 't&auml;glich neue Updates',            btn: 'Bot abonnieren',            badge: 'ADR News',     btnGrad: 'linear-gradient(135deg,#eab308,#ca8a04)' },
};


// A/B variant pools per family: headline rotates per source_id hash
const CTA_AB_VARIANTS = {
  QUESTION: [
    'Kostenlos üben',
    'Täglich 1 Frage lernen',
    'Prüfung bestehen',
  ],
  WORD: [
    'ADR-Wörter lernen',
    '1 Begriff pro Tag',
    'Vokabeln täglich',
  ],
  NEWS: [
    'ADR-News bleiben',
    'Updates nicht verpassen',
    'Immer aktuell',
  ],
};

export function pickCtaVariant(contentFamily, sourceId) {
  const pool = CTA_AB_VARIANTS[String(contentFamily).toUpperCase()] || CTA_AB_VARIANTS.QUESTION;
  const hash = String(sourceId || '').split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return pool[hash % pool.length];
}

// Telegram CTA — glassmorphism floating card, family-aware
// Uses inline styles only (no CSS classes, no nested flex) for Shotstack compatibility
function buildCtaClips({ start, length, contentFamily = "QUESTION" }) {
  const family = String(contentFamily || "QUESTION").toUpperCase();
  const cfg = CTA_BY_FAMILY[family] || CTA_BY_FAMILY.QUESTION;
  const { accent, accentRgb, btnGrad } = cfg;

  const cardWidth = 980;
  const cardHeight = 520;

  const planeSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 24 24"><path fill="white" d="M2 21L23 12 2 3v7l15 2-15 2v7z"/></svg>`;

  const f = `font-family:'Montserrat',Arial,sans-serif;`;
  const css = [
    FONT_IMPORT,
    `*{box-sizing:border-box;margin:0;padding:0;}`,
    `body{margin:0;padding:0;background:transparent;width:${cardWidth}px;height:${cardHeight}px;}`,
    `@keyframes pulse{0%,100%{box-shadow:0 14px 40px rgba(${accentRgb},0.45);}50%{box-shadow:0 14px 60px rgba(${accentRgb},0.75);}}`,
  ].join('');

  const html = [
    `<div style="width:100%;background:rgba(8,14,26,0.92);border:1px solid rgba(255,255,255,0.14);border-radius:56px;padding:30px 44px 34px;box-shadow:0 24px 80px rgba(0,0,0,0.50);">`,
    // top row: icon + badge as inline-block (no flex)
    `<div style="margin-bottom:14px;line-height:0;">`,
    `<span style="display:inline-block;vertical-align:middle;width:110px;height:110px;border-radius:55px;background:linear-gradient(135deg,#2AABEE,#229ED9);text-align:center;padding-top:25px;box-shadow:0 10px 30px rgba(34,158,217,0.45);">${planeSvg}</span>`,
    `<span style="display:inline-block;vertical-align:middle;margin-left:18px;background:rgba(${accentRgb},0.95);color:#fff;${f}font-weight:700;font-size:32px;border-radius:18px;padding:10px 22px;">${cfg.badge}</span>`,
    `</div>`,
    // headline
    `<div style="display:block;${f}font-weight:900;font-size:68px;color:#fff;line-height:1.0;text-align:center;text-shadow:0 4px 18px rgba(0,0,0,0.50);margin-bottom:10px;">${cfg.headline}</div>`,
    // sub
    `<div style="display:block;${f}font-weight:800;font-size:38px;color:${accent};text-align:center;margin-bottom:16px;">${cfg.sub}</div>`,
    // button
    `<div style="display:block;text-align:center;background:${btnGrad};color:#fff;${f}font-weight:900;font-size:38px;padding:22px 42px;border-radius:999px;animation:pulse 2.5s ease-in-out infinite;text-shadow:0 2px 8px rgba(0,0,0,0.25);">${cfg.btn} &rarr;</div>`,
    `</div>`,
  ].join('');

  return [{
    asset: { type: 'html', html, css, width: cardWidth, height: cardHeight },
    position: 'center',
    start: Number((start || 0).toFixed(2)),
    length: Number(Math.max(length || 0.1, 0.1).toFixed(2)),
    offset: { x: 0, y: -0.04 },
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

// Unified clip: frosted-glass backdrop + all text lines in ONE HTML element.
// Eliminates sub-pixel compositing seams that occur between separate per-line clips.
function buildMultiLineClip({ lines, fontSize, start, length, role, baseY = -0.05, color }) {
  const lineH = fontSize * 3;
  const padV = 28;
  const cardH = lines.length * lineH + padV * 2;
  const outerH = cardH + 48;
  const t = typo(role);
  const r = String(role || "").toLowerCase();

  const linesHtml = lines
    .map((html) => `<p class="line">${r === "hook" ? highlightAccentWord(html) : html}</p>`)
    .join("");

  const css = [
    FONT_IMPORT,
    `body{margin:0;padding:0;background:transparent;width:960px;height:${outerH}px;`,
    `display:flex;align-items:center;justify-content:center;}`,
    `.card{width:880px;background:rgba(8,14,26,0.54);`,
    `border:1px solid rgba(255,255,255,0.13);border-radius:28px;`,
    `padding:${padV}px 40px;display:flex;flex-direction:column;align-items:center;gap:0;`,
    `box-shadow:0 6px 36px rgba(0,0,0,0.6),inset 0 1px 0 rgba(255,255,255,0.07);}`,
    `.line{color:${color};font-family:'Montserrat',Arial,sans-serif;font-size:${fontSize}px;`,
    `line-height:${lineH}px;font-weight:${t.weight};margin:0;padding:0;text-align:center;`,
    `word-break:break-word;overflow-wrap:anywhere;letter-spacing:${t.tracking};`,
    `text-transform:${t.transform};text-shadow:${TEXT_SHADOWS[t.shadow] || TEXT_SHADOWS.medium};}`,
  ].join("");

  return [{
    asset: { type: "html", html: `<div class="card">${linesHtml}</div>`, css, width: 960, height: outerH },
    position: "center",
    start: Number((start || 0).toFixed(2)),
    length: Number(Math.max(length || 0.1, 0.1).toFixed(2)),
    offset: { x: 0, y: Number(baseY.toFixed(6)) },
  }];
}

// Build caption clips for a given role/text/timing
export function buildCaptionClip({ role, text: captionText, start, length, contentFamily = "QUESTION" }) {
  const r = String(role || "").toLowerCase();
  const s = Number(start || 0);
  const l = Number(Math.max(length || 0.1, 0.1));

  if (r === "cta") {
    return buildCtaClips({ start: s, length: l, contentFamily });
  }

  if (r === "answers") {
    const answerLines = buildAnswerLines(captionText);
    if (answerLines.length === 0) return [];
    return buildMultiLineClip({ lines: answerLines, fontSize: 42, start: s, length: l, role: r, baseY: -0.05, color: "#FFFFFF" });
  }

  if (r === "hook" || r === "question") {
    const { fontSize: fs, lines } = computeTextLayout(r, captionText);
    if (lines.length === 0) return [];
    return buildMultiLineClip({ lines: lines.map(esc), fontSize: fs, start: s, length: l, role: r, baseY: -0.05, color: "#FFFFFF" });
  }

  if (r === "timer") {
    const { fontSize: fs, lines } = computeTextLayout(r, captionText);
    if (lines.length === 0) return [];
    return buildMultiLineClip({ lines: lines.map(esc), fontSize: fs, start: s, length: l, role: r, baseY: 0, color: "#FACC15" });
  }

  if (r === "answer") {
    const { fontSize: fs, lines } = computeTextLayout(r, captionText);
    if (lines.length === 0) return [];
    return buildMultiLineClip({ lines: lines.map(esc), fontSize: fs, start: s, length: l, role: r, baseY: 0, color: "#4ADE80" });
  }

  // Default (transcript etc) — no backdrop, plain text near top
  const lines = splitLines(captionText, 22, 2);
  if (lines.length === 0) return [];
  const fs = 46;
  const step = lineStep(fs);
  return lines.map((line, i) =>
    buildLineClip({ html: esc(line), color: "#F8FAFC", fontSize: fs, start: s, length: l,
      offsetY: 0.3 + ((lines.length - 1) / 2 - i) * step }),
  );
}

export function buildSceneCaptionClips(timeline, sceneTextEntries, contentFamily = "QUESTION") {
  const textByRole = new Map((sceneTextEntries || []).map((e) => [e.role, e.text]));

  const timerScene = (timeline || []).find((s) => s.role === "timer");
  const ctaScene = (timeline || []).find((s) => s.role === "cta");
  // Hard ceiling: no text clip may extend into the CTA scene
  const ctaStart = ctaScene ? ctaScene.start_sec : Infinity;

  const clips = [];

  for (const scene of timeline) {
    const captionText = textByRole.get(scene.role);
    if (!captionText || !String(captionText).trim()) continue;

    // Answers stay visible through the timer scene (voice reads answers during countdown)
    const rawEnd = (scene.role === "answers" && timerScene)
      ? timerScene.end_sec
      : scene.end_sec;

    // Clamp end to CTA start so no text bleeds into CTA
    const endSec = Math.min(rawEnd, ctaStart);
    const length = endSec - scene.start_sec;
    if (length <= 0) continue;

    const sceneClips = buildCaptionClip({
      role: scene.role,
      text: captionText,
      start: scene.start_sec,
      length,
      contentFamily,
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
