// Optimizes raw voiceover scripts for German TTS synthesis.
// Handles: ADR term pronunciation, natural pauses, digit spelling, conversational tone.
// Uses GPT-4.1-mini for context-aware optimization; falls back to rule-based if GPT fails.

const OPENAI_API_KEY = process.env.OPENAI_API_KEY ?? "";

// ADR terms that TTS mispronounces without special handling.
const PRONUNCIATION_MAP = {
  "ADR": "A-D-R",
  "UN-Nummer": "U-N-Nummer",
  "GHS": "G-H-S",
  "GGVSEB": "G-G-V-S-E-B",
  "IMDG": "I-M-D-G",
  "RID": "R-I-D",
  "IATA": "I-A-T-A",
  "SDR": "S-D-R",
};

// Pattern: UN numbers like 1203, 2814 → "zwölf null drei"
const UN_NUMBER_RE = /\b(\d{4})\b/g;
function spellUnNumber(n) {
  return n.split("").join(" ");
}

// Rule-based optimizer: pronunciation fixes + basic pause insertion.
function applyRuleBasedOptimization(script) {
  let result = script;

  // Replace ADR abbreviations with phonetic forms
  for (const [term, phonetic] of Object.entries(PRONUNCIATION_MAP)) {
    result = result.replaceAll(term, phonetic);
  }

  // Spell out 4-digit UN numbers (e.g. 1203 → 1 2 0 3)
  result = result.replace(UN_NUMBER_RE, (m) => spellUnNumber(m));

  // Add pause after sentence-ending punctuation if missing space
  result = result.replace(/([.!?])([A-ZÄÖÜ])/g, "$1 $2");

  // Convert "Richtig ist:" / "Frage:" patterns to natural spoken form
  result = result.replace(/^Kurze Frage:\s*/i, "Kurze Frage: ");
  result = result.replace(/^Richtig ist:\s*/i, "Richtig: ");

  return result.trim();
}

// GPT-based optimizer for full conversational rewrite.
async function optimizeWithGpt(script, contentFamily) {
  if (!OPENAI_API_KEY || !script) return null;

  const systemPrompt = `You are a German TTS script optimizer for short-form educational videos about ADR (Gefahrguttransport).

Your task: rewrite the given voiceover script to sound natural when spoken aloud by a German TTS voice.

Rules:
1. Keep all factual content — do not change meaning or omit information.
2. Replace abbreviations with phonetic forms: ADR → A-D-R, UN → U-N, GHS → G-H-S.
3. Spell out 4-digit codes digit by digit: 1203 → eins zwei null drei.
4. Add natural pauses using commas and ellipses where a speaker would breathe.
5. Replace formal/written German with conversational spoken German.
6. Shorten overly long compound words if they sound awkward when spoken.
7. Keep total word count similar — do not add new content.
8. Output ONLY the optimized script text, no explanation, no quotes.

Content family: ${contentFamily}`;

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: script },
        ],
        temperature: 0.3,
        max_tokens: 400,
      }),
    });

    if (!response.ok) return null;
    const json = await response.json();
    const optimized = json?.choices?.[0]?.message?.content?.trim();
    return optimized || null;
  } catch {
    return null;
  }
}

/**
 * Optimizes a voiceover script for German TTS.
 * @param {string} script - Raw voiceover script
 * @param {string} contentFamily - "QUESTION" | "WORD" | "NEWS"
 * @param {{ useGpt?: boolean }} options
 * @returns {Promise<string>} Optimized script
 */
export async function optimizeTtsScript(script, contentFamily = "QUESTION", { useGpt = true } = {}) {
  if (!script) return script;

  // Always apply rule-based fixes first
  const ruleBased = applyRuleBasedOptimization(script);

  if (!useGpt) return ruleBased;

  // GPT optimization on top of rule-based
  const gptOptimized = await optimizeWithGpt(ruleBased, contentFamily);
  return gptOptimized || ruleBased;
}
