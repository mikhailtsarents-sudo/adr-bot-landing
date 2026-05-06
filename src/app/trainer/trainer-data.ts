import trainerQuestionBank from "./trainer-question-bank.json";

export type TrainerCourseId = "basiskurs" | "tank" | "klasse1" | "klasse7" | "auffrischung";

export type TrainerQuestion = {
  id: string;
  courseId: TrainerCourseId;
  topic: string;
  difficulty: "leicht" | "mittel" | "schwer";
  question: string;
  options: string[];
  correctIndex: number;
  image?: string | null;
  explanation: string;
  memoryHook: string;
  glossary: Array<{
    term: string;
    simple: string;
    ru: string;
  }>;
};

export type TrainerCourse = {
  id: TrainerCourseId;
  title: string;
  subtitle: string;
  description: string;
  badge: string;
  color: string;
};

export const trainerCourses: TrainerCourse[] = [
  {
    id: "basiskurs",
    title: "ADR Basiskurs",
    subtitle: "Grundlagen fuer Stueckgut und Fahreralltag",
    description:
      "Typische Begriffe, Gefahrzettel, Dokumente, Ausruestung und Verhalten bei Zwischenfaellen.",
    badge: "Start",
    color: "#f6b548",
  },
  {
    id: "tank",
    title: "Aufbaukurs Tank",
    subtitle: "Tankfahrzeuge, Befuellen und Entladen",
    description:
      "Pruefungsnahe Fragen zu Tankkennzeichnung, Restmengen, elektrostatischer Aufladung und Kontrolle.",
    badge: "Tank",
    color: "#49a1ff",
  },
  {
    id: "klasse1",
    title: "Aufbaukurs Klasse 1",
    subtitle: "Explosive Stoffe und besondere Vorsicht",
    description:
      "Pruefungsnahe Fragen zu Klasse 1, Begleitpapieren, Kennzeichnung, Verboten und Verhalten.",
    badge: "Kl. 1",
    color: "#ff6b5a",
  },
  {
    id: "klasse7",
    title: "Klasse 7",
    subtitle: "Radioaktive Stoffe sicher verstehen",
    description:
      "Grundlagen zu Abstand, Aufenthaltszeit, Abschirmung, Kennzeichnung und Sofortmassnahmen.",
    badge: "Kl. 7",
    color: "#8fd36a",
  },
  {
    id: "auffrischung",
    title: "Auffrischungsschulung",
    subtitle: "Wiederholung fuer verlaengerte ADR-Bescheinigung",
    description:
      "Kurze Wiederholungsfragen fuer Fahrer, die vorhandenes ADR-Wissen auffrischen wollen.",
    badge: "Refresh",
    color: "#d9a8ff",
  },
];

const curatedTrainerQuestions: TrainerQuestion[] = [
  {
    id: "base-001",
    courseId: "basiskurs",
    topic: "Befoerderungspapier",
    difficulty: "leicht",
    question: "Welche Angabe muss im Befoerderungspapier fuer Gefahrgut enthalten sein?",
    options: [
      "Die UN-Nummer und die offizielle Benennung des Stoffes",
      "Nur der Name des Fahrers",
      "Nur die geplante Fahrzeit",
      "Die Telefonnummer der Werkstatt",
    ],
    correctIndex: 0,
    explanation:
      "Im Befoerderungspapier stehen die wichtigen Angaben zur Gefahrgutsendung, damit Fahrer, Kontrolle und Einsatzkraefte wissen, was transportiert wird.",
    memoryHook:
      "Merke: Das Papier beschreibt die Ladung, nicht den Fahrer. UN-Nummer und Stoffname sind der Kern.",
    glossary: [
      {
        term: "Befoerderungspapier",
        simple: "Dokument mit den wichtigsten Angaben zur Gefahrgutsendung",
        ru: "транспортный документ",
      },
      {
        term: "UN-Nummer",
        simple: "vierstellige Nummer fuer einen Gefahrstoff",
        ru: "номер ООН опасного вещества",
      },
    ],
  },
  {
    id: "base-002",
    courseId: "basiskurs",
    topic: "Schriftliche Weisungen",
    difficulty: "leicht",
    question: "Wozu dienen die schriftlichen Weisungen im Fahrzeug?",
    options: [
      "Sie erklaeren, was bei Unfall oder Notfall zu tun ist",
      "Sie ersetzen den Fuehrerschein",
      "Sie zeigen die beste Route",
      "Sie sind nur fuer die Buchhaltung bestimmt",
    ],
    correctIndex: 0,
    explanation:
      "Die schriftlichen Weisungen helfen dem Fahrer im Notfall. Sie beschreiben Schutzmassnahmen und erstes Verhalten bei Zwischenfaellen.",
    memoryHook:
      "Weisungen sind kein normales Formular. Sie sind die Notfall-Anleitung im Fahrerhaus.",
    glossary: [
      {
        term: "schriftliche Weisungen",
        simple: "Notfallanleitung fuer den Fahrer",
        ru: "письменные инструкции на случай аварии",
      },
      {
        term: "Zwischenfall",
        simple: "ungeplantes Ereignis, zum Beispiel Unfall oder Leck",
        ru: "инцидент",
      },
    ],
  },
  {
    id: "base-003",
    courseId: "basiskurs",
    topic: "Orangefarbene Tafeln",
    difficulty: "mittel",
    question: "Wann muessen orangefarbene Tafeln am Fahrzeug sichtbar sein?",
    options: [
      "Wenn Gefahrgut nach ADR kennzeichnungspflichtig befoerdert wird",
      "Immer, wenn das Fahrzeug leer ist",
      "Nur nachts",
      "Nur bei Fahrten auf der Autobahn",
    ],
    correctIndex: 0,
    explanation:
      "Orangefarbene Tafeln warnen andere Verkehrsteilnehmer und Einsatzkraefte. Sie sind bei kennzeichnungspflichtiger ADR-Befoerderung sichtbar anzubringen.",
    memoryHook:
      "Orange Tafel bedeutet: Achtung, hier faehrt Gefahrgut. Sie ist kein Deko-Schild.",
    glossary: [
      {
        term: "orangefarbene Tafel",
        simple: "Warnschild fuer Gefahrgut am Fahrzeug",
        ru: "оранжевая табличка опасного груза",
      },
      {
        term: "kennzeichnungspflichtig",
        simple: "muss nach Vorschrift gekennzeichnet werden",
        ru: "подлежит маркировке",
      },
    ],
  },
  {
    id: "base-004",
    courseId: "basiskurs",
    topic: "Feuerloescher",
    difficulty: "leicht",
    question: "Warum muss die ADR-Ausruestung vor Fahrtbeginn kontrolliert werden?",
    options: [
      "Damit fehlende oder defekte Ausruestung rechtzeitig erkannt wird",
      "Damit der LKW schneller faehrt",
      "Damit keine Maut bezahlt werden muss",
      "Damit der Fahrer keine Pausen machen muss",
    ],
    correctIndex: 0,
    explanation:
      "ADR-Ausruestung ist nur nuetzlich, wenn sie vorhanden und einsatzbereit ist. Deshalb prueft der Fahrer sie vor der Fahrt.",
    memoryHook:
      "Kontrolle vor der Fahrt spart Stress bei Kontrolle und Notfall.",
    glossary: [
      {
        term: "ADR-Ausruestung",
        simple: "vorgeschriebene Ausruestung fuer Gefahrguttransport",
        ru: "оборудование ADR",
      },
      {
        term: "einsatzbereit",
        simple: "funktioniert und kann sofort benutzt werden",
        ru: "готово к использованию",
      },
    ],
  },
  {
    id: "base-005",
    courseId: "basiskurs",
    topic: "Tunnel",
    difficulty: "mittel",
    question: "Was bedeuten Tunnelbeschraenkungscodes im ADR-Kontext?",
    options: [
      "Sie zeigen, ob bestimmte Gefahrgueter durch einen Tunnel fahren duerfen",
      "Sie zeigen die Tunnelbeleuchtung",
      "Sie zeigen die erlaubte Musiklautstaerke",
      "Sie gelten nur fuer Busse",
    ],
    correctIndex: 0,
    explanation:
      "Tunnelbeschraenkungscodes helfen zu entscheiden, ob die Ladung durch bestimmte Tunnel transportiert werden darf.",
    memoryHook:
      "Tunnelcode = Darf ich hier mit dieser Ladung durch oder nicht?",
    glossary: [
      {
        term: "Tunnelbeschraenkungscode",
        simple: "Code fuer ADR-Regeln in Tunneln",
        ru: "код ограничения проезда через тоннель",
      },
      {
        term: "Ladung",
        simple: "das, was transportiert wird",
        ru: "груз",
      },
    ],
  },
  {
    id: "base-006",
    courseId: "basiskurs",
    topic: "Gefahrzettel",
    difficulty: "leicht",
    question: "Was zeigen Gefahrzettel auf Versandstuecken?",
    options: [
      "Die Hauptgefahr des Stoffes oder Gegenstandes",
      "Den Preis der Ware",
      "Die Telefonnummer des Empfaengers",
      "Das Baujahr des Fahrzeugs",
    ],
    correctIndex: 0,
    explanation:
      "Gefahrzettel zeigen auf einen Blick, welche Gefahr von einem Versandstueck ausgeht, zum Beispiel entzuendlich, giftig oder aetzend.",
    memoryHook:
      "Gefahrzettel sind die Sprache der Gefahr: Symbol anschauen, Gefahr erkennen.",
    glossary: [
      {
        term: "Gefahrzettel",
        simple: "Symbol-Aufkleber fuer Gefahrgut",
        ru: "знак опасности",
      },
      {
        term: "Versandstueck",
        simple: "verpackte Einheit, die transportiert wird",
        ru: "грузовое место",
      },
    ],
  },
  {
    id: "tank-001",
    courseId: "tank",
    topic: "Befuellen",
    difficulty: "mittel",
    question: "Was ist beim Befuellen eines Tanks besonders wichtig?",
    options: [
      "Die zulaessige Fuellmenge und die Vorschriften des Stoffes beachten",
      "Den Tank immer bis zum Rand fuellen",
      "Den Motor immer laufen lassen",
      "Die orangefarbenen Tafeln abdecken",
    ],
    correctIndex: 0,
    explanation:
      "Beim Befuellen muessen Fuellgrad, Stoffeigenschaften und betriebliche Anweisungen beachtet werden. Ueberfuellung kann gefaehrlich sein.",
    memoryHook:
      "Tank ist kein Eimer. Fuellgrad und Stoffverhalten entscheiden.",
    glossary: [
      {
        term: "Fuellgrad",
        simple: "wie voll ein Tank sein darf",
        ru: "степень наполнения",
      },
      {
        term: "Ueberfuellung",
        simple: "zu viel Stoff im Tank",
        ru: "переполнение",
      },
    ],
  },
  {
    id: "tank-002",
    courseId: "tank",
    topic: "Elektrostatische Aufladung",
    difficulty: "mittel",
    question: "Warum ist elektrostatische Aufladung beim Tanktransport ein Risiko?",
    options: [
      "Funken koennen entzuendliche Daempfe entzünden",
      "Der Reifen wird dadurch schneller abgenutzt",
      "Die Ladung wird dadurch automatisch leichter",
      "Das Navigationsgeraet funktioniert nicht mehr",
    ],
    correctIndex: 0,
    explanation:
      "Bei bestimmten Stoffen koennen Daempfe entstehen. Ein Funke durch elektrostatische Aufladung kann dann eine Entzuendung ausloesen.",
    memoryHook:
      "Bei Tank + Dampf + Funke wird es ernst. Deshalb Erdung und Vorschriften beachten.",
    glossary: [
      {
        term: "elektrostatische Aufladung",
        simple: "elektrische Spannung durch Reibung oder Bewegung",
        ru: "статическое электричество",
      },
      {
        term: "entzuendliche Daempfe",
        simple: "Daempfe, die leicht Feuer fangen koennen",
        ru: "воспламеняющиеся пары",
      },
    ],
  },
  {
    id: "tank-003",
    courseId: "tank",
    topic: "Restmengen",
    difficulty: "mittel",
    question: "Warum kann ein ungereinigter leerer Tank weiter ADR-relevant sein?",
    options: [
      "Weil Restmengen oder Daempfe noch Gefahren verursachen koennen",
      "Weil leere Tanks immer schneller fahren",
      "Weil die Frachtpapiere dann nicht mehr gelten",
      "Weil ein leerer Tank nie gekennzeichnet wird",
    ],
    correctIndex: 0,
    explanation:
      "Auch nach dem Entladen koennen gefaehrliche Reste oder Daempfe im Tank bleiben. Deshalb gelten bestimmte ADR-Pflichten weiter.",
    memoryHook:
      "Leer heisst nicht automatisch ungefaehrlich. Erst gereinigt ist wirklich entspannter.",
    glossary: [
      {
        term: "ungereinigt",
        simple: "noch nicht gereinigt",
        ru: "неочищенный",
      },
      {
        term: "Restmenge",
        simple: "kleine Menge, die im Tank bleibt",
        ru: "остаток вещества",
      },
    ],
  },
  {
    id: "tank-004",
    courseId: "tank",
    topic: "Tankkennzeichnung",
    difficulty: "leicht",
    question: "Wozu dient die Kennzeichnung am Tankfahrzeug?",
    options: [
      "Sie informiert ueber die Gefahr und hilft bei Kontrolle und Notfall",
      "Sie zeigt den Namen des Mechanikers",
      "Sie ersetzt die schriftlichen Weisungen",
      "Sie ist nur Werbung fuer die Spedition",
    ],
    correctIndex: 0,
    explanation:
      "Kennzeichnungen am Tankfahrzeug machen die Gefahr fuer andere sichtbar. Das ist wichtig fuer Kontrollen und Einsatzkraefte.",
    memoryHook:
      "Kennzeichnung sagt nach aussen: Welche Gefahr faehrt hier mit?",
    glossary: [
      {
        term: "Tankfahrzeug",
        simple: "Fahrzeug mit Tank fuer Stoffe",
        ru: "автоцистерна",
      },
      {
        term: "Einsatzkraefte",
        simple: "Feuerwehr, Polizei oder Rettungsdienst",
        ru: "экстренные службы",
      },
    ],
  },
  {
    id: "tank-005",
    courseId: "tank",
    topic: "Dichtheit",
    difficulty: "leicht",
    question: "Was sollte der Fahrer bei Schlaeuchen und Armaturen vor dem Einsatz pruefen?",
    options: [
      "Ob sie dicht, geeignet und ohne sichtbare Schaeden sind",
      "Ob sie die gleiche Farbe wie der LKW haben",
      "Ob sie moeglichst alt sind",
      "Ob sie ohne Kontrolle schneller angeschlossen werden koennen",
    ],
    correctIndex: 0,
    explanation:
      "Schlaeuche und Armaturen muessen zum Stoff passen und dicht sein. Sichtbare Schaeden koennen zu Leckagen fuehren.",
    memoryHook:
      "Vor dem Anschluss kurz hinschauen: passt, dicht, nicht beschaedigt.",
    glossary: [
      {
        term: "Armatur",
        simple: "Ventil oder Anschluss am Tank",
        ru: "арматура, клапан или соединение",
      },
      {
        term: "Leckage",
        simple: "Austritt von Stoff aus Tank oder Leitung",
        ru: "утечка",
      },
    ],
  },
  {
    id: "klasse7-001",
    courseId: "klasse7",
    topic: "Strahlenschutz",
    difficulty: "mittel",
    question: "Welche drei Grundsaetze helfen beim Schutz vor Strahlung?",
    options: [
      "Abstand halten, Aufenthaltszeit kurz halten, Abschirmung nutzen",
      "Fenster oeffnen, Radio einschalten, schneller fahren",
      "Nur nachts fahren, Tank voll machen, Handy ausschalten",
      "Ladung schuetteln, dann kontrollieren",
    ],
    correctIndex: 0,
    explanation:
      "Beim Umgang mit radioaktiven Stoffen gelten einfache Grundprinzipien: Abstand vergroessern, Zeit verkürzen und Abschirmung nutzen.",
    memoryHook:
      "AAA hilft: Abstand, Aufenthaltszeit, Abschirmung.",
    glossary: [
      {
        term: "Abschirmung",
        simple: "Material, das Strahlung reduziert",
        ru: "экранирование",
      },
      {
        term: "Aufenthaltszeit",
        simple: "Zeit, die man in der Naehe bleibt",
        ru: "время пребывания рядом",
      },
    ],
  },
  {
    id: "klasse7-002",
    courseId: "klasse7",
    topic: "Beschaedigte Versandstuecke",
    difficulty: "schwer",
    question: "Was ist bei einem beschaedigten Versandstueck der Klasse 7 besonders wichtig?",
    options: [
      "Abstand halten, Bereich sichern und zustaendige Stellen informieren",
      "Das Versandstueck sofort oeffnen",
      "Den Schaden mit Klebeband verdecken und weiterfahren",
      "Das Versandstueck in den normalen Muell werfen",
    ],
    correctIndex: 0,
    explanation:
      "Bei beschaedigten Versandstuecken der Klasse 7 darf nicht improvisiert werden. Sicherheit, Abstand und Information der zustaendigen Stellen sind entscheidend.",
    memoryHook:
      "Nicht anfassen, nicht oeffnen, nicht verstecken. Sichern und melden.",
    glossary: [
      {
        term: "zustaendige Stelle",
        simple: "Behoerde oder verantwortliche Stelle",
        ru: "компетентный орган",
      },
      {
        term: "Bereich sichern",
        simple: "andere Menschen fernhalten",
        ru: "обезопасить зону",
      },
    ],
  },
  {
    id: "klasse7-003",
    courseId: "klasse7",
    topic: "Kennzeichnung",
    difficulty: "leicht",
    question: "Woran erkennt man Versandstuecke mit radioaktiven Stoffen?",
    options: [
      "An vorgeschriebenen Gefahrzetteln und Kennzeichnungen der Klasse 7",
      "An einer blauen Plane",
      "An einem besonderen Kennzeichen fuer den Fahrer",
      "Nur am Preis der Ware",
    ],
    correctIndex: 0,
    explanation:
      "Radioaktive Stoffe werden mit speziellen Gefahrzetteln und Kennzeichnungen kenntlich gemacht. Diese Informationen duerfen nicht verdeckt werden.",
    memoryHook:
      "Klasse 7 erkennt man an der Klasse-7-Kennzeichnung, nicht an der Verpackungsfarbe.",
    glossary: [
      {
        term: "radioaktive Stoffe",
        simple: "Stoffe, die ionisierende Strahlung aussenden koennen",
        ru: "радиоактивные вещества",
      },
      {
        term: "Kennzeichnung",
        simple: "vorgeschriebene Markierung",
        ru: "маркировка",
      },
    ],
  },
  {
    id: "klasse7-004",
    courseId: "klasse7",
    topic: "Sofortmassnahmen",
    difficulty: "mittel",
    question: "Warum sollte man bei Klasse-7-Zwischenfaellen keine unnoetige Zeit direkt an der Ladung verbringen?",
    options: [
      "Weil kurze Aufenthaltszeit die moegliche Strahlenbelastung reduziert",
      "Weil die Ladung sonst schwerer wird",
      "Weil dadurch die Fahrzeugbatterie leer wird",
      "Weil die Papiere sonst ungueltig werden",
    ],
    correctIndex: 0,
    explanation:
      "Je kuerzer die Zeit in der Naehe einer Strahlenquelle, desto geringer kann die Belastung sein. Deshalb: nicht unnoetig in der Naehe bleiben.",
    memoryHook:
      "Zeit ist Schutz: kurz bleiben, Abstand nehmen, melden.",
    glossary: [
      {
        term: "Strahlenbelastung",
        simple: "Einwirkung von Strahlung auf Menschen",
        ru: "радиационная нагрузка",
      },
      {
        term: "Strahlenquelle",
        simple: "Quelle, von der Strahlung ausgeht",
        ru: "источник излучения",
      },
    ],
  },
];

type RawQuestionBankItem = Omit<TrainerQuestion, "difficulty"> & {
  difficulty: string;
  sourceCourse?: string;
  sourceNumber?: number | null;
  correctAnswer?: string;
};

function normalizeDifficulty(value: string): TrainerQuestion["difficulty"] {
  if (value === "leicht" || value === "mittel" || value === "schwer") return value;
  return "mittel";
}

const curatedQuestionOverrides = new Map(
  curatedTrainerQuestions.map((question) => [
    question.question,
    {
      difficulty: question.difficulty,
      explanation: question.explanation,
      memoryHook: question.memoryHook,
      glossary: question.glossary,
    },
  ]),
);

export const trainerQuestions: TrainerQuestion[] = (trainerQuestionBank.questions as RawQuestionBankItem[])
  .filter((question) => trainerCourses.some((course) => course.id === question.courseId))
  .map((question) => {
    const override = curatedQuestionOverrides.get(question.question);

    return {
      id: question.id,
      courseId: question.courseId,
      topic: question.topic,
      difficulty: override?.difficulty ?? normalizeDifficulty(question.difficulty),
      question: question.question,
      options: question.options,
      correctIndex: question.correctIndex,
      image: question.image ?? null,
      explanation: override?.explanation ?? question.explanation,
      memoryHook: override?.memoryHook ?? question.memoryHook,
      glossary: override?.glossary ?? question.glossary ?? [],
    };
  });

export function getQuestionsForCourse(courseId: TrainerCourseId): TrainerQuestion[] {
  return trainerQuestions.filter((question) => question.courseId === courseId);
}
