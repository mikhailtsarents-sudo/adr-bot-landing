import type { AnalyticsDashboard } from "@/lib/analytics-dashboard";
import type { BotFunnelDashboard } from "@/lib/bot-funnel-dashboard";
import type { ExperimentControlDashboard } from "@/lib/experiment-control-dashboard";
import type { MonetizationControlDashboard } from "@/lib/monetization-control-dashboard";
import type { OperatorDecisionDashboard } from "@/lib/operator-decision-dashboard";
import type { RuntimeHealthDashboard } from "@/lib/runtime-health-dashboard";

export type ReportingSummaryDashboard = {
  refreshed_at: string;
  timezone: string;
  executive_summary: {
    runtime_status: RuntimeHealthDashboard["overall_status"];
    top_priority: OperatorDecisionDashboard["summary"]["top_priority"];
    recommended_focus: string;
    site_cta_rate_30d: number;
    strongest_locale: string;
    weak_locales_with_traffic: string[];
    bot_starts_30d: number;
    buy_intents_30d: number;
    paywall_no_action_rate: number;
  };
  next_actions: string[];
  sections: {
    runtime_health: RuntimeHealthDashboard["areas"];
    conversion: AnalyticsDashboard["conversion_control_30d"];
    operator: OperatorDecisionDashboard["summary"];
    monetization: MonetizationControlDashboard["summary"];
    experiments: ExperimentControlDashboard["summary"];
  };
};

export function buildReportingSummaryDashboard(args: {
  runtimeHealth: RuntimeHealthDashboard;
  analyticsDashboard: AnalyticsDashboard;
  botDashboard: BotFunnelDashboard;
  operatorDecision: OperatorDecisionDashboard;
  monetizationControl: MonetizationControlDashboard;
  experimentControl: ExperimentControlDashboard;
}): ReportingSummaryDashboard {
  const {
    runtimeHealth,
    analyticsDashboard,
    botDashboard,
    operatorDecision,
    monetizationControl,
    experimentControl,
  } = args;

  const actionPool = [
    operatorDecision.summary.recommended_focus,
    monetizationControl.summary.recommended_focus,
    ...operatorDecision.priorities.flatMap((entry) => entry.recommended_actions.slice(0, 1)),
    ...experimentControl.experiments.slice(0, 2).map((entry) => `${entry.key}: ${entry.hypothesis}`),
  ].filter(Boolean);

  const nextActions = [...new Set(actionPool)].slice(0, 6);

  return {
    refreshed_at: new Date().toISOString(),
    timezone: analyticsDashboard.timezone,
    executive_summary: {
      runtime_status: runtimeHealth.overall_status,
      top_priority: operatorDecision.summary.top_priority,
      recommended_focus: operatorDecision.summary.recommended_focus,
      site_cta_rate_30d: analyticsDashboard.funnel_30d.cta_rate_from_views,
      strongest_locale: operatorDecision.summary.strongest_locale,
      weak_locales_with_traffic: operatorDecision.summary.weakest_locales_with_traffic,
      bot_starts_30d: botDashboard.period_map.days_30.bot_starts,
      buy_intents_30d: botDashboard.period_map.days_30.buy_intent,
      paywall_no_action_rate: botDashboard.monetization_diagnosis_30d.no_action_after_limit_rate,
    },
    next_actions: nextActions,
    sections: {
      runtime_health: runtimeHealth.areas,
      conversion: analyticsDashboard.conversion_control_30d,
      operator: operatorDecision.summary,
      monetization: monetizationControl.summary,
      experiments: experimentControl.summary,
    },
  };
}
