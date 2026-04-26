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

// Per-family CTA config: accent colour, headline, sub-line, button label, badge
const CTA_BY_FAMILY = {
  QUESTION: { accent: '#229ED9', headline: 'Kostenlos üben', sub: 'im Telegram-Bot', btn: '✈ Jetzt starten →', badge: '📝 ADR-Quiz' },
  WORD:     { accent: '#4ADE80', headline: 'ADR-Wörter lernen', sub: '1 Begriff pro Tag • kostenlos', btn: '💬 Im Bot üben', badge: '📖 Vokabeln' },
  NEWS:     { accent: '#FACC15', headline: 'ADR-News bleiben', sub: 'täglich neue Updates', btn: '🔔 Bot abonnieren', badge: '📰 News' },
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

// Telegram CTA — modern glassmorphism floating card
function buildCtaClips({ start, length }) {
  const cardWidth = 980;
  const cardHeight = 520;

  const planeSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 24 24"><path fill="white" d="M2 21L23 12 2 3v7l15 2-15 2v7z"/></svg>';

  const css = [
    FONT_IMPORT,
    `*{box-sizing:border-box;margin:0;padding:0;}`,
    `body{background:transparent;width:${cardWidth}px;height:${cardHeight}px;`,
    `display:flex;align-items:center;justify-content:center;position:relative;}`,
    `body::after{content:'';position:absolute;bottom:-40px;left:-100px;right:-100px;height:200px;`,
    `background:linear-gradient(transparent,rgba(0,0,0,0.30));pointer-events:none;z-index:0;}`,
    `.card{position:relative;z-index:1;width:100%;`,
    `background:rgba(8,14,26,0.85);`,
    `border:1px solid rgba(255,255,255,0.14);`,
    `border-radius:56px;`,
    `padding:30px 44px 34px;`,
    `box-shadow:0 24px 80px rgba(0,0,0,0.50);`,
    `display:flex;flex-direction:column;align-items:center;gap:12px;overflow:hidden;}`,
    `.card::before{content:'';position:absolute;top:-80px;left:-80px;width:360px;height:360px;`,
    `background:radial-gradient(circle,rgba(34,158,217,0.28) 0%,transparent 65%);pointer-events:none;}`,
    `.card::after{content:'';position:absolute;bottom:-30px;left:50%;transform:translateX(-50%);`,
    `width:65%;height:100px;`,
    `background:radial-gradient(ellipse,rgba(34,158,217,0.18) 0%,transparent 70%);pointer-events:none;}`,
    `.top-row{display:flex;align-items:center;gap:20px;}`,
    `.tg-icon{width:110px;height:110px;border-radius:50%;flex-shrink:0;`,
    `background:linear-gradient(135deg,#2AABEE,#229ED9);`,
    `display:flex;align-items:center;justify-content:center;`,
    `box-shadow:0 10px 30px rgba(34,158,217,0.45);}`,
    `.badge{background:rgba(34,158,217,0.95);color:#fff;`,
    `font-family:'Montserrat',Arial,sans-serif;font-weight:700;font-size:32px;`,
    `border-radius:18px;padding:10px 22px;}`,
    `.headline{font-family:'Montserrat',Arial,sans-serif;font-weight:900;font-size:68px;`,
    `color:#fff;line-height:1.0;text-align:center;`,
    `text-shadow:0 4px 18px rgba(0,0,0,0.50);}`,
    `.sub{font-family:'Montserrat',Arial,sans-serif;font-weight:800;font-size:38px;`,
    `color:#229ED9;text-align:center;}`,
    `@keyframes pulse{0%,100%{box-shadow:0 14px 40px rgba(34,158,217,0.45);}`,
    `50%{box-shadow:0 14px 60px rgba(34,158,217,0.75),0 0 40px rgba(34,158,217,0.30);}}`,
    `@keyframes arrow-move{0%,70%,100%{transform:translateX(0);}85%{transform:translateX(5px);}}`,
    `.btn{display:inline-flex;align-items:center;justify-content:center;gap:12px;`,
    `background:linear-gradient(135deg,#2AABEE,#168BD2);color:#fff;`,
    `font-family:'Montserrat',Arial,sans-serif;font-weight:900;font-size:38px;`,
    `padding:22px 42px;border-radius:999px;border:none;width:740px;`,
    `animation:pulse 2.5s ease-in-out infinite;`,
    `text-shadow:0 2px 8px rgba(0,0,0,0.25);}`,
    `.arrow{display:inline-block;animation:arrow-move 2.5s ease-in-out infinite;}`,
  ].join('');

  const html = [
    `<div class="card">`,
    `<div class="top-row">`,
    `<div class="tg-icon">${planeSvg}</div>`,
    `<div class="badge">ADR Quiz Bot</div>`,
    `</div>`,
    `<div class="headline">Schaffst du die<br>ADR-Pr&uuml;fung?</div>`,
    `<div class="sub">Kostenlos im Telegram &uuml;ben</div>`,
    `<div class="btn">Jetzt kostenlos starten <span class="arrow">&rarr;</span></div>`,
    `</div>`,
  ].join('');

  return [{
    asset: { type: 'html', html, css, width: cardWidth, height: cardHeight },
    position: 'center',
    start: Number((start || 0).toFixed(2)),
    length: Number(Math.max(length || 0.1, 0.1).toFixed(2)),
    offset: { x: 0, y: -0.26 },
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
export function buildCaptionClip({ role, text: captionText, start, length, contentFamily = "QUESTION" }) {
  const r = String(role || "").toLowerCase();
  const s = Number(start || 0);
  const l = Number(Math.max(length || 0.1, 0.1));

  if (r === "cta") {
    return buildCtaClips({ start: s, length: l, headline: captionText || undefined, contentFamily });
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
