import type { P3 } from "./network";
import type { Surface } from "./surfaces";

// Orthographic line integral through oriented closed triangles. For each ray,
// signed front/back depths sum to occupied path length, including concavities.
// This is a relative attenuation renderer, not calibrated fluoroscopy or dose.
export function thicknessImage(
  surfaces: Surface[],
  project: (point: P3) => [number, number, number],
  width: number,
  height: number,
) {
  const thickness = new Float32Array(width * height);
  for (const surface of surfaces) {
    const vertices: [number, number, number][] = [];
    for (let i = 0; i < surface.positions.length; i += 3)
      vertices.push(project(surface.positions.slice(i, i + 3) as P3));
    for (let i = 0; i < surface.indices.length; i += 3) {
      const a = vertices[surface.indices[i]], b = vertices[surface.indices[i + 1]], c = vertices[surface.indices[i + 2]];
      const area = (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
      if (Math.abs(area) < 1e-9) continue;
      const minX = Math.max(0, Math.ceil(Math.min(a[0], b[0], c[0]) - 0.5));
      const maxX = Math.min(width - 1, Math.floor(Math.max(a[0], b[0], c[0]) - 0.5));
      const minY = Math.max(0, Math.ceil(Math.min(a[1], b[1], c[1]) - 0.5));
      const maxY = Math.min(height - 1, Math.floor(Math.max(a[1], b[1], c[1]) - 0.5));
      for (let y = minY; y <= maxY; y++) for (let x = minX; x <= maxX; x++) {
        const px = x + 0.5, py = y + 0.5;
        const u = ((b[0] - px) * (c[1] - py) - (b[1] - py) * (c[0] - px)) / area;
        const v = ((c[0] - px) * (a[1] - py) - (c[1] - py) * (a[0] - px)) / area;
        const w = 1 - u - v;
        // Half-open triangle edges avoid counting coplanar shared edges twice.
        const edge = (p: number[], q: number[]) => area > 0
          ? q[1] < p[1] || (q[1] === p[1] && q[0] > p[0])
          : p[1] < q[1] || (p[1] === q[1] && p[0] > q[0]);
        if (u < -1e-9 || v < -1e-9 || w < -1e-9) continue;
        if (Math.abs(u) < 1e-9 && !edge(b, c)) continue;
        if (Math.abs(v) < 1e-9 && !edge(c, a)) continue;
        if (Math.abs(w) < 1e-9 && !edge(a, b)) continue;
        thickness[y * width + x] += Math.sign(area) * (u * a[2] + v * b[2] + w * c[2]);
      }
    }
  }
  for (let i = 0; i < thickness.length; i++) thickness[i] = Math.abs(thickness[i]);
  return thickness;
}

export function attenuationRGBA(thickness: Float32Array, concentration = 1) {
  const rgba = new Uint8ClampedArray(thickness.length * 4);
  for (let i = 0; i < thickness.length; i++) {
    rgba[i * 4] = 20; rgba[i * 4 + 1] = 25; rgba[i * 4 + 2] = 30;
    rgba[i * 4 + 3] = 255 * (1 - Math.exp(-2.2 * Math.max(0, concentration) * thickness[i]));
  }
  return rgba;
}
