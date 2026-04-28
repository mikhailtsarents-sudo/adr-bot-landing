import type { AnalyticsDashboard } from "@/lib/analytics-dashboard";
import type { BotFunnelDashboard } from "@/lib/bot-funnel-dashboard";
import type { MonetizationControlDashboard } from "@/lib/monetization-control-dashboard";

export type ExperimentCandidate = {
  key:
    | "hero_locale_copy"
    | "secondary_cta_support"
    | "paywall_message"
    | "referral_path_simplification"
    | "preview_traffic_cleanup";
  priority: "high" | "medium" | "low";
  channel: "site" | "bot";
  hypothesis: string;
  target_metric: string;
  baseline: string;
  variants: string[];
  reason: string;
};

export type QAQueueItem = {
  key: string;
  priority: "high" | "medium" | "low";
  area: "locale" | "page" | "bot";
  target: string;
  reason: string;
};

export type ExperimentControlDashboard = {
  refreshed_at: string;
  timezone: string;
  summary: {
    recommended_test_focus: string;
    qa_focus_count: number;
    experiment_count: number;
  };
  qa_queue: QAQueueItem[];
  experiments: ExperimentCandidate[];
};

function qaPriority(isHigh: boolean): QAQueueItem["priority"] {
  return isHigh ? "high" : "medium";
}

export function buildExperimentControlDashboard(
  analyticsDashboard: AnalyticsDashboard,
  botDashboard: BotFunnelDashboard,
  monetizationControl: MonetizationControlDashboard,
): ExperimentControlDashboard {
  const localeBreakdown = analyticsDashboard.conversion_control_30d.locale_breakdown_30d;
  const pageBreakdown = analyticsDashboard.conversion_control_30d.page_breakdown_30d;
  const ctaBreakdown = analyticsDashboard.conversion_control_30d.cta_source_breakdown_30d;

  const weakLocales = localeBreakdown.filter((row) => row.views >= 4 && row.cta_clicks === 0);
  const weakPages = pageBreakdown.filter((row) => row.views >= 4 && row.cta_clicks === 0).slice(0, 6);
  const previewPages = pageBreakdown.filter((row) => row.page_path.includes("premium-preview") && row.views > 0);
  const dominantCta = ctaBreakdown[0];
  const totalCta = ctaBreakdown.reduce((sum, row) => sum + row.cta_clicks, 0);
  const dominantShare = dominantCta && totalCta > 0 ? dominantCta.cta_clicks / totalCta : 0;

  const qaQueue: QAQueueItem[] = [
    ...weakLocales.map((row) => ({
      key: `locale:${row.locale}`,
      priority: qaPriority(row.views >= 8),
      area: "locale" as const,
      target: row.locale,
      reason: `${row.views} views with 0 CTA clicks in the last 30 days.`,
    })),
    ...weakPages.map((row) => ({
      key: `page:${row.locale}:${row.page_path}`,
      priority: qaPriority(row.page_path === "/"),
      area: "page" as const,
      target: `${row.locale} ${row.page_path}`,
      reason: `${row.views} views with 0 CTA clicks on this page variant.`,
    })),
  ];

  if (monetizationControl.summary.primary_bottleneck !== "limit_exposure") {
    qaQueue.push({
      key: "bot:limit-screen",
      priority: "high",
      area: "bot",
      target: "limit-screen",
      reason: `Primary monetization bottleneck is ${monetizationControl.summary.primary_bottleneck}.`,
    });
  }

  const experiments: ExperimentCandidate[] = [];

  if (weakLocales.length > 0) {
    experiments.push({
      key: "hero_locale_copy",
      priority: "high",
      channel: "site",
      hypothesis:
        "Weak non-DE locales will click more if the hero promise makes Telegram, the first minute, and the free sample more concrete.",
      target_metric: "cta_rate_from_views",
      baseline: weakLocales.map((row) => `${row.locale}:${row.cta_rate_from_views}`).join(", "),
      variants: [
        "Stronger Telegram-first hero headline",
        "Add one-line trust cue directly under hero CTA",
        "Move first-minute bullets tighter to the hero button",
      ],
      reason: "Multiple locales already get traffic but still produce zero CTA clicks.",
    });
  }

  if (dominantCta && dominantShare >= 0.6) {
    experiments.push({
      key: "secondary_cta_support",
      priority: "medium",
      channel: "site",
      hypothesis:
        "Secondary CTA positions can carry more demand if they repeat the same promise as the best-performing CTA instead of weaker generic wording.",
      target_metric: "cta_source_mix",
      baseline: `${dominantCta.source} carries ${(dominantShare * 100).toFixed(0)}% of CTA clicks.`,
      variants: [
        "Mirror hero CTA wording in nav and pricing CTA",
        "Repeat social proof near footer CTA",
        "Promote one mid-page CTA with the hero promise",
      ],
      reason: "CTA demand is too concentrated in one entry point.",
    });
  }

  experiments.push({
    key: "paywall_message",
    priority: monetizationControl.summary.primary_bottleneck === "offer_to_buy_intent" ? "high" : "medium",
    channel: "bot",
    hypothesis:
      "Buy intent will rise if the limit screen explains one-time 15 EUR value with one concrete unlocked outcome and one shorter decision path.",
    target_metric: "buy_intent_rate_from_limit",
    baseline: `${botDashboard.monetization_30d.buy_intent_rate_from_limit}% buy intent from limit users.`,
    variants: [
      "Short offer with one unlocked outcome",
      "Current offer plus stronger value example",
      "One-card direct purchase focus with referral as secondary link",
    ],
    reason: "Monetization still depends on a clearer upgrade moment after a real learning win.",
  });

  experiments.push({
    key: "referral_path_simplification",
    priority:
      monetizationControl.summary.primary_bottleneck === "referral_offer_to_unlock" ||
      monetizationControl.summary.primary_bottleneck === "referral_unlock_to_resolution"
        ? "high"
        : "low",
    channel: "bot",
    hypothesis:
      "Referral performance will improve if the alternative path becomes shorter, clearer, and less competitive with the main paid choice.",
    target_metric: "referral_unlock_rate_from_offer",
    baseline: `${botDashboard.monetization_30d.referral_unlock_rate_from_offer}% unlock rate from referral offer.`,
    variants: [
      "One-sentence referral explanation",
      "Referral path hidden behind secondary text link",
      "Explicit status message after unlock",
    ],
    reason: "Referral is currently a visible friction point in the monetization flow.",
  });

  if (previewPages.length > 0) {
    experiments.push({
      key: "preview_traffic_cleanup",
      priority: "low",
      channel: "site",
      hypothesis:
        "Conversion reporting becomes cleaner if preview traffic is clearly segmented and not mixed with live landing conclusions.",
      target_metric: "reporting_clarity",
      baseline: `${previewPages.reduce((sum, row) => sum + row.views, 0)} preview page views detected in the last 30 days.`,
      variants: [
        "Keep preview traffic excluded from main conclusions",
        "Add explicit preview label in analytics rollups",
      ],
      reason: "Preview traffic still exists and can distort low-volume conclusions.",
    });
  }

  const recommendedTestFocus =
    experiments.find((entry) => entry.priority === "high")?.key ||
    experiments[0]?.key ||
    "observe";

  return {
    refreshed_at: new Date().toISOString(),
    timezone: analyticsDashboard.timezone,
    summary: {
      recommended_test_focus: recommendedTestFocus,
      qa_focus_count: qaQueue.length,
      experiment_count: experiments.length,
    },
    qa_queue: qaQueue,
    experiments,
  };
}
