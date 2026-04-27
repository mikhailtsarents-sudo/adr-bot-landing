import { PremiumPreviewPage } from "@/components/premium-preview/premium-preview-page";
import { buildLandingMetadata } from "@/lib/landing-locales";
import type { Metadata } from "next";

export const metadata: Metadata = buildLandingMetadata("pl");

export default function PolishHome() {
  return <PremiumPreviewPage trackingSource="landing_v2_pl" trackingSlug="home-v2-pl" forcedLang="pl" />;
}
