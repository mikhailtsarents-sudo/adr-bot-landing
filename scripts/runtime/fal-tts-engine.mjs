import { writeFile } from "node:fs/promises";

const FAL_TTS_URL = process.env.FAL_TTS_URL ?? "https://fal.run/fal-ai/kokoro";
const FAL_AI_API_KEY = process.env.FAL_AI_API_KEY ?? "";

export const DEFAULT_FAL_TTS_VOICE = process.env.FAL_TTS_VOICE ?? "bf_emma";

function text(value) {
  return value == null ? "" : String(value).trim();
}

/**
 * Synthesizes speech via fal.ai Kokoro TTS and writes the MP3 to outputPath.
 * Returns true on success, false if the key or script is missing, throws on API errors.
 */
export async function synthesizeVoiceoverToFile(outputPath, scriptText, voice = DEFAULT_FAL_TTS_VOICE) {
  const apiKey = text(FAL_AI_API_KEY);
  if (!apiKey || !text(scriptText)) {
    return false;
  }

  const response = await fetch(FAL_TTS_URL, {
    method: "POST",
    headers: {
      Authorization: `Key ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      input: scriptText,
      voice,
      speed: 0.95,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`fal.ai TTS request failed with HTTP ${response.status}: ${body.slice(0, 200)}`);
  }

  const json = await response.json();
  const audioUrl = text(json?.audio?.url ?? json?.audio_url ?? "");
  if (!audioUrl) {
    throw new Error(`fal.ai TTS response missing audio URL: ${JSON.stringify(json).slice(0, 200)}`);
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
