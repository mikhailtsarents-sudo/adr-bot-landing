import { PremiumPreviewPage } from "@/components/premium-preview/premium-preview-page";
import { buildLandingMetadata } from "@/lib/landing-locales";
import type { Metadata } from "next";

export const metadata: Metadata = buildLandingMetadata("ar");

export default function ArabicHome() {
  return <PremiumPreviewPage trackingSource="landing_v2_ar" trackingSlug="home-v2-ar" forcedLang="ar" />;
}
