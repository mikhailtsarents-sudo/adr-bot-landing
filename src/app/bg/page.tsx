import { PremiumPreviewPage } from "@/components/premium-preview/premium-preview-page";
import { buildLandingMetadata } from "@/lib/landing-locales";
import type { Metadata } from "next";

export const metadata: Metadata = buildLandingMetadata("bg");

export default function BulgarianHome() {
  return <PremiumPreviewPage trackingSource="landing_v2_bg" trackingSlug="home-v2-bg" forcedLang="bg" />;
}
