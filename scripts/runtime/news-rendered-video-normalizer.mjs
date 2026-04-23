import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { uploadFileToTemporaryHost } from "./temporary-upload.mjs";

function text(value) {
  return value == null ? "" : String(value).trim();
}

async function downloadRemoteFile(url, filePath) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Remote NEWS MP4 download failed: HTTP ${response.status}`);
  }
  const buffer = Buffer.from(await response.arrayBuffer());
  await writeFile(filePath, buffer);
}

function runAvconvert(inputPath, outputPath) {
  const result = spawnSync(
    "/usr/bin/avconvert",
    [
      "--source", inputPath,
      "--preset", "PresetAppleM4V1080pHD",
      "--output", outputPath,
      "--replace",
    ],
    {
      encoding: "utf8",
      stdio: "pipe",
      maxBuffer: 20 * 1024 * 1024,
    },
  );

  if (result.status !== 0) {
    throw new Error(
      [
        "NEWS avconvert normalization failed",
        text(result.stdout) ? `stdout:\n${text(result.stdout)}` : "",
        text(result.stderr) ? `stderr:\n${text(result.stderr)}` : "",
      ].filter(Boolean).join("\n"),
    );
  }
}

function runFfmpeg(inputPath, outputPath) {
  const result = spawnSync(
    "ffmpeg",
    [
      "-y",
      "-i", inputPath,
      "-c:v", "libx264",
      "-preset", "medium",
      "-pix_fmt", "yuv420p",
      "-movflags", "+faststart",
      "-c:a", "aac",
      "-b:a", "192k",
      outputPath,
    ],
    {
      encoding: "utf8",
      stdio: "pipe",
      maxBuffer: 20 * 1024 * 1024,
    },
  );

  if (result.status !== 0) {
    throw new Error(
      [
        "NEWS ffmpeg normalization failed",
        text(result.stdout) ? `stdout:\n${text(result.stdout)}` : "",
        text(result.stderr) ? `stderr:\n${text(result.stderr)}` : "",
      ].filter(Boolean).join("\n"),
    );
  }
}

export async function normalizeRenderedNewsVideo({
  remoteUrl,
  traceId = "",
  diagnosticsDir = "",
  outputRoot = "",
}) {
  const safeTrace = text(traceId) || `news-video-${Date.now()}`;
  const workingRoot = text(outputRoot) || path.join(os.tmpdir(), "adr-news-video-normalizer");
  const workDir = path.join(workingRoot, safeTrace);
  await mkdir(workDir, { recursive: true });

  const downloadedPath = path.join(workDir, `${safeTrace}-raw.mp4`);
  const normalizedPath = path.join(workDir, `${safeTrace}-normalized.mp4`);

  await downloadRemoteFile(remoteUrl, downloadedPath);
  if (process.platform === "darwin") {
    const normalizedM4vPath = path.join(workDir, `${safeTrace}-normalized.m4v`);
    runAvconvert(downloadedPath, normalizedM4vPath);
    await copyFile(normalizedM4vPath, normalizedPath);
  } else {
    runFfmpeg(downloadedPath, normalizedPath);
  }

  const temporaryUpload = await uploadFileToTemporaryHost(normalizedPath, {
    frameId: `${safeTrace}-normalized-video`,
    diagnosticsDir,
    expectedMimePrefixes: ["video/"],
  });

  const uploadedUrl = text(temporaryUpload.uploadedUrl || temporaryUpload.uploaded_url || temporaryUpload.stdout);
  if (!uploadedUrl) {
    throw new Error("Normalized NEWS video upload did not return a remote URL.");
  }

  const report = {
    trace_id: safeTrace,
    remote_input_url: text(remoteUrl),
    local_downloaded_path: downloadedPath,
    local_normalized_path: normalizedPath,
    normalized_video_url: uploadedUrl,
    upload_summary: temporaryUpload,
  };
  const reportPath = path.join(workDir, "news_video_normalization_report.json");
  await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

  return {
    workDir,
    downloadedPath,
    normalizedPath,
    normalizedVideoUrl: uploadedUrl,
    reportPath,
  };
}
