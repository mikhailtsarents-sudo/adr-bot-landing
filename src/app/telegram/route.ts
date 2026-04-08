import { NextResponse } from "next/server";

const telegramHref = "https://t.me/adr_pruefung_trainer_bot";

export function GET() {
  return NextResponse.redirect(telegramHref, 307);
}
