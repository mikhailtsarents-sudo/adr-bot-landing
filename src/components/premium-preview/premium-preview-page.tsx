"use client";

import { PageViewTracker } from "@/components/analytics/page-view-tracker";
import { LanguageSwitcher } from "@/components/landing/language-switcher";
import { TrackedTelegramLink } from "@/components/landing/tracked-telegram-link";
import { useLang } from "@/lib/i18n/use-lang";
import type { LangCode } from "@/lib/i18n/translations";
import { ArrowRight, ChevronLeft, ChevronRight, Send } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { getPremiumPreviewCopy } from "./premium-preview-copy";
import styles from "./premium-preview-page.module.css";

const conversionChecklistByLang: Record<
  LangCode,
  { title: string; items: [string, string, string]; note: string }
> = {
  de: {
    title: "Was direkt nach dem Klick passiert",
    items: [
      "Telegram öffnet sich sofort.",
      "Du tippst /start und wählst deinen Pfad.",
      "Die erste Frage oder der erste Begriff kommt in unter 60 Sekunden.",
    ],
    note: "Keine Registrierung. Keine extra App. Kein langer Prozess.",
  },
  en: {
    title: "What happens right after you click",
    items: [
      "Telegram opens immediately.",
      "You type /start and choose your path.",
      "Your first question or term appears in under 60 seconds.",
    ],
    note: "No signup. No extra app. No long setup.",
  },
  ru: {
    title: "Что произойдет сразу после клика",
    items: [
      "Telegram откроется сразу.",
      "Ты вводишь /start и выбираешь свой путь.",
      "Первый вопрос или термин приходит меньше чем за 60 секунд.",
    ],
    note: "Без регистрации. Без лишнего приложения. Без долгой настройки.",
  },
  uk: {
    title: "Що станеться одразу після кліку",
    items: [
      "Telegram відкриється одразу.",
      "Ти вводиш /start і обираєш свій шлях.",
      "Перше питання або термін з'явиться менш ніж за 60 секунд.",
    ],
    note: "Без реєстрації. Без зайвого застосунку. Без довгого налаштування.",
  },
  tr: {
    title: "Tıkladıktan hemen sonra ne olur",
    items: [
      "Telegram hemen açılır.",
      "Sen /start yazarsın ve yolunu seçersin.",
      "İlk soru veya ilk terim 60 saniyeden kısa sürede gelir.",
    ],
    note: "Kayıt yok. Ekstra uygulama yok. Uzun kurulum yok.",
  },
  ar: {
    title: "ماذا يحدث مباشرة بعد الضغط",
    items: [
      "يفتح تيليجرام فورًا.",
      "تكتب ‎/start‎ ثم تختار المسار المناسب لك.",
      "يظهر أول سؤال أو أول مصطلح خلال أقل من 60 ثانية.",
    ],
    note: "من دون تسجيل. من دون تطبيق إضافي. من دون إعداد طويل.",
  },
  pl: {
    title: "Co stanie się od razu po kliknięciu",
    items: [
      "Telegram otworzy się od razu.",
      "Wpisujesz /start i wybierasz swoją ścieżkę.",
      "Pierwsze pytanie lub pojęcie pojawi się w mniej niż 60 sekund.",
    ],
    note: "Bez rejestracji. Bez dodatkowej aplikacji. Bez długiej konfiguracji.",
  },
  ro: {
    title: "Ce se întâmplă imediat după clic",
    items: [
      "Telegram se deschide imediat.",
      "Tastezi /start și alegi traseul potrivit.",
      "Prima întrebare sau primul termen apare în mai puțin de 60 de secunde.",
    ],
    note: "Fără cont. Fără aplicație suplimentară. Fără configurare lungă.",
  },
  bg: {
    title: "Какво става веднага след натискането",
    items: [
      "Telegram се отваря веднага.",
      "Пишеш /start и избираш своя път.",
      "Първият въпрос или термин идва за по-малко от 60 секунди.",
    ],
    note: "Без регистрация. Без допълнително приложение. Без дълга настройка.",
  },
  hr: {
    title: "Što se događa odmah nakon klika",
    items: [
      "Telegram se otvara odmah.",
      "Upišeš /start i odabereš svoj put.",
      "Prvo pitanje ili prvi pojam stiže za manje od 60 sekundi.",
    ],
    note: "Bez registracije. Bez dodatne aplikacije. Bez dugog podešavanja.",
  },
};

const heroDecisionAidByLang: Record<
  LangCode,
  { title: string; items: [string, string, string] }
> = {
  de: {
    title: "Was du in der ersten Minute bekommst",
    items: [
      "Telegram öffnet sofort.",
      "Du siehst die erste ADR-Frage ohne Registrierung.",
      "Danach entscheidest du in Ruhe, ob du weitermachen willst.",
    ],
  },
  en: {
    title: "What you get in the first minute",
    items: [
      "Telegram opens immediately.",
      "You see your first ADR question without signing up.",
      "Then you decide calmly whether the format is worth it.",
    ],
  },
  ru: {
    title: "Что ты получаешь в первую минуту",
    items: [
      "Telegram открывается сразу.",
      "Ты видишь первый ADR-вопрос без регистрации.",
      "Потом спокойно решаешь, стоит ли продолжать.",
    ],
  },
  uk: {
    title: "Що ти отримуєш у першу хвилину",
    items: [
      "Telegram відкривається одразу.",
      "Ти бачиш перше ADR-запитання без реєстрації.",
      "Потім спокійно вирішуєш, чи варто продовжувати.",
    ],
  },
  tr: {
    title: "İlk dakikada ne elde edersin",
    items: [
      "Telegram hemen açılır.",
      "Kayıt olmadan ilk ADR sorunu görürsün.",
      "Sonra devam etmeye değip değmediğine sakince karar verirsin.",
    ],
  },
  ar: {
    title: "ما الذي تحصل عليه خلال أول دقيقة",
    items: [
      "يفتح Telegram فورًا.",
      "ترى أول سؤال ADR من دون تسجيل.",
      "ثم تقرر بهدوء إن كان هذا الأسلوب مناسبًا لك.",
    ],
  },
  pl: {
    title: "Co dostajesz w pierwszej minucie",
    items: [
      "Telegram otwiera się od razu.",
      "Widzisz pierwsze pytanie ADR bez rejestracji.",
      "Potem spokojnie decydujesz, czy warto iść dalej.",
    ],
  },
  ro: {
    title: "Ce primești în primul minut",
    items: [
      "Telegram se deschide imediat.",
      "Vezi prima întrebare ADR fără cont.",
      "Apoi decizi liniștit dacă merită să continui.",
    ],
  },
  bg: {
    title: "Какво получаваш в първата минута",
    items: [
      "Telegram се отваря веднага.",
      "Виждаш първия ADR въпрос без регистрация.",
      "След това спокойно решаваш дали си струва да продължиш.",
    ],
  },
  hr: {
    title: "Što dobivaš u prvoj minuti",
    items: [
      "Telegram se otvara odmah.",
      "Vidiš prvo ADR pitanje bez registracije.",
      "Zatim mirno odlučuješ ima li smisla nastaviti.",
    ],
  },
};

const pricingClarityByLang: Record<
  LangCode,
  { title: string; items: [string, string, string]; note: string }
> = {
  de: {
    title: "Klare Preislogik",
    items: [
      "Kostenloser Start direkt in Telegram",
      "15 EUR nur für Full Access",
      "Keine automatische Verlängerung",
    ],
    note: "Erst ausprobieren. Dann entscheiden.",
  },
  en: {
    title: "Clear pricing logic",
    items: [
      "Free start directly in Telegram",
      "15 EUR only for full access",
      "No automatic renewal",
    ],
    note: "Try first. Decide after that.",
  },
  ru: {
    title: "Понятная логика цены",
    items: [
      "Бесплатный старт прямо в Telegram",
      "15 EUR только за полный доступ",
      "Без автопродления",
    ],
    note: "Сначала пробуешь. Потом решаешь.",
  },
  uk: {
    title: "Зрозуміла логіка ціни",
    items: [
      "Безкоштовний старт прямо в Telegram",
      "15 EUR лише за повний доступ",
      "Без автоматичного продовження",
    ],
    note: "Спочатку пробуєш. Потім вирішуєш.",
  },
  tr: {
    title: "Açık fiyat mantığı",
    items: [
      "Ücretsiz başlangıç doğrudan Telegram'da",
      "15 EUR sadece tam erişim için",
      "Otomatik yenileme yok",
    ],
    note: "Önce dene. Sonra karar ver.",
  },
  ar: {
    title: "منطق تسعير واضح",
    items: [
      "بداية مجانية مباشرة داخل Telegram",
      "15 يورو فقط للوصول الكامل",
      "لا يوجد تجديد تلقائي",
    ],
    note: "جرّب أولًا. ثم قرر.",
  },
  pl: {
    title: "Jasna logika ceny",
    items: [
      "Darmowy start bezpośrednio w Telegramie",
      "15 EUR tylko za pełny dostęp",
      "Bez automatycznego odnawiania",
    ],
    note: "Najpierw sprawdź. Potem zdecyduj.",
  },
  ro: {
    title: "Logică de preț clară",
    items: [
      "Pornire gratuită direct în Telegram",
      "15 EUR doar pentru acces complet",
      "Fără reînnoire automată",
    ],
    note: "Încearcă mai întâi. Decizi după aceea.",
  },
  bg: {
    title: "Ясна логика на цената",
    items: [
      "Безплатен старт директно в Telegram",
      "15 EUR само за пълен достъп",
      "Без автоматично подновяване",
    ],
    note: "Първо пробваш. После решаваш.",
  },
  hr: {
    title: "Jasna logika cijene",
    items: [
      "Besplatan start izravno u Telegramu",
      "15 EUR samo za puni pristup",
      "Bez automatske obnove",
    ],
    note: "Najprije isprobaj. Zatim odluči.",
  },
};

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
  forcedLang?: LangCode;
};

export function PremiumPreviewPage({
  trackingSource = "premium_preview",
  trackingSlug = "premium-preview",
  forcedLang,
}: PremiumPreviewPageProps = {}) {
  const { lang: contextLang } = useLang();
  const lang = forcedLang ?? contextLang;
  const copy = getPremiumPreviewCopy(lang);
  const previewCards = copy.carousel.cards;
  const courseCards = copy.courses.cards;
  const benefitCards = copy.benefits.cards;
  const stepCards = copy.steps.cards;
  const pricingCards = copy.pricing.cards;
  const faqItems = copy.faq.items;
  const conversionChecklist = conversionChecklistByLang[lang] ?? conversionChecklistByLang.en;
  const heroDecisionAid = heroDecisionAidByLang[lang] ?? heroDecisionAidByLang.en;
  const pricingClarity = pricingClarityByLang[lang] ?? pricingClarityByLang.en;
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
                <LanguageSwitcher compact currentLang={lang} />
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
              <LanguageSwitcher compact currentLang={lang} />
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
                {copy.hero.title}
                {copy.hero.highlight ? <span>{copy.hero.highlight}</span> : null}
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

              <div className={styles.heroDecisionAid}>
                <p className={styles.heroDecisionAidTitle}>{heroDecisionAid.title}</p>
                <ul className={styles.heroDecisionAidList}>
                  {heroDecisionAid.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
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

          <div className={styles.pricingClarityPanel}>
            <div>
              <p className={styles.pricingClarityTitle}>{pricingClarity.title}</p>
              <ul className={styles.pricingClarityList}>
                {pricingClarity.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
            <p className={styles.pricingClarityNote}>{pricingClarity.note}</p>
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
                <div className={styles.ctaChecklistWrap}>
                  <p className={styles.ctaChecklistTitle}>{conversionChecklist.title}</p>
                  <ul className={styles.ctaChecklist}>
                    {conversionChecklist.items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                  <p className={styles.ctaChecklistNote}>{conversionChecklist.note}</p>
                </div>
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
