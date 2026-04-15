#!/usr/bin/env node

import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");

function printHelp() {
  console.log(`Usage: node scripts/finalize-render-package.mjs --package-dir <dir> --final-mp4-url <url> [options]

Options:
  --package-dir <dir>      Render package directory with publish_ready_package.json and g3_bridge_row.json
  --final-mp4-url <url>    Source render URL or upstream Shotstack URL
  --final-mp4-file <file>  Local MP4 file to stage into public/shotstack-assets/.../current/
  --public-output-dir <d>  Public output directory for the staged MP4 (default: ${path.join(repoRoot, "public", "shotstack-assets", "adr-short-video", "current")})
  --public-base-url <url>  Public base URL for the staged MP4 (default: https://www.adr-bot.de)
  --public-mp4-name <n>    Public MP4 filename (default: final.mp4)
  --render-receipt <id>    Optional render receipt or render id
  --render-source-url <u>  Optional upstream Shotstack URL for traceability
  --help                   Show this help
`);
}

function parseArgs(argv) {
  const args = {
    packageDir: "",
    finalMp4Url: "",
    finalMp4File: "",
    renderSourceUrl: "",
    publicOutputDir: path.join(repoRoot, "public", "shotstack-assets", "adr-short-video", "current"),
    publicBaseUrl: "https://www.adr-bot.de",
    publicMp4Name: "final.mp4",
    renderReceipt: "",
  };

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === "--package-dir") args.packageDir = path.resolve(argv[++i]);
    else if (token === "--final-mp4-url") args.finalMp4Url = argv[++i];
    else if (token === "--final-mp4-file") args.finalMp4File = path.resolve(argv[++i]);
    else if (token === "--public-output-dir") args.publicOutputDir = path.resolve(argv[++i]);
    else if (token === "--public-base-url") args.publicBaseUrl = argv[++i];
    else if (token === "--public-mp4-name") args.publicMp4Name = argv[++i];
    else if (token === "--render-receipt") args.renderReceipt = argv[++i];
    else if (token === "--render-source-url") args.renderSourceUrl = argv[++i];
    else if (token === "--help" || token === "-h") {
      printHelp();
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${token}`);
    }
  }

  if (!args.packageDir) {
    throw new Error("Missing --package-dir <dir>.");
  }
  if (!args.finalMp4Url && !args.finalMp4File) {
    throw new Error("Missing --final-mp4-url <url> or --final-mp4-file <file>.");
  }

  return args;
}

async function loadJson(filePath) {
  return JSON.parse(await readFile(filePath, "utf8"));
}

function text(value) {
  return value == null ? "" : String(value).trim();
}

function upsertFeedback(feedback, key, value) {
  const cleanValue = text(value);
  const parts = text(feedback)
    .split(/\s+/)
    .filter(Boolean)
    .filter((part) => !part.startsWith(`${key}=`));
  if (cleanValue) {
    parts.push(`${key}=${cleanValue}`);
  }
  return parts.join(" ");
}

async function assertMp4File(filePath) {
  const data = await readFile(filePath);
  const brand = data.subarray(4, 8).toString("ascii");
  if (brand !== "ftyp") {
    throw new Error(`File does not look like an MP4 container: ${filePath}`);
  }
}

function publicUrlForPath(publicOutputDir, publicBaseUrl, publicFilePath) {
  const publicRoot = path.join(repoRoot, "public");
  const relative = path.relative(publicRoot, publicFilePath).split(path.sep).join("/");
  return `${publicBaseUrl.replace(/\/$/, "")}/${relative}`;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const publishReadyPath = path.join(args.packageDir, "publish_ready_package.json");
  const bridgeRowPath = path.join(args.packageDir, "g3_bridge_row.json");

  const publishReady = await loadJson(publishReadyPath);
  const bridgeRow = await loadJson(bridgeRowPath);

  let finalMp4Url = text(args.finalMp4Url);
  let renderSourceUrl = text(args.renderSourceUrl || args.finalMp4Url);
  let stagedMp4Path = "";

  if (text(args.finalMp4File)) {
    await assertMp4File(args.finalMp4File);
    await mkdir(args.publicOutputDir, { recursive: true });
    stagedMp4Path = path.join(args.publicOutputDir, args.publicMp4Name);
    await copyFile(args.finalMp4File, stagedMp4Path);
    finalMp4Url = publicUrlForPath(args.publicOutputDir, args.publicBaseUrl, stagedMp4Path);
  }

  publishReady.render_status = "rendered";
  publishReady.asset_package_type = "rendered";
  publishReady.asset_ready = true;
  publishReady.final_mp4_url = finalMp4Url;
  if (renderSourceUrl) {
    publishReady.render_source_url = renderSourceUrl;
  }
  if (stagedMp4Path) {
    publishReady.public_mp4_path = stagedMp4Path;
    publishReady.public_mp4_url = finalMp4Url;
  }
  if (text(args.renderReceipt)) {
    publishReady.render_receipt = args.renderReceipt;
  }

  bridgeRow.final_mp4_url = finalMp4Url;
  bridgeRow.asset_package_type = "rendered";
  bridgeRow.asset_ready = true;
  if (renderSourceUrl) {
    bridgeRow.render_source_url = renderSourceUrl;
  }
  if (stagedMp4Path) {
    bridgeRow.public_mp4_path = stagedMp4Path;
    bridgeRow.public_mp4_url = finalMp4Url;
  }
  bridgeRow.feedback = upsertFeedback(bridgeRow.feedback, "render_status", "rendered");
  bridgeRow.feedback = upsertFeedback(bridgeRow.feedback, "final_mp4_url", finalMp4Url);
  if (renderSourceUrl) {
    bridgeRow.feedback = upsertFeedback(bridgeRow.feedback, "render_source_url", renderSourceUrl);
  }
  if (text(args.renderReceipt)) {
    bridgeRow.feedback = upsertFeedback(bridgeRow.feedback, "render_receipt", args.renderReceipt);
  }

  await writeFile(publishReadyPath, `${JSON.stringify(publishReady, null, 2)}\n`, "utf8");
  await writeFile(bridgeRowPath, `${JSON.stringify(bridgeRow, null, 2)}\n`, "utf8");

  console.log(`publish_ready=${publishReadyPath}`);
  console.log(`g3_bridge_row=${bridgeRowPath}`);
  console.log(`render_status=rendered`);
  console.log(`final_mp4_url=${finalMp4Url}`);
  if (renderSourceUrl) {
    console.log(`render_source_url=${renderSourceUrl}`);
  }
  if (stagedMp4Path) {
    console.log(`public_mp4_path=${stagedMp4Path}`);
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
