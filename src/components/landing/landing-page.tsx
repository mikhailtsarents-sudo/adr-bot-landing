"use client";

import { useLang } from "@/lib/i18n/use-lang";
import Image from "next/image";
import Link from "next/link";
import { TrackedTelegramLink } from "./tracked-telegram-link";

type Hotspot = {
  source?: string;
  href?: string;
  label: string;
  className: string;
};

function HotspotLink({ spot }: { spot: Hotspot }) {
  if (spot.source) {
    return (
      <TrackedTelegramLink
        source={spot.source}
        aria-label={spot.label}
        className={spot.className}
      >
        <span className="sr-only">{spot.label}</span>
      </TrackedTelegramLink>
    );
  }

  return (
    <Link href={spot.href ?? "#"} aria-label={spot.label} className={spot.className}>
      <span className="sr-only">{spot.label}</span>
    </Link>
  );
}

export function LandingPage() {
  const { lang, t } = useLang();

  const desktopHotspots: Hotspot[] = [
    {
      href: "#benefits",
      label: lang === "ru" ? "Преимущества" : lang === "en" ? "Benefits" : "Vorteile",
      className:
        "absolute left-[33.4%] top-[1.05%] hidden h-[2.45%] w-[7.4%] rounded-full md:block",
    },
    {
      href: "#how-it-works",
      label:
        lang === "ru" ? "Как это работает" : lang === "en" ? "How it works" : "So geht's",
      className:
        "absolute left-[41.6%] top-[1.05%] hidden h-[2.45%] w-[9.2%] rounded-full md:block",
    },
    {
      href: "#faq",
      label: "FAQ",
      className:
        "absolute left-[51.6%] top-[1.05%] hidden h-[2.45%] w-[4.8%] rounded-full md:block",
    },
    {
      source: "hero_primary",
      label: t.hero.ctaPrimary,
      className:
        "absolute right-[5.5%] top-[0.85%] hidden h-[3.25%] w-[24%] rounded-full md:block",
    },
    {
      source: "hero_secondary",
      label: t.hero.ctaPrimary,
      className:
        "absolute left-[5.7%] top-[25.7%] hidden h-[3.05%] w-[20%] rounded-full md:block",
    },
    {
      source: "how_it_works_primary",
      label: t.hero.ctaPrimary,
      className:
        "absolute left-[41.3%] top-[55.8%] hidden h-[3.1%] w-[18.8%] rounded-full md:block",
    },
    {
      href: "#benefits",
      label: lang === "ru" ? "Преимущества" : lang === "en" ? "Benefits" : "Vorteile",
      className:
        "absolute right-[11.7%] bottom-[4.05%] hidden h-[2.4%] w-[6.2%] rounded-full md:block",
    },
    {
      href: "#faq",
      label: "FAQ",
      className:
        "absolute right-[7.25%] bottom-[4.05%] hidden h-[2.4%] w-[3.1%] rounded-full md:block",
    },
    {
      source: "footer_telegram",
      label: "Telegram",
      className:
        "absolute right-[1.4%] bottom-[4.05%] hidden h-[2.4%] w-[5.3%] rounded-full md:block",
    },
  ];

  const mobileHotspots: Hotspot[] = [
    {
      source: "hero_primary_mobile",
      label: t.hero.ctaPrimary,
      className:
        "absolute left-[8%] top-[31.2%] h-[2.8%] w-[54%] rounded-full md:hidden",
    },
    {
      href: "#how-it-works",
      label:
        lang === "ru" ? "Как это работает" : lang === "en" ? "How it works" : "So geht's",
      className:
        "absolute left-[8%] top-[57.5%] h-[2.8%] w-[52%] rounded-full md:hidden",
    },
    {
      source: "footer_telegram_mobile",
      label: "Telegram",
      className:
        "absolute left-[60%] bottom-[3.8%] h-[2.25%] w-[24%] rounded-full md:hidden",
    },
  ];

  return (
    <main className="bg-[#f4efe2] text-[var(--color-text)]">
      <div className="sr-only">
        <h1>{t.hero.title}</h1>
        <p>{t.hero.description}</p>
        <section id="how-it-works">
          <h2>{lang === "ru" ? "Как это работает" : lang === "en" ? "How it works" : "So geht's"}</h2>
          <p>{t.howItWorks.title}</p>
        </section>
        <section id="benefits">
          <h2>{lang === "ru" ? "Преимущества" : lang === "en" ? "Benefits" : "Vorteile"}</h2>
          <p>{t.benefits.title}</p>
        </section>
        <section id="faq">
          <h2>FAQ</h2>
          <p>
            {lang === "ru"
              ? "Ответы на частые вопросы о подготовке к ADR через Telegram."
              : lang === "en"
                ? "Answers to common questions about ADR preparation in Telegram."
                : "Antworten auf haeufige Fragen zur ADR-Vorbereitung per Telegram."}
          </p>
        </section>
      </div>

      <section className="relative mx-auto w-full max-w-[1440px]">
        <div className="relative hidden md:block">
          <Image
            src="/redesign/home-export-desktop.png"
            alt="ADR Bot homepage design preview"
            width={1440}
            height={2200}
            priority
            className="h-auto w-full"
            sizes="100vw"
          />
          {desktopHotspots.map((spot) => (
            <HotspotLink key={`${spot.label}-${spot.className}`} spot={spot} />
          ))}
        </div>

        <div className="relative md:hidden">
          <Image
            src="/redesign/home-export-mobile.png"
            alt="ADR Bot homepage design preview mobile"
            width={1024}
            height={4653}
            priority
            className="h-auto w-full"
            sizes="100vw"
          />
          {mobileHotspots.map((spot) => (
            <HotspotLink key={`${spot.label}-${spot.className}`} spot={spot} />
          ))}
        </div>
      </section>
    </main>
  );
}
