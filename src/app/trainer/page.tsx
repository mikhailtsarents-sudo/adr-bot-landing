import { PageViewTracker } from "@/components/analytics/page-view-tracker";
import type { Metadata } from "next";
import { TrainerClient } from "./trainer-client";

export const metadata: Metadata = {
  title: "ADR Web-Trainer | ADR Bot",
  description:
    "ADR-Fragen direkt im Browser ueben: Basiskurs, Tank und Klasse 7 mit Begriffshilfe und lokalem Fortschritt.",
  alternates: {
    canonical: "/trainer",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

export default function TrainerPage() {
  return (
    <>
      <PageViewTracker source="web_trainer" />
      <TrainerClient />
    </>
  );
}
