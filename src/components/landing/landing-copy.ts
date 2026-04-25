import type { LangCode } from "@/lib/i18n/translations";

type PathCard = {
  title: string;
  text: string;
};

type ProofCard = {
  label: string;
  title: string;
  text: string;
};

type FaqItem = {
  question: string;
  answer: string;
};

export type LandingConversionCopy = {
  nav: {
    tagline: string;
    openInTelegram: string;
  };
  hero: {
    eyebrow: string;
    title: string;
    description: string;
    cta: string;
    secondary: string;
    microcopy: string;
    note: string;
  };
  pathSelection: {
    eyebrow: string;
    title: string;
    description: string;
    cards: PathCard[];
  };
  proof: {
    eyebrow: string;
    title: string;
    description: string;
    cards: ProofCard[];
    screenshotCaption: string;
  };
  howItWorks: {
    eyebrow: string;
    title: string;
    description: string;
    steps: { title: string; text: string }[];
  };
  freeStart: {
    eyebrow: string;
    title: string;
    description: string;
    bullets: string[];
    cta: string;
  };
  fullAccess: {
    eyebrow: string;
    title: string;
    description: string;
    bullets: string[];
    cta: string;
  };
  trust: {
    eyebrow: string;
    title: string;
    description: string;
    bullets: string[];
  };
  faq: {
    eyebrow: string;
    title: string;
    description: string;
    items: FaqItem[];
  };
  cta: {
    eyebrow: string;
    title: string;
    description: string;
    button: string;
    note: string;
  };
  footer: {
    description: string;
    link: string;
    disclaimer: string;
  };
  pilotNotice: string;
};

const de: LandingConversionCopy = {
  nav: {
    tagline: "ADR-Vorbereitung in Telegram",
    openInTelegram: "In Telegram öffnen",
  },
  hero: {
    eyebrow: "ADR-Vorbereitung in Telegram",
    title: "ADR-Prüfung auf Deutsch fühlt sich schwer an? Fang klein an.",
    description:
      "Fragen, Begriffe und Erklärungen zur ADR-Vorbereitung — verständlich, direkt in Telegram. Für Basiskurs, Tank und Menschen, denen die Sprache im Weg steht.",
    cta: "In Telegram starten",
    secondary: "So funktioniert es",
    microcopy: "Kostenlos. Ohne Anmeldung. Dauert 10 Sekunden.",
    note: "Telegram öffnet sich. Dann einfach /start tippen und den passenden Weg wählen.",
  },
  pathSelection: {
    eyebrow: "Dein Einstieg",
    title: "Wähle deinen Weg",
    description:
      "Du musst nicht alles auf einmal lernen. Starte dort, wo du gerade stehst.",
    cards: [
      {
        title: "Basiskurs",
        text: "Die Grundlagen verstehen. Fragen und Begriffe, die jeder ADR-Fahrer braucht.",
      },
      {
        title: "Tank",
        text: "Spezifisch für Aufbaukurs Tank. Vertiefung über den Basiskurs hinaus.",
      },
      {
        title: "Begriffe",
        text: "Deutsche Fachwörter einfach erklärt. Ideal, wenn Sprache die größte Hürde ist.",
      },
    ],
  },
  proof: {
    eyebrow: "So hilft der Bot",
    title: "So sieht es in Telegram aus",
    description:
      "Ein Format zum Üben, ein Format zum Verstehen. Keine Theorie-Wand, sondern kleine, klare Schritte.",
    cards: [
      {
        label: "/question",
        title: "Prüfungsnahe Fragen mit Erklärung",
        text: "Du beantwortest eine Frage und bekommst direkt die Einordnung dazu — ohne langes Rätselraten.",
      },
      {
        label: "/word",
        title: "ADR-Begriffe, einfach erklärt",
        text: "Jeder Begriff wird so erklärt, dass du ihn im Prüfungskontext wirklich wiedererkennst.",
      },
    ],
    screenshotCaption: "Echte Telegram-Ansicht aus ADR Bot",
  },
  howItWorks: {
    eyebrow: "In drei Schritten",
    title: "Der erste Begriff ist nur wenige Sekunden entfernt",
    description:
      "Kein Login, keine E-Mail, keine neue Lernplattform. Nur Telegram und ein klarer nächster Schritt.",
    steps: [
      { title: "Bot öffnen", text: "Auf den Button klicken und Telegram öffnen." },
      {
        title: "Pfad wählen",
        text: "Basiskurs, Tank oder Begriffe auswählen und direkt anfangen.",
      },
      {
        title: "Fragen und Begriffe üben",
        text: "Kurze Lernschritte in deinem Tempo — unterwegs, in der Pause oder abends.",
      },
    ],
  },
  freeStart: {
    eyebrow: "Kostenloser Einstieg",
    title: "Kostenlos starten — ohne Konto, ohne Karte",
    description:
      "Du kannst sofort ausprobieren, ob der Bot zu dir passt, bevor du irgendetwas entscheiden musst.",
    bullets: [
      "Sofortiger Zugang über Telegram",
      "Beispielfragen und Begriffe direkt ausprobieren",
      "Keine Anmeldung und keine Kreditkarte",
      "Jederzeit wieder aufhören",
    ],
    cta: "Kostenlos in Telegram öffnen",
  },
  fullAccess: {
    eyebrow: "Wenn du tiefer einsteigen willst",
    title: "Full Access für systematisches Üben",
    description:
      "Wenn du regelmäßig trainieren und nicht nur reinschauen willst, öffnet Full Access den kompletten Lernbereich.",
    bullets: [
      "Vollständige Fragen-Datenbank für Basiskurs und Tank",
      "Alle Fachbegriffe mit Erklärung",
      "Mehr Wiederholung und mehr Übung in deinem Tempo",
    ],
    cta: "Full Access ansehen",
  },
  trust: {
    eyebrow: "Klar statt laut",
    title: "Was dieser Bot ist — und was nicht",
    description:
      "Dies ist kein offizieller ADR-Kurs und ersetzt keine Pflicht-Schulung. Die Prüfung selbst und deren Inhalte liegen bei IHK und zugelassenen Schulungsträgern. ADR Bot ist ein Hilfsmittel zur Vorbereitung — besonders für Menschen, deren erste Hürde die deutsche Sprache ist.",
    bullets: [
      "Kein offizieller Kurs",
      "Kein Ersatz für die Schulung",
      "Keine Garantie, sondern ehrliche Vorbereitungshilfe",
      "Gebaut für Lernen in Telegram, nicht für Bürokratie",
    ],
  },
  faq: {
    eyebrow: "Häufige Fragen",
    title: "Kurz und ehrlich beantwortet",
    description:
      "Die Seite soll Unsicherheit abbauen, nicht neue erzeugen.",
    items: [
      {
        question: "Ist das ein offizieller Kurs?",
        answer:
          "Nein. Das ist ein Hilfsmittel zur Vorbereitung. Die Pflicht-Schulung machst du weiterhin bei einem zugelassenen Träger.",
      },
      {
        question: "Passt es für den Basiskurs?",
        answer:
          "Ja. Der Basiskurs-Pfad enthält Fragen und Begriffe, die für jeden ADR-Fahrer relevant sind.",
      },
      {
        question: "Passt es für Tank?",
        answer:
          "Ja. Es gibt einen eigenen Tank-Pfad mit vertiefenden Fragen und Fachbegriffen.",
      },
      {
        question: "Was, wenn mein Deutsch schwach ist?",
        answer:
          "Genau dafür ist dieser Bot gebaut. Die Begriffe werden einfach erklärt — du musst nichts extra übersetzen.",
      },
      {
        question: "Was ist kostenlos?",
        answer:
          "Du kannst Beispielfragen und Begriffe sofort ausprobieren — ohne Konto und ohne Karte.",
      },
      {
        question: "Was passiert nach dem Klick?",
        answer:
          "Telegram öffnet sich. Du tippst /start und bekommst den ersten Schritt. Mehr nicht.",
      },
    ],
  },
  cta: {
    eyebrow: "Dein nächster Schritt",
    title: "Der erste Schritt dauert 10 Sekunden",
    description:
      "Öffne Telegram, tippe /start und sieh deine erste Frage oder deinen ersten Begriff. Kein Risiko, kein langer Prozess.",
    button: "In Telegram starten",
    note: "Du verlierst nichts, wenn du es einfach ausprobierst.",
  },
  footer: {
    description:
      "ADR Bot hilft dir, Fragen, Begriffe und typische Formulierungen ruhiger und klarer zu üben — direkt in Telegram.",
    link: "In Telegram öffnen",
    disclaimer:
      "ADR Bot unterstützt die Vorbereitung und ersetzt keine offizielle Schulung oder Zertifizierung.",
  },
  pilotNotice:
    "ADR Bot befindet sich aktuell in einer öffentlichen Testphase. Inhalte, Umfang und Full-Access-Angebot können sich noch weiterentwickeln.",
};

const en: LandingConversionCopy = {
  nav: {
    tagline: "ADR preparation in Telegram",
    openInTelegram: "Open in Telegram",
  },
  hero: {
    eyebrow: "ADR preparation in Telegram",
    title: "Does the ADR exam in German feel heavy? Start small.",
    description:
      "Questions, terminology, and short explanations for ADR preparation — clearly explained, directly inside Telegram. Built for Basiskurs, Tank, and learners blocked by language.",
    cta: "Start in Telegram",
    secondary: "How it works",
    microcopy: "Free. No sign-up. Takes 10 seconds.",
    note: "Telegram opens, then you simply tap /start and choose the path that fits you.",
  },
  pathSelection: {
    eyebrow: "Your starting point",
    title: "Choose your path",
    description:
      "You do not need to learn everything at once. Start where you are right now.",
    cards: [
      {
        title: "Basiskurs",
        text: "Understand the basics. Questions and terminology every ADR driver needs.",
      },
      {
        title: "Tank",
        text: "Focused on Tank topics. Deeper practice beyond the basics.",
      },
      {
        title: "Terminology",
        text: "German ADR terms explained simply. Best if language is the biggest hurdle.",
      },
    ],
  },
  proof: {
    eyebrow: "What the bot does",
    title: "What it looks like in Telegram",
    description:
      "One format for practice, one format for understanding. No wall of theory, just clear small steps.",
    cards: [
      {
        label: "/question",
        title: "Exam-style questions with explanation",
        text: "You answer a question and immediately see the explanation behind it.",
      },
      {
        label: "/word",
        title: "ADR terminology, explained simply",
        text: "Each term is explained so you can actually recognize it inside exam wording.",
      },
    ],
    screenshotCaption: "Real Telegram view from ADR Bot",
  },
  howItWorks: {
    eyebrow: "Three simple steps",
    title: "Your first ADR term is only seconds away",
    description:
      "No login, no email, no new learning platform. Just Telegram and one clear next step.",
    steps: [
      { title: "Open the bot", text: "Click the button and open Telegram." },
      {
        title: "Choose your path",
        text: "Pick Basiskurs, Tank, or Terminology and start right away.",
      },
      {
        title: "Practice questions and terms",
        text: "Short learning steps at your own pace — during breaks, on the road, or at night.",
      },
    ],
  },
  freeStart: {
    eyebrow: "Free start",
    title: "Start free — no account, no card",
    description:
      "You can test whether the bot fits you before making any bigger decision.",
    bullets: [
      "Instant access through Telegram",
      "Sample questions and terms right away",
      "No sign-up and no credit card",
      "You can stop at any time",
    ],
    cta: "Open Telegram for free",
  },
  fullAccess: {
    eyebrow: "When you want more depth",
    title: "Full Access for regular practice",
    description:
      "If you want more than a first look, Full Access opens the full practice area.",
    bullets: [
      "Full question library for Basiskurs and Tank",
      "All ADR terms with explanation",
      "More repetition and more practice at your own pace",
    ],
    cta: "See Full Access",
  },
  trust: {
    eyebrow: "Clear instead of loud",
    title: "What this bot is — and what it is not",
    description:
      "This is not an official ADR course and it does not replace mandatory training. The exam and its official content belong to the IHK and licensed providers. ADR Bot is a preparation aid — especially for people whose first barrier is the German language.",
    bullets: [
      "Not an official course",
      "Not a substitute for training",
      "No fake guarantees",
      "Built for practical learning inside Telegram",
    ],
  },
  faq: {
    eyebrow: "Common questions",
    title: "Short, honest answers",
    description: "The page should reduce uncertainty, not create more of it.",
    items: [
      {
        question: "Is this an official course?",
        answer:
          "No. It is a preparation aid. The mandatory training still happens with an approved provider.",
      },
      {
        question: "Does it fit Basiskurs?",
        answer:
          "Yes. The Basiskurs path focuses on the core questions and terms every ADR driver needs.",
      },
      {
        question: "Does it fit Tank?",
        answer:
          "Yes. There is a dedicated Tank path with more focused questions and terminology.",
      },
      {
        question: "What if my German is weak?",
        answer:
          "That is exactly why the bot exists. Terms are explained simply so you do not have to decode everything alone.",
      },
      {
        question: "What is free?",
        answer:
          "You can try sample questions and terminology right away — with no account and no card.",
      },
      {
        question: "What happens after the click?",
        answer:
          "Telegram opens. You type /start and see the first step. Nothing more complicated than that.",
      },
    ],
  },
  cta: {
    eyebrow: "Your next step",
    title: "The first step takes 10 seconds",
    description:
      "Open Telegram, type /start, and see your first question or term. No risk, no long setup.",
    button: "Start in Telegram",
    note: "You lose nothing by simply trying it.",
  },
  footer: {
    description:
      "ADR Bot helps you practice questions, terminology, and typical exam wording with more clarity — directly inside Telegram.",
    link: "Open in Telegram",
    disclaimer:
      "ADR Bot supports preparation and does not replace official training or certification.",
  },
  pilotNotice:
    "ADR Bot is currently in a public pilot phase. Content, scope, and the Full Access offer may still evolve.",
};

const ru: LandingConversionCopy = {
  nav: {
    tagline: "Подготовка к ADR в Telegram",
    openInTelegram: "Открыть в Telegram",
  },
  hero: {
    eyebrow: "Подготовка к ADR в Telegram",
    title: "Экзамен ADR на немецком кажется тяжёлым? Начни с малого.",
    description:
      "Вопросы, термины и короткие объяснения для подготовки к ADR — понятнее, прямо в Telegram. Для Basiskurs, Tank и тех, кому мешает язык.",
    cta: "Начать в Telegram",
    secondary: "Как это работает",
    microcopy: "Бесплатно. Без регистрации. Займёт 10 секунд.",
    note: "Откроется Telegram. Дальше просто нажми /start и выбери подходящий путь.",
  },
  pathSelection: {
    eyebrow: "Твой старт",
    title: "Выбери свой путь",
    description:
      "Не нужно учить всё сразу. Начни с того, где ты находишься сейчас.",
    cards: [
      {
        title: "Basiskurs",
        text: "Понять базу. Вопросы и термины, которые нужны каждому ADR-водителю.",
      },
      {
        title: "Tank",
        text: "Отдельно для Tank. Более глубокая практика сверх базового курса.",
      },
      {
        title: "Термины",
        text: "Немецкие Fachbegriffe простым языком. Лучший старт, если главный барьер — язык.",
      },
    ],
  },
  proof: {
    eyebrow: "Как бот помогает",
    title: "Вот как это выглядит в Telegram",
    description:
      "Один формат для тренировки, другой — для понимания. Не стена теории, а короткие понятные шаги.",
    cards: [
      {
        label: "/question",
        title: "Вопросы с объяснением",
        text: "Ты отвечаешь на вопрос и сразу видишь, что именно стоит за правильным ответом.",
      },
      {
        label: "/word",
        title: "Термины ADR, объяснённые просто",
        text: "Каждый термин объясняется так, чтобы ты реально узнавал его в формулировках экзамена.",
      },
    ],
    screenshotCaption: "Реальный вид ADR Bot в Telegram",
  },
  howItWorks: {
    eyebrow: "Три простых шага",
    title: "До первого термина — буквально несколько секунд",
    description:
      "Без логина, без почты, без новой учебной платформы. Только Telegram и понятный следующий шаг.",
    steps: [
      {
        title: "Открыть бота",
        text: "Нажать кнопку и открыть Telegram.",
      },
      {
        title: "Выбрать путь",
        text: "Выбрать Basiskurs, Tank или термины и сразу начать.",
      },
      {
        title: "Тренировать вопросы и слова",
        text: "Короткими шагами, в своём темпе — в дороге, на перерыве или вечером.",
      },
    ],
  },
  freeStart: {
    eyebrow: "Бесплатный старт",
    title: "Начни бесплатно — без аккаунта и без карты",
    description:
      "Можно сразу проверить, подходит ли тебе такой формат, ещё до любых решений про оплату.",
    bullets: [
      "Моментальный вход через Telegram",
      "Примеры вопросов и терминов сразу внутри бота",
      "Без регистрации и банковской карты",
      "Можно остановиться в любой момент",
    ],
    cta: "Открыть Telegram бесплатно",
  },
  fullAccess: {
    eyebrow: "Если хочешь идти глубже",
    title: "Full Access для системной практики",
    description:
      "Если тебе нужен не только первый взгляд, Full Access открывает полный учебный контур.",
    bullets: [
      "Полная база вопросов для Basiskurs и Tank",
      "Все термины ADR с объяснениями",
      "Больше повторения и больше практики в твоём темпе",
    ],
    cta: "Посмотреть Full Access",
  },
  trust: {
    eyebrow: "Честно и спокойно",
    title: "Что это за бот — и чем он не является",
    description:
      "Это не официальный курс ADR и не замена обязательной Schulung. За экзамен и официальные материалы отвечают IHK и допущенные учебные провайдеры. ADR Bot — это помощник для подготовки, особенно если главный барьер для тебя — немецкий язык.",
    bullets: [
      "Не официальный курс",
      "Не замена обязательного обучения",
      "Без фальшивых гарантий",
      "Сделан для практики в Telegram, а не для бюрократии",
    ],
  },
  faq: {
    eyebrow: "Частые вопросы",
    title: "Короткие и честные ответы",
    description: "Страница должна снимать тревогу, а не создавать новую.",
    items: [
      {
        question: "Это официальный курс?",
        answer:
          "Нет. Это помощник для подготовки. Обязательная Schulung всё равно проходит у официального провайдера.",
      },
      {
        question: "Подходит ли это для Basiskurs?",
        answer:
          "Да. В пути Basiskurs собраны базовые вопросы и термины, нужные каждому ADR-водителю.",
      },
      {
        question: "Подходит ли для Tank?",
        answer:
          "Да. Есть отдельный Tank-путь с более точечными вопросами и терминологией.",
      },
      {
        question: "Что если у меня слабый немецкий?",
        answer:
          "Именно для этого бот и сделан. Термины объясняются просто, чтобы тебе не приходилось всё расшифровывать в одиночку.",
      },
      {
        question: "Что бесплатно?",
        answer:
          "Ты можешь сразу попробовать примеры вопросов и терминов — без аккаунта и без карты.",
      },
      {
        question: "Что будет после клика?",
        answer:
          "Откроется Telegram. Ты нажмёшь /start и увидишь первый шаг. Ничего сложнее.",
      },
    ],
  },
  cta: {
    eyebrow: "Следующий шаг",
    title: "Первый шаг занимает 10 секунд",
    description:
      "Открой Telegram, нажми /start и посмотри первый вопрос или термин. Без риска и без длинного процесса.",
    button: "Начать в Telegram",
    note: "Ты ничего не теряешь, если просто попробуешь.",
  },
  footer: {
    description:
      "ADR Bot помогает спокойнее и понятнее тренировать вопросы, термины и типичные формулировки экзамена — прямо в Telegram.",
    link: "Открыть в Telegram",
    disclaimer:
      "ADR Bot помогает в подготовке и не заменяет официальное обучение или сертификацию.",
  },
  pilotNotice:
    "ADR Bot сейчас работает в публичной тестовой фазе. Контент, объём и предложение Full Access ещё могут меняться.",
};

const fallbackMap: Partial<Record<LangCode, LandingConversionCopy>> = {
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

export function getLandingConversionCopy(lang: LangCode): LandingConversionCopy {
  return fallbackMap[lang] ?? de;
}
