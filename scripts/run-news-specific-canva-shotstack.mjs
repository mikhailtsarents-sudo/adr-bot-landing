#!/usr/bin/env node

import { mkdtemp, readFile, rm, stat, writeFile, mkdir, rename } from "node:fs/promises";
import crypto from "node:crypto";
import { spawnSync } from "node:child_process";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const ROLE_ORDER = ["hook", "question", "answers", "timer", "answer", "cta"];
const WIDTH = 1080;
const HEIGHT = 1920;
const DEFAULT_PROJECT = "adr-short-video";
const DEFAULT_OUTPUT_DIR = path.join(
  repoRoot,
  "public",
  "shotstack-assets",
  DEFAULT_PROJECT,
  "current",
);
const DEFAULT_SCENE_ROOT = path.join(repoRoot, "canva-exports", DEFAULT_PROJECT);

function printHelp() {
  console.log(`Usage: npm run run:news-specific-canva-shotstack -- --input <news-package.json> [options]

Options:
  --input <file>        Approved NEWS package JSON
  --scene-root <dir>    Directory containing the six source PNGs (default: ${DEFAULT_SCENE_ROOT})
  --output-dir <dir>    Stable-storage output directory (default: ${DEFAULT_OUTPUT_DIR})
  --project <name>      Project name for runner/manifests (default: ${DEFAULT_PROJECT})
  --base-url <url>      Public base URL for generated URLs
  --verify-remote       Verify generated URLs with HTTP 200 and PNG content-type
  --keep-plan           Keep the generated temporary plan file
  --help                Show this help

Expected NEWS package fields:
  trace_id, news_id, news_version, scenario_id, approval_state, gpt_scenario_ready,
  render_family, template_family, template_id, asset_format_target,
  allow_template_fallback=false, allow_generic_fallback=false, scenes[6]
`);
}

function parseArgs(argv) {
  const args = {
    inputPath: null,
    sceneRoot: process.env.CANVA_NEWS_SCENE_ROOT || DEFAULT_SCENE_ROOT,
    outputDir: process.env.CANVA_NEWS_OUTPUT_DIR || DEFAULT_OUTPUT_DIR,
    project: process.env.CANVA_NEWS_PROJECT || DEFAULT_PROJECT,
    baseUrl: process.env.PUBLIC_BASE_URL || "https://www.adr-bot.de",
    keepPlan: false,
    verifyRemote: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === "--input") args.inputPath = path.resolve(argv[++i]);
    else if (token === "--scene-root") args.sceneRoot = path.resolve(argv[++i]);
    else if (token === "--output-dir") args.outputDir = path.resolve(argv[++i]);
    else if (token === "--project") args.project = argv[++i];
    else if (token === "--base-url") args.baseUrl = argv[++i];
    else if (token === "--verify-remote") args.verifyRemote = true;
    else if (token === "--keep-plan") args.keepPlan = true;
    else if (token === "--help" || token === "-h") {
      printHelp();
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${token}`);
    }
  }

  if (!args.inputPath) {
    throw new Error("Missing --input <news-package.json>.");
  }

  return args;
}

function sha256(buffer) {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

function text(value) {
  return value == null ? "" : String(value).trim();
}

function escapeXml(value) {
  return text(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function wrapText(value, maxChars) {
  const words = text(value).split(/\s+/).filter(Boolean);
  const lines = [];
  let current = "";
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length > maxChars && current) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);
  return lines.slice(0, 8);
}

function rolePalette(role) {
  const map = {
    hook: { bgA: "#0b1f3a", bgB: "#143e72", accent: "#4cc9f0", badge: "ADR NEWS", badgeBg: "#0f6db2" },
    question: { bgA: "#11253f", bgB: "#244b78", accent: "#ffd166", badge: "WAS IST JETZT WICHTIG", badgeBg: "#8d6a00" },
    answers: { bgA: "#10212c", bgB: "#1b4457", accent: "#80ed99", badge: "KURZ ERKLÄRT", badgeBg: "#0f6b3d" },
    timer: { bgA: "#1d1930", bgB: "#41306b", accent: "#ff9f1c", badge: "MERKEN", badgeBg: "#9a4d00" },
    answer: { bgA: "#1c2333", bgB: "#28527a", accent: "#c7f464", badge: "PRAKTISCHE FOLGE", badgeBg: "#43611b" },
    cta: { bgA: "#072d53", bgB: "#0a5ba8", accent: "#7dd3fc", badge: "TELEGRAM BOT", badgeBg: "#0c7bc4" },
  };
  return map[role] || map.answers;
}

function buildNewsSlideSvg({ role, copyText }) {
  const palette = rolePalette(role);
  const titleLines = wrapText(copyText, role === "answers" ? 22 : 18);
  const fontSize = role === "answers" ? 68 : 80;
  const lineGap = role === "answers" ? 88 : 104;
  const textY = role === "cta" ? 1180 : 900;
  const textBlock = titleLines
    .map((line, index) => `<text x="108" y="${textY + index * lineGap}" font-family="Arial, Helvetica, sans-serif" font-size="${fontSize}" font-weight="800" fill="#ffffff">${escapeXml(line)}</text>`)
    .join("\n  ");

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${palette.bgA}" />
      <stop offset="100%" stop-color="${palette.bgB}" />
    </linearGradient>
    <radialGradient id="glow" cx="20%" cy="10%" r="80%">
      <stop offset="0%" stop-color="${palette.accent}" stop-opacity="0.35" />
      <stop offset="100%" stop-color="${palette.accent}" stop-opacity="0" />
    </radialGradient>
  </defs>
  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#bg)" />
  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#glow)" />
  <circle cx="930" cy="280" r="220" fill="${palette.accent}" opacity="0.18" />
  <circle cx="140" cy="1710" r="180" fill="${palette.accent}" opacity="0.12" />
  <rect x="72" y="86" width="936" height="1748" rx="42" fill="#07131f" opacity="0.18" stroke="rgba(255,255,255,0.08)" />
  <rect x="108" y="132" width="420" height="66" rx="18" fill="${palette.badgeBg}" />
  <text x="136" y="178" font-family="Arial, Helvetica, sans-serif" font-size="32" font-weight="800" fill="#ffffff">${escapeXml(palette.badge)}</text>
  <rect x="108" y="250" width="864" height="8" rx="4" fill="${palette.accent}" opacity="0.9" />
  ${textBlock}
  <text x="108" y="1738" font-family="Arial, Helvetica, sans-serif" font-size="28" font-weight="700" fill="#dbeafe" opacity="0.92">ADR Bot · News Short</text>
</svg>`;
}

async function renderSvgToPng(svgPath, pngPath) {
  const outputDir = path.dirname(pngPath);
  const qlmanageResult = spawnSync("/usr/bin/qlmanage", ["-t", "-s", String(WIDTH), "-o", outputDir, svgPath], {
    encoding: "utf8",
    stdio: "pipe",
  });

  if (qlmanageResult.status === 0) {
    const generatedPngPath = path.join(outputDir, `${path.basename(svgPath)}.png`);
    await rename(generatedPngPath, pngPath);
    return;
  }

  const rsvgResult = spawnSync("rsvg-convert", [
    "-w",
    String(WIDTH),
    "-h",
    String(HEIGHT),
    "-o",
    pngPath,
    svgPath,
  ], {
    encoding: "utf8",
    stdio: "pipe",
  });

  if (rsvgResult.status === 0) {
    return;
  }

  throw new Error(
    [
      "Failed to render NEWS SVG to PNG.",
      qlmanageResult.stdout?.trim() ? `qlmanage stdout:\n${qlmanageResult.stdout.trim()}` : null,
      qlmanageResult.stderr?.trim() ? `qlmanage stderr:\n${qlmanageResult.stderr.trim()}` : null,
      rsvgResult.stdout?.trim() ? `rsvg-convert stdout:\n${rsvgResult.stdout.trim()}` : null,
      rsvgResult.stderr?.trim() ? `rsvg-convert stderr:\n${rsvgResult.stderr.trim()}` : null,
    ].filter(Boolean).join("\n"),
  );
}

function roleIndex(role) {
  const index = ROLE_ORDER.indexOf(role);
  return index === -1 ? ROLE_ORDER.length : index;
}

function sortScenes(scenes) {
  return [...scenes].sort((left, right) => {
    const leftIndex = roleIndex(left.role);
    const rightIndex = roleIndex(right.role);
    if (leftIndex !== rightIndex) return leftIndex - rightIndex;
    return (left.scene_id || 0) - (right.scene_id || 0);
  });
}

function requireBooleanFalse(value, name) {
  if (value !== false) {
    throw new Error(`Expected ${name} to be false.`);
  }
}

function assertPngSignature(buffer, filePath) {
  const signature = buffer.subarray(0, 8).toString("hex");
  if (signature !== "89504e470d0a1a0a") {
    throw new Error(`Scene input is not a PNG: ${filePath}`);
  }
}

function runNodeScript(scriptPath, scriptArgs) {
  const result = spawnSync(process.execPath, [scriptPath, ...scriptArgs], {
    cwd: repoRoot,
    encoding: "utf8",
    stdio: "pipe",
  });

  if (result.status !== 0) {
    throw new Error(
      [
        `Script failed: ${path.basename(scriptPath)}`,
        result.stdout?.trim() ? `stdout:\n${result.stdout.trim()}` : null,
        result.stderr?.trim() ? `stderr:\n${result.stderr.trim()}` : null,
      ]
        .filter(Boolean)
        .join("\n"),
    );
  }

  return result.stdout.trim();
}

async function loadJson(filePath) {
  return JSON.parse(await readFile(filePath, "utf8"));
}

async function synthesizeSceneFiles(sceneRoot, scenes) {
  const resolvedScenes = [];
  await mkdir(sceneRoot, { recursive: true });

  for (let i = 0; i < scenes.length; i += 1) {
    const scene = scenes[i];
    const rawPath = scene.input_path || scene.source_path || scene.input_file || scene.source_file || `slide${i + 1}.png`;
    const resolvedPath = path.isAbsolute(rawPath) ? rawPath : path.resolve(sceneRoot, rawPath);
    const svgPath = resolvedPath.replace(/\.png$/i, ".svg");
    const svg = buildNewsSlideSvg({
      role: scene.role || ROLE_ORDER[i],
      copyText: scene.copy_text || scene.copy || scene.text || scene.role || `Slide ${i + 1}`,
    });
    await writeFile(svgPath, svg, "utf8");
    await renderSvgToPng(svgPath, resolvedPath);
    const fileInfo = await stat(resolvedPath);
    if (!fileInfo.isFile()) {
      throw new Error(`Synthesized NEWS scene ${i + 1} is not a file: ${resolvedPath}`);
    }
    const buffer = await readFile(resolvedPath);
    assertPngSignature(buffer, resolvedPath);

    resolvedScenes.push({
      scene,
      resolvedPath,
      buffer,
    });
  }

  return resolvedScenes;
}

function buildPlan(input, sceneRoot, project) {
  const orderedScenes = sortScenes(input.scenes || []);

  if (orderedScenes.length !== 6) {
    throw new Error(`Expected exactly 6 scenes, found ${orderedScenes.length}.`);
  }

  const normalizedScenes = orderedScenes.map((scene, index) => {
    const role = scene.role || ROLE_ORDER[index];
    if (!ROLE_ORDER.includes(role)) {
      throw new Error(`Unknown scene role: ${role}`);
    }

    const resolvedPath = path.isAbsolute(scene.input_path || scene.source_path || "")
      ? path.resolve(scene.input_path || scene.source_path || "")
      : path.resolve(sceneRoot, scene.input_path || scene.source_path || "");
    const exportName = scene.export_name || `slide${index + 1}.png`;

    return {
      scene_id: index + 1,
      role,
      input_path: resolvedPath,
      export_name: exportName,
      source_design_id: scene.source_design_id || scene.design_id || "",
      source_page_url: scene.page_url || scene.source_page_url || "",
    };
  });

  const normalizedRoles = normalizedScenes.map((scene) => scene.role);
  const uniqueRoles = new Set(normalizedRoles);
  if (uniqueRoles.size !== ROLE_ORDER.length || !ROLE_ORDER.every((role) => uniqueRoles.has(role))) {
    throw new Error(`NEWS package must contain exactly one of each role: ${ROLE_ORDER.join(", ")}`);
  }

  const sceneFingerprint = sha256(
    Buffer.from(
      JSON.stringify(
        normalizedScenes.map((scene) => ({
          scene_id: scene.scene_id,
          role: scene.role,
          input_path: scene.input_path,
          export_name: scene.export_name,
          source_design_id: scene.source_design_id,
          source_page_url: scene.source_page_url,
        })),
      ),
    ),
  );

  return {
    project,
    trace_id: input.trace_id || "",
    news_id: input.news_id || "",
    news_version: input.news_version || "",
    scenario_id: input.scenario_id || "",
    brief_id: input.brief_id || "",
    content_family: "NEWS",
    template_family: input.template_family || "News Card",
    template_id: input.template_id || "",
    slide_count: 6,
    mode: "stable-storage",
    source_type: "stable_storage",
    asset_source_ref: sceneRoot,
    asset_manifest_ref: path.join(repoRoot, "canva_manifest.json"),
    asset_family: input.asset_format_target || "news_card_short_v1",
    render_family: input.render_family || "News Card",
    status: "ready",
    approval_state: input.approval_state || "",
    gpt_scenario_ready: Boolean(input.gpt_scenario_ready),
    allow_template_fallback: Boolean(input.allow_template_fallback),
    allow_generic_fallback: Boolean(input.allow_generic_fallback),
    batch_id: input.batch_id || sceneFingerprint,
    batch_fingerprint: sceneFingerprint,
    source_root: sceneRoot,
    scenes: normalizedScenes,
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const input = await loadJson(args.inputPath);

  if (input.approval_state !== "approved") {
    throw new Error("NEWS package must be approved before execution.");
  }
  if (input.gpt_scenario_ready !== true) {
    throw new Error("NEWS package must be marked gpt_scenario_ready=true.");
  }
  if (!input.news_id || !input.news_version || !input.scenario_id || !input.trace_id) {
    throw new Error("NEWS package is missing trace_id, news_id, news_version, or scenario_id.");
  }
  if ((input.render_family || "").trim() !== "News Card") {
    throw new Error("NEWS package must target render_family=News Card.");
  }
  if ((input.template_family || "").trim() !== "News Card") {
    throw new Error("NEWS package must target template_family=News Card.");
  }
  if (!input.asset_format_target) {
    throw new Error("NEWS package is missing asset_format_target.");
  }
  requireBooleanFalse(input.allow_template_fallback, "allow_template_fallback");
  requireBooleanFalse(input.allow_generic_fallback, "allow_generic_fallback");

  const requestedSceneRoot = path.resolve(args.sceneRoot || input.scene_root || DEFAULT_SCENE_ROOT);
  const plan = buildPlan(input, requestedSceneRoot, args.project);
  const planDir = await mkdtemp(path.join(os.tmpdir(), "adr-news-plan-"));
  const synthesizedSceneRoot = path.join(planDir, "generated-news-scenes");
  const planWithGeneratedScenes = {
    ...plan,
    source_root: synthesizedSceneRoot,
    asset_source_ref: synthesizedSceneRoot,
    scenes: plan.scenes.map((scene, index) => ({
      ...scene,
      input_path: path.join(synthesizedSceneRoot, `slide${index + 1}.png`),
      copy_text:
        input.scenes?.[index]?.copy_text ||
        input.scenes?.find((candidate) => candidate.role === scene.role)?.copy_text ||
        scene.role,
    })),
  };
  const sceneFiles = await synthesizeSceneFiles(synthesizedSceneRoot, planWithGeneratedScenes.scenes);
  const planPath = path.join(planDir, "news-plan.json");
  await writeFile(planPath, `${JSON.stringify(planWithGeneratedScenes, null, 2)}\n`, "utf8");

  try {
    runNodeScript(path.join(repoRoot, "scripts", "run-canva-scene-batch.mjs"), [
      "--plan",
      planPath,
      "--output-dir",
      args.outputDir,
      "--project",
      args.project,
      "--base-url",
      args.baseUrl,
      ...(args.verifyRemote ? ["--verify-remote"] : []),
    ]);

    runNodeScript(path.join(repoRoot, "scripts", "generate-canva-manifest.mjs"), [
      "--input",
      synthesizedSceneRoot,
      "--output",
      args.outputDir,
      "--project",
      args.project,
      "--base-url",
      args.baseUrl,
      ...(args.verifyRemote ? ["--verify-remote"] : []),
    ]);

    const batchPath = path.join(repoRoot, "canva_scene_batch.json");
    const manifestPath = path.join(repoRoot, "canva_manifest.json");
    const batch = await loadJson(batchPath);
    const manifest = await loadJson(manifestPath);

    if (batch.allow_generic_fallback !== false) {
      throw new Error("Batch output must keep allow_generic_fallback=false.");
    }

    const batchScenes = Array.isArray(batch.scenes) ? batch.scenes : [];
    const manifestSlides = Array.isArray(manifest.slides) ? manifest.slides : [];
    if (batchScenes.length !== 6) {
      throw new Error(`Batch output must contain 6 scenes, found ${batchScenes.length}.`);
    }
    if (manifestSlides.length !== 6) {
      throw new Error(`Manifest must contain 6 slides, found ${manifestSlides.length}.`);
    }
    for (let i = 0; i < ROLE_ORDER.length; i += 1) {
      const expectedRole = ROLE_ORDER[i];
      if ((batchScenes[i]?.role || "") !== expectedRole) {
        throw new Error(`Batch scene ${i + 1} role mismatch: expected ${expectedRole}.`);
      }
      if ((manifestSlides[i]?.role || "") !== expectedRole) {
        throw new Error(`Manifest slide ${i + 1} role mismatch: expected ${expectedRole}.`);
      }
    }
    if (args.verifyRemote) {
      if (manifest?.verification?.sync_state !== "ready" || manifest?.verification?.ready_for_shotstack !== true) {
        throw new Error("Manifest did not reach ready sync state.");
      }
    }

    const summary = {
      trace_id: input.trace_id,
      news_id: input.news_id,
      news_version: input.news_version,
      scenario_id: input.scenario_id,
      approval_state: input.approval_state,
      gpt_scenario_ready: Boolean(input.gpt_scenario_ready),
      render_family: input.render_family,
      template_family: input.template_family,
      template_id: input.template_id,
      asset_format_target: input.asset_format_target,
      scene_count: sceneFiles.length,
      scene_roles: batchScenes.map((scene) => scene.role),
      scene_root: synthesizedSceneRoot,
      output_dir: args.outputDir,
      remote_verification_requested: Boolean(args.verifyRemote),
      verification_mode: args.verifyRemote ? "remote" : "local_smoke",
      batch_path: batchPath,
      manifest_path: manifestPath,
      scene_batch_fingerprint: batch.batch_fingerprint || "",
      manifest_batch_fingerprint: manifest.batch_fingerprint || "",
      ready_for_shotstack: Boolean(manifest?.verification?.ready_for_shotstack),
      validation_status: "pass",
      created_at: new Date().toISOString(),
    };
    const summaryPath = path.join(args.outputDir, "news_run_summary.json");
    await writeFile(summaryPath, `${JSON.stringify(summary, null, 2)}\n`, "utf8");

    console.log(`news_id=${input.news_id}`);
    console.log(`scene_root=${synthesizedSceneRoot}`);
    console.log(`batch=${batchPath}`);
    console.log(`manifest=${manifestPath}`);
    console.log(`summary=${summaryPath}`);
    console.log(`ready_for_shotstack=${manifest.verification.ready_for_shotstack ? "true" : "false"}`);
    console.log(`scene_batch_fingerprint=${batch.batch_fingerprint || ""}`);
    console.log(`manifest_batch_fingerprint=${manifest.batch_fingerprint || ""}`);
    console.log(`scene_count=${sceneFiles.length}`);
  } finally {
    if (!args.keepPlan) {
      await rm(planDir, { recursive: true, force: true });
    }
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
