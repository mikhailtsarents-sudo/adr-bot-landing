import { createHash, randomBytes } from "node:crypto";
import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";

const TIKTOK_BASE_URL = "https://open.tiktokapis.com";
const TIKTOK_AUTH_BASE = "https://www.tiktok.com/v2/auth/authorize/";
const TIKTOK_TOKEN_URL = `${TIKTOK_BASE_URL}/v2/oauth/token/`;

const DEFAULT_TOKEN_PATH = path.join(
  process.cwd(),
  "runtime",
  "tiktok-auth",
  "oauth-token.json",
);

function text(value) {
  return value == null ? "" : String(value).trim();
}

function base64Url(buffer) {
  return Buffer.from(buffer)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

export function buildPkcePair() {
  const verifier = base64Url(randomBytes(48));
  const challenge = base64Url(createHash("sha256").update(verifier).digest());
  return { verifier, challenge };
}

export function defaultTikTokOauthTokenPath() {
  return (
    text(process.env.TIKTOK_OAUTH_TOKEN_PATH) ||
    DEFAULT_TOKEN_PATH
  );
}

async function ensureParentDir(filePath) {
  await mkdir(path.dirname(filePath), { recursive: true });
}

export async function loadJson(filePath) {
  return JSON.parse(await readFile(filePath, "utf8"));
}

export async function writeJson(filePath, value) {
  await ensureParentDir(filePath);
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

export function buildTikTokAuthUrl({
  clientKey,
  redirectUri,
  codeChallenge,
  state,
  scope = "video.upload,video.publish",
}) {
  const url = new URL(TIKTOK_AUTH_BASE);
  url.searchParams.set("client_key", clientKey);
  url.searchParams.set("scope", scope);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("state", state);
  url.searchParams.set("code_challenge", codeChallenge);
  url.searchParams.set("code_challenge_method", "S256");
  return url.toString();
}

export async function exchangeTikTokAuthCode({
  clientKey,
  clientSecret,
  code,
  codeVerifier,
  redirectUri,
}) {
  const body = new URLSearchParams({
    client_key: clientKey,
    client_secret: clientSecret,
    code,
    grant_type: "authorization_code",
    redirect_uri: redirectUri,
    code_verifier: codeVerifier,
  });
  const response = await fetch(TIKTOK_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(
      `TikTok auth code exchange failed: HTTP ${response.status} ${JSON.stringify(payload)}`,
    );
  }
  if (payload.error) {
    throw new Error(
      `TikTok auth code exchange error: ${payload.error} ${text(payload.error_description)}`,
    );
  }
  return payload;
}

export async function refreshTikTokAccessToken({ clientKey, clientSecret, refreshToken }) {
  const body = new URLSearchParams({
    client_key: clientKey,
    client_secret: clientSecret,
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  });
  const response = await fetch(TIKTOK_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(
      `TikTok token refresh failed: HTTP ${response.status} ${JSON.stringify(payload)}`,
    );
  }
  if (payload.error) {
    throw new Error(
      `TikTok token refresh error: ${payload.error} ${text(payload.error_description)}`,
    );
  }
  return payload;
}

export async function loadTikTokToken({ tokenPath } = {}) {
  return loadJson(tokenPath || defaultTikTokOauthTokenPath());
}

export async function getValidAccessToken({ tokenPath, clientKey, clientSecret } = {}) {
  const resolvedPath = tokenPath || defaultTikTokOauthTokenPath();
  const bundle = await loadTikTokToken({ tokenPath: resolvedPath });
  const now = Date.now();
  if (bundle.expiry_date && now < Number(bundle.expiry_date) - 60_000) {
    return text(bundle.access_token);
  }
  const ck = clientKey || text(bundle.client_key) || text(process.env.TIKTOK_CLIENT_KEY);
  const cs = clientSecret || text(bundle.client_secret) || text(process.env.TIKTOK_CLIENT_SECRET);
  if (!ck || !cs) {
    throw new Error(
      "Cannot refresh TikTok token: missing client_key/client_secret. " +
      "Pass --client-key / --client-secret or set TIKTOK_CLIENT_KEY / TIKTOK_CLIENT_SECRET.",
    );
  }
  const refreshed = await refreshTikTokAccessToken({
    clientKey: ck,
    clientSecret: cs,
    refreshToken: text(bundle.refresh_token),
  });
  const updated = {
    ...bundle,
    access_token: text(refreshed.access_token),
    refresh_token: text(refreshed.refresh_token) || bundle.refresh_token,
    expiry_date: now + Number(refreshed.expires_in || 0) * 1000,
    refreshed_at: new Date().toISOString(),
  };
  await writeJson(resolvedPath, updated);
  return updated.access_token;
}

export async function queryUserInfo({ accessToken }) {
  const fields = ["open_id", "union_id", "display_name", "avatar_url"].join(",");
  const url = new URL(`${TIKTOK_BASE_URL}/v2/user/info/`);
  url.searchParams.set("fields", fields);
  const response = await fetch(url.toString(), {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json; charset=UTF-8",
    },
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(`TikTok user/info query failed: HTTP ${response.status} ${JSON.stringify(payload)}`);
  }
  if (text(payload?.error?.code) !== "ok") {
    throw new Error(`TikTok user/info error: ${JSON.stringify(payload?.error)}`);
  }
  return payload.data?.user || {};
}

export async function queryCreatorInfo({ accessToken }) {
  const fields = [
    "creator_avatar_url",
    "creator_username",
    "creator_nickname",
    "privacy_level_options",
    "comment_disabled",
    "duet_disabled",
    "stitch_disabled",
    "max_video_post_duration_sec",
  ].join(",");
  const url = new URL(`${TIKTOK_BASE_URL}/v2/post/publish/creator_info/query/`);
  url.searchParams.set("fields", fields);
  const response = await fetch(url.toString(), {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json; charset=UTF-8",
    },
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(
      `TikTok creator_info query failed: HTTP ${response.status} ${JSON.stringify(payload)}`,
    );
  }
  if (text(payload?.error?.code) !== "ok") {
    throw new Error(`TikTok creator_info error: ${JSON.stringify(payload?.error)}`);
  }
  return payload.data || {};
}

export async function getFileInfo(filePath) {
  const s = await stat(filePath);
  return { filePath, size: Number(s.size) || 0, mimeType: "video/mp4" };
}

function buildSourceInfo(videoSize) {
  const chunkSize = Math.min(10 * 1024 * 1024, videoSize);
  const totalChunks = Math.ceil(videoSize / chunkSize);
  return {
    source: "FILE_UPLOAD",
    video_size: videoSize,
    chunk_size: chunkSize,
    total_chunk_count: totalChunks,
  };
}

export async function initInboxUpload({ accessToken, videoSize }) {
  const body = { source_info: buildSourceInfo(videoSize) };
  const response = await fetch(`${TIKTOK_BASE_URL}/v2/post/publish/inbox/video/init/`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json; charset=UTF-8",
    },
    body: JSON.stringify(body),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(
      `TikTok inbox upload init failed: HTTP ${response.status} ${JSON.stringify(payload)}`,
    );
  }
  if (text(payload?.error?.code) !== "ok") {
    throw new Error(`TikTok inbox upload init error: ${JSON.stringify(payload?.error)}`);
  }
  return payload.data || {};
}

export async function initDirectPost({
  accessToken,
  title,
  privacyLevel = "SELF_ONLY",
  disableDuet = false,
  disableComment = false,
  disableStitch = false,
  isAigc = true,
  videoSize,
}) {
  if (
    privacyLevel === "PUBLIC_TO_EVERYONE" &&
    process.env.TIKTOK_PUBLIC_DIRECT_ENABLED !== "true"
  ) {
    throw new Error(
      "DIRECT_PUBLIC is disabled. Set TIKTOK_PUBLIC_DIRECT_ENABLED=true after TikTok app audit/approval.",
    );
  }
  const body = {
    post_info: {
      title: String(title || "").slice(0, 2200),
      privacy_level: privacyLevel,
      disable_duet: disableDuet,
      disable_comment: disableComment,
      disable_stitch: disableStitch,
      video_cover_timestamp_ms: 1000,
      is_aigc: isAigc,
    },
    source_info: buildSourceInfo(videoSize),
  };
  const response = await fetch(`${TIKTOK_BASE_URL}/v2/post/publish/video/init/`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json; charset=UTF-8",
    },
    body: JSON.stringify(body),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(
      `TikTok direct post init failed: HTTP ${response.status} ${JSON.stringify(payload)}`,
    );
  }
  if (text(payload?.error?.code) !== "ok") {
    throw new Error(`TikTok direct post init error: ${JSON.stringify(payload?.error)}`);
  }
  return payload.data || {};
}

export async function uploadFileToTikTok({ uploadUrl, filePath, videoSize }) {
  const buffer = await readFile(filePath);
  const size = videoSize || buffer.length;
  const response = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      "Content-Type": "video/mp4",
      "Content-Length": String(size),
      "Content-Range": `bytes 0-${size - 1}/${size}`,
    },
    body: buffer,
  });
  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`TikTok video file upload failed: HTTP ${response.status} ${body}`);
  }
}

export async function fetchPublishStatus({ accessToken, publishId }) {
  const response = await fetch(`${TIKTOK_BASE_URL}/v2/post/publish/status/fetch/`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json; charset=UTF-8",
    },
    body: JSON.stringify({ publish_id: publishId }),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(
      `TikTok status fetch failed: HTTP ${response.status} ${JSON.stringify(payload)}`,
    );
  }
  if (text(payload?.error?.code) !== "ok") {
    throw new Error(`TikTok status fetch error: ${JSON.stringify(payload?.error)}`);
  }
  return payload.data || {};
}

const TERMINAL_FAIL_REASONS = new Set([
  "duration_check_failed",
  "file_format_check_failed",
  "frame_rate_check_failed",
  "picture_size_check_failed",
  "auth_removed",
  "spam_risk_text",
  "spam_risk",
  "spam_risk_user_banned_from_posting",
  "url_ownership_unverified",
]);

export async function pollPublishStatus({
  accessToken,
  publishId,
  timeoutMs = 5 * 60 * 1000,
  intervalMs = 6000,
}) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const data = await fetchPublishStatus({ accessToken, publishId });
    const status = text(data.status);
    const failReason = text(data.fail_reason);

    if (status === "PUBLISH_COMPLETE") return { status: "tiktok_published", data };
    if (status === "SEND_TO_USER_INBOX") return { status: "tiktok_sent_to_inbox", data };
    if (status === "FAILED") {
      const kind = TERMINAL_FAIL_REASONS.has(failReason)
        ? "tiktok_failed_terminal"
        : "tiktok_failed_retryable";
      throw Object.assign(
        new Error(`TikTok publish failed: ${failReason || "unknown"}`),
        { tiktokStatus: kind, failReason },
      );
    }

    await new Promise((r) => setTimeout(r, intervalMs));
  }
  throw new Error(`TikTok publish status polling timed out after ${timeoutMs}ms`);
}

export function validateCaptionLength(caption) {
  const utf16Length = [...String(caption || "")].reduce(
    (acc, ch) => acc + (ch.codePointAt(0) > 0xffff ? 2 : 1),
    0,
  );
  if (utf16Length > 2200) {
    throw new Error(`TikTok caption exceeds 2200 UTF-16 units (got ${utf16Length})`);
  }
  return caption;
}

export function buildTikTokCaption({ title, contentFamily = "QUESTION" }) {
  const emoji = contentFamily === "WORD" ? "\u{1F4D6}" : contentFamily === "NEWS" ? "\u{1F4F0}" : "❓";
  const lines = [
    `${emoji} ${String(title || "").trim()}`,
    "",
    "Antwort? Schreib sie in die Kommentare \u{1F447}",
    "",
    "Mehr kostenlos üben: Link in Bio",
    "",
    "#ADR #Gefahrgut #LKW #Führerschein #ADRPrüfung #Trucker #Deutschland",
  ];
  return validateCaptionLength(lines.join("\n"));
}
