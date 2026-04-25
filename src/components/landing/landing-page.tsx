"use client";

import { PageViewTracker } from "@/components/analytics/page-view-tracker";
import { useLang } from "@/lib/i18n/use-lang";
import {
  ArrowRight,
  Bot,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  Layers3,
  MessageCircleMore,
  ShieldCheck,
  Sparkles,
  Truck,
} from "lucide-react";
import { motion, useScroll, useTransform } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getLandingConversionCopy } from "./landing-copy";
import { LanguageSwitcher } from "./language-switcher";
import { PhoneCarousel } from "./phone-carousel";
import { Reveal } from "./reveal";
import { SectionHeading } from "./section-heading";
import { TrackedTelegramLink } from "./tracked-telegram-link";

const pathIcons = [Truck, Layers3, ClipboardCheck];
const stepIcons = [MessageCircleMore, ChevronRight, ShieldCheck];
const proofIcons = [ClipboardCheck, Sparkles];

function ParallaxRoadBg() {
  const { scrollY } = useScroll();
  const [metrics, setMetrics] = useState({ maxScroll: 1, maxShift: 0 });

  useEffect(() => {
    function updateMetrics() {
      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;
      const imageHeight = viewportWidth * (1536 / 1024);
      const maxShift = Math.max(0, imageHeight - viewportHeight);
      const maxScroll = Math.max(
        1,
        document.documentElement.scrollHeight - viewportHeight,
      );
      setMetrics({ maxScroll, maxShift });
    }

    updateMetrics();

    const resizeObserver = new ResizeObserver(updateMetrics);
    resizeObserver.observe(document.body);
    window.addEventListener("resize", updateMetrics);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", updateMetrics);
    };
  }, []);

  const backgroundY = useTransform(
    scrollY,
    [0, metrics.maxScroll],
    [0, -metrics.maxShift],
  );

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <motion.div style={{ y: backgroundY }} className="absolute inset-x-0 top-0">
        <Image
          src="/redesign/dual-truck-master.png"
          alt=""
          width={1024}
          height={1536}
          priority
          className="h-auto w-screen max-w-none"
          sizes="100vw"
        />
      </motion.div>
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,10,6,0.12)_0%,rgba(15,10,6,0.06)_24%,rgba(15,10,6,0.12)_60%,rgba(15,10,6,0.24)_100%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(15,10,6,0.10)_0%,rgba(15,10,6,0.02)_32%,rgba(15,10,6,0.02)_70%,rgba(15,10,6,0.10)_100%)]" />
    </div>
  );
}

function PrimaryLink({
  label,
  source,
  locale,
}: {
  label: string;
  source: string;
  locale?: string;
}) {
  return (
    <TrackedTelegramLink
      source={source}
      locale={locale}
      className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--color-accent)] px-6 py-3 text-sm font-semibold text-white shadow-[0_4px_18px_rgba(232,160,48,0.35)] transition hover:bg-[var(--color-accent-strong)] hover:shadow-[0_6px_24px_rgba(232,160,48,0.45)]"
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
      className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-400 hover:bg-slate-50"
    >
      {label}
      <ChevronRight className="h-4 w-4 shrink-0" />
    </Link>
  );
}

function BulletList({ items }: { items: string[] }) {
  return (
    <div className="mt-6 grid gap-3">
      {items.map((item) => (
        <div
          key={item}
          className="flex items-start gap-3 rounded-2xl border border-white/42 bg-white/60 px-4 py-3.5 shadow-[0_8px_22px_rgba(15,10,6,0.08)] backdrop-blur-md"
        >
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
          <span className="text-sm leading-6 text-slate-700">{item}</span>
        </div>
      ))}
    </div>
  );
}

export function LandingPage() {
  const { lang } = useLang();
  const copy = getLandingConversionCopy(lang);

  return (
    <main className="relative overflow-x-hidden bg-transparent text-[var(--color-text)]">
      <PageViewTracker
        source={lang === "en" ? "landing_home_en" : "landing_home"}
        pageSlug={lang === "en" ? "home-en" : lang === "ru" ? "home-ru" : "home"}
        locale={lang}
      />
      <ParallaxRoadBg />

      <section className="relative z-10 mx-auto flex w-full max-w-7xl flex-col px-6 pb-16 pt-6 sm:min-h-screen sm:px-8 lg:px-10">
        <Reveal className="relative z-[90] mb-12 flex items-center justify-between rounded-full border border-white/55 bg-white/52 px-5 py-3 shadow-[0_10px_28px_rgba(15,10,6,0.12)] backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[linear-gradient(135deg,#e8a030,#f6b548)] text-white shadow-[0_4px_14px_rgba(232,160,48,0.3)]">
              <Bot className="h-5 w-5" />
            </div>
            <div>
              <p className="font-display text-sm font-semibold uppercase tracking-[0.16em] text-slate-900">
                ADR Bot
              </p>
              <p className="text-xs text-slate-500">{copy.nav.tagline}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <TrackedTelegramLink
              source="nav_open_telegram"
              locale={lang}
              className="hidden text-sm font-medium text-slate-500 transition hover:text-slate-800 sm:inline-flex"
            >
              {copy.nav.openInTelegram}
            </TrackedTelegramLink>
          </div>
        </Reveal>

        <div className="grid flex-1 items-center gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14">
          <Reveal className="max-w-2xl rounded-[2rem] border border-white/46 bg-[rgba(255,252,246,0.58)] p-6 shadow-[0_22px_60px_rgba(15,10,6,0.13)] backdrop-blur-[12px] sm:p-8">
            <span className="inline-flex items-center rounded-full border border-amber-300 bg-amber-50 px-4 py-2 font-mono text-[11px] font-medium uppercase tracking-[0.32em] text-amber-700">
              {copy.hero.eyebrow}
            </span>

            <h1 className="mt-8 font-display text-5xl font-semibold tracking-[-0.03em] text-slate-900 sm:text-6xl lg:text-7xl">
              {copy.hero.title}
            </h1>

            <p className="mt-7 max-w-xl text-lg leading-8 text-slate-700 sm:text-xl">
              {copy.hero.description}
            </p>

            <div className="mt-6 inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50/90 px-4 py-2 text-sm font-medium text-emerald-700 shadow-[0_8px_22px_rgba(16,185,129,0.10)]">
              {copy.hero.microcopy}
            </div>

            <div className="mt-9 flex flex-col gap-4 sm:flex-row">
              <PrimaryLink label={copy.hero.cta} source="hero_primary" locale={lang} />
              <SecondaryLink label={copy.hero.secondary} />
            </div>

            <p className="mt-4 max-w-xl text-sm leading-6 text-slate-500">
              {copy.hero.note}
            </p>
          </Reveal>

          <Reveal delay={0.12} className="relative lg:justify-self-end lg:translate-y-8">
            <PhoneCarousel />
          </Reveal>
        </div>
      </section>

      <section className="relative z-10 mx-auto w-full max-w-7xl px-6 py-16 sm:px-8 lg:px-10">
        <Reveal>
          <SectionHeading
            eyebrow={copy.pathSelection.eyebrow}
            title={copy.pathSelection.title}
            description={copy.pathSelection.description}
          />
        </Reveal>
        <div className="mt-12 grid gap-5 lg:grid-cols-3">
          {copy.pathSelection.cards.map((card, index) => {
            const Icon = pathIcons[index];
            return (
              <Reveal
                key={card.title}
                delay={index * 0.07}
                className="rounded-[1.8rem] border border-white/45 bg-white/56 p-6 shadow-[0_10px_28px_rgba(15,10,6,0.10)] backdrop-blur-md"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-600">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-5 font-display text-2xl font-semibold text-slate-900">
                  {card.title}
                </h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">{card.text}</p>
              </Reveal>
            );
          })}
        </div>
      </section>

      <section className="relative z-10 mx-auto w-full max-w-7xl px-6 py-16 sm:px-8 lg:px-10">
        <div className="grid gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
          <Reveal>
            <SectionHeading
              eyebrow={copy.proof.eyebrow}
              title={copy.proof.title}
              description={copy.proof.description}
            />
            <div className="mt-8 grid gap-4">
              {copy.proof.cards.map((card, index) => {
                const Icon = proofIcons[index];
                return (
                  <div
                    key={card.label}
                    className="rounded-[1.7rem] border border-white/42 bg-white/58 p-6 shadow-[0_8px_22px_rgba(15,10,6,0.08)] backdrop-blur-md"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-100 text-amber-600">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-slate-400">
                          {card.label}
                        </p>
                        <h3 className="font-display text-xl font-semibold text-slate-900">
                          {card.title}
                        </h3>
                      </div>
                    </div>
                    <p className="mt-4 text-sm leading-7 text-slate-600">{card.text}</p>
                  </div>
                );
              })}
            </div>
          </Reveal>

          <Reveal delay={0.12} className="rounded-[2rem] border border-white/45 bg-white/58 p-6 shadow-[0_10px_28px_rgba(15,10,6,0.10)] backdrop-blur-md sm:p-8">
            <PhoneCarousel />
            <p className="mt-6 text-center text-sm leading-6 text-slate-500">
              {copy.proof.screenshotCaption}
            </p>
          </Reveal>
        </div>
      </section>

      <section
        id="how-it-works"
        className="relative z-10 mx-auto w-full max-w-7xl px-6 py-16 sm:px-8 lg:px-10"
      >
        <Reveal>
          <SectionHeading
            align="center"
            eyebrow={copy.howItWorks.eyebrow}
            title={copy.howItWorks.title}
            description={copy.howItWorks.description}
          />
        </Reveal>
        <div className="relative mt-14 grid gap-6 lg:grid-cols-3">
          <div className="absolute left-[16.66%] right-[16.66%] top-10 hidden h-px bg-[linear-gradient(90deg,transparent,rgba(232,160,48,0.5),transparent)] lg:block" />
          {copy.howItWorks.steps.map((step, index) => {
            const Icon = stepIcons[index];
            return (
              <Reveal
                key={step.title}
                delay={index * 0.08}
                className="relative rounded-[2rem] border border-white/45 bg-white/58 p-7 shadow-[0_10px_28px_rgba(15,10,6,0.10)] backdrop-blur-md"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-600">
                  <Icon className="h-6 w-6" />
                </div>
                <p className="mt-6 font-mono text-[11px] uppercase tracking-[0.26em] text-slate-400">
                  Step {index + 1}
                </p>
                <h3 className="mt-2 font-display text-2xl font-semibold text-slate-900">
                  {step.title}
                </h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">{step.text}</p>
              </Reveal>
            );
          })}
        </div>
      </section>

      <section className="relative z-10 mx-auto w-full max-w-7xl px-6 py-16 sm:px-8 lg:px-10">
        <div className="grid gap-6 lg:grid-cols-2">
          <Reveal>
            <div className="h-full rounded-[2rem] border border-white/45 bg-white/58 p-7 shadow-[0_10px_28px_rgba(15,10,6,0.10)] backdrop-blur-md">
              <SectionHeading
                eyebrow={copy.freeStart.eyebrow}
                title={copy.freeStart.title}
                description={copy.freeStart.description}
              />
              <BulletList items={copy.freeStart.bullets} />
              <div className="mt-8">
                <PrimaryLink
                  label={copy.freeStart.cta}
                  source="free_start_cta"
                  locale={lang}
                />
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.08}>
            <div className="h-full rounded-[2rem] border border-amber-200/60 bg-amber-50/62 p-7 shadow-[0_10px_28px_rgba(15,10,6,0.10)] backdrop-blur-md">
              <SectionHeading
                eyebrow={copy.fullAccess.eyebrow}
                title={copy.fullAccess.title}
                description={copy.fullAccess.description}
              />
              <BulletList items={copy.fullAccess.bullets} />
              <div className="mt-8">
                <PrimaryLink
                  label={copy.fullAccess.cta}
                  source="full_access_cta"
                  locale={lang}
                />
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="relative z-10 mx-auto w-full max-w-7xl px-6 py-16 sm:px-8 lg:px-10">
        <Reveal>
          <div className="rounded-[2.25rem] border border-amber-200/55 bg-[linear-gradient(135deg,rgba(255,253,248,0.72),rgba(255,248,236,0.64),rgba(255,255,255,0.58))] px-6 py-8 shadow-[0_10px_28px_rgba(15,10,6,0.10)] backdrop-blur-md sm:p-10 lg:p-12">
            <SectionHeading
              eyebrow={copy.trust.eyebrow}
              title={copy.trust.title}
              description={copy.trust.description}
            />
            <div className="mt-8 flex flex-wrap gap-3">
              {copy.trust.bullets.map((item, index) => (
                <Reveal
                  key={item}
                  delay={index * 0.05}
                  className="rounded-full border border-white/52 bg-white/62 px-4 py-2 text-sm text-slate-700 shadow-[0_8px_20px_rgba(15,10,6,0.08)] backdrop-blur-md"
                >
                  {item}
                </Reveal>
              ))}
            </div>
          </div>
        </Reveal>
      </section>

      <section className="relative z-10 mx-auto w-full max-w-7xl px-6 py-16 sm:px-8 lg:px-10">
        <Reveal>
          <SectionHeading
            eyebrow={copy.faq.eyebrow}
            title={copy.faq.title}
            description={copy.faq.description}
          />
        </Reveal>
        <div className="mt-12 grid gap-4">
          {copy.faq.items.map((item, index) => (
            <Reveal
              key={item.question}
              delay={index * 0.04}
              className="rounded-[1.6rem] border border-white/45 bg-white/58 p-6 shadow-[0_8px_22px_rgba(15,10,6,0.08)] backdrop-blur-md"
            >
              <h3 className="font-display text-xl font-semibold text-slate-900">
                {item.question}
              </h3>
              <p className="mt-3 text-sm leading-7 text-slate-600">{item.answer}</p>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="relative z-10 mx-auto w-full max-w-7xl px-6 py-16 sm:px-8 lg:px-10">
        <Reveal>
          <div className="overflow-hidden rounded-[2.5rem] border border-amber-200/55 bg-[linear-gradient(135deg,rgba(255,248,236,0.72),rgba(255,243,214,0.64),rgba(254,249,240,0.58))] px-6 py-10 shadow-[0_8px_40px_rgba(232,160,48,0.12)] backdrop-blur-md sm:p-10 lg:p-14">
            <div className="relative">
              <div className="absolute -right-10 -top-14 h-48 w-48 rounded-full bg-amber-200/40 blur-3xl" />
              <p className="font-mono text-[11px] uppercase tracking-[0.32em] text-amber-700/70">
                {copy.cta.eyebrow}
              </p>
              <h2 className="mt-4 max-w-3xl font-display text-4xl font-semibold tracking-[-0.03em] text-slate-900 sm:text-5xl">
                {copy.cta.title}
              </h2>
              <p className="mt-5 max-w-2xl text-base leading-8 text-slate-700 sm:text-lg">
                {copy.cta.description}
              </p>
              <div className="mt-8">
                <PrimaryLink label={copy.cta.button} source="final_cta" locale={lang} />
              </div>
              <p className="mt-4 text-sm text-slate-500">{copy.cta.note}</p>
            </div>
          </div>
        </Reveal>
      </section>

      <footer className="relative z-10 mx-auto w-full max-w-7xl px-6 pb-10 pt-4 sm:px-8 lg:px-10">
        <Reveal className="flex flex-col gap-6 rounded-[2rem] border border-white/45 bg-white/56 px-6 py-6 text-sm text-slate-600 shadow-[0_10px_28px_rgba(15,10,6,0.10)] backdrop-blur-md md:flex-row md:items-center md:justify-between">
          <p className="max-w-2xl leading-7">{copy.footer.description}</p>
          <div className="flex flex-col gap-2 md:items-end">
            <TrackedTelegramLink
              source="footer_telegram"
              locale={lang}
              className="font-medium text-slate-900 transition hover:text-amber-600"
            >
              {copy.footer.link}
            </TrackedTelegramLink>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500 md:justify-end">
              <Link href="/impressum" className="hover:text-slate-900">
                Impressum
              </Link>
              <Link href="/datenschutz" className="hover:text-slate-900">
                Datenschutz
              </Link>
              <Link href="/legal" className="hover:text-slate-900">
                Legal
              </Link>
            </div>
            <p className="max-w-md text-xs leading-5 text-slate-400 md:text-right">
              {copy.pilotNotice}
            </p>
            <p className="max-w-xs text-xs leading-5 text-slate-400 md:text-right">
              {copy.footer.disclaimer}
            </p>
          </div>
        </Reveal>
      </footer>
    </main>
  );
}
