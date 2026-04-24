import type { AnalyticsEventName, AnalyticsEventPayload } from "@/lib/analytics";

const adrIngestUrl = process.env.ADR_INGEST_URL ?? "";
const adrIngestApiKey = process.env.ADR_INGEST_API_KEY ?? "";

export type StoredAnalyticsRow = AnalyticsEventPayload & {
  received_at?: string;
  id?: number;
  createdAt?: string;
  updatedAt?: string;
};

export function hasDirectAnalyticsStorageConfig() {
  return Boolean(adrIngestUrl && adrIngestApiKey);
}

export async function insertAnalyticsRow(row: AnalyticsEventPayload) {
  if (!hasDirectAnalyticsStorageConfig()) {
    throw new Error("Missing direct analytics storage config");
  }

  const response = await fetch(`${adrIngestUrl}/v1/analytics/event`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-ADR-API-KEY": adrIngestApiKey,
    },
    body: JSON.stringify({
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
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`adr-ingest analytics failed with ${response.status}: ${body.slice(0, 400)}`);
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

  const totalTarget = Math.min(Math.max(1, limit), 5000);
  const url = new URL(`${adrIngestUrl}/v1/analytics/rows`);
  url.searchParams.set("limit", String(totalTarget));

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: { "X-ADR-API-KEY": adrIngestApiKey },
    cache: "no-store",
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`adr-ingest analytics read failed with ${response.status}: ${body.slice(0, 400)}`);
  }

  const json = (await response.json()) as { data?: StoredAnalyticsRow[] };
  const rows = Array.isArray(json.data) ? json.data : [];

  if (!event) return rows;
  return rows.filter((row) => row.event === event);
}
