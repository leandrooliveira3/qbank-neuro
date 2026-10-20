import { describe, expect, it } from "vitest";
import { atlasProjection, unprojectAtlasPixel, panAtlasField, zoomAtlasField } from "./atlasProjection";
import { projectSpatial, WIDTH, HEIGHT } from "./simulation/station/imaging";
import type { P3 } from "./simulation/station/network";

describe("atlas detector framing", () => {
  it("pans in detector axes at oblique angles and zooms around the cursor without moving anatomy", () => {
    const center: P3 = [3, -8, 2], point: P3 = [1, -5, 4];
    for (const yaw of [-120, 0, 45, 90]) for (const pitch of [-35, 0, 40]) {
      const view = atlasProjection(yaw, pitch, 1.3, center);
      const [x,y,depth] = projectSpatial(point, view);
      const moved = panAtlasField(center, view, 42, -28);
      const projected = projectSpatial(point, atlasProjection(yaw,pitch,1.3,moved));
      expect(projected[0]).toBeCloseTo(x+42,8); expect(projected[1]).toBeCloseTo(y-28,8);
      expect(projected[2]).toBeCloseTo(depth,8);
      const zoomed = zoomAtlasField(center,view,2.1,x,y);
      const fixed = projectSpatial(point,atlasProjection(yaw,pitch,2.1,zoomed));
      expect(fixed[0]).toBeCloseTo(x,8); expect(fixed[1]).toBeCloseTo(y,8);
    }
  });
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
