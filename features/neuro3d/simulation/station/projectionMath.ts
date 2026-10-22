import type { P3 } from "./network";
import type { View } from "./engine";
export const WIDTH = 600,
  HEIGHT = 560;
export function projectSpatial(p: P3, v: View, plane = 0): [number, number, number] {
  // The historical plane=90 argument identifies detector B. Its angles
  // are absolute and independent; they are not offsets from detector A.
  const yaw = ((plane === 90 ? v.yawB : v.yaw + plane) * Math.PI) / 180,
    pitch = ((plane === 90 ? v.pitchB : v.pitch) * Math.PI) / 180;
  const x = p[0] * Math.cos(yaw) - p[2] * Math.sin(yaw),
    z = p[0] * Math.sin(yaw) + p[2] * Math.cos(yaw),
    y = p[1] * Math.cos(pitch) - z * Math.sin(pitch);
  const scale = 12 * v.zoom;
  return [WIDTH / 2 + (x + v.panX) * scale, HEIGHT / 2 - (y + v.panY) * scale, p[1] * Math.sin(pitch) + z * Math.cos(pitch)];
}
