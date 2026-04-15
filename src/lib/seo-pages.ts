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

export const seoPageList = [
  adrPruefungAufDeutsch,
  basiskursPreview,
  adrFaqFuerFahrer,
  adrBegriffeVocabulary,
  aufbaukursTankPreview,
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
