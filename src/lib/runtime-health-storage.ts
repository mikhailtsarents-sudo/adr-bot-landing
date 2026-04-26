const adrIngestUrl = process.env.ADR_INGEST_URL ?? "";
const adrIngestApiKey = process.env.ADR_INGEST_API_KEY ?? "";

export type RuntimeHealthCheckRow = {
  key: string;
  status: string;
  summary: string;
};

export type RuntimeHealthSnapshot = {
  generated_at: string;
  host: string;
  mode: string;
  overall_status: string;
  alerting: {
    severity: string;
    alert_needed: boolean;
    fail_count: number;
    warn_count: number;
    ok_count: number;
    skipped_count: number;
    failing_checks: string[];
    warning_checks: string[];
    headline: string;
    recommended_actions: string[];
  };
  checks: RuntimeHealthCheckRow[];
  blockers: string[];
};

function number(value: unknown) {
  const parsed = Number(value || 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function text(value: unknown) {
  return value == null ? "" : String(value).trim();
}

function list(value: unknown) {
  return Array.isArray(value) ? value.map((item) => text(item)).filter(Boolean) : [];
}

export async function readRuntimeHealthSnapshot(): Promise<RuntimeHealthSnapshot> {
  if (!adrIngestUrl || !adrIngestApiKey) {
    throw new Error("Missing runtime health storage config");
  }

  const response = await fetch(`${adrIngestUrl}/v1/runtime-health/latest`, {
    method: "GET",
    headers: { "X-ADR-API-KEY": adrIngestApiKey },
    cache: "no-store",
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`adr-ingest runtime health failed with ${response.status}: ${body.slice(0, 400)}`);
  }

  const json = (await response.json()) as {
    snapshot?: Partial<RuntimeHealthSnapshot>;
  };

  return {
    generated_at: text(json.snapshot?.generated_at),
    host: text(json.snapshot?.host),
    mode: text(json.snapshot?.mode),
    overall_status: text(json.snapshot?.overall_status),
    alerting: {
      severity: text(json.snapshot?.alerting?.severity),
      alert_needed: Boolean(json.snapshot?.alerting?.alert_needed),
      fail_count: number(json.snapshot?.alerting?.fail_count),
      warn_count: number(json.snapshot?.alerting?.warn_count),
      ok_count: number(json.snapshot?.alerting?.ok_count),
      skipped_count: number(json.snapshot?.alerting?.skipped_count),
      failing_checks: list(json.snapshot?.alerting?.failing_checks),
      warning_checks: list(json.snapshot?.alerting?.warning_checks),
      headline: text(json.snapshot?.alerting?.headline),
      recommended_actions: list(json.snapshot?.alerting?.recommended_actions),
    },
    checks: Array.isArray(json.snapshot?.checks)
      ? json.snapshot.checks.map((entry) => ({
          key: text(entry?.key),
          status: text(entry?.status),
          summary: text(entry?.summary),
        }))
      : [],
    blockers: list(json.snapshot?.blockers),
  };
}

