#!/usr/bin/env node

import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { uploadFileToTemporaryHost } from "./runtime/temporary-upload.mjs";
import { prepareGenericGeneratedVisualPackage } from "./render/prepare-generic-generated-visuals.mjs";
import { bootstrapLocalRuntimeEnv } from "./runtime/local-runtime-env.mjs";

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
const DEFAULT_WORD_TTS_MODEL = process.env.WORD_TTS_MODEL || "gpt-4o-mini-tts";
const DEFAULT_WORD_TTS_VOICE = process.env.WORD_TTS_VOICE || "alloy";

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
  const result = spawnSync("afinfo", [localPath], {
    cwd: repoRoot,
    encoding: "utf8",
    stdio: "pipe",
  });
  if (result.status !== 0) {
    return 0;
  }
  const output = `${result.stdout || ""}\n${result.stderr || ""}`;
  const match = output.match(/estimated duration:\s*([0-9.]+)\s*sec/i);
  return match ? Number(match[1]) || 0 : 0;
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
  const durationTargetSec = voiceoverDurationSec > 0 ? Math.max(12, Math.ceil(voiceoverDurationSec) + 2) : 9;

  return {
    trace_id: scenario.trace_id,
    scenario_id: scenario.scenario_id,
    render_task_id: `${text(wordInput.source_id)}-render-01`,
    source_type: "WORD",
    source_id: text(wordInput.source_id),
    source_family: "WORD",
    content_family: "WORD",
    template_id: "T2",
    render_family: "Word Card Short",
    title: `Was bedeutet ${term}?`,
    description: [
      `${term} = ${translation}.`,
      scenario.short_explanation,
      "",
      "Mehr ADR-Begriffe im Telegram-Bot: @adr_pruefung_trainer_bot",
    ]
      .filter(Boolean)
      .join("\n"),
    caption_text: scenario.caption_text,
    cta_text: scenario.cta_text,
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
        scene_intent: "vocabulary_attention_hook",
        visual_hint: `real ADR training moment centered on the term "${term}" with immediate curiosity and practical transport context`,
        layout_hint: "hero_top_safe",
        subject: `ADR term highlight: ${term}`,
        context: "real transport or loading environment connected to the term",
        tension: "viewer wants the meaning immediately",
      },
      {
        id: 2,
        name: "Question",
        role: "question",
        copy: `${term} / ${translation}`,
        scene_intent: "term_context_focus",
        visual_hint: `practical field context showing what "${term}" refers to in ADR work, no decorative end-card styling`,
        layout_hint: "center_safe",
        subject: `${term} in real ADR context`,
        context: "warehouse, truck, loading, or inspection moment where the term makes sense",
        tension: "connect the term to a real situation",
      },
      {
        id: 3,
        name: "Answers",
        role: "answers",
        copy: synonym ? `${synonym}. ${explanation}` : explanation,
        scene_intent: "meaning_expansion",
        visual_hint: `show the practical consequence or object behind "${term}" so the meaning becomes obvious`,
        layout_hint: "center_safe",
        subject: `meaning of ${term}`,
        context: "practical ADR work scene",
        tension: "clarify the exact meaning",
      },
      {
        id: 4,
        name: "Timer",
        role: "timer",
        copy: "Kurz merken",
        scene_intent: "memory_pause",
        visual_hint: `brief pause inside the same real ADR setting, keep focus on remembering "${term}"`,
        layout_hint: "center_safe",
        subject: `memory cue for ${term}`,
        context: "same work scene held for recall",
        tension: "commit the meaning to memory",
      },
      {
        id: 5,
        name: "Answer",
        role: "answer",
        copy: `${term} = ${translation}`,
        scene_intent: "meaning_reveal",
        visual_hint: `clear reveal of the object or situation behind "${term}" in a real ADR environment`,
        layout_hint: "center_safe",
        subject: `resolved meaning of ${term}`,
        context: "real ADR setting showing the answer",
        tension: "resolution and understanding",
      },
      {
        id: 6,
        name: "CTA",
        role: "cta",
        copy: text(scenario.cta_text),
        scene_intent: "telegram_conversion_cta",
        visual_hint: "natural continuation into Telegram bot learning flow, same ADR world, not a generic static end card",
        layout_hint: "center_safe",
        subject: "next learning step",
        context: "ADR study continuation",
        tension: "easy conversion into more training",
      },
    ],
  };
}

async function synthesizeWordVoiceoverToFile(outputPath, scriptText) {
  const apiKey = text(process.env.OPENAI_API_KEY || process.env.OPENAI_API_TOKEN);
  if (!apiKey || !text(scriptText)) {
    return false;
  }

  const response = await fetch("https://api.openai.com/v1/audio/speech", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: DEFAULT_WORD_TTS_MODEL,
      voice: DEFAULT_WORD_TTS_VOICE,
      format: "mp3",
      input: scriptText,
    }),
  });

  if (!response.ok) {
    throw new Error(`WORD TTS request failed with HTTP ${response.status}.`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  if (buffer.length === 0) {
    throw new Error("WORD TTS returned an empty audio buffer.");
  }

  await writeFile(outputPath, buffer);
  return true;
}

async function resolveWordVoiceoverAsset(tempDir, outputDir, wordInput, scenario) {
  const voiceScript = buildWordVoiceoverScript(wordInput, scenario);
  const voiceoverTargetPath = path.join(tempDir, "voiceover.mp3");

  try {
    const generated = await synthesizeWordVoiceoverToFile(voiceoverTargetPath, voiceScript);
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
