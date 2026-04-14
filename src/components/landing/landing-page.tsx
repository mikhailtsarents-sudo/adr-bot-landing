"use client";

import { useLang } from "@/lib/i18n/use-lang";
import {
  ArrowRight,
  BadgeCheck,
  Bot,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  Languages,
  Layers3,
  MessageCircleMore,
  Route,
  Send,
  ShieldCheck,
  Sparkles,
  Truck,
  Waypoints,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { LanguageSwitcher } from "./language-switcher";
import { PhoneCarousel } from "./phone-carousel";
import { Reveal } from "./reveal";
import { SectionHeading } from "./section-heading";
import { TrackedTelegramLink } from "./tracked-telegram-link";

const problemIcons = [Languages, ClipboardCheck, Route, ShieldCheck];
const stepIcons = [MessageCircleMore, Waypoints, ShieldCheck];
const audienceIcons = [Truck, Layers3, CheckCircle2, Languages];

function PrimaryLink({ label }: { label: string }) {
  return (
    <TrackedTelegramLink
      source="hero_primary"
      className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--color-accent)] px-6 py-3.5 text-sm font-semibold text-[var(--color-dark)] shadow-[0_16px_30px_rgba(242,183,5,0.28)] transition hover:-translate-y-0.5 hover:bg-[var(--color-accent-strong)]"
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
      className="inline-flex items-center justify-center gap-2 rounded-full border border-white/18 bg-white/10 px-6 py-3.5 text-sm font-semibold text-white transition hover:border-white/32 hover:bg-white/14"
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
      : "ADR Bot befindet sich aktuell als kostenloses Pilotprojekt in einer öffentlichen Testphase. Das Angebot dient der unterstützenden Selbstvorbereitung rund um die ADR-Prüfung auf Deutsch. Inhalte und Funktionen können sich ändern.";

  const proofItems = [
    { label: lang === "ru" ? "Формат" : lang === "en" ? "Format" : "Format", value: "Telegram-first" },
    { label: lang === "ru" ? "Фокус" : lang === "en" ? "Focus" : "Fokus", value: "ADR Deutsch" },
    { label: lang === "ru" ? "Режим" : lang === "en" ? "Mode" : "Modus", value: lang === "en" ? "Short drills" : lang === "ru" ? "Короткие тренировки" : "Kurze Drills" },
  ];

  return (
    <main className="relative overflow-hidden bg-[#15120d] text-[var(--color-text)]">
      <div className="pointer-events-none fixed inset-0 -z-20">
        <Image
          src="/redesign/hero-desktop.png"
          alt=""
          fill
          priority
          className="hidden object-cover object-center md:block"
          sizes="100vw"
        />
        <Image
          src="/redesign/hero-mobile.png"
          alt=""
          fill
          priority
          className="object-cover object-center md:hidden"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(13,10,6,0.24),rgba(18,15,10,0.62)_34%,rgba(20,17,12,0.86)_72%,rgba(17,14,10,0.96)_100%)]" />
      </div>

      <section className="relative isolate min-h-screen text-white">
        <div className="relative mx-auto flex w-full max-w-7xl flex-col px-6 pb-18 pt-6 sm:px-8 lg:px-10">
          <Reveal className="brand-card mb-8 flex items-center justify-between rounded-[1.75rem] border-white/10 bg-[rgba(255,255,255,0.14)] px-4 py-3 text-white shadow-[0_14px_42px_rgba(17,12,7,0.22)] sm:mb-10 sm:rounded-full sm:px-5">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--color-accent)] text-[var(--color-dark)] shadow-[0_10px_24px_rgba(242,183,5,0.3)]">
                <Bot className="h-5 w-5" />
              </div>
              <div>
                <p className="font-display text-sm font-semibold uppercase tracking-[0.18em] text-white">
                  ADR Bot
                </p>
                <p className="text-xs text-white/74">{t.nav.tagline}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <LanguageSwitcher />
              <TrackedTelegramLink
                source="nav_open_telegram"
                className="hidden rounded-full border border-white/14 bg-[rgba(255,191,0,0.88)] px-4 py-2 text-sm font-semibold text-[#231b0b] transition hover:bg-[rgba(255,201,50,0.96)] sm:inline-flex"
              >
                {t.nav.openInTelegram}
              </TrackedTelegramLink>
            </div>
          </Reveal>

          <div className="grid items-center gap-10 pb-10 lg:min-h-[calc(100vh-10rem)] lg:grid-cols-[0.95fr_1.05fr] lg:gap-12">
            <Reveal className="relative z-10 max-w-2xl rounded-[2rem] border border-white/10 bg-[rgba(16,13,9,0.42)] p-6 shadow-[0_26px_72px_rgba(12,9,6,0.26)] backdrop-blur-[6px] sm:p-8">
              <span className="brand-chip">
                <Sparkles className="h-3.5 w-3.5" />
                {t.hero.eyebrow}
              </span>

              <h1 className="mt-8 font-display text-5xl font-semibold tracking-[-0.04em] text-white sm:text-6xl lg:text-7xl">
                {t.hero.title}
              </h1>

              <p className="mt-6 max-w-xl text-lg leading-8 text-white/82 sm:text-xl">
                {t.hero.description}
              </p>

              <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                <PrimaryLink label={t.hero.ctaPrimary} />
                <SecondaryLink label={t.hero.ctaSecondary} />
              </div>

              <p className="mt-4 max-w-lg text-sm leading-7 text-white/66">{t.hero.note}</p>

              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                {proofItems.map((item) => (
                  <div
                    key={item.label}
                    className="rounded-[1.4rem] border border-white/10 bg-[rgba(255,255,255,0.08)] px-4 py-4 backdrop-blur-sm"
                  >
                    <p className="text-[11px] uppercase tracking-[0.24em] text-white/55">
                      {item.label}
                    </p>
                    <p className="mt-2 text-sm font-semibold text-white">{item.value}</p>
                  </div>
                ))}
              </div>
            </Reveal>

            <Reveal delay={0.12} className="relative lg:justify-self-end">
              <div className="relative overflow-hidden rounded-[2.2rem] border border-white/10 bg-[rgba(17,13,9,0.4)] p-4 shadow-[0_28px_70px_rgba(12,8,5,0.3)] backdrop-blur-[8px]">
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),transparent_34%,rgba(0,0,0,0.28))]" />
                <div className="absolute right-4 top-4 z-10 rounded-full bg-[rgba(0,0,0,0.55)] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-white/78">
                  {lang === "ru" ? "Пилотный доступ" : lang === "en" ? "Pilot Access" : "Pilotzugang"}
                </div>
                <div className="relative flex min-h-[340px] items-end justify-center rounded-[1.8rem] p-4 sm:min-h-[460px] lg:min-h-[560px]">
                  <div className="w-full max-w-[284px] sm:max-w-[300px] lg:max-w-[310px]">
                    <div className="rounded-[2rem] border border-white/12 bg-[rgba(255,255,255,0.08)] p-3 backdrop-blur-lg">
                      <PhoneCarousel />
                    </div>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>

          <Reveal delay={0.18} className="mt-2 grid gap-4 lg:mt-4 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-[2rem] border border-white/10 bg-[rgba(255,255,255,0.09)] p-6 backdrop-blur-sm">
              <p className="text-[11px] uppercase tracking-[0.28em] text-white/55">
                {lang === "ru" ? "Как это ощущается" : lang === "en" ? "How it feels" : "Wie es sich anfuehlt"}
              </p>
              <div className="mt-4 grid gap-4 sm:grid-cols-3">
                <div>
                  <p className="font-display text-3xl text-white">01</p>
                  <p className="mt-2 text-sm text-white/72">
                    {lang === "ru" ? "Вы открываете Telegram и сразу попадаете в практику." : lang === "en" ? "You open Telegram and land directly in practice." : "Du oeffnest Telegram und landest direkt in der Uebung."}
                  </p>
                </div>
                <div>
                  <p className="font-display text-3xl text-white">02</p>
                  <p className="mt-2 text-sm text-white/72">
                    {lang === "ru" ? "Язык становится понятнее за счёт коротких повторений." : lang === "en" ? "The language becomes clearer through short repetitions." : "Die Sprache wird durch kurze Wiederholungen greifbarer."}
                  </p>
                </div>
                <div>
                  <p className="font-display text-3xl text-white">03</p>
                  <p className="mt-2 text-sm text-white/72">
                    {lang === "ru" ? "Сайт и бот работают как одна воронка." : lang === "en" ? "Site and bot work as one conversion path." : "Website und Bot arbeiten als ein gemeinsamer Pfad."}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-[2rem] border border-[rgba(242,183,5,0.36)] bg-[rgba(255,245,211,0.94)] p-6 text-[var(--color-dark)] shadow-[0_18px_48px_rgba(32,19,4,0.22)]">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--color-dark)] text-[var(--color-accent)]">
                  <Send className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-display text-2xl font-semibold">
                    {lang === "ru" ? "Сразу к действию" : lang === "en" ? "Go straight to action" : "Direkt in die Aktion"}
                  </p>
                  <p className="text-sm text-[var(--color-text-soft)]">
                    {lang === "ru"
                      ? "Без регистрации и лишних экранов."
                      : lang === "en"
                        ? "No signup and no dead-end screens."
                        : "Ohne Registrierung und ohne tote Zwischenschritte."}
                  </p>
                </div>
              </div>
              <div className="mt-6 space-y-3">
                {t.benefits.checklist.slice(0, 3).map((item) => (
                  <div
                    key={item}
                    className="flex items-center gap-3 rounded-[1.2rem] bg-white/84 px-4 py-3 text-sm text-[var(--color-text)]"
                  >
                    <BadgeCheck className="h-4 w-4 shrink-0 text-[var(--color-green)]" />
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

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
