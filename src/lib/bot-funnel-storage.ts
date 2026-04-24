const adrIngestUrl = process.env.ADR_INGEST_URL ?? "";
const adrIngestApiKey = process.env.ADR_INGEST_API_KEY ?? "";

export type BotFunnelRow = {
  id?: number;
  event_type: string;
  event_name: string;
  user_id: string;
  kurs: string;
  lang: string;
  entry_source_type: string;
  entry_source_token: string;
  youtube_surface_slug: string;
  youtube_content_token: string;
  state_hint: string;
  metadata_json: string;
  occurred_at: string;
  received_at: string;
  createdAt?: string;
  updatedAt?: string;
};

export function hasBotFunnelStorageConfig() {
  return Boolean(adrIngestUrl && adrIngestApiKey);
}

export async function insertBotFunnelRow(row: Omit<BotFunnelRow, "id" | "createdAt" | "updatedAt">) {
  if (!hasBotFunnelStorageConfig()) {
    throw new Error("Missing bot funnel storage config");
  }

  const response = await fetch(`${adrIngestUrl}/v1/bot-funnel/event`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-ADR-API-KEY": adrIngestApiKey,
    },
    body: JSON.stringify(row),
    cache: "no-store",
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`adr-ingest bot-funnel failed with ${response.status}: ${body.slice(0, 400)}`);
  }
}

export async function readBotFunnelRows({ limit = 2000 }: { limit?: number } = {}) {
  if (!hasBotFunnelStorageConfig()) {
    throw new Error("Missing bot funnel storage config");
  }

  const totalTarget = Math.min(Math.max(1, limit), 5000);
  const url = new URL(`${adrIngestUrl}/v1/bot-funnel/rows`);
  url.searchParams.set("limit", String(totalTarget));

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: { "X-ADR-API-KEY": adrIngestApiKey },
    cache: "no-store",
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`adr-ingest bot-funnel read failed with ${response.status}: ${body.slice(0, 400)}`);
  }

  const json = (await response.json()) as { data?: BotFunnelRow[] };
  return Array.isArray(json.data) ? json.data : [];
}
