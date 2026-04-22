#!/usr/bin/env node

import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { QUESTION_SCENARIO_IDS } from "./render/question-scenario-pool.mjs";

function printHelp() {
  console.log(`Usage: node scripts/build-question-performance-feedback.mjs --input <file-or-url> [options]

Options:
  --input <path|url>       Metrics JSON source (local file or HTTPS URL)
  --output <file>          Output summary JSON (default: ./question_variation_feedback_summary.json)
  --n8n-api-key <key>      Optional X-N8N-API-KEY for HTTPS table URLs
  --exploration-rate <n>   Exploration share for next batch (default: 0.25)
  --winner-share <n>       Exploitation share for next batch (default: 0.75)
  --help                   Show this help
`);
}

function parseArgs(argv) {
  const args = {
    input: "",
    output: path.resolve(process.cwd(), "question_variation_feedback_summary.json"),
    n8nApiKey: process.env.N8N_API_KEY || "",
    explorationRate: 0.25,
    winnerShare: 0.75,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (token === "--input") args.input = argv[++index];
    else if (token === "--output") args.output = path.resolve(argv[++index]);
    else if (token === "--n8n-api-key") args.n8nApiKey = argv[++index];
    else if (token === "--exploration-rate") args.explorationRate = Number(argv[++index] || 0.25);
    else if (token === "--winner-share") args.winnerShare = Number(argv[++index] || 0.75);
    else if (token === "--help" || token === "-h") {
      printHelp();
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${token}`);
    }
  }

  if (!args.input) {
    throw new Error("Missing --input <file-or-url>.");
  }

  args.explorationRate = clampRate(args.explorationRate, 0.2, 0.3);
  args.winnerShare = clampRate(args.winnerShare, 0.7, 0.8);
  return args;
}

function clampRate(value, min, max) {
  const number = Number(value);
  if (!Number.isFinite(number)) {
    return min;
  }
  return Math.min(max, Math.max(min, number));
}

function text(value) {
  return value == null ? "" : String(value).trim();
}

function numberOrZero(value) {
  const normalized = Number(value);
  return Number.isFinite(normalized) ? normalized : 0;
}

function parsePercent(value) {
  const raw = text(value);
  if (!raw) {
    return 0;
  }
  if (raw.endsWith("%")) {
    return numberOrZero(raw.slice(0, -1));
  }
  const numeric = numberOrZero(raw);
  return numeric > 0 && numeric <= 1 ? numeric * 100 : numeric;
}

function parseFeedback(feedback) {
  const pairs = {};
  for (const part of text(feedback).split(/\s+/).filter(Boolean)) {
    const equalsIndex = part.indexOf("=");
    if (equalsIndex <= 0) continue;
    const key = part.slice(0, equalsIndex);
    const value = part.slice(equalsIndex + 1);
    if (key) {
      pairs[key] = value;
    }
  }
  return pairs;
}

function extractRetentionFirst3s(row, feedbackPairs) {
  const explicitFields = [
    row.retention_first_3s,
    row.first_3s_retention,
    row.retention_3s,
    row.first3_retention,
    feedbackPairs.retention_first_3s,
    feedbackPairs.first_3s_retention,
  ];
  for (const value of explicitFields) {
    const parsed = parsePercent(value);
    if (parsed > 0) {
      return parsed;
    }
  }

  const curve = row.retention_curve || row.retentionCurve;
  if (Array.isArray(curve) && curve.length > 0) {
    const firstThree = curve
      .map((point, index) => ({
        second: Number(point.second ?? point.t ?? index + 1),
        value: parsePercent(point.value ?? point.retention ?? point.percent),
      }))
      .filter((point) => point.second <= 3 && point.value > 0);
    if (firstThree.length > 0) {
      return average(firstThree.map((point) => point.value));
    }
  }

  return 0;
}

function average(values) {
  if (!values.length) {
    return 0;
  }
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

async function loadInput(source, n8nApiKey) {
  if (/^https?:\/\//i.test(source)) {
    const response = await fetch(source, {
      headers: n8nApiKey ? { "X-N8N-API-KEY": n8nApiKey } : {},
    });
    if (!response.ok) {
      throw new Error(`Failed to load metrics source: ${response.status} ${response.statusText}`);
    }
    return response.json();
  }

  return JSON.parse(await readFile(path.resolve(source), "utf8"));
}

function normalizeRows(payload) {
  if (Array.isArray(payload)) {
    return payload;
  }
  if (Array.isArray(payload?.data)) {
    return payload.data;
  }
  return [];
}

function normalizeMetricRow(row) {
  const feedbackPairs = parseFeedback(row.feedback);
  const variationType = text(row.variation_type || feedbackPairs.variation_type);
  const variationValue = text(row.variation_value || feedbackPairs.variation_value);
  const scenarioKey = text(
    row.source_id ||
      row.scenario_key ||
      row.story_id ||
      feedbackPairs.source_id ||
      feedbackPairs.scenario_key ||
      feedbackPairs.story_id,
  );
  if (!variationType || !variationValue) {
    return null;
  }

  const ctr = parsePercent(
    row.ctr ??
      row.click_through_rate ??
      row.impressions_click_through_rate ??
      feedbackPairs.ctr ??
      feedbackPairs.click_through_rate,
  );
  const averageViewDurationSec = numberOrZero(
    row.average_view_duration_sec ??
      row.avg_view_duration_sec ??
      row.average_view_duration ??
      row.avd_sec ??
      feedbackPairs.average_view_duration_sec ??
      feedbackPairs.avg_view_duration_sec,
  );
  const retentionFirst3s = extractRetentionFirst3s(row, feedbackPairs);

  if (ctr <= 0 && averageViewDurationSec <= 0 && retentionFirst3s <= 0) {
    return null;
  }

  return {
    draft_id: text(row.draft_id),
    youtube_video_id: text(row.youtube_video_id),
    scenario_key: scenarioKey,
    variation_type: variationType,
    variation_value: variationValue,
    ctr,
    average_view_duration_sec: averageViewDurationSec,
    retention_first_3s: retentionFirst3s,
    hook_snapshot: normalizeHookSnapshot(row, feedbackPairs),
  };
}

function normalizeHookSnapshot(row, feedbackPairs) {
  const nested = row.hook_snapshot && typeof row.hook_snapshot === "object" ? row.hook_snapshot : null;
  const frameStyle = text(nested?.frame_style || row.hook_frame_style || feedbackPairs.hook_frame_style);
  const overlayType = text(nested?.overlay_type || row.hook_overlay_type || feedbackPairs.hook_overlay_type);
  const cameraPov = text(nested?.camera_pov || row.hook_camera_pov || feedbackPairs.hook_camera_pov);
  const mutationOrigin = text(nested?.mutation_origin || row.hook_mutation_origin || feedbackPairs.hook_mutation_origin);
  const focalObject = text(nested?.focal_object || row.hook_focal_object || feedbackPairs.hook_focal_object);
  if (!frameStyle && !overlayType && !cameraPov && !mutationOrigin && !focalObject) {
    return null;
  }
  return {
    frame_style: frameStyle,
    overlay_type: overlayType,
    camera_pov: cameraPov,
    mutation_origin: mutationOrigin,
    focal_object: focalObject,
  };
}

function buildVariationSummary(metricRows) {
  const grouped = new Map();
  for (const row of metricRows) {
    const key = `${row.variation_type}::${row.variation_value}`;
    if (!grouped.has(key)) {
      grouped.set(key, {
        variation_type: row.variation_type,
        variation_value: row.variation_value,
        videos: [],
      });
    }
    grouped.get(key).videos.push(row);
  }

  return [...grouped.values()].map((entry) => ({
    variation_type: entry.variation_type,
    variation_value: entry.variation_value,
    sample_size: entry.videos.length,
    ctr_avg: roundMetric(average(entry.videos.map((video) => video.ctr))),
    average_view_duration_sec_avg: roundMetric(
      average(entry.videos.map((video) => video.average_view_duration_sec)),
    ),
    retention_first_3s_avg: roundMetric(
      average(entry.videos.map((video) => video.retention_first_3s)),
    ),
    videos: entry.videos,
  }));
}

function roundMetric(value) {
  return Number(numberOrZero(value).toFixed(2));
}

function standardDeviation(values) {
  if (values.length <= 1) {
    return 0;
  }
  const mean = average(values);
  const variance = average(values.map((value) => (value - mean) ** 2));
  return Math.sqrt(variance);
}

function pickWinner(variationRows, metricKey) {
  const ranked = [...variationRows]
    .filter((row) => numberOrZero(row[metricKey]) > 0)
    .sort((left, right) => numberOrZero(right[metricKey]) - numberOrZero(left[metricKey]));
  if (ranked.length === 0) {
    return { winner: null, runnerUp: null, delta: 0 };
  }
  const winner = ranked[0];
  const runnerUp = ranked[1] || null;
  const delta = runnerUp ? roundMetric(numberOrZero(winner[metricKey]) - numberOrZero(runnerUp[metricKey])) : 0;
  return { winner, runnerUp, delta };
}

function buildNextBatchConfig(variationType, variationRows, explorationRate, winnerShare) {
  const ctrWinner = pickWinner(variationRows, "ctr_avg");
  const retentionWinner = pickWinner(variationRows, "retention_first_3s_avg");
  const avdWinner = pickWinner(variationRows, "average_view_duration_sec_avg");
  const exploitValue = text(
    retentionWinner.winner?.variation_value || ctrWinner.winner?.variation_value || avdWinner.winner?.variation_value,
  );
  const exploreCandidates = variationRows
    .map((row) => row.variation_value)
    .filter((value) => value && value !== exploitValue);

  return {
    variation_type: variationType,
    metric_winners: {
      best_ctr: buildWinnerDescriptor(ctrWinner, "ctr_avg"),
      best_retention: buildWinnerDescriptor(retentionWinner, "retention_first_3s_avg"),
      best_average_view_duration: buildWinnerDescriptor(avdWinner, "average_view_duration_sec_avg"),
    },
    next_batch_config: {
      variation_type: variationType,
      exploit_variation_value: exploitValue,
      exploit_share: winnerShare,
      exploration_share: explorationRate,
      explore_candidates: exploreCandidates,
    },
  };
}

function buildWinnerDescriptor(result, metricKey) {
  if (!result.winner) {
    return {
      variation_value: "",
      metric: metricKey,
      value: 0,
      delta_vs_runner_up: 0,
    };
  }
  return {
    variation_value: result.winner.variation_value,
    metric: metricKey,
    value: numberOrZero(result.winner[metricKey]),
    delta_vs_runner_up: result.delta,
  };
}

function detectKillerHooks(metricRows) {
  const ctrValues = metricRows.map((row) => row.ctr).filter((value) => value > 0);
  const ctrMean = average(ctrValues);
  const ctrStd = standardDeviation(ctrValues);
  const ctrThreshold = ctrMean + 2 * ctrStd;

  return metricRows
    .filter((row) => row.ctr > ctrThreshold || row.retention_first_3s > 80)
    .map((row) => ({
      draft_id: row.draft_id,
      youtube_video_id: row.youtube_video_id,
      scenario_key: row.scenario_key,
      trigger: row.ctr > ctrThreshold ? "ctr_outlier" : "retention_first_3s_over_80",
      variation_type: "killer_hook",
      variation_value: `${row.variation_type}:${row.variation_value}`,
      original_variation_type: row.variation_type,
      original_variation_value: row.variation_value,
      ctr: row.ctr,
      retention_first_3s: row.retention_first_3s,
      average_view_duration_sec: row.average_view_duration_sec,
      hook_snapshot: row.hook_snapshot,
    }));
}

function groupRowsByScenario(metricRows) {
  const grouped = new Map();
  for (const row of metricRows) {
    const key = row.scenario_key || "unknown_scenario";
    if (!grouped.has(key)) {
      grouped.set(key, []);
    }
    grouped.get(key).push(row);
  }
  return grouped;
}

function choosePrimaryVariationSummary(variationSummaries) {
  const ranked = [...variationSummaries].sort((left, right) => {
    const leftRetention = numberOrZero(left.metric_winners?.best_retention?.value);
    const rightRetention = numberOrZero(right.metric_winners?.best_retention?.value);
    const leftCtr = numberOrZero(left.metric_winners?.best_ctr?.value);
    const rightCtr = numberOrZero(right.metric_winners?.best_ctr?.value);
    const leftScore = leftRetention * 2 + leftCtr;
    const rightScore = rightRetention * 2 + rightCtr;
    return rightScore - leftScore;
  });
  return ranked[0] || null;
}

function buildScenarioSummaries(metricRows, explorationRate, winnerShare) {
  const grouped = groupRowsByScenario(metricRows);
  const ctrMedian = median(
    [...grouped.values()]
      .map((rows) => average(rows.map((row) => row.ctr)))
      .filter((value) => value > 0),
  );
  return [...grouped.entries()]
    .map(([scenarioKey, rows]) => {
      const variationBuckets = new Map();
      for (const row of rows) {
        const key = row.variation_type;
        if (!variationBuckets.has(key)) {
          variationBuckets.set(key, []);
        }
        variationBuckets.get(key).push(row);
      }
      const variation_summaries = [...variationBuckets.entries()].map(([variationType, variationRows]) => {
        const groupedVariations = buildVariationSummary(variationRows);
        return {
          variation_type: variationType,
          samples: groupedVariations,
          ...buildNextBatchConfig(variationType, groupedVariations, explorationRate, winnerShare),
        };
      });
      const primary = choosePrimaryVariationSummary(variation_summaries);
      const ctrAvg = roundMetric(average(rows.map((row) => row.ctr)));
      const avdAvg = roundMetric(average(rows.map((row) => row.average_view_duration_sec)));
      const retention3sAvg = roundMetric(average(rows.map((row) => row.retention_first_3s)));
      const testedCount = rows.length;
      const scenarioStatus =
        testedCount >= 20 && ctrAvg < ctrMedian
          ? "inactive"
          : "active";
      return {
        scenario_key: scenarioKey,
        sample_size: testedCount,
        ctr_avg: ctrAvg,
        average_view_duration_sec_avg: avdAvg,
        retention_first_3s_avg: retention3sAvg,
        retention_overall_avg: avdAvg,
        scenario_score: roundMetric(
          average(rows.map((row) => row.retention_first_3s)) * 2 +
            average(rows.map((row) => row.ctr)),
        ),
        scenario_status: scenarioStatus,
        variation_summaries,
        primary_feedback_config: primary,
      };
    })
    .sort((left, right) => numberOrZero(right.scenario_score) - numberOrZero(left.scenario_score));
}

function median(values) {
  const sorted = [...values].sort((left, right) => left - right);
  if (sorted.length === 0) {
    return 0;
  }
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

function buildScenarioLifecycle(scenarioSummaries) {
  const activeScenarios = scenarioSummaries
    .filter((summary) => summary.scenario_status !== "inactive")
    .map((summary, index) => ({
      ...summary,
      scenario_status: index < 2 ? "promoted" : "active",
    }));
  const inactiveScenarios = scenarioSummaries
    .filter((summary) => summary.scenario_status === "inactive")
    .map((summary) => summary.scenario_key);
  const knownScenarioIds = new Set(scenarioSummaries.map((summary) => summary.scenario_key));
  const unusedScenarios = QUESTION_SCENARIO_IDS.filter((scenarioId) => !knownScenarioIds.has(scenarioId));
  const experimentalScenarios = [
    ...activeScenarios
      .filter((summary) => summary.sample_size < 5)
      .slice(0, 2)
      .map((summary) => summary.scenario_key),
    ...unusedScenarios,
  ]
    .filter((value, index, list) => list.indexOf(value) === index)
    .slice(0, 2);

  const promotedScenarios = activeScenarios
    .filter((summary) => summary.scenario_status === "promoted")
    .map((summary) => summary.scenario_key);
  const baseActiveScenarios = activeScenarios
    .filter((summary) => summary.scenario_status === "active")
    .map((summary) => summary.scenario_key)
    .slice(0, 3);

  return {
    active_scenarios: activeScenarios.map((summary) => ({
      scenario_key: summary.scenario_key,
      scenario_status: summary.scenario_status,
      ctr_avg: summary.ctr_avg,
      retention_first_3s_avg: summary.retention_first_3s_avg,
      retention_overall_avg: summary.retention_overall_avg,
      videos_tested: summary.sample_size,
    })),
    promoted_scenarios: promotedScenarios,
    inactive_scenarios: inactiveScenarios,
    experimental_scenarios: experimentalScenarios,
    replacement_candidates: unusedScenarios.slice(0, 2),
    next_batch_scenarios: buildNextBatchScenarioConfig({
      promotedScenarios,
      activeScenarios: baseActiveScenarios,
      experimentalScenarios,
    }),
  };
}

function buildNextBatchScenarioConfig({ promotedScenarios, activeScenarios, experimentalScenarios }) {
  const promotedLead = promotedScenarios[0] || "";
  const secondPromoted = promotedScenarios[1] || "";
  return {
    promoted_lead: promotedLead,
    promoted_lead_share: promotedLead ? 0.4 : 0,
    secondary_priority: secondPromoted ? [secondPromoted] : activeScenarios.slice(0, 1),
    secondary_priority_share: 0.2,
    experimental_scenarios: experimentalScenarios,
    experimental_share: 0.4,
  };
}

function buildHookRemixes(killerHooks) {
  if (!Array.isArray(killerHooks) || killerHooks.length < 2) {
    return [];
  }

  const limited = killerHooks.slice(0, 3);
  const remixes = [];
  for (let index = 0; index < limited.length - 1; index += 1) {
    const hookA = limited[index];
    const hookB = limited[(index + 1) % limited.length];
    const hookC = limited[(index + 2) % limited.length] || hookB;
    remixes.push({
      variation_type: "hook_remix",
      variation_value: `${hookA.original_variation_value}+${hookB.original_variation_value}`,
      payload: {
        overlay_type: text(hookB.hook_snapshot?.overlay_type),
        camera_pov: text(hookA.hook_snapshot?.camera_pov),
        focal_object: text(hookC.hook_snapshot?.focal_object || hookA.hook_snapshot?.focal_object),
        mutation_origin: text(hookA.hook_snapshot?.mutation_origin || hookB.hook_snapshot?.mutation_origin),
        source_hooks: [hookA.draft_id, hookB.draft_id, hookC.draft_id].filter(Boolean),
      },
    });
  }
  return remixes.filter((remix) => remix.payload.overlay_type || remix.payload.camera_pov || remix.payload.focal_object);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const payload = await loadInput(args.input, args.n8nApiKey);
  const rows = normalizeRows(payload);
  const metricRows = rows.map(normalizeMetricRow).filter(Boolean);
  const killerHooks = detectKillerHooks(metricRows);
  const hookRemixes = buildHookRemixes(killerHooks);
  const scenarioSummaries = buildScenarioSummaries(metricRows, args.explorationRate, args.winnerShare);
  const scenarioLifecycle = buildScenarioLifecycle(scenarioSummaries);

  const groupedByVariationType = new Map();
  for (const row of metricRows) {
    if (!groupedByVariationType.has(row.variation_type)) {
      groupedByVariationType.set(row.variation_type, []);
    }
    groupedByVariationType.get(row.variation_type).push(row);
  }

  const variation_summaries = [];
  for (const [variationType, typeRows] of groupedByVariationType.entries()) {
    const variationRows = buildVariationSummary(typeRows);
    const summary = buildNextBatchConfig(
      variationType,
      variationRows,
      args.explorationRate,
      args.winnerShare,
    );
    variation_summaries.push({
      variation_type: variationType,
      samples: variationRows,
      ...summary,
    });
  }

  const output = {
    generated_at: new Date().toISOString(),
    source: args.input,
    total_metric_rows: metricRows.length,
    killer_hooks: killerHooks,
    hook_remixes: hookRemixes,
    next_batch_scenarios: scenarioLifecycle.next_batch_scenarios,
    scenario_lifecycle: scenarioLifecycle,
    scenario_summaries: scenarioSummaries,
    variation_summaries,
  };

  await writeFile(args.output, `${JSON.stringify(output, null, 2)}\n`, "utf8");
  console.log(`feedback_summary=${args.output}`);
  console.log(`variation_types=${variation_summaries.map((summary) => summary.variation_type).join(",")}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
