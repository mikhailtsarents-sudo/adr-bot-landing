#!/usr/bin/env node

import { access, copyFile, cp, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import {
  buildQuestionQaReport,
  buildQuestionShortformContract,
} from "./render/question-quality.mjs";
import { generateQuestionVisualBundle } from "./render/generate-question-visual-assets.mjs";
import { enhanceQuestionScenesWithGpt } from "./render/question-scene-enhancer.mjs";
import { DEFAULT_SCENARIO_ID, applyScenarioAnchor } from "./render/question-scenario-pool.mjs";
import { enableStrictNonInteractiveMode, logAutonomousDecision } from "./runtime/non-interactive-mode.mjs";
import { appendYoutubeTelegramAttribution } from "./runtime/telegram-source-links.mjs";
import { uploadFileToTemporaryHost } from "./runtime/temporary-upload.mjs";
import { synthesizeVoiceoverToFile, DEFAULT_FAL_TTS_VOICE } from "./runtime/fal-tts-engine.mjs";
import { selectMusicBed } from "./runtime/music-bed-selector.mjs";

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
const DEFAULT_GENERATED_ASSET_PUBLIC_BASE_URL =
  process.env.GENERATED_ASSET_PUBLIC_BASE_URL || "http://46.225.170.55:8080";
const DEFAULT_GENERATED_ASSET_REMOTE_ROOT =
  process.env.GENERATED_ASSET_REMOTE_ROOT || "/srv/adr-generated-assets/generated";
const DEFAULT_GENERATED_ASSET_SSH_TARGET =
  process.env.GENERATED_ASSET_SSH_TARGET || "root@46.225.170.55";
const DEFAULT_GENERATED_ASSET_LOCAL_STAGING_ROOT =
  process.env.GENERATED_ASSET_LOCAL_STAGING_ROOT || path.join(os.tmpdir(), "adr-generated-assets-staging");
const DEFAULT_QUESTION_VOICEOVER_LOCAL_PATH = process.env.QUESTION_VOICEOVER_LOCAL_PATH || "";
const DEFAULT_QUESTION_TTS_VOICE = process.env.QUESTION_TTS_VOICE || DEFAULT_FAL_TTS_VOICE;
const DEFAULT_VISIBILITY = "public";
const DEFAULT_HEYGEN_MANIFEST_PATH = path.join(
  repoRoot,
  "public",
  "heygen-assets",
  "adr-heygen-video",
  "current",
  "heygen_manifest.json",
);

enableStrictNonInteractiveMode("run-question-render-package");

function printHelp() {
  console.log(`Usage: node scripts/run-question-render-package.mjs [options]

Options:
  --input <file>         QUESTION source JSON (default: ${DEFAULT_INPUT_PATH})
  --scene-root <dir>     Legacy static scene root (deprecated for QUESTION MVP dynamic visuals)
  --output-root <dir>    Output root for generated render package files (default: ${DEFAULT_OUTPUT_ROOT})
  --project <name>       Canva/asset project name (default: ${DEFAULT_PROJECT})
  --variation-type <v>   Controlled A/B variation type for this render group
  --variation-value <v>  Controlled A/B variation value for this render group
  --variation-payload <j> Optional JSON payload for advanced variation metadata
  --fixed-scenario <id>  Fixed scenario id from the shared scenario pool (default: ${DEFAULT_SCENARIO_ID})
  --batch-item-id <id>   Stable unique batch item id for output isolation
  --slug <name>          Explicit unique output slug override
  --visibility <value>   Publish visibility metadata (default: ${DEFAULT_VISIBILITY})
  --use-approved-preview-bundle  Reuse an already approved preview bundle instead of regenerating visuals
  --approved-preview-bundle <f>  Path to approved public_preview_result.json
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
    variationType: "",
    variationValue: "",
    variationPayload: null,
    fixedScenario: "",
    batchItemId: "",
    slug: "",
    visibility: DEFAULT_VISIBILITY,
    useApprovedPreviewBundle: false,
    approvedPreviewBundlePath: "",
    baseUrl: DEFAULT_BASE_URL,
    generatedAssetPublicBaseUrl: DEFAULT_GENERATED_ASSET_PUBLIC_BASE_URL,
    generatedAssetRemoteRoot: DEFAULT_GENERATED_ASSET_REMOTE_ROOT,
    generatedAssetSshTarget: DEFAULT_GENERATED_ASSET_SSH_TARGET,
    generatedAssetLocalStagingRoot: DEFAULT_GENERATED_ASSET_LOCAL_STAGING_ROOT,
    questionVoiceoverLocalPath: DEFAULT_QUESTION_VOICEOVER_LOCAL_PATH,
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
    else if (token === "--variation-type") args.variationType = argv[++i];
    else if (token === "--variation-value") args.variationValue = argv[++i];
    else if (token === "--variation-payload") args.variationPayload = JSON.parse(argv[++i]);
    else if (token === "--fixed-scenario") args.fixedScenario = argv[++i];
    else if (token === "--batch-item-id") args.batchItemId = argv[++i];
    else if (token === "--slug") args.slug = argv[++i];
    else if (token === "--visibility") args.visibility = argv[++i];
    else if (token === "--use-approved-preview-bundle") args.useApprovedPreviewBundle = true;
    else if (token === "--approved-preview-bundle") args.approvedPreviewBundlePath = path.resolve(argv[++i]);
    else if (token === "--base-url") args.baseUrl = argv[++i];
    else if (token === "--generated-asset-public-base-url") args.generatedAssetPublicBaseUrl = argv[++i];
    else if (token === "--generated-asset-remote-root") args.generatedAssetRemoteRoot = argv[++i];
    else if (token === "--generated-asset-ssh-target") args.generatedAssetSshTarget = argv[++i];
    else if (token === "--generated-asset-local-staging-root") args.generatedAssetLocalStagingRoot = path.resolve(argv[++i]);
    else if (token === "--voiceover-local-path") args.questionVoiceoverLocalPath = path.resolve(argv[++i]);
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

async function buildInlineDataUrl(filePath, mimeType) {
  const buffer = await readFile(filePath);
  return `data:${mimeType};base64,${buffer.toString("base64")}`;
}

async function buildCompressedInlineImageDataUrl(filePath) {
  const tempJpegPath = path.join(
    os.tmpdir(),
    `question-inline-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`,
  );
  const result = spawnSync(
    "sips",
    ["-s", "format", "jpeg", "-s", "formatOptions", "40", filePath, "--out", tempJpegPath],
    {
      cwd: repoRoot,
      encoding: "utf8",
      stdio: "pipe",
    },
  );
  if (result.status !== 0) {
    throw new Error(
      [
        "Failed to build compressed inline QUESTION image.",
        result.stdout?.trim() ? `stdout:\n${result.stdout.trim()}` : null,
        result.stderr?.trim() ? `stderr:\n${result.stderr.trim()}` : null,
      ]
        .filter(Boolean)
        .join("\n"),
    );
  }

  try {
    return await buildInlineDataUrl(tempJpegPath, "image/jpeg");
  } finally {
    await rm(tempJpegPath, { force: true });
  }
}

async function fetchRemoteUrlStatus(url) {
  try {
    const response = await fetch(url, { method: "HEAD" });
    return response.status || 0;
  } catch {}

  try {
    const response = await fetch(url, { method: "GET" });
    return response.status || 0;
  } catch {
    return 0;
  }
}

function uploadGeneratedAssetDirectory({
  localDir,
  remoteRoot,
  sshTarget,
  sshPassword,
}) {
  if (!text(sshPassword)) {
    throw new Error("Generated asset upload requires GENERATED_ASSET_SSH_PASSWORD.");
  }
const expectScript = `
set timeout 60
set password $env(GENERATED_ASSET_SSH_PASSWORD)
spawn ssh -o StrictHostKeyChecking=no ${sshTarget} "mkdir -p ${remoteRoot}"
expect "password:"
send "$password\\r"
expect eof
spawn scp -r -o StrictHostKeyChecking=no -- "${localDir}" "${sshTarget}:${remoteRoot}/"
expect "password:"
send "$password\\r"
expect eof
`;
  const result = spawnSync("expect", ["-c", expectScript], {
    cwd: repoRoot,
    encoding: "utf8",
    stdio: "pipe",
    env: {
      ...process.env,
      GENERATED_ASSET_SSH_PASSWORD: sshPassword,
    },
  });
  if (result.status !== 0) {
    throw new Error(
      [
        "Generated asset directory upload failed.",
        result.stdout?.trim() ? `stdout:\n${result.stdout.trim()}` : null,
        result.stderr?.trim() ? `stderr:\n${result.stderr.trim()}` : null,
      ]
        .filter(Boolean)
        .join("\n"),
    );
  }
}

async function canUseLocalGeneratedAssetRoot(remoteRoot) {
  try {
    await mkdir(remoteRoot, { recursive: true });
    await access(remoteRoot);
    return true;
  } catch {
    return false;
  }
}

async function stageGeneratedAssetDirectoryLocally({
  localDir,
  remoteRoot,
}) {
  await mkdir(remoteRoot, { recursive: true });
  const targetDir = path.join(remoteRoot, path.basename(localDir));
  await rm(targetDir, { recursive: true, force: true });
  await cp(localDir, targetDir, { recursive: true });
  return targetDir;
}

function probeAudioDurationSec(localPath) {
  if (!text(localPath)) return 0;
  const ffprobe = spawnSync(
    "ffprobe",
    ["-v", "error", "-show_entries", "format=duration", "-of", "default=noprint_wrappers=1:nokey=1", localPath],
    { cwd: repoRoot, encoding: "utf8", stdio: "pipe" },
  );
  if (ffprobe.status === 0 && text(ffprobe.stdout)) {
    const dur = Number(ffprobe.stdout.trim());
    if (dur > 0) return dur;
  }
  const afinfo = spawnSync("afinfo", [localPath], { cwd: repoRoot, encoding: "utf8", stdio: "pipe" });
  if (afinfo.status === 0) {
    const match = `${afinfo.stdout || ""}\n${afinfo.stderr || ""}`.match(/estimated duration:\s*([0-9.]+)\s*sec/i);
    if (match) return Number(match[1]) || 0;
  }
  return 0;
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

function clampTitle(value, limit = 50) {
  const source = text(value).replace(/\s+/g, " ");
  if (!source) {
    return "";
  }
  if (source.length <= limit) {
    return source;
  }
  const slice = source.slice(0, limit + 1);
  const boundary = slice.lastIndexOf(" ");
  return (boundary > 18 ? slice.slice(0, boundary) : source.slice(0, limit)).trim();
}

function pickTitleVariantIndex(renderTaskId) {
  if (!renderTaskId) return 0;
  let hash = 0;
  for (let i = 0; i < renderTaskId.length; i++) {
    hash = (hash * 31 + renderTaskId.charCodeAt(i)) >>> 0;
  }
  return hash % 3;
}

function buildQuestionTitleVariants(questionInput, scenario, variation = null, renderTaskId = "") {
  const questionText = text(questionInput.payload?.question_text);
  const correctAnswer = text(questionInput.payload?.correct_answer);
  const category = text(questionInput.payload?.category);
  const variationType = text(variation?.variation_type);
  const variationValue = text(variation?.variation_value);

  let variantA = "No license? Watch this...";
  let variantB = "Police check gone wrong";
  let variantC = "He had no documents...";

  if (/transport|document/i.test(questionText) || /transport_documents/i.test(category)) {
    variantA = "Where are the documents?";
    variantB = "Roadside check gets tense";
    variantC = "He reached for the papers...";
  } else if (/transporting|transport/i.test(questionText) || /cargo/i.test(category)) {
    variantA = "What are you carrying?";
    variantB = "One answer changed everything";
    variantC = "Inspector asked one thing...";
  } else if (/passed inspection|inspection/i.test(questionText)) {
    variantA = "Inspection not over yet";
    variantB = "He answered too early";
    variantC = "The check got awkward fast";
  } else if (/why did you stop/i.test(questionText) || /stop_reason/i.test(category)) {
    variantA = "Why did he stop here?";
    variantB = "Police wanted one answer";
    variantC = "This stop felt wrong fast";
  }

  if (variationType === "mutation" && /ultra_aggressive/i.test(variationValue)) {
    variantA = "SHOW IT NOW";
  } else if (variationType === "mutation" && /camera_extreme_pov/i.test(variationValue)) {
    variantA = "What the inspector saw...";
  } else if (variationType === "hook_remix") {
    variantB = "This hook makes people stop";
  }

  const variants = [
    clampTitle(variantA),
    clampTitle(variantB),
    clampTitle(variantC),
  ].filter(Boolean);

  const description = [
    clampTitle(`${text(scenario.hook_text) || questionText}`),
    clampTitle(`${correctAnswer}. Watch the check unfold.`, 80),
  ]
    .filter(Boolean)
    .join("\n");

  const variantIndex = pickTitleVariantIndex(renderTaskId);
  const selected = variants[variantIndex] || variants[0] || clampTitle(text(scenario.hook_text) || questionText);

  return {
    selected_title: selected,
    title_variant_a: variants[0] || "",
    title_variant_b: variants[1] || "",
    title_variant_c: variants[2] || "",
    description,
  };
}

function roleDisplayName(role) {
  switch (text(role)) {
    case "hook":
      return "Hook";
    case "question":
      return "Question";
    case "answers":
      return "Answers";
    case "timer":
      return "Timer";
    case "answer":
      return "Answer";
    case "cta":
      return "CTA";
    default:
      return text(role) || "Scene";
  }
}

function buildQuestionSceneIntent(role, copy) {
  const safeRole = text(role);
  const safeCopy = text(copy).toLowerCase();

  if (safeRole === "hook") return "attention_hook";
  if (safeRole === "question") return safeCopy.includes("?") ? "decision_prompt" : "question_frame";
  if (safeRole === "answers") return "option_scan";
  if (safeRole === "timer") return "countdown_pause";
  if (safeRole === "answer") return safeCopy.startsWith("richtig") ? "correct_reveal" : "resolution_reveal";
  if (safeRole === "cta") return "telegram_conversion_cta";
  return "supporting_scene";
}

function buildQuestionVisualHint(sceneIntent, role, copy, visualDirection) {
  const safeRole = text(role);
  const safeIntent = text(sceneIntent);
  const safeDirection = text(visualDirection) || "question_card_vertical";
  const safeCopy = text(copy);

  switch (safeRole) {
    case "hook":
      return `${safeDirection}; real roadside stop; extreme close interaction; document or inspector enters lens; no graphic panels; opening tension around "${safeCopy}"`;
    case "question":
      return `${safeDirection}; live checkpoint moment; driver and inspector in one space; keep the key interaction readable for "${safeCopy}"`;
    case "answers":
      return `${safeDirection}; same inspection scene under pressure; comparison moment inside the real car-roadside context`;
    case "timer":
      return `${safeDirection}; hesitation beat during the same stop; hold the pressure without decorative graphics`;
    case "answer":
      return `${safeDirection}; reveal through action; inspector reaction or document handling shows the answer`;
    case "cta":
      return `${safeDirection}; unresolved roadside continuation; keep it in the same real scene instead of an end card`;
    default:
      return `${safeDirection}; ${safeIntent}; real checkpoint scene with people, vehicle context, and tension`;
  }
}

function buildCategoryAwareVisualProfile(contractor1Output) {
  const scenario = contractor1Output?.scenario || {};
  const questionText = text(scenario.body_blocks?.[0] || scenario.question_short || scenario.hook_text).toLowerCase();
  const category = text(scenario.category || contractor1Output?.classification?.analytics_tag).toLowerCase();

  if (/document|driver_documents|license|papier|unterlage|weisung/.test(`${category} ${questionText}`)) {
    return {
      location: "real roadside inspection with visible documents",
      interaction: "driver and inspector focused on paperwork exchange",
      answerReveal: "document handling reveals the correct answer",
      ctaScene: "inspection continues with unresolved paperwork tension",
    };
  }
  if (/marking|orange|placard|vehicle_marking|tafeln|kennzeichnung/.test(`${category} ${questionText}`)) {
    return {
      location: "truck exterior with hazard panels or ADR markings in view",
      interaction: "attention is on visible orange panels and vehicle signage",
      answerReveal: "the correct marking on the vehicle resolves the scene",
      ctaScene: "the driver stands by the marked vehicle ready for the next check",
    };
  }
  if (/fire|extinguisher|emergency|equipment|notfall/.test(`${category} ${questionText}`)) {
    return {
      location: "truck stop or loading area with ADR safety equipment nearby",
      interaction: "driver or inspector checks emergency equipment under pressure",
      answerReveal: "the required safety item becomes clearly visible in the scene",
      ctaScene: "the check continues around the emergency equipment setup",
    };
  }
  if (/cargo|declaration|ladung|load|securing|tank/.test(`${category} ${questionText}`)) {
    return {
      location: "loading area or transport lane with cargo or tank context",
      interaction: "driver and inspector focus on load or transport declaration",
      answerReveal: "cargo context reveals why one answer is correct",
      ctaScene: "the transport check continues around the loaded vehicle",
    };
  }
  return {
    location: "real ADR training or inspection context matched to the question",
    interaction: "one clear practical interaction around the actual ADR topic",
    answerReveal: "the correct practical detail resolves the scene",
    ctaScene: "the real-world situation stays open for the next step",
  };
}

function buildQuestionCanvaBrief(contractor1Output) {
  const scenario = contractor1Output?.scenario || {};
  const scenePlan = Array.isArray(contractor1Output?.scene_plan) ? contractor1Output.scene_plan : [];
  const visualDirection = text(contractor1Output?.visual_direction) || "question_card_vertical";
  const visualProfile = buildCategoryAwareVisualProfile(contractor1Output);

  return {
    brief_id: `${text(contractor1Output?.source_id)}-brief-01`,
    trace_id: text(contractor1Output?.trace_id),
    scenario_id: text(contractor1Output?.scenario_id),
    source_id: text(contractor1Output?.source_id),
    source_type: "QUESTION",
    content_family: "QUESTION",
    format: "vertical_short",
    slide_count: scenePlan.length,
    template_family: "T1_QUESTION",
    template_id: text(scenario.template_id) || "T1",
    template_variant: text(contractor1Output?.template_variant) || "quiz_standard",
    visual_direction: visualDirection,
    slides: scenePlan.map((scene, index) => {
      const role = text(scene.role);
      const copy = text(scene.text);
      const sceneIntent = buildQuestionSceneIntent(role, copy);
      return {
        id: Number(scene.id) || index + 1,
        name: roleDisplayName(role),
        role,
        copy,
        scene_intent: sceneIntent,
        visual_hint:
          role === "hook"
            ? `${visualDirection}; ${visualProfile.location}; high-tension opening around "${copy}"; no decorative graphics`
            : role === "question"
              ? `${visualDirection}; ${visualProfile.location}; ${visualProfile.interaction}; keep "${copy}" readable in context`
              : role === "answers"
                ? `${visualDirection}; same real scene; compare plausible options inside the practical ADR context`
                : role === "timer"
                  ? `${visualDirection}; hold tension in the same topic-specific scene without decorative filler`
                  : role === "answer"
                    ? `${visualDirection}; ${visualProfile.answerReveal}; "${copy}"`
                    : role === "cta"
                      ? `${visualDirection}; ${visualProfile.ctaScene}; no generic end card`
                      : buildQuestionVisualHint(sceneIntent, role, copy, visualDirection),
        layout_hint: role === "hook" ? "hero_top_safe" : role === "answers" ? "stacked_answers_card" : "center_safe",
        priority: index + 1,
      };
    }),
  };
}

function collectQuestionBriefIssues(contractor1Output, questionBrief) {
  const issues = [];

  if (text(questionBrief.trace_id) !== text(contractor1Output.trace_id)) {
    issues.push("question_brief.trace_id mismatch");
  }
  if (text(questionBrief.scenario_id) !== text(contractor1Output.scenario_id)) {
    issues.push("question_brief.scenario_id mismatch");
  }
  if (text(questionBrief.source_id) !== text(contractor1Output.source_id)) {
    issues.push("question_brief.source_id mismatch");
  }
  if (text(questionBrief.content_family) !== "QUESTION") {
    issues.push("question_brief.content_family must be QUESTION");
  }
  if (text(questionBrief.template_family) !== "T1_QUESTION") {
    issues.push("question_brief.template_family must be T1_QUESTION");
  }
  if (!Array.isArray(questionBrief.slides) || questionBrief.slides.length === 0) {
    issues.push("question_brief.slides must contain at least one slide");
    return issues;
  }
  if (Number(questionBrief.slide_count || 0) !== questionBrief.slides.length) {
    issues.push("question_brief.slide_count mismatch");
  }

  questionBrief.slides.forEach((slide, index) => {
    if (!text(slide.role)) issues.push(`question_brief.slides[${index}].role missing`);
    if (!text(slide.copy)) issues.push(`question_brief.slides[${index}].copy missing`);
    if (!text(slide.scene_intent)) issues.push(`question_brief.slides[${index}].scene_intent missing`);
    if (!text(slide.visual_hint)) issues.push(`question_brief.slides[${index}].visual_hint missing`);
    if (!text(slide.layout_hint)) issues.push(`question_brief.slides[${index}].layout_hint missing`);
  });

  return issues;
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
    maxBuffer: 20 * 1024 * 1024,
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

function buildRenderTask(questionInput, scenario, audioSource = {}, options = {}) {
  const shortenedTitle = text(scenario.hook_text);
  const correctAnswer = text(questionInput.payload?.correct_answer);
  const explanation = text(questionInput.payload?.simple_explanation);
  const batchItemId = text(options.batchItemId);
  const renderTaskIdBase = `${text(questionInput.source_id)}-render-01`;
  const renderTaskId = batchItemId ? `${renderTaskIdBase}-${batchItemId}` : renderTaskIdBase;
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

  const voiceoverDurationSec = Number(audioSource.voiceoverDurationSec || 0);
  const durationTargetSec = voiceoverDurationSec > 0 ? Math.max(11, Math.ceil(voiceoverDurationSec)) : 10;
  const titles = buildQuestionTitleVariants(questionInput, scenario, null, renderTaskId);
  const youtubeAttribution = appendYoutubeTelegramAttribution(
    titles.description || [shortenedTitle, correctAnswer, explanation].filter(Boolean).join("\n"),
    { contentId: renderTaskId, surface: "shorts" },
  );

  return {
    trace_id: scenario.trace_id,
    scenario_id: scenario.scenario_id,
    render_task_id: renderTaskId,
    batch_item_id: batchItemId,
    source_type: "QUESTION",
    source_id: text(questionInput.source_id),
    source_family: "QUESTION",
    content_family: "QUESTION",
    template_id: "T1",
    template_variant: text(scenario.template_variant) || "quiz_standard",
    fallback_template_variant: text(scenario.fallback_template_variant) || "quiz_safe",
    render_family: "Question Card Short",
    title: titles.selected_title,
    title_variant_a: titles.title_variant_a,
    title_variant_b: titles.title_variant_b,
    title_variant_c: titles.title_variant_c,
    description: youtubeAttribution.description,
    caption_text: scenario.caption_text,
    cta_text: scenario.cta_text,
    cta_url: youtubeAttribution.ctaUrl,
    entry_source_token: youtubeAttribution.startToken,
    scene_plan: scenario.scene_plan,
    shortform_contract: scenario.shortform_contract,
    retry_policy: retryPolicy,
    fallback_policy: fallbackPolicy,
    hashtags: scenario.hashtags,
    analytics_tag: scenario.analytics_tag,
    language: "de",
    visibility: text(options.visibility) || DEFAULT_VISIBILITY,
    duration_target_sec: durationTargetSec,
    subtitle_policy: "burned_or_external_srt",
    audio_policy: text(audioSource.voiceoverUrl) ? "voiceover_only_question_test" : "none_for_first_visual_test",
    voice_mode: text(audioSource.voiceMode) || (text(audioSource.voiceoverUrl) ? "voiceover" : "none"),
    voiceover_url: text(audioSource.voiceoverUrl),
    music_url: selectMusicBed("QUESTION", { hasVoiceover: Boolean(text(audioSource.voiceoverUrl)) })?.url || "",
    music_volume: selectMusicBed("QUESTION", { hasVoiceover: Boolean(text(audioSource.voiceoverUrl)) })?.volume ?? null,
    talking_head_url: "",
    talking_head_asset_name: "",
    source_title: `QUESTION source: ${titles.selected_title || shortenedTitle}`,
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

function buildQuestionVoiceoverScript(questionInput, scenario) {
  const questionText = text(questionInput.payload?.question_text);
  const answers = Array.isArray(questionInput.payload?.answer_options)
    ? questionInput.payload.answer_options.map((item, index) => `${String.fromCharCode(65 + index)}. ${text(item)}`).filter(Boolean)
    : [];
  const correctAnswer = text(questionInput.payload?.correct_answer);
  const explanation = text(questionInput.payload?.simple_explanation);
  const ctaText = text(scenario.cta_text);

  return [
    text(scenario.hook_text),
    questionText ? `Frage. ${questionText}` : "",
    answers.length > 0 ? `Antworten. ${answers.join(". ")}` : "",
    correctAnswer ? `Richtig ist. ${correctAnswer}` : "",
    explanation ? `Kurz erklärt. ${explanation}` : "",
    ctaText,
  ]
    .filter(Boolean)
    .join(" ");
}

async function resolveQuestionVoiceoverAsset(args, visualBundle, questionInput, scenario) {
  const voiceoverTargetPath = path.join(visualBundle.generated_dir, "voiceover.mp3");
  const publicBase = String(args.generatedAssetPublicBaseUrl).replace(/\/$/, "");
  const canUseLocalGeneratedAssetDelivery = await canUseLocalGeneratedAssetRoot(args.generatedAssetRemoteRoot);

  if (text(args.questionVoiceoverLocalPath)) {
    await copyFile(args.questionVoiceoverLocalPath, voiceoverTargetPath);
    return {
      voiceoverUrl: `${publicBase}/generated/${visualBundle.video_id}/voiceover.mp3`,
      voiceoverDurationSec: probeAudioDurationSec(args.questionVoiceoverLocalPath),
      voiceMode: "manual",
      voiceScript: "",
      generatedFromQuestion: false,
    };
  }

  const voiceScript = buildQuestionVoiceoverScript(questionInput, scenario);
  try {
    const generated = await synthesizeVoiceoverToFile(voiceoverTargetPath, voiceScript, DEFAULT_QUESTION_TTS_VOICE);
    if (generated) {
      let voiceoverUrl = `${publicBase}/generated/${visualBundle.video_id}/voiceover.mp3`;
      const sshPassword = process.env.GENERATED_ASSET_SSH_PASSWORD || "";
      if (!canUseLocalGeneratedAssetDelivery && !text(sshPassword)) {
        const temporaryUpload = await uploadFileToTemporaryHost(voiceoverTargetPath, {
          diagnosticsDir: args.uploadDiagnosticsDir,
          frameId: "question_voiceover",
          expectedMimePrefixes: ["audio/", "application/octet-stream"],
        });
        voiceoverUrl = temporaryUpload.uploadedUrl;
      }
      return {
        voiceoverUrl,
        voiceoverDurationSec: probeAudioDurationSec(voiceoverTargetPath),
        voiceMode: "tts",
        voiceScript,
        generatedFromQuestion: true,
      };
    }
  } catch (error) {
    console.warn(`QUESTION TTS generation failed: ${error.message}`);
  }

  return {
    voiceoverUrl: "",
    voiceoverDurationSec: 0,
    voiceMode: "tts_failed",
    voiceScript,
    generatedFromQuestion: false,
  };
}

function buildVariationTag(args) {
  const variationType = text(args.variationType);
  const variationValue = text(args.variationValue);
  if (!variationType || !variationValue) {
    return null;
  }
  return {
    variation_type: variationType,
    variation_value: variationValue,
    ...(args.variationPayload && typeof args.variationPayload === "object"
      ? { payload: args.variationPayload }
      : {}),
  };
}

function buildContractor1Output(questionInput, classification, scenario) {
  return {
    trace_id: scenario.trace_id,
    source_id: text(questionInput.source_id),
    source_type: "QUESTION",
    content_family: "QUESTION",
    classification,
    scenario,
    scenario_id: scenario.scenario_id,
    shortform_contract: scenario.shortform_contract,
    scene_plan: scenario.scene_plan,
    template_variant: text(scenario.template_variant),
    fallback_template_variant: text(scenario.fallback_template_variant),
    visual_direction: text(scenario.visual_direction) || "question_card_vertical",
  };
}

function buildContractor2Output(contractor2Prompt, visualBundle) {
  return {
    brief_id: text(contractor2Prompt.brief_id),
    trace_id: text(contractor2Prompt.trace_id),
    scenario_id: text(contractor2Prompt.scenario_id),
    source_id: text(contractor2Prompt.source_id),
    content_family: "QUESTION",
    visual_direction: text(contractor2Prompt.visual_direction),
    primary_asset_url: text(visualBundle.asset_url),
    asset_manifest: text(visualBundle.manifest_path),
    assets: (contractor2Prompt.slides || []).map((slide) => ({
      slide_id: Number(slide.id) || 0,
      role: text(slide.role),
      scene_intent: text(slide.scene_intent),
      visual_hint: text(slide.visual_hint),
      subject: text(slide.subject),
      context: text(slide.context),
      tension: text(slide.tension),
      asset_url: text(visualBundle.asset_url),
      asset_type: "image",
    })),
  };
}

async function resolveRemoteSafeAssetUrl(repoRoot, questionId, visualBundle) {
  let localFileExists = false;
  try {
    await access(visualBundle.asset_path);
    localFileExists = true;
  } catch {
    localFileExists = false;
  }

  console.log("LOCAL_GENERATED_PATH:", visualBundle.asset_path);
  console.log("LOCAL_FILE_EXISTS:", localFileExists);
  console.log("PUBLIC_URL:", visualBundle.asset_url);
  const status = await fetchRemoteUrlStatus(visualBundle.asset_url);
  console.log("PUBLIC_CHECK_ATTEMPT:", 1);
  console.log("NEW_GENERATED_ASSET:", visualBundle.asset_url);
  console.log("PUBLIC_HTTP_STATUS:", status);

  if (status === 200) {
    return visualBundle.asset_url;
  }

  throw new Error(
    `Generated QUESTION visual is not publicly reachable for ${questionId}. asset_url=${visualBundle.asset_url}`,
  );
}

async function resolveQuestionVisualAssetUrl(args, questionId, visualBundle) {
  if (await canUseLocalGeneratedAssetRoot(args.generatedAssetRemoteRoot)) {
    await stageGeneratedAssetDirectoryLocally({
      localDir: visualBundle.generated_dir,
      remoteRoot: args.generatedAssetRemoteRoot,
    });
    return args.verifyRemote
      ? resolveRemoteSafeAssetUrl(repoRoot, questionId, visualBundle)
      : visualBundle.asset_url;
  }

  const sshPassword = process.env.GENERATED_ASSET_SSH_PASSWORD || "";
  if (!text(sshPassword)) {
    const temporaryUpload = await uploadFileToTemporaryHost(visualBundle.asset_path, {
      diagnosticsDir: args.uploadDiagnosticsDir,
      frameId: "primary_asset",
    });
    const temporaryAssetUrl = temporaryUpload.uploadedUrl;
    const status = await fetchRemoteUrlStatus(temporaryAssetUrl);
    if (status !== 200) {
      throw new Error(
        `Temporary generated asset URL is not publicly reachable for ${questionId}. asset_url=${temporaryAssetUrl} status=${status}`,
      );
    }
    console.warn(
      "QUESTION visual upload bypassed: GENERATED_ASSET_SSH_PASSWORD missing, using temporary public asset URL.",
    );
    return temporaryAssetUrl;
  }

  uploadGeneratedAssetDirectory({
    localDir: visualBundle.generated_dir,
    remoteRoot: args.generatedAssetRemoteRoot,
    sshTarget: args.generatedAssetSshTarget,
    sshPassword,
  });

  return args.verifyRemote
    ? resolveRemoteSafeAssetUrl(repoRoot, questionId, visualBundle)
    : visualBundle.asset_url;
}

async function loadApprovedPreviewVisualBundle(approvedPreviewBundlePath) {
  if (!text(approvedPreviewBundlePath)) {
    throw new Error("Approved preview bundle path is required when use_approved_preview_bundle=true.");
  }

  const approvedPreview = await loadJson(approvedPreviewBundlePath);
  const approvedDir = path.dirname(approvedPreviewBundlePath);
  const generatedVisualPath = path.join(approvedDir, "generated_visual.json");
  const generatedVisual = await loadJson(generatedVisualPath);

  const previewPass =
    Boolean(approvedPreview?.validation?.preview_pass) &&
    Boolean(approvedPreview?.validation?.all_frames_pass) &&
    Boolean(generatedVisual?.preview_pass) &&
    Boolean(generatedVisual?.all_frames_pass);

  if (!previewPass) {
    throw new Error(
      `Approved preview bundle is not eligible for reuse: preview_pass=${Boolean(approvedPreview?.validation?.preview_pass)} all_frames_pass=${Boolean(approvedPreview?.validation?.all_frames_pass)}`,
    );
  }

  if (!Array.isArray(generatedVisual?.scene_frame_manifest) || generatedVisual.scene_frame_manifest.length !== 3) {
    throw new Error("Approved preview bundle is missing a valid scene_frame_manifest.");
  }

  if (!text(generatedVisual?.manifest_path) || !text(generatedVisual?.asset_url)) {
    throw new Error("Approved preview bundle is missing manifest_path or asset_url.");
  }

  return {
    ...generatedVisual,
    approved_preview_bundle_path: approvedPreviewBundlePath,
    approved_preview_result: approvedPreview,
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  logAutonomousDecision("selected render strategy", {
    input_path: args.inputPath,
    fixed_scenario: args.fixedScenario,
    use_approved_preview_bundle: Boolean(args.useApprovedPreviewBundle),
  });
  const rawQuestionInput = await loadJson(args.inputPath);
  const questionInput = applyScenarioAnchor(rawQuestionInput, args.fixedScenario);
  const heygenManifest = await loadJson(args.heygenManifestPath);

  if (text(questionInput.source_type) !== "QUESTION") {
    throw new Error("Input must be a QUESTION source package.");
  }
  if (!text(questionInput.payload?.question_text) || !text(questionInput.payload?.correct_answer)) {
    throw new Error("QUESTION input is missing question_text or correct_answer.");
  }

  const classification = buildClassification(questionInput);
  const scenario = buildScenario(questionInput, classification);
  const contractor1Output = buildContractor1Output(questionInput, classification, scenario);
  const contractor2PromptBase = buildQuestionCanvaBrief(contractor1Output);
  const sceneEnhancement = await enhanceQuestionScenesWithGpt({
    brief: contractor2PromptBase,
    contractor1Output,
  });
  const contractor2Prompt = sceneEnhancement?.mergedBrief || contractor2PromptBase;
  const contractor2PromptIssues = collectQuestionBriefIssues(contractor1Output, contractor2Prompt);
  if (contractor2PromptIssues.length > 0) {
    throw new Error(
      `QUESTION brief validation failed:\n${contractor2PromptIssues.map((issue) => `- ${issue}`).join("\n")}`,
    );
  }
  const batchItemId = slugify(args.batchItemId);
  const slug =
    slugify(args.slug) ||
    slugify(
      [
        questionInput.source_id,
        text(questionInput.source_id),
        "render-01",
        batchItemId,
      ]
        .filter(Boolean)
        .join("-"),
    ) ||
    "question-render-package";

  const tempDir = await mkdtemp(path.join(os.tmpdir(), "adr-question-render-"));
  const packagePath = path.join(tempDir, "question-render-package.json");
  const outputDir = path.join(args.outputRoot, slug);
  await mkdir(outputDir, { recursive: true });
  args.uploadDiagnosticsDir = outputDir;
  console.log(`output_dir=${outputDir}`);
  const videoId = `${slug}-${Date.now()}`;
  const visualBundle = args.useApprovedPreviewBundle
    ? await loadApprovedPreviewVisualBundle(args.approvedPreviewBundlePath)
    : await generateQuestionVisualBundle({
        publicAssetBaseUrl: args.generatedAssetPublicBaseUrl,
        project: args.project,
        videoId,
        questionId: text(questionInput.source_id),
        shortform: scenario.shortform_contract,
        brief: contractor2Prompt,
        variationTag: buildVariationTag(args),
        contentFamily: "QUESTION",
        stagingRoot: args.generatedAssetLocalStagingRoot,
      });
  logAutonomousDecision(args.useApprovedPreviewBundle ? "approved preview bundle reused" : "fresh visual generation selected", {
    video_id: visualBundle.video_id,
    generated_dir: visualBundle.generated_dir,
  });
  const voiceoverAsset = await resolveQuestionVoiceoverAsset(
    args,
    visualBundle,
    questionInput,
    scenario,
  );
  const renderTask = buildRenderTask(questionInput, scenario, {
    voiceoverUrl: voiceoverAsset.voiceoverUrl,
    voiceoverDurationSec: voiceoverAsset.voiceoverDurationSec,
    voiceMode: voiceoverAsset.voiceMode,
  }, {
    batchItemId,
    visibility: args.visibility,
  });
  const qaReport = buildQuestionQaReport({
    shortform: scenario.shortform_contract,
    templateVariant: renderTask.template_variant,
    fallbackTemplateVariant: renderTask.fallback_template_variant,
  });
  const remoteSafeAssetUrl = args.useApprovedPreviewBundle
    ? text(visualBundle.asset_url)
    : await resolveQuestionVisualAssetUrl(
        args,
        text(questionInput.source_id),
        visualBundle,
      );
  visualBundle.asset_url = remoteSafeAssetUrl;
  const contractor2Output = buildContractor2Output(contractor2Prompt, visualBundle);
  const sceneAssetUrls = Array.isArray(visualBundle.scene_frame_manifest) && visualBundle.scene_frame_manifest.length > 0
    ? visualBundle.scene_frame_manifest.map((frame) => {
        const fileName = path.basename(frame.local_path);
        const baseUrl = remoteSafeAssetUrl.replace(/\/[^/]+$/, "");
        return `${baseUrl}/${fileName}`;
      })
    : [remoteSafeAssetUrl];
  renderTask.generated_visual = {
    asset_url: remoteSafeAssetUrl,
    scene_asset_urls: sceneAssetUrls,
    hook_snapshot: visualBundle.hook_snapshot || null,
  };
  renderTask.batch_item_id = batchItemId;
  renderTask.generated_visual_asset_url = remoteSafeAssetUrl;
  renderTask.asset_url = remoteSafeAssetUrl;
  renderTask.hook_snapshot = visualBundle.hook_snapshot || null;
  renderTask.trace_id = contractor1Output.trace_id;
  renderTask.scenario_id = contractor1Output.scenario_id;
  renderTask.brief_id = contractor2Prompt.brief_id;
  renderTask.contractor_1_output = contractor1Output;
  renderTask.contractor_2_prompt_base = contractor2PromptBase;
  renderTask.contractor_2_prompt = contractor2Prompt;
  renderTask.contractor_2_output = contractor2Output;
  renderTask.scene_enhancement = {
    used_gpt: Boolean(sceneEnhancement?.usedGpt),
    reason: text(sceneEnhancement?.reason),
  };
  renderTask.use_approved_preview_bundle = Boolean(args.useApprovedPreviewBundle);
  renderTask.approved_preview_bundle_path = text(visualBundle.approved_preview_bundle_path);
  renderTask.voice_script = text(voiceoverAsset.voiceScript);
  renderTask.voice_generated_from_question = Boolean(voiceoverAsset.generatedFromQuestion);
  renderTask.variation = buildVariationTag(args);
  const finalTitles = buildQuestionTitleVariants(questionInput, scenario, renderTask.variation, renderTask.render_task_id);
  renderTask.title = finalTitles.selected_title;
  renderTask.title_variant_a = finalTitles.title_variant_a;
  renderTask.title_variant_b = finalTitles.title_variant_b;
  renderTask.title_variant_c = finalTitles.title_variant_c;
  renderTask.description = finalTitles.description || renderTask.description;
  renderTask.source_title = `QUESTION source: ${renderTask.title}`;
  if (renderTask.variation) {
    renderTask.analytics_tag = `${renderTask.analytics_tag}_${renderTask.variation.variation_type}_${slugify(renderTask.variation.variation_value)}`;
    renderTask.hashtags = [
      ...(Array.isArray(renderTask.hashtags) ? renderTask.hashtags : []),
      `#${slugify(renderTask.variation.variation_type)}`,
      `#${slugify(renderTask.variation.variation_value)}`,
    ].filter(Boolean);
  }
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
    await writeFile(path.join(outputDir, "contractor_1_output.json"), `${JSON.stringify(contractor1Output, null, 2)}\n`, "utf8");
    await writeFile(path.join(outputDir, "contractor_2_prompt.base.json"), `${JSON.stringify(contractor2PromptBase, null, 2)}\n`, "utf8");
    await writeFile(path.join(outputDir, "contractor_2_prompt.json"), `${JSON.stringify(contractor2Prompt, null, 2)}\n`, "utf8");
    await writeFile(path.join(outputDir, "contractor_2_output.json"), `${JSON.stringify(contractor2Output, null, 2)}\n`, "utf8");
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
