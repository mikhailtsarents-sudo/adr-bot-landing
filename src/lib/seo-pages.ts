import { siteConfig, siteUrl } from "@/lib/site";
import type { Metadata } from "next";

export type SeoQuestionCard = {
  question: string;
  answer: string;
};

export type SeoTermCard = {
  term: string;
  note: string;
};

export type SeoFaqCard = {
  question: string;
  answer: string;
};

export type SeoRelatedLink = {
  href: string;
  label: string;
  note: string;
};

export type SeoPageConfig = {
  slug: string;
  path: string;
  pageTitle: string;
  metaTitle: string;
  metaDescription: string;
  heroKicker: string;
  heroTitle: string;
  heroLead: string;
  heroSupport: string;
  intentTitle: string;
  intentParagraphs: string[];
  sampleTitle: string;
  sampleLead: string;
  sampleQuestions?: SeoQuestionCard[];
  sampleTerms?: SeoTermCard[];
  sampleCalloutTitle?: string;
  sampleCalloutText?: string;
  whyTelegramTitle: string;
  whyTelegramParagraphs: string[];
  faqs?: SeoFaqCard[];
  relatedLinks: SeoRelatedLink[];
  ctaTitle: string;
  ctaLead: string;
  ctaButton: string;
  disclaimer: string;
  telegramSource: string;
  keywords: string[];
};

type StructuredDataRecord = Record<string, unknown>;

const sharedKeywords = siteConfig.keywords;
const SEO_PAGE_KICKER = "ADR-Lernvorschau";
const SEO_PRIMARY_CTA = "In Telegram starten";

export const adrPruefungAufDeutsch: SeoPageConfig = {
  slug: "adr-pruefung-auf-deutsch",
  path: "/adr-pruefung-auf-deutsch",
  pageTitle: "ADR-Pruefung auf Deutsch",
  metaTitle: "ADR-Pruefung auf Deutsch bestehen | Fragen, Begriffe und Tipps",
  metaDescription:
    "ADR-Pruefung auf Deutsch vorbereiten: typische Pruefungsfragen, Fachbegriffe verstaendlich erklaert und Lerntipps fuer Nicht-Muttersprachler. Kostenlos ueben.",
  heroKicker: SEO_PAGE_KICKER,
  heroTitle: "ADR-Pruefung auf Deutsch bestehen",
  heroLead:
    "Typische ADR-Pruefungsfragen mit verstaendlichen Erklaerungen auf Deutsch. Speziell fuer Fahrer, denen die Fachsprache das Bestehen erschwert.",
  heroSupport:
    "Uebe die wichtigsten Begriffe und Fragetypen. Viele Nicht-Muttersprachler bestehen die ADR-Pruefung mit gezieltem Sprachtraining.",
  intentTitle: "Worum es hier geht",
  intentParagraphs: [
    "Diese Seite hilft Menschen, die ADR auf Deutsch suchen und zuerst eine kleine Orientierung brauchen. Sie ist als Uebersichtsseite gebaut, nicht als enger Spezial-Intent.",
    "Du bekommst kleine, lesbare Beispiele, damit du schnell verstehst, wie Begriffe, Frageformen und Themen rund um ADR klingen. Fuer aktives Lernen und Wiederholung fuehren die spezielleren Unterseiten und der Telegram-Bot weiter.",
  ],
  sampleTitle: "Kurzes Sample",
  sampleLead:
    "Nur ein kleiner, hilfreicher Ausschnitt. Nicht der komplette Trainingsinhalt.",
  sampleQuestions: [
    {
      question: "Was bedeutet ADR im Alltag?",
      answer:
        "ADR beschreibt Regeln fuer den sicheren Transport gefaehrlicher Gueter im Strassenverkehr.",
    },
    {
      question: "Warum klingen viele Fragen so formell?",
      answer:
        "Weil die Pruefung auf technisches Verstaendnis und klare Fachsprache zielt.",
    },
    {
      question: "Welche Begriffe sollte ich zuerst kennen?",
      answer:
        "Starte mit Kennzeichnung, UN-Nummern, Beforderungspapieren und Gefahrgut-Klassen.",
    },
  ],
  sampleTerms: [
    {
      term: "Gefahrgut",
      note: "Stoffe, fuer die besondere Transportregeln gelten.",
    },
    {
      term: "Beforderungspapier",
      note: "Das Begleitdokument fuer den Transport.",
    },
    {
      term: "Kennzeichnung",
      note: "Die sichtbare Markierung am Fahrzeug oder auf der Sendung.",
    },
    {
      term: "UN-Nummer",
      note: "Eindeutige Nummer zur Identifikation eines Stoffes.",
    },
    {
      term: "Tunnelkategorie",
      note: "Wichtige Regel fuer Durchfahrt und Route.",
    },
  ],
  sampleCalloutTitle: "Wichtig",
  sampleCalloutText:
    "Diese Seite zeigt nur ein kleines Sample. In Telegram trainierst du mit mehr Fragen, mehr Wiederholung und einem vollstaendigeren Ablauf.",
  whyTelegramTitle: "Warum Telegram der naechste Schritt ist",
  whyTelegramParagraphs: [
    "Der Bot liefert mehr Fragen, mehr Begriffe und mehr Wiederholung als die oeffentliche Vorschau.",
    "So bleibt die Seite fuer SEO und Orientierung nuetzlich, aber die eigentliche Lerntiefe liegt im Bot.",
  ],
  faqs: [
    {
      question: "Ist das die offizielle ADR-Pruefung?",
      answer:
        "Nein. Das hier ist eine Lern- und Vorbereitungshilfe mit begrenztem Sample.",
    },
    {
      question: "Kann ich hier alles lernen?",
      answer:
        "Nein. Auf der Seite siehst du nur einen Ausschnitt. Die volle Uebung liegt im Bot.",
    },
    {
      question: "Was kommt nach dieser Seite?",
      answer:
        "Der naechste Schritt ist der Telegram-Bot mit mehr Fragen und vollstaendigem Training.",
    },
  ],
  relatedLinks: [
    {
      href: "/adr-pruefung-deutsch-lernen",
      label: "ADR Pruefung Deutsch lernen",
      note: "Wenn du von Orientierung in aktives Lernen wechseln willst",
    },
    {
      href: "/technisches-deutsch-adr",
      label: "Technisches Deutsch fuer ADR",
      note: "Sprachfokus fuer Pruefungsdeutsch und schwierige Formulierungen",
    },
    {
      href: "/adr-begriffe",
      label: "ADR Begriffe",
      note: "Begriffseinstieg fuer Wortschatz und Fachsprache",
    },
  ],
  ctaTitle: "Mehr ADR-Uebung im Telegram-Bot",
  ctaLead:
    "Wenn dir die Vorschau geholfen hat, findest du im Bot mehr Fragen, mehr Begriffe und einen vollstaendigeren Trainingsfluss.",
  ctaButton: SEO_PRIMARY_CTA,
  disclaimer:
    "Diese Seite zeigt nur ein Sample. Sie ersetzt keine offizielle Schulung und gibt keine Garantie auf Pruefungserfolg.",
  telegramSource: "seo_adr_pruefung_auf_deutsch",
  keywords: [
    "ADR-Pruefung auf Deutsch",
    "ADR lernen Deutsch",
    "ADR Begriffe Deutsch",
    "ADR Fragen Deutsch",
  ],
};

export const basiskursPreview: SeoPageConfig = {
  slug: "basiskurs-preview",
  path: "/basiskurs-preview",
  pageTitle: "ADR Basiskurs – Fragen und Begriffe",
  metaTitle: "ADR Basiskurs | Typische Pruefungsfragen und Fachbegriffe lernen",
  metaDescription:
    "ADR Basiskurs vorbereiten: typische Pruefungsfragen, wichtige Fachbegriffe und kurze Erklaerungen auf Deutsch. Kostenlos ueben im Telegram-Bot.",
  heroKicker: SEO_PAGE_KICKER,
  heroTitle: "ADR Basiskurs – Fragen und Begriffe",
  heroLead:
    "Typische ADR-Basiskurs-Pruefungsfragen mit klaren Erklaerungen auf Deutsch. Fuer Fahrer, die sich gezielt auf die Pruefung vorbereiten wollen.",
  heroSupport:
    "Lerne die wichtigsten Fachbegriffe und typischen Fragetypen des Basiskurses. Mehr Uebung und Wiederholung gibt es kostenlos im Telegram-Bot.",
  intentTitle: "Worum es hier geht",
  intentParagraphs: [
    "Der Basiskurs ist der wichtigste Einstieg fuer viele Nutzer. Darum bekommt er eine eigene SEO-Seite mit einer kleinen, aber nuetzlichen Vorschau.",
    "Die Seite soll Suchintentionen wie Basiskurs, Grundwissen und ADR-Vorbereitung abholen, ohne den vollen Kurs komplett zu kopieren.",
  ],
  sampleTitle: "Typische Basiskurs-Pruefungsfragen",
  sampleLead:
    "Diese Fragen kommen aehnlich in der ADR-Pruefung vor. Versteh die Struktur, dann faellt die echte Pruefung leichter.",
  sampleQuestions: [
    {
      question: "Welche Dokumente tauchen im Basiskurs haeufig auf?",
      answer:
        "Oft geht es um Beforderungspapiere, Kennzeichnung und klare Zuständigkeiten.",
    },
    {
      question: "Warum ist das Pruefungsdeutsch so wichtig?",
      answer:
        "Weil formelle Formulierungen oft schwieriger sind als der eigentliche Inhalt.",
    },
    {
      question: "Was ist der Unterschied zwischen Lesen und Ueben?",
      answer:
        "Lesen zeigt dir den Stoff. Ueben hilft dir, ihn im richtigen Moment abzurufen.",
    },
    {
      question: "Wie starte ich sinnvoll?",
      answer:
        "Mit den wichtigsten Begriffen, einer kleinen Frage-Auswahl und regelmaessiger Wiederholung.",
    },
    {
      question: "Was bringt mir die Preview?",
      answer:
        "Sie zeigt dir, wie der Kurs aufgebaut ist, ohne den kompletten Inhalt offenzulegen.",
    },
  ],
  sampleTerms: [
    {
      term: "Beforderungspapier",
      note: "Das Begleitdokument fuer die ADR-relevante Sendung.",
    },
    {
      term: "Kennzeichnung",
      note: "Die sichtbare Markierung, die beim Transport wichtig ist.",
    },
    {
      term: "UN-Nummer",
      note: "Eine Nummer zur eindeutigen Stoff-Identifikation.",
    },
    {
      term: "Gefahrzettel",
      note: "Ein klassisches Zeichen fuer die passende Gefahrgut-Klasse.",
    },
    {
      term: "Freistellung",
      note: "Regelung, bei der ein Teil der Vorschriften nicht voll greift.",
    },
  ],
  sampleCalloutTitle: "Basiskurs in kurz",
  sampleCalloutText:
    "Die Vorschau bleibt klein. Der Bot hat deutlich mehr Fragen, mehr Begriffe und mehr Wiederholung fuer den Alltag.",
  whyTelegramTitle: "Warum Telegram der naechste Schritt ist",
  whyTelegramParagraphs: [
    "Im Bot gibt es mehr Fragen, mehr Wiederholung und einen gefuehrten Lernfluss, der ueber die kleine Vorschau hinausgeht.",
    "Die oeffentliche Seite soll Interesse wecken, Vertrauen aufbauen und dann klar in den Bot fuehren.",
  ],
  faqs: [
    {
      question: "Wie gross ist das Preview?",
      answer:
        "Bewusst klein: nur ein Sample mit wenigen Fragen und Begriffen.",
    },
    {
      question: "Ist das schon der ganze Basiskurs?",
      answer:
        "Nein, hier siehst du nur einen Ausschnitt. Die volle Praxis liegt im Bot.",
    },
    {
      question: "Kann ich hier direkt weitertrainieren?",
      answer:
        "Ja, der Telegram-Bot ist der naechste Schritt fuer mehr Uebung.",
    },
  ],
  relatedLinks: [
    { href: "/", label: "Startseite", note: "Zurueck zum Haupt-Landingpage-Flow" },
    {
      href: "/adr-pruefung-auf-deutsch",
      label: "ADR-Pruefung auf Deutsch",
      note: "Allgemeiner Einstieg in die ADR-Vorbereitung",
    },
    {
      href: "/adr-begriffe",
      label: "ADR Begriffe / Vocabulary",
      note: "Wortschatz und Terminologie als Zusatz",
    },
  ],
  ctaTitle: "Mehr Uebung im Telegram-Bot",
  ctaLead:
    "Wenn du mehr Fragen und Wiederholungen willst, fuehrt dich der Bot durch den naechsten Schritt.",
  ctaButton: SEO_PRIMARY_CTA,
  disclaimer:
    "Das Preview zeigt nur einen begrenzten Ausschnitt. Es ersetzt keinen vollstaendigen Kurs und verspricht keinen Pruefungserfolg.",
  telegramSource: "seo_basiskurs_preview",
  keywords: [
    "Basiskurs Preview",
    "ADR Basiskurs",
    "ADR Grundwissen",
    "ADR Fragen",
  ],
};

export const aufbaukursTankPreview: SeoPageConfig = {
  slug: "aufbaukurs-tank-preview",
  path: "/aufbaukurs-tank-preview",
  pageTitle: "ADR Aufbaukurs Tank – Fragen und Begriffe",
  metaTitle: "ADR Aufbaukurs Tank | Pruefungsfragen und Tankfahrzeug-Begriffe",
  metaDescription:
    "ADR Aufbaukurs Tank vorbereiten: typische Pruefungsfragen zu Tankfahrzeugen, wichtige Fachbegriffe und Erklaerungen auf Deutsch. Kostenlos ueben.",
  heroKicker: SEO_PAGE_KICKER,
  heroTitle: "ADR Aufbaukurs Tank – Fragen und Begriffe",
  heroLead: "Typische ADR-Pruefungsfragen zum Aufbaukurs Tank mit Erklaerungen auf Deutsch. Fuer Fahrer mit Tankfahrzeug-Schein, die sich gezielt vorbereiten.",
  heroSupport: "Sie bleibt bewusst kompakt: Orientierung auf der Seite, mehr Tiefe und Wiederholung danach im Telegram-Bot.",
  intentTitle: "Warum dieser Lern-Intent gerade wichtig ist",
  intentParagraphs: [
    "Live-Signale zeigen, dass Nutzer bei diesem Thema einen klaren, anfangerfreundlichen Einstieg suchen statt ueberladener Theorie.",
    "Darum bleibt die Seite fokussiert und conversion-nah: etwas Nutzen direkt sichtbar, mehr Uebung anschliessend im Bot.",
  ],
  sampleTitle: "Gezielte Lernvorschau",
  sampleLead: "2 bis 3 kleine Beispiele oder Mini-Lektionen reichen, um Suchintention und Vertrauen sauber abzudecken.",
  sampleQuestions: [
    {
      question: "Worum geht es im Aufbaukurs Tank?",
      answer:
        "Vor allem um tankbezogene ADR-Themen, typische Regeln und praktische Pruefungsfragen.",
    },
    {
      question: "Warum ist Tank-Vokabular wichtig?",
      answer:
        "Weil Formulierungen und Begriffe oft direkt ueber das Verstaendnis entscheiden.",
    },
    {
      question: "Was sollte ich zuerst ueben?",
      answer:
        "Die wichtigsten Begriffe, typische Fragearten und die grobe Struktur des Tank-Stoffs.",
    },
  ],
  sampleTerms: [
    {
      term: "Tankfahrzeug",
      note: "Fahrzeugtyp mit besonderem Bezug zu ADR-Tankthemen.",
    },
    {
      term: "Befuellung",
      note: "Der Fuellvorgang, der oft mit Regeln und Kontrolle verbunden ist.",
    },
    {
      term: "Restmenge",
      note: "Verbleibende Menge im Tank, die bei Regeln und Sicherheit wichtig sein kann.",
    },
    {
      term: "Druck",
      note: "Ein technischer Faktor, der bei Tankthemen eine Rolle spielen kann.",
    },
    {
      term: "Absicherung",
      note: "Massnahmen, die beim Transport und Handling wichtig sind.",
    },
  ],
  sampleCalloutTitle: "Nur ein Ausschnitt",
  sampleCalloutText: "Die Vorschau bleibt absichtlich klein. Die eigentliche Wiederholung und Lernroutine liegt im Bot.",
  whyTelegramTitle: "Warum Telegram nach der Vorschau der richtige Schritt ist",
  whyTelegramParagraphs: [
    "Der Bot passt besser zu kurzen Wiederholungseinheiten als eine statische SEO-Seite.",
    "So bleibt die Seite hilfreich fuer Suchende, waehrend der naechste Lernschritt klar und praktisch bleibt.",
  ],
  faqs: [
    {
      question: "Ist das ein vollstaendiger Tank-Kurs?",
      answer:
        "Nein, nur ein kleiner, hilfreicher Auszug mit Verweis auf den Bot.",
    },
    {
      question: "Wofuer ist diese Seite gedacht?",
      answer:
        "Fuer Nutzer, die nach Tank-bezogener ADR-Vorbereitung suchen.",
    },
    {
      question: "Wo geht es weiter?",
      answer:
        "Im Telegram-Bot findest du mehr Fragen und mehr Drill.",
    },
  ],
  relatedLinks: [
    { href: "/", label: "Startseite", note: "Zurueck zum Haupt-Landingpage-Flow" },
    {
      href: "/basiskurs-preview",
      label: "Basiskurs Preview",
      note: "Der wichtigste allgemeine Einstieg",
    },
    {
      href: "/adr-faq-fuer-fahrer",
      label: "ADR FAQ fuer Fahrer",
      note: "Kurze Antworten zu Kurswahl und Einstieg",
    },
  ],
  ctaTitle: "Im Telegram-Bot weiterlernen",
  ctaLead: "Wenn du nach dem Einstieg direkt weitermachen willst, ist der Bot der sinnvollste naechste Schritt.",
  ctaButton: SEO_PRIMARY_CTA,
  disclaimer:
    "Diese Seite zeigt nur ein begrenztes Tank-Sample und ersetzt keinen vollstaendigen Kurs.",
  telegramSource: "seo_aufbaukurs_tank_preview",
  keywords: [
    "Aufbaukurs Tank",
    "ADR Tank",
    "Tank Fragen ADR",
    "Gefahrgut Tank",
  ],
};

export const adrBegriffeVocabulary: SeoPageConfig = {
  slug: "adr-begriffe",
  path: "/adr-begriffe",
  pageTitle: "ADR Begriffe / Vocabulary",
  metaTitle: "ADR Begriffe erklaert | ADR Vocabulary fuer Fahrer",
  metaDescription:
    "Lerne die wichtigsten ADR Begriffe mit kurzen Beispielen und Nutzungs-Hinweisen. Fuer mehr Woerter und Drill geht es in den Telegram-Bot.",
  heroKicker: SEO_PAGE_KICKER,
  heroTitle: "ADR Begriffe / Vocabulary",
  heroLead:
    "Lerne die wichtigsten ADR Begriffe mit kurzen Beispielen und Nutzungs-Hinweisen. Fuer mehr Woerter und Drill geht es in den Telegram-Bot.",
  heroSupport:
    "Die Seite ist bewusst kompakt: genug fuer SEO und Orientierung, aber nicht als kompletter Wortschatz gedacht.",
  intentTitle: "Worum es hier geht",
  intentParagraphs: [
    "Viele Nutzer suchen zuerst nicht nach Kursnamen, sondern nach einzelnen Begriffen. Diese Seite fängt genau diese Suchintention ab.",
    "Sie zeigt einen kleinen, lesbaren Auszug mit Begriffen, die in der ADR-Vorbereitung haeufig vorkommen. Danach geht es fuer mehr Drill in den Bot.",
  ],
  sampleTitle: "Wortschatz-Sample",
  sampleLead:
    "5 bis 8 Begriffe reichen, um den Nutzen zu zeigen und den groesseren Wortschatz im Bot zu lassen.",
  sampleTerms: [
    {
      term: "Gefahrzettel",
      note: "Kennzeichnung fuer die passende Gefahrgut-Klasse.",
    },
    {
      term: "UN-Nummer",
      note: "Eindeutige Identifikation eines Stoffes.",
    },
    {
      term: "Beforderungspapier",
      note: "Dokument, das wichtige Transportdaten enthaelt.",
    },
    {
      term: "Verpackungsgruppe",
      note: "Hilft beim Einordnen des Gefahrenniveaus.",
    },
    {
      term: "Tunnelkategorie",
      note: "Relevant fuer Route und Durchfahrt.",
    },
    {
      term: "Freistellung",
      note: "Regelung mit reduziertem Vorschriftenumfang.",
    },
    {
      term: "Kennzeichnung",
      note: "Sichtbare Markierung am Fahrzeug oder an der Sendung.",
    },
    {
      term: "Gefahrgut",
      note: "Stoffe, fuer die besondere Transportregeln gelten.",
    },
  ],
  sampleCalloutTitle: "Warum nur ein kleiner Auszug?",
  sampleCalloutText:
    "Die Seite soll Begriffe erklaeren und SEO-intent bedienen. Fuer den kompletten Drill und mehr Wiederholung fuehrt der naechste Schritt in Telegram.",
  whyTelegramTitle: "Warum Telegram der naechste Schritt ist",
  whyTelegramParagraphs: [
    "Im Bot bekommst du mehr Begriffe, mehr Wiederholung und uebungsnahe Aufgaben statt nur einer oeffentlichen Vorschau.",
    "Das haelt die Seite hilfreich fuer Suchende und macht den Bot zum natuerlichen Weiterweg.",
  ],
  faqs: [
    {
      question: "Wie viele Begriffe zeigt die Seite?",
      answer:
        "Nur einen kleinen Auszug, damit die Seite hilfreich bleibt und der Bot den restlichen Drill uebernimmt.",
    },
    {
      question: "Ist das ein vollständiges Lexikon?",
      answer:
        "Nein. Es ist eine SEO- und Lernvorschau mit klarer Weiterleitung in den Bot.",
    },
    {
      question: "Kann ich hier direkt mehr ueben?",
      answer:
        "Ja, im Telegram-Bot gibt es mehr Begriffe und mehr Wiederholung.",
    },
  ],
  relatedLinks: [
    { href: "/", label: "Startseite", note: "Zurueck zum Haupt-Landingpage-Flow" },
    {
      href: "/adr-pruefung-auf-deutsch",
      label: "ADR-Pruefung auf Deutsch",
      note: "Breiter Einstieg in die ADR-Vorbereitung",
    },
    {
      href: "/basiskurs-preview",
      label: "Basiskurs Preview",
      note: "Der groesste allgemeine Kurs-Einstieg",
    },
  ],
  ctaTitle: "Mehr Begriffe im Telegram-Bot",
  ctaLead:
    "Wenn dir ein kleiner Ausschnitt reicht, bekommst du im Bot den groesseren Drill fuer die Praxis.",
  ctaButton: SEO_PRIMARY_CTA,
  disclaimer:
    "Diese Seite zeigt nur einen kleinen Auszug. Sie ersetzt keinen kompletten Wortschatz und gibt keine Pruefungsgarantie.",
  telegramSource: "seo_adr_begriffe",
  keywords: [
    "ADR Begriffe",
    "ADR Vocabulary",
    "Gefahrgut Begriffe",
    "ADR Wortschatz",
  ],
};

export const adrFaqFuerFahrer: SeoPageConfig = {
  slug: "adr-faq-fuer-fahrer",
  path: "/adr-faq-fuer-fahrer",
  pageTitle: "ADR FAQ fuer Fahrer",
  metaTitle: "ADR FAQ fuer Fahrer | Kurze Antworten zur ADR-Pruefung",
  metaDescription:
    "Kurze Antworten auf haeufige ADR-Fragen fuer Fahrer. Mit Beispielen, Kurs-Hinweisen und einem klaren Weg in den Telegram-Bot.",
  heroKicker: SEO_PAGE_KICKER,
  heroTitle: "ADR FAQ fuer Fahrer",
  heroLead:
    "Kurze Antworten auf haeufige ADR-Fragen fuer Fahrer. Mit Beispielen, Kurs-Hinweisen und einem klaren Weg in den Telegram-Bot.",
  heroSupport:
    "Die Seite ist als kompakte FAQ gebaut: genug Orientierung fuer Suchende, aber nicht als vollstaendige Wissenssammlung.",
  intentTitle: "Worum es hier geht",
  intentParagraphs: [
    "Diese Seite ist fuer Nutzer gedacht, die schnelle Antworten suchen, bevor sie sich in die vollstaendige Vorbereitung stuerzen.",
    "Sie hilft bei Kurswahl, Einstieg und Erwartungshaltung und fuehrt danach sauber in den Bot weiter.",
  ],
  sampleTitle: "FAQ-Sample",
  sampleLead:
    "Kurze Antworten, klare Einordnung und ein kleiner Vergleich, damit der naechste Schritt obvious wird.",
  sampleCalloutTitle: "Kurzer Vergleich",
  sampleCalloutText:
    "Basiskurs deckt die breitere Basis ab. Aufbaukurs Tank ist spezieller. Diese Seite hilft bei der Einordnung, aber die volle Uebung liegt im Bot.",
  faqs: [
    {
      question: "Welchen ADR-Kurs sollte ich zuerst ansehen?",
      answer:
        "Meist ist der Basiskurs der beste Einstieg, weil er die Grundlage breiter abdeckt.",
    },
    {
      question: "Brauche ich fuer Tank ein eigenes Preview?",
      answer:
        "Ja, weil Tank-Themen spezieller sind und eine eigene Orientierung verdienen.",
    },
    {
      question: "Ist die Seite kostenlos?",
      answer:
        "Ja, die oeffentliche Vorschau ist kostenfrei und dient nur als Einstieg.",
    },
    {
      question: "Wie geht es nach der FAQ weiter?",
      answer:
        "In Telegram findest du mehr Fragen, mehr Wiederholung und den eigentlichen Trainingsfluss.",
    },
    {
      question: "Ist das eine offizielle Schulung?",
      answer:
        "Nein, es ist eine unterstuetzende Lernhilfe und keine offizielle Zertifizierung.",
    },
  ],
  whyTelegramTitle: "Warum Telegram der naechste Schritt ist",
  whyTelegramParagraphs: [
    "Die FAQ-Seite liefert schnelle Antworten. Der Bot liefert die eigentliche Uebung mit mehr Fragen und mehr Wiederholung.",
    "Damit bleibt die Seite ein guter Such-Einstieg und der Bot der natuerliche Ort fuer tieferes Training.",
  ],
  relatedLinks: [
    { href: "/", label: "Startseite", note: "Zurueck zum Haupt-Landingpage-Flow" },
    {
      href: "/basiskurs-preview",
      label: "Basiskurs Preview",
      note: "Der wichtigste allgemeine Einstieg",
    },
    {
      href: "/aufbaukurs-tank-preview",
      label: "Aufbaukurs Tank Preview",
      note: "Spezifischer Einstieg fuer Tank-Themen",
    },
  ],
  ctaTitle: "Mehr Antworten im Telegram-Bot",
  ctaLead:
    "Wenn dir die FAQ beim Einordnen geholfen hat, geht die echte Uebung im Bot weiter.",
  ctaButton: SEO_PRIMARY_CTA,
  disclaimer:
    "Diese FAQ dient nur der Orientierung. Sie ersetzt keine offizielle ADR-Ausbildung oder Pruefung.",
  telegramSource: "seo_adr_faq_fuer_fahrer",
  keywords: [
    "ADR FAQ",
    "ADR Fragen fuer Fahrer",
    "ADR Kurswahl",
    "ADR Vorbereitung",
  ],
};

export const technischesDeutschAdr: SeoPageConfig = {
  slug: "technisches-deutsch-adr",
  path: "/technisches-deutsch-adr",
  pageTitle: "Technisches Deutsch fuer ADR",
  metaTitle: "Technisches Deutsch fuer ADR | Woerter, Verstaendnis und Beispiele",
  metaDescription:
    "Lerne technisches Deutsch fuer ADR mit kurzen Begriffen, Beispielen und einem klaren Einstieg in die Telegram-Uebung.",
  heroKicker: SEO_PAGE_KICKER,
  heroTitle: "Technisches Deutsch fuer ADR",
  heroLead: "Diese Seite fokussiert jetzt klarer den Intent technisches deutsch adr und bietet einen kompakten Einstieg fuer Menschen, die ADR auf Deutsch besser verstehen und anwenden wollen.",
  heroSupport: "Sie bleibt bewusst kompakt: Orientierung auf der Seite, mehr Tiefe und Wiederholung danach im Telegram-Bot.",
  intentTitle: "Warum dieser Lern-Intent gerade wichtig ist",
  intentParagraphs: [
    "Live-Signale zeigen, dass Nutzer bei diesem Thema einen klaren, anfangerfreundlichen Einstieg suchen statt ueberladener Theorie.",
    "Darum bleibt die Seite fokussiert und conversion-nah: etwas Nutzen direkt sichtbar, mehr Uebung anschliessend im Bot.",
  ],
  sampleTitle: "Gezielte Lernvorschau",
  sampleLead: "2 bis 3 kleine Beispiele oder Mini-Lektionen reichen, um Suchintention und Vertrauen sauber abzudecken.",
  sampleTerms: [
    {
      term: "Beforderung",
      note: "Formelles Wort fuer den Transportvorgang in der Pruefungssprache.",
    },
    {
      term: "Kennzeichnungspflicht",
      note: "Beschreibt, wann eine sichtbare Markierung vorgeschrieben ist.",
    },
    {
      term: "mitzufuehren",
      note: "Typisches Pruefungswort fuer Unterlagen oder Ausruestung, die dabei sein muessen.",
    },
    {
      term: "freigestellt",
      note: "Bedeutet nicht frei von Regeln, sondern nur mit reduziertem Vorschriftenumfang.",
    },
    {
      term: "unzureichend",
      note: "Kommt oft in Antwortoptionen vor und markiert einen Fehler oder Mangel.",
    },
  ],
  sampleCalloutTitle: "Typische Sprachhuerde",
  sampleCalloutText: "Die Vorschau bleibt absichtlich klein. Die eigentliche Wiederholung und Lernroutine liegt im Bot.",
  whyTelegramTitle: "Warum Telegram nach der Vorschau der richtige Schritt ist",
  whyTelegramParagraphs: [
    "Der Bot passt besser zu kurzen Wiederholungseinheiten als eine statische SEO-Seite.",
    "So bleibt die Seite hilfreich fuer Suchende, waehrend der naechste Lernschritt klar und praktisch bleibt.",
  ],
  faqs: [
    {
      question: "Ist technisches Deutsch wirklich entscheidend fuer ADR?",
      answer:
        "Ja. Viele Nutzer verstehen den Stoff erst dann richtig, wenn die Pruefungsformulierung klar ist.",
    },
    {
      question: "Reicht diese Seite fuer alle Begriffe?",
      answer:
        "Nein. Sie zeigt nur ein kleines Sample. Die groessere Wiederholung liegt im Telegram-Bot.",
    },
    {
      question: "Fuer wen ist diese Seite gedacht?",
      answer:
        "Vor allem fuer Fahrer und Lernende, die ADR-Fragen auf Deutsch sprachlich besser verstehen wollen.",
    },
  ],
  relatedLinks: [
    {
      href: "/gefahrgut-deutsch-lernen",
      label: "Gefahrgut Deutsch lernen",
      note: "Alltagsnahe Sprachhuerde mit Gefahrgut-Wortschatz",
    },
    {
      href: "/adr-deutsch-ueben",
      label: "ADR Deutsch ueben",
      note: "Wenn du aus Sprache direkt in Wiederholung gehen willst",
    },
    {
      href: "/adr-fragen-auf-deutsch",
      label: "ADR Fragen auf Deutsch",
      note: "Frageformate und typische Formulierungen gezielt trainieren",
    },
  ],
  ctaTitle: "Im Telegram-Bot weiterlernen",
  ctaLead: "Wenn du nach dem Einstieg direkt weitermachen willst, ist der Bot der sinnvollste naechste Schritt.",
  ctaButton: SEO_PRIMARY_CTA,
  disclaimer:
    "Diese Seite ist nur eine Lernvorschau. Sie ersetzt keine offizielle Schulung und gibt keine Garantie auf Pruefungserfolg.",
  telegramSource: "seo_technisches_deutsch_adr",
  keywords: [
    "technisches Deutsch ADR",
    "ADR Deutsch lernen",
    "ADR Fachsprache",
    "Pruefungsdeutsch Gefahrgut",
  ],
};

export const gefahrgutDeutschLernen: SeoPageConfig = {
  slug: "gefahrgut-deutsch-lernen",
  path: "/gefahrgut-deutsch-lernen",
  pageTitle: "Gefahrgut Deutsch lernen",
  metaTitle: "Gefahrgut Deutsch lernen | Woerter und typische ADR-Sprache",
  metaDescription:
    "Lerne Gefahrgut-Deutsch mit kurzen Begriffen, Beispielen und einer kompakten Vorschau fuer den spaeteren Drill im Telegram-Bot.",
  heroKicker: SEO_PAGE_KICKER,
  heroTitle: "Gefahrgut Deutsch lernen",
  heroLead:
    "Gefahrgut-Deutsch ist fuer viele Lernende der schnellste Hebel. Diese Seite zeigt typische Woerter, kurze Bedeutungen und den naechsten Schritt in den Bot.",
  heroSupport:
    "Sie ist als oeffentliche Lernvorschau gebaut: lesbar fuer Google und Menschen, aber bewusst nicht vollstaendig.",
  intentTitle: "Worum es bei Gefahrgut-Deutsch geht",
  intentParagraphs: [
    "Suchanfragen rund um Gefahrgut-Deutsch kommen oft von Menschen, die nicht mit Kursnamen suchen, sondern mit ihrer konkreten Sprachhuerde. Genau diese Intention holen wir hier ab.",
    "Die Seite verbindet Gefahrgut-Wortschatz mit ADR-Kontext. So wird aus einem allgemeinen Sprachproblem ein klarer Einstieg in die ADR-Vorbereitung.",
  ],
  sampleTitle: "Gefahrgut-Wortschatz",
  sampleLead:
    "Ein paar Kernwoerter reichen, um die Suchintention abzuholen und den restlichen Drill im Bot zu lassen.",
  sampleTerms: [
    {
      term: "gefaaehrliche Gueter",
      note: "Formelle Sammelbezeichnung fuer Stoffe mit besonderen Transportregeln.",
    },
    {
      term: "Ladungssicherung",
      note: "Beschreibt, wie die transportierte Ware sicher fixiert werden muss.",
    },
    {
      term: "Leckage",
      note: "Bezeichnet das Austreten eines Stoffes und kommt oft in Sicherheitsfragen vor.",
    },
    {
      term: "Entladung",
      note: "Typischer Fachbegriff fuer das Ausladen im Gefahrgut-Kontext.",
    },
    {
      term: "Schutzausruestung",
      note: "Wichtiger Sammelbegriff fuer vorgeschriebene Sicherheitsausstattung.",
    },
  ],
  sampleCalloutTitle: "Warum diese Seite funktioniert",
  sampleCalloutText:
    "Sie greift kein grosses Kurs-Keyword an, sondern eine konkrete Sprachhuerde. Genau das macht solchen SEO-Traffic oft guenstiger.",
  whyTelegramTitle: "Warum Telegram danach der richtige Ort ist",
  whyTelegramParagraphs: [
    "Im Bot werden Woerter mit Fragen, Wiederholung und Anwendung verbunden. Das bringt mehr als ein statischer Wortschatz allein.",
    "Die Seite holt Suchende ab, der Bot uebernimmt danach die echte Uebung.",
  ],
  faqs: [
    {
      question: "Ist Gefahrgut Deutsch lernen das Gleiche wie ADR lernen?",
      answer:
        "Nicht ganz. Gefahrgut-Deutsch ist der sprachliche Teil, ADR ist der groessere fachliche Rahmen.",
    },
    {
      question: "Reicht Wortschatz ohne Fragen?",
      answer:
        "Meist nicht. Darum fuehrt die Seite in den Telegram-Bot weiter, wo Begriffe mit Fragen kombiniert werden.",
    },
    {
      question: "Fuer wen ist diese Seite gedacht?",
      answer:
        "Fuer Lernende, die Gefahrgut- und ADR-Begriffe auf Deutsch sicherer verstehen wollen.",
    },
  ],
  relatedLinks: [
    {
      href: "/technisches-deutsch-adr",
      label: "Technisches Deutsch fuer ADR",
      note: "Sprachfokus auf Pruefungsdeutsch und Formulierungen",
    },
    {
      href: "/gefahrgut-pruefung-auf-deutsch",
      label: "Gefahrgut Pruefung auf Deutsch",
      note: "Wenn aus Wortschatz konkreter Pruefungsbezug werden soll",
    },
    {
      href: "/adr-begriffe",
      label: "ADR Begriffe",
      note: "ADR-spezifischer Wortschatz als naechster Schritt",
    },
  ],
  ctaTitle: "Gefahrgut-Deutsch im Telegram-Bot weiterlernen",
  ctaLead:
    "Wenn du Sprache und Fachbegriffe wiederholen willst, bekommst du im Bot den groesseren Drill.",
  ctaButton: SEO_PRIMARY_CTA,
  disclaimer:
    "Diese Seite ist nur eine oeffentliche Vorschau und ersetzt keine offizielle Schulung.",
  telegramSource: "seo_gefahrgut_deutsch_lernen",
  keywords: [
    "Gefahrgut Deutsch lernen",
    "Gefahrgut Woerter Deutsch",
    "ADR Deutsch Gefahrgut",
    "Deutsch fuer Gefahrgut Fahrer",
  ],
};

export const adrVorbereitungFuerLkwFahrer: SeoPageConfig = {
  slug: "adr-vorbereitung-fuer-lkw-fahrer",
  path: "/adr-vorbereitung-fuer-lkw-fahrer",
  pageTitle: "ADR Vorbereitung fuer LKW-Fahrer",
  metaTitle: "ADR Vorbereitung fuer LKW-Fahrer | Einstieg, Fragen und Begriffe",
  metaDescription:
    "ADR Vorbereitung fuer LKW-Fahrer mit kurzem Einstieg, typischen Fragen und klarem Wechsel in den Telegram-Bot.",
  heroKicker: SEO_PAGE_KICKER,
  heroTitle: "ADR Vorbereitung fuer LKW-Fahrer",
  heroLead: "Diese Seite fokussiert jetzt klarer den Intent adr vorbereitung fuer lkw fahrer und bietet einen kompakten Einstieg fuer Menschen, die ADR auf Deutsch besser verstehen und anwenden wollen.",
  heroSupport: "Sie bleibt bewusst kompakt: Orientierung auf der Seite, mehr Tiefe und Wiederholung danach im Telegram-Bot.",
  intentTitle: "Warum dieser Lern-Intent gerade wichtig ist",
  intentParagraphs: [
    "Live-Signale zeigen, dass Nutzer bei diesem Thema einen klaren, anfangerfreundlichen Einstieg suchen statt ueberladener Theorie.",
    "Darum bleibt die Seite fokussiert und conversion-nah: etwas Nutzen direkt sichtbar, mehr Uebung anschliessend im Bot.",
  ],
  sampleTitle: "Gezielte Lernvorschau",
  sampleLead: "2 bis 3 kleine Beispiele oder Mini-Lektionen reichen, um Suchintention und Vertrauen sauber abzudecken.",
  sampleQuestions: [
    {
      question: "Warum brauchen viele Fahrer eine eigene ADR-Einstiegsseite?",
      answer:
        "Weil sie alltagsnah suchen und weniger nach offizieller Kurssprache als nach praktischer Vorbereitung.",
    },
    {
      question: "Was ist der erste sinnvolle Lernschritt?",
      answer:
        "Grundbegriffe, typische Frageformen und regelmaessige Wiederholung im kleinen Umfang.",
    },
    {
      question: "Wofuer ist der Telegram-Bot spaeter da?",
      answer:
        "Fuer mehr Fragen, mehr Wiederholung und einen klareren Trainingsablauf.",
    },
  ],
  sampleTerms: [
    {
      term: "Unterweisung",
      note: "Typischer Begriff rund um Pflichten und Vorbereitung im Fahreralltag.",
    },
    {
      term: "Ausrustung",
      note: "Gemeint ist die mitzufuehrende Sicherheits- und Notfallausstattung.",
    },
    {
      term: "Kontrolle",
      note: "Kommt haeufig in Fragen vor, wenn es um Papiere oder Sichtpruefung geht.",
    },
  ],
  sampleCalloutTitle: "Praxis statt grosser Theorie",
  sampleCalloutText: "Die Vorschau bleibt absichtlich klein. Die eigentliche Wiederholung und Lernroutine liegt im Bot.",
  whyTelegramTitle: "Warum Telegram nach der Vorschau der richtige Schritt ist",
  whyTelegramParagraphs: [
    "Der Bot passt besser zu kurzen Wiederholungseinheiten als eine statische SEO-Seite.",
    "So bleibt die Seite hilfreich fuer Suchende, waehrend der naechste Lernschritt klar und praktisch bleibt.",
  ],
  faqs: [
    {
      question: "Ist diese Seite speziell fuer Berufskraftfahrer gedacht?",
      answer:
        "Ja, sie ist auf den Suchintent von LKW-Fahrern und praktischer ADR-Vorbereitung ausgerichtet.",
    },
    {
      question: "Kann ich damit die ganze Pruefung abdecken?",
      answer:
        "Nein. Die Seite bleibt bewusst kurz. Die groessere Uebung liegt im Bot.",
    },
    {
      question: "Warum ist dieser SEO-Einstieg sinnvoll?",
      answer:
        "Weil er eine enge Suchintention anspricht, die oft weniger umkaempft ist als allgemeine ADR-Keywords.",
    },
  ],
  relatedLinks: [
    { href: "/", label: "Startseite", note: "Zurueck zum Haupt-Landingpage-Flow" },
    {
      href: "/adr-faq-fuer-fahrer",
      label: "ADR FAQ fuer Fahrer",
      note: "Schnelle Antworten fuer Fahrerkontext",
    },
    {
      href: "/adr-pruefung-auf-deutsch",
      label: "ADR-Pruefung auf Deutsch",
      note: "Breiterer Einstieg in Sprache und Fragen",
    },
  ],
  ctaTitle: "Im Telegram-Bot weiterlernen",
  ctaLead: "Wenn du nach dem Einstieg direkt weitermachen willst, ist der Bot der sinnvollste naechste Schritt.",
  ctaButton: SEO_PRIMARY_CTA,
  disclaimer:
    "Diese Seite ist eine Lernvorschau und ersetzt keine offizielle ADR-Ausbildung.",
  telegramSource: "seo_adr_vorbereitung_fuer_lkw_fahrer",
  keywords: [
    "ADR Vorbereitung fuer LKW-Fahrer",
    "ADR lernen Fahrer",
    "ADR fuer Berufskraftfahrer",
    "ADR Fragen Fahrer",
  ],
};

export const adrPruefungFuerNichtMuttersprachler: SeoPageConfig = {
  slug: "adr-pruefung-fuer-nicht-muttersprachler",
  path: "/adr-pruefung-fuer-nicht-muttersprachler",
  pageTitle: "ADR-Pruefung fuer Nicht-Muttersprachler",
  metaTitle: "ADR-Pruefung fuer Nicht-Muttersprachler | Sprache, Fragen und Einstieg",
  metaDescription:
    "Hilfestellung fuer die ADR-Pruefung auf Deutsch fuer Nicht-Muttersprachler: kleine Beispiele, Begriffe und klarer Einstieg in den Telegram-Bot.",
  heroKicker: SEO_PAGE_KICKER,
  heroTitle: "ADR-Pruefung fuer Nicht-Muttersprachler",
  heroLead:
    "Diese Seite ist fuer Menschen gebaut, die den Stoff lernen koennen, aber bei der deutschen Fachsprache ausgebremst werden.",
  heroSupport:
    "Sie verbindet Sprachhilfe, Verstaendnis und ADR-Kontext in einer kompakten Vorschau.",
  intentTitle: "Welche Huerde diese Seite loest",
  intentParagraphs: [
    "Die Suchintention ist sehr konkret: nicht ADR allgemein, sondern ADR auf Deutsch fuer Menschen, die keine Muttersprachler sind. Genau solche Seiten koennen in einer Nische besonders effizient sein.",
    "Statt den Kurs zu kopieren, erklaert die Seite, wo Sprachprobleme liegen und wie der Bot danach beim Ueben hilft.",
  ],
  sampleTitle: "Verstaendnis-Sample",
  sampleLead:
    "Kleine Beispiele zeigen, wie Fachsprache vereinfacht und trotzdem fachlich korrekt bleiben kann.",
  sampleQuestions: [
    {
      question: "Was ist oft schwerer als der eigentliche Inhalt?",
      answer:
        "Die deutsche Fachsprache und die formellen Formulierungen der Fragen.",
    },
    {
      question: "Hilft reine Theorie beim Sprachproblem genug?",
      answer:
        "Oft nicht. Besser ist eine Kombination aus Begriffen, einfachen Erklaerungen und Wiederholung.",
    },
    {
      question: "Warum fuehrt diese Seite in Telegram weiter?",
      answer:
        "Weil dort mehr Wiederholung, mehr Fragen und mehr Lernroutine moeglich sind.",
    },
  ],
  sampleTerms: [
    {
      term: "mitzufuehren",
      note: "Heisst in einfachen Worten: etwas muss beim Transport dabei sein.",
    },
    {
      term: "vorgeschrieben",
      note: "Bedeutet: eine Regel verlangt es verbindlich.",
    },
    {
      term: "unzulaessig",
      note: "Heisst: etwas ist nach den Vorschriften nicht erlaubt.",
    },
  ],
  sampleCalloutTitle: "Sprachhilfe statt Ueberforderung",
  sampleCalloutText:
    "Der Fokus liegt hier auf Verstaendnis. Die tiefere Uebung und Wiederholung liegt bewusst im Bot.",
  whyTelegramTitle: "Warum Telegram danach hilft",
  whyTelegramParagraphs: [
    "Im Bot koennen Begriffe, Fragen und kleine Erklaerungen mehrfach wiederholt werden. Das ist besonders wertvoll fuer Nicht-Muttersprachler.",
    "Die Seite ist der SEO-Einstieg, der Bot ist der Trainingsraum.",
  ],
  faqs: [
    {
      question: "Ist diese Seite nur fuer Auslaender gedacht?",
      answer:
        "Sie ist fuer alle gedacht, die mit deutscher Fachsprache in der ADR-Vorbereitung kaempfen.",
    },
    {
      question: "Wird hier alles vereinfacht?",
      answer:
        "Nein. Die Fachlichkeit bleibt erhalten, aber Begriffe und Einstieg werden lesbarer gemacht.",
    },
    {
      question: "Wie geht es nach dieser Seite weiter?",
      answer:
        "Mit dem Telegram-Bot, der mehr Fragen und mehr Wiederholung bietet.",
    },
  ],
  relatedLinks: [
    { href: "/", label: "Startseite", note: "Zurueck zum Haupt-Landingpage-Flow" },
    {
      href: "/technisches-deutsch-adr",
      label: "Technisches Deutsch fuer ADR",
      note: "Mehr Fokus auf Formulierungen und Fachsprache",
    },
    {
      href: "/adr-pruefung-auf-deutsch",
      label: "ADR-Pruefung auf Deutsch",
      note: "Allgemeiner Einstieg in Fragen und Begriffe",
    },
  ],
  ctaTitle: "Weiterlernen mit dem Telegram-Bot",
  ctaLead:
    "Wenn du mehr Verstaendnis und mehr Uebung brauchst, geht es im Bot mit Wiederholung und Drill weiter.",
  ctaButton: SEO_PRIMARY_CTA,
  disclaimer:
    "Diese Seite ist nur eine Lernhilfe und ersetzt keine offizielle Ausbildung oder Pruefungsvorbereitung.",
  telegramSource: "seo_adr_pruefung_fuer_nicht_muttersprachler",
  keywords: [
    "ADR Pruefung fuer Nicht-Muttersprachler",
    "ADR fuer Auslaender Deutsch",
    "ADR auf Deutsch lernen",
    "ADR Deutsch Hilfe",
  ],
};

export const adrFragenUndAntworten: SeoPageConfig = {
  slug: "adr-fragen-und-antworten",
  path: "/adr-fragen-und-antworten",
  pageTitle: "ADR Fragen und Antworten",
  metaTitle: "ADR Fragen und Antworten | Kleine Vorschau fuer die Vorbereitung",
  metaDescription:
    "Kurze ADR Fragen und Antworten als Vorschau fuer die Vorbereitung. Mit kleinem Sample und Weiterleitung in den Telegram-Bot.",
  heroKicker: SEO_PAGE_KICKER,
  heroTitle: "ADR Fragen und Antworten",
  heroLead:
    "Diese Seite sammelt ein kleines Sample typischer ADR Fragen und Antworten, damit Suchende sofort sehen, wie die Vorbereitung aussieht.",
  heroSupport:
    "Sie ist absichtlich kurz gehalten. Mehr Fragen und mehr Wiederholung liegen im Telegram-Bot.",
  intentTitle: "Warum diese Seite Suchtraffic ziehen kann",
  intentParagraphs: [
    "Viele Menschen suchen direkt nach ADR Fragen und Antworten, nicht nach Kursnamen oder Marken. Diese Suchintention ist eng, konkret und oft guenstiger als breite Hauptkeywords.",
    "Die Seite zeigt genug Substanz, um hilfreich zu sein, aber nicht so viel, dass sie den eigentlichen Trainingswert des Bots ersetzt.",
  ],
  sampleTitle: "Fragen-Sample",
  sampleLead:
    "Ein kleiner Ausschnitt typischer Frageformen hilft Suchenden sofort bei der Einordnung.",
  sampleQuestions: [
    {
      question: "Welche Unterlage muss der Fahrer bei Gefahrguttransport grundsaetzlich mitfuehren?",
      answer:
        "Hauefig geht es hier um das passende Beforderungspapier und weitere vorgeschriebene Unterlagen.",
    },
    {
      question: "Warum sind ADR-Antworten oft schwer zu lesen?",
      answer:
        "Weil die Formulierungen kurz, formal und fachsprachlich sind.",
    },
    {
      question: "Wie lernt man solche Fragen am besten?",
      answer:
        "Mit regelmaessiger Wiederholung, kleinen Einheiten und vielen Beispielen im Bot.",
    },
    {
      question: "Ist diese Seite ein kompletter Fragenkatalog?",
      answer:
        "Nein. Sie zeigt nur eine Vorschau und fuehrt dann weiter.",
    },
  ],
  sampleCalloutTitle: "Wichtiger Unterschied",
  sampleCalloutText:
    "Diese Seite soll Fragen sichtbar machen. Der Bot soll das echte Training liefern.",
  whyTelegramTitle: "Warum Telegram der naechste Schritt ist",
  whyTelegramParagraphs: [
    "Im Bot bekommst du deutlich mehr Fragen, mehr Wiederholung und einen besseren Uebungsfluss als auf einer statischen SEO-Seite.",
    "So bleibt die Seite suchmaschinenfreundlich, waehrend die eigentliche Lernerfahrung tiefer im Bot stattfindet.",
  ],
  faqs: [
    {
      question: "Sind das echte Pruefungsfragen?",
      answer:
        "Es sind Lernbeispiele und Vorschauen, keine offizielle Garantie fuer den realen Pruefungsbogen.",
    },
    {
      question: "Warum sind hier nur wenige Fragen zu sehen?",
      answer:
        "Weil die Seite nur den Einstieg geben soll. Mehr Uebung liegt im Bot.",
    },
    {
      question: "Kann ich damit schon anfangen?",
      answer:
        "Ja. Als schneller Einstieg ist die Seite sinnvoll, danach geht es in Telegram weiter.",
    },
  ],
  relatedLinks: [
    { href: "/", label: "Startseite", note: "Zurueck zum Haupt-Landingpage-Flow" },
    {
      href: "/adr-pruefung-auf-deutsch",
      label: "ADR-Pruefung auf Deutsch",
      note: "Breiter Einstieg in deutsche ADR-Fragen",
    },
    {
      href: "/adr-faq-fuer-fahrer",
      label: "ADR FAQ fuer Fahrer",
      note: "Kurze Antworten auf typische Fahrerfragen",
    },
  ],
  ctaTitle: "Mehr ADR-Fragen im Telegram-Bot",
  ctaLead:
    "Wenn du direkt weiter ueben willst, bekommst du im Bot mehr Fragen und mehr Wiederholung.",
  ctaButton: SEO_PRIMARY_CTA,
  disclaimer:
    "Diese Seite ist eine Vorschau und ersetzt keine offizielle Ausbildung oder Pruefungsvorbereitung.",
  telegramSource: "seo_adr_fragen_und_antworten",
  keywords: [
    "ADR Fragen und Antworten",
    "ADR Fragen Deutsch",
    "ADR Uebungsfragen",
    "ADR Vorbereitung Fragen",
  ],
};

export const adrPruefungsfragenAppDeutsch: SeoPageConfig = {
  slug: "adr-pruefungsfragen-app-deutsch",
  path: "/adr-pruefungsfragen-app-deutsch",
  pageTitle: "ADR Pruefungsfragen App Deutsch",
  metaTitle:
    "ADR Pruefungsfragen App Deutsch | Fragen-Sample und Telegram-Bot",
  metaDescription:
    "Du suchst eine ADR Pruefungsfragen App auf Deutsch? Hier findest du ein kleines Fragen-Sample und den Einstieg in den ADR Bot auf Telegram.",
  heroKicker: SEO_PAGE_KICKER,
  heroTitle: "ADR Pruefungsfragen App Deutsch",
  heroLead: "Diese Seite fokussiert jetzt klarer den Intent adr prüfungsfragen app deutsch und bietet einen kompakten Einstieg fuer Menschen, die ADR auf Deutsch besser verstehen und anwenden wollen.",
  heroSupport: "Sie bleibt bewusst kompakt: Orientierung auf der Seite, mehr Tiefe und Wiederholung danach im Telegram-Bot.",
  intentTitle: "Warum dieser Lern-Intent gerade wichtig ist",
  intentParagraphs: [
    "Live-Signale zeigen, dass Nutzer bei diesem Thema einen klaren, anfangerfreundlichen Einstieg suchen statt ueberladener Theorie.",
    "Darum bleibt die Seite fokussiert und conversion-nah: etwas Nutzen direkt sichtbar, mehr Uebung anschliessend im Bot.",
  ],
  sampleTitle: "Gezielte Lernvorschau",
  sampleLead: "2 bis 3 kleine Beispiele oder Mini-Lektionen reichen, um Suchintention und Vertrauen sauber abzudecken.",
  sampleQuestions: [
    {
      question: "Warum suchen viele Menschen nach einer ADR Pruefungsfragen App auf Deutsch?",
      answer:
        "Weil sie moeglichst schnell mit echten Fragen, Wiederholung und einfacher Bedienung lernen wollen.",
    },
    {
      question: "Ist diese Seite selbst schon die komplette App?",
      answer:
        "Nein. Sie ist die oeffentliche Vorschau. Das eigentliche Training laeuft im Telegram-Bot.",
    },
    {
      question: "Was bringt mir der Bot im Vergleich zu einer statischen Seite?",
      answer:
        "Mehr Fragen, mehr Wiederholung und ein direkterer Trainingsfluss als auf einer reinen SEO-Seite.",
    },
    {
      question: "Ist das nur fuer Muttersprachler gedacht?",
      answer:
        "Nein. Gerade fuer Menschen, die ADR auf Deutsch ueben muessen, ist der Bot als wiederholbares Frageformat sinnvoll.",
    },
  ],
  sampleCalloutTitle: "App-Intent statt Leseseite",
  sampleCalloutText: "Die Vorschau bleibt absichtlich klein. Die eigentliche Wiederholung und Lernroutine liegt im Bot.",
  whyTelegramTitle: "Warum Telegram nach der Vorschau der richtige Schritt ist",
  whyTelegramParagraphs: [
    "Der Bot passt besser zu kurzen Wiederholungseinheiten als eine statische SEO-Seite.",
    "So bleibt die Seite hilfreich fuer Suchende, waehrend der naechste Lernschritt klar und praktisch bleibt.",
  ],
  faqs: [
    {
      question: "Gibt es hier echte ADR Pruefungsfragen auf Deutsch?",
      answer:
        "Hier gibt es ein kleines Sample und den Einstieg in den Bot. Die tiefere Uebung findet im Bot statt.",
    },
    {
      question: "Warum steht im Titel App, wenn es auf Telegram weitergeht?",
      answer:
        "Weil viele Nutzer nach einer einfachen Lern-App suchen. Der Telegram-Bot erfuellt genau diese Funktion fuer unsere Zielgruppe.",
    },
    {
      question: "Kann ich damit direkt anfangen zu lernen?",
      answer:
        "Ja. Die Seite ist der Einstieg, der Bot ist der naechste Schritt fuer das echte Fragen-Training.",
    },
  ],
  relatedLinks: [
    { href: "/", label: "Startseite", note: "Zurueck zum Haupt-Landingpage-Flow" },
    {
      href: "/adr-fragen-und-antworten",
      label: "ADR Fragen und Antworten",
      note: "Breiterer Einstieg in typische Fragen",
    },
    {
      href: "/adr-pruefung-auf-deutsch",
      label: "ADR-Pruefung auf Deutsch",
      note: "Allgemeiner Einstieg in Begriffe, Fragen und Sprache",
    },
  ],
  ctaTitle: "Im Telegram-Bot weiterlernen",
  ctaLead: "Wenn du nach dem Einstieg direkt weitermachen willst, ist der Bot der sinnvollste naechste Schritt.",
  ctaButton: SEO_PRIMARY_CTA,
  disclaimer:
    "Diese Seite ist eine oeffentliche Vorschau und ersetzt keine offizielle Ausbildung oder Pruefungsvorbereitung.",
  telegramSource: "seo_adr_pruefungsfragen_app_deutsch",
  keywords: [
    "ADR Pruefungsfragen App Deutsch",
    "ADR App Deutsch",
    "ADR Lern App Fragen",
    "ADR Fragen App Deutsch",
  ],
};

export const adrFragenAufDeutsch: SeoPageConfig = {
  slug: "adr-fragen-auf-deutsch",
  path: "/adr-fragen-auf-deutsch",
  pageTitle: "ADR Fragen auf Deutsch",
  metaTitle: "ADR Fragen auf Deutsch | Formulierungen verstehen und ueben",
  metaDescription:
    "Uebungsnahe ADR Fragen auf Deutsch mit kurzem Sample, typischen Formulierungen und klarem Weiterweg in den Telegram-Bot.",
  heroKicker: SEO_PAGE_KICKER,
  heroTitle: "ADR Fragen auf Deutsch",
  heroLead:
    "Diese Seite sammelt typische ADR Fragen auf Deutsch in kleiner Vorschauform, damit du Formulierungen schneller verstehst und gezielt weiterlernst.",
  heroSupport:
    "Sie ist als oeffentlicher Einstieg gedacht. Fuer mehr Fragen und Wiederholung geht es in den Telegram-Bot.",
  intentTitle: "Warum diese Suche wichtig ist",
  intentParagraphs: [
    "Viele Suchende kennen das Fachthema schon grob, scheitern aber an der Formulierung der Fragen. Genau diese Suchintention faengt die Seite ab.",
    "Google soll hier sehen, dass ADR Bot nicht nur allgemeine ADR-Inhalte bietet, sondern konkrete Hilfe fuer deutschsprachige Fragen und deren Verstaendnis.",
  ],
  sampleTitle: "Kleines Fragen-Sample",
  sampleLead:
    "Ein paar typische Frageformen reichen, um Relevanz zu zeigen und die tieferen Uebungen im Bot zu lassen.",
  sampleQuestions: [
    {
      question: "Welche Unterlage muss der Fahrer grundsaetzlich mitfuehren?",
      answer:
        "Oft geht es in solchen Fragen um Beforderungspapiere und andere vorgeschriebene Begleitunterlagen.",
    },
    {
      question: "Warum wirken ADR Fragen auf Deutsch so schwer?",
      answer:
        "Nicht nur wegen des Stoffs, sondern weil die Sprache knapp, technisch und pruefungsnah formuliert ist.",
    },
    {
      question: "Was bringt regelmaessiges Fragen-Training?",
      answer:
        "Du erkennst typische Satzmuster schneller und antwortest sicherer unter Pruefungsdruck.",
    },
  ],
  sampleTerms: [
    { term: "Antwortmoeglichkeit", note: "Die Auswahloption in typischen Uebungsfragen." },
    { term: "Beforderungspapier", note: "Ein haeufig abgefragter Begriff in ADR-Fragen." },
    { term: "Kennzeichnung", note: "Klassischer Themenblock in Theoriefragen." },
    { term: "Pflichtangabe", note: "Hinweis auf Informationen, die nicht fehlen duerfen." },
  ],
  sampleCalloutTitle: "Wichtig fuer Suchende",
  sampleCalloutText:
    "Die Seite beantwortet nicht alles. Sie zeigt nur genug, damit der Bot als naechster Schritt logisch wird.",
  whyTelegramTitle: "Warum der Bot danach sinnvoll ist",
  whyTelegramParagraphs: [
    "Der Bot liefert mehr Fragen, mehr Wiederholung und mehr Tempo beim Lernen als eine statische Seite.",
    "So bleibt diese Seite stark fuer Google und Orientierung, waehrend die eigentliche Pruefungspraxis im Bot passiert.",
  ],
  faqs: [
    {
      question: "Sind das echte ADR Fragen?",
      answer:
        "Es sind lernorientierte Beispiel-Fragen und Formulierungen, nicht die offizielle Pruefung selbst.",
    },
    {
      question: "Wo kann ich mehr ueben?",
      answer:
        "Im Telegram-Bot geht es mit mehr Fragen und einem vollstaendigeren Trainingsfluss weiter.",
    },
  ],
  relatedLinks: [
    { href: "/", label: "Startseite", note: "Zum Haupt-Einstieg zurueck" },
    {
      href: "/adr-fragen-und-antworten",
      label: "ADR Fragen und Antworten",
      note: "Breiterer Fragen-Einstieg mit kurzen Erklaerungen",
    },
    {
      href: "/adr-pruefungsfragen-app-deutsch",
      label: "ADR Pruefungsfragen App Deutsch",
      note: "App-intent fuer konkrete Lernhilfe",
    },
  ],
  ctaTitle: "Mehr ADR Fragen direkt im Bot",
  ctaLead:
    "Wenn du nach ADR Fragen auf Deutsch suchst, bekommst du im Bot mehr Wiederholung und einen klareren Lernpfad.",
  ctaButton: SEO_PRIMARY_CTA,
  disclaimer:
    "Diese Seite ist eine Lernvorschau. Sie ersetzt keine offizielle Schulung und keine behördliche Vorbereitung.",
  telegramSource: "seo_adr_fragen_auf_deutsch",
  keywords: [
    "ADR Fragen auf Deutsch",
    "ADR Fragen Deutsch",
    "ADR Formulierungen Deutsch",
    "ADR Fragen lernen",
  ],
};

export const adrFachbegriffeDeutsch: SeoPageConfig = {
  slug: "adr-fachbegriffe-deutsch",
  path: "/adr-fachbegriffe-deutsch",
  pageTitle: "ADR Fachbegriffe Deutsch",
  metaTitle: "ADR Fachbegriffe Deutsch | Woerter fuer die Pruefung",
  metaDescription:
    "Wichtige ADR Fachbegriffe auf Deutsch mit kurzen Erklaerungen fuer Fahrer, Lernende und Nicht-Muttersprachler.",
  heroKicker: SEO_PAGE_KICKER,
  heroTitle: "ADR Fachbegriffe Deutsch",
  heroLead: "Diese Seite fokussiert jetzt klarer den Intent adr fachbegriffe deutsch und zeigt einen kleinen, nuetzlichen Wortschatz-Ausschnitt fuer ADR auf Deutsch.",
  heroSupport: "Sie soll Suchende schnell orientieren, Vertrauen aufbauen und danach sauber in den Telegram-Bot weiterfuehren.",
  intentTitle: "Warum dieser Wortschatz-Intent gerade wichtig ist",
  intentParagraphs: [
    "Live-Signale zeigen, dass Nutzer fuer diesen Begriffsbereich einfache, praktische Orientierung suchen statt langer Theorie.",
    "Darum bleibt die Seite kompakt und hilfreich: genug Inhalt fuer Vertrauen und Suchintention, mehr Drill spaeter im Bot.",
  ],
  sampleTitle: "Gezielte Wortschatz-Vorschau",
  sampleLead: "6 bis 10 Begriffe genuegen, um Nutzen und Suchintention sauber zu bedienen.",
  sampleTerms: [
    { term: "Gefahrzettel", note: "Sichtbare Kennzeichnung fuer eine Gefahrgut-Klasse." },
    { term: "Verpackungsgruppe", note: "Hilft bei der Einordnung des Gefahrenpotenzials." },
    { term: "Befuellung", note: "Wichtiger Begriff in Tank- und Handlingsituationen." },
    { term: "Freistellung", note: "Fall mit reduziertem Regelumfang innerhalb der Vorschriften." },
    { term: "Tunnelschild", note: "Relevanter Hinweis fuer die Streckenwahl." },
  ],
  sampleCalloutTitle: "Lernen ueber Sprache",
  sampleCalloutText: "Die oeffentliche Seite bleibt bewusst kompakt. Fuer mehr Begriffe, Wiederholung und Drill geht es danach in Telegram weiter.",
  whyTelegramTitle: "Warum Telegram nach der Vorschau der richtige Schritt ist",
  whyTelegramParagraphs: [
    "Im Bot laesst sich Wortschatz besser wiederholen als auf einer statischen SEO-Seite.",
    "So bleibt die Seite hilfreich fuer Google und Nutzer, waehrend die eigentliche Lerntiefe im Bot liegt.",
  ],
  faqs: [
    {
      question: "Ist das ein komplettes ADR Lexikon?",
      answer:
        "Nein. Es ist eine fokussierte Vorschau mit den wichtigsten Begriffen und klarer Weiterleitung in den Bot.",
    },
  ],
  relatedLinks: [
    { href: "/", label: "Startseite", note: "Zur Hauptseite zurueck" },
    {
      href: "/adr-begriffe",
      label: "ADR Begriffe",
      note: "Breitere Vorschauseite fuer ADR-Wortschatz",
    },
    {
      href: "/technisches-deutsch-adr",
      label: "Technisches Deutsch ADR",
      note: "Sprache und Verstaendnis im Pruefungskontext",
    },
  ],
  ctaTitle: "ADR-Wortschatz im Telegram-Bot weiterlernen",
  ctaLead: "Wenn der kleine Ausschnitt hilfreich war, geht der naechste sinnvolle Schritt in den Bot mit mehr Begriffen und mehr Wiederholung.",
  ctaButton: SEO_PRIMARY_CTA,
  disclaimer:
    "Diese Seite dient der Orientierung und ersetzt kein vollstaendiges Fachwoertertraining.",
  telegramSource: "seo_adr_fachbegriffe_deutsch",
  keywords: [
    "ADR Fachbegriffe Deutsch",
    "ADR Fachwoerter",
    "Gefahrgut Fachbegriffe Deutsch",
    "ADR Terminologie Deutsch",
  ],
};

export const adrDeutschFuerLkwFahrer: SeoPageConfig = {
  slug: "adr-deutsch-fuer-lkw-fahrer",
  path: "/adr-deutsch-fuer-lkw-fahrer",
  pageTitle: "ADR Deutsch fuer LKW-Fahrer",
  metaTitle: "ADR Deutsch fuer LKW-Fahrer | Sprache fuer Theorie und Praxis",
  metaDescription:
    "ADR Deutsch fuer LKW-Fahrer: typische Begriffe, Frageformen und sprachliche Hilfe fuer die Vorbereitung auf die ADR-Pruefung.",
  heroKicker: SEO_PAGE_KICKER,
  heroTitle: "ADR Deutsch fuer LKW-Fahrer",
  heroLead:
    "Diese Seite richtet sich an LKW-Fahrer, die ADR nicht nur fachlich, sondern auch sprachlich besser verstehen wollen.",
  heroSupport:
    "Sie kombiniert Sprachhilfe, Vorschaufragen und den klaren Uebergang in den Telegram-Bot.",
  intentTitle: "Weshalb diese Seite relevant ist",
  intentParagraphs: [
    "Viele Fahrer suchen keine allgemeine Sprachseite, sondern genau die Mischung aus Berufsdeutsch, Fachbegriffen und pruefungsnahen ADR-Formulierungen.",
    "Diese Long-Tail-Seite holt genau diese Suche ab und positioniert ADR Bot als praktische Lernhilfe fuer Fahrer.",
  ],
  sampleTitle: "Typische Fahrer-Perspektive",
  sampleLead:
    "Hier geht es nicht um akademische Theorie, sondern um Sprache, die in Schulung, Unterlagen und Fragen vorkommt.",
  sampleQuestions: [
    {
      question: "Welche Woerter sind fuer Fahrer am wichtigsten?",
      answer:
        "Haefig wiederkehren Begriffe wie Kennzeichnung, Papiere, Ladung, Freistellung und Gefahrzettel.",
    },
    {
      question: "Warum hilft Sprachtraining beim Bestehen?",
      answer:
        "Weil viele Fehler nicht aus fehlendem Wissen, sondern aus Missverstaendnissen in der Frage entstehen.",
    },
  ],
  sampleTerms: [
    { term: "Ladungssicherung", note: "Praktischer Kernbegriff fuer den Fahreralltag." },
    { term: "Pflichtdokument", note: "Unterlage, die im Transport mitzufuehren ist." },
    { term: "Fahrzeugkennzeichnung", note: "Sichtbare ADR-relevante Markierung." },
    { term: "Unterweisung", note: "Wichtiger Lern- und Schulungsbegriff." },
  ],
  whyTelegramTitle: "Warum der Bot hier besonders stark ist",
  whyTelegramParagraphs: [
    "Der Bot passt gut zu Fahrern, weil kurze Lernschritte und Wiederholung besser in den Alltag passen als lange Theorieblöcke.",
    "So bleibt die Seite der Google-Einstieg, waehrend der Bot die eigentliche Trainingsroutine liefert.",
  ],
  relatedLinks: [
    { href: "/", label: "Startseite", note: "Zurueck zum Haupt-Einstieg" },
    {
      href: "/adr-vorbereitung-fuer-lkw-fahrer",
      label: "ADR Vorbereitung fuer LKW-Fahrer",
      note: "Der direkt benachbarte Vorbereitungs-Intent",
    },
    {
      href: "/technisches-deutsch-adr",
      label: "Technisches Deutsch ADR",
      note: "Sprachfokus fuer technische Formulierungen",
    },
  ],
  ctaTitle: "ADR Deutsch direkt im Bot ueben",
  ctaLead:
    "Wenn du als Fahrer schnell und praxisnah lernen willst, geht es im Bot mit dem eigentlichen Training weiter.",
  ctaButton: SEO_PRIMARY_CTA,
  disclaimer:
    "Die Seite bietet nur einen oeffentlichen Einstieg und ersetzt keine vollstaendige Ausbildung.",
  telegramSource: "seo_adr_deutsch_fuer_lkw_fahrer",
  keywords: [
    "ADR Deutsch fuer LKW Fahrer",
    "ADR Deutsch Fahrer",
    "Gefahrgut Deutsch fuer Fahrer",
    "ADR Sprache fuer LKW Fahrer",
  ],
};

export const adrPruefungDeutschLernen: SeoPageConfig = {
  slug: "adr-pruefung-deutsch-lernen",
  path: "/adr-pruefung-deutsch-lernen",
  pageTitle: "ADR Pruefung Deutsch lernen",
  metaTitle: "ADR Pruefung Deutsch lernen | Sprache trainieren und wiederholen",
  metaDescription:
    "ADR Pruefung auf Deutsch lernen mit Fokus auf Sprachverstaendnis, Wiederholung und kleine Lernschritte im Telegram-Bot.",
  heroKicker: SEO_PAGE_KICKER,
  heroTitle: "ADR Pruefung Deutsch lernen",
  heroLead:
    "Diese Seite ist fuer Menschen gedacht, die nicht nur Orientierung suchen, sondern die ADR-Pruefung auf Deutsch wirklich Schritt fuer Schritt lernen wollen.",
  heroSupport:
    "Sie verbindet Suchintention, Sprachhilfe und einen direkten Uebergang in den Telegram-Bot.",
  intentTitle: "Was Google hier verstehen soll",
  intentParagraphs: [
    "Nicht jeder sucht nach Kursnamen. Viele Nutzer suchen ganz direkt nach der Aufgabe: ADR Pruefung auf Deutsch lernen. Dahinter steckt meist Lernabsicht, nicht nur Informationssuche.",
    "Genau deshalb ist diese Seite enger als die allgemeine ADR-Pruefung-auf-Deutsch-Seite: weniger Uebersicht, mehr Fokus auf Sprache, Wiederholung und kleinen Lernfortschritt.",
  ],
  sampleTitle: "Lernen in kleinen Schritten",
  sampleLead:
    "Eine kurze Vorschau reicht fuer Verstaendnis und erzeugt den naechsten Schritt in Richtung Bot.",
  sampleQuestions: [
    {
      question: "Was ist der beste Einstieg ins Lernen?",
      answer:
        "Mit den wichtigsten Begriffen, einfachen Fragen und regelmaessiger Wiederholung.",
    },
    {
      question: "Warum auf Deutsch ueben?",
      answer:
        "Weil die Pruefung selbst ueber Sprache und Fachverstaendnis laeuft.",
    },
  ],
  sampleTerms: [
    { term: "Uebungsfrage", note: "Kleine wiederholbare Frage fuer den Lernfluss." },
    { term: "Fachsprache", note: "Die formelle Sprache der ADR-Unterlagen und Fragen." },
    { term: "Pruefungsvorbereitung", note: "Das gezielte Lernen vor Theorie und Test." },
    { term: "Wiederholung", note: "Entscheidend fuer das Behalten der Formulierungen." },
  ],
  whyTelegramTitle: "Warum danach Telegram",
  whyTelegramParagraphs: [
    "Im Bot geht Lernen in kleinen Einheiten weiter, was fuer Sprach- und Frage-Training besonders gut funktioniert.",
    "Die oeffentliche Seite zeigt nur die Richtung. Der Bot uebernimmt die eigentliche Lernroutine.",
  ],
  faqs: [
    {
      question: "Worin unterscheidet sich diese Seite von einer allgemeinen ADR-Pruefungsseite?",
      answer:
        "Hier geht es staerker um das Lernen selbst: Sprachverstaendnis, kleine Schritte und Wiederholung, nicht nur um einen allgemeinen Ueberblick.",
    },
    {
      question: "Ist diese Seite fuer Menschen mit schwachem Deutsch geeignet?",
      answer:
        "Ja. Genau fuer diese Lernlage ist sie gedacht: erst Sprache und Formulierungen sicherer machen, dann mehr Fragen im Bot trainieren.",
    },
    {
      question: "Was ist nach dieser Vorschau der sinnvollste Schritt?",
      answer:
        "Direkt in den Telegram-Bot wechseln und dort mit kurzen Frageblöcken und Wiederholung weitermachen.",
    },
  ],
  relatedLinks: [
    {
      href: "/adr-pruefung-auf-deutsch",
      label: "ADR-Pruefung auf Deutsch",
      note: "Wenn du erst den groesseren Gesamtueberblick sehen willst",
    },
    {
      href: "/technisches-deutsch-adr",
      label: "Technisches Deutsch fuer ADR",
      note: "Sprachfokus fuer schwierige Begriffe und Formulierungen",
    },
    {
      href: "/adr-deutsch-ueben",
      label: "ADR Deutsch ueben",
      note: "Wenn du aus Lernen direkt in aktive Wiederholung gehen willst",
    },
  ],
  ctaTitle: "Jetzt mit ADR auf Deutsch starten",
  ctaLead:
    "Wenn du nicht nur lesen, sondern wirklich lernen willst, fuehrt der naechste Schritt direkt in den Bot.",
  ctaButton: SEO_PRIMARY_CTA,
  disclaimer:
    "Diese Seite ist ein SEO- und Lern-Einstieg, nicht die komplette Ausbildung.",
  telegramSource: "seo_adr_pruefung_deutsch_lernen",
  keywords: [
    "ADR Pruefung Deutsch lernen",
    "ADR auf Deutsch lernen",
    "ADR Pruefung Sprache lernen",
    "ADR Deutsch lernen Wiederholung",
  ],
};

export const gefahrgutPruefungAufDeutsch: SeoPageConfig = {
  slug: "gefahrgut-pruefung-auf-deutsch",
  path: "/gefahrgut-pruefung-auf-deutsch",
  pageTitle: "Gefahrgut Pruefung auf Deutsch",
  metaTitle: "Gefahrgut Pruefung auf Deutsch | Einstieg fuer ADR-Lernende",
  metaDescription:
    "Gefahrgut Pruefung auf Deutsch verstehen: typische Begriffe, Lernhinweise und der schnelle Weiterweg in den ADR Telegram-Bot.",
  heroKicker: SEO_PAGE_KICKER,
  heroTitle: "Gefahrgut Pruefung auf Deutsch",
  heroLead:
    "Wer eher nach Gefahrgut als nach ADR sucht, landet oft spaeter trotzdem bei derselben Vorbereitung. Diese Seite schliesst genau diese Luecke.",
  heroSupport:
    "So holen wir Suchende ab, die das Themenfeld kennen, aber den offiziellen ADR-Begriff noch nicht aktiv nutzen.",
  intentTitle: "Warum Gefahrgut als Suchwort wichtig ist",
  intentParagraphs: [
    "Im Alltag suchen viele Nutzer zuerst nach Gefahrgut-Pruefung oder Gefahrgut auf Deutsch, obwohl inhaltlich ADR gemeint ist.",
    "Diese Seite erweitert deshalb unsere Reichweite in die gleiche Nische, aber ueber alltagsnaehere Suchbegriffe.",
  ],
  sampleTitle: "Gefahrgut-Sample",
  sampleLead:
    "Kleine Beispielinhalte machen den Uebergang von allgemeinem Gefahrgut-Intent zu konkreter ADR-Vorbereitung leicht.",
  sampleTerms: [
    { term: "Gefahrgut", note: "Alltagsnahes Einstiegswort fuer den ADR-Kontext." },
    { term: "Transportregel", note: "Regel, die beim Befordern zu beachten ist." },
    { term: "Kennzeichen", note: "Sichtbarer Hinweis auf die Art der Gefahr." },
    { term: "Sicherheitsabstand", note: "Praxisnaher Begriff fuer sicheres Verhalten." },
  ],
  whyTelegramTitle: "Warum der Bot danach Sinn ergibt",
  whyTelegramParagraphs: [
    "Im Bot wird aus allgemeinem Gefahrgut-Interesse ein konkreter ADR-Lernpfad mit Fragen und Wiederholung.",
    "Die Seite selbst bleibt klein und sauber, damit sie schnell indexiert werden kann.",
  ],
  relatedLinks: [
    { href: "/", label: "Startseite", note: "Zurueck zum Haupteinstieg" },
    {
      href: "/gefahrgut-deutsch-lernen",
      label: "Gefahrgut Deutsch lernen",
      note: "Verwandter Sprach- und Lernfokus",
    },
    {
      href: "/adr-pruefung-auf-deutsch",
      label: "ADR Pruefung auf Deutsch",
      note: "Der direktere ADR-Einstieg",
    },
  ],
  ctaTitle: "Gefahrgut-Verstaendnis in ADR-Training umwandeln",
  ctaLead:
    "Wenn du ueber Gefahrgut gesucht hast, kannst du im Bot jetzt mit echter ADR-Vorbereitung weitermachen.",
  ctaButton: SEO_PRIMARY_CTA,
  disclaimer:
    "Die Seite ist ein Einstieg in den Themenbereich und ersetzt kein vollstaendiges Training.",
  telegramSource: "seo_gefahrgut_pruefung_auf_deutsch",
  keywords: [
    "Gefahrgut Pruefung auf Deutsch",
    "Gefahrgut Deutsch Pruefung",
    "Gefahrgut lernen Deutsch",
    "ADR Gefahrgut Pruefung",
  ],
};

export const adrAppFuerAuslaender: SeoPageConfig = {
  slug: "adr-app-fuer-auslaender",
  path: "/adr-app-fuer-auslaender",
  pageTitle: "ADR App fuer Auslaender",
  metaTitle: "ADR App fuer Auslaender | Deutsch lernen und Fragen verstehen",
  metaDescription:
    "ADR App fuer Auslaender: einfache Lernhilfe auf Deutsch mit Fragen, Begriffen und Telegram-Bot als naechstem Schritt.",
  heroKicker: SEO_PAGE_KICKER,
  heroTitle: "ADR App fuer Auslaender",
  heroLead:
    "Diese Seite richtet sich an Menschen, die die ADR-Pruefung in Deutschland schaffen wollen, aber mit der deutschen Fachsprache kaempfen.",
  heroSupport:
    "Sie verbindet Suchintention, Sprachhilfe und einen klaren Einstieg in den Telegram-Bot.",
  intentTitle: "Worum es bei dieser Suche wirklich geht",
  intentParagraphs: [
    "Hinter dieser Suchanfrage steckt meistens nicht Technik, sondern Sprachbarriere: Fragen verstehen, Fachwoerter merken, sicher antworten.",
    "Genau deshalb ist diese Seite wichtig. Sie macht ADR Bot fuer Nicht-Muttersprachler direkt auffindbar und verstaendlich.",
  ],
  sampleTitle: "Sprachhilfe im kleinen Format",
  sampleLead:
    "Ein kleines Sample reicht, damit Suchende sehen: Das ist nicht nur ADR, sondern ADR auf verstaendlichem Deutsch.",
  sampleQuestions: [
    {
      question: "Ist das fuer Menschen mit einfachem Deutsch geeignet?",
      answer:
        "Ja. Der Fokus liegt auf Verstaendnis, Wiederholung und klaren Formulierungen statt komplizierter Theorie.",
    },
    {
      question: "Warum ist eine App oder ein Bot hilfreich?",
      answer:
        "Weil kurze Einheiten und Wiederholung beim Lernen in einer Zweitsprache besonders gut funktionieren.",
    },
  ],
  sampleTerms: [
    { term: "einfach erklaert", note: "Der Kern der Suchintention hinter dieser Seite." },
    { term: "Fachsprache", note: "Das eigentliche Hindernis fuer viele Lernende." },
    { term: "Wiederholung", note: "Hilft beim Verankern schwieriger Begriffe." },
    { term: "Pruefungsfrage", note: "Ziel der Vorbereitung in der Alltagssprache." },
  ],
  whyTelegramTitle: "Warum der Bot der richtige Weiterweg ist",
  whyTelegramParagraphs: [
    "Der Bot eignet sich gut fuer Lernende mit Sprachbarriere, weil er kurze, wiederholbare Einheiten statt langer Textbloecke bietet.",
    "So bauen wir einen klaren Uebergang von der Google-Suche in die eigentliche Lernroutine.",
  ],
  relatedLinks: [
    { href: "/", label: "Startseite", note: "Zur Hauptseite zurueck" },
    {
      href: "/adr-pruefung-fuer-nicht-muttersprachler",
      label: "ADR Pruefung fuer Nicht-Muttersprachler",
      note: "Direkt verwandter Suchintent",
    },
    {
      href: "/adr-pruefungsfragen-app-deutsch",
      label: "ADR Pruefungsfragen App Deutsch",
      note: "App-Fokus fuer Fragen auf Deutsch",
    },
  ],
  ctaTitle: "Einfacher mit ADR auf Deutsch starten",
  ctaLead:
    "Wenn du nach einer ADR App fuer Auslaender suchst, ist der Telegram-Bot der naechste logische Schritt.",
  ctaButton: SEO_PRIMARY_CTA,
  disclaimer:
    "Die Seite ist eine Lernhilfe und keine offizielle App oder behördliche Schulung.",
  telegramSource: "seo_adr_app_fuer_auslaender",
  keywords: [
    "ADR App fuer Auslaender",
    "ADR App fuer Nicht Muttersprachler",
    "ADR Deutsch App Auslaender",
    "ADR Lernen fuer Auslaender",
  ],
};

export const adrTelegramBotDeutsch: SeoPageConfig = {
  slug: "adr-telegram-bot-deutsch",
  path: "/adr-telegram-bot-deutsch",
  pageTitle: "ADR Telegram Bot Deutsch",
  metaTitle: "ADR Telegram Bot Deutsch | Fragen und Begriffe im Chat lernen",
  metaDescription:
    "ADR Telegram Bot auf Deutsch: Fragen, Begriffe und Wiederholung im Chat fuer Fahrer und Lernende.",
  heroKicker: SEO_PAGE_KICKER,
  heroTitle: "ADR Telegram Bot Deutsch",
  heroLead:
    "Wer direkt nach einem ADR Telegram Bot auf Deutsch sucht, will meistens eine einfache, schnelle Lernhilfe ohne grosse Plattform-Huerden.",
  heroSupport:
    "Diese Seite verbindet genau diesen Intent mit einer klaren, indexierbaren Einstiegsflaeche.",
  intentTitle: "Warum dieser Suchbegriff wertvoll ist",
  intentParagraphs: [
    "Das ist ein sehr konkreter Suchintent mit hoher Naehe zur Conversion, weil die Loesung bereits im Suchsatz mitgedacht wird.",
    "Genau deshalb sollte Google fuer diesen Begriff nicht nur die Startseite, sondern eine eigene, passend benannte Zielseite sehen. Hier geht es um den Kanal und das Format, nicht um allgemeine Lernhilfe.",
  ],
  sampleTitle: "So passt der Bot zum Suchintent",
  sampleLead:
    "Die Seite erklaert kurz den Nutzen des Bots und laesst das eigentliche Training bewusst im Telegram-Flow.",
  sampleQuestions: [
    {
      question: "Warum Telegram statt klassischer App?",
      answer:
        "Telegram ist niedrigschwellig, schnell erreichbar und gut fuer kurze Lernschritte geeignet.",
    },
    {
      question: "Was lernt man im Bot?",
      answer:
        "Vor allem Fragen, Begriffe und Wiederholungen rund um ADR auf Deutsch.",
    },
  ],
  sampleTerms: [
    { term: "Chat-Lernen", note: "Kurze Lernimpulse im Messenger statt langer Plattformwege." },
    { term: "Drill", note: "Wiederholung zur Festigung von Fragen und Begriffen." },
    { term: "Lernhilfe", note: "Der Suchintent hinter der Telegram-Lösung." },
    { term: "Einstieg", note: "Die Seite macht den ersten Schritt klar und leicht." },
  ],
  whyTelegramTitle: "Warum Telegram hier der Haupt-CTA bleibt",
  whyTelegramParagraphs: [
    "Suchende nach einem Telegram Bot sollten ohne Umweg direkt in denselben Kanal wechseln koennen.",
    "Genau deshalb ist diese Seite nicht nur fuer SEO, sondern auch fuer Conversion sehr stark.",
  ],
  faqs: [
    {
      question: "Warum gibt es dafuer eine eigene Seite und nicht nur die Startseite?",
      answer:
        "Weil der Suchintent sehr konkret ist: Nutzer wollen direkt einen ADR Telegram Bot finden und nicht erst allgemein nach Lernhilfe suchen.",
    },
    {
      question: "Ist Telegram hier nur ein Kontaktkanal oder das eigentliche Lernformat?",
      answer:
        "Telegram ist das eigentliche Lernformat. Dort laufen Fragen, Begriffe und Wiederholung direkt im Chat.",
    },
    {
      question: "Worin unterscheidet sich diese Seite von allgemeiner ADR Lernhilfe?",
      answer:
        "Diese Seite verkauft den konkreten Kanal Telegram. Allgemeine Lernhilfe-Seiten erklaeren eher den Einstieg und die Struktur des Lernens.",
    },
  ],
  relatedLinks: [
    {
      href: "/adr-pruefungsfragen-app-deutsch",
      label: "ADR Pruefungsfragen App Deutsch",
      note: "App-intent mit aehnlicher Suchlogik",
    },
    {
      href: "/adr-lernhilfe-deutsch",
      label: "ADR Lernhilfe Deutsch",
      note: "Breitere Lernhilfe fuer Einstieg, Struktur und Grundverstaendnis",
    },
    {
      href: "/adr-fragen-auf-deutsch",
      label: "ADR Fragen auf Deutsch",
      note: "Fragenfokus fuer deutschsprachige Lernende",
    },
  ],
  ctaTitle: "Direkt in den ADR Telegram Bot wechseln",
  ctaLead:
    "Wenn du genau danach gesucht hast, fuehrt der naechste Schritt ohne Umweg direkt in Telegram.",
  ctaButton: SEO_PRIMARY_CTA,
  disclaimer:
    "Diese Seite dient als oeffentlicher SEO-Einstieg fuer den Bot und ersetzt keine offizielle Schulung.",
  telegramSource: "seo_adr_telegram_bot_deutsch",
  keywords: [
    "ADR Telegram Bot Deutsch",
    "ADR Bot Telegram",
    "Telegram Bot ADR Deutsch",
    "ADR lernen Telegram",
  ],
};

export const adrPruefungsfragenLernen: SeoPageConfig = {
  slug: "adr-pruefungsfragen-lernen",
  path: "/adr-pruefungsfragen-lernen",
  pageTitle: "ADR Pruefungsfragen lernen",
  metaTitle: "ADR Pruefungsfragen lernen | Uebung und Wiederholung",
  metaDescription:
    "ADR Pruefungsfragen lernen mit kleinem oeffentlichen Sample und klarem Einstieg in den Telegram-Bot fuer mehr Uebung.",
  heroKicker: SEO_PAGE_KICKER,
  heroTitle: "ADR Pruefungsfragen lernen",
  heroLead: "Diese Seite fokussiert jetzt klarer den Intent adr pruefungsfragen lernen und zeigt eine kleine, glaubwuerdige Fragen-Vorschau fuer ADR auf Deutsch.",
  heroSupport: "Sie soll Suchende schnell orientieren und danach direkt in den Bot fuer echtes Ueben weiterleiten.",
  intentTitle: "Warum dieser Fragen-Intent gerade wichtig ist",
  intentParagraphs: [
    "Live-Signale zeigen, dass Nutzer bei diesem Intent moeglichst schnell in konkrete Fragen und Antwortmuster einsteigen wollen.",
    "Darum zeigt die Seite nur ein kleines Sample, waehrend der Bot den eigentlichen Drill und die Wiederholung uebernimmt.",
  ],
  sampleTitle: "Gezielte Fragen-Vorschau",
  sampleLead: "3 bis 5 Beispiel-Fragen reichen, um den Nutzen sichtbar zu machen und den Rest im Bot zu lassen.",
  sampleQuestions: [
    {
      question: "Wie lernt man Pruefungsfragen effizienter?",
      answer:
        "Durch kurze Durchlaeufe, Wiederholung und Fokus auf typische Satzmuster.",
    },
    {
      question: "Warum reichen einfache Listen oft nicht aus?",
      answer:
        "Weil erst das aktive Wiederholen und Abfragen das Gelernte stabil macht.",
    },
  ],
  sampleTerms: [
    { term: "Wiederholung", note: "Der Kern wirksamer Vorbereitung." },
    { term: "Satzmuster", note: "Wichtige Struktur vieler ADR-Fragen." },
    { term: "Abfrage", note: "Aktiver Schritt statt reinem Lesen." },
    { term: "Lernrhythmus", note: "Kurze Einheiten schlagen oft lange Sessions." },
  ],
  whyTelegramTitle: "Warum Telegram nach der Vorschau der richtige Schritt ist",
  whyTelegramParagraphs: [
    "Fragen und Antwortmuster lassen sich im Bot besser wiederholen als auf einer statischen Seite.",
    "Die Seite bleibt klar und suchorientiert, der Bot uebernimmt die eigentliche Trainingslogik.",
  ],
  relatedLinks: [
    { href: "/", label: "Startseite", note: "Zur Hauptseite zurueck" },
    {
      href: "/adr-pruefungsfragen-app-deutsch",
      label: "ADR Pruefungsfragen App Deutsch",
      note: "App-orientierter Einstieg fuer denselben Kernintent",
    },
    {
      href: "/adr-fragen-und-antworten",
      label: "ADR Fragen und Antworten",
      note: "Breiter Fragencluster mit FAQ-Nutzen",
    },
  ],
  ctaTitle: "ADR-Fragen im Telegram-Bot weiterueben",
  ctaLead: "Wenn du nach dem Sample direkt weiterlernen willst, bringt dich der Bot schneller in echte Wiederholung.",
  ctaButton: SEO_PRIMARY_CTA,
  disclaimer:
    "Diese Seite ist eine Vorschau fuer Lernende und keine offizielle Pruefungsplattform.",
  telegramSource: "seo_adr_pruefungsfragen_lernen",
  keywords: [
    "ADR Pruefungsfragen lernen",
    "ADR Fragen lernen",
    "ADR Pruefung Fragen ueben",
    "ADR Lernfragen",
  ],
};

export const adrTestDeutsch: SeoPageConfig = {
  slug: "adr-test-deutsch",
  path: "/adr-test-deutsch",
  pageTitle: "ADR Test Deutsch",
  metaTitle: "ADR Test Deutsch | Probeformat und Selbstcheck | ADR Bot",
  metaDescription:
    "ADR Test auf Deutsch mit kleinem Probeformat, Selbstcheck-Charakter und direktem Einstieg in den Telegram-Bot.",
  heroKicker: SEO_PAGE_KICKER,
  heroTitle: "ADR Test Deutsch",
  heroLead:
    "Diese Seite gibt dir einen kompakten Einstieg in einen ADR Test auf Deutsch. Du siehst eher einen kleinen Selbstcheck im Testformat und gehst danach direkt in den Bot weiter.",
  heroSupport:
    "Die Seite ist bewusst kurz. Sie soll Suchintentionen abholen und nicht das komplette Training oeffentlich machen.",
  intentTitle: "Was du auf dieser Seite bekommst",
  intentParagraphs: [
    "Viele suchen nach ADR Test Deutsch, weil sie schnell pruefen wollen, ob sie die Fachsprache und das Niveau schon grob verstehen. Genau dafuer ist diese Seite gebaut.",
    "Du bekommst hier eher ein kleines Probeformat mit Selbstcheck-Charakter, nicht einfach nur eine Sammlung einzelner Fragen. Fuer mehr Wiederholung und mehr Tiefe geht es direkt in Telegram weiter.",
  ],
  sampleTitle: "Mini-Testvorschau",
  sampleLead:
    "Nur ein kleiner Testausschnitt, damit du ein Gefuehl fuer Sprache und Niveau bekommst.",
  sampleQuestions: [
    {
      question: "Was prueft ein ADR Test oft mit?",
      answer:
        "Vor allem Verstaendnis fuer Begriffe, Regeln, Kennzeichnung und typische Alltagssituationen.",
    },
    {
      question: "Warum ist die Sprache oft schwerer als der Inhalt?",
      answer:
        "Weil die Fragen formell und technisch formuliert sind und dadurch unnoetig kompliziert wirken koennen.",
    },
    {
      question: "Wie lernst du fuer den Test effizienter?",
      answer:
        "Mit kurzen Fragebloecken, Wiederholung und klaren Begriffserklaerungen statt nur mit langen Texten.",
    },
  ],
  sampleTerms: [
    { term: "Gefahrgut", note: "Stoffe mit besonderen Transportvorschriften." },
    { term: "Kennzeichnung", note: "Sichtbare Information zu Stoff und Gefahr." },
    { term: "Pruefungsfrage", note: "Formale Frage mit technischer Sprache." },
  ],
  sampleCalloutTitle: "Wichtig",
  sampleCalloutText:
    "Die oeffentliche Seite bleibt eine Vorschau. Im Bot folgt das eigentliche Training mit mehr Fragen und Wiederholung.",
  whyTelegramTitle: "Warum der Bot besser ist als nur eine Testseite",
  whyTelegramParagraphs: [
    "Im Bot kannst du Fragen wiederholt trainieren, statt nur ein statisches Sample zu lesen.",
    "So bleibt die Seite SEO-stark und der eigentliche Lernfluss konzentriert im Telegram-Bot.",
  ],
  faqs: [
    {
      question: "Ist das ein offizieller ADR Test?",
      answer:
        "Nein. Das ist eine Lernvorschau fuer Menschen, die sich auf ADR auf Deutsch vorbereiten.",
    },
    {
      question: "Reicht die Seite allein zum Lernen?",
      answer:
        "Nein. Sie zeigt nur einen Einstieg. Das vollstaendige Ueben geht im Bot weiter.",
    },
    {
      question: "Worin unterscheidet sich diese Seite von ADR Fragen auf Deutsch?",
      answer:
        "Hier steht eher ein kleiner Test- oder Selbstcheck-Moment im Vordergrund. Seiten zu ADR Fragen fokussieren staerker einzelne Formulierungen und Fragearten.",
    },
  ],
  relatedLinks: [
    {
      href: "/adr-fragen-auf-deutsch",
      label: "ADR Fragen auf Deutsch",
      note: "Wenn du statt Testformat einzelne Frageformulierungen trainieren willst",
    },
    {
      href: "/adr-pruefungsfragen-lernen",
      label: "ADR Pruefungsfragen lernen",
      note: "Mehr Fokus auf Lernen, Wiederholung und Frageblöcke",
    },
    {
      href: "/adr-pruefung-hilfe",
      label: "ADR Pruefung Hilfe",
      note: "Wenn du statt Selbstcheck eher Orientierung und Starthilfe brauchst",
    },
  ],
  ctaTitle: "Direkt in den ADR-Testfluss wechseln",
  ctaLead:
    "Wenn du den Test auf Deutsch suchst, ist der Bot der schnellste naechste Schritt fuer echte Uebung.",
  ctaButton: SEO_PRIMARY_CTA,
  disclaimer:
    "Diese Seite ist eine Lernvorschau und ersetzt keine offizielle Schulung oder Pruefung.",
  telegramSource: "seo_adr_test_deutsch",
  keywords: [
    "ADR Test Deutsch",
    "ADR Test auf Deutsch",
    "ADR Uebungstest Deutsch",
    "ADR Fragen Test Deutsch",
  ],
};

export const adrFragebogenDeutsch: SeoPageConfig = {
  slug: "adr-fragebogen-deutsch",
  path: "/adr-fragebogen-deutsch",
  pageTitle: "ADR Fragebogen Deutsch",
  metaTitle: "ADR Fragebogen Deutsch | Pruefungsnahe Uebungsboegen | ADR Bot",
  metaDescription:
    "ADR Fragebogen auf Deutsch mit pruefungsnahen Beispielfragen, Uebungsbogen-Charakter und klarem Weiterweg in den Telegram-Bot.",
  heroKicker: SEO_PAGE_KICKER,
  heroTitle: "ADR Fragebogen Deutsch",
  heroLead:
    "Wenn du nach einem ADR Fragebogen auf Deutsch suchst, zeigt dir diese Vorschau eher den Charakter eines Uebungsbogens mit kurzen Frage-Serien statt nur einzelne Formulierungen.",
  heroSupport:
    "Die Seite bleibt absichtlich kompakt und fuehrt danach in den Bot mit mehr Fragen und mehr Wiederholung.",
  intentTitle: "Warum diese Seite existiert",
  intentParagraphs: [
    "Viele Lernende suchen gezielt nach einem Fragebogen oder Uebungsbogen, weil sie nicht nur einzelne Fragen, sondern ein pruefungsnahes Format sehen wollen. Genau dafuer ist diese Seite gedacht.",
    "Sie zeigt den Stil eines kleinen ADR-Uebungsbogens, ohne den eigentlichen Trainingskern komplett oeffentlich zu machen.",
  ],
  sampleTitle: "Ausschnitt aus einem Fragebogenstil",
  sampleLead:
    "Ein paar kurze Frage-Serien reichen oft schon, um Aufbau und Schwierigkeitsgrad eines ADR-Uebungsbogens besser zu verstehen.",
  sampleQuestions: [
    {
      question: "Welche Information muss eindeutig zugeordnet werden koennen?",
      answer:
        "Zum Beispiel Stoff, UN-Nummer oder passende Kennzeichnung innerhalb eines klaren Transportkontexts.",
    },
    {
      question: "Warum wirken Frageboegen oft schwieriger als sie sind?",
      answer:
        "Weil mehrere knappe Fragen hintereinander schnell wie ein kompletter Pruefungsblock wirken.",
    },
    {
      question: "Was hilft beim Lernen mit Frageboegen?",
      answer:
        "Kurze Serien von Fragen, saubere Wiederholung und das aktive Erklaeren unbekannter Begriffe.",
    },
  ],
  sampleTerms: [
    { term: "Fragebogen", note: "Sammlung typischer Uebungsfragen." },
    { term: "Formulierung", note: "Die sprachliche Form einer Pruefungsfrage." },
    { term: "Antwortlogik", note: "Wie du die richtige Aussage erkennst." },
  ],
  whyTelegramTitle: "Warum du nach der Vorschau in Telegram weitergehen solltest",
  whyTelegramParagraphs: [
    "Der Bot bietet mehr Fragewiederholung und einen Trainingsfluss, der besser zu echten Lerngewohnheiten passt.",
    "Die Seite zieht Suchende an, der Bot uebernimmt dann die eigentliche Lernarbeit.",
  ],
  faqs: [
    {
      question: "Ist das ein kompletter ADR Fragebogen?",
      answer:
        "Nein. Es ist eine fokussierte Vorschau fuer Orientierung und Einstieg.",
    },
    {
      question: "Was bringt mir der Bot danach?",
      answer:
        "Mehr Fragen, mehr Begriffe und mehr Wiederholung als auf der offenen SEO-Seite.",
    },
  ],
  relatedLinks: [
    { href: "/", label: "Startseite", note: "Zur Hauptseite zurueck" },
    {
      href: "/adr-fragen-auf-deutsch",
      label: "ADR Fragen auf Deutsch",
      note: "Mehr Fokus auf Formulierungen und Sprachverstaendnis",
    },
    {
      href: "/adr-test-deutsch",
      label: "ADR Test Deutsch",
      note: "Aehnlicher Suchintent mit Testfokus",
    },
  ],
  ctaTitle: "Mit mehr Frageboegen im Bot weiterlernen",
  ctaLead:
    "Nach der Vorschau geht es direkt in den Telegram-Bot mit mehr Uebung und mehr Wiederholung.",
  ctaButton: SEO_PRIMARY_CTA,
  disclaimer:
    "Diese Seite ist eine Vorschau fuer Lernende und keine offizielle Pruefungsunterlage.",
  telegramSource: "seo_adr_fragebogen_deutsch",
  keywords: [
    "ADR Fragebogen Deutsch",
    "ADR Fragebogen auf Deutsch",
    "ADR Uebungsbogen Deutsch",
    "ADR Fragebogen lernen",
  ],
};

export const adrKursDeutsch: SeoPageConfig = {
  slug: "adr-kurs-deutsch",
  path: "/adr-kurs-deutsch",
  pageTitle: "ADR Kurs Deutsch",
  metaTitle: "ADR Kurs Deutsch | Einstieg, Begriffe und Fragen | ADR Bot",
  metaDescription:
    "ADR Kurs auf Deutsch mit kompaktem Einstieg, wichtigen Begriffen und typischen Lernfragen fuer Fahrer und Lernende.",
  heroKicker: SEO_PAGE_KICKER,
  heroTitle: "ADR Kurs Deutsch",
  heroLead:
    "Diese Seite richtet sich an Menschen, die nach einem ADR Kurs auf Deutsch suchen und zuerst verstehen wollen, wie Sprache, Inhalt und Einstieg zusammenhaengen.",
  heroSupport:
    "Der volle Kurs liegt nicht oeffentlich auf der Seite. Wir zeigen den Einstieg und leiten dann in den Bot weiter.",
  intentTitle: "Wofuer diese Kursseite gedacht ist",
  intentParagraphs: [
    "Suchende wollen oft zuerst wissen, ob der Stoff auf Deutsch verstaendlich erklaert wird und welcher Kurs ueberhaupt der richtige Einstieg ist. Diese Seite beantwortet genau diese Schwelle.",
    "Sie verbindet Kursintention, einfache Orientierung und die Frage nach Basiskurs versus Aufbaukurs mit einem klaren Uebergang in den Telegram-Bot.",
  ],
  sampleTitle: "Kursvorschau",
  sampleLead:
    "Ein kleiner Ausschnitt mit Frage- und Begriffslogik, damit Suchende den Stil schnell einschaetzen koennen.",
  sampleQuestions: [
    {
      question: "Was erwartet dich in einem ADR Kurs auf Deutsch?",
      answer:
        "Wichtige Regeln, Fachbegriffe, typische Frageformate und ein Fokus auf sicheres Verstaendnis.",
    },
    {
      question: "Warum ist Deutsch im Kurs fuer viele die eigentliche Huerde?",
      answer:
        "Nicht nur wegen Fachwoertern, sondern auch wegen langen und formellen Satzstrukturen.",
    },
  ],
  sampleTerms: [
    { term: "Basiskurs", note: "Der wichtigste Einstieg fuer viele Fahrer." },
    { term: "Aufbaukurs", note: "Vertiefung fuer bestimmte Bereiche." },
    { term: "Pruefungsdeutsch", note: "Technische und formale Sprache der Fragen." },
  ],
  whyTelegramTitle: "Warum die Kurslogik im Bot weitergeht",
  whyTelegramParagraphs: [
    "Der Bot ist besser fuer kleinschrittiges Lernen und Wiederholen geeignet als eine rein statische Landingpage.",
    "So bleibt die Seite fuer Google stark und der Lernfluss fuer Nutzer praktisch.",
  ],
  faqs: [
    {
      question: "Ist diese Seite als Kurswahl-Hilfe gedacht?",
      answer:
        "Ja. Sie hilft vor allem beim Verstehen, was mit ADR-Kurs auf Deutsch gemeint ist und welcher Einstieg sinnvoll sein kann.",
    },
    {
      question: "Ersetzt diese Seite einen offiziellen ADR-Kurs?",
      answer:
        "Nein. Sie ist nur eine Vorschau und Lernhilfe. Der offizielle Kurs bleibt notwendig.",
    },
    {
      question: "Was ist nach dieser Kursvorschau sinnvoll?",
      answer:
        "Im Bot mit Begriffen und Fragen starten, damit der Kurseinstieg spaeter leichter faellt.",
    },
  ],
  relatedLinks: [
    {
      href: "/basiskurs-preview",
      label: "Basiskurs Preview",
      note: "Direkter Einstieg in den haeufigsten Kursintent",
    },
    {
      href: "/adr-schein-deutsch",
      label: "ADR Schein Deutsch",
      note: "Wenn du weniger Kurswahl und mehr Ziel Schein im Kopf hast",
    },
    {
      href: "/adr-vorbereitung-fuer-lkw-fahrer",
      label: "ADR Vorbereitung fuer LKW-Fahrer",
      note: "Praktischer Fahrerfokus",
    },
  ],
  ctaTitle: "Vom Kursinteresse direkt in die Uebung",
  ctaLead:
    "Wenn du einen ADR Kurs auf Deutsch suchst, kannst du im Bot sofort mit Fragen und Begriffen starten.",
  ctaButton: SEO_PRIMARY_CTA,
  disclaimer:
    "Diese Seite ersetzt keinen offiziellen Kurs, sondern zeigt einen orientierenden Einstieg.",
  telegramSource: "seo_adr_kurs_deutsch",
  keywords: [
    "ADR Kurs Deutsch",
    "ADR Kurs auf Deutsch",
    "ADR lernen im Kurs Deutsch",
    "ADR Vorbereitung Kurs Deutsch",
  ],
};

export const adrScheinDeutsch: SeoPageConfig = {
  slug: "adr-schein-deutsch",
  path: "/adr-schein-deutsch",
  pageTitle: "ADR Schein Deutsch",
  metaTitle: "ADR Schein Deutsch | Weg zur Pruefung und Lernhilfe | ADR Bot",
  metaDescription:
    "ADR Schein auf Deutsch: kompakte Orientierung zum Weg durch Kurs, Pruefung und Lernhilfe fuer Fahrer und Lernende.",
  heroKicker: SEO_PAGE_KICKER,
  heroTitle: "ADR Schein Deutsch",
  heroLead:
    "Wenn du den ADR Schein auf Deutsch machen willst, brauchst du vor allem klares Verstaendnis fuer Sprache, Begriffe und typische Fragen.",
  heroSupport:
    "Diese Vorschauseite zeigt den Einstieg. Das eigentliche Training geht anschliessend im Bot weiter.",
  intentTitle: "Was Suchende nach ADR Schein Deutsch meist brauchen",
  intentParagraphs: [
    "Viele suchen nicht nach abstrakter Theorie, sondern nach einem verstaendlichen Weg zum ADR Schein auf Deutsch. Sie denken vom Ziel her: bestehen, bekommen, verlaengern.",
    "Genau dafuer verbinden wir hier Schein-Logik, Fragebeispiele und klare Begriffe mit einem schnellen CTA zum Bot, ohne in die eigentliche Kurswahl-Seite abzurutschen.",
  ],
  sampleTitle: "Kleiner Einstieg",
  sampleLead:
    "Ein kompakter Einblick hilft, ohne den gesamten Trainingsinhalt oeffentlich zu veroeffentlichen.",
  sampleQuestions: [
    {
      question: "Was ist fuer den ADR Schein oft die groesste Huerde?",
      answer:
        "Nicht nur das Fachwissen, sondern das technische Deutsch in Fragen und Antworten.",
    },
    {
      question: "Was hilft vor der Pruefung am meisten?",
      answer:
        "Fragen auf Deutsch, erklaerte Begriffe und regelmaessige Wiederholung.",
    },
  ],
  sampleTerms: [
    { term: "ADR Schein", note: "Umgangssprachliche Form fuer ADR-Berechtigung." },
    { term: "Vorbereitung", note: "Lernphase vor Kurs oder Pruefung." },
    { term: "Wiederholung", note: "Der wichtigste Hebel fuer sicheres Verstehen." },
  ],
  whyTelegramTitle: "Warum der Bot besser zur Scheinvorausbereitung passt",
  whyTelegramParagraphs: [
    "Der Bot erlaubt mehr Wiederholung, kurze Lerneinheiten und einen klareren Uebergang vom Lesen zum Ueben.",
    "So bleibt die Landingpage leicht und der eigentliche Trainingswert sitzt dort, wo Nutzer oefter zurueckkommen.",
  ],
  faqs: [
    {
      question: "Hilft diese Seite eher beim Ziel Schein als bei der Kurswahl?",
      answer:
        "Ja. Hier steht das Ziel ADR Schein im Vordergrund, waehrend andere Seiten staerker die Frage nach dem passenden Kurs beantworten.",
    },
    {
      question: "Bekomme ich den ADR Schein allein durch den Bot?",
      answer:
        "Nein. Der Bot hilft beim Lernen, ersetzt aber weder offiziellen Kurs noch Pruefung.",
    },
    {
      question: "Wofuer ist der Bot in diesem Kontext am nuetzlichsten?",
      answer:
        "Fuer Wiederholung, Sprachverstaendnis und regelmaessige kleine Lerneinheiten auf dem Weg zur Pruefung.",
    },
  ],
  relatedLinks: [
    {
      href: "/adr-kurs-deutsch",
      label: "ADR Kurs Deutsch",
      note: "Wenn du statt Scheinziel erst den passenden Kurs einordnen willst",
    },
    {
      href: "/adr-pruefung-auf-deutsch",
      label: "ADR Pruefung auf Deutsch",
      note: "Pruefungsfokus fuer Suchende mit Testintention",
    },
    {
      href: "/adr-pruefung-bestehen",
      label: "ADR Pruefung bestehen",
      note: "Wenn dein Fokus klar auf Bestehen und Vorbereitung liegt",
    },
  ],
  ctaTitle: "Mit dem Lernen fuer den ADR Schein anfangen",
  ctaLead:
    "Wenn du den Schein auf Deutsch vorbereitest, hilft dir der Bot beim naechsten echten Lernschritt.",
  ctaButton: SEO_PRIMARY_CTA,
  disclaimer:
    "Diese Seite ist eine Lernhilfe und keine offizielle Kurs- oder Pruefungsstelle.",
  telegramSource: "seo_adr_schein_deutsch",
  keywords: [
    "ADR Schein Deutsch",
    "ADR Schein auf Deutsch",
    "ADR Schein Vorbereitung Deutsch",
    "ADR lernen fuer Schein",
  ],
};

export const adrPruefungHilfe: SeoPageConfig = {
  slug: "adr-pruefung-hilfe",
  path: "/adr-pruefung-hilfe",
  pageTitle: "ADR Pruefung Hilfe",
  metaTitle: "ADR Pruefung Hilfe | Orientierung und erster Lernplan | ADR Bot",
  metaDescription:
    "Hilfe fuer die ADR Pruefung auf Deutsch mit schneller Orientierung, ersten Lernschritten und klarem Weiterweg in den Telegram-Bot.",
  heroKicker: SEO_PAGE_KICKER,
  heroTitle: "ADR Pruefung Hilfe",
  heroLead:
    "Diese Seite richtet sich an Menschen, die schnelle Hilfe fuer die ADR Pruefung suchen und zuerst wissen wollen, wie sie sinnvoll anfangen.",
  heroSupport:
    "Du bekommst Orientierung, ein kleines Sample und danach den direkten Weg in den Bot.",
  intentTitle: "Wie diese Hilfeseite genutzt werden soll",
  intentParagraphs: [
    "Nicht jeder sucht nach Kurs oder App. Viele tippen einfach ADR Pruefung Hilfe ein. Genau dieses Problem loest diese Seite mit einem rescue-orientierten Einstieg.",
    "Sie beantwortet den Bedarf nach schneller Orientierung, nach einem ersten Lernplan und nach den naechsten sinnvollen Schritten. Erst danach fuehrt sie in ein strukturierteres Lernformat weiter.",
  ],
  sampleTitle: "Schnelle Hilfe in klein",
  sampleLead:
    "Ein kleiner Ausschnitt mit typischen Fragen und Begriffen gibt sofort Orientierung.",
  sampleQuestions: [
    {
      question: "Womit faengst du an, wenn du nicht weisst, wo du starten sollst?",
      answer:
        "Mit den wichtigsten Fachbegriffen, wenigen Beispiel-Fragen und regelmaessiger Wiederholung.",
    },
    {
      question: "Warum hilft ein Bot beim Lernen?",
      answer:
        "Weil kurze Uebungen und Wiederholung oft besser funktionieren als nur lange Lesetexte.",
    },
  ],
  sampleTerms: [
    { term: "Hilfe", note: "Schneller Einstieg statt kompletter Theorie." },
    { term: "Sample", note: "Begrenzte Vorschau fuer Suchende." },
    { term: "Telegram", note: "Naechster Lernschritt mit mehr Tiefe." },
  ],
  whyTelegramTitle: "Warum die eigentliche Hilfe im Bot liegt",
  whyTelegramParagraphs: [
    "Die Seite beantwortet die Suchintention. Der Bot liefert die Wiederholung und den eigentlichen Lernfortschritt.",
    "So bekommt der Nutzer beides: Google-Einstieg und praktischen Lernfluss.",
  ],
  faqs: [
    {
      question: "Ist diese Seite eher fuer Orientierung als fuer komplettes Lernen gedacht?",
      answer:
        "Ja. Sie hilft vor allem dann, wenn du schnell Klarheit brauchst, womit du fuer die ADR-Pruefung anfangen solltest.",
    },
    {
      question: "Worin unterscheidet sich diese Seite von ADR Pruefung auf Deutsch?",
      answer:
        "Die allgemeine ADR-Pruefungsseite gibt einen breiteren Ueberblick. Diese Hilfeseite ist staerker als Rescue-Einstieg gebaut: weniger Gesamtbild, mehr erster naechster Schritt.",
    },
    {
      question: "Was mache ich nach dieser Hilfe-Seite?",
      answer:
        "Direkt in den Telegram-Bot wechseln und dort mit kurzen Frageblöcken, Begriffen und Wiederholung starten.",
    },
  ],
  relatedLinks: [
    {
      href: "/adr-pruefung-auf-deutsch",
      label: "ADR Pruefung auf Deutsch",
      note: "Wenn du statt Rescue-Hilfe erst den groesseren Ueberblick willst",
    },
    {
      href: "/adr-pruefung-deutsch-lernen",
      label: "ADR Pruefung Deutsch lernen",
      note: "Wenn du aus Starthilfe direkt in Lernroutine wechseln willst",
    },
    {
      href: "/adr-test-deutsch",
      label: "ADR Test Deutsch",
      note: "Wenn du statt Starthilfe lieber einen schnellen Selbstcheck machen willst",
    },
  ],
  ctaTitle: "Jetzt praktische Hilfe im Bot nutzen",
  ctaLead:
    "Wenn du schnelle ADR-Hilfe gesucht hast, kannst du direkt im Telegram-Bot weiterlernen.",
  ctaButton: SEO_PRIMARY_CTA,
  disclaimer:
    "Diese Seite ist eine Orientierungshilfe und keine offizielle Schulungs- oder Pruefungsinstanz.",
  telegramSource: "seo_adr_pruefung_hilfe",
  keywords: [
    "ADR Pruefung Hilfe",
    "Hilfe fuer ADR Pruefung",
    "ADR Hilfe Deutsch",
    "ADR Lernplan Pruefung",
  ],
};

export const adrDeutschUeben: SeoPageConfig = {
  slug: "adr-deutsch-ueben",
  path: "/adr-deutsch-ueben",
  pageTitle: "ADR Deutsch ueben",
  metaTitle: "ADR Deutsch ueben | Sprache und Fragen trainieren | ADR Bot",
  metaDescription:
    "ADR Deutsch ueben mit typischen Begriffs- und Fragebeispielen fuer Lernende, Fahrer und Nicht-Muttersprachler.",
  heroKicker: SEO_PAGE_KICKER,
  heroTitle: "ADR Deutsch ueben",
  heroLead:
    "Diese Seite ist fuer Menschen gedacht, die nicht nur Theorie lesen, sondern ADR-Deutsch wirklich ueben wollen.",
  heroSupport:
    "Wir zeigen dir einen kleinen, nuetzlichen Ausschnitt und leiten dich danach in den Bot fuer echte Wiederholung weiter.",
  intentTitle: "Warum dieser Ueben-Intent wichtig ist",
  intentParagraphs: [
    "Wer ueben eingibt, ist oft weiter als jemand, der nur Informationen sucht. Diese Suchenden wollen direkt in Training uebergehen.",
    "Darum ist die Seite klar auf Verstehen, Begriffe und kleine Fragebeispiele ausgerichtet.",
  ],
  sampleTitle: "Kurze Uebungsvorschau",
  sampleLead:
    "Einige typische Formulierungen genuegen oft schon, um die Huerde beim ADR-Deutsch besser zu verstehen.",
  sampleQuestions: [
    {
      question: "Was bedeutet ADR-Deutsch ueben in der Praxis?",
      answer:
        "Nicht nur Begriffe lesen, sondern Fragen, Formulierungen und Antwortmuster regelmaessig trainieren.",
    },
    {
      question: "Warum ist Uebung so wichtig?",
      answer:
        "Weil sich technisches Deutsch erst durch Wiederholung sicher anfuehlt.",
    },
  ],
  sampleTerms: [
    { term: "Ueben", note: "Aktives Wiederholen statt nur Lesen." },
    { term: "Fachsprache", note: "Typische technische Sprache der Pruefung." },
    { term: "Antwortmuster", note: "Wiederkehrende Logik in Fragen und Antworten." },
  ],
  whyTelegramTitle: "Warum Uebung am besten im Bot funktioniert",
  whyTelegramParagraphs: [
    "Der Bot ist besser fuer kurze Wiederholungseinheiten als eine statische SEO-Seite.",
    "Dadurch kann die Landingpage Suchanfragen auffangen und der Bot den echten Trainingsnutzen liefern.",
  ],
  relatedLinks: [
    { href: "/", label: "Startseite", note: "Zur Hauptseite zurueck" },
    {
      href: "/technisches-deutsch-adr",
      label: "Technisches Deutsch ADR",
      note: "Mehr Fokus auf Sprache und Fachwoerter",
    },
    {
      href: "/adr-pruefung-deutsch-lernen",
      label: "ADR Pruefung Deutsch lernen",
      note: "Aehnlicher Lernintent mit Pruefungsfokus",
    },
  ],
  ctaTitle: "ADR-Deutsch direkt im Bot ueben",
  ctaLead:
    "Wenn du wirklich ueben willst, geht der sinnvollste naechste Schritt in den Telegram-Bot.",
  ctaButton: SEO_PRIMARY_CTA,
  disclaimer:
    "Diese Seite ist eine oefentliche Vorschau und ersetzt kein komplettes Lernsystem.",
  telegramSource: "seo_adr_deutsch_ueben",
  keywords: [
    "ADR Deutsch ueben",
    "ADR Deutsch trainieren",
    "ADR Sprache ueben",
    "ADR Deutsch lernen",
  ],
};

export const adrPruefungBestehen: SeoPageConfig = {
  slug: "adr-pruefung-bestehen",
  path: "/adr-pruefung-bestehen",
  pageTitle: "ADR Pruefung bestehen",
  metaTitle: "ADR Pruefung bestehen | Tipps und Vorbereitung | ADR Bot",
  metaDescription:
    "ADR Pruefung bestehen: Worauf es wirklich ankommt, welche Fehler vermieden werden und wie der Telegram-Bot beim systematischen Lernen hilft.",
  heroKicker: SEO_PAGE_KICKER,
  heroTitle: "ADR Pruefung bestehen",
  heroLead:
    "Viele scheitern nicht am Stoff, sondern an der Sprache oder an unsystematischem Lernen. Diese Seite zeigt, worauf es wirklich ankommt.",
  heroSupport:
    "Du bekommst einen Ueberblick ueber typische Stolperfallen und einen direkten Einstieg in die Uebung im Bot.",
  intentTitle: "Warum die Pruefung schwieriger wirkt als sie ist",
  intentParagraphs: [
    "Die ADR-Pruefung faellt vielen schwerer, weil die Fragen formal und technisch formuliert sind. Wer die Fachsprache nicht kennt, versteht manchmal nicht einmal, was gefragt wird.",
    "Systematisches Ueben mit kurzen Fragebloecken hilft mehr als stundenlanges Lesen. Der Telegram-Bot ist dafuer gebaut.",
  ],
  sampleTitle: "Was du fuer die Pruefung wissen solltest",
  sampleLead:
    "Nicht alle Themen sind gleich wichtig. Hier ein kleines Sample der Kernbereiche.",
  sampleQuestions: [
    {
      question: "Was wird in der ADR-Pruefung tatsaechlich getestet?",
      answer:
        "Kenntnisse zu Gefahrgutklassen, Kennzeichnung, Beforderungspapieren, Tunnelkategorien und Verhaltenspflichten des Fahrers.",
    },
    {
      question: "Wie viele Fragen gibt es typischerweise?",
      answer:
        "Je nach Pruefungstyp zwischen 30 und 60 Multiple-Choice-Fragen mit Zeitlimit.",
    },
    {
      question: "Was ist der haeufigste Grund fuers Nicht-Bestehen?",
      answer:
        "Unbekannte Fachbegriffe und unklare Frageformulierungen, nicht das fehlende Fachwissen selbst.",
    },
  ],
  sampleTerms: [
    { term: "Bestehensgrenze", note: "Mindestpunktzahl, die erreicht werden muss." },
    { term: "Multiple-Choice", note: "Aufgabenformat mit vorgegebenen Antwortmoeglichkeiten." },
    { term: "Wiederholungspruefung", note: "Neue Pruefung nach Nichtbestehen." },
  ],
  sampleCalloutTitle: "Wichtig",
  sampleCalloutText:
    "Diese Seite ist kein offizielles Pruefungssimulator. Sie gibt Orientierung und leitet in den Bot fuer echte Uebung weiter.",
  whyTelegramTitle: "Warum der Bot besser vorbereitet als Merkblaetter",
  whyTelegramParagraphs: [
    "Im Bot trainierst du mit echten Frageformulierungen und bekommst sofortige Erklaerungen. Das baut Vertrauen fuer die Pruefungssituation auf.",
    "Kurze Einheiten taeglich sind effektiver als ein einmaliger Lernmarathon kurz vor der Pruefung.",
  ],
  faqs: [
    {
      question: "Wie oft darf ich die ADR-Pruefung wiederholen?",
      answer:
        "Das haengt von der jeweiligen Pruefungsstelle und dem Bundesland ab. Es gibt keine bundesweit einheitliche Grenze.",
    },
    {
      question: "Muss ich alle ADR-Klassen auf einmal lernen?",
      answer:
        "Nein. Du kannst mit Basisstoff starten und einzelne Klassen dazulernen, wenn sie fuer deine Arbeit relevant werden.",
    },
  ],
  relatedLinks: [
    { href: "/adr-pruefung-auf-deutsch", label: "ADR-Pruefung auf Deutsch", note: "Allgemeiner Einstieg" },
    { href: "/adr-pruefung-hilfe", label: "ADR Pruefung Hilfe", note: "Hilfe bei konkreten Fragen" },
    { href: "/adr-pruefungsfragen-lernen", label: "ADR Pruefungsfragen lernen", note: "Fragen systematisch lernen" },
  ],
  ctaTitle: "Direkt mit der Pruefungsvorbereitung starten",
  ctaLead: "Der Bot trainiert dich mit echten Frageformulierungen und sofortigen Erklaerungen.",
  ctaButton: SEO_PRIMARY_CTA,
  disclaimer: "Diese Seite ist kein offizielles Pruefungsangebot.",
  telegramSource: "seo_adr_pruefung_bestehen",
  keywords: [
    "ADR Pruefung bestehen",
    "ADR Pruefung tipps",
    "ADR Pruefung vorbereitung",
    "ADR bestehen",
  ],
};

export const adrGefahrgutSymboleDeutsch: SeoPageConfig = {
  slug: "adr-gefahrgut-symbole-deutsch",
  path: "/adr-gefahrgut-symbole-deutsch",
  pageTitle: "Gefahrgut Symbole Deutsch",
  metaTitle: "Gefahrgut Symbole Deutsch | ADR Gefahrzettel erklaert | ADR Bot",
  metaDescription:
    "Gefahrgut-Symbole und Gefahrzettel auf Deutsch erklaert: Piktogramme, Klassen und was sie fuer ADR-Fahrer bedeuten.",
  heroKicker: SEO_PAGE_KICKER,
  heroTitle: "Gefahrgut Symbole auf Deutsch",
  heroLead:
    "Gefahrzettel und Symbole sind ein zentrales Thema der ADR-Pruefung. Diese Seite erklaert die wichtigsten Piktogramme und ihre Bedeutung auf Deutsch.",
  heroSupport:
    "Du bekommst eine kompakte Uebersicht der haeufigsten Symbole. Fuer tiefere Wiederholung geht es im Bot weiter.",
  intentTitle: "Warum Symbole so pruefungsrelevant sind",
  intentParagraphs: [
    "In der ADR-Pruefung kommen Fragen zu Gefahrzettel, Orangetafeln und Kennzeichnung regelmaessig vor. Wer die Symbole nicht kennt, verliert leicht Punkte.",
    "Gleichzeitig sind viele Symbole logisch aufgebaut. Wer die Grundprinzipien versteht, kann sich den Rest erschliessen.",
  ],
  sampleTitle: "Beispiele typischer Gefahrzettel",
  sampleLead:
    "Nur ein kleiner Ausschnitt mit den Symbolen, die in Pruefungen am haeufigsten vorkommen.",
  sampleQuestions: [
    {
      question: "Was bedeutet die Nummer auf einem Gefahrzettel?",
      answer:
        "Sie gibt die ADR-Gefahrgutklasse an, zum Beispiel Klasse 3 fuer entzuendbare Fluessigkeiten.",
    },
    {
      question: "Was zeigt die Orangetafel am Fahrzeug?",
      answer:
        "Die Gefahrnummer oben und die UN-Nummer unten. Beides identifiziert den Stoff und seine Gefahren.",
    },
    {
      question: "Warum gibt es Gefahrzettel in verschiedenen Formen?",
      answer:
        "Die Rautenform signalisiert immer Gefahrgut. Form und Farbe geben schnell Auskunft ueber Art und Klasse.",
    },
  ],
  sampleTerms: [
    { term: "Gefahrzettel", note: "Rautenfoermiges Piktogramm auf Verpackungen und Fahrzeugen." },
    { term: "Orangetafel", note: "Kennzeichnung am Fahrzeug mit Gefahrnummer und UN-Nummer." },
    { term: "Gefahrnummer", note: "Zweistellige Zahl, die auf Art und Intensitaet der Gefahr hinweist." },
    { term: "UN-Nummer", note: "Vierstellige Nummer zur eindeutigen Identifikation des Stoffes." },
  ],
  whyTelegramTitle: "Symbole besser im Bot einpraegsam lernen",
  whyTelegramParagraphs: [
    "Im Bot lernst du Symbole und Kennzeichnung mit Fragen und sofortigen Erklaerungen statt nur mit einer Tabelle.",
    "So bleiben die Zusammenhaenge besser in Erinnerung fuer die echte Pruefung.",
  ],
  faqs: [
    {
      question: "Muss ich alle ADR-Symbole auswendig koennen?",
      answer:
        "Du musst die gaengigen Gefahrzettel und die Logik der Kennzeichnung verstehen. Auswendiglernen jeder Variante ist nicht notwendig.",
    },
    {
      question: "Sind die Symbole international gleich?",
      answer:
        "Weitgehend ja. Das ADR ist ein internationales Abkommen und die Piktogramme folgen internationalen Normen.",
    },
  ],
  relatedLinks: [
    { href: "/adr-klassen-deutsch", label: "ADR Klassen Deutsch", note: "Gefahrgutklassen im Ueberblick" },
    { href: "/adr-begriffe", label: "ADR Begriffe", note: "Wichtige Fachwoerter erklaert" },
    { href: "/technisches-deutsch-adr", label: "Technisches Deutsch ADR", note: "Fachsprache der Pruefung" },
  ],
  ctaTitle: "Gefahrzettel und Symbole im Bot trainieren",
  ctaLead: "Mit Fragen zu Kennzeichnung und Klassen im Telegram-Bot gezielt fuer die Pruefung ueben.",
  ctaButton: SEO_PRIMARY_CTA,
  disclaimer: "Diese Seite ist eine Lernvorschau und keine offizielle Klassifikationsreferenz.",
  telegramSource: "seo_adr_gefahrgut_symbole_deutsch",
  keywords: [
    "Gefahrgut Symbole Deutsch",
    "ADR Gefahrzettel",
    "ADR Kennzeichnung erklaert",
    "Gefahrzettel Bedeutung",
  ],
};

export const adrKlassenDeutsch: SeoPageConfig = {
  slug: "adr-klassen-deutsch",
  path: "/adr-klassen-deutsch",
  pageTitle: "ADR Klassen Deutsch",
  metaTitle: "ADR Klassen Deutsch | Gefahrgutklassen 1-9 erklaert | ADR Bot",
  metaDescription:
    "ADR Gefahrgutklassen 1 bis 9 auf Deutsch erklaert: Was jede Klasse bedeutet, typische Beispiele und was fuer Fahrer pruefungsrelevant ist.",
  heroKicker: SEO_PAGE_KICKER,
  heroTitle: "ADR Klassen auf Deutsch",
  heroLead:
    "Die neun ADR-Gefahrgutklassen sind das Grundgeruest der Pruefung. Diese Seite erklaert sie kompakt auf Deutsch.",
  heroSupport:
    "Du bekommst einen kurzen Ueberblick. Die volle Wiederholung mit Fragen laeuft im Telegram-Bot.",
  intentTitle: "Warum die Klassen so wichtig sind",
  intentParagraphs: [
    "Ohne Grundkenntnisse der Gefahrgutklassen kann man viele Pruefungsfragen nicht korrekt einordnen. Die Klassen bestimmen Kennzeichnung, Verpackung und Verhaltenspflichten.",
    "Die meisten Fahrer benoetigen nur ein paar der neun Klassen regelmaessig. Trotzdem fragt die Pruefung quer ueber alle Klassen.",
  ],
  sampleTitle: "Kurzer Ueberblick der Klassen",
  sampleLead: "Nur die wichtigsten Klassen mit einem praxisnahen Beispiel jeweils.",
  sampleQuestions: [
    {
      question: "Was umfasst Klasse 3?",
      answer:
        "Entzuendbare Fluessigkeiten wie Benzin, Dieselkraftstoff und Loesungsmittel.",
    },
    {
      question: "Was sind typische Klasse-8-Gueter?",
      answer:
        "Aeztende Stoffe wie Saeure, Laugen und bestimmte Reinigungsmittel.",
    },
    {
      question: "Warum gibt es eine Klasse 9?",
      answer:
        "Klasse 9 erfasst sonstige gefaehrliche Stoffe und Gegenstaende, die keiner anderen Klasse eindeutig zuzuordnen sind.",
    },
  ],
  sampleTerms: [
    { term: "Klasse 1", note: "Explosivstoffe und Gegenstaende mit Explosivstoff." },
    { term: "Klasse 3", note: "Entzuendbare Fluessigkeiten." },
    { term: "Klasse 6.1", note: "Giftige Stoffe." },
    { term: "Klasse 8", note: "Aeztende Stoffe." },
    { term: "Klasse 9", note: "Sonstige gefaehrliche Stoffe." },
  ],
  whyTelegramTitle: "Klassen mit echten Fragen festigen",
  whyTelegramParagraphs: [
    "Im Bot werden Klassen in pruefungsaehnlichen Fragen trainiert, nicht nur in Tabellen gelesen.",
    "Das festigt das Wissen nachhaltiger als ein einmaliger Ueberblick.",
  ],
  faqs: [
    {
      question: "Muss ich alle neun Klassen koennen?",
      answer:
        "Grundkenntnisse aller Klassen sind pruefungsrelevant. Tiefes Detailwissen brauchst du meist nur fuer die Klassen, mit denen du arbeitest.",
    },
    {
      question: "Gibt es Unterklassen?",
      answer:
        "Ja, einige Klassen wie 2, 4 und 6 haben Unterklassen mit speziellen Regeln.",
    },
  ],
  relatedLinks: [
    { href: "/adr-gefahrgut-symbole-deutsch", label: "Gefahrgut Symbole", note: "Symbole und Gefahrzettel erklaert" },
    { href: "/adr-begriffe", label: "ADR Begriffe", note: "Fachwoerter fuer die Pruefung" },
    { href: "/gefahrgut-deutsch-lernen", label: "Gefahrgut Deutsch lernen", note: "Gefahrgut auf Deutsch verstehen" },
  ],
  ctaTitle: "Alle Klassen im Bot trainieren",
  ctaLead: "Pruefungsfragen zu allen neun Gefahrgutklassen direkt im Telegram-Bot ueben.",
  ctaButton: SEO_PRIMARY_CTA,
  disclaimer: "Diese Seite ist eine Lernvorschau. Sie ersetzt keine offizielle ADR-Schulung.",
  telegramSource: "seo_adr_klassen_deutsch",
  keywords: [
    "ADR Klassen Deutsch",
    "Gefahrgutklassen erklaert",
    "ADR Klassen 1 bis 9",
    "ADR Gefahrgutklassen",
  ],
};

export const adrWiederholungDeutsch: SeoPageConfig = {
  slug: "adr-wiederholung-deutsch",
  path: "/adr-wiederholung-deutsch",
  pageTitle: "ADR Wiederholung Deutsch",
  metaTitle: "ADR Wiederholung Deutsch | Stoff wiederholen und festigen | ADR Bot",
  metaDescription:
    "ADR Stoff auf Deutsch wiederholen: Kompakte Wiederholungseinheiten fuer Begriffe, Fragen und Regeln vor der Pruefung oder Verlaengerung.",
  heroKicker: SEO_PAGE_KICKER,
  heroTitle: "ADR Wiederholung auf Deutsch",
  heroLead:
    "Wer den ADR-Schein verlaengern oder eine Refresher-Pruefung ablegen muss, braucht gezielte Wiederholung. Diese Seite gibt eine kompakte Einstiegsorientierung.",
  heroSupport:
    "Du bekommst einen kleinen Ausschnitt typischer Wiederholungsinhalte. Die systematische Wiederholung laeuft im Bot.",
  intentTitle: "Wer Wiederholung sucht und warum",
  intentParagraphs: [
    "ADR-Scheine muessen regelmaessig verlaengert werden. Viele Fahrer lernen fuer die Erstpruefung intensiv und muessen danach gezielt auffrischen.",
    "Die Sprache und Formulierungen aendern sich nur wenig. Wer die Struktur kennt, braucht weniger Wiederholungszeit.",
  ],
  sampleTitle: "Typische Wiederholungsthemen",
  sampleLead:
    "Diese Bereiche kommen in Verlaengerungspruefungen besonders haeufig vor.",
  sampleQuestions: [
    {
      question: "Was muss bei der Verlaengerung des ADR-Scheins gelernt werden?",
      answer:
        "Aktualisierte Vorschriften, Kennzeichnung, Verhaltenspflichten und pruefungsrelevante Aenderungen seit der letzten Pruefung.",
    },
    {
      question: "Wie lange gilt ein ADR-Schein?",
      answer:
        "Fuenf Jahre. Danach ist eine Verlaengerungspruefung erforderlich.",
    },
    {
      question: "Was ist der Unterschied zwischen Basis- und Aufbaukurs?",
      answer:
        "Der Basiskurs deckt allgemeine Gefahrgutregeln ab. Aufbaukurse sind spezialisiert auf Tankfahrzeuge oder bestimmte Klassen.",
    },
  ],
  sampleTerms: [
    { term: "Verlaengerungspruefung", note: "Pruefung zur Erneuerung des ADR-Scheins nach Ablauf." },
    { term: "Refresher", note: "Kurzform fuer Auffrischungskurs oder Wiederholungseinheit." },
    { term: "Basiskurs", note: "Grundausbildung fuer alle ADR-Fahrer." },
    { term: "Aufbaukurs", note: "Spezialisierung fuer Tanks oder bestimmte Gefahrgutklassen." },
  ],
  whyTelegramTitle: "Wiederholung im Bot ist effizienter",
  whyTelegramParagraphs: [
    "Kurze taeglich Einheiten im Bot sind effektiver fuer die Wiederholung als stundenlanges Lesen unmittelbar vor der Pruefung.",
    "Der Bot stellt Fragen in pruefungsaehnlicher Sprache, sodass du dich sofort an das Format gewoehnen kannst.",
  ],
  relatedLinks: [
    { href: "/adr-pruefung-bestehen", label: "ADR Pruefung bestehen", note: "Tipps fuer die Pruefung" },
    { href: "/adr-pruefungsfragen-lernen", label: "ADR Pruefungsfragen lernen", note: "Fragen systematisch lernen" },
    { href: "/adr-deutsch-ueben", label: "ADR Deutsch ueben", note: "Sprache und Fragen aktiv ueben" },
  ],
  ctaTitle: "Jetzt gezielt mit der Wiederholung starten",
  ctaLead: "Im Telegram-Bot kannst du sofort mit kurzen Wiederholungseinheiten beginnen.",
  ctaButton: SEO_PRIMARY_CTA,
  disclaimer: "Diese Seite ist eine Lernvorschau und kein offizieller Wiederholungskurs.",
  telegramSource: "seo_adr_wiederholung_deutsch",
  keywords: [
    "ADR Wiederholung Deutsch",
    "ADR Schein verlaengern",
    "ADR Refresher",
    "ADR Stoff wiederholen",
  ],
};

export const adrLernhilfeDeutsch: SeoPageConfig = {
  slug: "adr-lernhilfe-deutsch",
  path: "/adr-lernhilfe-deutsch",
  pageTitle: "ADR Lernhilfe Deutsch",
  metaTitle: "ADR Lernhilfe Deutsch | Struktur, Begriffe und Lernplan | ADR Bot",
  metaDescription:
    "ADR Lernhilfe auf Deutsch: strukturierter Einstieg mit Fachbegriffen, Lernplan und dem Telegram-Bot fuer spaetere Wiederholung.",
  heroKicker: SEO_PAGE_KICKER,
  heroTitle: "ADR Lernhilfe auf Deutsch",
  heroLead:
    "Diese Seite ist als erste Anlaufstelle gedacht, wenn du Hilfe beim Lernen fuer ADR auf Deutsch brauchst.",
  heroSupport:
    "Du bekommst Orientierung, wichtige Begriffe und einen direkten Einstieg in den Telegram-Bot.",
  intentTitle: "Wer nach ADR Lernhilfe sucht",
  intentParagraphs: [
    "Viele Fahrer suchen nach ADR Lernhilfe, weil ihnen der Einstieg schwerfaellt. Die Kombination aus technischen Inhalten und Fachsprache wirkt am Anfang ueberwaetigend.",
    "Diese Seite hilft dabei, den Stoff zu strukturieren und einen echten Lernfluss zu starten. Sie ist breiter als eine reine Telegram- oder App-Seite und erklaert eher den Einstieg als den Kanal.",
  ],
  sampleTitle: "Erste Lernhilfe-Elemente",
  sampleLead:
    "Ein kleiner Ausschnitt der Themen, bei denen Lernhilfe am meisten hilft.",
  sampleQuestions: [
    {
      question: "Wie fange ich am besten mit ADR an?",
      answer:
        "Mit den Grundbegriffen: Gefahrgutklassen, Kennzeichnung und Beforderungspflichten. Das gibt Struktur fuer alles Weitere.",
    },
    {
      question: "Welche Fehler machen Einsteiger beim Lernen haeufig?",
      answer:
        "Zu frueh versuchen, alles auswendig zu lernen, statt zuerst die Logik hinter den Regeln zu verstehen.",
    },
    {
      question: "Wie lang sollten Lerneinheiten sein?",
      answer:
        "Kurze Einheiten von 10 bis 20 Minuten mit klarem Fokus sind wirksamer als stundenlanges Lesen ohne Wiederholung.",
    },
  ],
  sampleTerms: [
    { term: "Gefahrgutunterweisung", note: "Pflichtschulung fuer Fahrer vor dem ersten Transport." },
    { term: "Lernziel", note: "Klares Thema oder Kompetenzbereich, den du als naechstes festigen willst." },
    { term: "Wiederholungsintervall", note: "Regelmaessiger Abstand zwischen Lerneinheiten fuer bessere Einpraegung." },
  ],
  whyTelegramTitle: "Warum der Bot eine echte Lernhilfe ist",
  whyTelegramParagraphs: [
    "Der Bot stellt Fragen in pruefungsnaher Sprache und erklaert sofort, wenn etwas unklar ist. Das ist effektiver als passives Lesen.",
    "Du kannst jederzeit kurze Einheiten machen, ohne ein Lehrbuch aufschlagen zu muessen.",
  ],
  faqs: [
    {
      question: "Brauche ich fuer ADR einen Kurs oder reicht Selbstlernen?",
      answer:
        "Fuer die Pruefung ist ein zugelassener Kurs erforderlich. Der Bot hilft beim Vor- und Nachbereiten, ersetzt aber keinen offiziellen Kurs.",
    },
    {
      question: "Kann ich ADR auf Deutsch lernen, obwohl ich kein Muttersprachler bin?",
      answer:
        "Ja. Viele Fahrer lernen ADR auf Deutsch als Zweitsprache. Der Bot ist genau dafuer gebaut.",
    },
    {
      question: "Ist diese Seite eher Lernhilfe als Bot-Seite?",
      answer:
        "Ja. Hier geht es um Struktur, Einstieg und Orientierung. Die konkrete Telegram-Loesung wird erst als naechster Schritt angeboten.",
    },
  ],
  relatedLinks: [
    { href: "/adr-pruefung-auf-deutsch", label: "ADR-Pruefung auf Deutsch", note: "Allgemeiner Einstieg" },
    { href: "/adr-deutsch-ueben", label: "ADR Deutsch ueben", note: "Aktives Ueben von Sprache und Fragen" },
    { href: "/adr-telegram-bot-deutsch", label: "ADR Telegram Bot Deutsch", note: "Wenn du nach der Lernhilfe direkt den Kanal suchst" },
  ],
  ctaTitle: "Jetzt mit echtem Lernen beginnen",
  ctaLead: "Der Telegram-Bot begleitet dich von den ersten Begriffen bis zur Pruefungsvorbereitung.",
  ctaButton: SEO_PRIMARY_CTA,
  disclaimer: "Diese Seite ist eine Lernvorschau und kein Ersatz fuer einen offiziellen ADR-Kurs.",
  telegramSource: "seo_adr_lernhilfe_deutsch",
  keywords: [
    "ADR Lernhilfe Deutsch",
    "ADR lernen Hilfe",
    "ADR Einstieg Deutsch",
    "ADR Lernhilfe Fahrer",
  ],
};


export const adrPruefungen: SeoPageConfig = {
  slug: "adr-pruefungen",
  path: "/adr-pruefungen",
  pageTitle: "ADR Pruefungen – Uebersicht und Vorbereitung",
  metaTitle: "ADR Pruefungen | Alle Kursarten, Ablauf und Vorbereitung",
  metaDescription:
    "ADR Pruefungen vorbereiten: Basiskurs, Aufbaukurs Tank, Klasse 1 und Auffrischung. Typische Fragen, Fachbegriffe und Lerntipps auf Deutsch. Kostenlos ueben.",
  heroKicker: SEO_PAGE_KICKER,
  heroTitle: "ADR Pruefungen – Uebersicht und Vorbereitung",
  heroLead:
    "ADR Pruefungen gibt es fuer verschiedene Kurstypen: Basiskurs, Aufbaukurs Tank, Klasse 1 und Auffrischungsschulung. Diese Seite gibt einen Ueberblick und hilft beim gezielten Vorbereiten.",
  heroSupport:
    "Wer weiss, welche Pruefung auf ihn zukommt, kann gezielter lernen. Fachsprache und typische Frageformate entscheiden oft mehr als das reine Fachwissen.",
  intentTitle: "Welche ADR Pruefungen gibt es?",
  intentParagraphs: [
    "ADR unterscheidet mehrere Kurstypen mit eigenen Pruefungen: der Basiskurs ist Pflicht fuer alle, Aufbaukurse kommen fuer spezielle Ladungsklassen dazu. Alle fuenf Jahre folgt die Auffrischungsschulung.",
    "Fuer Nicht-Muttersprachler ist die Fachsprache die groesste Huerde. Viele Fahrer kennen den Stoff, scheitern aber an der Formulierung der Fragen.",
  ],
  sampleTitle: "Typische ADR Pruefungsfragen",
  sampleLead:
    "So klingen echte Pruefungsfragen. Wer die Struktur kennt, ist im Pruefungsraum ruhiger.",
  sampleQuestions: [
    {
      question: "Welche ADR-Pruefung braucht ein Fahrer fuer Tankfahrzeuge?",
      answer:
        "Zusaetzlich zum Basiskurs ist der Aufbaukurs Tank Pflicht. Erst danach darf der Fahrer Tankfahrzeuge mit Gefahrgut fuehren.",
    },
    {
      question: "Wie oft muss die ADR-Pruefung wiederholt werden?",
      answer:
        "Der ADR-Schein ist fuenf Jahre gueltig. Vor Ablauf muss eine Auffrischungsschulung mit Pruefung absolviert werden.",
    },
    {
      question: "Was steht in der Basiskurs-Pruefung?",
      answer:
        "Gefahrgutklassen, Kennzeichnung, Beforderungspapiere, Tunnelkategorien und Verhaltenspflichten des Fahrers.",
    },
    {
      question: "Kann man die Pruefung auf Deutsch ablegen, ohne Muttersprachler zu sein?",
      answer:
        "Ja. Die Pruefung ist auf Deutsch, aber gezielte Vorbereitung mit Fachbegriffen reicht aus. Sprachliche Kenntnisse sind keine offizielle Voraussetzung.",
    },
  ],
  sampleTerms: [
    { term: "Basiskurs", note: "Pflicht fuer alle ADR-Fahrer, Grundlage aller weiteren Kurse." },
    { term: "Aufbaukurs Tank", note: "Zusatzpruefung fuer Tankfahrzeuge." },
    { term: "Auffrischungsschulung", note: "Alle fuenf Jahre vor Ablauf des ADR-Scheins." },
    { term: "ADR-Schein", note: "Bescheinigung nach bestandener Pruefung, fuenf Jahre gueltig." },
    { term: "Klasse 1", note: "Explosive Stoffe – eigener Aufbaukurs mit Pruefung." },
  ],
  sampleCalloutTitle: "Welche Pruefung brauchst du?",
  sampleCalloutText:
    "Basiskurs: alle Fahrer. Aufbaukurs Tank: Tankfahrzeuge. Klasse 1: Explosivstoffe. Auffrischung: alle fuenf Jahre. Der Bot trainiert dich fuer alle Kurstypen.",
  whyTelegramTitle: "Warum der Bot die beste Pruefungsvorbereitung ist",
  whyTelegramParagraphs: [
    "Der Bot stellt Fragen in echter Pruefungsformulierung und erklaert sofort, warum eine Antwort richtig oder falsch ist. Das baut Sicherheit fuer den Pruefungstag auf.",
    "Du kannst gezielt nach Kurstyp trainieren: Basiskurs, Tank oder Auffrischung. So lernst du nur, was fuer deine Pruefung relevant ist.",
  ],
  faqs: [
    {
      question: "Wie lange dauert eine ADR-Pruefung?",
      answer:
        "Je nach Kurstyp und Pruefungsstelle zwischen 45 und 90 Minuten. Die genaue Zeit legt die jeweilige IHK oder zugelassene Stelle fest.",
    },
    {
      question: "Wo kann man ADR-Pruefungen ablegen?",
      answer:
        "Bei zugelassenen Stellen, meist IHK oder DIHK-zertifizierte Anbieter. Die Anmeldung laeuft ueber den Kursanbieter.",
    },
    {
      question: "Was passiert bei Nichtbestehen?",
      answer:
        "Die Pruefung kann wiederholt werden. Eine Wartezeit und eventuelle Extrakosten haengen von der Pruefungsstelle ab.",
    },
    {
      question: "Reicht der Basiskurs fuer alle Transporte?",
      answer:
        "Nein. Fuer Tankfahrzeuge, Explosivstoffe (Klasse 1) oder radioaktive Stoffe (Klasse 7) sind Aufbaukurse Pflicht.",
    },
  ],
  relatedLinks: [
    { href: "/adr-pruefung-auf-deutsch", label: "ADR-Pruefung auf Deutsch", note: "Sprachfokus fuer die Pruefung" },
    { href: "/adr-pruefung-bestehen", label: "ADR Pruefung bestehen", note: "Tipps zum Bestehen" },
    { href: "/basiskurs-preview", label: "ADR Basiskurs", note: "Basiskurs-Fragen und Begriffe" },
    { href: "/aufbaukurs-tank-preview", label: "ADR Aufbaukurs Tank", note: "Tank-spezifische Vorbereitung" },
  ],
  ctaTitle: "Jetzt gezielt auf ADR Pruefungen vorbereiten",
  ctaLead:
    "Der Bot trainiert dich mit echten Frageformulierungen fuer Basiskurs, Tank und Auffrischung – kostenlos und in deiner Sprache.",
  ctaButton: SEO_PRIMARY_CTA,
  disclaimer: "Diese Seite ist kein offizielles Pruefungsangebot und gibt keine Garantie auf Pruefungserfolg.",
  telegramSource: "seo_adr_pruefungen",
  keywords: [
    "ADR Pruefungen",
    "ADR Pruefung Uebersicht",
    "ADR Basiskurs Pruefung",
    "ADR Aufbaukurs Pruefung",
    "ADR Schein Pruefung",
  ],
};


export const adrScheinKosten: SeoPageConfig = {
  slug: "adr-schein-kosten",
  path: "/adr-schein-kosten",
  pageTitle: "ADR Schein Kosten, Dauer und Ablauf",
  metaTitle: "ADR Schein Kosten 2025 | Preise, Dauer und Pruefungsablauf",
  metaDescription:
    "ADR Schein Kosten 2025: Basiskurs 275–345 EUR, Aufbaukurs Tank 175–230 EUR, IHK-Pruefung 45–75 EUR. Dauer, Ablauf und Tipps zur Vorbereitung auf Deutsch.",
  heroKicker: SEO_PAGE_KICKER,
  heroTitle: "ADR Schein – Kosten, Dauer und Ablauf",
  heroLead:
    "Wie viel kostet der ADR Schein, wie lange dauert der Kurs und wie laeuft die Pruefung ab? Diese Seite gibt klare Antworten fuer Basiskurs, Aufbaukurs Tank und Auffrischungsschulung.",
  heroSupport:
    "Viele Fahrer scheitern nicht am Stoff, sondern an unbekannter Fachsprache. Der Telegram-Bot hilft beim Lernen der Pruefungsbegriffe – kostenlos.",
  intentTitle: "Was kostet der ADR Schein?",
  intentParagraphs: [
    "Die Kosten haengen vom Kurstyp ab. Der Basiskurs kostet bei den meisten Anbietern zwischen 275 und 345 EUR plus IHK-Pruefungsgebuehr. Aufbaukurse sind kuerzer und guenstiger.",
    "Hinzu kommen die Pruefungsgebuehren der IHK oder des zugelassenen Pruefungszentrums, typischerweise 45 bis 75 EUR. Manche Arbeitgeber uebernehmen die Kosten vollstaendig.",
  ],
  sampleTitle: "Kosten und Dauer im Ueberblick",
  sampleLead:
    "Typische Richtwerte – die genauen Preise legt jeder Anbieter selbst fest.",
  sampleQuestions: [
    {
      question: "Was kostet der ADR Basiskurs?",
      answer:
        "Typisch 275 bis 345 EUR Kursgebuehr plus 45 bis 75 EUR IHK-Pruefungsgebuehr. Dauer: 3 Tage.",
    },
    {
      question: "Was kostet der Aufbaukurs Tank?",
      answer:
        "Typisch 175 bis 230 EUR Kursgebuehr plus Pruefungsgebuehr. Dauer: 1 bis 2 Tage.",
    },
    {
      question: "Wie oft muss der ADR Schein erneuert werden?",
      answer:
        "Alle fuenf Jahre. Die Auffrischungsschulung kostet typisch 150 bis 200 EUR.",
    },
    {
      question: "Uebernimmt der Arbeitgeber die Kosten?",
      answer:
        "Viele Speditionen bezahlen den Kurs, weil der ADR Schein den Fahrerwert deutlich steigert. Lohnt sich zu fragen.",
    },
  ],
  sampleTerms: [
    { term: "Basiskurs", note: "Pflichtgrundlage fuer alle ADR-Fahrer, 3 Tage, Gesamtkosten ca. 350–420 EUR." },
    { term: "Aufbaukurs Tank", note: "Zusatzkurs fuer Tankfahrzeuge, 1–2 Tage, ca. 200–300 EUR gesamt." },
    { term: "IHK-Pruefungsgebuehr", note: "45–75 EUR, wird separat von der IHK oder zugelassenen Stelle erhoben." },
    { term: "Auffrischungsschulung", note: "Alle 5 Jahre Pflicht vor Ablauf des Scheins, ca. 150–200 EUR." },
  ],
  sampleCalloutTitle: "Lohnt sich der ADR Schein?",
  sampleCalloutText:
    "Gefahrgutfahrer verdienen typisch 200 bis 500 EUR pro Monat mehr als ohne ADR Schein. Die Kurskosten amortisieren sich damit in einem bis zwei Monaten.",
  whyTelegramTitle: "Guenstig auf die Pruefung vorbereiten",
  whyTelegramParagraphs: [
    "Der Telegram-Bot trainiert mit echten Pruefungsfragen kostenlos. Wer die Fachbegriffe kennt, schafft die Pruefung sicherer – ohne teures Zusatzlernmaterial.",
    "Besonders fuer Nicht-Muttersprachler ist das Pruefungsdeutsch die groesste Huerde. Der Bot erklaert jeden Begriff auf Deutsch, Russisch, Tuerkisch und 7 weiteren Sprachen.",
  ],
  faqs: [
    {
      question: "Kann ich den ADR Schein auch ohne Kurs machen?",
      answer:
        "Nein. Die IHK-Pruefung setzt den Besuch eines zugelassenen Kurses voraus.",
    },
    {
      question: "Gibt es Foerderung oder Zuschuss fuer den ADR Kurs?",
      answer:
        "In manchen Faellen ja: Bildungsgutschein der Agentur fuer Arbeit, Qualifizierungsfoerderung oder Arbeitgeberkostenzuschuss. Beim Arbeitgeber und der Agentur fuer Arbeit nachfragen.",
    },
    {
      question: "Was passiert, wenn man die Pruefung nicht besteht?",
      answer:
        "Ein Wiederholungsversuch ist ohne neuen Kurs moeglich. Beim zweiten Nichtbestehen muss der Kurs wiederholt werden.",
    },
  ],
  relatedLinks: [
    { href: "/adr-pruefungen", label: "ADR Pruefungen Uebersicht", note: "Alle Kurstypen erklaert" },
    { href: "/adr-pruefung-bestehen", label: "ADR Pruefung bestehen", note: "Tipps zum Bestehen" },
    { href: "/adr-pruefungsfragen-lernen", label: "ADR Pruefungsfragen lernen", note: "Kostenlos ueben" },
  ],
  ctaTitle: "Kostenlos auf die ADR Pruefung vorbereiten",
  ctaLead:
    "Pruefungsfragen, Fachbegriffe und sofortige Erklaerungen – der Bot trainiert dich in deiner Sprache.",
  ctaButton: SEO_PRIMARY_CTA,
  disclaimer: "Preisangaben sind Richtwerte. Genaue Kosten legt jeder Anbieter individuell fest.",
  telegramSource: "seo_adr_schein_kosten",
  keywords: ["ADR Schein Kosten", "ADR Kurs Kosten", "ADR Basiskurs Preis", "ADR Schein Dauer"],
};

export const adrScheinAufRussisch: SeoPageConfig = {
  slug: "adr-schein-auf-russisch",
  path: "/adr-schein-auf-russisch",
  pageTitle: "ADR Pruefung auf Russisch, Tuerkisch und Ukrainisch",
  metaTitle: "ADR Pruefung auf Russisch moeglich? | Sprachen und Vorbereitung",
  metaDescription:
    "Die ADR-IHK-Pruefung kann auf Russisch, Tuerkisch, Ukrainisch, Polnisch und 4 weiteren Sprachen abgelegt werden. Lerne Fachbegriffe in deiner Sprache – kostenlos im Telegram-Bot.",
  heroKicker: SEO_PAGE_KICKER,
  heroTitle: "ADR Pruefung auf Russisch, Tuerkisch und Ukrainisch",
  heroLead:
    "Ja, die ADR-Pruefung ist in 8 Sprachen moeglich: Deutsch, Russisch, Tuerkisch, Ukrainisch, Polnisch, Arabisch, Rumaenisch und Kroatisch. Diese Seite erklaert, wie das geht.",
  heroSupport:
    "Fachbegriffe auf Russisch, Tuerkisch oder Ukrainisch lernen – der Telegram-Bot erklaert alle ADR-Pruefungsvokabeln in deiner Sprache.",
  intentTitle: "ADR Pruefung in welchen Sprachen moeglich?",
  intentParagraphs: [
    "Die IHK laesst die ADR-Pruefung offiziell in 8 Sprachen zu: Deutsch, Russisch, Tuerkisch, Ukrainisch, Polnisch, Hocharabisch, Rumaenisch und Kroatisch. Ob ein konkreter Pruefungsort eine bestimmte Sprache anbietet, muss beim Anbieter gefragt werden.",
    "Der Kurs selbst laeuft in der Regel auf Deutsch – aber die Pruefungsfragen koennen in der gewuenschten Sprache gestellt werden. Die Fachbegriffe auf Deutsch zu kennen ist trotzdem wichtig.",
  ],
  sampleTitle: "Wichtige Fachbegriffe – Deutsch und Russisch",
  sampleLead:
    "Wer die deutschen Begriffe kennt, besteht auch die Pruefung in einer anderen Sprache sicher.",
  sampleQuestions: [
    {
      question: "Kann ich die ADR-Pruefung auf Russisch ablegen?",
      answer:
        "Ja. Die IHK laesst Russisch als Pruefungssprache zu. Beim Kursanbieter oder der IHK anfragen, ob der Termin auf Russisch verfuegbar ist.",
    },
    {
      question: "Muss ich den Kurs auch auf Deutsch machen?",
      answer:
        "Der Kurs laeuft meist auf Deutsch. Die Pruefung kann aber in einer der 8 zugelassenen Sprachen abgelegt werden.",
    },
    {
      question: "Ist ein auslaendischer ADR Schein in Deutschland gueltig?",
      answer:
        "Ja. ADR-Bescheinigungen aus allen ADR-Vertragsstaaten (Ukraine, Polen, Russland, Rumaenien usw.) werden in Deutschland anerkannt – bis zum Ablaufdatum.",
    },
    {
      question: "Was ist der Vorteil, die Pruefung auf Russisch zu machen?",
      answer:
        "Schwieriger Pruefungsdeutsch-Stil wird verstaendlicher in der Muttersprache. Die Inhalte sind dieselben – aber die Chance, durch Sprachprobleme zu scheitern, sinkt.",
    },
  ],
  sampleTerms: [
    { term: "Gefahrgut (опасный груз)", note: "Stoffe, fuer die besondere Transportregeln gelten." },
    { term: "Kennzeichnung (маркировка)", note: "Sichtbare Markierung am Fahrzeug oder auf der Sendung." },
    { term: "Beforderungspapier (транспортный документ)", note: "Begleitdokument fuer den Transport." },
    { term: "UN-Nummer (номер ООН)", note: "Eindeutige internationale Nummer zur Stoff-Identifikation." },
    { term: "Gefahrzettel (знак опасности)", note: "Aufkleber fuer die Gefahrgutklasse." },
  ],
  sampleCalloutTitle: "Der Bot spricht deine Sprache",
  sampleCalloutText:
    "Alle Pruefungsbegriffe werden im Bot auf Russisch, Tuerkisch, Ukrainisch und 7 weiteren Sprachen erklaert. Du lernst den deutschen Begriff und verstehst ihn sofort.",
  whyTelegramTitle: "Warum der Bot fuer Nicht-Muttersprachler ideal ist",
  whyTelegramParagraphs: [
    "Der Bot erklaert jeden Fachbegriff auf Deutsch und in deiner Muttersprache. So lernst du nicht nur die Antwort, sondern auch die Formulierung.",
    "Russisch, Tuerkisch, Ukrainisch, Polnisch, Arabisch, Rumaenisch, Kroatisch und Englisch – alle Sprachen sind verfuegbar.",
  ],
  faqs: [
    {
      question: "Welche Sprachen sind bei der ADR-Pruefung zugelassen?",
      answer:
        "Offiziell 8 Sprachen: Deutsch, Russisch, Tuerkisch, Ukrainisch, Polnisch, Hocharabisch, Rumaenisch, Kroatisch.",
    },
    {
      question: "Gilt mein ukrainischer / polnischer ADR Schein in Deutschland?",
      answer:
        "Ja, solange er gueltig ist. ADR-Bescheinigungen sind unter allen ADR-Vertragsstaaten gegenseitig anerkannt.",
    },
    {
      question: "Wie finde ich einen ADR Kurs mit russischer Pruefungsoption?",
      answer:
        "Direkt beim Kursanbieter oder der zust. IHK anfragen. Nicht alle Stellen bieten alle 8 Sprachen an.",
    },
  ],
  relatedLinks: [
    { href: "/adr-pruefung-fuer-nicht-muttersprachler", label: "ADR Pruefung fuer Nicht-Muttersprachler", note: "Sprachfokus" },
    { href: "/adr-app-fuer-auslaender", label: "ADR App fuer Auslaender", note: "Bot und App Infos" },
    { href: "/adr-pruefungen", label: "ADR Pruefungen Uebersicht", note: "Alle Kurstypen" },
  ],
  ctaTitle: "ADR-Begriffe in deiner Sprache lernen",
  ctaLead:
    "Der Bot erklaert alle Pruefungsvokabeln auf Russisch, Tuerkisch, Ukrainisch und 7 weiteren Sprachen.",
  ctaButton: SEO_PRIMARY_CTA,
  disclaimer: "Sprachverfuegbarkeit der Pruefung haengt vom jeweiligen Pruefungszentrum ab. Vorab beim Anbieter anfragen.",
  telegramSource: "seo_adr_schein_auf_russisch",
  keywords: ["ADR Schein auf Russisch", "ADR Pruefung Russisch", "ADR Pruefung Tuerkisch", "ADR Schein Sprachen"],
};

export const adrKursWelcherKurs: SeoPageConfig = {
  slug: "adr-kurs-welcher-kurs",
  path: "/adr-kurs-welcher-kurs",
  pageTitle: "Welcher ADR Kurs ist der richtige fuer mich?",
  metaTitle: "Welcher ADR Kurs? Basiskurs vs. Aufbaukurs Unterschied erklaert",
  metaDescription:
    "Basiskurs, Aufbaukurs Tank, Klasse 1 oder Auffrischung? Diese Seite erklaert, welcher ADR Kurs fuer welchen Job Pflicht ist und wie man die richtige Wahl trifft.",
  heroKicker: SEO_PAGE_KICKER,
  heroTitle: "Welcher ADR Kurs ist der richtige fuer mich?",
  heroLead:
    "Nicht jeder Fahrer braucht denselben ADR Kurs. Basiskurs, Aufbaukurs Tank, Klasse 1 oder Auffrischung – diese Seite erklaert, welcher Kurs fuer welchen Job Pflicht ist.",
  heroSupport:
    "Wer den falschen Kurs macht, zahlt zweimal. Die richtige Wahl haengt von der Ladungsart und dem Fahrzeugtyp ab.",
  intentTitle: "ADR Kursuebersicht: Was ist fuer wen Pflicht?",
  intentParagraphs: [
    "Der Basiskurs ist die Grundlage – er ist Pflicht fuer alle Gefahrgutfahrer. Wer Tank-, Explosivstoff- oder radioaktive Ladung transportiert, braucht zusaetzlich den passenden Aufbaukurs.",
    "Alle fuenf Jahre folgt die Auffrischungsschulung, um den ADR Schein zu verlaengern. Wer das verpasst, muss den Basiskurs komplett wiederholen.",
  ],
  sampleTitle: "Schnell-Check: Welcher Kurs fuer welchen Job?",
  sampleLead:
    "Diese Faustregeln helfen bei der Entscheidung.",
  sampleQuestions: [
    {
      question: "Ich fahre normalen Gefahrgut-Stueckgut – was brauche ich?",
      answer:
        "Nur den Basiskurs. Er deckt alle Gefahrgutklassen im Stueckguttransport ab.",
    },
    {
      question: "Ich fahre Tankwagen – was brauche ich?",
      answer:
        "Basiskurs plus Aufbaukurs Tank. Ohne Aufbaukurs Tank ist das Fahren von Tankfahrzeugen mit Gefahrgut verboten.",
    },
    {
      question: "Ich transportiere Explosivstoffe (Klasse 1) – was brauche ich?",
      answer:
        "Basiskurs plus Aufbaukurs Klasse 1. Explosivstofftransporte sind stark reguliert.",
    },
    {
      question: "Mein ADR Schein laeuft bald ab – was tue ich?",
      answer:
        "Auffrischungsschulung rechtzeitig buchen, bevor der Schein ablaeuft. Ist er erst abgelaufen, muss der gesamte Basiskurs wiederholt werden.",
    },
  ],
  sampleTerms: [
    { term: "Basiskurs", note: "Pflicht fuer alle ADR-Fahrer. Deckt alle Gefahrgutklassen im Stueckgut ab." },
    { term: "Aufbaukurs Tank", note: "Pflicht fuer Tankfahrzeuge. Immer zusaetzlich zum Basiskurs." },
    { term: "Aufbaukurs Klasse 1", note: "Pflicht fuer Explosivstoffe. Immer zusaetzlich zum Basiskurs." },
    { term: "Aufbaukurs Klasse 7", note: "Pflicht fuer radioaktive Stoffe. Immer zusaetzlich zum Basiskurs." },
    { term: "Auffrischungsschulung", note: "Alle 5 Jahre Pflicht vor Ablauf. Verpasst = Basiskurs wiederholen." },
  ],
  sampleCalloutTitle: "Wichtig: Schein abgelaufen = von vorn anfangen",
  sampleCalloutText:
    "Wer die Auffrischungsschulung verpasst und der Schein ablaeuft, muss den gesamten Basiskurs neu machen – nicht nur die Auffrischung. Rechtzeitig buchen!",
  whyTelegramTitle: "Fuer welchen Kurs auch immer – der Bot hilft beim Lernen",
  whyTelegramParagraphs: [
    "Der Bot hat Pruefungsfragen fuer Basiskurs, Aufbaukurs Tank, Klasse 1 und Auffrischung. Du wahlst deinen Kurstyp und trainierst gezielt.",
    "Fachbegriffe werden in deiner Sprache erklaert – Deutsch, Russisch, Tuerkisch, Ukrainisch und weitere.",
  ],
  faqs: [
    {
      question: "Kann ich Basiskurs und Aufbaukurs Tank gleichzeitig machen?",
      answer:
        "Ja, viele Anbieter kombinieren beide Kurse in einer Woche. Das spart Zeit und oft auch Kosten.",
    },
    {
      question: "Brauche ich fuer jeden Aufbaukurs einen separaten Schein?",
      answer:
        "Ja. Jeder Aufbaukurs fuehrt zu einer eigenen Eintragung in der ADR-Bescheinigung.",
    },
    {
      question: "Was gilt, wenn ich den falschen Kurs gemacht habe?",
      answer:
        "Der fehlende Kurs muss nachgeholt werden. Es gibt keine Ausnahmen fuer berufliche Dringlichkeit.",
    },
  ],
  relatedLinks: [
    { href: "/adr-schein-kosten", label: "ADR Schein Kosten und Dauer", note: "Preise fuer jeden Kurstyp" },
    { href: "/adr-pruefungen", label: "ADR Pruefungen Uebersicht", note: "Alle Pruefungstypen" },
    { href: "/basiskurs-preview", label: "ADR Basiskurs", note: "Basiskurs-Fragen und Begriffe ueben" },
    { href: "/aufbaukurs-tank-preview", label: "ADR Aufbaukurs Tank", note: "Tank-Pruefung vorbereiten" },
  ],
  ctaTitle: "Jetzt gezielt fuer deinen Kurs lernen",
  ctaLead:
    "Basiskurs, Tank oder Auffrischung – der Bot stellt Fragen genau fuer deinen Kurstyp.",
  ctaButton: SEO_PRIMARY_CTA,
  disclaimer: "Diese Seite gibt allgemeine Orientierung. Verbindliche Kursanforderungen legt der jeweilige Arbeitgeber und die IHK fest.",
  telegramSource: "seo_adr_kurs_welcher_kurs",
  keywords: ["ADR Kurs welcher", "ADR Basiskurs Aufbaukurs Unterschied", "welcher ADR Schein", "ADR Kurs Uebersicht"],
};

export const adrScheinVerlaengern: SeoPageConfig = {
  slug: "adr-schein-verlaengern",
  path: "/adr-schein-verlaengern",
  pageTitle: "ADR Schein verlaengern – Auffrischung und abgelaufener Schein",
  metaTitle: "ADR Schein verlaengern | Auffrischungsschulung und abgelaufener Schein",
  metaDescription:
    "ADR Schein verlaengern: Auffrischungsschulung rechtzeitig buchen. Schein abgelaufen? Basiskurs wiederholen. Alle Infos zu Fristen, Ablauf und Kosten.",
  heroKicker: SEO_PAGE_KICKER,
  heroTitle: "ADR Schein verlaengern – was du wissen musst",
  heroLead:
    "Der ADR Schein ist fuenf Jahre gueltig. Wer die Auffrischungsschulung rechtzeitig macht, verlaengert einfach. Wer den Schein ablaufen laesst, muss den gesamten Basiskurs wiederholen.",
  heroSupport:
    "Die Auffrischungsschulung muss abgeschlossen sein, bevor der aktuelle Schein ablaeuft. Danach gibt es keine Kulanz.",
  intentTitle: "Fristen und Regeln fuer die Verlaengerung",
  intentParagraphs: [
    "Der ADR Schein laeuft am aufgedruckten Datum ab. Die Auffrischungsschulung muss vor diesem Datum abgeschlossen und die Pruefung bestanden sein.",
    "Ist der Schein erst abgelaufen, gibt es keine Moeglichkeit zur Auffrischung – dann muss der komplette Basiskurs neu gemacht werden. Das kostet mehr Zeit und Geld.",
  ],
  sampleTitle: "Haeufige Fragen zur Verlaengerung",
  sampleLead:
    "Die wichtigsten Punkte kurz und klar.",
  sampleQuestions: [
    {
      question: "Wie lange vor Ablauf muss ich die Auffrischung machen?",
      answer:
        "So frueh wie moeglich – idealerweise 3 bis 6 Monate vor Ablauf. Es gibt keine gesetzlich vorgeschriebene Mindestfrist, aber Kursplaetze sind oft ausgebucht.",
    },
    {
      question: "Was passiert, wenn mein ADR Schein abgelaufen ist?",
      answer:
        "Du darfst keine Gefahrguttransporte mehr durchfuehren. Eine Auffrischung ist nicht mehr moeglich – du musst den vollen Basiskurs wiederholen.",
    },
    {
      question: "Kann ich mit abgelaufenem Schein noch fahren?",
      answer:
        "Nein. Das ist eine Ordnungswidrigkeit und kann zu Bussgeldern und Betriebsverboten fuehren.",
    },
    {
      question: "Gilt die Verlaengerung fuer alle meine ADR-Kurse gleichzeitig?",
      answer:
        "Ja. Eine Auffrischungsschulung verlaengert alle eingetragenen ADR-Kurse (Basiskurs, Aufbaukurse) gleichzeitig.",
    },
  ],
  sampleTerms: [
    { term: "Auffrischungsschulung", note: "Verlaengerungskurs, Pflicht alle 5 Jahre vor Ablauf des Scheins." },
    { term: "Ablaufdatum", note: "Aufgedrucktes Datum auf der ADR-Bescheinigung – danach ist der Schein ungueltig." },
    { term: "Wiederholungspruefung", note: "Pruefung am Ende der Auffrischungsschulung." },
    { term: "Basiskurs-Wiederholung", note: "Notwendig, wenn der Schein bereits abgelaufen ist." },
  ],
  sampleCalloutTitle: "Nicht warten – jetzt buchen",
  sampleCalloutText:
    "Kursplaetze fuer Auffrischungsschulungen sind oft Wochen im Voraus ausgebucht. Wer zu spaet anfaengt zu suchen, riskiert eine Luecke ohne gueltigen Schein.",
  whyTelegramTitle: "Auf die Auffrischungspruefung vorbereiten",
  whyTelegramParagraphs: [
    "Auch die Auffrischungspruefung enthaelt echte Pruefungsfragen. Der Bot trainiert dich gezielt fuer Auffrischungsfragen – in deiner Sprache.",
    "Wer sich mit typischen Pruefungsformulierungen vertraut macht, besteht die Auffrischungspruefung sicher im ersten Versuch.",
  ],
  faqs: [
    {
      question: "Kann ich den ADR Schein auch online verlaengern?",
      answer:
        "Nein. Die Auffrischungsschulung muss in Praesenz absolviert werden. Online-Kurse sind nicht zugelassen.",
    },
    {
      question: "Bekomme ich einen neuen Schein nach der Auffrischung?",
      answer:
        "Ja. Nach bestandener Pruefung wird eine neue ADR-Bescheinigung mit neuer 5-Jahres-Frist ausgestellt.",
    },
    {
      question: "Was kostet die Auffrischungsschulung?",
      answer:
        "Typisch 150 bis 200 EUR Kursgebuehr plus IHK-Pruefungsgebuehr von ca. 45 bis 75 EUR.",
    },
  ],
  relatedLinks: [
    { href: "/adr-schein-kosten", label: "ADR Schein Kosten und Dauer", note: "Preise fuer alle Kurstypen" },
    { href: "/adr-kurs-welcher-kurs", label: "Welcher ADR Kurs?", note: "Uebersicht aller Kurstypen" },
    { href: "/adr-pruefung-bestehen", label: "ADR Pruefung bestehen", note: "Tipps zum Bestehen" },
  ],
  ctaTitle: "Jetzt auf die Auffrischungspruefung vorbereiten",
  ctaLead:
    "Der Bot trainiert mit Auffrischungsfragen – kostenlos, in deiner Sprache, jederzeit.",
  ctaButton: SEO_PRIMARY_CTA,
  disclaimer: "Diese Seite gibt allgemeine Orientierung zu Fristen und Ablauf. Verbindliche Regeln legt die zust. IHK fest.",
  telegramSource: "seo_adr_schein_verlaengern",
  keywords: ["ADR Schein verlaengern", "ADR Schein abgelaufen", "ADR Auffrischungsschulung", "ADR Schein Gueltigkeit"],
};


export const adrPruefungDurchgefallen: SeoPageConfig = {
  slug: "adr-pruefung-durchgefallen",
  path: "/adr-pruefung-durchgefallen",
  pageTitle: "ADR Pruefung durchgefallen – was jetzt?",
  metaTitle: "ADR Pruefung durchgefallen | Wiederholungspruefung und naechste Schritte",
  metaDescription:
    "ADR Pruefung nicht bestanden? Ein Wiederholungsversuch ist moeglich. Was passiert beim zweiten Nichtbestehen, wie lange warten und wie besser vorbereiten.",
  heroKicker: SEO_PAGE_KICKER,
  heroTitle: "ADR Pruefung durchgefallen – was jetzt?",
  heroLead:
    "Nicht bestanden ist kein Grund zur Panik. Ein Wiederholungsversuch ist ohne neuen Kurs moeglich. Diese Seite erklaert die naechsten Schritte.",
  heroSupport:
    "Der haeufigste Grund fuer Nichtbestehen ist nicht fehlendes Fachwissen, sondern unbekannte Fachsprache. Das laesst sich schnell aendern.",
  intentTitle: "Was passiert nach einem Nichtbestehen?",
  intentParagraphs: [
    "Wer die ADR-Pruefung nicht besteht, darf einmal wiederholen – ohne den Kurs nochmals besuchen zu muessen. Die Wiederholungspruefung wird bei derselben Pruefungsstelle angemeldet.",
    "Scheitert auch der zweite Versuch, muss der Kurs komplett wiederholt werden. Danach sind wieder zwei Pruefungsversuche moeglich.",
  ],
  sampleTitle: "Typische Gruende fuer Nichtbestehen",
  sampleLead:
    "Wer weiss, warum er gescheitert ist, kann gezielter lernen.",
  sampleQuestions: [
    {
      question: "Was ist der haeufigste Grund fuer Nichtbestehen?",
      answer:
        "Unbekannte Fachbegriffe und formelle Frageformulierungen. Wer den Inhalt kennt, aber die deutsche Pruefungssprache nicht versteht, gibt falsche Antworten.",
    },
    {
      question: "Wie viele Versuche habe ich?",
      answer:
        "Zwei Versuche ohne Kurspflicht. Beim dritten Versuch muss der Kurs wiederholt werden.",
    },
    {
      question: "Wie lange muss ich nach dem Nichtbestehen warten?",
      answer:
        "Es gibt keine gesetzliche Wartezeit. Wann der naechste Termin verfuegbar ist, legt die Pruefungsstelle fest.",
    },
    {
      question: "Was sollte ich vor der Wiederholungspruefung anders machen?",
      answer:
        "Gezielt Fachbegriffe lernen, typische Frageformulierungen ueben und die eigenen Schwachthemen identifizieren. Der Telegram-Bot hilft dabei.",
    },
  ],
  sampleTerms: [
    { term: "Wiederholungspruefung", note: "Neue Pruefung nach Nichtbestehen, ohne Kurspflicht beim ersten Mal." },
    { term: "Bestehensgrenze", note: "Mindestpunktzahl, die fuer ein Bestehen erreicht werden muss." },
    { term: "Pruefungsprotokoll", note: "Dokument mit den Pruefungsergebnissen – zeigt Schwachthemen." },
  ],
  sampleCalloutTitle: "Tipp: Schwachthemen gezielt lernen",
  sampleCalloutText:
    "Viele Fahrer scheitern immer wieder an denselben Themen: Gefahrgutkennzeichnung, Tunnelkategorien und Beforderungsdokumente. Der Bot trainiert genau diese Bereiche.",
  whyTelegramTitle: "Besser vorbereitet in die Wiederholungspruefung",
  whyTelegramParagraphs: [
    "Der Bot stellt echte Pruefungsfragen mit sofortiger Erklaerung. So erkennst du, welche Themen du noch nicht sicher beherrschst – bevor es in der Pruefung passiert.",
    "Pruefungsdeutsch ist eine eigene Sprache. Der Bot erklaert jeden Begriff auch auf Russisch, Tuerkisch und Ukrainisch – damit Sprachbarrieren nicht mehr der Grund fuers Scheitern sind.",
  ],
  faqs: [
    {
      question: "Muss ich nach dem Nichtbestehen den Kurs nochmal besuchen?",
      answer:
        "Beim ersten Nichtbestehen nein – ein Wiederholungsversuch ist ohne Kurs moeglich. Erst beim zweiten Nichtbestehen muss der Kurs wiederholt werden.",
    },
    {
      question: "Bekomme ich meine Pruefungsergebnisse zurueck?",
      answer:
        "Ja, die Pruefungsstelle teilt mit, welche Bereiche nicht bestanden wurden. Diese Rueckmeldung ist wertvoll fuer die gezielte Vorbereitung.",
    },
    {
      question: "Zahlt der Arbeitgeber die Wiederholungspruefung?",
      answer:
        "Das haengt vom Arbeitgeber ab. Viele uebernehmen auch Wiederholungspruefungskosten, wenn der Fahrer zeigt, dass er sich gezielt vorbereitet.",
    },
  ],
  relatedLinks: [
    { href: "/adr-pruefung-bestehen", label: "ADR Pruefung bestehen", note: "Tipps zum sicheren Bestehen" },
    { href: "/adr-pruefungsfragen-lernen", label: "ADR Pruefungsfragen lernen", note: "Gezielt ueben" },
    { href: "/adr-pruefungen", label: "ADR Pruefungen Uebersicht", note: "Alle Kurstypen" },
  ],
  ctaTitle: "Jetzt gezielt auf die Wiederholungspruefung vorbereiten",
  ctaLead:
    "Pruefungsfragen, Schwachthemen identifizieren, Fachbegriffe lernen – der Bot hilft dir, beim naechsten Mal zu bestehen.",
  ctaButton: SEO_PRIMARY_CTA,
  disclaimer: "Pruefungsregelungen koennen je nach IHK und Bundesland leicht abweichen. Verbindliche Auskunft gibt die jeweilige Pruefungsstelle.",
  telegramSource: "seo_adr_pruefung_durchgefallen",
  keywords: ["ADR Pruefung durchgefallen", "ADR Wiederholungspruefung", "ADR Pruefung nicht bestanden", "ADR zweiter Versuch"],
};

export const seoPageList = [
  adrPruefungAufDeutsch,
  basiskursPreview,
  adrFaqFuerFahrer,
  adrBegriffeVocabulary,
  aufbaukursTankPreview,
  technischesDeutschAdr,
  gefahrgutDeutschLernen,
  adrVorbereitungFuerLkwFahrer,
  adrPruefungFuerNichtMuttersprachler,
  adrFragenUndAntworten,
  adrPruefungsfragenAppDeutsch,
  adrFragenAufDeutsch,
  adrFachbegriffeDeutsch,
  adrDeutschFuerLkwFahrer,
  adrPruefungDeutschLernen,
  gefahrgutPruefungAufDeutsch,
  adrAppFuerAuslaender,
  adrTelegramBotDeutsch,
  adrPruefungsfragenLernen,
  adrTestDeutsch,
  adrFragebogenDeutsch,
  adrKursDeutsch,
  adrScheinDeutsch,
  adrPruefungHilfe,
  adrDeutschUeben,
  adrPruefungBestehen,
  adrPruefungen,
  adrScheinKosten,
  adrScheinAufRussisch,
  adrKursWelcherKurs,
  adrScheinVerlaengern,
  adrPruefungDurchgefallen,
  adrGefahrgutSymboleDeutsch,
  adrKlassenDeutsch,
  adrWiederholungDeutsch,
  adrLernhilfeDeutsch,
] as const;

const GENERIC_RELATED_PATHS = new Set([
  "/",
  "/adr-pruefung-auf-deutsch",
  "/adr-begriffe",
  "/basiskurs-preview",
  "/adr-faq-fuer-fahrer",
]);

function tokenizeSeoText(value: string): string[] {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9äöüß ]+/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .filter(
      (token) =>
        ![
          "adr",
          "bot",
          "deutsch",
          "deutsche",
          "fuer",
          "und",
          "mit",
          "auf",
          "der",
          "die",
          "das",
          "ein",
          "eine",
          "im",
          "in",
          "zu",
          "von",
          "fragen",
          "frage",
          "preview",
          "pruefung",
          "lernen",
        ].includes(token),
    );
}

function seoTokenSet(page: SeoPageConfig): Set<string> {
  return new Set(
    tokenizeSeoText(
      [
        page.slug,
        page.pageTitle,
        page.metaTitle,
        page.heroTitle,
        ...(page.keywords || []),
      ].join(" "),
    ),
  );
}

function seoSimilarity(left: SeoPageConfig, right: SeoPageConfig): number {
  const leftTokens = seoTokenSet(left);
  const rightTokens = seoTokenSet(right);
  const intersection = [...leftTokens].filter((token) => rightTokens.has(token)).length;
  const union = new Set([...leftTokens, ...rightTokens]).size;
  return union > 0 ? intersection / union : 0;
}

function fallbackFaqsForPage(page: SeoPageConfig): SeoFaqCard[] {
  return [
    {
      question: `Ist ${page.pageTitle} hier komplett erklärt?`,
      answer:
        `Nein. Diese Seite bleibt bewusst kompakt und zeigt nur eine Vorschau zu ${page.pageTitle}. Die eigentliche Tiefe und Wiederholung läuft im Telegram-Bot.`,
    },
    {
      question: `Für wen ist ${page.pageTitle} besonders hilfreich?`,
      answer:
        `Vor allem für Menschen, die bei ADR erst Orientierung brauchen, mit dem Prüfungsdeutsch ringen oder vor dem Bot zuerst ein kleines verständliches Sample sehen möchten.`,
    },
    {
      question: `Was ist der nächste sinnvolle Schritt nach ${page.pageTitle}?`,
      answer:
        "Nach der kurzen Vorschau direkt in den Telegram-Bot wechseln und dort mit mehr Fragen, Begriffen und Wiederholung weitermachen.",
    },
  ];
}

export function getSeoPageFaqs(page: SeoPageConfig): SeoFaqCard[] {
  const manual = page.faqs ?? [];
  if (manual.length >= 3) return manual;

  const seen = new Set(manual.map((item) => item.question.trim().toLowerCase()));
  const filled = [...manual];
  for (const item of fallbackFaqsForPage(page)) {
    const key = item.question.trim().toLowerCase();
    if (seen.has(key)) continue;
    filled.push(item);
    seen.add(key);
    if (filled.length >= 3) break;
  }
  return filled;
}

function autoRelatedLinks(page: SeoPageConfig): SeoRelatedLink[] {
  return seoPageList
    .filter((entry) => entry.path !== page.path)
    .map((entry) => ({ entry, score: seoSimilarity(page, entry) }))
    .filter(({ score }) => score > 0)
    .sort((left, right) => right.score - left.score || left.entry.pageTitle.localeCompare(right.entry.pageTitle))
    .slice(0, 4)
    .map(({ entry }) => ({
      href: entry.path,
      label: entry.pageTitle,
      note: "Passender nächster Schritt im selben ADR-Intent-Cluster.",
    }));
}

export function getSeoPageRelatedLinks(page: SeoPageConfig): SeoRelatedLink[] {
  const manualSpecific = page.relatedLinks.filter((link) => !GENERIC_RELATED_PATHS.has(link.href));
  const manualGeneric = page.relatedLinks.filter((link) => GENERIC_RELATED_PATHS.has(link.href));
  const auto = autoRelatedLinks(page);
  const merged: SeoRelatedLink[] = [];
  const seen = new Set<string>();

  for (const link of [...manualSpecific, ...auto, ...manualGeneric]) {
    if (!link.href || link.href === page.path || seen.has(link.href)) continue;
    merged.push(link);
    seen.add(link.href);
    if (merged.length >= 3) break;
  }

  return merged;
}

export function buildSeoPageStructuredData(
  page: SeoPageConfig,
): StructuredDataRecord[] {
  const pageUrl = `${siteUrl}${page.path}`;
  const webpageId = `${pageUrl}#webpage`;
  const breadcrumbId = `${pageUrl}#breadcrumb`;
  const faqs = getSeoPageFaqs(page);

  const data: StructuredDataRecord[] = [
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "@id": webpageId,
      url: pageUrl,
      name: page.metaTitle,
      headline: page.heroTitle,
      description: page.metaDescription,
      inLanguage: siteConfig.defaultLocale,
      isPartOf: {
        "@type": "WebSite",
        "@id": `${siteUrl}/#website`,
      },
      about: {
        "@type": "Thing",
        name: page.pageTitle,
      },
      breadcrumb: {
        "@id": breadcrumbId,
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "@id": breadcrumbId,
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "ADR Bot",
          item: siteUrl,
        },
        {
          "@type": "ListItem",
          position: 2,
          name: page.pageTitle,
          item: pageUrl,
        },
      ],
    },
  ];

  if (faqs.length) {
    data.push({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "@id": `${pageUrl}#faq`,
      mainEntity: faqs.map((item) => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: item.answer,
        },
      })),
    });
  }

  return data;
}

export function buildSeoPageMetadata(page: SeoPageConfig): Metadata {
  return {
    title: { absolute: page.metaTitle },
    description: page.metaDescription,
    alternates: {
      canonical: page.path,
    },
    keywords: [...sharedKeywords, ...page.keywords],
    openGraph: {
      title: page.metaTitle,
      description: page.metaDescription,
      type: "website",
      locale: siteConfig.defaultLocale,
      siteName: siteConfig.name,
      url: `${siteUrl}${page.path}`,
      images: [
        {
          url: "/opengraph-image",
          width: 1200,
          height: 630,
          alt: page.pageTitle,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: page.metaTitle,
      description: page.metaDescription,
      images: ["/opengraph-image"],
    },
  };
}
