import type { P3, Vessel } from "./network";
import { pointAt } from "./network";

export interface Surface {
  positions: number[] | Float32Array;
  indices: number[] | Uint32Array;
}
const dot = (a: P3, b: P3) => a.reduce((sum, v, i) => sum + v * b[i], 0);
const sub = (a: P3, b: P3) => a.map((v, i) => v - b[i]) as P3;
const cross = (a: P3, b: P3): P3 => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
const unit = (p: P3): P3 => {
  const length = Math.hypot(...p);
  if (length < 1e-10) throw new Error("Degenerate vascular surface axis");
  return p.map((v) => v / length) as P3;
};

// Original illustrative geometry, NOT a segmentation of a reference patient.
// A centerline alone cannot determine a measured lumen or aneurysm wall.
export function sacRadius(t: number, angle: number) {
  const neck = 0.18 * Math.pow(1 - t, 5);
  const dome = 0.67 * Math.pow(Math.max(0, Math.sin(Math.PI * t)), 0.72);
  const lobe = 1 + 0.19 * Math.sin(3 * angle + t * 2.1) * Math.sin(Math.PI * t)
    + 0.12 * Math.cos(angle - 0.7) * Math.sin(Math.PI * t);
  return Math.max(0.015, (neck + dome) * lobe);
}

// Closed, consistently wound ring surface using parallel-transported frames.
// The same sampled surface is consumed by the 3D viewer and X-ray projector.
export function vesselSurface(
  vessel: Vessel,
  radius: (t: number, angle: number) => number = () => vessel.radius,
  limit = 1,
  rings = 32,
  sides = 20,
): Surface {
  const positions: number[] = [], indices: number[] = [];
  const centers = Array.from({ length: rings + 1 }, (_, i) => pointAt(vessel, (i / rings) * limit));
  let normal: P3 | null = null;
  for (let i = 0; i <= rings; i++) {
    const tangent = unit(sub(centers[Math.min(i + 1, rings)], centers[Math.max(0, i - 1)]));
    if (normal) {
      const projection = dot(normal, tangent);
      const transported = normal.map((v, j) => v - tangent[j] * projection) as P3;
      normal = Math.hypot(...transported) > 1e-6 ? unit(transported) : null;
    }
    if (!normal) normal = unit(cross(tangent, Math.abs(tangent[0]) < 0.8 ? [1, 0, 0] : [0, 1, 0]));
    const binormal = unit(cross(tangent, normal));
    for (let j = 0; j < sides; j++) {
      const a = (j / sides) * 2 * Math.PI;
      const r = radius((i / rings) * limit, a);
      if (!(r > 0) || !Number.isFinite(r)) throw new Error("Invalid vascular radius");
      positions.push(...centers[i].map((v, k) => v + r * (normal![k] * Math.cos(a) + binormal[k] * Math.sin(a))));
      if (i < rings) {
        const p = i * sides + j, q = i * sides + (j + 1) % sides;
        indices.push(p, q, p + sides, q, q + sides, p + sides);
      }
    }
  }
  const first = positions.length / 3;
  positions.push(...centers[0], ...centers[rings]);
  for (let j = 0; j < sides; j++) {
    indices.push(first, (j + 1) % sides, j);
    indices.push(first + 1, rings * sides + j, rings * sides + (j + 1) % sides);
  }
  return { positions, indices };
}
