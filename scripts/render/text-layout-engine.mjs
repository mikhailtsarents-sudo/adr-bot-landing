// Layout Engine for Shotstack text clips.
// Computes adaptive font size and word-wrapped lines
// based on text length and available container width.
//
// Uses character-width estimation (not pixel measurement) as an efficient
// proxy. Actual pixel rendering is delegated to Shotstack's HTML engine.

// Estimated average char widths (px) per font size at Montserrat 900 weight.
// These are empirically derived approximations for the German ADR vocabulary
// (mix of short and very long compound words like "Beförderungspapier").
const AVG_CHAR_WIDTH_RATIO = 0.62; // char_width ≈ fontSize * ratio

// Container width available for text in Shotstack 960px canvas
const CONTAINER_WIDTH_PX = 880; // 960 - 80px horizontal padding

function estimateLineWidth(text, fontSize) {
  return text.length * fontSize * AVG_CHAR_WIDTH_RATIO;
}

// Wraps text into lines that fit within containerWidth at given fontSize.
// Breaks only on word boundaries. Long single words are not broken.
export function wrapText(text, fontSize, containerWidth = CONTAINER_WIDTH_PX) {
  const words = String(text || "")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean);

  if (words.length === 0) return [];

  const lines = [];
  let current = "";

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (estimateLineWidth(candidate, fontSize) <= containerWidth || !current) {
      current = candidate;
    } else {
      lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

// Finds the largest font size where the text fits in maxLines lines.
// Binary search between minSize and maxSize.
export function pickFontSize({
  text,
  maxLines,
  maxSize = 64,
  minSize = 28,
  containerWidth = CONTAINER_WIDTH_PX,
}) {
  let lo = minSize;
  let hi = maxSize;

  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2);
    const lines = wrapText(text, mid, containerWidth);
    if (lines.length <= maxLines) {
      lo = mid;
    } else {
      hi = mid - 1;
    }
  }

  return lo;
}

// Returns { fontSize, lines } — the optimal font size and wrapped lines
// for a given role and text.
export function computeTextLayout(role, captionText) {
  const r = String(role || "").toLowerCase();
  const t = String(captionText || "").trim();

  if (!t) return { fontSize: 52, lines: [] };

  if (r === "hook") {
    const fontSize = pickFontSize({ text: t, maxLines: 3, maxSize: 88, minSize: 36 });
    const lines = wrapText(t, fontSize);
    return { fontSize, lines: lines.slice(0, 3) };
  }

  if (r === "question") {
    const fontSize = pickFontSize({ text: t, maxLines: 3, maxSize: 72, minSize: 32 });
    const lines = wrapText(t, fontSize);
    return { fontSize, lines: lines.slice(0, 3) };
  }

  if (r === "answer") {
    const fontSize = pickFontSize({ text: t, maxLines: 2, maxSize: 64, minSize: 30 });
    const lines = wrapText(t, fontSize);
    return { fontSize, lines: lines.slice(0, 2) };
  }

  if (r === "timer") {
    const fontSize = pickFontSize({ text: t, maxLines: 2, maxSize: 70, minSize: 32 });
    const lines = wrapText(t, fontSize);
    return { fontSize, lines: lines.slice(0, 2) };
  }

  // Default (answers/transcript)
  const fontSize = pickFontSize({ text: t, maxLines: 4, maxSize: 52, minSize: 28 });
  const lines = wrapText(t, fontSize);
  return { fontSize, lines: lines.slice(0, 4) };
}
