#!/usr/bin/env node

import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import {
  buildInstalledAppAuthUrl,
  buildPkcePair,
  defaultYoutubeOauthTokenPath,
  exchangeAuthorizationCode,
  waitForOauthCallback,
  writeJson,
} from "./runtime/youtube-direct-client.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");

function printHelp() {
  console.log(`Usage: node scripts/run-youtube-oauth-bootstrap.mjs [options]

Options:
  --client-id <id>         Google OAuth desktop client id (or YOUTUBE_OAUTH_CLIENT_ID)
  --port <n>               Local callback port (default: 8765)
  --token-path <file>      Token output path (default: ${defaultYoutubeOauthTokenPath()})
  --scope <scope>          OAuth scope (default: youtube.upload)
  --open-browser           Try to open the auth URL automatically
  --help                   Show this help
`);
}

function parseArgs(argv) {
  const args = {
    clientId: process.env.YOUTUBE_OAUTH_CLIENT_ID || "",
    port: 8765,
    tokenPath: defaultYoutubeOauthTokenPath(),
    scope: "https://www.googleapis.com/auth/youtube.upload",
    openBrowser: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === "--client-id") args.clientId = argv[++i];
    else if (token === "--port") args.port = Number(argv[++i]) || 8765;
    else if (token === "--token-path") args.tokenPath = path.resolve(argv[++i]);
    else if (token === "--scope") args.scope = argv[++i];
    else if (token === "--open-browser") args.openBrowser = true;
    else if (token === "--help" || token === "-h") {
      printHelp();
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${token}`);
    }
  }

  if (!args.clientId) {
    throw new Error("Missing Google OAuth client id. Pass --client-id or set YOUTUBE_OAUTH_CLIENT_ID.");
  }

  return args;
}

function maybeOpenBrowser(url) {
  const child = spawn("open", [url], {
    cwd: repoRoot,
    stdio: "ignore",
    detached: true,
  });
  child.unref();
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const redirectUri = `http://127.0.0.1:${args.port}/callback`;
  const { verifier, challenge } = buildPkcePair();
  const state = `youtube-oauth-${Date.now().toString(36)}`;
  const authUrl = buildInstalledAppAuthUrl({
    clientId: args.clientId,
    redirectUri,
    codeChallenge: challenge,
    state,
    scope: args.scope,
  });

  console.log(`AUTH_URL=${authUrl}`);
  console.log(`REDIRECT_URI=${redirectUri}`);
  console.log(`TOKEN_PATH=${args.tokenPath}`);

  if (args.openBrowser) {
    maybeOpenBrowser(authUrl);
  }

  const callback = await waitForOauthCallback({
    port: args.port,
    expectedState: state,
  });

  const tokenPayload = await exchangeAuthorizationCode({
    clientId: args.clientId,
    code: callback.code,
    codeVerifier: verifier,
    redirectUri,
  });

  const tokenBundle = {
    client_id: args.clientId,
    scope: args.scope,
    redirect_uri: redirectUri,
    refresh_token: tokenPayload.refresh_token || "",
    access_token: tokenPayload.access_token || "",
    token_type: tokenPayload.token_type || "Bearer",
    expiry_date: Date.now() + (Number(tokenPayload.expires_in || 0) * 1000),
    created_at: new Date().toISOString(),
  };

  await writeJson(args.tokenPath, tokenBundle);
  console.log(`SAVED_TOKEN_PATH=${args.tokenPath}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
