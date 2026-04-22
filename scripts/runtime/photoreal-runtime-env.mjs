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
    const index = trimmed.indexOf("=");
    if (index <= 0) continue;
    const key = trimmed.slice(0, index).trim();
    let value = trimmed.slice(index + 1).trim();
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

export async function bootstrapPhotorealRuntimeEnv(repoRoot) {
  const candidateFiles = [
    text(process.env.PHOTOREAL_RUNTIME_ENV_FILE),
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
    OPENAI_API_KEY_present: Boolean(text(process.env.OPENAI_API_KEY)),
    OPENAI_API_TOKEN_present: Boolean(text(process.env.OPENAI_API_TOKEN)),
    FAL_AI_API_KEY_present: Boolean(text(process.env.FAL_AI_API_KEY)),
    FAL_AI_MODEL_URL_present: Boolean(text(process.env.FAL_AI_MODEL_URL)),
    FAL_AI_PROFILE: text(process.env.FAL_AI_PROFILE || process.env.QUESTION_PHOTOREAL_FAL_PROFILE || "realism"),
    QUESTION_PHOTOREAL_FALLBACK_1_URL_present: Boolean(text(process.env.QUESTION_PHOTOREAL_FALLBACK_1_URL)),
    QUESTION_PHOTOREAL_FALLBACK_1_TOKEN_present: Boolean(text(process.env.QUESTION_PHOTOREAL_FALLBACK_1_TOKEN)),
    QUESTION_PHOTOREAL_FALLBACK_1_MODEL_present: Boolean(text(process.env.QUESTION_PHOTOREAL_FALLBACK_1_MODEL)),
    cwd: process.cwd(),
    "process.argv[0]": text(process.argv[0]),
  };
}
