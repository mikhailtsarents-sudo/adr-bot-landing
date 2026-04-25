#!/usr/bin/env node

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { enableStrictNonInteractiveMode, logAutonomousDecision } from "./runtime/non-interactive-mode.mjs";
import { bootstrapLocalRuntimeEnv } from "./runtime/local-runtime-env.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const controlCenterRoot = path.resolve(repoRoot, "..", "adr-control-center");
const DEFAULT_OUTPUT_ROOT = path.join(repoRoot, "seo-autopilot-runs");
const DEFAULT_SEO_QUEUE_PATH = path.join(
  controlCenterRoot,
  "runtime",
  "queues",
  "seo-expansion-worker",
  "latest",
  "seo_execution_queue.latest.json",
);
const DEFAULT_HISTORY_PATH = path.join(
  controlCenterRoot,
  "runtime",
  "queues",
  "seo-autopilot",
  "latest",
  "seo_autopilot_history.latest.json",
);

enableStrictNonInteractiveMode("run-seo-autopilot-cycle");

function printHelp() {
  console.log(`Usage: node scripts/run-seo-autopilot-cycle.mjs [options]

Options:
  --input <file>        SEO execution queue JSON (default: latest from seo-expansion-worker)
  --output-root <dir>   Root for autopilot run outputs (default: ${DEFAULT_OUTPUT_ROOT})
  --history <file>      Autopilot history JSON (default: ${DEFAULT_HISTORY_PATH})
  --refresh-top <n>     Max pages to refresh per run (default: 3)
  --create-top <n>      Max new pages to create per run (default: 1)
  --skip-refresh        Skip refresh step
  --skip-create         Skip create step
  --skip-git            Apply changes but do not commit/push
  --dry-run             Build report without writing any SEO files or git actions
  --force               Ignore day lock and run again
  --help                Show this help
`);
}

function parseArgs(argv) {
  const args = {
    inputPath: DEFAULT_SEO_QUEUE_PATH,
    outputRoot: DEFAULT_OUTPUT_ROOT,
    historyPath: DEFAULT_HISTORY_PATH,
    refreshTop: 3,
    createTop: 1,
    skipRefresh: false,
    skipCreate: false,
    skipGit: false,
    dryRun: false,
    force: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === "--input") args.inputPath = path.resolve(argv[++i]);
    else if (token === "--output-root") args.outputRoot = path.resolve(argv[++i]);
    else if (token === "--history") args.historyPath = path.resolve(argv[++i]);
    else if (token === "--refresh-top") args.refreshTop = Number(argv[++i]);
    else if (token === "--create-top") args.createTop = Number(argv[++i]);
    else if (token === "--skip-refresh") args.skipRefresh = true;
    else if (token === "--skip-create") args.skipCreate = true;
    else if (token === "--skip-git") args.skipGit = true;
    else if (token === "--dry-run") args.dryRun = true;
    else if (token === "--force") args.force = true;
    else if (token === "--help" || token === "-h") {
      printHelp();
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${token}`);
    }
  }

  return args;
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

function runGit(gitArgs, options = {}) {
  const result = spawnSync("git", gitArgs, {
    cwd: repoRoot,
    encoding: "utf8",
    stdio: "pipe",
    ...options,
  });
  return {
    status: result.status,
    stdout: text(result.stdout),
    stderr: text(result.stderr),
  };
}

function parseOutputPath(stdout, key) {
  const line = stdout
    .split("\n")
    .map((entry) => entry.trim())
    .find((entry) => entry.startsWith(`${key}=`));
  return line ? line.slice(key.length + 1) : "";
}

async function loadJson(filePath, fallback = null) {
  try {
    return JSON.parse(await readFile(filePath, "utf8"));
  } catch {
    return fallback;
  }
}

async function writeJson(filePath, payload) {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}

function buildCommitMessage(refreshedSlugs, createdSlugs) {
  const parts = [];
  if (refreshedSlugs.length > 0) {
    parts.push(`Refresh ${refreshedSlugs.length} SEO page(s): ${refreshedSlugs.join(", ")}`);
  }
  if (createdSlugs.length > 0) {
    parts.push(`Add ${createdSlugs.length} new SEO page(s): ${createdSlugs.join(", ")}`);
  }
  return parts.join("; ");
}

async function gitCommitAndPush(refreshedSlugs, createdSlugs, dryRun) {
  const stagePaths = [
    "src/lib/seo-pages.ts",
    ...createdSlugs.map((slug) => path.join("src", "app", slug, "page.tsx")),
  ];
  const commitMsg = buildCommitMessage(refreshedSlugs, createdSlugs);

  if (dryRun) {
    return {
      skipped: false,
      dry_run: true,
      commit_message: commitMsg,
      stage_paths: stagePaths,
    };
  }

  for (const stagePath of [...new Set(stagePaths)]) {
    const addResult = runGit(["add", stagePath]);
    if (addResult.status !== 0) {
      throw new Error(`git add failed for ${stagePath}: ${addResult.stderr}`);
    }
  }

  const statusResult = runGit(["diff", "--cached", "--name-only"]);
  if (!text(statusResult.stdout)) {
    return { skipped: true, reason: "nothing to commit after git add" };
  }

  const commitResult = runGit(["commit", "-m", commitMsg]);
  if (commitResult.status !== 0) {
    throw new Error(`git commit failed: ${commitResult.stderr}`);
  }

  const pushResult = runGit(["push", "origin", "main"]);
  if (pushResult.status !== 0) {
    throw new Error(`git push failed: ${pushResult.stderr}`);
  }

  const shaResult = runGit(["rev-parse", "HEAD"]);
  return {
    skipped: false,
    dry_run: false,
    commit_message: commitMsg,
    commit_sha: text(shaResult.stdout).slice(0, 12),
    stage_paths: stagePaths,
    changed_files: text(statusResult.stdout).split("\n").filter(Boolean),
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  await bootstrapLocalRuntimeEnv(repoRoot);

  const decisionDate = new Date().toISOString().slice(0, 10);
  const runSlug = slugify(`seo-autopilot-${decisionDate}`) || `seo-autopilot-${Date.now()}`;
  const outputDir = path.join(args.outputRoot, runSlug);
  const latestDir = path.join(args.outputRoot, "latest");
  const lockDir = path.join(args.outputRoot, "day-locks");
  const lockPath = path.join(lockDir, `${decisionDate}.json`);

  await mkdir(outputDir, { recursive: true });
  await mkdir(latestDir, { recursive: true });
  await mkdir(lockDir, { recursive: true });

  const existingLock = await loadJson(lockPath);
  if (!args.force && existingLock?.status === "completed") {
    throw new Error(
      `SEO autopilot already completed for ${decisionDate}. Use --force to override.`,
    );
  }

  const startedAt = new Date().toISOString();
  await writeJson(lockPath, { decision_date: decisionDate, status: "running", started_at: startedAt });

  const history = (await loadJson(args.historyPath, { history: [] })).history || [];

  let refreshOutput = "";
  let createOutput = "";

  if (!args.skipRefresh) {
    const refreshArgs = [
      "--input", args.inputPath,
      "--slug", runSlug,
      "--top", String(Number.isFinite(args.refreshTop) && args.refreshTop > 0 ? args.refreshTop : 3),
    ];
    if (args.dryRun) {
      refreshOutput = "applied_count=0";
    } else {
      refreshOutput = runNodeScript(path.join(repoRoot, "scripts", "run-seo-page-refresh.mjs"), refreshArgs);
    }
  }

  if (!args.skipCreate) {
    const createArgs = [
      "--input", args.inputPath,
      "--slug", runSlug,
      "--top", String(Number.isFinite(args.createTop) && args.createTop > 0 ? args.createTop : 1),
    ];
    if (args.dryRun) {
      createArgs.push("--dry-run");
    }
    try {
      createOutput = runNodeScript(path.join(repoRoot, "scripts", "run-seo-page-create.mjs"), createArgs);
    } catch (err) {
      if (String(err.message).includes("No create_new_page tasks")) {
        createOutput = "applied_count=0";
      } else {
        throw err;
      }
    }
  }

  const refreshReport = parseOutputPath(refreshOutput, "latest_seo_refresh_report")
    ? await loadJson(parseOutputPath(refreshOutput, "latest_seo_refresh_report"))
    : null;
  const createReport = parseOutputPath(createOutput, "latest_seo_create_report")
    ? await loadJson(parseOutputPath(createOutput, "latest_seo_create_report"))
    : null;

  const refreshedSlugs = (refreshReport?.updated || []).map((t) => text(t.slug)).filter(Boolean);
  const createdSlugs = (createReport?.created || []).map((t) => text(t.slug)).filter(Boolean);
  const totalApplied = refreshedSlugs.length + createdSlugs.length;

  let gitResult = { skipped: true, reason: "nothing applied" };
  if (totalApplied > 0 && !args.skipGit) {
    gitResult = await gitCommitAndPush(refreshedSlugs, createdSlugs, args.dryRun);
  }

  const historyEntry = {
    run_date: decisionDate,
    started_at: startedAt,
    completed_at: new Date().toISOString(),
    refreshed_slugs: refreshedSlugs,
    created_slugs: createdSlugs,
    total_applied: totalApplied,
    commit_sha: gitResult.commit_sha || "",
    dry_run: args.dryRun,
  };

  history.push(historyEntry);
  if (history.length > 90) history.splice(0, history.length - 90);

  await mkdir(path.dirname(args.historyPath), { recursive: true });
  await writeJson(args.historyPath, { history });

  const report = {
    decision_date: decisionDate,
    status: "completed",
    started_at: startedAt,
    completed_at: new Date().toISOString(),
    input_path: args.inputPath,
    dry_run: args.dryRun,
    skip_refresh: args.skipRefresh,
    skip_create: args.skipCreate,
    skip_git: args.skipGit,
    refreshed_slugs: refreshedSlugs,
    created_slugs: createdSlugs,
    total_applied: totalApplied,
    refresh_report_path: parseOutputPath(refreshOutput, "latest_seo_refresh_report"),
    create_report_path: parseOutputPath(createOutput, "latest_seo_create_report"),
    git: gitResult,
  };

  const reportPath = path.join(outputDir, "seo_autopilot_report.json");
  const latestReportPath = path.join(latestDir, "seo_autopilot_report.latest.json");
  await writeJson(reportPath, report);
  await writeJson(latestReportPath, report);
  await writeJson(lockPath, { ...report, status: "completed" });

  logAutonomousDecision("seo autopilot cycle completed", {
    total_applied: totalApplied,
    refreshed_slugs: refreshedSlugs,
    created_slugs: createdSlugs,
    commit_sha: gitResult.commit_sha || "",
  });

  console.log(`output_dir=${outputDir}`);
  console.log(`seo_autopilot_report=${reportPath}`);
  console.log(`latest_seo_autopilot_report=${latestReportPath}`);
  console.log(`total_applied=${totalApplied}`);
  console.log(`refreshed_count=${refreshedSlugs.length}`);
  console.log(`created_count=${createdSlugs.length}`);
  console.log(`commit_sha=${gitResult.commit_sha || ""}`);
  console.log(`dry_run=${args.dryRun}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
