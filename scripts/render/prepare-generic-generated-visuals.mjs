import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { generateQuestionVisualBundle } from "./generate-question-visual-assets.mjs";
import { uploadFileToTemporaryHost } from "../runtime/temporary-upload.mjs";

const ROLE_SCENE_INDEX = {
  hook: 0,
  question: 1,
  answers: 2,
  timer: 1,
  answer: 2,
  cta: 2,
};

function text(value) {
  return value == null ? "" : String(value).trim();
}

async function loadJson(filePath) {
  return JSON.parse(await readFile(filePath, "utf8"));
}

function buildRenderSlideUrls(sceneAssetUrls, slides) {
  const fallbackUrl = sceneAssetUrls[sceneAssetUrls.length - 1] || "";
  return (Array.isArray(slides) ? slides : []).map((slide) => {
    const role = text(slide?.role);
    return sceneAssetUrls[ROLE_SCENE_INDEX[role] ?? sceneAssetUrls.length - 1] || fallbackUrl;
  });
}

export async function prepareGenericGeneratedVisualPackage({
  publicAssetBaseUrl,
  project = "adr-short-video",
  videoId,
  sourceId,
  shortform,
  brief,
  contentFamily,
  diagnosticsDir,
  stagingRoot,
}) {
  const visualBundle = await generateQuestionVisualBundle({
    publicAssetBaseUrl,
    project,
    videoId,
    questionId: sourceId,
    shortform,
    brief,
    contentFamily,
    stagingRoot,
  });

  const baseManifest = await loadJson(visualBundle.manifest_path);
  const frameManifest = Array.isArray(visualBundle.scene_frame_manifest)
    ? visualBundle.scene_frame_manifest
    : [];

  const sceneUploads = [];
  for (let index = 0; index < frameManifest.length; index += 1) {
    const frame = frameManifest[index];
    const uploaded = await uploadFileToTemporaryHost(frame.local_path, {
      diagnosticsDir,
      frameId: text(frame.canonical_id) || `scene${index + 1}`,
    });
    sceneUploads.push({
      scene_index: Number(frame.scene_index || index + 1),
      canonical_id: text(frame.canonical_id) || `scene${index + 1}`,
      local_path: text(frame.local_path),
      uploaded_url: uploaded.uploadedUrl,
    });
  }

  const sceneAssetUrls = sceneUploads.map((item) => item.uploaded_url).filter(Boolean);
  const renderSlideUrls = buildRenderSlideUrls(sceneAssetUrls, baseManifest.slides);
  const overriddenManifest = {
    ...baseManifest,
    slides: (Array.isArray(baseManifest.slides) ? baseManifest.slides : []).map((slide, index) => ({
      ...slide,
      url: renderSlideUrls[index] || text(slide.url),
    })),
  };
  const overrideManifestPath = path.join(visualBundle.generated_dir, "generated_manifest.override.json");
  await writeFile(overrideManifestPath, `${JSON.stringify(overriddenManifest, null, 2)}\n`, "utf8");
  await writeFile(
    path.join(visualBundle.generated_dir, "generated_scene_uploads.json"),
    `${JSON.stringify({
      created_at: new Date().toISOString(),
      scene_uploads: sceneUploads,
      render_slide_urls: renderSlideUrls,
    }, null, 2)}\n`,
    "utf8",
  );

  return {
    ...visualBundle,
    asset_url: sceneAssetUrls[0] || text(visualBundle.asset_url),
    scene_asset_urls: sceneAssetUrls,
    render_slide_urls: renderSlideUrls,
    manifest_path: overrideManifestPath,
    uploaded_scene_assets: sceneUploads,
  };
}
