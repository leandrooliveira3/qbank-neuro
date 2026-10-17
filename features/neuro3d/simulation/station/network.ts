import { data } from "../../model";
export type P3 = [number, number, number];
export interface Vessel {
  id: string;
  name: string;
  anatomicalId: string;
  points: P3[];
  radius: number;
  children: string[];
  synthetic?: boolean;
  sourceId?: string;
  sourceRange?: [number, number];
  sourceReverse?: boolean;
  visualBranches?: string[];
  junctionGapCm?: number;
  syntheticJunction?: boolean;
}
export type Network = Record<string, Vessel>;
const copy = (p: number[]) => [...p] as P3;
export const distance = (a: P3, b: P3) =>
  Math.hypot(...a.map((x, i) => x - b[i]));
export const mix = (a: P3, b: P3, t: number) =>
  a.map((x, i) => x + (b[i] - x) * t) as P3;
export function edgeLength(v: Vessel) {
  return v.points.slice(1).reduce((s, p, i) => s + distance(v.points[i], p), 0);
}
export function pointAt(v: Vessel, t: number): P3 {
  let d = Math.max(0, Math.min(1, t)) * edgeLength(v);
  for (let i = 1; i < v.points.length; i++) {
    const l = distance(v.points[i - 1], v.points[i]);
    if (d <= l) return mix(v.points[i - 1], v.points[i], l ? d / l : 0);
    d -= l;
  }
  return copy(v.points.at(-1)!);
}
export function makeNetwork(aneurysm = false): Network {
  const net: Network = {};
  const add = (
    id: string,
    name: string,
    points: P3[],
    radius: number,
    anatomicalId = id,
    synthetic = false,
  ) =>
    (net[id] = {
      id,
      name,
      points,
      radius,
      anatomicalId,
      synthetic,
      children: [],
    });
  const arch = (id: string) => data.scenes.arch.find((o) => o.id === id)!;
  const transformArch = (p: number[]) => [p[0], p[1] - 14, p[2]] as P3;
  const arc = arch("ao_arco").points.map(transformArch);
  add(
    "access",
    "Acesso virtual → aorta descendente",
    [
      [2.58, -20, -0.1],
      ...arch("ao_desc").points.slice().reverse().map(transformArch),
    ],
    0.35,
    "ao_desc",
    true,
  );
  for (let i = arc.length - 1; i > 0; i--)
    add(`arch-${i}`, "Arco aórtico", [arc[i], arc[i - 1]], 0.35, "ao_arco");
  net.access.children = [`arch-${arc.length - 1}`];
  for (let i = arc.length - 1; i > 1; i--)
    net[`arch-${i}`].children = [`arch-${i - 1}`];
  const attach = (child: string, parent: string) =>
    net[parent].children.push(child);
  for (const [id, parent] of [
    ["braquio", "arch-2"],
    ["car_L", "arch-4"],
    ["sub_L", "arch-5"],
  ] as const) {
    const a = arch(id);
    const start = net[parent].points.at(-1)!;
    add(
      id,
      a.name,
      [copy(start), ...a.points.slice(1).map(transformArch)],
      a.radius,
      id,
    );
    attach(id, parent);
  }
  for (const id of ["car_R", "sub_R"]) {
    const a = arch(id);
    add(id, a.name, a.points.map(transformArch), a.radius, id);
    attach(id, "braquio");
  }
  const circleTranslate = (p: number[]) => [p[0], p[1] + 4, p[2]] as P3;
  for (const o of data.scenes.circle) {
    if (o.id.startsWith("CI-ICA")) continue;
    add(o.id, o.name, o.points.map(circleTranslate), o.radius, o.id);
  }
  for (const side of ["L", "R"] as const) {
    const start = copy(net[`car_${side}`].points.at(-1)!);
    const end = circleTranslate(
      data.scenes.circle.find((o) => o.id === `CI-ICA-${side}`)!.points.at(-1)!,
    );
    const transform = (p: number[]) => {
      const f = (p[1] + 3.7) / 10.15;
      return [
        start[0] +
          (end[0] - start[0]) * f +
          (p[0] - 1.61 * f) * (side === "L" ? -0.8 : 0.8),
        start[1] + (end[1] - start[1]) * f,
        start[2] + (end[2] - start[2]) * f + (p[2] - 0.68 * f),
      ] as P3;
    };
    for (let i = 1; i <= 7; i++) {
      const o = data.scenes.aci.find((o) => o.id === `ICA-C${i}`)!;
      add(
        `ICA-${side}-C${i}`,
        `${o.name} ${side === "L" ? "E" : "D"}`,
        o.points.map(transform),
        o.radius,
        o.id,
        true,
      );
    }
    net[`car_${side}`].children = [`ICA-${side}-C1`, `ECA-${side}`];
    add(
      `ECA-${side}`,
      `Carótida externa ${side === "L" ? "E" : "D"}`,
      [
        start,
        [start[0] + (side === "L" ? -1 : 1), start[1] + 1.6, 1],
        [start[0] + (side === "L" ? -1.4 : 1.4), start[1] + 3.3, 1.2],
      ],
      0.1,
      "ECA",
      true,
    );
    for (let i = 1; i < 7; i++)
      net[`ICA-${side}-C${i}`].children = [`ICA-${side}-C${i + 1}`];
    net[`ICA-${side}-C7`].children = [`CI-M1${side}`, `CI-A1${side}`];
    net[`CI-M1${side}`].children = [`CI-M2${side}s`, `CI-M2${side}i`];
    net[`CI-A1${side}`].children = [`CI-A2${side}`];
  }
  for (const side of ["L", "R"] as const) {
    const id = `vert_${side}`,
      a = arch(id),
      sub = net[`sub_${side}`];
    add(
      id,
      a.name,
      [
        copy(sub.points.at(-1)!),
        ...a.points.slice(1).map(transformArch),
        copy(net["CI-BA"].points[0]),
      ],
      a.radius,
      id,
      true,
    );
    sub.children = [id];
    net[id].children = ["CI-BA"];
  }
  net["CI-BA"].children = ["CI-P1L", "CI-P1R"];
  if (aneurysm) {
    const e = net["ICA-L-C6"],
      p = pointAt(e, 0.55),
      end = copy(e.points.at(-1)!);
    e.points = [e.points[0], p];
    add("ICA-L-C6d", "C6 distal E", [p, end], e.radius, "ICA-C6");
    net["ICA-L-C6d"].children = ["ICA-L-C7"];
    add(
      "sac",
      "Saco aneurismático",
      [
        p,
        [p[0] - 0.65, p[1] + 0.1, p[2] + 0.6],
        [p[0] - 1.2, p[1] + 0.5, p[2] + 0.85],
      ],
      0.48,
      "lesion-aneurysm",
      true,
    );
    e.children = ["ICA-L-C6d", "sac"];
  }
  return net;
}
export interface Track {
  path: string[];
  depth: number;
}
export function totalLength(n: Network, path: string[]) {
  return path.reduce((s, id) => s + edgeLength(n[id]), 0);
}
export function locate(n: Network, track: Track) {
  let d = Math.max(0, track.depth);
  for (const id of track.path) {
    const v = n[id],
      l = edgeLength(v);
    if (d <= l)
      return { edge: id, t: l ? d / l : 0, point: pointAt(v, l ? d / l : 0) };
    d -= l;
  }
  const id = track.path.at(-1) || "access";
  return { edge: id, t: 1, point: pointAt(n[id], 1) };
}
export function trackPoints(n: Network, track: Track): P3[] {
  const out: P3[] = [];
  let remaining = Math.max(0, track.depth);
  for (const id of track.path) {
    const v = n[id],
      l = edgeLength(v),
      length = Math.min(l, remaining);
    const count = Math.max(2, Math.ceil(length / 0.16));
    for (let i = 0; i <= count; i++)
      out.push(pointAt(v, ((length / l) * i) / count));
    remaining -= length;
    if (remaining <= 0) break;
  }
  return out;
}
export function targetTrack(n: Network, edge: string, t = 0.5): Track {
  const search = (
    id: string,
    path: string[],
    seen: Set<string>,
  ): string[] | null => {
    if (id === edge) return [...path, id];
    if (seen.has(id)) return null;
    const next = new Set(seen).add(id);
    for (const c of n[id].children) {
      const p = search(c, [...path, id], next);
      if (p) return p;
    }
    return null;
  };
  const path = search("access", [], new Set()) || ["access"];
  return {
    path,
    depth: totalLength(n, path.slice(0, -1)) + edgeLength(n[path.at(-1)!]) * t,
  };
}
