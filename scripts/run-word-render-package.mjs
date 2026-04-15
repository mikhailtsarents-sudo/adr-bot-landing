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
  "word-sicherungskeil-source.json",
);
const DEFAULT_SCENE_ROOT = path.join(repoRoot, "canva-exports", "adr-short-video");
const DEFAULT_OUTPUT_ROOT = path.join(repoRoot, "render-packages");
const DEFAULT_PROJECT = "adr-short-video";
const DEFAULT_BASE_URL = "https://www.adr-bot.de";

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

function buildRenderTask(wordInput, scenario) {
  const term = text(wordInput.payload?.de_term);
  const translation =
    text(wordInput.payload?.translations?.[wordInput.target_lang || "ru"]) ||
    text(wordInput.payload?.translations?.ru);

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
    duration_target_sec: 9,
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

async function main() {
  const args = parseArgs(process.argv.slice(2));
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
  const plan = {
    project: args.project,
    trace_id: scenario.trace_id,
    scenario_id: scenario.scenario_id,
    brief_id: `${text(wordInput.source_id)}-brief-01`,
    content_family: "WORD",
    template_family: "Word Card",
    template_id: "T2",
    slide_count: 6,
    mode: "stable-storage",
    source_type: "stable_storage",
    asset_source_ref: args.sceneRoot,
    asset_family: "word_card_short_v1",
    render_family: "Word Card Short",
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
    await writeFile(path.join(outputDir, "word_source.json"), `${JSON.stringify(wordInput, null, 2)}\n`, "utf8");
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
