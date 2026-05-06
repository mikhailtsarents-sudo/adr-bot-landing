import { readPwaAccessLimits } from "@/lib/pwa-access-storage";
import { NextResponse } from "next/server";

const BASE_FREE_LIMIT = 5;

function fallbackRefCode(webUserId: string) {
  return webUserId.replace(/[^a-zA-Z0-9]/g, "").slice(0, 8) || "webguest";
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const webUserId = String(url.searchParams.get("web_user_id") || "").trim();

  if (!webUserId) {
    return NextResponse.json({ ok: false, error: "web_user_id_required" }, { status: 400 });
  }

  try {
    const limits = await readPwaAccessLimits(webUserId);
    return NextResponse.json(limits, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        degraded: true,
        error: error instanceof Error ? error.message : "unknown_error",
        base_limit: BASE_FREE_LIMIT,
        bonus_questions: 0,
        referral_count: 0,
        free_limit: BASE_FREE_LIMIT,
        ref_code: fallbackRefCode(webUserId),
      },
      { status: 200 },
    );
  }
}
