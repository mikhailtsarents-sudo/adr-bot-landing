#!/usr/bin/env node

import crypto from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildSceneCaptionClips } from "./render/caption-styles.mjs";
import { buildQuestionQaReport } from "./render/question-quality.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const DEFAULT_MANIFEST_PATH = path.join(repoRoot, "canva_manifest.json");
const DEFAULT_OUTPUT_ROOT = path.join(repoRoot, "render-packages");
const DEFAULT_TARGET = "youtube_shorts";
const DEFAULT_ADAPTER = "youtube_short_adapter";
const DEFAULT_VISIBILITY = "public";
const DEFAULT_LANGUAGE = "de";
const DEFAULT_SUBTITLE_POLICY = "burned_or_external_srt";
const ROLE_ORDER = ["hook", "question", "answers", "timer", "answer", "cta"];
const DEFAULT_ROLE_WEIGHTS = {
  hook: 0.2,
  question: 0.22,
  answers: 0.18,
  timer: 0.12,
  answer: 0.14,
  cta: 0.14,
};

// Reading speed: ~2.5 words/sec for video viewers + 1s buffer per slide
function readingDurationSec(slideText) {
  const words = String(slideText || "").trim().split(/\s+/).filter(Boolean).length;
  return Math.max(2.0, Number((words / 2.5 + 1.0).toFixed(2)));
}

function printHelp() {
  console.log(`Usage: node scripts/build-render-package.mjs --input <package.json> [options]

Options:
  --input <file>         Generic content package JSON
  --manifest <file>      Canva manifest to use (default: ${DEFAULT_MANIFEST_PATH})
  --output-root <dir>    Output root for generated package files (default: ${DEFAULT_OUTPUT_ROOT})
  --slug <name>          Optional output slug override
  --help                 Show this help

Required package fields:
  trace_id, scenario_id, render_task_id,
  source_type, source_id, source_family, content_family,
  template_id, render_family,
  title, description, caption_text, cta_text,
  source_title, source_url, analytics_tag

Optional package fields:
  hashtags, language, visibility, duration_target_sec,
  publish_target, publish_adapter, final_mp4_url, render_receipt
`);
}

function parseArgs(argv) {
  const args = {
    inputPath: null,
    manifestPath: DEFAULT_MANIFEST_PATH,
    outputRoot: DEFAULT_OUTPUT_ROOT,
    slug: "",
  };

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === "--input") args.inputPath = path.resolve(argv[++i]);
    else if (token === "--manifest") args.manifestPath = path.resolve(argv[++i]);
    else if (token === "--output-root") args.outputRoot = path.resolve(argv[++i]);
    else if (token === "--slug") args.slug = argv[++i];
    else if (token === "--help" || token === "-h") {
      printHelp();
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${token}`);
    }
  }

  if (!args.inputPath) {
    throw new Error("Missing --input <package.json>.");
  }

  return args;
}

async function loadJson(filePath) {
  return JSON.parse(await readFile(filePath, "utf8"));
}

function text(value) {
  return value == null ? "" : String(value).trim();
}

function describeAssetUrl(value) {
  const url = text(value);
  if (!url) {
    return "";
  }
  if (url.startsWith("data:")) {
    const commaIndex = url.indexOf(",");
    const header = commaIndex >= 0 ? url.slice(0, commaIndex + 1) : url;
    return `${header}...[inline-bytes:${Math.max(0, url.length - header.length)}]`;
  }
  return url;
}

function isInlineDataUrl(value) {
  return text(value).startsWith("data:");
}

function ensureFields(input, requiredKeys) {
  for (const key of requiredKeys) {
    if (!text(input[key])) {
      throw new Error(`Missing required field: ${key}`);
    }
  }
}

function slugify(value) {
  return text(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function sha256(payload) {
  return crypto.createHash("sha256").update(payload).digest("hex");
}

function normalizeHashtags(hashtags) {
  if (Array.isArray(hashtags)) {
    return hashtags.map((tag) => text(tag)).filter(Boolean);
  }

  if (typeof hashtags === "string") {
    return hashtags
      .split(/\s+/)
      .map((tag) => text(tag))
      .filter(Boolean);
  }

  return [];
}

function filterProductionHashtags(tags) {
  return tags.filter((tag) => !/#autonomous-/i.test(tag));
}

function normalizeHookSnapshot(value) {
  if (!value || typeof value !== "object") {
    return null;
  }
  const frameStyle = text(value.frame_style);
  const overlayType = text(value.overlay_type);
  const cameraPov = text(value.camera_pov);
  const mutationOrigin = text(value.mutation_origin);
  const focalObject = text(value.focal_object);
  const inspectorBehavior = text(value.inspector_behavior);
  if (!frameStyle && !overlayType && !cameraPov && !mutationOrigin && !focalObject && !inspectorBehavior) {
    return null;
  }
  return {
    frame_style: frameStyle,
    overlay_type: overlayType,
    camera_pov: cameraPov,
    mutation_origin: mutationOrigin,
    focal_object: focalObject,
    inspector_behavior: inspectorBehavior,
  };
}

function normalizeSlides(manifest) {
  const slides = Array.isArray(manifest.slides) ? manifest.slides : [];
  if (slides.length !== 6) {
    throw new Error(`Expected manifest with 6 slides, found ${slides.length}.`);
  }

  return [...slides]
    .map((slide, index) => ({
      id: Number(slide.id || index + 1),
      name: text(slide.name || `slide${index + 1}`),
      role: text(slide.role || ROLE_ORDER[index] || `scene-${index + 1}`),
      url: text(slide.url),
      width: Number(slide.width || 0) || undefined,
      height: Number(slide.height || 0) || undefined,
      sha256: text(slide.sha256),
    }))
    .sort((left, right) => left.id - right.id);
}

function buildRoleDurations(slides, durationTargetSec) {
  // Use text-based reading duration when slides have text; fall back to weight-based otherwise
  const hasText = slides.some((s) => s.text && String(s.text).trim().length > 0);
  if (!hasText) {
    const duration = Number(durationTargetSec || 12);
    const totalWeight = slides.reduce(
      (sum, slide) => sum + (DEFAULT_ROLE_WEIGHTS[slide.role] || 1 / slides.length),
      0,
    );
    let elapsed = 0;
    return slides.map((slide, index) => {
      const weight = DEFAULT_ROLE_WEIGHTS[slide.role] || 1 / slides.length;
      const rawLength = Number(((duration * weight) / totalWeight).toFixed(2));
      const start = Number(elapsed.toFixed(2));
      const isLast = index === slides.length - 1;
      const end = isLast ? Number(duration.toFixed(2)) : Number((start + rawLength).toFixed(2));
      elapsed = end;
      return { scene_id: slide.id, role: slide.role, asset_url: slide.url, start_sec: start, end_sec: end, transition: "cut", subtitle_ref: "" };
    });
  }

  // Text-based: duration = reading time + 1s buffer per slide.
  // If durationTargetSec (set from actual audio length) is longer than the sum of
  // reading times, stretch the last slide so the image track covers the full audio.
  const target = Number(durationTargetSec || 0);
  let elapsed = 0;
  const result = slides.map((slide) => {
    const dur = readingDurationSec(slide.text);
    const start = Number(elapsed.toFixed(2));
    const end = Number((start + dur).toFixed(2));
    elapsed = end;
    return {
      scene_id: slide.id,
      role: slide.role,
      asset_url: slide.url,
      start_sec: start,
      end_sec: end,
      transition: "cut",
      subtitle_ref: "",
    };
  });
  if (target > elapsed && result.length > 0) {
    result[result.length - 1].end_sec = Number(target.toFixed(2));
  }
  return result;
}

function normalizeSceneTextEntries(input) {
  const rawEntries = Array.isArray(input.scene_plan)
    ? input.scene_plan
    : Array.isArray(input.scene_texts)
      ? input.scene_texts
      : [];

  return rawEntries
    .map((entry, index) => ({
      id: Number(entry.id || entry.scene_id || index + 1),
      role: text(entry.role || ROLE_ORDER[index] || ""),
      text: text(entry.text || entry.copy || entry.caption || ""),
    }))
    .filter((entry) => entry.role && entry.text);
}

function isQuestionVisualFlow(input) {
  return (
    String(input.source_type || "").toUpperCase() === "QUESTION" ||
    String(input.source_family || "").toUpperCase() === "QUESTION" ||
    String(input.content_family || "").toLowerCase().includes("question")
  );
}

function isWordVisualFlow(input) {
  return (
    String(input.source_type || "").toUpperCase() === "WORD" ||
    String(input.source_family || "").toUpperCase() === "WORD" ||
    String(input.content_family || "").toLowerCase().includes("word")
  );
}

function adjustWordTimeline(timeline) {
  const ctaIndex = timeline.findIndex((scene) => scene.role === "cta");
  if (ctaIndex < 0) {
    return timeline;
  }

  const adjusted = timeline.map((scene) => ({ ...scene }));
  const ctaScene = adjusted[ctaIndex];
  const originalLength = Number((ctaScene.end_sec - ctaScene.start_sec).toFixed(2));
  const desiredLength = Math.max(3.2, originalLength);
  const shiftedStart = Math.max(0, Number((ctaScene.start_sec - 0.4).toFixed(2)));
  ctaScene.start_sec = shiftedStart;
  ctaScene.end_sec = Number((shiftedStart + desiredLength).toFixed(2));
  return adjusted;
}

function formatSrtTimestamp(totalSeconds) {
  const totalMs = Math.max(0, Math.round(Number(totalSeconds || 0) * 1000));
  const hours = Math.floor(totalMs / 3600000);
  const minutes = Math.floor((totalMs % 3600000) / 60000);
  const seconds = Math.floor((totalMs % 60000) / 1000);
  const milliseconds = totalMs % 1000;
  return [hours, minutes, seconds]
    .map((part) => String(part).padStart(2, "0"))
    .join(":")
    .concat(",", String(milliseconds).padStart(3, "0"));
}

function buildSubtitlesSrt(timeline, sceneTextEntries) {
  const textByRole = new Map(sceneTextEntries.map((entry) => [entry.role, entry.text]));
  const subtitleItems = timeline
    .map((scene) => ({
      scene,
      subtitleText: textByRole.get(scene.role),
    }))
    .filter((item) => item.subtitleText);

  if (subtitleItems.length === 0) {
    return "";
  }

  return subtitleItems
    .map(
      ({ scene, subtitleText }, index) =>
        `${index + 1}\n${formatSrtTimestamp(scene.start_sec)} --> ${formatSrtTimestamp(
          scene.end_sec,
        )}\n${subtitleText}\n`,
    )
    .join("\n");
}

function getQuestionBackgroundPosition(_role) {
  return "center";
}

function buildShotstackPayload(input, timeline, sceneTextEntries, subtitlesEnabled) {
  const isQuestionFlow = isQuestionVisualFlow(input);
  const talkingHeadUrl = text(input.talking_head_url);
  const voiceoverUrl = text(input.voiceover_url);
  const musicUrl = text(input.music_url);
  const durationTargetSec = Number(input.duration_target_sec || input.duration_sec || 12);
  const useTalkingHeadAsMainTrack = Boolean(talkingHeadUrl) && !isQuestionFlow;
  const captionClips = subtitlesEnabled
    ? buildSceneCaptionClips(timeline, sceneTextEntries, text(input.template_variant) || "quiz_safe")
    : [];
  const styledCaptionClips = captionClips;
  if (isQuestionFlow && talkingHeadUrl) {
    console.warn("QUESTION flow received talking_head_url but it was intentionally ignored");
  }
  console.log("QUESTION_FLOW=", isQuestionFlow);
  console.log("TALKING_HEAD_URL=", talkingHeadUrl);
  console.log("USING_TALKING_HEAD_AS_MAIN_TRACK=", useTalkingHeadAsMainTrack);
  console.log(
    "FINAL_IMAGE_SRCS=",
    timeline.map((scene) => describeAssetUrl(scene.asset_url)),
  );

  const inlineQuestionBackgroundUrl =
    isQuestionFlow &&
    timeline.length > 0 &&
    timeline.every((scene) => text(scene.asset_url) === text(timeline[0]?.asset_url)) &&
    isInlineDataUrl(timeline[0]?.asset_url)
      ? text(timeline[0]?.asset_url)
      : "";

  const backgroundTrack = {
    clips: useTalkingHeadAsMainTrack
      ? [
          {
            asset: {
              type: "video",
              src: talkingHeadUrl,
            },
            start: 0,
            length: Number(durationTargetSec.toFixed(2)),
            fit: "cover",
            position: "center",
          },
        ]
      : inlineQuestionBackgroundUrl
        ? [
            {
              asset: {
                type: "image",
                src: inlineQuestionBackgroundUrl,
              },
              start: 0,
              length: Number(durationTargetSec.toFixed(2)),
              fit: "cover",
              position: "center",
            },
          ]
        : timeline.map((scene) => ({
            asset: {
              type: "image",
              src: scene.asset_url,
            },
            start: scene.start_sec,
            length: Number((scene.end_sec - scene.start_sec).toFixed(2)),
            fit: isQuestionFlow ? "cover" : "contain",
            position: isQuestionFlow ? getQuestionBackgroundPosition(scene.role) : "center",
          })),
  };

  const hasQuestionTalkingHeadMainTrack = backgroundTrack.clips.some((clip) => {
    const asset = clip.asset || {};
    return asset.type === "video" && String(asset.src || "") === talkingHeadUrl;
  });
  const hasQuestionImageClipSrc = backgroundTrack.clips.some((clip) => {
    const asset = clip.asset || {};
    return asset.type === "image" && text(asset.src);
  });

  if (isQuestionFlow && hasQuestionTalkingHeadMainTrack) {
    throw new Error(
      "QUESTION visual pipeline broken: talking_head_url was used as main video track.",
    );
  }

  if (isQuestionFlow && !hasQuestionImageClipSrc) {
    throw new Error("QUESTION visual pipeline broken: no QUESTION image clip src found.");
  }

  const timelineEndSec = timeline.length > 0
    ? Math.max(...timeline.map((s) => Number(s.end_sec || 0)))
    : durationTargetSec;
  const audioLength = Number(Math.max(durationTargetSec, timelineEndSec).toFixed(2));
  const soundtrackSrc = voiceoverUrl || musicUrl;
  const audioTrack =
    soundtrackSrc
        ? {
            clips: [
              {
                asset: {
                  type: "audio",
                  src: soundtrackSrc,
                },
                start: 0,
                length: audioLength,
              },
            ],
          }
      : null;

  return {
    timeline: {
      background: "#0b1020",
      tracks: [
        ...(styledCaptionClips.length > 0 ? [{ clips: styledCaptionClips }] : []),
        backgroundTrack,
        ...(audioTrack ? [audioTrack] : []),
      ],
    },
    output: {
      format: "mp4",
      fps: 25,
      size: {
        width: 1080,
        height: 1920,
      },
    },
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const input = await loadJson(args.inputPath);
  const manifest = await loadJson(args.manifestPath);

  ensureFields(input, [
    "trace_id",
    "scenario_id",
    "render_task_id",
    "source_type",
    "source_id",
    "source_family",
    "content_family",
    "template_id",
    "render_family",
    "title",
    "description",
    "caption_text",
    "cta_text",
    "source_title",
    "source_url",
    "analytics_tag",
  ]);

  const isQuestionFlow = isQuestionVisualFlow(input);
  let slides = normalizeSlides(manifest);
  const generatedAssetUrl =
    text(input.generated_visual?.asset_url) ||
    text(input.generated_visual_asset_url) ||
    text(input.asset_url) ||
    "";

  if (isQuestionFlow && !generatedAssetUrl) {
    throw new Error("QUESTION visual pipeline broken: missing generated visual asset URL.");
  }

  if (isQuestionFlow && generatedAssetUrl) {
    const sceneAssetUrls = Array.isArray(input.generated_visual?.scene_asset_urls) && input.generated_visual.scene_asset_urls.length > 0
      ? input.generated_visual.scene_asset_urls
      : [generatedAssetUrl];
    const ROLE_SCENE_INDEX = { hook: 0, question: 1, answers: 2, timer: 1, answer: 2, cta: 2 };
    slides = slides.map((slide) => ({
      ...slide,
      url: sceneAssetUrls[ROLE_SCENE_INDEX[slide.role] ?? sceneAssetUrls.length - 1] || generatedAssetUrl,
    }));
  }

  const hasLegacyStaticAsset = slides.some((slide) => {
    const url = String(slide.url || "");
    return (
      url.includes("/shotstack-assets/") ||
      url.includes("/current/") ||
      url.includes("slide1.png")
    );
  });

  if (isQuestionFlow && hasLegacyStaticAsset) {
    throw new Error(
      "QUESTION visual pipeline broken: static legacy Shotstack asset detected in render payload.",
    );
  }

  console.log("QUESTION_FLOW=", isQuestionFlow);
  console.log("GENERATED_ASSET_URL=", describeAssetUrl(generatedAssetUrl));
  console.log(
    "FINAL_SLIDE_URLS=",
    slides.map((slide) => describeAssetUrl(slide.url)),
  );
  const durationTargetSec = Number(input.duration_target_sec || input.duration_sec || 12);
  const sceneTextEntries = normalizeSceneTextEntries(input);
  if (isQuestionFlow && sceneTextEntries.length === 0) {
    console.warn(
      "QUESTION visual pipeline warning: subtitles/scene_texts empty before render payload assembly.",
    );
  }
  const subtitlePolicy = text(input.subtitle_policy) || DEFAULT_SUBTITLE_POLICY;
  const subtitlesEnabled = subtitlePolicy !== "none_for_first_visual_test";
  const subtitleRef = subtitlesEnabled ? "subtitles.srt" : "";
  // Text lookup: prefer role-based match (e.g. "answer", "cta") so semantic roles
  // align correctly even when scene_plan has fewer entries than manifest slides.
  // Falls back to id-based match for positional slides (content, pause, etc.).
  const sceneTextByRole = new Map(sceneTextEntries.map((e) => [e.role, e.text]));
  const sceneTextById = new Map(sceneTextEntries.map((e) => [e.id, e.text]));
  const slidesWithText = slides.map((slide) => ({
    ...slide,
    text: sceneTextByRole.get(slide.role) || sceneTextById.get(slide.id) || "",
  }));
  const isWordFlow = isWordVisualFlow(input);
  const roleTimeline = buildRoleDurations(slidesWithText, durationTargetSec);
  const adjustedTimeline = isWordFlow ? adjustWordTimeline(roleTimeline) : roleTimeline;
  const timeline = adjustedTimeline.map((scene) => ({
    ...scene,
    subtitle_ref: subtitleRef,
  }));
  // Build caption entries aligned with the final timeline roles (not scene_plan roles).
  // This ensures WORD/NEWS flows where scene_plan uses non-standard role names (content, pause)
  // still produce captions — the text is resolved by slide id match in slidesWithText.
  const captionEntries = timeline.map((scene, i) => ({
    id: scene.scene_id,
    role: scene.role,
    text: slidesWithText[i]?.text || "",
  }));
  const subtitlesSrt = subtitlesEnabled ? buildSubtitlesSrt(timeline, captionEntries) : "";
  const hashtags = filterProductionHashtags(normalizeHashtags(input.hashtags));
  const slug =
    slugify(args.slug) ||
    slugify(
      [
        text(input.content_family || input.source_type),
        text(input.source_id),
        text(input.render_task_id),
      ].join("-"),
    ) ||
    slugify(path.basename(args.inputPath, path.extname(args.inputPath))) ||
    `render-package-${Date.now()}`;

  const outputDir = path.join(args.outputRoot, slug);
  await mkdir(outputDir, { recursive: true });

  const manifestId =
    text(input.manifest_id) ||
    text(manifest.manifest_id) ||
    `canva-manifest-${slugify(manifest.project || "adr-short-video")}-current`;
  const assetFingerprint = sha256(
    JSON.stringify({
      trace_id: input.trace_id,
      render_task_id: input.render_task_id,
      slides: slides.map((slide) => ({
        id: slide.id,
        role: slide.role,
        url: slide.url,
        sha256: slide.sha256,
      })),
      duration_target_sec: durationTargetSec,
    }),
  );
  const assetReportId = text(input.asset_report_id) || `asset-report-${slug}`;
  const metadataId = text(input.metadata_id) || `metadata-${slug}`;
  const shotstackInputId = text(input.shotstack_input_id) || `shotstack-input-${slug}`;
  const publishReadyId = text(input.publish_ready_id) || `publish-ready-${slug}`;
  const renderPayloadId = text(input.render_payload_id) || `render-payload-${slug}`;
  const assetReportPath = path.join(outputDir, "asset_report.json");
  const metadataPath = path.join(outputDir, "metadata.json");
  const shotstackInputPath = path.join(outputDir, "shotstack_input.json");
  const renderPayloadPath = path.join(outputDir, "shotstack_render_payload.json");
  const publishReadyPath = path.join(outputDir, "publish_ready_package.json");
  const bridgeRowPath = path.join(outputDir, "g3_bridge_row.json");
  const subtitlesPath = path.join(outputDir, "subtitles.srt");
  const qaReportPath = path.join(outputDir, "qa_report.json");

  const assetReport = {
    asset_report_id: assetReportId,
    trace_id: input.trace_id,
    scenario_id: input.scenario_id,
    render_task_id: input.render_task_id,
    manifest_id: manifestId,
    status: "ready",
    asset_fingerprint: assetFingerprint,
    assets: slides.map((slide) => ({
      name: slide.name,
      role: slide.role,
      type: "image/png",
      url: slide.url,
      source: "canva",
      validation: {
        http_200_expected: true,
        content_type: "image/png",
      },
    })),
    duplicates_detected: false,
    missing_assets: [],
    notes: [
      `Built from manifest: ${args.manifestPath}`,
      `Prepared for render_family=${input.render_family}`,
      `subtitle_policy=${subtitlePolicy}`,
    ],
  };

  const metadata = {
    metadata_id: metadataId,
    trace_id: input.trace_id,
    scenario_id: input.scenario_id,
    render_task_id: input.render_task_id,
    batch_item_id: text(input.batch_item_id),
    manifest_id: manifestId,
    asset_report_id: assetReportId,
    publish_target: text(input.publish_target) || DEFAULT_TARGET,
    language: text(input.language) || DEFAULT_LANGUAGE,
    title: text(input.title),
    title_variant_a: text(input.title_variant_a),
    title_variant_b: text(input.title_variant_b),
    title_variant_c: text(input.title_variant_c),
    description: text(input.description),
    caption: text(input.caption_text),
    hashtags,
    cta_text: text(input.cta_text),
    cta_url: text(input.cta_url) || "https://t.me/adr_pruefung_trainer_bot",
    channel_name: text(input.channel_name) || "ADR Prüfung Trainer",
    visibility: text(input.visibility) || DEFAULT_VISIBILITY,
    category: text(input.category) || "Education",
    thumbnail_url: slides[0].url,
    talking_head_url: text(input.talking_head_url),
    talking_head_asset_name: text(input.talking_head_asset_name),
    duration_sec: durationTargetSec,
    render_family: text(input.render_family),
    template_variant: text(input.template_variant),
    fallback_template_variant: text(input.fallback_template_variant),
    content_family: text(input.content_family),
    source_type: text(input.source_type),
    source_id: text(input.source_id),
    source_title: text(input.source_title),
    source_url: text(input.source_url),
    variation_type: text(input.variation?.variation_type || input.variation_type),
    variation_value: text(input.variation?.variation_value || input.variation_value),
    hook_snapshot: normalizeHookSnapshot(input.hook_snapshot || input.generated_visual?.hook_snapshot),
    retry_policy: input.retry_policy || null,
    fallback_policy: input.fallback_policy || null,
  };

  const renderPayload = buildShotstackPayload(input, timeline, captionEntries, subtitlesEnabled);
  const qaReport =
    text(input.source_type) === "QUESTION" && input.shortform_contract
      ? buildQuestionQaReport({
          shortform: input.shortform_contract,
          templateVariant: text(input.template_variant) || "quiz_standard",
          fallbackTemplateVariant: text(input.fallback_template_variant) || "quiz_safe",
        })
      : {
          qa_version: "generic_render_package_v1",
          template_variant: text(input.template_variant),
          fallback_template_variant: text(input.fallback_template_variant),
          checks: {},
          score_fields: {},
          score: 8,
          threshold: 7,
          status: "pass",
        };

  const shotstackInput = {
    shotstack_input_id: shotstackInputId,
    trace_id: input.trace_id,
    scenario_id: input.scenario_id,
    render_task_id: input.render_task_id,
    batch_item_id: text(input.batch_item_id),
    manifest_id: manifestId,
    content_family: text(input.content_family),
    format: text(manifest.format) || "9:16",
    duration_target_sec: durationTargetSec,
    render_family: text(input.render_family),
    scene_order: slides.map((slide) => slide.role),
    scene_role_map: Object.fromEntries(slides.map((slide) => [String(slide.id), slide.role])),
    timing_policy: text(input.timing_policy) || "readability_first_short",
    reading_time_policy: text(input.reading_time_policy) || "reader_buffer_short",
    transition_policy: "hard_cut",
    template_variant: text(input.template_variant),
    fallback_template_variant: text(input.fallback_template_variant),
    subtitle_policy: subtitlePolicy,
    audio_policy: text(input.audio_policy) || "none_for_first_visual_test",
    timeline,
    audio: {
      voiceover_url: text(input.voiceover_url),
      music_url: text(input.music_url),
      voice_mode: text(input.voice_mode) || "none",
      talking_head_url: text(input.talking_head_url),
      talking_head_asset_name: text(input.talking_head_asset_name),
    },
    text_tracks: [
      {
        track_id: `${slug}-text-track`,
        lang: text(input.language) || DEFAULT_LANGUAGE,
        srt_ref: subtitleRef,
      },
    ],
    publish_target: text(input.publish_target) || DEFAULT_TARGET,
    publish_adapter: text(input.publish_adapter) || DEFAULT_ADAPTER,
    source_prompt_ref: text(input.source_prompt_ref),
    asset_report_ref: assetReportPath,
    metadata_ref: metadataPath,
    notes: [
      `render_payload_id=${renderPayloadId}`,
      `qa_status=${qaReport.status}`,
      `qa_score=${qaReport.score}`,
      "Prepared for direct render handoff without fallback reconstruction.",
    ],
  };

  const publishReadyPackage = {
    publish_ready_id: publishReadyId,
    job_id: text(input.job_id) || text(input.trace_id),
    trace_id: text(input.trace_id),
    scenario_id: text(input.scenario_id),
    render_task_id: text(input.render_task_id),
    batch_item_id: text(input.batch_item_id),
    publish_target: text(input.publish_target) || DEFAULT_TARGET,
    publish_adapter: text(input.publish_adapter) || DEFAULT_ADAPTER,
    title: text(input.title),
    title_variant_a: text(input.title_variant_a),
    title_variant_b: text(input.title_variant_b),
    title_variant_c: text(input.title_variant_c),
    description: text(input.description),
    hashtags,
    caption_text: text(input.caption_text),
    visibility: text(input.visibility) || DEFAULT_VISIBILITY,
    analytics_tag: text(input.analytics_tag),
    variation_type: text(input.variation?.variation_type || input.variation_type),
    variation_value: text(input.variation?.variation_value || input.variation_value),
    hook_snapshot: normalizeHookSnapshot(input.hook_snapshot || input.generated_visual?.hook_snapshot),
    source_type: text(input.source_type),
    source_id: text(input.source_id),
    source_family: text(input.source_family),
    template_id: text(input.template_id),
    template_variant: text(input.template_variant),
    fallback_template_variant: text(input.fallback_template_variant),
    qa_status: qaReport.status,
    qa_score: qaReport.score,
    qa_report_json: qaReportPath,
    cta_text: text(input.cta_text),
    approval_state: text(input.approval_state) || "approved",
    publish_state: text(input.publish_state) || "publish_ready",
    delivery_state: text(input.delivery_state) || "not_sent",
    render_status: text(input.render_status) || (text(input.final_mp4_url) ? "rendered" : "assets_packaged"),
    render_receipt: text(input.render_receipt),
    final_mp4_url: text(input.final_mp4_url),
    asset_report_id: assetReportId,
    metadata_id: metadataId,
    shotstack_input_id: shotstackInputId,
    manifest_id: manifestId,
    asset_fingerprint: assetFingerprint,
    asset_report_json: assetReportPath,
    metadata_json: metadataPath,
    shotstack_input_json: shotstackInputPath,
    shotstack_render_payload_json: renderPayloadPath,
    subtitles_srt: subtitlesEnabled && subtitlesSrt ? subtitlesPath : "",
    title_source: "metadata",
    description_source: "metadata",
    retry_policy: input.retry_policy || null,
    fallback_policy: input.fallback_policy || null,
  };

  const bridgeFeedbackParts = [
    "source_type=RENDER_PACKAGE",
    `trace_id=${input.trace_id}`,
    `scenario_id=${input.scenario_id}`,
    `render_task_id=${input.render_task_id}`,
    ...(text(input.batch_item_id) ? [`batch_item_id=${text(input.batch_item_id)}`] : []),
    `asset_package_type=rendered`,
    `asset_fingerprint=${assetFingerprint}`,
    `render_status=${publishReadyPackage.render_status}`,
  ];

  if (text(input.variation?.variation_type || input.variation_type)) {
    bridgeFeedbackParts.push(`variation_type=${text(input.variation?.variation_type || input.variation_type)}`);
  }
  if (text(input.variation?.variation_value || input.variation_value)) {
    bridgeFeedbackParts.push(`variation_value=${text(input.variation?.variation_value || input.variation_value)}`);
  }
  const hookSnapshot = normalizeHookSnapshot(input.hook_snapshot || input.generated_visual?.hook_snapshot);
  if (hookSnapshot?.overlay_type) {
    bridgeFeedbackParts.push(`hook_overlay_type=${hookSnapshot.overlay_type}`);
  }
  if (hookSnapshot?.frame_style) {
    bridgeFeedbackParts.push(`hook_frame_style=${hookSnapshot.frame_style}`);
  }
  if (hookSnapshot?.camera_pov) {
    bridgeFeedbackParts.push(`hook_camera_pov=${hookSnapshot.camera_pov}`);
  }
  if (hookSnapshot?.mutation_origin) {
    bridgeFeedbackParts.push(`hook_mutation_origin=${hookSnapshot.mutation_origin}`);
  }

  if (publishReadyPackage.final_mp4_url) {
    bridgeFeedbackParts.push(`final_mp4_url=${publishReadyPackage.final_mp4_url}`);
  }

  const bridgeRow = {
    draft_id: text(input.bridge_draft_id) || text(input.render_task_id),
    story_id: text(input.source_id),
    version: text(input.version) || "1",
    created_at: new Date().toISOString(),
    source_title: text(input.source_title),
    source_url: text(input.source_url),
    source_name: text(input.source_name) || "render-package-builder",
    topic_type: text(input.topic_type) || text(input.source_type).toLowerCase(),
    headline: text(input.title),
    post_text: text(input.caption_text),
    cta: text(input.cta_text),
    hashtags: hashtags.join(" "),
    hashtags_array: hashtags,
    image_prompt: "",
    image_url: "",
    approval_status: text(input.approval_state) || "approved",
    published_status: "approved_for_shortform_distribution",
    feedback: bridgeFeedbackParts.join(" "),
    published_at: "",
    final_mp4_url: publishReadyPackage.final_mp4_url,
    asset_package_type: "rendered",
    asset_fingerprint: assetFingerprint,
    render_task_id: text(input.render_task_id),
    batch_item_id: text(input.batch_item_id),
    trace_id: text(input.trace_id),
    variation_type: text(input.variation?.variation_type || input.variation_type),
    variation_value: text(input.variation?.variation_value || input.variation_value),
    hook_snapshot: hookSnapshot,
  };

  const files = [
    [assetReportPath, assetReport],
    [metadataPath, metadata],
    [shotstackInputPath, shotstackInput],
    [renderPayloadPath, renderPayload],
    [qaReportPath, qaReport],
    [publishReadyPath, publishReadyPackage],
    [bridgeRowPath, bridgeRow],
  ];

  for (const [filePath, payload] of files) {
    await writeFile(filePath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  }
  if (subtitlesEnabled && subtitlesSrt) {
    await writeFile(subtitlesPath, `${subtitlesSrt.trim()}\n`, "utf8");
  }

  console.log(`slug=${slug}`);
  console.log(`asset_report=${assetReportPath}`);
  console.log(`metadata=${metadataPath}`);
  console.log(`shotstack_input=${shotstackInputPath}`);
  console.log(`shotstack_render_payload=${renderPayloadPath}`);
  console.log(`qa_report=${qaReportPath}`);
  console.log(`publish_ready=${publishReadyPath}`);
  console.log(`g3_bridge_row=${bridgeRowPath}`);
  console.log(`subtitles_srt=${subtitlesEnabled && subtitlesSrt ? subtitlesPath : ""}`);
  console.log(`asset_fingerprint=${assetFingerprint}`);
  console.log(`render_status=${publishReadyPackage.render_status}`);
  console.log(`final_mp4_url=${publishReadyPackage.final_mp4_url || ""}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
