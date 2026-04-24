import { mkdir } from "node:fs/promises";
import { generatePhotorealSceneFrames } from "./question-photoreal-generator.mjs";
import { enhanceQuestionScenesWithGpt } from "./question-scene-enhancer.mjs";

function text(value) {
  return value == null ? "" : String(value).trim();
}

function buildWordBrief({ term, translation, explanation, category }) {
  const cat = text(category) || "word_vocabulary";
  const objectDesc = text(explanation || translation);
  // The visual anchor: whatever the term refers to must be visibly present in the scene.
  // Do NOT override based on category — let the term + explanation drive what's shown.
  const termAnchor = `"${term}" (${objectDesc})`;
  return {
    content_type: "WORD",
    category: cat,
    slides: [
      {
        id: 1,
        role: "hook",
        copy: `Was bedeutet ${term}?`,
        scene_intent: `a real ADR transport moment where ${termAnchor} is about to be used or is visibly relevant`,
        visual_hint: `${termAnchor} is present in the frame — the term itself determines what is shown`,
        subject: `driver or worker in ADR transport context, attention on the item or concept named by "${term}"`,
        context: `truck loading area, roadside, or warehouse; European setting`,
        tension: `the person needs ${term} right now or just encountered it`,
      },
      {
        id: 2,
        role: "question",
        copy: `${term} / ${translation}`,
        scene_intent: `close demonstration of ${termAnchor} in active ADR use — this is the hero shot of the term`,
        visual_hint: `${termAnchor} fills or dominates the centre of the frame; worker's hands interacting with it`,
        subject: `worker actively handling or applying the concept/item of "${term}"`,
        context: `authentic industrial transport or hazmat setting`,
        tension: `task in progress, the specific item or action of "${term}" clearly visible`,
      },
      {
        id: 3,
        role: "answers",
        copy: `${term} = ${translation}`,
        scene_intent: `${termAnchor} correctly applied — result and clarity visible`,
        visual_hint: `${termAnchor} in its correct final state or position; resolution visible`,
        subject: `driver or worker with small satisfied expression, task completed`,
        context: `same ADR setting, resolved outcome`,
        tension: `competence and correct application of "${term}" visible`,
      },
    ],
  };
}

function buildNewsBrief({ headline, summary, category }) {
  const cat = text(category) || "news_regulation";
  const body = text(summary || headline);
  return {
    content_type: "NEWS",
    category: cat,
    slides: [
      {
        id: 1,
        role: "hook",
        copy: text(headline).slice(0, 80),
        scene_intent: `dramatic real-world moment showing the ADR news event context`,
        visual_hint: `high-stakes documentary frame related to the news, driver or inspector in active situation`,
        subject: `transport worker, official, or driver in urgent relevant situation`,
        context: `European motorway, inspection point, or hazmat transport facility`,
        tension: `immediate high-stakes moment related to the news topic`,
      },
      {
        id: 2,
        role: "question",
        copy: body.slice(0, 80),
        scene_intent: `the news situation unfolding — key action or change visible`,
        visual_hint: `documentary capture of the ADR event or regulatory change in practice`,
        subject: `involved persons actively dealing with the situation`,
        context: `authentic ADR transport or regulatory environment`,
        tension: `uncertainty or change in regulation or process`,
      },
      {
        id: 3,
        role: "answers",
        copy: body.slice(0, 80),
        scene_intent: `practical consequence of the news on everyday ADR transport work`,
        visual_hint: `driver or worker adapting to the new situation, compliance visible`,
        subject: `transport professional responding to the news context`,
        context: `ADR workplace showing the practical result or adaptation`,
        tension: `adaptation and professional response visible`,
      },
    ],
  };
}

export async function generateContentVisualBundle({
  contentType,
  contentData,
  generatedDir,
}) {
  await mkdir(generatedDir, { recursive: true });

  let brief;
  let questionText;

  if (contentType === "WORD") {
    const { term, translation, explanation, category } = contentData;
    brief = buildWordBrief({ term, translation, explanation, category });
    questionText = `ADR term: ${term}. ${text(explanation || translation)}`.slice(0, 200);
  } else if (contentType === "NEWS") {
    const { headline, summary, category } = contentData;
    brief = buildNewsBrief({ headline, summary, category });
    questionText = text(headline).slice(0, 200);
  } else {
    throw new Error(`Unsupported content type for visual generation: ${contentType}`);
  }

  const enhanced = await enhanceQuestionScenesWithGpt({
    brief,
    contractor1Output: {
      source_id: text(contentData.sourceId),
      source_type: contentType,
      classification: { analytics_tag: brief.category },
      scenario: { body_blocks: [questionText] },
    },
  }).catch(() => ({ usedGpt: false, mergedBrief: brief }));

  const finalBrief = enhanced.usedGpt ? enhanced.mergedBrief : brief;

  const result = await generatePhotorealSceneFrames({
    generatedDir,
    questionText,
    brief: finalBrief,
    descriptors: [],
  });

  // Returns { framePaths: [hook.jpg, question.jpg, answers.jpg], ... }
  return result;
}
