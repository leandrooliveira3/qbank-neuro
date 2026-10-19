import { describe, expect, it } from "vitest";
import { Vector3 } from "three";
import { anglesFromDirection, directionFromAngles } from "./angiographyPose";
import { atlasProjection, unprojectAtlasPixel } from "./atlasProjection";
import { projectSpatial } from "./simulation/station/projectionMath";
import type { P3 } from "./simulation/station/network";

describe("linked 3D/2D angiographic pose", () => {
  it("preserves oblique directions and the detector normal across representations", () => {
    for (const yaw of [-175,-90,0,32,90,180]) for (const pitch of [-55,0,35,65]) {
      const direction = directionFromAngles(yaw,pitch);
      const result = anglesFromDirection(direction);
      expect(new Vector3(...direction).distanceTo(new Vector3(...directionFromAngles(result.yaw,result.pitch)))).toBeLessThan(1e-10);
      const view = atlasProjection(yaw,pitch,1,[2,-7,4]);
      const detectorNormal = new Vector3(...unprojectAtlasPixel(300,280,1,view)).sub(new Vector3(...unprojectAtlasPixel(300,280,0,view))).normalize();
      expect(detectorNormal.distanceTo(new Vector3(...direction))).toBeLessThan(1e-10);
      const projected = projectSpatial([2,-7,4] as P3,view);
      expect(projected[0]).toBeCloseTo(300,10); expect(projected[1]).toBeCloseTo(280,10);
    }
  });
});
