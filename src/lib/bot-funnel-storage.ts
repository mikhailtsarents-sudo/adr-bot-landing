const n8nBaseUrl = process.env.N8N_BASE_URL ?? "";
const n8nApiKey = process.env.N8N_API_KEY ?? "";
const n8nBotFunnelTableId = process.env.N8N_BOT_FUNNEL_TABLE_ID ?? "";

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
  return Boolean(n8nBaseUrl && n8nApiKey && n8nBotFunnelTableId);
}

export async function insertBotFunnelRow(row: Omit<BotFunnelRow, "id" | "createdAt" | "updatedAt">) {
  if (!hasBotFunnelStorageConfig()) {
    throw new Error("Missing bot funnel storage config");
  }

  const response = await fetch(
    `${n8nBaseUrl}/api/v1/data-tables/${n8nBotFunnelTableId}/rows`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-N8N-API-KEY": n8nApiKey,
      },
      body: JSON.stringify({
        data: [
          {
            event_type: row.event_type,
            event_name: row.event_name,
            user_id: row.user_id,
            kurs: row.kurs,
            lang: row.lang,
            entry_source_type: row.entry_source_type,
            entry_source_token: row.entry_source_token,
            youtube_surface_slug: row.youtube_surface_slug,
            youtube_content_token: row.youtube_content_token,
            state_hint: row.state_hint,
            metadata_json: row.metadata_json,
            occurred_at: row.occurred_at,
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
      `n8n bot funnel table failed with ${response.status}: ${body.slice(0, 400)}`,
    );
  }
}

const N8N_MAX_PAGE_SIZE = 250;

export async function readBotFunnelRows({ limit = 2000 }: { limit?: number } = {}) {
  if (!hasBotFunnelStorageConfig()) {
    throw new Error("Missing bot funnel storage config");
  }

  const totalTarget = Math.min(Math.max(1, limit), 5000);
  const pageSize = Math.min(N8N_MAX_PAGE_SIZE, totalTarget);
  const allRows: BotFunnelRow[] = [];
  let cursor: string | undefined;

  while (allRows.length < totalTarget) {
    const url = new URL(`${n8nBaseUrl}/api/v1/data-tables/${n8nBotFunnelTableId}/rows`);
    url.searchParams.set("limit", String(Math.min(pageSize, totalTarget - allRows.length)));
    if (cursor) url.searchParams.set("cursor", cursor);

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: { "X-N8N-API-KEY": n8nApiKey },
      cache: "no-store",
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(
        `n8n bot funnel read failed with ${response.status}: ${body.slice(0, 400)}`,
      );
    }

    const json = (await response.json()) as { data?: BotFunnelRow[]; nextCursor?: string };
    const page = Array.isArray(json.data) ? json.data : [];
    allRows.push(...page);

    if (!json.nextCursor || page.length === 0) break;
    cursor = json.nextCursor;
  }

  return allRows.slice(0, totalTarget);
}
