import type { P3 } from "./simulation/station/network";

export interface AngiographyPose { yaw: number; pitch: number; zoom: number; center: P3 }
export function directionFromAngles(yaw: number, pitch: number): P3 {
  const y = yaw * Math.PI / 180, p = pitch * Math.PI / 180;
  return [Math.sin(y) * Math.cos(p), Math.sin(p), Math.cos(y) * Math.cos(p)];
}
export function anglesFromDirection(direction: P3) {
  const length = Math.hypot(...direction);
  return { yaw: Math.atan2(direction[0], direction[2]) * 180 / Math.PI,
    pitch: Math.asin(Math.max(-1, Math.min(1, direction[1] / length))) * 180 / Math.PI };
}
