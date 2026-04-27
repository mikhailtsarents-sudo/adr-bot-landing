import { PremiumPreviewPage } from "@/components/premium-preview/premium-preview-page";
import { buildLandingMetadata } from "@/lib/landing-locales";
import type { Metadata } from "next";

export const metadata: Metadata = buildLandingMetadata("uk");

export default function UkrainianHome() {
  return <PremiumPreviewPage trackingSource="landing_v2_uk" trackingSlug="home-v2-uk" forcedLang="uk" />;
}
