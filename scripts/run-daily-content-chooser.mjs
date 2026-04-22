#!/usr/bin/env node

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { enableStrictNonInteractiveMode, logAutonomousDecision } from "./runtime/non-interactive-mode.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const DEFAULT_OUTPUT_ROOT = path.join(repoRoot, "daily-chooser-runs");
enableStrictNonInteractiveMode("run-daily-content-chooser");

const WEIGHTS = {
  source_quality_score: 0.3,
  story_relevance_score: 0.25,
  publishability_score: 0.2,
  teaching_value_score: 0.15,
  freshness_score: 0.1,
  risk_score: -0.3,
};

const TIE_BREAK_ORDER = [
  ["risk_score", "asc"],
  ["publishability_score", "desc"],
  ["story_relevance_score", "desc"],
  ["freshness_score", "desc"],
];

function printHelp() {
  console.log(`Usage: npm run run:daily-content-chooser -- --input <batch.json> [options]

Options:
  --input <file>        Candidate batch JSON
  --output-root <dir>   Output root (default: ${DEFAULT_OUTPUT_ROOT})
  --date <yyyy-mm-dd>   Decision date override
  --help                Show this help

Input shape:
  Either an array of candidates or { "candidates": [...] }.

Each candidate should follow the normalized shared contract and include:
  source_type, source_id, source_version, payload, trace

Optional scoring fields can already be present; missing ones are estimated conservatively.
`);
}

function parseArgs(argv) {
  const args = {
    inputPath: "",
    outputRoot: DEFAULT_OUTPUT_ROOT,
    decisionDate: "",
  };

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === "--input") args.inputPath = path.resolve(argv[++i]);
    else if (token === "--output-root") args.outputRoot = path.resolve(argv[++i]);
    else if (token === "--date") args.decisionDate = argv[++i];
    else if (token === "--help" || token === "-h") {
      printHelp();
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${token}`);
    }
  }

  if (!args.inputPath) {
    throw new Error("Missing --input <batch.json>.");
  }

  return args;
}

async function loadJson(filePath) {
  return JSON.parse(await readFile(filePath, "utf8"));
}

function text(value) {
  return value == null ? "" : String(value).trim();
}

function num(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function clamp(value) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function slugify(value) {
  return text(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function normalizeBatch(input) {
  if (Array.isArray(input)) return input;
  if (Array.isArray(input?.candidates)) return input.candidates;
  throw new Error("Chooser input must be an array or { candidates: [...] }.");
}

function hasField(value) {
  if (Array.isArray(value)) return value.length > 0;
  return Boolean(text(value));
}

function deriveSourceQuality(candidate) {
  const base = 40;
  let score = base;
  if (hasField(candidate.source_type)) score += 10;
  if (hasField(candidate.source_id)) score += 10;
  if (hasField(candidate.source_version)) score += 5;
  if (hasField(candidate.payload)) score += 10;
  if (candidate.source_type === "NEWS") {
    if (hasField(candidate.approval_state || candidate.payload?.approval_state)) score += 10;
    if (hasField(candidate.payload?.title_de)) score += 5;
    if (hasField(candidate.payload?.summary_de)) score += 5;
    if (hasField(candidate.payload?.source)) score += 5;
  } else if (candidate.source_type === "QUESTION") {
    if (hasField(candidate.payload?.question_text)) score += 10;
    if (hasField(candidate.payload?.correct_answer)) score += 10;
    if (hasField(candidate.payload?.answer_options)) score += 5;
    if (hasField(candidate.payload?.simple_explanation)) score += 5;
  } else if (candidate.source_type === "WORD") {
    if (hasField(candidate.payload?.de_term)) score += 10;
    if (hasField(candidate.payload?.simple_explanation)) score += 10;
    if (hasField(candidate.payload?.translations)) score += 5;
  }
  return clamp(score);
}

function deriveFreshness(candidate, now) {
  if (candidate.source_type === "NEWS") {
    const approvedAt = new Date(
      candidate.approved_at || candidate.created_at || candidate.payload?.approved_at || candidate.payload?.published_at || 0,
    );
    if (Number.isNaN(approvedAt.getTime()) || approvedAt.getTime() === 0) return 55;
    const ageHours = Math.max(0, (now - approvedAt.getTime()) / (1000 * 60 * 60));
    if (ageHours <= 12) return 95;
    if (ageHours <= 24) return 85;
    if (ageHours <= 48) return 70;
    if (ageHours <= 72) return 55;
    return 35;
  }

  const rank = num(candidate.candidate_rank, 3);
  return clamp(70 - (rank - 1) * 10);
}

function deriveClarity(candidate) {
  if (candidate.source_type === "QUESTION") {
    return clamp(
      55 +
        (hasField(candidate.payload?.question_text) ? 15 : 0) +
        (hasField(candidate.payload?.simple_explanation) ? 15 : 0) +
        (hasField(candidate.payload?.answer_options) ? 10 : 0),
    );
  }
  if (candidate.source_type === "WORD") {
    const termLength = text(candidate.payload?.de_term).length;
    return clamp(
      60 +
        (termLength > 0 && termLength <= 24 ? 15 : 0) +
        (hasField(candidate.payload?.simple_explanation) ? 15 : 0),
    );
  }
  return clamp(
    50 +
      (hasField(candidate.payload?.title_de) ? 10 : 0) +
      (hasField(candidate.payload?.summary_de) ? 15 : 0) +
      (hasField(candidate.payload?.topic) ? 10 : 0),
  );
}

function deriveStoryRelevance(candidate) {
  const tags = Array.isArray(candidate.topic_tags) ? candidate.topic_tags : [];
  const priorityHint = text(candidate.priority_hint).toLowerCase();
  let score = 50 + Math.min(tags.length, 4) * 5;
  if (priorityHint.includes("high")) score += 15;
  if (candidate.source_type === "NEWS") score += 15;
  if (candidate.source_type === "QUESTION") score += 8;
  return clamp(score);
}

function deriveTeachingValue(candidate) {
  if (candidate.source_type === "QUESTION") {
    return clamp(65 + (hasField(candidate.payload?.simple_explanation) ? 15 : 0));
  }
  if (candidate.source_type === "WORD") {
    return clamp(60 + (hasField(candidate.payload?.translations) ? 15 : 0));
  }
  return clamp(58 + (hasField(candidate.payload?.summary_de) ? 12 : 0) + (hasField(candidate.payload?.cta_variant) ? 8 : 0));
}

function derivePublishability(candidate) {
  let score = 45;
  if (candidate.source_type === "NEWS") {
    if (text(candidate.approval_state || candidate.payload?.approval_state) === "approved") score += 15;
    if (candidate.payload?.gpt_scenario_ready === true || candidate.gpt_scenario_ready === true) score += 10;
    if (hasField(candidate.trace_id)) score += 10;
    if (hasField(candidate.payload?.asset_policy)) score += 5;
  } else if (candidate.source_type === "QUESTION") {
    if (hasField(candidate.payload?.question_text)) score += 15;
    if (hasField(candidate.payload?.correct_answer)) score += 15;
    if (hasField(candidate.trace?.source_path || candidate.source_path)) score += 5;
  } else if (candidate.source_type === "WORD") {
    if (hasField(candidate.payload?.de_term)) score += 15;
    if (hasField(candidate.payload?.simple_explanation)) score += 15;
    if (hasField(candidate.trace?.source_path || candidate.source_path)) score += 5;
  }
  if (candidate.blocked_by_downstream === true) score -= 40;
  return clamp(score);
}

function deriveRisk(candidate) {
  let score = 10;
  if (candidate.source_type === "NEWS") {
    if (text(candidate.approval_state || candidate.payload?.approval_state) !== "approved") score += 25;
    if (candidate.fallback_needed === true) score += 20;
  }
  if (candidate.trace?.already_published === true || candidate.already_published === true) score += 40;
  if (candidate.blocked_by_downstream === true) score += 35;
  return clamp(score);
}

function scoreCandidate(candidate, now) {
  const scored = {
    ...candidate,
    source_quality_score: clamp(
      candidate.source_quality_score ?? deriveSourceQuality(candidate),
    ),
    freshness_score: clamp(candidate.freshness_score ?? deriveFreshness(candidate, now)),
    clarity_score: clamp(candidate.clarity_score ?? deriveClarity(candidate)),
    story_relevance_score: clamp(
      candidate.story_relevance_score ?? deriveStoryRelevance(candidate),
    ),
    teaching_value_score: clamp(
      candidate.teaching_value_score ?? deriveTeachingValue(candidate),
    ),
    publishability_score: clamp(
      candidate.publishability_score ?? derivePublishability(candidate),
    ),
    risk_score: clamp(candidate.risk_score ?? deriveRisk(candidate)),
  };

  const weighted =
    scored.source_quality_score * WEIGHTS.source_quality_score +
    scored.story_relevance_score * WEIGHTS.story_relevance_score +
    scored.publishability_score * WEIGHTS.publishability_score +
    scored.teaching_value_score * WEIGHTS.teaching_value_score +
    scored.freshness_score * WEIGHTS.freshness_score +
    scored.risk_score * WEIGHTS.risk_score;

  return {
    ...scored,
    priority_score: Number(weighted.toFixed(2)),
  };
}

function familySpecificBlocked(candidate) {
  if (candidate.source_type === "NEWS") {
    if (text(candidate.approval_state || candidate.payload?.approval_state) !== "approved") {
      return "NEWS candidate is not approved.";
    }
    if (candidate.freshness_score < 55) {
      return "NEWS candidate is too stale.";
    }
  }
  if (candidate.source_type === "QUESTION") {
    if (!hasField(candidate.payload?.answer_options) || !hasField(candidate.payload?.simple_explanation)) {
      return "QUESTION candidate is missing answer options or explanation.";
    }
  }
  if (candidate.source_type === "WORD") {
    if (text(candidate.payload?.de_term).length > 36) {
      return "WORD candidate term is too long for compact card format.";
    }
  }
  return "";
}

function evaluateCandidate(candidate, now) {
  const scored = scoreCandidate(candidate, now);
  const thresholdBlocked =
    scored.source_quality_score < 70 ||
    scored.publishability_score < 65 ||
    scored.risk_score > 30 ||
    scored.clarity_score < 60;
  const familyBlocked = familySpecificBlocked(scored);
  const blockedReason = thresholdBlocked
    ? "Threshold check failed."
    : familyBlocked;
  const decisionState = blockedReason
    ? "blocked"
    : scored.priority_score < 55
      ? "warn"
      : "pass";

  return {
    ...scored,
    decision_state: decisionState,
    blocking_reason: blockedReason,
  };
}

function compareCandidates(left, right) {
  if (left.decision_state !== right.decision_state) {
    const order = { pass: 0, warn: 1, blocked: 2 };
    return order[left.decision_state] - order[right.decision_state];
  }
  if (left.priority_score !== right.priority_score) {
    return right.priority_score - left.priority_score;
  }
  for (const [field, direction] of TIE_BREAK_ORDER) {
    if (left[field] === right[field]) continue;
    return direction === "asc" ? left[field] - right[field] : right[field] - left[field];
  }
  return 0;
}

function buildDecision(ranked, decisionDate) {
  const winner = ranked[0];
  if (!winner || winner.decision_state === "blocked") {
    return {
      trace_id: winner?.trace_id || `chooser-${decisionDate}`,
      decision_state: "blocked",
      selected_source_type: "BLOCKED",
      selected_source_id: "",
      selected_source_version: "",
      selected_family: "BLOCKED",
      template_id: "",
      priority_score: winner?.priority_score || 0,
      source_quality_score: winner?.source_quality_score || 0,
      freshness_score: winner?.freshness_score || 0,
      clarity_score: winner?.clarity_score || 0,
      story_relevance_score: winner?.story_relevance_score || 0,
      teaching_value_score: winner?.teaching_value_score || 0,
      publishability_score: winner?.publishability_score || 0,
      risk_score: winner?.risk_score || 0,
      priority_reason: "No candidate cleared chooser thresholds.",
      blocking_reason: winner?.blocking_reason || "No safe candidate available.",
      next_step: "Collect stronger candidate inputs or fallback to manual editorial review.",
    };
  }

  const family = winner.source_type === "NEWS"
    ? "NEWS"
    : winner.source_type === "QUESTION"
      ? "QUESTION"
      : "WORD";
  const templateId = winner.source_type === "NEWS" ? "T5" : winner.source_type === "QUESTION" ? "T1" : "T2";
  const nextStep = winner.source_type === "NEWS"
    ? "Run NEWS shadow/packaging path and continue into Canva -> Shotstack."
    : winner.source_type === "QUESTION"
      ? "Run QUESTION render package runner and continue into publish handoff."
      : "Run WORD render package runner and continue into publish handoff.";

  return {
    trace_id: winner.trace_id || `chooser-${decisionDate}-${slugify(winner.source_id)}`,
    decision_state: winner.decision_state,
    selected_source_type: winner.source_type,
    selected_source_id: winner.source_id,
    selected_source_version: winner.source_version || "",
    selected_family: family,
    template_id: templateId,
    priority_score: winner.priority_score,
    source_quality_score: winner.source_quality_score,
    freshness_score: winner.freshness_score,
    clarity_score: winner.clarity_score,
    story_relevance_score: winner.story_relevance_score,
    teaching_value_score: winner.teaching_value_score,
    publishability_score: winner.publishability_score,
    risk_score: winner.risk_score,
    priority_reason: `${winner.source_type} won with the highest safe weighted score.`,
    blocking_reason: "",
    next_step: nextStep,
    selected_candidate: winner,
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const raw = await loadJson(args.inputPath);
  const candidates = normalizeBatch(raw);
  const nowDate = args.decisionDate || new Date().toISOString().slice(0, 10);
  const now = new Date(`${nowDate}T12:00:00Z`).getTime();

  if (candidates.length === 0) {
    throw new Error("Chooser input contains no candidates.");
  }

  const evaluated = candidates.map((candidate) => evaluateCandidate(candidate, now));
  const ranked = [...evaluated].sort(compareCandidates);
  const decision = buildDecision(ranked, nowDate);
  logAutonomousDecision("selected source item", {
    source_type: decision.selected_source_type,
    source_id: decision.selected_source_id,
    decision_state: decision.decision_state,
  });
  const slug = slugify(`daily-${nowDate}-${decision.selected_source_type || "blocked"}`) || `daily-${nowDate}`;
  const outputDir = path.join(args.outputRoot, slug);

  await mkdir(outputDir, { recursive: true });
  await writeFile(path.join(outputDir, "ranked_candidates.json"), `${JSON.stringify(ranked, null, 2)}\n`, "utf8");
  await writeFile(path.join(outputDir, "decision.json"), `${JSON.stringify(decision, null, 2)}\n`, "utf8");

  console.log(`decision_date=${nowDate}`);
  console.log(`output_dir=${outputDir}`);
  console.log(`decision=${path.join(outputDir, "decision.json")}`);
  console.log(`ranked_candidates=${path.join(outputDir, "ranked_candidates.json")}`);
  console.log(`selected_source_type=${decision.selected_source_type}`);
  console.log(`selected_source_id=${decision.selected_source_id || ""}`);
  console.log(`decision_state=${decision.decision_state}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
