"use client";

import { useLang } from "@/lib/i18n/use-lang";
import { ArrowRight, BadgeCheck, CheckCircle2, Send } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Reveal } from "./reveal";
import { TrackedTelegramLink } from "./tracked-telegram-link";

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

function footerNavLabel(id: "benefits" | "how-it-works" | "faq", lang: string) {
  if (id === "benefits") {
    if (lang === "ru") return "Преимущества";
    if (lang === "en") return "Benefits";
    return "Vorteile";
  }
  if (id === "how-it-works") {
    if (lang === "ru") return "Как это работает";
    if (lang === "en") return "How it works";
    return "So geht's";
  }
  return "FAQ";
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
        <div className="relative mx-auto w-full max-w-[1200px] px-4 pb-10 pt-4 sm:px-6 lg:px-8 lg:pb-14 lg:pt-6">
          <div className="relative overflow-hidden rounded-[2rem] shadow-[0_24px_80px_rgba(0,0,0,0.12)]">
            <div className="sr-only">
              <h1>{t.hero.title}</h1>
              <p>{t.hero.description}</p>
            </div>

            <Image
              src="/redesign/hero-export-desktop.png"
              alt="ADR Bot hero preview"
              width={1024}
              height={640}
              priority
              className="hidden h-auto w-full md:block"
              sizes="(max-width: 1280px) 100vw, 1200px"
            />
            <Image
              src="/redesign/hero-export-mobile.png"
              alt="ADR Bot hero preview mobile"
              width={1024}
              height={1536}
              priority
              className="h-auto w-full md:hidden"
              sizes="100vw"
            />

            <TrackedTelegramLink
              source="hero_primary"
              aria-label={t.hero.ctaPrimary}
              className="absolute right-[4.8%] top-[4.8%] hidden h-[10.6%] w-[22.2%] rounded-full md:block"
            >
              <span className="sr-only">{t.hero.ctaPrimary}</span>
            </TrackedTelegramLink>
            <TrackedTelegramLink
              source="hero_primary_mobile"
              aria-label={t.hero.ctaPrimary}
              className="absolute right-[6.5%] top-[3.8%] h-[7.4%] w-[39%] rounded-full md:hidden"
            >
              <span className="sr-only">{t.hero.ctaPrimary}</span>
            </TrackedTelegramLink>

            <Link
              href="#benefits"
              aria-label="Benefits"
              className="absolute left-[34%] top-[5.8%] hidden h-[5%] w-[9%] rounded-full md:block"
            />
            <Link
              href="#how-it-works"
              aria-label="How it works"
              className="absolute left-[44.5%] top-[5.8%] hidden h-[5%] w-[11%] rounded-full md:block"
            />
            <Link
              href="#faq"
              aria-label="FAQ"
              className="absolute left-[57.2%] top-[5.8%] hidden h-[5%] w-[6%] rounded-full md:block"
            />
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
              <Link href="#benefits" className="hover:text-[#111111]">
                {footerNavLabel("benefits", lang)}
              </Link>
              <Link href="#how-it-works" className="hover:text-[#111111]">
                {footerNavLabel("how-it-works", lang)}
              </Link>
              <Link href="#faq" className="hover:text-[#111111]">
                FAQ
              </Link>
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
