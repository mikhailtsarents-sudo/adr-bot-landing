#!/usr/bin/env node

import { mkdtemp, readFile, rm, stat, writeFile } from "node:fs/promises";
import crypto from "node:crypto";
import { spawnSync } from "node:child_process";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const ROLE_ORDER = ["hook", "question", "answers", "timer", "answer", "cta"];
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

async function validateSceneFiles(sceneRoot, scenes) {
  const resolvedScenes = [];

  for (let i = 0; i < scenes.length; i += 1) {
    const scene = scenes[i];
    const rawPath = scene.input_path || scene.source_path || scene.input_file || scene.source_file;

    if (!rawPath) {
      throw new Error(`Scene ${i + 1} is missing input_path/source_path.`);
    }

    const resolvedPath = path.isAbsolute(rawPath) ? rawPath : path.resolve(sceneRoot, rawPath);
    const fileInfo = await stat(resolvedPath);
    if (!fileInfo.isFile()) {
      throw new Error(`Scene ${i + 1} is not a file: ${resolvedPath}`);
    }

    const buffer = await readFile(resolvedPath);
    assertPngSignature(buffer, resolvedPath);

    const relativePath = path.relative(sceneRoot, resolvedPath);
    if (!relativePath || relativePath.startsWith("..") || path.dirname(relativePath) !== ".") {
      throw new Error(
        `Scene ${i + 1} must live directly inside the scene root: ${resolvedPath} (root: ${sceneRoot})`,
      );
    }

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

  const resolvedSceneRoot = path.resolve(args.sceneRoot || input.scene_root || DEFAULT_SCENE_ROOT);
  const sceneFiles = await validateSceneFiles(resolvedSceneRoot, input.scenes || []);

  const plan = buildPlan(input, resolvedSceneRoot, args.project);
  const planDir = await mkdtemp(path.join(os.tmpdir(), "adr-news-plan-"));
  const planPath = path.join(planDir, "news-plan.json");
  await writeFile(planPath, `${JSON.stringify(plan, null, 2)}\n`, "utf8");

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
      resolvedSceneRoot,
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
      scene_root: resolvedSceneRoot,
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
    console.log(`scene_root=${resolvedSceneRoot}`);
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
