#!/usr/bin/env node
// Run once on VPS to obtain TikTok OAuth tokens.
// Since TikTok requires an HTTPS redirect URI (not localhost), this script uses
// a "manual paste" flow: open the printed URL in a browser, authorise the app,
// then paste the full redirect URL (with ?code=...) back into the prompt.

import { createInterface } from "node:readline";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { bootstrapPhotorealRuntimeEnv } from "./runtime/photoreal-runtime-env.mjs";
import {
  buildPkcePair,
  buildTikTokAuthUrl,
  defaultTikTokOauthTokenPath,
  exchangeTikTokAuthCode,
  writeJson,
} from "./runtime/tiktok-content-posting-client.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function printHelp() {
  console.log(`Usage: node scripts/run-tiktok-oauth-bootstrap.mjs [options]

Options:
  --client-key <key>       TikTok app client key (or TIKTOK_CLIENT_KEY)
  --client-secret <s>      TikTok app client secret (or TIKTOK_CLIENT_SECRET)
  --redirect-uri <uri>     Redirect URI configured in TikTok developer portal
                           (or TIKTOK_REDIRECT_URI)
  --scope <scope>          OAuth scope (default: video.upload)
  --token-path <file>      Token output path (default: runtime/tiktok-auth/oauth-token.json)
  --help                   Show this help
`);
}

function parseArgs(argv) {
  const args = {
    clientKey: process.env.TIKTOK_CLIENT_KEY || "",
    clientSecret: process.env.TIKTOK_CLIENT_SECRET || "",
    redirectUri: process.env.TIKTOK_REDIRECT_URI || "",
    scope: "video.upload",
    tokenPath: defaultTikTokOauthTokenPath(),
  };
  for (let i = 0; i < argv.length; i += 1) {
    const t = argv[i];
    if (t === "--client-key") args.clientKey = argv[++i];
    else if (t === "--client-secret") args.clientSecret = argv[++i];
    else if (t === "--redirect-uri") args.redirectUri = argv[++i];
    else if (t === "--scope") args.scope = argv[++i];
    else if (t === "--token-path") args.tokenPath = path.resolve(argv[++i]);
    else if (t === "--help" || t === "-h") { printHelp(); process.exit(0); }
    else throw new Error(`Unknown argument: ${t}`);
  }
  if (!args.clientKey) throw new Error("Missing --client-key or TIKTOK_CLIENT_KEY.");
  if (!args.clientSecret) throw new Error("Missing --client-secret or TIKTOK_CLIENT_SECRET.");
  if (!args.redirectUri) throw new Error("Missing --redirect-uri or TIKTOK_REDIRECT_URI.");
  return args;
}

function prompt(question) {
  return new Promise((resolve) => {
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    rl.question(question, (answer) => { rl.close(); resolve(answer.trim()); });
  });
}

async function main() {
  await bootstrapPhotorealRuntimeEnv(path.resolve(__dirname, ".."));
  const args = parseArgs(process.argv.slice(2));
  const { verifier, challenge } = buildPkcePair();
  const state = `tiktok-oauth-${Date.now().toString(36)}`;

  const authUrl = buildTikTokAuthUrl({
    clientKey: args.clientKey,
    redirectUri: args.redirectUri,
    codeChallenge: challenge,
    state,
    scope: args.scope,
  });

  console.log("\n=== TikTok OAuth Bootstrap ===\n");
  console.log("1. Open this URL in your browser:\n");
  console.log(`   ${authUrl}\n`);
  console.log("2. Authorise the app with your TikTok account.");
  console.log(`3. TikTok will redirect to: ${args.redirectUri}?code=...&state=...`);
  console.log("4. Copy the FULL redirect URL from your browser address bar.\n");

  const pastedUrl = await prompt("Paste the full redirect URL here: ");

  let code = "";
  let returnedState = "";
  try {
    const parsed = new URL(pastedUrl);
    code = parsed.searchParams.get("code") || "";
    returnedState = parsed.searchParams.get("state") || "";
  } catch {
    throw new Error(`Could not parse the pasted URL: ${pastedUrl}`);
  }

  if (!code) throw new Error("No 'code' parameter found in the pasted URL.");
  if (returnedState && returnedState !== state) {
    throw new Error(`State mismatch — expected "${state}", got "${returnedState}".`);
  }

  const tokenPayload = await exchangeTikTokAuthCode({
    clientKey: args.clientKey,
    clientSecret: args.clientSecret,
    code,
    codeVerifier: verifier,
    redirectUri: args.redirectUri,
  });

  const tokenBundle = {
    client_key: args.clientKey,
    scope: args.scope,
    redirect_uri: args.redirectUri,
    refresh_token: tokenPayload.refresh_token || "",
    access_token: tokenPayload.access_token || "",
    token_type: tokenPayload.token_type || "Bearer",
    expiry_date: Date.now() + Number(tokenPayload.expires_in || 0) * 1000,
    created_at: new Date().toISOString(),
  };

  await writeJson(args.tokenPath, tokenBundle);

  console.log(`\nTOKEN_SAVED=${args.tokenPath}`);
  console.log(`SCOPE=${tokenBundle.scope}`);
  console.log(`HAS_REFRESH_TOKEN=${Boolean(tokenBundle.refresh_token)}`);
}

main().catch((error) => {
  console.error(`ERROR: ${error.message}`);
  process.exit(1);
});
