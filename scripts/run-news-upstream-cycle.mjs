#!/usr/bin/env node

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { bootstrapLocalRuntimeEnv } from "./runtime/local-runtime-env.mjs";
import { postStorageRowWithDiagnostics } from "./runtime/storage-row-contract.mjs";
import { enableStrictNonInteractiveMode, logAutonomousDecision } from "./runtime/non-interactive-mode.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const DEFAULT_OUTPUT_ROOT = path.join(repoRoot, "news-upstream-runs");
const DEFAULT_TABLE_URL =
  process.env.DRAFT_STORAGE_API_URL
  || "http://46.225.170.55:3456/v1/youtube-bridge/rows";

const FEEDS = [
  {
    source_name: "Google News RSS ADR",
    topic_type: "news",
    url: "https://news.google.com/rss/search?q=ADR+Gefahrgut+Deutschland&hl=de&gl=DE&ceid=DE:de",
  },
  {
    source_name: "Google News RSS Incidents",
    topic_type: "incident",
    url: "https://news.google.com/rss/search?q=Gefahrgut+Unfall+Deutschland&hl=de&gl=DE&ceid=DE:de",
  },
  {
    source_name: "Google News RSS Regulations",
    topic_type: "regulation",
    url: "https://news.google.com/rss/search?q=ADR+Vorschriften+Deutschland&hl=de&gl=DE&ceid=DE:de",
  },
];

enableStrictNonInteractiveMode("run-news-upstream-cycle");

function text(value) {
  return value == null ? "" : String(value).trim();
}

function stripTags(value) {
  return text(value)
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function decodeXml(value) {
  return text(value)
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'");
}

function getTag(block, tagName) {
  const match = block.match(new RegExp(`<${tagName}>([\\s\\S]*?)<\\/${tagName}>`, "i"));
  return match ? decodeXml(stripTags(match[1])) : "";
}

function slugify(value) {
  return text(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function parseRssItems(xml, feed) {
  const blocks = String(xml || "").match(/<item\b[\s\S]*?<\/item>/gi) || [];
  const now = new Date().toISOString();
  return blocks.slice(0, 10).map((block, index) => ({
    story_id: `${feed.topic_type}-${Date.now()}-${index}`,
    source_title: getTag(block, "title"),
    source_url: getTag(block, "link"),
    published_at: getTag(block, "pubDate") || now,
    source_name: feed.source_name,
    raw_text: getTag(block, "description") || getTag(block, "title"),
    topic_type: feed.topic_type,
  }));
}

function cleanSnippet(value) {
  return decodeXml(stripTags(value))
    .replace(/<a\b[^>]*>/gi, " ")
    .replace(/<\/a>/gi, " ")
    .replace(/https?:\/\/\S+/gi, " ")
    .replace(/<a\s+href=.*$/i, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function rankCandidate(candidate) {
  const haystack = `${candidate.source_title} ${candidate.raw_text}`.toLowerCase();
  const keywords = ["adr", "gefahrgut", "unfall", "vorschrift", "regel", "transport", "logistik", "pruefung", "fahrer"];
  let score = 0;
  for (const keyword of keywords) {
    if (haystack.includes(keyword)) score += 12;
  }
  if (candidate.topic_type === "incident") score += 8;
  if (candidate.topic_type === "regulation") score += 6;
  return Math.min(score || 20, 100);
}

function buildDraftFromCandidate(candidate) {
  const title = text(candidate.source_title);
  const cleanedSnippet = cleanSnippet(candidate.raw_text).slice(0, 220);
  const topicLabel =
    candidate.topic_type === "incident"
      ? "ADR-Vorfall"
      : candidate.topic_type === "regulation"
        ? "ADR-Update"
        : "ADR-Meldung";

  return {
    draft_id: `news-auto-${Date.now()}`,
    story_id: text(candidate.story_id) || slugify(title) || `news-auto-story-${Date.now()}`,
    version: "1",
    created_at: new Date().toISOString(),
    source_title: title,
    source_url: text(candidate.source_url),
    source_name: text(candidate.source_name),
    topic_type: "news",
    headline:
      candidate.topic_type === "incident"
        ? "Was bedeutet dieser ADR-Vorfall fuer Fahrer?"
        : candidate.topic_type === "regulation"
          ? "Was bedeutet dieses ADR-Update fuer Fahrer?"
          : "Was bedeutet diese ADR-Meldung fuer Fahrer?",
    post_text: [
      `Neue ${topicLabel} in Deutschland.`,
      cleanedSnippet ? `Kurz gesagt: ${cleanedSnippet}` : "",
      "Entscheidend ist, was Fahrer und Unternehmen jetzt konkret beachten muessen.",
    ].filter(Boolean).join(" "),
    cta: "Mehr praktische ADR-Hilfe im Bot: @adr_pruefung_trainer_bot",
    hashtags: "#ADR #Gefahrgut #LKW #Deutschland #Logistik",
    image_prompt: "",
    image_url: "",
    approval_status: "approved",
    published_status: "approved_for_shortform_distribution",
    feedback: `upstream_mode=auto_rss topic_type=${text(candidate.topic_type)} source_name=${text(candidate.source_name)}`,
    published_at: "",
  };
}

async function loadExistingRows(tableUrl, n8nApiKey) {
  const response = await fetch(`${tableUrl}${tableUrl.includes("?") ? "&" : "?"}limit=250`, {
    headers: { "X-ADR-API-KEY": n8nApiKey, "X-N8N-API-KEY": n8nApiKey },
  });
  if (!response.ok) {
    throw new Error(`Existing rows fetch failed: ${response.status} ${await response.text()}`);
  }
  const payload = await response.json();
  return Array.isArray(payload?.data) ? payload.data : [];
}

function findFreshCandidate(candidates, existingRows) {
  const rowsThatStillBlock = existingRows.filter((row) => {
    const status = text(row.published_status);
    return status !== "youtube_upload_failed_terminal";
  });
  const seenSourceUrls = new Set(rowsThatStillBlock.map((row) => text(row.source_url)).filter(Boolean));
  const seenTitles = new Set(rowsThatStillBlock.map((row) => text(row.source_title).toLowerCase()).filter(Boolean));

  return candidates
    .filter((candidate) => {
      if (!text(candidate.source_url) || !text(candidate.source_title)) return false;
      if (seenSourceUrls.has(text(candidate.source_url))) return false;
      if (seenTitles.has(text(candidate.source_title).toLowerCase())) return false;
      return true;
    })
    .sort((left, right) => rankCandidate(right) - rankCandidate(left))[0] || null;
}

function printHelp() {
  console.log(`Usage: node scripts/run-news-upstream-cycle.mjs [options]

Options:
  --output-root <dir>    Output root (default: ${DEFAULT_OUTPUT_ROOT})
  --table-url <url>      Draft storage table URL
  --help                 Show this help
`);
}

function parseArgs(argv) {
  const args = {
    outputRoot: DEFAULT_OUTPUT_ROOT,
    tableUrl: DEFAULT_TABLE_URL,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === "--output-root") args.outputRoot = path.resolve(argv[++i]);
    else if (token === "--table-url") args.tableUrl = argv[++i];
    else if (token === "--help" || token === "-h") {
      printHelp();
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${token}`);
    }
  }

  return args;
}

async function writeJson(filePath, payload) {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  await bootstrapLocalRuntimeEnv(repoRoot);
  const n8nApiKey = text(process.env.ADR_INGEST_API_KEY || process.env.N8N_API_KEY);
  if (!n8nApiKey) throw new Error("Missing ADR_INGEST_API_KEY for NEWS upstream cycle.");

  const slug = `news-upstream-${Date.now()}`;
  const outputDir = path.join(args.outputRoot, slug);
  await mkdir(outputDir, { recursive: true });

  const feedResults = [];
  for (const feed of FEEDS) {
    const response = await fetch(feed.url);
    if (!response.ok) {
      throw new Error(`Feed fetch failed for ${feed.source_name}: ${response.status}`);
    }
    const xml = await response.text();
    feedResults.push(...parseRssItems(xml, feed));
  }

  const existingRows = await loadExistingRows(args.tableUrl, n8nApiKey);
  const selected = findFreshCandidate(feedResults, existingRows);

  const discoveredPath = path.join(outputDir, "discovered_candidates.json");
  await writeJson(discoveredPath, {
    created_at: new Date().toISOString(),
    candidate_count: feedResults.length,
    candidates: feedResults,
  });

  if (!selected) {
    const blockedPath = path.join(outputDir, "upstream_report.json");
    await writeJson(blockedPath, {
      created_at: new Date().toISOString(),
      status: "blocked",
      reason: "No fresh RSS candidate remained after duplicate filtering against storage rows.",
      discovered_candidates_path: discoveredPath,
    });
    console.log(`output_dir=${outputDir}`);
    console.log(`upstream_report=${blockedPath}`);
    console.log(`upstream_state=blocked`);
    return;
  }

  const row = buildDraftFromCandidate(selected);
  logAutonomousDecision("news upstream selected fresh candidate", {
    source_title: row.source_title,
    source_name: row.source_name,
    draft_id: row.draft_id,
  });

  await postStorageRowWithDiagnostics(row, {
    endpoint: args.tableUrl,
    apiKey: n8nApiKey,
    diagnosticsDir: outputDir,
  });

  const reportPath = path.join(outputDir, "upstream_report.json");
  await writeJson(reportPath, {
    created_at: new Date().toISOString(),
    status: "seeded",
    discovered_candidates_path: discoveredPath,
    selected_candidate: selected,
    inserted_row: row,
  });

  console.log(`output_dir=${outputDir}`);
  console.log(`upstream_report=${reportPath}`);
  console.log(`seeded_draft_id=${row.draft_id}`);
  console.log(`seeded_story_id=${row.story_id}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
