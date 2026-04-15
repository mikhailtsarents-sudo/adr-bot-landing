#!/usr/bin/env node

import { mkdir, copyFile, readdir, readFile, stat, writeFile } from "node:fs/promises";
import crypto from "node:crypto";
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

function sha256(buffer) {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

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

async function verifyRemoteUrl(url, expectedBuffer) {
  const response = await fetch(url, {
    method: "GET",
    headers: { Range: "bytes=0-1048575" },
  });

  if (!response.ok) {
    throw new Error(`Remote verification failed for ${url}: HTTP ${response.status}`);
  }

  const contentType = response.headers.get("content-type") || "";
  if (!contentType.toLowerCase().includes("image/png")) {
    throw new Error(`Remote verification failed for ${url}: content-type ${contentType}`);
  }

  const remoteBuffer = Buffer.from(await response.arrayBuffer());
  if (expectedBuffer && !remoteBuffer.equals(expectedBuffer)) {
    throw new Error(`Remote verification failed for ${url}: bytes do not match local copy`);
  }

  return {
    status: response.status,
    contentType,
    sha256: sha256(remoteBuffer),
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const inputFiles = await listPngFiles(args.inputDir);

  await mkdir(args.outputDir, { recursive: true });

  const slides = [];
  const normalizedFiles = [];

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

    const targetBuffer = await readFile(targetPath);
    normalizedFiles.push(targetBuffer);

    slides.push({
      id: i + 1,
      name: `slide${i + 1}`,
      role: SLIDE_ROLES[i],
      url: publicUrl,
      sha256: sha256(targetBuffer),
    });
  }

  const batchFingerprint = sha256(
    Buffer.from(
      JSON.stringify(
        {
          project: args.project,
          slides: slides.map((slide) => ({
            id: slide.id,
            name: slide.name,
            role: slide.role,
            url: slide.url,
            sha256: slide.sha256,
          })),
        },
        null,
        0,
      ),
    ),
  );

  const verification = {
    mode: "stable-storage",
    local_export_verified: true,
    public_copy_verified: true,
    remote_http_200_verified: false,
    remote_content_type_verified: false,
    remote_hash_match_verified: false,
    live_urls_match_new_batch: false,
    ready_for_shotstack: false,
    sync_state: "not_ready",
  };

  const manifest = {
    project: args.project,
    format: "9:16",
    slides_count: slides.length,
    updated_at: new Date().toISOString(),
    batch_fingerprint: batchFingerprint,
    slides,
    verification,
  };

  const localManifestPath = path.join(repoRoot, "canva_manifest.json");
  const publicManifestPath = path.join(args.outputDir, "canva_manifest.json");

  if (args.verifyRemote) {
    for (let i = 0; i < slides.length; i += 1) {
      const slide = slides[i];
      const localCopy = normalizedFiles[i];
      await verifyRemoteUrl(slide.url, localCopy);
    }

    verification.remote_http_200_verified = true;
    verification.remote_content_type_verified = true;
    verification.remote_hash_match_verified = true;
    verification.live_urls_match_new_batch = true;
    verification.ready_for_shotstack = true;
    verification.sync_state = "ready";
  }

  const finalManifest = {
    ...manifest,
    verification,
  };
  const manifestJson = `${JSON.stringify(finalManifest, null, 2)}\n`;

  await writeFile(localManifestPath, manifestJson, "utf8");
  await writeFile(publicManifestPath, manifestJson, "utf8");

  for (const slide of slides) {
    console.log(`${slide.name}=${slide.url}`);
  }

  console.log(`manifest=${localManifestPath}`);
  console.log(`public_manifest=${publicManifestPath}`);
  console.log(`batch_fingerprint=${batchFingerprint}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
