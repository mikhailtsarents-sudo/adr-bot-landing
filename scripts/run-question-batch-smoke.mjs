#!/usr/bin/env node

import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import crypto from "node:crypto";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const DEFAULT_INPUT_DIR = path.join(repoRoot, "examples", "question-batch-wave-1");
const DEFAULT_OUTPUT_ROOT = path.join(repoRoot, "render-packages", "question-batch-wave-1");

function parseArgs(argv) {
  const args = {
    inputDir: DEFAULT_INPUT_DIR,
    outputRoot: DEFAULT_OUTPUT_ROOT,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === "--input-dir") args.inputDir = path.resolve(argv[++i]);
    else if (token === "--output-root") args.outputRoot = path.resolve(argv[++i]);
    else if (token === "--help" || token === "-h") {
      console.log("Usage: node scripts/run-question-batch-smoke.mjs [--input-dir <dir>] [--output-root <dir>]");
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${token}`);
    }
  }

  return args;
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

function sha256(payload) {
  return crypto.createHash("sha256").update(payload).digest("hex");
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  await mkdir(args.outputRoot, { recursive: true });

  const inputFiles = (await readdir(args.inputDir))
    .filter((fileName) => fileName.endsWith(".json"))
    .sort();

  const results = [];

  for (const fileName of inputFiles) {
    const inputPath = path.join(args.inputDir, fileName);
    runNodeScript(path.join(repoRoot, "scripts", "run-question-render-package.mjs"), [
      "--input",
      inputPath,
      "--output-root",
      args.outputRoot,
    ]);

    const inputJson = await loadJson(inputPath);
    const slug = `${inputJson.source_id}-${inputJson.source_id}-render-01`;
    const packageDir = path.join(args.outputRoot, slug);
    const scenario = await loadJson(path.join(packageDir, "scenario.json"));
    const publishReady = await loadJson(path.join(packageDir, "publish_ready_package.json"));
    const shotstackInput = await loadJson(path.join(packageDir, "shotstack_input.json"));
    const renderPayload = await loadJson(path.join(packageDir, "shotstack_render_payload.json"));
    const subtitlesSrt = await readFile(path.join(packageDir, "subtitles.srt"), "utf8");

    results.push({
      source_id: inputJson.source_id,
      question_text: inputJson.payload.question_text,
      title: publishReady.title,
      caption_text: publishReady.caption_text,
      subtitles_path: publishReady.subtitles_srt,
      subtitle_policy: shotstackInput.subtitle_policy,
      subtitle_refs_present: shotstackInput.timeline.every((scene) => scene.subtitle_ref === "subtitles.srt"),
      subtitle_track_ref: shotstackInput.text_tracks?.[0]?.srt_ref || "",
      subtitle_entries: subtitlesSrt
        .trim()
        .split(/\n\n+/)
        .filter(Boolean).length,
      payload_hash: sha256(JSON.stringify(renderPayload)),
      overlay_track_count: Array.isArray(renderPayload.timeline?.tracks) ? renderPayload.timeline.tracks.length : 0,
    });
  }

  const summaryPath = path.join(args.outputRoot, "batch_summary.json");
  await writeFile(summaryPath, `${JSON.stringify({ count: results.length, results }, null, 2)}\n`, "utf8");

  console.log(`input_count=${inputFiles.length}`);
  console.log(`output_root=${args.outputRoot}`);
  console.log(`summary=${summaryPath}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
