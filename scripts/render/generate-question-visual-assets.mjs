import crypto from "node:crypto";
import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { generatePhotorealSceneFrames, regenerateSingleSceneFrame } from "./question-photoreal-generator.mjs";
import { validateTextZoneReadabilityBatch, pickBestFrame } from "./image-text-zone-validator.mjs";
import { postProcessFrames } from "./image-post-processor.mjs";

const WIDTH = 1440;
const HEIGHT = 2400;
const ROLE_ORDER = ["hook", "question", "answers", "timer", "answer", "cta"];

function text(value) {
  return value == null ? "" : String(value).trim();
}

function slugify(value) {
  return text(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

function sha256(payload) {
  return crypto.createHash("sha256").update(payload).digest("hex");
}

function buildPalette(seed) {
  const hash = sha256(seed);
  const a = hash.slice(0, 6);
  const b = hash.slice(6, 12);
  const c = hash.slice(12, 18);
  return {
    backgroundA: `#${a}`,
    backgroundB: `#${b}`,
    accent: `#${c}`,
    light: "#F8FAFC",
    dark: "#0F172A",
  };
}

function escapeXml(value) {
  return text(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function normalizeSceneText(value, limit = 110) {
  return text(value).replace(/\s+/g, " ").slice(0, limit);
}

function detectSemanticTheme(shortform, brief) {
  const haystack = [
    shortform?.hook,
    shortform?.question_short,
    ...(shortform?.answers_short || []),
    ...(Array.isArray(brief?.slides) ? brief.slides.map((slide) => slide.copy) : []),
  ]
    .map((value) => text(value).toLowerCase())
    .join(" ");

  if (/unterlage|papier|dokument|weisung|schein|bescheinigung|führerschein|beförderungspapier/.test(haystack)) {
    return {
      subject: "driver_document_check",
      context: "roadside_inspection",
      tension: "missing_paperwork_decision",
      objectLabel: "ADR DOCUMENTS",
      contextLabel: "ROADSIDE CHECK",
      moodLabel: "CHECK WHAT IS REQUIRED",
    };
  }

  if (/tank|fahrzeug|lkw|truck|fahrzeugschein|fahrzeug/.test(haystack)) {
    return {
      subject: "truck_vehicle_check",
      context: "transport_lane",
      tension: "equipment_verification",
      objectLabel: "VEHICLE CHECK",
      contextLabel: "TRANSPORT ROUTE",
      moodLabel: "VERIFY THE CORRECT SETUP",
    };
  }

  return {
    subject: "adr_quiz_decision",
    context: "hazmat_training_space",
    tension: "exam_uncertainty",
    objectLabel: "ADR DECISION",
    contextLabel: "TRAINING SCENARIO",
    moodLabel: "MAKE THE RIGHT CALL",
  };
}

function pickVariant(seed, options) {
  const hash = sha256(seed);
  const index = parseInt(hash.slice(0, 8), 16) % options.length;
  return options[index];
}

function normalizeVariationOverride(variationTag) {
  const variationType = text(variationTag?.variation_type).toLowerCase();
  const variationValue = text(variationTag?.variation_value).toLowerCase();
  return { variationType, variationValue };
}

function buildMutationProfile(variationTag) {
  const override = normalizeVariationOverride(variationTag);
  if (override.variationType !== "mutation" || !override.variationValue) {
    return null;
  }

  const mutations = {
    hook_no_overlay: { id: "hook_no_overlay", dimension: "hook_style", overlayMode: "none" },
    hook_ultra_aggressive_text: { id: "hook_ultra_aggressive_text", dimension: "hook_style", overlayMode: "ultra_aggressive" },
    hook_alt_wording: { id: "hook_alt_wording", dimension: "hook_style", overlayMode: "alt_wording" },
    camera_extreme_pov: { id: "camera_extreme_pov", dimension: "camera_behavior", cameraMode: "extreme_pov" },
    camera_obstructed_frame: { id: "camera_obstructed_frame", dimension: "camera_behavior", cameraMode: "obstructed_frame" },
    interaction_driver_initiates: { id: "interaction_driver_initiates", dimension: "interaction_twist", interactionMode: "driver_initiates" },
    tension_delayed_reaction: { id: "tension_delayed_reaction", dimension: "tension_type", tensionMode: "delayed_reaction" },
  };

  return mutations[override.variationValue] || { id: override.variationValue, dimension: "mutation" };
}

function buildHookRemixProfile(variationTag) {
  const override = normalizeVariationOverride(variationTag);
  const payload = variationTag?.payload && typeof variationTag.payload === "object" ? variationTag.payload : null;
  if (override.variationType !== "hook_remix" || !payload) {
    return null;
  }
  return {
    id: override.variationValue,
    overlay_type: text(payload.overlay_type),
    camera_pov: text(payload.camera_pov),
    focal_object: text(payload.focal_object),
    mutation_origin: text(payload.mutation_origin),
    source_hooks: Array.isArray(payload.source_hooks) ? payload.source_hooks.map((value) => text(value)).filter(Boolean) : [],
  };
}

function deriveEnvironmentProfile(videoId, baseTheme, variationTag = null) {
  const override = normalizeVariationOverride(variationTag);
  const mutation = buildMutationProfile(variationTag);
  const hookRemix = buildHookRemixProfile(variationTag);
  const location = pickVariant(`${videoId}:location`, [
    {
      id: "roadside_city",
      label: "CITY CHECK",
      skyline: "city",
      roadAccent: "urban",
    },
    {
      id: "highway_stop",
      label: "HIGHWAY STOP",
      skyline: "highway",
      roadAccent: "lane",
    },
    {
      id: "rural_road",
      label: "RURAL ROAD",
      skyline: "rural",
      roadAccent: "country",
    },
    {
      id: "industrial_area",
      label: "INDUSTRIAL CHECK",
      skyline: "industrial",
      roadAccent: "yard",
    },
  ]);

  const timeOfDay = pickVariant(`${videoId}:time`, [
    { id: "morning", label: "MORNING", lightTemp: "cool_day" },
    { id: "late_afternoon", label: "LATE AFTERNOON", lightTemp: "warm_sun" },
    { id: "night", label: "NIGHT", lightTemp: "artificial_mix" },
  ]);

  const weatherChoices = [
    { id: "clear", label: "CLEAR", rain: false, haze: 0.0 },
    { id: "rain", label: "RAIN", rain: true, haze: 0.06 },
    { id: "overcast", label: "OVERCAST", rain: false, haze: 0.12 },
  ];
  const weather = override.variationType === "weather"
    ? weatherChoices.find((item) => item.id === override.variationValue) || pickVariant(`${videoId}:weather`, weatherChoices)
    : pickVariant(`${videoId}:weather`, weatherChoices);

  const interior = pickVariant(`${videoId}:interior`, [
    { id: "compact_used", label: "USED COMPACT", wear: 0.18, tint: "#91B1C4" },
    { id: "sedan_grey", label: "GREY SEDAN", wear: 0.12, tint: "#8FA4B8" },
    { id: "van_dark", label: "DARK VAN", wear: 0.22, tint: "#7FA1A0" },
    { id: "fleet_beige", label: "FLEET CAR", wear: 0.16, tint: "#B2A993" },
  ]);

  const lightingMood = pickVariant(`${videoId}:lighting`, [
    { id: "warm_sunlight", label: "WARM LIGHT", overlay: "#F4C27A", opacity: 0.04 },
    { id: "cold_blue", label: "COLD BLUE", overlay: "#89B8E8", opacity: 0.05 },
    { id: "mixed_light", label: "MIXED LIGHT", overlay: "#9FD9C7", opacity: 0.035 },
  ]);

  const inspectorChoices = [
    { id: "strict", label: "STRICT", distanceBias: -26, eyeBehavior: "intense_stare", interactionStyle: "waits_silently" },
    { id: "aggressive", label: "AGGRESSIVE", distanceBias: 42, eyeBehavior: "hard_lock", interactionStyle: "interrupts_driver" },
    { id: "calm_professional", label: "CALM PRO", distanceBias: -8, eyeBehavior: "document_scan", interactionStyle: "controlled_check" },
    { id: "suspicious", label: "SUSPICIOUS", distanceBias: 18, eyeBehavior: "scan_driver_and_document", interactionStyle: "pushes_back_slightly" },
  ];
  const inspectorBehavior = override.variationType === "inspector_behavior"
    ? inspectorChoices.find((item) => item.id === override.variationValue) || pickVariant(`${videoId}:inspector`, inspectorChoices)
    : pickVariant(`${videoId}:inspector`, inspectorChoices);

  const outcomeVariant = pickVariant(`${videoId}:outcome`, [
    { id: "warning_given", label: "WARNING", endingMood: "release" },
    { id: "document_taken", label: "DOC TAKEN", endingMood: "control" },
    { id: "escalation", label: "ESCALATION", endingMood: "spike" },
    { id: "unresolved_tension", label: "UNRESOLVED", endingMood: "freeze" },
  ]);

  return {
    location,
    timeOfDay,
    weather,
    interior,
    lightingMood,
    inspectorBehavior,
    outcomeVariant,
    baseContext: baseTheme.context,
    contextLabel: `${location.label} / ${timeOfDay.label}`,
    moodLabel: `${weather.label} / ${lightingMood.label} / ${inspectorBehavior.label} / ${outcomeVariant.label}`,
    subject: baseTheme.subject,
    context: `${baseTheme.context}_${location.id}_${timeOfDay.id}_${weather.id}`,
    tension: baseTheme.tension,
    objectLabel: baseTheme.objectLabel,
    variation: variationTag || null,
    mutation,
    hookRemix,
  };
}

function buildSceneDescriptors(brief, theme) {
  const slides = Array.isArray(brief?.slides) ? brief.slides : [];
  const mutation = theme.mutation || null;
  const hookRemix = theme.hookRemix || null;
  return slides.map((slide, index) => {
    const role = text(slide.role) || ROLE_ORDER[index] || "scene";
    const copy = normalizeSceneText(slide.copy);
    const sceneIntent = text(slide.scene_intent);

    let subject = text(slide.subject) || theme.subject;
    let context = text(slide.context) || theme.context;
    let tension = text(slide.tension) || theme.tension;
    let focalX = 720;
    let focalY = 1060;
    let overlayTone = "0.28";
    let spotlight = "0.24";
    let cameraPov = "medium_action";
    let actionCue = "document handoff in progress";
    let dominantSide = "right";
    let cameraTilt = -3.2;
    let cropBiasX = -40;
    let cropBiasY = 18;
    let focusPlane = "midground";
    let obstructionType = "window_frame";
    let exposureBias = "inside_dark_outside_bright";
    let eyeInteraction = "driver_avoids_gaze";
    let driverEmotion = "tight_lips_raised_brow";
    let inspectorEmotion = "narrowed_eyes_authority";
    let powerBias = "inspector_dominant";
    let storyBeat = "tension_start";
    let inspectorBehavior = theme.inspectorBehavior?.id || "strict";

    if (role === "hook") {
      subject = text(slide.subject) || (theme.subject === "driver_document_check" ? "close driver hand holding uncertain document" : "cropped hazard cue");
      context = text(slide.context) || (theme.context === "roadside_inspection" ? "roadside checkpoint lights and truck silhouette" : "compressed action context");
      tension = text(slide.tension) || "urgent uncertainty before the decision";
      focalX = 1040;
      focalY = 520;
      overlayTone = "0.18";
      spotlight = "0.34";
      cameraPov = "close_up";
      actionCue = "hand with document pushed close to camera";
      dominantSide = "left";
      cameraTilt = -6.2;
      cropBiasX = -92;
      cropBiasY = -34;
      focusPlane = "foreground";
      obstructionType = "door_edge";
      eyeInteraction = "document_blocks_face";
      driverEmotion = "mid_hesitation";
      inspectorEmotion = "offscreen_pressure";
      storyBeat = "confrontation_start";
      inspectorBehavior = theme.inspectorBehavior?.id || "strict";
    } else if (role === "question") {
      subject = text(slide.subject) || (theme.subject === "driver_document_check" ? "driver and inspector facing a document check" : "clear main ADR scenario object");
      context = text(slide.context) || (theme.context === "roadside_inspection" ? "checkpoint lane with truck cab in background" : "focused scenario field");
      tension = text(slide.tension) || "which item is actually required";
      focalX = 760;
      focalY = 860;
      overlayTone = "0.24";
      spotlight = "0.28";
      cameraPov = "over_shoulder";
      actionCue = "inspector leaning toward truck window while checking papers";
      dominantSide = "right";
      cameraTilt = 4.6;
      cropBiasX = 72;
      cropBiasY = -12;
      focusPlane = "subject";
      obstructionType = "shoulder_silhouette";
      eyeInteraction = "inspector_to_driver";
      driverEmotion = "tight_lips_raised_brow";
      inspectorEmotion = "narrowed_eyes_authority";
      storyBeat = "hesitation_rise";
      inspectorBehavior = theme.inspectorBehavior?.id || "strict";
    } else if (role === "answers") {
      subject = text(slide.subject) || "four options arranged for comparison";
      context = text(slide.context) || (theme.context === "roadside_inspection" ? "inspection clipboard and document tray" : "decision board");
      tension = text(slide.tension) || "compare choices under time pressure";
      focalX = 360;
      focalY = 1180;
      overlayTone = "0.3";
      spotlight = "0.18";
      cameraPov = "pov";
      actionCue = "driver scanning options under pressure";
      dominantSide = "left";
      cameraTilt = -4.4;
      cropBiasX = -76;
      cropBiasY = 22;
      focusPlane = "foreground";
      obstructionType = "steering_wheel";
      eyeInteraction = "driver_downward_glance";
      driverEmotion = "thinking_under_pressure";
      inspectorEmotion = "background_presence";
      storyBeat = "decision_pressure";
      inspectorBehavior = theme.inspectorBehavior?.id || "strict";
    } else if (role === "timer") {
      subject = text(slide.subject) || "countdown marker over the same inspection scene";
      context = text(slide.context) || "pause beat before committing";
      tension = text(slide.tension) || "short timed hesitation";
      focalX = 720;
      focalY = 1040;
      overlayTone = "0.36";
      spotlight = "0.18";
      cameraPov = "tight_pause";
      actionCue = "brief hesitation before answering";
      dominantSide = "center";
      cameraTilt = 2.8;
      cropBiasX = 30;
      cropBiasY = 34;
      focusPlane = "subject";
      obstructionType = "window_frame";
      eyeInteraction = "driver_side_glance";
      driverEmotion = "jaw_tension";
      inspectorEmotion = "waiting_stare";
      storyBeat = "pressure_pause";
      inspectorBehavior = theme.inspectorBehavior?.id || "strict";
    } else if (role === "answer") {
      subject = text(slide.subject) || (theme.subject === "driver_document_check" ? "correct document lifted into the light" : "correct ADR object highlighted");
      context = text(slide.context) || (theme.context === "roadside_inspection" ? "checkpoint background softens behind the answer" : "clear answer stage");
      tension = text(slide.tension) || "relief and confirmation";
      focalX = 1120;
      focalY = 1120;
      overlayTone = "0.16";
      spotlight = "0.32";
      cameraPov = "reveal_close";
      actionCue = "correct document lifted into the light";
      dominantSide = "right";
      cameraTilt = 5.4;
      cropBiasX = 88;
      cropBiasY = -10;
      focusPlane = "foreground";
      obstructionType = "door_edge";
      eyeInteraction = "relief_breaks_tension";
      driverEmotion = "micro_relief";
      inspectorEmotion = "controlled_confirmation";
      storyBeat = "inspection_peak";
      inspectorBehavior = theme.inspectorBehavior?.id || "strict";
    } else if (role === "cta") {
      subject = text(slide.subject) || "telegram phone entry point";
      context = text(slide.context) || "calm end card connected to the ADR scene";
      tension = text(slide.tension) || "easy next action";
      focalX = 720;
      focalY = 1710;
      overlayTone = "0.22";
      spotlight = "0.24";
      cameraPov = "calm_exit";
      actionCue = "phone offered as the next step";
      dominantSide = "center";
      cameraTilt = -2.4;
      cropBiasX = 12;
      cropBiasY = 46;
      focusPlane = "subject";
      obstructionType = "steering_wheel";
      eyeInteraction = "tension_released";
      driverEmotion = "calmer_exit";
      inspectorEmotion = "offscreen";
      storyBeat = "release_exit";
      inspectorBehavior = theme.inspectorBehavior?.id || "strict";
    }

    if (mutation?.cameraMode === "extreme_pov" && role !== "cta") {
      cameraPov = "extreme_pov";
      focalX += dominantSide === "left" ? -120 : 120;
      focalY -= 140;
      cameraTilt += role === "hook" ? -1.8 : 1.4;
      cropBiasX += dominantSide === "left" ? -90 : 90;
      cropBiasY -= 90;
      focusPlane = "foreground";
    }

    if (mutation?.cameraMode === "obstructed_frame" && role !== "cta") {
      obstructionType = role === "hook" ? "door_edge" : "shoulder_silhouette";
      cropBiasX += dominantSide === "left" ? -70 : 70;
      cropBiasY += 26;
      spotlight = String(Math.max(0.14, Number(spotlight) - 0.06));
    }

    if (mutation?.interactionMode === "driver_initiates") {
      actionCue =
        role === "hook" || role === "question"
          ? "driver thrusts license forward first, inspector reacts a beat later"
          : actionCue;
      powerBias = role === "hook" ? "driver_forces_moment" : powerBias;
      driverEmotion = role === "hook" ? "urgent_initiative" : driverEmotion;
    }

    if (mutation?.tensionMode === "delayed_reaction") {
      tension =
        role === "question" || role === "answer"
          ? "brief silent confusion before the reaction lands"
          : tension;
      inspectorEmotion = role === "question" ? "processing_pause" : inspectorEmotion;
      eyeInteraction = role === "question" ? "document_pause_then_driver" : eyeInteraction;
    }

    if (hookRemix && role === "hook") {
      if (hookRemix.camera_pov) {
        cameraPov = hookRemix.camera_pov;
      }
      if (hookRemix.focal_object) {
        subject = hookRemix.focal_object.replace(/_/g, " ");
      }
      if (hookRemix.mutation_origin === "camera_extreme_pov") {
        focalX += dominantSide === "left" ? -100 : 100;
        cropBiasX += dominantSide === "left" ? -70 : 70;
        cropBiasY -= 60;
        focusPlane = "foreground";
      }
    }

    return {
      id: Number(slide.id) || index + 1,
      role,
      copy,
      sceneIntent,
      visualHint: normalizeSceneText(slide.visual_hint, 92),
      subject,
      context,
      tension,
      cameraPov,
      actionCue,
      dominantSide,
      cameraTilt,
      cropBiasX,
      cropBiasY,
      focusPlane,
      obstructionType,
      exposureBias,
      eyeInteraction,
      driverEmotion,
      inspectorEmotion,
      powerBias,
      storyBeat,
      inspectorBehavior,
      mutation: mutation?.id || "",
      hookRemix: hookRemix?.id || "",
      hookOverlayType: hookRemix?.overlay_type || "",
      focalX,
      focalY,
      overlayTone,
      spotlight,
    };
  });
}

function buildNarrativeCueBar(descriptors, palette) {
  return "";
}

function buildUiRetentionOverlay(descriptors, palette) {
  return "";
}

function extractHookSnapshot(theme, descriptors) {
  const hookScene = descriptors.find((scene) => scene.role === "hook") || descriptors[0] || {};
  const mutationId = text(hookScene.mutation);
  const overlayType = "scene_only";

  let frameStyle = "extreme_close_document_conflict";
  if (mutationId === "camera_extreme_pov") frameStyle = "extreme_pov_conflict";
  else if (mutationId === "camera_obstructed_frame") frameStyle = "obstructed_phone_capture";

  return {
    frame_style: frameStyle,
    overlay_type: overlayType,
    camera_pov: text(hookScene.cameraPov) || "close_up",
    mutation_origin: mutationId || "",
    focal_object: text(hookScene.subject) || "document_near_lens",
    inspector_behavior: text(theme.inspectorBehavior?.id),
  };
}

function buildPatternInterruptOverlay(descriptors, palette) {
  const answersScene = descriptors.find((scene) => scene.role === "answers");
  const timerScene = descriptors.find((scene) => scene.role === "timer");
  if (!answersScene && !timerScene) {
    return "";
  }

  return `
  <g opacity="0.92">
    <g transform="translate(1006 892) rotate(-22)">
      <path d="M -56 -34 C 22 -66, 126 -58, 210 -10 C 266 24, 304 66, 334 132 C 256 150, 166 156, 62 144 C -50 130, -122 100, -172 44 Z" fill="${palette.light}" opacity="0.18" />
      <path d="M -74 -16 C 6 -58, 122 -52, 238 8" stroke="${palette.light}" stroke-width="34" stroke-linecap="round" opacity="0.10" fill="none" filter="url(#directionalBlurStrong)" />
    </g>
    <g transform="translate(818 622) rotate(-8) scale(1.12)">
      <rect x="0" y="0" width="322" height="426" rx="28" ry="28" fill="${palette.light}" opacity="0.08" filter="url(#directionalBlur)" />
    </g>
    <g transform="translate(0 0)">
      <path d="M 1188 0 L ${WIDTH} 0 L ${WIDTH} 812 C 1370 742, 1286 706, 1188 682 Z" fill="${palette.dark}" opacity="0.16" />
    </g>
  </g>`;
}

function buildWorldObjects(theme, descriptors, palette) {
  const hookScene = descriptors.find((scene) => scene.role === "hook") || descriptors[0];
  const questionScene = descriptors.find((scene) => scene.role === "question") || descriptors[0];
  const answerScene = descriptors.find((scene) => scene.role === "answer") || descriptors[0];
  const ctaScene = descriptors.find((scene) => scene.role === "cta") || descriptors[descriptors.length - 1];
  const answersScene = descriptors.find((scene) => scene.role === "answers") || descriptors[0];
  const anchorScene = questionScene || descriptors[0];
  const mutationId = text(anchorScene?.mutation);
  const inspectorProfile = theme.inspectorBehavior || {
    id: "strict",
    distanceBias: 0,
    eyeBehavior: "intense_stare",
    interactionStyle: "waits_silently",
  };
  const outcomeProfile = theme.outcomeVariant || { id: "warning_given", endingMood: "release" };
  const inspectorTranslateX = 1128 + Number(inspectorProfile.distanceBias || 0);
  const inspectorRotate = inspectorProfile.id === "aggressive" ? -8.8 : inspectorProfile.id === "calm_professional" ? -4.2 : inspectorProfile.id === "suspicious" ? -7.2 : -6.2;
  const inspectorArmPath =
    inspectorProfile.id === "aggressive"
      ? "M -26 148 C -114 164, -188 214, -286 304 L -248 338 C -152 274, -98 236, 4 218 Z"
      : inspectorProfile.id === "calm_professional"
        ? "M -4 162 C -72 182, -126 214, -206 270 L -184 300 C -114 252, -66 228, 2 214 Z"
        : inspectorProfile.id === "suspicious"
          ? "M -18 154 C -96 172, -154 214, -242 286 L -214 320 C -132 260, -84 230, 0 214 Z"
          : "M -10 156 C -86 176, -146 214, -236 276 L -210 312 C -128 256, -76 226, 6 214 Z";
  const inspectorFacePath =
    inspectorProfile.id === "aggressive"
      ? { brow: "M -34 -14 C -14 -28, 10 -30, 30 -20", mouth: "M -18 18 C 4 12, 24 12, 42 16" }
      : inspectorProfile.id === "calm_professional"
        ? { brow: "M -28 -8 C -10 -16, 8 -16, 22 -10", mouth: "M -10 18 C 8 16, 22 16, 34 18" }
        : inspectorProfile.id === "suspicious"
          ? { brow: "M -36 -12 C -18 -24, 8 -24, 30 -14", mouth: "M -12 18 C 6 10, 24 10, 40 20" }
          : { brow: "M -30 -10 C -14 -18, 6 -18, 22 -12", mouth: "M -14 16 C 6 12, 22 12, 38 18" };
  const eyeLinePath =
    inspectorProfile.eyeBehavior === "scan_driver_and_document"
      ? "M 534 1038 C 640 986, 782 968, 936 1002 C 1002 1014, 1060 994, 1102 944"
      : inspectorProfile.eyeBehavior === "document_scan"
        ? "M 534 1038 C 650 1006, 768 1002, 884 1022"
        : "M 534 1038 C 700 1004, 900 972, 1038 944";

  const roadMarks =
    theme.baseContext === "roadside_inspection"
      ? `
  <g id="road-marks">
    <rect x="0" y="1820" width="${WIDTH}" height="580" fill="${palette.dark}" opacity="0.36" />
    <rect x="190" y="1900" width="1060" height="16" fill="${palette.light}" opacity="0.18" />
    <rect x="250" y="2050" width="120" height="20" fill="${palette.light}" opacity="0.16" />
    <rect x="470" y="2050" width="120" height="20" fill="${palette.light}" opacity="0.16" />
    <rect x="690" y="2050" width="120" height="20" fill="${palette.light}" opacity="0.16" />
    <rect x="910" y="2050" width="120" height="20" fill="${palette.light}" opacity="0.16" />
  </g>`
      : `
  <g id="road-marks">
    <rect x="0" y="1810" width="${WIDTH}" height="590" fill="${palette.dark}" opacity="0.28" />
  </g>`;

  const skylineLayer =
    theme.location?.skyline === "city"
      ? `
  <g id="skyline-layer" opacity="0.14" filter="url(#backgroundBlur)">
    <rect x="1040" y="520" width="62" height="184" fill="${palette.light}" opacity="0.18" />
    <rect x="1118" y="462" width="88" height="242" fill="${palette.light}" opacity="0.14" />
    <rect x="1226" y="502" width="72" height="202" fill="${palette.light}" opacity="0.12" />
  </g>`
      : theme.location?.skyline === "highway"
        ? `
  <g id="skyline-layer" opacity="0.16" filter="url(#backgroundBlur)">
    <path d="M 1040 628 C 1160 598, 1282 594, 1440 620" stroke="${palette.light}" stroke-width="20" opacity="0.10" fill="none" />
    <rect x="1186" y="470" width="18" height="208" fill="${palette.light}" opacity="0.12" />
    <rect x="1220" y="490" width="94" height="18" fill="${palette.light}" opacity="0.10" />
  </g>`
        : theme.location?.skyline === "rural"
          ? `
  <g id="skyline-layer" opacity="0.14" filter="url(#backgroundBlur)">
    <path d="M 980 682 C 1098 604, 1218 594, 1440 638 L 1440 742 C 1268 710, 1154 718, 980 778 Z" fill="${palette.light}" opacity="0.08" />
    <path d="M 1086 584 C 1118 546, 1148 518, 1188 486" stroke="${palette.light}" stroke-width="10" opacity="0.08" fill="none" />
  </g>`
          : `
  <g id="skyline-layer" opacity="0.14" filter="url(#backgroundBlur)">
    <rect x="1096" y="468" width="126" height="244" fill="${palette.light}" opacity="0.10" />
    <rect x="1242" y="512" width="96" height="198" fill="${palette.light}" opacity="0.12" />
    <path d="M 1064 608 L 1368 608" stroke="${palette.light}" stroke-width="8" opacity="0.08" />
  </g>`;

  const weatherLayer =
    theme.weather?.rain
      ? `
  <g opacity="0.24">
    <path d="M 122 0 L 72 286" stroke="${palette.light}" stroke-width="5" opacity="0.10" filter="url(#directionalBlur)" />
    <path d="M 322 0 L 272 334" stroke="${palette.light}" stroke-width="4" opacity="0.08" filter="url(#directionalBlur)" />
    <path d="M 986 0 L 934 312" stroke="${palette.light}" stroke-width="4" opacity="0.09" filter="url(#directionalBlur)" />
    <path d="M 1248 0 L 1198 274" stroke="${palette.light}" stroke-width="5" opacity="0.08" filter="url(#directionalBlur)" />
  </g>`
      : theme.weather?.id === "overcast"
        ? `<rect width="${WIDTH}" height="${HEIGHT}" fill="${palette.light}" opacity="0.035" />`
        : "";

  const windowFrame = `
  <g id="window-frame" opacity="0.58" transform="skewX(-2.4)">
    <path d="M 0 0 L 292 0 L 182 362 L 0 442 Z" fill="${palette.dark}" opacity="0.34" />
    <path d="M ${WIDTH} 0 L ${WIDTH} 462 L ${WIDTH - 164} 362 L ${WIDTH - 252} 0 Z" fill="${palette.dark}" opacity="0.24" />
  </g>`;

  const doorEdge = `
  <g id="door-edge" opacity="0.56" transform="skewX(-3.2)">
    <path d="M 0 0 L 196 0 L 126 694 L 0 824 Z" fill="${palette.dark}" opacity="0.28" />
    <path d="M ${WIDTH - 120} 0 L ${WIDTH} 0 L ${WIDTH} 1020 L ${WIDTH - 48} 944 Z" fill="${palette.dark}" opacity="0.18" />
    <path d="M 18 164 C 56 150, 88 152, 122 166" stroke="${palette.light}" stroke-width="3" opacity="0.04" fill="none" />
    <path d="M 34 382 L 96 370" stroke="${palette.light}" stroke-width="2" opacity="0.05" />
  </g>`;

  const shoulderSilhouette = `
  <g id="shoulder-silhouette" opacity="0.42">
    <path d="M 1050 2400 C 996 2140, 1028 1840, 1192 1640 C 1322 1480, 1434 1420, ${WIDTH} 1460 L ${WIDTH} 2400 Z" fill="${palette.dark}" opacity="0.34" filter="url(#softBlur)" />
  </g>`;

  const steeringWheelEdge = `
  <g id="steering-wheel-edge" opacity="0.44">
    <path d="M -40 2140 C 118 1826, 420 1686, 716 1728" stroke="${palette.dark}" stroke-width="120" fill="none" opacity="0.26" filter="url(#softBlur)" />
    <path d="M 26 2142 C 176 1868, 434 1760, 670 1804" stroke="${palette.light}" stroke-width="8" fill="none" opacity="0.08" />
    <path d="M 164 2034 L 242 2018" stroke="${palette.light}" stroke-width="2" opacity="0.04" />
    <path d="M 332 1942 L 392 1956" stroke="${palette.dark}" stroke-width="2.2" opacity="0.06" />
  </g>`;

  const obstructionLayer =
    mutationId === "camera_obstructed_frame"
      ? `
  <g opacity="0.94">
    <path d="M 0 0 L 430 0 C 330 190, 298 430, 314 700 C 324 876, 306 1108, 226 1382 L 0 1464 Z" fill="${palette.dark}" opacity="0.54" />
    <ellipse cx="1184" cy="404" rx="260" ry="118" fill="${palette.light}" opacity="0.08" filter="url(#directionalBlurStrong)" />
  </g>`
      : anchorScene?.obstructionType === "door_edge"
      ? doorEdge
      : anchorScene?.obstructionType === "shoulder_silhouette"
        ? shoulderSilhouette
        : anchorScene?.obstructionType === "steering_wheel"
          ? steeringWheelEdge
          : windowFrame;

  const foregroundDocument = `
  <g id="foreground-document" transform="translate(-28 486) rotate(-13)">
    <g opacity="0.16" filter="url(#directionalBlurStrong)" transform="translate(18 10)">
      <rect x="0" y="0" width="368" height="470" rx="28" ry="28" fill="${palette.light}" />
    </g>
    <ellipse cx="184" cy="442" rx="208" ry="36" fill="${palette.dark}" opacity="0.18" filter="url(#softBlur)" />
    <path d="M 8 12 C 22 0, 340 4, 360 20 L 364 446 C 346 462, 24 464, 10 450 Z" fill="${palette.light}" opacity="0.94" />
    <rect x="26" y="28" width="314" height="416" rx="20" ry="20" fill="${palette.dark}" opacity="0.08" />
    <rect x="34" y="58" width="202" height="18" rx="9" ry="9" fill="${palette.accent}" opacity="0.84" />
    <rect x="34" y="110" width="268" height="10" rx="5" ry="5" fill="${palette.dark}" opacity="0.16" />
    <rect x="34" y="148" width="236" height="10" rx="5" ry="5" fill="${palette.dark}" opacity="0.16" />
    <rect x="34" y="188" width="284" height="10" rx="5" ry="5" fill="${palette.dark}" opacity="0.12" />
    <path d="M 22 78 C 88 70, 164 68, 248 76" stroke="${palette.dark}" stroke-width="3" opacity="0.08" fill="none" />
    <path d="M 10 24 L 38 6" stroke="${palette.dark}" stroke-width="2.4" opacity="0.06" />
    <path d="M 306 446 L 350 418" stroke="${palette.dark}" stroke-width="2.2" opacity="0.05" />
    <path d="M 46 304 C 122 314, 196 318, 268 310" stroke="${palette.dark}" stroke-width="2" opacity="0.05" fill="none" />
    </g>`;

  const foregroundHand = `
  <g id="foreground-hand" transform="translate(138 1022) rotate(-18)">
    <path d="M -126 -24 C -72 -48, 10 -40, 92 -10 C 144 8, 162 28, 170 58" stroke="${palette.light}" stroke-width="46" stroke-linecap="round" opacity="0.10" fill="none" filter="url(#directionalBlurStrong)" />
    <ellipse cx="0" cy="0" rx="178" ry="38" fill="${palette.accent}" opacity="0.16" filter="url(#motionBlur)" />
    <path d="M -112 -20 C -64 -42, 18 -36, 88 -6 C 126 10, 142 26, 154 54 C 116 66, 70 72, 14 68 C -56 64, -102 44, -132 14 Z" fill="${palette.light}" opacity="0.22" />
    <path d="M -102 -8 C -54 -28, 22 -24, 94 2 C 128 14, 142 26, 152 48" stroke="${palette.light}" stroke-width="18" stroke-linecap="round" opacity="0.08" fill="none" filter="url(#directionalBlur)" />
  </g>`;

  const hookCloseDocument = `
  <g id="hook-close-document" transform="translate(-86 328) rotate(-15)">
    <g opacity="0.18" filter="url(#directionalBlurStrong)" transform="translate(22 12)">
      <rect x="0" y="0" width="564" height="744" rx="36" ry="36" fill="${palette.light}" />
    </g>
    <ellipse cx="284" cy="752" rx="296" ry="38" fill="${palette.dark}" opacity="0.16" filter="url(#softBlur)" />
    <path d="M 12 14 C 34 -4, 524 2, 548 24 L 558 712 C 534 738, 42 748, 18 726 Z" fill="${palette.light}" opacity="0.96" />
    <rect x="38" y="38" width="486" height="656" rx="24" ry="24" fill="${palette.dark}" opacity="0.08" />
    <rect x="56" y="76" width="282" height="24" rx="12" ry="12" fill="${palette.accent}" opacity="0.88" />
    <rect x="56" y="138" width="372" height="12" rx="6" ry="6" fill="${palette.dark}" opacity="0.14" />
    <rect x="56" y="184" width="326" height="12" rx="6" ry="6" fill="${palette.dark}" opacity="0.14" />
    <rect x="56" y="232" width="396" height="12" rx="6" ry="6" fill="${palette.dark}" opacity="0.12" />
    <rect x="56" y="326" width="168" height="102" rx="22" ry="22" fill="${palette.accent}" opacity="0.22" />
    <path d="M 24 32 L 58 10" stroke="${palette.dark}" stroke-width="3" opacity="0.08" />
    <path d="M 482 708 L 542 668" stroke="${palette.dark}" stroke-width="3" opacity="0.08" />
    <path d="M 62 468 C 132 478, 192 482, 252 474" stroke="${palette.dark}" stroke-width="2" opacity="0.06" fill="none" />
  </g>`;

  const hookBlockingHand = `
  <g id="hook-blocking-hand" transform="translate(316 888) rotate(-16)">
    <path d="M -168 -12 C -92 -60, 36 -48, 146 8 C 202 36, 232 64, 254 112 C 190 132, 114 142, 22 138 C -94 132, -168 98, -214 44 Z" fill="${palette.light}" opacity="0.22" />
    <path d="M -176 -20 C -92 -68, 42 -54, 162 2" stroke="${palette.light}" stroke-width="34" stroke-linecap="round" opacity="0.08" fill="none" filter="url(#directionalBlurStrong)" />
  </g>`;

  const hookInspectorClose = `
  <g transform="translate(992 142) rotate(-5)">
    <ellipse cx="118" cy="148" rx="156" ry="188" fill="${palette.dark}" opacity="0.18" filter="url(#softBlur)" />
    <circle cx="86" cy="112" r="116" fill="${palette.light}" opacity="0.18" />
    <path d="M -22 336 C -8 174, 92 118, 212 152 C 286 174, 338 228, 374 352 L 214 352 C 182 284, 132 252, 70 250 C 10 248, -26 270, -54 318 Z" fill="${palette.light}" opacity="0.12" />
    <path d="M 44 88 C 70 66, 100 60, 132 70" stroke="${palette.dark}" stroke-width="8" opacity="0.24" fill="none" />
    <path d="M 56 150 C 86 136, 120 136, 144 152" stroke="${palette.dark}" stroke-width="6" opacity="0.18" fill="none" />
    <ellipse cx="70" cy="104" rx="18" ry="8" fill="${palette.dark}" opacity="0.18" />
  </g>`;

  const hookLensShadow = `
  <g opacity="0.62">
    <path d="M 0 0 L 360 0 L 206 432 L 0 562 Z" fill="${palette.dark}" opacity="0.30" />
    <path d="M ${WIDTH} 0 L ${WIDTH} 622 L ${WIDTH - 182} 452 L ${WIDTH - 264} 0 Z" fill="${palette.dark}" opacity="0.18" />
  </g>`;

  const mutationHookOverlay =
    mutationId === "camera_extreme_pov"
      ? `
  <g transform="translate(54 122) rotate(-12)">
    <path d="M 0 204 C 130 72, 318 14, 564 2 L 604 334 C 430 350, 264 402, 82 542 Z" fill="${palette.light}" opacity="0.10" filter="url(#directionalBlurStrong)" />
  </g>`
      : "";

  const truckGroup = `
  <g id="truck-group" transform="translate(848 1302) rotate(-3.8 250 100)" filter="url(#backgroundBlur)">
    <rect x="0" y="0" width="500" height="210" rx="32" ry="32" fill="${palette.dark}" opacity="0.44" />
    <rect x="368" y="-84" width="208" height="176" rx="28" ry="28" fill="${palette.dark}" opacity="0.52" />
    <rect x="34" y="36" width="236" height="62" rx="22" ry="22" fill="${palette.light}" opacity="0.08" />
    <rect x="382" y="-48" width="88" height="54" rx="18" ry="18" fill="${palette.light}" opacity="0.06" />
    <path d="M 24 132 C 116 126, 214 128, 304 138" stroke="${palette.light}" stroke-width="4" opacity="0.08" fill="none" />
    <path d="M 42 154 C 132 146, 248 152, 344 164" stroke="${palette.light}" stroke-width="3" opacity="0.06" fill="none" />
    <circle cx="116" cy="228" r="42" fill="${palette.light}" opacity="0.16" />
    <circle cx="386" cy="228" r="42" fill="${palette.light}" opacity="0.16" />
    <circle cx="520" cy="126" r="34" fill="${palette.light}" opacity="0.11" />
    <rect x="-40" y="144" width="70" height="18" rx="9" ry="9" fill="${palette.accent}" opacity="0.58" />
    <ellipse cx="244" cy="258" rx="278" ry="34" fill="${palette.dark}" opacity="0.16" filter="url(#softBlur)" />
  </g>`;

  const documentGroup = `
  <g id="document-group" transform="translate(652 1148) rotate(-18)">
    <g opacity="0.12" filter="url(#directionalBlur)" transform="translate(12 10)">
      <rect x="0" y="0" width="286" height="372" rx="24" ry="24" fill="${palette.light}" />
    </g>
    <rect x="0" y="0" width="286" height="372" rx="24" ry="24" fill="${palette.light}" opacity="0.96" />
    <rect x="24" y="24" width="238" height="324" rx="16" ry="16" fill="${palette.dark}" opacity="0.08" />
    <rect x="34" y="54" width="158" height="16" rx="8" ry="8" fill="${palette.accent}" opacity="0.86" />
    <rect x="34" y="102" width="208" height="10" rx="5" ry="5" fill="${palette.dark}" opacity="0.14" />
    <rect x="34" y="138" width="176" height="10" rx="5" ry="5" fill="${palette.dark}" opacity="0.14" />
    <rect x="34" y="174" width="202" height="10" rx="5" ry="5" fill="${palette.dark}" opacity="0.14" />
    <rect x="34" y="238" width="108" height="72" rx="18" ry="18" fill="${palette.accent}" opacity="0.18" />
    <path d="M 30 84 C 88 76, 142 78, 216 82" stroke="${palette.dark}" stroke-width="2.5" opacity="0.08" fill="none" />
    <path d="M 40 208 C 126 214, 182 220, 234 230" stroke="${palette.dark}" stroke-width="2" opacity="0.06" fill="none" />
    <ellipse cx="148" cy="388" rx="142" ry="20" fill="${palette.dark}" opacity="0.18" filter="url(#softBlur)" />
  </g>`;

  const driverGroup = `
  <g id="driver-group" transform="translate(356 1082) rotate(6.2 30 180)">
    <path d="M -26 -28 C -2 -44, 24 -46, 54 -34" stroke="${palette.light}" stroke-width="22" stroke-linecap="round" opacity="0.08" fill="none" filter="url(#directionalBlur)" />
    <circle cx="0" cy="0" r="84" fill="${palette.light}" opacity="0.24" />
    <path d="M -140 280 C -126 128, -18 72, 96 102 C 166 120, 210 170, 244 280 L 120 280 C 92 210, 50 188, 0 190 C -60 194, -102 222, -126 280 Z" fill="${palette.accent}" opacity="0.22" />
    <path d="M 78 164 C 164 174, 230 198, 312 246 L 290 282 C 208 244, 150 226, 64 222 Z" fill="${palette.light}" opacity="0.16" />
    <path d="M 52 40 C 72 18, 94 8, 116 10" stroke="${palette.light}" stroke-width="6" opacity="0.12" fill="none" />
    <ellipse cx="246" cy="264" rx="52" ry="22" fill="${palette.light}" opacity="0.14" transform="rotate(-12 246 264)" />
    <ellipse cx="214" cy="284" rx="44" ry="18" fill="${palette.dark}" opacity="0.22" transform="rotate(-12 214 284)" />
    <ellipse cx="20" cy="324" rx="170" ry="28" fill="${palette.dark}" opacity="0.16" filter="url(#softBlur)" />
  </g>`;

  const inspectorGroup = `
  <g id="inspector-group" transform="translate(${inspectorTranslateX} 862) rotate(${inspectorRotate} 0 170)">
    <path d="M -24 -18 C -42 -28, -62 -28, -80 -18" stroke="${palette.light}" stroke-width="18" stroke-linecap="round" opacity="0.07" fill="none" filter="url(#directionalBlur)" />
    <circle cx="0" cy="0" r="74" fill="${palette.light}" opacity="0.18" />
    <path d="M -112 248 C -88 128, 4 84, 108 124 C 172 148, 214 194, 244 300 L 110 300 C 84 242, 54 214, 0 204 C -52 194, -82 204, -122 236 Z" fill="${palette.light}" opacity="0.12" />
    <path d="${inspectorArmPath}" fill="${palette.light}" opacity="0.12" />
    <path d="M -18 34 C -36 24, -56 24, -72 34" stroke="${palette.light}" stroke-width="5" opacity="0.10" fill="none" />
    <ellipse cx="48" cy="334" rx="156" ry="24" fill="${palette.dark}" opacity="0.14" filter="url(#softBlur)" />
  </g>`;

  const motionSmear = `
  <g id="motion-smear-hands" opacity="0.28">
    <path d="M 496 1222 C 590 1168, 666 1142, 760 1130" stroke="${palette.light}" stroke-width="18" stroke-linecap="round" fill="none" filter="url(#motionBlur)" />
    <path d="M 874 1118 C 952 1054, 1018 1018, 1102 1004" stroke="${palette.light}" stroke-width="14" stroke-linecap="round" fill="none" filter="url(#motionBlur)" />
  </g>`;

  const eyeLine = `
  <path d="${eyeLinePath}" stroke="${palette.light}" stroke-width="5" opacity="0.08" fill="none" stroke-dasharray="10 14" />`;

  const answerOptionsCard = `
  `;

  const progressionStart = `
  <g transform="translate(186 396) rotate(-12)">
    <ellipse cx="186" cy="422" rx="188" ry="28" fill="${palette.dark}" opacity="0.14" filter="url(#softBlur)" />
    <path d="M -36 236 C 42 176, 116 150, 220 146" stroke="${palette.light}" stroke-width="24" stroke-linecap="round" opacity="0.08" filter="url(#directionalBlur)" />
    <rect x="0" y="0" width="332" height="452" rx="30" ry="30" fill="${palette.light}" opacity="0.94" />
    <rect x="26" y="28" width="280" height="392" rx="18" ry="18" fill="${palette.dark}" opacity="0.08" />
    <rect x="42" y="62" width="188" height="18" rx="9" ry="9" fill="${palette.accent}" opacity="0.84" />
    <rect x="42" y="116" width="218" height="10" rx="5" ry="5" fill="${palette.dark}" opacity="0.12" />
  </g>`;

  const progressionMiddle = `
  <g transform="translate(560 836) rotate(-17)">
    <ellipse cx="160" cy="390" rx="176" ry="24" fill="${palette.dark}" opacity="0.14" filter="url(#softBlur)" />
    <g opacity="0.12" filter="url(#directionalBlur)" transform="translate(18 10)">
      <rect x="0" y="0" width="314" height="418" rx="26" ry="26" fill="${palette.light}" />
    </g>
    <rect x="0" y="0" width="314" height="418" rx="26" ry="26" fill="${palette.light}" opacity="0.94" />
    <rect x="24" y="22" width="264" height="368" rx="16" ry="16" fill="${palette.dark}" opacity="0.08" />
    <path d="M -82 208 C -12 164, 74 152, 150 164" stroke="${palette.light}" stroke-width="20" stroke-linecap="round" opacity="0.08" filter="url(#directionalBlurStrong)" />
  </g>`;

  const progressionPeak = `
  <g transform="translate(948 902) rotate(-9)">
    <ellipse cx="136" cy="352" rx="166" ry="24" fill="${palette.dark}" opacity="0.16" filter="url(#softBlur)" />
    <rect x="0" y="0" width="272" height="368" rx="24" ry="24" fill="${palette.light}" opacity="0.96" />
    <rect x="22" y="24" width="226" height="318" rx="16" ry="16" fill="${palette.dark}" opacity="0.08" />
    <rect x="34" y="56" width="142" height="16" rx="8" ry="8" fill="${palette.accent}" opacity="0.84" />
    <path d="M -92 130 C -6 94, 70 96, 150 120" stroke="${palette.light}" stroke-width="22" stroke-linecap="round" opacity="0.08" filter="url(#directionalBlur)" />
    <path d="M 244 42 C 292 58, 332 88, 356 122" stroke="${palette.dark}" stroke-width="16" stroke-linecap="round" opacity="0.10" filter="url(#directionalBlur)" />
  </g>`;

  const storyContinuationLine = `
  <path d="M 330 820 C 456 836, 562 874, 674 954 C 790 1038, 894 1088, 1036 1104" stroke="${palette.light}" stroke-width="5" opacity="0.07" fill="none" stroke-dasharray="14 18" />`;

  const driverFaceDetails = `
  <g id="driver-face-details" transform="translate(354 1088) rotate(6)">
    <path d="M -22 -18 C -6 -34, 16 -38, 34 -28" stroke="${palette.light}" stroke-width="4.5" opacity="0.16" fill="none" />
    <path d="M 8 6 C 26 12, 44 20, 58 34" stroke="${palette.dark}" stroke-width="5" opacity="0.16" fill="none" filter="url(#softBlur)" />
    <path d="M -20 24 C -2 18, 18 18, 34 24" stroke="${palette.dark}" stroke-width="4" opacity="0.18" fill="none" />
    <ellipse cx="-8" cy="0" rx="10" ry="5" fill="${palette.dark}" opacity="0.16" />
  </g>`;

  const inspectorFaceDetails = `
  <g id="inspector-face-details" transform="translate(${inspectorTranslateX} 864) rotate(${inspectorRotate - 0.8})">
    <path d="${inspectorFacePath.brow}" stroke="${palette.dark}" stroke-width="4.4" opacity="0.22" fill="none" />
    <path d="${inspectorFacePath.mouth}" stroke="${palette.dark}" stroke-width="3.8" opacity="0.14" fill="none" />
    <ellipse cx="-10" cy="-2" rx="12" ry="5" fill="${palette.dark}" opacity="0.16" />
  </g>`;

  const dominanceShadow = `
  <ellipse cx="${1138 + Number(inspectorProfile.distanceBias || 0)}" cy="1038" rx="${inspectorProfile.id === "aggressive" ? 252 : inspectorProfile.id === "calm_professional" ? 206 : 228}" ry="420" fill="${palette.dark}" opacity="0.08" filter="url(#blurShadow)" />`;

  const interactionGlow = `
  <ellipse cx="${questionScene?.focalX || 760}" cy="${questionScene?.focalY || 980}" rx="300" ry="190" fill="${palette.light}" opacity="${questionScene?.spotlight || "0.22"}" filter="url(#blurShadow)" />
  <ellipse cx="${hookScene?.focalX || 980}" cy="${hookScene?.focalY || 560}" rx="180" ry="110" fill="${palette.accent}" opacity="${hookScene?.spotlight || "0.26"}" filter="url(#blurShadow)" />
  <ellipse cx="${answerScene?.focalX || 1060}" cy="${answerScene?.focalY || 1180}" rx="220" ry="140" fill="${palette.light}" opacity="${answerScene?.spotlight || "0.22"}" filter="url(#blurShadow)" />`;

  const checkpointDetails =
    theme.baseContext === "roadside_inspection"
      ? `
  <g id="checkpoint-details" transform="translate(118 1260)">
    <rect x="0" y="0" width="68" height="320" rx="18" ry="18" fill="${palette.light}" opacity="0.10" />
    <rect x="16" y="18" width="36" height="112" rx="14" ry="14" fill="${palette.accent}" opacity="0.76" />
    <rect x="16" y="156" width="36" height="112" rx="14" ry="14" fill="${palette.light}" opacity="0.32" />
  </g>
  <g transform="translate(132 1688)">
    <path d="M 0 180 L 44 0 L 88 180 Z" fill="${palette.accent}" opacity="0.82" />
    <rect x="22" y="102" width="44" height="18" fill="${palette.light}" opacity="0.22" />
    <path d="M -4 184 C 26 176, 60 176, 94 184" stroke="${palette.dark}" stroke-width="4" opacity="0.12" fill="none" />
  </g>`
      : "";

  const telegramPhone = ``;

  const midgroundOverlay = `
  <path d="M 0 1540 C 260 1400, 440 1360, 690 1390 C 960 1420, 1180 1500, 1440 1640 L 1440 2400 L 0 2400 Z" fill="${palette.dark}" opacity="${ctaScene?.overlayTone || "0.22"}" />`;

  const glareLayer = `
  <g opacity="0.34">
    <path d="M -120 244 C 206 84, 530 40, 920 90" stroke="${palette.light}" stroke-width="26" stroke-linecap="round" fill="none" opacity="0.10" filter="url(#motionBlur)" />
    <path d="M 840 0 C 980 132, 1114 266, 1238 470" stroke="${palette.light}" stroke-width="18" stroke-linecap="round" fill="none" opacity="0.06" filter="url(#softBlur)" />
  </g>`;

  const exposureMask = `
  <rect x="0" y="0" width="${WIDTH}" height="${HEIGHT}" fill="${palette.dark}" opacity="0.08" />
  <ellipse cx="1116" cy="480" rx="420" ry="260" fill="${palette.light}" opacity="0.08" filter="url(#blurShadow)" />`;

  const rollingShutterBands = `
  <g opacity="0.16">
    <rect x="0" y="248" width="${WIDTH}" height="46" fill="${palette.light}" opacity="0.028" transform="skewX(-2.8)" />
    <rect x="0" y="618" width="${WIDTH}" height="34" fill="${palette.dark}" opacity="0.036" transform="skewX(1.8)" />
    <rect x="0" y="1026" width="${WIDTH}" height="42" fill="${palette.light}" opacity="0.022" transform="skewX(-2.2)" />
    <rect x="0" y="1518" width="${WIDTH}" height="38" fill="${palette.dark}" opacity="0.03" transform="skewX(1.6)" />
  </g>`;

  const compressionSmear = `
  <g opacity="0.24">
    <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#compressionBlocks)" />
    <path d="M 0 1814 C 302 1770, 626 1772, 930 1812 C 1186 1844, 1328 1882, ${WIDTH} 1948" stroke="${palette.light}" stroke-width="22" opacity="0.022" fill="none" filter="url(#softBlur)" />
  </g>`;
  const patternInterruptOverlay = buildPatternInterruptOverlay(descriptors, palette);
  const finalOutcomeOverlay =
    outcomeProfile.id === "document_taken"
      ? `
  <g transform="translate(924 1132) rotate(-14)">
    <path d="M -212 34 C -118 6, -24 2, 66 18" stroke="${palette.light}" stroke-width="20" stroke-linecap="round" opacity="0.08" filter="url(#directionalBlurStrong)" />
    <rect x="0" y="0" width="246" height="322" rx="24" ry="24" fill="${palette.light}" opacity="0.94" />
    <rect x="18" y="18" width="210" height="286" rx="16" ry="16" fill="${palette.dark}" opacity="0.08" />
  </g>`
      : outcomeProfile.id === "escalation"
        ? `
  <g opacity="0.92">
    <path d="M 1216 904 C 1284 828, 1350 810, 1440 856" stroke="${palette.light}" stroke-width="28" stroke-linecap="round" opacity="0.10" filter="url(#directionalBlurStrong)" />
    <circle cx="1338" cy="972" r="74" fill="${palette.light}" opacity="0.10" filter="url(#softBlur)" />
  </g>`
        : outcomeProfile.id === "unresolved_tension"
          ? `
  <g opacity="0.88">
    <rect x="962" y="782" width="302" height="518" rx="34" ry="34" fill="${palette.dark}" opacity="0.16" />
    <path d="M 622 1038 C 760 1012, 914 992, 1088 986" stroke="${palette.light}" stroke-width="6" opacity="0.09" fill="none" stroke-dasharray="8 12" />
  </g>`
          : `
  <g transform="translate(1038 1068) rotate(-8)">
    <path d="M -86 94 C -22 62, 34 54, 90 64" stroke="${palette.light}" stroke-width="14" stroke-linecap="round" opacity="0.08" filter="url(#directionalBlur)" />
  </g>`;
  const loopBridgeOverlay = `
  <g opacity="0.94">
    <g transform="translate(-58 356) rotate(-16)">
      <g opacity="0.18" filter="url(#directionalBlurStrong)" transform="translate(22 12)">
        <rect x="0" y="0" width="418" height="566" rx="34" ry="34" fill="${palette.light}" />
      </g>
      <path d="M 12 10 C 34 -6, 392 0, 410 22 L 416 540 C 394 562, 40 568, 18 548 Z" fill="${palette.light}" opacity="0.92" />
      <rect x="34" y="34" width="352" height="486" rx="22" ry="22" fill="${palette.dark}" opacity="0.08" />
      <rect x="48" y="70" width="212" height="20" rx="10" ry="10" fill="${palette.accent}" opacity="0.82" />
      <path d="M 28 26 L 56 8" stroke="${palette.dark}" stroke-width="2.6" opacity="0.06" />
    </g>
    <g transform="translate(264 948) rotate(-18)">
      <path d="M -188 -16 C -102 -68, 28 -54, 150 6 C 208 34, 242 70, 266 126 C 188 144, 96 150, -6 144 C -118 136, -194 98, -242 40 Z" fill="${palette.light}" opacity="0.18" />
      <path d="M -196 -24 C -104 -74, 36 -60, 178 12" stroke="${palette.light}" stroke-width="34" stroke-linecap="round" opacity="0.08" fill="none" filter="url(#directionalBlurStrong)" />
    </g>
    <g opacity="0.56">
      <path d="M 0 0 L 312 0 L 188 406 L 0 548 Z" fill="${palette.dark}" opacity="0.22" />
    </g>
  </g>`;

  const interiorWear = `
  <g opacity="0.34">
    <path d="M 108 226 C 132 212, 164 214, 186 230" stroke="${palette.light}" stroke-width="16" stroke-linecap="round" opacity="0.06" filter="url(#softBlur)" />
    <path d="M 1118 352 C 1142 336, 1176 338, 1198 356" stroke="${palette.light}" stroke-width="12" stroke-linecap="round" opacity="0.05" filter="url(#softBlur)" />
    <circle cx="262" cy="1864" r="3.2" fill="${palette.light}" opacity="0.08" />
    <circle cx="304" cy="1848" r="2.2" fill="${palette.light}" opacity="0.07" />
    <circle cx="346" cy="1862" r="2.8" fill="${palette.light}" opacity="0.06" />
    <path d="M 242 1888 L 286 1878" stroke="${palette.dark}" stroke-width="1.8" opacity="0.08" />
    <path d="M 1188 1802 L 1232 1788" stroke="${palette.dark}" stroke-width="1.6" opacity="0.06" />
  </g>`;

  const realWorldNoise = `
  <g opacity="0.28">
    <path d="M 1244 1264 C 1302 1240, 1366 1242, 1428 1268" stroke="${palette.light}" stroke-width="48" stroke-linecap="round" opacity="0.05" filter="url(#directionalBlurStrong)" />
    <path d="M 1180 842 L 1314 794" stroke="${palette.accent}" stroke-width="10" opacity="0.06" filter="url(#softBlur)" />
    <path d="M 912 96 C 1034 62, 1168 70, 1298 122" stroke="#9BD3FF" stroke-width="20" opacity="0.05" filter="url(#softBlur)" />
    <path d="M 996 138 C 1086 118, 1172 124, 1264 154" stroke="#D8F1FF" stroke-width="12" opacity="0.04" filter="url(#softBlur)" />
  </g>`;

  const unevenObjectShadows = `
  <g opacity="0.22">
    <path d="M 884 948 C 978 980, 1066 1032, 1128 1108" stroke="${palette.dark}" stroke-width="84" stroke-linecap="round" opacity="0.08" filter="url(#softBlur)" />
    <path d="M 302 1262 C 402 1292, 488 1330, 572 1390" stroke="${palette.dark}" stroke-width="70" stroke-linecap="round" opacity="0.06" filter="url(#softBlur)" />
  </g>`;

  const tintLayer = `
  <rect width="${WIDTH}" height="${HEIGHT}" fill="${theme.interior?.tint || "#7BB7C9"}" opacity="0.028" />
  <rect width="${WIDTH}" height="${HEIGHT}" fill="${theme.lightingMood?.overlay || "#9FD1B4"}" opacity="${theme.lightingMood?.opacity || 0.016}" />`;

  const hookOverrideLayer = `
  <g opacity="1">
    ${hookLensShadow}
    ${hookCloseDocument}
    ${hookBlockingHand}
    ${hookInspectorClose}
    ${mutationHookOverlay}
  </g>`;

  return `<g transform="translate(${anchorScene?.cropBiasX || 0} ${anchorScene?.cropBiasY || 0}) rotate(${anchorScene?.cameraTilt || 0} ${WIDTH / 2} ${HEIGHT / 2})">${tintLayer}${rollingShutterBands}${weatherLayer}${obstructionLayer}${glareLayer}${exposureMask}${interactionGlow}${roadMarks}${skylineLayer}${realWorldNoise}${storyContinuationLine}${progressionStart}${progressionMiddle}${progressionPeak}${anchorScene?.role === "hook" ? hookOverrideLayer : `${foregroundDocument}${foregroundHand}`}${checkpointDetails}${truckGroup}${motionSmear}${patternInterruptOverlay}${unevenObjectShadows}${dominanceShadow}${inspectorGroup}${driverGroup}${documentGroup}${driverFaceDetails}${inspectorFaceDetails}${eyeLine}${answerOptionsCard}${finalOutcomeOverlay}${loopBridgeOverlay}${midgroundOverlay}${telegramPhone}${interiorWear}${compressionSmear}</g>`;
}

function buildPrimarySvg({ videoId, questionId, shortform, palette, brief, variationTag = null }) {
  const theme = deriveEnvironmentProfile(videoId, detectSemanticTheme(shortform, brief), variationTag);
  const descriptors = buildSceneDescriptors(brief, theme);
  const hookScene = descriptors.find((scene) => scene.role === "hook") || descriptors[0];
  const answerScene = descriptors.find((scene) => scene.role === "answer") || descriptors[0];
  const cueBar = buildNarrativeCueBar(descriptors, palette);
  const uiRetentionOverlay = buildUiRetentionOverlay(descriptors, palette);
  const worldObjects = buildWorldObjects(theme, descriptors, palette);

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${palette.backgroundA}" />
      <stop offset="55%" stop-color="${palette.backgroundB}" />
      <stop offset="100%" stop-color="${palette.dark}" />
    </linearGradient>
    <radialGradient id="lightA" cx="26%" cy="18%" r="55%">
      <stop offset="0%" stop-color="${palette.light}" stop-opacity="0.30" />
      <stop offset="42%" stop-color="${palette.accent}" stop-opacity="${hookScene?.spotlight || "0.24"}" />
      <stop offset="100%" stop-color="${palette.dark}" stop-opacity="0" />
    </radialGradient>
    <radialGradient id="lightB" cx="78%" cy="68%" r="44%">
      <stop offset="0%" stop-color="${palette.light}" stop-opacity="0.18" />
      <stop offset="44%" stop-color="${palette.accent}" stop-opacity="${answerScene?.spotlight || "0.22"}" />
      <stop offset="100%" stop-color="${palette.dark}" stop-opacity="0" />
    </radialGradient>
    <linearGradient id="haze" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${palette.dark}" stop-opacity="0.08" />
      <stop offset="55%" stop-color="${palette.dark}" stop-opacity="0.18" />
      <stop offset="100%" stop-color="${palette.dark}" stop-opacity="0.42" />
    </linearGradient>
    <linearGradient id="panel" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${palette.dark}" stop-opacity="0.22" />
      <stop offset="100%" stop-color="${palette.dark}" stop-opacity="0.54" />
    </linearGradient>
    <linearGradient id="rail" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="${palette.accent}" stop-opacity="0.92" />
      <stop offset="100%" stop-color="${palette.light}" stop-opacity="0.26" />
    </linearGradient>
    <radialGradient id="vignette" cx="50%" cy="52%" r="68%">
      <stop offset="0%" stop-color="${palette.dark}" stop-opacity="0" />
      <stop offset="72%" stop-color="${palette.dark}" stop-opacity="0.08" />
      <stop offset="100%" stop-color="${palette.dark}" stop-opacity="0.34" />
    </radialGradient>
    <linearGradient id="roadTexture" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${palette.light}" stop-opacity="0.02" />
      <stop offset="100%" stop-color="${palette.dark}" stop-opacity="0.08" />
    </linearGradient>
    <pattern id="grainDots" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
      <circle cx="4" cy="6" r="1.1" fill="${palette.light}" opacity="0.04" />
      <circle cx="16" cy="12" r="0.9" fill="${palette.light}" opacity="0.03" />
      <circle cx="8" cy="20" r="0.8" fill="${palette.dark}" opacity="0.05" />
      <circle cx="22" cy="4" r="0.7" fill="${palette.light}" opacity="0.02" />
    </pattern>
    <pattern id="surfaceScratches" x="0" y="0" width="180" height="180" patternUnits="userSpaceOnUse">
      <path d="M 8 36 L 74 28" stroke="${palette.light}" stroke-width="1.4" opacity="0.035" />
      <path d="M 92 126 L 156 118" stroke="${palette.light}" stroke-width="1" opacity="0.03" />
      <path d="M 34 152 L 86 160" stroke="${palette.dark}" stroke-width="1.2" opacity="0.03" />
      <path d="M 124 42 L 162 52" stroke="${palette.dark}" stroke-width="1" opacity="0.025" />
    </pattern>
    <pattern id="compressionBlocks" x="0" y="0" width="96" height="96" patternUnits="userSpaceOnUse">
      <rect x="0" y="0" width="48" height="48" fill="${palette.light}" opacity="0.012" />
      <rect x="48" y="0" width="48" height="48" fill="${palette.dark}" opacity="0.016" />
      <rect x="0" y="48" width="48" height="48" fill="${palette.dark}" opacity="0.012" />
      <rect x="48" y="48" width="48" height="48" fill="${palette.light}" opacity="0.008" />
    </pattern>
    <filter id="blurShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="26" />
    </filter>
    <filter id="softBlur" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="10" />
    </filter>
    <filter id="backgroundBlur" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="6" />
    </filter>
    <filter id="directionalBlur" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="12 2.2" />
    </filter>
    <filter id="directionalBlurStrong" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="20 3.2" />
    </filter>
    <filter id="motionBlur" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="18 4" />
    </filter>
  </defs>

  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#bg)" />
  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#lightA)" />
  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#lightB)" />
  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#haze)" />
  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#grainDots)" opacity="0.9" />
  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#surfaceScratches)" opacity="0.7" />
  <path d="M 0 1702 C 260 1664, 536 1652, 816 1688 C 1098 1724, 1284 1764, 1440 1828 L 1440 2400 L 0 2400 Z" fill="url(#roadTexture)" opacity="0.62" />

  <circle cx="260" cy="360" r="310" fill="${palette.accent}" opacity="0.16" filter="url(#blurShadow)" />
  <circle cx="1180" cy="1640" r="260" fill="${palette.light}" opacity="0.08" filter="url(#blurShadow)" />
  <ellipse cx="798" cy="1088" rx="420" ry="242" fill="${palette.light}" opacity="0.06" filter="url(#blurShadow)" />

  <g opacity="0.22">
    <rect x="96" y="182" width="220" height="8" rx="4" ry="4" fill="${palette.light}" />
    <rect x="96" y="214" width="140" height="8" rx="4" ry="4" fill="${palette.light}" />
    <path d="M 106 246 C 210 238, 286 238, 348 248" stroke="${palette.light}" stroke-width="3" opacity="0.08" fill="none" />
  </g>

  ${worldObjects}
  ${cueBar}
  ${uiRetentionOverlay}
  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#vignette)" />
</svg>`;
}

function buildFallbackSvg({ videoId, palette }) {
  const signature = escapeXml(videoId.slice(-8).toUpperCase());
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
  <rect width="${WIDTH}" height="${HEIGHT}" fill="${palette.dark}" />
  <rect x="72" y="72" width="936" height="1776" rx="48" ry="48" fill="${palette.backgroundA}" opacity="0.94" />
  <rect x="120" y="130" width="840" height="1600" rx="40" ry="40" fill="${palette.backgroundB}" opacity="0.3" />
  <text x="140" y="260" font-family="Arial, Helvetica, sans-serif" font-size="120" font-weight="900" fill="${palette.light}" opacity="0.18">ADR</text>
  <text x="140" y="1650" font-family="Arial, Helvetica, sans-serif" font-size="34" font-weight="700" fill="${palette.light}" opacity="0.72">FALLBACK ${signature}</text>
</svg>`;
}

async function renderSvgToPng(svgPath, pngPath) {
  const outputDir = path.dirname(pngPath);
  const result = spawnSync("/usr/bin/qlmanage", ["-t", "-s", String(WIDTH), "-o", outputDir, svgPath], {
    encoding: "utf8",
    stdio: "pipe",
  });

  if (result.status !== 0) {
    throw new Error(
      [
        "Failed to render SVG to PNG via qlmanage.",
        result.stdout?.trim() ? `stdout:\n${result.stdout.trim()}` : null,
        result.stderr?.trim() ? `stderr:\n${result.stderr.trim()}` : null,
      ]
        .filter(Boolean)
        .join("\n"),
    );
  }

  const generatedPngPath = path.join(outputDir, `${path.basename(svgPath)}.png`);
  await rename(generatedPngPath, pngPath);
}

function validateGeneratedAsset({ videoId, assetPath }) {
  if (!videoId) {
    throw new Error("Generated visual asset requires a non-empty videoId.");
  }
  if (!text(assetPath).includes(`/generated/${videoId}/`)) {
    throw new Error(`Generated asset path does not include videoId boundary: ${assetPath}`);
  }
}

function assessHumanPresenceSvg(svgContent) {
  const svg = text(svgContent);
  const hasDriver = svg.includes('id="driver-group"');
  const hasInspector = svg.includes('id="inspector-group"');
  const hasDriverFace = svg.includes('id="driver-face-details"');
  const hasInspectorFace = svg.includes('id="inspector-face-details"');
  const hasHands =
    svg.includes('id="foreground-hand"') ||
    svg.includes('id="hook-blocking-hand"') ||
    svg.includes('id="motion-smear-hands"');
  const hasDocument =
    svg.includes('id="document-group"') ||
    svg.includes('id="foreground-document"') ||
    svg.includes('id="hook-close-document"');
  const hasCarInterior =
    svg.includes('id="steering-wheel-edge"') ||
    svg.includes('id="door-edge"') ||
    svg.includes('id="window-frame"') ||
    svg.includes('id="shoulder-silhouette"');
  const hasVehicleContext = svg.includes('id="truck-group"');
  const hasRoadsideContext =
    svg.includes('id="road-marks"') ||
    svg.includes('id="checkpoint-details"') ||
    svg.includes('id="skyline-layer"');
  const hasUiCards =
    svg.includes('id="narrative-cue-bar"') ||
    svg.includes('id="ui-retention-overlay"') ||
    svg.includes('id="answer-options-card"') ||
    svg.includes('id="telegram-phone"');
  const hasIllustrationSignals =
    svg.includes(">ADR</text>") ||
    svg.includes(">LICENSE</text>") ||
    svg.includes("TRAINING SCENARIO") ||
    svg.includes("ROADSIDE CHECK");

  const humanPresence =
    hasDriver &&
    hasInspector &&
    hasHands &&
    hasDocument &&
    hasCarInterior &&
    hasVehicleContext &&
    (hasDriverFace || hasInspectorFace);

  return {
    human_presence: humanPresence,
    driver_present: hasDriver,
    inspector_present: hasInspector,
    face_present: hasDriverFace || hasInspectorFace,
    hands_present: hasHands,
    document_present: hasDocument,
    car_interior_present: hasCarInterior,
    vehicle_context_present: hasVehicleContext,
    roadside_context_present: hasRoadsideContext,
    ui_overlay_present: hasUiCards,
    illustration_signal_present: hasIllustrationSignals,
    photorealistic_style_enforced: humanPresence && !hasUiCards && !hasIllustrationSignals,
  };
}

function assertPreviewSceneGate(validation, videoId) {
  const issues = [];
  if (!validation?.all_frames_pass) issues.push("all_frames_pass_false");
  for (const frame of Array.isArray(validation?.failed_reasons_by_frame) ? validation.failed_reasons_by_frame : []) {
    for (const reason of Array.isArray(frame?.failed_reasons) ? frame.failed_reasons : []) {
      issues.push(`${text(frame.id) || "frame"}:${reason}`);
    }
  }

  if (issues.length > 0) {
    throw new Error(
      `Generated QUESTION visual failed strict photoreal preview gate for ${videoId}: ${issues.join(", ")}`,
    );
  }
}

function validateSceneFrameManifest(frameManifest, sceneFramePaths, providerId, videoId) {
  if (!Array.isArray(frameManifest) || frameManifest.length === 0) {
    throw new Error(`Generated QUESTION visual missing required scene_frame_manifest for ${videoId}.`);
  }

  if (!Array.isArray(sceneFramePaths) || frameManifest.length !== sceneFramePaths.length) {
    throw new Error(
      `Generated QUESTION visual has misaligned scene_frame_manifest for ${videoId}: manifest=${Array.isArray(frameManifest) ? frameManifest.length : 0} frames=${Array.isArray(sceneFramePaths) ? sceneFramePaths.length : 0}`,
    );
  }

  frameManifest.forEach((entry, index) => {
    const expectedId = `scene${index + 1}`;
    if (text(entry?.canonical_id) !== expectedId) {
      throw new Error(
        `Generated QUESTION visual has invalid canonical scene ID for ${videoId}: expected=${expectedId} got=${text(entry?.canonical_id)}`,
      );
    }
    if (text(entry?.local_path) !== text(sceneFramePaths[index])) {
      throw new Error(
        `Generated QUESTION visual has mismatched scene manifest path for ${videoId}: expected=${text(sceneFramePaths[index])} got=${text(entry?.local_path)}`,
      );
    }
    if (!text(entry?.provider_id) || text(entry?.provider_id) !== text(providerId)) {
      throw new Error(
        `Generated QUESTION visual has invalid provider_id in scene_frame_manifest for ${videoId}: expected=${text(providerId)} got=${text(entry?.provider_id)}`,
      );
    }
  });
}

export async function generateQuestionVisualBundle({
  publicAssetBaseUrl,
  project = "adr-short-video",
  videoId,
  questionId,
  shortform,
  brief = null,
  variationTag = null,
  contentFamily,
  stagingRoot = path.join(os.tmpdir(), "adr-generated-assets-staging"),
}) {
  const safeVideoId = slugify(videoId);
  if (!safeVideoId) {
    throw new Error("videoId is required for generated visuals.");
  }

  await mkdir(stagingRoot, { recursive: true });
  const generatedDir = path.join(stagingRoot, safeVideoId);
  await mkdir(generatedDir, { recursive: false });

  const briefSeed = Array.isArray(brief?.slides)
    ? brief.slides.map((slide) => [slide.role, slide.scene_intent, slide.visual_hint, slide.copy].map(text).join(":")).join("|")
    : "";
  const derivedCompatBgPath = path.join(generatedDir, "bg.jpg");
  const manifestPath = path.join(generatedDir, "canva_manifest.json");
  const logPath = path.join(generatedDir, "render_log.json");
  const semanticTheme = detectSemanticTheme(shortform, brief);
  const theme = deriveEnvironmentProfile(safeVideoId, semanticTheme, variationTag);
  const descriptors = buildSceneDescriptors(brief, theme);
  const hookSnapshot = extractHookSnapshot(theme, descriptors);
  const questionText =
    text(shortform?.question_short) ||
    text(shortform?.hook) ||
    text(questionId);

  const photorealBundle = await generatePhotorealSceneFrames({
    generatedDir,
    questionText,
    brief,
    descriptors,
    contentFamily,
  });
  const primarySceneValidation = photorealBundle.summary;
  const fallbackUsed = false;
  const previewPass = Boolean(primarySceneValidation?.all_frames_pass) && !fallbackUsed;
  assertPreviewSceneGate(primarySceneValidation, safeVideoId);

  const leadFramePath = photorealBundle.framePaths[0];
  if (!leadFramePath) {
    throw new Error(`Photorealistic QUESTION generation returned no scene frames for ${safeVideoId}.`);
  }

  const sceneFrames = [...photorealBundle.framePaths];

  // Text zone validation: check that the center band of each frame is visually calm enough
  // for text overlay. Retry once with a text-zone-optimised prompt for any frame that fails.
  const textZoneResults = await validateTextZoneReadabilityBatch(sceneFrames);
  const textZoneLog = [];
  for (let i = 0; i < sceneFrames.length; i += 1) {
    const result = textZoneResults[i] || {};
    textZoneLog.push({ frame: i + 1, score: result.score, pass: result.pass, reason: result.reason });
    if (!result.pass) {
      const retryPath = path.join(generatedDir, `scene${i + 1}-tzretry.jpg`);
      try {
        const slideData = Array.isArray(brief?.slides) ? brief.slides[i] : null;
        if (slideData) {
          await regenerateSingleSceneFrame({ scene: slideData, questionText, outputPath: retryPath });
          const retryResult = await validateTextZoneReadabilityBatch([retryPath]);
          const retryScore = retryResult[0]?.score ?? 0;
          if (retryScore > (result.score ?? 0)) {
            sceneFrames[i] = retryPath;
            textZoneLog[i] = { ...textZoneLog[i], retry_score: retryScore, retry_used: true };
          } else {
            textZoneLog[i] = { ...textZoneLog[i], retry_score: retryScore, retry_used: false, retry_note: "original kept (higher score)" };
          }
        }
      } catch (retryErr) {
        textZoneLog[i] = { ...textZoneLog[i], retry_error: String(retryErr?.message || retryErr), retry_used: false };
      }
    }
  }
  await writeFile(
    path.join(generatedDir, "text_zone_validation.json"),
    `${JSON.stringify({ video_id: safeVideoId, frames: textZoneLog }, null, 2)}\n`,
    "utf8",
  );

  await postProcessFrames(sceneFrames).catch(() => {});

  const frameManifest = Array.isArray(photorealBundle.frameManifest)
    ? photorealBundle.frameManifest.map((entry, index) => ({
        ...entry,
        canonical_id: `scene${index + 1}`,
        scene_index: index + 1,
        local_path: sceneFrames[index],
      }))
    : null;
  validateSceneFrameManifest(frameManifest, sceneFrames, photorealBundle.provider_used, safeVideoId);
  await copyFile(sceneFrames[0] || leadFramePath, derivedCompatBgPath);
  const assetPath = leadFramePath;
  const assetFileName = path.basename(leadFramePath);

  const assetBuffer = await readFile(assetPath);
  const assetSha = sha256(assetBuffer);
  const assetUrl = `${String(publicAssetBaseUrl).replace(/\/$/, "")}/generated/${safeVideoId}/${assetFileName}`;

  validateGeneratedAsset({
    videoId: safeVideoId,
    assetPath: assetUrl,
  });

  const manifest = {
    project,
    format: "9:16",
    slides_count: ROLE_ORDER.length,
    mode: "generated-visual-mvp",
    source_type: "generated_visual",
    asset_family: "question_single_background_v1",
    render_family: "Question Card Short",
    batch_id: safeVideoId,
    brief_id: text(brief?.brief_id),
    trace_id: text(brief?.trace_id),
    variation: variationTag || null,
    semantic_theme: semanticTheme,
    hook_snapshot: hookSnapshot,
    real_scene_validation: {
      mode: "photoreal_raster_scene_frames",
      embedded_story_text_present: false,
      embedded_ui_overlay: Boolean(primarySceneValidation?.ui_overlay_present),
      driver_present: Boolean(primarySceneValidation?.driver_present),
      inspector_present: Boolean(primarySceneValidation?.inspector_present),
      face_present: Boolean(primarySceneValidation?.face_present),
      hands_present: Boolean(primarySceneValidation?.hands_present),
      document_present: Boolean(primarySceneValidation?.document_present),
      car_interior_present_any: Boolean(primarySceneValidation?.car_interior_present_any),
      vehicle_context_present_any: Boolean(primarySceneValidation?.vehicle_context_present_any),
      context_present: Boolean(primarySceneValidation?.context_present),
      roadside_context_present: Boolean(primarySceneValidation?.roadside_context_present),
      illustration_signal_present: Boolean(primarySceneValidation?.illustration_signal_present),
      photorealistic_style_enforced: Boolean(primarySceneValidation?.photorealistic_style_enforced),
      preview_pass: previewPass,
      all_frames_pass: Boolean(primarySceneValidation?.all_frames_pass),
      per_frame_pass: Array.isArray(primarySceneValidation?.per_frame_pass)
        ? primarySceneValidation.per_frame_pass
        : [],
      failed_reasons_by_frame: Array.isArray(primarySceneValidation?.failed_reasons_by_frame)
        ? primarySceneValidation.failed_reasons_by_frame
        : [],
      human_presence: Boolean(primarySceneValidation?.human_presence),
      human_presence_derived_legacy: true,
      fallback_used: fallbackUsed,
      pass: previewPass,
      vision_frames: photorealBundle.validation?.images || [],
      provider_used: text(photorealBundle.provider_used),
      provider_attempts: Array.isArray(photorealBundle.provider_attempts)
        ? photorealBundle.provider_attempts
        : [],
    },
    batch_fingerprint: sha256(
      JSON.stringify({
        video_id: safeVideoId,
        question_id: questionId,
        asset_sha256: assetSha,
        brief_seed: briefSeed,
      }),
    ),
    updated_at: new Date().toISOString(),
    slides: ROLE_ORDER.map((role, index) => ({
      id: index + 1,
      name: `slide${index + 1}`,
      role,
      scene_intent: text(brief?.slides?.find((slide) => text(slide.role) === role)?.scene_intent),
      visual_hint: text(brief?.slides?.find((slide) => text(slide.role) === role)?.visual_hint),
      subject: text(brief?.slides?.find((slide) => text(slide.role) === role)?.subject),
      context: text(brief?.slides?.find((slide) => text(slide.role) === role)?.context),
      tension: text(brief?.slides?.find((slide) => text(slide.role) === role)?.tension),
      url: assetUrl,
      sha256: assetSha,
      width: WIDTH,
      height: HEIGHT,
    })),
  };

  const logEntry = {
    video_id: safeVideoId,
    question_id: text(questionId),
    brief_id: text(brief?.brief_id),
    trace_id: text(brief?.trace_id),
    asset_path: assetUrl,
    asset_sha256: assetSha,
    render_timestamp: new Date().toISOString(),
    fallback_used: fallbackUsed,
    preview_pass: previewPass,
    all_frames_pass: Boolean(primarySceneValidation?.all_frames_pass),
    per_frame_pass: Array.isArray(primarySceneValidation?.per_frame_pass)
      ? primarySceneValidation.per_frame_pass
      : [],
    failed_reasons_by_frame: Array.isArray(primarySceneValidation?.failed_reasons_by_frame)
      ? primarySceneValidation.failed_reasons_by_frame
      : [],
    context_present: Boolean(primarySceneValidation?.context_present),
    human_presence: Boolean(primarySceneValidation?.human_presence),
    human_presence_derived_legacy: true,
    hook_snapshot: hookSnapshot,
    provider_used: text(photorealBundle.provider_used),
    provider_attempts: Array.isArray(photorealBundle.provider_attempts)
      ? photorealBundle.provider_attempts
      : [],
  };

  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  await writeFile(logPath, `${JSON.stringify(logEntry, null, 2)}\n`, "utf8");

  return {
    video_id: safeVideoId,
    question_id: text(questionId),
    generated_dir: generatedDir,
    asset_path: assetPath,
    asset_url: assetUrl,
    asset_sha256: assetSha,
    manifest_path: manifestPath,
    log_path: logPath,
    fallback_used: fallbackUsed,
    preview_pass: previewPass,
    all_frames_pass: Boolean(primarySceneValidation?.all_frames_pass),
    per_frame_pass: Array.isArray(primarySceneValidation?.per_frame_pass)
      ? primarySceneValidation.per_frame_pass
      : [],
    failed_reasons_by_frame: Array.isArray(primarySceneValidation?.failed_reasons_by_frame)
      ? primarySceneValidation.failed_reasons_by_frame
      : [],
    context_present: Boolean(primarySceneValidation?.context_present),
    human_presence: Boolean(primarySceneValidation?.human_presence),
    human_presence_derived_legacy: true,
    hook_snapshot: hookSnapshot,
    scene_frame_paths: sceneFrames,
    scene_frame_manifest: frameManifest,
    provider_used: text(photorealBundle.provider_used),
    provider_attempts: Array.isArray(photorealBundle.provider_attempts)
      ? photorealBundle.provider_attempts
      : [],
  };
}
