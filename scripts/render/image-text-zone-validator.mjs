import { readFile } from "node:fs/promises";
import jpegJs from "jpeg-js";

// Text zone = vertical center band (Y: 25%–75% of frame height).
// This matches where Shotstack places text overlays (offsetY ≈ 0, center).
// High brightness stdev in this zone = busy visual = text will be hard to read.

const DEFAULT_ZONE_TOP_RATIO = 0.25;
const DEFAULT_ZONE_BOT_RATIO = 0.75;
const DEFAULT_PASS_THRESHOLD = 50; // score 0–100, lower stdev = higher score
const SAMPLE_STEP = 4; // sample every 4th pixel for speed

function text(value) {
  return value == null ? "" : String(value).trim();
}

function computeBrightnessStdev(data, width, height, yStart, yEnd) {
  const values = [];
  for (let y = yStart; y < yEnd; y += SAMPLE_STEP) {
    for (let x = 0; x < width; x += SAMPLE_STEP) {
      const idx = (y * width + x) * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      values.push(0.299 * r + 0.587 * g + 0.114 * b);
    }
  }
  if (values.length === 0) return { stdev: 0, mean: 0, count: 0 };
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((a, b) => a + (b - mean) ** 2, 0) / values.length;
  return { stdev: Math.sqrt(variance), mean, count: values.length };
}

// Returns { score, pass, stdev, mean, reason }
// score 0–100: higher = calmer text zone = better readability
export async function validateTextZoneReadability(imagePath, options = {}) {
  const {
    threshold = DEFAULT_PASS_THRESHOLD,
    zoneTopRatio = DEFAULT_ZONE_TOP_RATIO,
    zoneBotRatio = DEFAULT_ZONE_BOT_RATIO,
  } = options;

  let buffer;
  try {
    buffer = await readFile(imagePath);
  } catch {
    return { score: 0, pass: false, stdev: 0, mean: 0, reason: "file_not_found" };
  }

  let decoded;
  try {
    decoded = jpegJs.decode(buffer, { useTArray: true, maxMemoryUsageInMB: 512 });
  } catch {
    return { score: 0, pass: false, stdev: 0, mean: 0, reason: "jpeg_decode_failed" };
  }

  const { width, height, data } = decoded;
  if (!width || !height || !data) {
    return { score: 0, pass: false, stdev: 0, mean: 0, reason: "empty_image" };
  }

  const yStart = Math.floor(height * zoneTopRatio);
  const yEnd = Math.floor(height * zoneBotRatio);
  const { stdev, mean } = computeBrightnessStdev(data, width, height, yStart, yEnd);

  // Score: invert stdev on a 0–100 scale.
  // stdev ≤ 20 → very calm → score 100
  // stdev ≥ 80 → very busy → score 0
  const score = Math.max(0, Math.min(100, Math.round(100 - (stdev / 80) * 100)));
  const pass = score >= threshold;

  const reason = pass
    ? "ok"
    : `text_zone_busy (stdev=${stdev.toFixed(1)}, score=${score})`;

  return {
    score,
    pass,
    stdev: Number(stdev.toFixed(2)),
    mean: Number(mean.toFixed(2)),
    reason,
  };
}

// Validates a batch of frame paths. Returns array of per-frame results.
export async function validateTextZoneReadabilityBatch(framePaths, options = {}) {
  const results = [];
  for (const framePath of framePaths) {
    const result = await validateTextZoneReadability(text(framePath), options);
    results.push({ path: text(framePath), ...result });
  }
  return results;
}

// Picks the best frame from a list of candidates (highest score).
// Falls back to first candidate if all fail.
export function pickBestFrame(candidates) {
  if (!Array.isArray(candidates) || candidates.length === 0) return null;
  return candidates.reduce((best, current) =>
    (current.score ?? 0) > (best.score ?? 0) ? current : best,
  );
}
