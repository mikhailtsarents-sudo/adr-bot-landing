#!/usr/bin/env node

import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import crypto from "node:crypto";
import { QUESTION_SCENARIO_IDS } from "./render/question-scenario-pool.mjs";
import { enableStrictNonInteractiveMode, logAutonomousDecision } from "./runtime/non-interactive-mode.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const DEFAULT_INPUT_DIR = path.join(repoRoot, "examples", "question-batch-wave-1");
const DEFAULT_OUTPUT_ROOT = path.join(repoRoot, "render-packages", "question-batch-wave-1");
const DEFAULT_MUTATION_VALUES = [
  "hook_no_overlay",
  "hook_ultra_aggressive_text",
  "hook_alt_wording",
  "camera_extreme_pov",
  "camera_obstructed_frame",
  "interaction_driver_initiates",
  "tension_delayed_reaction",
];

enableStrictNonInteractiveMode("run-question-batch-smoke");

function parseArgs(argv) {
  const args = {
    inputDir: DEFAULT_INPUT_DIR,
    outputRoot: DEFAULT_OUTPUT_ROOT,
    variationType: "",
    groupAValue: "",
    groupBValue: "",
    feedbackConfigPath: "",
    mutationValues: [...DEFAULT_MUTATION_VALUES],
  };

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === "--input-dir") args.inputDir = path.resolve(argv[++i]);
    else if (token === "--output-root") args.outputRoot = path.resolve(argv[++i]);
    else if (token === "--variation-type") args.variationType = argv[++i];
    else if (token === "--group-a") args.groupAValue = argv[++i];
    else if (token === "--group-b") args.groupBValue = argv[++i];
    else if (token === "--feedback-config") args.feedbackConfigPath = path.resolve(argv[++i]);
    else if (token === "--mutation-values") {
      args.mutationValues = String(argv[++i] || "")
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean);
    }
    else if (token === "--help" || token === "-h") {
      console.log("Usage: node scripts/run-question-batch-smoke.mjs [--input-dir <dir>] [--output-root <dir>] [--variation-type <type> --group-a <value> --group-b <value>] [--feedback-config <summary.json>] [--mutation-values a,b,c]");
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${token}`);
    }
  }

  return args;
}

function pickDeterministicValue(seed, values) {
  if (!Array.isArray(values) || values.length === 0) {
    return "";
  }
  const entropy = Number.parseInt(sha256(seed).slice(0, 8), 16);
  return values[entropy % values.length];
}

function buildScenarioPlan(totalCount, feedbackSummary) {
  const defaultScenarios = [...QUESTION_SCENARIO_IDS];
  if (!feedbackSummary?.next_batch_scenarios) {
    return Array.from({ length: totalCount }, (_, index) => defaultScenarios[index % defaultScenarios.length]);
  }

  const inactiveScenarios = Array.isArray(feedbackSummary.scenario_lifecycle?.inactive_scenarios)
    ? feedbackSummary.scenario_lifecycle.inactive_scenarios.filter(Boolean)
    : [];
  const promotedLead = String(feedbackSummary.next_batch_scenarios.promoted_lead || "").trim();
  const secondaryPriority = Array.isArray(feedbackSummary.next_batch_scenarios.secondary_priority)
    ? feedbackSummary.next_batch_scenarios.secondary_priority.filter(Boolean)
    : [];
  const experimentalScenarios = Array.isArray(feedbackSummary.next_batch_scenarios.experimental_scenarios)
    ? feedbackSummary.next_batch_scenarios.experimental_scenarios.filter(Boolean)
    : [];
  const safeDefaults = defaultScenarios.filter((scenario) => !inactiveScenarios.includes(scenario));
  const promotedPool = [promotedLead].filter(Boolean);
  const secondaryPool = secondaryPriority.length > 0 ? secondaryPriority : safeDefaults.slice(1, 3);
  const experimentalPool = experimentalScenarios.length > 0
    ? experimentalScenarios
    : safeDefaults.filter((scenario) => !promotedPool.includes(scenario) && !secondaryPool.includes(scenario)).slice(0, 2);
  const promotedCount = promotedPool.length > 0 ? Math.round(totalCount * 0.4) : 0;
  const secondaryCount = Math.round(totalCount * 0.2);

  return Array.from({ length: totalCount }, (_, index) => {
    if (index < promotedCount && promotedPool.length > 0) {
      return promotedPool[index % promotedPool.length];
    }
    if (index < promotedCount + secondaryCount && secondaryPool.length > 0) {
      return secondaryPool[(index - promotedCount) % secondaryPool.length];
    }
    return experimentalPool[(index - promotedCount - secondaryCount) % experimentalPool.length]
      || safeDefaults[index % safeDefaults.length];
  });
}

function resolveScenarioFeedback(feedbackSummary, scenarioKey) {
  const summaries = Array.isArray(feedbackSummary?.scenario_summaries) ? feedbackSummary.scenario_summaries : [];
  const match = summaries.find((summary) => String(summary.scenario_key || "") === String(scenarioKey || ""));
  if (!match?.primary_feedback_config) {
    return null;
  }
  return {
    ...match.primary_feedback_config,
    killer_hooks: Array.isArray(feedbackSummary.killer_hooks) ? feedbackSummary.killer_hooks : [],
    hook_remixes: Array.isArray(feedbackSummary.hook_remixes) ? feedbackSummary.hook_remixes : [],
  };
}

function resolveVariationForIndex(args, index, totalCount, fileName, feedbackConfig) {
  if (feedbackConfig) {
    const type = String(feedbackConfig.variation_type || "").trim();
    const exploitValue = String(feedbackConfig.next_batch_config?.exploit_variation_value || "").trim();
    const exploitShare = Number(feedbackConfig.next_batch_config?.exploit_share || 0.7);
    const explorationShare = Number(feedbackConfig.next_batch_config?.exploration_share || 0.2);
    const killerHooks = Array.isArray(feedbackConfig.killer_hooks) ? feedbackConfig.killer_hooks : [];
    const hookRemixes = Array.isArray(feedbackConfig.hook_remixes) ? feedbackConfig.hook_remixes : [];
    const exploreCandidates = Array.isArray(feedbackConfig.next_batch_config?.explore_candidates)
      ? feedbackConfig.next_batch_config.explore_candidates.map((value) => String(value).trim()).filter(Boolean)
      : [];
    const mutationShare = Math.max(0, Number((1 - exploitShare - explorationShare).toFixed(4)));
    const exploitCount = Math.round(totalCount * exploitShare);
    const remixCount = hookRemixes.length > 0 ? Math.max(1, Math.round(totalCount * 0.08)) : 0;
    const mutationStart = Math.max(0, totalCount - Math.max(1, Math.round(totalCount * Math.max(0.1, mutationShare || 0.1))));
    const killerHookCount = killerHooks.length > 0 ? Math.max(1, Math.round(totalCount * 0.35)) : 0;

    if (index < killerHookCount) {
      const killer = killerHooks[index % killerHooks.length];
      if (killer?.variation_value) {
        return {
          variationType: "killer_hook",
          variationValue: String(killer.variation_value).trim(),
        };
      }
    }

    if (index >= killerHookCount && index < killerHookCount + remixCount) {
      const remix = hookRemixes[(index - killerHookCount) % hookRemixes.length];
      if (remix?.variation_value) {
        return {
          variationType: "hook_remix",
          variationValue: String(remix.variation_value).trim(),
          variationPayload: remix.payload || null,
        };
      }
    }

    if (index >= mutationStart) {
      const mutationValue = pickDeterministicValue(`${fileName}:${index}:mutation`, args.mutationValues);
      if (mutationValue) {
        return {
          variationType: "mutation",
          variationValue: mutationValue,
        };
      }
    }

    if (index < exploitCount && type && exploitValue) {
      return {
        variationType: type,
        variationValue: exploitValue,
      };
    }

    if (type) {
      const explorationPool = exploreCandidates.length > 0 ? exploreCandidates : [exploitValue].filter(Boolean);
      const chosenValue = pickDeterministicValue(`${fileName}:${index}:explore`, explorationPool);
      if (chosenValue) {
        return {
          variationType: type,
          variationValue: chosenValue,
        };
      }
    }
  }

  if (!args.variationType || !args.groupAValue || !args.groupBValue) {
    return null;
  }
  return {
    variationType: args.variationType,
    variationValue: index % 2 === 0 ? args.groupAValue : args.groupBValue,
  };
}

function ensureAssignedVariation(variation, scenarioKey) {
  const variationType = String(variation?.variationType || "").trim();
  const variationValue = String(variation?.variationValue || "").trim();
  if (variationType && variationValue) {
    return variation;
  }
  return {
    variationType: "experimental",
    variationValue: `scenario_exploration_${String(scenarioKey || "unknown")
      .replace(/[^a-zA-Z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "")
      .toLowerCase() || "baseline"}`,
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

async function loadJson(filePath) {
  return JSON.parse(await readFile(filePath, "utf8"));
}

function sha256(payload) {
  return crypto.createHash("sha256").update(payload).digest("hex");
}

function buildBatchItemId({ scenarioKey, variation, index, fileName }) {
  const seed = JSON.stringify({
    scenarioKey: String(scenarioKey || ""),
    variationType: String(variation?.variationType || ""),
    variationValue: String(variation?.variationValue || ""),
    variationPayload: variation?.variationPayload || null,
    batchPosition: index,
    fileName: String(fileName || ""),
  });
  return `b${String(index + 1).padStart(2, "0")}-${sha256(seed).slice(0, 8)}`;
}

function buildUniqueSlug(scenarioKey, batchItemId) {
  const slugBase = String(scenarioKey).replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-+|-+$/g, "").toLowerCase();
  return `${slugBase}-${slugBase}-render-01-${batchItemId}`;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  logAutonomousDecision("selected batch smoke settings", {
    input_dir: args.inputDir,
    output_root: args.outputRoot,
    variation_type: args.variationType,
  });
  await mkdir(args.outputRoot, { recursive: true });
  let feedbackConfig = null;
  let feedbackSummary = null;
  if (args.feedbackConfigPath) {
    feedbackSummary = await loadJson(args.feedbackConfigPath);
  }

  const inputFiles = (await readdir(args.inputDir))
    .filter((fileName) => fileName.endsWith(".json"))
    .sort();
  const scenarioPlan = buildScenarioPlan(inputFiles.length, feedbackSummary);

  const results = [];
  const plannedItems = [];

  for (let index = 0; index < inputFiles.length; index += 1) {
    const fileName = inputFiles[index];
    const inputPath = path.join(args.inputDir, fileName);
    const scenarioKey = scenarioPlan[index];
    feedbackConfig = resolveScenarioFeedback(feedbackSummary, scenarioKey);
    const variation = ensureAssignedVariation(
      resolveVariationForIndex(args, index, inputFiles.length, fileName, feedbackConfig),
      scenarioKey,
    );
    const batchItemId = buildBatchItemId({ scenarioKey, variation, index, fileName });
    const slug = buildUniqueSlug(scenarioKey, batchItemId);
    const packageDir = path.join(args.outputRoot, slug);
    plannedItems.push({
      index,
      fileName,
      inputPath,
      scenarioKey,
      variation,
      batchItemId,
      slug,
      packageDir,
    });
  }

  const uniquePackageDirs = new Set(plannedItems.map((item) => item.packageDir));
  if (uniquePackageDirs.size !== plannedItems.length) {
    throw new Error("Batch plan resolved to duplicate output paths. Refusing to continue.");
  }

  for (const item of plannedItems) {
    const { fileName, inputPath, scenarioKey, variation, batchItemId, slug, packageDir } = item;
    const scriptArgs = [
      "--input",
      inputPath,
      "--output-root",
      args.outputRoot,
      "--fixed-scenario",
      scenarioKey,
      "--batch-item-id",
      batchItemId,
      "--slug",
      slug,
    ];
    if (variation) {
      scriptArgs.push("--variation-type", variation.variationType, "--variation-value", variation.variationValue);
      if (variation.variationPayload) {
        scriptArgs.push("--variation-payload", JSON.stringify(variation.variationPayload));
      }
    }
    runNodeScript(path.join(repoRoot, "scripts", "run-question-render-package.mjs"), scriptArgs);

    const inputJson = await loadJson(inputPath);
    const scenario = await loadJson(path.join(packageDir, "scenario.json"));
    const publishReady = await loadJson(path.join(packageDir, "publish_ready_package.json"));
    const shotstackInput = await loadJson(path.join(packageDir, "shotstack_input.json"));
    const renderPayload = await loadJson(path.join(packageDir, "shotstack_render_payload.json"));
    const subtitlesSrt = await readFile(path.join(packageDir, "subtitles.srt"), "utf8");

    results.push({
      source_id: inputJson.source_id,
      batch_item_id: batchItemId,
      slug,
      package_dir: packageDir,
      fixed_scenario: scenarioKey,
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
      variation_type: publishReady.variation_type || "",
      variation_value: publishReady.variation_value || "",
    });
  }

  const summaryPath = path.join(args.outputRoot, "batch_summary.json");
  await writeFile(
    summaryPath,
    `${JSON.stringify({ count: results.length, scenario_plan: scenarioPlan, results }, null, 2)}\n`,
    "utf8",
  );

  console.log(`input_count=${inputFiles.length}`);
  console.log(`output_root=${args.outputRoot}`);
  console.log(`summary=${summaryPath}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
