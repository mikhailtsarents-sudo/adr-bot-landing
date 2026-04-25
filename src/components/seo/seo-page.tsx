"use client";

import { PageViewTracker } from "@/components/analytics/page-view-tracker";
import { TrackedTelegramLink } from "@/components/landing/tracked-telegram-link";
import { Reveal } from "@/components/landing/reveal";
import { SectionHeading } from "@/components/landing/section-heading";
import type {
  SeoPageConfig,
  SeoFaqCard,
  SeoRelatedLink,
} from "@/lib/seo-pages";
import {
  buildSeoPageStructuredData,
  getSeoPageFaqs,
  getSeoPageRelatedLinks,
} from "@/lib/seo-pages";
import {
  ArrowRight,
  ChevronRight,
  BookOpenText,
  MessagesSquare,
  PanelTop,
  Sparkles,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

function SampleCard({
  label,
  title,
  text,
}: {
  label: string;
  title: string;
  text: string;
}) {
  return (
    <div className="brand-card rounded-[1.6rem] p-5">
      <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-amber-700">
        <span className="inline-flex h-2 w-2 rounded-full bg-amber-400" />
        {label}
      </div>
      <h3 className="mt-4 font-display text-2xl font-semibold tracking-[-0.02em] text-slate-900">
        {title}
      </h3>
      <p className="mt-3 text-sm leading-7 text-slate-600">{text}</p>
    </div>
  );
}

function InternalLinkCard({ link }: { link: SeoRelatedLink }) {
  return (
    <Link
      href={link.href}
      className="brand-card group rounded-[1.5rem] p-5 transition hover:-translate-y-0.5 hover:border-amber-300"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-display text-xl font-semibold text-slate-900">
            {link.label}
          </h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">{link.note}</p>
        </div>
        <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-slate-400 transition group-hover:text-amber-600" />
      </div>
    </Link>
  );
}

function TelegramButton({
  source,
  label,
  className,
}: {
  source: string;
  label: string;
  className?: string;
}) {
  return (
    <TrackedTelegramLink
      source={source}
      locale="de"
      className={[
        "inline-flex items-center justify-center gap-2 rounded-full bg-[var(--color-accent)] px-6 py-3 text-sm font-semibold text-[var(--color-dark)] shadow-[0_16px_30px_rgba(242,183,5,0.24)] transition hover:-translate-y-0.5 hover:bg-[var(--color-accent-strong)]",
        className ?? "",
      ].join(" ")}
    >
      {label}
      <ArrowRight className="h-4 w-4 shrink-0" />
    </TrackedTelegramLink>
  );
}

function SectionDividerLabel({ text }: { text: string }) {
  return (
    <span className="inline-flex items-center rounded-full border border-amber-300 bg-amber-50 px-4 py-2 font-mono text-[11px] font-medium uppercase tracking-[0.32em] text-amber-700">
      {text}
    </span>
  );
}

function FaqCard({ item }: { item: SeoFaqCard }) {
  return (
    <div className="brand-card rounded-[1.5rem] p-5">
      <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-400">
        <MessagesSquare className="h-4 w-4 text-amber-500" />
        FAQ
      </div>
      <h3 className="mt-3 font-display text-2xl font-semibold tracking-[-0.02em] text-slate-900">
        {item.question}
      </h3>
      <p className="mt-3 text-sm leading-7 text-slate-600">{item.answer}</p>
    </div>
  );
}

export function SeoPage({ page }: { page: SeoPageConfig }) {
  const faqs = getSeoPageFaqs(page);
  const relatedLinks = getSeoPageRelatedLinks(page);
  const hasSampleQuestions = Boolean(page.sampleQuestions?.length);
  const hasSampleTerms = Boolean(page.sampleTerms?.length);
  const hasFaqs = Boolean(faqs.length);
  const structuredData = buildSeoPageStructuredData(page);

  return (
    <main className="relative overflow-hidden bg-[var(--color-bg)] text-[var(--color-text)]">
      <PageViewTracker source={page.telegramSource} pageSlug={page.slug} locale="de" />
      {structuredData.map((item, index) => (
        <script
          key={`${page.slug}-jsonld-${index}`}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(item) }}
        />
      ))}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-[420px] bg-[radial-gradient(ellipse_80%_50%_at_50%_-5%,_rgba(246,181,72,0.16),_transparent_58%)]" />
        <div className="absolute -right-44 top-[8%] h-[520px] w-[520px] rounded-full bg-[radial-gradient(circle,_rgba(180,200,230,0.18),_transparent_60%)] blur-3xl" />
        <div className="absolute -left-24 top-[18%] h-[280px] w-[280px] rounded-full bg-[radial-gradient(circle,_rgba(242,183,5,0.08),_transparent_65%)] blur-3xl" />
        <div className="grid-overlay absolute inset-0 opacity-[0.5]" />
      </div>

      <section className="relative mx-auto flex w-full max-w-7xl flex-col px-6 pb-16 pt-6 sm:px-8 lg:px-10">
        <Reveal className="mb-8 flex items-center justify-between rounded-[1.75rem] border border-[var(--color-border)] bg-white/90 px-4 py-3 shadow-[0_16px_44px_rgba(15,23,42,0.08)] backdrop-blur-md sm:mb-10 sm:rounded-full sm:px-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[linear-gradient(135deg,#e8a030,#f6b548)] text-white shadow-[0_4px_14px_rgba(232,160,48,0.3)]">
              <BookOpenText className="h-5 w-5" />
            </div>
            <div>
              <p className="font-display text-sm font-semibold tracking-[0.16em] text-slate-900 uppercase">
                ADR Bot
              </p>
              <p className="text-xs text-slate-500">Lernvorschau fuer den Telegram-Bot</p>
            </div>
          </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <Link
                href="/"
                className="hidden text-sm font-medium text-slate-500 transition hover:text-slate-800 sm:inline-flex"
            >
              Zur Startseite
              </Link>
            <TelegramButton
              source={`${page.telegramSource}_top`}
              label="In Telegram starten"
              className="bg-transparent px-0 py-0 text-slate-600 shadow-none hover:bg-transparent hover:text-slate-900"
            />
          </div>
        </Reveal>

        <div className="grid flex-1 items-start gap-10 lg:grid-cols-[1.04fr_0.96fr] lg:gap-14">
          <Reveal className="max-w-2xl">
            <SectionDividerLabel text={page.heroKicker} />
            <h1 className="mt-8 font-display text-5xl font-semibold tracking-[-0.03em] text-slate-900 sm:text-6xl lg:text-7xl">
              {page.heroTitle}
            </h1>
            <p className="mt-7 max-w-xl text-lg leading-8 text-slate-600 sm:text-xl">
              {page.heroLead}
            </p>
            <p className="mt-4 max-w-xl text-sm leading-7 text-slate-500">
              {page.heroSupport}
            </p>
            <div className="mt-9 flex flex-col gap-4 sm:flex-row">
              <TelegramButton source={`${page.telegramSource}_hero`} label={page.ctaButton} />
              <Link
                href={relatedLinks[0]?.href ?? "/"}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-400 hover:bg-slate-50"
              >
                  {relatedLinks[0]?.label ?? "Zur Startseite"}
                <ChevronRight className="h-4 w-4 shrink-0" />
              </Link>
            </div>
          </Reveal>

          <Reveal
            delay={0.08}
            className="overflow-hidden rounded-[2.2rem] border border-[rgba(242,183,5,0.26)] bg-[linear-gradient(135deg,#fffdf8,#fff8ec,#ffffff)] p-6 shadow-[0_20px_54px_rgba(242,183,5,0.14)] sm:p-8"
          >
            <div className="grid gap-6 md:grid-cols-[0.92fr_1.08fr] md:items-center">
              <div className="relative overflow-hidden rounded-[1.7rem] bg-[var(--color-dark)] p-5 text-white">
                <div className="absolute inset-0 opacity-15">
                  <Image
                    src="/redesign/truck-secondary.svg"
                    alt=""
                    fill
                    className="object-contain object-right"
                    sizes="400px"
                  />
                </div>
                <div className="relative z-10 flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--color-accent)] text-[var(--color-dark)]">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-display text-2xl font-semibold text-white">
                      Was du hier bekommst
                    </p>
                    <p className="text-sm text-white/58">
                      Kleines Sample, klare Orientierung, Telegram als naechster Schritt.
                    </p>
                  </div>
                </div>
                <div className="relative z-10 mt-6 rounded-[1.2rem] border border-white/12 bg-white/8 px-4 py-4 text-sm text-white/72">
                  Diese Seite ist die visuelle Einstiegsflaeche. Der Bot uebernimmt die echte Tiefe.
                </div>
              </div>
              <div className="space-y-3">
                <div className="brand-card-soft rounded-2xl px-4 py-3 text-sm text-slate-700">
                  Nur ein kleiner Ausschnitt statt voller Kursinhalt
                </div>
                <div className="brand-card-soft rounded-2xl px-4 py-3 text-sm text-slate-700">
                  Nueszlich fuer SEO und fruehe Orientierung
                </div>
                <div className="brand-card-soft rounded-2xl px-4 py-3 text-sm text-slate-700">
                  Mehr Fragen, mehr Begriffe und Drill im Telegram-Bot
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="relative mx-auto w-full max-w-7xl px-6 py-16 sm:px-8 lg:px-10">
        <Reveal>
          <SectionHeading
            eyebrow="Worum es geht"
            title={page.intentTitle}
            description=""
          />
        </Reveal>
        <div className="mt-8 grid gap-5 lg:grid-cols-2">
          {page.intentParagraphs.map((paragraph, index) => (
            <Reveal
              key={paragraph}
              delay={index * 0.06}
              className="brand-card rounded-[1.8rem] p-6"
            >
              <p className="text-base leading-8 text-slate-600">{paragraph}</p>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="relative mx-auto w-full max-w-7xl px-6 py-16 sm:px-8 lg:px-10">
        <Reveal>
          <SectionHeading
            eyebrow="Beispiele"
            title={page.sampleTitle}
            description={page.sampleLead}
          />
        </Reveal>

        {hasSampleQuestions ? (
          <div className="mt-10">
            <p className="mb-4 font-mono text-[11px] uppercase tracking-[0.28em] text-slate-400">
              Fragen
            </p>
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {page.sampleQuestions!.map((item, index) => (
                <Reveal key={item.question} delay={index * 0.05}>
                  <SampleCard
                    label="Frage"
                    title={item.question}
                    text={item.answer}
                  />
                </Reveal>
              ))}
            </div>
          </div>
        ) : null}

        {hasSampleTerms ? (
          <div className="mt-10">
            <p className="mb-4 font-mono text-[11px] uppercase tracking-[0.28em] text-slate-400">
              Begriffe
            </p>
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {page.sampleTerms!.map((item, index) => (
                <Reveal key={item.term} delay={index * 0.05}>
                  <SampleCard label="Begriff" title={item.term} text={item.note} />
                </Reveal>
              ))}
            </div>
          </div>
        ) : null}

        {page.sampleCalloutTitle && page.sampleCalloutText ? (
          <Reveal className="mt-10 rounded-[2rem] border border-amber-200 bg-[linear-gradient(135deg,#fff8ec,#fffdf8,#ffffff)] p-6 shadow-[0_18px_44px_rgba(242,183,5,0.12)] sm:p-8">
            <div className="flex items-start gap-4">
              <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-600">
                <PanelTop className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-display text-2xl font-semibold text-slate-900">
                  {page.sampleCalloutTitle}
                </h3>
                <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
                  {page.sampleCalloutText}
                </p>
              </div>
            </div>
          </Reveal>
        ) : null}
      </section>

      <section className="relative mx-auto w-full max-w-7xl px-6 py-16 sm:px-8 lg:px-10">
        <div className="grid gap-10 lg:grid-cols-[0.92fr_1.08fr] lg:items-start">
          <Reveal>
            <SectionHeading
              eyebrow="Warum Telegram"
              title={page.whyTelegramTitle}
              description=""
            />
            <div className="mt-6 space-y-4">
              {page.whyTelegramParagraphs.map((paragraph) => (
                <div key={paragraph} className="brand-card rounded-2xl px-5 py-4">
                  <p className="text-sm leading-7 text-slate-600">{paragraph}</p>
                </div>
              ))}
            </div>
          </Reveal>

          <Reveal delay={0.08} className="brand-dark-panel rounded-[2rem] p-6 text-white sm:p-8">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--color-accent)] text-[var(--color-dark)]">
                <MessagesSquare className="h-5 w-5" />
              </div>
              <div>
                <p className="font-display text-2xl font-semibold text-white">
                  Telegram als Vollversion
                </p>
                <p className="text-sm text-white/58">
                  Die Seite bleibt klein. Der Bot liefert die Tiefe.
                </p>
              </div>
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/12 bg-white/8 px-4 py-3 text-sm text-white/78">
                Mehr Fragen
              </div>
              <div className="rounded-2xl border border-white/12 bg-white/8 px-4 py-3 text-sm text-white/78">
                Mehr Wiederholung
              </div>
              <div className="rounded-2xl border border-white/12 bg-white/8 px-4 py-3 text-sm text-white/78">
                Mehr Begriffe
              </div>
              <div className="rounded-2xl border border-white/12 bg-white/8 px-4 py-3 text-sm text-white/78">
                Klarer naechster Schritt
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {hasFaqs ? (
        <section className="relative mx-auto w-full max-w-7xl px-6 py-16 sm:px-8 lg:px-10">
          <Reveal>
            <SectionHeading
              eyebrow="FAQ"
              title="Kurze Antworten vor dem Wechsel in den Bot"
              description="Die FAQ ist bewusst klein gehalten: hilfreich fuer SEO, aber nicht vollstaendig."
            />
          </Reveal>
          <div className="mt-10 grid gap-5 lg:grid-cols-2">
            {faqs.map((item, index) => (
              <Reveal key={item.question} delay={index * 0.05}>
                <FaqCard item={item} />
              </Reveal>
            ))}
          </div>
        </section>
      ) : null}

      <section className="relative mx-auto w-full max-w-7xl px-6 py-16 sm:px-8 lg:px-10">
        <Reveal>
          <SectionHeading
            eyebrow="Weiterfuehrende Seiten"
            title="Weiter fuehrende Seiten"
            description="Jede neue SEO-Seite verlinkt zur Startseite, zu passenden Preview-Seiten und zum naechsten logischen Schritt."
          />
        </Reveal>
        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          {relatedLinks.map((link, index) => (
            <Reveal key={link.href} delay={index * 0.05}>
              <InternalLinkCard link={link} />
            </Reveal>
          ))}
        </div>
      </section>

      <section className="relative mx-auto w-full max-w-7xl px-6 py-16 sm:px-8 lg:px-10">
        <Reveal>
          <div className="overflow-hidden rounded-[2.7rem] bg-[linear-gradient(135deg,#1a1a1a_0%,#223126_100%)] px-6 py-10 text-white shadow-[0_28px_80px_rgba(15,23,42,0.22)] sm:p-10 lg:p-14">
            <div className="relative">
              <div className="absolute -right-10 -top-14 h-48 w-48 rounded-full bg-[rgba(242,183,5,0.18)] blur-3xl" />
              <h2 className="mt-4 max-w-3xl font-display text-4xl font-semibold tracking-[-0.03em] text-white sm:text-5xl">
                {page.ctaTitle}
              </h2>
              <p className="mt-5 max-w-2xl text-base leading-8 text-white/72 sm:text-lg">
                {page.ctaLead}
              </p>
              <div className="mt-8">
                <TelegramButton
                  source={`${page.telegramSource}_final`}
                  label={page.ctaButton}
                />
              </div>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-white/56">
                {page.disclaimer}
              </p>
            </div>
          </div>
        </Reveal>
      </section>
    </main>
  );
}
