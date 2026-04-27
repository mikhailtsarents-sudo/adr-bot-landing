import { PremiumPreviewPage } from "@/components/premium-preview/premium-preview-page";
import { buildLandingMetadata } from "@/lib/landing-locales";
import type { Metadata } from "next";

export const metadata: Metadata = buildLandingMetadata("ru");

export default function RussianHome() {
  return <PremiumPreviewPage trackingSource="landing_v2_ru" trackingSlug="home-v2-ru" forcedLang="ru" />;
}
