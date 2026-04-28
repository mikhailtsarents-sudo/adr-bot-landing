import type {
  AnalyticsDashboard,
  ConversionLocaleRow,
} from "@/lib/analytics-dashboard";
import type { BotFunnelDashboard } from "@/lib/bot-funnel-dashboard";

export type OperatorDecisionPriority = {
  key:
    | "site_views_to_cta"
    | "locale_conversion"
    | "bot_activation"
    | "buy_intent"
    | "paywall_followthrough";
  status: "ok" | "warn" | "fail";
  headline: string;
  reason: string;
  metrics: Record<string, number | string | string[]>;
  recommended_actions: string[];
};

export type OperatorDecisionDashboard = {
  refreshed_at: string;
  timezone: string;
  summary: {
    top_priority: OperatorDecisionPriority["key"];
    strongest_locale: string;
    weakest_locales_with_traffic: string[];
    best_cta_source: string;
    recommended_focus: string;
  };
  site: {
    funnel_30d: AnalyticsDashboard["funnel_30d"];
    top_locale_breakdown_30d: AnalyticsDashboard["conversion_control_30d"]["locale_breakdown_30d"];
    top_page_breakdown_30d: AnalyticsDashboard["conversion_control_30d"]["page_breakdown_30d"];
    top_cta_sources_30d: AnalyticsDashboard["conversion_control_30d"]["cta_source_breakdown_30d"];
  };
  bot: {
    starts_30d: number;
    first_actions_30d: number;
    buy_intents_30d: number;
    start_to_first_action_rate: number;
    first_action_to_buy_intent_rate: number;
    start_to_buy_intent_rate: number;
    funnel_30d: BotFunnelDashboard["funnel_30d"];
  };
  monetization: {
    summary_30d: BotFunnelDashboard["monetization_30d"];
    diagnosis_30d: BotFunnelDashboard["monetization_diagnosis_30d"];
  };
  priorities: OperatorDecisionPriority[];
};

function localeRate(row: ConversionLocaleRow) {
  return typeof row.cta_rate_from_views === "number" ? row.cta_rate_from_views : 0;
}

function priorityStatusFromRate(value: number, warnFloor: number, okFloor: number): "ok" | "warn" | "fail" {
  if (value >= okFloor) return "ok";
  if (value >= warnFloor) return "warn";
  return "fail";
}

export function buildOperatorDecisionDashboard(
  analyticsDashboard: AnalyticsDashboard,
  botDashboard: BotFunnelDashboard,
): OperatorDecisionDashboard {
  const localeBreakdown = analyticsDashboard.conversion_control_30d.locale_breakdown_30d;
  const bestLocale = localeBreakdown
    .filter((row) => row.views > 0)
    .sort((left, right) => localeRate(right) - localeRate(left) || right.views - left.views)[0]?.locale || "unknown";
  const weakLocales = localeBreakdown
    .filter((row) => row.views >= 4 && row.cta_clicks === 0)
    .map((row) => row.locale)
    .slice(0, 6);
  const bestCtaSource = analyticsDashboard.conversion_control_30d.cta_source_breakdown_30d[0]?.source || "unknown";

  const bot30d = botDashboard.period_map.days_30;
  const monetization30d = botDashboard.monetization_30d;
  const monetizationDiagnosis30d = botDashboard.monetization_diagnosis_30d;
  const siteFunnel30d = analyticsDashboard.funnel_30d;

  const siteConversionPriority: OperatorDecisionPriority = {
    key: "site_views_to_cta",
    status: priorityStatusFromRate(siteFunnel30d.cta_rate_from_views, 0.05, 0.1),
    headline: "Site visitors still drop before the first Telegram click.",
    reason:
      "The biggest gap is still between page views and CTA clicks, so top-of-page proof and CTA clarity remain the highest-leverage growth lever.",
    metrics: {
      site_page_views_30d: siteFunnel30d.site_page_views,
      telegram_cta_clicks_30d: siteFunnel30d.telegram_cta_clicks,
      cta_rate_from_views: siteFunnel30d.cta_rate_from_views,
      gap_users: analyticsDashboard.conversion_control_30d.views_to_cta_gap,
    },
    recommended_actions: [
      "Keep testing above-the-fold proof and Telegram-first wording.",
      "Move the strongest CTA promise closer to the hero button.",
      "Use the best-performing CTA position as the baseline for future A/B tests.",
    ],
  };

  const localePriority: OperatorDecisionPriority = {
    key: "locale_conversion",
    status: weakLocales.length >= 3 ? "fail" : weakLocales.length > 0 ? "warn" : "ok",
    headline: "Most non-DE locales still get views without turning them into CTA clicks.",
    reason:
      "Traffic already exists in multiple locales, but conversion outside German is still close to zero, so copy quality and trust cues are not yet strong enough there.",
    metrics: {
      strongest_locale: bestLocale,
      weakest_locales_with_traffic: weakLocales,
      sampled_locales: localeBreakdown.length,
    },
    recommended_actions: [
      "Review hero headline and CTA promise for the weakest locales first.",
      "Keep Telegram opening expectations explicit in each locale.",
      "Do not add more languages before the current ones start converting.",
    ],
  };

  const activationPriority: OperatorDecisionPriority = {
    key: "bot_activation",
    status: priorityStatusFromRate(bot30d.start_to_first_action_rate, 0.35, 0.55),
    headline: "Bot starts still need to become first actions faster.",
    reason:
      "A start only becomes useful when it turns into a real learning action, so activation after /start is the next product quality checkpoint after the site click.",
    metrics: {
      bot_starts_30d: bot30d.bot_starts,
      first_actions_30d: bot30d.first_actions,
      start_to_first_action_rate: bot30d.start_to_first_action_rate,
    },
    recommended_actions: [
      "Keep the first bot screen focused on one obvious next step.",
      "Reduce cognitive load before the first question or term appears.",
      "Check whether language/path selection delays the first useful action.",
    ],
  };

  const buyIntentPriority: OperatorDecisionPriority = {
    key: "buy_intent",
    status: priorityStatusFromRate(bot30d.first_action_to_buy_intent_rate, 0.08, 0.15),
    headline: "Learning activity is not yet turning into enough paid intent.",
    reason:
      "The product can only monetize consistently if active learners reach the offer with enough confidence and a clear reason to upgrade.",
    metrics: {
      first_actions_30d: bot30d.first_actions,
      buy_intents_30d: bot30d.buy_intent,
      first_action_to_buy_intent_rate: bot30d.first_action_to_buy_intent_rate,
      start_to_buy_intent_rate: bot30d.start_to_buy_intent_rate,
    },
    recommended_actions: [
      "Show the value of full access after a real learning moment, not too early.",
      "Make the difference between free start and full access feel concrete.",
      "Pair the paywall with one visible example of what unlocks next.",
    ],
  };

  const paywallPriority: OperatorDecisionPriority = {
    key: "paywall_followthrough",
    status:
      monetizationDiagnosis30d.no_action_after_limit_rate >= 60
        ? "fail"
        : monetizationDiagnosis30d.no_action_after_limit_rate >= 35
          ? "warn"
          : "ok",
    headline: "A large share of users still stop at the limit screen without acting.",
    reason:
      "If users reach the limit but do nothing, the monetization message is not yet converting product interest into a clear paid or referral decision.",
    metrics: {
      limit_users_30d: monetizationDiagnosis30d.limit_users,
      no_action_after_limit_users_30d: monetizationDiagnosis30d.no_action_after_limit_users,
      no_action_after_limit_rate: monetizationDiagnosis30d.no_action_after_limit_rate,
      buy_intent_rate_from_limit: monetization30d.buy_intent_rate_from_limit,
      top_loss_stage: monetizationDiagnosis30d.top_loss_stage,
    },
    recommended_actions: [
      "Clarify what the user already got for free and what unlocks after payment.",
      "Test a simpler paywall with fewer choices and one visible outcome.",
      "Keep referral as a secondary path, not the main decision path.",
    ],
  };

  const priorities = [
    siteConversionPriority,
    localePriority,
    activationPriority,
    buyIntentPriority,
    paywallPriority,
  ];

  const topPriority = [...priorities]
    .sort((left, right) => {
      const severity = { fail: 2, warn: 1, ok: 0 };
      return severity[right.status] - severity[left.status];
    })[0]?.key ?? "site_views_to_cta";

  const recommendedFocus =
    topPriority === "site_views_to_cta"
      ? "Improve above-the-fold conversion before expanding more traffic inputs."
      : topPriority === "locale_conversion"
        ? "Fix weak locale messaging before scaling multilingual acquisition."
        : topPriority === "bot_activation"
          ? "Tighten the first bot interaction so /start turns into real practice faster."
          : topPriority === "buy_intent"
            ? "Make the upgrade moment feel more concrete after the first useful learning win."
            : "Simplify the limit/paywall decision so fewer users stop without acting.";

  return {
    refreshed_at: new Date().toISOString(),
    timezone: analyticsDashboard.timezone,
    summary: {
      top_priority: topPriority,
      strongest_locale: bestLocale,
      weakest_locales_with_traffic: weakLocales,
      best_cta_source: bestCtaSource,
      recommended_focus: recommendedFocus,
    },
    site: {
      funnel_30d: siteFunnel30d,
      top_locale_breakdown_30d: localeBreakdown,
      top_page_breakdown_30d: analyticsDashboard.conversion_control_30d.page_breakdown_30d,
      top_cta_sources_30d: analyticsDashboard.conversion_control_30d.cta_source_breakdown_30d,
    },
    bot: {
      starts_30d: bot30d.bot_starts,
      first_actions_30d: bot30d.first_actions,
      buy_intents_30d: bot30d.buy_intent,
      start_to_first_action_rate: bot30d.start_to_first_action_rate,
      first_action_to_buy_intent_rate: bot30d.first_action_to_buy_intent_rate,
      start_to_buy_intent_rate: bot30d.start_to_buy_intent_rate,
      funnel_30d: botDashboard.funnel_30d,
    },
    monetization: {
      summary_30d: monetization30d,
      diagnosis_30d: monetizationDiagnosis30d,
    },
    priorities,
  };
}
