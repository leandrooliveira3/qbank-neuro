import { projectThickness, detectorImage } from "./simulation/station/detector";
import type { ReferenceSurface } from "./simulation/station/referenceGeometry";
import { projectSpatial, WIDTH, HEIGHT } from "./simulation/station/projectionMath";
import type { View } from "./simulation/station/engine";
export interface AtlasProjectionRequest {
  id: number; view: View; contrastLayer: string; layers: Record<string, number>;
  selected: string | null; isolate: boolean; boneOpacity: number; hidden?: string[];
}
/** Shared source surfaces only. Gold is an annotation, never radiographic signal. */
export function renderAtlasRadiograph(geometry: ReferenceSurface[], request: AtlasProjectionRequest) {
  const {contrastLayer, layers, selected, isolate, boneOpacity, view} = request;
  const visible = geometry.filter(surface => !request.hidden?.includes(surface.id));
  const vessels = visible.filter(surface =>
    (contrastLayer === "both" ? ["arterial", "venous"].includes(surface.layer) : surface.layer === contrastLayer) &&
    (layers[surface.layer] ?? 0) > 0 && (!isolate || !selected || surface.id === selected));
  const project = (point: [number, number, number]) => projectSpatial(point, view);
  const contrast = projectThickness(vessels, project, WIDTH, HEIGHT);
  const bones = boneOpacity > 0 ? projectThickness(visible.filter(surface => surface.layer === "bone"), project, WIDTH, HEIGHT) : null;
  const pixels = detectorImage(contrast, bones, WIDTH, HEIGHT, boneOpacity);
  const selectedSurface = selected ? visible.find(surface => surface.id === selected && (layers[surface.layer] ?? 0) > 0 && (surface.layer !== "bone" || boneOpacity > 0)) : undefined;
  if (selectedSurface) {
    const mask = projectThickness([selectedSurface], project, WIDTH, HEIGHT);
    for (let y = 1; y < HEIGHT - 1; y++) for (let x = 1; x < WIDTH - 1; x++) {
      const i = y * WIDTH + x;
      if (mask[i] <= 0) continue;
      const edge = mask[i - 1] <= 0 || mask[i + 1] <= 0 || mask[i - WIDTH] <= 0 || mask[i + WIDTH] <= 0;
      const alpha = edge ? .95 : .2;
      [255, 199, 54].forEach((value, k) => { pixels[i * 4 + k] = Math.round(pixels[i * 4 + k] * (1 - alpha) + value * alpha); });
    }
  }
  return pixels;
}
