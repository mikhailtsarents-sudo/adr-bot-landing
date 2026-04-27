import { PremiumPreviewPage } from "@/components/premium-preview/premium-preview-page";
import { buildLandingMetadata } from "@/lib/landing-locales";
import type { Metadata } from "next";

export const metadata: Metadata = buildLandingMetadata("ro");

export default function RomanianHome() {
  return <PremiumPreviewPage trackingSource="landing_v2_ro" trackingSlug="home-v2-ro" forcedLang="ro" />;
}
