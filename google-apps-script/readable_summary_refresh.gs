const READABLE_SUMMARY_SHEET_NAME = "Понятная сводка";
const DEFAULT_TIMEZONE = "Europe/Berlin";
const DEFAULT_SITE_DASHBOARD_URL = "https://www.adr-bot.de/api/analytics/dashboard.json?limit=2000";
const DEFAULT_BOT_FUNNEL_DASHBOARD_URL =
  "https://www.adr-bot.de/api/analytics/bot-funnel.json?limit=2000";

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu("ADR Summary")
    .addItem("Refresh readable summary", "refreshReadableSummary")
    .addItem("Install hourly refresh", "installReadableSummaryTrigger")
    .addToUi();
}

function refreshReadableSummary() {
  const props = PropertiesService.getScriptProperties();
  const timeZone = props.getProperty("READABLE_SUMMARY_TIMEZONE") || DEFAULT_TIMEZONE;
  const siteDashboardUrl =
    props.getProperty("ADR_SITE_ANALYTICS_DASHBOARD_URL") || DEFAULT_SITE_DASHBOARD_URL;
  const botFunnelDashboardUrl =
    props.getProperty("ADR_BOT_FUNNEL_DASHBOARD_URL") || DEFAULT_BOT_FUNNEL_DASHBOARD_URL;

  const now = new Date();
  const refreshedAt = formatDateTime_(now, timeZone);

  const siteResult = fetchSiteDashboard_(siteDashboardUrl);
  const botFunnelResult = fetchBotFunnelDashboard_(botFunnelDashboardUrl);

  const sheet = getOrCreateReadableSummarySheet_();
  sheet.clear();

  const rows = buildReadableSummaryRows_({
    refreshedAt,
    timeZone,
    siteResult,
    botFunnelResult,
  });

  sheet.getRange(1, 1, rows.length, rows[0].length).setValues(rows);
  applyReadableSummaryFormatting_(sheet, rows.length);
}

function installReadableSummaryTrigger() {
  const triggers = ScriptApp.getProjectTriggers();
  for (let i = 0; i < triggers.length; i += 1) {
    const trigger = triggers[i];
    if (trigger.getHandlerFunction() === "refreshReadableSummary") {
      ScriptApp.deleteTrigger(trigger);
    }
  }

  ScriptApp.newTrigger("refreshReadableSummary")
    .timeBased()
    .everyHours(1)
    .create();
}

function fetchSiteDashboard_(url) {
  try {
    const response = UrlFetchApp.fetch(url, {
      method: "get",
      muteHttpExceptions: true,
      headers: { Accept: "application/json" },
    });
    const payload = JSON.parse(response.getContentText() || "{}");
    if (response.getResponseCode() !== 200 || !payload.ok || !payload.dashboard) {
      return {
        ok: false,
        error: payload.error || "site_dashboard_unavailable",
        dashboard: null,
      };
    }
    return {
      ok: true,
      error: "",
      dashboard: payload.dashboard,
    };
  } catch (error) {
    return {
      ok: false,
      error: String(error && error.message ? error.message : error),
      dashboard: null,
    };
  }
}

function fetchBotFunnelDashboard_(url) {
  try {
    const response = UrlFetchApp.fetch(url, {
      method: "get",
      muteHttpExceptions: true,
      headers: { Accept: "application/json" },
    });
    const payload = JSON.parse(response.getContentText() || "{}");
    if (response.getResponseCode() !== 200 || !payload.ok || !payload.dashboard) {
      return {
        ok: false,
        error: payload.error || "bot_funnel_dashboard_unavailable",
        dashboard: emptyBotFunnelDashboard_(),
      };
    }
    return {
      ok: true,
      error: "",
      dashboard: payload.dashboard,
    };
  } catch (error) {
    return {
      ok: false,
      error: String(error && error.message ? error.message : error),
      dashboard: emptyBotFunnelDashboard_(),
    };
  }
}

function emptyBotFunnelDashboard_() {
  return {
    refreshed_at: "",
    timezone: DEFAULT_TIMEZONE,
    total_events: 0,
    total_events_30d: 0,
    periods: [],
    period_map: {
      today: emptyBotFunnelPeriod_("today", "Сегодня", 1),
      days_7: emptyBotFunnelPeriod_("days_7", "7 дней", 7),
      days_30: emptyBotFunnelPeriod_("days_30", "30 дней", 30),
    },
    funnel_30d: [],
    referral_30d: {
      granted: 0,
      rejected: 0,
      grant_rate: 0,
      offer_views: 0,
      unlock_clicks: 0,
      counted_screens: 0,
      duplicate_screens: 0,
      top_referrers_30d: [],
      rejection_reasons_30d: [],
      grant_variants_30d: [],
    },
    reminder_30d: {
      sent: 0,
      clicked: 0,
      snoozed: 0,
      reactivated: 0,
      opted_out: 0,
      delivery_failed: 0,
      click_rate: 0,
      reactivation_rate: 0,
    },
    reminder_state: {
      total_users: 0,
      normal_users: 0,
      rare_users: 0,
      dormant_users: 0,
      disabled_users: 0,
      exam_mode_users: 0,
      snoozed_users: 0,
      language_override_users: 0,
      reminder_modes: [],
      reminder_segments: [],
      reminder_languages: [],
    },
    reminder_phase12_30d: {
      cadence_modifiers: [],
      weak_tracks: [],
      preferred_hours: [],
    },
    top_sources_30d: [],
    top_kurs_30d: [],
    event_mix_30d: [],
    youtube_starts_30d: 0,
    direct_starts_30d: 0,
  };
}

function emptyBotFunnelPeriod_(periodKey, labelRu, windowDays) {
  return {
    period_key: periodKey,
    label_ru: labelRu,
    window_days: windowDays,
    since: "",
    until: "",
    total_events: 0,
    bot_starts: 0,
    course_selected: 0,
    first_actions: 0,
    learning_actions: 0,
    buy_intent: 0,
    referral_granted: 0,
    referral_rejected: 0,
    reminder_sent: 0,
    reminder_clicked: 0,
    reminder_snoozed: 0,
    reminder_reactivated: 0,
    reminder_opted_out: 0,
    reminder_delivery_failed: 0,
    start_to_first_action_rate: 0,
    start_to_buy_intent_rate: 0,
    reminder_click_rate: 0,
    reminder_reactivation_rate: 0,
  };
}

function buildReadableSummaryRows_(context) {
  const rows = [];
  const siteDashboard = context.siteResult.dashboard || {};
  const botFunnelDashboard = context.botFunnelResult.dashboard || emptyBotFunnelDashboard_();
  const siteToday = safePath_(siteDashboard, ["period_map", "today"]) || {};
  const site7d = safePath_(siteDashboard, ["period_map", "days_7"]) || {};
  const site30d = safePath_(siteDashboard, ["period_map", "days_30"]) || {};
  const botToday = safePath_(botFunnelDashboard, ["period_map", "today"]) || emptyBotFunnelPeriod_("today", "Сегодня", 1);
  const bot7d = safePath_(botFunnelDashboard, ["period_map", "days_7"]) || emptyBotFunnelPeriod_("days_7", "7 дней", 7);
  const bot30d = safePath_(botFunnelDashboard, ["period_map", "days_30"]) || emptyBotFunnelPeriod_("days_30", "30 дней", 30);
  const funnel30d = botFunnelDashboard.funnel_30d || [];
  const referral30d = botFunnelDashboard.referral_30d || {};
  const reminder30d = botFunnelDashboard.reminder_30d || {};
  const reminderState = botFunnelDashboard.reminder_state || {};
  const reminderPhase12 = botFunnelDashboard.reminder_phase12_30d || {};
  const sourceCounts30d = botFunnelDashboard.top_sources_30d || [];
  const eventMix30d = botFunnelDashboard.event_mix_30d || [];
  const topKurs30d = botFunnelDashboard.top_kurs_30d || [];

  rows.push(["Понятная сводка", context.refreshedAt, "", "", "", "", ""]);
  rows.push([
    "Статус refresh",
    buildStatusLine_(context.siteResult.ok, context.botFunnelResult.ok),
    "",
    "",
    "",
    "",
    "",
  ]);
  rows.push([
    "Сайт",
    context.siteResult.ok ? "живые данные" : "ошибка",
    context.siteResult.error || "",
    "Бот funnel",
    context.botFunnelResult.ok ? "живые данные" : "ошибка",
    context.botFunnelResult.error || "",
    "",
  ]);
  rows.push(["", "", "", "", "", "", ""]);

  rows.push([
    "Период",
    "Сайт: просмотры",
    "Сайт: CTA",
    "Сайт: переходы",
    "Bot: /start",
    "Bot: первое действие",
    "Bot: buy intent",
  ]);
  rows.push([
    "Сегодня",
    number_(siteToday.site_page_views),
    number_(siteToday.telegram_cta_clicks),
    number_(siteToday.telegram_redirects),
    number_(botToday.bot_starts),
    number_(botToday.first_actions),
    number_(botToday.buy_intent),
  ]);
  rows.push([
    "7 дней",
    number_(site7d.site_page_views),
    number_(site7d.telegram_cta_clicks),
    number_(site7d.telegram_redirects),
    number_(bot7d.bot_starts),
    number_(bot7d.first_actions),
    number_(bot7d.buy_intent),
  ]);
  rows.push([
    "30 дней",
    number_(site30d.site_page_views),
    number_(site30d.telegram_cta_clicks),
    number_(site30d.telegram_redirects),
    number_(bot30d.bot_starts),
    number_(bot30d.first_actions),
    number_(bot30d.buy_intent),
  ]);
  rows.push(["", "", "", "", "", "", ""]);

  rows.push([
    "Measurement reconciliation",
    "Сегодня",
    "7 дней",
    "30 дней",
    "",
    "",
    "",
  ]);
  rows.push([
    "Views -> CTA",
    percent_(ratio_(siteToday.telegram_cta_clicks, siteToday.site_page_views)),
    percent_(ratio_(site7d.telegram_cta_clicks, site7d.site_page_views)),
    percent_(ratio_(site30d.telegram_cta_clicks, site30d.site_page_views)),
    "",
    "",
    "",
  ]);
  rows.push([
    "CTA -> redirect",
    percent_(ratio_(siteToday.telegram_redirects, siteToday.telegram_cta_clicks)),
    percent_(ratio_(site7d.telegram_redirects, site7d.telegram_cta_clicks)),
    percent_(ratio_(site30d.telegram_redirects, site30d.telegram_cta_clicks)),
    "",
    "",
    "",
  ]);
  rows.push([
    "Redirect -> /start",
    percent_(ratio_(botToday.bot_starts, siteToday.telegram_redirects)),
    percent_(ratio_(bot7d.bot_starts, site7d.telegram_redirects)),
    percent_(ratio_(bot30d.bot_starts, site30d.telegram_redirects)),
    "",
    "",
    "",
  ]);
  rows.push([
    "/start -> first action",
    percent_(ratio_(botToday.first_actions, botToday.bot_starts)),
    percent_(ratio_(bot7d.first_actions, bot7d.bot_starts)),
    percent_(ratio_(bot30d.first_actions, bot30d.bot_starts)),
    "",
    "",
    "",
  ]);
  rows.push([
    "First action -> buy intent",
    percent_(ratio_(botToday.buy_intent, botToday.first_actions)),
    percent_(ratio_(bot7d.buy_intent, bot7d.first_actions)),
    percent_(ratio_(bot30d.buy_intent, bot30d.first_actions)),
    "",
    "",
    "",
  ]);
  rows.push([
    "Redirect minus /start",
    number_(siteToday.telegram_redirects - botToday.bot_starts),
    number_(site7d.telegram_redirects - bot7d.bot_starts),
    number_(site30d.telegram_redirects - bot30d.bot_starts),
    "",
    "",
    "",
  ]);
  rows.push(["", "", "", "", "", "", ""]);

  rows.push([
    "Bot funnel operator panel",
    "Сегодня",
    "7 дней",
    "30 дней",
    "",
    "",
    "",
  ]);
  rows.push([
    "Все bot-события",
    number_(botToday.total_events),
    number_(bot7d.total_events),
    number_(bot30d.total_events),
    "",
    "",
    "",
  ]);
  rows.push([
    "Выбор курса",
    number_(botToday.course_selected),
    number_(bot7d.course_selected),
    number_(bot30d.course_selected),
    "",
    "",
    "",
  ]);
  rows.push([
    "Первое действие",
    number_(botToday.first_actions),
    number_(bot7d.first_actions),
    number_(bot30d.first_actions),
    "",
    "",
    "",
  ]);
  rows.push([
    "Учебные ответы",
    number_(botToday.learning_actions),
    number_(bot7d.learning_actions),
    number_(bot30d.learning_actions),
    "",
    "",
    "",
  ]);
  rows.push([
    "Buy intent",
    number_(botToday.buy_intent),
    number_(bot7d.buy_intent),
    number_(bot30d.buy_intent),
    "",
    "",
    "",
  ]);
  rows.push([
    "Start -> первое действие",
    percent_(botToday.start_to_first_action_rate),
    percent_(bot7d.start_to_first_action_rate),
    percent_(bot30d.start_to_first_action_rate),
    "",
    "",
    "",
  ]);
  rows.push([
    "Start -> buy intent",
    percent_(botToday.start_to_buy_intent_rate),
    percent_(bot7d.start_to_buy_intent_rate),
    percent_(bot30d.start_to_buy_intent_rate),
    "",
    "",
    "",
  ]);
  rows.push(["", "", "", "", "", "", ""]);

  rows.push([
    "Reminder operator panel",
    "Сегодня",
    "7 дней",
    "30 дней",
    "",
    "",
    "",
  ]);
  rows.push([
    "Reminder sent",
    number_(botToday.reminder_sent),
    number_(bot7d.reminder_sent),
    number_(bot30d.reminder_sent),
    "",
    "",
    "",
  ]);
  rows.push([
    "Reminder clicked",
    number_(botToday.reminder_clicked),
    number_(bot7d.reminder_clicked),
    number_(bot30d.reminder_clicked),
    "",
    "",
    "",
  ]);
  rows.push([
    "Reminder snoozed",
    number_(botToday.reminder_snoozed),
    number_(bot7d.reminder_snoozed),
    number_(bot30d.reminder_snoozed),
    "",
    "",
    "",
  ]);
  rows.push([
    "Reminder reactivated",
    number_(botToday.reminder_reactivated),
    number_(bot7d.reminder_reactivated),
    number_(bot30d.reminder_reactivated),
    "",
    "",
    "",
  ]);
  rows.push([
    "Reminder opt-out",
    number_(botToday.reminder_opted_out),
    number_(bot7d.reminder_opted_out),
    number_(bot30d.reminder_opted_out),
    "",
    "",
    "",
  ]);
  rows.push([
    "Reminder delivery failed",
    number_(botToday.reminder_delivery_failed),
    number_(bot7d.reminder_delivery_failed),
    number_(bot30d.reminder_delivery_failed),
    "",
    "",
    "",
  ]);
  rows.push([
    "Reminder click rate",
    percent_(botToday.reminder_click_rate),
    percent_(bot7d.reminder_click_rate),
    percent_(bot30d.reminder_click_rate),
    "",
    "",
    "",
  ]);
  rows.push([
    "Reminder reactivation rate",
    percent_(botToday.reminder_reactivation_rate),
    percent_(bot7d.reminder_reactivation_rate),
    percent_(bot30d.reminder_reactivation_rate),
    "",
    "",
    "",
  ]);
  rows.push(["", "", "", "", "", "", ""]);

  rows.push(["Bot funnel за 30 дней", "Количество", "Drop-off %", "", "", "", ""]);
  if (funnel30d.length === 0) {
    rows.push(["Нет свежих funnel-событий", "", "", "", "", "", ""]);
  } else {
    for (let i = 0; i < funnel30d.length; i += 1) {
      rows.push([
        funnelStepLabelRu_(funnel30d[i].step),
        number_(funnel30d[i].count),
        funnel30d[i].drop_off_pct == null ? "" : number_(funnel30d[i].drop_off_pct),
        "",
        "",
        "",
        "",
      ]);
    }
  }
  rows.push(["", "", "", "", "", "", ""]);

  rows.push(["Reminder summary (30 дней)", "Количество", "", "", "", "", ""]);
  rows.push(["Reminder sent", number_(reminder30d.sent), "", "", "", "", ""]);
  rows.push(["Reminder clicked", number_(reminder30d.clicked), "", "", "", "", ""]);
  rows.push(["Reminder snoozed", number_(reminder30d.snoozed), "", "", "", "", ""]);
  rows.push(["Reminder reactivated", number_(reminder30d.reactivated), "", "", "", "", ""]);
  rows.push(["Reminder opt-out", number_(reminder30d.opted_out), "", "", "", "", ""]);
  rows.push(["Reminder delivery failed", number_(reminder30d.delivery_failed), "", "", "", "", ""]);
  rows.push(["Reminder click rate", percentFromWhole_(reminder30d.click_rate), "", "", "", "", ""]);
  rows.push(["Reminder reactivation rate", percentFromWhole_(reminder30d.reactivation_rate), "", "", "", "", ""]);
  rows.push(["", "", "", "", "", "", ""]);

  rows.push(["Reminder state сейчас", "Количество", "", "", "", "", ""]);
  rows.push(["Всего users", number_(reminderState.total_users), "", "", "", "", ""]);
  rows.push(["Normal mode", number_(reminderState.normal_users), "", "", "", "", ""]);
  rows.push(["Rare mode", number_(reminderState.rare_users), "", "", "", "", ""]);
  rows.push(["Dormant", number_(reminderState.dormant_users), "", "", "", "", ""]);
  rows.push(["Disabled", number_(reminderState.disabled_users), "", "", "", "", ""]);
  rows.push(["Exam mode", number_(reminderState.exam_mode_users), "", "", "", "", ""]);
  rows.push(["Snoozed now", number_(reminderState.snoozed_users), "", "", "", "", ""]);
  rows.push(["Language override users", number_(reminderState.language_override_users), "", "", "", "", ""]);
  rows.push(["", "", "", "", "", "", ""]);

  rows.push(["Top reminder languages", "Количество", "", "", "", "", ""]);
  if (!(reminderState.reminder_languages || []).length) {
    rows.push(["нет данных", "", "", "", "", "", ""]);
  } else {
    for (let i = 0; i < Math.min(reminderState.reminder_languages.length, 5); i += 1) {
      rows.push([reminderState.reminder_languages[i].source, reminderState.reminder_languages[i].count, "", "", "", "", ""]);
    }
  }
  rows.push(["", "", "", "", "", "", ""]);

  rows.push(["Reminder Phase 12 (30 дней)", "Количество", "", "", "", "", ""]);
  rows.push([
    "Cadence modifiers",
    formatSourceBreakdown_(reminderPhase12.cadence_modifiers || []),
    "",
    "",
    "",
    "",
    "",
  ]);
  rows.push([
    "Weak tracks",
    formatSourceBreakdown_(reminderPhase12.weak_tracks || []),
    "",
    "",
    "",
    "",
    "",
  ]);
  rows.push([
    "Preferred hours",
    formatSourceBreakdown_(reminderPhase12.preferred_hours || []),
    "",
    "",
    "",
    "",
    "",
  ]);
  rows.push(["", "", "", "", "", "", ""]);

  rows.push(["Рефералы и входы (30 дней)", "Количество", "", "", "", "", ""]);
  rows.push(["Referral offer views", number_(referral30d.offer_views), "", "", "", "", ""]);
  rows.push(["Referral unlock clicks", number_(referral30d.unlock_clicks), "", "", "", "", ""]);
  rows.push(["Referral granted", number_(referral30d.granted), "", "", "", "", ""]);
  rows.push(["Referral rejected", number_(referral30d.rejected), "", "", "", "", ""]);
  rows.push(["Referral grant rate", percentFromWhole_(referral30d.grant_rate), "", "", "", "", ""]);
  rows.push(["Referral counted screens", number_(referral30d.counted_screens), "", "", "", "", ""]);
  rows.push(["Referral duplicate screens", number_(referral30d.duplicate_screens), "", "", "", "", ""]);
  rows.push(["YouTube starts", number_(botFunnelDashboard.youtube_starts_30d), "", "", "", "", ""]);
  rows.push(["Direct starts", number_(botFunnelDashboard.direct_starts_30d), "", "", "", "", ""]);
  rows.push(["", "", "", "", "", "", ""]);

  rows.push(["Топ рефереры (30 дней)", "Количество", "", "", "", "", ""]);
  if (!(referral30d.top_referrers_30d || []).length) {
    rows.push(["Нет свежих рефереров", "", "", "", "", "", ""]);
  } else {
    for (let i = 0; i < Math.min(referral30d.top_referrers_30d.length, 10); i += 1) {
      rows.push([referral30d.top_referrers_30d[i].source, referral30d.top_referrers_30d[i].count, "", "", "", "", ""]);
    }
  }
  rows.push(["", "", "", "", "", "", ""]);

  rows.push(["Причины referral reject (30 дней)", "Количество", "", "", "", "", ""]);
  if (!(referral30d.rejection_reasons_30d || []).length) {
    rows.push(["Нет отклонённых рефералов", "", "", "", "", "", ""]);
  } else {
    for (let i = 0; i < Math.min(referral30d.rejection_reasons_30d.length, 10); i += 1) {
      rows.push([referral30d.rejection_reasons_30d[i].source, referral30d.rejection_reasons_30d[i].count, "", "", "", "", ""]);
    }
  }
  rows.push(["", "", "", "", "", "", ""]);

  rows.push(["Источники входа в бот (30 дней)", "Количество", "", "", "", "", ""]);
  if (sourceCounts30d.length === 0) {
    rows.push(["Нет свежих /start-источников", "", "", "", "", "", ""]);
  } else {
    for (let i = 0; i < sourceCounts30d.length; i += 1) {
      rows.push([entrySourceLabelRu_(sourceCounts30d[i].source), sourceCounts30d[i].count, "", "", "", "", ""]);
    }
  }
  rows.push(["", "", "", "", "", "", ""]);

  rows.push(["Состав bot funnel событий (30 дней)", "Количество", "", "", "", "", ""]);
  if (eventMix30d.length === 0) {
    rows.push(["Нет свежих bot funnel событий", "", "", "", "", "", ""]);
  } else {
    for (let i = 0; i < Math.min(eventMix30d.length, 12); i += 1) {
      rows.push([funnelStepLabelRu_(eventMix30d[i].event_type), eventMix30d[i].count, "", "", "", "", ""]);
    }
  }
  rows.push(["", "", "", "", "", "", ""]);

  rows.push(["Top kurs (30 дней)", "Количество", "", "", "", "", ""]);
  if (topKurs30d.length === 0) {
    rows.push(["Нет данных по курсам", "", "", "", "", "", ""]);
  } else {
    for (let i = 0; i < Math.min(topKurs30d.length, 10); i += 1) {
      rows.push([topKurs30d[i].source, topKurs30d[i].count, "", "", "", "", ""]);
    }
  }

  rows.push(["", "", "", "", "", "", ""]);
  rows.push(["Последние site-события", "Время", "Тип", "Источник", "Страница", "", ""]);
  const latestSite = safePath_(siteDashboard, ["latest_events"]) || [];
  if (!latestSite.length) {
    rows.push(["Нет свежих site-событий", "", "", "", "", "", ""]);
  } else {
    for (let i = 0; i < Math.min(latestSite.length, 15); i += 1) {
      const item = latestSite[i];
      rows.push([
        "",
        formatDateTime_(new Date(item.occurred_at), context.timeZone),
        item.event,
        item.source,
        item.page_path,
        "",
        "",
      ]);
    }
  }

  return normalizeRows_(rows, 7);
}

function applyReadableSummaryFormatting_(sheet, rowCount) {
  sheet.setFrozenRows(1);
  sheet.autoResizeColumns(1, 7);
  sheet.getRange(1, 1, 1, 7).setFontWeight("bold").setFontSize(14);
  sheet.getRange(5, 1, 1, 7).setFontWeight("bold");
  sheet.getRange(10, 1, 1, 7).setFontWeight("bold");
  const data = sheet.getRange(1, 1, rowCount, 7);
  data.setVerticalAlignment("middle");
  data.setWrap(true);
}

function getOrCreateReadableSummarySheet_() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = spreadsheet.getSheetByName(READABLE_SUMMARY_SHEET_NAME);
  if (!sheet) {
    sheet = spreadsheet.insertSheet(READABLE_SUMMARY_SHEET_NAME);
  }
  return sheet;
}

function findFunnelStepCount_(rows, step) {
  for (let i = 0; i < rows.length; i += 1) {
    if (rows[i] && rows[i].step === step) {
      return number_(rows[i].count);
    }
  }
  return 0;
}

function buildStatusLine_(siteOk, botOk) {
  if (siteOk && botOk) return "оба источника обновлены";
  if (siteOk && !botOk) return "обновлён только сайт, bot-funnel недоступен";
  if (!siteOk && botOk) return "обновлён только bot-funnel, site-dashboard недоступен";
  return "оба live-источника недоступны";
}

function entrySourceLabelRu_(sourceType) {
  switch (String(sourceType || "")) {
    case "site":
      return "С сайта";
    case "youtube":
      return "Из YouTube";
    case "referral":
      return "По реферальной ссылке";
    case "direct":
      return "Напрямую";
    default:
      return "Неизвестно";
  }
}

function funnelStepLabelRu_(step) {
  switch (String(step || "")) {
    case "bot_started":
      return "/start";
    case "course_selected":
      return "Выбор курса";
    case "word_session_started":
      return "Старт WORD";
    case "quiz_started":
      return "Старт QUIZ";
    case "word_response":
      return "Ответ в WORD";
    case "quiz_answer_submitted":
      return "Ответ в QUIZ";
    case "referral_granted":
      return "Реферал засчитан";
    case "referral_rejected":
      return "Реферал отклонён";
    default:
      return stringOrEmpty_(step);
  }
}

function sortCounts_(counter) {
  return Object.keys(counter)
    .map(function (key) {
      return { key: key, count: counter[key] || 0 };
    })
    .sort(function (left, right) {
      if (right.count !== left.count) return right.count - left.count;
      return left.key.localeCompare(right.key);
    });
}

function normalizeRows_(rows, width) {
  return rows.map(function (row) {
    const next = row.slice(0);
    while (next.length < width) next.push("");
    return next;
  });
}

function safePath_(value, path) {
  let current = value;
  for (let i = 0; i < path.length; i += 1) {
    if (!current) return null;
    current = current[path[i]];
  }
  return current == null ? null : current;
}

function number_(value) {
  return Number(value || 0);
}

function percent_(value) {
  return Math.round(Number(value || 0) * 100) + "%";
}

function percentFromWhole_(value) {
  return Math.round(Number(value || 0)) + "%";
}

function ratio_(numerator, denominator) {
  const num = Number(numerator || 0);
  const den = Number(denominator || 0);
  if (!den) return 0;
  return num / den;
}

function stringOrEmpty_(value) {
  return value == null ? "" : String(value);
}

function formatDateTime_(date, timeZone) {
  return Utilities.formatDate(new Date(date), timeZone || DEFAULT_TIMEZONE, "dd.MM.yyyy HH:mm");
}
