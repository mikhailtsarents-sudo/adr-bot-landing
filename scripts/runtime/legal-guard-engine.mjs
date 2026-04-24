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
 */

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

  return {
    task_id: `legal-guard-${context.slug || "unknown"}`,
    status: approved ? (risk_level === "low" ? "approved" : "approved_with_notes") : "blocked",
    risk_level,
    short_summary: approved
      ? risk_level === "low"
        ? "No legal issues detected."
        : `Publishable with notes (${mediumHits.length} medium issue(s)).`
      : `Blocked: ${highHits.length} high-risk phrase(s) found. Fix before publish.`,
    required_changes: issues.filter((i) => i.startsWith("HIGH:")),
    optional_notes: issues.filter((i) => i.startsWith("MEDIUM:")),
    reviewed_at: new Date().toISOString(),
    reviewed_by: "legal_guard_engine",
    source: context.source || "unknown",
    slug: context.slug || "",
    approved,
  };
}
