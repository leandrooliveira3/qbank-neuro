import data from "../../arch-profiles.json";
import type { P3, Network } from "./network";
export type ArchProfile = "source" | "I" | "II" | "III";
const smooth = (value: number) => { const t = Math.max(0, Math.min(1, value)); return t * t * (3 - 2 * t); };
/** Smooth source-frame educational warp, applied identically to meshes and navigation.
 * Positive vertical Jacobian bound is recorded for each synthetic profile.
 */
export function morphArchPoint(point: P3, profile: ArchProfile): P3 {
  if (profile === "source") return [...point];
  const [x, y, z] = point, anchor = data.apexAnchor;
  const weight = Math.exp(-((x - anchor[0]) ** 2 + (z - anchor[2]) ** 2) / (2 * data.sigmaCm ** 2));
  const gate = smooth((y + 45) / 20) * (1 - smooth((y + 15) / 20));
  return [x, y + data.profiles[profile].amplitudeCm * weight * gate, z];
}
export function morphNetwork(network: Network, profile: ArchProfile): Network {
  if (profile === "source") return network;
  return Object.fromEntries(Object.entries(network).map(([id, route]) => [id, {
    ...route, points: route.points.map((point) => morphArchPoint(point, profile)),
    junctionGapCm: route.junctionGapCm ? (() => {
      const at = route.junctionAtEnd ? route.points.length - 2 : 0;
      const a = morphArchPoint(route.points[at], profile), b = morphArchPoint(route.points[at + 1], profile);
      return Math.hypot(...a.map((value, k) => value - b[k]));
    })() : route.junctionGapCm,
  }]));
}
export const archProfileNames: Record<ArchProfile, string> = {source: "Geometria original", I: "Tipo I · didático", II: "Tipo II · didático", III: "Tipo III · didático"};
export const archProfileData = data;
