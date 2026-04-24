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

const N8N_MAX_PAGE_SIZE = 250;

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

  const totalTarget = Math.min(Math.max(1, limit), 5000);
  const pageSize = Math.min(N8N_MAX_PAGE_SIZE, totalTarget);
  const allRows: StoredAnalyticsRow[] = [];
  let cursor: string | undefined;

  while (allRows.length < totalTarget) {
    const url = new URL(
      `${n8nBaseUrl}/api/v1/data-tables/${n8nAnalyticsTableId}/rows`,
    );
    url.searchParams.set("limit", String(Math.min(pageSize, totalTarget - allRows.length)));
    if (cursor) {
      url.searchParams.set("cursor", cursor);
    }

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

    const json = (await response.json()) as { data?: StoredAnalyticsRow[]; nextCursor?: string };
    const page = Array.isArray(json.data) ? json.data : [];
    allRows.push(...page);

    if (!json.nextCursor || page.length === 0) break;
    cursor = json.nextCursor;
  }

  const rows = allRows.slice(0, totalTarget);

  if (!event) {
    return rows;
  }

  return rows.filter((row) => row.event === event);
}
