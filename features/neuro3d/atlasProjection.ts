import type { P3 } from "./simulation/station/network";
import type { View } from "./simulation/station/engine";
import { projectSpatial, WIDTH, HEIGHT } from "./simulation/station/projectionMath";

/** Move the detector field, never the source anatomy. */
export function atlasProjection(yaw: number, pitch: number, zoom: number, center: P3 = [0, 0, 0]): View {
  const view: View = { yaw, pitch, yawB: 90, pitchB: 0, zoom, panX: 0, panY: 0, gain: 1, collimation: 100, boneOpacity: 1 };
  const [x, y] = projectSpatial(center, view);
  return { ...view, panX: (WIDTH / 2 - x) / (12 * zoom), panY: (y - HEIGHT / 2) / (12 * zoom) };
}
export function unprojectAtlasPixel(px: number, py: number, depth: number, view: View): P3 {
  const yaw = view.yaw * Math.PI / 180, pitch = view.pitch * Math.PI / 180;
  const x = (px - WIDTH / 2) / (12 * view.zoom) - view.panX;
  const y = -(py - HEIGHT / 2) / (12 * view.zoom) - view.panY;
  const wy = y * Math.cos(pitch) + depth * Math.sin(pitch);
  const wz = -y * Math.sin(pitch) + depth * Math.cos(pitch);
  return [x * Math.cos(yaw) + wz * Math.sin(yaw), wy, -x * Math.sin(yaw) + wz * Math.cos(yaw)];
}
