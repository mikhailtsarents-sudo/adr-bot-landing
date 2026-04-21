import type { AnalyticsEventName, AnalyticsEventPayload } from "@/lib/analytics";

const n8nBaseUrl = process.env.N8N_BASE_URL ?? "";
const n8nApiKey = process.env.N8N_API_KEY ?? "";
const n8nAnalyticsTableId = process.env.N8N_ANALYTICS_TABLE_ID ?? "";

export type StoredAnalyticsRow = AnalyticsEventPayload & {
  received_at?: string;
  id?: number;
  createdAt?: string;
  updatedAt?: string;
};

export function hasDirectAnalyticsStorageConfig() {
  return Boolean(n8nBaseUrl && n8nApiKey && n8nAnalyticsTableId);
}

export async function insertAnalyticsRow(row: AnalyticsEventPayload) {
  if (!hasDirectAnalyticsStorageConfig()) {
    throw new Error("Missing direct analytics storage config");
  }

  const response = await fetch(
    `${n8nBaseUrl}/api/v1/data-tables/${n8nAnalyticsTableId}/rows`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-N8N-API-KEY": n8nApiKey,
      },
      body: JSON.stringify({
        data: [
          {
            event: row.event,
            source: row.source,
            page_path: row.page_path ?? "",
            page_slug: row.page_slug ?? "",
            page_type: row.page_type ?? "",
            locale: row.locale ?? "",
            target: row.target ?? "",
            referrer: row.referrer ?? "",
            user_agent: row.user_agent ?? "",
            occurred_at: row.occurred_at ?? new Date().toISOString(),
            received_at: new Date().toISOString(),
          },
        ],
      }),
      cache: "no-store",
    },
  );

  if (!response.ok) {
    const body = await response.text();
    throw new Error(
      `n8n analytics table failed with ${response.status}: ${body.slice(0, 400)}`,
    );
  }
}

export async function readAnalyticsRows({
  limit = 500,
  event,
}: {
  limit?: number;
  event?: AnalyticsEventName;
} = {}) {
  if (!hasDirectAnalyticsStorageConfig()) {
    throw new Error("Missing direct analytics storage config");
  }

  const url = new URL(
    `${n8nBaseUrl}/api/v1/data-tables/${n8nAnalyticsTableId}/rows`,
  );
  url.searchParams.set("limit", String(limit));

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: {
      "X-N8N-API-KEY": n8nApiKey,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(
      `n8n analytics read failed with ${response.status}: ${body.slice(0, 400)}`,
    );
  }

  const json = (await response.json()) as { data?: StoredAnalyticsRow[] };
  const rows = Array.isArray(json.data) ? json.data : [];

  if (!event) {
    return rows;
  }

  return rows.filter((row) => row.event === event);
}
