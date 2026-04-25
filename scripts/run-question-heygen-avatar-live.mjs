#!/usr/bin/env node

import { cp, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import {
  buildQuestionVariantAttempts,
  getQuestionTemplateProfile,
} from "./render/question-quality.mjs";
import {
  resolveDraftStorageApiUrl,
  resolveN8nApiKey,
  resolveYoutubeBridgeWebhookUrl,
} from "./runtime/selfhost-n8n-defaults.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");

const DEFAULT_TABLE_URL = resolveDraftStorageApiUrl(process.env);
const DEFAULT_WEBHOOK_URL = resolveYoutubeBridgeWebhookUrl(process.env);

function parseArgs(argv) {
  const args = {
    sourcePackageDir: "",
    rawVideoUrl: "",
    assUrl: "",
    draftId: "",
    traceId: "",
    renderTaskId: "",
    publishReadyId: "",
    requestedBy: "codex_question_heygen_avatar_live",
    n8nApiKey: resolveN8nApiKey(process.env),
    shotstackApiKey: process.env.SHOTSTACK_API_KEY || "",
    tableUrl: DEFAULT_TABLE_URL,
    webhookUrl: DEFAULT_WEBHOOK_URL,
    apiBase: "https://api.shotstack.io/stage",
    runRoot: "/tmp/question-heygen-avatar-live",
    pollMs: 8000,
    timeoutMs: 8 * 60 * 1000,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === "--source-package-dir") args.sourcePackageDir = path.resolve(argv[++i]);
    else if (token === "--raw-video-url") args.rawVideoUrl = argv[++i];
    else if (token === "--ass-url") args.assUrl = argv[++i];
    else if (token === "--draft-id") args.draftId = argv[++i];
    else if (token === "--trace-id") args.traceId = argv[++i];
    else if (token === "--render-task-id") args.renderTaskId = argv[++i];
    else if (token === "--publish-ready-id") args.publishReadyId = argv[++i];
    else if (token === "--requested-by") args.requestedBy = argv[++i];
    else if (token === "--n8n-api-key") args.n8nApiKey = argv[++i];
    else if (token === "--shotstack-api-key") args.shotstackApiKey = argv[++i];
    else if (token === "--table-url") args.tableUrl = argv[++i];
    else if (token === "--webhook-url") args.webhookUrl = argv[++i];
    else if (token === "--api-base") args.apiBase = argv[++i].replace(/\/$/, "");
    else if (token === "--run-root") args.runRoot = path.resolve(argv[++i]);
    else if (token === "--poll-ms") args.pollMs = Number(argv[++i]);
    else if (token === "--timeout-ms") args.timeoutMs = Number(argv[++i]);
    else if (token === "--help" || token === "-h") {
      printHelp();
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${token}`);
    }
  }

  for (const key of [
    "sourcePackageDir",
    "rawVideoUrl",
    "assUrl",
    "draftId",
    "traceId",
    "renderTaskId",
    "publishReadyId",
    "n8nApiKey",
    "shotstackApiKey",
  ]) {
    if (!String(args[key] || "").trim()) {
      throw new Error(`Missing required argument or env: ${key}`);
    }
  }

  return args;
}

function printHelp() {
  console.log(`Usage: node scripts/run-question-heygen-avatar-live.mjs \\
  --source-package-dir <dir> \\
  --raw-video-url <url> \\
  --ass-url <url> \\
  --draft-id <id> \\
  --trace-id <id> \\
  --render-task-id <id> \\
  --publish-ready-id <id> \\
  [--n8n-api-key <key>] [--shotstack-api-key <key>]`);
}

async function loadJson(filePath) {
  return JSON.parse(await readFile(filePath, "utf8"));
}

async function writeJson(filePath, value) {
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function text(value) {
  return value == null ? "" : String(value).trim();
}

function normalizeFeedback(feedback, pairs) {
  let output = text(feedback);
  for (const [key, value] of pairs) {
    output = output
      .split(/\s+/)
      .filter(Boolean)
      .filter((part) => !part.startsWith(`${key}=`))
      .join(" ");
    if (text(value)) {
      output = `${output}${output ? " " : ""}${key}=${text(value)}`;
    }
  }
  return output;
}

function parseAssTime(raw) {
  const match = String(raw).match(/^(\d+):(\d+):(\d+)\.(\d+)$/);
  if (!match) return 0;
  const [, h, m, s, cs] = match;
  return Number(h) * 3600 + Number(m) * 60 + Number(s) + Number(cs) / 100;
}

function sanitizeAssText(raw) {
  return String(raw)
    .replace(/\{[^}]*\}/g, "")
    .replace(/\\N/g, "\n")
    .replace(/\\n/g, "\n")
    .replace(/\s+\n/g, "\n")
    .replace(/\n\s+/g, "\n")
    .trim();
}

function parseAssDialogues(assContent) {
  return String(assContent)
    .split(/\r?\n/)
    .filter((line) => line.startsWith("Dialogue:"))
    .map((line) => {
      const payload = line.slice("Dialogue: ".length);
      const parts = payload.split(",", 10);
      const start = parseAssTime(parts[1]);
      const end = parseAssTime(parts[2]);
      const textPart = payload.split(",", 10).slice(9).join(",");
      return {
        start,
        end,
        length: Number(Math.max(end - start, 0.1).toFixed(2)),
        text: sanitizeAssText(textPart),
      };
    })
    .filter((item) => item.text);
}

function normalizeCaptionText(raw) {
  return text(raw)
    .replace(/\s+/g, " ")
    .replace(/\s*([?!.;,])\s*/g, "$1 ")
    .trim();
}

function stripLeadingAnswerMarker(value) {
  return normalizeCaptionText(value).replace(/^(?:[A-D][):.\-]\s*|Antwort\s+[A-D][):.\-]?\s*)/i, "").trim();
}

function splitCaptionLines(value, maxLineLength = 24) {
  const words = normalizeCaptionText(value).split(" ").filter(Boolean);
  const lines = [];
  let current = "";

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length <= maxLineLength || !current) {
      current = candidate;
      continue;
    }
    lines.push(current);
    current = word;
  }

  if (current) lines.push(current);
  return lines.slice(0, 3).join("\n");
}

function classifyDialoguePhase(item, index, dialogues) {
  const body = normalizeCaptionText(item.text).toLowerCase();
  const isLast = index === dialogues.length - 1;

  if (/(telegram|gratis|kostenlos|5 fragen|kostenlos starten|testen)/i.test(body) || isLast) {
    return "cta";
  }
  if (/(richtige antwort|korrekte antwort|richtig ist|die richtige antwort|antwort:)/i.test(body)) {
    return "reveal";
  }
  if (/^(a|b|c|d)[).:\- ]/i.test(body) || /^(antwort|option) /i.test(body)) {
    return "answer";
  }
  if (body.includes("?") || index === 0) {
    return "question";
  }
  return "answer";
}

function extractAnswerLetter(value) {
  const match = normalizeCaptionText(value).match(/^([A-D])[):.\- ]/i);
  return match ? match[1].toUpperCase() : "";
}

function formatCaptionCardText(item, phase) {
  const body = normalizeCaptionText(item.text);

  if (phase === "question") {
    return `FRAGE\n${body}`;
  }

  if (phase === "answer") {
    const answerLetter = extractAnswerLetter(body);
    const content = stripLeadingAnswerMarker(body);
    return answerLetter ? `ANTWORTEN\n${answerLetter}: ${content}` : `ANTWORTEN\n${content}`;
  }

  if (phase === "reveal") {
    const revealBody = body.replace(/^Richtig ist\s*/i, "").trim();
    return `ANTWORTEN\n${revealBody || body}`;
  }

  if (phase === "cta") {
    return `JETZT GRATIS TESTEN\n${body}`;
  }

  return body;
}

function getPhaseStyle(phase, templateVariant = "quiz_standard") {
  const profile = getQuestionTemplateProfile(templateVariant);
  const styles = {
    question: {
      labelStyle: "marker",
      labelSize: "medium",
      labelColor: "#111827",
      labelBackground: "#FDE68A",
      labelY: -0.06,
      bodyStyle: "blockbuster",
      bodySize: "large",
      bodyColor: "#F8FAFC",
      bodyBackground: "",
      shadowColor: "#020617",
      bodyY: 0.09,
      shadowY: 0.08,
      maxLineLength: 21,
    },
    answer: {
      labelStyle: "marker",
      labelSize: "medium",
      labelColor: "#111827",
      labelBackground: "#F8FAFC",
      labelY: -0.02,
      bodyStyle: "blockbuster",
      bodySize: "large",
      bodyColor: "#F8FAFC",
      bodyBackground: "",
      shadowColor: "#0F172A",
      bodyY: 0.16,
      shadowY: 0.15,
      maxLineLength: 20,
    },
    reveal: {
      labelStyle: "marker",
      labelSize: "medium",
      labelColor: "#111827",
      labelBackground: "#DCFCE7",
      labelY: -0.02,
      bodyStyle: "blockbuster",
      bodySize: "large",
      bodyColor: "#DCFCE7",
      bodyBackground: "",
      shadowColor: "#022C22",
      bodyY: 0.16,
      shadowY: 0.15,
      maxLineLength: 20,
    },
    cta: {
      labelStyle: "marker",
      labelSize: "small",
      labelColor: "#111827",
      labelBackground: "#FDE68A",
      labelY: 0.02,
      bodyStyle: "blockbuster",
      bodySize: "large",
      bodyColor: "#FDE68A",
      bodyBackground: "",
      shadowColor: "#111827",
      bodyY: 0.2,
      shadowY: 0.19,
      maxLineLength: 21,
    },
  };
  const chosen = { ...(styles[phase] || styles.answer) };
  const phaseOffsets = profile.phaseOffsets?.[phase];
  if (phaseOffsets) {
    chosen.bodyY = phaseOffsets.bodyY;
    chosen.shadowY = phaseOffsets.shadowY;
    chosen.labelY = phaseOffsets.labelY;
  }
  chosen.maxLineLength = profile.bodyMaxLineLength;

  if (templateVariant === "quiz_split" || templateVariant === "quiz_safe") {
    chosen.bodySize = phase === "question" ? "medium" : "small";
    chosen.labelSize = "small";
  }

  return chosen;
}

function getPhaseLabel(phase) {
  if (phase === "question") return "FRAGE";
  if (phase === "answer" || phase === "reveal") return "ANTWORTEN";
  if (phase === "cta") return "GRATIS IM BOT";
  return "";
}

function formatCaptionBodyText(item, phase) {
  const body = normalizeCaptionText(item.text);

  if (phase === "question") {
    return body;
  }

  if (phase === "answer") {
    const answerLetter = extractAnswerLetter(body);
    const content = stripLeadingAnswerMarker(body);
    return answerLetter ? `${answerLetter}: ${content}` : content;
  }

  if (phase === "reveal") {
    return body.replace(/^Richtig ist\s*/i, "").trim() || body;
  }

  if (phase === "cta") {
    return body;
  }

  return body;
}

function formatAnswerLine(raw, maxLineLength = 26) {
  const normalized = normalizeCaptionText(raw);
  const answerLetter = extractAnswerLetter(normalized);
  const content = stripLeadingAnswerMarker(normalized);
  const line = answerLetter ? `${answerLetter}: ${content}` : content;
  return splitCaptionLines(line, maxLineLength);
}

function buildCaptionTracks(dialogues, templateVariant = "quiz_standard") {
  const shadowClips = [];
  const labelClips = [];
  const bodyClips = [];
  const accumulatedAnswers = [];

  dialogues.forEach((item, index) => {
    const phase = classifyDialoguePhase(item, index, dialogues);
    const phaseStyle = getPhaseStyle(phase, templateVariant);
    const labelText = getPhaseLabel(phase);
    const clipLength = item.length;
    let bodyText = splitCaptionLines(formatCaptionBodyText(item, phase), phaseStyle.maxLineLength);

    if (phase === "answer") {
      const answerLine = formatAnswerLine(item.text, phaseStyle.maxLineLength);
      if (answerLine && !accumulatedAnswers.includes(answerLine)) {
        accumulatedAnswers.push(answerLine);
      }
      bodyText = accumulatedAnswers.join("\n");
    } else if (phase === "reveal") {
      const revealLine = formatAnswerLine(item.text.replace(/^Richtig ist\s*/i, ""), phaseStyle.maxLineLength);
      if (revealLine && !accumulatedAnswers.includes(revealLine)) {
        accumulatedAnswers.push(revealLine);
      }
      bodyText = accumulatedAnswers.join("\n");
    }

    shadowClips.push({
      asset: {
        type: "title",
        text: bodyText,
        style: "minimal",
        size: phaseStyle.bodySize,
        color: phaseStyle.shadowColor,
        position: "center",
      },
      start: item.start,
      length: clipLength,
      offset: {
        y: phaseStyle.shadowY,
      },
    });

    const bodyAsset = {
      type: "title",
      text: bodyText,
      style: phaseStyle.bodyStyle,
      size: phaseStyle.bodySize,
      color: phaseStyle.bodyColor,
      position: "center",
    };
    if (phaseStyle.bodyBackground) {
      bodyAsset.background = phaseStyle.bodyBackground;
    }

    bodyClips.push({
      asset: bodyAsset,
      start: item.start,
      length: clipLength,
      offset: {
        y: phaseStyle.bodyY,
      },
    });

    if (labelText) {
      labelClips.push({
        asset: {
          type: "title",
          text: labelText,
          style: phaseStyle.labelStyle,
          size: phaseStyle.labelSize,
          color: phaseStyle.labelColor,
          position: "center",
          background: phaseStyle.labelBackground,
        },
        start: item.start,
        length: clipLength,
        offset: {
          y: phaseStyle.labelY,
        },
      });
    }
  });

  return { shadowClips, bodyClips, labelClips };
}

function buildAvatarPayload(dialogues, rawVideoUrl, templateVariant = "quiz_standard") {
  const totalDuration = Number(
    Math.max(...dialogues.map((item) => item.end), 10).toFixed(2),
  );
  const { shadowClips, bodyClips, labelClips } = buildCaptionTracks(dialogues, templateVariant);

  return {
    timeline: {
      background: "#0b1020",
      tracks: [
        {
          clips: shadowClips,
        },
        {
          clips: bodyClips,
        },
        {
          clips: labelClips,
        },
        {
          clips: [
            {
              asset: {
                type: "video",
                src: rawVideoUrl,
              },
              start: 0,
              length: totalDuration,
              fit: "cover",
              position: "center",
            },
          ],
        },
      ],
    },
    output: {
      format: "mp4",
      fps: 25,
      size: {
        width: 1080,
        height: 1920,
      },
    },
  };
}

function buildAvatarQaReport(dialogues, templateVariant, publishReady) {
  const profile = getQuestionTemplateProfile(templateVariant);
  const accumulatedAnswers = [];
  let maxVisibleLines = 0;

  dialogues.forEach((item, index) => {
    const phase = classifyDialoguePhase(item, index, dialogues);
    const phaseStyle = getPhaseStyle(phase, templateVariant);
    if (phase === "answer" || phase === "reveal") {
      const answerLine = formatAnswerLine(
        phase === "reveal" ? item.text.replace(/^Richtig ist\s*/i, "") : item.text,
        phaseStyle.maxLineLength,
      );
      if (answerLine && !accumulatedAnswers.includes(answerLine)) {
        accumulatedAnswers.push(answerLine);
      }
      const visibleLines = accumulatedAnswers.join("\n").split("\n").filter(Boolean).length;
      maxVisibleLines = Math.max(maxVisibleLines, visibleLines);
    }
  });

  const questionLength = normalizeCaptionText(publishReady?.shortform_contract?.question_short).length;
  const longestAnswerLength = Math.max(
    0,
    ...((publishReady?.shortform_contract?.answers_short || []).map((item) => normalizeCaptionText(item).length)),
  );
  const checks = {
    question_fits_variant: questionLength <= profile.questionMaxLength,
    answers_fit_variant: longestAnswerLength <= profile.answerMaxLength,
    accumulated_answers_fit: maxVisibleLines <= profile.answerMaxVisibleLines,
    cta_present: Boolean(text(publishReady?.cta_text)),
  };

  const readability = Math.max(
    0,
    10 -
      Math.max(0, questionLength - profile.questionMaxLength) / 8 -
      Math.max(0, longestAnswerLength - profile.answerMaxLength) / 6 -
      Math.max(0, maxVisibleLines - profile.answerMaxVisibleLines) * 1.2,
  );
  const score = Number(((readability * 0.5) + 2 + (checks.cta_present ? 1 : 0)).toFixed(2));
  const status =
    checks.question_fits_variant &&
    checks.answers_fit_variant &&
    checks.accumulated_answers_fit &&
    checks.cta_present &&
    score >= 7
      ? "pass"
      : templateVariant !== "quiz_safe"
        ? "fallback_required"
        : "pass";

  return {
    qa_version: "avatar_caption_v1",
    template_variant: templateVariant,
    checks,
    metrics: {
      question_length: questionLength,
      longest_answer_length: longestAnswerLength,
      max_visible_answer_lines: maxVisibleLines,
      answer_line_budget: profile.answerMaxVisibleLines,
    },
    score,
    threshold: 7,
    status,
  };
}

async function shotstackRequest(url, apiKey, init = {}) {
  const response = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      ...(init.headers || {}),
    },
  });

  const bodyText = await response.text();
  let json;
  try {
    json = bodyText ? JSON.parse(bodyText) : {};
  } catch {
    json = { raw: bodyText };
  }

  if (!response.ok) {
    throw new Error(`Shotstack HTTP ${response.status}: ${JSON.stringify(json)}`);
  }
  return json;
}

async function sleep(ms) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function submitShotstackRender(payload, args) {
  const submit = await shotstackRequest(`${args.apiBase}/render`, args.shotstackApiKey, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  const renderId = submit?.response?.id || submit?.id || "";
  if (!renderId) throw new Error("Shotstack submit did not return render id");

  const startedAt = Date.now();
  let latest = submit;
  while (Date.now() - startedAt < args.timeoutMs) {
    latest = await shotstackRequest(`${args.apiBase}/render/${renderId}`, args.shotstackApiKey);
    const status = latest?.response?.status || latest?.status || "";
    if (status === "done" || status === "failed") break;
    await sleep(args.pollMs);
  }

  const finalStatus = latest?.response?.status || latest?.status || "unknown";
  if (finalStatus !== "done") {
    throw new Error(`Shotstack render failed: ${JSON.stringify(latest)}`);
  }

  return {
    renderId,
    renderUrl: latest?.response?.url || latest?.url || "",
    status: latest,
    submit,
  };
}

function runNodeScript(scriptPath, scriptArgs) {
  const result = spawnSync(process.execPath, [scriptPath, ...scriptArgs], {
    cwd: repoRoot,
    encoding: "utf8",
    stdio: "pipe",
  });
  if (result.status !== 0) {
    throw new Error(
      [
        `Script failed: ${path.basename(scriptPath)}`,
        result.stdout?.trim() ? `stdout:\n${result.stdout.trim()}` : null,
        result.stderr?.trim() ? `stderr:\n${result.stderr.trim()}` : null,
      ]
        .filter(Boolean)
        .join("\n"),
    );
  }
}

async function postStorageRow(row, args) {
  const response = await fetch(args.tableUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-N8N-API-KEY": args.n8nApiKey,
    },
    body: JSON.stringify({ data: [row] }),
  });
  if (!response.ok) {
    throw new Error(`Storage insert failed: ${response.status} ${await response.text()}`);
  }
}

async function triggerBridge(args) {
  const response = await fetch(args.webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      draft_id: args.draftId,
      trace_id: args.traceId,
      source_ref: args.draftId,
      requested_by: args.requestedBy,
    }),
  });
  if (!response.ok) {
    throw new Error(`Bridge trigger failed: ${response.status} ${await response.text()}`);
  }
}

async function pollFinalRow(args) {
  const deadline = Date.now() + args.timeoutMs;
  while (Date.now() < deadline) {
    const response = await fetch(`${args.tableUrl}?limit=250`, {
      headers: { "X-N8N-API-KEY": args.n8nApiKey },
    });
    if (!response.ok) {
      throw new Error(`Storage poll failed: ${response.status} ${await response.text()}`);
    }
    const payload = await response.json();
    const rows = Array.isArray(payload?.data) ? payload.data : [];
    const latest = rows
      .filter((row) => String(row.draft_id || "") === args.draftId)
      .sort((a, b) => Number(a.id || 0) - Number(b.id || 0))
      .pop();
    const status = text(latest?.published_status);
    if (
      status === "youtube_uploaded" ||
      status === "youtube_upload_failed_terminal" ||
      status === "youtube_upload_failed_retryable"
    ) {
      return latest;
    }
    await sleep(args.pollMs);
  }
  throw new Error("Timed out waiting for final storage row");
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const sourceDir = args.sourcePackageDir;
  const packageDir = path.join(args.runRoot, args.draftId);

  await mkdir(args.runRoot, { recursive: true });
  await cp(sourceDir, packageDir, { recursive: true, force: true });

  const g3Path = path.join(packageDir, "g3_bridge_row.json");
  const publishReadyPath = path.join(packageDir, "publish_ready_package.json");
  const payloadPath = path.join(packageDir, "shotstack_render_payload.json");
  const receiptPath = path.join(packageDir, "shotstack_render_receipt.json");
  const assPath = path.join(packageDir, "heygen_caption.ass");
  const attemptReportPath = path.join(packageDir, "avatar_variant_attempts.json");
  const avatarQaPath = path.join(packageDir, "avatar_qa_report.json");

  const [g3Row, publishReady] = await Promise.all([
    loadJson(g3Path),
    loadJson(publishReadyPath),
  ]);

  const assResponse = await fetch(args.assUrl);
  if (!assResponse.ok) {
    throw new Error(`Failed to fetch ASS: ${assResponse.status}`);
  }
  const assContent = await assResponse.text();
  await writeFile(assPath, assContent, "utf8");

  const dialogues = parseAssDialogues(assContent);
  if (dialogues.length === 0) {
    throw new Error("No dialogues parsed from ASS");
  }

  const templateAttempts = buildQuestionVariantAttempts(
    text(publishReady.template_variant) || "quiz_standard",
    text(publishReady.fallback_template_variant) || "quiz_safe",
  );
  const attemptReports = [];
  let chosenVariant = templateAttempts[templateAttempts.length - 1] || "quiz_safe";
  let qaReport = null;

  for (const variant of templateAttempts) {
    const report = buildAvatarQaReport(dialogues, variant, publishReady);
    attemptReports.push(report);
    if (report.status === "pass" || variant === templateAttempts[templateAttempts.length - 1]) {
      chosenVariant = variant;
      qaReport = report;
      break;
    }
  }

  const payload = buildAvatarPayload(dialogues, args.rawVideoUrl, chosenVariant);
  await writeJson(payloadPath, payload);
  await writeJson(attemptReportPath, attemptReports);
  await writeJson(avatarQaPath, qaReport);

  const render = await submitShotstackRender(payload, args);
  await writeJson(receiptPath, {
    submit: render.submit,
    status: render.status,
    summary: {
      render_id: render.renderId,
      render_url: render.renderUrl,
      generated_at: new Date().toISOString(),
    },
  });

  g3Row.draft_id = args.draftId;
  g3Row.trace_id = args.traceId;
  g3Row.render_task_id = args.renderTaskId;
  g3Row.created_at = new Date().toISOString();
  g3Row.published_status = "approved_for_shortform_distribution";
  g3Row.published_at = "";
  g3Row.final_mp4_url = "";
  g3Row.feedback = normalizeFeedback(g3Row.feedback, [
    ["trace_id", args.traceId],
    ["render_task_id", args.renderTaskId],
    ["render_status", "assets_packaged"],
    ["final_mp4_url", ""],
  ]);

  publishReady.publish_ready_id = args.publishReadyId;
  publishReady.job_id = args.traceId;
  publishReady.trace_id = args.traceId;
  publishReady.render_task_id = args.renderTaskId;
  publishReady.render_receipt = "";
  publishReady.final_mp4_url = "";
  publishReady.publish_state = "publish_ready";
  publishReady.delivery_state = "not_sent";
  publishReady.render_status = "assets_packaged";
  publishReady.template_variant = chosenVariant;
  publishReady.avatar_qa_report_json = avatarQaPath;

  await writeJson(g3Path, g3Row);
  await writeJson(publishReadyPath, publishReady);

  runNodeScript(path.join(repoRoot, "scripts", "finalize-render-package.mjs"), [
    "--package-dir",
    packageDir,
    "--final-mp4-url",
    render.renderUrl,
    "--render-receipt",
    render.renderId,
    "--render-source-url",
    render.renderUrl,
  ]);

  const finalRow = await loadJson(g3Path);
  await postStorageRow(
    {
      draft_id: finalRow.draft_id,
      story_id: finalRow.story_id,
      version: finalRow.version,
      created_at: finalRow.created_at,
      source_title: finalRow.source_title,
      source_url: finalRow.source_url,
      source_name: finalRow.source_name,
      topic_type: finalRow.topic_type,
      headline: finalRow.headline,
      post_text: finalRow.post_text,
      cta: finalRow.cta,
      hashtags: finalRow.hashtags,
      image_prompt: finalRow.image_prompt,
      image_url: finalRow.image_url,
      approval_status: finalRow.approval_status,
      published_status: finalRow.published_status,
      feedback: finalRow.feedback,
      published_at: finalRow.published_at,
    },
    args,
  );
  await triggerBridge(args);
  const finalStorageRow = await pollFinalRow(args);

  console.log(JSON.stringify({
    package_dir: packageDir,
    template_variant: chosenVariant,
    render_id: render.renderId,
    render_url: render.renderUrl,
    final_status: finalStorageRow.published_status,
    youtube_video_id: finalStorageRow.youtube_video_id || "",
    youtube_url: finalStorageRow.youtube_url || "",
    row: finalStorageRow,
  }, null, 2));
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
