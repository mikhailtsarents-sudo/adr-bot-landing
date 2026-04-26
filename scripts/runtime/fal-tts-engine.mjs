import { writeFile } from "node:fs/promises";

const FAL_AI_API_KEY = process.env.FAL_AI_API_KEY ?? "";

// MiniMax TTS supports native German voices; Kokoro is English-only fallback.
const MINIMAX_TTS_URL = "https://fal.run/fal-ai/minimax-tts/text-to-speech";
const KOKORO_TTS_URL = "https://fal.run/fal-ai/kokoro";

// Default: German_Calm_Man (MiniMax). Override via FAL_TTS_VOICE env var.
// Kokoro fallback voice controlled by FAL_TTS_VOICE_KOKORO.
export const DEFAULT_FAL_TTS_VOICE = process.env.FAL_TTS_VOICE ?? "German_Calm_Man";
const KOKORO_FALLBACK_VOICE = process.env.FAL_TTS_VOICE_KOKORO ?? "am_adam";

// Provider is auto-detected from voice name: German_* / Confident_* etc → MiniMax; else Kokoro.
function isMiniMaxVoice(voice) {
  return /^(German|English|French|Spanish|Chinese|Japanese|Korean)/i.test(voice);
}

function text(value) {
  return value == null ? "" : String(value).trim();
}

async function callTTS(apiKey, scriptText, voice) {
  const useMiniMax = isMiniMaxVoice(voice);
  const url = useMiniMax ? MINIMAX_TTS_URL : KOKORO_TTS_URL;
  const body = useMiniMax
    ? { text: scriptText, voice_id: voice }
    : { prompt: scriptText, voice, speed: 0.95 };

  const response = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Key ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`fal.ai TTS (${useMiniMax ? "minimax" : "kokoro"}) HTTP ${response.status}: ${err.slice(0, 200)}`);
  }

  const json = await response.json();
  const audioUrl = text(json?.audio?.url ?? json?.audio_url ?? "");
  if (!audioUrl) {
    throw new Error(`fal.ai TTS response missing audio URL: ${JSON.stringify(json).slice(0, 200)}`);
  }
  return audioUrl;
}

/**
 * Synthesizes speech via fal.ai MiniMax TTS (German) or Kokoro (fallback).
 * Returns true on success, false if the key or script is missing, throws on API errors.
 */
export async function synthesizeVoiceoverToFile(outputPath, scriptText, voice = DEFAULT_FAL_TTS_VOICE) {
  const apiKey = text(FAL_AI_API_KEY);
  if (!apiKey || !text(scriptText)) {
    return false;
  }

  let audioUrl;
  try {
    audioUrl = await callTTS(apiKey, scriptText, voice);
  } catch (primaryErr) {
    // Fallback to Kokoro if MiniMax fails
    if (isMiniMaxVoice(voice)) {
      console.warn(`[tts-engine] MiniMax failed (${primaryErr.message}), falling back to Kokoro`);
      audioUrl = await callTTS(apiKey, scriptText, KOKORO_FALLBACK_VOICE);
    } else {
      throw primaryErr;
    }
  }

  const audioResponse = await fetch(audioUrl);
  if (!audioResponse.ok) {
    throw new Error(`fal.ai TTS audio download failed: ${audioResponse.status}`);
  }

  const buffer = Buffer.from(await audioResponse.arrayBuffer());
  if (buffer.length === 0) {
    throw new Error("fal.ai TTS returned an empty audio buffer.");
  }

  await writeFile(outputPath, buffer);
  return true;
}
