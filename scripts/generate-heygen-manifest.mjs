#!/usr/bin/env node

import { mkdir, copyFile, readdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");

const DEFAULT_PROJECT = "adr-heygen-video";
const DEFAULT_BASE_URL = "https://www.adr-bot.de";
const DEFAULT_INPUT_DIR = path.join(repoRoot, "heygen-exports", DEFAULT_PROJECT);
const DEFAULT_OUTPUT_DIR = path.join(
  repoRoot,
  "public",
  "heygen-assets",
  DEFAULT_PROJECT,
  "current",
);

function printHelp() {
  console.log(`Usage: npm run generate:heygen-manifest -- [options]

Options:
  --input <dir>        Source folder with exported MP4 files
  --output <dir>       Public output folder for normalized MP4 files
  --project <name>     Project name for manifest (default: ${DEFAULT_PROJECT})
  --base-url <url>     Public base URL for direct video links (default: ${DEFAULT_BASE_URL})
  --downloads-dir <dir>  Scan directory for latest exported videos
  --latest <n>         Take newest N video files from downloads-dir or input folder
  --heygen-api-key <key>  Fetch latest completed videos directly from HeyGen API
  --verify-remote      Verify generated URLs with HTTP 200 and video content-type
  --help               Show this help
`);
}

function parseArgs(argv) {
  const args = {
    project: DEFAULT_PROJECT,
    baseUrl: process.env.PUBLIC_BASE_URL || DEFAULT_BASE_URL,
    inputDir: DEFAULT_INPUT_DIR,
    outputDir: DEFAULT_OUTPUT_DIR,
    downloadsDir: null,
    latest: null,
    heygenApiKey: process.env.HEYGEN_API_KEY || null,
    verifyRemote: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === "--project") args.project = argv[++i];
    else if (token === "--base-url") args.baseUrl = argv[++i];
    else if (token === "--input") args.inputDir = path.resolve(argv[++i]);
    else if (token === "--output") args.outputDir = path.resolve(argv[++i]);
    else if (token === "--downloads-dir") args.downloadsDir = path.resolve(argv[++i]);
    else if (token === "--latest") args.latest = Number.parseInt(argv[++i], 10);
    else if (token === "--heygen-api-key") args.heygenApiKey = argv[++i];
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

function sortNaturally(values) {
  const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: "base" });
  return [...values].sort((a, b) => collator.compare(a, b));
}

async function listVideoFiles(inputDir) {
  const entries = await readdir(inputDir, { withFileTypes: true });
  const files = entries
    .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith(".mp4"))
    .map((entry) => entry.name);

  if (files.length === 0) {
    throw new Error(`Expected at least 1 MP4 file in ${inputDir}, found 0.`);
  }

  const withMeta = await Promise.all(
    sortNaturally(files).map(async (name) => {
      const fullPath = path.join(inputDir, name);
      const info = await stat(fullPath);
      return {
        name,
        path: fullPath,
        mtimeMs: info.mtimeMs,
      };
    }),
  );

  return withMeta.sort((a, b) => {
    if (b.mtimeMs !== a.mtimeMs) return b.mtimeMs - a.mtimeMs;
    return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: "base" });
  });
}

async function listLatestVideoFiles(downloadsDir) {
  const entries = await readdir(downloadsDir, { withFileTypes: true });
  const files = entries
    .filter(
      (entry) =>
        entry.isFile() &&
        (entry.name.toLowerCase().endsWith(".mp4") || entry.name.toLowerCase().endsWith(".mov")),
    )
    .map((entry) => entry.name);

  if (files.length === 0) {
    throw new Error(`Expected at least 1 video file in ${downloadsDir}, found 0.`);
  }

  const withMeta = await Promise.all(
    sortNaturally(files).map(async (name) => {
      const fullPath = path.join(downloadsDir, name);
      const info = await stat(fullPath);
      return {
        name,
        path: fullPath,
        mtimeMs: info.mtimeMs,
      };
    }),
  );

  return withMeta.sort((a, b) => {
    if (b.mtimeMs !== a.mtimeMs) return b.mtimeMs - a.mtimeMs;
    return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: "base" });
  });
}

async function fetchHeyGenJson(url, apiKey, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      "X-API-KEY": apiKey,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    throw new Error(`HeyGen API request failed: ${response.status} ${response.statusText}`);
  }

  const payload = await response.json();
  if (payload.code !== 100) {
    throw new Error(`HeyGen API returned error code ${payload.code}`);
  }

  return payload.data;
}

async function listLatestHeyGenVideos(apiKey, latest) {
  const data = await fetchHeyGenJson("https://api.heygen.com/v1/video.list?limit=20", apiKey);
  const completed = (data.videos || [])
    .filter((video) => video.status === "completed")
    .sort((a, b) => b.created_at - a.created_at);

  if (completed.length === 0) {
    throw new Error("HeyGen API returned 0 completed videos.");
  }

  const selected = completed.slice(0, latest && latest > 0 ? latest : completed.length);
  const withUrls = [];

  for (const video of selected) {
    const shareUrl = await fetchHeyGenJson("https://api.heygen.com/v1/video/share", apiKey, {
      method: "POST",
      body: JSON.stringify({ video_id: video.video_id }),
    });
    const status = await fetchHeyGenJson(
      `https://api.heygen.com/v1/video_status.get?video_id=${video.video_id}`,
      apiKey,
    );

    withUrls.push({
      name: video.video_title || video.video_id,
      path: null,
      mtimeMs: video.created_at * 1000,
      videoId: video.video_id,
      shareUrl,
      directUrl: status.video_url || null,
      thumbnailUrl: status.thumbnail_url || null,
    });
  }

  return withUrls;
}

async function assertMp4(filePath) {
  const data = await readFile(filePath);
  const brand = data.subarray(4, 8).toString("ascii");
  if (brand !== "ftyp") {
    throw new Error(`File does not look like an MP4 container: ${filePath}`);
  }
}

async function verifyRemoteUrl(url) {
  const response = await fetch(url, {
    method: "GET",
    headers: { Range: "bytes=0-64" },
  });

  if (!response.ok) {
    throw new Error(`Remote verification failed for ${url}: HTTP ${response.status}`);
  }

  const contentType = response.headers.get("content-type") || "";
  const okay =
    contentType.toLowerCase().includes("video/mp4") ||
    contentType.toLowerCase().includes("application/octet-stream");

  if (!okay) {
    throw new Error(`Remote verification failed for ${url}: content-type ${contentType}`);
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  let inputFiles = args.heygenApiKey
    ? await listLatestHeyGenVideos(args.heygenApiKey, args.latest)
    : args.downloadsDir
      ? await listLatestVideoFiles(args.downloadsDir)
      : await listVideoFiles(args.inputDir);

  if (args.latest && Number.isFinite(args.latest) && args.latest > 0) {
    inputFiles = inputFiles.slice(0, args.latest);
  }

  await mkdir(args.outputDir, { recursive: true });

  const videos = [];

  for (let i = 0; i < inputFiles.length; i += 1) {
    const sourceName = inputFiles[i].name;
    const targetName = `video${i + 1}.mp4`;
    const targetPath = path.join(args.outputDir, targetName);
    const publicUrl = `${args.baseUrl.replace(/\/$/, "")}/${path
      .relative(path.join(repoRoot, "public"), targetPath)
      .split(path.sep)
      .join("/")}`;
    const sourcePath = inputFiles[i].path;

    if (sourcePath) {
      await stat(sourcePath);
      await assertMp4(sourcePath);
      await copyFile(sourcePath, targetPath);
    }

    videos.push({
      id: i + 1,
      name: `video${i + 1}`,
      latest_rank: i + 1,
      original_file: sourceName,
      source_updated_at: new Date(inputFiles[i].mtimeMs).toISOString(),
      url: inputFiles[i].directUrl || publicUrl,
      share_url: inputFiles[i].shareUrl || null,
      hosted_url: sourcePath ? publicUrl : null,
      video_id: inputFiles[i].videoId || null,
      thumbnail_url: inputFiles[i].thumbnailUrl || null,
    });
  }

  const manifest = {
    project: args.project,
    format: "9:16",
    videos_count: videos.length,
    updated_at: new Date().toISOString(),
    videos,
  };

  const manifestJson = `${JSON.stringify(manifest, null, 2)}\n`;
  const localManifestPath = path.join(repoRoot, "heygen_manifest.json");
  const publicManifestPath = path.join(args.outputDir, "heygen_manifest.json");
  const latestUrlsPath = path.join(repoRoot, "heygen_latest_urls.txt");
  const latestUrlsText = `${videos.map((video) => `${video.name}=${video.url}`).join("\n")}\n`;

  await writeFile(localManifestPath, manifestJson, "utf8");
  await writeFile(publicManifestPath, manifestJson, "utf8");
  await writeFile(latestUrlsPath, latestUrlsText, "utf8");

  if (args.verifyRemote) {
    for (const video of videos) {
      await verifyRemoteUrl(video.url);
    }
  }

  for (const video of videos) {
    console.log(`${video.name}=${video.url}`);
  }

  console.log(`manifest=${localManifestPath}`);
  console.log(`public_manifest=${publicManifestPath}`);
  console.log(`latest_urls=${latestUrlsPath}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
