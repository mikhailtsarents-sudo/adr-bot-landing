#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { enableStrictNonInteractiveMode, logAutonomousDecision } from "./runtime/non-interactive-mode.mjs";
import { bootstrapLocalRuntimeEnv } from "./runtime/local-runtime-env.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");

enableStrictNonInteractiveMode("run-post-render-pipeline");

function printHelp() {
  console.log(`Usage: node scripts/run-post-render-pipeline.mjs --packages-root <dir> [options]

Chains Shotstack render → finalize → YouTube publish for all packages in a directory.

Options:
  --packages-root <dir>      Directory containing render package subdirectories
  --shotstack-api-key <key>  Shotstack API key (or SHOTSTACK_API_KEY)
  --shotstack-api-base <url> Shotstack API base URL
  --n8n-api-key <key>        n8n API key (or N8N_API_KEY)
  --n8n-table-url <url>      n8n data table URL
  --n8n-webhook-url <url>    YouTube bridge webhook URL
  --skip-youtube             Stop after finalize, skip YouTube publish
  --help                     Show this help
`);
}

function parseArgs(argv) {
  const args = {
    packagesRoot: "",
    shotstackApiKey: process.env.SHOTSTACK_API_KEY || "",
    shotstackApiBase: "",
    n8nApiKey: process.env.ADR_INGEST_API_KEY || process.env.N8N_API_KEY || "",
    n8nTableUrl: "",
    n8nWebhookUrl: "",
    skipYoutube: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === "--packages-root") args.packagesRoot = path.resolve(argv[++i]);
    else if (token === "--shotstack-api-key") args.shotstackApiKey = argv[++i];
    else if (token === "--shotstack-api-base") args.shotstackApiBase = argv[++i];
    else if (token === "--n8n-api-key") args.n8nApiKey = argv[++i];
    else if (token === "--n8n-table-url") args.n8nTableUrl = argv[++i];
    else if (token === "--n8n-webhook-url") args.n8nWebhookUrl = argv[++i];
    else if (token === "--skip-youtube") args.skipYoutube = true;
    else if (token === "--help" || token === "-h") {
      printHelp();
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${token}`);
    }
  }

  if (!args.packagesRoot) throw new Error("Missing --packages-root <dir>.");
  if (!args.shotstackApiKey) throw new Error("Shotstack API key required. Pass --shotstack-api-key or set SHOTSTACK_API_KEY.");
  if (!args.skipYoutube && !args.n8nApiKey) throw new Error("n8n API key required for YouTube publish. Pass --n8n-api-key, set ADR_INGEST_API_KEY, or use --skip-youtube.");

  return args;
}

function parseOutputPath(stdout, key) {
  const line = stdout
    .split("\n")
    .map((entry) => entry.trim())
    .find((entry) => entry.startsWith(`${key}=`));
  return line ? line.slice(key.length + 1) : "";
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

async function main() {
  await bootstrapLocalRuntimeEnv(repoRoot);
  const args = parseArgs(process.argv.slice(2));

  logAutonomousDecision("starting post-render pipeline", { packages_root: args.packagesRoot });

  // Step 1: Shotstack batch render
  const shotstackArgs = ["--packages-root", args.packagesRoot];
  if (args.shotstackApiKey) shotstackArgs.push("--api-key", args.shotstackApiKey);
  if (args.shotstackApiBase) shotstackArgs.push("--api-base", args.shotstackApiBase);

  const shotstackOutput = runNodeScript(
    path.join(repoRoot, "scripts", "run-question-batch-shotstack.mjs"),
    shotstackArgs,
  );
  console.log(shotstackOutput);

  const summaryPath = parseOutputPath(shotstackOutput, "summary");
  if (!summaryPath) throw new Error("Shotstack output did not include summary= path.");

  const summary = JSON.parse(await readFile(summaryPath, "utf8"));
  const done = (summary.results || []).filter((r) => r.status === "done");

  if (done.length === 0) {
    throw new Error(
      `No successful renders in ${summaryPath}. Failed: ${summary.failed_count || 0}.`,
    );
  }

  const youtubeUrls = [];

  for (const result of done) {
    const packageDir = result.package_dir;
    const renderUrl = result.render_url;

    if (!packageDir) throw new Error("Shotstack summary result is missing package_dir.");
    if (!renderUrl) throw new Error(`Missing render_url for package ${packageDir}.`);

    // Step 2: Finalize render package
    logAutonomousDecision("finalizing render package", { package_dir: packageDir, render_url: renderUrl });
    const finalizeArgs = [
      "--package-dir", packageDir,
      "--final-mp4-url", renderUrl,
    ];
    const finalizeOutput = runNodeScript(
      path.join(repoRoot, "scripts", "finalize-render-package.mjs"),
      finalizeArgs,
    );
    console.log(finalizeOutput);

    if (args.skipYoutube) {
      console.log(`skip_youtube=true`);
      continue;
    }

    // Step 3: YouTube publish
    logAutonomousDecision("publishing to youtube", { package_dir: packageDir });
    const youtubeArgs = ["--package-dir", packageDir];
    if (args.n8nApiKey) youtubeArgs.push("--n8n-api-key", args.n8nApiKey);
    if (args.n8nTableUrl) youtubeArgs.push("--table-url", args.n8nTableUrl);
    if (args.n8nWebhookUrl) youtubeArgs.push("--webhook-url", args.n8nWebhookUrl);

    const youtubeOutput = runNodeScript(
      path.join(repoRoot, "scripts", "run-package-youtube-publish.mjs"),
      youtubeArgs,
    );
    console.log(youtubeOutput);

    const youtubeUrl = parseOutputPath(youtubeOutput, "YOUTUBE_URL");
    if (youtubeUrl) youtubeUrls.push(youtubeUrl);
  }

  console.log(`post_render_pipeline=done`);
  console.log(`packages_processed=${done.length}`);
  if (youtubeUrls.length > 0) {
    console.log(`youtube_urls=${youtubeUrls.join(",")}`);
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
