"use client";

import { PageViewTracker } from "@/components/analytics/page-view-tracker";
import { LanguageSwitcher } from "@/components/landing/language-switcher";
import { TrackedTelegramLink } from "@/components/landing/tracked-telegram-link";
import { useLang } from "@/lib/i18n/use-lang";
import { ArrowRight, ChevronLeft, ChevronRight, Send } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { getPremiumPreviewCopy } from "./premium-preview-copy";
import styles from "./premium-preview-page.module.css";

function useVisibleCards() {
  const [visibleCards, setVisibleCards] = useState(4);

  useEffect(() => {
    function updateVisibleCards() {
      if (window.innerWidth <= 640) {
        setVisibleCards(1);
        return;
      }
      if (window.innerWidth <= 1020) {
        setVisibleCards(2);
        return;
      }
      setVisibleCards(4);
    }

    updateVisibleCards();
    window.addEventListener("resize", updateVisibleCards);
    return () => window.removeEventListener("resize", updateVisibleCards);
  }, []);

  return visibleCards;
}

type PremiumPreviewPageProps = {
  trackingSource?: string;
  trackingSlug?: string;
};

export function PremiumPreviewPage({
  trackingSource = "premium_preview",
  trackingSlug = "premium-preview",
}: PremiumPreviewPageProps = {}) {
  const { lang } = useLang();
  const copy = getPremiumPreviewCopy(lang);
  const previewCards = copy.carousel.cards;
  const courseCards = copy.courses.cards;
  const benefitCards = copy.benefits.cards;
  const stepCards = copy.steps.cards;
  const pricingCards = copy.pricing.cards;
  const faqItems = copy.faq.items;
  const visibleCards = useVisibleCards();
  const [activePage, setActivePage] = useState(0);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [isPaused, setIsPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const touchStartX = useRef<number | null>(null);

  const totalPages = Math.max(1, Math.ceil(previewCards.length / visibleCards));
  const currentPage = Math.min(activePage, totalPages - 1);
  const maxIndex = Math.max(0, previewCards.length - visibleCards);
  const activeIndex = Math.min(currentPage * visibleCards, maxIndex);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateReducedMotion = () => setReducedMotion(mediaQuery.matches);
    updateReducedMotion();
    mediaQuery.addEventListener("change", updateReducedMotion);
    return () => mediaQuery.removeEventListener("change", updateReducedMotion);
  }, []);

  useEffect(() => {
    if (reducedMotion || isPaused || totalPages <= 1) return;
    const timer = window.setInterval(() => {
      setActivePage((current) => (current + 1) % totalPages);
    }, 5200);
    return () => window.clearInterval(timer);
  }, [isPaused, reducedMotion, totalPages]);

  function goNext() {
    setActivePage((current) => (current + 1) % totalPages);
  }

  function goPrev() {
    setActivePage((current) => (current + totalPages - 1) % totalPages);
  }

  function handleTouchStart(clientX: number) {
    touchStartX.current = clientX;
    setIsPaused(true);
  }

  function handleTouchEnd(clientX: number) {
    if (touchStartX.current == null) {
      setIsPaused(false);
      return;
    }
    const delta = clientX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(delta) > 45) {
      if (delta < 0) goNext();
      else goPrev();
    }
    setIsPaused(false);
  }

  return (
    <main className={styles.page}>
      <PageViewTracker
        source={trackingSource}
        pageSlug={trackingSlug}
        locale={lang}
      />

      <div className={styles.gridMask} />

      <div className={styles.navWrap}>
        <div className={styles.container}>
          <div className={styles.nav}>
            <a href="#top" className={styles.brand} aria-label={copy.nav.ariaLabel}>
              <span className={styles.brandMark} aria-hidden="true" />
              <span>
                ADR <span>Bot</span>
              </span>
            </a>

            <nav className={styles.navLinks} aria-label={copy.nav.ariaLabel}>
              <a href="#funktionen">{copy.nav.features}</a>
              <a href="#kurse">{copy.nav.courses}</a>
              <a href="#preise">{copy.nav.pricing}</a>
              <a href="#faq">{copy.nav.faq}</a>
            </nav>

            <div className={styles.navActions}>
              <LanguageSwitcher compact />
              <TrackedTelegramLink source={`${trackingSource}_nav_telegram`} locale={lang} className={styles.telegramInline}>
                <Send size={16} />
                {copy.nav.telegram}
              </TrackedTelegramLink>
              <TrackedTelegramLink source={`${trackingSource}_nav_primary`} locale={lang} className={`${styles.button} ${styles.primaryButton}`}>
                {copy.nav.primary}
              </TrackedTelegramLink>
            </div>
          </div>

          <div className={styles.mobileTopBar}>
            <LanguageSwitcher compact />
          </div>
        </div>
      </div>

      <div className={styles.container}>
        <section id="top" className={styles.hero}>
            <div className={styles.heroCopy}>
              <div className={styles.eyebrow}>
                <span className={styles.liveDot} />
                {copy.hero.eyebrow}
              </div>

              <h1 className={styles.heroTitle}>
                {copy.hero.title} <span>{copy.hero.highlight}</span>
              </h1>

              <p className={styles.heroText}>{copy.hero.text}</p>

              <div className={styles.heroActions}>
                <TrackedTelegramLink source={`${trackingSource}_hero_primary`} locale={lang} className={`${styles.button} ${styles.primaryButton}`}>
                  {copy.hero.primary}
                  <ArrowRight size={18} />
                </TrackedTelegramLink>

                <a href="#funktioniert" className={`${styles.button} ${styles.secondaryButton}`}>
                  {copy.hero.secondary}
                </a>
              </div>

              <div className={styles.microNote}>{copy.hero.microNote}</div>

              <div className={styles.trustRow}>
                {copy.hero.trustPills.map((pill) => (
                  <div key={pill.title} className={styles.trustPill}>
                    <span className={styles.trustIcon}>{pill.icon}</span>
                    <span>
                      <b>{pill.title}</b>
                      <small>{pill.subtitle}</small>
                    </span>
                  </div>
                ))}
              </div>
            </div>

          <div className={styles.heroVisual}>
            <div className={`${styles.floatingCard} ${styles.courseCard}`}>
              <b>{copy.visual.baseCourse}</b>
              <div className={styles.floatingEmoji}>📖</div>
              <small>● {courseCards[0]?.meta}</small>
            </div>
            <div className={`${styles.floatingCard} ${styles.tankCard}`}>
              <b>{copy.visual.tankCourse}</b>
              <div className={styles.floatingEmoji}>🚚</div>
              <small>● {courseCards[1]?.meta}</small>
            </div>
            <div className={styles.placard}>
              <div className={styles.placardInner}>
                <span>🔥</span>
                <strong>3</strong>
              </div>
            </div>
            <div className={`${styles.floatingCard} ${styles.termsCard}`}>
              <b>{copy.visual.termsCourse}</b>
              <div className={styles.floatingEmoji}>📘</div>
              <small>● {courseCards[2]?.meta}</small>
            </div>
            <div className={`${styles.floatingCard} ${styles.progressCard}`}>
              <b>{copy.visual.progress}</b>
              <div className={styles.progressBar}>
                <span />
              </div>
              <small>68%</small>
            </div>

            <div className={styles.phoneFrame}>
              <div className={styles.phoneScreen}>
                <div className={styles.phoneStatus}>
                  <span>09:41</span>
                  <span>5G ▰</span>
                </div>
                <div className={styles.phoneHeader}>
                  <div className={styles.phoneAvatar}>⚠</div>
                  <div>
                    <b>ADR Bot</b>
                    <span>Bot</span>
                  </div>
                </div>

                <div className={styles.phoneBody}>
                  <div className={styles.chatCard}>
                    <div className={styles.lessonChip}>{copy.visual.lessonChip}</div>
                    <h3>{copy.visual.question}</h3>
                    <p>{copy.visual.statement}</p>
                  </div>

                  <div className={styles.answerList}>
                    <button type="button" className={`${styles.answerButton} ${styles.answerActive}`}>
                      {copy.visual.answers[0]}
                    </button>
                    <button type="button" className={styles.answerButton}>
                      {copy.visual.answers[1]}
                    </button>
                    <button type="button" className={styles.answerButton}>
                      {copy.visual.answers[2]}
                    </button>
                  </div>

                  <div className={styles.feedbackCard}>
                    <b>{copy.visual.feedbackTitle}</b>
                    <span>{copy.visual.feedbackText}</span>
                  </div>
                </div>

                <div className={styles.phoneInput}>{copy.visual.inputPlaceholder}</div>
              </div>
            </div>
          </div>
        </section>

        <section id="kurse" className={styles.section}>
          <div className={styles.cardsThree}>
            {courseCards.map((card) => (
              <article key={card.title} className={styles.courseSurface}>
                <div className={styles.courseArt}>{card.emoji}</div>
                <h3>{card.title}</h3>
                <p>{card.body}</p>
                <div className={styles.courseFoot}>
                  <span className={styles.smallChip}>{card.meta}</span>
                  <span className={styles.circleArrow}>›</span>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section id="funktionen" className={styles.section}>
          <div className={styles.sectionHead}>
            <h2>{copy.benefits.title}</h2>
          </div>
          <div className={styles.benefits}>
            {benefitCards.map((card) => (
              <article key={card.title} className={styles.benefitCard}>
                <div className={styles.benefitEmoji}>{card.emoji}</div>
                <b>{card.title}</b>
                <p>{card.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="funktioniert" className={styles.section}>
          <div className={styles.sectionHead}>
            <h2>{copy.steps.title}</h2>
          </div>
          <div className={styles.steps}>
            {stepCards.map((card) => (
              <article key={card.step} className={styles.stepCard}>
                <div className={styles.stepNumber}>{card.step}</div>
                <div className={styles.stepEmoji}>{card.emoji}</div>
                <b>{card.title}</b>
                <p>{card.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHead}>
            <h2>{copy.carousel.title}</h2>
            <p>{copy.carousel.description}</p>
          </div>

          <div
            className={styles.carouselShell}
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
            onTouchStart={(event) => handleTouchStart(event.touches[0]?.clientX ?? 0)}
            onTouchEnd={(event) => handleTouchEnd(event.changedTouches[0]?.clientX ?? 0)}
          >
            <button type="button" className={`${styles.carouselButton} ${styles.carouselLeft}`} onClick={goPrev} aria-label={copy.ui.previousPreview}>
              <ChevronLeft size={22} />
            </button>

            <div className={styles.carouselViewport}>
              <div
                className={styles.carouselTrack}
                style={{
                  transform: `translateX(calc(-${activeIndex} * ((100% - (${visibleCards - 1} * var(--preview-gap))) / ${visibleCards} + var(--preview-gap))))`,
                  ["--visible" as string]: String(visibleCards),
                }}
              >
                {previewCards.map((card) => (
                  <article key={card.title} className={styles.previewCard}>
                    <div className={styles.previewScreen}>
                      <span className={`${styles.fakeLine} ${styles[card.accents[0]]}`} />
                      <span className={`${styles.fakeLine} ${styles[card.accents[1]]}`} />
                      <span className={`${styles.fakeLine} ${styles[card.accents[2]]}`} />
                      <span className={`${styles.fakeLine} ${styles[card.accents[3]]}`} />
                    </div>
                    <h3>{card.title}</h3>
                    <p>{card.body}</p>
                  </article>
                ))}
              </div>
            </div>

            <button type="button" className={`${styles.carouselButton} ${styles.carouselRight}`} onClick={goNext} aria-label={copy.ui.nextPreview}>
              <ChevronRight size={22} />
            </button>

            <div className={styles.dots} aria-label={copy.ui.carouselNavLabel}>
                {Array.from({ length: totalPages }).map((_, index) => (
                  <button
                    key={`dot-${index}`}
                    type="button"
                    className={index === currentPage ? styles.dotActive : styles.dot}
                    aria-label={`${copy.ui.previewLabel} ${index + 1}`}
                    onClick={() => setActivePage(index)}
                  />
                ))}
            </div>
          </div>
        </section>

        <section id="preise" className={styles.section}>
          <div className={styles.sectionHead}>
            <h2>{copy.pricing.title}</h2>
            <p>{copy.pricing.description}</p>
          </div>

          <div className={styles.pricingGrid}>
            {pricingCards.map((card) => (
              <article
                key={card.title}
                className={card.featured ? `${styles.priceCard} ${styles.priceCardFeatured}` : styles.priceCard}
              >
                {card.badge ? <span className={styles.priceBadge}>{card.badge}</span> : null}
                <h3>{card.title}</h3>
                <p className={styles.priceSubtitle}>{card.subtitle}</p>
                <div className={styles.priceRow}>
                  <strong>{card.price}</strong>
                  <span>{card.suffix}</span>
                </div>
                <ul className={styles.featureList}>
                  {card.features.map((feature) => (
                    <li key={feature}>
                      <span>✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>
                <TrackedTelegramLink
                  source={`${trackingSource}_${card.source}`}
                  locale={lang}
                  className={card.featured ? `${styles.button} ${styles.primaryButton} ${styles.fullWidth}` : `${styles.button} ${styles.secondaryButton} ${styles.fullWidth}`}
                >
                  {card.cta}
                </TrackedTelegramLink>
              </article>
            ))}
          </div>
        </section>

        <section id="faq" className={styles.section}>
          <div className={styles.faqLayout}>
            <div>
              <h2 className={styles.faqTitle}>{copy.faq.title}</h2>
              <div className={styles.faqList}>
                {faqItems.map((item, index) => {
                  const isOpen = openFaq === index;
                  return (
                    <div key={item.question} className={isOpen ? `${styles.faqItem} ${styles.faqOpen}` : styles.faqItem}>
                      <button
                        type="button"
                        className={styles.faqQuestion}
                        onClick={() => setOpenFaq(isOpen ? null : index)}
                        aria-expanded={isOpen}
                        aria-controls={`premium-preview-faq-${index}`}
                      >
                        <span>{item.question}</span>
                        <span>{isOpen ? "−" : "+"}</span>
                      </button>
                      <div id={`premium-preview-faq-${index}`} className={styles.faqAnswer}>
                        {item.answer}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className={styles.ctaPanel}>
              <div>
                <h2>{copy.faq.ctaTitle}</h2>
                <p>{copy.faq.ctaDescription}</p>
                <TrackedTelegramLink source={`${trackingSource}_footer_cta`} locale={lang} className={`${styles.button} ${styles.blueButton}`}>
                  {copy.faq.ctaButton}
                </TrackedTelegramLink>
              </div>
              <div className={styles.trophy}>🏆</div>
            </div>
          </div>
        </section>

        <footer className={styles.footer}>
          <div className={styles.footerInner}>
            <div>{copy.footer.copyright}</div>
            <div className={styles.footerLinks}>
              <Link href="/impressum">{copy.footer.imprint}</Link>
              <Link href="/datenschutz">{copy.footer.privacy}</Link>
              <Link href="/legal">{copy.footer.terms}</Link>
            </div>
          </div>
        </footer>
      </div>

      <div className={styles.mobileSticky}>
        <TrackedTelegramLink source={`${trackingSource}_mobile_sticky`} locale={lang} className={`${styles.button} ${styles.primaryButton} ${styles.fullWidth}`}>
          {copy.hero.primary}
        </TrackedTelegramLink>
      </div>
    </main>
  );
}
