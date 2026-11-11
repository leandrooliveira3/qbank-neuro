import { describe, it, expect } from "vitest";
import { studyPose, studyPresets } from "./ProjectionStudy";
import { directionFromAngles, anglesFromDirection } from "../angiographyPose";
import { atlasProjection, unprojectAtlasPixel } from "../atlasProjection";
import { projectSpatial } from "../simulation/station/projectionMath";
describe("linked study poses", () => {
  it("preserves source field and zoom while changing angles", () => {
    const pose = {
        yaw: 0,
        pitch: 0,
        zoom: 2,
        center: [1, 2, 3] as [number, number, number],
      },
      next = studyPose(pose, 30, -20);
    expect(next).toEqual({ yaw: 30, pitch: -20, zoom: 2, center: [1, 2, 3] });
    expect(next.center).not.toBe(pose.center);
    expect(pose.yaw).toBe(0);
  });
  it("bounds angles and rejects non-finite commands", () => {
    expect(
      studyPose({ yaw: 0, pitch: 0, zoom: 1, center: [0, 0, 0] }, 300, -100),
    ).toMatchObject({ yaw: 180, pitch: -60 });
    expect(() =>
      studyPose({ yaw: 0, pitch: 0, zoom: 1, center: [0, 0, 0] }, NaN, 0),
    ).toThrow();
  });
  it.each(studyPresets)(
    "keeps source point projections reversible at $name",
    (p) => {
      const view = atlasProjection(p.yaw, p.pitch, 1.7, [2, -3, 4]),
        point: [number, number, number] = [1, 2, 3],
        pixel = projectSpatial(point, view),
        back = unprojectAtlasPixel(...pixel, view);
      back.forEach((v, i) => expect(v).toBeCloseTo(point[i], 8));
      const angles = anglesFromDirection(directionFromAngles(p.yaw, p.pitch));
      expect(angles.yaw).toBeCloseTo(p.yaw, 8);
      expect(angles.pitch).toBeCloseTo(p.pitch, 8);
    },
  );
});
