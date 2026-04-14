"use client";

import { useLang } from "@/lib/i18n/use-lang";
import {
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  ChevronRight,
  CircleHelp,
  MessageSquareText,
  Send,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { LanguageSwitcher } from "./language-switcher";
import { Reveal } from "./reveal";
import { SectionHeading } from "./section-heading";
import { TrackedTelegramLink } from "./tracked-telegram-link";

function PrimaryCta({
  label,
  source,
  dark = false,
}: {
  label: string;
  source: string;
  dark?: boolean;
}) {
  return (
    <TrackedTelegramLink
      source={source}
      className={[
        "inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition",
        dark
          ? "bg-[#f2b705] text-[#14110d] shadow-[0_14px_32px_rgba(242,183,5,0.22)] hover:-translate-y-0.5 hover:bg-[#e6ac00]"
          : "bg-[#f2b705] text-[#14110d] shadow-[0_14px_28px_rgba(17,17,17,0.14)] hover:-translate-y-0.5 hover:bg-[#e6ac00]",
      ].join(" ")}
    >
      {label}
      <ArrowRight className="h-4 w-4" />
    </TrackedTelegramLink>
  );
}

function SecondaryCta({ label }: { label: string }) {
  return (
    <Link
      href="#how-it-works"
      className="inline-flex items-center justify-center gap-2 rounded-full border border-white/18 bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/16"
    >
      {label}
      <ChevronRight className="h-4 w-4" />
    </Link>
  );
}

function NavLink({ href, children }: { href: string; children: string }) {
  return (
    <Link
      href={href}
      className="text-sm font-medium text-white/88 transition hover:text-[#f2b705]"
    >
      {children}
    </Link>
  );
}

function StepCard({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-[1.6rem] border border-[#e8decb] bg-white p-5 shadow-[0_18px_40px_rgba(0,0,0,0.06)]">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#fff5cf] text-[#9b6b00]">
        {icon}
      </div>
      <h3 className="text-xl font-semibold text-[#1a1611]">{title}</h3>
      <p className="mt-2 text-sm leading-7 text-[#645b4e]">{text}</p>
    </div>
  );
}

export function LandingPage() {
  const { lang, t } = useLang();

  const benefitCards = [
    t.benefits.cards[0],
    t.benefits.cards[1],
    t.benefits.cards[4],
  ];

  return (
    <main className="overflow-x-hidden bg-[#f5f0e5] text-[#1a1611]">
      <section className="relative isolate overflow-hidden bg-[#120f0c] text-white">
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
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(14,11,8,0.78)_0%,rgba(14,11,8,0.52)_36%,rgba(14,11,8,0.12)_74%,rgba(14,11,8,0.10)_100%)] md:bg-[linear-gradient(90deg,rgba(14,11,8,0.78)_0%,rgba(14,11,8,0.56)_34%,rgba(14,11,8,0.16)_72%,rgba(14,11,8,0.08)_100%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(14,11,8,0.18)_0%,rgba(14,11,8,0.02)_22%,rgba(14,11,8,0.08)_100%)]" />
        </div>

        <div className="relative mx-auto flex min-h-[860px] max-w-[1280px] flex-col px-5 pb-16 pt-5 sm:px-6 lg:min-h-[920px] lg:px-8 lg:pt-6">
          <header className="flex items-center justify-between gap-4 rounded-full border border-white/14 bg-white/8 px-4 py-3 backdrop-blur-md sm:px-5">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#f2b705] shadow-[0_10px_24px_rgba(242,183,5,0.25)]">
                <span className="text-xl">🤖</span>
              </div>
              <div className="min-w-0">
                <div className="font-display text-sm font-semibold uppercase tracking-[0.28em] text-white/96">
                  ADR BOT
                </div>
                <div className="truncate text-sm text-white/72">{t.nav.tagline}</div>
              </div>
            </div>

            <nav className="hidden items-center gap-8 lg:flex">
              <NavLink href="#benefits">
                {lang === "ru" ? "Преимущества" : lang === "en" ? "Benefits" : "Vorteile"}
              </NavLink>
              <NavLink href="#how-it-works">
                {lang === "ru" ? "Как это работает" : lang === "en" ? "How it works" : "So geht's"}
              </NavLink>
              <NavLink href="#faq">FAQ</NavLink>
            </nav>

            <div className="flex items-center gap-3">
              <LanguageSwitcher />
              <div className="hidden sm:block">
                <PrimaryCta label={t.nav.openInTelegram} source="nav_open_telegram" dark />
              </div>
            </div>
          </header>

          <div className="relative flex flex-1 items-center py-12 lg:py-16">
            <div className="grid w-full items-end gap-10 lg:grid-cols-[minmax(0,560px)_1fr]">
              <div className="relative z-10 max-w-[620px]">
                <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#f6d88a]/40 bg-[#fff0bf] px-5 py-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-[#966500] shadow-[0_8px_18px_rgba(0,0,0,0.12)]">
                  ✨ {t.hero.eyebrow}
                </div>

                <div className="mb-8 max-w-[330px] sm:max-w-[420px]">
                  <Image
                    src="/redesign/adr-signs.png"
                    alt="ADR warning signs"
                    width={520}
                    height={220}
                    className="h-auto w-full drop-shadow-[0_22px_34px_rgba(0,0,0,0.35)]"
                    sizes="(max-width: 640px) 320px, 420px"
                  />
                </div>

                <h1 className="max-w-[620px] font-display text-[3rem] font-semibold leading-[0.95] tracking-[-0.05em] text-white sm:text-[4.4rem] lg:text-[4.9rem]">
                  {t.hero.title}
                </h1>

                <p className="mt-5 max-w-[560px] text-lg leading-8 text-white/82 sm:text-xl">
                  {t.hero.description}
                </p>

                <div className="mt-8 flex flex-wrap gap-3">
                  <PrimaryCta label={t.hero.ctaPrimary} source="hero_primary" dark />
                  <SecondaryCta label={t.hero.ctaSecondary} />
                </div>

                <p className="mt-4 max-w-[440px] text-sm leading-6 text-white/62">
                  {t.hero.note}
                </p>
              </div>

              <div className="relative hidden min-h-[520px] lg:block">
                <div className="absolute bottom-[-36px] left-0 w-[335px]">
                  <Image
                    src="/redesign/telegram-preview.png"
                    alt="Telegram preview of ADR Bot"
                    width={305}
                    height={550}
                    className="h-auto w-full drop-shadow-[0_28px_42px_rgba(0,0,0,0.42)]"
                    sizes="335px"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="mx-auto max-w-[1240px] px-5 py-20 sm:px-6 lg:px-8">
        <Reveal className="grid items-start gap-10 lg:grid-cols-[360px_minmax(0,1fr)]">
          <div className="rounded-[2rem] border border-[#e8decb] bg-[#fbf8f1] p-4 shadow-[0_20px_42px_rgba(0,0,0,0.08)]">
            <Image
              src="/redesign/telegram-preview.png"
              alt={t.carousel.caption}
              width={305}
              height={550}
              className="mx-auto h-auto w-full max-w-[305px]"
              sizes="(max-width: 1024px) 280px, 305px"
            />
          </div>

          <div>
            <SectionHeading
              eyebrow={t.howItWorks.eyebrow}
              title={t.howItWorks.title}
              description={t.howItWorks.description}
            />

            <div className="mt-8 grid gap-5 md:grid-cols-3">
              <StepCard
                icon={<Send className="h-5 w-5" />}
                title={t.howItWorks.steps[0].title}
                text={t.howItWorks.steps[0].text}
              />
              <StepCard
                icon={<BadgeCheck className="h-5 w-5" />}
                title={t.howItWorks.steps[1].title}
                text={t.howItWorks.steps[1].text}
              />
              <StepCard
                icon={<CheckCircle2 className="h-5 w-5" />}
                title={t.howItWorks.steps[2].title}
                text={t.howItWorks.steps[2].text}
              />
            </div>

            <div className="mt-8">
              <PrimaryCta label={t.hero.ctaPrimary} source="how_it_works_primary" />
            </div>
          </div>
        </Reveal>
      </section>

      <section
        id="benefits"
        className="mx-auto max-w-[1240px] px-5 py-4 sm:px-6 lg:px-8 lg:py-8"
      >
        <Reveal className="overflow-hidden rounded-[2.4rem] border border-[#e5dccb] bg-white shadow-[0_24px_54px_rgba(0,0,0,0.07)]">
          <div className="grid gap-0 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="p-8 sm:p-10 lg:p-12">
              <SectionHeading
                eyebrow={t.benefits.eyebrow}
                title={t.benefits.title}
                description={t.benefits.description}
              />

              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                {t.benefits.checklist.map((item) => (
                  <div
                    key={item}
                    className="flex items-center gap-3 rounded-2xl border border-[#eee3cf] bg-[#fffaf0] px-4 py-3 text-sm font-medium text-[#332a1e]"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#f2b705] text-[#17130f]">
                      <CheckCircle2 className="h-4 w-4" />
                    </div>
                    <span>{item}</span>
                  </div>
                ))}
              </div>

              <div className="mt-8 grid gap-4 md:grid-cols-3">
                {benefitCards.map((card) => (
                  <div
                    key={card.title}
                    className="rounded-[1.4rem] border border-[#eee4d5] bg-[#fcf8ef] p-5 shadow-[0_12px_24px_rgba(0,0,0,0.04)]"
                  >
                    <h3 className="text-lg font-semibold text-[#1a1611]">{card.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-[#645b4e]">{card.text}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative min-h-[340px] bg-[#1a1611] lg:min-h-full">
              <Image
                src="/redesign/truck-secondary.png"
                alt=""
                fill
                className="object-cover object-center"
                sizes="(max-width: 1024px) 100vw, 460px"
              />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(17,17,17,0.04)_0%,rgba(17,17,17,0.18)_100%)]" />
            </div>
          </div>
        </Reveal>
      </section>

      <section className="mx-auto max-w-[1240px] px-5 py-20 sm:px-6 lg:px-8">
        <Reveal className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {t.audience.cards.map((card) => (
            <div
              key={card.title}
              className="rounded-[1.6rem] border border-[#e8decb] bg-[#fffdf8] p-6 shadow-[0_16px_36px_rgba(0,0,0,0.05)]"
            >
              <p className="text-lg font-semibold text-[#1b1712]">{card.title}</p>
              <p className="mt-3 text-sm leading-7 text-[#645b4e]">{card.text}</p>
            </div>
          ))}
        </Reveal>
      </section>

      <section id="faq" className="mx-auto max-w-[1240px] px-5 pb-24 sm:px-6 lg:px-8">
        <Reveal className="rounded-[2.6rem] bg-[#191612] px-6 py-10 text-white shadow-[0_26px_60px_rgba(0,0,0,0.18)] sm:px-8 sm:py-12 lg:px-12">
          <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
            <div>
              <SectionHeading
                eyebrow={t.trust.eyebrow}
                title={t.trust.title}
                description={t.trust.description}
                theme="dark"
              />

              <div className="mt-8 space-y-4">
                {t.trust.bullets.map((bullet) => (
                  <div key={bullet} className="flex items-center gap-3 text-white/84">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-[#f2b705]">
                      <CircleHelp className="h-4 w-4" />
                    </div>
                    <span className="text-sm font-medium sm:text-base">{bullet}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-white/6 p-6 backdrop-blur-sm">
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#f4d68a]">
                {t.cta.eyebrow}
              </p>
              <h2 className="mt-4 font-display text-3xl font-semibold tracking-[-0.03em] text-white sm:text-4xl">
                {t.cta.title}
              </h2>
              <p className="mt-3 text-base leading-7 text-white/72">{t.cta.description}</p>

              <div className="mt-8 flex flex-wrap gap-3">
                <PrimaryCta label={t.cta.button} source="final_cta" dark />
                <Link
                  href="#how-it-works"
                  className="inline-flex items-center gap-2 rounded-full border border-white/14 px-5 py-3 text-sm font-semibold text-white/82 transition hover:bg-white/8"
                >
                  {lang === "ru" ? "Посмотреть как это работает" : lang === "en" ? "See how it works" : "Ablauf ansehen"}
                  <MessageSquareText className="h-4 w-4" />
                </Link>
              </div>

              <p className="mt-4 text-sm leading-6 text-white/54">{t.cta.note}</p>
            </div>
          </div>
        </Reveal>
      </section>

      <footer className="border-t border-[#e4d8c4] bg-[#f5f0e5]">
        <div className="mx-auto flex max-w-[1240px] flex-col gap-6 px-5 py-8 text-sm text-[#5f5648] sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div>
            <p className="font-display text-2xl font-semibold text-[#17130f]">ADR Bot</p>
            <p className="mt-2 max-w-[620px] leading-7">{t.footer.description}</p>
          </div>

          <div className="flex flex-wrap items-center gap-5">
            <Link href="#benefits" className="transition hover:text-[#17130f]">
              {lang === "ru" ? "Преимущества" : lang === "en" ? "Benefits" : "Vorteile"}
            </Link>
            <Link href="#faq" className="transition hover:text-[#17130f]">
              FAQ
            </Link>
            <TrackedTelegramLink source="footer_telegram" className="transition hover:text-[#17130f]">
              {t.footer.link}
            </TrackedTelegramLink>
          </div>
        </div>
      </footer>
    </main>
  );
}
