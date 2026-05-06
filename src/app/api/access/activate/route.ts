import { activatePwaAccessCode } from "@/lib/pwa-access-storage";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    code?: string;
    web_user_id?: string;
    device_fingerprint?: string;
    locale?: string;
  };

  const code = String(body.code || "").trim();
  const webUserId = String(body.web_user_id || "").trim();
  const deviceFingerprint = String(body.device_fingerprint || "").trim();

  if (!code || !webUserId || !deviceFingerprint) {
    return NextResponse.json({ ok: false, error: "missing_required_fields" }, { status: 400 });
  }

  try {
    const result = await activatePwaAccessCode({
      code,
      webUserId,
      deviceFingerprint,
      locale: body.locale,
    });

    return NextResponse.json(result, { status: result.ok ? 200 : 409 });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "unknown_error" },
      { status: 500 },
    );
  }
}
