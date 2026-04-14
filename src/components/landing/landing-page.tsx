"use client";

import { useLang } from "@/lib/i18n/use-lang";
import { ArrowRight, BadgeCheck, Bot, CheckCircle2, ChevronRight, Send } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { LanguageSwitcher } from "./language-switcher";
import { Reveal } from "./reveal";
import { TrackedTelegramLink } from "./tracked-telegram-link";

const heroLinks = [
  { id: "benefits", label: { de: "Vorteile", en: "Benefits", ru: "Преимущества" } },
  { id: "how-it-works", label: { de: "So geht's", en: "How it works", ru: "Как это работает" } },
  { id: "faq", label: { de: "FAQ", en: "FAQ", ru: "FAQ" } },
];

function navLabel(
  labels: { de: string; en: string; ru: string },
  lang: string,
) {
  if (lang === "ru") return labels.ru;
  if (lang === "en") return labels.en;
  return labels.de;
}

function HandoffPhone({
  className = "",
  priority = false,
}: {
  className?: string;
  priority?: boolean;
}) {
  return (
    <div
      className={[
        "relative overflow-hidden rounded-[2.15rem] border-[5px] border-[#151515] bg-[#111111] shadow-[0_30px_80px_rgba(0,0,0,0.28)]",
        className,
      ].join(" ")}
    >
      <div className="flex justify-center bg-[#111111] pb-1 pt-2.5">
        <div className="h-4 w-20 rounded-full bg-black" />
      </div>
      <div className="relative bg-white" style={{ paddingBottom: "180%" }}>
        <Image
          src="/redesign/telegram-preview.png"
          alt="ADR Bot Telegram preview"
          fill
          priority={priority}
          className="object-cover object-top"
          sizes="(max-width: 768px) 240px, 320px"
        />
      </div>
      <div className="flex justify-center bg-[#111111] py-2.5">
        <div className="h-1 w-20 rounded-full bg-white/20" />
      </div>
    </div>
  );
}

function PrimaryLink({ label, source }: { label: string; source: string }) {
  return (
    <TrackedTelegramLink
      source={source}
      className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--color-accent)] px-7 py-3.5 text-sm font-semibold text-[var(--color-dark)] shadow-[0_8px_20px_rgba(0,0,0,0.12)] transition hover:-translate-y-0.5 hover:bg-[var(--color-accent-strong)]"
    >
      {label}
      <ArrowRight className="h-4 w-4 shrink-0" />
    </TrackedTelegramLink>
  );
}

function SecondaryLink({ label }: { label: string }) {
  return (
    <Link
      href="#how-it-works"
      className="inline-flex items-center justify-center gap-2 rounded-full border border-black/12 bg-white/82 px-7 py-3.5 text-sm font-semibold text-[#1c1b18] shadow-[0_8px_20px_rgba(0,0,0,0.08)] transition hover:bg-white"
    >
      {label}
      <ChevronRight className="h-4 w-4 shrink-0" />
    </Link>
  );
}

export function LandingPage() {
  const { lang, t } = useLang();

  const pilotNotice =
    lang === "en"
      ? "ADR Bot is currently a free pilot project in a public test phase for self-study support around ADR exam preparation in German. Content and features may change."
      : lang === "ru"
        ? "ADR Bot сейчас работает как бесплатный пилотный проект в открытой тестовой фазе для самостоятельной подготовки к ADR на немецком. Контент и функции могут меняться."
        : "ADR Bot befindet sich aktuell als kostenloses Pilotprojekt in einer öffentlichen Testphase für die selbstständige Vorbereitung auf die ADR-Prüfung auf Deutsch. Inhalte und Funktionen können sich ändern.";

  const quickBenefits = t.howItWorks.steps;
  const designCards = [
    t.benefits.cards[0],
    t.benefits.cards[1],
    t.benefits.cards[4],
  ];

  return (
    <main className="bg-[#f4efe2] text-[var(--color-text)]">
      <section className="relative overflow-hidden bg-[#f4efe2]">
        <div className="absolute inset-0">
          <Image
            src="/redesign/hero-scene-desktop.png"
            alt=""
            fill
            priority
            className="hidden object-cover object-center md:block"
            sizes="100vw"
          />
          <Image
            src="/redesign/hero-scene-mobile.png"
            alt=""
            fill
            priority
            className="object-cover object-top md:hidden"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(244,239,226,0.96)_0%,rgba(244,239,226,0.92)_24%,rgba(244,239,226,0.62)_42%,rgba(244,239,226,0.16)_62%,rgba(244,239,226,0)_100%)] md:bg-[linear-gradient(90deg,rgba(244,239,226,0.96)_0%,rgba(244,239,226,0.92)_26%,rgba(244,239,226,0.76)_40%,rgba(244,239,226,0.18)_56%,rgba(244,239,226,0.02)_74%,rgba(244,239,226,0)_100%)]" />
          <div className="absolute inset-x-0 bottom-0 h-40 bg-[linear-gradient(180deg,rgba(244,239,226,0)_0%,rgba(244,239,226,0.82)_74%,#f4efe2_100%)]" />
        </div>

        <div className="relative mx-auto flex min-h-[980px] w-full max-w-[1200px] flex-col px-6 pb-24 pt-6 sm:px-8 lg:min-h-[940px] lg:px-10">
          <Reveal className="flex items-center justify-between gap-4 rounded-full border border-white/75 bg-[rgba(255,255,255,0.88)] px-5 py-3 shadow-[0_12px_28px_rgba(0,0,0,0.08)] backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--color-accent)] text-[var(--color-dark)]">
                <Bot className="h-5 w-5" />
              </div>
              <div>
                <p className="font-display text-sm font-semibold uppercase tracking-[0.18em] text-[#fbfaf6] mix-blend-difference">
                  ADR Bot
                </p>
                <p className="text-xs text-[#8f8a7d]">{t.nav.tagline}</p>
              </div>
            </div>

            <div className="hidden items-center gap-8 lg:flex">
              {heroLinks.map((link) => (
                <Link
                  key={link.id}
                  href={`#${link.id}`}
                  className="text-sm font-medium text-[#211d17] transition hover:text-[#7a5a00]"
                >
                  {navLabel(link.label, lang)}
                </Link>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <LanguageSwitcher />
              <TrackedTelegramLink
                source="nav_open_telegram"
                className="hidden rounded-full bg-[var(--color-accent)] px-5 py-2.5 text-sm font-semibold text-[#1c1b18] shadow-[0_8px_20px_rgba(0,0,0,0.12)] transition hover:bg-[var(--color-accent-strong)] sm:inline-flex"
              >
                {t.nav.openInTelegram}
              </TrackedTelegramLink>
            </div>
          </Reveal>

          <div className="relative flex flex-1 flex-col pt-10 sm:pt-14 lg:pt-16">
            <Reveal className="max-w-[560px]">
              <div className="w-[170px] sm:w-[210px]">
                <Image
                  src="/redesign/adr-signs.svg"
                  alt="ADR signs"
                  width={420}
                  height={368}
                  className="h-auto w-full"
                  sizes="(max-width: 640px) 170px, 210px"
                />
              </div>

              <h1 className="mt-6 max-w-[620px] font-display text-5xl font-semibold leading-[0.93] tracking-[-0.05em] text-[#fffaf1] drop-shadow-[0_4px_14px_rgba(0,0,0,0.22)] sm:text-6xl lg:text-[4.9rem]">
                {t.hero.title}
              </h1>

              <p className="mt-5 max-w-[520px] text-lg leading-8 text-[#f4eedf] drop-shadow-[0_4px_12px_rgba(0,0,0,0.2)] sm:text-[1.35rem]">
                {lang === "ru"
                  ? "Учитесь в дороге, уверенно и экологично."
                  : lang === "en"
                    ? "Learn on the go, safely and with less friction."
                    : "Lerne unterwegs, sicher und umweltfreundlich."}
              </p>

              <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                <PrimaryLink label={t.hero.ctaPrimary} source="hero_primary" />
                <SecondaryLink label={t.hero.ctaSecondary} />
              </div>

              <p className="mt-4 max-w-[430px] text-sm leading-7 text-[#f3ead4]">
                {t.hero.note}
              </p>
            </Reveal>

            <Reveal
              delay={0.12}
              className="relative mt-10 w-[220px] sm:w-[260px] lg:absolute lg:-bottom-10 lg:left-4 lg:mt-0 lg:w-[310px]"
            >
              <HandoffPhone priority />
            </Reveal>
          </div>
        </div>
      </section>

      <section
        id="how-it-works"
        className="relative mx-auto w-full max-w-[1200px] px-6 py-16 sm:px-8 lg:px-10 lg:py-20"
      >
        <Reveal className="grid items-center gap-10 lg:grid-cols-[0.82fr_1.18fr]">
          <div className="rounded-[2rem] bg-white/88 p-5 shadow-[0_20px_54px_rgba(0,0,0,0.08)] backdrop-blur-sm">
            <HandoffPhone className="mx-auto w-full max-w-[300px]" />
          </div>

          <div>
            <p className="font-display text-4xl font-semibold tracking-[-0.03em] text-[#191611] sm:text-5xl">
              {lang === "ru"
                ? "Как работает обучение"
                : lang === "en"
                  ? "How learning works"
                  : "So funktioniert das Lernen"}
            </p>

            <div className="mt-8 space-y-5">
              {quickBenefits.map((item, index) => (
                <div key={item.title} className="flex gap-4">
                  <div className="mt-1 flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[rgba(242,183,5,0.16)] text-[#7f5d00]">
                    {index === 0 ? (
                      <BadgeCheck className="h-5 w-5" />
                    ) : index === 1 ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : (
                      <Send className="h-5 w-5" />
                    )}
                  </div>
                  <div>
                    <h2 className="font-display text-2xl font-semibold text-[#1d1912] sm:text-[2rem]">
                      {item.title}
                    </h2>
                    <p className="mt-2 max-w-[520px] text-base leading-7 text-[var(--color-text-soft)]">
                      {item.text}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8">
              <PrimaryLink label={t.hero.ctaPrimary} source="how_it_works_primary" />
            </div>
          </div>
        </Reveal>
      </section>

      <section
        id="benefits"
        className="relative mx-auto w-full max-w-[1200px] px-6 py-4 sm:px-8 lg:px-10 lg:py-10"
      >
        <Reveal className="overflow-hidden rounded-[2.4rem] border border-[#e3dccd] bg-white/92 shadow-[0_24px_60px_rgba(0,0,0,0.08)]">
          <div className="grid gap-0 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="p-8 sm:p-10">
              <p className="font-display text-4xl font-semibold tracking-[-0.03em] text-[#17130f] sm:text-5xl">
                {lang === "ru"
                  ? "Почему дизайн сразу ощущается как ADR"
                  : lang === "en"
                    ? "Why the design feels ADR instantly"
                    : "Warum das Design sofort nach ADR aussieht"}
              </p>
              <p className="mt-4 max-w-[560px] text-base leading-8 text-[var(--color-text-soft)]">
                {lang === "ru"
                  ? "Фон, знаки, жёлтые CTA и интерфейс Telegram работают как одна визуальная система. За счёт этого страница выглядит ближе к экзаменационному контексту, а не к абстрактному лендингу."
                  : lang === "en"
                    ? "The road scene, ADR signs, yellow actions, and Telegram UI all work as one visual system. That makes the page feel closer to the exam context instead of a generic landing page."
                    : "Szene, ADR-Schilder, gelbe CTA-Flaechen und das Telegram-Interface arbeiten als ein einziges visuelles System. Dadurch wirkt die Seite naeher am Pruefungskontext statt wie eine generische Landingpage."}
              </p>

              <div className="mt-8 grid gap-4 md:grid-cols-3">
                {designCards.map((card) => (
                  <div
                    key={card.title}
                    className="rounded-[1.35rem] border border-[#ece5d6] bg-[#fffdf8] p-5 shadow-[0_12px_32px_rgba(0,0,0,0.04)]"
                  >
                    <h3 className="text-base font-semibold text-[#17130f]">{card.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-[var(--color-text-soft)]">
                      {card.text}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative min-h-[320px] overflow-hidden bg-[#f2ede1] lg:min-h-full">
              <Image
                src="/redesign/truck-secondary.png"
                alt=""
                fill
                className="object-cover object-center"
                sizes="(max-width: 1024px) 100vw, 480px"
              />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.12),rgba(255,255,255,0.02)_38%,rgba(17,17,17,0.22)_100%)]" />
            </div>
          </div>
        </Reveal>
      </section>

      <section
        id="faq"
        className="relative mx-auto w-full max-w-[1200px] px-6 py-14 sm:px-8 lg:px-10 lg:py-18"
      >
        <Reveal className="rounded-[2.4rem] bg-[rgba(255,255,255,0.72)] px-6 py-8 shadow-[0_18px_48px_rgba(0,0,0,0.06)] backdrop-blur-sm sm:px-8 sm:py-10">
          <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <p className="font-display text-[11px] uppercase tracking-[0.28em] text-[#7c715d]">
                {t.trust.eyebrow}
              </p>
              <h2 className="mt-4 font-display text-4xl font-semibold tracking-[-0.03em] text-[#17130f] sm:text-5xl">
                {t.cta.title}
              </h2>
              <p className="mt-4 max-w-[720px] text-base leading-8 text-[var(--color-text-soft)]">
                {t.cta.description}
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                {t.trust.bullets.map((item) => (
                  <span
                    key={item}
                    className="rounded-full border border-[#e6decf] bg-[#fffaf0] px-4 py-2 text-sm text-[#544a39]"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-3 lg:items-end">
              <PrimaryLink label={t.cta.button} source="final_cta" />
              <p className="max-w-sm text-sm leading-7 text-[var(--color-text-soft)] lg:text-right">
                {t.cta.note}
              </p>
            </div>
          </div>
        </Reveal>
      </section>

      <footer className="mx-auto w-full max-w-[1200px] px-6 pb-10 pt-4 sm:px-8 lg:px-10">
        <Reveal className="flex flex-col gap-5 border-t border-black/10 py-6 text-sm text-[var(--color-text-soft)] md:flex-row md:items-start md:justify-between">
          <div className="max-w-2xl">
            <p className="font-display text-2xl font-semibold text-[#17130f]">ADR Bot</p>
            <p className="mt-2 leading-7">{t.footer.description}</p>
          </div>

          <div className="flex flex-col gap-3 md:items-end">
            <div className="flex flex-wrap gap-4 text-[#544a39]">
              {heroLinks.map((link) => (
                <Link key={link.id} href={`#${link.id}`} className="hover:text-[#111111]">
                  {navLabel(link.label, lang)}
                </Link>
              ))}
              <TrackedTelegramLink source="footer_link" className="hover:text-[#111111]">
                {t.footer.link}
              </TrackedTelegramLink>
            </div>
            <p className="max-w-md text-xs leading-6 md:text-right">{pilotNotice}</p>
            <p className="max-w-md text-xs leading-6 md:text-right">{t.footer.disclaimer}</p>
          </div>
        </Reveal>
      </footer>
    </main>
  );
}
