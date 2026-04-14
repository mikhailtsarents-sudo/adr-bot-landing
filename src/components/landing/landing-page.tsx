"use client";

import { useLang } from "@/lib/i18n/use-lang";
import {
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  Languages,
  Layers3,
  MessageCircleMore,
  Route,
  ShieldCheck,
  Truck,
  Waypoints,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Reveal } from "./reveal";
import { SectionHeading } from "./section-heading";
import { TrackedTelegramLink } from "./tracked-telegram-link";

const problemIcons = [Languages, ClipboardCheck, Route, ShieldCheck];
const stepIcons = [MessageCircleMore, Waypoints, ShieldCheck];
const audienceIcons = [Truck, Layers3, CheckCircle2, Languages];

function DesignerHero() {
  const { lang, t } = useLang();

  const links = {
    benefits:
      lang === "ru" ? "Преимущества" : lang === "en" ? "Benefits" : "Vorteile",
    how:
      lang === "ru" ? "Как это работает" : lang === "en" ? "How it works" : "So geht's",
    faq: lang === "ru" ? "FAQ" : "FAQ",
  };

  return (
    <section className="relative overflow-hidden bg-[#d9c49a] px-3 py-4 sm:px-6 sm:py-6 lg:px-8">
      <div className="mx-auto max-w-[1100px]">
        <div className="relative mx-auto max-w-[1024px] overflow-hidden rounded-[2rem] border border-black/10 bg-[#b08c53] shadow-[0_26px_80px_rgba(47,31,9,0.28)]">
          <Image
            src="/redesign/hero-desktop.png"
            alt="ADR Bot homepage design preview with truck road background and Telegram preparation flow"
            width={1024}
            height={1536}
            className="hidden h-auto w-full md:block"
            priority
          />
          <Image
            src="/redesign/hero-mobile.png"
            alt="ADR Bot mobile homepage design preview with truck road background and Telegram preparation flow"
            width={1024}
            height={1536}
            className="h-auto w-full md:hidden"
            priority
          />

          <div className="absolute inset-0">
            <Link
              href="#benefits"
              aria-label={links.benefits}
              className="absolute left-[41.5%] top-[3.2%] hidden h-[3.5%] w-[11.5%] rounded-full md:block"
            />
            <Link
              href="#how-it-works"
              aria-label={links.how}
              className="absolute left-[52.7%] top-[3.2%] hidden h-[3.5%] w-[10.5%] rounded-full md:block"
            />
            <Link
              href="/adr-faq-fuer-fahrer"
              aria-label={links.faq}
              className="absolute left-[63.4%] top-[3.2%] hidden h-[3.5%] w-[6.5%] rounded-full md:block"
            />

            <TrackedTelegramLink
              source="designer_hero_top"
              aria-label={t.hero.ctaPrimary}
              className="absolute right-[4.4%] top-[2.4%] hidden h-[5.5%] w-[25.5%] rounded-full md:block"
            >
              <span className="sr-only">{t.hero.ctaPrimary}</span>
            </TrackedTelegramLink>
            <TrackedTelegramLink
              source="designer_hero_middle"
              aria-label={t.hero.ctaPrimary}
              className="absolute left-[45.3%] top-[48.6%] hidden h-[5.4%] w-[26.8%] rounded-full md:block"
            >
              <span className="sr-only">{t.hero.ctaPrimary}</span>
            </TrackedTelegramLink>

            <TrackedTelegramLink
              source="designer_hero_top_mobile"
              aria-label={t.hero.ctaPrimary}
              className="absolute right-[5.6%] top-[2.3%] h-[5.4%] w-[32.8%] rounded-full md:hidden"
            >
              <span className="sr-only">{t.hero.ctaPrimary}</span>
            </TrackedTelegramLink>
            <TrackedTelegramLink
              source="designer_hero_middle_mobile"
              aria-label={t.hero.ctaPrimary}
              className="absolute left-[36.8%] top-[48.6%] h-[5.2%] w-[40.8%] rounded-full md:hidden"
            >
              <span className="sr-only">{t.hero.ctaPrimary}</span>
            </TrackedTelegramLink>
          </div>
        </div>

        <div className="sr-only">
          <h1>{t.hero.title}</h1>
          <p>{t.hero.description}</p>
          <p>{t.hero.note}</p>
          <ul>
            <li>{t.benefits.checklist[0]}</li>
            <li>{t.benefits.checklist[1]}</li>
            <li>{t.benefits.checklist[2]}</li>
          </ul>
        </div>
      </div>
    </section>
  );
}

export function LandingPage() {
  const { lang, t } = useLang();
  const pilotNotice =
    lang === "en"
      ? "ADR Bot is currently a free pilot project in a public test phase for self-study support around ADR exam preparation in German. Content and features may change."
      : "ADR Bot befindet sich aktuell als kostenloses Pilotprojekt in einer öffentlichen Testphase. Das Angebot dient der unterstützenden Selbstvorbereitung rund um die ADR-Prüfung auf Deutsch. Inhalte und Funktionen können sich ändern.";

  return (
    <main className="relative overflow-hidden bg-[var(--color-bg)] text-[var(--color-text)]">
      <DesignerHero />

      <section className="relative mx-auto w-full max-w-7xl px-6 py-16 sm:px-8 lg:px-10">
        <Reveal>
          <SectionHeading
            eyebrow={t.problems.eyebrow}
            title={t.problems.title}
            description={t.problems.description}
          />
        </Reveal>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {t.problems.cards.map((card, index) => {
            const Icon = problemIcons[index];
            return (
              <Reveal
                key={card.title}
                delay={index * 0.07}
                className="brand-card rounded-[1.8rem] p-6"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[rgba(242,183,5,0.14)] text-[var(--color-dark)]">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-6 font-display text-xl font-semibold text-[var(--color-text-strong)]">
                  {card.title}
                </h3>
                <p className="mt-3 text-sm leading-7 text-[var(--color-text-soft)]">
                  {card.text}
                </p>
              </Reveal>
            );
          })}
        </div>
      </section>

      <section
        id="how-it-works"
        className="relative mx-auto w-full max-w-7xl px-6 py-16 sm:px-8 lg:px-10"
      >
        <Reveal>
          <SectionHeading
            align="center"
            eyebrow={t.howItWorks.eyebrow}
            title={t.howItWorks.title}
            description={t.howItWorks.description}
          />
        </Reveal>
        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          {t.howItWorks.steps.map((step, index) => {
            const Icon = stepIcons[index];
            return (
              <Reveal
                key={step.title}
                delay={index * 0.08}
                className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-dark)] p-7 text-white shadow-[0_24px_48px_rgba(15,23,42,0.16)]"
              >
                <div className="flex items-center justify-between">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--color-accent)] text-[var(--color-dark)]">
                    <Icon className="h-6 w-6" />
                  </div>
                  <p className="font-mono text-[11px] uppercase tracking-[0.26em] text-white/42">
                    Step {index + 1}
                  </p>
                </div>
                <h3 className="mt-8 font-display text-3xl font-semibold text-white">
                  {step.title}
                </h3>
                <p className="mt-4 text-sm leading-7 text-white/66">{step.text}</p>
              </Reveal>
            );
          })}
        </div>
      </section>

      <section
        id="benefits"
        className="relative mx-auto w-full max-w-7xl px-6 py-16 sm:px-8 lg:px-10"
      >
        <div className="grid gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
          <Reveal>
            <SectionHeading
              eyebrow={t.benefits.eyebrow}
              title={t.benefits.title}
              description={t.benefits.description}
            />
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {t.benefits.checklist.map((item, index) => (
                <Reveal
                  key={item}
                  delay={0.07 + index * 0.06}
                  className="brand-card flex items-center gap-3 rounded-[1.4rem] px-4 py-4"
                >
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-[var(--color-green)]" />
                  <span className="text-sm text-[var(--color-text)]">{item}</span>
                </Reveal>
              ))}
            </div>
          </Reveal>

          <Reveal delay={0.12} className="grid gap-4 sm:grid-cols-2">
            <div className="relative overflow-hidden rounded-[2rem] bg-[var(--color-dark)] p-6 text-white shadow-[0_24px_52px_rgba(15,23,42,0.18)] sm:col-span-2">
              <div className="absolute right-0 top-0 h-full w-[42%] opacity-20">
                <Image
                  src="/redesign/truck-secondary.svg"
                  alt=""
                  fill
                  className="object-contain object-right"
                  sizes="420px"
                />
              </div>
              <p className="relative z-10 max-w-md font-display text-3xl font-semibold">
                {lang === "ru"
                  ? "Сайт цепляет внимание. Telegram превращает интерес в привычку."
                  : lang === "en"
                    ? "The site earns attention. Telegram turns it into repetition."
                    : "Die Website holt Aufmerksamkeit. Telegram macht daraus Wiederholung."}
              </p>
            </div>
            {t.benefits.cards.map((card, index) => (
              <div
                key={card.title}
                className={[
                  "rounded-[1.7rem] border p-6 shadow-[0_16px_44px_rgba(15,23,42,0.08)]",
                  index === 1 || index === 4
                    ? "border-[rgba(242,183,5,0.26)] bg-[rgba(255,247,214,0.92)]"
                    : "border-[var(--color-border)] bg-white",
                ].join(" ")}
              >
                <h3 className="font-display text-xl font-semibold text-[var(--color-text-strong)]">
                  {card.title}
                </h3>
                <p className="mt-3 text-sm leading-7 text-[var(--color-text-soft)]">
                  {card.text}
                </p>
              </div>
            ))}
          </Reveal>
        </div>
      </section>

      <section className="relative mx-auto w-full max-w-7xl px-6 py-16 sm:px-8 lg:px-10">
        <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
          <Reveal>
            <SectionHeading
              eyebrow={t.audience.eyebrow}
              title={t.audience.title}
              description={t.audience.description}
            />
          </Reveal>
          <div className="grid gap-5 sm:grid-cols-2">
            {t.audience.cards.map((card, index) => {
              const Icon = audienceIcons[index];
              return (
                <Reveal
                  key={card.title}
                  delay={index * 0.06}
                  className="brand-card rounded-[1.8rem] p-6"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[rgba(46,125,50,0.12)] text-[var(--color-green)]">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-5 font-display text-xl font-semibold text-[var(--color-text-strong)]">
                    {card.title}
                  </h3>
                  <p className="mt-3 text-sm leading-7 text-[var(--color-text-soft)]">
                    {card.text}
                  </p>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      <section className="relative mx-auto w-full max-w-7xl px-6 py-16 sm:px-8 lg:px-10">
        <Reveal>
          <div className="overflow-hidden rounded-[2.4rem] border border-[rgba(242,183,5,0.24)] bg-[linear-gradient(135deg,#fffdfa,#fff7dd,#ffffff)] px-6 py-8 shadow-[0_24px_56px_rgba(242,183,5,0.12)] sm:p-10 lg:p-12">
            <SectionHeading
              eyebrow={t.trust.eyebrow}
              title={t.trust.title}
              description={t.trust.description}
            />
            <div className="mt-8 flex flex-wrap gap-3">
              {t.trust.bullets.map((item, index) => (
                <Reveal
                  key={item}
                  delay={index * 0.06}
                  className="rounded-full border border-[var(--color-border)] bg-white px-4 py-2 text-sm text-[var(--color-text)] shadow-sm"
                >
                  {item}
                </Reveal>
              ))}
            </div>
          </div>
        </Reveal>
      </section>

      <section className="relative mx-auto w-full max-w-7xl px-6 py-16 sm:px-8 lg:px-10">
        <Reveal>
          <div className="overflow-hidden rounded-[2.7rem] bg-[linear-gradient(135deg,#1a1a1a_0%,#223126_100%)] px-6 py-10 text-white shadow-[0_28px_80px_rgba(15,23,42,0.22)] sm:p-10 lg:p-14">
            <div className="relative">
              <div className="absolute -right-14 -top-14 h-52 w-52 rounded-full bg-[rgba(242,183,5,0.22)] blur-3xl" />
              <p className="font-mono text-[11px] uppercase tracking-[0.32em] text-[rgba(255,255,255,0.5)]">
                {t.cta.eyebrow}
              </p>
              <h2 className="mt-4 max-w-3xl font-display text-4xl font-semibold tracking-[-0.03em] text-white sm:text-5xl">
                {t.cta.title}
              </h2>
              <p className="mt-5 max-w-2xl text-base leading-8 text-white/72 sm:text-lg">
                {t.cta.description}
              </p>
              <div className="mt-8">
                <TrackedTelegramLink
                  source="final_cta"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--color-accent)] px-7 py-3.5 text-sm font-semibold text-[var(--color-dark)] shadow-[0_16px_30px_rgba(242,183,5,0.28)] transition hover:-translate-y-0.5 hover:bg-[var(--color-accent-strong)]"
                >
                  {t.cta.button}
                  <ArrowRight className="h-4 w-4 shrink-0" />
                </TrackedTelegramLink>
              </div>
              <p className="mt-4 text-sm text-white/56">{t.cta.note}</p>
            </div>
          </div>
        </Reveal>
      </section>

      <footer className="relative mx-auto w-full max-w-7xl px-6 pb-10 pt-4 sm:px-8 lg:px-10">
        <Reveal className="brand-card flex flex-col gap-6 rounded-[2rem] px-6 py-6 text-sm text-[var(--color-text-soft)] md:flex-row md:items-center md:justify-between">
          <p className="max-w-2xl leading-7">{t.footer.description}</p>
          <div className="flex flex-col gap-2 md:items-end">
            <TrackedTelegramLink
              source="footer_link"
              className="font-medium text-[var(--color-text-strong)] transition hover:text-[var(--color-green)]"
            >
              {t.footer.link}
            </TrackedTelegramLink>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-[var(--color-text-muted)] md:justify-end">
              <Link href="/impressum" className="hover:text-[var(--color-text-strong)]">
                Impressum
              </Link>
              <Link href="/datenschutz" className="hover:text-[var(--color-text-strong)]">
                Datenschutz
              </Link>
              <Link href="/legal" className="hover:text-[var(--color-text-strong)]">
                Legal
              </Link>
            </div>
            <p className="max-w-md text-xs leading-5 text-[var(--color-text-muted)] md:text-right">
              {pilotNotice}
            </p>
            <p className="max-w-xs text-xs leading-5 text-[var(--color-text-muted)] md:text-right">
              {t.footer.disclaimer}
            </p>
          </div>
        </Reveal>
      </footer>
    </main>
  );
}
