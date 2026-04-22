import { readFile } from "node:fs/promises";
import path from "node:path";

function text(value) {
  return value == null ? "" : String(value).trim();
}

function parseEnvFile(raw) {
  const entries = {};
  for (const line of String(raw || "").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex <= 0) continue;
    const key = trimmed.slice(0, separatorIndex).trim();
    let value = trimmed.slice(separatorIndex + 1).trim();
    if (
      (value.startsWith("\"") && value.endsWith("\"")) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    entries[key] = value;
  }
  return entries;
}

async function loadEnvFileIfPresent(filePath) {
  try {
    const raw = await readFile(filePath, "utf8");
    return parseEnvFile(raw);
  } catch {
    return null;
  }
}

export async function bootstrapLocalRuntimeEnv(repoRoot, options = {}) {
  const candidateFiles = [
    text(options.explicitEnvFile || process.env.ADR_RUNTIME_ENV_FILE),
    path.join(repoRoot, ".env.local"),
    path.join(repoRoot, ".env"),
  ].filter(Boolean);

  let loadedFrom = "";
  for (const filePath of candidateFiles) {
    const loaded = await loadEnvFileIfPresent(filePath);
    if (!loaded) continue;
    loadedFrom = filePath;
    for (const [key, value] of Object.entries(loaded)) {
      if (!text(process.env[key])) {
        process.env[key] = value;
      }
    }
    break;
  }

  return {
    loaded_from: loadedFrom,
    n8n_configured: Boolean(text(process.env.N8N_BASE_URL) && text(process.env.N8N_API_KEY) && text(process.env.N8N_ANALYTICS_TABLE_ID)),
    gsc_configured: Boolean(
      (text(process.env.GSC_ACCESS_TOKEN) || text(process.env.GSC_SERVICE_ACCOUNT_KEY_PATH)) &&
        text(process.env.GSC_SITE_URL),
    ),
  };
}
