#!/usr/bin/env node

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { analyzeIntentSignals } from "./runtime/intent-opportunity-engine.mjs";
import { buildContentBriefQueue, buildSeoBriefQueue } from "./runtime/intent-briefing-engine.mjs";
import { enableStrictNonInteractiveMode, logAutonomousDecision } from "./runtime/non-interactive-mode.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const DEFAULT_INPUT_PATH = path.join(repoRoot, "examples", "intent-to-content-signals.sample.json");
const DEFAULT_OUTPUT_ROOT = path.join(repoRoot, "intent-to-content-runs");

enableStrictNonInteractiveMode("run-intent-to-content-machine");

function printHelp() {
  console.log(`Usage: node scripts/run-intent-to-content-machine.mjs [options]

Options:
  --input <file>         Signal snapshot JSON (default: ${DEFAULT_INPUT_PATH})
  --output-root <dir>    Output root for generated reports (default: ${DEFAULT_OUTPUT_ROOT})
  --slug <value>         Explicit run slug
  --backlog-out <file>   Optional explicit JSON path for backlog output
  --seo-brief-out <file> Optional explicit JSON path for SEO brief queue
  --content-brief-out <file> Optional explicit JSON path for content brief queue
  --help                 Show this help

Input shape:
  {
    "search_console": [{ "query": "", "page": "", "clicks": 0, "impressions": 0, "ctr": 0, "position": 0 }],
    "site_analytics": [{ "event": "site_page_view|telegram_cta_click|telegram_redirect", "page_path": "", "source": "" }],
    "telegram_feedback": [{ "intent_key": "", "sentiment": "positive|neutral|negative", "start_count": 0, "completion_count": 0 }],
    "content_feedback": [{ "intent_key": "", "title": "", "format": "", "views": 0, "conversions": 0, "retention_score": 0 }]
  }
`);
}

function parseArgs(argv) {
  const args = {
    inputPath: DEFAULT_INPUT_PATH,
    outputRoot: DEFAULT_OUTPUT_ROOT,
    slug: "",
    backlogOut: "",
    seoBriefOut: "",
    contentBriefOut: "",
  };

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === "--input") args.inputPath = path.resolve(argv[++i]);
    else if (token === "--output-root") args.outputRoot = path.resolve(argv[++i]);
    else if (token === "--slug") args.slug = argv[++i];
    else if (token === "--backlog-out") args.backlogOut = path.resolve(argv[++i]);
    else if (token === "--seo-brief-out") args.seoBriefOut = path.resolve(argv[++i]);
    else if (token === "--content-brief-out") args.contentBriefOut = path.resolve(argv[++i]);
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

function buildMarkdownReport(result) {
  const lines = [];
  lines.push("# Intent-to-Content Machine Report");
  lines.push("");
  lines.push(`Generated: ${result.created_at}`);
  lines.push("");
  lines.push("## Summary");
  lines.push("");
  lines.push(`- Intents analyzed: ${result.summary.intent_count}`);
  lines.push(`- Search Console rows: ${result.summary.signal_counts.search_console}`);
  lines.push(`- Site analytics rows: ${result.summary.signal_counts.site_analytics}`);
  lines.push(`- Telegram feedback rows: ${result.summary.signal_counts.telegram_feedback}`);
  lines.push(`- Content feedback rows: ${result.summary.signal_counts.content_feedback}`);
  lines.push("");
  lines.push("## Top Opportunities");
  lines.push("");

  for (const item of result.opportunities.slice(0, 10)) {
    lines.push(`### ${item.intent_label}`);
    lines.push(`- Intent kind: ${item.intent_kind}`);
    lines.push(`- Opportunity score: ${item.scores.opportunity_score}`);
    lines.push(`- Search demand: ${item.metrics.search_impressions} impressions / ${item.metrics.search_clicks} clicks / CTR ${item.metrics.weighted_ctr}`);
    lines.push(`- Site flow: ${item.metrics.page_views} page views / ${item.metrics.telegram_redirects} Telegram redirects / rate ${item.metrics.click_to_telegram_rate}`);
    lines.push(`- Content feedback: ${item.metrics.content_views} views / retention ${item.metrics.content_retention_score}`);
    lines.push(`- Formats: ${item.recommended_formats.join(", ")}`);
    for (const recommendation of item.recommendations.slice(0, 3)) {
      lines.push(`- Action: ${recommendation}`);
    }
    lines.push("");
  }

  return `${lines.join("\n")}\n`;
}

function buildBacklog(result) {
  return result.opportunities.map((item, index) => ({
    rank: index + 1,
    intent_key: item.intent_key,
    intent_label: item.intent_label,
    intent_kind: item.intent_kind,
    opportunity_score: item.scores.opportunity_score,
    recommended_formats: item.recommended_formats,
    next_actions: item.recommendations.slice(0, 3),
    evidence: {
      search_impressions: item.metrics.search_impressions,
      search_clicks: item.metrics.search_clicks,
      weighted_ctr: item.metrics.weighted_ctr,
      avg_position: item.metrics.avg_position,
      page_views: item.metrics.page_views,
      telegram_redirects: item.metrics.telegram_redirects,
      content_views: item.metrics.content_views,
      content_retention_score: item.metrics.content_retention_score,
    },
  }));
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const snapshot = await loadJson(args.inputPath);
  const result = analyzeIntentSignals(snapshot);
  const slug = slugify(args.slug || `intent-to-content-${Date.now()}`) || `intent-to-content-${Date.now()}`;
  const outputDir = path.join(args.outputRoot, slug);

  await mkdir(outputDir, { recursive: true });

  const jsonPath = path.join(outputDir, "intent_opportunities.json");
  const mdPath = path.join(outputDir, "intent_opportunities.md");
  const backlogPath = args.backlogOut || path.join(outputDir, "intent_backlog.json");
  const seoBriefPath = args.seoBriefOut || path.join(outputDir, "seo_brief_queue.json");
  const contentBriefPath = args.contentBriefOut || path.join(outputDir, "content_brief_queue.json");
  const backlog = buildBacklog(result);
  const seoBriefQueue = buildSeoBriefQueue(backlog, { createdAt: result.created_at });
  const contentBriefQueue = buildContentBriefQueue(backlog, { createdAt: result.created_at });
  await writeFile(jsonPath, `${JSON.stringify(result, null, 2)}\n`, "utf8");
  await writeFile(mdPath, buildMarkdownReport(result), "utf8");
  await writeFile(backlogPath, `${JSON.stringify(backlog, null, 2)}\n`, "utf8");
  await writeFile(seoBriefPath, `${JSON.stringify(seoBriefQueue, null, 2)}\n`, "utf8");
  await writeFile(contentBriefPath, `${JSON.stringify(contentBriefQueue, null, 2)}\n`, "utf8");

  logAutonomousDecision("intent-to-content report generated", {
    input_path: args.inputPath,
    output_dir: outputDir,
    intent_count: result.summary.intent_count,
  });

  console.log(`output_dir=${outputDir}`);
  console.log(`json_report=${jsonPath}`);
  console.log(`markdown_report=${mdPath}`);
  console.log(`backlog=${backlogPath}`);
  console.log(`seo_brief_queue=${seoBriefPath}`);
  console.log(`content_brief_queue=${contentBriefPath}`);
  console.log(`top_intent=${result.opportunities[0]?.intent_key || ""}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
