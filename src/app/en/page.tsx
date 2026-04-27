import { PremiumPreviewPage } from "@/components/premium-preview/premium-preview-page";
import { buildLandingMetadata } from "@/lib/landing-locales";
import type { Metadata } from "next";

export const metadata: Metadata = buildLandingMetadata("en");

export default function EnglishHome() {
  return <PremiumPreviewPage trackingSource="landing_v2_en" trackingSlug="home-v2-en" forcedLang="en" />;
}
