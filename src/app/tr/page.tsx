import { PremiumPreviewPage } from "@/components/premium-preview/premium-preview-page";
import { buildLandingMetadata } from "@/lib/landing-locales";
import type { Metadata } from "next";

export const metadata: Metadata = buildLandingMetadata("tr");

export default function TurkishHome() {
  return <PremiumPreviewPage trackingSource="landing_v2_tr" trackingSlug="home-v2-tr" forcedLang="tr" />;
}
