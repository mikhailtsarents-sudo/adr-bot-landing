import { access, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";

const LEGACY_STORAGE_ROW_KEYS = [
  "draft_id",
  "story_id",
  "version",
  "created_at",
  "source_title",
  "source_url",
  "source_name",
  "topic_type",
  "headline",
  "post_text",
  "cta",
  "hashtags",
  "image_prompt",
  "image_url",
  "approval_status",
  "published_status",
  "feedback",
  "published_at",
];

function text(value) {
  return value == null ? "" : String(value).trim();
}

export function sanitizeStorageRowForServer(row) {
  const sanitized = {};
  for (const key of LEGACY_STORAGE_ROW_KEYS) {
    sanitized[key] = row?.[key] == null ? "" : row[key];
  }
  return sanitized;
}

export function findStorageRowMismatches(row) {
  const extraKeys = Object.keys(row || {}).filter((key) => !LEGACY_STORAGE_ROW_KEYS.includes(key));
  return {
    extra_keys: extraKeys,
    has_nested_object_values: extraKeys.some((key) => {
      const value = row?.[key];
      return value && typeof value === "object" && !Array.isArray(value);
    }),
  };
}

async function describeLocalFile(filePath) {
  const description = {
    resolved_local_file_path: text(filePath),
    file_exists: false,
    file_size: 0,
    mime_type: "",
  };
  if (!text(filePath)) {
    return description;
  }

  try {
    await access(filePath);
    const info = await stat(filePath);
    const ext = path.extname(filePath).toLowerCase();
    description.file_exists = true;
    description.file_size = Number(info.size) || 0;
    description.mime_type =
      ext === ".json"
        ? "application/json"
        : ext === ".mp4"
          ? "video/mp4"
          : ext === ".jpg" || ext === ".jpeg"
            ? "image/jpeg"
            : ext === ".png"
              ? "image/png"
              : "application/octet-stream";
  } catch {
    return description;
  }

  return description;
}

export async function postStorageRowWithDiagnostics(row, {
  endpoint,
  apiKey,
  diagnosticsDir,
  rowFilePath = "",
}) {
  const sanitizedRow = sanitizeStorageRowForServer(row);
  const rowMismatch = findStorageRowMismatches(row);
  const fileInfo = await describeLocalFile(rowFilePath);
  const requestArtifactPath = path.join(diagnosticsDir, "storage-insert-request.json");
  const responseArtifactPath = path.join(diagnosticsDir, "storage-insert-response.json");

  await writeFile(
    requestArtifactPath,
    `${JSON.stringify({
      endpoint,
      method: "POST",
      original_payload: { data: [row] },
      payload: { data: [sanitizedRow] },
      original_row_keys: Object.keys(row || {}),
      sanitized_row_keys: Object.keys(sanitizedRow),
      mismatch_diagnostics: rowMismatch,
      ...fileInfo,
    }, null, 2)}\n`,
    "utf8",
  );

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-N8N-API-KEY": apiKey,
    },
    body: JSON.stringify({ data: [sanitizedRow] }),
  });

  const rawBody = await response.text().catch(() => "");
  const responseHeaders = Object.fromEntries(response.headers.entries());
  await writeFile(
    responseArtifactPath,
    `${JSON.stringify({
      endpoint,
      method: "POST",
      http_status: response.status,
      response_headers: responseHeaders,
      raw_response_body: rawBody,
    }, null, 2)}\n`,
    "utf8",
  );

  if (!response.ok) {
    throw new Error(`Storage insert failed: ${response.status} ${rawBody}`);
  }

  return {
    sanitizedRow,
    requestArtifactPath,
    responseArtifactPath,
    mismatch: rowMismatch,
  };
}
