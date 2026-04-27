import { siteConfig, siteUrl } from "@/lib/site";
import { PremiumPreviewPage } from "@/components/premium-preview/premium-preview-page";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ADR-Prüfung auf Deutsch | Einfach per Telegram lernen",
  description:
    "ADR-Vorbereitung in Telegram: verständliche Fragen, Fachbegriffe und kurze Übungen für Basiskurs, Tank und Fahrer, denen die Sprache im Weg steht.",
  alternates: {
    canonical: "/",
    languages: {
      de: "/",
      ru: "/ru",
    },
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
        potentialAction: {
          "@type": "ReadAction",
          target: [siteUrl],
        },
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
          "Telegram-basierte Vorbereitungshilfe fuer ADR-Fragen, Begriffe und typische Formulierungen auf Deutsch.",
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "EUR",
        },
      },
      {
        "@type": "FAQPage",
        mainEntity: [
          {
            "@type": "Question",
            name: "Wie kann ich mich auf die ADR-Pruefung auf Deutsch vorbereiten?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "ADR Bot unterstuetzt die Vorbereitung mit erklaerten Fachbegriffen, verstaendlicherem Pruefungsdeutsch und einer strukturierten Uebung direkt in Telegram.",
            },
          },
          {
            "@type": "Question",
            name: "Ist ADR Bot kostenlos?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Ja. ADR Bot befindet sich aktuell in einer kostenlosen oeffentlichen Testphase.",
            },
          },
          {
            "@type": "Question",
            name: "Brauche ich fuer ADR Bot eine neue App?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Nein. Das Angebot funktioniert direkt in Telegram, ohne zusaetzliche Lernplattform.",
            },
          },
          {
            "@type": "Question",
            name: "Hilft ADR Bot beim Verstaendnis von ADR-Fachbegriffen und pruefungsnahen Formulierungen?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Ja. Der Fokus liegt auf Begriffen, typischen Fragestellungen und technischem Deutsch rund um die ADR-Vorbereitung.",
            },
          },
        ],
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PremiumPreviewPage trackingSource="landing_v2" trackingSlug="home-v2" />
    </>
  );
}
