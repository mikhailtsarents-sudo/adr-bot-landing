/**
 * Legal guard for ADR Bot content.
 *
 * Scans generated page content against the seo-legal-risk-checklist before
 * any write to seo-pages.ts or the Next.js app directory.
 *
 * Risk levels:
 *   low    — publish without changes
 *   medium — publishable, note the issues
 *   high   — block: must fix before publish
 *
 * Results are written to n8n Cloud:
 *   - Yura Legal Review Queue  (medium + high) — for human review
 *   - Yura Legal Review Results (all)           — audit trail
 */

import { spawnSync } from "node:child_process";

const N8N_BASE_URL = process.env.N8N_BASE_URL ?? "https://tsarents.app.n8n.cloud";
const N8N_API_KEY = process.env.N8N_API_KEY ?? "";
const YURA_QUEUE_TABLE_ID = "7MEY9Rqyt6Ls734m";
const YURA_RESULTS_TABLE_ID = "cZuso8N5vniKgdth";

function postToN8nTable(tableId, row) {
  if (!N8N_API_KEY) return;
  const body = JSON.stringify({ data: [row] });
  spawnSync(
    "curl",
    [
      "-s", "-X", "POST",
      `${N8N_BASE_URL}/api/v1/data-tables/${tableId}/rows`,
      "-H", "Content-Type: application/json",
      "-H", `X-N8N-API-KEY: ${N8N_API_KEY}`,
      "-d", body,
      "--max-time", "8",
    ],
    { encoding: "utf8" },
  );
}

const RISKY_HIGH = [
  /\bguaranteed\s+success\b/i,
  /\bpass\s+the\s+adr\s+exam\b/i,
  /\b100\s*%\s*(safe|correct|effective|guaranteed)\b/i,
  /\boffizielle?\s+(schulung|pr[üu]fung|kurs)\b/i, // claiming official status
  /\bzertifiziert\b/i,
  /\bfree\s+full\s+access\b/i,
  /\bcomplete\s+course\b/i,
  /\bthe\s+only\s+way\b/i,
  /\bstart\s+now\s+and\s+pass\s+faster\b/i,
  /\bget\s+everything\s+for\s+free\b/i,
  /\bthis\s+is\s+enough\s+to\s+pass\b/i,
  /\byou\s+will\s+be\s+ready\s+after\s+this\b/i,
  /\bunlock\s+the\s+full\s+course\s+by\s+sharing\b/i,
];

const RISKY_MEDIUM = [
  /\bbest\s+(app|bot|tool|way|method)\b/i,
  /\bnumber\s+one\b/i,
  /\b#1\b/,
  /\bbestehen\s+garantiert\b/i,
  /\bimmer\s+richtig\b/i,
  /\bkomplett(er)?\s+(kurs|zugang|inhalt)\b/i,
  /\bvoll(st[äa]ndiger?)?\s+(kurs|zugang)\b/i,
  /\bkostenlos(er)?\s+(voll(zu|)gang|kurs)\b/i,
];

const REQUIRED_ELEMENTS = [
  {
    pattern: /disclaimer/i,
    label: "disclaimer field",
    description: 'Page config must contain a "disclaimer" key with disclaimer text.',
  },
  {
    pattern: /sample|vorschau|kleiner?\s+ausschnitt/i,
    label: "sample/preview framing",
    description: "Page must communicate that content is a limited sample.",
  },
  {
    pattern: /telegram|bot/i,
    label: "Telegram CTA",
    description: "Page must direct users to Telegram for the full experience.",
  },
];

function findMatches(text, patterns) {
  const hits = [];
  for (const re of patterns) {
    const m = text.match(re);
    if (m) hits.push(m[0]);
  }
  return hits;
}

/**
 * @param {string} content  Full generated content string to scan
 * @param {{ source?: string, slug?: string }} context
 * @returns {{ risk_level: 'low'|'medium'|'high', issues: string[], approved: boolean, reviewed_at: string }}
 */
export function runLegalGuard(content, context = {}) {
  const issues = [];

  const highHits = findMatches(content, RISKY_HIGH);
  for (const hit of highHits) {
    issues.push(`HIGH: risky phrase detected — "${hit}"`);
  }

  const mediumHits = findMatches(content, RISKY_MEDIUM);
  for (const hit of mediumHits) {
    issues.push(`MEDIUM: potentially risky phrase — "${hit}"`);
  }

  for (const req of REQUIRED_ELEMENTS) {
    if (!req.pattern.test(content)) {
      issues.push(`MEDIUM: missing required element — ${req.label}: ${req.description}`);
      mediumHits.push(req.label);
    }
  }

  let risk_level = "low";
  if (highHits.length > 0) risk_level = "high";
  else if (mediumHits.length > 0) risk_level = "medium";

  const approved = risk_level !== "high";

  const reviewedAt = new Date().toISOString();
  const taskId = `legal-guard-${context.slug || "unknown"}-${Date.now()}`;
  const requiredChanges = issues.filter((i) => i.startsWith("HIGH:"));
  const optionalNotes = issues.filter((i) => i.startsWith("MEDIUM:"));
  const shortSummary = approved
    ? risk_level === "low"
      ? "No legal issues detected."
      : `Publishable with notes (${mediumHits.length} medium issue(s)).`
    : `Blocked: ${highHits.length} high-risk phrase(s) found. Fix before publish.`;
  const status = approved ? (risk_level === "low" ? "approved" : "approved_with_notes") : "blocked";

  // Always write result to audit trail
  postToN8nTable(YURA_RESULTS_TABLE_ID, {
    task_id: taskId,
    status,
    risk_level,
    short_summary: shortSummary,
    required_changes_json: JSON.stringify(requiredChanges),
    optional_notes_json: JSON.stringify(optionalNotes),
    reviewed_at: reviewedAt,
    reviewed_by: "legal_guard_engine",
  });

  // Write to review queue only when human attention needed (medium or high)
  if (risk_level !== "low") {
    postToN8nTable(YURA_QUEUE_TABLE_ID, {
      task_id: taskId,
      task_type: "legal_review",
      title: `Legal review: /${context.slug || "unknown"}`,
      summary: shortSummary,
      source: context.source || "seo_autopilot",
      status: risk_level === "high" ? "blocked" : "needs_review",
      priority: risk_level === "high" ? "high" : "medium",
      requested_by: "legal_guard_engine",
      artifacts_json: JSON.stringify([{ type: "slug", value: context.slug || "" }]),
      questions_json: JSON.stringify([...requiredChanges, ...optionalNotes]),
      created_at: reviewedAt,
    });
  }

  return {
    task_id: taskId,
    status,
    risk_level,
    short_summary: shortSummary,
    required_changes: requiredChanges,
    optional_notes: optionalNotes,
    reviewed_at: reviewedAt,
    reviewed_by: "legal_guard_engine",
    source: context.source || "unknown",
    slug: context.slug || "",
    approved,
  };
}
