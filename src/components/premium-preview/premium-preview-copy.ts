import type { LangCode } from "@/lib/i18n/translations";

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
    highlight: string;
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
    telegram: "Auf Telegram",
    primary: "Jetzt kostenlos starten",
  },
  hero: {
    eyebrow: "Öffentliche Testphase · direkt in Telegram",
    title: "Dein einfacher Start zur ADR-Prüfung",
    highlight: "auf Deutsch",
    text: "Lerne Schritt für Schritt mit dem ADR Bot auf Telegram: verständlich erklärt, praxisnah und jederzeit verfügbar.",
    primary: "Jetzt kostenlos starten",
    secondary: "So funktioniert es",
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
        cta: "Kostenlos testen",
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
        cta: "Vollen Zugang für 15 EUR starten",
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
      "Starte jetzt kostenlos auf Telegram und lerne, wann und wo du willst.",
    ctaButton: "Jetzt kostenlos starten",
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
    telegram: "On Telegram",
    primary: "Start free now",
  },
  hero: {
    eyebrow: "Public test phase · directly in Telegram",
    title: "A simpler start to your ADR exam",
    highlight: "in German",
    text: "Learn step by step with ADR Bot inside Telegram: clearly explained, practical, and always available.",
    primary: "Start free now",
    secondary: "How it works",
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
        cta: "Try for free",
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
        cta: "Start full access for 15 EUR",
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
      "Start for free on Telegram and learn whenever and wherever you want.",
    ctaButton: "Start free now",
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
    telegram: "В Telegram",
    primary: "Начать бесплатно",
  },
  hero: {
    eyebrow: "Публичная тестовая фаза · прямо в Telegram",
    title: "Простой старт к экзамену ADR",
    highlight: "на немецком",
    text: "Учись шаг за шагом с ADR Bot в Telegram: понятнее, практичнее и в удобном для тебя ритме.",
    primary: "Начать бесплатно",
    secondary: "Как это работает",
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
        cta: "Попробовать бесплатно",
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
        cta: "Открыть полный доступ за 15 EUR",
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
      "Начни бесплатно в Telegram и учись тогда, когда тебе удобно.",
    ctaButton: "Начать бесплатно",
  },
  footer: {
    copyright: "© 2026 ADR Bot",
    imprint: "Impressum",
    privacy: "Datenschutz",
    terms: "AGB",
  },
};

const fallbackMap: Partial<Record<LangCode, PremiumPreviewCopy>> = {
  de,
  en,
  ru,
  uk: ru,
  tr: en,
  ar: en,
  pl: en,
  ro: en,
  bg: en,
  hr: en,
};

export function getPremiumPreviewCopy(lang: LangCode): PremiumPreviewCopy {
  return fallbackMap[lang] ?? de;
}
