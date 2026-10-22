import type { P3 } from "./network";
import type { Surface } from "./surfaces";
import { closeProjectionSurface } from "./projectionClosure";
import { thicknessImage } from "./radiograph";

/** Relative image formation. Coefficients/window are illustrative, not calibrated. */
export function projectThickness(surfaces: Surface[], project: (point: P3) => [number, number, number], width: number, height: number, samples = 2) {
  surfaces = surfaces.map((surface) => closeProjectionSurface(surface).surface);
  const factor = Math.max(1, Math.min(2, Math.round(samples)));
  if (factor === 1) return thicknessImage(surfaces, project, width, height);
  const high = thicknessImage(surfaces, (point) => {
    const [x, y, z] = project(point); return [x * factor, y * factor, z];
  }, width * factor, height * factor);
  const result = new Float32Array(width * height);
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    let total = 0;
    for (let sy = 0; sy < factor; sy++) for (let sx = 0; sx < factor; sx++)
      total += high[(y * factor + sy) * width * factor + x * factor + sx];
    result[y * width + x] = total / (factor * factor);
  }
  return result;
}

/** Small detector point-spread kernel, preserving the integrated signal. */
export function detectorBlur(input: Float32Array, width: number, height: number) {
  const row = new Float32Array(input.length), output = new Float32Array(input.length);
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const at = y * width + x;
    row[at] = (input[y * width + Math.max(0, x - 1)] + 6 * input[at] + input[y * width + Math.min(width - 1, x + 1)]) / 8;
  }
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const at = y * width + x;
    output[at] = (row[Math.max(0, y - 1) * width + x] + 6 * row[at] + row[Math.min(height - 1, y + 1) * width + x]) / 8;
  }
  return output;
}
export function detectorExposure(bone: number, iodine: number, concentration = 1) {
  return Math.exp(-Math.min(20, 0.45 * Math.max(0, bone) + 2.2 * Math.max(0, iodine) * Math.max(0, concentration)));
}
export function logSubtraction(mask: number, live: number) {
  return Math.log(Math.max(1e-9, mask) / Math.max(1e-9, live));
}
export function contrastOverlay(thickness: Float32Array, width: number, height: number, concentration = 1, inverted = false) {
  const signal = detectorBlur(thickness, width, height), pixels = new Uint8ClampedArray(signal.length * 4);
  for (let i = 0; i < signal.length; i++) {
    const dsa = logSubtraction(1, detectorExposure(0, signal[i], concentration));
    const alpha = Math.min(0.97, Math.max(0, dsa / 1.7));
    pixels[i * 4] = pixels[i * 4 + 1] = pixels[i * 4 + 2] = inverted ? 245 : 24;
    pixels[i * 4 + 3] = 255 * alpha;
  }
  return pixels;
}
export function detectorImage(vessels: Float32Array, bone: Float32Array | null, width: number, height: number, boneOpacity = 0, concentration = 1) {
  const iodine = detectorBlur(vessels, width, height);
  const osseous = bone ? detectorBlur(bone, width, height) : null;
  const pixels = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < iodine.length; i++) {
    const background = (osseous?.[i] ?? 0) * boneOpacity;
    const mask = detectorExposure(background, 0), live = detectorExposure(background, iodine[i], concentration);
    // Native acquisition: photon transmission. DSA: log(mask/live), then window.
    const display = boneOpacity > 0 ? 28 + 200 * live : 228 - 204 * Math.min(1, Math.max(0, logSubtraction(mask, live) / 1.7));
    pixels[i * 4] = pixels[i * 4 + 1] = pixels[i * 4 + 2] = display;
    pixels[i * 4 + 3] = 255;
  }
  return pixels;
}
