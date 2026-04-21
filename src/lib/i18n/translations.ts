export const SUPPORTED_LANGS = [
  "de", "en", "ru", "uk", "tr", "ar", "pl", "ro", "bg", "hr",
] as const;

export type LangCode = (typeof SUPPORTED_LANGS)[number];
export const DEFAULT_LANG: LangCode = "de";

export type Translation = {
  nav: { tagline: string; openInTelegram: string };
  hero: {
    eyebrow: string; title: string; description: string;
    ctaPrimary: string; ctaSecondary: string; note: string; offer?: string;
  };
  problems: {
    eyebrow: string; title: string; description: string;
    cards: { title: string; text: string }[];
  };
  howItWorks: {
    eyebrow: string; title: string; description: string;
    steps: { title: string; text: string }[];
  };
  benefits: {
    eyebrow: string; title: string; description: string;
    checklist: string[];
    cards: { title: string; text: string }[];
  };
  audience: {
    eyebrow: string; title: string; description: string;
    cards: { title: string; text: string }[];
  };
  trust: {
    eyebrow: string;
    title: string;
    description: string;
    bullets: string[];
  };
  cta: { eyebrow: string; title: string; description: string; button: string; note: string };
  footer: { description: string; link: string; disclaimer: string };
  carousel: { caption: string };
};

export const translations: Record<LangCode, Translation> = {
  // ── GERMAN (default) ────────────────────────────────────────────────────────
  de: {
    nav: {
      tagline: "ADR-Prüfungsvorbereitung per Telegram",
      openInTelegram: "In Telegram öffnen",
    },
    hero: {
      eyebrow: "ADR-Prüfungsvorbereitung per Telegram",
      title: "Bereite dich auf die ADR-Prüfung auf Deutsch vor – mit mehr Klarheit",
      description: "ADR Bot hilft Fahrern und Logistikfachleuten dabei, Fachbegriffe zu verstehen, echte Prüfungsformulierungen zu üben und sich Schritt für Schritt direkt in Telegram vorzubereiten.",
      ctaPrimary: "Jetzt in Telegram starten",
      ctaSecondary: "So funktioniert es",
      offer: "Kostenlos starten: Vokabeltrainer & 10 Fragen gratis. Vollzugriff ab 15 €/Monat.",
      note: "Keine Registrierung. Keine neue Plattform. Direkt in Telegram starten.",
    },
    problems: {
      eyebrow: "Warum die Vorbereitung schwerer fällt",
      title: "Die Sprache macht es schwerer als nötig",
      description: "Für viele ADR-Prüflinge ist die Prüfung selbst nicht die einzige Herausforderung. Es sind die formellen Formulierungen, die Fachbegriffe und die Unsicherheit, die sich im Vorfeld aufbaut.",
      cards: [
        { title: "Technisches Deutsch fühlt sich schwer an", text: "ADR-Terminologie ist schwer zu verinnerlichen, wenn die Wörter selbst fremd wirken." },
        { title: "Offizielle Formulierungen sind verwirrend", text: "Prüfungsfragen sind in förmlichem Deutsch verfasst, das komplizierter klingt als der dahinterstehende Gedanke." },
        { title: "Schwer zu wissen, wo man anfangen soll", text: "Ohne Struktur verwandelt sich die Vorbereitung in Überforderung, bevor man die Grundlagen überhaupt abgedeckt hat." },
        { title: "Reine Theorie bleibt nicht haften", text: "Lesen ist eine Sache. Prüfungsrelevantes Abrufen unter Druck ist eine andere." },
      ],
    },
    howItWorks: {
      eyebrow: "Einfacher Einstieg",
      title: "So funktioniert es",
      description: "Drei Schritte. Kein Aufwand. In unter einer Minute bereit.",
      steps: [
        { title: "Bot öffnen", text: "Direkt in Telegram starten. Keine Registrierung, keine neue Plattform, kein Onboarding-Aufwand." },
        { title: "Geführt üben", text: "Terminologie, Prüfungsformulierungen und wichtige Konzepte durch einen fokussierten Chat-basierten Ablauf erlernen." },
        { title: "Echtes Vertrauen aufbauen", text: "Regelmäßiges Üben macht die Sprache vertraut – damit die Prüfung weniger wie eine Überraschung wirkt." },
      ],
    },
    benefits: {
      eyebrow: "Warum dieses Format funktioniert",
      title: "Ein einfacherer Weg zur Vorbereitung – in einer App, die du bereits nutzt",
      description: "Statt dich allein durch dichtes Material zu arbeiten, bekommst du einen geführten Ablauf rund um die Terminologie und Prüfungsformulierungen, die wirklich zählen.",
      checklist: ["In einem vertrauten Format lernen", "Einem strukturierten Pfad folgen", "Auf das Wesentliche konzentrieren", "Schritt für Schritt Vertrautheit aufbauen"],
      cards: [
        { title: "Keine neuen Apps nötig", text: "Funktioniert in deinem bestehenden Telegram. Bot öffnen – und du kannst loslegen." },
        { title: "Jeden Begriff klar erklärt", text: "Jedes Konzept wird in verständlicher Sprache aufgeschlüsselt, mit einem praktischen Beispiel aus dem Prüfungskontext." },
        { title: "Alle ADR-Themenbereiche abgedeckt", text: "Strukturiert nach den Kategorien, die tatsächlich in der Zertifizierungsprüfung vorkommen." },
        { title: "Passt zwischen Schichten", text: "Sitzungen sind kurz genug für eine Pause, unterwegs oder abends." },
        { title: "Für Nicht-Muttersprachler entwickelt", text: "Speziell für Menschen entwickelt, die auf Deutsch als Zweit- oder Drittsprache arbeiten." },
        { title: "Wiederholung, die echtes Erinnern aufbaut", text: "Verteiltes Üben hilft dir, Terminologie dann zu erinnern, wenn es darauf ankommt." },
      ],
    },
    audience: {
      eyebrow: "Für wen es ist",
      title: "Für Berufstätige, die sich auf die ADR-Zertifizierung vorbereiten",
      description: "Wenn du einen verständlicheren und zugänglicheren Weg zur Vorbereitung brauchst, ist das genau für dich gemacht.",
      cards: [
        { title: "LKW-Fahrer", text: "Vorbereitung auf ADR-relevante Qualifikationen und praktische Prüfungsthemen." },
        { title: "Logistikfachleute", text: "Arbeiten rund um Transport, Gefahrguthandling und betriebliche Anforderungen." },
        { title: "ADR-Prüflinge", text: "Suchen mehr Struktur und Zuversicht vor dem Prüfungstermin." },
        { title: "Deutschlernende im Fachbereich", text: "Alle, die offizielle deutsche Formulierungen schwer aufnehmen und abrufen können." },
      ],
    },
    trust: {
      eyebrow: "Warum es vertrauenswürdig wirkt",
      title: "Klarheit statt Marketing-Lärm",
      description: "ADR Bot baut Vertrauen nicht durch erfundene Zahlen oder leere Versprechen auf. Es soll durch klare Struktur, verständliche Sprache und einen fokussierten Lernablauf überzeugen.",
      bullets: [
        "Praktisch statt laut",
        "Klar statt überladen",
        "Fokussiert statt generisch",
      ],
    },
    cta: {
      eyebrow: "Bereit anzufangen",
      title: "Beginne noch heute mit der Vorbereitung auf die ADR-Prüfung",
      description: "Wenn du einen strukturierteren und verständlicheren Weg zur ADR-Prüfungsvorbereitung auf Deutsch möchtest – ADR Bot ist der einfachste Einstieg.",
      button: "In Telegram starten",
      note: "Keine Registrierung. Bot öffnen und direkt vom Handy starten.",
    },
    footer: {
      description: "ADR Bot hilft dir, dich auf die ADR-Prüfung auf Deutsch vorzubereiten – durch ein strukturiertes, praxisorientiertes Lernerlebnis in Telegram.",
      link: "In Telegram öffnen",
      disclaimer: "ADR Bot unterstützt die Prüfungsvorbereitung und ersetzt nicht die offiziellen Zertifizierungsanforderungen.",
    },
    carousel: { caption: "Echte Fragen aus ADR Bot – so wie sie in Telegram erscheinen" },
  },

  // ── ENGLISH ─────────────────────────────────────────────────────────────────
  en: {
    nav: {
      tagline: "Telegram-based ADR preparation",
      openInTelegram: "Open in Telegram",
    },
    hero: {
      eyebrow: "Telegram-based ADR preparation",
      title: "Prepare for the ADR exam in German with less confusion",
      description: "ADR Bot helps drivers and logistics professionals break down terminology, practice real exam wording, and prepare step by step — directly inside Telegram.",
      ctaPrimary: "Start in Telegram now",
      ctaSecondary: "How it works",
      offer: "Start free: vocabulary trainer and 10 questions included. Full access from €15/month.",
      note: "No sign-up. No new platform. Start directly in Telegram.",
    },
    problems: {
      eyebrow: "Why preparation feels harder",
      title: "The language makes it harder than it needs to be",
      description: "For many ADR candidates, the exam itself is not the only challenge. It is the formal wording, the technical vocabulary, and the uncertainty that builds up along the way.",
      cards: [
        { title: "Technical German feels heavy", text: "ADR terminology is hard to absorb when the words themselves feel foreign." },
        { title: "Official wording is confusing", text: "Exam questions are written in formal German that sounds more complex than the idea behind it." },
        { title: "Hard to know where to start", text: "Without structure, preparation turns into overload before you have even covered the basics." },
        { title: "Theory alone does not stick", text: "Reading is one thing. Building recall under exam pressure is something else entirely." },
      ],
    },
    howItWorks: {
      eyebrow: "Simple onboarding",
      title: "How it works",
      description: "Three steps. No friction. You are ready to start in under a minute.",
      steps: [
        { title: "Open the bot", text: "Start directly in Telegram. No sign-up, no new platform, no onboarding friction." },
        { title: "Work through guided practice", text: "Learn terminology, exam wording, and key concepts through a focused, chat-based flow." },
        { title: "Build real confidence", text: "Regular practice makes the language familiar — so the exam feels less like a surprise." },
      ],
    },
    benefits: {
      eyebrow: "Why this format works",
      title: "A simpler way to prepare, inside an app you already use",
      description: "Instead of working through dense material alone, you get a guided flow built around the terminology and exam wording that actually matters.",
      checklist: ["Learn in a format you already know", "Follow a structured path", "Focus on what is useful, not everything", "Build familiarity step by step"],
      cards: [
        { title: "No new apps needed", text: "Works inside your existing Telegram. Open the bot and you are ready to start." },
        { title: "Every term explained plainly", text: "Each concept is broken down in plain language with a practical example from the exam context." },
        { title: "Covers all main ADR topic areas", text: "Structured around the categories that actually appear in the certification exam." },
        { title: "Fits between shifts", text: "Sessions are short enough to use during a break, on the road, or in the evening." },
        { title: "Built for non-native German speakers", text: "Designed specifically for people working in German as a second or third language." },
        { title: "Repetition that builds real recall", text: "Spaced practice helps you remember terminology when it matters — not just while you study." },
      ],
    },
    audience: {
      eyebrow: "Who it is for",
      title: "Built for working professionals preparing for ADR certification",
      description: "If you need a more understandable and accessible way to prepare, this is made for you.",
      cards: [
        { title: "Truck drivers", text: "Preparing for ADR-related qualification and practical exam topics." },
        { title: "Logistics professionals", text: "Working around transport, dangerous goods handling, and operational requirements." },
        { title: "ADR exam candidates", text: "Looking for more structure and confidence before the test date." },
        { title: "Technical German learners", text: "Anyone who finds official German wording difficult to absorb and recall." },
      ],
    },
    trust: {
      eyebrow: "Why it feels trustworthy",
      title: "Clarity over marketing noise",
      description: "ADR Bot does not need invented numbers or generic promises to feel credible. The trust comes from focused structure, understandable language, and a learning flow that stays practical.",
      bullets: [
        "Practical over noisy",
        "Clear over overloaded",
        "Focused over generic",
      ],
    },
    cta: {
      eyebrow: "Ready to begin",
      title: "Start preparing for the ADR exam today",
      description: "If you want a more structured, understandable way to prepare for the ADR exam in German — ADR Bot is the simplest place to start.",
      button: "Start in Telegram",
      note: "No sign-up. Open the bot and begin directly from your phone.",
    },
    footer: {
      description: "ADR Bot helps you prepare for the ADR exam in German through a structured, practical Telegram-based learning experience.",
      link: "Open in Telegram",
      disclaimer: "ADR Bot supports exam preparation and does not replace official certification requirements.",
    },
    carousel: { caption: "Real questions from ADR Bot — as they appear in Telegram" },
  },

  // ── RUSSIAN ──────────────────────────────────────────────────────────────────
  ru: {
    nav: {
      tagline: "Подготовка к ADR через Telegram",
      openInTelegram: "Открыть в Telegram",
    },
    hero: {
      eyebrow: "Подготовка к ADR через Telegram",
      title: "Готовьтесь к экзамену ADR на немецком с меньшей путаницей",
      description: "ADR Bot помогает водителям и специалистам по логистике разобраться в терминологии, отрабатывать реальные формулировки экзамена и готовиться шаг за шагом — прямо в Telegram.",
      ctaPrimary: "Начать в Telegram",
      ctaSecondary: "Как это работает",
      note: "Без регистрации. Без новых приложений. Начни прямо в Telegram.",
    },
    problems: {
      eyebrow: "Почему подготовка даётся тяжелее",
      title: "Язык усложняет всё сильнее, чем должен",
      description: "Для многих кандидатов ADR сам экзамен — не единственная трудность. Это формальные формулировки, техническая лексика и неопределённость, которая накапливается по пути.",
      cards: [
        { title: "Технический немецкий ощущается тяжёлым", text: "Терминологию ADR сложно усвоить, когда сами слова кажутся чужими." },
        { title: "Официальные формулировки вводят в замешательство", text: "Вопросы экзамена написаны на официальном немецком, который звучит сложнее, чем идея за ним." },
        { title: "Непонятно, с чего начать", text: "Без структуры подготовка превращается в перегрузку ещё до того, как охвачены основы." },
        { title: "Одна только теория не запоминается", text: "Читать — одно. Воспроизводить под давлением экзамена — совсем другое." },
      ],
    },
    howItWorks: {
      eyebrow: "Простое начало",
      title: "Как это работает",
      description: "Три шага. Без лишних усилий. Готов начать за минуту.",
      steps: [
        { title: "Открыть бота", text: "Начать прямо в Telegram. Никакой регистрации, новой платформы или сложного онбординга." },
        { title: "Работать с практикой", text: "Изучать терминологию, формулировки экзамена и ключевые концепции через чат-поток." },
        { title: "Обрести уверенность", text: "Регулярная практика делает язык знакомым — и экзамен перестаёт ощущаться сюрпризом." },
      ],
    },
    benefits: {
      eyebrow: "Почему этот формат работает",
      title: "Более простой способ подготовиться в приложении, которое ты уже используешь",
      description: "Вместо того чтобы в одиночку разбираться с плотным материалом, ты получаешь структурированный поток вокруг терминологии и формулировок, которые действительно важны.",
      checklist: ["Учиться в знакомом формате", "Следовать структурированному пути", "Сосредоточиться на полезном, а не на всём", "Выстраивать знания шаг за шагом"],
      cards: [
        { title: "Никаких новых приложений", text: "Работает в твоём Telegram. Открой бота — и ты готов начать." },
        { title: "Каждый термин объяснён просто", text: "Каждая концепция разбирается понятным языком с практическим примером из контекста экзамена." },
        { title: "Все темы ADR охвачены", text: "Структурировано по категориям, которые реально встречаются на сертификационном экзамене." },
        { title: "Подходит между сменами", text: "Сессии достаточно короткие для перерыва, в дороге или вечером." },
        { title: "Для тех, кто говорит на немецком не как на родном", text: "Разработано специально для людей, работающих на немецком как на втором или третьем языке." },
        { title: "Повторение, которое строит настоящую память", text: "Интервальная практика помогает запоминать терминологию тогда, когда это важно." },
      ],
    },
    audience: {
      eyebrow: "Для кого это",
      title: "Создано для работающих специалистов, готовящихся к сертификации ADR",
      description: "Если тебе нужен более понятный и доступный способ подготовиться — это сделано для тебя.",
      cards: [
        { title: "Водители грузовиков", text: "Подготовка к квалификации и практическим темам экзамена ADR." },
        { title: "Специалисты по логистике", text: "Работа с перевозками, опасными грузами и операционными требованиями." },
        { title: "Кандидаты на экзамен ADR", text: "Ищут больше структуры и уверенности перед датой экзамена." },
        { title: "Изучающие технический немецкий", text: "Все, кому официальные немецкие формулировки сложно воспринимать и воспроизводить." },
      ],
    },
    trust: {
      eyebrow: "Почему это вызывает доверие",
      title: "Ясность вместо маркетингового шума",
      description: "ADR Bot не опирается на придуманные цифры или искусственные отзывы. Доверие здесь строится через понятную структуру, спокойную подачу и практичный учебный формат.",
      bullets: [
        "Практично, а не шумно",
        "Понятно, а не перегружено",
        "Сфокусировано, а не расплывчато",
      ],
    },
    cta: {
      eyebrow: "Готов начать",
      title: "Начни готовиться к экзамену ADR сегодня",
      description: "Если ты хочешь более структурированный и понятный способ подготовиться к экзамену ADR на немецком — ADR Bot — это самый простой старт.",
      button: "Начать в Telegram",
      note: "Без регистрации. Открой бота и начни прямо с телефона.",
    },
    footer: {
      description: "ADR Bot помогает готовиться к экзамену ADR на немецком через структурированный практичный опыт обучения в Telegram.",
      link: "Открыть в Telegram",
      disclaimer: "ADR Bot поддерживает подготовку к экзамену и не заменяет официальные требования к сертификации.",
    },
    carousel: { caption: "Реальные вопросы из ADR Bot — так, как они выглядят в Telegram" },
  },

  // ── UKRAINIAN ────────────────────────────────────────────────────────────────
  uk: {
    nav: {
      tagline: "Підготовка до ADR через Telegram",
      openInTelegram: "Відкрити в Telegram",
    },
    hero: {
      eyebrow: "Підготовка до ADR через Telegram",
      title: "Готуйтесь до іспиту ADR німецькою з меншою плутаниною",
      description: "ADR Bot допомагає водіям і фахівцям з логістики розбиратися в термінології, відпрацьовувати реальні формулювання іспиту та готуватися крок за кроком — прямо в Telegram.",
      ctaPrimary: "Почати в Telegram",
      ctaSecondary: "Як це працює",
      note: "Без реєстрації. Без нових платформ. Починай прямо в Telegram.",
    },
    problems: {
      eyebrow: "Чому підготовка здається важчою",
      title: "Мова ускладнює все більше, ніж потрібно",
      description: "Для багатьох кандидатів ADR сам іспит — не єдина проблема. Це офіційні формулювання, технічна лексика та невизначеність, що накопичується по дорозі.",
      cards: [
        { title: "Технічна німецька відчувається важкою", text: "Термінологію ADR важко засвоїти, коли самі слова здаються чужими." },
        { title: "Офіційні формулювання заплутують", text: "Питання іспиту написані офіційною німецькою, яка звучить складніше, ніж ідея за нею." },
        { title: "Важко зрозуміти, з чого почати", text: "Без структури підготовка перетворюється на перевантаження ще до того, як охоплені основи." },
        { title: "Одна теорія не запам'ятовується", text: "Читати — одне. Відтворювати під тиском іспиту — зовсім інше." },
      ],
    },
    howItWorks: {
      eyebrow: "Простий початок",
      title: "Як це працює",
      description: "Три кроки. Без зайвих зусиль. Готовий почати за хвилину.",
      steps: [
        { title: "Відкрити бота", text: "Почати прямо в Telegram. Без реєстрації, нової платформи або складного онбордингу." },
        { title: "Працювати з практикою", text: "Вивчати термінологію, формулювання іспиту та ключові концепції через чат-потік." },
        { title: "Збудувати впевненість", text: "Регулярна практика робить мову знайомою — і іспит перестає відчуватися сюрпризом." },
      ],
    },
    benefits: {
      eyebrow: "Чому цей формат працює",
      title: "Простіший спосіб підготуватися у додатку, який ти вже використовуєш",
      description: "Замість того щоб самотужки розбиратися з щільним матеріалом, ти отримуєш структурований потік навколо термінології та формулювань, які дійсно важливі.",
      checklist: ["Вчитися у знайомому форматі", "Йти структурованим шляхом", "Зосередитися на корисному, а не на всьому", "Будувати знання крок за кроком"],
      cards: [
        { title: "Жодних нових додатків", text: "Працює у твоєму Telegram. Відкрий бота — і ти готовий починати." },
        { title: "Кожен термін пояснено просто", text: "Кожна концепція розбирається зрозумілою мовою з практичним прикладом з контексту іспиту." },
        { title: "Усі теми ADR охоплено", text: "Структуровано за категоріями, що реально зустрічаються на сертифікаційному іспиті." },
        { title: "Підходить між змінами", text: "Сесії достатньо короткі для перерви, в дорозі або ввечері." },
        { title: "Для тих, хто говорить німецькою не як рідною", text: "Розроблено спеціально для людей, що працюють німецькою як другою або третьою мовою." },
        { title: "Повторення, що будує справжню пам'ять", text: "Інтервальна практика допомагає запам'ятовувати термінологію тоді, коли це важливо." },
      ],
    },
    audience: {
      eyebrow: "Для кого це",
      title: "Створено для фахівців, що готуються до сертифікації ADR",
      description: "Якщо тобі потрібен зрозуміліший та доступніший спосіб підготуватися — це зроблено для тебе.",
      cards: [
        { title: "Водії вантажівок", text: "Підготовка до кваліфікації та практичних тем іспиту ADR." },
        { title: "Фахівці з логістики", text: "Робота з перевезеннями, небезпечними вантажами та операційними вимогами." },
        { title: "Кандидати на іспит ADR", text: "Шукають більше структури та впевненості перед датою іспиту." },
        { title: "Ті, хто вчить технічну німецьку", text: "Усі, кому офіційні німецькі формулювання важко сприймати та відтворювати." },
      ],
    },
    trust: {
      eyebrow: "Чому це викликає довіру",
      title: "Ясність замість маркетингового шуму",
      description: "ADR Bot не потребує вигаданих цифр чи штучних відгуків. Довіра тут будується через зрозумілу структуру, спокійну подачу та практичний формат навчання.",
      bullets: [
        "Практично, а не шумно",
        "Зрозуміло, а не перевантажено",
        "Сфокусовано, а не розмито",
      ],
    },
    cta: {
      eyebrow: "Готовий почати",
      title: "Почни готуватися до іспиту ADR вже сьогодні",
      description: "Якщо ти хочеш більш структурований та зрозумілий спосіб підготуватися до іспиту ADR німецькою — ADR Bot — це найпростіший старт.",
      button: "Почати в Telegram",
      note: "Без реєстрації. Відкрий бота і починай прямо з телефону.",
    },
    footer: {
      description: "ADR Bot допомагає готуватися до іспиту ADR німецькою через структурований практичний досвід навчання в Telegram.",
      link: "Відкрити в Telegram",
      disclaimer: "ADR Bot підтримує підготовку до іспиту і не замінює офіційні вимоги до сертифікації.",
    },
    carousel: { caption: "Реальні запитання з ADR Bot — так, як вони виглядають у Telegram" },
  },

  // ── TURKISH ──────────────────────────────────────────────────────────────────
  tr: {
    nav: {
      tagline: "Telegram üzerinden ADR hazırlığı",
      openInTelegram: "Telegram'da aç",
    },
    hero: {
      eyebrow: "Telegram üzerinden ADR hazırlığı",
      title: "ADR sınavına Almanca hazırlanın — daha az karmaşayla",
      description: "ADR Bot, sürücülere ve lojistik uzmanlarına teknik terimleri anlamada, gerçek sınav ifadelerini pratik etmede ve Telegram üzerinden adım adım hazırlanmada yardımcı olur.",
      ctaPrimary: "Telegram'da başla",
      ctaSecondary: "Nasıl çalışır",
      note: "Kayıt yok. Yeni platform yok. Doğrudan Telegram'da başla.",
    },
    problems: {
      eyebrow: "Hazırlık neden daha zor hissettiriyor",
      title: "Dil, gerekenden daha zor hale getiriyor",
      description: "Pek çok ADR adayı için sınav tek zorluk değil. Resmi ifadeler, teknik kelimeler ve yol boyunca biriken belirsizlik de büyük bir zorluk.",
      cards: [
        { title: "Teknik Almanca ağır hissettiriyor", text: "ADR terimleri, kelimelerin kendisi yabancı geldiğinde özümseması güç oluyor." },
        { title: "Resmi ifadeler kafa karıştırıcı", text: "Sınav soruları, arkasındaki fikirden daha karmaşık görünen resmi Almanca ile yazılmış." },
        { title: "Nereden başlayacağını bilmek zor", text: "Yapı olmadan hazırlık, temeller bile tamamlanmadan bunaltıcıya dönüşüyor." },
        { title: "Sadece teorik bilgi kalıcı olmuyor", text: "Okumak bir şey. Sınav baskısı altında hatırlamak bambaşka bir şey." },
      ],
    },
    howItWorks: {
      eyebrow: "Kolay başlangıç",
      title: "Nasıl çalışır",
      description: "Üç adım. Engel yok. Bir dakikadan az sürede hazırsın.",
      steps: [
        { title: "Botu aç", text: "Doğrudan Telegram'da başla. Kayıt yok, yeni platform yok, karmaşık kurulum yok." },
        { title: "Rehberli pratik yap", text: "Odaklı sohbet akışı üzerinden terminoloji, sınav ifadeleri ve temel kavramları öğren." },
        { title: "Gerçek güven kazan", text: "Düzenli pratik dili tanıdık hale getirir — sınav artık bir sürpriz gibi hissettirmez." },
      ],
    },
    benefits: {
      eyebrow: "Bu format neden işe yarıyor",
      title: "Zaten kullandığın bir uygulamada daha kolay hazırlık",
      description: "Yoğun materyali tek başına çözmeye çalışmak yerine, gerçekten önemli olan terminoloji ve sınav ifadeleri etrafında oluşturulmuş rehberli bir akış alırsın.",
      checklist: ["Zaten bildiğin bir formatta öğren", "Yapılandırılmış bir yol izle", "Her şeyi değil, işe yarayanı öğren", "Adım adım alışkanlık kazan"],
      cards: [
        { title: "Yeni uygulama gerekmez", text: "Mevcut Telegram'ında çalışır. Botu aç — başlamaya hazırsın." },
        { title: "Her terim açıkça anlatılır", text: "Her kavram, sınav bağlamından pratik örneklerle sade bir dille açıklanır." },
        { title: "Tüm ADR konu alanlarını kapsar", text: "Sertifika sınavında gerçekten çıkan kategoriler etrafında yapılandırılmıştır." },
        { title: "Vardiyalar arasına sığar", text: "Oturumlar mola, yolda veya akşam kullanılacak kadar kısa." },
        { title: "Anadili Almanca olmayanlar için tasarlandı", text: "Almancayı ikinci veya üçüncü dil olarak kullanan kişiler için özel olarak geliştirildi." },
        { title: "Gerçek hafızayı pekiştiren tekrar", text: "Aralıklı pratik, terminolojiyi gerçekten gerektiğinde hatırlamanı sağlar." },
      ],
    },
    audience: {
      eyebrow: "Kimler için",
      title: "ADR sertifikasyonuna hazırlanan çalışan profesyoneller için",
      description: "Daha anlaşılır ve erişilebilir bir hazırlık yoluna ihtiyaç duyuyorsan, bu tam sana göre.",
      cards: [
        { title: "Kamyon sürücüleri", text: "ADR ile ilgili sertifikasyon ve pratik sınav konularına hazırlanıyor." },
        { title: "Lojistik uzmanları", text: "Taşımacılık, tehlikeli madde işleme ve operasyonel gerekliliklerle çalışıyor." },
        { title: "ADR sınavı adayları", text: "Sınav tarihinden önce daha fazla yapı ve güven arıyor." },
        { title: "Teknik Almanca öğrenenler", text: "Resmi Almanca ifadeleri anlamakta ve hatırlamakta güçlük çeken herkes." },
      ],
    },
    trust: {
      eyebrow: "Neden güven veriyor",
      title: "Pazarlama gürültüsü yerine netlik",
      description: "ADR Bot, güven oluşturmak için uydurma rakamlara veya yapay yorumlara ihtiyaç duymaz. Güven; net yapı, anlaşılır dil ve pratik bir öğrenme akışından gelir.",
      bullets: [
        "Gürültülü değil, pratik",
        "Karmaşık değil, açık",
        "Genel değil, odaklı",
      ],
    },
    cta: {
      eyebrow: "Başlamaya hazır",
      title: "ADR sınavına hazırlanmaya bugün başla",
      description: "Almanca ADR sınavına daha yapılandırılmış ve anlaşılır bir şekilde hazırlanmak istiyorsan — ADR Bot başlamak için en kolay yer.",
      button: "Telegram'da başla",
      note: "Kayıt yok. Botu aç ve doğrudan telefonundan başla.",
    },
    footer: {
      description: "ADR Bot, Telegram tabanlı yapılandırılmış ve pratik bir öğrenme deneyimiyle ADR sınavına Almanca hazırlanmanı sağlar.",
      link: "Telegram'da aç",
      disclaimer: "ADR Bot sınav hazırlığını destekler ve resmi sertifikasyon gerekliliklerinin yerini almaz.",
    },
    carousel: { caption: "ADR Bot'tan gerçek sorular — Telegram'da göründükleri gibi" },
  },

  // ── ARABIC (RTL) ─────────────────────────────────────────────────────────────
  ar: {
    nav: {
      tagline: "التحضير لـ ADR عبر تيليغرام",
      openInTelegram: "فتح في تيليغرام",
    },
    hero: {
      eyebrow: "التحضير لـ ADR عبر تيليغرام",
      title: "استعد لامتحان ADR باللغة الألمانية بأقل ارتباك",
      description: "يساعد ADR Bot السائقين ومتخصصي اللوجستيك على فهم المصطلحات وممارسة صياغات الامتحان الحقيقية والتحضير خطوة بخطوة — مباشرةً عبر تيليغرام.",
      ctaPrimary: "ابدأ في تيليغرام",
      ctaSecondary: "كيف يعمل",
      note: "لا تسجيل. لا منصة جديدة. ابدأ مباشرةً في تيليغرام.",
    },
    problems: {
      eyebrow: "لماذا يبدو التحضير أصعب",
      title: "اللغة تجعلها أصعب مما ينبغي",
      description: "بالنسبة لكثير من المتقدمين لامتحان ADR، الامتحان نفسه ليس التحدي الوحيد. الصياغات الرسمية والمصطلحات التقنية والغموض المتراكم على طول الطريق.",
      cards: [
        { title: "الألمانية التقنية تبدو ثقيلة", text: "من الصعب استيعاب مصطلحات ADR عندما تبدو الكلمات نفسها غريبة." },
        { title: "الصياغات الرسمية مربكة", text: "أسئلة الامتحان مكتوبة بألمانية رسمية تبدو أكثر تعقيداً من الفكرة الكامنة وراءها." },
        { title: "من الصعب معرفة من أين تبدأ", text: "بدون هيكل، يتحول التحضير إلى إرهاق قبل أن تتمكن من تغطية الأساسيات." },
        { title: "النظرية وحدها لا تثبت في الذاكرة", text: "القراءة شيء. بناء القدرة على الاسترجاع تحت ضغط الامتحان شيء آخر تماماً." },
      ],
    },
    howItWorks: {
      eyebrow: "بداية بسيطة",
      title: "كيف يعمل",
      description: "ثلاث خطوات. لا عقبات. ستكون جاهزاً في أقل من دقيقة.",
      steps: [
        { title: "افتح البوت", text: "ابدأ مباشرةً في تيليغرام. لا تسجيل، لا منصة جديدة، لا إجراءات معقدة." },
        { title: "اعمل على التدريب الموجَّه", text: "تعلَّم المصطلحات وصياغات الامتحان والمفاهيم الأساسية من خلال تدفق محادثة مركَّز." },
        { title: "ابنِ ثقة حقيقية", text: "الممارسة المنتظمة تجعل اللغة مألوفة — حتى لا يبدو الامتحان مفاجأة." },
      ],
    },
    benefits: {
      eyebrow: "لماذا يعمل هذا التنسيق",
      title: "طريقة أبسط للتحضير، داخل تطبيق تستخدمه بالفعل",
      description: "بدلاً من العمل وحدك عبر مواد كثيفة، تحصل على تدفق موجَّه حول المصطلحات وصياغات الامتحان التي تهم فعلاً.",
      checklist: ["تعلَّم بتنسيق تعرفه بالفعل", "اتبع مساراً منظماً", "ركِّز على المفيد لا على كل شيء", "ابنِ الإلمام خطوة بخطوة"],
      cards: [
        { title: "لا حاجة لتطبيقات جديدة", text: "يعمل داخل تيليغرام الذي لديك. افتح البوت وستكون جاهزاً للبدء." },
        { title: "كل مصطلح موضَّح ببساطة", text: "يُشرح كل مفهوم بلغة سهلة مع مثال عملي من سياق الامتحان." },
        { title: "يغطي جميع مجالات ADR الرئيسية", text: "منظَّم حول الفئات التي تظهر فعلاً في امتحان الشهادة." },
        { title: "يناسب الوقت بين الورديات", text: "الجلسات قصيرة كفاية للاستخدام خلال استراحة أو في الطريق أو في المساء." },
        { title: "مصمَّم لغير الناطقين بالألمانية", text: "مصمَّم خصيصاً للأشخاص الذين يعملون بالألمانية كلغة ثانية أو ثالثة." },
        { title: "تكرار يبني ذاكرة حقيقية", text: "يساعدك التدريب المتباعد على تذكر المصطلحات عندما يهم الأمر." },
      ],
    },
    audience: {
      eyebrow: "لمن هذا",
      title: "مصمَّم للمهنيين العاملين الذين يستعدون لشهادة ADR",
      description: "إذا كنت بحاجة إلى طريقة أكثر وضوحاً وسهولة للتحضير، فهذا مصنوع من أجلك.",
      cards: [
        { title: "سائقو الشاحنات", text: "التحضير للتأهيل المرتبط بـ ADR ومواضيع الامتحان العملية." },
        { title: "متخصصو اللوجستيك", text: "العمل في مجال النقل والمواد الخطرة والمتطلبات التشغيلية." },
        { title: "المتقدمون لامتحان ADR", text: "يبحثون عن مزيد من الهيكل والثقة قبل موعد الاختبار." },
        { title: "متعلمو الألمانية التقنية", text: "كل من يجد صعوبة في استيعاب الصياغات الألمانية الرسمية وتذكرها." },
      ],
    },
    trust: {
      eyebrow: "لماذا يبدو موثوقاً",
      title: "الوضوح بدلاً من الضجيج التسويقي",
      description: "لا يحتاج ADR Bot إلى أرقام مختلقة أو شهادات مصطنعة ليبدو موثوقاً. الثقة هنا تأتي من هيكل واضح، ولغة مفهومة، ومسار تعلم عملي.",
      bullets: [
        "عملي لا صاخب",
        "واضح لا مُرهِق",
        "مركّز لا عام",
      ],
    },
    cta: {
      eyebrow: "جاهز للبدء",
      title: "ابدأ التحضير لامتحان ADR اليوم",
      description: "إذا كنت تريد طريقة أكثر منهجية ووضوحاً للتحضير لامتحان ADR باللغة الألمانية — ADR Bot هو أبسط مكان للبدء.",
      button: "ابدأ في تيليغرام",
      note: "لا تسجيل. افتح البوت وابدأ مباشرةً من هاتفك.",
    },
    footer: {
      description: "يساعدك ADR Bot على التحضير لامتحان ADR باللغة الألمانية من خلال تجربة تعلُّم منظمة وعملية عبر تيليغرام.",
      link: "فتح في تيليغرام",
      disclaimer: "يدعم ADR Bot التحضير للامتحان ولا يحل محل متطلبات الشهادة الرسمية.",
    },
    carousel: { caption: "أسئلة حقيقية من ADR Bot — كما تظهر في تيليغرام" },
  },

  // ── POLISH ───────────────────────────────────────────────────────────────────
  pl: {
    nav: {
      tagline: "Przygotowanie do ADR przez Telegram",
      openInTelegram: "Otwórz w Telegramie",
    },
    hero: {
      eyebrow: "Przygotowanie do ADR przez Telegram",
      title: "Przygotuj się do egzaminu ADR po niemiecku z mniejszym zamieszaniem",
      description: "ADR Bot pomaga kierowcom i specjalistom ds. logistyki zrozumieć terminologię, ćwiczyć rzeczywiste sformułowania egzaminacyjne i przygotowywać się krok po kroku — bezpośrednio w Telegramie.",
      ctaPrimary: "Zacznij w Telegramie",
      ctaSecondary: "Jak to działa",
      note: "Bez rejestracji. Bez nowych platform. Zacznij bezpośrednio w Telegramie.",
    },
    problems: {
      eyebrow: "Dlaczego przygotowanie wydaje się trudniejsze",
      title: "Język sprawia, że jest trudniej, niż powinno być",
      description: "Dla wielu kandydatów ADR sam egzamin nie jest jedynym wyzwaniem. To formalne sformułowania, słownictwo techniczne i niepewność narastające po drodze.",
      cards: [
        { title: "Techniczny język niemiecki wydaje się ciężki", text: "Terminologia ADR jest trudna do przyswojenia, gdy same słowa brzmią obco." },
        { title: "Oficjalne sformułowania są mylące", text: "Pytania egzaminacyjne pisane są formalnym językiem niemieckim, który brzmi bardziej skomplikowanie." },
        { title: "Trudno wiedzieć, od czego zacząć", text: "Bez struktury przygotowanie przeradza się w przeciążenie, zanim zostaną omówione podstawy." },
        { title: "Sama teoria nie zostaje w głowie", text: "Czytanie to jedno. Odtwarzanie pod presją egzaminu to coś zupełnie innego." },
      ],
    },
    howItWorks: {
      eyebrow: "Prosty start",
      title: "Jak to działa",
      description: "Trzy kroki. Bez przeszkód. Gotowy do startu w mniej niż minutę.",
      steps: [
        { title: "Otwórz bota", text: "Zacznij bezpośrednio w Telegramie. Bez rejestracji, nowej platformy ani skomplikowanego wdrożenia." },
        { title: "Pracuj z praktycznymi ćwiczeniami", text: "Ucz się terminologii, sformułowań egzaminacyjnych i kluczowych pojęć przez skupiony przepływ czatu." },
        { title: "Buduj prawdziwą pewność siebie", text: "Regularna praktyka sprawia, że język staje się znajomy — egzamin przestaje być niespodzianką." },
      ],
    },
    benefits: {
      eyebrow: "Dlaczego ten format działa",
      title: "Prostszy sposób przygotowania w aplikacji, z której już korzystasz",
      description: "Zamiast samodzielnie przebijać się przez gęsty materiał, otrzymujesz ukierunkowany przepływ oparty na terminologii i sformułowaniach, które naprawdę mają znaczenie.",
      checklist: ["Ucz się w formacie, który już znasz", "Podążaj ustrukturyzowaną ścieżką", "Skup się na tym, co przydatne, nie na wszystkim", "Buduj znajomość krok po kroku"],
      cards: [
        { title: "Żadnych nowych aplikacji", text: "Działa w Twoim obecnym Telegramie. Otwórz bota — i jesteś gotowy do startu." },
        { title: "Każdy termin wyjaśniony prosto", text: "Każde pojęcie jest rozłożone prostym językiem z praktycznym przykładem z kontekstu egzaminu." },
        { title: "Obejmuje wszystkie główne tematy ADR", text: "Ustrukturyzowane wokół kategorii, które faktycznie pojawiają się na egzaminie certyfikacyjnym." },
        { title: "Mieści się między zmianami", text: "Sesje są na tyle krótkie, by korzystać z nich podczas przerwy, w drodze lub wieczorem." },
        { title: "Stworzony dla nienatywnych użytkowników języka niemieckiego", text: "Zaprojektowany specjalnie dla osób pracujących w języku niemieckim jako drugim lub trzecim." },
        { title: "Powtarzanie budujące prawdziwą pamięć", text: "Powtarzanie w odpowiednich odstępach czasu pomaga zapamiętać terminologię wtedy, gdy to ważne." },
      ],
    },
    audience: {
      eyebrow: "Dla kogo",
      title: "Stworzony dla pracujących specjalistów przygotowujących się do certyfikacji ADR",
      description: "Jeśli potrzebujesz bardziej zrozumiałego i dostępnego sposobu przygotowania — to jest właśnie dla Ciebie.",
      cards: [
        { title: "Kierowcy ciężarówek", text: "Przygotowanie do kwalifikacji związanych z ADR i praktycznych tematów egzaminacyjnych." },
        { title: "Specjaliści ds. logistyki", text: "Praca z transportem, obsługą towarów niebezpiecznych i wymaganiami operacyjnymi." },
        { title: "Kandydaci do egzaminu ADR", text: "Szukają większej struktury i pewności siebie przed datą egzaminu." },
        { title: "Uczący się technicznego języka niemieckiego", text: "Wszystkie osoby, które mają trudności z przyswojeniem oficjalnych sformułowań po niemiecku." },
      ],
    },
    trust: {
      eyebrow: "Dlaczego to budzi zaufanie",
      title: "Jasność zamiast marketingowego szumu",
      description: "ADR Bot nie opiera wiarygodności na wymyślonych liczbach ani sztucznych opiniach. Zaufanie buduje tu klarowna struktura, spokojny język i praktyczny sposób nauki.",
      bullets: [
        "Praktyczne, nie hałaśliwe",
        "Jasne, nie przeładowane",
        "Skupione, nie ogólne",
      ],
    },
    cta: {
      eyebrow: "Gotowy do startu",
      title: "Zacznij przygotowania do egzaminu ADR już dziś",
      description: "Jeśli chcesz bardziej ustrukturyzowanego i zrozumiałego sposobu przygotowania do egzaminu ADR po niemiecku — ADR Bot to najprostsze miejsce, by zacząć.",
      button: "Zacznij w Telegramie",
      note: "Bez rejestracji. Otwórz bota i zacznij bezpośrednio ze swojego telefonu.",
    },
    footer: {
      description: "ADR Bot pomaga Ci przygotować się do egzaminu ADR po niemiecku poprzez ustrukturyzowane, praktyczne doświadczenie nauki w Telegramie.",
      link: "Otwórz w Telegramie",
      disclaimer: "ADR Bot wspiera przygotowanie do egzaminu i nie zastępuje oficjalnych wymagań certyfikacyjnych.",
    },
    carousel: { caption: "Prawdziwe pytania z ADR Bot — tak jak wyglądają w Telegramie" },
  },

  // ── ROMANIAN ─────────────────────────────────────────────────────────────────
  ro: {
    nav: {
      tagline: "Pregătire ADR prin Telegram",
      openInTelegram: "Deschide în Telegram",
    },
    hero: {
      eyebrow: "Pregătire ADR prin Telegram",
      title: "Pregătește-te pentru examenul ADR în germană cu mai puțină confuzie",
      description: "ADR Bot îi ajută pe șoferi și pe profesioniștii din logistică să înțeleagă terminologia, să exerseze formulările reale ale examenului și să se pregătească pas cu pas — direct în Telegram.",
      ctaPrimary: "Începe în Telegram",
      ctaSecondary: "Cum funcționează",
      note: "Fără înregistrare. Fără platformă nouă. Începe direct în Telegram.",
    },
    problems: {
      eyebrow: "De ce pregătirea pare mai grea",
      title: "Limba face totul mai greu decât ar trebui",
      description: "Pentru mulți candidați ADR, examenul în sine nu este singura provocare. Sunt formulările formale, vocabularul tehnic și incertitudinea care se acumulează pe parcurs.",
      cards: [
        { title: "Germana tehnică pare grea", text: "Terminologia ADR este greu de asimilat când cuvintele în sine par străine." },
        { title: "Formulările oficiale sunt confuze", text: "Întrebările de examen sunt scrise în germană formală care sună mai complicat decât ideea din spatele lor." },
        { title: "E greu să știi de unde să începi", text: "Fără structură, pregătirea devine copleșitoare înainte să fi acoperit măcar elementele de bază." },
        { title: "Teoria singură nu se reține", text: "A citi este un lucru. A-ți aminti sub presiunea examenului este cu totul altceva." },
      ],
    },
    howItWorks: {
      eyebrow: "Început simplu",
      title: "Cum funcționează",
      description: "Trei pași. Fără obstacole. Ești gata să începi în mai puțin de un minut.",
      steps: [
        { title: "Deschide botul", text: "Începe direct în Telegram. Fără înregistrare, fără platformă nouă, fără complicații." },
        { title: "Lucrează cu practica ghidată", text: "Învață terminologia, formulările examenului și conceptele cheie printr-un flux de chat concentrat." },
        { title: "Construiește încredere reală", text: "Practica regulată face limba familiară — astfel examenul nu mai pare o surpriză." },
      ],
    },
    benefits: {
      eyebrow: "De ce funcționează acest format",
      title: "O modalitate mai simplă de pregătire, în aplicația pe care o folosești deja",
      description: "În loc să parcurgi singur materiale dense, primești un flux ghidat construit în jurul terminologiei și formulărilor de examen care contează cu adevărat.",
      checklist: ["Învață într-un format pe care îl cunoști deja", "Urmează un traseu structurat", "Concentrează-te pe ce e util, nu pe tot", "Construiește familiaritate pas cu pas"],
      cards: [
        { title: "Nicio aplicație nouă necesară", text: "Funcționează în Telegram-ul tău existent. Deschide botul — și ești gata să începi." },
        { title: "Fiecare termen explicat simplu", text: "Fiecare concept este detaliat în limbaj simplu cu un exemplu practic din contextul examenului." },
        { title: "Acoperă toate temele principale ADR", text: "Structurat în jurul categoriilor care apar efectiv la examenul de certificare." },
        { title: "Se potrivește între ture", text: "Sesiunile sunt suficient de scurte pentru a le folosi în pauze, pe drum sau seara." },
        { title: "Construit pentru vorbitori non-nativi de germană", text: "Conceput special pentru persoanele care lucrează în germană ca a doua sau a treia limbă." },
        { title: "Repetarea care construiește memorie reală", text: "Practica spațiată te ajută să reții terminologia când contează — nu doar în timp ce studiezi." },
      ],
    },
    audience: {
      eyebrow: "Pentru cine este",
      title: "Creat pentru profesioniști care se pregătesc pentru certificarea ADR",
      description: "Dacă ai nevoie de o modalitate mai ușor de înțeles și mai accesibilă de pregătire, aceasta este făcută pentru tine.",
      cards: [
        { title: "Șoferi de camion", text: "Pregătire pentru calificarea legată de ADR și subiectele practice ale examenului." },
        { title: "Profesioniști în logistică", text: "Activitate în domeniul transportului, manipulării mărfurilor periculoase și cerințelor operaționale." },
        { title: "Candidați la examenul ADR", text: "Caută mai multă structură și încredere înainte de data testului." },
        { title: "Cursanți de germană tehnică", text: "Oricine găsește formulările oficiale în germană dificil de asimilat și de reținut." },
      ],
    },
    trust: {
      eyebrow: "De ce inspiră încredere",
      title: "Claritate în loc de zgomot de marketing",
      description: "ADR Bot nu are nevoie de cifre inventate sau testimoniale artificiale pentru a părea credibil. Încrederea vine din structură clară, limbaj ușor de urmărit și un flux de învățare practic.",
      bullets: [
        "Practic, nu zgomotos",
        "Clar, nu supraîncărcat",
        "Concentrat, nu generic",
      ],
    },
    cta: {
      eyebrow: "Gata să începi",
      title: "Începe pregătirea pentru examenul ADR astăzi",
      description: "Dacă vrei un mod mai structurat și mai ușor de înțeles de a te pregăti pentru examenul ADR în germană — ADR Bot este cel mai simplu loc de start.",
      button: "Începe în Telegram",
      note: "Fără înregistrare. Deschide botul și începe direct de pe telefonul tău.",
    },
    footer: {
      description: "ADR Bot te ajută să te pregătești pentru examenul ADR în germană printr-o experiență de învățare structurată și practică bazată pe Telegram.",
      link: "Deschide în Telegram",
      disclaimer: "ADR Bot sprijină pregătirea pentru examen și nu înlocuiește cerințele oficiale de certificare.",
    },
    carousel: { caption: "Întrebări reale din ADR Bot — așa cum apar în Telegram" },
  },

  // ── BULGARIAN ────────────────────────────────────────────────────────────────
  bg: {
    nav: {
      tagline: "Подготовка за ADR чрез Telegram",
      openInTelegram: "Отвори в Telegram",
    },
    hero: {
      eyebrow: "Подготовка за ADR чрез Telegram",
      title: "Подготви се за изпита ADR на немски с по-малко объркване",
      description: "ADR Bot помага на шофьори и логистични специалисти да разберат терминологията, да практикуват реални изпитни формулировки и да се подготвят стъпка по стъпка — директно в Telegram.",
      ctaPrimary: "Започни в Telegram",
      ctaSecondary: "Как работи",
      note: "Без регистрация. Без нова платформа. Започни директно в Telegram.",
    },
    problems: {
      eyebrow: "Защо подготовката е по-трудна",
      title: "Езикът го прави по-трудно, отколкото трябва да бъде",
      description: "За много кандидати за ADR самият изпит не е единственото предизвикателство. Официалните формулировки, техническата лексика и несигурността се натрупват по пътя.",
      cards: [
        { title: "Техническият немски изглежда тежък", text: "Терминологията на ADR е трудна за усвояване, когато самите думи изглеждат чужди." },
        { title: "Официалните формулировки са объркващи", text: "Изпитните въпроси са написани на официален немски, който звучи по-сложно от идеята зад него." },
        { title: "Трудно е да знаеш откъде да започнеш", text: "Без структура подготовката се превръща в претоварване, преди да са покрити дори основите." },
        { title: "Само теорията не остава", text: "Четенето е едно. Възпроизвеждането под напрежение на изпита е нещо съвсем различно." },
      ],
    },
    howItWorks: {
      eyebrow: "Лесно начало",
      title: "Как работи",
      description: "Три стъпки. Без пречки. Готов за старт за по-малко от минута.",
      steps: [
        { title: "Отвори бота", text: "Започни директно в Telegram. Без регистрация, без нова платформа, без сложен процес." },
        { title: "Работи с насочена практика", text: "Научи терминологията, изпитните формулировки и ключовите концепции чрез фокусиран чат поток." },
        { title: "Изгради реална увереност", text: "Редовната практика прави езика познат — изпитът вече не изглежда изненада." },
      ],
    },
    benefits: {
      eyebrow: "Защо този формат работи",
      title: "По-прост начин за подготовка в приложение, което вече използваш",
      description: "Вместо да работиш сам с плътни материали, получаваш насочен поток, изграден около терминологията и изпитните формулировки, които наистина имат значение.",
      checklist: ["Учи в познат формат", "Следвай структуриран път", "Фокусирай се върху полезното, не върху всичко", "Изгради познанието стъпка по стъпка"],
      cards: [
        { title: "Без нови приложения", text: "Работи в твоя съществуващ Telegram. Отвори бота — и си готов да започнеш." },
        { title: "Всеки термин обяснен просто", text: "Всяка концепция е разбита на прост език с практически пример от контекста на изпита." },
        { title: "Обхваща всички основни теми на ADR", text: "Структурирано около категориите, които действително се появяват на сертификационния изпит." },
        { title: "Побира се между смените", text: "Сесиите са достатъчно кратки за използване по време на почивка, на пътя или вечерта." },
        { title: "Изграден за неносители на немски", text: "Проектиран специално за хора, работещи на немски като втори или трети език." },
        { title: "Повторение, което изгражда реална памет", text: "Разпределената практика ти помага да запомниш терминологията тогава, когато има значение." },
      ],
    },
    audience: {
      eyebrow: "За кого е",
      title: "Изграден за работещи специалисти, подготвящи се за сертификация ADR",
      description: "Ако имаш нужда от по-разбираем и достъпен начин за подготовка — това е направено за теб.",
      cards: [
        { title: "Шофьори на камиони", text: "Подготовка за ADR-свързана квалификация и практически изпитни теми." },
        { title: "Логистични специалисти", text: "Работа с транспорт, опасни товари и оперативни изисквания." },
        { title: "Кандидати за изпит ADR", text: "Търсят повече структура и увереност преди датата на изпита." },
        { title: "Учещи технически немски", text: "Всеки, който намира официалните немски формулировки за трудни за усвояване и запомняне." },
      ],
    },
    trust: {
      eyebrow: "Защо вдъхва доверие",
      title: "Яснота вместо маркетингов шум",
      description: "ADR Bot не разчита на измислени числа или изкуствени отзиви. Доверието идва от ясна структура, разбираем език и практичен учебен процес.",
      bullets: [
        "Практично, не шумно",
        "Ясно, не претоварено",
        "Фокусирано, не общо",
      ],
    },
    cta: {
      eyebrow: "Готов да започнеш",
      title: "Започни подготовката за изпита ADR днес",
      description: "Ако искаш по-структуриран и разбираем начин за подготовка за изпита ADR на немски — ADR Bot е най-простото място за начало.",
      button: "Започни в Telegram",
      note: "Без регистрация. Отвори бота и започни директно от телефона си.",
    },
    footer: {
      description: "ADR Bot ти помага да се подготвиш за изпита ADR на немски чрез структурирано, практично учебно изживяване в Telegram.",
      link: "Отвори в Telegram",
      disclaimer: "ADR Bot подпомага подготовката за изпита и не замества официалните изисквания за сертификация.",
    },
    carousel: { caption: "Реални въпроси от ADR Bot — такива, каквито се появяват в Telegram" },
  },

  // ── CROATIAN ─────────────────────────────────────────────────────────────────
  hr: {
    nav: {
      tagline: "Priprema za ADR putem Telegrama",
      openInTelegram: "Otvori u Telegramu",
    },
    hero: {
      eyebrow: "Priprema za ADR putem Telegrama",
      title: "Pripremi se za ADR ispit na njemačkom s manje zbrke",
      description: "ADR Bot pomaže vozačima i logističkim stručnjacima razumjeti terminologiju, uvježbati stvarne formulacije ispita i pripremiti se korak po korak — izravno u Telegramu.",
      ctaPrimary: "Počni u Telegramu",
      ctaSecondary: "Kako funkcionira",
      note: "Bez registracije. Bez nove platforme. Počni izravno u Telegramu.",
    },
    problems: {
      eyebrow: "Zašto se priprema čini težom",
      title: "Jezik to čini težim nego što treba biti",
      description: "Za mnoge kandidate za ADR ispit sam ispit nije jedini izazov. To su formalne formulacije, tehnički vokabular i nesigurnost koja se nakuplja na putu.",
      cards: [
        { title: "Tehnički njemački se čini teškim", text: "Terminologiju ADR-a teško je usvojiti kad se same riječi čine stranim." },
        { title: "Službene formulacije su zbunjujuće", text: "Ispitna pitanja napisana su formalnim njemačkim koji zvuči složenije od ideje iza njega." },
        { title: "Teško je znati odakle početi", text: "Bez strukture priprema se pretvara u preopterećenje prije nego što su čak pokrivene osnove." },
        { title: "Sama teorija se ne zadržava", text: "Čitanje je jedno. Prisjećanje pod pritiskom ispita nešto je sasvim drugo." },
      ],
    },
    howItWorks: {
      eyebrow: "Jednostavan početak",
      title: "Kako funkcionira",
      description: "Tri koraka. Bez prepreka. Spreman si za početak za manje od minute.",
      steps: [
        { title: "Otvori bota", text: "Počni izravno u Telegramu. Bez registracije, bez nove platforme, bez složenog postavljanja." },
        { title: "Radi vođenu praksu", text: "Uči terminologiju, formulacije ispita i ključne koncepte kroz fokusirani chat tok." },
        { title: "Izgradi pravo samopouzdanje", text: "Redovita praksa čini jezik poznatim — pa se ispit ne čini iznenađenjem." },
      ],
    },
    benefits: {
      eyebrow: "Zašto ovaj format funkcionira",
      title: "Jednostavniji način pripreme u aplikaciji koju već koristiš",
      description: "Umjesto da sam prolazite kroz gusti materijal, dobivate vođeni tok izgrađen oko terminologije i formulacija ispita koje stvarno vrijede.",
      checklist: ["Uči u formatu koji već poznaješ", "Slijedi strukturirani put", "Usredotoči se na korisno, ne na sve", "Izgrađuj poznavanje korak po korak"],
      cards: [
        { title: "Nema potrebe za novim aplikacijama", text: "Radi unutar tvog postojećeg Telegrama. Otvori bota — i spreman si za početak." },
        { title: "Svaki pojam objašnjen jednostavno", text: "Svaki koncept je razložen jednostavnim jezikom s praktičnim primjerom iz konteksta ispita." },
        { title: "Pokriva sva glavna područja ADR-a", text: "Strukturirano oko kategorija koje se stvarno pojavljuju na certifikacijskom ispitu." },
        { title: "Stane između smjena", text: "Sesije su dovoljno kratke za korištenje u pauzi, na putu ili navečer." },
        { title: "Izgrađen za neizvorni govornike njemačkog", text: "Dizajniran posebno za ljude koji rade na njemačkom kao drugom ili trećem jeziku." },
        { title: "Ponavljanje koje gradi pravo pamćenje", text: "Raspodijeljeno vježbanje pomaže ti zapamtiti terminologiju kada je važno." },
      ],
    },
    audience: {
      eyebrow: "Za koga je namijenjeno",
      title: "Izgrađeno za radne stručnjake koji se pripremaju za ADR certifikaciju",
      description: "Ako trebaš razumljiviji i pristupačniji način pripreme — ovo je napravljeno za tebe.",
      cards: [
        { title: "Vozači kamiona", text: "Priprema za ADR-vezanu kvalifikaciju i praktične teme ispita." },
        { title: "Logistički stručnjaci", text: "Rad s prijevozom, rukovanjem opasnim robama i operativnim zahtjevima." },
        { title: "Kandidati za ADR ispit", text: "Traže više strukture i samopouzdanja prije datuma ispita." },
        { title: "Učenici tehničkog njemačkog", text: "Svi kojima je teško usvojiti i prisjetiti se službenih njemačkih formulacija." },
      ],
    },
    trust: {
      eyebrow: "Zašto djeluje vjerodostojno",
      title: "Jasnoća umjesto marketinške buke",
      description: "ADR Bot ne treba izmišljene brojke ni umjetne izjave da bi djelovao uvjerljivo. Povjerenje dolazi iz jasne strukture, razumljivog jezika i praktičnog ritma učenja.",
      bullets: [
        "Praktično, a ne bučno",
        "Jasno, a ne pretrpano",
        "Fokusirano, a ne generično",
      ],
    },
    cta: {
      eyebrow: "Spreman za početak",
      title: "Počni se pripremati za ADR ispit danas",
      description: "Ako želiš strukturiraniji i razumljiviji način pripreme za ADR ispit na njemačkom — ADR Bot je najjednostavnije mjesto za početak.",
      button: "Počni u Telegramu",
      note: "Bez registracije. Otvori bota i počni izravno sa svog telefona.",
    },
    footer: {
      description: "ADR Bot pomaže ti pripremiti se za ADR ispit na njemačkom kroz strukturirano, praktično iskustvo učenja u Telegramu.",
      link: "Otvori u Telegramu",
      disclaimer: "ADR Bot podržava pripremu za ispit i ne zamjenjuje službene zahtjeve certificiranja.",
    },
    carousel: { caption: "Stvarna pitanja iz ADR Bota — onako kako se pojavljuju u Telegramu" },
  },
};
