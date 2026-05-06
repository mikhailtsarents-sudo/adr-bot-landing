import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      ok: false,
      error: "payment_provider_not_configured",
      message:
        "Payment webhook scaffold is ready, but Stripe/PayPal/Mollie provider and webhook signature secret are not configured yet.",
    },
    { status: 501 },
  );
}
