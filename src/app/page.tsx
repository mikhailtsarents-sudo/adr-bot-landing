import { siteConfig, siteUrl } from "@/lib/site";
import { LandingPage } from "@/components/landing/landing-page";
import { StickyHeader } from "@/components/landing/sticky-header";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ADR Prüfungsvorbereitung auf Deutsch per Telegram",
  description:
    "Kostenlose Pilotphase für ADR Prüfungsvorbereitung auf Deutsch. ADR Bot hilft bei Begriffen, Prüfungsdeutsch und verständlicher Orientierung direkt in Telegram.",
  alternates: {
    canonical: "/",
  },
};

export default function Home() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        name: siteConfig.name,
        url: siteUrl,
        inLanguage: "de-DE",
        description: siteConfig.description,
      },
      {
        "@type": "Organization",
        name: siteConfig.name,
        url: siteUrl,
        sameAs: ["https://t.me/Adr_wort_trainer_bot"],
      },
      {
        "@type": "SoftwareApplication",
        name: "ADR Bot",
        applicationCategory: "EducationalApplication",
        operatingSystem: "Telegram",
        description:
          "Telegram-based learning support for ADR exam preparation in German.",
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "EUR",
        },
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <StickyHeader />
      <LandingPage />
    </>
  );
}
