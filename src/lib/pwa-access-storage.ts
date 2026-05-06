const adrIngestUrl = process.env.ADR_INGEST_URL ?? "";
const adrIngestApiKey = process.env.ADR_INGEST_API_KEY ?? "";

export type PwaAccessLimits = {
  ok: boolean;
  base_limit: number;
  bonus_questions: number;
  referral_count: number;
  free_limit: number;
  ref_code: string;
};

export type PwaAccessActivation = {
  ok: boolean;
  access_token?: string;
  full_access?: boolean;
  code?: string;
  used_at?: string;
  error?: string;
};

export type PwaReferralTrackResult = {
  ok: boolean;
  status: "counted" | "duplicate" | "self_ref" | "rate_limited" | "invalid_ref" | "error";
  bonus_questions?: number;
  referral_count?: number;
  error?: string;
};

export function hasPwaAccessStorageConfig() {
  return Boolean(adrIngestUrl && adrIngestApiKey);
}

async function fetchAdrIngest<T>(path: string, init: RequestInit = {}): Promise<T> {
  if (!hasPwaAccessStorageConfig()) {
    throw new Error("Missing ADR ingest config");
  }

  const response = await fetch(`${adrIngestUrl}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "X-ADR-API-KEY": adrIngestApiKey,
      ...(init.headers || {}),
    },
    cache: "no-store",
  });

  const payload = (await response.json().catch(() => ({}))) as T & { error?: string };
  if (!response.ok) {
    throw new Error(payload.error || `adr-ingest failed with ${response.status}`);
  }

  return payload;
}

export async function readPwaAccessLimits(webUserId: string): Promise<PwaAccessLimits> {
  const url = new URL("/v1/access/limits", adrIngestUrl);
  url.searchParams.set("web_user_id", webUserId);

  return fetchAdrIngest<PwaAccessLimits>(`${url.pathname}${url.search}`);
}

export async function activatePwaAccessCode(input: {
  code: string;
  webUserId: string;
  deviceFingerprint: string;
  locale?: string;
}): Promise<PwaAccessActivation> {
  return fetchAdrIngest<PwaAccessActivation>("/v1/access/activate", {
    method: "POST",
    body: JSON.stringify({
      code: input.code,
      web_user_id: input.webUserId,
      device_fingerprint: input.deviceFingerprint,
      locale: input.locale ?? "",
    }),
  });
}

export async function trackPwaReferral(input: {
  refCode: string;
  newUserId: string;
  ipHash: string;
  answeredQuestionId?: string;
  source?: string;
}): Promise<PwaReferralTrackResult> {
  return fetchAdrIngest<PwaReferralTrackResult>("/v1/referral/track", {
    method: "POST",
    body: JSON.stringify({
      ref_code: input.refCode,
      new_user_id: input.newUserId,
      ip_hash: input.ipHash,
      answered_question_id: input.answeredQuestionId ?? "",
      source: input.source ?? "web_trainer",
    }),
  });
}
