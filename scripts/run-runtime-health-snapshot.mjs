#!/usr/bin/env node

import { execFile as execFileCb } from "node:child_process";
import { promisify } from "node:util";
import { mkdir, readdir, stat, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { bootstrapLocalRuntimeEnv } from "./runtime/local-runtime-env.mjs";
import { enableStrictNonInteractiveMode } from "./runtime/non-interactive-mode.mjs";

const execFile = promisify(execFileCb);

enableStrictNonInteractiveMode("run-runtime-health-snapshot");

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const DEFAULT_OUTPUT_ROOT = path.join(repoRoot, "runtime-health-runs");

function text(value) {
  return value == null ? "" : String(value).trim();
}

function number(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function slugify(value) {
  return text(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function parseArgs(argv) {
  const args = {
    outputRoot: DEFAULT_OUTPUT_ROOT,
    slug: "",
    publicBaseUrl: process.env.ADR_PUBLIC_BASE_URL || "https://www.adr-bot.de",
    ingestUrl: process.env.ADR_INGEST_URL || "http://46.225.170.55:3456",
    timeoutMs: 8000,
    publicOnly: false,
    failOnStatus: "never",
  };

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === "--output-root") args.outputRoot = path.resolve(argv[++i]);
    else if (token === "--slug") args.slug = argv[++i];
    else if (token === "--public-base-url") args.publicBaseUrl = argv[++i];
    else if (token === "--ingest-url") args.ingestUrl = argv[++i];
    else if (token === "--timeout-ms") args.timeoutMs = number(argv[++i], 8000);
    else if (token === "--public-only") args.publicOnly = true;
    else if (token === "--fail-on-status") {
      const threshold = text(argv[++i]).toLowerCase();
      if (!["never", "warn", "fail"].includes(threshold)) {
        throw new Error(`Unsupported --fail-on-status value: ${threshold}`);
      }
      args.failOnStatus = threshold;
    }
    else if (token === "--help" || token === "-h") {
      console.log(`Usage: node scripts/run-runtime-health-snapshot.mjs [options]

Options:
  --output-root <dir>     Output root for generated snapshots
  --slug <value>          Explicit run slug
  --public-base-url <url> Public base URL to verify (default: https://www.adr-bot.de)
  --ingest-url <url>      Private ingest URL to verify (default: ADR_INGEST_URL or VPS default)
  --timeout-ms <n>        Per-check timeout in milliseconds (default: 8000)
  --public-only           Skip systemd/private ingest checks and verify only public endpoints
  --fail-on-status <v>    Exit non-zero on runtime status >= threshold (never|warn|fail)
`);
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${token}`);
    }
  }

  return args;
}

function isoNow() {
  return new Date().toISOString();
}

function minutesSince(date) {
  return (Date.now() - new Date(date).getTime()) / (60 * 1000);
}

function classifyByAge(ageMinutes, { okWithin, warnWithin }) {
  if (!Number.isFinite(ageMinutes)) return "fail";
  if (ageMinutes <= okWithin) return "ok";
  if (ageMinutes <= warnWithin) return "warn";
  return "fail";
}

function summarizeStatus(checks) {
  if (checks.some((entry) => entry.status === "fail")) return "fail";
  if (checks.some((entry) => entry.status === "warn")) return "warn";
  if (checks.every((entry) => entry.status === "skipped")) return "skipped";
  return "ok";
}

const STATUS_RANK = {
  skipped: -1,
  ok: 0,
  warn: 1,
  fail: 2,
};

function shouldExitNonZero(status, threshold) {
  if (threshold === "never") return false;
  return (STATUS_RANK[status] ?? 0) >= (STATUS_RANK[threshold] ?? Number.POSITIVE_INFINITY);
}

function buildRecommendedActions(checks) {
  const actions = [];
  const push = (value) => {
    if (!value || actions.includes(value)) return;
    actions.push(value);
  };

  for (const check of checks) {
    if (check.status !== "fail" && check.status !== "warn") continue;
    if (check.key.startsWith("systemd:")) {
      push(`Inspect and, if needed, restart ${check.key.replace("systemd:", "")}.`);
    } else if (check.key.startsWith("log:")) {
      push(`Review stale runtime activity for ${check.key.replace("log:", "")} and verify the underlying scheduler/service is still active.`);
    } else if (check.key === "telegram:webhook_info") {
      push("Check Telegram webhook URL, pending update count, and bot token configuration on VPS.");
    } else if (check.key.startsWith("ingest:")) {
      push("Verify adr-ingest health, ADR_INGEST_API_KEY, and Postgres connectivity for private analytics reads.");
    } else if (check.key.startsWith("public:")) {
      push("Inspect public analytics/dashboard routes and confirm the current web deploy is serving the expected build.");
    }
  }

  if (!actions.length) {
    push("No immediate operator action required.");
  }

  return actions.slice(0, 6);
}

function buildAlerting(checks, overallStatus) {
  const failChecks = checks.filter((entry) => entry.status === "fail");
  const warnChecks = checks.filter((entry) => entry.status === "warn");
  const okCount = checks.filter((entry) => entry.status === "ok").length;
  const skippedCount = checks.filter((entry) => entry.status === "skipped").length;
  const severity = overallStatus === "fail"
    ? "critical"
    : overallStatus === "warn"
      ? "warning"
      : "none";

  return {
    severity,
    alert_needed: overallStatus === "fail",
    fail_count: failChecks.length,
    warn_count: warnChecks.length,
    ok_count: okCount,
    skipped_count: skippedCount,
    failing_checks: failChecks.map((entry) => entry.key),
    warning_checks: warnChecks.map((entry) => entry.key),
    headline:
      overallStatus === "fail"
        ? "Runtime health snapshot found blocking failures."
        : overallStatus === "warn"
          ? "Runtime health snapshot found warnings."
          : "Runtime health snapshot is healthy.",
    recommended_actions: buildRecommendedActions(checks),
  };
}

async function runCommand(file, args, timeoutMs) {
  try {
    const result = await execFile(file, args, { timeout: timeoutMs, maxBuffer: 1024 * 1024 });
    return {
      ok: true,
      stdout: text(result.stdout),
      stderr: text(result.stderr),
    };
  } catch (error) {
    return {
      ok: false,
      stdout: text(error.stdout),
      stderr: text(error.stderr || error.message),
    };
  }
}

async function checkSystemdUnit(unit, timeoutMs, publicOnly) {
  if (publicOnly) {
    return { key: `systemd:${unit}`, status: "skipped", summary: "Skipped in public-only mode." };
  }
  if (process.platform !== "linux") {
    return { key: `systemd:${unit}`, status: "skipped", summary: "Systemd checks are only available on Linux/VPS." };
  }

  const active = await runCommand("/bin/systemctl", ["is-active", unit], timeoutMs);
  const details = await runCommand("/bin/systemctl", ["show", unit, "--property=ActiveState,SubState,ActiveEnterTimestamp", "--no-pager"], timeoutMs);
  const state = active.ok ? text(active.stdout) : text(active.stderr);
  const summary = state || "unknown";

  return {
    key: `systemd:${unit}`,
    status: state === "active" ? "ok" : "fail",
    summary,
    details: details.stdout || details.stderr,
  };
}

async function checkFileFreshness(key, filePath, thresholds, publicOnly) {
  if (publicOnly) {
    return { key, status: "skipped", summary: "Skipped in public-only mode." };
  }

  try {
    const fileStat = await stat(filePath);
    const modifiedAt = fileStat.mtime.toISOString();
    const ageMinutes = minutesSince(modifiedAt);
    return {
      key,
      status: classifyByAge(ageMinutes, thresholds),
      summary: `${path.basename(filePath)} modified ${Math.round(ageMinutes)} min ago`,
      details: `mtime=${modifiedAt}`,
    };
  } catch (error) {
    return {
      key,
      status: "fail",
      summary: `Missing or unreadable file: ${filePath}`,
      details: text(error.message),
    };
  }
}

async function checkLatestFileFreshness(key, directoryPath, matcher, thresholds, publicOnly) {
  if (publicOnly) {
    return { key, status: "skipped", summary: "Skipped in public-only mode." };
  }

  try {
    const entries = await readdir(directoryPath, { withFileTypes: true });
    const candidates = entries
      .filter((entry) => entry.isFile() && matcher(entry.name))
      .map((entry) => entry.name)
      .sort();

    const latestName = candidates.at(-1);
    if (!latestName) {
      return {
        key,
        status: "fail",
        summary: `No matching files found in ${directoryPath}`,
      };
    }

    const latestPath = path.join(directoryPath, latestName);
    const fileStat = await stat(latestPath);
    const modifiedAt = fileStat.mtime.toISOString();
    const ageMinutes = minutesSince(modifiedAt);
    return {
      key,
      status: classifyByAge(ageMinutes, thresholds),
      summary: `${latestName} modified ${Math.round(ageMinutes)} min ago`,
      details: `mtime=${modifiedAt}; path=${latestPath}`,
    };
  } catch (error) {
    return {
      key,
      status: "fail",
      summary: `Missing or unreadable directory: ${directoryPath}`,
      details: text(error.message),
    };
  }
}

async function fetchJson(url, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs || 8000);
  try {
    const response = await fetch(url, {
      method: options.method || "GET",
      headers: options.headers || {},
      signal: controller.signal,
      cache: "no-store",
    });
    const bodyText = await response.text();
    let body = null;
    try {
      body = JSON.parse(bodyText);
    } catch {
      body = null;
    }
    return {
      ok: response.ok,
      status: response.status,
      body,
      text: bodyText,
    };
  } finally {
    clearTimeout(timeout);
  }
}

async function checkPublicSummary(key, url, timeoutMs, describeOk) {
  try {
    const response = await fetchJson(url, { timeoutMs });
    if (!response.ok || response.body?.ok === false || !response.body?.dashboard) {
      return {
        key,
        status: "fail",
        summary: `HTTP ${response.status}`,
        details: text(response.body?.error || response.text).slice(0, 400),
      };
    }
    return {
      key,
      status: "ok",
      summary: describeOk(response.body.dashboard),
      details: `url=${url}`,
    };
  } catch (error) {
    return {
      key,
      status: "fail",
      summary: "request_failed",
      details: text(error.message),
    };
  }
}

async function checkPrivateIngest(key, url, apiKey, timeoutMs, publicOnly, describeOk) {
  if (publicOnly) {
    return { key, status: "skipped", summary: "Skipped in public-only mode." };
  }
  if (!text(apiKey)) {
    return { key, status: "skipped", summary: "Missing ADR_INGEST_API_KEY." };
  }

  try {
    const response = await fetchJson(url, {
      timeoutMs,
      headers: {
        "X-ADR-API-KEY": apiKey,
        "Content-Type": "application/json",
      },
    });
    const success = response.ok && (response.body?.ok !== false);
    if (!success) {
      return {
        key,
        status: "fail",
        summary: `HTTP ${response.status}`,
        details: text(response.body?.error || response.text).slice(0, 400),
      };
    }
    return {
      key,
      status: "ok",
      summary: describeOk(response.body),
      details: `url=${url}`,
    };
  } catch (error) {
    return {
      key,
      status: "fail",
      summary: "request_failed",
      details: text(error.message),
    };
  }
}

async function checkTelegramWebhook(token, timeoutMs, publicOnly) {
  const key = "telegram:webhook_info";
  if (publicOnly) {
    return { key, status: "skipped", summary: "Skipped in public-only mode." };
  }
  if (!text(token)) {
    return { key, status: "skipped", summary: "Missing TELEGRAM_BOT_TOKEN/BOT_TOKEN." };
  }

  const expectedUrl =
    text(process.env.EXPECTED_TELEGRAM_WEBHOOK_URL) ||
    "https://46.225.170.55:8443/telegram-webhook";

  try {
    const response = await fetchJson(`https://api.telegram.org/bot${token}/getWebhookInfo`, { timeoutMs });
    const info = response.body?.result || {};
    const currentUrl = text(info.url);
    const lastError = text(info.last_error_message);
    const lastErrorDate = number(info.last_error_date, 0);
    const lastErrorAgeMinutes = lastErrorDate
      ? Math.max(0, (Date.now() - lastErrorDate * 1000) / (60 * 1000))
      : 0;
    const pending = number(info.pending_update_count, 0);
    const status =
      currentUrl !== expectedUrl
        ? "fail"
        : lastError
          ? (pending > 0 ? "fail" : (lastErrorAgeMinutes <= 5 ? "warn" : "ok"))
          : (pending > 100 ? "warn" : "ok");

    return {
      key,
      status,
      summary: currentUrl ? `webhook=${currentUrl}` : "No webhook URL configured",
      details: `expected=${expectedUrl}; pending=${pending}; last_error=${lastError || "none"}; last_error_date=${lastErrorDate || "none"}; last_error_age_min=${lastErrorDate ? Math.round(lastErrorAgeMinutes) : "none"}`,
    };
  } catch (error) {
    return {
      key,
      status: "fail",
      summary: "request_failed",
      details: text(error.message),
    };
  }
}

function buildMarkdown(snapshot) {
  const lines = [];
  lines.push("# Runtime Health Snapshot");
  lines.push("");
  lines.push(`- Generated: \`${snapshot.generated_at}\``);
  lines.push(`- Host: \`${snapshot.host}\``);
  lines.push(`- Mode: \`${snapshot.mode}\``);
  lines.push(`- Overall status: \`${snapshot.overall_status}\``);
  lines.push(`- Alert severity: \`${snapshot.alerting.severity}\``);
  lines.push(`- Alert needed: \`${snapshot.alerting.alert_needed ? "yes" : "no"}\``);
  lines.push("");
  lines.push("## Alerting");
  lines.push("");
  lines.push(`- Headline: ${snapshot.alerting.headline}`);
  lines.push(`- Fail checks: ${snapshot.alerting.fail_count}`);
  lines.push(`- Warn checks: ${snapshot.alerting.warn_count}`);
  lines.push(`- OK checks: ${snapshot.alerting.ok_count}`);
  lines.push(`- Skipped checks: ${snapshot.alerting.skipped_count}`);
  lines.push("");
  lines.push("### Recommended actions");
  lines.push("");
  for (const action of snapshot.alerting.recommended_actions) {
    lines.push(`- ${action}`);
  }
  lines.push("");
  lines.push("| Check | Status | Summary |");
  lines.push("| --- | --- | --- |");
  for (const check of snapshot.checks) {
    lines.push(`| \`${check.key}\` | \`${check.status}\` | ${String(check.summary || "").replace(/\|/g, "\\|")} |`);
  }
  lines.push("");
  lines.push("## Blockers");
  lines.push("");
  if (!snapshot.blockers.length) {
    lines.push("- none");
  } else {
    for (const blocker of snapshot.blockers) {
      lines.push(`- ${blocker}`);
    }
  }
  lines.push("");
  lines.push("## Details");
  lines.push("");
  for (const check of snapshot.checks) {
    lines.push(`### ${check.key}`);
    lines.push("");
    lines.push(`- status: \`${check.status}\``);
    lines.push(`- summary: ${check.summary || "n/a"}`);
    if (check.details) {
      lines.push(`- details: ${check.details}`);
    }
    lines.push("");
  }
  return `${lines.join("\n")}\n`;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  await bootstrapLocalRuntimeEnv(repoRoot);

  const slug = slugify(args.slug || `runtime-health-${Date.now()}`) || `runtime-health-${Date.now()}`;
  const outputDir = path.join(args.outputRoot, slug);
  await mkdir(outputDir, { recursive: true });

  const publicBaseUrl = text(args.publicBaseUrl).replace(/\/+$/, "");
  const ingestUrl = text(args.ingestUrl).replace(/\/+$/, "");
  const ingestApiKey = text(process.env.ADR_INGEST_API_KEY);
  const botToken = text(process.env.TELEGRAM_BOT_TOKEN || process.env.BOT_TOKEN);
  const telegramUnit = text(process.env.ADR_TELEGRAM_BOT_SYSTEMD_UNIT) || "adr-telegram-bot.service";
  const ingestUnit = text(process.env.ADR_INGEST_SYSTEMD_UNIT) || "adr-ingest.service";

  const checks = [];
  checks.push(await checkSystemdUnit(telegramUnit, args.timeoutMs, args.publicOnly));
  checks.push(await checkSystemdUnit(ingestUnit, args.timeoutMs, args.publicOnly));
  checks.push(await checkFileFreshness(
    "log:adr-telegram-bot",
    "/var/log/adr-telegram-bot.log",
    { okWithin: 720, warnWithin: 1440 },
    args.publicOnly,
  ));
  checks.push(await checkFileFreshness(
    "log:adr-bot-reminder",
    "/var/log/adr-bot-reminder.log",
    { okWithin: 130, warnWithin: 360 },
    args.publicOnly,
  ));
  checks.push(await checkLatestFileFreshness(
    "backup:manifest_latest",
    "/srv/adr-project/backups/adr-stack/manifests",
    (name) => name.endsWith(".json"),
    { okWithin: 26 * 60, warnWithin: 48 * 60 },
    args.publicOnly,
  ));
  checks.push(await checkLatestFileFreshness(
    "backup:restore_smoke_latest",
    "/srv/adr-project/backups/adr-stack/restore-smoke",
    (name) => name.endsWith(".json"),
    { okWithin: 8 * 24 * 60, warnWithin: 14 * 24 * 60 },
    args.publicOnly,
  ));
  checks.push(await checkTelegramWebhook(botToken, args.timeoutMs, args.publicOnly));

  checks.push(await checkPrivateIngest(
    "ingest:analytics_rows",
    `${ingestUrl}/v1/analytics/rows?limit=1`,
    ingestApiKey,
    args.timeoutMs,
    args.publicOnly,
    (body) => `rows=${Array.isArray(body.data) ? body.data.length : 0}`,
  ));
  checks.push(await checkPrivateIngest(
    "ingest:bot_funnel_rows",
    `${ingestUrl}/v1/bot-funnel/rows?limit=1`,
    ingestApiKey,
    args.timeoutMs,
    args.publicOnly,
    (body) => `rows=${Array.isArray(body.data) ? body.data.length : 0}`,
  ));
  checks.push(await checkPrivateIngest(
    "ingest:reminder_summary",
    `${ingestUrl}/v1/reminders/summary`,
    ingestApiKey,
    args.timeoutMs,
    args.publicOnly,
    (body) => `users=${number(body.summary?.total_users, 0)}`,
  ));

  checks.push(await checkPublicSummary(
    "public:site_dashboard",
    `${publicBaseUrl}/api/analytics/dashboard.json?limit=50`,
    args.timeoutMs,
    (dashboard) => `site_rows=${number(dashboard.total_rows_considered, 0)}`,
  ));
  checks.push(await checkPublicSummary(
    "public:bot_funnel_dashboard",
    `${publicBaseUrl}/api/analytics/bot-funnel.json?limit=50`,
    args.timeoutMs,
    (dashboard) => `bot_events_30d=${number(dashboard.total_events_30d, 0)}`,
  ));
  checks.push(await checkPublicSummary(
    "public:reconciliation_dashboard",
    `${publicBaseUrl}/api/analytics/reconciliation.json?limit=50`,
    args.timeoutMs,
    (dashboard) => `largest_gap=${text(dashboard.summary_30d?.largest_gap_step) || "n/a"}`,
  ));

  const blockers = checks
    .filter((entry) => entry.status === "fail")
    .map((entry) => `${entry.key}: ${entry.summary}`);

  const overallStatus = summarizeStatus(checks);
  const alerting = buildAlerting(checks, overallStatus);

  const snapshot = {
    generated_at: isoNow(),
    host: os.hostname(),
    mode: args.publicOnly ? "public_only" : "full",
    overall_status: overallStatus,
    alerting,
    checks,
    blockers,
  };

  const jsonPath = path.join(outputDir, "runtime_health_snapshot.json");
  const markdownPath = path.join(outputDir, "runtime_health_snapshot.md");
  const latestDir = path.join(args.outputRoot, "latest");
  const latestJsonPath = path.join(latestDir, "runtime_health_snapshot.json");
  const latestMarkdownPath = path.join(latestDir, "runtime_health_snapshot.md");
  await mkdir(latestDir, { recursive: true });
  await writeFile(jsonPath, `${JSON.stringify(snapshot, null, 2)}\n`, "utf8");
  await writeFile(markdownPath, buildMarkdown(snapshot), "utf8");
  await writeFile(latestJsonPath, `${JSON.stringify(snapshot, null, 2)}\n`, "utf8");
  await writeFile(latestMarkdownPath, buildMarkdown(snapshot), "utf8");

  console.log(JSON.stringify({
    ok: snapshot.overall_status !== "fail",
    overall_status: snapshot.overall_status,
    alert_needed: snapshot.alerting.alert_needed,
    alert_severity: snapshot.alerting.severity,
    output_dir: outputDir,
    latest_json_path: latestJsonPath,
    latest_markdown_path: latestMarkdownPath,
    blockers: snapshot.blockers,
    recommended_actions: snapshot.alerting.recommended_actions,
  }, null, 2));

  if (shouldExitNonZero(snapshot.overall_status, args.failOnStatus)) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error("[run-runtime-health-snapshot]", error);
  process.exitCode = 1;
});
