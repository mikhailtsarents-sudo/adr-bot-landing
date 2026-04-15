#!/usr/bin/env node

import { mkdir, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const DEFAULT_OUTPUT_ROOT = path.join(os.tmpdir(), "adr-approved-news-live");
const DEFAULT_SCENE_ROOT = path.join(repoRoot, "canva-exports", "adr-short-video");
const DEFAULT_PUBLIC_OUTPUT_DIR = path.join(
  repoRoot,
  "public",
  "shotstack-assets",
  "adr-short-video",
  "current",
);
const DEFAULT_FINAL_MP4_URL =
  "https://www.adr-bot.de/shotstack-assets/adr-short-video/current/final.mp4";

function printHelp() {
  console.log(`Usage: node scripts/run-approved-news-live-branch.mjs --input <approved-row.json> [options]

Options:
  --input <file>           Approved storage row JSON
  --output-root <dir>      Output root (default: ${DEFAULT_OUTPUT_ROOT})
  --scene-root <dir>       NEWS scene root (default: ${DEFAULT_SCENE_ROOT})
  --public-output-dir <d>  Public current assets dir (default: ${DEFAULT_PUBLIC_OUTPUT_DIR})
  --final-mp4-url <url>    Final MP4 URL to stamp into publish-ready package
  --keep-temp              Keep all intermediate files
  --help                   Show this help
`);
}

function parseArgs(argv) {
  const args = {
    inputPath: "",
    outputRoot: DEFAULT_OUTPUT_ROOT,
    sceneRoot: DEFAULT_SCENE_ROOT,
    publicOutputDir: DEFAULT_PUBLIC_OUTPUT_DIR,
    finalMp4Url: DEFAULT_FINAL_MP4_URL,
    keepTemp: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === "--input") args.inputPath = path.resolve(argv[++i]);
    else if (token === "--output-root") args.outputRoot = path.resolve(argv[++i]);
    else if (token === "--scene-root") args.sceneRoot = path.resolve(argv[++i]);
    else if (token === "--public-output-dir") args.publicOutputDir = path.resolve(argv[++i]);
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
      title_de: text(row.headline),
      summary_de: text(row.post_text),
      source: text(row.source_title),
      topic: "ADR news",
      published_at: text(row.created_at) || text(row.createdAt),
      cta_variant: text(row.cta),
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

function buildNewsPackage(approvedNews, scenarioResponse, canvaBrief) {
  const sceneFiles = [
    ["hook", "slide1-hook.png"],
    ["question", "slide2-question.png"],
    ["answers", "slide3-answers.png"],
    ["timer", "slide4-timer.png"],
    ["answer", "slide5-answer.png"],
    ["cta", "slide6-cta.png"],
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
    scenes: sceneFiles.map(([role, fileName], index) => ({
      scene_id: index + 1,
      role,
      input_path: fileName,
      export_name: `slide${index + 1}.png`,
      source_design_id: `${canvaBrief.brief_id}-${role}`,
      page_url: "",
    })),
  };
}

function buildRenderTask(approvedNews, scenarioResponse, newsPackage) {
  const row = approvedNews.storage_row;
  return {
    trace_id: approvedNews.trace_id,
    scenario_id: scenarioResponse.scenario_id,
    render_task_id: `${approvedNews.news_id}-render-01`,
    source_type: "NEWS",
    source_id: approvedNews.news_id,
    source_family: "NEWS",
    content_family: "NEWS",
    template_id: "T5",
    render_family: "News Card",
    title: approvedNews.payload.title_de,
    description: [
      approvedNews.payload.summary_de,
      "",
      approvedNews.payload.cta_variant,
      "",
      `Quelle: ${text(row.source_title)}`,
      text(row.source_url),
    ]
      .filter(Boolean)
      .join("\n"),
    caption_text: scenarioResponse.caption_text,
    cta_text: scenarioResponse.cta_text,
    scene_plan: scenarioResponse.scene_plan,
    hashtags: scenarioResponse.hashtags,
    analytics_tag: scenarioResponse.analytics_tag,
    language: "de",
    visibility: "public",
    duration_target_sec: 12,
    subtitle_policy: "burned_or_external_srt",
    source_title: text(row.source_title),
    source_url: text(row.source_url),
    source_name: text(row.source_name) || "approved-news-live-branch",
    topic_type: "news",
    publish_target: "youtube_shorts",
    publish_adapter: "youtube_short_adapter",
    approval_state: "approved",
    publish_state: "publish_ready",
    delivery_state: "not_sent",
    render_status: "assets_packaged",
    bridge_draft_id: text(row.draft_id),
    version: text(row.version) || "1",
    manifest_id: `${approvedNews.news_id}-manifest-01`,
  };
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
  const newsPackage = buildNewsPackage(approvedNews, scenarioResponse, canvaBrief);
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

  runNodeScript(path.join(repoRoot, "scripts", "run-news-shadow-branch.mjs"), [
    "--approved-news",
    approvedNewsPath,
    "--scenario-request",
    scenarioRequestPath,
    "--scenario-response",
    scenarioResponsePath,
    "--canva-brief",
    canvaBriefPath,
    "--output-root",
    outputDir,
    "--slug",
    "shadow",
  ]);

  runNodeScript(path.join(repoRoot, "scripts", "run-news-specific-canva-shotstack.mjs"), [
    "--input",
    newsPackagePath,
    "--scene-root",
    args.sceneRoot,
    "--output-dir",
    args.publicOutputDir,
    "--project",
    "adr-short-video",
    "--base-url",
    "https://www.adr-bot.de",
  ]);

  runNodeScript(path.join(repoRoot, "scripts", "build-render-package.mjs"), [
    "--input",
    renderTaskPath,
    "--output-root",
    outputDir,
    "--slug",
    "render-package",
  ]);

  const packageDir = path.join(outputDir, "render-package");
  runNodeScript(path.join(repoRoot, "scripts", "finalize-render-package.mjs"), [
    "--package-dir",
    packageDir,
    "--final-mp4-url",
    args.finalMp4Url,
  ]);

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
    final_mp4_url: args.finalMp4Url,
    status: "pass",
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
