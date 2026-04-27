import { translations, type LangCode } from "@/lib/i18n/translations";

export type PreviewCard = {
  title: string;
  body: string;
  accents: string[];
};

export type CourseCard = {
  emoji: string;
  title: string;
  body: string;
  meta: string;
};

export type BenefitCard = {
  emoji: string;
  title: string;
  body: string;
};

export type StepCard = {
  step: string;
  emoji: string;
  title: string;
  body: string;
};

export type PricingCard = {
  title: string;
  subtitle: string;
  price: string;
  suffix: string;
  features: string[];
  cta: string;
  source: string;
  featured?: boolean;
  badge?: string;
};

export type FaqItem = {
  question: string;
  answer: string;
};

export type PremiumPreviewCopy = {
  ui: {
    carouselNavLabel: string;
    previousPreview: string;
    nextPreview: string;
    previewLabel: string;
  };
  nav: {
    ariaLabel: string;
    features: string;
    courses: string;
    pricing: string;
    faq: string;
    telegram: string;
    primary: string;
  };
  hero: {
    eyebrow: string;
    title: string;
    highlight?: string;
    text: string;
    primary: string;
    secondary: string;
    microNote: string;
    trustPills: { icon: string; title: string; subtitle: string }[];
  };
  visual: {
    baseCourse: string;
    tankCourse: string;
    termsCourse: string;
    progress: string;
    lessonChip: string;
    question: string;
    statement: string;
    answers: string[];
    feedbackTitle: string;
    feedbackText: string;
    inputPlaceholder: string;
  };
  courses: {
    cards: CourseCard[];
  };
  benefits: {
    title: string;
    cards: BenefitCard[];
  };
  steps: {
    title: string;
    cards: StepCard[];
  };
  carousel: {
    title: string;
    description: string;
    cards: PreviewCard[];
  };
  pricing: {
    title: string;
    description: string;
    cards: PricingCard[];
  };
  faq: {
    title: string;
    items: FaqItem[];
    ctaTitle: string;
    ctaDescription: string;
    ctaButton: string;
  };
  footer: {
    copyright: string;
    imprint: string;
    privacy: string;
    terms: string;
  };
};

type SupplementalCopy = {
  ui: PremiumPreviewCopy["ui"];
  nav: Pick<PremiumPreviewCopy["nav"], "ariaLabel" | "features" | "courses" | "pricing" | "faq"> &
    Partial<Pick<PremiumPreviewCopy["nav"], "telegram" | "primary">>;
  hero: Pick<PremiumPreviewCopy["hero"], "title" | "trustPills"> &
    Partial<Pick<PremiumPreviewCopy["hero"], "eyebrow" | "highlight" | "text" | "primary" | "secondary" | "microNote">>;
  visual: PremiumPreviewCopy["visual"];
  courses: PremiumPreviewCopy["courses"];
  carousel: PremiumPreviewCopy["carousel"];
  pricing: PremiumPreviewCopy["pricing"];
  faq: PremiumPreviewCopy["faq"];
  footer: PremiumPreviewCopy["footer"];
  stepsTitle?: string;
  extraStep: StepCard;
};

function buildLocalizedCopy(
  lang: Exclude<LangCode, "de" | "en" | "ru">,
  supplemental: SupplementalCopy,
): PremiumPreviewCopy {
  const base = translations[lang];
  const benefitEmojis = ["✈️", "🎯", "📋", "📊", "🕘"];
  const stepEmojis = ["✈️", "📖", "✏️"];

  return {
    ui: supplemental.ui,
    nav: {
      ariaLabel: supplemental.nav.ariaLabel,
      features: supplemental.nav.features,
      courses: supplemental.nav.courses,
      pricing: supplemental.nav.pricing,
      faq: supplemental.nav.faq,
      telegram: supplemental.nav.telegram ?? base.nav.openInTelegram,
      primary: supplemental.nav.primary ?? base.hero.ctaPrimary,
    },
    hero: {
      eyebrow: supplemental.hero.eyebrow ?? base.hero.eyebrow,
      title: supplemental.hero.title,
      highlight: supplemental.hero.highlight,
      text: supplemental.hero.text ?? base.hero.description,
      primary: supplemental.hero.primary ?? base.hero.ctaPrimary,
      secondary: supplemental.hero.secondary ?? base.hero.ctaSecondary,
      microNote: supplemental.hero.microNote ?? base.hero.note,
      trustPills: supplemental.hero.trustPills,
    },
    visual: supplemental.visual,
    courses: supplemental.courses,
    benefits: {
      title: base.benefits.title,
      cards: base.benefits.cards.slice(0, 5).map((card, index) => ({
        emoji: benefitEmojis[index] ?? "✦",
        title: card.title,
        body: card.text,
      })),
    },
    steps: {
      title: supplemental.stepsTitle ?? base.howItWorks.title,
      cards: [
        ...base.howItWorks.steps.map((step, index) => ({
          step: String(index + 1),
          emoji: stepEmojis[index] ?? "✦",
          title: step.title,
          body: step.text,
        })),
        supplemental.extraStep,
      ],
    },
    carousel: supplemental.carousel,
    pricing: supplemental.pricing,
    faq: supplemental.faq,
    footer: supplemental.footer,
  };
}

const de: PremiumPreviewCopy = {
  ui: {
    carouselNavLabel: "Vorschau-Navigation",
    previousPreview: "Vorherige Vorschau",
    nextPreview: "Nächste Vorschau",
    previewLabel: "Vorschau",
  },
  nav: {
    ariaLabel: "ADR Bot Premium-Vorschau",
    features: "Funktionen",
    courses: "Kurse",
    pricing: "Preise",
    faq: "FAQ",
    telegram: "Telegram öffnen",
    primary: "In Telegram starten",
  },
  hero: {
    eyebrow: "Öffentliche Testphase · direkt in Telegram",
    title: "Dein einfacher Start zur ADR-Prüfung",
    highlight: "auf Deutsch",
    text: "Lerne Schritt für Schritt mit dem ADR Bot auf Telegram: verständlich erklärt, praxisnah und jederzeit verfügbar.",
    primary: "In Telegram starten",
    secondary: "30-Sekunden-Vorschau",
    microNote: "Kostenlos. Ohne Anmeldung. Direkt in Telegram.",
    trustPills: [
      { icon: "✈", title: "Auf Telegram", subtitle: "Sofort loslegen" },
      { icon: "🇩🇪", title: "Auf Deutsch", subtitle: "Einfach verstehen" },
      { icon: "✦", title: "Schritt für Schritt", subtitle: "Sicher bestehen" },
    ],
  },
  visual: {
    baseCourse: "Basiskurs",
    tankCourse: "Tank",
    termsCourse: "Begriffe",
    progress: "Fortschritt",
    lessonChip: "Lektion: 2.3 Beförderung in Tanks",
    question: "Welche Aussage ist korrekt?",
    statement:
      "Ein Tankfahrzeug muss mit orangefarbenen Tafeln gekennzeichnet sein.",
    answers: [
      "A Richtig",
      "B Falsch",
      "C Nur bei Gefahrgutklasse 3",
    ],
    feedbackTitle: "Sehr gut!",
    feedbackText: "Die richtige Antwort ist A. Weiter so.",
    inputPlaceholder: "Nachricht",
  },
  courses: {
    cards: [
      {
        emoji: "📖",
        title: "Basiskurs",
        body: "Alle Grundlagen, Vorschriften und wichtigen Regeln verständlich erklärt.",
        meta: "12 Lektionen",
      },
      {
        emoji: "🚛",
        title: "Tank",
        body: "Spezialwissen für die Beförderung in Tanks, sicher und praxisnah.",
        meta: "8 Lektionen",
      },
      {
        emoji: "📘",
        title: "Fachbegriffe",
        body: "Wichtige ADR-Begriffe einfach erklärt und im Kontext verstanden.",
        meta: "120+ Begriffe",
      },
    ],
  },
  benefits: {
    title: "Warum mit dem ADR Bot lernen?",
    cards: [
      {
        emoji: "✈️",
        title: "Direkt auf Telegram",
        body: "Keine App, kein Login, keine Umwege. Einfach starten und lernen.",
      },
      {
        emoji: "🎯",
        title: "Fokussiert und verständlich",
        body: "Klare Erklärungen und kurze Übungen speziell für die ADR-Prüfung.",
      },
      {
        emoji: "📋",
        title: "Praxisnah üben",
        body: "Viele Fragen und Situationen aus Basiskurs, Tank und Alltag.",
      },
      {
        emoji: "📊",
        title: "Fortschritt sehen",
        body: "Du erkennst schnell, was sitzt und was noch Wiederholung braucht.",
      },
      {
        emoji: "🕘",
        title: "Spart Zeit",
        body: "Kleine Einheiten passen in Beruf, Pause und unterwegs.",
      },
    ],
  },
  steps: {
    title: "In 4 Schritten starten",
    cards: [
      {
        step: "1",
        emoji: "✈️",
        title: "Bot starten",
        body: "Öffne Telegram und starte den ADR Bot mit einem Klick.",
      },
      {
        step: "2",
        emoji: "📖",
        title: "Kurs wählen",
        body: "Wähle Basiskurs, Tank oder Fachbegriffe als ersten Lernpfad.",
      },
      {
        step: "3",
        emoji: "✏️",
        title: "Lernen und üben",
        body: "Bearbeite Fragen, Begriffe und kurze Erklärungen Schritt für Schritt.",
      },
      {
        step: "4",
        emoji: "🏆",
        title: "Sicher bestehen",
        body: "Baue Routine auf und gehe mit mehr Sicherheit in die ADR-Prüfung.",
      },
    ],
  },
  carousel: {
    title: "So sieht Lernen mit dem ADR Bot aus",
    description:
      "Mehrere Vorschauen zeigen, wie Lernen, Wiederholen und Nachschlagen im Bot aussehen können.",
    cards: [
      {
        title: "Erklärung",
        body: "Kurze Antworten zeigen nicht nur, was richtig ist, sondern auch warum.",
        accents: ["blue", "neutral", "short", "green"],
      },
      {
        title: "Quiz",
        body: "Prüfungsnahe Multiple-Choice-Fragen direkt im Telegram-Dialog.",
        accents: ["blue", "neutral", "neutral", "shortGreen"],
      },
      {
        title: "Praxisfall",
        body: "Konkrete Situationen aus Transport, Tank und Dokumentation üben.",
        accents: ["blue", "short", "neutral", "green"],
      },
      {
        title: "Fortschritt",
        body: "Du siehst, welche Themen schon sitzen und wo Wiederholung hilft.",
        accents: ["blue", "neutral", "short", "green"],
      },
      {
        title: "Fachbegriffe",
        body: "ADR-Begriffe wie UN-Nummer, Gefahrzettel oder Tunnelcode schnell verstehen.",
        accents: ["blue", "yellow", "short", "tinyGreen"],
      },
      {
        title: "Fehlertraining",
        body: "Falsch beantwortete Fragen kommen gezielt zurück, bis sie sicher sitzen.",
        accents: ["blue", "neutral", "yellow", "shortGreen"],
      },
      {
        title: "Prüfungssimulation",
        body: "Üben unter realistischen Bedingungen mit klarer Auswertung danach.",
        accents: ["blue", "short", "neutral", "yellow"],
      },
      {
        title: "Tank-Spezialwissen",
        body: "Eigene Inhalte für Tank: Kennzeichnung, Beförderung und typische Fragen.",
        accents: ["blue", "neutral", "green", "tinyYellow"],
      },
      {
        title: "Basiskurs",
        body: "Grundlagen, Pflichten und wichtige Regeln Schritt für Schritt lernen.",
        accents: ["yellow", "neutral", "shortBlue", "green"],
      },
      {
        title: "Merkliste",
        body: "Schwierige Fragen und Begriffe speichern und später gezielt wiederholen.",
        accents: ["blue", "tiny", "neutral", "shortGreen"],
      },
      {
        title: "Tagesziel",
        body: "Kleine Lernziele helfen dir, regelmäßig dranzubleiben.",
        accents: ["blue", "short", "green", "neutral"],
      },
      {
        title: "Nachschlagen",
        body: "Wichtige Dokumente, Kennzeichnungen und Formulierungen schneller verstehen.",
        accents: ["yellow", "neutral", "shortBlue", "green"],
      },
    ],
  },
  pricing: {
    title: "Einfaches Preismodell. Kein Rätselraten.",
    description:
      "Zwei klare Optionen: kostenlos starten oder einmalig 15 EUR für den vollen Zugang zahlen.",
    cards: [
      {
        title: "Kostenloser Zugang",
        subtitle: "Zum Reinschnuppern und für die ersten Schritte im Bot.",
        price: "0 EUR",
        suffix: "/ kostenlos",
        features: [
          "Erste Beispielfragen testen",
          "Ausgewählte Fachbegriffe ansehen",
          "Direkt in Telegram starten",
          "Ohne neue Lernplattform",
        ],
        cta: "Gratis in Telegram",
        source: "premium_preview_free",
      },
      {
        title: "Voller Zugang",
        subtitle:
          "Einmalig zahlen und mit allen verfügbaren Inhalten gezielt üben.",
        price: "15 EUR",
        suffix: "/ einmalig",
        features: [
          "Alle verfügbaren Lerninhalte",
          "Basiskurs, Tank und Fachbegriffe",
          "Erweiterte Quizze und Praxisfälle",
          "Erklärungen, Wiederholung und Fortschritt",
          "Keine monatliche Zahlung",
        ],
        cta: "Full Access für 15 EUR",
        source: "premium_preview_full_access",
        featured: true,
        badge: "Full Access",
      },
    ],
  },
  faq: {
    title: "Häufige Fragen",
    items: [
      {
        question: "Wie funktioniert der ADR Bot?",
        answer:
          "Du öffnest Telegram, startest den Bot und wählst deinen Lernpfad. Danach bekommst du Fragen, Begriffe und Erklärungen Schritt für Schritt.",
      },
      {
        question: "Benötige ich Vorkenntnisse?",
        answer:
          "Nein. Der Einstieg ist bewusst einfach gehalten. Für Tank und spezielle Themen kannst du später tiefer einsteigen.",
      },
      {
        question: "Auf welchen Geräten funktioniert es?",
        answer:
          "Überall, wo Telegram läuft: Smartphone, Tablet oder Desktop.",
      },
      {
        question: "Ist Full Access ein Abo?",
        answer:
          "Nein. In diesem Entwurf ist Full Access als einmalige Zahlung über 15 EUR dargestellt.",
      },
    ],
    ctaTitle: "Bereit, deine ADR-Prüfung zu bestehen?",
    ctaDescription:
      "Öffne den Bot in Telegram und sieh die ersten Fragen in unter einer Minute.",
    ctaButton: "In Telegram starten",
  },
  footer: {
    copyright: "© 2026 ADR Bot",
    imprint: "Impressum",
    privacy: "Datenschutz",
    terms: "AGB",
  },
};

const en: PremiumPreviewCopy = {
  ui: {
    carouselNavLabel: "Preview navigation",
    previousPreview: "Previous preview",
    nextPreview: "Next preview",
    previewLabel: "Preview",
  },
  nav: {
    ariaLabel: "ADR Bot premium preview",
    features: "Features",
    courses: "Courses",
    pricing: "Pricing",
    faq: "FAQ",
    telegram: "Open in Telegram",
    primary: "Start in Telegram",
  },
  hero: {
    eyebrow: "Public test phase · directly in Telegram",
    title: "A simpler start to your ADR exam",
    highlight: "in German",
    text: "Learn step by step with ADR Bot inside Telegram: clearly explained, practical, and always available.",
    primary: "Start in Telegram",
    secondary: "30-second preview",
    microNote: "Free. No sign-up. Directly in Telegram.",
    trustPills: [
      { icon: "✈", title: "Inside Telegram", subtitle: "Start instantly" },
      { icon: "🇩🇪", title: "In German", subtitle: "Easy to understand" },
      { icon: "✦", title: "Step by step", subtitle: "Build confidence" },
    ],
  },
  visual: {
    baseCourse: "Basiskurs",
    tankCourse: "Tank",
    termsCourse: "Terms",
    progress: "Progress",
    lessonChip: "Lesson: 2.3 Transport in tanks",
    question: "Which statement is correct?",
    statement: "A tank vehicle must be marked with orange plates.",
    answers: [
      "A Correct",
      "B Incorrect",
      "C Only for class 3 dangerous goods",
    ],
    feedbackTitle: "Well done!",
    feedbackText: "The correct answer is A. Keep going.",
    inputPlaceholder: "Message",
  },
  courses: {
    cards: [
      {
        emoji: "📖",
        title: "Basiskurs",
        body: "All core rules, obligations, and key ADR basics explained clearly.",
        meta: "12 lessons",
      },
      {
        emoji: "🚛",
        title: "Tank",
        body: "Specialized knowledge for tank transport, practical and easier to absorb.",
        meta: "8 lessons",
      },
      {
        emoji: "📘",
        title: "Terminology",
        body: "Important ADR terms explained simply and understood in context.",
        meta: "120+ terms",
      },
    ],
  },
  benefits: {
    title: "Why learn with ADR Bot?",
    cards: [
      {
        emoji: "✈️",
        title: "Directly in Telegram",
        body: "No extra app, no login, no detours. Just start and learn.",
      },
      {
        emoji: "🎯",
        title: "Focused and understandable",
        body: "Clear explanations and short exercises built for the ADR exam.",
      },
      {
        emoji: "📋",
        title: "Practice in realistic context",
        body: "Questions and situations from Basiskurs, Tank, and real transport work.",
      },
      {
        emoji: "📊",
        title: "See your progress",
        body: "You quickly notice what already sticks and what still needs repetition.",
      },
      {
        emoji: "🕘",
        title: "Fits your schedule",
        body: "Short learning units fit between shifts, breaks, and evenings.",
      },
    ],
  },
  steps: {
    title: "Start in 4 simple steps",
    cards: [
      {
        step: "1",
        emoji: "✈️",
        title: "Open the bot",
        body: "Open Telegram and start ADR Bot with one click.",
      },
      {
        step: "2",
        emoji: "📖",
        title: "Choose a course",
        body: "Pick Basiskurs, Tank, or terminology as your starting path.",
      },
      {
        step: "3",
        emoji: "✏️",
        title: "Learn and practice",
        body: "Work through questions, terms, and short explanations step by step.",
      },
      {
        step: "4",
        emoji: "🏆",
        title: "Walk into the exam calmer",
        body: "Build routine and go into the ADR exam with more confidence.",
      },
    ],
  },
  carousel: {
    title: "What learning with ADR Bot looks like",
    description:
      "Several previews show how learning, repetition, and quick lookups feel inside the bot.",
    cards: [
      {
        title: "Explanation",
        body: "Short answers show not only what is right, but also why.",
        accents: ["blue", "neutral", "short", "green"],
      },
      {
        title: "Quiz",
        body: "Exam-style multiple-choice questions right inside the Telegram dialog.",
        accents: ["blue", "neutral", "neutral", "shortGreen"],
      },
      {
        title: "Scenario",
        body: "Practice concrete situations from transport, tank, and documentation.",
        accents: ["blue", "short", "neutral", "green"],
      },
      {
        title: "Progress",
        body: "See which topics already stick and where repetition helps.",
        accents: ["blue", "neutral", "short", "green"],
      },
      {
        title: "Terms",
        body: "Understand ADR terms like UN number, hazard label, or tunnel code faster.",
        accents: ["blue", "yellow", "short", "tinyGreen"],
      },
      {
        title: "Error training",
        body: "Wrong answers come back until they become stable knowledge.",
        accents: ["blue", "neutral", "yellow", "shortGreen"],
      },
      {
        title: "Exam simulation",
        body: "Practice under more realistic conditions with clear feedback afterward.",
        accents: ["blue", "short", "neutral", "yellow"],
      },
      {
        title: "Tank specialist knowledge",
        body: "Dedicated content for tank marking, transport, and typical questions.",
        accents: ["blue", "neutral", "green", "tinyYellow"],
      },
      {
        title: "Basiskurs",
        body: "Learn core obligations and key rules step by step.",
        accents: ["yellow", "neutral", "shortBlue", "green"],
      },
      {
        title: "Saved list",
        body: "Save difficult questions and terms for targeted repetition later.",
        accents: ["blue", "tiny", "neutral", "shortGreen"],
      },
      {
        title: "Daily goal",
        body: "Small learning goals help you keep moving consistently.",
        accents: ["blue", "short", "green", "neutral"],
      },
      {
        title: "Quick lookup",
        body: "Understand documents, labels, and wording faster when you need them.",
        accents: ["yellow", "neutral", "shortBlue", "green"],
      },
    ],
  },
  pricing: {
    title: "Simple pricing. No guessing.",
    description:
      "Two clear options: start for free or pay 15 EUR once for full access.",
    cards: [
      {
        title: "Free access",
        subtitle: "Best for a first look and your first steps inside the bot.",
        price: "0 EUR",
        suffix: "/ free",
        features: [
          "Try first sample questions",
          "See selected ADR terms",
          "Start directly in Telegram",
          "No extra learning platform",
        ],
        cta: "Try in Telegram",
        source: "premium_preview_free",
      },
      {
        title: "Full access",
        subtitle:
          "Pay once and practice with all currently available learning content.",
        price: "15 EUR",
        suffix: "/ one-time",
        features: [
          "All available learning content",
          "Basiskurs, Tank, and terminology",
          "Extended quizzes and practical scenarios",
          "Explanations, repetition, and progress",
          "No monthly payment",
        ],
        cta: "Unlock for 15 EUR",
        source: "premium_preview_full_access",
        featured: true,
        badge: "Full Access",
      },
    ],
  },
  faq: {
    title: "Frequently asked questions",
    items: [
      {
        question: "How does ADR Bot work?",
        answer:
          "You open Telegram, start the bot, and choose your learning path. Then you get questions, terms, and explanations step by step.",
      },
      {
        question: "Do I need prior knowledge?",
        answer:
          "No. The entry is intentionally simple. You can go deeper into Tank and special topics later.",
      },
      {
        question: "Which devices does it work on?",
        answer: "Anywhere Telegram runs: smartphone, tablet, or desktop.",
      },
      {
        question: "Is full access a subscription?",
        answer:
          "No. In this preview, full access is shown as a one-time 15 EUR payment.",
      },
    ],
    ctaTitle: "Ready to pass your ADR exam?",
    ctaDescription:
      "Open the bot in Telegram and see your first questions in under a minute.",
    ctaButton: "Start in Telegram",
  },
  footer: {
    copyright: "© 2026 ADR Bot",
    imprint: "Imprint",
    privacy: "Privacy",
    terms: "Terms",
  },
};

const ru: PremiumPreviewCopy = {
  ui: {
    carouselNavLabel: "Навигация по превью",
    previousPreview: "Предыдущее превью",
    nextPreview: "Следующее превью",
    previewLabel: "Превью",
  },
  nav: {
    ariaLabel: "Премиум-превью ADR Bot",
    features: "Возможности",
    courses: "Курсы",
    pricing: "Цены",
    faq: "FAQ",
    telegram: "Открыть в Telegram",
    primary: "Начать в Telegram",
  },
  hero: {
    eyebrow: "Публичная тестовая фаза · прямо в Telegram",
    title: "Простой старт к экзамену ADR",
    highlight: "на немецком",
    text: "Учись шаг за шагом с ADR Bot в Telegram: понятнее, практичнее и в удобном для тебя ритме.",
    primary: "Начать в Telegram",
    secondary: "Посмотреть за 30 секунд",
    microNote: "Бесплатно. Без регистрации. Сразу в Telegram.",
    trustPills: [
      { icon: "✈", title: "В Telegram", subtitle: "Старт сразу" },
      { icon: "🇩🇪", title: "На немецком", subtitle: "Понятнее учить" },
      { icon: "✦", title: "Шаг за шагом", subtitle: "Больше уверенности" },
    ],
  },
  visual: {
    baseCourse: "Basiskurs",
    tankCourse: "Tank",
    termsCourse: "Термины",
    progress: "Прогресс",
    lessonChip: "Урок: 2.3 Перевозка в цистернах",
    question: "Какое утверждение верно?",
    statement:
      "Автоцистерна должна быть обозначена оранжевыми табличками.",
    answers: [
      "A Верно",
      "B Неверно",
      "C Только для опасных грузов класса 3",
    ],
    feedbackTitle: "Отлично!",
    feedbackText: "Правильный ответ — A. Продолжай в том же духе.",
    inputPlaceholder: "Сообщение",
  },
  courses: {
    cards: [
      {
        emoji: "📖",
        title: "Basiskurs",
        body: "Все основы, правила и важные требования объяснены понятнее.",
        meta: "12 уроков",
      },
      {
        emoji: "🚛",
        title: "Tank",
        body: "Спецзнания по перевозке в цистернах — практично и без перегруза.",
        meta: "8 уроков",
      },
      {
        emoji: "📘",
        title: "Термины",
        body: "Ключевые ADR-термины объяснены простым языком и в нужном контексте.",
        meta: "120+ терминов",
      },
    ],
  },
  benefits: {
    title: "Почему стоит учиться с ADR Bot?",
    cards: [
      {
        emoji: "✈️",
        title: "Сразу в Telegram",
        body: "Без отдельного приложения, логина и лишних переходов. Просто открыл и начал.",
      },
      {
        emoji: "🎯",
        title: "Фокус и понятность",
        body: "Четкие объяснения и короткие упражнения именно под экзамен ADR.",
      },
      {
        emoji: "📋",
        title: "Практика по делу",
        body: "Вопросы и ситуации из Basiskurs, Tank и реальной работы.",
      },
      {
        emoji: "📊",
        title: "Видно прогресс",
        body: "Быстро понимаешь, что уже держится, а что стоит повторить.",
      },
      {
        emoji: "🕘",
        title: "Экономит время",
        body: "Короткие блоки удобно проходить между сменами, в дороге и вечером.",
      },
    ],
  },
  steps: {
    title: "Старт в 4 шага",
    cards: [
      {
        step: "1",
        emoji: "✈️",
        title: "Запустить бота",
        body: "Открой Telegram и запусти ADR Bot в один клик.",
      },
      {
        step: "2",
        emoji: "📖",
        title: "Выбрать курс",
        body: "Выбери Basiskurs, Tank или термины как первый учебный путь.",
      },
      {
        step: "3",
        emoji: "✏️",
        title: "Учиться и тренироваться",
        body: "Проходи вопросы, термины и короткие объяснения шаг за шагом.",
      },
      {
        step: "4",
        emoji: "🏆",
        title: "Идти на экзамен спокойнее",
        body: "Наработай рутину и подойди к ADR-экзамену увереннее.",
      },
    ],
  },
  carousel: {
    title: "Как выглядит обучение с ADR Bot",
    description:
      "Несколько экранов показывают, как внутри бота выглядят обучение, повторение и быстрый поиск.",
    cards: [
      {
        title: "Объяснение",
        body: "Короткие ответы показывают не только что верно, но и почему.",
        accents: ["blue", "neutral", "short", "green"],
      },
      {
        title: "Квиз",
        body: "Вопросы в формате экзамена прямо внутри Telegram-диалога.",
        accents: ["blue", "neutral", "neutral", "shortGreen"],
      },
      {
        title: "Практический кейс",
        body: "Тренируй реальные ситуации из перевозки, Tank и документации.",
        accents: ["blue", "short", "neutral", "green"],
      },
      {
        title: "Прогресс",
        body: "Сразу видно, какие темы уже держатся, а где нужна повторная тренировка.",
        accents: ["blue", "neutral", "short", "green"],
      },
      {
        title: "Термины",
        body: "Быстрее понимать ADR-термины вроде UN-номера, знаков опасности и tunnel code.",
        accents: ["blue", "yellow", "short", "tinyGreen"],
      },
      {
        title: "Работа над ошибками",
        body: "Неправильные ответы возвращаются, пока знание не станет стабильным.",
        accents: ["blue", "neutral", "yellow", "shortGreen"],
      },
      {
        title: "Имитация экзамена",
        body: "Тренировка в более реалистичном режиме с понятной обратной связью.",
        accents: ["blue", "short", "neutral", "yellow"],
      },
      {
        title: "Спецзнания по Tank",
        body: "Отдельные материалы по маркировке, перевозке и типовым вопросам.",
        accents: ["blue", "neutral", "green", "tinyYellow"],
      },
      {
        title: "Basiskurs",
        body: "Изучай основы, обязанности и важные правила шаг за шагом.",
        accents: ["yellow", "neutral", "shortBlue", "green"],
      },
      {
        title: "Список на повторение",
        body: "Сохраняй сложные вопросы и термины, чтобы вернуться к ним позже.",
        accents: ["blue", "tiny", "neutral", "shortGreen"],
      },
      {
        title: "Цель на день",
        body: "Небольшие учебные цели помогают идти ровнее и не выпадать.",
        accents: ["blue", "short", "green", "neutral"],
      },
      {
        title: "Быстрый поиск",
        body: "Быстрее разбираться в документах, маркировке и формулировках, когда это нужно.",
        accents: ["yellow", "neutral", "shortBlue", "green"],
      },
    ],
  },
  pricing: {
    title: "Простая модель цены. Без гаданий.",
    description:
      "Два понятных варианта: начать бесплатно или один раз заплатить 15 EUR за полный доступ.",
    cards: [
      {
        title: "Бесплатный доступ",
        subtitle: "Для знакомства и первых шагов внутри бота.",
        price: "0 EUR",
        suffix: "/ бесплатно",
        features: [
          "Попробовать первые примеры вопросов",
          "Посмотреть часть терминов",
          "Сразу стартовать в Telegram",
          "Без новой учебной платформы",
        ],
        cta: "Открыть в Telegram",
        source: "premium_preview_free",
      },
      {
        title: "Полный доступ",
        subtitle:
          "Платишь один раз и тренируешься со всем доступным учебным материалом.",
        price: "15 EUR",
        suffix: "/ один раз",
        features: [
          "Весь доступный учебный контент",
          "Basiskurs, Tank и термины",
          "Расширенные квизы и практические кейсы",
          "Объяснения, повторение и прогресс",
          "Без ежемесячной оплаты",
        ],
        cta: "Полный доступ за 15 EUR",
        source: "premium_preview_full_access",
        featured: true,
        badge: "Full Access",
      },
    ],
  },
  faq: {
    title: "Частые вопросы",
    items: [
      {
        question: "Как работает ADR Bot?",
        answer:
          "Ты открываешь Telegram, запускаешь бота и выбираешь свой учебный путь. Дальше получаешь вопросы, термины и объяснения шаг за шагом.",
      },
      {
        question: "Нужна ли база заранее?",
        answer:
          "Нет. Вход специально сделан простым. В темы Tank и специальные блоки можно углубиться позже.",
      },
      {
        question: "На каких устройствах это работает?",
        answer:
          "Везде, где работает Telegram: смартфон, планшет или компьютер.",
      },
      {
        question: "Full Access — это подписка?",
        answer:
          "Нет. В этом превью Full Access показан как разовый платеж 15 EUR.",
      },
    ],
    ctaTitle: "Готовиться к ADR-экзамену спокойнее?",
    ctaDescription:
      "Открой бота в Telegram и посмотри первые вопросы меньше чем за минуту.",
    ctaButton: "Начать в Telegram",
  },
  footer: {
    copyright: "© 2026 ADR Bot",
    imprint: "Impressum",
    privacy: "Datenschutz",
    terms: "AGB",
  },
};

const uk = buildLocalizedCopy("uk", {
  ui: {
    carouselNavLabel: "Навігація прев’ю",
    previousPreview: "Попереднє прев’ю",
    nextPreview: "Наступне прев’ю",
    previewLabel: "Прев’ю",
  },
  nav: {
    ariaLabel: "Преміум-прев’ю ADR Bot",
    features: "Можливості",
    courses: "Курси",
    pricing: "Ціни",
    faq: "FAQ",
    telegram: "Відкрити в Telegram",
    primary: "Почати в Telegram",
  },
  hero: {
    title: "Простий старт до іспиту ADR",
    highlight: "німецькою",
    primary: "Почати в Telegram",
    secondary: "Подивитися за 30 секунд",
    microNote: "Безкоштовно. Без реєстрації. Відразу в Telegram.",
    trustPills: [
      { icon: "✈", title: "У Telegram", subtitle: "Старт одразу" },
      { icon: "🇩🇪", title: "Німецькою", subtitle: "Легше зрозуміти" },
      { icon: "✦", title: "Крок за кроком", subtitle: "Більше впевненості" },
    ],
  },
  visual: {
    baseCourse: "Basiskurs",
    tankCourse: "Tank",
    termsCourse: "Терміни",
    progress: "Прогрес",
    lessonChip: "Урок: 2.3 Перевезення в цистернах",
    question: "Яке твердження правильне?",
    statement: "Автоцистерна має бути позначена помаранчевими табличками.",
    answers: [
      "A Правильно",
      "B Неправильно",
      "C Лише для небезпечних вантажів класу 3",
    ],
    feedbackTitle: "Чудово!",
    feedbackText: "Правильна відповідь — A. Так тримати.",
    inputPlaceholder: "Повідомлення",
  },
  courses: {
    cards: [
      {
        emoji: "📖",
        title: "Basiskurs",
        body: "Основи, правила й важливі вимоги пояснені зрозуміло та без перевантаження.",
        meta: "12 уроків",
      },
      {
        emoji: "🚛",
        title: "Tank",
        body: "Спеціальні знання з перевезення в цистернах — практично й по суті.",
        meta: "8 уроків",
      },
      {
        emoji: "📘",
        title: "Терміни",
        body: "Ключові ADR-терміни простими словами й у правильному контексті.",
        meta: "120+ термінів",
      },
    ],
  },
  carousel: {
    title: "Як виглядає навчання з ADR Bot",
    description:
      "Кілька екранів показують, як усередині бота виглядають навчання, повторення й швидкий пошук.",
    cards: [
      { title: "Пояснення", body: "Короткі відповіді показують не лише що правильно, а й чому.", accents: ["blue", "neutral", "short", "green"] },
      { title: "Квіз", body: "Питання у форматі іспиту прямо всередині діалогу Telegram.", accents: ["blue", "neutral", "neutral", "shortGreen"] },
      { title: "Практичний кейс", body: "Тренуй реальні ситуації з перевезення, Tank і документації.", accents: ["blue", "short", "neutral", "green"] },
      { title: "Прогрес", body: "Одразу видно, які теми вже тримаються, а де потрібне повторення.", accents: ["blue", "neutral", "short", "green"] },
      { title: "Терміни", body: "Швидше розумій ADR-терміни на кшталт UN-номера, знаків небезпеки й tunnel code.", accents: ["blue", "yellow", "short", "tinyGreen"] },
      { title: "Робота над помилками", body: "Неправильні відповіді повертаються доти, доки знання не стане стійким.", accents: ["blue", "neutral", "yellow", "shortGreen"] },
      { title: "Імітація іспиту", body: "Тренування в реалістичнішому режимі з чітким розбором після спроби.", accents: ["blue", "short", "neutral", "yellow"] },
      { title: "Спецзнання по Tank", body: "Окремі матеріали про маркування, перевезення й типові питання.", accents: ["blue", "neutral", "green", "tinyYellow"] },
      { title: "Basiskurs", body: "Вивчай основи, обов’язки й важливі правила крок за кроком.", accents: ["yellow", "neutral", "shortBlue", "green"] },
      { title: "Список на повторення", body: "Зберігай складні питання й терміни, щоб повернутися до них пізніше.", accents: ["blue", "tiny", "neutral", "shortGreen"] },
      { title: "Ціль на день", body: "Невеликі цілі допомагають навчатися рівно й без випадіння з ритму.", accents: ["blue", "short", "green", "neutral"] },
      { title: "Швидкий пошук", body: "Швидше розбирайся в документах, маркуванні та формулюваннях, коли це потрібно.", accents: ["yellow", "neutral", "shortBlue", "green"] },
    ],
  },
  pricing: {
    title: "Проста модель ціни. Без здогадок.",
    description:
      "Два зрозумілі варіанти: почати безкоштовно або один раз заплатити 15 EUR за повний доступ.",
    cards: [
      {
        title: "Безкоштовний доступ",
        subtitle: "Щоб подивитися формат і зробити перші кроки всередині бота.",
        price: "0 EUR",
        suffix: "/ безкоштовно",
        features: [
          "Спробувати перші приклади питань",
          "Подивитися частину термінів",
          "Відразу стартувати в Telegram",
          "Без нової навчальної платформи",
        ],
        cta: "Відкрити в Telegram",
        source: "premium_preview_free",
      },
      {
        title: "Повний доступ",
        subtitle: "Платиш один раз і тренуєшся з усім доступним навчальним матеріалом.",
        price: "15 EUR",
        suffix: "/ один раз",
        features: [
          "Увесь доступний навчальний контент",
          "Basiskurs, Tank і терміни",
          "Розширені квізи й практичні кейси",
          "Пояснення, повторення й прогрес",
          "Без щомісячної оплати",
        ],
        cta: "Повний доступ за 15 EUR",
        source: "premium_preview_full_access",
        featured: true,
        badge: "Full Access",
      },
    ],
  },
  faq: {
    title: "Поширені запитання",
    items: [
      {
        question: "Як працює ADR Bot?",
        answer:
          "Ти відкриваєш Telegram, запускаєш бота й обираєш свій навчальний шлях. Далі отримуєш питання, терміни й пояснення крок за кроком.",
      },
      {
        question: "Чи потрібна база наперед?",
        answer:
          "Ні. Вхід спеціально зроблений простим. У теми Tank та спеціальні блоки можна заглибитися пізніше.",
      },
      {
        question: "На яких пристроях це працює?",
        answer: "Скрізь, де працює Telegram: смартфон, планшет або комп’ютер.",
      },
      {
        question: "Full Access — це підписка?",
        answer:
          "Ні. У цьому прев’ю Full Access показаний як разовий платіж 15 EUR.",
      },
    ],
    ctaTitle: "Хочеш іти на ADR-іспит спокійніше?",
    ctaDescription:
      "Відкрий бота в Telegram і подивися перші питання менш ніж за хвилину.",
    ctaButton: "Почати в Telegram",
  },
  footer: {
    copyright: "© 2026 ADR Bot",
    imprint: "Вихідні дані",
    privacy: "Конфіденційність",
    terms: "Умови",
  },
  extraStep: {
    step: "4",
    emoji: "🏆",
    title: "Іди на іспит спокійніше",
    body: "Нарощуй рутину й підходь до ADR-іспиту з більшою впевненістю.",
  },
});

const tr = buildLocalizedCopy("tr", {
  ui: {
    carouselNavLabel: "Önizleme gezinmesi",
    previousPreview: "Önceki önizleme",
    nextPreview: "Sonraki önizleme",
    previewLabel: "Önizleme",
  },
  nav: {
    ariaLabel: "ADR Bot premium önizleme",
    features: "Özellikler",
    courses: "Kurslar",
    pricing: "Fiyatlandırma",
    faq: "SSS",
    telegram: "Telegram'da aç",
    primary: "Telegram'da başla",
  },
  hero: {
    title: "ADR sınavına daha basit bir başlangıç",
    highlight: "Almanca",
    primary: "Telegram'da başla",
    secondary: "30 saniyede gör",
    microNote: "Ücretsiz. Kayıt yok. Doğrudan Telegram'da.",
    trustPills: [
      { icon: "✈", title: "Telegram'da", subtitle: "Anında başla" },
      { icon: "🇩🇪", title: "Almanca", subtitle: "Daha anlaşılır" },
      { icon: "✦", title: "Adım adım", subtitle: "Güven kazan" },
    ],
  },
  visual: {
    baseCourse: "Basiskurs",
    tankCourse: "Tank",
    termsCourse: "Terimler",
    progress: "İlerleme",
    lessonChip: "Ders: 2.3 Tanklarda taşıma",
    question: "Hangi ifade doğrudur?",
    statement: "Bir tank aracı turuncu levhalarla işaretlenmelidir.",
    answers: [
      "A Doğru",
      "B Yanlış",
      "C Sadece sınıf 3 tehlikeli maddeler için",
    ],
    feedbackTitle: "Harika!",
    feedbackText: "Doğru cevap A. Böyle devam et.",
    inputPlaceholder: "Mesaj",
  },
  courses: {
    cards: [
      {
        emoji: "📖",
        title: "Basiskurs",
        body: "Temeller, kurallar ve önemli gereklilikler daha anlaşılır şekilde açıklanır.",
        meta: "12 ders",
      },
      {
        emoji: "🚛",
        title: "Tank",
        body: "Tank taşımacılığı için özel bilgi — pratik ve sindirmesi daha kolay.",
        meta: "8 ders",
      },
      {
        emoji: "📘",
        title: "Terimler",
        body: "Önemli ADR terimleri basit dille ve doğru bağlam içinde açıklanır.",
        meta: "120+ terim",
      },
    ],
  },
  carousel: {
    title: "ADR Bot ile öğrenmek nasıl görünüyor?",
    description:
      "Birkaç ekran, bot içinde öğrenmenin, tekrarın ve hızlı başvurunun nasıl göründüğünü gösterir.",
    cards: [
      { title: "Açıklama", body: "Kısa cevaplar yalnızca neyin doğru olduğunu değil, nedenini de gösterir.", accents: ["blue", "neutral", "short", "green"] },
      { title: "Quiz", body: "Sınava benzer çoktan seçmeli sorular doğrudan Telegram diyaloğunda gelir.", accents: ["blue", "neutral", "neutral", "shortGreen"] },
      { title: "Pratik durum", body: "Taşıma, Tank ve belgelerden gerçek durumları çalış.", accents: ["blue", "short", "neutral", "green"] },
      { title: "İlerleme", body: "Hangi konuların oturduğunu ve nerede tekrar gerektiğini hemen görürsün.", accents: ["blue", "neutral", "short", "green"] },
      { title: "Terimler", body: "UN numarası, tehlike etiketi ve tünel kodu gibi ADR terimlerini daha hızlı anla.", accents: ["blue", "yellow", "short", "tinyGreen"] },
      { title: "Hata çalışması", body: "Yanlış cevaplar bilgi kalıcı olana kadar geri gelir.", accents: ["blue", "neutral", "yellow", "shortGreen"] },
      { title: "Sınav simülasyonu", body: "Daha gerçekçi koşullarda çalış ve sonrasında net geri bildirim al.", accents: ["blue", "short", "neutral", "yellow"] },
      { title: "Tank uzmanlığı", body: "Tank işaretleme, taşıma ve tipik sorular için özel içerik.", accents: ["blue", "neutral", "green", "tinyYellow"] },
      { title: "Basiskurs", body: "Temel yükümlülükleri ve önemli kuralları adım adım öğren.", accents: ["yellow", "neutral", "shortBlue", "green"] },
      { title: "Tekrar listesi", body: "Zor soruları ve terimleri kaydet, sonra hedefli şekilde tekrar et.", accents: ["blue", "tiny", "neutral", "shortGreen"] },
      { title: "Günlük hedef", body: "Küçük hedefler ritmi korumana ve düzenli ilerlemene yardım eder.", accents: ["blue", "short", "green", "neutral"] },
      { title: "Hızlı başvuru", body: "Belgeleri, işaretleri ve ifadeleri gerektiği anda daha hızlı anla.", accents: ["yellow", "neutral", "shortBlue", "green"] },
    ],
  },
  pricing: {
    title: "Basit fiyatlandırma. Tahmin yok.",
    description:
      "İki net seçenek: ücretsiz başla ya da tam erişim için bir kez 15 EUR öde.",
    cards: [
      {
        title: "Ücretsiz erişim",
        subtitle: "Formatı görmek ve bot içinde ilk adımları atmak için ideal.",
        price: "0 EUR",
        suffix: "/ ücretsiz",
        features: [
          "İlk örnek soruları dene",
          "Seçili ADR terimlerini gör",
          "Doğrudan Telegram'da başla",
          "Ek öğrenme platformu yok",
        ],
        cta: "Telegram'da dene",
        source: "premium_preview_free",
      },
      {
        title: "Tam erişim",
        subtitle: "Bir kez öde ve mevcut tüm öğrenme içeriğiyle çalış.",
        price: "15 EUR",
        suffix: "/ tek sefer",
        features: [
          "Mevcut tüm öğrenme içeriği",
          "Basiskurs, Tank ve terimler",
          "Genişletilmiş quizler ve pratik senaryolar",
          "Açıklamalar, tekrar ve ilerleme",
          "Aylık ödeme yok",
        ],
        cta: "15 EUR ile aç",
        source: "premium_preview_full_access",
        featured: true,
        badge: "Full Access",
      },
    ],
  },
  faq: {
    title: "Sık sorulan sorular",
    items: [
      {
        question: "ADR Bot nasıl çalışır?",
        answer:
          "Telegram'ı açarsın, botu başlatırsın ve öğrenme yolunu seçersin. Sonra adım adım sorular, terimler ve açıklamalar alırsın.",
      },
      {
        question: "Önceden bilgi gerekir mi?",
        answer:
          "Hayır. Giriş özellikle basit tutuldu. Tank ve özel konulara daha sonra daha derin girebilirsin.",
      },
      {
        question: "Hangi cihazlarda çalışır?",
        answer: "Telegram'ın çalıştığı her yerde: telefon, tablet veya bilgisayar.",
      },
      {
        question: "Tam erişim bir abonelik mi?",
        answer:
          "Hayır. Bu önizlemede tam erişim 15 EUR tek seferlik ödeme olarak gösteriliyor.",
      },
    ],
    ctaTitle: "ADR sınavına daha rahat girmek ister misin?",
    ctaDescription:
      "Botu Telegram'da aç ve ilk soruları bir dakikadan kısa sürede gör.",
    ctaButton: "Telegram'da başla",
  },
  footer: {
    copyright: "© 2026 ADR Bot",
    imprint: "Yasal Bilgiler",
    privacy: "Gizlilik",
    terms: "Şartlar",
  },
  extraStep: {
    step: "4",
    emoji: "🏆",
    title: "Sınava daha rahat gir",
    body: "Rutin kur ve ADR sınavına daha fazla güvenle yaklaş.",
  },
});

const ar = buildLocalizedCopy("ar", {
  ui: {
    carouselNavLabel: "التنقّل بين المعاينات",
    previousPreview: "المعاينة السابقة",
    nextPreview: "المعاينة التالية",
    previewLabel: "معاينة",
  },
  nav: {
    ariaLabel: "معاينة ADR Bot المميزة",
    features: "المزايا",
    courses: "الدورات",
    pricing: "الأسعار",
    faq: "الأسئلة الشائعة",
    telegram: "افتح في Telegram",
    primary: "ابدأ في Telegram",
  },
  hero: {
    title: "بداية أبسط لامتحان ADR",
    highlight: "بالألمانية",
    primary: "ابدأ في Telegram",
    secondary: "شاهده خلال 30 ثانية",
    microNote: "مجانًا. بدون تسجيل. مباشرة داخل Telegram.",
    trustPills: [
      { icon: "✈", title: "داخل Telegram", subtitle: "ابدأ فورًا" },
      { icon: "🇩🇪", title: "بالألمانية", subtitle: "أسهل للفهم" },
      { icon: "✦", title: "خطوة بخطوة", subtitle: "ثقة أكبر" },
    ],
  },
  visual: {
    baseCourse: "Basiskurs",
    tankCourse: "Tank",
    termsCourse: "المصطلحات",
    progress: "التقدّم",
    lessonChip: "الدرس: 2.3 النقل في الصهاريج",
    question: "أي عبارة صحيحة؟",
    statement: "يجب تمييز مركبة الصهريج بلوحات برتقالية.",
    answers: [
      "A صحيح",
      "B خطأ",
      "C فقط لمواد الخطر من الفئة 3",
    ],
    feedbackTitle: "ممتاز!",
    feedbackText: "الإجابة الصحيحة هي A. استمر هكذا.",
    inputPlaceholder: "رسالة",
  },
  courses: {
    cards: [
      {
        emoji: "📖",
        title: "Basiskurs",
        body: "الأساسيات والقواعد والمتطلبات المهمة مشروحة بشكل أوضح وأسهل.",
        meta: "12 درسًا",
      },
      {
        emoji: "🚛",
        title: "Tank",
        body: "معرفة متخصصة في النقل بالصهاريج بشكل عملي وأسهل للاستيعاب.",
        meta: "8 دروس",
      },
      {
        emoji: "📘",
        title: "المصطلحات",
        body: "أهم مصطلحات ADR مشروحة بلغة بسيطة وضمن السياق الصحيح.",
        meta: "120+ مصطلح",
      },
    ],
  },
  carousel: {
    title: "كيف يبدو التعلّم مع ADR Bot",
    description:
      "عدة شاشات توضّح كيف يبدو التعلّم والمراجعة والبحث السريع داخل البوت.",
    cards: [
      { title: "شرح", body: "الإجابات القصيرة لا تُظهر ما هو الصحيح فقط، بل توضح السبب أيضًا.", accents: ["blue", "neutral", "short", "green"] },
      { title: "اختبار", body: "أسئلة متعددة الخيارات بصيغة قريبة من الامتحان داخل محادثة Telegram مباشرة.", accents: ["blue", "neutral", "neutral", "shortGreen"] },
      { title: "سيناريو عملي", body: "تدرّب على مواقف حقيقية من النقل والصهاريج والوثائق.", accents: ["blue", "short", "neutral", "green"] },
      { title: "التقدّم", body: "ترى فورًا ما الذي أصبح ثابتًا وأين تحتاج إلى مزيد من التكرار.", accents: ["blue", "neutral", "short", "green"] },
      { title: "المصطلحات", body: "افهم أسرع مصطلحات ADR مثل رقم UN وملصق الخطر ورمز النفق.", accents: ["blue", "yellow", "short", "tinyGreen"] },
      { title: "تدريب الأخطاء", body: "تعود الإجابات الخاطئة حتى تصبح المعرفة أكثر ثباتًا.", accents: ["blue", "neutral", "yellow", "shortGreen"] },
      { title: "محاكاة الامتحان", body: "تدرّب في ظروف أكثر واقعية مع ملاحظات واضحة بعد المحاولة.", accents: ["blue", "short", "neutral", "yellow"] },
      { title: "معرفة Tank المتخصصة", body: "محتوى مخصص لوسم الصهاريج والنقل والأسئلة الشائعة.", accents: ["blue", "neutral", "green", "tinyYellow"] },
      { title: "Basiskurs", body: "تعلّم الأساسيات والالتزامات والقواعد المهمة خطوة بخطوة.", accents: ["yellow", "neutral", "shortBlue", "green"] },
      { title: "قائمة المراجعة", body: "احفظ الأسئلة والمصطلحات الصعبة وارجع إليها لاحقًا بشكل مركّز.", accents: ["blue", "tiny", "neutral", "shortGreen"] },
      { title: "هدف اليوم", body: "الأهداف الصغيرة تساعدك على الاستمرار بوتيرة ثابتة.", accents: ["blue", "short", "green", "neutral"] },
      { title: "بحث سريع", body: "افهم الوثائق والعلامات والصياغات بسرعة أكبر عندما تحتاج إليها.", accents: ["yellow", "neutral", "shortBlue", "green"] },
    ],
  },
  pricing: {
    title: "تسعير بسيط. بلا تخمين.",
    description:
      "خياران واضحان: ابدأ مجانًا أو ادفع 15 يورو مرة واحدة للوصول الكامل.",
    cards: [
      {
        title: "وصول مجاني",
        subtitle: "مناسب للتجربة الأولى ولأخذ أول خطواتك داخل البوت.",
        price: "0 EUR",
        suffix: "/ مجاني",
        features: [
          "جرّب أولى نماذج الأسئلة",
          "اطّلع على بعض مصطلحات ADR",
          "ابدأ مباشرة داخل Telegram",
          "من دون منصة تعليم إضافية",
        ],
        cta: "جرّبه في Telegram",
        source: "premium_preview_free",
      },
      {
        title: "وصول كامل",
        subtitle: "ادفع مرة واحدة وتدرّب على كل المحتوى التعليمي المتاح حاليًا.",
        price: "15 EUR",
        suffix: "/ مرة واحدة",
        features: [
          "كل المحتوى التعليمي المتاح",
          "Basiskurs وTank والمصطلحات",
          "اختبارات موسعة وسيناريوهات عملية",
          "شروحات ومراجعة وتتبع للتقدم",
          "من دون دفعات شهرية",
        ],
        cta: "افتح الوصول الكامل مقابل 15 يورو",
        source: "premium_preview_full_access",
        featured: true,
        badge: "Full Access",
      },
    ],
  },
  faq: {
    title: "الأسئلة الشائعة",
    items: [
      {
        question: "كيف يعمل ADR Bot؟",
        answer:
          "تفتح Telegram وتبدأ البوت وتختار مسارك الدراسي. بعد ذلك تحصل على أسئلة ومصطلحات وشروحات خطوة بخطوة.",
      },
      {
        question: "هل أحتاج إلى معرفة مسبقة؟",
        answer:
          "لا. الدخول مصمم ليكون بسيطًا. ويمكنك التعمق لاحقًا في موضوع Tank والمواضيع الخاصة.",
      },
      {
        question: "على أي أجهزة يعمل؟",
        answer: "في كل مكان يعمل فيه Telegram: الهاتف أو الجهاز اللوحي أو الكمبيوتر.",
      },
      {
        question: "هل الوصول الكامل اشتراك؟",
        answer:
          "لا. في هذه المعاينة يظهر الوصول الكامل كدفعة واحدة بقيمة 15 يورو.",
      },
    ],
    ctaTitle: "هل تريد دخول امتحان ADR بهدوء أكبر؟",
    ctaDescription:
      "افتح البوت في Telegram وشاهد أول الأسئلة في أقل من دقيقة.",
    ctaButton: "ابدأ في Telegram",
  },
  footer: {
    copyright: "© 2026 ADR Bot",
    imprint: "البيانات القانونية",
    privacy: "الخصوصية",
    terms: "الشروط",
  },
  extraStep: {
    step: "4",
    emoji: "🏆",
    title: "ادخل إلى الامتحان بهدوء أكبر",
    body: "ابنِ روتينك وتوجّه إلى امتحان ADR بثقة أكبر.",
  },
});

const pl = buildLocalizedCopy("pl", {
  ui: {
    carouselNavLabel: "Nawigacja podglądu",
    previousPreview: "Poprzedni podgląd",
    nextPreview: "Następny podgląd",
    previewLabel: "Podgląd",
  },
  nav: {
    ariaLabel: "Podgląd premium ADR Bot",
    features: "Funkcje",
    courses: "Kursy",
    pricing: "Cennik",
    faq: "FAQ",
    telegram: "Otwórz w Telegramie",
    primary: "Zacznij w Telegramie",
  },
  hero: {
    title: "Prostszy start do egzaminu ADR",
    highlight: "po niemiecku",
    primary: "Zacznij w Telegramie",
    secondary: "Zobacz w 30 sekund",
    microNote: "Za darmo. Bez rejestracji. Bezpośrednio w Telegramie.",
    trustPills: [
      { icon: "✈", title: "W Telegramie", subtitle: "Start od razu" },
      { icon: "🇩🇪", title: "Po niemiecku", subtitle: "Łatwiej zrozumieć" },
      { icon: "✦", title: "Krok po kroku", subtitle: "Więcej pewności" },
    ],
  },
  visual: {
    baseCourse: "Basiskurs",
    tankCourse: "Tank",
    termsCourse: "Terminy",
    progress: "Postęp",
    lessonChip: "Lekcja: 2.3 Transport w cysternach",
    question: "Które stwierdzenie jest prawidłowe?",
    statement: "Pojazd-cysterna musi być oznaczony pomarańczowymi tablicami.",
    answers: [
      "A Prawda",
      "B Fałsz",
      "C Tylko dla towarów niebezpiecznych klasy 3",
    ],
    feedbackTitle: "Świetnie!",
    feedbackText: "Prawidłowa odpowiedź to A. Tak trzymaj.",
    inputPlaceholder: "Wiadomość",
  },
  courses: {
    cards: [
      { emoji: "📖", title: "Basiskurs", body: "Podstawy, zasady i ważne wymagania wyjaśnione prościej.", meta: "12 lekcji" },
      { emoji: "🚛", title: "Tank", body: "Wiedza specjalistyczna o transporcie w cysternach — praktycznie i bez przeciążenia.", meta: "8 lekcji" },
      { emoji: "📘", title: "Terminy", body: "Najważniejsze pojęcia ADR wyjaśnione prostym językiem i we właściwym kontekście.", meta: "120+ terminów" },
    ],
  },
  carousel: {
    title: "Jak wygląda nauka z ADR Bot",
    description: "Kilka ekranów pokazuje, jak w bocie wyglądają nauka, powtórki i szybkie sprawdzanie.",
    cards: [
      { title: "Wyjaśnienie", body: "Krótkie odpowiedzi pokazują nie tylko co jest poprawne, ale też dlaczego.", accents: ["blue", "neutral", "short", "green"] },
      { title: "Quiz", body: "Pytania wielokrotnego wyboru zbliżone do egzaminu, bezpośrednio na czacie Telegram.", accents: ["blue", "neutral", "neutral", "shortGreen"] },
      { title: "Sytuacja praktyczna", body: "Ćwicz konkretne sytuacje z transportu, Tank i dokumentacji.", accents: ["blue", "short", "neutral", "green"] },
      { title: "Postęp", body: "Od razu widzisz, które tematy już trzymają się dobrze, a gdzie potrzebna jest powtórka.", accents: ["blue", "neutral", "short", "green"] },
      { title: "Terminy", body: "Szybciej rozumiesz pojęcia ADR, takie jak numer UN, nalepka ostrzegawcza czy tunnel code.", accents: ["blue", "yellow", "short", "tinyGreen"] },
      { title: "Praca nad błędami", body: "Błędne odpowiedzi wracają, dopóki wiedza nie stanie się stabilna.", accents: ["blue", "neutral", "yellow", "shortGreen"] },
      { title: "Symulacja egzaminu", body: "Ćwicz w bardziej realistycznym trybie i otrzymuj jasną informację zwrotną po każdej próbie.", accents: ["blue", "short", "neutral", "yellow"] },
      { title: "Moduł Tank", body: "Osobne materiały o oznakowaniu, przewozie i typowych pytaniach dla Tank.", accents: ["blue", "neutral", "green", "tinyYellow"] },
      { title: "Basiskurs", body: "Ucz się podstaw, obowiązków i ważnych zasad krok po kroku.", accents: ["yellow", "neutral", "shortBlue", "green"] },
      { title: "Lista do powtórek", body: "Zapisuj trudne pytania i terminy, aby wrócić do nich później.", accents: ["blue", "tiny", "neutral", "shortGreen"] },
      { title: "Cel na dziś", body: "Małe cele pomagają uczyć się regularnie i bez przerw.", accents: ["blue", "short", "green", "neutral"] },
      { title: "Szybki podgląd", body: "Szybciej rozumiesz dokumenty, oznaczenia i sformułowania wtedy, gdy są potrzebne.", accents: ["yellow", "neutral", "shortBlue", "green"] },
    ],
  },
  pricing: {
    title: "Prosty cennik. Bez zgadywania.",
    description: "Dwie jasne opcje: zacząć za darmo albo zapłacić jednorazowo 15 EUR za pełny dostęp.",
    cards: [
      {
        title: "Dostęp bezpłatny",
        subtitle: "Aby sprawdzić format i zrobić pierwsze kroki w bocie.",
        price: "0 EUR",
        suffix: "/ gratis",
        features: [
          "Wypróbuj pierwsze przykładowe pytania",
          "Zobacz wybrane terminy ADR",
          "Zacznij od razu w Telegramie",
          "Bez dodatkowej platformy do nauki",
        ],
        cta: "Wypróbuj w Telegramie",
        source: "premium_preview_free",
      },
      {
        title: "Pełny dostęp",
        subtitle: "Płacisz raz i ćwiczysz z całym dostępnym materiałem.",
        price: "15 EUR",
        suffix: "/ jednorazowo",
        features: [
          "Cały dostępny materiał edukacyjny",
          "Basiskurs, Tank i terminy",
          "Rozszerzone quizy i sytuacje praktyczne",
          "Wyjaśnienia, powtórki i postęp",
          "Bez miesięcznej opłaty",
        ],
        cta: "Pełny dostęp za 15 EUR",
        source: "premium_preview_full_access",
        featured: true,
        badge: "Full Access",
      },
    ],
  },
  faq: {
    title: "Najczęstsze pytania",
    items: [
      { question: "Jak działa ADR Bot?", answer: "Otwierasz Telegram, uruchamiasz bota i wybierasz swoją ścieżkę nauki. Potem dostajesz pytania, terminy i wyjaśnienia krok po kroku." },
      { question: "Czy potrzebuję wcześniejszej wiedzy?", answer: "Nie. Start został celowo uproszczony. W tematy Tank i specjalistyczne możesz wejść głębiej później." },
      { question: "Na jakich urządzeniach to działa?", answer: "Wszędzie tam, gdzie działa Telegram: smartfon, tablet lub komputer." },
      { question: "Czy pełny dostęp to subskrypcja?", answer: "Nie. W tym podglądzie pełny dostęp jest pokazany jako jednorazowa płatność 15 EUR." },
    ],
    ctaTitle: "Chcesz podejść do egzaminu ADR spokojniej?",
    ctaDescription: "Otwórz bota w Telegramie i zobacz pierwsze pytania w mniej niż minutę.",
    ctaButton: "Zacznij w Telegramie",
  },
  footer: {
    copyright: "© 2026 ADR Bot",
    imprint: "Nota prawna",
    privacy: "Prywatność",
    terms: "Warunki",
  },
  extraStep: {
    step: "4",
    emoji: "🏆",
    title: "Podejdź do egzaminu spokojniej",
    body: "Buduj rutynę i idź na egzamin ADR z większą pewnością.",
  },
});

const ro = buildLocalizedCopy("ro", {
  ui: {
    carouselNavLabel: "Navigarea previzualizării",
    previousPreview: "Previzualizarea anterioară",
    nextPreview: "Previzualizarea următoare",
    previewLabel: "Previzualizare",
  },
  nav: {
    ariaLabel: "Previzualizare premium ADR Bot",
    features: "Funcții",
    courses: "Cursuri",
    pricing: "Prețuri",
    faq: "FAQ",
    telegram: "Deschide în Telegram",
    primary: "Începe în Telegram",
  },
  hero: {
    title: "Un început mai simplu pentru examenul ADR",
    highlight: "în germană",
    primary: "Începe în Telegram",
    secondary: "Vezi în 30 de secunde",
    microNote: "Gratuit. Fără cont. Direct în Telegram.",
    trustPills: [
      { icon: "✈", title: "În Telegram", subtitle: "Pornești imediat" },
      { icon: "🇩🇪", title: "În germană", subtitle: "Mai ușor de înțeles" },
      { icon: "✦", title: "Pas cu pas", subtitle: "Mai multă încredere" },
    ],
  },
  visual: {
    baseCourse: "Basiskurs",
    tankCourse: "Tank",
    termsCourse: "Termeni",
    progress: "Progres",
    lessonChip: "Lecția: 2.3 Transport în cisterne",
    question: "Care afirmație este corectă?",
    statement: "Un vehicul-cisternă trebuie marcat cu plăci portocalii.",
    answers: [
      "A Corect",
      "B Greșit",
      "C Doar pentru mărfuri periculoase din clasa 3",
    ],
    feedbackTitle: "Foarte bine!",
    feedbackText: "Răspunsul corect este A. Continuă așa.",
    inputPlaceholder: "Mesaj",
  },
  courses: {
    cards: [
      { emoji: "📖", title: "Basiskurs", body: "Bazele, regulile și cerințele importante sunt explicate mai clar.", meta: "12 lecții" },
      { emoji: "🚛", title: "Tank", body: "Cunoștințe speciale pentru transportul în cisterne — practic și mai ușor de asimilat.", meta: "8 lecții" },
      { emoji: "📘", title: "Termeni", body: "Termenii ADR importanți explicați simplu și în contextul potrivit.", meta: "120+ termeni" },
    ],
  },
  carousel: {
    title: "Cum arată învățarea cu ADR Bot",
    description: "Mai multe ecrane arată cum se simt învățarea, repetarea și verificarea rapidă în interiorul botului.",
    cards: [
      { title: "Explicație", body: "Răspunsurile scurte arată nu doar ce este corect, ci și de ce.", accents: ["blue", "neutral", "short", "green"] },
      { title: "Quiz", body: "Întrebări tip grilă apropiate de examen, direct în dialogul Telegram.", accents: ["blue", "neutral", "neutral", "shortGreen"] },
      { title: "Situație practică", body: "Exersează situații concrete din transport, Tank și documentație.", accents: ["blue", "short", "neutral", "green"] },
      { title: "Progres", body: "Vezi imediat ce teme sunt deja stabile și unde mai ajută repetarea.", accents: ["blue", "neutral", "short", "green"] },
      { title: "Termeni", body: "Înțelegi mai repede termeni ADR precum numărul UN, eticheta de pericol sau tunnel code.", accents: ["blue", "yellow", "short", "tinyGreen"] },
      { title: "Antrenarea greșelilor", body: "Răspunsurile greșite revin până când informația devine stabilă.", accents: ["blue", "neutral", "yellow", "shortGreen"] },
      { title: "Simulare de examen", body: "Exersezi în condiții mai realiste și primești feedback clar după încercare.", accents: ["blue", "short", "neutral", "yellow"] },
      { title: "Modulul Tank", body: "Conținut separat pentru marcaj, transport și întrebări tipice pentru Tank.", accents: ["blue", "neutral", "green", "tinyYellow"] },
      { title: "Basiskurs", body: "Învață bazele, obligațiile și regulile importante pas cu pas.", accents: ["yellow", "neutral", "shortBlue", "green"] },
      { title: "Listă de reluare", body: "Salvează întrebările și termenii dificili ca să revii la ei mai târziu.", accents: ["blue", "tiny", "neutral", "shortGreen"] },
      { title: "Obiectiv zilnic", body: "Obiectivele mici te ajută să rămâi constant și să nu pierzi ritmul.", accents: ["blue", "short", "green", "neutral"] },
      { title: "Consultare rapidă", body: "Înțelegi mai repede documentele, marcajele și formulările atunci când ai nevoie.", accents: ["yellow", "neutral", "shortBlue", "green"] },
    ],
  },
  pricing: {
    title: "Preț simplu. Fără ghicit.",
    description: "Două opțiuni clare: începi gratuit sau plătești o singură dată 15 EUR pentru acces complet.",
    cards: [
      {
        title: "Acces gratuit",
        subtitle: "Ca să vezi formatul și să faci primii pași în bot.",
        price: "0 EUR",
        suffix: "/ gratuit",
        features: [
          "Testezi primele exemple de întrebări",
          "Vezi o parte din termenii ADR",
          "Începi direct în Telegram",
          "Fără platformă nouă de învățare",
        ],
        cta: "Încearcă în Telegram",
        source: "premium_preview_free",
      },
      {
        title: "Acces complet",
        subtitle: "Plătești o singură dată și exersezi cu tot conținutul disponibil.",
        price: "15 EUR",
        suffix: "/ o singură dată",
        features: [
          "Tot conținutul de învățare disponibil",
          "Basiskurs, Tank și termeni",
          "Quizuri extinse și situații practice",
          "Explicații, repetare și progres",
          "Fără plată lunară",
        ],
        cta: "Acces complet la 15 EUR",
        source: "premium_preview_full_access",
        featured: true,
        badge: "Full Access",
      },
    ],
  },
  faq: {
    title: "Întrebări frecvente",
    items: [
      { question: "Cum funcționează ADR Bot?", answer: "Deschizi Telegram, pornești botul și alegi traseul de învățare. Apoi primești întrebări, termeni și explicații pas cu pas." },
      { question: "Am nevoie de cunoștințe anterioare?", answer: "Nu. Intrarea este intenționat simplă. Poți aprofunda mai târziu Tank și temele speciale." },
      { question: "Pe ce dispozitive funcționează?", answer: "Oriunde funcționează Telegram: telefon, tabletă sau desktop." },
      { question: "Accesul complet este abonament?", answer: "Nu. În această previzualizare accesul complet este prezentat ca o plată unică de 15 EUR." },
    ],
    ctaTitle: "Vrei să intri mai liniștit la examenul ADR?",
    ctaDescription: "Deschide botul în Telegram și vezi primele întrebări în mai puțin de un minut.",
    ctaButton: "Începe în Telegram",
  },
  footer: {
    copyright: "© 2026 ADR Bot",
    imprint: "Mențiuni legale",
    privacy: "Confidențialitate",
    terms: "Termeni",
  },
  extraStep: {
    step: "4",
    emoji: "🏆",
    title: "Intră mai calm la examen",
    body: "Construiește rutină și mergi la examenul ADR cu mai multă încredere.",
  },
});

const bg = buildLocalizedCopy("bg", {
  ui: {
    carouselNavLabel: "Навигация на прегледа",
    previousPreview: "Предишен преглед",
    nextPreview: "Следващ преглед",
    previewLabel: "Преглед",
  },
  nav: {
    ariaLabel: "Премиум преглед на ADR Bot",
    features: "Функции",
    courses: "Курсове",
    pricing: "Цени",
    faq: "FAQ",
    telegram: "Отвори в Telegram",
    primary: "Започни в Telegram",
  },
  hero: {
    title: "По-лесен старт за ADR изпита",
    highlight: "на немски",
    primary: "Започни в Telegram",
    secondary: "Виж за 30 секунди",
    microNote: "Безплатно. Без регистрация. Направо в Telegram.",
    trustPills: [
      { icon: "✈", title: "В Telegram", subtitle: "Старт веднага" },
      { icon: "🇩🇪", title: "На немски", subtitle: "По-лесно за разбиране" },
      { icon: "✦", title: "Стъпка по стъпка", subtitle: "Повече увереност" },
    ],
  },
  visual: {
    baseCourse: "Basiskurs",
    tankCourse: "Tank",
    termsCourse: "Термини",
    progress: "Прогрес",
    lessonChip: "Урок: 2.3 Превоз в цистерни",
    question: "Кое твърдение е вярно?",
    statement: "Автоцистерната трябва да бъде обозначена с оранжеви табели.",
    answers: [
      "A Вярно",
      "B Невярно",
      "C Само за опасни товари от клас 3",
    ],
    feedbackTitle: "Страхотно!",
    feedbackText: "Правилният отговор е A. Продължавай така.",
    inputPlaceholder: "Съобщение",
  },
  courses: {
    cards: [
      { emoji: "📖", title: "Basiskurs", body: "Основите, правилата и важните изисквания са обяснени по-разбираемо.", meta: "12 урока" },
      { emoji: "🚛", title: "Tank", body: "Специални знания за превоз в цистерни — практично и без претоварване.", meta: "8 урока" },
      { emoji: "📘", title: "Термини", body: "Ключовите ADR термини са обяснени просто и в правилния контекст.", meta: "120+ термина" },
    ],
  },
  carousel: {
    title: "Как изглежда ученето с ADR Bot",
    description: "Няколко екрана показват как изглеждат ученето, повторението и бързата справка вътре в бота.",
    cards: [
      { title: "Обяснение", body: "Кратките отговори показват не само кое е правилно, а и защо.", accents: ["blue", "neutral", "short", "green"] },
      { title: "Куиз", body: "Въпроси с избираем отговор, близки до изпита, директно в разговора в Telegram.", accents: ["blue", "neutral", "neutral", "shortGreen"] },
      { title: "Практически случай", body: "Тренирай конкретни ситуации от транспорта, Tank и документацията.", accents: ["blue", "short", "neutral", "green"] },
      { title: "Прогрес", body: "Веднага виждаш кои теми вече са стабилни и къде помага повторението.", accents: ["blue", "neutral", "short", "green"] },
      { title: "Термини", body: "По-бързо разбираш ADR термини като UN номер, етикет за опасност и tunnel code.", accents: ["blue", "yellow", "short", "tinyGreen"] },
      { title: "Тренировка на грешки", body: "Грешните отговори се връщат, докато знанието стане по-стабилно.", accents: ["blue", "neutral", "yellow", "shortGreen"] },
      { title: "Симулация на изпит", body: "Упражнявай се в по-реалистичен режим и получавай ясна обратна връзка след опита.", accents: ["blue", "short", "neutral", "yellow"] },
      { title: "Специални знания за Tank", body: "Отделно съдържание за маркировка, превоз и типични въпроси за Tank.", accents: ["blue", "neutral", "green", "tinyYellow"] },
      { title: "Basiskurs", body: "Учи основите, задълженията и важните правила стъпка по стъпка.", accents: ["yellow", "neutral", "shortBlue", "green"] },
      { title: "Списък за повторение", body: "Запазвай трудните въпроси и термини, за да се върнеш към тях по-късно.", accents: ["blue", "tiny", "neutral", "shortGreen"] },
      { title: "Дневна цел", body: "Малките цели помагат да учиш по-редовно и без изпадане от ритъм.", accents: ["blue", "short", "green", "neutral"] },
      { title: "Бърза справка", body: "По-бързо разбираш документи, маркировки и формулировки, когато ти потрябват.", accents: ["yellow", "neutral", "shortBlue", "green"] },
    ],
  },
  pricing: {
    title: "Ясна цена. Без гадаене.",
    description: "Две ясни опции: започваш безплатно или плащаш еднократно 15 EUR за пълен достъп.",
    cards: [
      {
        title: "Безплатен достъп",
        subtitle: "За да видиш формата и да направиш първите си стъпки в бота.",
        price: "0 EUR",
        suffix: "/ безплатно",
        features: [
          "Пробвай първите примерни въпроси",
          "Виж избрани ADR термини",
          "Започни веднага в Telegram",
          "Без нова учебна платформа",
        ],
        cta: "Пробвай в Telegram",
        source: "premium_preview_free",
      },
      {
        title: "Пълен достъп",
        subtitle: "Плащаш веднъж и упражняваш с цялото налично съдържание.",
        price: "15 EUR",
        suffix: "/ еднократно",
        features: [
          "Цялото налично учебно съдържание",
          "Basiskurs, Tank и термини",
          "Разширени тестове и практически случаи",
          "Обяснения, повторение и прогрес",
          "Без месечна такса",
        ],
        cta: "Пълен достъп за 15 EUR",
        source: "premium_preview_full_access",
        featured: true,
        badge: "Full Access",
      },
    ],
  },
  faq: {
    title: "Често задавани въпроси",
    items: [
      { question: "Как работи ADR Bot?", answer: "Отваряш Telegram, стартираш бота и избираш своя учебен път. След това получаваш въпроси, термини и обяснения стъпка по стъпка." },
      { question: "Нужна ли е предварителна подготовка?", answer: "Не. Началото е умишлено направено лесно. В темите Tank и специалните блокове можеш да навлезеш по-дълбоко по-късно." },
      { question: "На кои устройства работи?", answer: "Навсякъде, където работи Telegram: смартфон, таблет или компютър." },
      { question: "Пълният достъп абонамент ли е?", answer: "Не. В този преглед пълният достъп е показан като еднократно плащане от 15 EUR." },
    ],
    ctaTitle: "Искаш ли да влезеш по-спокойно на ADR изпита?",
    ctaDescription: "Отвори бота в Telegram и виж първите въпроси за по-малко от минута.",
    ctaButton: "Започни в Telegram",
  },
  footer: {
    copyright: "© 2026 ADR Bot",
    imprint: "Правна информация",
    privacy: "Поверителност",
    terms: "Условия",
  },
  extraStep: {
    step: "4",
    emoji: "🏆",
    title: "Отиди на изпита по-спокойно",
    body: "Изгради рутина и влез в ADR изпита с повече увереност.",
  },
});

const hr = buildLocalizedCopy("hr", {
  ui: {
    carouselNavLabel: "Navigacija pregleda",
    previousPreview: "Prethodni pregled",
    nextPreview: "Sljedeći pregled",
    previewLabel: "Pregled",
  },
  nav: {
    ariaLabel: "ADR Bot premium pregled",
    features: "Značajke",
    courses: "Tečajevi",
    pricing: "Cijene",
    faq: "FAQ",
    telegram: "Otvori u Telegramu",
    primary: "Počni u Telegramu",
  },
  hero: {
    title: "Jednostavniji početak za ADR ispit",
    highlight: "na njemačkom",
    primary: "Počni u Telegramu",
    secondary: "Pogledaj za 30 sekundi",
    microNote: "Besplatno. Bez registracije. Izravno u Telegramu.",
    trustPills: [
      { icon: "✈", title: "U Telegramu", subtitle: "Počni odmah" },
      { icon: "🇩🇪", title: "Na njemačkom", subtitle: "Lakše za razumijevanje" },
      { icon: "✦", title: "Korak po korak", subtitle: "Više sigurnosti" },
    ],
  },
  visual: {
    baseCourse: "Basiskurs",
    tankCourse: "Tank",
    termsCourse: "Pojmovi",
    progress: "Napredak",
    lessonChip: "Lekcija: 2.3 Prijevoz u cisternama",
    question: "Koja je tvrdnja točna?",
    statement: "Vozilo-cisterna mora biti označeno narančastim pločama.",
    answers: [
      "A Točno",
      "B Netočno",
      "C Samo za opasnu robu klase 3",
    ],
    feedbackTitle: "Odlično!",
    feedbackText: "Točan odgovor je A. Samo nastavi.",
    inputPlaceholder: "Poruka",
  },
  courses: {
    cards: [
      { emoji: "📖", title: "Basiskurs", body: "Osnove, pravila i važni zahtjevi objašnjeni su jasnije i jednostavnije.", meta: "12 lekcija" },
      { emoji: "🚛", title: "Tank", body: "Specijalno znanje za prijevoz u cisternama — praktično i lakše za usvojiti.", meta: "8 lekcija" },
      { emoji: "📘", title: "Pojmovi", body: "Najvažniji ADR pojmovi objašnjeni su jednostavno i u pravom kontekstu.", meta: "120+ pojmova" },
    ],
  },
  carousel: {
    title: "Kako izgleda učenje s ADR Botom",
    description: "Nekoliko ekrana pokazuje kako unutar bota izgledaju učenje, ponavljanje i brza provjera.",
    cards: [
      { title: "Objašnjenje", body: "Kratki odgovori pokazuju ne samo što je točno nego i zašto.", accents: ["blue", "neutral", "short", "green"] },
      { title: "Kviz", body: "Pitanja višestrukog izbora bliska ispitu, izravno u Telegram razgovoru.", accents: ["blue", "neutral", "neutral", "shortGreen"] },
      { title: "Praktični primjer", body: "Vježbaj konkretne situacije iz prijevoza, Tank i dokumentacije.", accents: ["blue", "short", "neutral", "green"] },
      { title: "Napredak", body: "Odmah vidiš koje su teme već stabilne, a gdje još pomaže ponavljanje.", accents: ["blue", "neutral", "short", "green"] },
      { title: "Pojmovi", body: "Brže razumiješ ADR pojmove kao što su UN broj, oznaka opasnosti ili tunnel code.", accents: ["blue", "yellow", "short", "tinyGreen"] },
      { title: "Trening pogrešaka", body: "Pogrešni odgovori vraćaju se dok znanje ne postane stabilnije.", accents: ["blue", "neutral", "yellow", "shortGreen"] },
      { title: "Simulacija ispita", body: "Vježbaj u realističnijem načinu i poslije dobivaj jasnu povratnu informaciju.", accents: ["blue", "short", "neutral", "yellow"] },
      { title: "Specijalno znanje za Tank", body: "Poseban sadržaj za označavanje, prijevoz i tipična pitanja za Tank.", accents: ["blue", "neutral", "green", "tinyYellow"] },
      { title: "Basiskurs", body: "Uči osnove, obveze i važna pravila korak po korak.", accents: ["yellow", "neutral", "shortBlue", "green"] },
      { title: "Popis za ponavljanje", body: "Spremi teška pitanja i pojmove kako bi im se kasnije ciljano vratio.", accents: ["blue", "tiny", "neutral", "shortGreen"] },
      { title: "Dnevni cilj", body: "Mali ciljevi pomažu da učiš ravnomjerno i bez ispadanja iz ritma.", accents: ["blue", "short", "green", "neutral"] },
      { title: "Brzi pregled", body: "Brže razumij dokumente, oznake i formulacije kada ti zatrebaju.", accents: ["yellow", "neutral", "shortBlue", "green"] },
    ],
  },
  pricing: {
    title: "Jednostavna cijena. Bez nagađanja.",
    description: "Dvije jasne opcije: počni besplatno ili jednokratno plati 15 EUR za puni pristup.",
    cards: [
      {
        title: "Besplatan pristup",
        subtitle: "Za upoznavanje s formatom i prve korake unutar bota.",
        price: "0 EUR",
        suffix: "/ besplatno",
        features: [
          "Isprobaj prva ogledna pitanja",
          "Pogledaj odabrane ADR pojmove",
          "Počni odmah u Telegramu",
          "Bez nove platforme za učenje",
        ],
        cta: "Isprobaj u Telegramu",
        source: "premium_preview_free",
      },
      {
        title: "Puni pristup",
        subtitle: "Plati jednom i vježbaj sa svim trenutno dostupnim sadržajem.",
        price: "15 EUR",
        suffix: "/ jednokratno",
        features: [
          "Sav dostupan sadržaj za učenje",
          "Basiskurs, Tank i pojmovi",
          "Prošireni kvizovi i praktični slučajevi",
          "Objašnjenja, ponavljanje i napredak",
          "Bez mjesečne pretplate",
        ],
        cta: "Puni pristup za 15 EUR",
        source: "premium_preview_full_access",
        featured: true,
        badge: "Full Access",
      },
    ],
  },
  faq: {
    title: "Česta pitanja",
    items: [
      { question: "Kako radi ADR Bot?", answer: "Otvoriš Telegram, pokreneš bot i odabereš svoj put učenja. Zatim dobivaš pitanja, pojmove i objašnjenja korak po korak." },
      { question: "Trebam li prethodno znanje?", answer: "Ne. Ulaz je namjerno jednostavan. U Tank i posebne teme možeš ući dublje kasnije." },
      { question: "Na kojim uređajima radi?", answer: "Svugdje gdje radi Telegram: pametni telefon, tablet ili računalo." },
      { question: "Je li puni pristup pretplata?", answer: "Ne. U ovom pregledu puni pristup prikazan je kao jednokratno plaćanje od 15 EUR." },
    ],
    ctaTitle: "Želiš li mirnije ući na ADR ispit?",
    ctaDescription: "Otvori bot u Telegramu i pogledaj prva pitanja za manje od minute.",
    ctaButton: "Počni u Telegramu",
  },
  footer: {
    copyright: "© 2026 ADR Bot",
    imprint: "Pravne informacije",
    privacy: "Privatnost",
    terms: "Uvjeti",
  },
  extraStep: {
    step: "4",
    emoji: "🏆",
    title: "Idi mirnije na ispit",
    body: "Izgradi rutinu i pristupi ADR ispitu s više sigurnosti.",
  },
});

const fallbackMap: Partial<Record<LangCode, PremiumPreviewCopy>> = {
  de,
  en,
  ru,
  uk,
  tr,
  ar,
  pl,
  ro,
  bg,
  hr,
};

export function getPremiumPreviewCopy(lang: LangCode): PremiumPreviewCopy {
  return fallbackMap[lang] ?? de;
}
