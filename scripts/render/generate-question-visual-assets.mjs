import crypto from "node:crypto";
import { appendFile, mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { spawnSync } from "node:child_process";

const WIDTH = 1080;
const HEIGHT = 1920;
const ROLE_ORDER = ["hook", "question", "answers", "timer", "answer", "cta"];

function text(value) {
  return value == null ? "" : String(value).trim();
}

function slugify(value) {
  return text(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

function sha256(payload) {
  return crypto.createHash("sha256").update(payload).digest("hex");
}

function buildPalette(seed) {
  const hash = sha256(seed);
  const a = hash.slice(0, 6);
  const b = hash.slice(6, 12);
  const c = hash.slice(12, 18);
  return {
    backgroundA: `#${a}`,
    backgroundB: `#${b}`,
    accent: `#${c}`,
    light: "#F8FAFC",
    dark: "#0F172A",
  };
}

function escapeXml(value) {
  return text(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function buildPrimarySvg({ videoId, questionId, shortform, palette }) {
  const hook = escapeXml(shortform?.hook);
  const question = escapeXml(shortform?.question_short);
  const accentLabel = escapeXml(questionId || "ADR");
  const signature = escapeXml(videoId.slice(-8).toUpperCase());

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${palette.backgroundA}" />
      <stop offset="100%" stop-color="${palette.backgroundB}" />
    </linearGradient>
    <linearGradient id="panel" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="rgba(15,23,42,0.08)" />
      <stop offset="100%" stop-color="rgba(15,23,42,0.22)" />
    </linearGradient>
  </defs>
  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#bg)" />
  <circle cx="180" cy="260" r="220" fill="${palette.accent}" opacity="0.18" />
  <circle cx="920" cy="430" r="280" fill="${palette.light}" opacity="0.09" />
  <rect x="90" y="180" rx="42" ry="42" width="900" height="1560" fill="${palette.dark}" opacity="0.18" />
  <rect x="120" y="220" rx="32" ry="32" width="840" height="120" fill="${palette.light}" opacity="0.14" />
  <text x="150" y="295" font-family="Arial, Helvetica, sans-serif" font-size="34" font-weight="700" fill="${palette.light}" opacity="0.92">${accentLabel}</text>
  <text x="150" y="385" font-family="Arial, Helvetica, sans-serif" font-size="92" font-weight="800" fill="${palette.light}" opacity="0.16">ADR</text>
  <text x="150" y="1510" font-family="Arial, Helvetica, sans-serif" font-size="44" font-weight="700" fill="${palette.light}" opacity="0.82">${hook}</text>
  <text x="150" y="1580" font-family="Arial, Helvetica, sans-serif" font-size="28" font-weight="500" fill="${palette.light}" opacity="0.72">${question}</text>
  <text x="150" y="1690" font-family="Arial, Helvetica, sans-serif" font-size="26" font-weight="700" fill="${palette.light}" opacity="0.5">VIDEO ${signature}</text>
  <g transform="translate(760 1180) rotate(12)">
    <rect x="0" y="0" width="180" height="180" rx="24" ry="24" fill="${palette.accent}" opacity="0.78"/>
    <rect x="18" y="18" width="144" height="144" rx="18" ry="18" fill="${palette.light}" opacity="0.18"/>
    <text x="90" y="112" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="54" font-weight="900" fill="${palette.light}">?</text>
  </g>
</svg>`;
}

function buildFallbackSvg({ videoId, palette }) {
  const signature = escapeXml(videoId.slice(-8).toUpperCase());
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
  <rect width="${WIDTH}" height="${HEIGHT}" fill="${palette.dark}" />
  <rect x="72" y="72" width="936" height="1776" rx="48" ry="48" fill="${palette.backgroundA}" opacity="0.94" />
  <rect x="120" y="130" width="840" height="1600" rx="40" ry="40" fill="${palette.backgroundB}" opacity="0.3" />
  <text x="140" y="260" font-family="Arial, Helvetica, sans-serif" font-size="120" font-weight="900" fill="${palette.light}" opacity="0.18">ADR</text>
  <text x="140" y="1650" font-family="Arial, Helvetica, sans-serif" font-size="34" font-weight="700" fill="${palette.light}" opacity="0.72">FALLBACK ${signature}</text>
</svg>`;
}

async function renderSvgToPng(svgPath, pngPath) {
  const outputDir = path.dirname(pngPath);
  const result = spawnSync("/usr/bin/qlmanage", ["-t", "-s", String(WIDTH), "-o", outputDir, svgPath], {
    encoding: "utf8",
    stdio: "pipe",
  });

  if (result.status !== 0) {
    throw new Error(
      [
        "Failed to render SVG to PNG via qlmanage.",
        result.stdout?.trim() ? `stdout:\n${result.stdout.trim()}` : null,
        result.stderr?.trim() ? `stderr:\n${result.stderr.trim()}` : null,
      ]
        .filter(Boolean)
        .join("\n"),
    );
  }

  const generatedPngPath = path.join(outputDir, `${path.basename(svgPath)}.png`);
  await rename(generatedPngPath, pngPath);
}

async function loadAssetIndex(indexPath) {
  try {
    return JSON.parse(await readFile(indexPath, "utf8"));
  } catch {
    return [];
  }
}

function validateGeneratedAsset({ videoId, assetPath, assetSha, assetIndex }) {
  if (!videoId) {
    throw new Error("Generated visual asset requires a non-empty videoId.");
  }
  if (!text(assetPath).includes(`/generated/${videoId}/`)) {
    throw new Error(`Generated asset path does not include videoId boundary: ${assetPath}`);
  }
  if (text(assetPath).includes("/shotstack-assets/adr-short-video/current/")) {
    throw new Error(`Generated asset path still points to static current slides: ${assetPath}`);
  }
  if (assetIndex.some((entry) => text(entry.asset_path) === assetPath)) {
    throw new Error(`Generated asset path already exists in asset index: ${assetPath}`);
  }
  const lastThree = assetIndex.slice(-3);
  if (lastThree.some((entry) => text(entry.asset_sha256) === assetSha)) {
    throw new Error("Generated visual asset repeats one of the last 3 outputs.");
  }
}

export async function generateQuestionVisualBundle({
  repoRoot,
  baseUrl,
  project = "adr-short-video",
  videoId,
  questionId,
  shortform,
}) {
  const safeVideoId = slugify(videoId);
  if (!safeVideoId) {
    throw new Error("videoId is required for generated visuals.");
  }

  await mkdir(path.join(repoRoot, "public", "generated"), { recursive: true });
  const generatedDir = path.join(repoRoot, "public", "generated", safeVideoId);
  await mkdir(generatedDir, { recursive: false });

  const palette = buildPalette(`${safeVideoId}:${questionId}:${shortform?.hook}:${shortform?.question_short}`);
  const svgPath = path.join(generatedDir, "bg.svg");
  const pngPath = path.join(generatedDir, "bg.png");
  const fallbackSvgPath = path.join(generatedDir, "fallback.svg");
  const fallbackPngPath = path.join(generatedDir, "fallback.png");
  const manifestPath = path.join(generatedDir, "canva_manifest.json");
  const logPath = path.join(generatedDir, "render_log.json");
  const assetIndexPath = path.join(repoRoot, "public", "generated", "asset_index.json");
  const renderLogIndexPath = path.join(repoRoot, "public", "generated", "render_log.ndjson");

  let assetPath = pngPath;
  let assetFileName = "bg.png";
  let fallbackUsed = false;

  try {
    await writeFile(svgPath, `${buildPrimarySvg({ videoId: safeVideoId, questionId, shortform, palette })}\n`, "utf8");
    await renderSvgToPng(svgPath, pngPath);
  } catch {
    fallbackUsed = true;
    await writeFile(fallbackSvgPath, `${buildFallbackSvg({ videoId: safeVideoId, palette })}\n`, "utf8");
    await renderSvgToPng(fallbackSvgPath, fallbackPngPath);
    assetPath = fallbackPngPath;
    assetFileName = "fallback.png";
  }

  const assetBuffer = await readFile(assetPath);
  const assetSha = sha256(assetBuffer);
  const assetUrl = `${String(baseUrl).replace(/\/$/, "")}/generated/${safeVideoId}/${assetFileName}`;
  const assetIndex = await loadAssetIndex(assetIndexPath);

  validateGeneratedAsset({
    videoId: safeVideoId,
    assetPath: assetUrl,
    assetSha,
    assetIndex,
  });

  const manifest = {
    project,
    format: "9:16",
    slides_count: ROLE_ORDER.length,
    mode: "generated-visual-mvp",
    source_type: "generated_visual",
    asset_family: "question_single_background_v1",
    render_family: "Question Card Short",
    batch_id: safeVideoId,
    batch_fingerprint: sha256(
      JSON.stringify({
        video_id: safeVideoId,
        question_id: questionId,
        asset_sha256: assetSha,
      }),
    ),
    updated_at: new Date().toISOString(),
    slides: ROLE_ORDER.map((role, index) => ({
      id: index + 1,
      name: `slide${index + 1}`,
      role,
      url: assetUrl,
      sha256: assetSha,
      width: WIDTH,
      height: HEIGHT,
    })),
  };

  const logEntry = {
    video_id: safeVideoId,
    question_id: text(questionId),
    asset_path: assetUrl,
    asset_sha256: assetSha,
    render_timestamp: new Date().toISOString(),
    fallback_used: fallbackUsed,
  };

  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  await writeFile(logPath, `${JSON.stringify(logEntry, null, 2)}\n`, "utf8");
  await writeFile(assetIndexPath, `${JSON.stringify([...assetIndex, logEntry], null, 2)}\n`, "utf8");
  await appendFile(renderLogIndexPath, `${JSON.stringify(logEntry)}\n`, "utf8");

  return {
    video_id: safeVideoId,
    question_id: text(questionId),
    generated_dir: generatedDir,
    asset_path: assetPath,
    asset_url: assetUrl,
    asset_sha256: assetSha,
    manifest_path: manifestPath,
    log_path: logPath,
    fallback_used: fallbackUsed,
  };
}
