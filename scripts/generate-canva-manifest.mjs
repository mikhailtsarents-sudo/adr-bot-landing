#!/usr/bin/env node

import { mkdir, copyFile, readdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");

const DEFAULT_PROJECT = "adr-short-video";
const DEFAULT_BASE_URL = "https://www.adr-bot.de";
const DEFAULT_INPUT_DIR = path.join(repoRoot, "canva-exports", DEFAULT_PROJECT);
const DEFAULT_PUBLIC_DIR = path.join(
  repoRoot,
  "public",
  "shotstack-assets",
  DEFAULT_PROJECT,
  "current",
);

const SLIDE_ROLES = ["hook", "question", "answers", "timer", "answer", "cta"];
const PNG_SIGNATURE = "89504e470d0a1a0a";

function parseArgs(argv) {
  const args = {
    project: DEFAULT_PROJECT,
    baseUrl: process.env.PUBLIC_BASE_URL || DEFAULT_BASE_URL,
    inputDir: DEFAULT_INPUT_DIR,
    outputDir: DEFAULT_PUBLIC_DIR,
    verifyRemote: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === "--project") args.project = argv[++i];
    else if (token === "--base-url") args.baseUrl = argv[++i];
    else if (token === "--input") args.inputDir = path.resolve(argv[++i]);
    else if (token === "--output") args.outputDir = path.resolve(argv[++i]);
    else if (token === "--verify-remote") args.verifyRemote = true;
    else if (token === "--help" || token === "-h") {
      printHelp();
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${token}`);
    }
  }

  return args;
}

function printHelp() {
  console.log(`Usage: npm run generate:canva-manifest -- [options]

Options:
  --input <dir>        Source folder with 6 exported PNG slides
  --output <dir>       Public output folder for normalized slide PNGs
  --project <name>     Project name for manifest (default: ${DEFAULT_PROJECT})
  --base-url <url>     Public base URL for direct PNG links (default: ${DEFAULT_BASE_URL})
  --verify-remote      Verify generated URLs with HTTP 200 and PNG content-type
  --help               Show this help
`);
}

function sortNaturally(values) {
  const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: "base" });
  return [...values].sort((a, b) => collator.compare(a, b));
}

async function listPngFiles(inputDir) {
  const entries = await readdir(inputDir, { withFileTypes: true });
  const pngFiles = entries
    .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith(".png"))
    .map((entry) => entry.name);

  if (pngFiles.length !== 6) {
    throw new Error(
      `Expected exactly 6 PNG files in ${inputDir}, found ${pngFiles.length}.`,
    );
  }

  return sortNaturally(pngFiles);
}

async function assertPng(filePath) {
  const file = await readFile(filePath);
  const signature = file.subarray(0, 8).toString("hex");
  if (signature !== PNG_SIGNATURE) {
    throw new Error(`File is not a valid PNG: ${filePath}`);
  }
}

async function verifyRemoteUrl(url) {
  const response = await fetch(url, {
    method: "GET",
    headers: { Range: "bytes=0-32" },
  });

  if (!response.ok) {
    throw new Error(`Remote verification failed for ${url}: HTTP ${response.status}`);
  }

  const contentType = response.headers.get("content-type") || "";
  if (!contentType.toLowerCase().includes("image/png")) {
    throw new Error(`Remote verification failed for ${url}: content-type ${contentType}`);
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const inputFiles = await listPngFiles(args.inputDir);

  await mkdir(args.outputDir, { recursive: true });

  const slides = [];

  for (let i = 0; i < inputFiles.length; i += 1) {
    const sourceName = inputFiles[i];
    const sourcePath = path.join(args.inputDir, sourceName);
    const targetName = `slide${i + 1}.png`;
    const targetPath = path.join(args.outputDir, targetName);
    const publicUrl = `${args.baseUrl.replace(/\/$/, "")}/${path
      .relative(path.join(repoRoot, "public"), targetPath)
      .split(path.sep)
      .join("/")}`;

    await stat(sourcePath);
    await assertPng(sourcePath);
    await copyFile(sourcePath, targetPath);

    slides.push({
      id: i + 1,
      name: `slide${i + 1}`,
      role: SLIDE_ROLES[i],
      url: publicUrl,
    });
  }

  const manifest = {
    project: args.project,
    format: "9:16",
    slides_count: slides.length,
    updated_at: new Date().toISOString(),
    slides,
  };

  const manifestJson = `${JSON.stringify(manifest, null, 2)}\n`;
  const localManifestPath = path.join(repoRoot, "canva_manifest.json");
  const publicManifestPath = path.join(args.outputDir, "canva_manifest.json");

  await writeFile(localManifestPath, manifestJson, "utf8");
  await writeFile(publicManifestPath, manifestJson, "utf8");

  if (args.verifyRemote) {
    for (const slide of slides) {
      await verifyRemoteUrl(slide.url);
    }
  }

  for (const slide of slides) {
    console.log(`${slide.name}=${slide.url}`);
  }

  console.log(`manifest=${localManifestPath}`);
  console.log(`public_manifest=${publicManifestPath}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
