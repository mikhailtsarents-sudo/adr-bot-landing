import { readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { spawnSync } from "node:child_process";

const uploadRunStates = new Map();

function text(value) {
  return value == null ? "" : String(value).trim();
}

function numberFromEnv(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isAbsoluteHttpsUrl(value) {
  const safe = text(value);
  return safe.startsWith("https://");
}

function tryParseJson(value) {
  try {
    return JSON.parse(String(value || ""));
  } catch {
    return null;
  }
}

function makeProviderId(value) {
  return text(value).toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "") || "provider";
}

async function fetchWithTimeout(url, init, timeoutMs) {
  const effectiveTimeoutMs = Math.max(1000, Number(timeoutMs) || numberFromEnv(process.env.QUESTION_TEMP_UPLOAD_VERIFY_TIMEOUT_MS, 15000));
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), effectiveTimeoutMs);
  try {
    return await fetch(url, {
      ...init,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }
}

function normalizeExpectedMimePrefixes(value) {
  if (Array.isArray(value)) {
    return value.map((item) => text(item).toLowerCase()).filter(Boolean);
  }
  const safe = text(value).toLowerCase();
  return safe ? [safe] : ["image/"];
}

function mimeMatchesExpected(mimeType, expectedMimePrefixes) {
  const safeMime = text(mimeType).toLowerCase();
  const prefixes = normalizeExpectedMimePrefixes(expectedMimePrefixes);
  return prefixes.some((prefix) => safeMime.startsWith(prefix));
}

async function verifyRemoteAsset(uploadedUrl, options = {}) {
  const timeoutMs = Math.max(1000, numberFromEnv(process.env.QUESTION_TEMP_UPLOAD_VERIFY_TIMEOUT_MS, 15000));
  const delayScheduleMs = [1000, 2000, 4000, 8000, 12000];
  const verificationAttempts = [];
  const expectedMimePrefixes = normalizeExpectedMimePrefixes(options.expectedMimePrefixes);

  for (let attemptNumber = 1; attemptNumber <= delayScheduleMs.length; attemptNumber += 1) {
    const attempt = {
      verification_attempt_number: attemptNumber,
      http_status: null,
      content_type: "",
      content_length: null,
      bytes_read: 0,
      ready: false,
      failure_reason: "",
    };

    try {
      const headResponse = await fetchWithTimeout(uploadedUrl, { method: "HEAD" }, timeoutMs);
      const headContentType = text(headResponse.headers.get("content-type")).toLowerCase();
      const headContentLengthHeader = text(headResponse.headers.get("content-length"));
      const headContentLength = Number(headContentLengthHeader);
      attempt.http_status = headResponse.status;
      attempt.content_type = headContentType;
      attempt.content_length = Number.isFinite(headContentLength) ? headContentLength : null;

      const imageMime = mimeMatchesExpected(headContentType, expectedMimePrefixes);
      const positiveLength = Number.isFinite(headContentLength) && headContentLength > 0;
      if (headResponse.status === 200 && imageMime && positiveLength) {
        attempt.ready = true;
        attempt.failure_reason = "";
        verificationAttempts.push(attempt);
        return {
          verification_status: "verified",
          verification_http_status: attempt.http_status,
          verification_content_length: attempt.content_length,
          verification_bytes_read: attempt.bytes_read,
          verification_mime: attempt.content_type,
          remote_asset_verified: true,
          verification_attempts: verificationAttempts,
        };
      }

      const getResponse = await fetchWithTimeout(uploadedUrl, {
        method: "GET",
        headers: {
          Range: "bytes=0-31",
        },
      }, timeoutMs).catch(async () => fetchWithTimeout(uploadedUrl, { method: "GET" }, timeoutMs));

      const getContentType = text(getResponse.headers.get("content-type")).toLowerCase();
      const getContentLengthHeader = text(getResponse.headers.get("content-length"));
      const getContentLength = Number(getContentLengthHeader);
      const bytes = getResponse.ok ? Buffer.from(await getResponse.arrayBuffer()) : Buffer.alloc(0);
      attempt.http_status = getResponse.status;
      attempt.content_type = getContentType || attempt.content_type;
      attempt.content_length = Number.isFinite(getContentLength) ? getContentLength : attempt.content_length;
      attempt.bytes_read = bytes.length;

      const mimeOk = mimeMatchesExpected(attempt.content_type, expectedMimePrefixes);
      const lengthOk =
        (Number.isFinite(attempt.content_length) && attempt.content_length > 0) ||
        attempt.bytes_read > 0;
      if (getResponse.status === 200 && mimeOk && lengthOk && attempt.bytes_read > 0) {
        attempt.ready = true;
        attempt.failure_reason = "";
        verificationAttempts.push(attempt);
        return {
          verification_status: "verified",
          verification_http_status: attempt.http_status,
          verification_content_length: attempt.content_length,
          verification_bytes_read: attempt.bytes_read,
          verification_mime: attempt.content_type,
          remote_asset_verified: true,
          verification_attempts: verificationAttempts,
        };
      }

      attempt.failure_reason =
        getResponse.status !== 200
          ? "http_status_not_200"
          : !mimeOk
            ? "mime_not_image"
            : "remote_asset_not_ready";
    } catch (error) {
      attempt.failure_reason = error?.name === "AbortError" ? "verification_timeout" : "verification_request_failed";
    }

    verificationAttempts.push(attempt);
    if (attemptNumber < delayScheduleMs.length) {
      await sleep(delayScheduleMs[attemptNumber - 1]);
    }
  }

  const lastAttempt = verificationAttempts[verificationAttempts.length - 1] || {};
  return {
    verification_status: "remote_asset_not_ready",
    verification_http_status: lastAttempt.http_status ?? null,
    verification_content_length: lastAttempt.content_length ?? null,
    verification_bytes_read: lastAttempt.bytes_read ?? 0,
    verification_mime: text(lastAttempt.content_type),
    remote_asset_verified: false,
    verification_attempts: verificationAttempts,
  };
}

function guessMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg";
  if (ext === ".png") return "image/png";
  if (ext === ".webp") return "image/webp";
  if (ext === ".gif") return "image/gif";
  if (ext === ".mp4" || ext === ".m4v") return "video/mp4";
  if (ext === ".mov") return "video/quicktime";
  if (ext === ".mp3") return "audio/mpeg";
  return "application/octet-stream";
}

function buildRunStateKey(diagnosticsDir) {
  return text(diagnosticsDir) || "__default__";
}

function getUploadRunState(diagnosticsDir, hosts) {
  const stateKey = buildRunStateKey(diagnosticsDir);
  const existing = uploadRunStates.get(stateKey);
  if (existing) {
    for (const host of hosts) {
      if (!existing.hosts.has(host)) {
        existing.hosts.set(host, {
          host,
          attempts: 0,
          last_failure_reason: "",
          unhealthy: false,
          exhausted: false,
          repeated_same_url_zero_bytes: false,
          last_uploaded_url: "",
        });
      }
    }
    return existing;
  }

  const created = {
    state_key: stateKey,
    hosts: new Map(
      hosts.map((host) => [
        host,
        {
          host,
          attempts: 0,
          last_failure_reason: "",
          unhealthy: false,
          exhausted: false,
          repeated_same_url_zero_bytes: false,
          last_uploaded_url: "",
        },
      ]),
    ),
  };
  uploadRunStates.set(stateKey, created);
  return created;
}

function classifySelectionReason(hostStates, selectedState, selectedIndex) {
  if (selectedState.unhealthy) {
    return "last_available_host";
  }
  if (selectedIndex === 0) {
    return "primary";
  }
  return hostStates.some((state) => state.unhealthy)
    ? "fallback_after_host_failure"
    : "primary";
}

function selectUploadHost(runState, orderedHosts) {
  const hostStates = orderedHosts.map((host) => runState.hosts.get(host)).filter(Boolean);
  const healthyOrUnknown = hostStates.filter((state) => !state.unhealthy);
  if (healthyOrUnknown.length > 0) {
    const selectedState = healthyOrUnknown[0];
    const selectedIndex = hostStates.findIndex((state) => state.host === selectedState.host);
    return {
      state: selectedState,
      selected_because: classifySelectionReason(hostStates, selectedState, selectedIndex),
      exhausted_hosts: hostStates.filter((state) => state.unhealthy).map((state) => state.host),
    };
  }

  return {
    state: null,
    selected_because: "",
    exhausted_hosts: hostStates.map((state) => state.host),
  };
}

function shouldMarkHostUnhealthy(attemptRecord, hostState) {
  const status = text(attemptRecord?.verification_status);
  const uploadedUrl = text(attemptRecord?.stdout);
  const uploadTransportSuccess = Boolean(attemptRecord?.upload_transport_success);
  const repeatedSameUrlZeroBytes =
    Boolean(uploadedUrl) &&
    uploadedUrl === text(hostState?.last_uploaded_url) &&
    Number(attemptRecord?.verification_bytes_read) === 0 &&
    Number(attemptRecord?.verification_content_length) === 0;

  const unhealthy =
    !uploadTransportSuccess ||
    status === "remote_asset_not_ready" ||
    status === "invalid_remote_asset" ||
    repeatedSameUrlZeroBytes;

  return {
    unhealthy,
    failureReason: repeatedSameUrlZeroBytes
      ? "repeated_same_url_zero_bytes"
      : (!uploadTransportSuccess ? "upload_transport_failed" : status),
    repeatedSameUrlZeroBytes,
  };
}

export function resolveTemporaryUploadProviders() {
  const configured = text(process.env.QUESTION_TEMP_UPLOAD_URLS || process.env.TEMPORARY_UPLOAD_URLS);
  if (configured) {
    return configured
      .split(",")
      .map((value) => text(value))
      .filter(Boolean)
      .map((url, index) => ({
        id: makeProviderId(url) || `provider_${index + 1}`,
        label: url,
        upload_url: url,
        form_fields: url.includes("catbox.moe")
          ? [
              ["reqtype", "fileupload"],
              ["fileToUpload", "@<local-file>"],
            ]
          : url.includes("uguu.se")
            ? [
                ["files[]", "@<local-file>"],
              ]
          : [
              ["file", "@<local-file>"],
            ],
      }));
  }

  return [
    {
      id: "catbox",
      label: "catbox",
      upload_url: "https://catbox.moe/user/api.php",
      form_fields: [
        ["reqtype", "fileupload"],
        ["fileToUpload", "@<local-file>"],
      ],
    },
    {
      id: "uguu",
      label: "uguu.se",
      upload_url: "https://uguu.se/upload.php",
      form_fields: [
        ["files[]", "@<local-file>"],
      ],
    },
  ];
}

function extractUploadedUrlFromResponse(provider, rawStdout) {
  const directUrl = text(rawStdout);
  if (isAbsoluteHttpsUrl(directUrl)) {
    return directUrl;
  }

  if (provider?.id === "uguu" || text(provider?.upload_url).includes("uguu.se")) {
    const parsed = tryParseJson(rawStdout);
    const uguuUrl = text(parsed?.files?.[0]?.url).replace(/\\\//g, "/");
    return isAbsoluteHttpsUrl(uguuUrl) ? uguuUrl : "";
  }

  return "";
}

async function fileInfo(filePath) {
  try {
    const info = await stat(filePath);
    return {
      file_exists: info.isFile(),
      file_size: info.isFile() ? info.size : 0,
      mime_type: guessMimeType(filePath),
    };
  } catch {
    return {
      file_exists: false,
      file_size: 0,
      mime_type: guessMimeType(filePath),
    };
  }
}

async function loadJsonIfExists(filePath, fallback) {
  try {
    return JSON.parse(await readFile(filePath, "utf8"));
  } catch {
    return fallback;
  }
}

async function appendArtifacts(diagnosticsDir, attemptRecord, lastErrorRecord, uploadSummary) {
  if (!text(diagnosticsDir)) {
    return {
      attemptsPath: "",
      lastErrorPath: "",
    };
  }

  const attemptsPath = path.join(diagnosticsDir, "temporary-upload-attempts.json");
  const lastErrorPath = path.join(diagnosticsDir, "temporary-upload-last-error.json");
  const existing = await loadJsonIfExists(attemptsPath, { uploads: [] });
  const uploads = Array.isArray(existing?.uploads) ? existing.uploads : [];

  let uploadEntry = uploads.find(
    (item) => text(item?.frame_id) === text(attemptRecord.frame_id) && text(item?.local_file_path) === text(attemptRecord.local_file_path),
  );
  if (!uploadEntry) {
    uploadEntry = {
      frame_id: attemptRecord.frame_id,
      local_file_path: attemptRecord.local_file_path,
      file_exists: attemptRecord.file_exists,
      file_size: attemptRecord.file_size,
      mime_type: attemptRecord.mime_type,
      target_hosts: [],
      configured_target_hosts: [],
      attempts: [],
      exhausted_hosts: [],
      final_upload_failure_reason: "",
    };
    uploads.push(uploadEntry);
  }

  uploadEntry.configured_target_hosts = Array.isArray(uploadSummary?.configured_target_hosts)
    ? uploadSummary.configured_target_hosts
    : uploadEntry.configured_target_hosts;
  if (Array.isArray(uploadEntry.configured_target_hosts) && uploadEntry.configured_target_hosts.length > 0) {
    uploadEntry.target_hosts = [...uploadEntry.configured_target_hosts];
  } else if (!uploadEntry.target_hosts.includes(attemptRecord.target_upload_url)) {
    uploadEntry.target_hosts.push(attemptRecord.target_upload_url);
  }
  uploadEntry.file_exists = attemptRecord.file_exists;
  uploadEntry.file_size = attemptRecord.file_size;
  uploadEntry.mime_type = attemptRecord.mime_type;
  uploadEntry.exhausted_hosts = Array.isArray(uploadSummary?.exhausted_hosts) ? uploadSummary.exhausted_hosts : [];
  uploadEntry.final_upload_failure_reason = text(uploadSummary?.final_upload_failure_reason);
  uploadEntry.attempts.push({
    attempt_number: attemptRecord.attempt_number,
    target_upload_url: attemptRecord.target_upload_url,
    selected_provider: attemptRecord.selected_provider,
    selected_host: attemptRecord.selected_host,
    selected_because: attemptRecord.selected_because,
    host_health_before_attempt: attemptRecord.host_health_before_attempt,
    host_marked_unhealthy_after_attempt: Boolean(attemptRecord.host_marked_unhealthy_after_attempt),
    curl_command_shape: attemptRecord.curl_command_shape,
    exit_code: attemptRecord.exit_code,
    stdout: attemptRecord.stdout,
    stderr: attemptRecord.stderr,
    elapsed_ms: attemptRecord.elapsed_ms,
    upload_transport_success: attemptRecord.upload_transport_success,
    remote_asset_verified: attemptRecord.remote_asset_verified,
    verification_status: attemptRecord.verification_status,
    verification_http_status: attemptRecord.verification_http_status,
    verification_content_length: attemptRecord.verification_content_length,
    verification_bytes_read: attemptRecord.verification_bytes_read,
    verification_mime: attemptRecord.verification_mime,
    verification_attempts: Array.isArray(attemptRecord.verification_attempts) ? attemptRecord.verification_attempts : [],
    success: attemptRecord.success,
    uploaded_url: attemptRecord.uploaded_url || "",
  });

  await writeFile(attemptsPath, `${JSON.stringify({ uploads }, null, 2)}\n`, "utf8");
  if (lastErrorRecord) {
    await writeFile(lastErrorPath, `${JSON.stringify(lastErrorRecord, null, 2)}\n`, "utf8");
  }
  return {
    attemptsPath,
    lastErrorPath,
  };
}

export async function uploadFileToTemporaryHost(localPath, options = {}) {
  const diagnosticsDir = text(options.diagnosticsDir);
  const frameId = text(options.frameId) || path.basename(localPath);
  const providers = resolveTemporaryUploadProviders();
  const hosts = providers.map((provider) => provider.upload_url);
  const runState = getUploadRunState(diagnosticsDir, hosts);
  const maxAttempts = Math.max(1, numberFromEnv(process.env.QUESTION_TEMP_UPLOAD_MAX_ATTEMPTS, 3));
  const perFileTimeoutMs = Math.max(1000, numberFromEnv(process.env.QUESTION_TEMP_UPLOAD_TIMEOUT_MS, 45000));
  const overallTimeoutMs = Math.max(perFileTimeoutMs, numberFromEnv(process.env.QUESTION_TEMP_UPLOAD_STAGE_TIMEOUT_MS, 180000));
  const verificationRetries = Math.max(1, numberFromEnv(process.env.QUESTION_TEMP_UPLOAD_VERIFY_RETRIES, 3));
  const verificationDelayMs = Math.max(250, numberFromEnv(process.env.QUESTION_TEMP_UPLOAD_VERIFY_DELAY_MS, 1500));
  const startedAt = Date.now();
  const local = await fileInfo(localPath);

  let lastErrorRecord = null;
  let attemptsPath = "";
  let lastErrorPath = "";
  let finalUploadFailureReason = "";
  let exhaustedHosts = [];

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    if (Date.now() - startedAt > overallTimeoutMs) {
      break;
    }

    const hostSelection = selectUploadHost(runState, hosts);
    exhaustedHosts = Array.isArray(hostSelection.exhausted_hosts) ? hostSelection.exhausted_hosts : [];
    if (!hostSelection.state) {
      finalUploadFailureReason = "temporary_upload_providers_exhausted";
      lastErrorRecord = {
        frame_id: frameId,
        local_file_path: localPath,
        file_exists: local.file_exists,
        file_size: local.file_size,
        mime_type: local.mime_type,
        upload_failure_stage: "temporary_asset_upload",
        verification_status: finalUploadFailureReason,
        selected_host: "",
        selected_because: "",
        host_health_before_attempt: "",
        host_marked_unhealthy_after_attempt: false,
        exhausted_hosts: exhaustedHosts,
        final_upload_failure_reason: finalUploadFailureReason,
      };
      ({ attemptsPath, lastErrorPath } = await appendArtifacts(
        diagnosticsDir,
        {
          ...lastErrorRecord,
          attempt_number: attempt,
          target_upload_url: "",
          curl_command_shape: "",
          exit_code: null,
          stdout: "",
          stderr: "",
          elapsed_ms: 0,
          upload_transport_success: false,
          remote_asset_verified: false,
          verification_http_status: null,
          verification_content_length: null,
          verification_bytes_read: 0,
          verification_mime: "",
          verification_attempts: [],
          success: false,
          uploaded_url: "",
        },
        lastErrorRecord,
        {
          exhausted_hosts: exhaustedHosts,
          final_upload_failure_reason: finalUploadFailureReason,
        },
      ));
      break;
    }

    const selectedHostState = hostSelection.state;
    const targetUploadUrl = selectedHostState.host;
    const selectedProvider = providers.find((provider) => provider.upload_url === targetUploadUrl) || {
      id: makeProviderId(targetUploadUrl),
      label: targetUploadUrl,
      upload_url: targetUploadUrl,
      form_fields: [
        ["file", "@<local-file>"],
      ],
    };
    const hostHealthBeforeAttempt = selectedHostState.unhealthy ? "unhealthy" : selectedHostState.attempts > 0 ? "healthy" : "unknown";
    console.log(
      [
        "[temporary-upload]",
        `frame_id=${frameId}`,
        `attempt=${attempt}`,
        `selected_host=${targetUploadUrl}`,
        `selected_provider=${selectedProvider.id}`,
        `selected_because=${hostSelection.selected_because}`,
        `host_health_before_attempt=${hostHealthBeforeAttempt}`,
      ].join(" "),
    );
    const curlArgs = [
      "-sS",
      "--max-time",
      String(Math.ceil(perFileTimeoutMs / 1000)),
      ...selectedProvider.form_fields.flatMap(([name, value]) => [
        "-F",
        `${name}=${value === "@<local-file>" ? `@${localPath}` : value}`,
      ]),
      targetUploadUrl,
    ];
    const attemptStartedAt = Date.now();
    const result = spawnSync("curl", curlArgs, {
      encoding: "utf8",
      stdio: "pipe",
    });
    selectedHostState.attempts += 1;
    const rawStdout = text(result.stdout);
    const uploadedUrl = extractUploadedUrlFromResponse(selectedProvider, rawStdout);
    const uploadTransportSuccess = result.status === 0 && isAbsoluteHttpsUrl(uploadedUrl);
    let verification = {
      verification_status: uploadTransportSuccess ? "not_verified" : "upload_transport_failed",
      verification_http_status: null,
      verification_content_length: null,
      verification_bytes_read: 0,
      verification_mime: "",
      remote_asset_verified: false,
      verification_attempts: [],
    };

    if (uploadTransportSuccess) {
      verification = await verifyRemoteAsset(uploadedUrl, {
        expectedMimePrefixes: options.expectedMimePrefixes,
      });
    }

    const success = uploadTransportSuccess && verification.remote_asset_verified;
    const unhealthyDecision = shouldMarkHostUnhealthy(
      {
        stdout: uploadedUrl,
        verification_status: verification.verification_status,
        verification_bytes_read: verification.verification_bytes_read,
        verification_content_length: verification.verification_content_length,
      },
      selectedHostState,
    );
    if (Boolean(uploadedUrl)) {
      selectedHostState.last_uploaded_url = uploadedUrl;
    }
    if (!success && unhealthyDecision.unhealthy) {
      selectedHostState.unhealthy = true;
      selectedHostState.exhausted = true;
      selectedHostState.last_failure_reason = unhealthyDecision.failureReason;
      selectedHostState.repeated_same_url_zero_bytes = unhealthyDecision.repeatedSameUrlZeroBytes;
    } else if (!success) {
      selectedHostState.last_failure_reason = text(verification.verification_status) || "upload_transport_failed";
    }
    exhaustedHosts = hosts
      .map((host) => runState.hosts.get(host))
      .filter((state) => state?.unhealthy)
      .map((state) => state.host);

    const attemptRecord = {
      frame_id: frameId,
      local_file_path: localPath,
      file_exists: local.file_exists,
      file_size: local.file_size,
      mime_type: local.mime_type,
      target_upload_url: targetUploadUrl,
      selected_provider: selectedProvider.id,
      selected_host: targetUploadUrl,
      selected_because: hostSelection.selected_because,
      host_health_before_attempt: hostHealthBeforeAttempt,
      host_marked_unhealthy_after_attempt: !success && unhealthyDecision.unhealthy,
      curl_command_shape: `curl -sS --max-time ${Math.ceil(perFileTimeoutMs / 1000)} ${selectedProvider.form_fields.map(([name, value]) => `-F ${name}=${value}`).join(" ")} ${targetUploadUrl}`,
      attempt_number: attempt,
      exit_code: result.status,
      stdout: rawStdout,
      stderr: text(result.stderr),
      elapsed_ms: Date.now() - attemptStartedAt,
      upload_transport_success: uploadTransportSuccess,
      remote_asset_verified: verification.remote_asset_verified,
      verification_status: verification.verification_status,
      verification_http_status: verification.verification_http_status,
      verification_content_length: verification.verification_content_length,
      verification_bytes_read: verification.verification_bytes_read,
      verification_mime: verification.verification_mime,
      verification_attempts: verification.verification_attempts,
      success,
      uploaded_url: success ? uploadedUrl : "",
    };
    ({ attemptsPath, lastErrorPath } = await appendArtifacts(
      diagnosticsDir,
      attemptRecord,
      success
        ? null
        : {
            ...attemptRecord,
            upload_failure_stage: "temporary_asset_upload",
            exhausted_hosts: exhaustedHosts,
            final_upload_failure_reason: text(verification.verification_status) || "temporary_asset_upload_failed",
          },
      {
        exhausted_hosts: exhaustedHosts,
        configured_target_hosts: hosts,
        final_upload_failure_reason: success
          ? ""
          : text(verification.verification_status) || "temporary_asset_upload_failed",
      },
    ));

    if (success) {
      selectedHostState.unhealthy = false;
      selectedHostState.last_failure_reason = "";
      return {
        uploadedUrl,
        attemptsPath,
        lastErrorPath,
      };
    }

    lastErrorRecord = {
      ...attemptRecord,
      upload_failure_stage: "temporary_asset_upload",
      exhausted_hosts: exhaustedHosts,
      final_upload_failure_reason: text(verification.verification_status) || "temporary_asset_upload_failed",
    };
    finalUploadFailureReason = text(verification.verification_status) || "temporary_asset_upload_failed";

    const remainingHealthyHosts = hosts
      .map((host) => runState.hosts.get(host))
      .filter((state) => state && !state.unhealthy);
    if (remainingHealthyHosts.length === 0) {
      finalUploadFailureReason = "temporary_upload_providers_exhausted";
      lastErrorRecord.final_upload_failure_reason = finalUploadFailureReason;
      break;
    }

    if (attempt < maxAttempts && Date.now() - startedAt <= overallTimeoutMs) {
      await sleep(1000 * (2 ** (attempt - 1)));
    }
  }

  const error = new Error(
    [
      finalUploadFailureReason === "temporary_upload_providers_exhausted"
        ? "Temporary generated asset upload failed: temporary_upload_providers_exhausted."
        : "Temporary generated asset upload failed.",
      lastErrorRecord?.stdout ? `stdout:\n${lastErrorRecord.stdout}` : null,
      lastErrorRecord?.stderr ? `stderr:\n${lastErrorRecord.stderr}` : null,
    ].filter(Boolean).join("\n"),
  );
  error.uploadAttemptsPath = attemptsPath;
  error.uploadLastErrorPath = lastErrorPath;
  error.uploadFailureStage = "temporary_asset_upload";
  error.failingFrameId = frameId;
  error.finalUploadFailureReason = finalUploadFailureReason || "temporary_asset_upload_failed";
  error.exhaustedHosts = exhaustedHosts;
  throw error;
}
