import { describe, expect, it } from "vitest";
import { BoxGeometry } from "three";
import { thicknessImage, attenuationRGBA } from "./radiograph";
import { sacRadius, vesselSurface } from "./surfaces";
import type { Vessel } from "./network";

describe("surface-derived radiographic projection", () => {
  it("integrates front/back surfaces once, including rays on triangle diagonals", () => {
    const cube = new BoxGeometry(2, 2, 2);
    const surface = { positions: Array.from(cube.attributes.position.array), indices: Array.from(cube.index!.array) };
    const image = thicknessImage([surface], ([x,y,z]) => [32 + x * 10, 32 + y * 10, z], 64, 64);
    for (const x of [23, 31, 32, 40]) for (const y of [23, 31, 32, 40])
      expect(image[y * 64 + x]).toBeCloseTo(2, 5);
    expect(image[0]).toBe(0);
    const moved = thicknessImage([surface], ([x,y,z]) => [32 + x * 10, 32 + y * 10, z + 200], 64, 64);
    expect(Array.from(moved)).toEqual(Array.from(image));
    expect(attenuationRGBA(image, 0).every((value, index) => index % 4 !== 3 || value === 0)).toBe(true);
    cube.dispose();
  });
  it("creates a closed aneurysm surface and preserves its volume in projection", () => {
    const vessel: Vessel = { id: "sac", name: "Sac", anatomicalId: "lesion", children: [], radius: 0.5, points: [[0,0,0],[0,0,1],[0.2,0,2]] };
    const surface = vesselSurface(vessel, sacRadius);
    expect(surface.positions.every(Number.isFinite)).toBe(true);
    const edges = new Map<string, number>();
    let volume = 0;
    for (let i = 0; i < surface.indices.length; i += 3) {
      const ids = Array.from(surface.indices.slice(i, i + 3));
      for (let j = 0; j < 3; j++) {
        const key = [ids[j], ids[(j + 1) % 3]].sort((a,b) => a-b).join(":");
        edges.set(key, (edges.get(key) ?? 0) + 1);
      }
      const [a,b,c] = ids.map((id) => surface.positions.slice(id * 3, id * 3 + 3));
      volume += (a[0]*(b[1]*c[2]-b[2]*c[1])+a[1]*(b[2]*c[0]-b[0]*c[2])+a[2]*(b[0]*c[1]-b[1]*c[0]))/6;
    }
    expect([...edges.values()].every((count) => count === 2)).toBe(true);
    const image = thicknessImage([surface], ([x,y,z]) => [80 + x * 65, 80 + y * 65, z], 160, 160);
    const projectedVolume = image.reduce((sum, value) => sum + value, 0) / (65 * 65);
    expect(projectedVolume / Math.abs(volume)).toBeCloseTo(1, 2);
  });
});
