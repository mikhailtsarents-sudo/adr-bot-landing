#!/usr/bin/env node

import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

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

function printHelp() {
  console.log(`Usage: node scripts/run-question-render-package.mjs [options]

Options:
  --input <file>         QUESTION source JSON (default: ${DEFAULT_INPUT_PATH})
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

function buildClassification(questionInput) {
  const sourceId = text(questionInput.source_id);
  const category = text(questionInput.payload?.category) || "general";
  return {
    source_type: "QUESTION",
    source_id: sourceId,
    source_family: "QUESTION",
    template_id: "T1",
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
  const shortenedHook =
    questionText.length > 72 ? `${questionText.slice(0, 69).trimEnd()}?` : questionText;

  return {
    trace_id: traceId,
    scenario_id: `${sourceId}-scn-01`,
    source_type: "QUESTION",
    source_id: sourceId,
    source_family: classification.source_family,
    template_id: classification.template_id,
    content_family: "QUESTION",
    language_base: classification.language_base,
    target_language: text(questionInput.target_lang) || "ru",
    audience: text(questionInput.audience) || "ADR",
    difficulty: text(questionInput.difficulty) || "easy",
    render_priority: classification.render_priority,
    hook_text: shortenedHook,
    scene_plan: [
      { id: 1, role: "hook", text: shortenedHook },
      { id: 2, role: "question", text: questionText },
      {
        id: 3,
        role: "answers",
        text: (questionInput.payload?.answer_options || []).slice(0, 4).join(" / "),
      },
      { id: 4, role: "timer", text: "3 Sekunden überlegen" },
      { id: 5, role: "answer", text: correctAnswer },
      { id: 6, role: "cta", text: "Mehr ADR-Fragen direkt im Telegram-Bot üben" },
    ],
    body_blocks: [questionText, correctAnswer, explanation].filter(Boolean),
    core_answer: correctAnswer,
    short_explanation: explanation,
    cta_text: "Mehr ADR-Fragen direkt im Telegram-Bot üben",
    caption_text: `ADR Grundfrage: ${shortenedHook}`,
    hashtags: ["#ADR", "#Gefahrgut", "#LKW"],
    tone: "klar_und_ruhig",
    visual_direction: "question_card_vertical",
    analytics_tag: classification.analytics_tag,
  };
}

function buildRenderTask(questionInput, scenario) {
  const shortenedTitle = text(scenario.hook_text);
  const correctAnswer = text(questionInput.payload?.correct_answer);
  const explanation = text(questionInput.payload?.simple_explanation);

  return {
    trace_id: scenario.trace_id,
    scenario_id: scenario.scenario_id,
    render_task_id: `${text(questionInput.source_id)}-render-01`,
    source_type: "QUESTION",
    source_id: text(questionInput.source_id),
    source_family: "QUESTION",
    content_family: "QUESTION",
    template_id: "T1",
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
    hashtags: scenario.hashtags,
    analytics_tag: scenario.analytics_tag,
    language: "de",
    visibility: "public",
    duration_target_sec: 10,
    subtitle_policy: "burned_or_external_srt",
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

  if (text(questionInput.source_type) !== "QUESTION") {
    throw new Error("Input must be a QUESTION source package.");
  }
  if (!text(questionInput.payload?.question_text) || !text(questionInput.payload?.correct_answer)) {
    throw new Error("QUESTION input is missing question_text or correct_answer.");
  }

  const classification = buildClassification(questionInput);
  const scenario = buildScenario(questionInput, classification);
  const renderTask = buildRenderTask(questionInput, scenario);
  const slug = slugify(`${questionInput.source_id}-${renderTask.render_task_id}`) || "question-render-package";

  const tempDir = await mkdtemp(path.join(os.tmpdir(), "adr-question-render-"));
  const planPath = path.join(tempDir, "question-plan.json");
  const packagePath = path.join(tempDir, "question-render-package.json");
  const outputDir = path.join(args.outputRoot, slug);
  const plan = {
    project: args.project,
    trace_id: scenario.trace_id,
    scenario_id: scenario.scenario_id,
    brief_id: `${text(questionInput.source_id)}-brief-01`,
    content_family: "QUESTION",
    template_family: "Question Card",
    template_id: "T1",
    slide_count: 6,
    mode: "stable-storage",
    source_type: "stable_storage",
    asset_source_ref: args.sceneRoot,
    asset_family: "question_card_short_v1",
    render_family: "Question Card Short",
    status: "ready",
    approval_state: "approved",
    gpt_scenario_ready: true,
    allow_generic_fallback: false,
    scene_root: args.sceneRoot,
    scenes: [
      { scene_id: 1, role: "hook", input_path: path.join(args.sceneRoot, "slide1-hook.png") },
      { scene_id: 2, role: "question", input_path: path.join(args.sceneRoot, "slide2-question.png") },
      { scene_id: 3, role: "answers", input_path: path.join(args.sceneRoot, "slide3-answers.png") },
      { scene_id: 4, role: "timer", input_path: path.join(args.sceneRoot, "slide4-timer.png") },
      { scene_id: 5, role: "answer", input_path: path.join(args.sceneRoot, "slide5-answer.png") },
      { scene_id: 6, role: "cta", input_path: path.join(args.sceneRoot, "slide6-cta.png") },
    ],
  };

  await writeFile(planPath, `${JSON.stringify(plan, null, 2)}\n`, "utf8");
  await writeFile(packagePath, `${JSON.stringify(renderTask, null, 2)}\n`, "utf8");

  try {
    runNodeScript(path.join(repoRoot, "scripts", "run-canva-scene-batch.mjs"), [
      "--plan",
      planPath,
      "--project",
      args.project,
      "--base-url",
      args.baseUrl,
      ...(args.verifyRemote ? ["--verify-remote"] : []),
    ]);

    runNodeScript(path.join(repoRoot, "scripts", "build-render-package.mjs"), [
      "--input",
      packagePath,
      "--output-root",
      args.outputRoot,
      "--slug",
      slug,
    ]);

    await mkdir(outputDir, { recursive: true });
    await writeFile(path.join(outputDir, "question_source.json"), `${JSON.stringify(questionInput, null, 2)}\n`, "utf8");
    await writeFile(path.join(outputDir, "classification.json"), `${JSON.stringify(classification, null, 2)}\n`, "utf8");
    await writeFile(path.join(outputDir, "scenario.json"), `${JSON.stringify(scenario, null, 2)}\n`, "utf8");
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
