// Creative Planner — GPT-based visual scene director for NEWS and WORD families.
// QUESTION uses question-scene-enhancer.mjs (existing, unchanged).
// This module follows the same pattern and returns { usedGpt, mergedBrief, reason }.

const MODEL = process.env.CREATIVE_PLANNER_MODEL || "gpt-4.1-mini";
const OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses";

const WEAK_PHRASES = [
  "dramatic scene",
  "modern background",
  "abstract background",
  "floating icons",
  "symmetrical composition",
  "decorative composition",
  "generic scene",
  "adr truck",
  "roadside scene",
];

function text(value) {
  return value == null ? "" : String(value).trim();
}

function normalizeLower(value) {
  return text(value).toLowerCase();
}

function isWeakValue(value) {
  const safe = normalizeLower(value);
  return !safe || WEAK_PHRASES.some((phrase) => safe.includes(phrase));
}

function isEnhancementRelevant(baseSlide, enh) {
  const copyWords = normalizeLower(baseSlide.copy)
    .split(/[^a-zA-Z0-9äöüß]+/)
    .filter((w) => w.length >= 4);
  const combined = [enh.scene_intent, enh.visual_hint, enh.subject, enh.context, enh.tension]
    .map(normalizeLower)
    .join(" ");
  if (!combined) return false;
  const role = normalizeLower(baseSlide.role);
  if (role && combined.includes(role)) return true;
  return copyWords.some((w) => combined.includes(w));
}

export function validateCreativePlanSlides(baseSlides, enhancedSlides) {
  if (!Array.isArray(baseSlides) || baseSlides.length === 0) return { ok: false, validSlides: [] };
  if (!Array.isArray(enhancedSlides)) return { ok: false, validSlides: [] };

  const validSlides = [];
  for (const base of baseSlides) {
    const enh = enhancedSlides.find((s) => Number(s?.id) === Number(base.id));
    if (!enh) continue;

    const candidate = {
      id: Number(base.id),
      scene_intent: text(enh.scene_intent),
      visual_hint: text(enh.visual_hint),
      subject: text(enh.subject),
      context: text(enh.context),
      tension: text(enh.tension),
      composition: text(enh.composition),
      continuity_key: text(enh.continuity_key),
      shot_size: text(enh.shot_size),
      camera_angle: text(enh.camera_angle),
      lens: text(enh.lens),
      lighting: text(enh.lighting),
    };

    if (!candidate.scene_intent || !candidate.visual_hint) continue;
    if (isWeakValue(candidate.scene_intent) || isWeakValue(candidate.visual_hint)) continue;
    if (!isEnhancementRelevant(base, candidate)) continue;

    validSlides.push(candidate);
  }

  return { ok: validSlides.length > 0, validSlides };
}

// ─── NEWS system prompt ──────────────────────────────────────────────────────

const NEWS_SYSTEM_PROMPT = [
  "You are a visual scene director for ADR Gefahrgut news Shorts.",
  "Given a news headline, summary, and slide structure, define SPECIFIC real-world scenes for each slide.",
  "CRITICAL: Every scene must be visually connected to the actual news topic — never use 'ADR headline opener' or generic backgrounds.",
  "Map news topics to concrete ADR transport scenes:",
  "regulation_change → inspector checking updated documents on clipboard, new ADR placard on truck;",
  "accident/incident → roadside scene with emergency responders in hazmat gear, warning triangles;",
  "inspection_statistics → customs officer at border with ADR checklist, queue of trucks;",
  "training/certification → ADR classroom or practical exam, students with study materials;",
  "penalty/fine → police officer issuing roadside ticket, driver next to truck;",
  "equipment_update → worker comparing old and new fire extinguisher or container type;",
  "new_restriction → truck approaching restricted zone, driver checking route map;",
  "company_news → loading dock scene, logistics manager with workers;",
  "safety_report → safety officer reviewing incident report, warning signs;",
  "Use COMPOSITIONAL language for subject placement — NOT UI terms:",
  "Say 'subject in lower-left third, open sky above' NOT 'safe area for text'.",
  "Say 'medium shot, worker occupying right half, clean wall on left' NOT 'text zone top'.",
  "Each scene must have: one person actively doing something, a specific ADR object, real setting.",
  "Avoid: abstract backgrounds, floating icons, decorative filler, studio lighting.",
  "CONTINUITY: all slides in this video share the same master_scene (one-line description of the primary physical setting and character) and continuity_key (a short token like 'inspector_border_morning' that ties all frames together).",
  "master_scene appears once at the top level. continuity_key appears on every slide.",
  "For shot_size use one of: extreme_close_up, close_up, medium_close_up, medium_shot, medium_wide, wide_shot.",
  "For camera_angle use one of: low_angle, eye_level, high_angle, dutch_angle.",
  "For lens use one of: 24mm_wide, 35mm_documentary, 50mm_standard, 85mm_portrait.",
  "For lighting use one of: golden_hour_warm, clear_midday_bright, soft_diffused_overcast, indoor_industrial.",
  "Return strict JSON: {\"news_type\": \"...\", \"main_entity\": \"...\", \"master_scene\": \"...\", \"slides\": [{id, scene_intent, visual_hint, subject, context, tension, composition, continuity_key, shot_size, camera_angle, lens, lighting}]}",
].join(" ");

// ─── WORD system prompt ──────────────────────────────────────────────────────

const WORD_SYSTEM_PROMPT = [
  "You are a visual scene director for ADR vocabulary Shorts.",
  "Given a German ADR term and its meaning, define SPECIFIC real-world scenes for each slide.",
  "CRITICAL: The term itself determines what is shown — never use generic ADR truck unless the term specifically means that.",
  "If the term names a physical object (Feuerlöscher, Radkeil, Schutzbrille): show that object being actively used.",
  "If the term refers to a document (Beförderungspapier, Fahrweisung): show that document being handled.",
  "If the term refers to a label or sign (Warntafel, Gefahrzettel): show that label being applied or inspected.",
  "If the term refers to an action or procedure (Kennzeichnung, Kontrolle): show that action in progress.",
  "Slide structure for vocabulary: hook (term encounter), context (where it appears), reveal (correct use), stakes (consequence of misuse), cta (continuation).",
  "Use COMPOSITIONAL language: 'subject lower-left, clean upper third' NOT 'text zone'.",
  "Each scene must have: one person + the specific object/document/sign of the term + a real ADR transport setting.",
  "Avoid: posed portraits, generic road scenes without the term's object, abstract imagery.",
  "CONTINUITY: all slides share the same master_scene (one-line primary setting + character) and continuity_key (short token like 'driver_warehouse_morning' repeated on every slide).",
  "master_scene appears once at the top level.",
  "For shot_size use one of: extreme_close_up, close_up, medium_close_up, medium_shot, medium_wide, wide_shot.",
  "For camera_angle use one of: low_angle, eye_level, high_angle, dutch_angle.",
  "For lens use one of: 24mm_wide, 35mm_documentary, 50mm_standard, 85mm_portrait.",
  "For lighting use one of: golden_hour_warm, clear_midday_bright, soft_diffused_overcast, indoor_industrial.",
  "Return strict JSON: {\"master_scene\": \"...\", \"slides\": [{id, scene_intent, visual_hint, subject, context, tension, composition, continuity_key, shot_size, camera_angle, lens, lighting}]}",
].join(" ");

// ─── Shared OpenAI call ──────────────────────────────────────────────────────

async function callPlannerGpt(systemPrompt, userPayload) {
  const apiKey = text(process.env.OPENAI_API_KEY || process.env.OPENAI_API_TOKEN);
  if (!apiKey) return null;

  const schemaProperties = {
    master_scene: { type: "string" },
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
          composition: { type: "string" },
          continuity_key: { type: "string" },
          shot_size: { type: "string" },
          camera_angle: { type: "string" },
          lens: { type: "string" },
          lighting: { type: "string" },
        },
        required: ["id", "scene_intent", "visual_hint", "subject", "context", "tension", "composition", "continuity_key", "shot_size", "camera_angle", "lens", "lighting"],
      },
    },
  };

  let response;
  try {
    response = await fetch(OPENAI_RESPONSES_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: MODEL,
        input: [
          { role: "system", content: [{ type: "input_text", text: systemPrompt }] },
          { role: "user", content: [{ type: "input_text", text: JSON.stringify(userPayload) }] },
        ],
        text: {
          format: {
            type: "json_schema",
            name: "creative_plan",
            schema: {
              type: "object",
              additionalProperties: false,
              properties: schemaProperties,
              required: ["master_scene", "slides"],
            },
          },
        },
      }),
    });
  } catch {
    return null;
  }

  if (!response.ok) return null;

  try {
    const json = await response.json();
    const raw = text(json.output_text || "");
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

// ─── Merge helper ────────────────────────────────────────────────────────────

function mergeSlideEnhancements(baseSlides, enhancedSlides, masterScene) {
  const byId = new Map((enhancedSlides || []).map((s) => [Number(s.id), s]));
  return baseSlides.map((slide) => {
    const enh = byId.get(Number(slide.id));
    if (!enh) return slide;
    return {
      ...slide,
      ...(text(enh.scene_intent) ? { scene_intent: text(enh.scene_intent) } : {}),
      ...(text(enh.visual_hint) ? { visual_hint: text(enh.visual_hint) } : {}),
      ...(text(enh.subject) ? { subject: text(enh.subject) } : {}),
      ...(text(enh.context) ? { context: text(enh.context) } : {}),
      ...(text(enh.tension) ? { tension: text(enh.tension) } : {}),
      ...(text(enh.composition) ? { composition: text(enh.composition) } : {}),
      ...(text(enh.continuity_key) ? { continuity_key: text(enh.continuity_key) } : {}),
      ...(text(enh.shot_size) ? { shot_size: text(enh.shot_size) } : {}),
      ...(text(enh.camera_angle) ? { camera_angle: text(enh.camera_angle) } : {}),
      ...(text(enh.lens) ? { lens: text(enh.lens) } : {}),
      ...(text(enh.lighting) ? { lighting: text(enh.lighting) } : {}),
      ...(masterScene ? { master_scene: masterScene } : {}),
    };
  });
}

// ─── NEWS enhancer ───────────────────────────────────────────────────────────

export async function enhanceNewsScenesWithGpt({ brief, newsContent }) {
  const baseSlides = Array.isArray(brief?.slides) ? brief.slides : [];
  if (baseSlides.length === 0) {
    return { usedGpt: false, reason: "no_base_slides", mergedBrief: brief };
  }

  const payload = {
    source_type: "NEWS",
    headline: text(newsContent?.headline),
    summary: text(newsContent?.summary),
    category: text(newsContent?.category || newsContent?.analytics_tag || ""),
    hook_text: text(newsContent?.hook_text),
    slides: baseSlides.map((s) => ({
      id: Number(s.id) || 0,
      role: text(s.role),
      copy: text(s.copy),
    })),
  };

  const result = await callPlannerGpt(NEWS_SYSTEM_PROMPT, payload).catch(() => null);
  if (!result || !Array.isArray(result.slides) || result.slides.length === 0) {
    return { usedGpt: false, reason: result ? "empty_response" : "gpt_unavailable", mergedBrief: brief };
  }

  const validation = validateCreativePlanSlides(baseSlides, result.slides);
  if (!validation.ok) {
    return { usedGpt: false, reason: "invalid_or_weak_gpt_output", mergedBrief: brief };
  }

  const masterScene = text(result.master_scene);
  return {
    usedGpt: true,
    reason: "ok",
    news_type: text(result.news_type),
    main_entity: text(result.main_entity),
    master_scene: masterScene,
    mergedBrief: {
      ...brief,
      ...(masterScene ? { master_scene: masterScene } : {}),
      slides: mergeSlideEnhancements(baseSlides, validation.validSlides, masterScene),
    },
  };
}

// ─── WORD enhancer ───────────────────────────────────────────────────────────

export async function enhanceWordScenesWithGpt({ brief, wordContent }) {
  const baseSlides = Array.isArray(brief?.slides) ? brief.slides : [];
  if (baseSlides.length === 0) {
    return { usedGpt: false, reason: "no_base_slides", mergedBrief: brief };
  }

  const payload = {
    source_type: "WORD",
    term: text(wordContent?.term),
    translation: text(wordContent?.translation),
    explanation: text(wordContent?.explanation),
    synonym: text(wordContent?.synonym || ""),
    slides: baseSlides.map((s) => ({
      id: Number(s.id) || 0,
      role: text(s.role),
      copy: text(s.copy),
    })),
  };

  const result = await callPlannerGpt(WORD_SYSTEM_PROMPT, payload).catch(() => null);
  if (!result || !Array.isArray(result.slides) || result.slides.length === 0) {
    return { usedGpt: false, reason: result ? "empty_response" : "gpt_unavailable", mergedBrief: brief };
  }

  const validation = validateCreativePlanSlides(baseSlides, result.slides);
  if (!validation.ok) {
    return { usedGpt: false, reason: "invalid_or_weak_gpt_output", mergedBrief: brief };
  }

  const masterScene = text(result.master_scene);
  return {
    usedGpt: true,
    reason: "ok",
    master_scene: masterScene,
    mergedBrief: {
      ...brief,
      ...(masterScene ? { master_scene: masterScene } : {}),
      slides: mergeSlideEnhancements(baseSlides, validation.validSlides, masterScene),
    },
  };
}
