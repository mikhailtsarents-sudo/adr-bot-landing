#!/usr/bin/env node

import path from "node:path";
import { fileURLToPath } from "node:url";
import { bootstrapLocalRuntimeEnv } from "./runtime/local-runtime-env.mjs";
import { enableStrictNonInteractiveMode } from "./runtime/non-interactive-mode.mjs";
import { decideReminder } from "./runtime/bot-reminder-engine.mjs";

enableStrictNonInteractiveMode("run-bot-reminder-cycle");

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");

function text(value) {
  return value == null ? "" : String(value).trim();
}

function parseArgs(argv) {
  const args = new Set(argv.slice(2));
  return {
    dryRun: args.has("--dry-run"),
    limit: Number(text(argv.find((entry) => entry.startsWith("--limit=")))?.split("=")[1] || 200),
  };
}

async function readJson(url, apiKey) {
  const response = await fetch(url, {
    headers: {
      "X-ADR-API-KEY": apiKey,
      "Content-Type": "application/json",
    },
  });
  if (!response.ok) {
    throw new Error(`read_failed:${response.status}:${await response.text()}`);
  }
  return response.json();
}

async function postJson(url, apiKey, body) {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "X-ADR-API-KEY": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    throw new Error(`post_failed:${response.status}:${await response.text()}`);
  }
  return response.json();
}

async function sendTelegramMessage(token, chatId, payload) {
  const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text: payload.text,
      reply_markup: payload.reply_markup,
    }),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok || body.ok === false) {
    const errorCode = Number(body.error_code || response.status || 0);
    const description = text(body.description) || `telegram_send_failed_${response.status}`;
    const error = new Error(description);
    error.telegramCode = errorCode;
    throw error;
  }
  return body.result ?? {};
}

async function main() {
  const { dryRun, limit } = parseArgs(process.argv);
  await bootstrapLocalRuntimeEnv(repoRoot);

  const ingestUrl = text(process.env.ADR_INGEST_URL || "http://46.225.170.55:3456").replace(/\/$/, "");
  const apiKey = text(process.env.ADR_INGEST_API_KEY);
  const botToken = text(process.env.TELEGRAM_BOT_TOKEN || process.env.BOT_TOKEN);

  if (!apiKey) {
    throw new Error("ADR_INGEST_API_KEY is required");
  }
  if (!dryRun && !botToken) {
    throw new Error("TELEGRAM_BOT_TOKEN or BOT_TOKEN is required for live sends");
  }

  const candidatesResponse = await readJson(`${ingestUrl}/v1/reminders/candidates?limit=${limit}`, apiKey);
  const candidates = Array.isArray(candidatesResponse.data) ? candidatesResponse.data : [];

  const summary = {
    fetched: candidates.length,
    sent: 0,
    dry_run_due: 0,
    skipped: {},
    promoted_to_rare: 0,
    failed: 0,
  };

  for (const candidate of candidates) {
    const decision = decideReminder(candidate, new Date());
    if (!decision.send) {
      summary.skipped[decision.reason] = (summary.skipped[decision.reason] ?? 0) + 1;
      if (decision.promote_to_rare) {
        summary.promoted_to_rare += 1;
        await postJson(`${ingestUrl}/v1/reminders/state`, apiKey, {
          operation: "reminder_rare",
          user_id: candidate.user_id,
          chat_id: candidate.effective_chat_id || candidate.chat_id,
        });
      }
      continue;
    }

    const eventMetadata = {
      reminder_segment: decision.segment,
      reminder_sequence_step: decision.sequence_step,
      reminder_type: decision.reminder_type,
      reminder_language: decision.reminder_language,
      hours_since_meaningful_activity: decision.hours_since_meaningful_activity,
      days_since_meaningful_activity: decision.days_since_meaningful_activity,
    };

    if (dryRun) {
      summary.dry_run_due += 1;
      console.log(JSON.stringify({
        dry_run: true,
        user_id: candidate.user_id,
        chat_id: candidate.effective_chat_id || candidate.chat_id,
        decision,
      }));
      continue;
    }

    try {
      await sendTelegramMessage(botToken, candidate.effective_chat_id || candidate.chat_id, decision);
      await postJson(`${ingestUrl}/v1/reminders/state`, apiKey, {
        operation: decision.segment === "exam_mode" ? "exam_reminder_sent" : "reminder_sent",
        user_id: candidate.user_id,
        chat_id: candidate.effective_chat_id || candidate.chat_id,
        reminder_segment: decision.segment,
        reminder_sequence_step: decision.sequence_step,
        reminder_type: decision.reminder_type,
        reminder_language_override: "",
        next_reminder_due_at: decision.next_reminder_due_at,
      });
      await postJson(`${ingestUrl}/v1/bot-funnel/event`, apiKey, {
        event_type: "reminder_sent",
        event_name: "reminder_sent",
        user_id: candidate.user_id,
        kurs: candidate.selected_track || "",
        lang: decision.reminder_language,
        entry_source_type: candidate.entry_source_type || "",
        entry_source_token: candidate.entry_source_token || "",
        state_hint: decision.segment,
        metadata_json: JSON.stringify(eventMetadata),
      });
      summary.sent += 1;
    } catch (error) {
      summary.failed += 1;
      const deliveryCode = Number(error.telegramCode || 0);
      await postJson(`${ingestUrl}/v1/reminders/state`, apiKey, {
        operation: "reminder_delivery_failed",
        user_id: candidate.user_id,
        chat_id: candidate.effective_chat_id || candidate.chat_id,
        delivery_code: deliveryCode,
      });
      await postJson(`${ingestUrl}/v1/bot-funnel/event`, apiKey, {
        event_type: "reminder_delivery_failed",
        event_name: "reminder_delivery_failed",
        user_id: candidate.user_id,
        kurs: candidate.selected_track || "",
        lang: decision.reminder_language,
        entry_source_type: candidate.entry_source_type || "",
        entry_source_token: candidate.entry_source_token || "",
        state_hint: decision.segment,
        metadata_json: JSON.stringify({
          ...eventMetadata,
          delivery_code: deliveryCode,
          error: text(error.message),
        }),
      });
    }
  }

  console.log(JSON.stringify(summary, null, 2));
}

main().catch((error) => {
  console.error("[run-bot-reminder-cycle]", error);
  process.exitCode = 1;
});
