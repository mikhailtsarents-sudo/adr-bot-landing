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
  metaTitle: "ADR-Pruefung auf Deutsch | Begriffe, Fragen und Tipps",
  metaDescription:
    "Lerne ADR auf Deutsch mit kurzen Beispielen, wichtigen Begriffen und einem kleinen Fragen-Sample. Fuer mehr Uebung geht es in den Telegram-Bot.",
  heroKicker: SEO_PAGE_KICKER,
  heroTitle: "ADR-Pruefung auf Deutsch",
  heroLead:
    "Kurzer Einstieg in ADR auf Deutsch mit kleinen Beispielen, klaren Begriffen und einem begrenzten Sample. Die volle Uebung geht im Telegram-Bot weiter.",
  heroSupport:
    "Diese Seite zeigt bewusst nur einen Ausschnitt. Sie hilft beim Verstehen, Orientieren und Weiterklicken.",
  intentTitle: "Worum es hier geht",
  intentParagraphs: [
    "Diese Seite hilft Menschen, die ADR auf Deutsch suchen und zuerst eine kleine Orientierung brauchen. Sie ist als Einstieg gebaut, nicht als vollstaendige Wissensdatenbank.",
    "Du bekommst kleine, lesbare Beispiele, damit du schnell verstehst, wie die Begriffe und die Sprache rund um ADR klingen. Fuer die komplette Uebung fuehrt der naechste Schritt in den Telegram-Bot.",
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
    { href: "/", label: "Startseite", note: "Zurueck zum Haupt-Landingpage-Flow" },
    {
      href: "/basiskurs-preview",
      label: "Basiskurs Preview",
      note: "Breiter Einstieg in den wichtigsten Kurs",
    },
    {
      href: "/adr-faq-fuer-fahrer",
      label: "ADR FAQ fuer Fahrer",
      note: "Kurze Antworten auf die haeufigsten Fragen",
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
  pageTitle: "Basiskurs Preview",
  metaTitle: "Basiskurs Preview | ADR Fragen und Woerter",
  metaDescription:
    "Sieh dir ein kleines Preview vom Basiskurs an: wenige Fragen, wichtige Woerter und kurze Erklaerungen. Die volle Uebung geht im Telegram-Bot weiter.",
  heroKicker: SEO_PAGE_KICKER,
  heroTitle: "Basiskurs Preview",
  heroLead:
    "Sieh dir ein kleines Preview vom Basiskurs an: wenige Fragen, wichtige Woerter und kurze Erklaerungen. Die volle Uebung geht im Telegram-Bot weiter.",
  heroSupport:
    "Diese Seite ist bewusst klein gehalten. Sie gibt dir ein nueszliches Sample und laesst die komplette Tiefe im Bot.",
  intentTitle: "Worum es hier geht",
  intentParagraphs: [
    "Der Basiskurs ist der wichtigste Einstieg fuer viele Nutzer. Darum bekommt er eine eigene SEO-Seite mit einer kleinen, aber nuetzlichen Vorschau.",
    "Die Seite soll Suchintentionen wie Basiskurs, Grundwissen und ADR-Vorbereitung abholen, ohne den vollen Kurs komplett zu kopieren.",
  ],
  sampleTitle: "Basiskurs Sample",
  sampleLead:
    "Ein paar Fragen und Woerter reichen, um den Nutzen zu zeigen und den Rest im Bot zu lassen.",
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
  pageTitle: "Aufbaukurs Tank Preview",
  metaTitle: "Aufbaukurs Tank Preview | ADR Tank Fragen und Begriffe",
  metaDescription:
    "Kurzes Preview zum Aufbaukurs Tank mit wenigen Beispiel-Fragen, wichtigen Begriffen und klarer Weiterleitung in den Telegram-Bot.",
  heroKicker: SEO_PAGE_KICKER,
  heroTitle: "Aufbaukurs Tank Preview",
  heroLead:
    "Kurzes Preview zum Aufbaukurs Tank mit wenigen Beispiel-Fragen, wichtigen Begriffen und klarer Weiterleitung in den Telegram-Bot.",
  heroSupport:
    "Die Seite ist bewusst klein. Sie zeigt den Tank-Kontext, aber nicht den kompletten Trainingsinhalt.",
  intentTitle: "Worum es hier geht",
  intentParagraphs: [
    "Diese Seite ist fuer Nutzer gedacht, die speziell nach Tank-bezogener ADR-Vorbereitung suchen.",
    "Sie erklaert kurz den Kontext, zeigt ein kleines Sample und macht klar, dass die volle Uebung im Bot weitergeht.",
  ],
  sampleTitle: "Tank Sample",
  sampleLead:
    "Ein kleiner Auszug reicht, um Relevanz zu zeigen und den Rest im Bot zu lassen.",
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
  sampleCalloutText:
    "Die Preview soll nueszlich sein, aber die komplette Wiederholung und die groessere Fragenmenge bleiben im Bot.",
  whyTelegramTitle: "Warum Telegram der naechste Schritt ist",
  whyTelegramParagraphs: [
    "Der Bot bietet mehr Fragen, mehr Wiederholung und die vollstaendige Uebung fuer den Tank-Kontext.",
    "Die Seite ist der Einstieg, nicht das Endziel. Genau so bleibt die SEO-Seite hilfreich und die Conversion klar.",
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
  ctaTitle: "Tank weiter im Telegram-Bot ueben",
  ctaLead:
    "Wenn du den Kontext schon kennst, bekommst du im Bot mehr Wiederholung und mehr relevante Fragen.",
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
  heroLead:
    "Viele scheitern nicht am Stoff, sondern an der Sprache. Diese Seite zeigt technisches Deutsch fuer ADR in kleinen, lesbaren Beispielen.",
  heroSupport:
    "Die Vorschau bleibt bewusst kompakt. Mehr Begriffe, mehr Wiederholung und mehr Drill liegen im Telegram-Bot.",
  intentTitle: "Warum technisches Deutsch hier so wichtig ist",
  intentParagraphs: [
    "Wer ADR auf Deutsch lernt, kaempft oft weniger mit Regeln als mit Formulierungen. Genau deshalb ist technisches Deutsch ein eigener SEO-Einstieg mit klarer Suchintention.",
    "Die Seite nimmt typische Sprachhuerden aus Fragen, Begriffen und kurzen Satzmustern auf. Danach fuehrt sie sauber in den Bot, wo der eigentliche Drill beginnt.",
  ],
  sampleTitle: "Sprach-Sample",
  sampleLead:
    "Ein kleiner Wortschatz-Ausschnitt zeigt schnell, woran es im Pruefungsdeutsch oft haengt.",
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
  sampleCalloutText:
    "Viele Antwortfehler entstehen, weil ein einzelnes Fachwort falsch verstanden wird. Die volle Wiederholung und mehr Beispiele liegen im Bot.",
  whyTelegramTitle: "Warum Telegram danach sinnvoll ist",
  whyTelegramParagraphs: [
    "Im Bot lassen sich Begriffe und Frageformulierungen mehrfach wiederholen, statt sie nur einmal auf einer Seite zu lesen.",
    "So bleibt die Seite ein guter Google-Einstieg, waehrend der Bot das aktive Lernen uebernimmt.",
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
    { href: "/", label: "Startseite", note: "Zurueck zum Haupt-Landingpage-Flow" },
    {
      href: "/adr-begriffe",
      label: "ADR Begriffe",
      note: "Der allgemeine Wortschatz-Einstieg",
    },
    {
      href: "/adr-pruefung-auf-deutsch",
      label: "ADR-Pruefung auf Deutsch",
      note: "Breiter Einstieg in Fragen und Begriffe",
    },
  ],
  ctaTitle: "Technisches Deutsch weiter in Telegram ueben",
  ctaLead:
    "Wenn dir die Vorschau geholfen hat, bekommst du im Bot mehr Begriffe, mehr Satzmuster und mehr Wiederholung.",
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
    { href: "/", label: "Startseite", note: "Zurueck zum Haupt-Landingpage-Flow" },
    {
      href: "/technisches-deutsch-adr",
      label: "Technisches Deutsch fuer ADR",
      note: "Sprachfokus auf Pruefungsdeutsch und Formulierungen",
    },
    {
      href: "/adr-begriffe",
      label: "ADR Begriffe",
      note: "Mehr ADR-spezifischer Wortschatz",
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
  heroLead:
    "Diese Seite ist fuer Fahrer gedacht, die nicht nur nach ADR allgemein suchen, sondern nach einer praktischen Vorbereitung fuer ihren Alltag.",
  heroSupport:
    "Sie verbindet Fahrerkontext, Kursorientierung und ein kleines Fragen-Sample mit dem Uebergang in Telegram.",
  intentTitle: "Warum diese Suchintention stark ist",
  intentParagraphs: [
    "Viele Nutzer suchen nicht nach abstrakten Kursnamen, sondern nach etwas Konkretem: ADR-Vorbereitung fuer LKW-Fahrer. Das ist ein enger, kaufnaher und oft guenstiger SEO-Intent.",
    "Die Seite spricht genau diesen Fahrerkontext an, ohne den gesamten Trainingsinhalt offenzulegen. Sie erklaert den Einstieg und leitet dann in den Bot weiter.",
  ],
  sampleTitle: "Fahrer-Sample",
  sampleLead:
    "Kurze Fragen und Hinweise zeigen, wie die Vorbereitung fuer Fahrer gedacht ist.",
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
  sampleCalloutText:
    "Diese Seite soll sich fuer Fahrer direkt relevant anfuehlen. Die eigentliche Lernstrecke bleibt trotzdem im Bot.",
  whyTelegramTitle: "Warum Telegram danach sinnvoll ist",
  whyTelegramParagraphs: [
    "Der Bot ist besser geeignet fuer Wiederholung in kleinen Etappen, was besonders fuer Fahreralltag und knappe Zeitfenster passt.",
    "Die Seite oeffnet die Tuer ueber Google, der Bot uebernimmt das eigentliche Lernen.",
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
  ctaTitle: "ADR-Vorbereitung im Telegram-Bot fortsetzen",
  ctaLead:
    "Wenn du als Fahrer weiter ueben willst, bekommst du im Bot mehr Fragen und mehr Wiederholung.",
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
  heroLead:
    "Wenn du nach einer ADR Pruefungsfragen App auf Deutsch suchst, bist du meist schon sehr nah an der eigentlichen Vorbereitung. Diese Seite holt genau diesen Suchintentionstyp ab.",
  heroSupport:
    "Sie zeigt ein kleines Fragen-Sample und fuehrt danach in den Telegram-Bot, wo das eigentliche Training laeuft.",
  intentTitle: "Warum diese Suchanfrage fuer uns stark ist",
  intentParagraphs: [
    "Wer nach einer ADR Pruefungsfragen App auf Deutsch sucht, will in der Regel nicht nur Informationen lesen, sondern moeglichst direkt mit Fragen, Wiederholung und Lernroutine anfangen.",
    "Genau deshalb passt diese Seite gut zu unserem Produkt: Sie erklaert kurz den Nutzen, zeigt ein kleines Sample und fuehrt dann in den Telegram-Bot als eigentliche Lern-App weiter.",
  ],
  sampleTitle: "Mini-Sample fuer Suchende",
  sampleLead:
    "Gerade bei App-Suchen hilft ein kleines Fragen-Sample, damit sofort klar wird, welche Art Vorbereitung hier gemeint ist.",
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
  sampleCalloutText:
    "Diese Seite ist absichtlich knapp. Sie soll Suchende mit App-Intention sauber abholen und dann in den Bot weiterfuehren.",
  whyTelegramTitle: "Warum der Telegram-Bot hier die App-Rolle uebernimmt",
  whyTelegramParagraphs: [
    "Viele Menschen suchen nach App, meinen aber vor allem eine einfache, direkt nutzbare Lernoberflaeche mit Fragen und Wiederholung. Genau das liefert unser Telegram-Bot.",
    "So kann die Seite bei Google ranken, waehrend das eigentliche Produkt als gefuehrtes Lernformat im Bot stattfindet.",
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
  ctaTitle: "Direkt mit dem ADR Bot starten",
  ctaLead:
    "Wenn du nach einer ADR Pruefungsfragen App auf Deutsch gesucht hast, ist der Telegram-Bot der eigentliche naechste Schritt.",
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
  metaTitle: "ADR Fragen auf Deutsch | Fragen verstehen und ueben",
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
    "ADR Fragebogen Deutsch",
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
  heroLead:
    "Wer ADR lernen will, braucht nicht nur Antworten, sondern auch die richtigen Fachbegriffe. Diese Vorschauseite erklaert die wichtigsten Woerter auf Deutsch.",
  heroSupport:
    "Sie ist bewusst kompakt, damit Google den Intent versteht und der Bot die eigentliche Vertiefung uebernimmt.",
  intentTitle: "Warum Fachbegriffe ein eigener SEO-Cluster sind",
  intentParagraphs: [
    "Viele Nutzer suchen nicht nach einem Kursnamen, sondern nach einzelnen Woertern, die sie in Fragen oder Schulungsunterlagen nicht verstehen.",
    "Mit einer separaten Seite fuer Fachbegriffe bauen wir thematische Tiefe auf und holen Nutzer frueh in ihrer Recherche ab.",
  ],
  sampleTitle: "Fachbegriffe im Sample",
  sampleLead:
    "Ein kleiner Auszug zeigt das Muster und laesst den groesseren Wortschatz bewusst im Bot.",
  sampleTerms: [
    { term: "Gefahrzettel", note: "Sichtbare Kennzeichnung fuer eine Gefahrgut-Klasse." },
    { term: "Verpackungsgruppe", note: "Hilft bei der Einordnung des Gefahrenpotenzials." },
    { term: "Befuellung", note: "Wichtiger Begriff in Tank- und Handlingsituationen." },
    { term: "Freistellung", note: "Fall mit reduziertem Regelumfang innerhalb der Vorschriften." },
    { term: "Tunnelschild", note: "Relevanter Hinweis fuer die Streckenwahl." },
  ],
  sampleCalloutTitle: "Lernen ueber Sprache",
  sampleCalloutText:
    "Gerade fuer Berufskraftfahrer mit Deutsch als Zweitsprache ist Wortschatz oft der eigentliche Hebel.",
  whyTelegramTitle: "Warum Telegram dann mehr bringt",
  whyTelegramParagraphs: [
    "Im Bot koennen Fachbegriffe wiederholt, in Fragen eingebettet und dadurch schneller verankert werden.",
    "Das ist fuer SEO und Conversion gleichzeitig stark: Google bekommt Relevanz, Nutzer bekommen einen klaren Weiterweg.",
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
  ctaTitle: "Mehr Fachbegriffe im Telegram-Bot",
  ctaLead:
    "Wenn dir die wichtigsten Woerter schon helfen, bekommst du im Bot mehr Begriffe und mehr Wiederholung.",
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
  metaTitle: "ADR Pruefung Deutsch lernen | Fragen, Begriffe, Vorbereitung",
  metaDescription:
    "ADR Pruefung auf Deutsch lernen mit kleinem Fragen-Sample, wichtigen Begriffen und klarem Einstieg in den Telegram-Bot.",
  heroKicker: SEO_PAGE_KICKER,
  heroTitle: "ADR Pruefung Deutsch lernen",
  heroLead:
    "Diese Seite ist fuer Menschen gedacht, die ADR auf Deutsch lernen wollen und einen klaren, einfachen Einstieg suchen.",
  heroSupport:
    "Sie verbindet Suchintention, Sprachhilfe und einen direkten Uebergang in den Telegram-Bot.",
  intentTitle: "Was Google hier verstehen soll",
  intentParagraphs: [
    "Nicht jeder sucht nach Kursnamen. Viele Nutzer suchen ganz direkt nach der Aufgabe: ADR Pruefung auf Deutsch lernen.",
    "Genau deshalb ist diese Seite stark: sie spiegelt den Suchsatz fast eins zu eins und gibt Google eine sehr klare Relevanz.",
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
  relatedLinks: [
    { href: "/", label: "Startseite", note: "Zur Hauptseite zurueck" },
    {
      href: "/adr-pruefung-auf-deutsch",
      label: "ADR Pruefung auf Deutsch",
      note: "Allgemeinerer Einstieg zum gleichen Themenfeld",
    },
    {
      href: "/adr-fragen-auf-deutsch",
      label: "ADR Fragen auf Deutsch",
      note: "Fragenfokus mit typischen Formulierungen",
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
    "ADR Deutsch lernen",
    "ADR Pruefung lernen",
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
    "Genau deshalb sollte Google fuer diesen Begriff nicht nur die Startseite, sondern eine eigene, passend benannte Zielseite sehen.",
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
  relatedLinks: [
    { href: "/", label: "Startseite", note: "Zur Hauptseite zurueck" },
    {
      href: "/adr-pruefungsfragen-app-deutsch",
      label: "ADR Pruefungsfragen App Deutsch",
      note: "App-intent mit aehnlicher Suchlogik",
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
  heroLead:
    "Diese Seite spricht Nutzer an, die nicht nur lesen, sondern gezielt Pruefungsfragen lernen und wiederholen wollen.",
  heroSupport:
    "Genau dieser Intent liegt nah an echter Nutzung, deshalb lohnt sich eine eigene Zielseite.",
  intentTitle: "Warum diese Seite auf Conversion zielt",
  intentParagraphs: [
    "Hier steckt ein sehr handlungsnaher Suchintent drin: nicht nur Informationen, sondern aktives Fragenlernen.",
    "Diese Seite soll genau das versprechen, was der Bot spaeter einloest: Wiederholung, Uebung und ein klarer Lernfluss.",
  ],
  sampleTitle: "Lern-Sample",
  sampleLead:
    "Ein kleiner Ausschnitt zeigt den Nutzen und spart den eigentlichen Uebungsumfang fuer den Bot auf.",
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
  whyTelegramTitle: "Warum der Bot hier besonders gut passt",
  whyTelegramParagraphs: [
    "Der Bot kann Fragen in kleinen Portionen liefern und genau damit die Suchabsicht 'lernen' deutlich besser bedienen als eine statische Seite.",
    "So bleibt die Landingpage klar fuer Google und der Bot stark fuer echte Nutzung.",
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
  ctaTitle: "Mit Pruefungsfragen direkt im Bot lernen",
  ctaLead:
    "Wenn du genau fuer Fragen und Wiederholung gesucht hast, geht es im Bot ohne Umweg weiter.",
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
  metaTitle: "ADR Test Deutsch | Uebungsfragen und Einstieg | ADR Bot",
  metaDescription:
    "ADR Test auf Deutsch mit kleinem Fragen-Sample, typischen Formulierungen und direktem Einstieg in den Telegram-Bot.",
  heroKicker: SEO_PAGE_KICKER,
  heroTitle: "ADR Test Deutsch",
  heroLead:
    "Diese Seite gibt dir einen kompakten Einstieg in einen ADR Test auf Deutsch. Du siehst typische Fragestellungen und gehst danach direkt in den Bot weiter.",
  heroSupport:
    "Die Seite ist bewusst kurz. Sie soll Suchintentionen abholen und nicht das komplette Training oeffentlich machen.",
  intentTitle: "Was du auf dieser Seite bekommst",
  intentParagraphs: [
    "Viele suchen nach ADR Test Deutsch, weil sie schnell pruefen wollen, ob sie die Fachsprache verstehen. Genau dafuer ist diese Seite gebaut.",
    "Du bekommst einen kleinen Ausschnitt mit typischen Fragen und klaren Begriffen. Fuer mehr Wiederholung und mehr Tiefe geht es direkt in Telegram weiter.",
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
  ],
  relatedLinks: [
    { href: "/", label: "Startseite", note: "Zur Hauptseite zurueck" },
    {
      href: "/adr-pruefungsfragen-lernen",
      label: "ADR Pruefungsfragen lernen",
      note: "Mehr Fokus auf Fragen und Wiederholung",
    },
    {
      href: "/adr-fragen-auf-deutsch",
      label: "ADR Fragen auf Deutsch",
      note: "Breiter Einstieg in deutsche Frageformate",
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
  metaTitle: "ADR Fragebogen Deutsch | Fragen verstehen und ueben | ADR Bot",
  metaDescription:
    "ADR Fragebogen auf Deutsch mit kurzen Beispielfragen, typischem Pruefungsdeutsch und klarem Weiterweg in den Telegram-Bot.",
  heroKicker: SEO_PAGE_KICKER,
  heroTitle: "ADR Fragebogen Deutsch",
  heroLead:
    "Wenn du nach einem ADR Fragebogen auf Deutsch suchst, hilft dir diese Vorschau beim Verstehen von Ton, Sprache und typischen Fragestellungen.",
  heroSupport:
    "Die Seite bleibt absichtlich kompakt und fuehrt danach in den Bot mit mehr Fragen und mehr Wiederholung.",
  intentTitle: "Warum diese Seite existiert",
  intentParagraphs: [
    "Viele Lernende suchen nach Fragebogen, weil sie konkrete Fragen sehen wollen statt allgemeiner Erklaerungen. Diese Seite beantwortet genau diesen Einstieg.",
    "Sie zeigt, wie deutsches Pruefungsdeutsch im ADR-Kontext klingt, ohne den eigentlichen Trainingskern komplett oeffentlich zu machen.",
  ],
  sampleTitle: "Ausschnitt aus einem Fragebogenstil",
  sampleLead:
    "Einige typische Formulierungen reichen oft schon, um den Schwierigkeitsgrad besser zu verstehen.",
  sampleQuestions: [
    {
      question: "Welche Information muss eindeutig zugeordnet werden koennen?",
      answer:
        "Zum Beispiel Stoff, UN-Nummer oder passende Kennzeichnung innerhalb eines klaren Transportkontexts.",
    },
    {
      question: "Warum wirken Frageboegen oft schwieriger als sie sind?",
      answer:
        "Weil die Sprache sehr formal ist und nicht wie Alltagssprache klingt.",
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
      href: "/adr-test-deutsch",
      label: "ADR Test Deutsch",
      note: "Aehnlicher Suchintent mit Testfokus",
    },
    {
      href: "/adr-pruefungsfragen-app-deutsch",
      label: "ADR Pruefungsfragen App Deutsch",
      note: "App-orientierter Zugang fuer dieselbe Nachfrage",
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
    "ADR Fragenbogen lernen",
    "ADR Fragen Deutsch",
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
    "Suchende wollen oft zuerst wissen, ob der Stoff auf Deutsch verstaendlich erklaert wird. Diese Seite beantwortet genau diese Schwelle.",
    "Sie verbindet Kursintention, einfache Orientierung und einen klaren Uebergang in den Telegram-Bot.",
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
  relatedLinks: [
    { href: "/", label: "Startseite", note: "Zur Hauptseite zurueck" },
    {
      href: "/basiskurs-preview",
      label: "Basiskurs Preview",
      note: "Direkter Einstieg in den haeufigsten Kursintent",
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
  metaTitle: "ADR Schein Deutsch | Vorbereitung und Lernhilfe | ADR Bot",
  metaDescription:
    "ADR Schein auf Deutsch: kompakte Orientierung zu Fragen, Begriffen und Vorbereitung fuer Lernende und Fahrer.",
  heroKicker: SEO_PAGE_KICKER,
  heroTitle: "ADR Schein Deutsch",
  heroLead:
    "Wenn du den ADR Schein auf Deutsch machen willst, brauchst du vor allem klares Verstaendnis fuer Sprache, Begriffe und typische Fragen.",
  heroSupport:
    "Diese Vorschauseite zeigt den Einstieg. Das eigentliche Training geht anschliessend im Bot weiter.",
  intentTitle: "Was Suchende nach ADR Schein Deutsch meist brauchen",
  intentParagraphs: [
    "Viele suchen nicht nach abstrakter Theorie, sondern nach einem verstaendlichen Weg zum ADR Schein auf Deutsch.",
    "Genau dafuer verbinden wir hier Kurslogik, Fragebeispiele und klare Begriffe mit einem schnellen CTA zum Bot.",
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
  relatedLinks: [
    { href: "/", label: "Startseite", note: "Zur Hauptseite zurueck" },
    {
      href: "/adr-kurs-deutsch",
      label: "ADR Kurs Deutsch",
      note: "Kursnaher Einstieg fuer denselben Bedarf",
    },
    {
      href: "/adr-pruefung-auf-deutsch",
      label: "ADR Pruefung auf Deutsch",
      note: "Pruefungsfokus fuer Suchende mit Testintention",
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
  metaTitle: "ADR Pruefung Hilfe | Verstehen, ueben und vorbereiten | ADR Bot",
  metaDescription:
    "Hilfe fuer die ADR Pruefung auf Deutsch mit typischen Fragen, Begriffen und einem klaren Lernweg in den Telegram-Bot.",
  heroKicker: SEO_PAGE_KICKER,
  heroTitle: "ADR Pruefung Hilfe",
  heroLead:
    "Diese Seite richtet sich an Menschen, die schnelle Hilfe fuer die ADR Pruefung suchen und einen klaren Einstieg auf Deutsch brauchen.",
  heroSupport:
    "Du bekommst Orientierung, ein kleines Sample und danach den direkten Weg in den Bot.",
  intentTitle: "Wie diese Hilfeseite genutzt werden soll",
  intentParagraphs: [
    "Nicht jeder sucht nach Kurs oder App. Viele tippen einfach ADR Pruefung Hilfe ein. Genau dieses Problem loest diese Seite.",
    "Sie beantwortet den Bedarf nach schneller Orientierung und fuehrt dann in ein strukturierteres Lernformat weiter.",
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
  relatedLinks: [
    { href: "/", label: "Startseite", note: "Zur Hauptseite zurueck" },
    {
      href: "/adr-test-deutsch",
      label: "ADR Test Deutsch",
      note: "Fuer Suchende mit Testintention",
    },
    {
      href: "/adr-pruefung-auf-deutsch",
      label: "ADR Pruefung auf Deutsch",
      note: "Direkter Einstieg in Pruefungssprache",
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
    "ADR Vorbereitung Hilfe",
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
] as const;

export function buildSeoPageStructuredData(
  page: SeoPageConfig,
): StructuredDataRecord[] {
  const pageUrl = `${siteUrl}${page.path}`;
  const webpageId = `${pageUrl}#webpage`;
  const breadcrumbId = `${pageUrl}#breadcrumb`;

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

  if (page.faqs?.length) {
    data.push({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "@id": `${pageUrl}#faq`,
      mainEntity: page.faqs.map((item) => ({
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
    title: page.metaTitle,
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
