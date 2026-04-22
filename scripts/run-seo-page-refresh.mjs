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
const DEFAULT_OUTPUT_ROOT = path.join(controlCenterRoot, "runtime", "queues", "seo-expansion-worker-refresh");
const SEO_PAGES_PATH = path.join(repoRoot, "src", "lib", "seo-pages.ts");

enableStrictNonInteractiveMode("run-seo-page-refresh");

function printHelp() {
  console.log(`Usage: node scripts/run-seo-page-refresh.mjs [options]

Options:
  --input <file>        SEO execution queue JSON (default: ${DEFAULT_INPUT_PATH})
  --output-root <dir>   Output root for refresh reports (default: ${DEFAULT_OUTPUT_ROOT})
  --seo-pages <file>    Explicit seo-pages.ts path (default: ${SEO_PAGES_PATH})
  --slug <value>        Explicit output slug
  --top <n>             Limit how many refresh tasks to apply (default: 3)
  --help                Show this help
`);
}

function parseArgs(argv) {
  const args = {
    inputPath: DEFAULT_INPUT_PATH,
    outputRoot: DEFAULT_OUTPUT_ROOT,
    seoPagesPath: SEO_PAGES_PATH,
    slug: "",
    top: 3,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === "--input") args.inputPath = path.resolve(argv[++i]);
    else if (token === "--output-root") args.outputRoot = path.resolve(argv[++i]);
    else if (token === "--seo-pages") args.seoPagesPath = path.resolve(argv[++i]);
    else if (token === "--slug") args.slug = argv[++i];
    else if (token === "--top") args.top = Number(argv[++i]);
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

function toTsString(value) {
  return JSON.stringify(String(value));
}

function topLevelFieldLines(name, value) {
  return [`  ${name}: ${toTsString(value)},`];
}

function topLevelArrayLines(name, values) {
  const safeValues = Array.isArray(values) ? values : [];
  return [
    `  ${name}: [`,
    ...safeValues.map((value) => `    ${toTsString(value)},`),
    "  ],",
  ];
}

async function loadJson(filePath) {
  return JSON.parse(await readFile(filePath, "utf8"));
}

function replaceTopLevelField(block, fieldName, replacementLines) {
  const lines = block.split("\n");
  const start = lines.findIndex((line) => line.startsWith(`  ${fieldName}:`));
  if (start < 0) {
    return block;
  }
  let end = start + 1;
  while (end < lines.length && !/^  [A-Za-z][A-Za-z0-9_]*:/.test(lines[end])) {
    end += 1;
  }
  lines.splice(start, end - start, ...replacementLines);
  return lines.join("\n");
}

function buildRefreshCopy(task) {
  const phrase = text(task.working_title || task.intent_key).replace(/\s+/g, " ");

  if (task.intent_kind === "vocabulary") {
    return {
      heroLead: `Diese Seite fokussiert jetzt klarer den Intent ${phrase} und zeigt einen kleinen, nuetzlichen Wortschatz-Ausschnitt fuer ADR auf Deutsch.`,
      heroSupport: "Sie soll Suchende schnell orientieren, Vertrauen aufbauen und danach sauber in den Telegram-Bot weiterfuehren.",
      intentTitle: "Warum dieser Wortschatz-Intent gerade wichtig ist",
      intentParagraphs: [
        "Live-Signale zeigen, dass Nutzer fuer diesen Begriffsbereich einfache, praktische Orientierung suchen statt langer Theorie.",
        "Darum bleibt die Seite kompakt und hilfreich: genug Inhalt fuer Vertrauen und Suchintention, mehr Drill spaeter im Bot.",
      ],
      sampleTitle: "Gezielte Wortschatz-Vorschau",
      sampleLead: "6 bis 10 Begriffe genuegen, um Nutzen und Suchintention sauber zu bedienen.",
      sampleCalloutText: "Die oeffentliche Seite bleibt bewusst kompakt. Fuer mehr Begriffe, Wiederholung und Drill geht es danach in Telegram weiter.",
      whyTelegramTitle: "Warum Telegram nach der Vorschau der richtige Schritt ist",
      whyTelegramParagraphs: [
        "Im Bot laesst sich Wortschatz besser wiederholen als auf einer statischen SEO-Seite.",
        "So bleibt die Seite hilfreich fuer Google und Nutzer, waehrend die eigentliche Lerntiefe im Bot liegt.",
      ],
      ctaTitle: "ADR-Wortschatz im Telegram-Bot weiterlernen",
      ctaLead: "Wenn der kleine Ausschnitt hilfreich war, geht der naechste sinnvolle Schritt in den Bot mit mehr Begriffen und mehr Wiederholung.",
    };
  }

  if (task.intent_kind === "question") {
    return {
      heroLead: `Diese Seite fokussiert jetzt klarer den Intent ${phrase} und zeigt eine kleine, glaubwuerdige Fragen-Vorschau fuer ADR auf Deutsch.`,
      heroSupport: "Sie soll Suchende schnell orientieren und danach direkt in den Bot fuer echtes Ueben weiterleiten.",
      intentTitle: "Warum dieser Fragen-Intent gerade wichtig ist",
      intentParagraphs: [
        "Live-Signale zeigen, dass Nutzer bei diesem Intent moeglichst schnell in konkrete Fragen und Antwortmuster einsteigen wollen.",
        "Darum zeigt die Seite nur ein kleines Sample, waehrend der Bot den eigentlichen Drill und die Wiederholung uebernimmt.",
      ],
      sampleTitle: "Gezielte Fragen-Vorschau",
      sampleLead: "3 bis 5 Beispiel-Fragen reichen, um den Nutzen sichtbar zu machen und den Rest im Bot zu lassen.",
      sampleCalloutText: "Die Seite beweist den Nutzen nur mit einem kleinen Sample. Mehr Fragen und Wiederholung laufen bewusst im Bot.",
      whyTelegramTitle: "Warum Telegram nach der Vorschau der richtige Schritt ist",
      whyTelegramParagraphs: [
        "Fragen und Antwortmuster lassen sich im Bot besser wiederholen als auf einer statischen Seite.",
        "Die Seite bleibt klar und suchorientiert, der Bot uebernimmt die eigentliche Trainingslogik.",
      ],
      ctaTitle: "ADR-Fragen im Telegram-Bot weiterueben",
      ctaLead: "Wenn du nach dem Sample direkt weiterlernen willst, bringt dich der Bot schneller in echte Wiederholung.",
    };
  }

  return {
    heroLead: `Diese Seite fokussiert jetzt klarer den Intent ${phrase} und bietet einen kompakten Einstieg fuer Menschen, die ADR auf Deutsch besser verstehen und anwenden wollen.`,
    heroSupport: "Sie bleibt bewusst kompakt: Orientierung auf der Seite, mehr Tiefe und Wiederholung danach im Telegram-Bot.",
    intentTitle: "Warum dieser Lern-Intent gerade wichtig ist",
    intentParagraphs: [
      "Live-Signale zeigen, dass Nutzer bei diesem Thema einen klaren, anfangerfreundlichen Einstieg suchen statt ueberladener Theorie.",
      "Darum bleibt die Seite fokussiert und conversion-nah: etwas Nutzen direkt sichtbar, mehr Uebung anschliessend im Bot.",
    ],
    sampleTitle: "Gezielte Lernvorschau",
    sampleLead: "2 bis 3 kleine Beispiele oder Mini-Lektionen reichen, um Suchintention und Vertrauen sauber abzudecken.",
    sampleCalloutText: "Die Vorschau bleibt absichtlich klein. Die eigentliche Wiederholung und Lernroutine liegt im Bot.",
    whyTelegramTitle: "Warum Telegram nach der Vorschau der richtige Schritt ist",
    whyTelegramParagraphs: [
      "Der Bot passt besser zu kurzen Wiederholungseinheiten als eine statische SEO-Seite.",
      "So bleibt die Seite hilfreich fuer Suchende, waehrend der naechste Lernschritt klar und praktisch bleibt.",
    ],
    ctaTitle: "Im Telegram-Bot weiterlernen",
    ctaLead: "Wenn du nach dem Einstieg direkt weitermachen willst, ist der Bot der sinnvollste naechste Schritt.",
  };
}

function updateSeoBlock(block, task) {
  const copy = buildRefreshCopy(task);
  let next = block;
  next = replaceTopLevelField(next, "heroLead", topLevelFieldLines("heroLead", copy.heroLead));
  next = replaceTopLevelField(next, "heroSupport", topLevelFieldLines("heroSupport", copy.heroSupport));
  next = replaceTopLevelField(next, "intentTitle", topLevelFieldLines("intentTitle", copy.intentTitle));
  next = replaceTopLevelField(next, "intentParagraphs", topLevelArrayLines("intentParagraphs", copy.intentParagraphs));
  next = replaceTopLevelField(next, "sampleTitle", topLevelFieldLines("sampleTitle", copy.sampleTitle));
  next = replaceTopLevelField(next, "sampleLead", topLevelFieldLines("sampleLead", copy.sampleLead));
  next = replaceTopLevelField(next, "sampleCalloutText", topLevelFieldLines("sampleCalloutText", copy.sampleCalloutText));
  next = replaceTopLevelField(next, "whyTelegramTitle", topLevelFieldLines("whyTelegramTitle", copy.whyTelegramTitle));
  next = replaceTopLevelField(next, "whyTelegramParagraphs", topLevelArrayLines("whyTelegramParagraphs", copy.whyTelegramParagraphs));
  next = replaceTopLevelField(next, "ctaTitle", topLevelFieldLines("ctaTitle", copy.ctaTitle));
  next = replaceTopLevelField(next, "ctaLead", topLevelFieldLines("ctaLead", copy.ctaLead));
  return next;
}

function findSeoBlock(source, slug) {
  const pattern = /export const [A-Za-z0-9_]+: SeoPageConfig = \{[\s\S]*?\n\};/g;
  for (const match of source.matchAll(pattern)) {
    const block = match[0];
    if (block.includes(`slug: "${slug}"`)) {
      return {
        start: match.index,
        end: match.index + block.length,
        block,
      };
    }
  }
  return null;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const queue = await loadJson(args.inputPath);
  const refreshTasks = queue
    .filter((task) => task.task_type === "refresh_existing_page" && task.page_exists)
    .slice(0, Number.isFinite(args.top) && args.top > 0 ? args.top : 3);

  if (refreshTasks.length === 0) {
    throw new Error("No refresh_existing_page tasks available.");
  }

  let seoPagesSource = await readFile(args.seoPagesPath, "utf8");
  const updated = [];

  for (const task of refreshTasks) {
    const slug = text(task.recommended_slug).replace(/^\//, "");
    const located = findSeoBlock(seoPagesSource, slug);
    if (!located) continue;
    const updatedBlock = updateSeoBlock(located.block, task);
    seoPagesSource = `${seoPagesSource.slice(0, located.start)}${updatedBlock}${seoPagesSource.slice(located.end)}`;
    updated.push({
      task_id: task.task_id,
      slug: `/${slug}`,
      task_type: task.task_type,
      intent_kind: task.intent_kind,
      opportunity_score: task.opportunity_score,
    });
  }

  await writeFile(args.seoPagesPath, seoPagesSource, "utf8");

  const createdAt = new Date().toISOString();
  const slug = slugify(args.slug || `seo-refresh-${Date.now()}`) || `seo-refresh-${Date.now()}`;
  const outputDir = path.join(args.outputRoot, slug);
  const latestDir = path.join(args.outputRoot, "latest");
  await mkdir(outputDir, { recursive: true });
  await mkdir(latestDir, { recursive: true });

  const report = {
    created_at: createdAt,
    input_path: args.inputPath,
    seo_pages_path: args.seoPagesPath,
    applied_count: updated.length,
    top_limit: Number.isFinite(args.top) && args.top > 0 ? args.top : 3,
    updated,
  };

  const reportPath = path.join(outputDir, "seo_refresh_report.json");
  const latestReportPath = path.join(latestDir, "seo_refresh_report.latest.json");
  await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  await writeFile(latestReportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

  logAutonomousDecision("seo page refresh applied", {
    applied_count: updated.length,
    seo_pages_path: args.seoPagesPath,
  });

  console.log(`output_dir=${outputDir}`);
  console.log(`seo_refresh_report=${reportPath}`);
  console.log(`latest_seo_refresh_report=${latestReportPath}`);
  console.log(`applied_count=${updated.length}`);
  console.log(`seo_pages_path=${args.seoPagesPath}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
