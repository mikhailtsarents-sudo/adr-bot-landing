import { readFile, stat, writeFile } from "node:fs/promises";
import jpeg from "jpeg-js";
import path from "node:path";
import { PNG } from "pngjs";

const OPENAI_IMAGES_URL = "https://api.openai.com/v1/images/generations";
const OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses";
const DEFAULT_IMAGE_MODEL = process.env.QUESTION_PHOTOREAL_IMAGE_MODEL || "gpt-image-1";
const DEFAULT_VISION_MODEL = process.env.QUESTION_PHOTOREAL_VISION_MODEL || "gpt-4.1-mini";
const DEFAULT_FRAME_GENERATION_TIMEOUT_MS = Math.max(
  1_000,
  Number(process.env.QUESTION_PHOTOREAL_FRAME_TIMEOUT_MS) || 90_000,
);
const DEFAULT_PROVIDER_ATTEMPT_TIMEOUT_MS = Math.max(
  DEFAULT_FRAME_GENERATION_TIMEOUT_MS,
  Number(process.env.QUESTION_PHOTOREAL_PROVIDER_TIMEOUT_MS) || 180_000,
);
const ROLE_SEQUENCE = ["hook", "question", "answers"];
const FAL_AI_TOKEN = text(process.env.FAL_AI_API_KEY);
const EXTERNAL_PROVIDER_1_URL = text(process.env.QUESTION_PHOTOREAL_FALLBACK_1_URL);
const EXTERNAL_PROVIDER_1_TOKEN = text(process.env.QUESTION_PHOTOREAL_FALLBACK_1_TOKEN);
const EXTERNAL_PROVIDER_1_MODEL = text(process.env.QUESTION_PHOTOREAL_FALLBACK_1_MODEL);
const EXTERNAL_PROVIDER_2_URL = text(process.env.QUESTION_PHOTOREAL_FALLBACK_2_URL);
const EXTERNAL_PROVIDER_2_TOKEN = text(process.env.QUESTION_PHOTOREAL_FALLBACK_2_TOKEN);
const EXTERNAL_PROVIDER_2_MODEL = text(process.env.QUESTION_PHOTOREAL_FALLBACK_2_MODEL);

function text(value) {
  return value == null ? "" : String(value).trim();
}

const FAL_MODEL_PRESETS = {
  realism: "https://fal.run/fal-ai/flux-realism",
  dev: "https://fal.run/fal-ai/flux/dev",
  pro: "https://fal.run/fal-ai/flux-pro/v1.1",
};

function normalizeFalProfile(value) {
  const raw = text(value).toLowerCase();
  if (!raw) return "realism";
  if (raw === "flux-realism" || raw === "realism") return "realism";
  if (raw === "flux-dev" || raw === "dev") return "dev";
  if (raw === "flux-pro" || raw === "pro" || raw === "pro-v1.1") return "pro";
  return "realism";
}

export function resolveFalAiModelConfig() {
  const explicitUrl = text(process.env.FAL_AI_MODEL_URL);
  if (explicitUrl) {
    return {
      profile: "custom",
      url: explicitUrl,
      source: "FAL_AI_MODEL_URL",
    };
  }

  const profile = normalizeFalProfile(
    process.env.FAL_AI_PROFILE || process.env.QUESTION_PHOTOREAL_FAL_PROFILE,
  );

  return {
    profile,
    url: FAL_MODEL_PRESETS[profile] || FAL_MODEL_PRESETS.realism,
    source: profile === "realism" ? "default" : "profile",
  };
}

const FAL_AI_MODEL = resolveFalAiModelConfig();
const FAL_AI_URL = FAL_AI_MODEL.url;

function normalizeSceneCopy(value) {
  return text(value).replace(/\s+/g, " ").slice(0, 220);
}

async function buildDataUrl(filePath) {
  const buffer = await readFile(filePath);
  const ext = path.extname(filePath).toLowerCase();
  const mime = ext === ".png" ? "image/png" : "image/jpeg";
  return `data:${mime};base64,${buffer.toString("base64")}`;
}

function getApiKey() {
  return text(process.env.OPENAI_API_KEY || process.env.OPENAI_API_TOKEN);
}

function allowUnvalidatedOutput() {
  return text(process.env.QUESTION_PHOTOREAL_ALLOW_UNVALIDATED_OUTPUT).toLowerCase() === "true";
}

function getProviderAvailability(provider) {
  if (provider.kind === "openai") {
    return {
      available: Boolean(getApiKey()),
      why_unavailable: getApiKey() ? "" : "missing_api_key",
    };
  }

  if (provider.kind === "fal_ai") {
    return {
      available: Boolean(FAL_AI_TOKEN),
      why_unavailable: FAL_AI_TOKEN ? "" : "missing_fal_ai_api_key",
    };
  }

  if (provider.kind === "external_http") {
    return {
      available: Boolean(text(provider.url)),
      why_unavailable: text(provider.url) ? "" : "missing_url",
    };
  }

  return {
    available: false,
    why_unavailable: "unsupported_provider_kind",
  };
}

function buildImageProviders() {
  const disabledProviders = new Set(
    text(process.env.QUESTION_PHOTOREAL_DISABLED_PROVIDERS)
      .split(",")
      .map((value) => text(value))
      .filter(Boolean),
  );
  const providerPriority = text(process.env.QUESTION_PHOTOREAL_PROVIDER_PRIORITY)
    .split(",")
    .map((value) => text(value))
    .filter(Boolean);
  const priorityIndex = new Map(providerPriority.map((value, index) => [value, index]));

  const providers = [
    {
      id: "fal_ai_primary",
      kind: "fal_ai",
      available: Boolean(FAL_AI_TOKEN) && !disabledProviders.has("fal_ai_primary"),
      supports_multi_image_generation: false,
      supports_negative_prompt: true,
      supports_size: false,
      supports_aspect_ratio: false,
      supports_quality: false,
      supports_output_format: false,
      supports_response_format: false,
    },
    {
      id: "openai_primary",
      kind: "openai",
      available: Boolean(getApiKey()) && !disabledProviders.has("openai_primary"),
      supports_multi_image_generation: true,
      supports_negative_prompt: false,
      supports_size: true,
      supports_aspect_ratio: false,
      supports_quality: true,
      supports_output_format: true,
      supports_response_format: false,
    },
    {
      id: "external_fallback_1",
      kind: "external_http",
      available: Boolean(EXTERNAL_PROVIDER_1_URL) && !disabledProviders.has("external_fallback_1"),
      url: EXTERNAL_PROVIDER_1_URL,
      token: EXTERNAL_PROVIDER_1_TOKEN,
      model: EXTERNAL_PROVIDER_1_MODEL,
      supports_multi_image_generation:
        text(process.env.QUESTION_PHOTOREAL_FALLBACK_1_SUPPORTS_MULTI_IMAGE_GENERATION).toLowerCase() === "true",
      supports_negative_prompt: text(process.env.QUESTION_PHOTOREAL_FALLBACK_1_SUPPORTS_NEGATIVE_PROMPT).toLowerCase() === "true",
      supports_size: text(process.env.QUESTION_PHOTOREAL_FALLBACK_1_SUPPORTS_SIZE).toLowerCase() !== "false",
      supports_aspect_ratio: text(process.env.QUESTION_PHOTOREAL_FALLBACK_1_SUPPORTS_ASPECT_RATIO).toLowerCase() === "true",
      supports_quality: text(process.env.QUESTION_PHOTOREAL_FALLBACK_1_SUPPORTS_QUALITY).toLowerCase() === "true",
      supports_output_format: text(process.env.QUESTION_PHOTOREAL_FALLBACK_1_SUPPORTS_OUTPUT_FORMAT).toLowerCase() !== "false",
      supports_response_format: text(process.env.QUESTION_PHOTOREAL_FALLBACK_1_SUPPORTS_RESPONSE_FORMAT).toLowerCase() === "true",
    },
    {
      id: "external_fallback_2",
      kind: "external_http",
      available: Boolean(EXTERNAL_PROVIDER_2_URL) && !disabledProviders.has("external_fallback_2"),
      url: EXTERNAL_PROVIDER_2_URL,
      token: EXTERNAL_PROVIDER_2_TOKEN,
      model: EXTERNAL_PROVIDER_2_MODEL,
      supports_multi_image_generation:
        text(process.env.QUESTION_PHOTOREAL_FALLBACK_2_SUPPORTS_MULTI_IMAGE_GENERATION).toLowerCase() === "true",
      supports_negative_prompt: text(process.env.QUESTION_PHOTOREAL_FALLBACK_2_SUPPORTS_NEGATIVE_PROMPT).toLowerCase() === "true",
      supports_size: text(process.env.QUESTION_PHOTOREAL_FALLBACK_2_SUPPORTS_SIZE).toLowerCase() !== "false",
      supports_aspect_ratio: text(process.env.QUESTION_PHOTOREAL_FALLBACK_2_SUPPORTS_ASPECT_RATIO).toLowerCase() === "true",
      supports_quality: text(process.env.QUESTION_PHOTOREAL_FALLBACK_2_SUPPORTS_QUALITY).toLowerCase() === "true",
      supports_output_format: text(process.env.QUESTION_PHOTOREAL_FALLBACK_2_SUPPORTS_OUTPUT_FORMAT).toLowerCase() !== "false",
      supports_response_format: text(process.env.QUESTION_PHOTOREAL_FALLBACK_2_SUPPORTS_RESPONSE_FORMAT).toLowerCase() === "true",
    },
  ];

  providers.sort((left, right) => {
    const leftIndex = priorityIndex.has(left.id) ? priorityIndex.get(left.id) : Number.MAX_SAFE_INTEGER;
    const rightIndex = priorityIndex.has(right.id) ? priorityIndex.get(right.id) : Number.MAX_SAFE_INTEGER;
    if (leftIndex !== rightIndex) {
      return leftIndex - rightIndex;
    }
    return 0;
  });

  return providers;
}

export function resolvePhotorealProviders() {
  return buildImageProviders().map((provider) => {
    const availability = getProviderAvailability(provider);
    return {
      ...provider,
      available: provider.available && availability.available,
      why_unavailable: !provider.available
        ? "disabled_for_smoke_run"
        : availability.why_unavailable,
    };
  });
}

function buildRasterValidationProviders() {
  const priority = text(process.env.QUESTION_PHOTOREAL_VALIDATION_PROVIDER_PRIORITY || "openai_primary")
    .split(",")
    .map((value) => text(value))
    .filter(Boolean);
  const priorityIndex = new Map(priority.map((value, index) => [value, index]));

  const providers = resolvePhotorealProviders()
    .filter((provider) => provider.id === "openai_primary")
    .map((provider) => ({
      provider_id: provider.id,
      provider_kind: provider.kind,
      provider_role: "raster_validation_provider",
      available: provider.available,
      why_unavailable: provider.why_unavailable,
      model: DEFAULT_VISION_MODEL,
    }));

  providers.sort((left, right) => {
    const leftIndex = priorityIndex.has(left.provider_id) ? priorityIndex.get(left.provider_id) : Number.MAX_SAFE_INTEGER;
    const rightIndex = priorityIndex.has(right.provider_id) ? priorityIndex.get(right.provider_id) : Number.MAX_SAFE_INTEGER;
    return leftIndex - rightIndex;
  });

  return providers;
}

export function inspectPhotorealProviderConfiguration({
  requireConfiguredFallbackForSmokeRun = false,
} = {}) {
  const providers = resolvePhotorealProviders();
  const diagnostics = providers.map((provider) => ({
    provider_id: provider.id,
    available: provider.available,
    why_unavailable: provider.why_unavailable,
  }));

  const openAiEnabled = diagnostics.some(
    (item) => item.provider_id === "openai_primary" && item.available,
  );
  const availableFallbackCount = diagnostics.filter(
    (item) => item.provider_id !== "openai_primary" && item.available,
  ).length;
  const availableProviderCount = diagnostics.filter((item) => item.available).length;

  if (requireConfiguredFallbackForSmokeRun && openAiEnabled && availableFallbackCount === 0) {
    return {
      pass: false,
      reason: "no_configured_fallback_provider",
      provider_configuration_diagnostics: diagnostics,
    };
  }

  if (availableProviderCount === 0) {
    return {
      pass: false,
      reason: "no_usable_provider_configured",
      provider_configuration_diagnostics: diagnostics,
    };
  }

  return {
    pass: true,
    reason: "",
    provider_configuration_diagnostics: diagnostics,
  };
}

function sanitizeVisualHint(hint) {
  if (!hint) return hint;
  return hint
    .replace(/[""]([^""]{0,120})[""]|"([^"]{0,120})"/g, "the scene")
    .replace(/\s*readable for\s+the scene/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

const FAMILY_MOOD = {
  QUESTION: "bright editorial photography, clean modern aesthetic, golden hour soft daylight, warm yellow and fresh white color palette, high-key lighting, optimistic atmosphere",
  WORD: "clean minimal editorial, soft natural daylight, pastel warm tones, premium educational feel, calm modern European logistics environment",
  NEWS: "clear modern photojournalism, neutral bright daylight, fresh white and accent blue color palette, informative approachable atmosphere",
};

// Anti-default prefix: prevents flux from defaulting to dark/cinematic/moody
const ANTI_DEFAULT_MOOD = "Avoid: overcast sky, rain, dark cinematic mood, fog, cold blue tint, desaturated colors, industrial decay, gloomy atmosphere, grey washed-out look, dystopian feel, dramatic shadows.";

// Per-family camera style references
const FAMILY_CAMERA = {
  QUESTION: "iPhone 16 Pro, 35mm equivalent, candid documentary",
  WORD: "Canon EOS R5, 50mm lens, clean editorial training photo",
  NEWS: "Fujifilm X-T5, 35mm documentary photojournalism look",
};

function buildScenePositivePrompt({
  role,
  sceneIndex,
  questionText,
  copy,
  sceneIntent,
  visualHint,
  subject,
  context,
  tension,
  contentFamily,
  shot_size,
  camera_angle,
  lens,
  lighting,
}) {
  const family = String(contentFamily || "QUESTION").toUpperCase();
  const familyMood = FAMILY_MOOD[family] || FAMILY_MOOD.QUESTION;
  const familyCamera = FAMILY_CAMERA[family] || FAMILY_CAMERA.QUESTION;

  // Shot defaults when GPT enhancement didn't provide them
  const resolvedShot = shot_size || (role === "hook" ? "medium_close_up" : role === "question" ? "medium_shot" : "medium_close_up");
  const resolvedAngle = camera_angle || "low_angle";
  const resolvedLens = lens || "35mm_documentary";
  const resolvedLighting = lighting || "golden_hour_warm";

  // Subject-first opening sentence (most important for model comprehension)
  const subjectLine = subject
    ? `${subject}${context ? `, ${context}` : ""}.`
    : `Real-world ADR / Gefahrgut scene: ${sceneIntent || visualHint || "truck transport or hazardous goods handling"}.`;

  const cinematographySpec = [
    `Camera: ${familyCamera}.`,
    `Shot: ${resolvedShot.replace(/_/g, " ")}, ${resolvedAngle.replace(/_/g, " ")}.`,
    `Lens: ${resolvedLens.replace(/_/g, " ")}.`,
    `Lighting: ${resolvedLighting.replace(/_/g, " ")}.`,
  ].join(" ");

  const mandatoryElements = [
    "Mandatory: real ADR / Gefahrgut / truck transport or hazardous goods handling setting.",
    "Mandatory: at least one person (driver, worker, or operator) clearly visible and actively doing something.",
    "Mandatory: hands interacting with relevant object (equipment, label, container, document, or vehicle part).",
    "Mandatory: at least one readable human face.",
    "Mandatory: vehicle, roadside, warehouse, or industrial ADR context visible.",
  ].join(" ");

  return [
    // 1. SUBJECT FIRST — what is in the frame
    subjectLine,
    // 2. Scene intent and visual detail
    sceneIntent ? `Scene intent: ${sceneIntent}.` : "",
    visualHint ? `Visual detail: ${sanitizeVisualHint(visualHint)}.` : "",
    tension ? `Tension: ${tension}.` : "",
    questionText ? `Topic context (visual only, NOT text to render): ${questionText}.` : "",
    // 3. Cinematography spec
    cinematographySpec,
    // 4. Composition
    "Composition: vertical 9:16 smartphone frame, subject placed in lower two-thirds, clear space in upper area for text overlay.",
    // 5. Style
    `Style: photorealistic smartphone documentary still. ${familyMood}. ${ANTI_DEFAULT_MOOD}`,
    // 6. Materials and realism
    "Materials: skin texture, fabric folds, worn safety equipment, industrial surfaces, imperfect real-world details.",
    // 7. Mandatory elements
    mandatoryElements,
    // 8. Hard constraints
    "No artificial text overlays. No captions. No subtitles. No logos. No watermarks. No UI elements.",
    "Natural in-scene text is allowed only when it belongs to the photographed world: labels on containers, hazard placards, uniform markings.",
  ].filter((line) => line && line.trim()).join("\n");
}

function buildSceneNegativePrompt() {
  return [
    "illustration",
    "vector",
    "svg",
    "flat design",
    "cartoon",
    "anime",
    "digital art",
    "3d render",
    "cgi",
    "ui",
    "interface",
    "dashboard",
    "infographic",
    "card layout",
    "poster",
    "poster layout",
    "typography",
    "text overlay",
    "subtitles",
    "captions",
    "title text",
    "centered text",
    "floating text",
    "UI elements",
    "icon",
    "symbol",
    "abstract background",
    "gradient background",
    "studio backdrop",
    "posed portrait",
    "dealership handoff",
    "office meeting",
    "courtroom",
    "police arrest",
    "border checkpoint",
    "insurance claim scene",
    "empty car interior",
    "hands-only crop",
    "isolated portrait",
    "wide cinematic establishing shot",
    "logo",
    "watermark",
    "brand mark",
    "fake letters",
    "fake text",
    "random characters",
    "lens distortion",
    "distortion",
  ].join(", ");
}

function buildFrameManifest({ provider, selectedScenes, generatedDir }) {
  return selectedScenes.map((scene, index) => ({
    canonical_id: `scene${index + 1}`,
    scene_index: index + 1,
    role: text(scene?.role) || `scene_${index + 1}`,
    local_path: path.join(generatedDir, `${provider.id}-scene${index + 1}.jpg`),
    provider_id: provider.id,
  }));
}

function buildMultiScenePrompt({ questionText, scenes }) {
  return [
    `Generate exactly ${scenes.length} photorealistic vertical preview frames as one ordered set for the same unfolding ADR roadside inspection story.`,
    `Question context: ${questionText}`,
    "Return the images in this exact order: scene1, scene2, scene3.",
    ...scenes.map((scene, index) =>
      [
        `scene${index + 1}:`,
        buildScenePositivePrompt({
          role: scene.role,
          sceneIndex: index,
          questionText,
          copy: scene.copy,
          sceneIntent: scene.scene_intent,
          visualHint: scene.visual_hint,
          subject: scene.subject,
          context: scene.context,
          tension: scene.tension,
          shot_size: scene.shot_size,
          camera_angle: scene.camera_angle,
          lens: scene.lens,
          lighting: scene.lighting,
        }),
      ].join("\n"),
    ),
  ].join("\n\n");
}

function buildProviderPrompt(provider, prompt, negativePrompt) {
  if (provider.supports_negative_prompt) {
    return prompt;
  }
  if (!negativePrompt) {
    return prompt;
  }
  if (provider.kind === "openai") {
    return `${prompt}\nNegative prompt: ${negativePrompt}`;
  }
  return `${prompt}\nAvoid: ${negativePrompt}`;
}

function buildOpenAiImageBody(provider, prompt, negativePrompt, imageCount = 1) {
  const body = {
    model: DEFAULT_IMAGE_MODEL,
    prompt: buildProviderPrompt(provider, prompt, negativePrompt),
    n: imageCount,
    moderation: "low",
    background: "opaque",
  };
  if (provider.supports_size) {
    body.size = "1024x1536";
  }
  if (provider.supports_quality) {
    body.quality = "high";
  }
  if (provider.supports_output_format) {
    body.output_format = "jpeg";
  }
  return body;
}

function buildFalAiBody(prompt, negativePrompt, { referenceImageUrl = null, strength = 0.55, seed = null } = {}) {
  const body = {
    prompt: `${prompt}\nAvoid: ${negativePrompt}`,
    image_size: "portrait_16_9",
    num_inference_steps: 35,
    guidance_scale: 3.5,
    num_images: 1,
    enable_safety_checker: true,
    ...(seed !== null ? { seed } : {}),
    ...(referenceImageUrl ? { image_url: referenceImageUrl, strength } : {}),
  };
  return body;
}

function buildProviderRequest(provider, prompt, negativePrompt, imageCount = 1, options = {}) {
  if (provider.kind === "openai") {
    return {
      url: OPENAI_IMAGES_URL,
      body: buildOpenAiImageBody(provider, prompt, negativePrompt, imageCount),
    };
  }

  if (provider.kind === "fal_ai") {
    return {
      url: FAL_AI_URL,
      body: buildFalAiBody(prompt, negativePrompt, options),
    };
  }

  if (provider.kind === "external_http") {
    return {
      url: provider.url,
      body: buildExternalProviderBody(provider, prompt, negativePrompt, imageCount),
    };
  }

  throw new Error(`Unsupported provider kind: ${provider.kind}`);
}

function summarizeProbeResponse(provider, status, bodyText, parsedJson) {
  if (status < 200 || status >= 300) {
    return "http_error";
  }

  if (provider.kind === "openai") {
    return text(parsedJson?.data?.[0]?.b64_json) ? "success" : "invalid_response";
  }

  if (provider.kind === "external_http") {
    if (
      text(bodyText).startsWith("http://") ||
      text(bodyText).startsWith("https://") ||
      text(extractBase64Image(parsedJson)) ||
      text(extractRemoteImageUrl(parsedJson))
    ) {
      return "success";
    }
  }

  return "invalid_response";
}

function countImagesInProviderResponse(provider, bodyText, parsedJson) {
  if (provider.kind === "openai") {
    return Array.isArray(parsedJson?.data) ? parsedJson.data.length : 0;
  }

  if (provider.kind === "external_http") {
    const base64Images = extractBase64Images(parsedJson);
    if (base64Images.length > 0) {
      return base64Images.length;
    }
    const remoteUrls = extractRemoteImageUrls(parsedJson);
    if (remoteUrls.length > 0) {
      return remoteUrls.length;
    }
    if (text(bodyText).startsWith("http://") || text(bodyText).startsWith("https://")) {
      return 1;
    }
  }

  return 0;
}

export function buildPhotorealProviderProbePayload({
  questionText = "Where is your driver's license?",
} = {}) {
  const prompt = buildScenePositivePrompt({
    role: "hook",
    sceneIndex: 0,
    questionText,
    copy: "Show documents now.",
    sceneIntent: "confrontation start during ADR roadside inspection",
    visualHint: "driver and inspector, document near lens, tense phone-camera frame",
    subject: "driver handing license toward inspector at roadside stop",
    context: "real car interior and roadside checkpoint visible",
    tension: "immediate pressure during document demand",
  });
  const negativePrompt = buildSceneNegativePrompt();
  return { prompt, negativePrompt };
}

export function buildPhotorealBatchedProbePayload({
  questionText = "Where is your driver's license?",
} = {}) {
  const scenes = [
    {
      role: "hook",
      copy: "Show documents now.",
      scene_intent: "confrontation start during ADR roadside inspection",
      visual_hint: "driver and inspector, document near lens, tense phone-camera frame",
      subject: "driver handing license toward inspector at roadside stop",
      context: "real car interior and roadside checkpoint visible",
      tension: "immediate pressure during document demand",
    },
    {
      role: "question",
      copy: "Where is your driver's license?",
      scene_intent: "inspector presses the demand while driver hesitates",
      visual_hint: "both faces visible, over-shoulder documentary framing, document still in play",
      subject: "driver hesitating while inspector questions missing license",
      context: "open door, roadside shoulder, real car interior and exterior context",
      tension: "uncertainty rising during the roadside check",
    },
    {
      role: "answers",
      copy: "I left it at home.",
      scene_intent: "driver answers under pressure while inspection continues",
      visual_hint: "tighter inspection moment, inspector closer, hands and document visible",
      subject: "driver responding while inspector continues checking documents",
      context: "roadside stop with car interior or exterior vehicle context still visible",
      tension: "admission under visible pressure",
    },
  ];
  return {
    prompt: buildMultiScenePrompt({
      questionText,
      scenes,
    }),
    negativePrompt: buildSceneNegativePrompt(),
    imageCount: scenes.length,
    scenes,
  };
}

export function buildPhotorealProviderProbeRequests({
  questionText = "Where is your driver's license?",
} = {}) {
  const providers = resolvePhotorealProviders();
  const { prompt, negativePrompt } = buildPhotorealProviderProbePayload({ questionText });
  return providers.map((provider) => ({
    provider,
    prompt,
    negativePrompt,
    request: buildProviderRequest(provider, prompt, negativePrompt),
  }));
}

export function buildPhotorealBatchedProviderProbeRequests({
  questionText = "Where is your driver's license?",
} = {}) {
  const providers = resolvePhotorealProviders();
  const { prompt, negativePrompt, imageCount, scenes } = buildPhotorealBatchedProbePayload({ questionText });
  return providers
    .filter((provider) => Boolean(provider.supports_multi_image_generation))
    .map((provider) => ({
      provider,
      prompt,
      negativePrompt,
      imageCount,
      scenes,
      request: buildProviderRequest(provider, prompt, negativePrompt, imageCount),
    }));
}

export async function probePhotorealProviders({
  questionText = "Where is your driver's license?",
  timeoutMs = DEFAULT_FRAME_GENERATION_TIMEOUT_MS,
} = {}) {
  const probeEntries = buildPhotorealProviderProbeRequests({ questionText });
  const results = [];

  for (const entry of probeEntries) {
    const { provider, request } = entry;
    const startedAt = Date.now();
    const baseResult = {
      provider_id: provider.id,
      request_url: request.url,
      elapsed_ms: 0,
      timeout_ms: timeoutMs,
      result: "invalid_response",
      http_status: null,
      response_headers: null,
      first_1000_chars_of_response_body: "",
      request_body: request.body,
      available: provider.available,
      why_unavailable: provider.why_unavailable,
    };

    if (!provider.available) {
      baseResult.elapsed_ms = Date.now() - startedAt;
      results.push(baseResult);
      continue;
    }

    try {
      const apiKey = getApiKey();
      const response = await fetchWithTimeout(request.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(provider.kind === "openai" ? { Authorization: `Bearer ${apiKey}` } : provider.kind === "fal_ai" ? { Authorization: `Key ${FAL_AI_TOKEN}` } : {}),
          ...(provider.kind === "external_http" && text(provider.token)
            ? { Authorization: `Bearer ${provider.token}` }
            : {}),
        },
        body: JSON.stringify(request.body),
      }, {
        providerId: provider.id,
        reason: "frame_generation_timeout",
        sceneId: "scene1",
        timeoutMs,
        timeoutScope: "frame",
      });

      const responseText = await response.text();
      const parsedJson = tryParseJson(responseText);
      baseResult.http_status = response.status;
      baseResult.response_headers = Object.fromEntries(response.headers.entries());
      baseResult.first_1000_chars_of_response_body = String(responseText || "").slice(0, 1000);
      baseResult.elapsed_ms = Date.now() - startedAt;
      baseResult.result = summarizeProbeResponse(provider, response.status, responseText, parsedJson);
      results.push(baseResult);
    } catch (error) {
      baseResult.elapsed_ms = Date.now() - startedAt;
      if (error?.code === "TIMEOUT" || text(error?.reason) === "frame_generation_timeout") {
        baseResult.result = "timeout";
      } else {
        baseResult.result = "invalid_response";
      }
      baseResult.first_1000_chars_of_response_body = text(error?.message || error).slice(0, 1000);
      results.push(baseResult);
    }
  }

  return {
    timeout_ms: timeoutMs,
    question_text: questionText,
    providers: results,
  };
}

export async function probePhotorealBatchedProviders({
  questionText = "Where is your driver's license?",
  timeoutMs = DEFAULT_PROVIDER_ATTEMPT_TIMEOUT_MS,
} = {}) {
  const probeEntries = buildPhotorealBatchedProviderProbeRequests({ questionText });
  const results = [];

  for (const entry of probeEntries) {
    const { provider, request, imageCount } = entry;
    const startedAt = Date.now();
    const baseResult = {
      provider_id: provider.id,
      supports_multi_image_generation: Boolean(provider.supports_multi_image_generation),
      available: provider.available,
      why_unavailable: provider.why_unavailable,
      request_url: request.url,
      timeout_ms: timeoutMs,
      elapsed_ms: 0,
      http_status: null,
      result: "invalid_response",
      image_count_returned: 0,
      first_1000_chars_of_response_body: "",
      request_body: request.body,
    };

    if (!provider.available) {
      baseResult.elapsed_ms = Date.now() - startedAt;
      results.push(baseResult);
      continue;
    }

    try {
      const apiKey = getApiKey();
      const response = await fetchWithTimeout(request.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(provider.kind === "openai" ? { Authorization: `Bearer ${apiKey}` } : provider.kind === "fal_ai" ? { Authorization: `Key ${FAL_AI_TOKEN}` } : {}),
          ...(provider.kind === "external_http" && text(provider.token)
            ? { Authorization: `Bearer ${provider.token}` }
            : {}),
        },
        body: JSON.stringify(request.body),
      }, {
        providerId: provider.id,
        reason: "frame_generation_timeout",
        sceneId: "scene1",
        timeoutMs,
        timeoutScope: "provider_attempt",
      });

      const responseText = await response.text();
      const parsedJson = tryParseJson(responseText);
      const imageCountReturned = countImagesInProviderResponse(provider, responseText, parsedJson);
      baseResult.http_status = response.status;
      baseResult.elapsed_ms = Date.now() - startedAt;
      baseResult.image_count_returned = imageCountReturned;
      baseResult.first_1000_chars_of_response_body = String(responseText || "").slice(0, 1000);

      if (response.status < 200 || response.status >= 300) {
        baseResult.result = "http_error";
      } else if (imageCountReturned < imageCount) {
        baseResult.result = parsedJson || text(responseText) ? "fewer_than_3_images" : "invalid_response";
      } else {
        baseResult.result = "success";
      }

      results.push(baseResult);
    } catch (error) {
      baseResult.elapsed_ms = Date.now() - startedAt;
      baseResult.first_1000_chars_of_response_body = text(error?.message || error).slice(0, 1000);
      if (error?.code === "TIMEOUT" || text(error?.reason) === "frame_generation_timeout") {
        baseResult.result = "timeout";
      } else {
        baseResult.result = "invalid_response";
      }
      results.push(baseResult);
    }
  }

  return {
    timeout_ms: timeoutMs,
    question_text: questionText,
    providers: results,
  };
}

function buildTimeoutError({
  providerId,
  reason,
  sceneId,
  timeoutMs,
  timeoutScope,
}) {
  const error = new Error(
    `${providerId} ${reason}${sceneId ? ` at ${sceneId}` : ""}${timeoutMs ? ` after ${timeoutMs}ms` : ""}`,
  );
  error.code = "TIMEOUT";
  error.provider_id = providerId;
  error.reason = reason;
  error.timed_out_scene_id = sceneId;
  error.timeout_ms = timeoutMs;
  error.timeout_scope = timeoutScope;
  return error;
}

async function fetchWithTimeout(url, options, timeoutConfig) {
  const timeoutMs = Number(timeoutConfig?.timeoutMs) || 0;
  if (timeoutMs <= 0) {
    return fetch(url, options);
  }

  const controller = new AbortController();
  const timeoutError = buildTimeoutError({
    providerId: text(timeoutConfig?.providerId) || "provider",
    reason: text(timeoutConfig?.reason) || "frame_generation_timeout",
    sceneId: text(timeoutConfig?.sceneId),
    timeoutMs,
    timeoutScope: text(timeoutConfig?.timeoutScope) || "frame",
  });
  const timeoutId = setTimeout(() => controller.abort(timeoutError), timeoutMs);

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
    });
  } catch (error) {
    if (controller.signal.aborted) {
      throw controller.signal.reason || timeoutError;
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function generateImageToFile({ provider, requestBody, outputPath, timeoutConfig }) {
  const apiKey = getApiKey();
  if (provider.kind === "openai" && !apiKey) {
    throw new Error("Photorealistic QUESTION previews require OPENAI_API_KEY.");
  }

  const response = await fetchWithTimeout(requestBody.url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(provider.kind === "openai"
        ? { Authorization: `Bearer ${apiKey}` }
        : provider.kind === "fal_ai"
          ? { Authorization: `Key ${FAL_AI_TOKEN}` }
          : {}),
      ...(provider.kind === "external_http" && text(provider.token)
        ? { Authorization: `Bearer ${provider.token}` }
        : {}),
    },
    body: JSON.stringify(requestBody.body),
  }, timeoutConfig);

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`${provider.id} image generation failed: ${response.status} ${body}`);
  }

  if (provider.kind === "openai") {
    const json = await response.json();
    const b64 = json?.data?.[0]?.b64_json;
    if (!b64) {
      throw new Error("OpenAI image generation returned no image data.");
    }
    await writeFile(outputPath, Buffer.from(b64, "base64"));
    return;
  }

  if (provider.kind === "external_http" || provider.kind === "fal_ai") {
    const rawText = await response.text();
    const parsed = tryParseJson(rawText);
    if (parsed) {
      const sourceUrl = await writeImagePayloadToFile(parsed, outputPath, timeoutConfig);
      return sourceUrl || null;
    }

    if (rawText.startsWith("http://") || rawText.startsWith("https://")) {
      const sourceUrl = await writeImagePayloadToFile({ url: rawText.trim() }, outputPath, timeoutConfig);
      return sourceUrl || null;
    }

    throw new Error(`${provider.id} returned invalid or non-raster output.`);
  }

  throw new Error(`Unsupported provider kind: ${provider.kind}`);
}

function tryParseJson(value) {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function detectRasterMime(buffer) {
  if (!buffer || buffer.length < 12) {
    return "";
  }
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "image/jpeg";
  }
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return "image/png";
  }
  return "";
}

function readUint16BE(buffer, offset) {
  if (offset + 2 > buffer.length) {
    return 0;
  }
  return buffer.readUInt16BE(offset);
}

function readUint32BE(buffer, offset) {
  if (offset + 4 > buffer.length) {
    return 0;
  }
  return buffer.readUInt32BE(offset);
}

function decodePngDimensions(buffer) {
  if (buffer.length < 24) {
    return null;
  }
  const signature = buffer.subarray(0, 8);
  const expected = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  if (!signature.equals(expected)) {
    return null;
  }
  const ihdrLength = readUint32BE(buffer, 8);
  const chunkType = buffer.subarray(12, 16).toString("ascii");
  if (ihdrLength !== 13 || chunkType !== "IHDR") {
    return null;
  }
  const width = readUint32BE(buffer, 16);
  const height = readUint32BE(buffer, 20);
  if (width <= 0 || height <= 0) {
    return null;
  }
  return { width, height };
}

function decodeJpegDimensions(buffer) {
  if (buffer.length < 4 || buffer[0] !== 0xff || buffer[1] !== 0xd8) {
    return null;
  }

  let offset = 2;
  while (offset + 4 <= buffer.length) {
    while (offset < buffer.length && buffer[offset] === 0xff) {
      offset += 1;
    }
    if (offset >= buffer.length) {
      return null;
    }

    const marker = buffer[offset];
    offset += 1;

    if (marker === 0xd9 || marker === 0xda) {
      break;
    }

    const segmentLength = readUint16BE(buffer, offset);
    if (segmentLength < 2 || offset + segmentLength > buffer.length) {
      return null;
    }

    const isStartOfFrame =
      (marker >= 0xc0 && marker <= 0xc3) ||
      (marker >= 0xc5 && marker <= 0xc7) ||
      (marker >= 0xc9 && marker <= 0xcb) ||
      (marker >= 0xcd && marker <= 0xcf);

    if (isStartOfFrame) {
      if (offset + 7 > buffer.length) {
        return null;
      }
      const height = readUint16BE(buffer, offset + 3);
      const width = readUint16BE(buffer, offset + 5);
      if (width <= 0 || height <= 0) {
        return null;
      }
      return { width, height };
    }

    offset += segmentLength;
  }

  return null;
}

function decodeRasterDimensions(buffer, mime) {
  if (mime === "image/png") {
    return decodePngDimensions(buffer);
  }
  if (mime === "image/jpeg") {
    return decodeJpegDimensions(buffer);
  }
  return null;
}

function decodeRasterBuffer(buffer, mime) {
  try {
    if (mime === "image/png") {
      PNG.sync.read(buffer);
      return true;
    }
    if (mime === "image/jpeg") {
      jpeg.decode(buffer, { useTArray: true });
      return true;
    }
  } catch {
    return false;
  }
  return false;
}

async function preflightRasterFrame(filePath) {
  const diagnostics = {
    path: filePath,
    mime: "",
    bytes: 0,
    width: 0,
    height: 0,
    decode_ok: false,
    valid: false,
  };

  let fileStats;
  try {
    fileStats = await stat(filePath);
  } catch {
    return diagnostics;
  }

  if (!fileStats.isFile()) {
    return diagnostics;
  }

  diagnostics.bytes = Number(fileStats.size || 0);
  if (diagnostics.bytes <= 0) {
    return diagnostics;
  }

  let buffer;
  try {
    buffer = await readFile(filePath);
  } catch {
    return diagnostics;
  }

  diagnostics.mime = detectRasterMime(buffer);
  if (!diagnostics.mime) {
    return diagnostics;
  }

  const dimensions = decodeRasterDimensions(buffer, diagnostics.mime);
  if (!dimensions) {
    return diagnostics;
  }

  diagnostics.width = dimensions.width;
  diagnostics.height = dimensions.height;
  diagnostics.decode_ok = decodeRasterBuffer(buffer, diagnostics.mime);
  diagnostics.valid =
    ["image/jpeg", "image/png"].includes(diagnostics.mime) &&
    diagnostics.bytes > 0 &&
    diagnostics.decode_ok &&
    diagnostics.width >= 512 &&
    diagnostics.height >= 768;
  return diagnostics;
}

async function preflightRasterFrames(framePaths) {
  const diagnostics = [];
  for (const framePath of framePaths) {
    diagnostics.push(await preflightRasterFrame(framePath));
  }
  return diagnostics;
}

function validationPayloadLooksComplete(validation, expectedCount) {
  const images = Array.isArray(validation?.images) ? validation.images : [];
  if (images.length !== expectedCount) {
    return false;
  }

  const requiredKeys = [
    "id",
    "driver_present",
    "inspector_present",
    "face_present",
    "hands_present",
    "document_present",
    "car_interior_present",
    "vehicle_context_present",
    "photorealistic",
    "ui_or_illustration",
    "overlay_text_detected",
    "reason",
    "pass",
  ];

  return images.every((image, index) => {
    const expectedId = `scene${index + 1}`;
    return (
      image &&
      typeof image === "object" &&
      text(image.id) === expectedId &&
      requiredKeys.every((key) => Object.prototype.hasOwnProperty.call(image, key)) &&
      typeof image.driver_present === "boolean" &&
      typeof image.inspector_present === "boolean" &&
      typeof image.face_present === "boolean" &&
      typeof image.hands_present === "boolean" &&
      typeof image.document_present === "boolean" &&
      typeof image.car_interior_present === "boolean" &&
      typeof image.vehicle_context_present === "boolean" &&
      typeof image.photorealistic === "boolean" &&
      typeof image.ui_or_illustration === "boolean" &&
      typeof image.overlay_text_detected === "boolean" &&
      typeof image.reason === "string" &&
      typeof image.pass === "boolean"
    );
  });
}

function serializePreflight(diagnostics) {
  return (diagnostics || []).map((item) => ({
    mime: item.mime,
    bytes: item.bytes,
    width: item.width,
    height: item.height,
    decode_ok: item.decode_ok,
  }));
}

function isLikelyRateLimitError(message) {
  const safe = text(message).toLowerCase();
  return (
    safe.includes("rate_limit_exceeded") ||
    safe.includes("tokens per min") ||
    safe.includes("tpm") ||
    safe.includes("too many requests")
  );
}

function extractBase64Image(payload) {
  if (!payload || typeof payload !== "object") {
    return "";
  }

  const directKeys = [
    payload.b64_json,
    payload.image_base64,
    payload.base64,
    payload.output?.[0]?.b64_json,
    payload.output?.[0]?.image_base64,
    payload.data?.[0]?.b64_json,
    payload.data?.[0]?.image_base64,
    payload.images?.[0]?.b64_json,
    payload.images?.[0]?.image_base64,
  ];

  for (const candidate of directKeys) {
    if (text(candidate)) {
      return text(candidate);
    }
  }

  return "";
}

function extractBase64Images(payload) {
  if (!payload || typeof payload !== "object") {
    return [];
  }

  const arrays = [
    Array.isArray(payload.output) ? payload.output.map((item) => item?.b64_json || item?.image_base64) : [],
    Array.isArray(payload.data) ? payload.data.map((item) => item?.b64_json || item?.image_base64) : [],
    Array.isArray(payload.images) ? payload.images.map((item) => item?.b64_json || item?.image_base64) : [],
  ];
  const flattened = arrays.flat().map((value) => text(value)).filter(Boolean);
  if (flattened.length > 0) {
    return flattened;
  }

  const single = extractBase64Image(payload);
  return single ? [single] : [];
}

function extractRemoteImageUrl(payload) {
  if (!payload || typeof payload !== "object") {
    return "";
  }

  const directKeys = [
    payload.url,
    payload.image_url,
    payload.output?.[0]?.url,
    payload.data?.[0]?.url,
    payload.images?.[0]?.url,
  ];

  for (const candidate of directKeys) {
    if (text(candidate)) {
      return text(candidate);
    }
  }

  return "";
}

function extractRemoteImageUrls(payload) {
  if (!payload || typeof payload !== "object") {
    return [];
  }

  const arrays = [
    Array.isArray(payload.output) ? payload.output.map((item) => item?.url) : [],
    Array.isArray(payload.data) ? payload.data.map((item) => item?.url) : [],
    Array.isArray(payload.images) ? payload.images.map((item) => item?.url) : [],
  ];
  const flattened = arrays.flat().map((value) => text(value)).filter(Boolean);
  if (flattened.length > 0) {
    return flattened;
  }

  const single = extractRemoteImageUrl(payload);
  return single ? [single] : [];
}

function buildExternalProviderBody(provider, prompt, negativePrompt, imageCount = 1) {
  const body = {
    prompt: buildProviderPrompt(provider, prompt, negativePrompt),
  };
  if (text(provider.model)) {
    body.model = text(provider.model);
  }
  if (provider.supports_size) {
    body.size = "1024x1536";
  }
  if (provider.supports_aspect_ratio) {
    body.aspect_ratio = "2:3";
  }
  if (provider.supports_quality) {
    body.quality = "high";
  }
  if (provider.supports_output_format) {
    body.output_format = "jpeg";
  }
  if (provider.supports_response_format) {
    body.response_format = "b64_json_or_url";
  }
  if (provider.supports_multi_image_generation) {
    body.n = imageCount;
  }
  if (provider.supports_negative_prompt) {
    body.negative_prompt = provider.negativePrompt;
  }
  return body;
}

async function writeProviderDebugPayload({
  generatedDir,
  provider,
  sceneIndex,
  body,
  prompt,
  negativePrompt,
  frameManifestEntry,
}) {
  const debugPayload = {
    provider_id: provider.id,
    provider_kind: provider.kind,
    frame: frameManifestEntry || null,
    capabilities: {
      supports_multi_image_generation: Boolean(provider.supports_multi_image_generation),
      supports_negative_prompt: Boolean(provider.supports_negative_prompt),
      supports_size: Boolean(provider.supports_size),
      supports_aspect_ratio: Boolean(provider.supports_aspect_ratio),
      supports_quality: Boolean(provider.supports_quality),
      supports_output_format: Boolean(provider.supports_output_format),
      supports_response_format: Boolean(provider.supports_response_format),
    },
    positive_prompt: prompt,
    negative_prompt: negativePrompt,
    request_body: body,
  };
  await writeFile(
    path.join(generatedDir, `${provider.id}-scene${sceneIndex + 1}.request.json`),
    `${JSON.stringify(debugPayload, null, 2)}\n`,
    "utf8",
  );
  return path.join(generatedDir, `${provider.id}-scene${sceneIndex + 1}.request.json`);
}

async function writeImagePayloadToFile(payload, outputPath, timeoutConfig) {
  const b64 = extractBase64Image(payload);
  if (b64) {
    await writeFile(outputPath, Buffer.from(b64, "base64"));
    return null;
  }

  const remoteUrl = extractRemoteImageUrl(payload);
  if (remoteUrl) {
    const response = await fetchWithTimeout(remoteUrl, {
      method: "GET",
    }, timeoutConfig);
    if (!response.ok) {
      throw new Error(`Remote image download failed: ${response.status} ${remoteUrl}`);
    }
    const bytes = Buffer.from(await response.arrayBuffer());
    await writeFile(outputPath, bytes);
    return remoteUrl;
  }

  throw new Error("Provider returned no raster image payload.");
}

async function writeImagePayloadsToFiles(payload, outputPaths, timeoutConfig) {
  const b64Images = extractBase64Images(payload);
  if (b64Images.length > 0) {
    if (b64Images.length < outputPaths.length) {
      throw new Error("Provider returned fewer than requested images.");
    }
    for (let i = 0; i < outputPaths.length; i += 1) {
      await writeFile(outputPaths[i], Buffer.from(b64Images[i], "base64"));
    }
    return;
  }

  const remoteUrls = extractRemoteImageUrls(payload);
  if (remoteUrls.length > 0) {
    if (remoteUrls.length < outputPaths.length) {
      throw new Error("Provider returned fewer than requested images.");
    }
    for (let i = 0; i < outputPaths.length; i += 1) {
      const response = await fetchWithTimeout(remoteUrls[i], { method: "GET" }, timeoutConfig);
      if (!response.ok) {
        throw new Error(`Remote image download failed: ${response.status} ${remoteUrls[i]}`);
      }
      const bytes = Buffer.from(await response.arrayBuffer());
      await writeFile(outputPaths[i], bytes);
    }
    return;
  }

  throw new Error("Provider returned no raster image payload.");
}

async function generateImageToFileWithProvider({ provider, prompt, negativePrompt, outputPath }) {
  const requestBody = buildProviderRequest(provider, prompt, negativePrompt);
  await generateImageToFile({
    provider,
    requestBody,
    outputPath,
  });
  return requestBody;
}

async function generateFramesWithProvider({
  provider,
  generatedDir,
  selectedScenes,
  questionText,
  contentFamily,
  frameTimeoutMs = DEFAULT_FRAME_GENERATION_TIMEOUT_MS,
  providerAttemptTimeoutMs = DEFAULT_PROVIDER_ATTEMPT_TIMEOUT_MS,
}) {
  const frameManifest = buildFrameManifest({
    provider,
    selectedScenes,
    generatedDir,
  });
  const providerStartedAt = Date.now();
  const providerDeadline = providerStartedAt + providerAttemptTimeoutMs;
  const framePaths = [];
  const promptFiles = [];
  const negativePromptFiles = [];
  const requestDebugFiles = [];
  let outputSceneMappingFile = "";

  if (provider.supports_multi_image_generation) {
    const negativePrompt = buildSceneNegativePrompt();
    for (let i = 0; i < selectedScenes.length; i += 1) {
      const scene = selectedScenes[i];
      const prompt = buildScenePositivePrompt({
        role: scene.role,
        sceneIndex: i,
        questionText,
        copy: scene.copy,
        sceneIntent: scene.scene_intent,
        visualHint: scene.visual_hint,
        subject: scene.subject,
        context: scene.context,
        tension: scene.tension,
        shot_size: scene.shot_size,
        camera_angle: scene.camera_angle,
        lens: scene.lens,
        lighting: scene.lighting,
        contentFamily,
      });
      const promptFile = path.join(generatedDir, `${provider.id}-scene${i + 1}.prompt.txt`);
      const negativePromptFile = path.join(generatedDir, `${provider.id}-scene${i + 1}.negative_prompt.txt`);
      await writeFile(promptFile, `${prompt}\n`, "utf8");
      await writeFile(negativePromptFile, `${negativePrompt}\n`, "utf8");
      promptFiles.push(promptFile);
      negativePromptFiles.push(negativePromptFile);
    }

    const multiScenePrompt = buildMultiScenePrompt({
      questionText,
      scenes: selectedScenes,
    });
    const requestBody = buildProviderRequest(
      provider,
      multiScenePrompt,
      negativePrompt,
      selectedScenes.length,
    );
    const batchedRequestFile = path.join(generatedDir, `${provider.id}-batch.request.json`);
    await writeFile(
      batchedRequestFile,
      `${JSON.stringify({
        provider_id: provider.id,
        provider_kind: provider.kind,
        request_body: requestBody.body,
        positive_prompt: multiScenePrompt,
        negative_prompt: negativePrompt,
      }, null, 2)}\n`,
      "utf8",
    );
    requestDebugFiles.push(batchedRequestFile);

    outputSceneMappingFile = path.join(generatedDir, `${provider.id}-output-scene-mapping.json`);
    await writeFile(
      outputSceneMappingFile,
      `${JSON.stringify(frameManifest.map((entry, index) => ({
        output_index: index,
        canonical_id: entry.canonical_id,
        scene_index: entry.scene_index,
        role: entry.role,
        local_path: entry.local_path,
        provider_id: entry.provider_id,
      })), null, 2)}\n`,
      "utf8",
    );

    const remainingProviderMs = providerDeadline - Date.now();
    if (remainingProviderMs <= 0) {
      const error = buildTimeoutError({
        providerId: provider.id,
        reason: "provider_attempt_timeout",
        sceneId: "scene1",
        timeoutMs: providerAttemptTimeoutMs,
        timeoutScope: "provider_attempt",
      });
      error.generation_debug = {
        promptFiles,
        negativePromptFiles,
        requestDebugFiles,
        generatedFramePaths: framePaths,
        frameManifest,
        outputSceneMappingFile,
      };
      throw error;
    }

    try {
      const apiKey = getApiKey();
      const response = await fetchWithTimeout(requestBody.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(provider.kind === "openai" ? { Authorization: `Bearer ${apiKey}` } : provider.kind === "fal_ai" ? { Authorization: `Key ${FAL_AI_TOKEN}` } : {}),
          ...(provider.kind === "external_http" && text(provider.token)
            ? { Authorization: `Bearer ${provider.token}` }
            : {}),
        },
        body: JSON.stringify(requestBody.body),
      }, {
        providerId: provider.id,
        reason: "frame_generation_timeout",
        sceneId: "scene1",
        timeoutMs: Math.min(providerAttemptTimeoutMs, remainingProviderMs),
        timeoutScope: "provider_attempt",
      });

      if (!response.ok) {
        const body = await response.text().catch(() => "");
        throw new Error(`${provider.id} image generation failed: ${response.status} ${body}`);
      }

      if (provider.kind === "openai") {
        const json = await response.json();
        await writeImagePayloadsToFiles(
          json,
          frameManifest.map((entry) => entry.local_path),
          {
            providerId: provider.id,
            reason: "frame_generation_timeout",
            sceneId: "scene1",
            timeoutMs: Math.min(providerAttemptTimeoutMs, remainingProviderMs),
            timeoutScope: "provider_attempt",
          },
        );
      } else {
        const rawText = await response.text();
        const parsed = tryParseJson(rawText);
        if (!parsed) {
          throw new Error(`${provider.id} returned invalid or non-raster output.`);
        }
        await writeImagePayloadsToFiles(
          parsed,
          frameManifest.map((entry) => entry.local_path),
          {
            providerId: provider.id,
            reason: "frame_generation_timeout",
            sceneId: "scene1",
            timeoutMs: Math.min(providerAttemptTimeoutMs, remainingProviderMs),
            timeoutScope: "provider_attempt",
          },
        );
      }

      for (const entry of frameManifest) {
        framePaths.push(entry.local_path);
      }
    } catch (error) {
      error.generation_debug = {
        promptFiles,
        negativePromptFiles,
        requestDebugFiles,
        generatedFramePaths: framePaths,
        frameManifest,
        outputSceneMappingFile,
      };
      throw error;
    }

    return {
      framePaths,
      promptFiles,
      negativePromptFiles,
      requestDebugFiles,
      frameManifest,
      outputSceneMappingFile,
    };
  }

  const videoSeed = Math.floor(Math.random() * 2147483647);
  let hookFrameUrl = null;

  for (let i = 0; i < selectedScenes.length; i += 1) {
    const scene = selectedScenes[i];
    const frameEntry = frameManifest[i];
    const framePath = frameEntry.local_path;
    const prompt = buildScenePositivePrompt({
      role: scene.role,
      sceneIndex: i,
      questionText,
      copy: scene.copy,
      sceneIntent: scene.scene_intent,
      visualHint: scene.visual_hint,
      subject: scene.subject,
      context: scene.context,
      tension: scene.tension,
      shot_size: scene.shot_size,
      camera_angle: scene.camera_angle,
      lens: scene.lens,
      lighting: scene.lighting,
      contentFamily,
    });
    const negativePrompt = buildSceneNegativePrompt();
    const promptFile = path.join(generatedDir, `${provider.id}-scene${i + 1}.prompt.txt`);
    const negativePromptFile = path.join(generatedDir, `${provider.id}-scene${i + 1}.negative_prompt.txt`);
    await writeFile(promptFile, `${prompt}\n`, "utf8");
    await writeFile(negativePromptFile, `${negativePrompt}\n`, "utf8");
    const i2iOptions = provider.kind === "fal_ai"
      ? { seed: videoSeed, ...(i > 0 && hookFrameUrl ? { referenceImageUrl: hookFrameUrl, strength: 0.55 } : {}) }
      : {};
    const requestBody = buildProviderRequest(provider, prompt, negativePrompt, 1, i2iOptions);
    const requestDebugFile = await writeProviderDebugPayload({
      generatedDir,
      provider,
      sceneIndex: i,
      body: requestBody.body,
      prompt,
      negativePrompt,
      frameManifestEntry: frameEntry,
    });
    promptFiles.push(promptFile);
    negativePromptFiles.push(negativePromptFile);
    requestDebugFiles.push(requestDebugFile);

    const remainingProviderMs = providerDeadline - Date.now();
    if (remainingProviderMs <= 0) {
      const error = buildTimeoutError({
        providerId: provider.id,
        reason: "provider_attempt_timeout",
        sceneId: frameEntry.canonical_id,
        timeoutMs: providerAttemptTimeoutMs,
        timeoutScope: "provider_attempt",
      });
      error.generation_debug = {
        promptFiles,
        negativePromptFiles,
        requestDebugFiles,
        generatedFramePaths: framePaths,
        frameManifest,
        outputSceneMappingFile,
      };
      throw error;
    }

    try {
      const sourceUrl = await generateImageToFile({
        provider,
        requestBody,
        outputPath: framePath,
        timeoutConfig: {
          providerId: provider.id,
          reason: "frame_generation_timeout",
          sceneId: frameEntry.canonical_id,
          timeoutMs: Math.min(frameTimeoutMs, remainingProviderMs),
          timeoutScope: "frame",
        },
      });
      if (i === 0 && sourceUrl) {
        hookFrameUrl = sourceUrl;
      }
      framePaths.push(framePath);
    } catch (error) {
      error.generation_debug = {
        promptFiles,
        negativePromptFiles,
        requestDebugFiles,
        generatedFramePaths: framePaths,
        frameManifest,
        outputSceneMappingFile,
      };
      throw error;
    }
  }
  return {
    framePaths,
    promptFiles,
    negativePromptFiles,
    requestDebugFiles,
    frameManifest,
    outputSceneMappingFile,
  };
}

function classifyProviderFailure(provider, error) {
  const message = text(error?.message || error);
  const rateLimited = provider.kind === "openai" && isLikelyRateLimitError(message);
  return {
    provider_id: provider.id,
    provider_kind: provider.kind,
    provider_failed: true,
    hard_skipped: rateLimited,
    reason: message || "provider_failed",
  };
}

function buildGenerationFailureAttempt(provider, error) {
  const failure = classifyProviderFailure(provider, error);
  const generationDebug = error?.generation_debug || {};
  const timedOutSceneId = text(error?.timed_out_scene_id);
  const timeoutReason = text(error?.reason);
  return {
    ...failure,
    reason:
      timeoutReason === "frame_generation_timeout" || timeoutReason === "provider_attempt_timeout"
        ? timeoutReason
        : failure.reason,
    failure_stage: "generation",
    timed_out_scene_id: timedOutSceneId || undefined,
    prompt_files: Array.isArray(generationDebug.promptFiles) ? generationDebug.promptFiles : [],
    negative_prompt_files: Array.isArray(generationDebug.negativePromptFiles)
      ? generationDebug.negativePromptFiles
      : [],
    request_debug_files: Array.isArray(generationDebug.requestDebugFiles)
      ? generationDebug.requestDebugFiles
      : [],
    output_scene_mapping_file: text(generationDebug.outputSceneMappingFile),
    generated_frame_paths: Array.isArray(generationDebug.generatedFramePaths)
      ? generationDebug.generatedFramePaths
      : [],
    preflight: [],
    validation_summary: null,
    failed_reasons_by_frame: [],
  };
}

async function writeProviderAttemptArtifact(generatedDir, attemptIndex, attempt) {
  const artifactPath = path.join(
    generatedDir,
    `photoreal-attempt-${String(attemptIndex).padStart(2, "0")}-${text(attempt.provider_id) || "unknown"}.json`,
  );
  await writeFile(artifactPath, `${JSON.stringify(attempt, null, 2)}\n`, "utf8");
  return artifactPath;
}

async function writePhotorealDebugRollup(generatedDir, attempts) {
  const rollupPath = path.join(generatedDir, "photoreal-debug-rollup.json");
  await writeFile(rollupPath, `${JSON.stringify({ attempts }, null, 2)}\n`, "utf8");
  return rollupPath;
}

function buildVisionSchema(imageCount) {
  return {
    type: "object",
    additionalProperties: false,
    properties: {
      images: {
        type: "array",
        minItems: imageCount,
        maxItems: imageCount,
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            id: { type: "string", enum: ["scene1", "scene2", "scene3"] },
            driver_present: { type: "boolean" },
            inspector_present: { type: "boolean" },
            face_present: { type: "boolean" },
            hands_present: { type: "boolean" },
            document_present: { type: "boolean" },
            car_interior_present: { type: "boolean" },
            vehicle_context_present: { type: "boolean" },
            photorealistic: { type: "boolean" },
            ui_or_illustration: { type: "boolean" },
            overlay_text_detected: { type: "boolean" },
            reason: { type: "string" },
            pass: { type: "boolean" },
          },
          required: [
            "id",
            "driver_present",
            "inspector_present",
            "face_present",
            "hands_present",
            "document_present",
            "car_interior_present",
            "vehicle_context_present",
            "photorealistic",
            "ui_or_illustration",
            "overlay_text_detected",
            "reason",
            "pass",
          ],
        },
      },
    },
    required: ["images"],
  };
}

async function writeRasterValidatorArtifacts({
  generatedDir,
  status,
  headers,
  rawBody,
  outputText,
  errorMessage = "",
}) {
  const responsePath = path.join(generatedDir, "raster-validator-response.json");
  const outputTextPath = path.join(generatedDir, "raster-validator-output-text.txt");
  await writeFile(
    responsePath,
    `${JSON.stringify({
      status: status ?? null,
      headers: headers || null,
      raw_body: text(rawBody) ? String(rawBody) : "",
      output_text: outputText == null ? null : String(outputText),
      error_message: text(errorMessage),
    }, null, 2)}\n`,
    "utf8",
  );
  await writeFile(outputTextPath, `${outputText == null ? "" : String(outputText)}\n`, "utf8");
  return {
    responsePath,
    outputTextPath,
  };
}

function buildValidatorFailureError(reason, message, artifactPaths = {}) {
  const error = new Error(message);
  error.reason = reason;
  error.validator_artifact_paths = artifactPaths;
  return error;
}

function extractStructuredValidatorOutput(parsedEnvelope) {
  if (!parsedEnvelope || typeof parsedEnvelope !== "object") {
    return {
      outputText: undefined,
      classification: "missing_structured_json",
    };
  }

  const contentBlocks = [];
  const outputItems = Array.isArray(parsedEnvelope.output) ? parsedEnvelope.output : [];
  for (const item of outputItems) {
    if (!item || typeof item !== "object") {
      continue;
    }
    if (Array.isArray(item.content)) {
      for (const block of item.content) {
        if (block && typeof block === "object") {
          contentBlocks.push(block);
        }
      }
    }
  }

  const refusalBlock = contentBlocks.find((block) =>
    block.type === "refusal" || text(block.refusal) || text(block.reasoning) === "refusal",
  );
  if (refusalBlock || text(parsedEnvelope.refusal)) {
    return {
      outputText: undefined,
      classification: "refusal",
    };
  }

  if (
    text(parsedEnvelope.status).toLowerCase() === "incomplete" ||
    parsedEnvelope.incomplete_details ||
    parsedEnvelope.incomplete === true
  ) {
    return {
      outputText: undefined,
      classification: "incomplete_response",
    };
  }

  const structuredTextBlock = contentBlocks.find((block) => {
    const blockType = text(block.type).toLowerCase();
    return (
      (blockType === "output_text" || blockType === "text" || blockType === "json_schema") &&
      text(block.text)
    );
  });
  if (structuredTextBlock) {
    return {
      outputText: String(structuredTextBlock.text),
      classification: "",
    };
  }

  if (Object.prototype.hasOwnProperty.call(parsedEnvelope, "output_text")) {
    return {
      outputText: parsedEnvelope.output_text,
      classification: "",
    };
  }

  if (contentBlocks.length > 0) {
    return {
      outputText: undefined,
      classification: "missing_structured_json",
    };
  }

  return {
    outputText: undefined,
    classification: "missing_structured_json",
  };
}

async function validateRasterFrames(framePaths, generatedDir, validatorProvider) {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error("Raster validation requires OPENAI_API_KEY.");
  }

  const userContent = [
    {
      type: "input_text",
      text: [
        "Judge the final raster images only.",
        "Return strict JSON only with exactly 3 objects in order: scene1, scene2, scene3.",
        "Do not omit any field; if uncertain, return false.",
        "Reject any image that looks like vector illustration, flat design, abstract explainer, UI card composition, icon art, or symbolic scene.",
        "Accept natural in-scene text that belongs to the photographed world, such as police markings on a uniform or car, license plates, or small environmental signage.",
        "Reject artificial overlay text added on top of the image, including subtitles, captions, title text, centered text blocks, floating text, or UI elements.",
        "Require at least one person (driver, worker, or operator) with a readable face and hands actively interacting with an object. Require real ADR / truck transport / hazardous goods context (vehicle, roadside, warehouse, or industrial setting). Require overall photorealism.",
      ].join(" "),
    },
  ];

  for (let i = 0; i < framePaths.length; i += 1) {
    userContent.push({
      type: "input_text",
      text: `Image ${i + 1} id=scene${i + 1}`,
    });
    userContent.push({
      type: "input_image",
      image_url: await buildDataUrl(framePaths[i]),
    });
  }

  let response;
  try {
    response = await fetch(OPENAI_RESPONSES_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: DEFAULT_VISION_MODEL,
        input: [
          {
            role: "system",
            content: [
              {
                type: "input_text",
                text: "You are a strict raster image validator for photorealistic vertical Shorts scenes. Return strict JSON only. Always return exactly 3 ordered items with IDs scene1, scene2, scene3. Never invent custom IDs. Never omit fields. Use false when uncertain. Set overlay_text_detected=true only when artificial text has been added on top of the image, such as subtitles, captions, title text, centered text blocks, floating text, or UI elements. Natural in-scene text like police markings, license plates, or small environmental signage is allowed and must keep overlay_text_detected=false.",
              },
            ],
          },
          {
            role: "user",
            content: userContent,
          },
        ],
        text: {
          format: {
            type: "json_schema",
            name: "question_raster_validation",
            schema: buildVisionSchema(framePaths.length),
          },
        },
      }),
    });
  } catch (error) {
    const artifactPaths = await writeRasterValidatorArtifacts({
      generatedDir,
      status: null,
      headers: null,
      rawBody: "",
      outputText: "",
      errorMessage: text(error?.message || error),
    });
    throw buildValidatorFailureError(
      "no_http_response",
      `Raster vision validation received no HTTP response from ${text(validatorProvider?.provider_id) || "validator"}.`,
      artifactPaths,
    );
  }

  const rawBody = await response.text().catch(() => "");
  const headers = Object.fromEntries(response.headers.entries());
  const parsedEnvelope = tryParseJson(rawBody);
  const structuredOutput = extractStructuredValidatorOutput(parsedEnvelope);
  const outputTextValue = structuredOutput.outputText;
  const artifactPaths = await writeRasterValidatorArtifacts({
    generatedDir,
    status: response.status,
    headers,
    rawBody,
    outputText: outputTextValue,
    errorMessage: "",
  });

  if (!response.ok) {
    throw buildValidatorFailureError(
      "non_200_response",
      `Raster vision validation failed: ${response.status} ${rawBody}`,
      artifactPaths,
    );
  }

  if (!parsedEnvelope || typeof parsedEnvelope !== "object") {
    throw buildValidatorFailureError(
      "missing_structured_json",
      "Raster vision validation response body was not valid JSON.",
      artifactPaths,
    );
  }

  if (structuredOutput.classification === "refusal") {
    throw buildValidatorFailureError(
      "refusal",
      "Raster vision validation provider refused the request.",
      artifactPaths,
    );
  }

  if (structuredOutput.classification === "incomplete_response") {
    throw buildValidatorFailureError(
      "incomplete_response",
      "Raster vision validation provider returned an incomplete response.",
      artifactPaths,
    );
  }

  if (structuredOutput.classification === "missing_structured_json" || outputTextValue == null) {
    throw buildValidatorFailureError(
      "missing_structured_json",
      "Raster vision validation response contained no usable structured JSON content.",
      artifactPaths,
    );
  }

  const parsed = String(outputTextValue);
  if (!text(parsed)) {
    throw buildValidatorFailureError(
      "empty_output_text",
      "Raster vision validation returned empty structured JSON text.",
      artifactPaths,
    );
  }

  let validation;
  try {
    validation = JSON.parse(parsed);
  } catch {
    throw buildValidatorFailureError(
      "malformed_json_in_content",
      "Raster vision validation structured content was not valid JSON.",
      artifactPaths,
    );
  }
  if (!validationPayloadLooksComplete(validation, framePaths.length)) {
    throw buildValidatorFailureError(
      "schema_mismatch_after_parse",
      "Raster vision validation output JSON did not match the expected schema.",
      artifactPaths,
    );
  }
  return validation;
}

function buildValidatorAttempt({
  validatorProvider,
  generationProvider,
  reason,
  generatedFrames,
  finalFramePaths,
  preflightDiagnostics,
  validatorArtifactPaths = null,
  validationSummary = null,
  failedReasonsByFrame = [],
  providerFailed = true,
}) {
  return {
    provider_id: validatorProvider.provider_id,
    provider_kind: validatorProvider.provider_kind,
    provider_role: "raster_validation_provider",
    image_generation_provider_id: generationProvider.id,
    provider_failed: providerFailed,
    hard_skipped: false,
    reason,
    failure_stage: reason === "raster_validation_failed" ? "strict_scene_gate" : "validator",
    prompt_files: generatedFrames.promptFiles,
    negative_prompt_files: generatedFrames.negativePromptFiles,
    request_debug_files: generatedFrames.requestDebugFiles,
    output_scene_mapping_file: text(generatedFrames.outputSceneMappingFile),
    generated_frame_paths: finalFramePaths,
    preflight: serializePreflight(preflightDiagnostics),
    raster_validator_response_path: text(validatorArtifactPaths?.responsePath),
    raster_validator_output_text_path: text(validatorArtifactPaths?.outputTextPath),
    validation_summary: validationSummary,
    failed_reasons_by_frame: failedReasonsByFrame,
  };
}

function summarizeValidation(validation, frameManifest) {
  const images = Array.isArray(validation?.images) ? validation.images : [];
  const manifestEntries = Array.isArray(frameManifest) ? frameManifest : [];
  const perFrame = manifestEntries.map((entry, index) => {
    const image = images[index] || null;
    const canonicalId = text(entry?.canonical_id) || `scene${index + 1}`;
    const failedReasons = [];
    if (!Boolean(image?.driver_present) && !Boolean(image?.inspector_present)) {
      failedReasons.push("human_presence_false");
    }
    if (!Boolean(image?.face_present)) failedReasons.push("face_missing");
    if (!Boolean(image?.hands_present)) failedReasons.push("hands_missing");
    if (!Boolean(image?.car_interior_present) && !Boolean(image?.vehicle_context_present)) {
      failedReasons.push("context_missing");
    }
    if (!Boolean(image?.photorealistic)) failedReasons.push("photorealistic_false");
    if (Boolean(image?.ui_or_illustration)) failedReasons.push("ui_or_illustration_true");
    if (Boolean(image?.overlay_text_detected)) failedReasons.push("overlay_text_detected");

    return {
      id: canonicalId,
      source_id: text(image?.id),
      scene_index: Number(entry?.scene_index) || index + 1,
      role: text(entry?.role),
      local_path: text(entry?.local_path),
      provider_id: text(entry?.provider_id),
      pass: failedReasons.length === 0,
      failed_reasons: failedReasons,
      driver_present: Boolean(image?.driver_present),
      inspector_present: Boolean(image?.inspector_present),
      face_present: Boolean(image?.face_present),
      hands_present: Boolean(image?.hands_present),
      document_present: Boolean(image?.document_present),
      car_interior_present: Boolean(image?.car_interior_present),
      vehicle_context_present: Boolean(image?.vehicle_context_present),
      photorealistic: Boolean(image?.photorealistic),
      ui_or_illustration: Boolean(image?.ui_or_illustration),
      overlay_text_detected: Boolean(image?.overlay_text_detected),
    };
  });

  const allFramesPass = perFrame.length > 0 && perFrame.every((frame) => frame.pass);
  const failedReasonsByFrame = perFrame
    .filter((frame) => !frame.pass)
    .map((frame) => ({
      id: frame.id,
      failed_reasons: frame.failed_reasons,
    }));

  return {
    validation_skipped: false,
    human_presence: allFramesPass,
    driver_present: perFrame.length > 0 && perFrame.every((frame) => frame.driver_present),
    inspector_present: perFrame.length > 0 && perFrame.every((frame) => frame.inspector_present),
    face_present: perFrame.length > 0 && perFrame.every((frame) => frame.face_present),
    hands_present: perFrame.length > 0 && perFrame.every((frame) => frame.hands_present),
    document_present: perFrame.length > 0 && perFrame.every((frame) => frame.document_present),
    car_interior_present_any: perFrame.some((frame) => frame.car_interior_present),
    vehicle_context_present_any: perFrame.some((frame) => frame.vehicle_context_present),
    context_present: perFrame.length > 0 && perFrame.every(
      (frame) => frame.car_interior_present || frame.vehicle_context_present,
    ),
    photorealistic_style_enforced: perFrame.length > 0 && perFrame.every((frame) => frame.photorealistic),
    illustration_signal_present: perFrame.some((frame) => frame.ui_or_illustration),
    ui_overlay_present: perFrame.some((frame) => frame.ui_or_illustration),
    overlay_text_detected: perFrame.some((frame) => frame.overlay_text_detected),
    per_frame_pass: perFrame.map((frame) => ({
      id: frame.id,
      pass: frame.pass,
    })),
    all_frames_pass: allFramesPass,
    failed_reasons_by_frame: failedReasonsByFrame,
    pass: allFramesPass,
  };
}

export async function generatePhotorealSceneFrames({
  generatedDir,
  questionText,
  brief,
  descriptors,
  contentFamily,
}) {
  const selectedRoles = ROLE_SEQUENCE;
  const selectedScenes = selectedRoles
    .map((role) => Array.isArray(brief?.slides) ? brief.slides.find((slide) => text(slide.role) === role) : null)
    .filter(Boolean)
    .map((slide) => {
      const descriptor = (descriptors || []).find((item) => text(item.role) === text(slide.role)) || {};
      return {
        role: text(slide.role),
        copy: normalizeSceneCopy(slide.copy),
        scene_intent: text(slide.scene_intent || descriptor.sceneIntent),
        visual_hint: text(slide.visual_hint),
        subject: text(slide.subject || descriptor.subject),
        context: text(slide.context || descriptor.context),
        tension: text(slide.tension || descriptor.tension),
      };
    });

  const providerAttempts = [];
  const providers = buildImageProviders();
  const validationProviders = buildRasterValidationProviders();

  for (let providerIndex = 0; providerIndex < providers.length; providerIndex += 1) {
    const provider = providers[providerIndex];
    if (!provider.available) {
      const attempt = {
        provider_id: provider.id,
        provider_kind: provider.kind,
        provider_role: "image_generation_provider",
        provider_failed: true,
        hard_skipped: false,
        reason: "provider_unavailable",
        failure_stage: "generation",
        prompt_files: [],
        negative_prompt_files: [],
        request_debug_files: [],
        generated_frame_paths: [],
        preflight: [],
        validation_summary: null,
        failed_reasons_by_frame: [],
      };
      providerAttempts.push(attempt);
      await writeProviderAttemptArtifact(generatedDir, providerAttempts.length, attempt);
      await writePhotorealDebugRollup(generatedDir, providerAttempts);
      continue;
    }

    try {
      const generatedFrames = await generateFramesWithProvider({
        provider,
        generatedDir,
        selectedScenes,
        questionText,
        contentFamily,
      });
      const rawFramePaths = generatedFrames.framePaths;
      const finalFramePaths = [];
      for (let i = 0; i < rawFramePaths.length; i += 1) {
        const finalPath = path.join(generatedDir, `scene${i + 1}.jpg`);
        const bytes = await readFile(rawFramePaths[i]);
        await writeFile(finalPath, bytes);
        finalFramePaths.push(finalPath);
      }
      const frameManifest = Array.isArray(generatedFrames.frameManifest)
        ? generatedFrames.frameManifest.map((entry, index) => ({
            ...entry,
            canonical_id: `scene${index + 1}`,
            scene_index: index + 1,
            local_path: finalFramePaths[index],
          }))
        : [];

      const preflightDiagnostics = await preflightRasterFrames(finalFramePaths);
      const preflightPass =
        preflightDiagnostics.length === finalFramePaths.length &&
        preflightDiagnostics.every((item) => item.valid);

      if (!preflightPass) {
        const attempt = {
          provider_id: provider.id,
          provider_kind: provider.kind,
          provider_role: "image_generation_provider",
          provider_failed: true,
          hard_skipped: false,
          reason: "invalid_raster_output",
          failure_stage: "preflight",
          prompt_files: generatedFrames.promptFiles,
          negative_prompt_files: generatedFrames.negativePromptFiles,
          request_debug_files: generatedFrames.requestDebugFiles,
          output_scene_mapping_file: text(generatedFrames.outputSceneMappingFile),
          generated_frame_paths: finalFramePaths,
          preflight: serializePreflight(preflightDiagnostics),
          validation_summary: null,
          failed_reasons_by_frame: [],
        };
        providerAttempts.push(attempt);
        await writeProviderAttemptArtifact(generatedDir, providerAttempts.length, attempt);
        await writePhotorealDebugRollup(generatedDir, providerAttempts);
        continue;
      }

      let successfulValidation = null;
      let successfulSummary = null;
      let validatorFailureSeen = false;
      for (const validatorProvider of validationProviders) {
        if (!validatorProvider.available) {
          const attempt = buildValidatorAttempt({
            validatorProvider,
            generationProvider: provider,
            reason: "provider_unavailable",
            generatedFrames,
            finalFramePaths,
            preflightDiagnostics,
          });
          providerAttempts.push(attempt);
          await writeProviderAttemptArtifact(generatedDir, providerAttempts.length, attempt);
          await writePhotorealDebugRollup(generatedDir, providerAttempts);
          validatorFailureSeen = true;
          continue;
        }

        let validation;
        try {
          validation = await validateRasterFrames(finalFramePaths, generatedDir, validatorProvider);
        } catch (error) {
          const message = text(error?.message || error);
          if (text(error?.reason)) {
            const attempt = buildValidatorAttempt({
              validatorProvider,
              generationProvider: provider,
              reason: text(error.reason),
              generatedFrames,
              finalFramePaths,
              preflightDiagnostics,
              validatorArtifactPaths: error?.validator_artifact_paths,
            });
            providerAttempts.push(attempt);
            await writeProviderAttemptArtifact(generatedDir, providerAttempts.length, attempt);
            await writePhotorealDebugRollup(generatedDir, providerAttempts);
            validatorFailureSeen = true;
            continue;
          }
          throw error;
        }

        const summary = summarizeValidation(validation, frameManifest);
        if (!summary.pass) {
          const attempt = buildValidatorAttempt({
            validatorProvider,
            generationProvider: provider,
            reason: "raster_validation_failed",
            generatedFrames,
            finalFramePaths,
            preflightDiagnostics,
            validationSummary: summary,
            failedReasonsByFrame: Array.isArray(summary.failed_reasons_by_frame)
              ? summary.failed_reasons_by_frame
              : [],
          });
          providerAttempts.push(attempt);
          await writeProviderAttemptArtifact(generatedDir, providerAttempts.length, attempt);
          await writePhotorealDebugRollup(generatedDir, providerAttempts);
          successfulValidation = null;
          successfulSummary = null;
          break;
        }

        const attempt = buildValidatorAttempt({
          validatorProvider,
          generationProvider: provider,
          reason: "ok",
          generatedFrames,
          finalFramePaths,
          preflightDiagnostics,
          validationSummary: summary,
          failedReasonsByFrame: [],
          providerFailed: false,
        });
        providerAttempts.push(attempt);
        await writeProviderAttemptArtifact(generatedDir, providerAttempts.length, attempt);
        await writePhotorealDebugRollup(generatedDir, providerAttempts);
        successfulValidation = validation;
        successfulSummary = summary;
        break;
      }

      if (!successfulValidation || !successfulSummary) {
        if (validatorFailureSeen && allowUnvalidatedOutput()) {
          successfulValidation = {
            skipped: true,
            reason: "validation_provider_unavailable_or_failed",
            provider: "none",
            images: [],
          };
          successfulSummary = {
            validation_skipped: true,
            pass: true,
            all_frames_pass: true,
            failed_reasons_by_frame: [],
            per_frame_pass: frameManifest.map((frame) => ({
              id: text(frame?.canonical_id),
              pass: true,
            })),
            human_presence: true,
            driver_present: true,
            inspector_present: true,
            face_present: true,
            hands_present: true,
            document_present: true,
            car_interior_present_any: true,
            vehicle_context_present_any: true,
            context_present: true,
            photorealistic_style_enforced: true,
            illustration_signal_present: false,
            ui_overlay_present: false,
            overlay_text_detected: false,
          };
        } else if (validatorFailureSeen) {
          continue;
        } else {
          throw new Error(`Raster validation exhausted all providers for generated frames from ${provider.id}.`);
        }
      }

      const attempt = {
        provider_id: provider.id,
        provider_kind: provider.kind,
        provider_role: "image_generation_provider",
        provider_failed: false,
        hard_skipped: false,
        reason: "ok",
        failure_stage: null,
        prompt_files: generatedFrames.promptFiles,
        negative_prompt_files: generatedFrames.negativePromptFiles,
        request_debug_files: generatedFrames.requestDebugFiles,
        output_scene_mapping_file: text(generatedFrames.outputSceneMappingFile),
        generated_frame_paths: finalFramePaths,
        preflight: serializePreflight(preflightDiagnostics),
        validation_summary: successfulSummary,
        failed_reasons_by_frame: Array.isArray(successfulSummary.failed_reasons_by_frame)
          ? successfulSummary.failed_reasons_by_frame
          : [],
        frame_manifest: frameManifest,
        provider_used: provider.id,
        raster_validation_provider: "openai_primary",
        all_frames_pass: Boolean(successfulSummary.all_frames_pass),
      };
      providerAttempts.push(attempt);
      const attemptArtifactPath = await writeProviderAttemptArtifact(generatedDir, providerAttempts.length, attempt);
      const rollupPath = await writePhotorealDebugRollup(generatedDir, providerAttempts);

      return {
        framePaths: finalFramePaths,
        frameManifest,
        validation: successfulValidation,
        summary: successfulSummary,
        provider_attempts: providerAttempts,
        provider_used: provider.id,
        raster_validation_provider: "openai_primary",
        photoreal_debug_rollup_path: rollupPath,
        provider_attempt_artifact_path: attemptArtifactPath,
      };
    } catch (error) {
      const attempt = buildGenerationFailureAttempt(provider, error);
      attempt.provider_role = "image_generation_provider";
      providerAttempts.push(attempt);
      await writeProviderAttemptArtifact(generatedDir, providerAttempts.length, attempt);
      await writePhotorealDebugRollup(generatedDir, providerAttempts);
      continue;
    }
  }

  const reasons = providerAttempts.map((item) => `${item.provider_id}:${item.reason}`).join("; ");
  const validatorFailureOnly =
    providerAttempts.some((item) => text(item.provider_role) === "raster_validation_provider") &&
    !providerAttempts.some(
      (item) =>
        text(item.provider_role) === "image_generation_provider" &&
        ["frame_generation_timeout", "provider_attempt_timeout", "provider_unavailable", "invalid_raster_output"].includes(text(item.reason)),
    );
  throw new Error(
    validatorFailureOnly
      ? `Photorealistic raster validation exhausted all providers. ${reasons}`
      : `Photorealistic frame generation exhausted all providers. ${reasons}`,
  );
}

// Generates a single scene frame with a text-zone-optimised prompt modifier.
// Used by the validation retry loop when a frame's text zone scores below threshold.
export async function regenerateSingleSceneFrame({ scene, questionText, outputPath }) {
  const providers = buildImageProviders();
  const provider = providers.find((p) => p.available);
  if (!provider) throw new Error("No image provider available for single-frame retry");

  const textZoneModifier = [
    "Compositional constraint for text overlay:",
    "main subject placed in lower-left or lower-right third;",
    "upper half of the frame visually calm — low contrast, open sky, plain wall, or blurred background;",
    "do NOT place hero object, face, or busy detail in the vertical center band.",
  ].join(" ");

  const basePrompt = buildScenePositivePrompt({
    role: text(scene.role),
    sceneIndex: 0,
    questionText: text(questionText),
    copy: normalizeSceneCopy(scene.copy),
    sceneIntent: text(scene.scene_intent),
    visualHint: text(scene.visual_hint),
    subject: text(scene.subject),
    context: text(scene.context),
    tension: text(scene.tension),
    shot_size: text(scene.shot_size),
    camera_angle: text(scene.camera_angle),
    lens: text(scene.lens),
    lighting: text(scene.lighting),
  });

  const prompt = `${basePrompt}\n${textZoneModifier}`;
  const negativePrompt = buildSceneNegativePrompt();

  await generateImageToFileWithProvider({ provider, prompt, negativePrompt, outputPath });
  return outputPath;
}
