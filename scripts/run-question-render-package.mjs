#!/usr/bin/env node

import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import {
  buildQuestionQaReport,
  buildQuestionShortformContract,
} from "./render/question-quality.mjs";
import { generateQuestionVisualBundle } from "./render/generate-question-visual-assets.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const DEFAULT_INPUT_PATH = path.join(
  repoRoot,
  "examples",
  "question-driver-documents-source.json",
);
const DEFAULT_SCENE_ROOT = path.join(repoRoot, "canva-exports", "adr-short-video");
const DEFAULT_OUTPUT_ROOT = path.join(repoRoot, "render-packages");
const DEFAULT_PROJECT = "adr-short-video";
const DEFAULT_BASE_URL = "https://www.adr-bot.de";
const DEFAULT_HEYGEN_MANIFEST_PATH = path.join(
  repoRoot,
  "public",
  "heygen-assets",
  "adr-heygen-video",
  "current",
  "heygen_manifest.json",
);

function printHelp() {
  console.log(`Usage: node scripts/run-question-render-package.mjs [options]

Options:
  --input <file>         QUESTION source JSON (default: ${DEFAULT_INPUT_PATH})
  --scene-root <dir>     Legacy static scene root (deprecated for QUESTION MVP dynamic visuals)
  --output-root <dir>    Output root for generated render package files (default: ${DEFAULT_OUTPUT_ROOT})
  --project <name>       Canva/asset project name (default: ${DEFAULT_PROJECT})
  --base-url <url>       Public base URL for stable asset URLs (default: ${DEFAULT_BASE_URL})
  --heygen-manifest <f>  HeyGen manifest for talking-head asset selection (default: ${DEFAULT_HEYGEN_MANIFEST_PATH})
  --verify-remote        Verify generated PNG URLs with remote HTTP checks
  --keep-temp            Keep temporary plan/package files
  --help                 Show this help
`);
}

function parseArgs(argv) {
  const args = {
    inputPath: DEFAULT_INPUT_PATH,
    sceneRoot: DEFAULT_SCENE_ROOT,
    outputRoot: DEFAULT_OUTPUT_ROOT,
    project: DEFAULT_PROJECT,
    baseUrl: DEFAULT_BASE_URL,
    heygenManifestPath: DEFAULT_HEYGEN_MANIFEST_PATH,
    keepTemp: false,
    verifyRemote: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === "--input") args.inputPath = path.resolve(argv[++i]);
    else if (token === "--scene-root") args.sceneRoot = path.resolve(argv[++i]);
    else if (token === "--output-root") args.outputRoot = path.resolve(argv[++i]);
    else if (token === "--project") args.project = argv[++i];
    else if (token === "--base-url") args.baseUrl = argv[++i];
    else if (token === "--heygen-manifest") args.heygenManifestPath = path.resolve(argv[++i]);
    else if (token === "--verify-remote") args.verifyRemote = true;
    else if (token === "--keep-temp") args.keepTemp = true;
    else if (token === "--help" || token === "-h") {
      printHelp();
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${token}`);
    }
  }

  return args;
}

async function loadJson(filePath) {
  return JSON.parse(await readFile(filePath, "utf8"));
}

function text(value) {
  return value == null ? "" : String(value).trim();
}

function slugify(value) {
  return text(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function shortenQuestionForHook(value, limit = 72) {
  const source = text(value);
  if (!source || source.length <= limit) {
    return source;
  }

  const slice = source.slice(0, limit + 1);
  const lastBoundary = Math.max(slice.lastIndexOf(" "), slice.lastIndexOf("?"));
  const shortened = (lastBoundary > 20 ? slice.slice(0, lastBoundary) : source.slice(0, limit)).trimEnd();
  return shortened.endsWith("?") ? shortened : `${shortened}?`;
}

function resolveTalkingHeadAsset(manifest, baseUrl) {
  const videos = Array.isArray(manifest?.videos) ? manifest.videos : [];
  const preferred =
    videos.find((video) => text(video.name) === "video2") ||
    videos.find((video) => Number(video.latest_rank) === 1) ||
    videos[0];

  if (!preferred || !text(preferred.name)) {
    return {
      talkingHeadUrl: "",
      talkingHeadAssetName: "",
    };
  }

  return {
    talkingHeadAssetName: text(preferred.name),
    talkingHeadUrl: `${String(baseUrl).replace(/\/$/, "")}/heygen-assets/adr-heygen-video/current/${text(
      preferred.name,
    )}.mp4`,
  };
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

function buildClassification(questionInput) {
  const sourceId = text(questionInput.source_id);
  const category = text(questionInput.payload?.category) || "general";
  const shortform = buildQuestionShortformContract(questionInput);
  return {
    source_type: "QUESTION",
    source_id: sourceId,
    source_family: "QUESTION",
    template_id: "T1",
    template_variant: shortform.template_variant,
    fallback_template_variant: shortform.fallback_template_variant,
    language_base: text(questionInput.base_lang) || "de",
    editorial_angle: "direct_exam_question",
    render_priority: "normal",
    analytics_tag: `question_${category}_${sourceId}`,
  };
}

function buildScenario(questionInput, classification) {
  const questionText = text(questionInput.payload?.question_text);
  const correctAnswer = text(questionInput.payload?.correct_answer);
  const explanation = text(questionInput.payload?.simple_explanation);
  const sourceId = text(questionInput.source_id);
  const traceId = `${sourceId}-run-01`;
  const shortform = buildQuestionShortformContract(questionInput);
  const shortenedHook = shortform.hook || shortenQuestionForHook(questionText);

  return {
    trace_id: traceId,
    scenario_id: `${sourceId}-scn-01`,
    source_type: "QUESTION",
    source_id: sourceId,
    source_family: classification.source_family,
    template_id: classification.template_id,
    template_variant: classification.template_variant,
    fallback_template_variant: classification.fallback_template_variant,
    content_family: "QUESTION",
    language_base: classification.language_base,
    target_language: text(questionInput.target_lang) || "ru",
    audience: text(questionInput.audience) || "ADR",
    difficulty: text(questionInput.difficulty) || "easy",
    render_priority: classification.render_priority,
    hook_text: shortenedHook,
    question_short: shortform.question_short,
    answers_short: shortform.answers_short,
    correct_short: shortform.correct_short,
    explanation_short: shortform.explanation_short,
    scene_plan: [
      { id: 1, role: "hook", text: shortenedHook },
      { id: 2, role: "question", text: shortform.question_short || questionText },
      {
        id: 3,
        role: "answers",
        text: (shortform.answers_short || [])
          .map((item, index) => `${String.fromCharCode(65 + index)}: ${item}`)
          .join("\n"),
      },
      { id: 4, role: "timer", text: "3 Sekunden überlegen" },
      { id: 5, role: "answer", text: `Richtig ist ${shortform.correct_short || correctAnswer}` },
      { id: 6, role: "cta", text: shortform.cta },
    ],
    body_blocks: [questionText, correctAnswer, explanation].filter(Boolean),
    core_answer: correctAnswer,
    short_explanation: explanation,
    cta_text: shortform.cta,
    caption_text: `ADR Grundfrage: ${shortenedHook}`,
    hashtags: ["#ADR", "#Gefahrgut", "#LKW"],
    tone: "klar_und_ruhig",
    visual_direction: "question_card_vertical",
    analytics_tag: classification.analytics_tag,
    shortform_contract: shortform,
  };
}

function buildRenderTask(questionInput, scenario, talkingHead) {
  const shortenedTitle = text(scenario.hook_text);
  const correctAnswer = text(questionInput.payload?.correct_answer);
  const explanation = text(questionInput.payload?.simple_explanation);
  const retryPolicy = {
    max_attempts: 3,
    retryable_attempts: 2,
    retry_on: ["transport_error", "timeout", "http_5xx"],
    terminal_on: ["validation_error", "missing_required_asset"],
  };
  const fallbackPolicy = {
    mode: "text_only_question_short",
    allowed_on_final_attempt: true,
    preserve_publish_target: "youtube_shorts",
    preserve_render_family: "Question Card Short",
    preserve_trace_id: true,
    preserve_source_id: true,
  };

  return {
    trace_id: scenario.trace_id,
    scenario_id: scenario.scenario_id,
    render_task_id: `${text(questionInput.source_id)}-render-01`,
    source_type: "QUESTION",
    source_id: text(questionInput.source_id),
    source_family: "QUESTION",
    content_family: "QUESTION",
    template_id: "T1",
    template_variant: text(scenario.template_variant) || "quiz_standard",
    fallback_template_variant: text(scenario.fallback_template_variant) || "quiz_safe",
    render_family: "Question Card Short",
    title: shortenedTitle,
    description: [
      `${shortenedTitle}`,
      correctAnswer,
      explanation,
      "",
      "Mehr ADR-Fragen direkt im Telegram-Bot: @Adr_wort_trainer_bot",
    ]
      .filter(Boolean)
      .join("\n"),
    caption_text: scenario.caption_text,
    cta_text: scenario.cta_text,
    scene_plan: scenario.scene_plan,
    shortform_contract: scenario.shortform_contract,
    retry_policy: retryPolicy,
    fallback_policy: fallbackPolicy,
    hashtags: scenario.hashtags,
    analytics_tag: scenario.analytics_tag,
    language: "de",
    visibility: "public",
    duration_target_sec: 10,
    subtitle_policy: "burned_or_external_srt",
    audio_policy: talkingHead.talkingHeadUrl ? "embedded_avatar_audio" : "none_for_first_visual_test",
    voice_mode: talkingHead.talkingHeadUrl ? "heygen_avatar" : "none",
    talking_head_url: talkingHead.talkingHeadUrl,
    talking_head_asset_name: talkingHead.talkingHeadAssetName,
    source_title: `QUESTION source: ${shortenedTitle}`,
    source_url: "https://www.adr-bot.de/adr-pruefung-auf-deutsch",
    source_name: "Content Engine QUESTION render package runner",
    topic_type: "question",
    publish_target: "youtube_shorts",
    publish_adapter: "youtube_short_adapter",
    approval_state: "approved",
    publish_state: "publish_ready",
    delivery_state: "not_sent",
    render_status: "assets_packaged",
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const questionInput = await loadJson(args.inputPath);
  const heygenManifest = await loadJson(args.heygenManifestPath);

  if (text(questionInput.source_type) !== "QUESTION") {
    throw new Error("Input must be a QUESTION source package.");
  }
  if (!text(questionInput.payload?.question_text) || !text(questionInput.payload?.correct_answer)) {
    throw new Error("QUESTION input is missing question_text or correct_answer.");
  }

  const classification = buildClassification(questionInput);
  const scenario = buildScenario(questionInput, classification);
  const talkingHead = resolveTalkingHeadAsset(heygenManifest, args.baseUrl);
  const renderTask = buildRenderTask(questionInput, scenario, talkingHead);
  const qaReport = buildQuestionQaReport({
    shortform: scenario.shortform_contract,
    templateVariant: renderTask.template_variant,
    fallbackTemplateVariant: renderTask.fallback_template_variant,
  });
  const slug = slugify(`${questionInput.source_id}-${renderTask.render_task_id}`) || "question-render-package";

  const tempDir = await mkdtemp(path.join(os.tmpdir(), "adr-question-render-"));
  const packagePath = path.join(tempDir, "question-render-package.json");
  const outputDir = path.join(args.outputRoot, slug);
  const videoId = `${slug}-${Date.now()}`;
  const visualBundle = await generateQuestionVisualBundle({
    repoRoot,
    baseUrl: args.baseUrl,
    project: args.project,
    videoId,
    questionId: text(questionInput.source_id),
    shortform: scenario.shortform_contract,
  });
  await writeFile(packagePath, `${JSON.stringify(renderTask, null, 2)}\n`, "utf8");

  try {
    runNodeScript(path.join(repoRoot, "scripts", "build-render-package.mjs"), [
      "--input",
      packagePath,
      "--manifest",
      visualBundle.manifest_path,
      "--output-root",
      args.outputRoot,
      "--slug",
      slug,
    ]);

    await mkdir(outputDir, { recursive: true });
    await writeFile(path.join(outputDir, "question_source.json"), `${JSON.stringify(questionInput, null, 2)}\n`, "utf8");
    await writeFile(path.join(outputDir, "classification.json"), `${JSON.stringify(classification, null, 2)}\n`, "utf8");
    await writeFile(path.join(outputDir, "scenario.json"), `${JSON.stringify(scenario, null, 2)}\n`, "utf8");
    await writeFile(path.join(outputDir, "shortform_contract.json"), `${JSON.stringify(scenario.shortform_contract, null, 2)}\n`, "utf8");
    await writeFile(path.join(outputDir, "qa_report.json"), `${JSON.stringify(qaReport, null, 2)}\n`, "utf8");
    await writeFile(path.join(outputDir, "render_task.json"), `${JSON.stringify(renderTask, null, 2)}\n`, "utf8");
    await writeFile(path.join(outputDir, "generated_visual.json"), `${JSON.stringify(visualBundle, null, 2)}\n`, "utf8");

    console.log(`slug=${slug}`);
    console.log(`output_dir=${outputDir}`);
    console.log(`trace_id=${scenario.trace_id}`);
    console.log(`scenario=${path.join(outputDir, "scenario.json")}`);
    console.log(`qa_report=${path.join(outputDir, "qa_report.json")}`);
    console.log(`render_task=${path.join(outputDir, "render_task.json")}`);
    console.log(`generated_visual=${path.join(outputDir, "generated_visual.json")}`);
    console.log(`publish_ready=${path.join(outputDir, "publish_ready_package.json")}`);
    console.log(`g3_bridge_row=${path.join(outputDir, "g3_bridge_row.json")}`);
  } finally {
    if (!args.keepTemp) {
      await rm(tempDir, { recursive: true, force: true });
    }
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
