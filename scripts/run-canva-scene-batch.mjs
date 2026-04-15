#!/usr/bin/env node

import {
  copyFile,
  mkdir,
  readFile,
  readdir,
  stat,
  writeFile,
} from "node:fs/promises";
import crypto from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");

const DEFAULT_PROJECT = "adr-short-video";
const DEFAULT_BASE_URL = "https://www.adr-bot.de";
const DEFAULT_INPUT_ROOT = path.join(repoRoot, "canva-exports", DEFAULT_PROJECT);
const DEFAULT_OUTPUT_DIR = path.join(
  repoRoot,
  "public",
  "shotstack-assets",
  DEFAULT_PROJECT,
  "current",
);

const ROLE_ORDER = ["hook", "question", "answers", "timer", "answer", "cta"];
const PNG_SIGNATURE = "89504e470d0a1a0a";
const DEFAULT_SOURCE_TYPE = "stable_storage";

function parseArgs(argv) {
  const args = {
    project: DEFAULT_PROJECT,
    baseUrl: process.env.PUBLIC_BASE_URL || DEFAULT_BASE_URL,
    inputRoot: DEFAULT_INPUT_ROOT,
    outputDir: DEFAULT_OUTPUT_DIR,
    planPath: null,
    verifyRemote: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === "--project") args.project = argv[++i];
    else if (token === "--base-url") args.baseUrl = argv[++i];
    else if (token === "--input-root") args.inputRoot = path.resolve(argv[++i]);
    else if (token === "--output-dir") args.outputDir = path.resolve(argv[++i]);
    else if (token === "--plan") args.planPath = path.resolve(argv[++i]);
    else if (token === "--verify-remote") args.verifyRemote = true;
    else if (token === "--help" || token === "-h") {
      printHelp();
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${token}`);
    }
  }

  return args;
}

function printHelp() {
  console.log(`Usage: npm run run:canva-scene-batch -- [options]

Options:
  --plan <file>        JSON plan with six scene entries and optional page_url/input_path
  --input-root <dir>   Root for relative scene paths or flat PNG fallback
  --output-dir <dir>   Public output folder for normalized slide PNGs
  --project <name>     Project name for manifest (default: ${DEFAULT_PROJECT})
  --base-url <url>     Public base URL for direct PNG links (default: ${DEFAULT_BASE_URL})
  --verify-remote      Verify generated URLs with HTTP 200 and PNG content-type
  --help               Show this help

Expected plan shape:
{
  "project": "adr-short-video",
  "trace_id": "...",
  "scenario_id": "...",
  "brief_id": "...",
  "content_family": "QUESTION",
  "template_family": "Question Card",
  "template_id": "T3",
  "slide_count": 6,
  "mode": "temporary-direct|stable-storage",
  "scenes": [
    {
      "scene_id": 1,
      "role": "hook",
      "page_url": "https://...",
      "input_path": "./local/slide.png",
      "export_name": "slide1.png"
    }
  ]
}
`);
}

function sortNaturally(values) {
  const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: "base" });
  return [...values].sort((a, b) => collator.compare(a, b));
}

function inferRoleFromName(name, fallbackIndex) {
  const lower = name.toLowerCase();
  for (const role of ROLE_ORDER) {
    if (lower.includes(role)) return role;
  }
  return ROLE_ORDER[fallbackIndex] || `scene-${fallbackIndex + 1}`;
}

function roleIndex(role) {
  const index = ROLE_ORDER.indexOf(role);
  return index === -1 ? ROLE_ORDER.length : index;
}

function sortScenesByRole(scenes) {
  return [...scenes].sort((left, right) => {
    const leftRole = left.role || "";
    const rightRole = right.role || "";
    const leftIndex = roleIndex(leftRole);
    const rightIndex = roleIndex(rightRole);

    if (leftIndex !== rightIndex) return leftIndex - rightIndex;
    return (left.scene_id || 0) - (right.scene_id || 0);
  });
}

function sha256(buffer) {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

function deriveBatchFingerprint(payload) {
  return sha256(Buffer.from(JSON.stringify(payload)));
}

function pickPlanMetadata(plan) {
  const metadata = {};
  for (const key of [
    "mode",
    "source_type",
    "asset_source_ref",
    "asset_manifest_ref",
    "asset_family",
    "content_family",
    "render_family",
    "status",
    "approval_state",
    "gpt_scenario_ready",
    "allow_generic_fallback",
  ]) {
    if (plan[key] !== undefined) {
      metadata[key] = plan[key];
    }
  }

  if (metadata.mode === undefined) metadata.mode = "stable-storage";
  if (metadata.source_type === undefined) {
    metadata.source_type =
      metadata.mode === "temporary-direct" ? "canva_direct" : DEFAULT_SOURCE_TYPE;
  }

  return metadata;
}

async function loadJson(filePath) {
  const raw = await readFile(filePath, "utf8");
  return JSON.parse(raw);
}

async function assertPngBuffer(filePath, buffer) {
  const signature = buffer.subarray(0, 8).toString("hex");
  if (signature !== PNG_SIGNATURE) {
    throw new Error(`File is not a valid PNG: ${filePath}`);
  }
}

function readPngDimensions(buffer) {
  if (buffer.length < 24) {
    throw new Error("PNG buffer too small to read dimensions");
  }

  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
  };
}

async function verifyRemoteUrl(url) {
  const response = await fetch(url, {
    method: "GET",
    headers: { Range: "bytes=0-31" },
  });

  if (!response.ok) {
    throw new Error(`Remote verification failed for ${url}: HTTP ${response.status}`);
  }

  const contentType = response.headers.get("content-type") || "";
  if (!contentType.toLowerCase().includes("image/png")) {
    throw new Error(`Remote verification failed for ${url}: content-type ${contentType}`);
  }
}

function resolveMaybeRelativePath(baseDir, inputPath) {
  if (!inputPath) return null;
  return path.isAbsolute(inputPath) ? inputPath : path.resolve(baseDir, inputPath);
}

async function findSinglePngInDir(dirPath) {
  const entries = await readdir(dirPath, { withFileTypes: true });
  const pngFiles = entries
    .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith(".png"))
    .map((entry) => entry.name);

  if (pngFiles.length !== 1) {
    throw new Error(`Expected exactly 1 PNG file in ${dirPath}, found ${pngFiles.length}.`);
  }

  return path.join(dirPath, pngFiles[0]);
}

async function resolveSceneSource(scene, planDir, fallbackIndex, rootDir) {
  const candidates = [
    scene.input_path,
    scene.source_path,
    scene.input_file,
    scene.source_file,
    scene.input_dir,
    scene.source_dir,
  ].filter(Boolean);

  let explicitPath = null;
  if (candidates.length > 0) {
    explicitPath = resolveMaybeRelativePath(planDir, candidates[0]);
  }

  if (explicitPath) {
    const fileStat = await stat(explicitPath);
    if (fileStat.isDirectory()) {
      const pngPath = await findSinglePngInDir(explicitPath);
      return { kind: "local", path: pngPath };
    }
    return { kind: "local", path: explicitPath };
  }

  if (scene.page_url || scene.source_page_url) {
    return { kind: "remote", url: scene.page_url || scene.source_page_url };
  }

  if (rootDir) {
    const dirEntries = await readdir(rootDir, { withFileTypes: true });
    const sceneDirs = dirEntries.filter((entry) => entry.isDirectory());
    if (sceneDirs.length > 0) {
      const sortedDirs = sortNaturally(sceneDirs.map((entry) => entry.name));
      const chosenDir = path.join(rootDir, sortedDirs[fallbackIndex] || sortedDirs[0]);
      const pngPath = await findSinglePngInDir(chosenDir);
      return { kind: "local", path: pngPath };
    }
  }

  throw new Error(
    `Scene ${scene.scene_id || fallbackIndex + 1} has no input_path, no page_url, and no fallback directory source.`,
  );
}

async function loadScenePlan(args) {
  const plan = args.planPath ? await loadJson(args.planPath) : null;
  const planDir = args.planPath ? path.dirname(args.planPath) : repoRoot;

  if (plan) {
    const scenes = Array.isArray(plan.scenes) ? plan.scenes : [];
    if (scenes.length !== 6) {
      throw new Error(`Expected exactly 6 scenes in plan, found ${scenes.length}.`);
    }

    return {
      planDir,
      plan: {
        project: plan.project || args.project,
        trace_id: plan.trace_id || "",
        scenario_id: plan.scenario_id || "",
        brief_id: plan.brief_id || "",
        content_family: plan.content_family || "",
        template_family: plan.template_family || "",
        template_id: plan.template_id || "",
        slide_count: plan.slide_count || 6,
        mode: plan.mode || "stable-storage",
        scenes,
      },
      sourceRoot: plan.scene_root
        ? resolveMaybeRelativePath(planDir, plan.scene_root)
        : args.inputRoot,
    };
  }

  return {
    planDir,
    plan: null,
    sourceRoot: args.inputRoot,
  };
}

async function buildFromPlan(args, loaded) {
  const { plan, planDir, sourceRoot } = loaded;
  const normalizedScenes = [];
  const orderedScenes = sortScenesByRole(plan.scenes);

  for (let i = 0; i < orderedScenes.length; i += 1) {
    const scene = orderedScenes[i];
    const sceneId = scene.scene_id || i + 1;
    const role = scene.role || ROLE_ORDER[i] || inferRoleFromName(`scene-${i + 1}`, i);
    const exportName = scene.export_name || `slide${sceneId}.png`;
    const source = await resolveSceneSource(scene, planDir, i, sourceRoot);

    let buffer;
    let sourcePath = null;
    let sourcePageUrl = scene.page_url || scene.source_page_url || null;

    if (source.kind === "local") {
      sourcePath = source.path;
      buffer = await readFile(sourcePath);
      await assertPngBuffer(sourcePath, buffer);
    } else {
      sourcePageUrl = source.url;
      const response = await fetch(source.url);
      if (!response.ok) {
        throw new Error(`Failed to fetch scene URL ${source.url}: HTTP ${response.status}`);
      }

      const contentType = response.headers.get("content-type") || "";
      if (!contentType.toLowerCase().includes("image/png")) {
        throw new Error(`Scene URL is not a PNG: ${source.url} (${contentType})`);
      }

      const arrayBuffer = await response.arrayBuffer();
      buffer = Buffer.from(arrayBuffer);
      await assertPngBuffer(source.url, buffer);
    }

    const targetName = `slide${sceneId}.png`;
    const targetPath = path.join(args.outputDir, targetName);
    await writeFile(targetPath, buffer);

    const { width, height } = readPngDimensions(buffer);
    const stableUrl = `${args.baseUrl.replace(/\/$/, "")}/${path
      .relative(path.join(repoRoot, "public"), targetPath)
      .split(path.sep)
      .join("/")}`;

    normalizedScenes.push({
      id: sceneId,
      name: `slide${sceneId}`,
      role,
      url: stableUrl,
      sha256: sha256(buffer),
      width,
      height,
      source_design_id: scene.source_design_id || scene.design_id || "",
      source_page_url: sourcePageUrl || "",
      source_path: sourcePath || "",
      export_name: exportName,
    });
  }

  const metadata = pickPlanMetadata(plan);
  const batchFingerprint = deriveBatchFingerprint({
    project: plan.project || args.project,
    trace_id: plan.trace_id || "",
    scenario_id: plan.scenario_id || "",
    brief_id: plan.brief_id || "",
    mode: metadata.mode,
    source_type: metadata.source_type,
    slides: normalizedScenes.map((scene) => ({
      id: scene.id,
      name: scene.name,
      role: scene.role,
      url: scene.url,
      sha256: scene.sha256,
    })),
  });

  return {
    project: plan.project || args.project,
    trace_id: plan.trace_id || "",
    scenario_id: plan.scenario_id || "",
    brief_id: plan.brief_id || "",
    template_family: plan.template_family || "",
    template_id: plan.template_id || "",
    slide_count: plan.slide_count || 6,
    mode: metadata.mode,
    source_type: metadata.source_type,
    asset_source_ref: plan.asset_source_ref || plan.asset_manifest_ref || "",
    asset_manifest_ref: plan.asset_manifest_ref || "",
    asset_family: plan.asset_family || "",
    content_family: plan.content_family || "",
    render_family: plan.render_family || "",
    status: plan.status || "ready",
    approval_state: plan.approval_state || "",
    gpt_scenario_ready: Boolean(plan.gpt_scenario_ready),
    allow_generic_fallback: Boolean(plan.allow_generic_fallback),
    batch_fingerprint: batchFingerprint,
    batch_id: plan.batch_id || batchFingerprint.slice(0, 16),
    source_root: sourceRoot,
    output_dir: args.outputDir,
    updated_at: new Date().toISOString(),
    scenes: normalizedScenes,
  };
}

async function buildFromFlatInput(args) {
  const entries = await readdir(args.inputRoot, { withFileTypes: true });
  const pngFiles = entries
    .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith(".png"))
    .map((entry) => entry.name);

  if (pngFiles.length !== 6) {
    throw new Error(
      `Expected exactly 6 PNG files in ${args.inputRoot}, found ${pngFiles.length}.`,
    );
  }

  const sorted = sortNaturally(pngFiles);
  const normalizedScenes = [];

  for (let i = 0; i < sorted.length; i += 1) {
    const sourceName = sorted[i];
    const sourcePath = path.join(args.inputRoot, sourceName);
    const buffer = await readFile(sourcePath);
    await assertPngBuffer(sourcePath, buffer);

    const targetName = `slide${i + 1}.png`;
    const targetPath = path.join(args.outputDir, targetName);
    await writeFile(targetPath, buffer);

    const { width, height } = readPngDimensions(buffer);
    const stableUrl = `${args.baseUrl.replace(/\/$/, "")}/${path
      .relative(path.join(repoRoot, "public"), targetPath)
      .split(path.sep)
      .join("/")}`;

    normalizedScenes.push({
      id: i + 1,
      name: `slide${i + 1}`,
      role: ROLE_ORDER[i] || inferRoleFromName(sourceName, i),
      url: stableUrl,
      sha256: sha256(buffer),
      width,
      height,
      source_design_id: "",
      source_page_url: "",
      source_path: sourcePath,
      export_name: targetName,
    });
  }

  const batchFingerprint = deriveBatchFingerprint({
    project: args.project,
    mode: "stable-storage",
    source_type: DEFAULT_SOURCE_TYPE,
    slides: normalizedScenes.map((scene) => ({
      id: scene.id,
      name: scene.name,
      role: scene.role,
      url: scene.url,
      sha256: scene.sha256,
    })),
  });

  return {
    project: args.project,
    trace_id: "",
    scenario_id: "",
    brief_id: "",
    template_family: "",
    template_id: "",
    slide_count: normalizedScenes.length,
    mode: "stable-storage",
    source_type: DEFAULT_SOURCE_TYPE,
    asset_source_ref: "",
    asset_manifest_ref: "",
    asset_family: "",
    content_family: "",
    render_family: "",
    status: "ready",
    approval_state: "",
    gpt_scenario_ready: false,
    allow_generic_fallback: false,
    batch_fingerprint: batchFingerprint,
    batch_id: batchFingerprint.slice(0, 16),
    source_root: args.inputRoot,
    output_dir: args.outputDir,
    updated_at: new Date().toISOString(),
    scenes: normalizedScenes,
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const loaded = await loadScenePlan(args);

  await mkdir(args.outputDir, { recursive: true });

  const batch = loaded.plan
    ? await buildFromPlan(args, loaded)
    : await buildFromFlatInput(args);

  const manifest = {
    project: batch.project,
    format: "9:16",
    slides_count: batch.slide_count,
    mode: batch.mode,
    source_type: batch.source_type,
    asset_source_ref: batch.asset_source_ref || undefined,
    asset_manifest_ref: batch.asset_manifest_ref || undefined,
    asset_family: batch.asset_family || undefined,
    render_family: batch.render_family || undefined,
    batch_id: batch.batch_id,
    batch_fingerprint: batch.batch_fingerprint,
    updated_at: batch.updated_at,
    slides: batch.scenes.map((scene) => ({
      id: scene.id,
      name: scene.name,
      role: scene.role,
      url: scene.url,
      sha256: scene.sha256,
      width: scene.width,
      height: scene.height,
      source_design_id: scene.source_design_id || undefined,
      source_page_url: scene.source_page_url || undefined,
    })),
  };

  const batchJson = `${JSON.stringify(batch, null, 2)}\n`;
  const manifestJson = `${JSON.stringify(manifest, null, 2)}\n`;
  const rootBatchPath = path.join(repoRoot, "canva_scene_batch.json");
  const rootManifestPath = path.join(repoRoot, "canva_manifest.json");
  const publicBatchPath = path.join(args.outputDir, "canva_scene_batch.json");
  const publicManifestPath = path.join(args.outputDir, "canva_manifest.json");

  await writeFile(rootBatchPath, batchJson, "utf8");
  await writeFile(publicBatchPath, batchJson, "utf8");
  await writeFile(rootManifestPath, manifestJson, "utf8");
  await writeFile(publicManifestPath, manifestJson, "utf8");

  if (args.verifyRemote) {
    for (const scene of batch.scenes) {
      await verifyRemoteUrl(scene.url);
    }
  }

  for (const scene of batch.scenes) {
    console.log(`scene${scene.id}=${scene.url}`);
  }

  console.log(`scene_batch=${rootBatchPath}`);
  console.log(`manifest=${rootManifestPath}`);
  console.log(`public_scene_batch=${publicBatchPath}`);
  console.log(`public_manifest=${publicManifestPath}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
