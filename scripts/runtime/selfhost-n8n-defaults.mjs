function text(value) {
  return value == null ? "" : String(value).trim();
}

function stripTrailingSlash(value) {
  return text(value).replace(/\/+$/, "");
}

function isLegacyCloudUrl(value) {
  return /(^|\/\/)[^/]*n8n\.cloud(\/|$)/i.test(text(value));
}

export const DEFAULT_SELF_HOST_N8N_BASE_URL = "http://46.225.170.55:5678";
export const DEFAULT_DRAFT_STORAGE_TABLE_ID = "o3VHi3uQOI2y0z1o";
export const DEFAULT_YOUTUBE_BRIDGE_WEBHOOK_PATH = "/webhook/adr-youtube-execution-bridge-run";

export function resolveSelfHostN8nBaseUrl(env = process.env) {
  const explicitBaseUrl = stripTrailingSlash(
    env.SELF_HOST_N8N_BASE_URL || env.ACTIVE_N8N_BASE_URL || "",
  );
  if (explicitBaseUrl) {
    return explicitBaseUrl;
  }

  const genericBaseUrl = stripTrailingSlash(env.N8N_BASE_URL || "");
  if (genericBaseUrl && !isLegacyCloudUrl(genericBaseUrl)) {
    return genericBaseUrl;
  }

  return DEFAULT_SELF_HOST_N8N_BASE_URL;
}

export function resolveDraftStorageApiUrl(env = process.env) {
  const explicitUrl = stripTrailingSlash(env.DRAFT_STORAGE_API_URL || "");
  if (explicitUrl) {
    return explicitUrl;
  }

  const tableId = text(env.N8N_DRAFT_TABLE_ID || DEFAULT_DRAFT_STORAGE_TABLE_ID);
  return `${resolveSelfHostN8nBaseUrl(env)}/api/v1/data-tables/${tableId}/rows`;
}

export function resolveYoutubeBridgeWebhookUrl(env = process.env) {
  const explicitUrl = stripTrailingSlash(env.YOUTUBE_BRIDGE_WEBHOOK_URL || "");
  if (explicitUrl) {
    return explicitUrl;
  }

  return `${resolveSelfHostN8nBaseUrl(env)}${DEFAULT_YOUTUBE_BRIDGE_WEBHOOK_PATH}`;
}

export function resolveN8nApiKey(env = process.env) {
  return text(env.INTERNAL_N8N_API_KEY || env.ADR_INGEST_API_KEY || env.N8N_API_KEY || "");
}

export function resolveSelfHostN8nDefaults(env = process.env) {
  return {
    baseUrl: resolveSelfHostN8nBaseUrl(env),
    draftStorageApiUrl: resolveDraftStorageApiUrl(env),
    youtubeBridgeWebhookUrl: resolveYoutubeBridgeWebhookUrl(env),
    n8nApiKey: resolveN8nApiKey(env),
  };
}
