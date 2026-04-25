// Music Bed Selector — picks a background music track URL based on content family and mood.
//
// Tracks are configured via env vars so they can be swapped without code changes.
// All tracks should be royalty-free MP3/AAC files accessible via HTTP.
//
// To activate music bed:
//   1. Upload royalty-free tracks to VPS: /srv/adr-project/music/
//      - question-intriguing.mp3  (tense, quiz-show energy, ~120-140 BPM)
//      - word-calm.mp3            (ambient, soft, educational, ~80-100 BPM)
//      - news-serious.mp3         (serious, informative, slightly urgent, ~100-110 BPM)
//      - default-neutral.mp3      (generic fallback)
//   2. Set env vars (in VPS .env.local):
//      MUSIC_BED_QUESTION_URL=http://46.225.170.55:8080/music/question-intriguing.mp3
//      MUSIC_BED_WORD_URL=http://46.225.170.55:8080/music/word-calm.mp3
//      MUSIC_BED_NEWS_URL=http://46.225.170.55:8080/music/news-serious.mp3
//      MUSIC_BED_DEFAULT_URL=http://46.225.170.55:8080/music/default-neutral.mp3
//
// Volume guidance:
//   - music-only (no voiceover): use MUSIC_VOLUME_SOLO (default 0.30)
//   - with voiceover: use MUSIC_VOLUME_UNDER (default 0.12)

function text(value) {
  return value == null ? "" : String(value).trim();
}

// Content family → mood
const FAMILY_MOOD = {
  QUESTION: "intriguing",
  WORD: "calm",
  NEWS: "serious",
};

// Mood → env var name
const MOOD_ENV = {
  intriguing: "MUSIC_BED_QUESTION_URL",
  calm: "MUSIC_BED_WORD_URL",
  serious: "MUSIC_BED_NEWS_URL",
};

export const MUSIC_VOLUME_SOLO = Number(process.env.MUSIC_VOLUME_SOLO || "0.30");
export const MUSIC_VOLUME_UNDER = Number(process.env.MUSIC_VOLUME_UNDER || "0.12");

// Returns { url, mood, volume } or null if no track is configured for this family.
// volume is MUSIC_VOLUME_SOLO when no voiceover, MUSIC_VOLUME_UNDER when voiceover present.
export function selectMusicBed(contentFamily, { hasVoiceover = false } = {}) {
  const family = text(contentFamily).toUpperCase();
  const mood = FAMILY_MOOD[family] || null;
  const envKey = mood ? MOOD_ENV[mood] : null;
  const trackUrl =
    text(envKey ? process.env[envKey] : "") ||
    text(process.env.MUSIC_BED_DEFAULT_URL || "");

  if (!trackUrl) return null;

  return {
    url: trackUrl,
    mood: mood || "neutral",
    volume: hasVoiceover ? MUSIC_VOLUME_UNDER : MUSIC_VOLUME_SOLO,
  };
}
