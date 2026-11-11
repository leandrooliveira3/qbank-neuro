import { describe, it, expect } from "vitest";
import { OrthographicCamera, PerspectiveCamera, Vector3 } from "three";
import {
  orthographicField,
  requestedInspectionPose,
  perspectiveDistance,
  perspectiveMagnification,
} from "./cameraGeometry";
import { directionFromAngles, type AngiographyPose } from "../angiographyPose";
import { atlasProjection } from "../atlasProjection";
import {
  projectSpatial,
  WIDTH,
  HEIGHT,
} from "../simulation/station/projectionMath";
describe("actual Three.js camera compared with CPU detector coordinates", () => {
  it("preserves magnification on the target plane for perspective inspection when viewport aspect changes", () => {
    for (const [w, h] of [
      [600, 560],
      [1200, 600],
      [390, 460],
    ])
      for (const zoom of [0.5, 1, 3]) {
        const distance = perspectiveDistance(w, h, zoom, 40),
          field = orthographicField(w, h, zoom),
          camera = new PerspectiveCamera(40, w / h, 0.1, 2000);
        camera.position.set(0, 0, distance);
        camera.lookAt(0, 0, 0);
        camera.updateMatrixWorld();
        const p = new Vector3(2, 3, 0).project(camera),
          x = (((p.x + 1) * w) / 2 - (w - 600 * field.scale) / 2) / field.scale,
          y = (((1 - p.y) * h) / 2 - (h - 560 * field.scale) / 2) / field.scale;
        expect(x).toBeCloseTo(300 + 2 * 12 * zoom, 8);
        expect(y).toBeCloseTo(280 - 3 * 12 * zoom, 8);
        expect(perspectiveMagnification(w, h, distance, 40)).toBeCloseTo(
          zoom,
          10,
        );
      }
  });
  it("projects displaced 3D points to the same detector pixels across fields, sizes and angles", () => {
    for (const [width, height] of [
      [600, 560],
      [1200, 600],
      [390, 460],
    ])
      for (const [yaw, pitch] of [
        [0, 0],
        [90, 0],
        [-130, 45],
        [170, -55],
        [31, 10],
      ])
        for (const zoom of [0.3, 1, 4]) {
          const center: [number, number, number] = [2, -7, 4],
            f = orthographicField(width, height, zoom),
            camera = new OrthographicCamera(
              f.left,
              f.right,
              f.top,
              f.bottom,
              0.1,
              600,
            ),
            target = new Vector3(...center);
          camera.position.copy(
            target
              .clone()
              .add(
                new Vector3(...directionFromAngles(yaw, pitch)).multiplyScalar(
                  48,
                ),
              ),
          );
          camera.lookAt(target);
          camera.updateMatrixWorld();
          for (const point of [
            [2, -7, 4],
            [8, 1, -3],
            [-4, 2, 10],
          ]) {
            const screen = new Vector3(...point).project(camera),
              viewportX = ((screen.x + 1) * width) / 2,
              viewportY = ((1 - screen.y) * height) / 2;
            const detectorX =
                (viewportX - (width - WIDTH * f.scale) / 2) / f.scale,
              detectorY =
                (viewportY - (height - HEIGHT * f.scale) / 2) / f.scale;
            const cpu = projectSpatial(
              point as [number, number, number],
              atlasProjection(yaw, pitch, zoom, center),
            );
            expect(detectorX).toBeCloseTo(cpu[0], 7);
            expect(detectorY).toBeCloseTo(cpu[1], 7);
          }
        }
  });
  it("preserves the inspection field on resize and never mutates an external command", () => {
    const previous: AngiographyPose = {
        yaw: 31,
        pitch: 10,
        zoom: 2,
        center: [1, 2, 3],
      },
      command: AngiographyPose = {
        yaw: -30,
        pitch: -20,
        zoom: 4,
        center: [4, 5, 6],
      };
    expect(requestedInspectionPose(previous, undefined)).toEqual(previous);
    const next = requestedInspectionPose(previous, command);
    next.center[0] = 77;
    expect(command.center[0]).toBe(4);
    expect(previous.center[0]).toBe(1);
  });
  it("rejects unusable viewport dimensions", () => {
    for (const [w, h, z] of [
      [0, 600, 1],
      [600, NaN, 1],
      [600, 560, 0],
    ])
      expect(() => orthographicField(w, h, z)).toThrow();
  });
});
