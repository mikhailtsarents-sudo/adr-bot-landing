import readline from "node:readline";

const INTERACTIVE_ERROR_MESSAGE = "interactive_mode_not_allowed";

function throwInteractiveModeError(channel = "interactive") {
  const error = new Error(INTERACTIVE_ERROR_MESSAGE);
  error.code = "INTERACTIVE_MODE_NOT_ALLOWED";
  error.channel = channel;
  throw error;
}

function wrapReadlineCreateInterface(originalCreateInterface, channel) {
  return function wrappedCreateInterface(...args) {
    const [options] = args;
    const input = options?.input || args[0];
    if (input === process.stdin || options?.terminal === true) {
      throwInteractiveModeError(channel);
    }
    return originalCreateInterface.apply(this, args);
  };
}

export function logAutonomousDecision(message, details = {}) {
  const suffix = Object.keys(details).length > 0 ? ` ${JSON.stringify(details)}` : "";
  console.log(`[autonomous] ${message}${suffix}`);
}

export function enableStrictNonInteractiveMode(context = "pipeline") {
  if (globalThis.__ADR_STRICT_NON_INTERACTIVE_ENABLED__) {
    return;
  }

  globalThis.__ADR_STRICT_NON_INTERACTIVE_ENABLED__ = true;
  process.env.ADR_STRICT_NON_INTERACTIVE = "true";

  globalThis.prompt = () => throwInteractiveModeError("prompt");
  globalThis.confirm = () => throwInteractiveModeError("confirm");
  globalThis.alert = () => throwInteractiveModeError("alert");

  if (process.stdin) {
    process.stdin.resume = () => throwInteractiveModeError("stdin.resume");
    process.stdin.read = () => throwInteractiveModeError("stdin.read");
    process.stdin.setRawMode = () => throwInteractiveModeError("stdin.setRawMode");
  }

  readline.createInterface = wrapReadlineCreateInterface(readline.createInterface, "readline");

  logAutonomousDecision("strict non-interactive mode enabled", { context });
}
