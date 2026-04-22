import { createHash, randomBytes } from "node:crypto";
import { createServer } from "node:http";
import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

const DEFAULT_OAUTH_SCOPE = "https://www.googleapis.com/auth/youtube.upload";
const DEFAULT_TOKEN_PATH = path.join(process.cwd(), "runtime", "youtube-direct-auth", "oauth-token.json");

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

export function defaultYoutubeOauthTokenPath() {
  return DEFAULT_TOKEN_PATH;
}

export async function ensureParentDir(filePath) {
  await mkdir(path.dirname(filePath), { recursive: true });
}

export async function loadJson(filePath) {
  return JSON.parse(await readFile(filePath, "utf8"));
}

export async function writeJson(filePath, value) {
  await ensureParentDir(filePath);
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

export function buildInstalledAppAuthUrl({
  clientId,
  redirectUri,
  codeChallenge,
  state,
  scope = DEFAULT_OAUTH_SCOPE,
}) {
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", scope);
  url.searchParams.set("access_type", "offline");
  url.searchParams.set("prompt", "consent");
  url.searchParams.set("code_challenge", codeChallenge);
  url.searchParams.set("code_challenge_method", "S256");
  url.searchParams.set("state", state);
  return url.toString();
}

export async function waitForOauthCallback({ port, expectedState, timeoutMs = 10 * 60 * 1000 }) {
  return await new Promise((resolve, reject) => {
    let settled = false;
    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      server.close();
      reject(new Error("Timed out waiting for Google OAuth callback."));
    }, timeoutMs);

    const server = createServer((req, res) => {
      const requestUrl = new URL(req.url || "/", `http://127.0.0.1:${port}`);
      const code = text(requestUrl.searchParams.get("code"));
      const state = text(requestUrl.searchParams.get("state"));
      const error = text(requestUrl.searchParams.get("error"));

      if (error) {
        res.writeHead(400, { "Content-Type": "text/plain; charset=utf-8" });
        res.end(`OAuth failed: ${error}\n`);
        if (!settled) {
          settled = true;
          clearTimeout(timer);
          server.close();
          reject(new Error(`Google OAuth failed: ${error}`));
        }
        return;
      }

      if (!code || state !== expectedState) {
        res.writeHead(400, { "Content-Type": "text/plain; charset=utf-8" });
        res.end("Invalid OAuth callback.\n");
        return;
      }

      res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Google OAuth completed. You can return to Codex.\n");
      if (!settled) {
        settled = true;
        clearTimeout(timer);
        server.close();
        resolve({ code, state });
      }
    });

    server.listen(port, "127.0.0.1", () => {});
    server.on("error", (error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      reject(error);
    });
  });
}

export async function exchangeAuthorizationCode({
  clientId,
  code,
  codeVerifier,
  redirectUri,
}) {
  const body = new URLSearchParams({
    client_id: clientId,
    code,
    code_verifier: codeVerifier,
    grant_type: "authorization_code",
    redirect_uri: redirectUri,
  });

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(`OAuth code exchange failed: HTTP ${response.status} ${JSON.stringify(payload)}`);
  }
  return payload;
}

export async function refreshYoutubeAccessToken({ clientId, refreshToken }) {
  const body = new URLSearchParams({
    client_id: clientId,
    refresh_token: refreshToken,
    grant_type: "refresh_token",
  });

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(`OAuth token refresh failed: HTTP ${response.status} ${JSON.stringify(payload)}`);
  }
  return payload;
}

export async function downloadRemoteFile(url, preferredName = "youtube-upload.mp4") {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Remote MP4 download failed: HTTP ${response.status}`);
  }
  const buffer = Buffer.from(await response.arrayBuffer());
  const filePath = path.join(os.tmpdir(), `${Date.now()}-${preferredName}`);
  await writeFile(filePath, buffer);
  return filePath;
}

export async function getFileInfo(filePath) {
  const fileStat = await stat(filePath);
  return {
    filePath,
    size: Number(fileStat.size) || 0,
    mimeType: path.extname(filePath).toLowerCase() === ".mp4" ? "video/mp4" : "application/octet-stream",
  };
}

export async function startYoutubeResumableUpload({
  accessToken,
  title,
  description,
  tags = [],
  privacyStatus = "unlisted",
  madeForKids = false,
  categoryId = "27",
  fileSize,
  mimeType = "video/mp4",
}) {
  const endpoint = new URL("https://www.googleapis.com/upload/youtube/v3/videos");
  endpoint.searchParams.set("part", "snippet,status");
  endpoint.searchParams.set("uploadType", "resumable");

  const body = {
    snippet: {
      title,
      description,
      tags,
      categoryId,
    },
    status: {
      privacyStatus,
      selfDeclaredMadeForKids: madeForKids,
    },
  };

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json; charset=UTF-8",
      "X-Upload-Content-Length": String(fileSize),
      "X-Upload-Content-Type": mimeType,
    },
    body: JSON.stringify(body),
  });

  const location = response.headers.get("location");
  const payload = await response.text().catch(() => "");
  if (!response.ok || !location) {
    throw new Error(`YouTube resumable session start failed: HTTP ${response.status} ${payload}`);
  }

  return location;
}

export async function uploadVideoBinaryToYoutube({ uploadUrl, accessToken, filePath, mimeType = "video/mp4" }) {
  const buffer = await readFile(filePath);
  const response = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Length": String(buffer.length),
      "Content-Type": mimeType,
      "Content-Range": `bytes 0-${buffer.length - 1}/${buffer.length}`,
    },
    body: buffer,
  });
  const payload = await response.json().catch(async () => ({ raw: await response.text().catch(() => "") }));
  if (!response.ok) {
    throw new Error(`YouTube video upload failed: HTTP ${response.status} ${JSON.stringify(payload)}`);
  }
  return payload;
}

export function normalizeYoutubeVideoResult(payload) {
  const videoId = text(payload?.id);
  return {
    videoId,
    youtubeUrl: videoId ? `https://youtube.com/shorts/${videoId}` : "",
    raw: payload,
  };
}
