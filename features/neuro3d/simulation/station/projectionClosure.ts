import type { Surface } from "./surfaces";

// Computational end caps for the line integral, never a new anatomical branch.
// Coincident seam vertices are welded only for the boundary graph (1e-6 cm).
const cache = new WeakMap<Surface, { surface: Surface; sealedLoops: number; nonManifoldEdges: number }>();
export function closeProjectionSurface(source: Surface) {
  const existing = cache.get(source); if (existing) return existing;
  const positions = Array.from(source.positions), indices = Array.from(source.indices);
  const points = new Map<string, number>(), canonical: number[] = [];
  for (let i = 0; i < positions.length; i += 3) {
    const key = positions.slice(i, i + 3).map((value) => Math.round(value * 1e6)).join(":");
    if (!points.has(key)) points.set(key, i / 3);
    canonical.push(points.get(key)!);
  }
  const edges = new Map<string, { a: number; b: number; count: number }>();
  for (let i = 0; i < indices.length; i += 3) for (let j = 0; j < 3; j++) {
    const a = canonical[indices[i + j]], b = canonical[indices[i + (j + 1) % 3]];
    if (a === b) continue;
    const key = [Math.min(a, b), Math.max(a, b)].join(":");
    const edge = edges.get(key);
    if (edge) edge.count++; else edges.set(key, { a, b, count: 1 });
  }
  const boundary = [...edges.values()].filter((edge) => edge.count === 1);
  const nonManifoldEdges = [...edges.values()].filter((edge) => edge.count > 2).length;
  const adjacency = new Map<number, number[]>();
  for (let i = 0; i < boundary.length; i++) for (const id of [boundary[i].a, boundary[i].b]) {
    if (!adjacency.has(id)) adjacency.set(id, []);
    adjacency.get(id)!.push(i);
  }
  const pending = new Set(boundary.map((_, i) => i));
  let sealedLoops = 0;
  while (pending.size) {
    const start = pending.values().next().value!, component = new Set<number>(), vertices = new Set<number>(), queue = [start];
    while (queue.length) {
      const index = queue.pop()!;
      if (component.has(index)) continue;
      component.add(index); pending.delete(index);
      for (const id of [boundary[index].a, boundary[index].b]) {
        vertices.add(id);
        for (const next of adjacency.get(id) ?? []) if (!component.has(next)) queue.push(next);
      }
    }
    // Do not bridge a branching/non-manifold boundary graph by guessing its anatomy.
    if (vertices.size < 3 || [...vertices].some((id) => adjacency.get(id)?.length !== 2)) continue;
    const center = [0, 0, 0];
    for (const id of vertices) for (let k = 0; k < 3; k++) center[k] += positions[id * 3 + k] / vertices.size;
    const vertex = positions.length / 3; positions.push(...center);
    for (const index of component) indices.push(boundary[index].b, boundary[index].a, vertex);
    sealedLoops++;
  }
  const result = { surface: sealedLoops ? { positions, indices } : source, sealedLoops, nonManifoldEdges };
  cache.set(source, result); return result;
}
