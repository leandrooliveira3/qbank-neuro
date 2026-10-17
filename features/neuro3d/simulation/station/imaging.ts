import { P3, Network, pointAt, trackPoints, locate } from "./network";
import { StationState, View, opacifiedEdges, caseFor } from "./engine";
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
export function project(p: P3, v: View, plane = 0): [number, number] {
  const [x, y] = projectSpatial(p, v, plane);
  return [x, y];
}
export function imagePath(points: P3[], v: View, plane = 0) {
  return points
    .map((p, i) => {
      const [x, y] = project(p, v, plane);
      return `${i ? "L" : "M"}${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");
}
export function vesselPath(
  n: Network,
  id: string,
  v: View,
  plane = 0,
  limit = 1,
) {
  return imagePath(
    Array.from({ length: 24 }, (_, i) => pointAt(n[id], (i / 23) * limit)),
    v,
    plane,
  );
}
// Smooth focal narrowing, in schematic units; not a NASCET measurement.
export function lumenFactor(t: number, center: number, dilation: number) {
  return (
    1 - 0.65 * (1 - dilation) * Math.exp(-Math.pow((t - center) / 0.09, 2))
  );
}
export function vesselSegments(
  s: StationState,
  n: Network,
  id: string,
  view: View,
  plane = 0,
  clot = s.clot,
  dilation = s.dilation,
) {
  const c = caseFor(s),
    limit = clot && id === c.target ? c.targetT : 1;
  const focal = c.kind === "carotid" && id === c.target;
  return Array.from({ length: focal ? 40 : 1 }, (_, i) => {
    const count = focal ? 40 : 1,
      t0 = (i / count) * limit,
      t1 = ((i + 1) / count) * limit;
    const points = Array.from({ length: focal ? 2 : 24 }, (_, j) =>
      pointAt(n[id], t0 + ((t1 - t0) * j) / (focal ? 1 : 23)),
    );
    return {
      id: `${id}-${i}`,
      path: imagePath(points, view, plane),
      width:
        n[id].radius *
        24 *
        view.zoom *
        (focal ? lumenFactor((t0 + t1) / 2, c.targetT, dilation) : 1),
    };
  });
}
export function maskLines(s: StationState, n: Network, plane = 0) {
  const mask = s.mask;
  if (!mask) return [];
  return mask.edges.flatMap((id) =>
    vesselSegments(s, n, id, mask.view, plane, mask.clot, mask.dilation),
  );
}
export function devicePoints(s: StationState, n: Network) {
  const d = s.device;
  if (!d) return [];
  const p = locate(n, d.track).point;
  const r = 0.13 + d.open * 0.26;
  return Array.from({ length: 40 }, (_, i) => {
    const a = (i / 39) * Math.PI * 8;
    return [
      p[0] + Math.cos(a) * r,
      p[1] + (i / 39 - 0.5) * (d.family === "coil" ? 0.7 : 1.4),
      p[2] + Math.sin(a) * r,
    ] as P3;
  });
}
export function statusLabel(s: StationState) {
  return s.acquiring > 0
    ? "AQUISIÇÃO DSA"
    : s.pedal
      ? s.mode === "roadmap"
        ? "ROADMAP AO VIVO"
        : "FLUOROSCOPIA"
      : "ÚLTIMA IMAGEM · RX PAUSADO";
}
