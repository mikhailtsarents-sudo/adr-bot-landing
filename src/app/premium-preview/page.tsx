import { PremiumPreviewPage } from "@/components/premium-preview/premium-preview-page";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Premium Preview",
  description:
    "Preview des neuen ADR Bot Landing Designs mit stärkerem Telegram-Fokus und Premium-Pricing.",
  alternates: {
    canonical: "/premium-preview",
  },
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
};

export default function PremiumPreviewRoute() {
  return <PremiumPreviewPage />;
}
