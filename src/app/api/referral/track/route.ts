import { trackPwaReferral } from "@/lib/pwa-access-storage";
import { createHash } from "node:crypto";
import { NextResponse } from "next/server";

function clientIp(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for") || "";
  return forwardedFor.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
}

function hashIp(value: string) {
  const salt = process.env.REFERRAL_IP_HASH_SALT || process.env.ADR_INGEST_API_KEY || "adr-referral";
  return createHash("sha256").update(`${salt}:${value}`).digest("hex");
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    ref_code?: string;
    new_user_id?: string;
    answered_question_id?: string;
    source?: string;
  };

  const refCode = String(body.ref_code || "").trim();
  const newUserId = String(body.new_user_id || "").trim();

  if (!refCode || !newUserId) {
    return NextResponse.json({ ok: false, error: "missing_required_fields" }, { status: 400 });
  }

  try {
    const result = await trackPwaReferral({
      refCode,
      newUserId,
      ipHash: hashIp(clientIp(request)),
      answeredQuestionId: body.answered_question_id,
      source: body.source,
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        status: "error",
        error: error instanceof Error ? error.message : "unknown_error",
      },
      { status: 500 },
    );
  }
}
