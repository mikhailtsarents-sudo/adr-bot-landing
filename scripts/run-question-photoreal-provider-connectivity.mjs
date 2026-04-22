#!/usr/bin/env node

import dns from "node:dns/promises";
import http from "node:http";
import https from "node:https";
import net from "node:net";
import tls from "node:tls";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const DEFAULT_TIMEOUT_MS = 10000;

function text(value) {
  return value == null ? "" : String(value).trim();
}

function printHelp() {
  console.log(`Usage: node scripts/run-question-photoreal-provider-connectivity.mjs [options]

Options:
  --output-root <dir>   Output directory for photoreal-provider-connectivity.json
  --timeout-ms <n>      Timeout per provider connectivity probe (default: ${DEFAULT_TIMEOUT_MS})
  --help                Show this help
`);
}

function parseArgs(argv) {
  const args = {
    outputRoot: path.join(repoRoot, "preview-smoke-runs", "provider-connectivity"),
    timeoutMs: DEFAULT_TIMEOUT_MS,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === "--output-root") args.outputRoot = path.resolve(argv[++i]);
    else if (token === "--timeout-ms") args.timeoutMs = Math.max(1000, Number(argv[++i]) || DEFAULT_TIMEOUT_MS);
    else if (token === "--help" || token === "-h") {
      printHelp();
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${token}`);
    }
  }

  return args;
}

function getApiKey() {
  return text(process.env.OPENAI_API_KEY || process.env.OPENAI_API_TOKEN);
}

function buildConfiguredProviders() {
  return [
    {
      provider_id: "openai_primary",
      endpoint_url: "https://api.openai.com/v1/images/generations",
      configured: Boolean(getApiKey()),
      why_unavailable: getApiKey() ? "" : "missing_api_key",
    },
    {
      provider_id: "external_fallback_1",
      endpoint_url: text(process.env.QUESTION_PHOTOREAL_FALLBACK_1_URL),
      configured: Boolean(text(process.env.QUESTION_PHOTOREAL_FALLBACK_1_URL)),
      why_unavailable: text(process.env.QUESTION_PHOTOREAL_FALLBACK_1_URL) ? "" : "missing_url",
    },
    {
      provider_id: "external_fallback_2",
      endpoint_url: text(process.env.QUESTION_PHOTOREAL_FALLBACK_2_URL),
      configured: Boolean(text(process.env.QUESTION_PHOTOREAL_FALLBACK_2_URL)),
      why_unavailable: text(process.env.QUESTION_PHOTOREAL_FALLBACK_2_URL) ? "" : "missing_url",
    },
  ];
}

function classifyConnectivityResult(state) {
  if (state.result && state.result !== "ok") {
    return state.result;
  }
  if (!state.dns_resolved) return "dns_error";
  if (!state.tcp_connect_ok) return "connect_error";
  if (state.is_https && !state.tls_ok) return "tls_error";
  if (!state.http_response_received) return "timeout";
  if (state.http_status >= 200 && state.http_status < 500) return "ok";
  if (state.http_status >= 500) return "http_error";
  return "http_error";
}

function withTimeout(promiseFactory, timeoutMs, onTimeout) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      try {
        onTimeout?.();
      } catch {}
      const error = new Error(`connectivity timeout after ${timeoutMs}ms`);
      error.code = "TIMEOUT";
      reject(error);
    }, timeoutMs);

    promiseFactory()
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((error) => {
        clearTimeout(timer);
        reject(error);
      });
  });
}

async function probeDns(hostname) {
  await dns.lookup(hostname);
}

async function probeTcp(hostname, port, timeoutMs) {
  return withTimeout(
    () =>
      new Promise((resolve, reject) => {
        const socket = net.connect({ host: hostname, port });
        socket.once("connect", () => {
          socket.end();
          resolve();
        });
        socket.once("error", reject);
      }),
    timeoutMs,
  );
}

async function probeTls(hostname, port, timeoutMs) {
  return withTimeout(
    () =>
      new Promise((resolve, reject) => {
        const socket = tls.connect({
          host: hostname,
          port,
          servername: hostname,
        });
        socket.once("secureConnect", () => {
          socket.end();
          resolve();
        });
        socket.once("error", reject);
      }),
    timeoutMs,
  );
}

async function probeHttp(url, timeoutMs) {
  const parsed = new URL(url);
  const client = parsed.protocol === "https:" ? https : http;

  return withTimeout(
    () =>
      new Promise((resolve, reject) => {
        const req = client.request(
          parsed,
          {
            method: "HEAD",
          },
          (res) => {
            res.resume();
            resolve({
              status: res.statusCode || 0,
              headers: res.headers,
            });
          },
        );
        req.once("error", reject);
        req.end();
      }),
    timeoutMs,
    undefined,
  );
}

async function probeProvider(provider, timeoutMs) {
  const startedAt = Date.now();
  const state = {
    provider_id: provider.provider_id,
    endpoint_url: provider.endpoint_url,
    dns_resolved: false,
    tcp_connect_ok: false,
    tls_ok: false,
    http_response_received: false,
    http_status: null,
    elapsed_ms: 0,
    result: provider.configured ? "timeout" : "http_error",
  };

  if (!provider.configured || !text(provider.endpoint_url)) {
    state.elapsed_ms = Date.now() - startedAt;
    state.result = "http_error";
    return state;
  }

  const parsed = new URL(provider.endpoint_url);
  const hostname = parsed.hostname;
  const port =
    parsed.port
      ? Number(parsed.port)
      : parsed.protocol === "https:"
        ? 443
        : 80;
  state.is_https = parsed.protocol === "https:";

  try {
    await probeDns(hostname);
    state.dns_resolved = true;
  } catch {
    state.elapsed_ms = Date.now() - startedAt;
    state.result = "dns_error";
    return state;
  }

  try {
    await probeTcp(hostname, port, timeoutMs);
    state.tcp_connect_ok = true;
  } catch (error) {
    state.elapsed_ms = Date.now() - startedAt;
    state.result = error?.code === "TIMEOUT" ? "timeout" : "connect_error";
    return state;
  }

  if (state.is_https) {
    try {
      await probeTls(hostname, port, timeoutMs);
      state.tls_ok = true;
    } catch (error) {
      state.elapsed_ms = Date.now() - startedAt;
      state.result = error?.code === "TIMEOUT" ? "timeout" : "tls_error";
      return state;
    }
  }

  try {
    const response = await probeHttp(provider.endpoint_url, timeoutMs);
    state.http_response_received = true;
    state.http_status = response.status;
    state.elapsed_ms = Date.now() - startedAt;
    state.result = classifyConnectivityResult(state);
    return state;
  } catch (error) {
    state.elapsed_ms = Date.now() - startedAt;
    state.result = error?.code === "TIMEOUT" ? "timeout" : "http_error";
    return state;
  }
}

function buildConclusion(result) {
  return result.result === "ok"
    ? "network path ok, request-layer problem likely"
    : "network path broken before generation";
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  await mkdir(args.outputRoot, { recursive: true });

  const configuredProviders = buildConfiguredProviders().filter((provider) => provider.configured);
  const results = [];
  for (const provider of configuredProviders) {
    results.push(await probeProvider(provider, args.timeoutMs));
  }

  const artifact = {
    timeout_ms: args.timeoutMs,
    providers: results,
  };

  const outputPath = path.join(args.outputRoot, "photoreal-provider-connectivity.json");
  await writeFile(outputPath, `${JSON.stringify(artifact, null, 2)}\n`, "utf8");

  console.log(`connectivity_json=${outputPath}`);
  for (const result of results) {
    console.log(
      [
        "summary",
        `provider_id=${result.provider_id}`,
        `result=${result.result}`,
        `status=${result.http_status == null ? "n/a" : result.http_status}`,
        `elapsed_ms=${result.elapsed_ms}`,
        `conclusion=${buildConclusion(result)}`,
      ].join(" "),
    );
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
