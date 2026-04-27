import { PremiumPreviewPage } from "@/components/premium-preview/premium-preview-page";
import { buildLandingMetadata } from "@/lib/landing-locales";
import type { Metadata } from "next";

export const metadata: Metadata = buildLandingMetadata("hr");

export default function CroatianHome() {
  return <PremiumPreviewPage trackingSource="landing_v2_hr" trackingSlug="home-v2-hr" forcedLang="hr" />;
}
