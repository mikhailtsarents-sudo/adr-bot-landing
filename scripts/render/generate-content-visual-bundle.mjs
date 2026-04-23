import { mkdir } from "node:fs/promises";
import { generatePhotorealSceneFrames } from "./question-photoreal-generator.mjs";
import { enhanceQuestionScenesWithGpt } from "./question-scene-enhancer.mjs";

function text(value) {
  return value == null ? "" : String(value).trim();
}

function buildWordBrief({ term, translation, explanation, category }) {
  const cat = text(category) || "word_vocabulary";
  const objectDesc = text(explanation || translation);
  // Give the image generator a concrete physical description of the term so it
  // renders the actual equipment/object, not generic ADR placards or signs.
  const physicalHint = `the specific physical item or action described by "${term}" (${objectDesc}); NOT ADR danger placards, NOT orange hazmat signs`;
  return {
    content_type: "WORD",
    category: cat,
    slides: [
      {
        id: 1,
        role: "hook",
        copy: `Was bedeutet ${term}?`,
        scene_intent: `driver or worker about to use the physical item "${term}" (${objectDesc}) — the item itself is visible in the frame`,
        visual_hint: `close frame showing ${physicalHint} near a truck wheel or loading area`,
        subject: `driver or worker in ADR transport context reaching for or looking at the item`,
        context: `truck parking area or roadside; European setting; item clearly identifiable`,
        tension: `the person needs the item right now — urgency`,
      },
      {
        id: 2,
        role: "question",
        copy: `${term} / ${translation}`,
        scene_intent: `hands actively placing or using ${physicalHint} in an ADR transport situation`,
        visual_hint: `tight close-up of hands on the actual ${term} object; ${objectDesc}; object clearly fills centre of frame`,
        subject: `worker handling the actual item — the object itself is the hero of the shot`,
        context: `truck wheel, truck undercarriage, or loading dock; authentic industrial ADR setting`,
        tension: `task in progress, physical object prominent`,
      },
      {
        id: 3,
        role: "answers",
        copy: `${term} = ${translation}`,
        scene_intent: `${term} correctly placed and visible — result shot showing the item in use`,
        visual_hint: `the ${term} item (${objectDesc}) clearly in position; vehicle or equipment visible in background`,
        subject: `driver standing back, item correctly deployed, small satisfaction`,
        context: `same ADR truck setting, resolved outcome, item in final position`,
        tension: `competence and completion visible`,
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
