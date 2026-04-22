#!/usr/bin/env node

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { probePhotorealProviders } from "./render/question-photoreal-generator.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");

function text(value) {
  return value == null ? "" : String(value).trim();
}

function printHelp() {
  console.log(`Usage: node scripts/run-question-photoreal-provider-probe.mjs [options]

Options:
  --output-root <dir>   Output directory for photoreal-provider-probe.json
  --question <text>     Optional probe question text
  --timeout-ms <n>      Timeout per provider request (default: 45000)
  --help                Show this help
`);
}

function parseArgs(argv) {
  const args = {
    outputRoot: path.join(repoRoot, "preview-smoke-runs", "provider-probe"),
    questionText: "Where is your driver's license?",
    timeoutMs: 45000,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === "--output-root") args.outputRoot = path.resolve(argv[++i]);
    else if (token === "--question") args.questionText = argv[++i];
    else if (token === "--timeout-ms") args.timeoutMs = Math.max(1000, Number(argv[++i]) || 45000);
    else if (token === "--help" || token === "-h") {
      printHelp();
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${token}`);
    }
  }

  return args;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  await mkdir(args.outputRoot, { recursive: true });

  const result = await probePhotorealProviders({
    questionText: args.questionText,
    timeoutMs: args.timeoutMs,
  });

  const outputPath = path.join(args.outputRoot, "photoreal-provider-probe.json");
  await writeFile(outputPath, `${JSON.stringify(result, null, 2)}\n`, "utf8");

  console.log(`probe_json=${outputPath}`);
  for (const provider of Array.isArray(result.providers) ? result.providers : []) {
    console.log(
      [
        "summary",
        `provider_id=${provider.provider_id}`,
        `available=${provider.available}`,
        `result=${text(provider.result) || "invalid_response"}`,
        `status=${provider.http_status == null ? "n/a" : provider.http_status}`,
        `elapsed_ms=${provider.elapsed_ms ?? 0}`,
      ].join(" "),
    );
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
