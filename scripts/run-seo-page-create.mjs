#!/usr/bin/env node

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { enableStrictNonInteractiveMode, logAutonomousDecision } from "./runtime/non-interactive-mode.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const controlCenterRoot = path.resolve(repoRoot, "..", "adr-control-center");
const DEFAULT_INPUT_PATH = path.join(controlCenterRoot, "runtime", "queues", "seo-expansion-worker", "latest", "seo_execution_queue.latest.json");
const DEFAULT_OUTPUT_ROOT = path.join(controlCenterRoot, "runtime", "queues", "seo-expansion-worker-create");
const SEO_PAGES_PATH = path.join(repoRoot, "src", "lib", "seo-pages.ts");
const APP_DIR = path.join(repoRoot, "src", "app");

enableStrictNonInteractiveMode("run-seo-page-create");

function printHelp() {
  console.log(`Usage: node scripts/run-seo-page-create.mjs [options]

Options:
  --input <file>        SEO execution queue JSON (default: ${DEFAULT_INPUT_PATH})
  --output-root <dir>   Output root for create reports (default: ${DEFAULT_OUTPUT_ROOT})
  --seo-pages <file>    Explicit seo-pages.ts path (default: ${SEO_PAGES_PATH})
  --app-dir <dir>       Explicit src/app directory (default: ${APP_DIR})
  --slug <value>        Explicit output slug
  --top <n>             Limit how many create tasks to apply (default: 1)
  --only-auto-eligible  Create only tasks marked as auto-apply eligible
  --dry-run             Build report without writing files
  --help                Show this help
`);
}

function parseArgs(argv) {
  const args = {
    inputPath: DEFAULT_INPUT_PATH,
    outputRoot: DEFAULT_OUTPUT_ROOT,
    seoPagesPath: SEO_PAGES_PATH,
    appDir: APP_DIR,
    slug: "",
    top: 1,
    onlyAutoEligible: false,
    dryRun: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === "--input") args.inputPath = path.resolve(argv[++i]);
    else if (token === "--output-root") args.outputRoot = path.resolve(argv[++i]);
    else if (token === "--seo-pages") args.seoPagesPath = path.resolve(argv[++i]);
    else if (token === "--app-dir") args.appDir = path.resolve(argv[++i]);
    else if (token === "--slug") args.slug = argv[++i];
    else if (token === "--top") args.top = Number(argv[++i]);
    else if (token === "--only-auto-eligible") args.onlyAutoEligible = true;
    else if (token === "--dry-run") args.dryRun = true;
    else if (token === "--help" || token === "-h") {
      printHelp();
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${token}`);
    }
  }

  return args;
}

function text(value) {
  return value == null ? "" : String(value).trim();
}

function slugify(value) {
  return text(value)
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function formatTitleBase(value) {
  const normalized = text(value)
    .replace(/[-_/]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!normalized) return "ADR Lernhilfe";
  return normalized
    .split(" ")
    .map((part) => {
      const lower = part.toLowerCase();
      if (lower === "adr") return "ADR";
      if (lower === "app") return "App";
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join(" ");
}

function toConstName(slug) {
  const parts = text(slug).replace(/^\//, "").split("-").filter(Boolean);
  const [first, ...rest] = parts;
  return [first || "seo", ...rest.map((part) => part.charAt(0).toUpperCase() + part.slice(1))].join("");
}

function isCreateCandidate(task) {
  const slug = text(task.recommended_slug).replace(/^\//, "");
  if (!slug) return false;
  if (task.task_type !== "create_new_page") return false;
  if (task.page_exists) return false;
  if (task.intent_kind === "generic") return false;
  if (slug === "manual" || slug.includes("test")) return false;
  return true;
}

async function loadJson(filePath) {
  return JSON.parse(await readFile(filePath, "utf8"));
}

function buildNewSeoConfigBlock(task) {
  const slug = text(task.recommended_slug).replace(/^\//, "");
  const constName = toConstName(slug);
  const titleBase = formatTitleBase(task.working_title || slug);
  const intentKind = text(task.intent_kind);
  const questionSample = intentKind === "question"
    ? `  sampleQuestions: [
    {
      question: "Welche typische Frage steckt hinter ${titleBase}?",
      answer:
        "Die Seite soll einen kleinen, glaubwuerdigen Ausschnitt liefern und dann sauber in den Telegram-Bot weiterleiten.",
    },
    {
      question: "Warum reicht hier nur ein Sample?",
      answer:
        "Weil die Seite fuer Orientierung und Suchintention gebaut ist, waehrend die volle Uebung im Bot weitergeht.",
    },
    {
      question: "Was ist der naechste sinnvolle Schritt?",
      answer:
        "Nach dem kurzen Sample direkt in den Bot wechseln und dort weiter ueben.",
    },
  ],`
    : "";
  const termSample = intentKind === "vocabulary"
    ? `  sampleTerms: [
    { term: "Fachwort", note: "Ein kleines Beispiel, das den Suchintent glaubwuerdig bedient." },
    { term: "Pruefungssprache", note: "Typische Formulierungen brauchen oft kurze Erklaerung." },
    { term: "Wiederholung", note: "Die eigentliche Vertiefung passiert spaeter im Bot." },
    { term: "Telegram", note: "Der naechste Schritt fuer mehr Drill und mehr Begriffe." },
    { term: "Orientierung", note: "Die Seite soll zuerst schnell Nutzen zeigen." },
    { term: "Sample", note: "Nur ein kleiner Ausschnitt statt kompletter Wissensbasis." },
  ],`
    : `  sampleTerms: [
    { term: "Einstieg", note: "Der Suchintent zeigt oft den Wunsch nach schneller Orientierung." },
    { term: "Uebung", note: "Die eigentliche Wiederholung soll im Bot weiterlaufen." },
    { term: "Sprache", note: "Fachsprache ist oft die groesste Huerde fuer Nutzer." },
  ],`;

  return `
export const ${constName}: SeoPageConfig = {
  slug: "${slug}",
  path: "/${slug}",
  pageTitle: "${titleBase}",
  metaTitle: "${titleBase} | ADR Bot",
  metaDescription:
    "Kompakte SEO-Vorschau fuer ${titleBase} mit kleinem Sample und klarer Weiterleitung in den Telegram-Bot.",
  heroKicker: SEO_PAGE_KICKER,
  heroTitle: "${titleBase}",
  heroLead:
    "Diese Seite wurde aus realen Intent-Signalen priorisiert und gibt einen kompakten Einstieg in ${titleBase}.",
  heroSupport:
    "Sie bleibt bewusst kompakt: Orientierung auf der Seite, Wiederholung und Lerntiefe danach im Telegram-Bot.",
  intentTitle: "Warum dieser Intent wichtig ist",
  intentParagraphs: [
    "Die Seite wurde gebaut, weil reale Signale gezeigt haben, dass Nutzer genau fuer diesen Intent nach einer klaren Einstiegsseite suchen.",
    "Darum bleibt die Seite fokussiert, hilfreich und conversion-nah statt ueberladen zu werden.",
  ],
  sampleTitle: "Kleines Sample",
  sampleLead:
    "Nur ein kleiner Ausschnitt, damit Suchintention und Nutzen sichtbar werden, ohne den Bot zu ersetzen.",
${questionSample}
${termSample}
  sampleCalloutTitle: "Bewusst kompakt",
  sampleCalloutText:
    "Die Vorschau dient der Orientierung. Mehr Drill, mehr Wiederholung und mehr Tiefe laufen im Telegram-Bot.",
  whyTelegramTitle: "Warum Telegram der naechste Schritt ist",
  whyTelegramParagraphs: [
    "Der Bot passt besser zu Wiederholung und Lernroutine als eine statische SEO-Seite.",
    "So bleibt die Seite hilfreich fuer Suchende, waehrend der eigentliche Trainingsnutzen im Bot entsteht.",
  ],
  faqs: [
    {
      question: "Ist diese Seite der komplette Kurs?",
      answer:
        "Nein. Sie ist eine kleine SEO-Vorschau mit begrenztem Sample und klarer Weiterleitung in den Bot.",
    },
    {
      question: "Warum ist die Seite so kompakt?",
      answer:
        "Weil sie Orientierung und Vertrauen geben soll, waehrend die eigentliche Uebung im Bot weitergeht.",
    },
    {
      question: "Was kommt nach dieser Seite?",
      answer:
        "Der naechste sinnvolle Schritt ist der Telegram-Bot mit mehr Wiederholung und mehr Tiefe.",
    },
  ],
  relatedLinks: [
    { href: "/", label: "Startseite", note: "Zur Hauptseite zurueck" },
    { href: "/adr-pruefung-auf-deutsch", label: "ADR-Pruefung auf Deutsch", note: "Breiter Einstieg in die ADR-Vorbereitung" },
    { href: "/adr-begriffe", label: "ADR Begriffe", note: "Wortschatz und Begriffe im Vorschauformat" },
  ],
  ctaTitle: "Im Telegram-Bot weitermachen",
  ctaLead:
    "Wenn dir die Vorschau hilft, geht der naechste sinnvolle Schritt in den Telegram-Bot fuer mehr Uebung.",
  ctaButton: SEO_PRIMARY_CTA,
  disclaimer:
    "Diese Seite ist eine kompakte Lernvorschau und ersetzt keine offizielle Schulung.",
  telegramSource: "seo_${slug.replace(/-/g, "_")}",
  keywords: [
    "${titleBase}",
    "${titleBase} ADR",
    "${titleBase} Deutsch",
    "ADR Bot",
  ],
};
`;
}

function insertConfigAndList(source, task) {
  const slug = text(task.recommended_slug).replace(/^\//, "");
  const constName = toConstName(slug);
  if (source.includes(`slug: "${slug}"`)) {
    return source;
  }
  const block = buildNewSeoConfigBlock(task);
  const listAnchor = "export const seoPageList = [";
  const listIndex = source.indexOf(listAnchor);
  if (listIndex < 0) {
    throw new Error("Could not locate seoPageList in seo-pages.ts");
  }
  const beforeList = source.slice(0, listIndex);
  const afterList = source.slice(listIndex).replace(
    listAnchor,
    `${listAnchor}\n  ${constName},`,
  );
  return `${beforeList}${block}\n${afterList}`;
}

function buildPageFile(slug) {
  const constName = toConstName(slug);
  return `import { SeoPage } from "@/components/seo/seo-page";
import { ${constName}, buildSeoPageMetadata } from "@/lib/seo-pages";
import type { Metadata } from "next";

export const metadata: Metadata = buildSeoPageMetadata(${constName});

export default function Page() {
  return <SeoPage page={${constName}} />;
}
`;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const queue = await loadJson(args.inputPath);
  const filteredQueue = args.onlyAutoEligible
    ? queue.filter((task) => task.auto_apply_eligible === true)
    : queue;
  const tasks = filteredQueue
    .filter(isCreateCandidate)
    .slice(0, Number.isFinite(args.top) && args.top > 0 ? args.top : 1);

  if (tasks.length === 0) {
    const createdAt = new Date().toISOString();
    const slug = slugify(args.slug || `seo-create-${Date.now()}`) || `seo-create-${Date.now()}`;
    const outputDir = path.join(args.outputRoot, slug);
    const latestDir = path.join(args.outputRoot, "latest");
    await mkdir(outputDir, { recursive: true });
    await mkdir(latestDir, { recursive: true });
    const report = {
      created_at: createdAt,
      input_path: args.inputPath,
      seo_pages_path: args.seoPagesPath,
      app_dir: args.appDir,
      applied_count: 0,
      top_limit: Number.isFinite(args.top) && args.top > 0 ? args.top : 1,
      only_auto_eligible: args.onlyAutoEligible,
      dry_run: args.dryRun,
      created: [],
      skipped_reason: "No valid create_new_page tasks available.",
    };
    const reportPath = path.join(outputDir, "seo_create_report.json");
    const latestReportPath = path.join(latestDir, "seo_create_report.latest.json");
    await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
    await writeFile(latestReportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
    console.log(`output_dir=${outputDir}`);
    console.log(`seo_create_report=${reportPath}`);
    console.log(`latest_seo_create_report=${latestReportPath}`);
    console.log(`applied_count=0`);
    return;
  }

  let seoPagesSource = await readFile(args.seoPagesPath, "utf8");
  const created = [];

  for (const task of tasks) {
    const slug = text(task.recommended_slug).replace(/^\//, "");
    seoPagesSource = insertConfigAndList(seoPagesSource, task);
    created.push({
      task_id: task.task_id,
      slug: `/${slug}`,
      page_path: path.join(args.appDir, slug, "page.tsx"),
      created_const: toConstName(slug),
    });
  }

  if (!args.dryRun) {
    await writeFile(args.seoPagesPath, seoPagesSource, "utf8");

    for (const entry of created) {
      const pageDir = path.dirname(entry.page_path);
      await mkdir(pageDir, { recursive: true });
      await writeFile(entry.page_path, buildPageFile(entry.slug.replace(/^\//, "")), "utf8");
    }
  }

  const createdAt = new Date().toISOString();
  const slug = slugify(args.slug || `seo-create-${Date.now()}`) || `seo-create-${Date.now()}`;
  const outputDir = path.join(args.outputRoot, slug);
  const latestDir = path.join(args.outputRoot, "latest");
  await mkdir(outputDir, { recursive: true });
  await mkdir(latestDir, { recursive: true });
  const report = {
    created_at: createdAt,
    input_path: args.inputPath,
    seo_pages_path: args.seoPagesPath,
    app_dir: args.appDir,
    applied_count: created.length,
    top_limit: Number.isFinite(args.top) && args.top > 0 ? args.top : 1,
    only_auto_eligible: args.onlyAutoEligible,
    dry_run: args.dryRun,
    created,
  };
  const reportPath = path.join(outputDir, "seo_create_report.json");
  const latestReportPath = path.join(latestDir, "seo_create_report.latest.json");
  await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  await writeFile(latestReportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

  logAutonomousDecision("seo page create applied", {
    applied_count: created.length,
    seo_pages_path: args.seoPagesPath,
  });

  console.log(`output_dir=${outputDir}`);
  console.log(`seo_create_report=${reportPath}`);
  console.log(`latest_seo_create_report=${latestReportPath}`);
  console.log(`applied_count=${created.length}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
