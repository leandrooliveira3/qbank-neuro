import { reconstructedArteries } from "../../reconstructedArteries";
import { useEffect, useState, useMemo } from "react";
import supraAortic from "../../reference-supra-aortic.json";
import landmarks from "../../reference-landmarks.json";
import distal from "../../reference-distal-aca.json";
import metadata from "../../reference-surfaces.json";
import bodyData from "../../reference-body-access-network.json";
import bodyPack from "../../reference-body-access.json";
import { morphArchPoint, type ArchProfile } from "./archMorphology";
import accessData from "../../reference-access-network.json";
import networkData from "../../reference-network.json";
import type { P3, Vessel } from "./network";
import type { Surface } from "./surfaces";
import { sourceFraction } from "./referenceNetwork";

export interface ReferenceSurface extends Surface {
  id: string; layer: string; positions: Float32Array; indices: Uint32Array; t?: Float32Array; axis?: P3[]; axisDistances?: number[];
}
export type ReferenceGeometry = Map<string, ReferenceSurface>;
const sourceAxes = { ...networkData.originalAxes, ...accessData.originalAxes, ...bodyData.originalAxes };
let request: Promise<ReferenceGeometry> | null = null;
export function loadReferenceGeometry() {
  if (!request) request = (async () => {
    const supplementaryRequest = Promise.all([distal, landmarks, supraAortic, bodyPack].map(async (pack) => {
      const response = await fetch(`${import.meta.env.BASE_URL}neuro3d/open-anatomy/${pack.file}`);
      if (!response.ok) throw new Error("Não foi possível carregar as superfícies complementares.");
      const bytes = await response.arrayBuffer();
      if (bytes.byteLength !== pack.size) throw new Error("Geometria complementar incompleta.");
      const hash = Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", bytes))).map((n) => n.toString(16).padStart(2, "0")).join("");
      if (hash !== pack.sha256) throw new Error("Falha na integridade das superfícies complementares.");
      const decoded = await new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream("gzip"))).arrayBuffer();
      if (decoded.byteLength !== pack.uncompressedSize) throw new Error("Geometria descomprimida incompleta.");
      return JSON.parse(new TextDecoder().decode(decoded)) as { id: string; layer: string; positions: number[]; indices: number[] }[];
    })).then((packs) => packs.flat());
    // Both requests start together. The catch is attached immediately to avoid
    // an unhandled rejection if the distal request fails before the base one.
    const baseRequest = fetch(`${import.meta.env.BASE_URL}neuro3d/open-anatomy/reference-surfaces.bin`);
    const [response, distalSurfaces] = await Promise.all([baseRequest, supplementaryRequest]);
    if (!response.ok) throw new Error("Não foi possível carregar a geometria compartilhada.");
    const bytes = await response.arrayBuffer();
    if (bytes.byteLength !== metadata.size) throw new Error("Geometria incompleta.");
    const hash = Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", bytes))).map((n) => n.toString(16).padStart(2, "0")).join("");
    if (hash !== metadata.sha256) throw new Error("A geometria não passou na verificação de integridade.");
    const result: ReferenceGeometry = new Map(metadata.structures.map((item) => [item.id, {
      id: item.id, layer: item.layer,
      positions: new Float32Array(bytes, item.positionsOffset, item.positionsCount),
      indices: new Uint32Array(bytes, item.indicesOffset, item.indicesCount),
      t: "tOffset" in item ? new Float32Array(bytes, item.tOffset, item.tCount) : undefined,
    }]));
    for (const item of distalSurfaces) result.set(item.id, {
      id: item.id, layer: item.layer, positions: new Float32Array(item.positions), indices: new Uint32Array(item.indices),
    });
    for (const item of reconstructedArteries) result.set(item.id, {
      id: item.id, layer: item.layer, positions: new Float32Array(item.surface.positions), indices: new Uint32Array(item.surface.indices),
    });
    // Match each shared source vertex to the same oriented source axis used by access routes.
    // This supports partial arch segments without creating substitute vascular tubes.
    for (const [id, axis] of Object.entries(sourceAxes)) {
      const surface = result.get(id); if (!surface) continue;
      const points = axis.points as P3[], arc = [0];
      for (let i = 1; i < points.length; i++) arc.push(arc[i - 1] + Math.hypot(...points[i].map((v, k) => v - points[i - 1][k])));
      surface.axis = points; surface.axisDistances = arc;
      surface.t = new Float32Array(surface.positions.length / 3);
      for (let vertex = 0; vertex < surface.t.length; vertex++) {
        let nearest = 0, best = Infinity;
        for (let i = 0; i < points.length; i++) {
          const distance = points[i].reduce((sum, v, k) => sum + (v - surface.positions[vertex * 3 + k]) ** 2, 0);
          if (distance < best) { best = distance; nearest = i; }
        }
        surface.t[vertex] = arc[nearest] / arc.at(-1)!;
      }
    }
    return result;
  })().catch((error) => { request = null; throw error; });
  return request;
}
const transformed = new WeakMap<ReferenceGeometry, Map<ArchProfile, ReferenceGeometry>>();
export function morphReferenceGeometry(source: ReferenceGeometry, profile: ArchProfile): ReferenceGeometry {
  if (profile === "source") return source;
  let variants = transformed.get(source); if (!variants) { variants = new Map(); transformed.set(source, variants); }
  const cached = variants.get(profile); if (cached) return cached;
  const result: ReferenceGeometry = new Map();
  for (const [id, surface] of source) {
    const positions = new Float32Array(surface.positions.length);
    for (let i = 0; i < positions.length; i += 3) positions.set(morphArchPoint(Array.from(surface.positions.subarray(i, i + 3)) as P3, profile), i);
    result.set(id, { ...surface, positions, axis: surface.axis?.map((point) => morphArchPoint(point, profile)) });
  }
  variants.set(profile, result); return result;
}
export function useReferenceGeometry(profile: ArchProfile = "source") {
  const [state, setState] = useState<{ geometry?: ReferenceGeometry; error?: string }>({});
  useEffect(() => {
    let active = true;
    loadReferenceGeometry().then((geometry) => { if (active) setState({ geometry }); }, (error) => { if (active) setState({ error: String(error.message) }); });
    return () => { active = false; };
  }, []);
  return useMemo(() => state.geometry ? { geometry: morphReferenceGeometry(state.geometry, profile), error: state.error } : state, [state, profile]);
}

export function routeSurface(source: ReferenceSurface, route: Vessel, limit = 1, stenosis?: { center: number; dilation: number }): Surface {
  const positions = stenosis && source.t ? source.positions.slice() : source.positions;
  const originalAxis = source.axis ? { points: source.axis } : sourceAxes[route.sourceId ?? ""];
  if (stenosis && source.t && originalAxis) {
    const axis = originalAxis.points as P3[];
    const arc = source.axisDistances ? [...source.axisDistances] : [0];
    if (!source.axisDistances) for (let i = 1; i < axis.length; i++) arc.push(arc[i - 1] + Math.hypot(...axis[i].map((v, k) => v - axis[i - 1][k])));
    for (let i = 0; i < positions.length; i += 3) {
      const at = source.t[i / 3] * arc.at(-1)!;
      let high = arc.findIndex((value) => value >= at);
      if (high < 1) high = 1;
      const fraction = (at - arc[high - 1]) / Math.max(1e-8, arc[high] - arc[high - 1]);
      const point = axis[high].map((v, k) => axis[high - 1][k] + fraction * (v - axis[high - 1][k]));
      const t = source.t[i / 3];
      const factor = 1 - 0.65 * (1 - stenosis.dilation) * Math.exp(-Math.pow((t - stenosis.center) / 0.09, 2));
      for (let k = 0; k < 3; k++) positions[i + k] = point[k] + (positions[i + k] - point[k]) * factor;
    }
  }
  const min = route.sourceRange?.[0] ?? 0, max = sourceFraction(route, limit);
  if (!source.t || (min === 0 && max === 1)) return { positions, indices: source.indices };
  const indices: number[] = [];
  for (let i = 0; i < source.indices.length; i += 3) {
    const ids = [source.indices[i], source.indices[i + 1], source.indices[i + 2]];
    let t = ids.reduce((sum, id) => sum + source.t![id], 0) / 3;
    if (route.sourceReverse) t = 1 - t;
    if (t >= min - 0.002 && t <= max + 0.002) indices.push(...ids);
  }
  // A partial contrast column must be closed for front/back integration.
  // Cap the computational cut; it is not a new anatomical surface.
  const boundary = new Map<string, { a: number; b: number; count: number }>();
  for (let i = 0; i < indices.length; i += 3) for (let j = 0; j < 3; j++) {
    const a = indices[i + j], b = indices[i + (j + 1) % 3];
    const key = a < b ? `${a}:${b}` : `${b}:${a}`;
    const entry = boundary.get(key);
    if (entry) entry.count++; else boundary.set(key, { a, b, count: 1 });
  }
  const edges = [...boundary.values()].filter((edge) => edge.count === 1);
  if (!edges.length) return { positions, indices };
  const joined = Array.from(positions);
  const pending = new Set(edges.flatMap((edge) => [edge.a, edge.b]));
  while (pending.size) {
    const first = pending.values().next().value!;
    const component = new Set([first]), queue = [first]; pending.delete(first);
    while (queue.length) {
      const id = queue.pop()!;
      for (const edge of edges) if (edge.a === id || edge.b === id) {
        const next = edge.a === id ? edge.b : edge.a;
        if (!component.has(next)) { component.add(next); queue.push(next); pending.delete(next); }
      }
    }
    const center = [0, 0, 0];
    for (const id of component) for (let k = 0; k < 3; k++) center[k] += joined[id * 3 + k] / component.size;
    const vertex = joined.length / 3; joined.push(...center);
    for (const edge of edges) if (component.has(edge.a)) indices.push(edge.b, edge.a, vertex);
  }
  return { positions: joined, indices };
}
