import type { AnalyticsEventPayload } from "@/lib/analytics";
import {
  hasDirectAnalyticsStorageConfig,
  insertAnalyticsRow,
} from "@/lib/analytics-storage";

const analyticsWebhookUrl = process.env.ANALYTICS_WEBHOOK_URL ?? "";
const n8nBaseUrl = process.env.N8N_BASE_URL ?? "";
const n8nAnalyticsTableId = process.env.N8N_ANALYTICS_TABLE_ID ?? "";

export async function forwardAnalyticsEvent(event: AnalyticsEventPayload) {
  const payload = {
    ...event,
    occurred_at: event.occurred_at ?? new Date().toISOString(),
  };

  console.info("[site-analytics]", JSON.stringify(payload));

  if (!analyticsWebhookUrl) {
    if (!hasDirectAnalyticsStorageConfig()) {
      return {
        delivered: false,
        destination: "console-only",
      };
    }
  }

  if (hasDirectAnalyticsStorageConfig()) {
    await insertAnalyticsRow(payload);

    return {
      delivered: true,
      destination: `${n8nBaseUrl}/api/v1/data-tables/${n8nAnalyticsTableId}/rows`,
    };
  }

  const url = new URL(analyticsWebhookUrl);
  url.searchParams.set("event", payload.event);
  url.searchParams.set("source", payload.source);
  if (payload.page_path) url.searchParams.set("page_path", payload.page_path);
  if (payload.page_slug) url.searchParams.set("page_slug", payload.page_slug);
  if (payload.page_type) url.searchParams.set("page_type", payload.page_type);
  if (payload.locale) url.searchParams.set("locale", payload.locale);
  if (payload.target) url.searchParams.set("target", payload.target);
  if (payload.referrer) url.searchParams.set("referrer", payload.referrer);
  if (payload.user_agent) url.searchParams.set("user_agent", payload.user_agent);
  if (payload.occurred_at) url.searchParams.set("occurred_at", payload.occurred_at);

  const response = await fetch(url.toString(), {
    method: "GET",
    cache: "no-store",
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(
      `Analytics webhook failed with ${response.status}: ${body.slice(0, 400)}`,
    );
  }

  return {
    delivered: true,
    destination: analyticsWebhookUrl,
  };
}
