import type { AnalyticsDashboard } from "@/lib/analytics-dashboard";
import type { BotFunnelDashboard } from "@/lib/bot-funnel-dashboard";

export type ReconciliationPeriodKey = "today" | "days_7" | "days_30";

export type ReconciliationPeriodRow = {
  period_key: ReconciliationPeriodKey;
  label_ru: string;
  site_page_views: number;
  site_cta: number;
  site_redirects: number;
  bot_starts: number;
  bot_first_actions: number;
  bot_buy_intent: number;
  views_to_cta_rate: number;
  cta_to_redirect_rate: number;
  redirect_to_start_rate: number;
  start_to_first_action_rate: number;
  first_action_to_buy_intent_rate: number;
  redirect_minus_start: number;
};

export type ReconciliationDashboard = {
  refreshed_at: string;
  timezone: string;
  periods: ReconciliationPeriodRow[];
  period_map: Record<ReconciliationPeriodKey, ReconciliationPeriodRow>;
  summary_30d: {
    largest_gap_step: string;
    largest_gap_value: number;
    redirect_minus_start: number;
    buy_intent_from_redirect_rate: number;
    buy_intent_from_start_rate: number;
  };
};

function number(value: unknown) {
  const parsed = Number(value || 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function roundRate(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Number(value.toFixed(4));
}

function ratio(numerator: number, denominator: number) {
  return denominator > 0 ? numerator / denominator : 0;
}

function buildPeriodRow(
  periodKey: ReconciliationPeriodKey,
  analyticsDashboard: AnalyticsDashboard,
  botDashboard: BotFunnelDashboard,
): ReconciliationPeriodRow {
  const site = analyticsDashboard.period_map[periodKey];
  const bot = botDashboard.period_map[periodKey];
  const siteViews = number(site?.site_page_views);
  const siteCta = number(site?.telegram_cta_clicks);
  const siteRedirects = number(site?.telegram_redirects);
  const botStarts = number(bot?.bot_starts);
  const botFirstActions = number(bot?.first_actions);
  const botBuyIntent = number(bot?.buy_intent);

  return {
    period_key: periodKey,
    label_ru: bot?.label_ru || site?.label_ru || periodKey,
    site_page_views: siteViews,
    site_cta: siteCta,
    site_redirects: siteRedirects,
    bot_starts: botStarts,
    bot_first_actions: botFirstActions,
    bot_buy_intent: botBuyIntent,
    views_to_cta_rate: roundRate(ratio(siteCta, siteViews)),
    cta_to_redirect_rate: roundRate(ratio(siteRedirects, siteCta)),
    redirect_to_start_rate: roundRate(ratio(botStarts, siteRedirects)),
    start_to_first_action_rate: roundRate(ratio(botFirstActions, botStarts)),
    first_action_to_buy_intent_rate: roundRate(ratio(botBuyIntent, botFirstActions)),
    redirect_minus_start: siteRedirects - botStarts,
  };
}

export function buildReconciliationDashboard(
  analyticsDashboard: AnalyticsDashboard,
  botDashboard: BotFunnelDashboard,
): ReconciliationDashboard {
  const periods: ReconciliationPeriodRow[] = [
    buildPeriodRow("today", analyticsDashboard, botDashboard),
    buildPeriodRow("days_7", analyticsDashboard, botDashboard),
    buildPeriodRow("days_30", analyticsDashboard, botDashboard),
  ];

  const period_map = {
    today: periods[0],
    days_7: periods[1],
    days_30: periods[2],
  } satisfies Record<ReconciliationPeriodKey, ReconciliationPeriodRow>;

  const base30 = period_map.days_30;
  const gapCandidates = [
    {
      step: "views_to_cta_gap",
      value: Math.max(0, base30.site_page_views - base30.site_cta),
    },
    {
      step: "cta_to_redirect_gap",
      value: Math.max(0, base30.site_cta - base30.site_redirects),
    },
    {
      step: "redirect_to_start_gap",
      value: Math.max(0, base30.site_redirects - base30.bot_starts),
    },
    {
      step: "start_to_first_action_gap",
      value: Math.max(0, base30.bot_starts - base30.bot_first_actions),
    },
    {
      step: "first_action_to_buy_intent_gap",
      value: Math.max(0, base30.bot_first_actions - base30.bot_buy_intent),
    },
  ].sort((left, right) => right.value - left.value);

  return {
    refreshed_at: new Date().toISOString(),
    timezone: analyticsDashboard.timezone || botDashboard.timezone || "Europe/Berlin",
    periods,
    period_map,
    summary_30d: {
      largest_gap_step: gapCandidates[0]?.step || "",
      largest_gap_value: gapCandidates[0]?.value || 0,
      redirect_minus_start: base30.redirect_minus_start,
      buy_intent_from_redirect_rate: roundRate(ratio(base30.bot_buy_intent, base30.site_redirects)),
      buy_intent_from_start_rate: roundRate(ratio(base30.bot_buy_intent, base30.bot_starts)),
    },
  };
}
