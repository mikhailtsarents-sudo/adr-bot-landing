import { NextResponse } from "next/server";

const telegramHref = "https://t.me/Adr_wort_trainer_bot";

export function GET() {
  return NextResponse.redirect(telegramHref, 307);
}
