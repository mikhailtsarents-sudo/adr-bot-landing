const POSITIVE_CALLBACKS = {
  question: "reminder:question",
  word: "reminder:word",
  basiskurs: "reminder:track:bk",
  tank: "reminder:track:tank",
  begriffe: "reminder:track:begriffe",
  snooze: "reminder:snooze",
  rare: "reminder:rare",
  stop: "reminder:stop",
};

const COPY = {
  de: {
    question_prompt: "Ein kurzer ADR-Frage-Check für heute?",
    question_body: "Eine Frage reicht, um wieder in den Lernrhythmus zu kommen.",
    word_prompt: "Ein ADR-Begriff für heute?",
    word_body: "Kurz erklärt, damit die deutschen Formulierungen leichter werden.",
    track_prompt: "Womit ist der Wiedereinstieg heute leichter?",
    track_body: "Du kannst mit Basiskurs, Tank oder nur Begriffen weitermachen.",
    exam_prompt: "Bis zur ADR-Prüfung ist nicht mehr viel Zeit.",
    exam_body: "Heute ist ein kleiner, klarer Schritt besser als ein großer Plan.",
    cta_question: "1 Frage",
    cta_word: "1 Begriff",
    cta_basiskurs: "Basiskurs",
    cta_tank: "Tank",
    cta_begriffe: "Begriffe",
    cta_not_now: "Nicht heute",
    cta_rare: "Seltener erinnern",
    cta_stop: "Erinnerungen aus",
  },
  ru: {
    question_prompt: "Один короткий ADR-вопрос на сегодня?",
    question_body: "Достаточно одного вопроса, чтобы снова войти в ритм.",
    word_prompt: "Один ADR-термин на сегодня?",
    word_body: "Короткое объяснение, чтобы немецкие формулировки стали понятнее.",
    track_prompt: "С чего сегодня удобнее вернуться?",
    track_body: "Можно продолжить через Basiskurs, Tank или просто через Begriffe.",
    exam_prompt: "До ADR-экзамена осталось не так много времени.",
    exam_body: "Сегодня маленький понятный шаг полезнее большого плана.",
    cta_question: "1 вопрос",
    cta_word: "1 Begriff",
    cta_basiskurs: "Basiskurs",
    cta_tank: "Tank",
    cta_begriffe: "Begriffe",
    cta_not_now: "Не сегодня",
    cta_rare: "Реже напоминать",
    cta_stop: "Выключить",
  },
  en: {
    question_prompt: "One short ADR question for today?",
    question_body: "One question is enough to get back into the learning rhythm.",
    word_prompt: "One ADR term for today?",
    word_body: "A quick explanation to make the German wording easier.",
    track_prompt: "What feels easiest to continue with today?",
    track_body: "You can return through Basiskurs, Tank, or just Begriffe.",
    exam_prompt: "Your ADR exam date is getting closer.",
    exam_body: "A small clear step today is better than a big plan.",
    cta_question: "1 question",
    cta_word: "1 term",
    cta_basiskurs: "Basiskurs",
    cta_tank: "Tank",
    cta_begriffe: "Begriffe",
    cta_not_now: "Not today",
    cta_rare: "Remind less",
    cta_stop: "Stop reminders",
  },
  tr: {
    question_prompt: "Bugün kısa bir ADR sorusu?",
    question_body: "Sadece bir soru bile ritme geri dönmek için yeterli.",
    word_prompt: "Bugün bir ADR terimi?",
    word_body: "Almanca ifadeleri daha kolay anlamak için kısa bir açıklama.",
    track_prompt: "Bugün dönmek için en kolay yol hangisi?",
    track_body: "Basiskurs, Tank veya sadece Begriffe ile devam edebilirsin.",
    exam_prompt: "ADR sınav tarihi yaklaşıyor.",
    exam_body: "Bugün küçük ve net bir adım büyük bir plandan daha iyi.",
    cta_question: "1 soru",
    cta_word: "1 terim",
    cta_basiskurs: "Basiskurs",
    cta_tank: "Tank",
    cta_begriffe: "Begriffe",
    cta_not_now: "Bugün değil",
    cta_rare: "Daha seyrek hatırlat",
    cta_stop: "Hatırlatmaları kapat",
  },
};

function text(value) {
  return value == null ? "" : String(value).trim();
}

export function reminderCopy(language) {
  const key = text(language).toLowerCase();
  return COPY[key] || COPY.ru;
}

export function resolveReminderLanguage(candidate) {
  const override = text(candidate.reminder_language_override);
  if (override) return override;

  const profile = typeof candidate.language_profile_json === "string"
    ? JSON.parse(candidate.language_profile_json || "{}")
    : (candidate.language_profile_json || {});
  const scored = Object.entries(profile)
    .map(([lang, score]) => ({ lang: text(lang), score: Number(score || 0) }))
    .filter((entry) => entry.lang && entry.score > 0)
    .sort((left, right) => right.score - left.score);
  if (scored.length >= 1) {
    const total = scored.reduce((sum, entry) => sum + entry.score, 0);
    const first = scored[0];
    const second = scored[1];
    const hasDominance = total > 0 && first.score / total >= 0.6;
    const clearGap = !second || first.score >= second.score * 1.3;
    if (Number(candidate.meaningful_actions_total || 0) >= 5 && (hasDominance || clearGap)) {
      return first.lang;
    }
  }

  return (
    text(candidate.last_meaningful_language) ||
    text(candidate.language_code) ||
    text(candidate.effective_language_code) ||
    "ru"
  );
}

export function inQuietHours(now = new Date()) {
  const hour = Number(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: "Europe/Berlin",
      hour: "2-digit",
      hour12: false,
    }).format(now),
  );
  return hour >= 22 || hour < 8;
}

function daysBetween(now, isoOrDate) {
  const value = isoOrDate ? new Date(isoOrDate) : null;
  if (!value || Number.isNaN(value.getTime())) return Number.POSITIVE_INFINITY;
  return (now.getTime() - value.getTime()) / (24 * 60 * 60 * 1000);
}

function hoursBetween(now, isoOrDate) {
  const value = isoOrDate ? new Date(isoOrDate) : null;
  if (!value || Number.isNaN(value.getTime())) return Number.POSITIVE_INFINITY;
  return (now.getTime() - value.getTime()) / (60 * 60 * 1000);
}

function examDaysLeft(now, dateValue) {
  const raw = text(dateValue);
  if (!raw) return null;
  const target = new Date(`${raw}T12:00:00+02:00`);
  if (Number.isNaN(target.getTime())) return null;
  return Math.floor((target.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
}

export function deriveReminderSegment(candidate) {
  if (candidate.reminder_mode === "rare") return "rare_mode";
  if (candidate.exam_mode_enabled && candidate.exam_date) return "exam_mode";
  if (Number(candidate.meaningful_actions_total || 0) <= 0) return "start_no_action";
  if (candidate.full_access) return "full_access_inactive";
  return "free_inactive";
}

function cadenceDaysForSegment(segment, candidate, now = new Date()) {
  if (segment === "start_no_action") return [1, 4, 10];
  if (segment === "free_inactive") return [5, 14, 30];
  if (segment === "full_access_inactive") return [4, 10, 21];
  if (segment === "rare_mode") return [60];
  if (segment === "exam_mode") {
    const daysLeft = examDaysLeft(now, candidate.exam_date);
    if (daysLeft == null) return [4];
    if (daysLeft < 0) return [];
    if (daysLeft < 7) {
      return [candidate.exam_reminder_intensity === "intensive" ? 1 : 2];
    }
    if (daysLeft < 30) return [2];
    return [4];
  }
  return [5];
}

function baseTimestampForSegment(segment, candidate) {
  if (segment === "start_no_action") return candidate.last_started_at || candidate.first_started_at;
  if (segment === "exam_mode") return candidate.last_exam_reminder_sent_at || candidate.last_meaningful_activity_at || candidate.last_started_at;
  return candidate.last_meaningful_activity_at || candidate.last_started_at || candidate.first_started_at;
}

function reminderTypeForDecision(segment, sequenceStep) {
  if (segment === "rare_mode") return "word_nudge";
  if (segment === "exam_mode") return sequenceStep % 2 === 0 ? "question_nudge" : "word_nudge";
  if (sequenceStep <= 0) return "question_nudge";
  if (sequenceStep === 1) return "word_nudge";
  return "track_choice_nudge";
}

export function decideReminder(candidate, now = new Date()) {
  if (!text(candidate.effective_chat_id || candidate.chat_id)) {
    return { send: false, reason: "missing_chat_id" };
  }
  if (candidate.reminder_mode === "disabled") return { send: false, reason: "disabled" };
  if (candidate.reminder_mode === "dormant") return { send: false, reason: "dormant" };
  if (inQuietHours(now)) return { send: false, reason: "quiet_hours" };

  const snoozeUntil = text(candidate.snooze_until);
  if (snoozeUntil && new Date(snoozeUntil) > now) return { send: false, reason: "snoozed" };

  if (hoursBetween(now, candidate.last_reminder_sent_at) < 72) return { send: false, reason: "recent_reminder" };
  if (Number(candidate.reminder_sent_30d || 0) >= 3 && candidate.reminder_mode !== "rare" && !candidate.exam_mode_enabled) {
    return { send: false, reason: "monthly_cap" };
  }
  if (hoursBetween(now, candidate.last_broadcast_received_at) < 24) return { send: false, reason: "recent_broadcast" };
  if (hoursBetween(now, candidate.last_payment_event_at) < 24) return { send: false, reason: "recent_payment" };

  const segment = deriveReminderSegment(candidate);
  const cadenceDays = cadenceDaysForSegment(segment, candidate, now);
  if (!cadenceDays.length) return { send: false, reason: "no_cadence" };

  const sequenceStep = Math.max(0, Number(candidate.reminder_sequence_step || 0));
  const cadenceIndex = Math.min(sequenceStep, cadenceDays.length - 1);
  const thresholdDays = cadenceDays[cadenceIndex];
  const baseTs = baseTimestampForSegment(segment, candidate);
  const daysSinceBase = daysBetween(now, baseTs);
  if (!Number.isFinite(daysSinceBase) || daysSinceBase < thresholdDays) {
    return { send: false, reason: "not_due_yet" };
  }

  if (
    Number(candidate.ignored_reminders_count || 0) >= 3 &&
    candidate.reminder_mode !== "rare" &&
    segment !== "exam_mode"
  ) {
    return { send: false, reason: "too_many_ignored", promote_to_rare: true };
  }

  const language = resolveReminderLanguage(candidate);
  const reminderType = reminderTypeForDecision(segment, sequenceStep);
  const copy = reminderCopy(language);

  let textBody = "";
  let buttons = [];
  if (reminderType === "question_nudge") {
    textBody = `${copy.question_prompt}\n\n${copy.question_body}`;
    buttons = [
      [{ text: copy.cta_question, callback_data: POSITIVE_CALLBACKS.question }],
      [
        { text: copy.cta_word, callback_data: POSITIVE_CALLBACKS.word },
        { text: copy.cta_not_now, callback_data: POSITIVE_CALLBACKS.snooze },
      ],
    ];
  } else if (reminderType === "word_nudge") {
    textBody = `${segment === "exam_mode" ? copy.exam_prompt : copy.word_prompt}\n\n${segment === "exam_mode" ? copy.exam_body : copy.word_body}`;
    buttons = [
      [{ text: copy.cta_word, callback_data: POSITIVE_CALLBACKS.word }],
      [
        { text: copy.cta_question, callback_data: POSITIVE_CALLBACKS.question },
        { text: copy.cta_not_now, callback_data: POSITIVE_CALLBACKS.snooze },
      ],
    ];
  } else {
    textBody = `${copy.track_prompt}\n\n${copy.track_body}`;
    buttons = [
      [
        { text: copy.cta_basiskurs, callback_data: POSITIVE_CALLBACKS.basiskurs },
        { text: copy.cta_tank, callback_data: POSITIVE_CALLBACKS.tank },
      ],
      [
        { text: copy.cta_begriffe, callback_data: POSITIVE_CALLBACKS.begriffe },
        { text: copy.cta_not_now, callback_data: POSITIVE_CALLBACKS.snooze },
      ],
    ];
  }

  if (sequenceStep >= 2 && segment !== "exam_mode") {
    buttons.push([
      { text: copy.cta_rare, callback_data: POSITIVE_CALLBACKS.rare },
      { text: copy.cta_stop, callback_data: POSITIVE_CALLBACKS.stop },
    ]);
  }

  const nextDays = cadenceDays[Math.min(sequenceStep + 1, cadenceDays.length - 1)] ?? cadenceDays[cadenceDays.length - 1] ?? 60;
  const nextReminderDueAt = new Date(now.getTime() + nextDays * 24 * 60 * 60 * 1000).toISOString();

  return {
    send: true,
    reason: "due",
    segment,
    sequence_step: sequenceStep + 1,
    reminder_type: reminderType,
    reminder_language: language,
    text: textBody,
    reply_markup: { inline_keyboard: buttons },
    next_reminder_due_at: nextReminderDueAt,
    hours_since_meaningful_activity: Number.isFinite(hoursBetween(now, candidate.last_meaningful_activity_at))
      ? Number(hoursBetween(now, candidate.last_meaningful_activity_at).toFixed(2))
      : null,
    days_since_meaningful_activity: Number.isFinite(daysBetween(now, candidate.last_meaningful_activity_at))
      ? Number(daysBetween(now, candidate.last_meaningful_activity_at).toFixed(2))
      : null,
  };
}
