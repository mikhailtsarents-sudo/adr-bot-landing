const DEFAULT_SCENE_ENHANCER_MODEL = process.env.QUESTION_SCENE_ENHANCER_MODEL || "gpt-4.1-mini";
const OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses";
const WEAK_PHRASES = [
  "dramatic scene",
  "modern background",
  "abstract background",
  "floating icons",
  "symmetrical composition",
  "decorative composition",
  "generic scene",
];

function text(value) {
  return value == null ? "" : String(value).trim();
}

function normalizeLower(value) {
  return text(value).toLowerCase();
}

export const QUESTION_SCENE_ENHANCER_SYSTEM_PROMPT = [
  "You are a visual scene director and cinematographer for ADR Gefahrgut educational Shorts.",
  "Your job: read the actual ADR question category and content, then define a SPECIFIC real-world scene that matches the topic.",
  "CRITICAL: Do NOT default to a roadside document check unless the content is actually about driver licenses or transport documents.",
  "Map ADR categories to appropriate real-world scenes:",
  "fire_safety/fire_extinguisher → truck driver inspecting or using fire extinguisher at vehicle;",
  "tank_transport/tank_regulations → ADR tank truck at loading area or inspection;",
  "emergency_equipment/first_aid → driver opening emergency kit or first aid box next to truck;",
  "marking_labeling/hazard_labels → worker placing or checking orange hazard panels or diamond placards on truck;",
  "cargo_securing/load_safety → loader securing cargo with straps inside truck;",
  "tunnel_routes/routing → truck approaching tunnel entrance, route check;",
  "duties_of_driver/driver_obligations → driver filling logbook or checking checklist;",
  "transport_documents/driver_license → roadside police check, inspector and driver, documents;",
  "packaging/containers → warehouse worker handling ADR-labeled containers or drums;",
  "training/certification → classroom or practical ADR exam situation;",
  "news/regulation → official reviewing ADR regulation document or safety briefing;",
  "word/vocabulary → the term itself determines what is shown: if the term names a physical object show it being used; if it names a label or document show that; always make the named concept visually present.",
  "Create a real moment in time with interaction, context, and tension specific to the actual topic.",
  "Avoid generic roadside scenes, abstract backgrounds, floating icons, and decorative filler.",
  "For shot_size use one of: extreme_close_up, close_up, medium_close_up, medium_shot, medium_wide, wide_shot.",
  "For camera_angle use one of: low_angle, eye_level, high_angle, dutch_angle.",
  "For lens use one of: 24mm_wide, 35mm_documentary, 50mm_standard, 85mm_portrait.",
  "For lighting use one of: golden_hour_warm, clear_midday_bright, soft_diffused_overcast, indoor_industrial.",
  "Return strict JSON only: {\"slides\":[...]} with fields: id, scene_intent, visual_hint, subject, context, tension, shot_size, camera_angle, lens, lighting.",
].join(" ");

export function buildQuestionSceneEnhancerInput(brief, contractor1Output) {
  const scenario = contractor1Output?.scenario || {};
  const classification = contractor1Output?.classification || {};
  return {
    source_id: text(contractor1Output?.source_id),
    content_type: text(contractor1Output?.source_type || classification.source_type || "QUESTION"),
    category: text(scenario.category || classification.analytics_tag || ""),
    question: text(scenario.body_blocks?.[0] || scenario.question_short || scenario.hook_text),
    correct_answer: text(scenario.core_answer || scenario.correct_short || ""),
    visual_direction: text(brief?.visual_direction) || text(contractor1Output?.visual_direction) || "question_card_vertical",
    slides: (Array.isArray(brief?.slides) ? brief.slides : []).map((slide) => ({
      id: Number(slide.id) || 0,
      role: text(slide.role),
      copy: text(slide.copy),
      base_scene_intent: text(slide.scene_intent),
      base_visual_hint: text(slide.visual_hint),
    })),
  };
}

export function parseQuestionSceneEnhancerResponse(raw) {
  const payload = text(raw);
  if (!payload) {
    return null;
  }

  try {
    return JSON.parse(payload);
  } catch {}

  const fencedMatch = payload.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fencedMatch?.[1]) {
    try {
      return JSON.parse(fencedMatch[1].trim());
    } catch {}
  }

  const firstBrace = payload.indexOf("{");
  const lastBrace = payload.lastIndexOf("}");
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    try {
      return JSON.parse(payload.slice(firstBrace, lastBrace + 1));
    } catch {}
  }

  return null;
}

function isWeakEnhancementValue(value) {
  const safe = normalizeLower(value);
  return !safe || WEAK_PHRASES.some((phrase) => safe.includes(phrase));
}

function isSlideRelevant(baseSlide, enhancement) {
  const role = normalizeLower(baseSlide.role);
  const copyWords = normalizeLower(baseSlide.copy)
    .split(/[^a-zA-Z0-9äöüß]+/)
    .filter((word) => word.length >= 4);
  const combined = [
    enhancement.scene_intent,
    enhancement.visual_hint,
    enhancement.subject,
    enhancement.context,
    enhancement.tension,
  ]
    .map(normalizeLower)
    .join(" ");

  if (!combined) {
    return false;
  }

  if (role && combined.includes(role)) {
    return true;
  }

  return copyWords.some((word) => combined.includes(word));
}

export function validateQuestionSceneEnhancements(baseSlides, enhancements) {
  if (!Array.isArray(baseSlides) || baseSlides.length === 0) {
    return { ok: false, validSlides: [] };
  }
  if (!Array.isArray(enhancements)) {
    return { ok: false, validSlides: [] };
  }

  const validSlides = [];

  for (const baseSlide of baseSlides) {
    const enhancement = enhancements.find((item) => Number(item?.id) === Number(baseSlide.id));
    if (!enhancement) {
      continue;
    }

    const candidate = {
      id: Number(baseSlide.id),
      scene_intent: text(enhancement.scene_intent),
      visual_hint: text(enhancement.visual_hint),
      subject: text(enhancement.subject),
      context: text(enhancement.context),
      tension: text(enhancement.tension),
      shot_size: text(enhancement.shot_size),
      camera_angle: text(enhancement.camera_angle),
      lens: text(enhancement.lens),
      lighting: text(enhancement.lighting),
    };

    const hasPrimaryFields =
      candidate.scene_intent &&
      candidate.visual_hint &&
      !isWeakEnhancementValue(candidate.scene_intent) &&
      !isWeakEnhancementValue(candidate.visual_hint);

    if (!hasPrimaryFields) {
      continue;
    }

    if (!isSlideRelevant(baseSlide, candidate)) {
      continue;
    }

    validSlides.push(candidate);
  }

  return {
    ok: validSlides.length > 0,
    validSlides,
  };
}

export function mergeQuestionSceneEnhancements(baseSlides, enhancements) {
  const enhancementById = new Map((enhancements || []).map((item) => [Number(item.id), item]));

  return (baseSlides || []).map((slide) => {
    const enhancement = enhancementById.get(Number(slide.id));
    if (!enhancement) {
      return slide;
    }

    return {
      ...slide,
      scene_intent: text(enhancement.scene_intent) || text(slide.scene_intent),
      visual_hint: text(enhancement.visual_hint) || text(slide.visual_hint),
      ...(text(enhancement.subject) ? { subject: text(enhancement.subject) } : {}),
      ...(text(enhancement.context) ? { context: text(enhancement.context) } : {}),
      ...(text(enhancement.tension) ? { tension: text(enhancement.tension) } : {}),
      ...(text(enhancement.shot_size) ? { shot_size: text(enhancement.shot_size) } : {}),
      ...(text(enhancement.camera_angle) ? { camera_angle: text(enhancement.camera_angle) } : {}),
      ...(text(enhancement.lens) ? { lens: text(enhancement.lens) } : {}),
      ...(text(enhancement.lighting) ? { lighting: text(enhancement.lighting) } : {}),
    };
  });
}

async function callSceneEnhancerGpt(payload) {
  const apiKey = text(process.env.OPENAI_API_KEY || process.env.OPENAI_API_TOKEN);
  if (!apiKey) {
    return null;
  }

  const response = await fetch(OPENAI_RESPONSES_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: DEFAULT_SCENE_ENHANCER_MODEL,
      input: [
        {
          role: "system",
          content: [{ type: "input_text", text: QUESTION_SCENE_ENHANCER_SYSTEM_PROMPT }],
        },
        {
          role: "user",
          content: [{ type: "input_text", text: JSON.stringify(payload) }],
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "question_scene_enhancements",
          schema: {
            type: "object",
            additionalProperties: false,
            properties: {
              slides: {
                type: "array",
                items: {
                  type: "object",
                  additionalProperties: false,
                  properties: {
                    id: { type: "integer" },
                    scene_intent: { type: "string" },
                    visual_hint: { type: "string" },
                    subject: { type: "string" },
                    context: { type: "string" },
                    tension: { type: "string" },
                    shot_size: { type: "string" },
                    camera_angle: { type: "string" },
                    lens: { type: "string" },
                    lighting: { type: "string" },
                  },
                  required: ["id", "scene_intent", "visual_hint", "subject", "context", "tension", "shot_size", "camera_angle", "lens", "lighting"],
                },
              },
            },
            required: ["slides"],
          },
        },
      },
    }),
  });

  if (!response.ok) {
    return null;
  }

  const json = await response.json();
  return text(json.output_text || "");
}

export async function enhanceQuestionScenesWithGpt({ brief, contractor1Output }) {
  const baseSlides = Array.isArray(brief?.slides) ? brief.slides : [];
  if (baseSlides.length === 0) {
    return {
      usedGpt: false,
      reason: "no_base_slides",
      basePrompt: brief,
      mergedBrief: brief,
      enhancements: [],
    };
  }

  const enhancerInput = buildQuestionSceneEnhancerInput(brief, contractor1Output);
  const raw = await callSceneEnhancerGpt(enhancerInput).catch(() => null);
  const parsed = parseQuestionSceneEnhancerResponse(raw);
  const validation = validateQuestionSceneEnhancements(baseSlides, parsed?.slides || []);

  if (!validation.ok) {
    return {
      usedGpt: false,
      reason: raw ? "invalid_or_weak_gpt_output" : "gpt_unavailable",
      basePrompt: brief,
      mergedBrief: brief,
      enhancements: [],
    };
  }

  return {
    usedGpt: true,
    reason: "ok",
    basePrompt: brief,
    mergedBrief: {
      ...brief,
      slides: mergeQuestionSceneEnhancements(baseSlides, validation.validSlides),
    },
    enhancements: validation.validSlides,
  };
}
