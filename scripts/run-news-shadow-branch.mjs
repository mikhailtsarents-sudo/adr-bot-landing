#!/usr/bin/env node

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const DEFAULT_OUTPUT_ROOT = path.join(repoRoot, "shadow-runs", "news");

function printHelp() {
  console.log(`Usage: npm run run:news-shadow-branch -- --approved-news <file> --scenario-request <file> --scenario-response <file> --canva-brief <file> [options]

Options:
  --approved-news <file>       Approved NEWS row JSON
  --scenario-request <file>    Scenario request JSON
  --scenario-response <file>   Scenario response JSON
  --canva-brief <file>         Canva brief JSON
  --output-root <dir>          Shadow output root (default: ${DEFAULT_OUTPUT_ROOT})
  --slug <name>                Optional output slug override
  --help                       Show this help
`);
}

function parseArgs(argv) {
  const args = {
    approvedNewsPath: "",
    scenarioRequestPath: "",
    scenarioResponsePath: "",
    canvaBriefPath: "",
    outputRoot: DEFAULT_OUTPUT_ROOT,
    slug: "",
  };

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === "--approved-news") args.approvedNewsPath = path.resolve(argv[++i]);
    else if (token === "--scenario-request") args.scenarioRequestPath = path.resolve(argv[++i]);
    else if (token === "--scenario-response") args.scenarioResponsePath = path.resolve(argv[++i]);
    else if (token === "--canva-brief") args.canvaBriefPath = path.resolve(argv[++i]);
    else if (token === "--output-root") args.outputRoot = path.resolve(argv[++i]);
    else if (token === "--slug") args.slug = argv[++i];
    else if (token === "--help" || token === "-h") {
      printHelp();
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${token}`);
    }
  }

  const missing = [];
  if (!args.approvedNewsPath) missing.push("--approved-news");
  if (!args.scenarioRequestPath) missing.push("--scenario-request");
  if (!args.scenarioResponsePath) missing.push("--scenario-response");
  if (!args.canvaBriefPath) missing.push("--canva-brief");
  if (missing.length > 0) {
    throw new Error(`Missing required arguments: ${missing.join(", ")}`);
  }

  return args;
}

async function loadJson(filePath) {
  return JSON.parse(await readFile(filePath, "utf8"));
}

function text(value) {
  return value == null ? "" : String(value).trim();
}

function valueAtPath(object, pathExpression) {
  return pathExpression.split(".").reduce((value, key) => {
    if (value == null) return undefined;
    return value[key];
  }, object);
}

function requireField(object, pathExpression, label, issues) {
  if (!text(valueAtPath(object, pathExpression))) {
    issues.push(`Missing required field: ${label}`);
  }
}

function requireExact(object, pathExpression, expected, label, issues) {
  const actual = text(valueAtPath(object, pathExpression));
  if (actual !== expected) {
    issues.push(`Expected ${label}=${expected}, found ${actual || "<empty>"}`);
  }
}

function requireArray(object, pathExpression, label, issues, minLength = 1) {
  const value = valueAtPath(object, pathExpression);
  if (!Array.isArray(value) || value.length < minLength) {
    issues.push(`Expected ${label} array with at least ${minLength} item(s).`);
  }
  return Array.isArray(value) ? value : [];
}

function slugify(value) {
  return text(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function collectApprovedNewsIssues(approvedNews) {
  const issues = [];

  requireExact(approvedNews, "source_type", "NEWS", "approved_news.source_type", issues);
  requireExact(approvedNews, "approval_state", "approved", "approved_news.approval_state", issues);
  requireField(approvedNews, "trace_id", "approved_news.trace_id", issues);
  requireField(approvedNews, "news_id", "approved_news.news_id", issues);
  requireField(approvedNews, "draft_id", "approved_news.draft_id", issues);
  requireField(approvedNews, "publish_target", "approved_news.publish_target", issues);
  requireField(approvedNews, "payload.title_de", "approved_news.payload.title_de", issues);
  requireField(approvedNews, "payload.summary_de", "approved_news.payload.summary_de", issues);
  requireField(approvedNews, "payload.source", "approved_news.payload.source", issues);
  requireField(approvedNews, "payload.topic", "approved_news.payload.topic", issues);
  requireField(approvedNews, "payload.cta_variant", "approved_news.payload.cta_variant", issues);
  requireField(approvedNews, "payload.asset_policy", "approved_news.payload.asset_policy", issues);

  return issues;
}

function collectScenarioRequestIssues(approvedNews, scenarioRequest) {
  const issues = [];

  requireExact(scenarioRequest, "trace_id", text(approvedNews.trace_id), "scenario_request.trace_id", issues);
  requireExact(scenarioRequest, "source_type", "NEWS", "scenario_request.source_type", issues);
  requireExact(scenarioRequest, "source_family", "NEWS", "scenario_request.source_family", issues);
  requireExact(scenarioRequest, "template_id", "T5", "scenario_request.template_id", issues);
  requireExact(scenarioRequest, "language_base", "de", "scenario_request.language_base", issues);
  requireExact(scenarioRequest, "target_language", "de", "scenario_request.target_language", issues);
  requireField(scenarioRequest, "source_id", "scenario_request.source_id", issues);
  requireField(scenarioRequest, "audience", "scenario_request.audience", issues);
  requireField(scenarioRequest, "difficulty", "scenario_request.difficulty", issues);
  requireField(scenarioRequest, "duration_target_sec", "scenario_request.duration_target_sec", issues);
  requireField(scenarioRequest, "analytics_tag", "scenario_request.analytics_tag", issues);
  requireExact(scenarioRequest, "source_payload.title_de", text(approvedNews.payload?.title_de), "scenario_request.source_payload.title_de", issues);
  requireExact(scenarioRequest, "source_payload.summary_de", text(approvedNews.payload?.summary_de), "scenario_request.source_payload.summary_de", issues);
  requireExact(scenarioRequest, "source_payload.source", text(approvedNews.payload?.source), "scenario_request.source_payload.source", issues);
  requireExact(scenarioRequest, "source_payload.approval_state", "approved", "scenario_request.source_payload.approval_state", issues);
  requireExact(scenarioRequest, "source_payload.asset_policy", text(approvedNews.payload?.asset_policy), "scenario_request.source_payload.asset_policy", issues);

  return issues;
}

function collectScenarioResponseIssues(scenarioRequest, scenarioResponse) {
  const issues = [];

  requireExact(scenarioResponse, "trace_id", text(scenarioRequest.trace_id), "scenario_response.trace_id", issues);
  requireField(scenarioResponse, "scenario_id", "scenario_response.scenario_id", issues);
  requireExact(scenarioResponse, "source_type", "NEWS", "scenario_response.source_type", issues);
  requireField(scenarioResponse, "source_id", "scenario_response.source_id", issues);
  requireExact(scenarioResponse, "source_family", "NEWS", "scenario_response.source_family", issues);
  requireExact(scenarioResponse, "content_family", "NEWS", "scenario_response.content_family", issues);
  requireExact(scenarioResponse, "validation_status", "pass", "scenario_response.validation_status", issues);
  requireField(scenarioResponse, "hook_text", "scenario_response.hook_text", issues);
  requireArray(scenarioResponse, "scene_plan", "scenario_response.scene_plan", issues);
  requireField(scenarioResponse, "core_answer", "scenario_response.core_answer", issues);
  requireField(scenarioResponse, "short_explanation", "scenario_response.short_explanation", issues);
  requireField(scenarioResponse, "cta_text", "scenario_response.cta_text", issues);
  requireField(scenarioResponse, "caption_text", "scenario_response.caption_text", issues);
  requireArray(scenarioResponse, "hashtags", "scenario_response.hashtags", issues);
  requireField(scenarioResponse, "analytics_tag", "scenario_response.analytics_tag", issues);

  return issues;
}

function collectCanvaBriefIssues(scenarioResponse, canvaBrief) {
  const issues = [];

  requireExact(canvaBrief, "trace_id", text(scenarioResponse.trace_id), "canva_brief.trace_id", issues);
  requireExact(canvaBrief, "scenario_id", text(scenarioResponse.scenario_id), "canva_brief.scenario_id", issues);
  requireExact(canvaBrief, "source_type", "NEWS", "canva_brief.source_type", issues);
  requireExact(canvaBrief, "content_family", "NEWS", "canva_brief.content_family", issues);
  requireExact(canvaBrief, "format", "vertical_short", "canva_brief.format", issues);
  requireExact(canvaBrief, "template_family", "T5_NEWS", "canva_brief.template_family", issues);
  requireExact(canvaBrief, "template_id", "T5", "canva_brief.template_id", issues);
  requireField(canvaBrief, "brief_id", "canva_brief.brief_id", issues);
  requireField(canvaBrief, "slide_count", "canva_brief.slide_count", issues);

  const slideCount = Number(valueAtPath(canvaBrief, "slide_count") || 0);
  const slides = requireArray(canvaBrief, "slides", "canva_brief.slides", issues);
  if (slides.length > 0 && slideCount !== slides.length) {
    issues.push(`Expected canva_brief.slide_count to match slides length (${slides.length}), found ${slideCount || "<empty>"}.`);
  }

  slides.forEach((slide, index) => {
    requireField(slide, "id", `canva_brief.slides[${index}].id`, issues);
    requireField(slide, "name", `canva_brief.slides[${index}].name`, issues);
    requireField(slide, "role", `canva_brief.slides[${index}].role`, issues);
    requireField(slide, "copy", `canva_brief.slides[${index}].copy`, issues);
    requireField(slide, "visual_hint", `canva_brief.slides[${index}].visual_hint`, issues);
  });

  return issues;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const approvedNews = await loadJson(args.approvedNewsPath);
  const scenarioRequest = await loadJson(args.scenarioRequestPath);
  const scenarioResponse = await loadJson(args.scenarioResponsePath);
  const canvaBrief = await loadJson(args.canvaBriefPath);

  const approvedIssues = collectApprovedNewsIssues(approvedNews);
  const requestIssues = collectScenarioRequestIssues(approvedNews, scenarioRequest);
  const scenarioIssues = collectScenarioResponseIssues(scenarioRequest, scenarioResponse);
  const briefIssues = collectCanvaBriefIssues(scenarioResponse, canvaBrief);
  const issues = [...approvedIssues, ...requestIssues, ...scenarioIssues, ...briefIssues];

  const shadowStatus =
    issues.length === 0
      ? "shadow_brief_ready"
      : scenarioIssues.length === 0 && briefIssues.length > 0
        ? "shadow_scenario_ready"
        : "shadow_blocked";
  const validationStatus = issues.length === 0 ? "pass" : "blocked";
  const blockingReason = issues.join("; ");
  const slug =
    slugify(args.slug) ||
    slugify(`news-${text(approvedNews.news_id)}-${text(approvedNews.trace_id)}-shadow`) ||
    "news-shadow";
  const outputDir = path.join(args.outputRoot, slug);

  await mkdir(outputDir, { recursive: true });

  const scenarioRequestPath = path.join(outputDir, "scenario_request.json");
  const scenarioResponsePath = path.join(outputDir, "scenario_response.json");
  const canvaBriefPath = path.join(outputDir, "canva_brief.json");
  const approvedNewsPath = path.join(outputDir, "approved_news.json");
  const traceRecordPath = path.join(outputDir, "shadow_trace_record.json");
  const bundlePath = path.join(outputDir, "shadow_bundle.json");
  const reportPath = path.join(outputDir, "validation_report.json");

  const traceRecord = {
    trace_id: text(approvedNews.trace_id),
    news_id: text(approvedNews.news_id),
    draft_id: text(approvedNews.draft_id),
    scenario_id: text(scenarioResponse.scenario_id),
    brief_id: text(canvaBrief.brief_id),
    approval_state: text(approvedNews.approval_state),
    published_status: "not_published",
    shadow_status: shadowStatus,
    validation_status: validationStatus,
    blocking_reason: blockingReason,
    created_at: new Date().toISOString(),
  };

  const bundle = {
    approved_news: approvedNews,
    scenario_request: scenarioRequest,
    scenario_response: scenarioResponse,
    canva_brief: canvaBrief,
    shadow_trace_record: traceRecord,
  };

  const report = {
    shadow_status: shadowStatus,
    validation_status: validationStatus,
    blocking_reason: blockingReason,
    approved_news_path: approvedNewsPath,
    scenario_request_path: scenarioRequestPath,
    scenario_response_path: scenarioResponsePath,
    canva_brief_path: canvaBriefPath,
    trace_record_path: traceRecordPath,
  };

  await writeFile(approvedNewsPath, `${JSON.stringify(approvedNews, null, 2)}\n`, "utf8");
  await writeFile(scenarioRequestPath, `${JSON.stringify(scenarioRequest, null, 2)}\n`, "utf8");
  await writeFile(scenarioResponsePath, `${JSON.stringify(scenarioResponse, null, 2)}\n`, "utf8");
  await writeFile(canvaBriefPath, `${JSON.stringify(canvaBrief, null, 2)}\n`, "utf8");
  await writeFile(traceRecordPath, `${JSON.stringify(traceRecord, null, 2)}\n`, "utf8");
  await writeFile(bundlePath, `${JSON.stringify(bundle, null, 2)}\n`, "utf8");
  await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

  console.log(`output_dir=${outputDir}`);
  console.log(`shadow_status=${shadowStatus}`);
  console.log(`validation_status=${validationStatus}`);
  console.log(`trace_record=${traceRecordPath}`);
  console.log(`bundle=${bundlePath}`);
  console.log(`report=${reportPath}`);

  if (validationStatus !== "pass") {
    throw new Error(blockingReason || "NEWS shadow branch validation failed.");
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
