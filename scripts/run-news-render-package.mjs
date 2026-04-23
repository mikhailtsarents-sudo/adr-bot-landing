#!/usr/bin/env node

import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { bootstrapLocalRuntimeEnv } from "./runtime/local-runtime-env.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");

function printHelp() {
  console.log(`Usage: node scripts/run-news-render-package.mjs [options]

Options:
  --input <file>           Approved NEWS row JSON
  --output-root <dir>      Output root for generated render package files
  --scene-root <dir>       Optional NEWS scene root override
  --public-output-dir <d>  Optional public output dir override
  --keep-temp              Keep temporary files
  --help                   Show this help
`);
}

function parseArgs(argv) {
  const passthrough = [];
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === "--help" || token === "-h") {
      printHelp();
      process.exit(0);
    }
    passthrough.push(token);
  }
  return passthrough;
}

async function main() {
  await bootstrapLocalRuntimeEnv(repoRoot);
  const passthroughArgs = parseArgs(process.argv.slice(2));
  const targetScript = path.join(repoRoot, "scripts", "run-approved-news-live-branch.mjs");
  const result = spawnSync(process.execPath, [targetScript, ...passthroughArgs], {
    cwd: repoRoot,
    stdio: "inherit",
    encoding: "utf8",
  });

  if (typeof result.status === "number") {
    process.exit(result.status);
  }
  process.exit(1);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
