"use client";

import { TrackedTelegramLink } from "@/components/landing/tracked-telegram-link";
import { LanguageSwitcher } from "@/components/landing/language-switcher";
import { ServiceWorkerRegister } from "@/components/pwa/service-worker-register";
import { analyticsEventNames, type AnalyticsEventName } from "@/lib/analytics";
import { useLang } from "@/lib/i18n/use-lang";
import { track } from "@vercel/analytics";
import {
  ArrowRight,
  BarChart3,
  Bell,
  BookOpen,
  BrainCircuit,
  CheckCircle2,
  Copy,
  Download,
  KeyRound,
  Languages,
  ListChecks,
  MessageSquareText,
  RotateCcw,
  Share2,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import {
  getQuestionsForCourse,
  trainerCourses,
  type TrainerCourseId,
} from "./trainer-data";
import styles from "./trainer.module.css";

const STORAGE_KEY = "adr-web-trainer-progress-v1";
const PROFILE_STORAGE_KEY = "adr-web-trainer-profile-v1";
const SESSION_STORAGE_KEY = "adr-web-trainer-session-v1";
const WEB_FREE_QUESTION_LIMIT = 5;

type CourseProgress = {
  attempted: string[];
  correct: string[];
  lastIndex: number;
};

type ProgressState = Record<TrainerCourseId, CourseProgress>;

type ContactChannel = "telegram" | "phone";

type TrainerProfile = {
  webUserId: string;
  sessionId: string;
  startedAt: string;
  lastSeenAt: string;
  entrySource: string;
  entryToken: string;
  entryPath: string;
  initialReferrer: string;
  referralSourceCode: string;
  referralTrackedCode: string;
  referralTrackedAt: string;
  referralCode: string;
  bonusQuestions: number;
  referralCount: number;
  accessToken: string;
  accessCodeActivatedAt: string;
  lastLocale: string;
  fullAccess: boolean;
  fullAccessClicks: number;
  fullAccessGrantedAt: string;
  reminderConsent: boolean;
  reminderPreferenceSavedAt: string;
  contactChannel: ContactChannel;
  contactValue: string;
  vocabKnownTerms: string[];
  vocabRepeatTerms: string[];
};

type AccessLimitState = {
  baseLimit: number;
  bonusQuestions: number;
  referralCount: number;
  freeLimit: number;
  refCode: string;
  degraded: boolean;
};

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

type TrainerCopy = {
  back: string;
  telegram: string;
  eyebrow: string;
  title: string;
  intro: string;
  startOnSite: string;
  openTelegram: string;
  install: string;
  progressTitle: string;
  progressText: string;
  attempted: string;
  correct: string;
  streak: string;
  chooseCourse: string;
  question: string;
  of: string;
  difficulty: string;
  explanation: string;
  remember: string;
  next: string;
  reset: string;
  chooseAnswer: string;
  glossary: string;
  webAppTitle: string;
  webAppText: string;
  installTitle: string;
  installText: string;
  installAvailable: string;
  installUnavailable: string;
  offlineTitle: string;
  offlineText: string;
  telegramTitle: string;
  telegramText: string;
  disclaimer: string;
  completed: string;
  score: string;
  languageLabel: string;
  catalogLabel: string;
  fullAccessTitle: string;
  fullAccessText: string;
  fullAccessButton: string;
  fullAccessActive: string;
  freeLimit: string;
  paywallTitle: string;
  paywallText: string;
  reminderTitle: string;
  reminderText: string;
  reminderConsent: string;
  contactChannel: string;
  contactPlaceholder: string;
  contactRequired: string;
  contactTelegramOption: string;
  contactPhoneOption: string;
  saveReminder: string;
  reminderSaved: string;
  noGlossary: string;
  flowTitle: string;
  flowText: string;
  flowLanguageTitle: string;
  flowLanguageText: string;
  flowCourseTitle: string;
  flowCourseText: string;
  flowVocabularyTitle: string;
  flowVocabularyText: string;
  flowQuestionTitle: string;
  flowQuestionText: string;
  flowReminderTitle: string;
  flowReminderText: string;
  flowAnalyticsTitle: string;
  flowAnalyticsText: string;
  mobileLanguageTitle: string;
  nativeModeTitle: string;
  nativeModeText: string;
  foreignModeTitle: string;
  foreignModeText: string;
  modeWords: string;
  modeQuestions: string;
  modeMistakes: string;
  modeProgress: string;
  modeReminders: string;
  vocabularyTitle: string;
  vocabularyText: string;
  vocabularyKnown: string;
  vocabularyRepeat: string;
  mistakesTitle: string;
  mistakesText: string;
  mistakesEmpty: string;
  analyticsTitle: string;
  analyticsText: string;
  metricFirstQuestion: string;
  metricReminderOptIn: string;
  metricPaymentIntent: string;
  accessCodeTitle: string;
  accessCodeText: string;
  accessCodePlaceholder: string;
  activateCode: string;
  accessCodeSuccess: string;
  accessCodeError: string;
  referralTitle: string;
  referralText: string;
  referralButton: string;
  referralCopied: string;
  referralStats: string;
  communicationTitle: string;
  communicationText: string;
  yes: string;
  no: string;
  notYet: string;
};

const copyByLang: Partial<Record<string, TrainerCopy>> = {
  de: {
    back: "Zur Website",
    telegram: "In Telegram öffnen",
    eyebrow: "ADR Web-Trainer als PWA",
    title: "Übe ADR-Fragen direkt im Browser.",
    intro:
      "Das ist der neue Web-Einstieg neben Telegram: Kurs auswählen, Fragen beantworten, Begriffe verstehen und deinen Fortschritt lokal speichern.",
    startOnSite: "Auf der Website üben",
    openTelegram: "Telegram-Bot starten",
    install: "Web-App installieren",
    progressTitle: "Dein Trainingsstand",
    progressText: "Fortschritt bleibt auf diesem Gerät gespeichert. Keine Registrierung nötig.",
    attempted: "Beantwortet",
    correct: "Richtig",
    streak: "Kurse",
    chooseCourse: "Kurs wählen",
    question: "Frage",
    of: "von",
    difficulty: "Schwierigkeit",
    explanation: "Erklärung",
    remember: "Merksatz",
    next: "Nächste Frage",
    reset: "Kurs zurücksetzen",
    chooseAnswer: "Wähle eine Antwort, dann bekommst du die Erklärung.",
    glossary: "Begriffshilfe",
    webAppTitle: "Warum als Web-App?",
    webAppText:
      "Du kannst direkt auf der Website üben, deinen Fortschritt behalten und bei Bedarf später in Telegram weitermachen.",
    installTitle: "PWA-Modus",
    installText:
      "Auf unterstützten Geräten kannst du den Trainer wie eine App auf den Home Screen legen.",
    installAvailable: "Installieren",
    installUnavailable:
      "Wenn kein Install-Button erscheint: im Browser-Menü 'Zum Home-Bildschirm' oder 'App installieren' wählen.",
    offlineTitle: "Offline vorbereitet",
    offlineText:
      "Nach dem ersten Laden werden die Trainer-Seite und der Fragenkatalog fuer Offline-Nutzung zwischengespeichert.",
    telegramTitle: "Vollversion im Bot",
    telegramText:
      "Telegram bleibt der Hauptkanal für Sprachen, Erinnerungen, längere Sessions und spätere Freischaltungen.",
    disclaimer:
      "ADR Bot ist ein Trainings- und Verständnishilfe-Tool. Kein offizieller IHK-Kurs, keine Garantie für das Bestehen und kein Ersatz für die ADR-Schulung.",
    completed: "abgeschlossen",
    score: "Trefferquote",
    languageLabel: "Lernsprache",
    catalogLabel: "481 Fragen aus dem Bot-Katalog",
    fullAccessTitle: "Vollzugang freischalten",
    fullAccessText:
      "Der Vollzugang öffnet alle Fragen, Kurse und Wiederholungen. Der Klick wird als Kaufinteresse gezählt und der Zugang wird sofort aktiviert.",
    fullAccessButton: "Vollzugang kaufen",
    fullAccessActive: "Vollzugang aktiv",
    freeLimit: "Kostenlos: 5 neue Fragen",
    paywallTitle: "Kostenlose Fragen erreicht",
    paywallText:
      "Du hast die ersten 5 neuen Fragen beantwortet. Mit dem Vollzugang kannst du alle Kurse und Fragen weiter nutzen.",
    reminderTitle: "Erinnerungen vorbereiten",
    reminderText:
      "Wenn du zustimmst, merken wir uns deinen bevorzugten Kontaktkanal für spätere Lern-Erinnerungen.",
    reminderConsent: "Ich möchte Lern-Erinnerungen erhalten.",
    contactChannel: "Kontaktkanal",
    contactPlaceholder: "Telegram @username oder Telefonnummer",
    contactRequired: "Bitte Telegram-Username oder Telefonnummer eintragen, damit wir dich erinnern können.",
    contactTelegramOption: "Telegram",
    contactPhoneOption: "Telefon / WhatsApp",
    saveReminder: "Erinnerung speichern",
    reminderSaved: "Gespeichert",
    noGlossary: "Für diese Frage zeigen wir zuerst die richtige Antwort. Begriffserklärungen werden schrittweise ergänzt.",
    flowTitle: "So funktioniert die Web-Version",
    flowText:
      "Die Web-Version bildet die Telegram-Mechanik im Browser ab: Sprache wählen, Kurs starten, Begriffe verstehen, Fragen beantworten, Fehler wiederholen und Erinnerungen vorbereiten.",
    flowLanguageTitle: "Sprache wählen",
    flowLanguageText:
      "Die Seite startet automatisch in der Browsersprache. Fahrer können jederzeit Deutsch, Russisch, Ukrainisch, Türkisch, Arabisch, Polnisch, Rumänisch, Bulgarisch, Kroatisch oder Englisch wählen.",
    flowCourseTitle: "Kurs wählen",
    flowCourseText:
      "Basiskurs, Tank, Klasse 1, Klasse 7 und Auffrischung bleiben getrennt, damit die Zahlen und Fortschritte wie im Bot nachvollziehbar sind.",
    flowVocabularyTitle: "Begriffe lernen",
    flowVocabularyText:
      "Für Nicht-Muttersprachler stehen ADR-Begriffe, einfache Erklärungen und Übersetzungshilfen im Vordergrund.",
    flowQuestionTitle: "Quiz beantworten",
    flowQuestionText:
      "Nach jeder Antwort sieht der Nutzer sofort, was richtig war, warum es richtig ist und welchen Merksatz er behalten soll.",
    flowReminderTitle: "Rückkehr vorbereiten",
    flowReminderText:
      "Opt-in für Telegram oder Telefonnummer wird sauber abgefragt, bevor spätere Lern-Erinnerungen verschickt werden.",
    flowAnalyticsTitle: "Alles messbar machen",
    flowAnalyticsText:
      "Wir zählen Kurswahl, erste Frage, Antwort, Erklärung, Full-Access-Klick und Reminder-Opt-in separat.",
    mobileLanguageTitle: "Sprache der Web-App",
    nativeModeTitle: "Modus für Muttersprachler",
    nativeModeText: "Schneller Fokus auf Prüfungsfragen, Kurslogik und sichere Wiederholung.",
    foreignModeTitle: "Modus für Nicht-Muttersprachler",
    foreignModeText: "Mehr Begriffshilfe, Übersetzung, einfache Sprache und Erklärung nach falscher Antwort.",
    modeWords: "Begriffe",
    modeQuestions: "Fragen",
    modeMistakes: "Fehler",
    modeProgress: "Fortschritt",
    modeReminders: "Reminder",
    vocabularyTitle: "Worttrainer",
    vocabularyText:
      "Hier trainierst du wichtige Begriffe zur aktuellen Frage und markierst, was du verstanden hast oder wiederholen willst.",
    vocabularyKnown: "Verstanden",
    vocabularyRepeat: "Wiederholen",
    mistakesTitle: "Fehler wiederholen",
    mistakesText:
      "Falsch beantwortete Fragen bleiben markiert und können später gezielt wiederholt werden.",
    mistakesEmpty: "Noch keine Fehler in diesem Kurs.",
    analyticsTitle: "Messpunkte für uns",
    analyticsText:
      "Diese Web-Version soll zeigen, ob Nutzer lieber im Browser starten, ob sie zurückkehren und ob sie Full Access anklicken.",
    metricFirstQuestion: "erste Frage gesehen",
    metricReminderOptIn: "Reminder-Opt-in",
    metricPaymentIntent: "Full-Access-Klick",
    accessCodeTitle: "Zugangscode aktivieren",
    accessCodeText:
      "Wenn du einen Zugangscode erhalten hast, kannst du ihn hier aktivieren. Der Code wird an dieses Gerät gebunden.",
    accessCodePlaceholder: "ADR-XXXX-XXXX-XXXX",
    activateCode: "Code aktivieren",
    accessCodeSuccess: "Zugangscode aktiviert.",
    accessCodeError: "Code konnte nicht aktiviert werden.",
    referralTitle: "Kostenlose Bonusfragen teilen",
    referralText:
      "Teile deinen Link. Wenn ein neuer Nutzer mindestens eine Frage beantwortet, bekommst du +5 Bonusfragen.",
    referralButton: "Referral-Link kopieren",
    referralCopied: "Link kopiert",
    referralStats: "Bonusfragen",
    communicationTitle: "Kommunikation danach",
    communicationText:
      "Ohne Zustimmung keine Erinnerung. Mit Zustimmung speichern wir nur den gewählten Kontaktkanal für spätere Lern-Stupser.",
    yes: "ja",
    no: "nein",
    notYet: "noch nicht",
  },
  ru: {
    back: "На сайт",
    telegram: "Открыть Telegram",
    eyebrow: "ADR Web-Trainer как PWA",
    title: "Тренируй ADR-вопросы прямо на сайте.",
    intro:
      "Это новый вход рядом с Telegram: выбираешь курс, отвечаешь на вопросы, разбираешь немецкие термины, а прогресс сохраняется локально.",
    startOnSite: "Тренироваться на сайте",
    openTelegram: "Открыть Telegram-бота",
    install: "Установить Web-App",
    progressTitle: "Твой прогресс",
    progressText: "Прогресс сохраняется на этом устройстве. Регистрация не нужна.",
    attempted: "Ответов",
    correct: "Верно",
    streak: "Курсов",
    chooseCourse: "Выбрать курс",
    question: "Вопрос",
    of: "из",
    difficulty: "Сложность",
    explanation: "Объяснение",
    remember: "Запомнить",
    next: "Следующий вопрос",
    reset: "Сбросить курс",
    chooseAnswer: "Выбери ответ, после этого появится объяснение.",
    glossary: "Помощь по терминам",
    webAppTitle: "Зачем Web-App?",
    webAppText:
      "Можно тренироваться прямо на сайте, сохранять прогресс на устройстве и при необходимости продолжить в Telegram.",
    installTitle: "PWA-режим",
    installText:
      "На поддерживаемых устройствах тренажёр можно добавить на главный экран как обычное приложение.",
    installAvailable: "Установить",
    installUnavailable:
      "Если кнопка установки не появилась: в меню браузера выбери 'На экран Домой' или 'Установить приложение'.",
    offlineTitle: "Готово к офлайну",
    offlineText:
      "После первого открытия браузер сохранит страницу тренажёра и каталог вопросов для офлайн-режима.",
    telegramTitle: "Полная версия в боте",
    telegramText:
      "Telegram остаётся главным каналом для языков, напоминаний, длинных тренировок и будущих доступов.",
    disclaimer:
      "ADR Bot — тренажёр и помощь для понимания формулировок. Это не официальный IHK-курс, не гарантия сдачи и не замена ADR-Schulung.",
    completed: "пройдено",
    score: "точность",
    languageLabel: "Язык обучения",
    catalogLabel: "481 вопрос из каталога бота",
    fullAccessTitle: "Открыть полный доступ",
    fullAccessText:
      "Полный доступ открывает все вопросы, курсы и повторение ошибок. Нажатие считается интересом к покупке, а доступ активируется сразу.",
    fullAccessButton: "Купить полный доступ",
    fullAccessActive: "Полный доступ активен",
    freeLimit: "Бесплатно: 5 новых вопросов",
    paywallTitle: "Бесплатные вопросы закончились",
    paywallText:
      "Ты ответил на первые 5 новых вопросов. С полным доступом можно продолжить все курсы и вопросы.",
    reminderTitle: "Подготовить напоминания",
    reminderText:
      "Если ты согласишься, мы сохраним удобный канал связи для будущих учебных напоминаний.",
    reminderConsent: "Я хочу получать учебные напоминания.",
    contactChannel: "Канал связи",
    contactPlaceholder: "Telegram @username или номер телефона",
    contactRequired: "Укажи Telegram или номер телефона, чтобы мы могли отправлять напоминания.",
    contactTelegramOption: "Telegram",
    contactPhoneOption: "Телефон / WhatsApp",
    saveReminder: "Сохранить напоминания",
    reminderSaved: "Сохранено",
    noGlossary: "Для этого вопроса пока показываем правильный ответ. Подробные объяснения терминов будем добавлять постепенно.",
    flowTitle: "Как работает веб-версия",
    flowText:
      "Веб-версия повторяет механику Telegram-бота в браузере: выбрать язык, выбрать курс, разобрать термины, ответить на вопросы, повторить ошибки и подготовить напоминания.",
    flowLanguageTitle: "Выбор языка",
    flowLanguageText:
      "Страница стартует по языку браузера. Водитель может вручную выбрать немецкий, русский, украинский, турецкий, арабский, польский, румынский, болгарский, хорватский или английский.",
    flowCourseTitle: "Выбор курса",
    flowCourseText:
      "Basiskurs, Tank, Klasse 1, Klasse 7 и Auffrischung остаются отдельными, чтобы прогресс и количество вопросов совпадали с логикой бота.",
    flowVocabularyTitle: "Слова и термины",
    flowVocabularyText:
      "Для не-носителей немецкого главный акцент: ADR-термины, простые объяснения и перевод смыслов.",
    flowQuestionTitle: "Квиз",
    flowQuestionText:
      "После ответа пользователь сразу видит правильный вариант, объяснение ошибки и короткий смысловой крючок.",
    flowReminderTitle: "Возврат пользователя",
    flowReminderText:
      "Telegram, WhatsApp или e-mail фиксируются только после явного согласия на учебные напоминания.",
    flowAnalyticsTitle: "Метрики",
    flowAnalyticsText:
      "Отдельно считаем выбор курса, первую увиденную задачу, ответ, показ объяснения, клик Full Access и согласие на напоминания.",
    mobileLanguageTitle: "Язык Web-App",
    nativeModeTitle: "Режим для Muttersprachler",
    nativeModeText: "Быстрый фокус на экзаменационных вопросах, курсах и повторении.",
    foreignModeTitle: "Режим для иностранцев",
    foreignModeText: "Больше помощи с терминами, переводом, простым языком и объяснением после ошибки.",
    modeWords: "Термины",
    modeQuestions: "Вопросы",
    modeMistakes: "Ошибки",
    modeProgress: "Прогресс",
    modeReminders: "Напоминания",
    vocabularyTitle: "Worttrainer",
    vocabularyText:
      "Здесь можно тренировать важные термины к текущему вопросу и отмечать, что уже понятно, а что нужно повторить.",
    vocabularyKnown: "Понял",
    vocabularyRepeat: "Повторить",
    mistakesTitle: "Повтор ошибок",
    mistakesText:
      "Неправильные ответы остаются отмеченными, чтобы пользователь мог вернуться именно к слабым местам.",
    mistakesEmpty: "В этом курсе пока нет ошибок.",
    analyticsTitle: "Что мы измеряем",
    analyticsText:
      "Эта веб-версия должна показать, удобно ли людям стартовать в браузере, возвращаются ли они и кликают ли Full Access.",
    metricFirstQuestion: "первая задача",
    metricReminderOptIn: "согласие на напоминания",
    metricPaymentIntent: "клик Full Access",
    accessCodeTitle: "Активировать код доступа",
    accessCodeText:
      "Если у тебя есть код доступа, его можно активировать здесь. Код привяжется к этому устройству.",
    accessCodePlaceholder: "ADR-XXXX-XXXX-XXXX",
    activateCode: "Активировать код",
    accessCodeSuccess: "Код доступа активирован.",
    accessCodeError: "Не удалось активировать код.",
    referralTitle: "Поделиться и получить бонус",
    referralText:
      "Скопируй ссылку. Если новый пользователь ответит хотя бы на один вопрос, тебе добавится +5 бонусных вопросов.",
    referralButton: "Скопировать referral-ссылку",
    referralCopied: "Ссылка скопирована",
    referralStats: "Бонусные вопросы",
    communicationTitle: "Коммуникация после старта",
    communicationText:
      "Без согласия напоминания не отправляем. С согласием сохраняем только выбранный канал связи для будущих учебных касаний.",
    yes: "да",
    no: "нет",
    notYet: "пока нет",
  },
  en: {
    back: "Back to site",
    telegram: "Open Telegram",
    eyebrow: "ADR Web Trainer PWA",
    title: "Practice ADR questions directly in the browser.",
    intro:
      "This is the new website entry next to Telegram: choose a course, answer questions, understand German terms, and keep local progress.",
    startOnSite: "Practice on site",
    openTelegram: "Open Telegram bot",
    install: "Install Web App",
    progressTitle: "Your progress",
    progressText: "Progress is stored on this device. No registration needed.",
    attempted: "Answered",
    correct: "Correct",
    streak: "Courses",
    chooseCourse: "Choose course",
    question: "Question",
    of: "of",
    difficulty: "Difficulty",
    explanation: "Explanation",
    remember: "Memory hook",
    next: "Next question",
    reset: "Reset course",
    chooseAnswer: "Choose an answer, then the explanation appears.",
    glossary: "Term helper",
    webAppTitle: "Why a Web App?",
    webAppText:
      "You can practice directly on the website, keep progress on this device, and continue in Telegram if needed.",
    installTitle: "PWA mode",
    installText:
      "On supported devices, you can add the trainer to your home screen like an app.",
    installAvailable: "Install",
    installUnavailable:
      "If no install button appears, use the browser menu: 'Add to Home Screen' or 'Install app'.",
    offlineTitle: "Offline ready",
    offlineText: "After the first load, the trainer page and question catalog are cached for offline use.",
    telegramTitle: "Full version in the bot",
    telegramText:
      "Telegram remains the main channel for languages, reminders, longer sessions, and future access logic.",
    disclaimer:
      "ADR Bot is a training and comprehension helper. It is not an official IHK course, does not guarantee passing, and does not replace ADR training.",
    completed: "completed",
    score: "score",
    languageLabel: "Learning language",
    catalogLabel: "481 questions from the bot catalog",
    fullAccessTitle: "Unlock full access",
    fullAccessText:
      "Full access unlocks all questions, courses, and mistake repetition. The click is counted as purchase intent and access is activated immediately.",
    fullAccessButton: "Buy full access",
    fullAccessActive: "Full access active",
    freeLimit: "Free: 5 new questions",
    paywallTitle: "Free questions reached",
    paywallText:
      "You answered the first 5 new questions. Full access lets you continue with all courses and questions.",
    reminderTitle: "Prepare reminders",
    reminderText:
      "If you opt in, we save your preferred contact channel for future learning reminders.",
    reminderConsent: "I want to receive learning reminders.",
    contactChannel: "Contact channel",
    contactPlaceholder: "Telegram @username or phone number",
    contactRequired: "Please enter Telegram or phone number so we can send reminders.",
    contactTelegramOption: "Telegram",
    contactPhoneOption: "Phone / WhatsApp",
    saveReminder: "Save reminders",
    reminderSaved: "Saved",
    noGlossary: "For this question we first show the correct answer. Term explanations will be added step by step.",
    flowTitle: "How the web version works",
    flowText:
      "The web version mirrors the Telegram bot mechanics in the browser: choose language, choose course, learn terms, answer questions, repeat mistakes, and prepare reminders.",
    flowLanguageTitle: "Choose language",
    flowLanguageText:
      "The page starts from browser language. Drivers can manually choose German, Russian, Ukrainian, Turkish, Arabic, Polish, Romanian, Bulgarian, Croatian, or English.",
    flowCourseTitle: "Choose course",
    flowCourseText:
      "Basiskurs, Tank, Class 1, Class 7, and refresher stay separate so question counts and progress match the bot logic.",
    flowVocabularyTitle: "Learn terms",
    flowVocabularyText:
      "For non-native German speakers, ADR terms, simple explanations, and translation help are central.",
    flowQuestionTitle: "Answer quiz",
    flowQuestionText:
      "After each answer, the user immediately sees what was correct, why, and what memory hook to keep.",
    flowReminderTitle: "Prepare return",
    flowReminderText:
      "Telegram or phone reminders are saved only after explicit opt-in.",
    flowAnalyticsTitle: "Measure everything",
    flowAnalyticsText:
      "We track course selection, first question, answer, explanation view, full-access click, and reminder opt-in separately.",
    mobileLanguageTitle: "Web-App language",
    nativeModeTitle: "Native-speaker mode",
    nativeModeText: "Fast focus on exam-style questions, course logic, and repetition.",
    foreignModeTitle: "Non-native mode",
    foreignModeText: "More term help, translation, simple language, and explanations after mistakes.",
    modeWords: "Terms",
    modeQuestions: "Questions",
    modeMistakes: "Mistakes",
    modeProgress: "Progress",
    modeReminders: "Reminders",
    vocabularyTitle: "Word trainer",
    vocabularyText:
      "Practice important terms for the current question and mark what you understand or want to repeat.",
    vocabularyKnown: "Understood",
    vocabularyRepeat: "Repeat",
    mistakesTitle: "Repeat mistakes",
    mistakesText:
      "Wrong answers stay marked so users can revisit weak spots later.",
    mistakesEmpty: "No mistakes in this course yet.",
    analyticsTitle: "Metrics for us",
    analyticsText:
      "This web version should show whether users prefer starting in browser, whether they return, and whether they click full access.",
    metricFirstQuestion: "first question seen",
    metricReminderOptIn: "reminder opt-in",
    metricPaymentIntent: "full-access click",
    accessCodeTitle: "Activate access code",
    accessCodeText:
      "If you received an access code, activate it here. It will be bound to this device.",
    accessCodePlaceholder: "ADR-XXXX-XXXX-XXXX",
    activateCode: "Activate code",
    accessCodeSuccess: "Access code activated.",
    accessCodeError: "Could not activate this code.",
    referralTitle: "Share and get bonus questions",
    referralText:
      "Copy your link. If a new user answers at least one question, you receive +5 bonus questions.",
    referralButton: "Copy referral link",
    referralCopied: "Link copied",
    referralStats: "Bonus questions",
    communicationTitle: "Communication after start",
    communicationText:
      "No reminders without consent. With consent, we store only the selected contact channel for future learning nudges.",
    yes: "yes",
    no: "no",
    notYet: "not yet",
  },
};

const trainerCopyByLang: Record<string, TrainerCopy> = {
  de: copyByLang.de!,
  ru: copyByLang.ru!,
  en: copyByLang.en!,
  uk: {
    ...copyByLang.ru!,
    back: "На сайт",
    telegram: "Відкрити Telegram",
    title: "Тренуй ADR-питання прямо на сайті.",
    languageLabel: "Мова навчання",
    fullAccessButton: "Купити повний доступ",
    fullAccessActive: "Повний доступ активний",
    reminderConsent: "Я хочу отримувати навчальні нагадування.",
    saveReminder: "Зберегти нагадування",
    reminderSaved: "Збережено",
  },
  tr: {
    ...copyByLang.en!,
    back: "Siteye dön",
    telegram: "Telegram'da aç",
    title: "ADR sorularını doğrudan tarayıcıda çalış.",
    languageLabel: "Öğrenme dili",
    chooseCourse: "Kurs seç",
    question: "Soru",
    of: "/",
    explanation: "Açıklama",
    next: "Sonraki soru",
    reset: "Kursu sıfırla",
    fullAccessButton: "Tam erişim satın al",
    fullAccessActive: "Tam erişim aktif",
    reminderConsent: "Öğrenme hatırlatmaları almak istiyorum.",
    saveReminder: "Hatırlatmayı kaydet",
    reminderSaved: "Kaydedildi",
  },
  ar: {
    ...copyByLang.en!,
    back: "العودة إلى الموقع",
    telegram: "فتح Telegram",
    title: "تدرّب على أسئلة ADR مباشرة في المتصفح.",
    languageLabel: "لغة التدريب",
    chooseCourse: "اختر الدورة",
    question: "سؤال",
    of: "من",
    explanation: "شرح",
    next: "السؤال التالي",
    reset: "إعادة ضبط الدورة",
    fullAccessButton: "شراء الوصول الكامل",
    fullAccessActive: "الوصول الكامل مفعل",
    reminderConsent: "أريد تلقي تذكيرات تدريبية.",
    saveReminder: "حفظ التذكيرات",
    reminderSaved: "تم الحفظ",
  },
  pl: {
    ...copyByLang.en!,
    back: "Do strony",
    telegram: "Otwórz Telegram",
    title: "Ćwicz pytania ADR bezpośrednio w przeglądarce.",
    languageLabel: "Język nauki",
    chooseCourse: "Wybierz kurs",
    question: "Pytanie",
    of: "z",
    explanation: "Wyjaśnienie",
    next: "Następne pytanie",
    reset: "Resetuj kurs",
    fullAccessButton: "Kup pełny dostęp",
    fullAccessActive: "Pełny dostęp aktywny",
    reminderConsent: "Chcę otrzymywać przypomnienia o nauce.",
    saveReminder: "Zapisz przypomnienia",
    reminderSaved: "Zapisano",
  },
  ro: {
    ...copyByLang.en!,
    back: "Înapoi la site",
    telegram: "Deschide Telegram",
    title: "Exersează întrebări ADR direct în browser.",
    languageLabel: "Limba de învățare",
    chooseCourse: "Alege cursul",
    question: "Întrebare",
    of: "din",
    explanation: "Explicație",
    next: "Următoarea întrebare",
    reset: "Resetează cursul",
    fullAccessButton: "Cumpără acces complet",
    fullAccessActive: "Acces complet activ",
    reminderConsent: "Vreau să primesc mementouri de învățare.",
    saveReminder: "Salvează mementourile",
    reminderSaved: "Salvat",
  },
  bg: {
    ...copyByLang.ru!,
    back: "Към сайта",
    telegram: "Отвори Telegram",
    title: "Упражнявай ADR въпроси директно в браузъра.",
    languageLabel: "Език за обучение",
    chooseCourse: "Избери курс",
    question: "Въпрос",
    of: "от",
    explanation: "Обяснение",
    next: "Следващ въпрос",
    reset: "Нулирай курса",
    fullAccessButton: "Купи пълен достъп",
    fullAccessActive: "Пълният достъп е активен",
    reminderConsent: "Искам да получавам учебни напомняния.",
    saveReminder: "Запази напомняния",
    reminderSaved: "Запазено",
  },
  hr: {
    ...copyByLang.en!,
    back: "Natrag na stranicu",
    telegram: "Otvori Telegram",
    title: "Vježbaj ADR pitanja izravno u pregledniku.",
    languageLabel: "Jezik učenja",
    chooseCourse: "Odaberi tečaj",
    question: "Pitanje",
    of: "od",
    explanation: "Objašnjenje",
    next: "Sljedeće pitanje",
    reset: "Resetiraj tečaj",
    fullAccessButton: "Kupi puni pristup",
    fullAccessActive: "Puni pristup aktivan",
    reminderConsent: "Želim primati podsjetnike za učenje.",
    saveReminder: "Spremi podsjetnike",
    reminderSaved: "Spremljeno",
  },
};

function normalizeContactChannel(value: unknown): ContactChannel {
  return value === "phone" || value === "whatsapp" ? "phone" : "telegram";
}

function fallbackReferralCode(webUserId: string) {
  return webUserId.replace(/[^a-zA-Z0-9]/g, "").slice(0, 8) || "webguest";
}

function createFallbackAccessLimits(webUserId: string): AccessLimitState {
  return {
    baseLimit: WEB_FREE_QUESTION_LIMIT,
    bonusQuestions: 0,
    referralCount: 0,
    freeLimit: WEB_FREE_QUESTION_LIMIT,
    refCode: fallbackReferralCode(webUserId),
    degraded: false,
  };
}

function emptyCourseProgress(): CourseProgress {
  return {
    attempted: [],
    correct: [],
    lastIndex: 0,
  };
}

function createEmptyProgress(): ProgressState {
  return {
    basiskurs: emptyCourseProgress(),
    tank: emptyCourseProgress(),
    klasse1: emptyCourseProgress(),
    klasse7: emptyCourseProgress(),
    auffrischung: emptyCourseProgress(),
  };
}

function uniqueAppend(values: string[], value: string): string[] {
  return values.includes(value) ? values : [...values, value];
}

function loadProgress(): ProgressState {
  if (typeof window === "undefined") {
    return createEmptyProgress();
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createEmptyProgress();
    const parsed = JSON.parse(raw) as Partial<ProgressState>;

    return {
      basiskurs: { ...emptyCourseProgress(), ...parsed.basiskurs },
      tank: { ...emptyCourseProgress(), ...parsed.tank },
      klasse1: { ...emptyCourseProgress(), ...parsed.klasse1 },
      klasse7: { ...emptyCourseProgress(), ...parsed.klasse7 },
      auffrischung: { ...emptyCourseProgress(), ...parsed.auffrischung },
    };
  } catch {
    return createEmptyProgress();
  }
}

function newSessionId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `web-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function getWebSessionId() {
  if (typeof window === "undefined") return newSessionId();

  try {
    const existingSessionId = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (existingSessionId) return existingSessionId;

    const nextSessionId = newSessionId();
    sessionStorage.setItem(SESSION_STORAGE_KEY, nextSessionId);
    return nextSessionId;
  } catch {
    return newSessionId();
  }
}

function getTrainerSourceContext() {
  if (typeof window === "undefined") {
    return {
      entrySource: "web_trainer_direct",
      entryToken: "",
      entryPath: "/trainer",
      initialReferrer: "",
      referralSourceCode: "",
    };
  }

  const params = new URLSearchParams(window.location.search);
  const source =
    params.get("source") ||
    params.get("utm_source") ||
    params.get("ref") ||
    "web_trainer_direct";
  const token = params.get("start") || params.get("token") || params.get("utm_campaign") || "";
  const referralSourceCode = params.get("ref") || "";

  return {
    entrySource: source,
    entryToken: token,
    entryPath: `${window.location.pathname}${window.location.search}`,
    initialReferrer: document.referrer || "",
    referralSourceCode,
  };
}

function createDefaultProfile(): TrainerProfile {
  const now = new Date().toISOString();
  const sourceContext = getTrainerSourceContext();

  return {
    webUserId: newSessionId(),
    sessionId: getWebSessionId(),
    startedAt: now,
    lastSeenAt: now,
    entrySource: sourceContext.entrySource,
    entryToken: sourceContext.entryToken,
    entryPath: sourceContext.entryPath,
    initialReferrer: sourceContext.initialReferrer,
    referralSourceCode: sourceContext.referralSourceCode,
    referralTrackedCode: "",
    referralTrackedAt: "",
    referralCode: "",
    bonusQuestions: 0,
    referralCount: 0,
    accessToken: "",
    accessCodeActivatedAt: "",
    lastLocale: "",
    fullAccess: false,
    fullAccessClicks: 0,
    fullAccessGrantedAt: "",
    reminderConsent: false,
    reminderPreferenceSavedAt: "",
    contactChannel: "telegram",
    contactValue: "",
    vocabKnownTerms: [],
    vocabRepeatTerms: [],
  };
}

function loadProfile(): TrainerProfile {
  if (typeof window === "undefined") {
    return createDefaultProfile();
  }

  try {
    const raw = localStorage.getItem(PROFILE_STORAGE_KEY);
    if (!raw) return createDefaultProfile();
    const sourceContext = getTrainerSourceContext();
    const parsedProfile = JSON.parse(raw) as Partial<TrainerProfile>;

    return {
      ...createDefaultProfile(),
      ...parsedProfile,
      sessionId: getWebSessionId(),
      contactChannel: normalizeContactChannel(parsedProfile.contactChannel),
      entrySource: sourceContext.entrySource,
      entryToken: sourceContext.entryToken,
      entryPath: sourceContext.entryPath,
      referralSourceCode: sourceContext.referralSourceCode,
      lastSeenAt: new Date().toISOString(),
    };
  } catch {
    return createDefaultProfile();
  }
}

function sendTrainerAnalytics(
  event: AnalyticsEventName,
  locale: string,
  metadata: Record<string, string | number | boolean | null | undefined>,
) {
  if (typeof navigator === "undefined") return;

  const target = JSON.stringify(metadata);
  const payload = {
    event,
    source: "web_trainer",
    page_path: "/trainer",
    page_slug: "trainer",
    page_type: "trainer",
    locale,
    target: target.length > 950 ? `${target.slice(0, 947)}...` : target,
    referrer: typeof document === "undefined" ? "" : document.referrer,
    user_agent: navigator.userAgent,
    occurred_at: new Date().toISOString(),
  };
  const body = JSON.stringify(payload);

  if ("sendBeacon" in navigator) {
    navigator.sendBeacon("/api/analytics/event", new Blob([body], { type: "application/json" }));
    return;
  }

  void fetch("/api/analytics/event", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: true,
  });
}

export function TrainerClient() {
  const { lang } = useLang();
  const copy = trainerCopyByLang[lang] ?? trainerCopyByLang.de;
  const [progress, setProgress] = useState<ProgressState>(() => loadProgress());
  const [profile, setProfile] = useState<TrainerProfile>(() => loadProfile());
  const [activeCourseId, setActiveCourseId] = useState<TrainerCourseId>("basiskurs");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOptionIndex, setSelectedOptionIndex] = useState<number | null>(null);
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installReady, setInstallReady] = useState(false);
  const [contactDraft, setContactDraft] = useState(() => profile.contactValue);
  const [accessLimits, setAccessLimits] = useState<AccessLimitState>(() =>
    createFallbackAccessLimits(profile.webUserId),
  );
  const [accessCodeDraft, setAccessCodeDraft] = useState("");
  const [accessCodeStatus, setAccessCodeStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [shareStatus, setShareStatus] = useState<"idle" | "copied" | "error">("idle");
  const [reminderSaveStatus, setReminderSaveStatus] = useState<"idle" | "saved" | "required">("idle");
  const sessionEventSentRef = useRef(false);
  const freeLimitEventKeyRef = useRef<string | null>(null);

  function sendTrainerEvent(
    event: AnalyticsEventName,
    metadata: Record<string, string | number | boolean | null | undefined>,
  ) {
    sendTrainerAnalytics(event, lang, {
      web_user_id: profile.webUserId,
      session_id: profile.sessionId,
      entry_source: profile.entrySource,
      entry_token: profile.entryToken,
      entry_path: profile.entryPath,
      initial_referrer: profile.initialReferrer,
      referral_source_code: profile.referralSourceCode,
      referral_code: accessLimits.refCode,
      free_limit: accessLimits.freeLimit,
      bonus_questions: accessLimits.bonusQuestions,
      full_access: profile.fullAccess,
      reminder_consent: profile.reminderConsent,
      total_answered: totalAnswered,
      total_correct: totalCorrect,
      ...metadata,
    });
  }

  const activeCourse = trainerCourses.find((course) => course.id === activeCourseId) ?? trainerCourses[0];
  const courseQuestions = getQuestionsForCourse(activeCourseId);
  const activeQuestion = courseQuestions[currentIndex] ?? courseQuestions[0];
  const answered = selectedOptionIndex !== null;
  const isCorrect = answered && selectedOptionIndex === activeQuestion.correctIndex;
  const activeProgress = progress[activeCourseId];
  const completedCount = activeProgress.attempted.length;
  const currentScore =
    completedCount > 0 ? Math.round((activeProgress.correct.length / completedCount) * 100) : 0;
  const totalAnswered = trainerCourses.reduce(
    (sum, course) => sum + progress[course.id].attempted.length,
    0,
  );
  const totalCorrect = trainerCourses.reduce(
    (sum, course) => sum + progress[course.id].correct.length,
    0,
  );
  const effectiveFreeQuestionLimit = Math.max(
    WEB_FREE_QUESTION_LIMIT,
    Number(accessLimits.freeLimit || WEB_FREE_QUESTION_LIMIT),
  );
  const questionAlreadyAttempted = activeProgress.attempted.includes(activeQuestion.id);
  const canAnswerCurrentQuestion =
    profile.fullAccess || questionAlreadyAttempted || totalAnswered < effectiveFreeQuestionLimit;
  const freeQuestionsLeft = profile.fullAccess
    ? 0
    : Math.max(effectiveFreeQuestionLimit - totalAnswered, 0);
  const totalQuestionCount = trainerCourses.reduce(
    (sum, course) => sum + getQuestionsForCourse(course.id).length,
    0,
  );
  const answeredPercent =
    totalQuestionCount > 0 ? Math.round((totalAnswered / totalQuestionCount) * 100) : 0;
  const activeWrongCount = activeProgress.attempted.filter(
    (questionId) => !activeProgress.correct.includes(questionId),
  ).length;
  const vocabularyRepeatCount = profile.vocabRepeatTerms.length;
  const totalMistakeSignals = activeWrongCount + vocabularyRepeatCount;
  const modeCards = [
    { label: copy.modeWords, value: profile.vocabKnownTerms.length.toString(), text: copy.vocabularyKnown },
    { label: copy.modeQuestions, value: totalQuestionCount.toString(), text: copy.catalogLabel },
    { label: copy.modeMistakes, value: totalMistakeSignals.toString(), text: copy.mistakesTitle },
    { label: copy.modeProgress, value: `${answeredPercent}%`, text: copy.modeProgress },
    {
      label: copy.modeReminders,
      value: profile.reminderConsent ? "on" : "off",
      text: copy.communicationTitle,
    },
  ];
  const flowSteps = [
    { title: copy.flowLanguageTitle, text: copy.flowLanguageText, Icon: Languages },
    { title: copy.flowCourseTitle, text: copy.flowCourseText, Icon: BookOpen },
    { title: copy.flowVocabularyTitle, text: copy.flowVocabularyText, Icon: BrainCircuit },
    { title: copy.flowQuestionTitle, text: copy.flowQuestionText, Icon: ListChecks },
    { title: copy.flowReminderTitle, text: copy.flowReminderText, Icon: Bell },
    { title: copy.flowAnalyticsTitle, text: copy.flowAnalyticsText, Icon: BarChart3 },
  ];
  const currentModeTitle = lang === "de" ? copy.nativeModeTitle : copy.foreignModeTitle;
  const currentModeText = lang === "de" ? copy.nativeModeText : copy.foreignModeText;

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  }, [progress]);

  useEffect(() => {
    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
  }, [profile]);

  useEffect(() => {
    let cancelled = false;

    async function loadAccessLimits() {
      try {
        const response = await fetch(
          `/api/access/limits?web_user_id=${encodeURIComponent(profile.webUserId)}`,
          { cache: "no-store" },
        );
        const payload = (await response.json()) as {
          base_limit?: number;
          bonus_questions?: number;
          referral_count?: number;
          free_limit?: number;
          ref_code?: string;
          degraded?: boolean;
        };

        if (cancelled) return;

        const nextLimits: AccessLimitState = {
          baseLimit: Number(payload.base_limit || WEB_FREE_QUESTION_LIMIT),
          bonusQuestions: Number(payload.bonus_questions || 0),
          referralCount: Number(payload.referral_count || 0),
          freeLimit: Number(payload.free_limit || WEB_FREE_QUESTION_LIMIT),
          refCode: String(payload.ref_code || fallbackReferralCode(profile.webUserId)),
          degraded: Boolean(payload.degraded),
        };

        setAccessLimits(nextLimits);
        setProfile((current) => ({
          ...current,
          referralCode: nextLimits.refCode,
          bonusQuestions: nextLimits.bonusQuestions,
          referralCount: nextLimits.referralCount,
          lastLocale: lang,
          lastSeenAt: new Date().toISOString(),
        }));
      } catch {
        if (!cancelled) {
          setAccessLimits(createFallbackAccessLimits(profile.webUserId));
        }
      }
    }

    void loadAccessLimits();

    return () => {
      cancelled = true;
    };
  }, [lang, profile.webUserId]);

  useEffect(() => {
    if (sessionEventSentRef.current) return;
    sessionEventSentRef.current = true;

    const profileAgeMs = Date.now() - Date.parse(profile.startedAt || new Date().toISOString());
    const isReturningUser = Number.isFinite(profileAgeMs) && profileAgeMs > 60_000;

    sendTrainerAnalytics(
      isReturningUser
        ? analyticsEventNames.pwaSessionResumed
        : analyticsEventNames.pwaSessionStarted,
      lang,
      {
        web_user_id: profile.webUserId,
        session_id: profile.sessionId,
        entry_source: profile.entrySource,
        entry_token: profile.entryToken,
        entry_path: profile.entryPath,
        initial_referrer: profile.initialReferrer,
        started_at: profile.startedAt,
        returning_user: isReturningUser,
      },
    );
  }, [
    lang,
    profile.entryPath,
    profile.entrySource,
    profile.entryToken,
    profile.initialReferrer,
    profile.sessionId,
    profile.startedAt,
    profile.webUserId,
  ]);

  useEffect(() => {
    if (!activeQuestion?.id || canAnswerCurrentQuestion || answered) return;

    const eventKey = `${activeCourseId}:${activeQuestion.id}:${totalAnswered}`;
    if (freeLimitEventKeyRef.current === eventKey) return;
    freeLimitEventKeyRef.current = eventKey;

    sendTrainerAnalytics(analyticsEventNames.pwaFreeLimitReached, lang, {
      web_user_id: profile.webUserId,
      session_id: profile.sessionId,
      entry_source: profile.entrySource,
      course_id: activeCourseId,
      question_id: activeQuestion.id,
      free_limit: effectiveFreeQuestionLimit,
      total_answered: totalAnswered,
    });
  }, [
    activeCourseId,
    activeQuestion?.id,
    answered,
    canAnswerCurrentQuestion,
    lang,
    profile.entrySource,
    profile.sessionId,
    profile.webUserId,
    effectiveFreeQuestionLimit,
    totalAnswered,
  ]);

  useEffect(() => {
    if (!activeQuestion?.id) return;
    sendTrainerAnalytics(analyticsEventNames.pwaQuestionSeen, lang, {
      web_user_id: profile.webUserId,
      session_id: profile.sessionId,
      entry_source: profile.entrySource,
      entry_token: profile.entryToken,
      course_id: activeCourseId,
      question_id: activeQuestion.id,
      full_access: profile.fullAccess,
    });
  }, [
    activeCourseId,
    activeQuestion?.id,
    lang,
    profile.entrySource,
    profile.entryToken,
    profile.fullAccess,
    profile.sessionId,
    profile.webUserId,
  ]);

  useEffect(() => {
    const handler = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
      setInstallReady(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  function selectCourse(courseId: TrainerCourseId) {
    const questions = getQuestionsForCourse(courseId);
    const savedIndex = progress[courseId].lastIndex;
    setActiveCourseId(courseId);
    setCurrentIndex(Math.min(savedIndex, Math.max(questions.length - 1, 0)));
    setSelectedOptionIndex(null);
    track("web_trainer_course_select", { course_id: courseId, locale: lang });
    sendTrainerEvent(analyticsEventNames.pwaCourseSelected, {
      course_id: courseId,
      questions_total: questions.length,
    });
  }

  function answerQuestion(optionIndex: number) {
    if (answered) return;
    if (!canAnswerCurrentQuestion) {
      sendTrainerEvent(analyticsEventNames.pwaBuyIntent, {
        course_id: activeCourseId,
        reason: "free_limit_reached",
      });
      return;
    }

    const correct = optionIndex === activeQuestion.correctIndex;
    setSelectedOptionIndex(optionIndex);
    setProgress((current) => {
      const courseProgress = current[activeCourseId];
      return {
        ...current,
        [activeCourseId]: {
          attempted: uniqueAppend(courseProgress.attempted, activeQuestion.id),
          correct: correct
            ? uniqueAppend(courseProgress.correct, activeQuestion.id)
            : courseProgress.correct,
          lastIndex: currentIndex,
        },
      };
    });
    track("web_trainer_answer", {
      course_id: activeCourseId,
      question_id: activeQuestion.id,
      correct,
      locale: lang,
    });
    sendTrainerEvent(analyticsEventNames.pwaAnswerSubmitted, {
      course_id: activeCourseId,
      question_id: activeQuestion.id,
      correct,
      free_questions_left: freeQuestionsLeft,
    });
    sendTrainerEvent(analyticsEventNames.pwaExplanationShown, {
      course_id: activeCourseId,
      question_id: activeQuestion.id,
      correct,
    });
    void trackReferralAfterAnswer(activeQuestion.id);
  }

  function goNext() {
    const nextIndex = (currentIndex + 1) % courseQuestions.length;
    setCurrentIndex(nextIndex);
    setSelectedOptionIndex(null);
    setProgress((current) => ({
      ...current,
      [activeCourseId]: {
        ...current[activeCourseId],
        lastIndex: nextIndex,
      },
    }));
  }

  function resetCourse() {
    setProgress((current) => ({
      ...current,
      [activeCourseId]: emptyCourseProgress(),
    }));
    setCurrentIndex(0);
    setSelectedOptionIndex(null);
    track("web_trainer_course_reset", { course_id: activeCourseId, locale: lang });
  }

  async function installApp() {
    if (!installPrompt) return;
    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    track("web_trainer_install_prompt", { outcome: choice.outcome, locale: lang });
    sendTrainerEvent(analyticsEventNames.pwaInstallPrompt, {
      outcome: choice.outcome,
      platform: choice.platform,
    });
    setInstallPrompt(null);
    setInstallReady(false);
  }

  function buildDeviceFingerprint() {
    if (typeof window === "undefined") return "server";

    return [
      navigator.userAgent,
      navigator.language,
      Intl.DateTimeFormat().resolvedOptions().timeZone,
      `${window.screen.width}x${window.screen.height}x${window.devicePixelRatio}`,
    ].join("|");
  }

  async function activateAccessCode() {
    const code = accessCodeDraft.trim().toUpperCase();
    if (!code || accessCodeStatus === "loading") return;

    setAccessCodeStatus("loading");

    try {
      const response = await fetch("/api/access/activate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          web_user_id: profile.webUserId,
          device_fingerprint: buildDeviceFingerprint(),
          locale: lang,
        }),
      });
      const payload = (await response.json()) as {
        ok?: boolean;
        access_token?: string;
        used_at?: string;
      };

      if (!response.ok || !payload.ok) {
        setAccessCodeStatus("error");
        return;
      }

      setProfile((current) => ({
        ...current,
        fullAccess: true,
        accessToken: payload.access_token || current.accessToken,
        accessCodeActivatedAt: payload.used_at || new Date().toISOString(),
        fullAccessGrantedAt: current.fullAccessGrantedAt || new Date().toISOString(),
        lastSeenAt: new Date().toISOString(),
      }));
      setAccessCodeStatus("success");
      sendTrainerEvent(analyticsEventNames.pwaAccessCodeActivated, {
        code_prefix: code.slice(0, 8),
        full_access: true,
      });
    } catch {
      setAccessCodeStatus("error");
    }
  }

  async function copyReferralLink() {
    const refCode = accessLimits.refCode || profile.referralCode || fallbackReferralCode(profile.webUserId);
    const baseUrl =
      typeof window === "undefined" ? "https://adr-bot.de" : window.location.origin;
    const referralLink = `${baseUrl}/trainer?ref=${encodeURIComponent(refCode)}`;

    try {
      await navigator.clipboard.writeText(referralLink);
      setShareStatus("copied");
      sendTrainerEvent(analyticsEventNames.pwaReferralShareCopied, {
        ref_code: refCode,
        referral_link: referralLink,
      });
    } catch {
      setShareStatus("error");
    }
  }

  async function trackReferralAfterAnswer(questionId: string) {
    const refCode = profile.referralSourceCode.trim();
    if (!refCode || profile.referralTrackedCode === refCode) return;

    try {
      const response = await fetch("/api/referral/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ref_code: refCode,
          new_user_id: profile.webUserId,
          answered_question_id: questionId,
          source: profile.entrySource,
        }),
      });
      const payload = (await response.json()) as {
        ok?: boolean;
        status?: string;
      };

      if (!response.ok || !payload.ok) return;

      setProfile((current) => ({
        ...current,
        referralTrackedCode: refCode,
        referralTrackedAt: new Date().toISOString(),
        lastSeenAt: new Date().toISOString(),
      }));
      sendTrainerEvent(analyticsEventNames.pwaReferralTracked, {
        ref_code: refCode,
        status: payload.status || "unknown",
        question_id: questionId,
      });
    } catch {
      // Referral tracking must never block the quiz flow.
    }
  }

  function unlockFullAccess() {
    const nextClicks = profile.fullAccessClicks + 1;
    setProfile((current) => ({
      ...current,
      fullAccess: true,
      fullAccessClicks: nextClicks,
      fullAccessGrantedAt: current.fullAccessGrantedAt || new Date().toISOString(),
      lastSeenAt: new Date().toISOString(),
    }));
    sendTrainerEvent(analyticsEventNames.pwaBuyIntent, {
      clicks: nextClicks,
      price_eur: 15,
      mode: "instant_full_access",
    });
    sendTrainerEvent(analyticsEventNames.pwaFullAccessGrantedTest, {
      grant_source: "web_buy_button",
      full_access: true,
    });
  }

  function saveReminderPreference() {
    const nextConsent = profile.reminderConsent;
    const nextContactValue = contactDraft.trim();
    const nextContactChannel = normalizeContactChannel(profile.contactChannel);

    if (nextConsent && !nextContactValue) {
      setReminderSaveStatus("required");
      sendTrainerEvent(analyticsEventNames.pwaReminderConsent, {
        consent: true,
        contact_channel: nextContactChannel,
        has_contact_value: false,
        validation: "contact_required",
      });
      return;
    }

    setProfile((current) => ({
      ...current,
      reminderConsent: nextConsent,
      contactChannel: nextContactChannel,
      contactValue: nextContactValue,
      reminderPreferenceSavedAt: new Date().toISOString(),
      lastSeenAt: new Date().toISOString(),
    }));
    setReminderSaveStatus("saved");
    sendTrainerEvent(analyticsEventNames.pwaReminderConsent, {
      consent: nextConsent,
      contact_channel: nextContactChannel,
      has_contact_value: Boolean(nextContactValue),
    });
    if (nextConsent && nextContactValue) {
      sendTrainerEvent(analyticsEventNames.pwaContactSubmitted, {
        contact_channel: nextContactChannel,
      });
    }
  }

  function markVocabularyTerm(term: string, action: "known" | "repeat") {
    const normalizedTerm = term.trim();
    if (!normalizedTerm) return;

    setProfile((current) => {
      const knownTerms =
        action === "known"
          ? uniqueAppend(current.vocabKnownTerms, normalizedTerm)
          : current.vocabKnownTerms;
      const repeatTerms =
        action === "repeat"
          ? uniqueAppend(current.vocabRepeatTerms, normalizedTerm)
          : current.vocabRepeatTerms.filter((item) => item !== normalizedTerm);

      return {
        ...current,
        vocabKnownTerms: knownTerms,
        vocabRepeatTerms: repeatTerms,
        lastSeenAt: new Date().toISOString(),
      };
    });

    sendTrainerEvent(
      action === "known"
        ? analyticsEventNames.pwaVocabularyKnown
        : analyticsEventNames.pwaVocabularyRepeat,
      {
        course_id: activeCourseId,
        question_id: activeQuestion.id,
        term: normalizedTerm,
      },
    );
  }

  return (
    <>
      <ServiceWorkerRegister />
      <div className={styles.shell}>
        <header className={styles.topbar}>
          <Link href="/" className={styles.brand}>
            <span className={styles.brandMark}>ADR</span>
            <span className={styles.brandText}>
              <strong>ADR Bot Web-Trainer</strong>
              <span>{copy.disclaimer}</span>
            </span>
          </Link>
          <div className={styles.topActions}>
            <div className={styles.languageControl} aria-label={copy.languageLabel}>
              <span>{copy.languageLabel}</span>
              <LanguageSwitcher compact />
            </div>
            <Link href="/" className={`${styles.button} ${styles.ghostButton}`}>
              {copy.back}
            </Link>
            <TrackedTelegramLink
              source="web_trainer_top_nav"
              locale={lang}
              className={`${styles.button} ${styles.primaryButton}`}
            >
              {copy.telegram}
              <ArrowRight size={17} strokeWidth={2.6} />
            </TrackedTelegramLink>
          </div>
        </header>

        <div className={styles.mobileLanguageBar}>
          <span>{copy.mobileLanguageTitle}</span>
          <LanguageSwitcher compact />
        </div>

        <main className={styles.main}>
          <section className={styles.hero}>
            <div className={styles.heroPanel}>
              <span className={styles.eyebrow}>{copy.eyebrow}</span>
              <h1 className={styles.heroTitle}>{copy.title}</h1>
              <p className={styles.heroText}>{copy.intro}</p>
              <div className={styles.heroActions}>
                <a href="#trainer" className={`${styles.button} ${styles.darkButton}`}>
                  {copy.startOnSite}
                  <ArrowRight size={18} strokeWidth={2.6} />
                </a>
                <TrackedTelegramLink
                  source="web_trainer_hero"
                  locale={lang}
                  className={`${styles.button} ${styles.primaryButton}`}
                >
                  {copy.openTelegram}
                </TrackedTelegramLink>
                <button
                  type="button"
                  className={`${styles.button} ${styles.ghostButton}`}
                  onClick={installApp}
                  disabled={!installReady}
                >
                  <Download size={17} strokeWidth={2.5} />
                  {copy.install}
                </button>
              </div>
            </div>

            <aside className={styles.statusPanel}>
              <div className={styles.statusHeader}>
                <div>
                  <h2>{copy.progressTitle}</h2>
                  <p>{copy.progressText}</p>
                </div>
                <span className={styles.statusPill}>
                  <ShieldCheck size={15} strokeWidth={2.6} />
                  PWA
                </span>
              </div>
              <div className={styles.miniStats}>
                <div className={styles.miniStat}>
                  <strong>{totalAnswered}</strong>
                  <span>{copy.attempted}</span>
                </div>
                <div className={styles.miniStat}>
                  <strong>{totalCorrect}</strong>
                  <span>{copy.correct}</span>
                </div>
                <div className={styles.miniStat}>
                  <strong>{trainerCourses.length}</strong>
                  <span>{copy.streak}</span>
                </div>
              </div>
              <div className={styles.accessStrip}>
                <span>
                  <strong>{copy.catalogLabel}</strong>
                  {profile.fullAccess
                    ? copy.fullAccessActive
                    : `${copy.freeLimit} · ${copy.referralStats}: ${accessLimits.bonusQuestions} · ${freeQuestionsLeft}`}
                </span>
                <button
                  type="button"
                  className={`${styles.button} ${profile.fullAccess ? styles.ghostButton : styles.darkButton}`}
                  onClick={unlockFullAccess}
                >
                  {profile.fullAccess ? copy.fullAccessActive : copy.fullAccessButton}
                </button>
              </div>
              <div className={styles.offlineNote}>
                <ShieldCheck size={18} strokeWidth={2.5} />
                <span>
                  <strong>{copy.offlineTitle}</strong>
                  {copy.offlineText}
                </span>
              </div>
            </aside>
          </section>

          <section className={styles.mechanicsSection} aria-labelledby="mechanics-title">
            <div className={styles.sectionIntro}>
              <span className={styles.eyebrow}>{currentModeTitle}</span>
              <h2 id="mechanics-title">{copy.flowTitle}</h2>
              <p>{copy.flowText}</p>
              <p className={styles.modeNote}>{currentModeText}</p>
            </div>

            <div className={styles.flowGrid}>
              {flowSteps.map(({ title, text, Icon }) => (
                <article className={styles.flowCard} key={title}>
                  <span className={styles.flowIcon}>
                    <Icon size={19} strokeWidth={2.6} />
                  </span>
                  <h3>{title}</h3>
                  <p>{text}</p>
                </article>
              ))}
            </div>

            <div className={styles.modeGrid} aria-label={copy.analyticsTitle}>
              {modeCards.map((card) => (
                <div className={styles.modeCard} key={card.label}>
                  <strong>{card.value}</strong>
                  <span>{card.label}</span>
                  <small>{card.text}</small>
                </div>
              ))}
            </div>
          </section>

          <section id="trainer" aria-labelledby="course-title">
            <span className={styles.eyebrow} id="course-title">
              {copy.chooseCourse}
            </span>
            <div className={styles.courseGrid}>
              {trainerCourses.map((course) => {
                const questions = getQuestionsForCourse(course.id);
                const stats = progress[course.id];
                const percent =
                  questions.length > 0 ? Math.round((stats.attempted.length / questions.length) * 100) : 0;

                return (
                  <button
                    key={course.id}
                    type="button"
                    aria-pressed={activeCourseId === course.id}
                    className={styles.courseCard}
                    style={{ "--course-color": course.color } as CSSProperties}
                    onClick={() => selectCourse(course.id)}
                  >
                    <span className={styles.courseTop}>
                      <span className={styles.courseBadge}>{course.badge}</span>
                      {activeCourseId === course.id ? (
                        <span className={styles.courseCheck}>
                          <CheckCircle2 size={17} strokeWidth={2.7} />
                        </span>
                      ) : null}
                    </span>
                    <h3>{course.title}</h3>
                    <p>{course.subtitle}</p>
                    <p>{course.description}</p>
                    <span className={styles.meter} aria-hidden="true">
                      <span className={styles.meterFill} style={{ width: `${percent}%` }} />
                    </span>
                    <span className={styles.courseMeta}>
                      <span>
                        {stats.attempted.length}/{questions.length} {copy.completed}
                      </span>
                      <span>
                        {copy.score}:{" "}
                        {stats.attempted.length > 0
                          ? `${Math.round((stats.correct.length / stats.attempted.length) * 100)}%`
                          : "0%"}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          <section className={styles.trainerLayout}>
            <article className={styles.questionCard}>
              <header className={styles.questionHeader}>
                <div className={styles.questionMeta}>
                  <span>{activeCourse.title}</span>
                  <span>
                    {copy.question} {currentIndex + 1} {copy.of} {courseQuestions.length}
                  </span>
                  <span>
                    {copy.difficulty}: {activeQuestion.difficulty}
                  </span>
                  <span>{activeQuestion.topic}</span>
                </div>
                <h2>{activeQuestion.question}</h2>
              </header>

              <div className={styles.questionBody}>
                {activeQuestion.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img className={styles.questionImage} src={activeQuestion.image} alt="" />
                ) : null}
                {!canAnswerCurrentQuestion && !answered ? (
                  <div className={styles.paywallBox}>
                    <strong>{copy.paywallTitle}</strong>
                    <p>{copy.paywallText}</p>
                    <button
                      type="button"
                      className={`${styles.button} ${styles.darkButton}`}
                      onClick={unlockFullAccess}
                    >
                      {copy.fullAccessButton}
                    </button>
                  </div>
                ) : null}
                {activeQuestion.options.map((option, index) => {
                  const isSelected = selectedOptionIndex === index;
                  const isRightAnswer = activeQuestion.correctIndex === index;
                  const optionStateClass =
                    answered && isRightAnswer
                      ? styles.optionCorrect
                      : answered && isSelected
                        ? styles.optionWrong
                        : "";

                  return (
                    <button
                      key={option}
                      type="button"
                      className={`${styles.option} ${optionStateClass}`}
                      onClick={() => answerQuestion(index)}
                      disabled={answered || !canAnswerCurrentQuestion}
                    >
                      {option}
                    </button>
                  );
                })}

                {answered ? (
                  <div className={styles.explanation}>
                    <strong>
                      {isCorrect ? (
                        <CheckCircle2 size={20} strokeWidth={2.6} />
                      ) : (
                        <XCircle size={20} strokeWidth={2.6} />
                      )}
                      {copy.explanation}
                    </strong>
                    <p>{activeQuestion.explanation}</p>
                    <p>
                      <strong>{copy.remember}:</strong> {activeQuestion.memoryHook}
                    </p>
                  </div>
                ) : null}
              </div>

              <footer className={styles.questionFooter}>
                <span className={styles.hint}>
                  {answered
                    ? `${copy.score}: ${currentScore}% (${activeProgress.correct.length}/${completedCount})`
                    : copy.chooseAnswer}
                </span>
                <div className={styles.heroActions}>
                  <button
                    type="button"
                    className={`${styles.button} ${styles.ghostButton}`}
                    onClick={resetCourse}
                  >
                    <RotateCcw size={16} strokeWidth={2.6} />
                    {copy.reset}
                  </button>
                  <button
                    type="button"
                    className={`${styles.button} ${styles.primaryButton}`}
                    onClick={goNext}
                    disabled={!answered}
                  >
                    {copy.next}
                    <ArrowRight size={17} strokeWidth={2.6} />
                  </button>
                </div>
              </footer>
            </article>

            <aside className={styles.sideStack}>
              <section className={styles.sideCard}>
                <h2>{copy.vocabularyTitle}</h2>
                <p>{copy.vocabularyText}</p>
                <div className={styles.termPractice}>
                  {(activeQuestion.glossary.length > 0
                    ? activeQuestion.glossary.slice(0, 2)
                    : [{ term: activeQuestion.topic, simple: activeQuestion.memoryHook, ru: "" }]
                  ).map((item) => (
                    <div className={styles.termCard} key={item.term}>
                      <strong>{item.term}</strong>
                      <span>{item.simple}</span>
                      {item.ru ? <small>{item.ru}</small> : null}
                      <div>
                        <button type="button" onClick={() => markVocabularyTerm(item.term, "known")}>
                          {copy.vocabularyKnown}
                        </button>
                        <button type="button" onClick={() => markVocabularyTerm(item.term, "repeat")}>
                          {copy.vocabularyRepeat}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section className={styles.sideCard}>
                <h2>{copy.mistakesTitle}</h2>
                <p>{copy.mistakesText}</p>
                <div className={styles.mistakeBox}>
                  <strong>{totalMistakeSignals}</strong>
                  <span>{totalMistakeSignals > 0 ? copy.modeMistakes : copy.mistakesEmpty}</span>
                </div>
              </section>

              <section className={styles.sideCard}>
                <h2>{copy.glossary}</h2>
                <div className={styles.glossary}>
                  {activeQuestion.glossary.length > 0 ? (
                    activeQuestion.glossary.map((item) => (
                      <div className={styles.glossaryItem} key={item.term}>
                        <strong>{item.term}</strong>
                        <span>{item.simple}</span>
                        <span>{item.ru}</span>
                      </div>
                    ))
                  ) : (
                    <div className={styles.glossaryItem}>
                      <span>{copy.noGlossary}</span>
                    </div>
                  )}
                </div>
              </section>

              <section className={styles.sideCard}>
                <h2>{copy.webAppTitle}</h2>
                <p>{copy.webAppText}</p>
                <ul className={styles.featureList}>
                  <li>
                    <CheckCircle2 size={17} strokeWidth={2.5} />
                    <span>Direkt im Browser üben, ohne Telegram-Pflicht.</span>
                  </li>
                  <li>
                    <CheckCircle2 size={17} strokeWidth={2.5} />
                    <span>Lokaler Fortschritt und wiederholbare Kurs-Sessions.</span>
                  </li>
                  <li>
                    <CheckCircle2 size={17} strokeWidth={2.5} />
                    <span>Später als App-Store-Alternative ausbaubar.</span>
                  </li>
                </ul>
                <div className={styles.installBox}>
                  <strong>{copy.installTitle}</strong>
                  <span>{copy.installText}</span>
                  <button
                    type="button"
                    className={`${styles.button} ${styles.darkButton} ${styles.linkButton}`}
                    onClick={installApp}
                    disabled={!installReady}
                  >
                    <Download size={17} strokeWidth={2.5} />
                    {installReady ? copy.installAvailable : copy.installUnavailable}
                  </button>
                </div>
              </section>

              <section className={styles.sideCard}>
                <h2>{copy.fullAccessTitle}</h2>
                <p>{copy.fullAccessText}</p>
                <div className={styles.resultActions}>
                  <button
                    type="button"
                    className={`${styles.button} ${profile.fullAccess ? styles.ghostButton : styles.darkButton} ${styles.linkButton}`}
                    onClick={unlockFullAccess}
                  >
                    {profile.fullAccess ? copy.fullAccessActive : copy.fullAccessButton}
                  </button>
                </div>
                <div className={styles.accessCodeBox}>
                  <span className={styles.cardKicker}>
                    <KeyRound size={16} strokeWidth={2.6} />
                    {copy.accessCodeTitle}
                  </span>
                  <p>{copy.accessCodeText}</p>
                  <div className={styles.accessCodeForm}>
                    <input
                      value={accessCodeDraft}
                      onChange={(event) => {
                        setAccessCodeDraft(event.target.value);
                        setAccessCodeStatus("idle");
                      }}
                      placeholder={copy.accessCodePlaceholder}
                      autoCapitalize="characters"
                    />
                    <button
                      type="button"
                      className={`${styles.button} ${styles.primaryButton}`}
                      onClick={activateAccessCode}
                      disabled={accessCodeStatus === "loading" || profile.fullAccess}
                    >
                      {copy.activateCode}
                    </button>
                  </div>
                  {accessCodeStatus === "success" ? (
                    <span className={styles.successMessage}>{copy.accessCodeSuccess}</span>
                  ) : null}
                  {accessCodeStatus === "error" ? (
                    <span className={styles.errorMessage}>{copy.accessCodeError}</span>
                  ) : null}
                </div>
              </section>

              <section className={styles.sideCard}>
                <h2>{copy.referralTitle}</h2>
                <p>{copy.referralText}</p>
                <div className={styles.referralStats}>
                  <span>
                    <Share2 size={16} strokeWidth={2.6} />
                    {copy.referralStats}: {accessLimits.bonusQuestions}
                  </span>
                  <span>
                    <CheckCircle2 size={16} strokeWidth={2.6} />
                    Referrals: {accessLimits.referralCount}
                  </span>
                </div>
                <button
                  type="button"
                  className={`${styles.button} ${styles.darkButton} ${styles.linkButton}`}
                  onClick={copyReferralLink}
                >
                  <Copy size={17} strokeWidth={2.5} />
                  {shareStatus === "copied" ? copy.referralCopied : copy.referralButton}
                </button>
              </section>

              <section className={styles.sideCard}>
                <h2>{copy.reminderTitle}</h2>
                <p>{copy.reminderText}</p>
                <div className={styles.reminderForm}>
                  <label className={styles.checkboxLine}>
                    <input
                      type="checkbox"
                      checked={profile.reminderConsent}
                      onChange={(event) => {
                        setReminderSaveStatus("idle");
                        setProfile((current) => ({
                          ...current,
                          reminderConsent: event.target.checked,
                        }));
                      }}
                    />
                    <span>{copy.reminderConsent}</span>
                  </label>
                  <label className={styles.fieldLabel}>
                    <span>{copy.contactChannel}</span>
                    <select
                      value={profile.contactChannel}
                      onChange={(event) => {
                        setReminderSaveStatus("idle");
                        setProfile((current) => ({
                          ...current,
                          contactChannel: normalizeContactChannel(event.target.value),
                        }));
                      }}
                    >
                      <option value="telegram">{copy.contactTelegramOption}</option>
                      <option value="phone">{copy.contactPhoneOption}</option>
                    </select>
                  </label>
                  <input
                    className={styles.contactInput}
                    value={contactDraft}
                    onChange={(event) => {
                      setContactDraft(event.target.value);
                      setReminderSaveStatus("idle");
                    }}
                    placeholder={copy.contactPlaceholder}
                    inputMode={profile.contactChannel === "phone" ? "tel" : "text"}
                  />
                  {reminderSaveStatus === "required" ? (
                    <span className={styles.errorMessage}>{copy.contactRequired}</span>
                  ) : null}
                  {reminderSaveStatus === "saved" ? (
                    <span className={styles.successMessage}>{copy.reminderSaved}</span>
                  ) : null}
                  <button
                    type="button"
                    className={`${styles.button} ${styles.primaryButton} ${styles.linkButton}`}
                    onClick={saveReminderPreference}
                  >
                    {copy.saveReminder}
                  </button>
                </div>
              </section>

              <section className={styles.sideCard}>
                <h2>{copy.analyticsTitle}</h2>
                <p>{copy.analyticsText}</p>
                <div className={styles.analyticsList}>
                  <span>
                    <CheckCircle2 size={16} strokeWidth={2.6} />
                    {copy.metricFirstQuestion}: {totalAnswered > 0 ? copy.yes : copy.notYet}
                  </span>
                  <span>
                    <Bell size={16} strokeWidth={2.6} />
                    {copy.metricReminderOptIn}: {profile.reminderConsent ? copy.yes : copy.no}
                  </span>
                  <span>
                    <BarChart3 size={16} strokeWidth={2.6} />
                    {copy.metricPaymentIntent}: {profile.fullAccessClicks}
                  </span>
                </div>
              </section>

              <section className={styles.sideCard}>
                <h2>{copy.communicationTitle}</h2>
                <p>{copy.communicationText}</p>
                <div className={styles.communicationBox}>
                  <MessageSquareText size={18} strokeWidth={2.6} />
                  <span>
                    {profile.reminderConsent
                      ? `${profile.contactChannel}: ${profile.contactValue || "..."}`
                      : copy.reminderConsent}
                  </span>
                </div>
              </section>

              <section className={styles.resultCard}>
                <h2>{copy.telegramTitle}</h2>
                <p>{copy.telegramText}</p>
                <div className={styles.resultActions}>
                  <TrackedTelegramLink
                    source="web_trainer_sidebar"
                    locale={lang}
                    className={`${styles.button} ${styles.primaryButton} ${styles.linkButton}`}
                  >
                    {copy.openTelegram}
                    <ArrowRight size={17} strokeWidth={2.6} />
                  </TrackedTelegramLink>
                </div>
                <p>{copy.disclaimer}</p>
              </section>
            </aside>
          </section>
        </main>

        <div className={styles.mobileSticky}>
          <a href="#trainer" className={`${styles.button} ${styles.darkButton}`}>
            {copy.chooseCourse}
          </a>
          <TrackedTelegramLink
            source="web_trainer_mobile_sticky"
            locale={lang}
            className={`${styles.button} ${styles.primaryButton}`}
          >
            Telegram
          </TrackedTelegramLink>
        </div>
      </div>
    </>
  );
}
