import { PremiumPreviewPage } from "@/components/premium-preview/premium-preview-page";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { absolute: "ADR exam in German | Questions and terms in Telegram" },
  description:
    "Prepare for the ADR exam in Telegram with questions, terminology, and short guided practice for Basiskurs, Tank, and drivers blocked by language.",
  alternates: {
    canonical: "/en",
    languages: {
      de: "/",
      en: "/en",
      ru: "/ru",
    },
  },
};

export default function EnglishHome() {
  return <PremiumPreviewPage trackingSource="landing_v2_en" trackingSlug="home-v2-en" />;
}
