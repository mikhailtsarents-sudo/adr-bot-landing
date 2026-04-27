#!/usr/bin/env node
// TikTok publish adapter — reads an existing publish_ready_package.json
// and uploads the final MP4 to TikTok via Content Posting API.
// Does NOT regenerate content or re-render video.
//
// Modes:
//   INBOX_UPLOAD    — sends to creator's TikTok inbox (no audit needed)
//   DIRECT_PRIVATE  — direct post, visibility SELF_ONLY (requires video.publish scope)
//   DIRECT_PUBLIC   — direct post, PUBLIC_TO_EVERYONE (requires TIKTOK_PUBLIC_DIRECT_ENABLED=true)

import { access, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { bootstrapPhotorealRuntimeEnv } from "./runtime/photoreal-runtime-env.mjs";
import {
  buildTikTokCaption,
  defaultTikTokOauthTokenPath,
  fetchPublishStatus,
  getFileInfo,
  getValidAccessToken,
  initDirectPost,
  initInboxUpload,
  loadJson,
  loadTikTokToken,
  pollPublishStatus,
  queryCreatorInfo,
  queryUserInfo,
  uploadFileToTikTok,
  validateCaptionLength,
  writeJson,
} from "./runtime/tiktok-content-posting-client.mjs";
import { buildTikTokStartToken } from "./runtime/telegram-source-links.mjs";
import { postStorageRowWithDiagnostics } from "./runtime/storage-row-contract.mjs";
import {
  resolveDraftStorageApiUrl,
  resolveN8nApiKey,
} from "./runtime/selfhost-n8n-defaults.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const VALID_MODES = ["INBOX_UPLOAD", "DIRECT_PRIVATE", "DIRECT_PUBLIC"];

function printHelp() {
  console.log(`Usage: node scripts/run-package-tiktok-publish.mjs [options]

Options:
  --package-dir <dir>      Render package directory with publish_ready_package.json
  --publish-ready <file>   Explicit publish_ready_package.json path
  --oauth-token <file>     TikTok OAuth token path (default: TIKTOK_OAUTH_TOKEN_PATH env)
  --mode <mode>            Publish mode: INBOX_UPLOAD | DIRECT_PRIVATE | DIRECT_PUBLIC
                           (default: TIKTOK_PUBLISH_MODE env or INBOX_UPLOAD)
  --caption <text>         Override TikTok caption (auto-generated if omitted)
  --video-file <file>      Optional local MP4 override
  --table-url <url>        Optional draft storage API URL for writeback
  --n8n-api-key <key>      Optional storage API key for writeback
  --help                   Show this help
`);
}

function text(value) {
  return value == null ? "" : String(value).trim();
}

function parseArgs(argv) {
  const args = {
    packageDir: "",
    publishReadyPath: "",
    oauthTokenPath: text(process.env.TIKTOK_OAUTH_TOKEN_PATH),
    mode: text(process.env.TIKTOK_PUBLISH_MODE) || "INBOX_UPLOAD",
    caption: "",
    videoFilePath: "",
    tableUrl: resolveDraftStorageApiUrl(process.env),
    n8nApiKey: resolveN8nApiKey(process.env),
  };
  for (let i = 0; i < argv.length; i += 1) {
    const t = argv[i];
    if (t === "--package-dir") args.packageDir = path.resolve(argv[++i]);
    else if (t === "--publish-ready") {
      args.publishReadyPath = path.resolve(argv[++i]);
      args.packageDir = path.dirname(args.publishReadyPath);
    } else if (t === "--oauth-token") args.oauthTokenPath = path.resolve(argv[++i]);
    else if (t === "--mode") args.mode = argv[++i];
    else if (t === "--caption") args.caption = argv[++i];
    else if (t === "--video-file") args.videoFilePath = path.resolve(argv[++i]);
    else if (t === "--table-url") args.tableUrl = argv[++i];
    else if (t === "--n8n-api-key") args.n8nApiKey = argv[++i];
    else if (t === "--help" || t === "-h") { printHelp(); process.exit(0); }
    else throw new Error(`Unknown argument: ${t}`);
  }
  if (!args.packageDir && args.publishReadyPath) {
    args.packageDir = path.dirname(args.publishReadyPath);
  }
  if (!args.packageDir) throw new Error("Missing --package-dir or --publish-ready.");
  if (!args.publishReadyPath) {
    args.publishReadyPath = path.join(args.packageDir, "publish_ready_package.json");
  }
  const modeUpper = args.mode.toUpperCase();
  if (!VALID_MODES.includes(modeUpper)) {
    throw new Error(`Unknown mode: ${args.mode}. Valid: ${VALID_MODES.join(", ")}`);
  }
  args.mode = modeUpper;
  return args;
}

async function fileExists(filePath) {
  try { await access(filePath); return true; } catch { return false; }
}

async function downloadMp4(url, taskId) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`MP4 download failed: HTTP ${response.status} ${url}`);
  const buffer = Buffer.from(await response.arrayBuffer());
  const dest = path.join(path.dirname(new URL(import.meta.url).pathname), "..", "tmp", `tiktok-${text(taskId) || Date.now()}.mp4`);
  try { await import("node:fs/promises").then(m => m.mkdir(path.dirname(dest), { recursive: true })); } catch {}
  await writeFile(dest, buffer);
  return dest;
}

async function writePlatformPublishLog(pg, entry) {
  try {
    await pg.query(
      `INSERT INTO platform_publish_log
        (content_id, content_family, platform, publish_mode, status,
         publish_id, platform_post_id, platform_url,
         error_code, error_message, package_dir, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,now(),now())`,
      [
        text(entry.content_id),
        text(entry.content_family),
        "TIKTOK",
        text(entry.publish_mode),
        text(entry.status),
        text(entry.publish_id),
        text(entry.platform_post_id),
        text(entry.platform_url),
        text(entry.error_code),
        text(entry.error_message),
        text(entry.package_dir),
      ],
    );
  } catch (e) {
    console.warn(`[tiktok-publish] platform_publish_log write skipped: ${e.message}`);
  }
}

async function openPg() {
  try {
    const { default: pg } = await import("pg");
    const client = new pg.Client({ connectionString: process.env.N8N_DB_URL || process.env.DATABASE_URL });
    await client.connect();
    return client;
  } catch {
    return null;
  }
}

async function main() {
  await bootstrapPhotorealRuntimeEnv(path.resolve(__dirname, ".."));
  const args = parseArgs(process.argv.slice(2));
  const publishReady = await loadJson(args.publishReadyPath);
  const contentId = text(publishReady.content_id || publishReady.render_task_id);
  const contentFamily = text(publishReady.content_family || "QUESTION").toUpperCase();

  console.log(`[tiktok-publish] package=${args.packageDir}`);
  console.log(`[tiktok-publish] mode=${args.mode} content_id=${contentId} family=${contentFamily}`);

  // 1. Obtain valid access token (auto-refresh if expired)
  const tokenPath = args.oauthTokenPath || undefined;
  const accessToken = await getValidAccessToken({
    tokenPath,
    clientKey: text(process.env.TIKTOK_CLIENT_KEY),
    clientSecret: text(process.env.TIKTOK_CLIENT_SECRET),
  });

  // Log token metadata for account verification
  const tokenBundle = await loadTikTokToken({ tokenPath }).catch(() => ({}));
  console.log(`[tiktok-publish] ── DIAGNOSTIC INFO ──`);
  console.log(`[tiktok-publish] scopes_in_token=${text(tokenBundle.scope)}`);
  console.log(`[tiktok-publish] token_created_at=${text(tokenBundle.created_at)}`);
  console.log(`[tiktok-publish] open_id_in_token=${text(tokenBundle.open_id) || "(not stored)"}`);

  // 2a. Fetch user info to confirm which account this token belongs to
  let userInfo = {};
  try {
    userInfo = await queryUserInfo({ accessToken });
    console.log(`[tiktok-publish] account_open_id=${text(userInfo.open_id)}`);
    console.log(`[tiktok-publish] account_display_name=${text(userInfo.display_name)}`);
    // Persist open_id into the token file for future reference
    if (userInfo.open_id && !tokenBundle.open_id) {
      const resolvedTokenPath = tokenPath || defaultTikTokOauthTokenPath();
      await writeJson(resolvedTokenPath, { ...tokenBundle, open_id: text(userInfo.open_id), display_name: text(userInfo.display_name) });
    }
  } catch (e) {
    console.warn(`[tiktok-publish] user/info skipped: ${e.message}`);
  }

  // 2b. Query creator info — optional, requires video.publish scope
  let creatorInfo = {};
  try {
    creatorInfo = await queryCreatorInfo({ accessToken });
    console.log(`[tiktok-publish] creator_username=${text(creatorInfo.creator_username)} max_duration=${creatorInfo.max_video_post_duration_sec}s`);
  } catch (e) {
    console.warn(`[tiktok-publish] creator_info skipped (likely needs video.publish scope): ${e.message}`);
  }

  // 3. Resolve local video file
  let localVideoPath = text(args.videoFilePath);
  if (!localVideoPath) {
    const remoteUrl = text(publishReady.final_mp4_url || publishReady.render_source_url);
    const localPath = text(publishReady.final_mp4_path);
    if (localPath && await fileExists(localPath)) {
      localVideoPath = localPath;
    } else if (remoteUrl) {
      console.log(`[tiktok-publish] Downloading MP4 from ${remoteUrl}`);
      localVideoPath = await downloadMp4(remoteUrl, contentId);
    } else {
      throw new Error("No final MP4 found in publish_ready_package (no final_mp4_url or final_mp4_path).");
    }
  }
  const fileInfo = await getFileInfo(localVideoPath);
  console.log(`[tiktok-publish] video_size=${fileInfo.size} bytes`);

  // 4. Validate duration against creator's max (only available for direct post)
  if (args.mode !== "INBOX_UPLOAD" && creatorInfo.max_video_post_duration_sec) {
    // Duration check requires ffprobe; skip silently if not available
    console.log(`[tiktok-publish] max_video_duration_sec=${creatorInfo.max_video_post_duration_sec} (duration check skipped — ensure video is under this limit)`);
  }

  // 5. Build TikTok caption
  const caption = text(args.caption) ||
    buildTikTokCaption({
      title: text(publishReady.title || publishReady.question_text || contentId),
      contentFamily,
    });
  validateCaptionLength(caption);
  console.log(`[tiktok-publish] caption_length=${[...caption].length} chars`);

  // 6. Build deeplink token for attribution
  const deepLinkToken = buildTikTokStartToken({ contentId, contentFamily });
  console.log(`[tiktok-publish] deeplink_token=${deepLinkToken}`);

  const pg = await openPg();
  const logBase = { content_id: contentId, content_family: contentFamily, publish_mode: args.mode, package_dir: args.packageDir };

  let publishId = "";
  let uploadUrl = "";

  try {
    // 7. Init upload
    if (args.mode === "INBOX_UPLOAD") {
      const endpoint = "/v2/post/publish/inbox/video/init/";
      console.log(`[tiktok-publish] endpoint=${endpoint}`);
      const initData = await initInboxUpload({ accessToken, videoSize: fileInfo.size });
      publishId = text(initData.publish_id);
      uploadUrl = text(initData.upload_url);
      console.log(`[tiktok-publish] publish_id=${publishId}`);
      console.log(`[tiktok-publish] upload_url_ok=${!!uploadUrl}`);
    } else {
      const privacyLevel = args.mode === "DIRECT_PUBLIC" ? "PUBLIC_TO_EVERYONE" : "SELF_ONLY";
      const endpoint = "/v2/post/publish/video/init/";
      console.log(`[tiktok-publish] endpoint=${endpoint}`);
      const initData = await initDirectPost({
        accessToken,
        title: caption,
        privacyLevel,
        isAigc: process.env.TIKTOK_IS_AIGC !== "false",
        videoSize: fileInfo.size,
      });
      publishId = text(initData.publish_id);
      uploadUrl = text(initData.upload_url);
      console.log(`[tiktok-publish] publish_id=${publishId} privacy=${privacyLevel}`);
    }

    if (!publishId || !uploadUrl) {
      throw new Error("TikTok API did not return publish_id or upload_url.");
    }

    // 8. Upload binary
    console.log(`[tiktok-publish] Uploading video binary...`);
    await uploadFileToTikTok({ uploadUrl, filePath: localVideoPath, videoSize: fileInfo.size });
    console.log(`[tiktok-publish] Upload complete`);

    // 9. Poll status
    console.log(`[tiktok-publish] Polling publish status for publish_id=${publishId}...`);
    const result = await pollPublishStatus({ accessToken, publishId });
    console.log(`[tiktok-publish] status=${result.status}`);
    console.log(`[tiktok-publish] full_status_response=${JSON.stringify(result.data)}`);

    const platformPostIds = result.data?.publicaly_available_post_id || [];
    const platformPostId = Array.isArray(platformPostIds) ? text(platformPostIds[0]) : "";
    const platformUrl = platformPostId ? `https://www.tiktok.com/@${text(creatorInfo.creator_username)}/video/${platformPostId}` : "";

    // 10. Write results back to package
    publishReady.tiktok_publish_id = publishId;
    publishReady.tiktok_status = result.status;
    publishReady.tiktok_post_id = platformPostId;
    publishReady.tiktok_url = platformUrl;
    publishReady.tiktok_deeplink_token = deepLinkToken;
    publishReady.tiktok_published_at = new Date().toISOString();
    await writeJson(args.publishReadyPath, publishReady);

    const resultPath = path.join(args.packageDir, "tiktok_publish_result.json");
    await writeJson(resultPath, {
      mode: args.mode,
      publish_id: publishId,
      status: result.status,
      platform_post_id: platformPostId,
      platform_url: platformUrl,
      deeplink_token: deepLinkToken,
      caption_preview: caption.slice(0, 120),
      creator_username: text(creatorInfo.creator_username),
      published_at: publishReady.tiktok_published_at,
    });
    console.log(`[tiktok-publish] result written to ${resultPath}`);

    if (pg) {
      await writePlatformPublishLog(pg, {
        ...logBase,
        status: result.status,
        publish_id: publishId,
        platform_post_id: platformPostId,
        platform_url: platformUrl,
      });
    }

    // 11. Writeback to n8n storage if configured
    const bridgeRowPath = path.join(args.packageDir, "g3_bridge_row.json");
    if (await fileExists(bridgeRowPath)) {
      const bridgeRow = await loadJson(bridgeRowPath);
      bridgeRow.tiktok_status = result.status;
      bridgeRow.tiktok_url = platformUrl;
      bridgeRow.feedback = [
        text(bridgeRow.feedback),
        `tiktok_status=${result.status}`,
        platformUrl ? `tiktok_url=${platformUrl}` : "",
        `tiktok_deeplink=${deepLinkToken}`,
      ].filter(Boolean).join(" ").trim();
      await writeJson(bridgeRowPath, bridgeRow);
    }

    console.log(`\n[tiktok-publish] Done.`);
    console.log(`tiktok_status=${result.status}`);
    if (platformUrl) console.log(`tiktok_url=${platformUrl}`);
    console.log(`tiktok_deeplink_token=${deepLinkToken}`);

  } catch (error) {
    console.error(`[tiktok-publish] ERROR: ${error.message}`);
    if (error.failReason) console.error(`[tiktok-publish] fail_reason=${error.failReason}`);
    if (error.tiktokStatus) console.error(`[tiktok-publish] tiktok_status=${error.tiktokStatus}`);
    if (pg) {
      await writePlatformPublishLog(pg, {
        ...logBase,
        status: error.tiktokStatus || "tiktok_failed_terminal",
        publish_id: publishId,
        error_code: error.failReason || "unknown",
        error_message: error.message,
      });
    }
    throw error;
  } finally {
    if (pg) await pg.end().catch(() => {});
  }
}

main().catch((error) => {
  console.error(`[tiktok-publish] ERROR: ${error.message}`);
  process.exit(1);
});
