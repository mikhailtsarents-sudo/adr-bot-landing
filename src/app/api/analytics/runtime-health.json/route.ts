import { buildRuntimeHealthDashboard } from "@/lib/runtime-health-dashboard";
import { readRuntimeHealthSnapshot } from "@/lib/runtime-health-storage";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const snapshot = await readRuntimeHealthSnapshot();
    const dashboard = buildRuntimeHealthDashboard(snapshot);

    return NextResponse.json(
      { ok: true, dashboard },
      { headers: { "Cache-Control": "no-store, max-age=0" } },
    );
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "unknown_error" },
      { status: 500 },
    );
  }
}
