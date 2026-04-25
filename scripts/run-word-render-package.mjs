#!/usr/bin/env node

import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { uploadFileToTemporaryHost } from "./runtime/temporary-upload.mjs";
import { prepareGenericGeneratedVisualPackage } from "./render/prepare-generic-generated-visuals.mjs";
import { bootstrapLocalRuntimeEnv } from "./runtime/local-runtime-env.mjs";
import { appendYoutubeTelegramAttribution } from "./runtime/telegram-source-links.mjs";
import { synthesizeVoiceoverToFile, DEFAULT_FAL_TTS_VOICE } from "./runtime/fal-tts-engine.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const DEFAULT_INPUT_PATH = path.join(
  repoRoot,
  "examples",
  "word-sicherungskeil-source.json",
);
const DEFAULT_SCENE_ROOT = path.join(repoRoot, "canva-exports", "adr-short-video");
const DEFAULT_OUTPUT_ROOT = path.join(repoRoot, "render-packages");
const DEFAULT_PROJECT = "adr-short-video";
const DEFAULT_BASE_URL = "https://www.adr-bot.de";
const DEFAULT_GENERATED_ASSET_PUBLIC_BASE_URL =
  process.env.GENERATED_ASSET_PUBLIC_BASE_URL || "http://46.225.170.55:8080";
const DEFAULT_GENERATED_ASSET_LOCAL_STAGING_ROOT =
  process.env.GENERATED_ASSET_LOCAL_STAGING_ROOT || path.join(os.tmpdir(), "adr-generated-assets-staging");
const DEFAULT_WORD_TTS_VOICE = process.env.WORD_TTS_VOICE || DEFAULT_FAL_TTS_VOICE;

function printHelp() {
  console.log(`Usage: node scripts/run-word-render-package.mjs [options]

Options:
  --input <file>         WORD source JSON (default: ${DEFAULT_INPUT_PATH})
  --scene-root <dir>     Scene root with six PNG files (default: ${DEFAULT_SCENE_ROOT})
  --output-root <dir>    Output root for generated render package files (default: ${DEFAULT_OUTPUT_ROOT})
  --project <name>       Canva/asset project name (default: ${DEFAULT_PROJECT})
  --base-url <url>       Public base URL for stable asset URLs (default: ${DEFAULT_BASE_URL})
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
    generatedAssetPublicBaseUrl: DEFAULT_GENERATED_ASSET_PUBLIC_BASE_URL,
    generatedAssetLocalStagingRoot: DEFAULT_GENERATED_ASSET_LOCAL_STAGING_ROOT,
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
    else if (token === "--generated-asset-public-base-url") args.generatedAssetPublicBaseUrl = argv[++i];
    else if (token === "--generated-asset-local-staging-root") args.generatedAssetLocalStagingRoot = path.resolve(argv[++i]);
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

function probeAudioDurationSec(localPath) {
  if (!text(localPath)) {
    return 0;
  }
  // Try ffprobe first (Linux/VPS)
  const ffprobe = spawnSync(
    "ffprobe",
    ["-v", "error", "-show_entries", "format=duration", "-of", "default=noprint_wrappers=1:nokey=1", localPath],
    { cwd: repoRoot, encoding: "utf8", stdio: "pipe" },
  );
  if (ffprobe.status === 0 && text(ffprobe.stdout)) {
    const dur = Number(ffprobe.stdout.trim());
    if (dur > 0) return dur;
  }
  // Fallback: afinfo (macOS)
  const afinfo = spawnSync("afinfo", [localPath], { cwd: repoRoot, encoding: "utf8", stdio: "pipe" });
  if (afinfo.status === 0) {
    const match = `${afinfo.stdout || ""}\n${afinfo.stderr || ""}`.match(/estimated duration:\s*([0-9.]+)\s*sec/i);
    if (match) return Number(match[1]) || 0;
  }
  return 0;
}

function buildClassification(wordInput) {
  const sourceId = text(wordInput.source_id);
  const category = text(wordInput.payload?.category) || "general";
  return {
    source_type: "WORD",
    source_id: sourceId,
    source_family: "WORD",
    template_id: "T2",
    language_base: text(wordInput.base_lang) || "de",
    editorial_angle: "simple_term_explainer",
    render_priority: "normal",
    analytics_tag: `word_${category}_${sourceId}`,
  };
}

function buildScenario(wordInput, classification) {
  const term = text(wordInput.payload?.de_term);
  const translation =
    text(wordInput.payload?.translations?.[wordInput.target_lang || "ru"]) ||
    text(wordInput.payload?.translations?.ru);
  const explanation = text(wordInput.payload?.simple_explanation);
  const synonym = text(wordInput.payload?.synonym);
  const sourceId = text(wordInput.source_id);
  const traceId = `${sourceId}-run-01`;

  return {
    trace_id: traceId,
    scenario_id: `${sourceId}-scn-01`,
    source_type: "WORD",
    source_id: sourceId,
    source_family: classification.source_family,
    template_id: classification.template_id,
    content_family: "WORD",
    language_base: classification.language_base,
    target_language: text(wordInput.target_lang) || "ru",
    audience: text(wordInput.audience) || "ADR",
    difficulty: text(wordInput.difficulty) || "easy",
    render_priority: classification.render_priority,
    hook_text: `Was bedeutet ${term}?`,
    scene_plan: [
      { id: 1, role: "hook", text: `Was bedeutet ${term}?` },
      { id: 2, role: "content", text: `${term} / ${translation}` },
      { id: 3, role: "pause", text: synonym ? `Auch bekannt als: ${synonym}` : explanation },
      { id: 4, role: "answer", text: `${term} = ${translation}` },
      { id: 5, role: "cta", text: "Mehr ADR-Begriffe im Telegram-Bot" },
    ],
    body_blocks: [
      term,
      `RU: ${translation}`,
      explanation,
    ].filter(Boolean),
    core_answer: `${term} = ${translation}`,
    short_explanation: explanation,
    cta_text: "Mehr ADR-Begriffe im Telegram-Bot",
    caption_text: `ADR Begriff kurz erklärt: ${term}.`,
    hashtags: ["#ADR", "#Gefahrgut", "#LKW", "#ADRDeutsch"],
    tone: "klar_und_ruhig",
    visual_direction: "word_card_vertical",
    analytics_tag: classification.analytics_tag,
  };
}

function buildRenderTask(wordInput, scenario, audioSource = {}) {
  const term = text(wordInput.payload?.de_term);
  const translation =
    text(wordInput.payload?.translations?.[wordInput.target_lang || "ru"]) ||
    text(wordInput.payload?.translations?.ru);
  const voiceoverDurationSec = Number(audioSource.voiceoverDurationSec || 0);
  // Duration = audio length + 2s buffer so nothing gets cut. Minimum 9s if no audio.
  const durationTargetSec = voiceoverDurationSec > 0 ? Math.ceil(voiceoverDurationSec) + 2 : 9;
  const renderTaskId = `${text(wordInput.source_id)}-render-01`;
  const youtubeAttribution = appendYoutubeTelegramAttribution(
    [
      `${term} = ${translation}.`,
      scenario.short_explanation,
      "",
      "Mehr ADR-Begriffe im Telegram-Bot: @adr_pruefung_trainer_bot",
    ]
      .filter(Boolean)
      .join("\n"),
    { contentId: renderTaskId, surface: "shorts" },
  );

  return {
    trace_id: scenario.trace_id,
    scenario_id: scenario.scenario_id,
    render_task_id: renderTaskId,
    source_type: "WORD",
    source_id: text(wordInput.source_id),
    source_family: "WORD",
    content_family: "WORD",
    template_id: "T2",
    render_family: "Word Card Short",
    title: `Was bedeutet ${term}?`,
    description: youtubeAttribution.description,
    caption_text: scenario.caption_text,
    cta_text: scenario.cta_text,
    cta_url: youtubeAttribution.ctaUrl,
    entry_source_token: youtubeAttribution.startToken,
    scene_plan: scenario.scene_plan,
    hashtags: scenario.hashtags,
    analytics_tag: scenario.analytics_tag,
    language: "de",
    visibility: "public",
    duration_target_sec: durationTargetSec,
    subtitle_policy: "burned_or_external_srt",
    source_title: `WORD source: ${term}`,
    source_url: "https://www.adr-bot.de/adr-begriffe",
    source_name: "Content Engine WORD render package runner",
    topic_type: "word",
    publish_target: "youtube_shorts",
    publish_adapter: "youtube_short_adapter",
    approval_state: "approved",
    publish_state: "publish_ready",
    delivery_state: "not_sent",
    render_status: "assets_packaged",
  };
}

function buildWordVoiceoverScript(wordInput, scenario) {
  const term = text(wordInput.payload?.de_term);
  const targetLang = text(wordInput.target_lang || "ru") || "ru";
  const translation =
    text(wordInput.payload?.translations?.[targetLang]) ||
    text(wordInput.payload?.translations?.ru);
  const explanation = text(wordInput.payload?.simple_explanation);
  const synonym = text(wordInput.payload?.synonym);
  const ctaText = text(scenario.cta_text);

  return [
    text(scenario.hook_text),
    term ? `Begriff. ${term}.` : "",
    translation ? `Auf Russisch. ${translation}.` : "",
    synonym ? `Auch bekannt als. ${synonym}.` : "",
    explanation ? `Kurz erklärt. ${explanation}` : "",
    ctaText,
  ]
    .filter(Boolean)
    .join(" ");
}

function buildWordShortformContract(wordInput, scenario) {
  const term = text(wordInput.payload?.de_term);
  const translation =
    text(wordInput.payload?.translations?.[wordInput.target_lang || "ru"]) ||
    text(wordInput.payload?.translations?.ru);
  const explanation = text(wordInput.payload?.simple_explanation);
  const synonym = text(wordInput.payload?.synonym);
  return {
    hook: text(scenario.hook_text),
    question_short: term ? `Was bedeutet ${term}?` : text(scenario.hook_text),
    answers_short: [translation, synonym || explanation].filter(Boolean),
    correct_short: `${term} = ${translation}`,
    explanation_short: explanation,
    cta: text(scenario.cta_text),
  };
}

function buildWordVisualBrief(wordInput, scenario) {
  const term = text(wordInput.payload?.de_term);
  const translation =
    text(wordInput.payload?.translations?.[wordInput.target_lang || "ru"]) ||
    text(wordInput.payload?.translations?.ru);
  const explanation = text(wordInput.payload?.simple_explanation);
  const synonym = text(wordInput.payload?.synonym);

  // The visual anchor: what the term refers to must be physically visible in every frame.
  // term + explanation drive what's shown — never override with generic ADR scenery.
  const objectDesc = explanation || translation;
  const termAnchor = `"${term}" (${objectDesc})`;

  return {
    brief_id: `${text(wordInput.source_id)}-brief-01`,
    trace_id: text(scenario.trace_id),
    scenario_id: text(scenario.scenario_id),
    source_id: text(wordInput.source_id),
    source_type: "WORD",
    content_family: "WORD",
    format: "vertical_short",
    slide_count: 6,
    template_family: "T2_WORD",
    template_id: "T2",
    visual_direction: "word_card_vertical",
    slides: [
      {
        id: 1,
        name: "Hook",
        role: "hook",
        copy: text(scenario.hook_text),
        scene_intent: `real ADR transport moment where ${termAnchor} is about to be used or is visibly relevant`,
        visual_hint: `${termAnchor} present in the frame — the term itself determines what is shown; NOT generic orange ADR truck unless "${term}" specifically means that`,
        layout_hint: "hero_top_safe",
        subject: `driver or worker in ADR transport context, attention on the item or concept named by "${term}"`,
        context: "truck loading area, roadside, or warehouse; European setting",
        tension: `the person needs ${term} right now or just encountered it`,
      },
      {
        id: 2,
        name: "Question",
        role: "question",
        copy: `${term} / ${translation}`,
        scene_intent: `close demonstration of ${termAnchor} in active ADR use — hero shot of the term`,
        visual_hint: `${termAnchor} fills or dominates the centre of the frame; worker's hands interacting with it`,
        layout_hint: "center_safe",
        subject: `worker actively handling or applying the concept/item of "${term}"`,
        context: "authentic industrial transport or hazmat setting",
        tension: `task in progress, the specific item or action of "${term}" clearly visible`,
      },
      {
        id: 3,
        name: "Answers",
        role: "answers",
        copy: synonym ? `${synonym}. ${explanation}` : explanation,
        scene_intent: `${termAnchor} correctly applied — result and clarity visible`,
        visual_hint: `${termAnchor} in its correct final state or position; resolution visible`,
        layout_hint: "center_safe",
        subject: `driver or worker with small satisfied expression, task completed`,
        context: "same ADR setting, resolved outcome",
        tension: `competence and correct application of "${term}" visible`,
      },
      {
        id: 4,
        name: "Timer",
        role: "timer",
        copy: "Kurz merken",
        scene_intent: `memory pause — ${termAnchor} still visible in background`,
        visual_hint: `${termAnchor} still present but slightly defocused; worker pausing to reflect`,
        layout_hint: "center_safe",
        subject: `worker pausing with ${term} still in frame`,
        context: "same work scene held for recall",
        tension: `remember what "${term}" means`,
      },
      {
        id: 5,
        name: "Answer",
        role: "answer",
        copy: `${term} = ${translation}`,
        scene_intent: `clear reveal of ${termAnchor} — correct placement and usage shown`,
        visual_hint: `${termAnchor} shown in its correct final position or application; worker completing the task`,
        layout_hint: "center_safe",
        subject: `worker demonstrating correct use of "${term}"`,
        context: "real ADR setting showing the resolved answer",
        tension: "resolution and competence visible",
      },
      {
        id: 6,
        name: "CTA",
        role: "cta",
        copy: text(scenario.cta_text),
        scene_intent: `natural continuation — ${termAnchor} in background, driver moving to next task`,
        visual_hint: `${termAnchor} visible or implied; same ADR world, not a generic static end card`,
        layout_hint: "center_safe",
        subject: "driver or worker ready for next training step",
        context: "ADR study continuation, same transport setting",
        tension: "easy conversion into more training",
      },
    ],
  };
}


async function resolveWordVoiceoverAsset(tempDir, outputDir, wordInput, scenario) {
  const voiceScript = buildWordVoiceoverScript(wordInput, scenario);
  const voiceoverTargetPath = path.join(tempDir, "voiceover.mp3");

  try {
    const generated = await synthesizeVoiceoverToFile(voiceoverTargetPath, voiceScript, DEFAULT_WORD_TTS_VOICE);
    if (!generated) {
      return {
        voiceoverUrl: "",
        voiceMode: "none",
        voiceoverDurationSec: 0,
        voiceScript,
        generatedFromWord: false,
      };
    }

    const temporaryUpload = await uploadFileToTemporaryHost(voiceoverTargetPath, {
      diagnosticsDir: outputDir,
      frameId: "word_voiceover",
      expectedMimePrefixes: ["audio/", "application/octet-stream"],
    });

    return {
      voiceoverUrl: temporaryUpload.uploadedUrl,
      voiceMode: "tts",
      voiceoverDurationSec: probeAudioDurationSec(voiceoverTargetPath),
      voiceScript,
      generatedFromWord: true,
    };
  } catch (error) {
    console.warn(`WORD TTS generation failed, keeping visual-only package: ${error.message}`);
    return {
      voiceoverUrl: "",
      voiceMode: "none",
      voiceoverDurationSec: 0,
      voiceScript,
      generatedFromWord: false,
    };
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  await bootstrapLocalRuntimeEnv(repoRoot);
  const wordInput = await loadJson(args.inputPath);

  if (text(wordInput.source_type) !== "WORD") {
    throw new Error("Input must be a WORD source package.");
  }
  if (!text(wordInput.payload?.de_term) || !text(wordInput.payload?.simple_explanation)) {
    throw new Error("WORD input is missing de_term or simple_explanation.");
  }

  const classification = buildClassification(wordInput);
  const scenario = buildScenario(wordInput, classification);
  const renderTask = buildRenderTask(wordInput, scenario);
  const slug = slugify(`${wordInput.source_id}-${renderTask.render_task_id}`) || "word-render-package";

  const tempDir = await mkdtemp(path.join(os.tmpdir(), "adr-word-render-"));
  const planPath = path.join(tempDir, "word-plan.json");
  const packagePath = path.join(tempDir, "word-render-package.json");
  const outputDir = path.join(args.outputRoot, slug);
  const visualBrief = buildWordVisualBrief(wordInput, scenario);
  const shortform = buildWordShortformContract(wordInput, scenario);
  await writeFile(packagePath, `${JSON.stringify(renderTask, null, 2)}\n`, "utf8");

  try {
    await mkdir(outputDir, { recursive: true });
    const visualBundle = await prepareGenericGeneratedVisualPackage({
      publicAssetBaseUrl: args.generatedAssetPublicBaseUrl,
      project: args.project,
      videoId: `${slug}-${Date.now()}`,
      sourceId: text(wordInput.source_id),
      shortform,
      brief: visualBrief,
      diagnosticsDir: outputDir,
      stagingRoot: args.generatedAssetLocalStagingRoot,
    });
    const voiceoverAsset = await resolveWordVoiceoverAsset(tempDir, outputDir, wordInput, scenario);
    renderTask.duration_target_sec =
      Number(voiceoverAsset.voiceoverDurationSec || 0) > 0
        ? Math.max(12, Math.ceil(Number(voiceoverAsset.voiceoverDurationSec)) + 2)
        : renderTask.duration_target_sec;
    renderTask.audio_policy = text(voiceoverAsset.voiceoverUrl) ? "voiceover_only_word_test" : "none_for_first_visual_test";
    renderTask.voice_mode = text(voiceoverAsset.voiceMode) || "none";
    renderTask.voiceover_url = text(voiceoverAsset.voiceoverUrl);
    renderTask.voice_script = text(voiceoverAsset.voiceScript);
    renderTask.voice_generated_from_word = Boolean(voiceoverAsset.generatedFromWord);
    renderTask.generated_visual = {
      asset_url: text(visualBundle.asset_url),
      scene_asset_urls: Array.isArray(visualBundle.scene_asset_urls) ? visualBundle.scene_asset_urls : [],
      hook_snapshot: visualBundle.hook_snapshot || null,
    };
    renderTask.generated_visual_asset_url = text(visualBundle.asset_url);
    renderTask.asset_url = text(visualBundle.asset_url);
    renderTask.hook_snapshot = visualBundle.hook_snapshot || null;
    await writeFile(packagePath, `${JSON.stringify(renderTask, null, 2)}\n`, "utf8");

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

    await writeFile(path.join(outputDir, "word_source.json"), `${JSON.stringify(wordInput, null, 2)}\n`, "utf8");
    await writeFile(path.join(outputDir, "classification.json"), `${JSON.stringify(classification, null, 2)}\n`, "utf8");
    await writeFile(path.join(outputDir, "scenario.json"), `${JSON.stringify(scenario, null, 2)}\n`, "utf8");
    await writeFile(path.join(outputDir, "visual_brief.json"), `${JSON.stringify(visualBrief, null, 2)}\n`, "utf8");
    await writeFile(path.join(outputDir, "shortform_contract.json"), `${JSON.stringify(shortform, null, 2)}\n`, "utf8");
    await writeFile(path.join(outputDir, "render_task.json"), `${JSON.stringify(renderTask, null, 2)}\n`, "utf8");

    console.log(`slug=${slug}`);
    console.log(`output_dir=${outputDir}`);
    console.log(`trace_id=${scenario.trace_id}`);
    console.log(`scenario=${path.join(outputDir, "scenario.json")}`);
    console.log(`render_task=${path.join(outputDir, "render_task.json")}`);
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
