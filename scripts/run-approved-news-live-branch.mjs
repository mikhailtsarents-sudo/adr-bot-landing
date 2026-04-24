#!/usr/bin/env node

import { mkdir, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { uploadFileToTemporaryHost } from "./runtime/temporary-upload.mjs";
import { prepareGenericGeneratedVisualPackage } from "./render/prepare-generic-generated-visuals.mjs";
import { appendYoutubeTelegramAttribution } from "./runtime/telegram-source-links.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const DEFAULT_OUTPUT_ROOT = path.join(os.tmpdir(), "adr-approved-news-live");
const DEFAULT_GENERATED_ASSET_PUBLIC_BASE_URL =
  process.env.GENERATED_ASSET_PUBLIC_BASE_URL || "http://46.225.170.55:8080";
const DEFAULT_GENERATED_ASSET_LOCAL_STAGING_ROOT =
  process.env.GENERATED_ASSET_LOCAL_STAGING_ROOT || path.join(os.tmpdir(), "adr-generated-assets-staging");
const DEFAULT_NEWS_TTS_MODEL = process.env.NEWS_TTS_MODEL || "gpt-4o-mini-tts";
const DEFAULT_NEWS_TTS_VOICE = process.env.NEWS_TTS_VOICE || "alloy";

function printHelp() {
  console.log(`Usage: node scripts/run-approved-news-live-branch.mjs --input <approved-row.json> [options]

Options:
  --input <file>           Approved storage row JSON
  --output-root <dir>      Output root (default: ${DEFAULT_OUTPUT_ROOT})
  --final-mp4-url <url>    Final MP4 URL to stamp into publish-ready package
  --keep-temp              Keep all intermediate files
  --help                   Show this help
`);
}

function parseArgs(argv) {
  const args = {
    inputPath: "",
    outputRoot: DEFAULT_OUTPUT_ROOT,
    generatedAssetPublicBaseUrl: DEFAULT_GENERATED_ASSET_PUBLIC_BASE_URL,
    generatedAssetLocalStagingRoot: DEFAULT_GENERATED_ASSET_LOCAL_STAGING_ROOT,
    finalMp4Url: "",
    keepTemp: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === "--input") args.inputPath = path.resolve(argv[++i]);
    else if (token === "--output-root") args.outputRoot = path.resolve(argv[++i]);
    else if (token === "--generated-asset-public-base-url") args.generatedAssetPublicBaseUrl = argv[++i];
    else if (token === "--generated-asset-local-staging-root") args.generatedAssetLocalStagingRoot = path.resolve(argv[++i]);
    else if (token === "--final-mp4-url") args.finalMp4Url = argv[++i];
    else if (token === "--keep-temp") args.keepTemp = true;
    else if (token === "--help" || token === "-h") {
      printHelp();
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${token}`);
    }
  }

  if (!args.inputPath) {
    throw new Error("Missing --input <approved-row.json>.");
  }

  return args;
}

async function loadJson(filePath) {
  return JSON.parse(await readFile(filePath, "utf8"));
}

function text(value) {
  return value == null ? "" : String(value).trim();
}

function stripHtml(value) {
  return text(value)
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/gi, "$1")
    .replace(/<a\b[^>]*>/gi, " ")
    .replace(/<a\b[^>]*>([\s\S]*?)<\/a>/gi, "$1")
    .replace(/<[^>]+>/g, " ")
    .replace(/<[^>\n]*$/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, "\"")
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function compactNewsText(value, maxLength = 220) {
  const cleaned = stripHtml(value)
    .replace(/https?:\/\/\S+/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
  return cleaned.slice(0, maxLength).trim();
}

function extractFirstUrl(value) {
  const match = text(value).match(/https?:\/\/\S+/i);
  return match ? text(match[0]).replace(/[)>.,]+$/g, "") : "";
}

function slugify(value) {
  return text(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function parseHashtags(value) {
  return text(value)
    .split(/\s+/)
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function feedbackValue(value, key) {
  const match = text(value).match(new RegExp(`${key}=([^\\s]+)`));
  return match ? match[1] : "";
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

function normalizeApprovedNewsRow(row) {
  const draftId = text(row.draft_id);
  const newsId = text(row.story_id) || draftId;
  const traceId = text(row.trace_id) || feedbackValue(row.feedback, "trace_id") || `${draftId}-trace`;
  const hashtags = parseHashtags(row.hashtags);
  const cleanHeadline = compactNewsText(row.headline, 100);
  const cleanSummary = compactNewsText(row.post_text, 260);
  const cleanSourceTitle = compactNewsText(row.source_title, 140);
  const cleanCta = compactNewsText(row.cta, 90);
  const resolvedSourceUrl =
    text(row.source_url)
    || extractFirstUrl(row.post_text)
    || extractFirstUrl(row.feedback)
    || "https://www.adr-bot.de";

  return {
    source_type: "NEWS",
    news_id: newsId,
    draft_id: draftId,
    trace_id: traceId,
    source_version: "g3-approved",
    base_lang: "de",
    audience: "ADR / LKW",
    topic_tags: hashtags,
    difficulty: "medium",
    approval_state: "approved",
    publish_target: "youtube_shorts",
    approval_source: text(row.source_name) || "ADR Draft Storage",
    approved_at: text(row.created_at) || text(row.createdAt),
    approved_by: "telegram_approve",
    payload: {
      title_de: cleanHeadline,
      summary_de: cleanSummary,
      source: cleanSourceTitle,
      source_url: resolvedSourceUrl,
      topic: "ADR news",
      published_at: text(row.created_at) || text(row.createdAt),
      cta_variant: cleanCta,
      asset_policy: "news_card_short_v1",
    },
    trace: {
      origin_task: "G-3.2A",
      origin_workflow: "ADR Draft Storage",
      origin_row_id: text(row.id),
    },
    storage_row: row,
  };
}

function buildScenarioRequest(approvedNews) {
  return {
    trace_id: approvedNews.trace_id,
    source_type: "NEWS",
    source_id: approvedNews.news_id,
    source_family: "NEWS",
    template_id: "T5",
    language_base: "de",
    target_language: "de",
    audience: approvedNews.audience || "ADR / LKW",
    difficulty: approvedNews.difficulty || "medium",
    duration_target_sec: 12,
    analytics_tag: "news_short",
    source_payload: {
      title_de: approvedNews.payload.title_de,
      summary_de: approvedNews.payload.summary_de,
      source: approvedNews.payload.source,
      topic: approvedNews.payload.topic,
      approval_state: "approved",
      cta_variant: approvedNews.payload.cta_variant,
      asset_policy: approvedNews.payload.asset_policy,
    },
  };
}

function buildScenarioResponse(approvedNews, scenarioRequest) {
  const headline = approvedNews.payload.title_de;
  const summary = approvedNews.payload.summary_de;
  const cta = approvedNews.payload.cta_variant;
  const hashtags = approvedNews.topic_tags.length > 0 ? approvedNews.topic_tags : ["#ADR", "#Gefahrgut", "#LKW", "#Deutschland", "#Logistik"];

  return {
    trace_id: approvedNews.trace_id,
    scenario_id: `${approvedNews.news_id}-scenario-01`,
    source_type: "NEWS",
    source_id: approvedNews.news_id,
    source_family: "NEWS",
    content_family: "NEWS",
    template_id: "T5",
    hook_text: headline,
    scene_plan: [
      { id: 1, role: "hook", text: headline },
      { id: 2, role: "question", text: "Was ist fuer Fahrer jetzt wichtig?" },
      { id: 3, role: "answers", text: summary },
      { id: 4, role: "timer", text: "Kurz merken, dann weiter." },
      { id: 5, role: "answer", text: "Wichtig sind die konkreten Auswirkungen fuer Fahrer und Unternehmen." },
      { id: 6, role: "cta", text: cta },
    ],
    body_blocks: [
      headline,
      summary,
      "Fokus: praktische Relevanz fuer Fahrer und Unternehmen.",
    ],
    core_answer: "Die Meldung ist nur dann nuetzlich, wenn Fahrer und Unternehmen wissen, was jetzt konkret zu beachten ist.",
    short_explanation: summary,
    cta_text: cta,
    caption_text: [headline, summary, cta].filter(Boolean).join(" "),
    hashtags,
    analytics_tag: scenarioRequest.analytics_tag,
    validation_status: "pass",
  };
}

function buildCanvaBrief(approvedNews, scenarioResponse) {
  return {
    brief_id: `${approvedNews.news_id}-brief-01`,
    trace_id: approvedNews.trace_id,
    scenario_id: scenarioResponse.scenario_id,
    source_type: "NEWS",
    content_family: "NEWS",
    format: "vertical_short",
    slide_count: 6,
    template_family: "T5_NEWS",
    template_id: "T5",
    visual_direction: "adr_news_card_clean",
    slides: [
      { id: 1, name: "Hook", role: "hook", copy: scenarioResponse.hook_text, visual_hint: "ADR headline opener" },
      { id: 2, name: "Question", role: "question", copy: "Was ist jetzt wichtig?", visual_hint: "framing question card" },
      { id: 3, name: "Answers", role: "answers", copy: approvedNews.payload.summary_de, visual_hint: "main summary card" },
      { id: 4, name: "Timer", role: "timer", copy: "Kurz merken", visual_hint: "pause / emphasis card" },
      { id: 5, name: "Answer", role: "answer", copy: scenarioResponse.core_answer, visual_hint: "practical answer card" },
      { id: 6, name: "CTA", role: "cta", copy: scenarioResponse.cta_text, visual_hint: "Telegram CTA card" },
    ],
  };
}

function buildNewsShortformContract(approvedNews, scenarioResponse) {
  return {
    hook: text(scenarioResponse.hook_text),
    question_short: "Was ist fuer Fahrer jetzt wichtig?",
    answers_short: [text(approvedNews.payload.summary_de)],
    correct_short: text(scenarioResponse.core_answer),
    explanation_short: text(approvedNews.payload.summary_de),
    cta: text(scenarioResponse.cta_text),
  };
}

function buildNewsPackage(approvedNews, scenarioResponse, canvaBrief) {
  const sceneFiles = [
    ["hook", "slide1-hook.png", scenarioResponse.hook_text],
    ["question", "slide2-question.png", "Was ist jetzt wichtig?"],
    ["answers", "slide3-answers.png", approvedNews.payload.summary_de],
    ["timer", "slide4-timer.png", "Kurz merken"],
    ["answer", "slide5-answer.png", scenarioResponse.core_answer],
    ["cta", "slide6-cta.png", scenarioResponse.cta_text],
  ];

  return {
    trace_id: approvedNews.trace_id,
    news_id: approvedNews.news_id,
    news_version: text(approvedNews.storage_row.version) || "1",
    scenario_id: scenarioResponse.scenario_id,
    brief_id: canvaBrief.brief_id,
    approval_state: "approved",
    language: "de",
    render_family: "News Card",
    template_family: "News Card",
    template_id: "T5",
    asset_format_target: "news_card_short_v1",
    gpt_scenario_ready: true,
    allow_template_fallback: false,
    allow_generic_fallback: false,
    batch_id: `${approvedNews.news_id}-batch-01`,
    scenes: sceneFiles.map(([role, fileName, copyText], index) => ({
      scene_id: index + 1,
      role,
      input_path: fileName,
      export_name: `slide${index + 1}.png`,
      source_design_id: `${canvaBrief.brief_id}-${role}`,
      page_url: "",
      copy_text: copyText,
    })),
  };
}

function buildRenderTask(approvedNews, scenarioResponse, newsPackage) {
  const row = approvedNews.storage_row;
  const sourceUrl = text(approvedNews.payload.source_url) || text(row.source_url) || "https://www.adr-bot.de";
  const sourceTitle = text(row.source_title) || text(approvedNews.payload.source) || text(row.source_name) || "ADR News";
  const voiceoverDurationSec = Number(approvedNews.voiceover_duration_sec || 0);
  const durationTargetSec = voiceoverDurationSec > 0 ? Math.max(13, Math.ceil(voiceoverDurationSec) + 2) : 12;
  const renderTaskId = `${approvedNews.news_id}-render-01`;
  const youtubeAttribution = appendYoutubeTelegramAttribution(
    [
      approvedNews.payload.summary_de,
      "",
      approvedNews.payload.cta_variant,
      "",
      `Quelle: ${sourceTitle}`,
      sourceUrl,
    ]
      .filter(Boolean)
      .join("\n"),
    { contentId: renderTaskId, surface: "shorts" },
  );
  return {
    trace_id: approvedNews.trace_id,
    scenario_id: scenarioResponse.scenario_id,
    render_task_id: renderTaskId,
    source_type: "NEWS",
    source_id: approvedNews.news_id,
    source_family: "NEWS",
    content_family: "NEWS",
    template_id: "T5",
    render_family: "News Card",
    title: approvedNews.payload.title_de,
    description: youtubeAttribution.description,
    caption_text: scenarioResponse.caption_text,
    cta_text: scenarioResponse.cta_text,
    cta_url: youtubeAttribution.ctaUrl,
    entry_source_token: youtubeAttribution.startToken,
    scene_plan: scenarioResponse.scene_plan,
    hashtags: scenarioResponse.hashtags,
    analytics_tag: scenarioResponse.analytics_tag,
    language: "de",
    visibility: "public",
    duration_target_sec: durationTargetSec,
    subtitle_policy: "burned_or_external_srt",
    source_title: sourceTitle,
    source_url: sourceUrl,
    source_name: text(row.source_name) || "approved-news-live-branch",
    topic_type: "news",
    publish_target: "youtube_shorts",
    publish_adapter: "youtube_short_adapter",
    approval_state: "approved",
    publish_state: "publish_ready",
    delivery_state: "not_sent",
    render_status: "assets_packaged",
    audio_policy: text(approvedNews.voiceover_url) ? "voiceover_only_news_test" : "none_for_first_visual_test",
    voice_mode: text(approvedNews.voice_mode) || (text(approvedNews.voiceover_url) ? "voiceover" : "none"),
    voiceover_url: text(approvedNews.voiceover_url),
    voice_script: text(approvedNews.voice_script),
    bridge_draft_id: text(row.draft_id),
    version: text(row.version) || "1",
    manifest_id: `${approvedNews.news_id}-manifest-01`,
  };
}

function buildNewsVoiceoverScript(approvedNews, scenarioResponse) {
  return [
    text(scenarioResponse.hook_text),
    text(approvedNews.payload?.summary_de),
    text(scenarioResponse.core_answer),
    text(scenarioResponse.cta_text),
  ]
    .filter(Boolean)
    .join(" ");
}

function probeAudioDurationSec(localPath) {
  if (!text(localPath)) return 0;
  const result = spawnSync("afinfo", [localPath], {
    cwd: repoRoot,
    encoding: "utf8",
    stdio: "pipe",
  });
  if (result.status !== 0) return 0;
  const output = `${result.stdout || ""}\n${result.stderr || ""}`;
  const match = output.match(/estimated duration:\s*([0-9.]+)\s*sec/i);
  return match ? Number(match[1]) || 0 : 0;
}

async function synthesizeNewsVoiceoverToFile(outputPath, scriptText) {
  const apiKey = text(process.env.OPENAI_API_KEY || process.env.OPENAI_API_TOKEN);
  if (!apiKey) {
    throw new Error("Missing OPENAI_API_KEY for NEWS TTS generation.");
  }

  const response = await fetch("https://api.openai.com/v1/audio/speech", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: DEFAULT_NEWS_TTS_MODEL,
      voice: DEFAULT_NEWS_TTS_VOICE,
      input: text(scriptText),
      format: "mp3",
    }),
  });

  if (!response.ok) {
    throw new Error(`NEWS TTS failed: ${response.status} ${await response.text()}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  await writeFile(outputPath, Buffer.from(arrayBuffer));
  return outputPath;
}

async function resolveNewsVoiceoverAsset(outputDir, approvedNews, scenarioResponse) {
  const voiceScript = buildNewsVoiceoverScript(approvedNews, scenarioResponse);
  const voiceoverTargetPath = path.join(outputDir, "voiceover.mp3");
  await synthesizeNewsVoiceoverToFile(voiceoverTargetPath, voiceScript);
  const temporaryUpload = await uploadFileToTemporaryHost(voiceoverTargetPath, {
    diagnosticsDir: outputDir,
    frameId: "news_voiceover",
    expectedMimePrefixes: ["audio/", "application/octet-stream"],
  });
  return {
    voiceoverUrl: temporaryUpload.uploadedUrl,
    voiceScript,
    voiceMode: "tts",
    voiceoverDurationSec: probeAudioDurationSec(voiceoverTargetPath),
  };
}

function extractTimelineEnd(renderPayload) {
  const tracks = Array.isArray(renderPayload?.timeline?.tracks) ? renderPayload.timeline.tracks : [];
  let endSec = 0;
  for (const track of tracks) {
    const clips = Array.isArray(track?.clips) ? track.clips : [];
    for (const clip of clips) {
      const start = Number(clip?.start) || 0;
      const length = Number(clip?.length) || 0;
      endSec = Math.max(endSec, start + length);
    }
  }
  return Number(endSec.toFixed(3));
}

async function validatePreparedNewsPackage(packageDir) {
  const publishReadyPath = path.join(packageDir, "publish_ready_package.json");
  const shotstackPayloadPath = path.join(packageDir, "shotstack_render_payload.json");
  const shotstackInputPath = path.join(packageDir, "shotstack_input.json");
  const [publishReady, renderPayload, shotstackInput] = await Promise.all([
    loadJson(publishReadyPath),
    loadJson(shotstackPayloadPath),
    loadJson(shotstackInputPath),
  ]);

  const issues = [];
  const title = text(publishReady.title);
  const description = text(publishReady.description);
  const ctaText = text(publishReady.cta_text);
  if (!title) issues.push("Missing publish_ready.title");
  if (!description) issues.push("Missing publish_ready.description");
  if (!ctaText) issues.push("Missing publish_ready.cta_text");

  const tracks = Array.isArray(renderPayload?.timeline?.tracks) ? renderPayload.timeline.tracks : [];
  const imageClips = tracks.flatMap((track) => Array.isArray(track?.clips) ? track.clips : [])
    .filter((clip) => clip?.asset?.type === "image");
  const audioClips = tracks.flatMap((track) => Array.isArray(track?.clips) ? track.clips : [])
    .filter((clip) => clip?.asset?.type === "audio");
  const slideSrcs = imageClips.map((clip) => text(clip?.asset?.src)).filter(Boolean);
  const audioSrcs = audioClips.map((clip) => text(clip?.asset?.src)).filter(Boolean);
  const htmlClips = tracks.flatMap((track) => Array.isArray(track?.clips) ? track.clips : [])
    .filter((clip) => clip?.asset?.type === "html");
  const ctaClips = htmlClips.filter((clip) => {
    const html = text(clip?.asset?.html).toLowerCase();
    return html.includes("telegram") || html.includes("kostenlos starten") || html.includes("starten ↗");
  });
  if (ctaClips.length === 0) {
    issues.push("Shotstack payload is missing Telegram CTA clips");
  }

  const timelineDurationSec = extractTimelineEnd(renderPayload);
  const ctaStartSec = ctaClips.length > 0 ? Math.min(...ctaClips.map((clip) => Number(clip.start) || 0)) : 0;
  const ctaLengthSec = ctaClips.length > 0 ? Math.max(...ctaClips.map((clip) => Number(clip.length) || 0)) : 0;
  if (ctaClips.length > 0 && ctaLengthSec < 2.5) {
    issues.push(`CTA duration too short (${ctaLengthSec}s)`);
  }
  if (ctaClips.length > 0 && ctaStartSec >= timelineDurationSec) {
    issues.push("CTA starts after timeline end");
  }
  if (slideSrcs.some((src) => /\/current\/slide\d+\.png(?:\?|$)/i.test(src))) {
    issues.push("Shotstack payload still uses shared current/slide*.png assets");
  }
  if (slideSrcs.length < 6) {
    issues.push(`Expected 6 image slides, got ${slideSrcs.length}`);
  }
  const shotstackVoiceoverUrl = text(shotstackInput?.audio?.voiceover_url);
  if (!shotstackVoiceoverUrl) {
    issues.push("Shotstack input is missing audio.voiceover_url");
  }
  if (audioSrcs.length === 0) {
    issues.push("Shotstack payload is missing audio clip");
  }
  if (shotstackVoiceoverUrl && audioSrcs.length > 0 && !audioSrcs.includes(shotstackVoiceoverUrl)) {
    issues.push("Shotstack payload audio clip does not match shotstack input voiceover URL");
  }

  const report = {
    created_at: new Date().toISOString(),
    package_dir: packageDir,
    title_present: Boolean(title),
    description_present: Boolean(description),
    cta_present: Boolean(ctaText),
    cta_clip_count: ctaClips.length,
    cta_start_sec: ctaStartSec,
    cta_length_sec: ctaLengthSec,
    timeline_duration_sec: timelineDurationSec,
    slide_srcs: slideSrcs,
    audio_srcs: audioSrcs,
    voiceover_url: shotstackVoiceoverUrl,
    issues,
    status: issues.length === 0 ? "pass" : "fail",
  };
  const reportPath = path.join(packageDir, "news_preflight_report.json");
  await writeJson(reportPath, report);
  if (issues.length > 0) {
    throw new Error(`Prepared NEWS package failed validation: ${issues.join("; ")}`);
  }
  return reportPath;
}

async function writeJson(filePath, payload) {
  await writeFile(filePath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const inputRow = await loadJson(args.inputPath);
  const approvedNews = normalizeApprovedNewsRow(inputRow);
  const slug = slugify(`${approvedNews.news_id}-${approvedNews.trace_id}`) || `approved-news-${Date.now()}`;
  const outputDir = path.join(args.outputRoot, slug);
  await mkdir(outputDir, { recursive: true });

  const approvedNewsPath = path.join(outputDir, "approved_news.json");
  const scenarioRequest = buildScenarioRequest(approvedNews);
  const scenarioResponse = buildScenarioResponse(approvedNews, scenarioRequest);
  const canvaBrief = buildCanvaBrief(approvedNews, scenarioResponse);
  const shortform = buildNewsShortformContract(approvedNews, scenarioResponse);
  const newsPackage = buildNewsPackage(approvedNews, scenarioResponse, canvaBrief);
  const voiceoverAsset = await resolveNewsVoiceoverAsset(outputDir, approvedNews, scenarioResponse);
  approvedNews.voiceover_url = text(voiceoverAsset.voiceoverUrl);
  approvedNews.voice_script = text(voiceoverAsset.voiceScript);
  approvedNews.voice_mode = text(voiceoverAsset.voiceMode) || "tts";
  approvedNews.voiceover_duration_sec = Number(voiceoverAsset.voiceoverDurationSec || 0);
  const renderTask = buildRenderTask(approvedNews, scenarioResponse, newsPackage);

  const scenarioRequestPath = path.join(outputDir, "scenario_request.json");
  const scenarioResponsePath = path.join(outputDir, "scenario_response.json");
  const canvaBriefPath = path.join(outputDir, "canva_brief.json");
  const newsPackagePath = path.join(outputDir, "news_package.json");
  const renderTaskPath = path.join(outputDir, "render_task.json");

  await writeJson(approvedNewsPath, approvedNews);
  await writeJson(scenarioRequestPath, scenarioRequest);
  await writeJson(scenarioResponsePath, scenarioResponse);
  await writeJson(canvaBriefPath, canvaBrief);
  await writeJson(newsPackagePath, newsPackage);
  await writeJson(renderTaskPath, renderTask);
  const visualBundle = await prepareGenericGeneratedVisualPackage({
    publicAssetBaseUrl: args.generatedAssetPublicBaseUrl,
    project: "adr-short-video",
    videoId: `${slug}-${Date.now()}`,
    sourceId: approvedNews.news_id,
    shortform,
    brief: canvaBrief,
    diagnosticsDir: outputDir,
    stagingRoot: args.generatedAssetLocalStagingRoot,
  });
  renderTask.generated_visual = {
    asset_url: text(visualBundle.asset_url),
    scene_asset_urls: Array.isArray(visualBundle.scene_asset_urls) ? visualBundle.scene_asset_urls : [],
    hook_snapshot: visualBundle.hook_snapshot || null,
  };
  renderTask.generated_visual_asset_url = text(visualBundle.asset_url);
  renderTask.asset_url = text(visualBundle.asset_url);
  renderTask.hook_snapshot = visualBundle.hook_snapshot || null;
  await writeJson(renderTaskPath, renderTask);

  runNodeScript(path.join(repoRoot, "scripts", "build-render-package.mjs"), [
    "--input",
    renderTaskPath,
    "--manifest",
    visualBundle.manifest_path,
    "--output-root",
    outputDir,
    "--slug",
    "render-package",
  ]);

  const packageDir = path.join(outputDir, "render-package");
  const preflightReportPath = await validatePreparedNewsPackage(packageDir);

  const report = {
    trace_id: approvedNews.trace_id,
    news_id: approvedNews.news_id,
    draft_id: approvedNews.draft_id,
    approved_row_id: text(inputRow.id),
    shadow_bundle_dir: path.join(outputDir, "shadow"),
    news_package_path: newsPackagePath,
    render_task_path: renderTaskPath,
    render_package_dir: packageDir,
    publish_ready_path: path.join(packageDir, "publish_ready_package.json"),
    g3_bridge_row_path: path.join(packageDir, "g3_bridge_row.json"),
    news_preflight_report_path: preflightReportPath,
    generated_visual_dir: text(visualBundle.generated_dir),
    final_mp4_url: "",
    status: "prepared",
    created_at: new Date().toISOString(),
  };
  const reportPath = path.join(outputDir, "run_report.json");
  await writeJson(reportPath, report);

  console.log(`output_dir=${outputDir}`);
  console.log(`approved_news=${approvedNewsPath}`);
  console.log(`news_package=${newsPackagePath}`);
  console.log(`render_package=${packageDir}`);
  console.log(`publish_ready=${report.publish_ready_path}`);
  console.log(`g3_bridge_row=${report.g3_bridge_row_path}`);
  console.log(`report=${reportPath}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
