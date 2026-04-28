import type { BotFunnelDashboard } from "@/lib/bot-funnel-dashboard";

export type MonetizationControlPriority = {
  key:
    | "limit_exposure"
    | "offer_to_buy_intent"
    | "referral_offer_to_unlock"
    | "referral_unlock_to_resolution";
  status: "ok" | "warn" | "fail";
  headline: string;
  reason: string;
  metrics: Record<string, number | string>;
  recommended_actions: string[];
};

export type MonetizationControlDashboard = {
  refreshed_at: string;
  timezone: string;
  summary: {
    primary_bottleneck: MonetizationControlPriority["key"];
    monetization_readiness: "not_enough_exposure" | "needs_offer_clarity" | "needs_referral_resolution" | "healthy";
    recommended_focus: string;
  };
  funnel_30d: BotFunnelDashboard["monetization_30d"];
  diagnosis_30d: BotFunnelDashboard["monetization_diagnosis_30d"];
  priorities: MonetizationControlPriority[];
};

function sortBySeverity(priorities: MonetizationControlPriority[]) {
  const severity = { fail: 2, warn: 1, ok: 0 };
  return [...priorities].sort((left, right) => severity[right.status] - severity[left.status]);
}

export function buildMonetizationControlDashboard(
  botDashboard: BotFunnelDashboard,
): MonetizationControlDashboard {
  const monetization = botDashboard.monetization_30d;
  const diagnosis = botDashboard.monetization_diagnosis_30d;

  const limitExposure: MonetizationControlPriority = {
    key: "limit_exposure",
    status:
      diagnosis.limit_users >= 5
        ? "ok"
        : diagnosis.limit_users > 0
          ? "warn"
          : "fail",
    headline: "Too few users are even reaching the monetization decision point.",
    reason:
      "If almost nobody reaches the limit screen, monetization optimization is still constrained by low exposure rather than only by copy quality.",
    metrics: {
      limit_users_30d: diagnosis.limit_users,
      first_actions_30d: botDashboard.period_map.days_30.first_actions,
      buy_intents_30d: botDashboard.period_map.days_30.buy_intent,
    },
    recommended_actions: [
      "Confirm that the free path reaches a clear learning limit after a visible product win.",
      "Make the transition from free sample to full access feel expected, not surprising.",
      "Do not overfit paywall copy until enough users actually see it.",
    ],
  };

  const offerToBuyIntent: MonetizationControlPriority = {
    key: "offer_to_buy_intent",
    status:
      monetization.buy_intent_rate_from_limit >= 20
        ? "ok"
        : monetization.buy_intent_rate_from_limit >= 8
          ? "warn"
          : "fail",
    headline: "The full-access offer still does not turn enough limit-screen users into paid intent.",
    reason:
      "A healthy offer should produce visible buy-intent after the limit screen, not only passive views or later exits.",
    metrics: {
      limit_users_30d: diagnosis.limit_users,
      buy_intent_rate_from_limit: monetization.buy_intent_rate_from_limit,
      full_access_offer_open_rate: monetization.full_access_offer_open_rate,
      buy_intent_clicks_30d: monetization.buy_intent_clicks,
    },
    recommended_actions: [
      "Show one concrete unlocked outcome directly in the full-access card.",
      "Keep the one-time 15 EUR framing visible exactly where the user decides.",
      "Reduce the amount of copy between the learning win and the offer.",
    ],
  };

  const referralOfferToUnlock: MonetizationControlPriority = {
    key: "referral_offer_to_unlock",
    status:
      diagnosis.waiting_without_unlock_rate >= 70
        ? "fail"
        : diagnosis.waiting_without_unlock_rate >= 40
          ? "warn"
          : "ok",
    headline: "Users who see the referral option often stop before unlocking it.",
    reason:
      "The referral alternative should feel understandable and actionable; otherwise it becomes dead weight on the monetization screen.",
    metrics: {
      referral_offer_users_30d: diagnosis.referral_offer_users,
      waiting_without_unlock_rate: diagnosis.waiting_without_unlock_rate,
      referral_unlock_rate_from_offer: monetization.referral_unlock_rate_from_offer,
      top_loss_stage: diagnosis.top_loss_stage,
    },
    recommended_actions: [
      "Explain the referral reward in one short sentence, not a block of text.",
      "Make the unlock action visually secondary to direct purchase, but still obvious.",
      "If referral remains weak, simplify it instead of letting it compete with the main offer.",
    ],
  };

  const referralUnlockToResolution: MonetizationControlPriority = {
    key: "referral_unlock_to_resolution",
    status:
      diagnosis.unresolved_after_unlock_rate >= 70
        ? "fail"
        : diagnosis.unresolved_after_unlock_rate >= 40
          ? "warn"
          : "ok",
    headline: "Referral users still get stuck after the unlock step.",
    reason:
      "An unlock that does not resolve into granted or rejected status creates uncertainty and weakens trust in the referral path.",
    metrics: {
      referral_unlock_users_30d: diagnosis.referral_unlock_users,
      unresolved_after_unlock_rate: diagnosis.unresolved_after_unlock_rate,
      referral_granted_30d: monetization.referral_granted,
      referral_rejected_30d: monetization.referral_rejected,
    },
    recommended_actions: [
      "Clarify what happens immediately after referral unlock.",
      "Show a short status message so users understand whether the referral is complete.",
      "Instrument the referral resolution path until grants and rejections become explicit.",
    ],
  };

  const priorities = sortBySeverity([
    limitExposure,
    offerToBuyIntent,
    referralOfferToUnlock,
    referralUnlockToResolution,
  ]);

  const primaryBottleneck = priorities[0]?.key ?? "limit_exposure";
  const monetizationReadiness =
    diagnosis.limit_users === 0
      ? "not_enough_exposure"
      : primaryBottleneck === "offer_to_buy_intent" || primaryBottleneck === "referral_offer_to_unlock"
        ? "needs_offer_clarity"
        : primaryBottleneck === "referral_unlock_to_resolution"
          ? "needs_referral_resolution"
          : "healthy";

  const recommendedFocus =
    primaryBottleneck === "limit_exposure"
      ? "Get more real learners to the limit screen before over-optimizing the offer."
      : primaryBottleneck === "offer_to_buy_intent"
        ? "Improve the full-access decision moment so intent rises after a real learning win."
        : primaryBottleneck === "referral_offer_to_unlock"
          ? "Simplify the referral alternative so it does not trap users in indecision."
          : "Fix the post-unlock referral resolution so the secondary path feels trustworthy.";

  return {
    refreshed_at: new Date().toISOString(),
    timezone: botDashboard.timezone,
    summary: {
      primary_bottleneck: primaryBottleneck,
      monetization_readiness: monetizationReadiness,
      recommended_focus: recommendedFocus,
    },
    funnel_30d: monetization,
    diagnosis_30d: diagnosis,
    priorities,
  };
}
