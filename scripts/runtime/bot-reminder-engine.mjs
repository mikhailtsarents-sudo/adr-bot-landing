const POSITIVE_CALLBACKS = {
  question: "reminder:question",
  word: "reminder:word",
  basiskurs: "reminder:track:bk",
  tank: "reminder:track:tank",
  begriffe: "reminder:track:begriffe",
  exam_settings: "reminder:exammenu",
  snooze: "reminder:snooze",
  rare: "reminder:rare",
  stop: "reminder:stop",
};

const COPY = {
  de: {
    question_prompt: "Ein kurzer ADR-Frage-Check für heute?",
    question_body: "Eine Frage reicht, um wieder in den Lernrhythmus zu kommen.",
    question_body_weak_track: "In {track} war es zuletzt etwas schwerer. Eine kurze Frage hilft, ruhig wieder reinzukommen.",
    word_prompt: "Ein ADR-Begriff für heute?",
    word_body: "Kurz erklärt, damit die deutschen Formulierungen leichter werden.",
    track_prompt: "Womit ist der Wiedereinstieg heute leichter?",
    track_body: "Du kannst mit Basiskurs, Tank oder nur Begriffen weitermachen.",
    exam_prompt: "Bis zur ADR-Prüfung ist nicht mehr viel Zeit.",
    exam_body: "Heute ist ein kleiner, klarer Schritt besser als ein großer Plan.",
    exam_body_far: "Noch ist genug Zeit für ruhige kleine Schritte.",
    exam_body_mid: "Jetzt hilft ein kurzer klarer Wieder-Einstieg mehr als Warten.",
    exam_body_near: "Jetzt zählt ein kurzer, konzentrierter Schritt.",
    exam_days_left: "Noch {days} Tage bis zur ADR-Prüfung.",
    cta_question: "1 Frage",
    cta_word: "1 Begriff",
    cta_basiskurs: "Basiskurs",
    cta_tank: "Tank",
    cta_begriffe: "Begriffe",
    cta_exam_settings: "Prüfungsmodus",
    cta_not_now: "Nicht heute",
    cta_rare: "Seltener erinnern",
    cta_stop: "Erinnerungen aus",
  },
  ru: {
    question_prompt: "Один короткий ADR-вопрос на сегодня?",
    question_body: "Достаточно одного вопроса, чтобы снова войти в ритм.",
    question_body_weak_track: "По теме {track} в последнее время было чуть сложнее. Один короткий вопрос поможет спокойно вернуться.",
    word_prompt: "Один ADR-термин на сегодня?",
    word_body: "Короткое объяснение, чтобы немецкие формулировки стали понятнее.",
    track_prompt: "С чего сегодня удобнее вернуться?",
    track_body: "Можно продолжить через Basiskurs, Tank или просто через Begriffe.",
    exam_prompt: "До ADR-экзамена осталось не так много времени.",
    exam_body: "Сегодня маленький понятный шаг полезнее большого плана.",
    exam_body_far: "Времени ещё достаточно для спокойных маленьких шагов.",
    exam_body_mid: "Сейчас короткий понятный возврат полезнее, чем снова откладывать.",
    exam_body_near: "Сейчас важнее короткий и собранный шаг, чем большой план.",
    exam_days_left: "До ADR-экзамена осталось {days} дн.",
    cta_question: "1 вопрос",
    cta_word: "1 Begriff",
    cta_basiskurs: "Basiskurs",
    cta_tank: "Tank",
    cta_begriffe: "Begriffe",
    cta_exam_settings: "Режим экзамена",
    cta_not_now: "Не сегодня",
    cta_rare: "Реже напоминать",
    cta_stop: "Выключить",
  },
  en: {
    question_prompt: "One short ADR question for today?",
    question_body: "One question is enough to get back into the learning rhythm.",
    question_body_weak_track: "{track} looked a bit harder recently. One short question can help you return calmly.",
    word_prompt: "One ADR term for today?",
    word_body: "A quick explanation to make the German wording easier.",
    track_prompt: "What feels easiest to continue with today?",
    track_body: "You can return through Basiskurs, Tank, or just Begriffe.",
    exam_prompt: "Your ADR exam date is getting closer.",
    exam_body: "A small clear step today is better than a big plan.",
    exam_body_far: "There is still enough time for calm small steps.",
    exam_body_mid: "A short clear return now is better than waiting again.",
    exam_body_near: "A short focused step matters more than a big plan now.",
    exam_days_left: "{days} days left until your ADR exam.",
    cta_question: "1 question",
    cta_word: "1 term",
    cta_basiskurs: "Basiskurs",
    cta_tank: "Tank",
    cta_begriffe: "Begriffe",
    cta_exam_settings: "Exam mode",
    cta_not_now: "Not today",
    cta_rare: "Remind less",
    cta_stop: "Stop reminders",
  },
  tr: {
    question_prompt: "Bugün kısa bir ADR sorusu?",
    question_body: "Sadece bir soru bile ritme geri dönmek için yeterli.",
    question_body_weak_track: "{track} son zamanlarda biraz daha zordu. Kısa bir soru sakin şekilde geri dönmene yardımcı olabilir.",
    word_prompt: "Bugün bir ADR terimi?",
    word_body: "Almanca ifadeleri daha kolay anlamak için kısa bir açıklama.",
    track_prompt: "Bugün dönmek için en kolay yol hangisi?",
    track_body: "Basiskurs, Tank veya sadece Begriffe ile devam edebilirsin.",
    exam_prompt: "ADR sınav tarihi yaklaşıyor.",
    exam_body: "Bugün küçük ve net bir adım büyük bir plandan daha iyi.",
    exam_body_far: "Sakin küçük adımlar için hâlâ yeterli zaman var.",
    exam_body_mid: "Şimdi kısa ve net bir dönüş yine ertelemekten daha iyi.",
    exam_body_near: "Şu an büyük bir plandan çok kısa ve odaklı bir adım önemli.",
    exam_days_left: "ADR sınavına {days} gün kaldı.",
    cta_question: "1 soru",
    cta_word: "1 terim",
    cta_basiskurs: "Basiskurs",
    cta_tank: "Tank",
    cta_begriffe: "Begriffe",
    cta_exam_settings: "Sınav modu",
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
  const hour = berlinHour(now);
  return hour >= 22 || hour < 8;
}

function berlinWeekday(now = new Date()) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "Europe/Berlin",
    weekday: "short",
  }).format(now);
}

function berlinHour(now = new Date()) {
  return Number(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: "Europe/Berlin",
      hour: "2-digit",
      hour12: false,
    }).format(now),
  );
}

function berlinMonthDay(now = new Date()) {
  const month = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Berlin", month: "2-digit" }).format(now);
  const day = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Berlin", day: "2-digit" }).format(now);
  return `${month}-${day}`;
}

function berlinYear(now = new Date()) {
  return Number(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: "Europe/Berlin",
      year: "numeric",
    }).format(now),
  );
}

function formatMonthDayFromDate(date) {
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${month}-${day}`;
}

function addUtcDays(date, days) {
  const next = new Date(date.getTime());
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function easterSundayUtc(year) {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(Date.UTC(year, month - 1, day));
}

function germanMovableHolidayMonthDays(year) {
  const easter = easterSundayUtc(year);
  return [
    formatMonthDayFromDate(addUtcDays(easter, -2)), // Karfreitag
    formatMonthDayFromDate(addUtcDays(easter, 1)),  // Ostermontag
    formatMonthDayFromDate(addUtcDays(easter, 39)), // Christi Himmelfahrt
    formatMonthDayFromDate(addUtcDays(easter, 50)), // Pfingstmontag
  ];
}

export function inSoftSkipWindow(now = new Date()) {
  const weekday = berlinWeekday(now);
  const hour = berlinHour(now);
  return (weekday === "Fri" && hour >= 18) || (weekday === "Sat" && hour < 11);
}

export function inHolidaySkipWindow(now = new Date()) {
  const monthDay = berlinMonthDay(now);
  const fixed = ["01-01", "05-01", "10-03", "12-24", "12-25", "12-26", "12-31"];
  const movable = germanMovableHolidayMonthDays(berlinYear(now));
  return [...fixed, ...movable].includes(monthDay);
}

function withinPreferredHourWindow(now, preferredHour, toleranceHours = 2) {
  const hour = Number(preferredHour);
  if (!Number.isFinite(hour) || hour < 0 || hour > 23) return true;
  const currentHour = berlinHour(now);
  const directGap = Math.abs(currentHour - hour);
  const wrappedGap = 24 - directGap;
  return Math.min(directGap, wrappedGap) <= toleranceHours;
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

function roundCadenceDay(value) {
  return Math.max(1, Math.round(value));
}

function weakTrackLabel(rawTrack) {
  const value = text(rawTrack);
  if (!value) return "";
  const mapping = {
    Basiskurs: "Basiskurs",
    Aufbaukurs_Tank: "Tank",
    Aufbaukurs_Klasse1: "Klasse 1",
    Aufbaukurs_Klasse7: "Klasse 7",
    Auffrischungsschulung: "Auffrischung",
  };
  return mapping[value] || value.replaceAll("_", " ");
}

export function deriveCadenceModifier(segment, candidate) {
  if (segment === "exam_mode" || segment === "rare_mode" || segment === "start_no_action") {
    return { modifier: "none", factor: 1 };
  }

  const learning7d = Number(candidate.recent_learning_actions_7d || 0);
  const learning30d = Number(candidate.recent_learning_actions_30d || 0);
  const activeDays7d = Number(candidate.recent_active_days_7d || 0);

  if (learning7d >= 10 || activeDays7d >= 4) {
    return { modifier: "sprint", factor: 1.5 };
  }

  if (learning30d > 0 && learning30d <= 2 && activeDays7d <= 1) {
    return { modifier: "slow_burn", factor: 2 };
  }

  return { modifier: "none", factor: 1 };
}

function cadenceDaysForSegment(segment, candidate, now = new Date()) {
  if (segment === "start_no_action") return [1, 4, 10];
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

  const baseCadence = segment === "full_access_inactive" ? [4, 10, 21] : [5, 14, 30];
  const { factor } = deriveCadenceModifier(segment, candidate);
  if (factor === 1) return baseCadence;
  return baseCadence.map((days) => roundCadenceDay(days * factor));
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

function buildExamText(copy, candidate, now) {
  const daysLeft = examDaysLeft(now, candidate.exam_date);
  const lines = [copy.exam_prompt];
  if (daysLeft != null && daysLeft >= 0) {
    lines.push(copy.exam_days_left.replace("{days}", String(daysLeft)));
  }
  if (daysLeft == null) {
    lines.push(copy.exam_body);
  } else if (daysLeft < 7) {
    lines.push(copy.exam_body_near);
  } else if (daysLeft < 21) {
    lines.push(copy.exam_body_mid);
  } else {
    lines.push(copy.exam_body_far);
  }
  return { text: lines.join("\n\n"), daysLeft };
}

export function decideReminder(candidate, now = new Date()) {
  if (!text(candidate.effective_chat_id || candidate.chat_id)) {
    return { send: false, reason: "missing_chat_id" };
  }
  if (candidate.reminder_mode === "disabled") return { send: false, reason: "disabled" };
  if (candidate.reminder_mode === "dormant") return { send: false, reason: "dormant" };
  if (inQuietHours(now)) return { send: false, reason: "quiet_hours" };
  if (inSoftSkipWindow(now)) return { send: false, reason: "soft_skip_window" };
  if (inHolidaySkipWindow(now)) return { send: false, reason: "holiday_skip" };

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
  const cadenceModifier = deriveCadenceModifier(segment, candidate);

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
  if (
    segment !== "start_no_action" &&
    segment !== "exam_mode" &&
    !withinPreferredHourWindow(now, candidate.preferred_learning_hour_berlin)
  ) {
    return {
      send: false,
      reason: "preferred_hour_window",
      preferred_learning_hour_berlin: Number(candidate.preferred_learning_hour_berlin),
    };
  }

  const language = resolveReminderLanguage(candidate);
  const reminderType = reminderTypeForDecision(segment, sequenceStep);
  const copy = reminderCopy(language);
  const examText = segment === "exam_mode" ? buildExamText(copy, candidate, now) : null;

  let textBody = "";
  let buttons = [];
  const weakTrack = weakTrackLabel(candidate.weak_kurs_30d);
  if (reminderType === "question_nudge") {
    const questionBody =
      weakTrack && Number(candidate.weak_kurs_wrong_answers_30d || 0) > 0
        ? copy.question_body_weak_track.replace("{track}", weakTrack)
        : copy.question_body;
    textBody = segment === "exam_mode"
      ? `${examText.text}\n\n${questionBody}`
      : `${copy.question_prompt}\n\n${questionBody}`;
    buttons = [
      [{ text: copy.cta_question, callback_data: POSITIVE_CALLBACKS.question }],
      [
        { text: copy.cta_word, callback_data: POSITIVE_CALLBACKS.word },
        { text: copy.cta_not_now, callback_data: POSITIVE_CALLBACKS.snooze },
      ],
    ];
  } else if (reminderType === "word_nudge") {
    textBody = segment === "exam_mode"
      ? `${examText.text}\n\n${copy.word_body}`
      : `${copy.word_prompt}\n\n${copy.word_body}`;
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

  if (segment === "exam_mode") {
    buttons.push([
      { text: copy.cta_exam_settings, callback_data: POSITIVE_CALLBACKS.exam_settings },
    ]);
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
    cadence_modifier: cadenceModifier.modifier,
    cadence_days: cadenceDays,
    recent_learning_actions_7d: Number(candidate.recent_learning_actions_7d || 0),
    recent_learning_actions_30d: Number(candidate.recent_learning_actions_30d || 0),
    recent_active_days_7d: Number(candidate.recent_active_days_7d || 0),
    preferred_learning_hour_berlin: Number.isFinite(Number(candidate.preferred_learning_hour_berlin))
      ? Number(candidate.preferred_learning_hour_berlin)
      : null,
    weak_kurs_30d: weakTrack || "",
    weak_kurs_wrong_answers_30d: Number(candidate.weak_kurs_wrong_answers_30d || 0),
    exam_days_left: examText?.daysLeft ?? null,
    exam_intensity: segment === "exam_mode" ? text(candidate.exam_reminder_intensity || "normal") : "",
    hours_since_meaningful_activity: Number.isFinite(hoursBetween(now, candidate.last_meaningful_activity_at))
      ? Number(hoursBetween(now, candidate.last_meaningful_activity_at).toFixed(2))
      : null,
    days_since_meaningful_activity: Number.isFinite(daysBetween(now, candidate.last_meaningful_activity_at))
      ? Number(daysBetween(now, candidate.last_meaningful_activity_at).toFixed(2))
      : null,
  };
}
