#!/usr/bin/env node

import path from "node:path";
import { access } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import {
  defaultYoutubeOauthTokenPath,
  downloadRemoteFile,
  getFileInfo,
  loadJson,
  normalizeYoutubeVideoResult,
  refreshYoutubeAccessToken,
  startYoutubeResumableUpload,
  uploadVideoBinaryToYoutube,
  writeJson,
} from "./runtime/youtube-direct-client.mjs";
import { postStorageRowWithDiagnostics } from "./runtime/storage-row-contract.mjs";
import {
  resolveDraftStorageApiUrl,
  resolveN8nApiKey,
} from "./runtime/selfhost-n8n-defaults.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");

function printHelp() {
  console.log(`Usage: node scripts/run-youtube-direct-upload.mjs [options]

Options:
  --package-dir <dir>      Render package directory with publish_ready_package.json
  --publish-ready <file>   Explicit publish_ready_package.json path
  --oauth-token <file>     OAuth token bundle path (default: ${defaultYoutubeOauthTokenPath()})
  --privacy-status <v>     YouTube privacy status (default: unlisted)
  --video-file <file>      Optional local MP4 override
  --video-url <url>        Optional remote MP4 override
  --table-url <url>        Optional draft storage API URL for writeback
  --n8n-api-key <key>      Optional storage API key for writeback
  --help                   Show this help
`);
}

function parseArgs(argv) {
  const args = {
    packageDir: "",
    publishReadyPath: "",
    oauthTokenPath: defaultYoutubeOauthTokenPath(),
    privacyStatus: "unlisted",
    videoFilePath: "",
    videoUrl: "",
    tableUrl: resolveDraftStorageApiUrl(process.env),
    n8nApiKey: resolveN8nApiKey(process.env),
  };

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === "--package-dir") args.packageDir = path.resolve(argv[++i]);
    else if (token === "--publish-ready") args.publishReadyPath = path.resolve(argv[++i]);
    else if (token === "--oauth-token") args.oauthTokenPath = path.resolve(argv[++i]);
    else if (token === "--privacy-status") args.privacyStatus = argv[++i];
    else if (token === "--video-file") args.videoFilePath = path.resolve(argv[++i]);
    else if (token === "--video-url") args.videoUrl = argv[++i];
    else if (token === "--table-url") args.tableUrl = argv[++i];
    else if (token === "--n8n-api-key") args.n8nApiKey = argv[++i];
    else if (token === "--help" || token === "-h") {
      printHelp();
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${token}`);
    }
  }

  if (!args.packageDir && !args.publishReadyPath) {
    throw new Error("Pass --package-dir or --publish-ready.");
  }

  if (!args.publishReadyPath) {
    args.publishReadyPath = path.join(args.packageDir, "publish_ready_package.json");
  } else if (!args.packageDir) {
    args.packageDir = path.dirname(args.publishReadyPath);
  }

  return args;
}

function text(value) {
  return value == null ? "" : String(value).trim();
}

async function fileExists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const publishReady = await loadJson(args.publishReadyPath);
  const oauthToken = await loadJson(args.oauthTokenPath);

  const clientId = text(oauthToken.client_id || process.env.YOUTUBE_OAUTH_CLIENT_ID);
  const refreshToken = text(oauthToken.refresh_token);
  if (!clientId || !refreshToken) {
    throw new Error("OAuth token bundle is missing client_id or refresh_token. Run run-youtube-oauth-bootstrap.mjs first.");
  }

  const refreshed = await refreshYoutubeAccessToken({
    clientId,
    refreshToken,
  });
  const accessToken = text(refreshed.access_token);
  if (!accessToken) {
    throw new Error("Google token refresh did not return access_token.");
  }

  let localVideoPath = text(args.videoFilePath);
  if (!localVideoPath) {
    const remoteVideoUrl = text(args.videoUrl || publishReady.final_mp4_url || publishReady.render_source_url);
    if (!remoteVideoUrl) {
      throw new Error("No final MP4 source found in publish_ready_package.");
    }
    localVideoPath = await downloadRemoteFile(remoteVideoUrl, `${text(publishReady.render_task_id) || "youtube"}-upload.mp4`);
  }

  const fileInfo = await getFileInfo(localVideoPath);
  const uploadUrl = await startYoutubeResumableUpload({
    accessToken,
    title: text(publishReady.title).slice(0, 100),
    description: text(publishReady.description),
    tags: Array.isArray(publishReady.hashtags)
      ? publishReady.hashtags.map((tag) => text(tag).replace(/^#/, "")).filter(Boolean)
      : [],
    privacyStatus: text(args.privacyStatus || publishReady.visibility || "unlisted"),
    fileSize: fileInfo.size,
    mimeType: fileInfo.mimeType,
  });

  const uploadPayload = await uploadVideoBinaryToYoutube({
    uploadUrl,
    accessToken,
    filePath: fileInfo.filePath,
    mimeType: fileInfo.mimeType,
  });
  const normalized = normalizeYoutubeVideoResult(uploadPayload);

  publishReady.youtube_video_id = normalized.videoId;
  publishReady.youtube_url = normalized.youtubeUrl;
  publishReady.published_status = normalized.videoId ? "youtube_uploaded" : "youtube_upload_failed_terminal";
  publishReady.published_at = new Date().toISOString();

  await writeJson(args.publishReadyPath, publishReady);
  await writeJson(path.join(args.packageDir, "youtube_direct_upload_result.json"), {
    oauth_token_path: args.oauthTokenPath,
    local_video_path: localVideoPath,
    privacy_status: args.privacyStatus,
    youtube_video_id: normalized.videoId,
    youtube_url: normalized.youtubeUrl,
    upload_response: normalized.raw,
  });

  const bridgeRowPath = path.join(args.packageDir, "g3_bridge_row.json");
  if (await fileExists(bridgeRowPath)) {
    const bridgeRow = await loadJson(bridgeRowPath);
    bridgeRow.published_status = publishReady.published_status;
    bridgeRow.published_at = publishReady.published_at;
    bridgeRow.youtube_video_id = normalized.videoId;
    bridgeRow.youtube_url = normalized.youtubeUrl;
    bridgeRow.feedback = [
      text(bridgeRow.feedback),
      `youtube_video_id=${normalized.videoId}`,
      `youtube_link=${normalized.youtubeUrl}`,
      `published_status=${publishReady.published_status}`,
    ]
      .filter(Boolean)
      .join(" ")
      .trim();
    await writeJson(bridgeRowPath, bridgeRow);

    if (text(args.n8nApiKey)) {
      await postStorageRowWithDiagnostics(bridgeRow, {
        endpoint: args.tableUrl,
        apiKey: args.n8nApiKey,
        diagnosticsDir: args.packageDir,
        rowFilePath: bridgeRowPath,
      });
    }
  }

  console.log(`PACKAGE_DIR=${args.packageDir}`);
  console.log(`YOUTUBE_VIDEO_ID=${normalized.videoId}`);
  console.log(`YOUTUBE_URL=${normalized.youtubeUrl}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
