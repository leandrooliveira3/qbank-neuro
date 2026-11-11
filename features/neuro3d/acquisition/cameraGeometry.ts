import type { AngiographyPose } from "../angiographyPose";
import { HEIGHT, WIDTH } from "../simulation/station/projectionMath";
export function orthographicField(width: number, height: number, zoom: number) {
  if (
    !Number.isFinite(width) ||
    !Number.isFinite(height) ||
    !Number.isFinite(zoom) ||
    width <= 0 ||
    height <= 0 ||
    zoom <= 0
  )
    throw Error("Campo de visualização inválido.");
  const scale = Math.min(width / WIDTH, height / HEIGHT),
    halfWidth = width / (24 * zoom * scale),
    halfHeight = height / (24 * zoom * scale);
  return {
    left: -halfWidth,
    right: halfWidth,
    top: halfHeight,
    bottom: -halfHeight,
    scale,
  };
}
/** Requested commands, resize and ordinary rerenders preserve the source-world field. */
export function requestedInspectionPose(
  previous: AngiographyPose,
  command: AngiographyPose | undefined,
) {
  const p = command || previous;
  return { ...p, center: [...p.center] as [number, number, number] };
}
/** Equivalent detector magnification on the observer's target plane only. */
export function perspectiveDistance(
  width: number,
  height: number,
  zoom: number,
  fov: number,
) {
  const field = orthographicField(width, height, zoom);
  if (!Number.isFinite(fov) || fov <= 0 || fov >= 180)
    throw Error("Campo angular inválido.");
  return height / (24 * zoom * field.scale * Math.tan((fov * Math.PI) / 360));
}
export function perspectiveMagnification(
  width: number,
  height: number,
  distance: number,
  fov: number,
) {
  if (!Number.isFinite(distance) || distance <= 0)
    throw Error("Distância de inspeção inválida.");
  return perspectiveDistance(width, height, 1, fov) / distance;
}
