import { LandingPage } from "@/components/landing/landing-page";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title:
    "Подготовка к экзамену ADR на немецком | ADR Bot в Telegram",
  description:
    "Подготовка к экзамену ADR на немецком через Telegram. ADR Bot помогает с терминами, формулировками экзамена и вопросами по шагам.",
  alternates: {
    canonical: "/ru",
    languages: {
      de: "/",
      ru: "/ru",
    },
  },
};

export default function RussianHome() {
  return <LandingPage />;
}
