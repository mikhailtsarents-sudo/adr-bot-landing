import type { LangCode } from "@/lib/i18n/translations";
import type { Metadata } from "next";

export const LANDING_ROUTE_BY_LANG: Record<LangCode, string> = {
  de: "/",
  en: "/en",
  ru: "/ru",
  uk: "/uk",
  tr: "/tr",
  ar: "/ar",
  pl: "/pl",
  ro: "/ro",
  bg: "/bg",
  hr: "/hr",
};

export const LANDING_ALTERNATES = { ...LANDING_ROUTE_BY_LANG };

const LANDING_METADATA_BY_LANG: Record<
  LangCode,
  { title: string; description: string; locale: string }
> = {
  de: {
    title: "ADR-Prüfung auf Deutsch | Einfach per Telegram lernen",
    description:
      "ADR-Vorbereitung in Telegram: verständliche Fragen, Fachbegriffe und kurze Übungen für Basiskurs, Tank und Fahrer, denen die Sprache im Weg steht.",
    locale: "de_DE",
  },
  en: {
    title: "ADR exam in German | Questions and terms in Telegram",
    description:
      "Prepare for the ADR exam in Telegram with questions, terminology, and short guided practice for Basiskurs, Tank, and drivers blocked by language.",
    locale: "en_US",
  },
  ru: {
    title: "Экзамен ADR на немецком | Вопросы и термины в Telegram",
    description:
      "Подготовка к ADR в Telegram: вопросы, термины и короткие объяснения для Basiskurs, Tank и тех, кому мешает язык.",
    locale: "ru_RU",
  },
  uk: {
    title: "Іспит ADR німецькою | Питання й терміни в Telegram",
    description:
      "Підготовка до ADR у Telegram: запитання, терміни й короткі пояснення для Basiskurs, Tank і тих, кому заважає мовний бар’єр.",
    locale: "uk_UA",
  },
  tr: {
    title: "Almanca ADR sınavı | Telegram'da sorular ve terimler",
    description:
      "Telegram içinde ADR hazırlığı: Basiskurs, Tank ve dil engeline takılan sürücüler için sorular, terimler ve kısa yönlendirmeli alıştırmalar.",
    locale: "tr_TR",
  },
  ar: {
    title: "امتحان ADR بالألمانية | أسئلة ومصطلحات عبر Telegram",
    description:
      "التحضير لامتحان ADR داخل Telegram: أسئلة ومصطلحات وتدريبات قصيرة موجهة لـ Basiskurs وTank وللسائقين الذين يعيقهم حاجز اللغة.",
    locale: "ar_SA",
  },
  pl: {
    title: "Egzamin ADR po niemiecku | Pytania i terminy w Telegramie",
    description:
      "Przygotowanie do ADR w Telegramie: pytania, terminy i krótkie ćwiczenia dla Basiskurs, Tank oraz kierowców, którym przeszkadza bariera językowa.",
    locale: "pl_PL",
  },
  ro: {
    title: "Examen ADR în germană | Întrebări și termeni în Telegram",
    description:
      "Pregătire ADR în Telegram: întrebări, termeni și exerciții scurte pentru Basiskurs, Tank și pentru șoferii blocați de bariera de limbă.",
    locale: "ro_RO",
  },
  bg: {
    title: "ADR изпит на немски | Въпроси и термини в Telegram",
    description:
      "Подготовка за ADR в Telegram: въпроси, термини и кратки упражнения за Basiskurs, Tank и шофьори, на които езикът пречи.",
    locale: "bg_BG",
  },
  hr: {
    title: "ADR ispit na njemačkom | Pitanja i pojmovi u Telegramu",
    description:
      "Priprema za ADR u Telegramu: pitanja, pojmovi i kratke vježbe za Basiskurs, Tank i vozače kojima je jezik prepreka.",
    locale: "hr_HR",
  },
};

export function buildLandingMetadata(lang: LangCode): Metadata {
  const entry = LANDING_METADATA_BY_LANG[lang];
  return {
    title: { absolute: entry.title },
    description: entry.description,
    alternates: {
      canonical: LANDING_ROUTE_BY_LANG[lang],
      languages: LANDING_ALTERNATES,
    },
    openGraph: {
      title: entry.title,
      description: entry.description,
      type: "website",
      locale: entry.locale,
      url: LANDING_ROUTE_BY_LANG[lang],
    },
    twitter: {
      title: entry.title,
      description: entry.description,
    },
  };
}
