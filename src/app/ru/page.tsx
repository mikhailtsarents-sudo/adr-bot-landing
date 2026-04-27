import { PremiumPreviewPage } from "@/components/premium-preview/premium-preview-page";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { absolute: "Экзамен ADR на немецком | Вопросы и термины в Telegram" },
  description:
    "Подготовка к ADR в Telegram: вопросы, термины и короткие объяснения для Basiskurs, Tank и тех, кому мешает язык.",
  alternates: {
    canonical: "/ru",
    languages: {
      de: "/",
      ru: "/ru",
    },
  },
};

export default function RussianHome() {
  return <PremiumPreviewPage trackingSource="landing_v2_ru" trackingSlug="home-v2-ru" />;
}
