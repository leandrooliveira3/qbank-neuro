import { describe, expect, it } from "vitest";
import { atlasProjection, unprojectAtlasPixel } from "./atlasProjection";
import { projectSpatial, WIDTH, HEIGHT } from "./simulation/station/imaging";
import type { P3 } from "./simulation/station/network";

describe("atlas detector framing", () => {
  it("centers the requested source point at every angle and reverses the detector coordinates for picking", () => {
    const center: P3 = [1.2, -22.4, .4];
    for (const yaw of [-120, 0, 35, 90]) for (const pitch of [-30, 0, 45]) for (const zoom of [.5, 1, 2]) {
      const view = atlasProjection(yaw, pitch, zoom, center);
      const [x, y] = projectSpatial(center, view);
      expect(x).toBeCloseTo(WIDTH / 2, 8); expect(y).toBeCloseTo(HEIGHT / 2, 8);
      for (const point of [center, [4, -18, 2] as P3, [-6, 3, -4] as P3]) {
        const [px, py, depth] = projectSpatial(point, view);
        unprojectAtlasPixel(px, py, depth, view).forEach((value, k) => expect(value).toBeCloseTo(point[k], 8));
      }
    }
  });
});
