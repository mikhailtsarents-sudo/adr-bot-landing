import { readFile } from "node:fs/promises";
import { GoogleAuth } from "google-auth-library";

function text(value) {
  return value == null ? "" : String(value).trim();
}

async function loadServiceAccountCredentials(keyPath) {
  const raw = await readFile(keyPath, "utf8");
  const parsed = JSON.parse(raw);
  if (!parsed?.client_email || !parsed?.private_key) {
    throw new Error(`Invalid GSC service-account key file: ${keyPath}`);
  }
  return parsed;
}

export async function resolveSearchConsoleAccessToken({
  accessToken = "",
  serviceAccountKeyPath = "",
}) {
  const directToken = text(accessToken);
  if (directToken) {
    return {
      accessToken: directToken,
      authMode: "access_token",
    };
  }

  const keyPath = text(serviceAccountKeyPath);
  if (!keyPath) {
    throw new Error("Missing GSC_ACCESS_TOKEN or GSC_SERVICE_ACCOUNT_KEY_PATH.");
  }

  const credentials = await loadServiceAccountCredentials(keyPath);
  const auth = new GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/webmasters.readonly"],
  });
  const client = await auth.getClient();
  const tokenResponse = await client.getAccessToken();
  const resolvedToken =
    typeof tokenResponse === "string" ? tokenResponse : tokenResponse?.token || "";

  if (!text(resolvedToken)) {
    throw new Error(`Could not obtain Search Console access token from service account: ${keyPath}`);
  }

  return {
    accessToken: resolvedToken,
    authMode: "service_account",
  };
}
