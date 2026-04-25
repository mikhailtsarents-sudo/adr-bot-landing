import sharp from "sharp";
import path from "node:path";

// Post-process generated frames to produce consistent brand look:
// slightly brighter, slightly more saturated, soft contrast lift.
// Values are intentionally subtle — ADR content must look professional not candy.
const SATURATION = 1.10;
const BRIGHTNESS = 1.04;
const LINEAR_SLOPE = 1.05;
const LINEAR_OFFSET = -8;

export async function postProcessFrame(inputPath, outputPath) {
  const dest = outputPath || inputPath;
  await sharp(inputPath)
    .modulate({ saturation: SATURATION, brightness: BRIGHTNESS })
    .linear(LINEAR_SLOPE, LINEAR_OFFSET)
    .jpeg({ quality: 92, progressive: true })
    .toFile(dest + ".tmp.jpg");

  const { rename } = await import("node:fs/promises");
  await rename(dest + ".tmp.jpg", dest);
  return dest;
}

export async function postProcessFrames(framePaths) {
  const results = [];
  for (const framePath of framePaths) {
    try {
      await postProcessFrame(framePath, framePath);
      results.push({ path: framePath, ok: true });
    } catch (err) {
      results.push({ path: framePath, ok: false, error: String(err?.message || err) });
    }
  }
  return results;
}
