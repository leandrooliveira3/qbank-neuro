import { describe, expect, it } from "vitest";
import { BoxGeometry } from "three";
import { detectorExposure, detectorImage, logSubtraction, projectThickness, contrastOverlay } from "./detector";
import { thicknessImage } from "./radiograph";
import { closeProjectionSurface } from "./projectionClosure";
import { arrivalTimes, bolusConcentration } from "./contrast";
import { createStation, stationReducer } from "./engine";
import { makeReferenceNetwork } from "./referenceNetwork";

describe("relative detector and contrast acquisition", () => {
  it("cancels an unchanged background in log subtraction and retains it in native images", () => {
    for (const bone of [0, .4, 1.6, 3]) {
      const mask = detectorExposure(bone, 0), live = detectorExposure(bone, .15, .8);
      expect(logSubtraction(mask, live)).toBeCloseTo(2.2 * .15 * .8, 6);
    }
    const vessel = new Float32Array([0, .15, .3, 0]);
    const bone = new Float32Array([1, 1, 1, 1]);
    const dsa = detectorImage(vessel, bone, 2, 2, 0);
    const native = detectorImage(vessel, bone, 2, 2, 1);
    expect(native[0]).toBeLessThan(dsa[0]);
    expect(dsa[8]).toBeLessThan(dsa[0]);
    expect(contrastOverlay(new Float32Array(4), 2, 2).filter((_, i) => i % 4 === 3).every((alpha) => alpha === 0)).toBe(true);
  });
  it("closes source end holes without capping seams or making thickness depend on depth offset", () => {
    const cube = new BoxGeometry(2, 2, 2);
    const source = { positions: Array.from(cube.attributes.position.array), indices: Array.from(cube.index!.array) };
    expect(closeProjectionSurface(source).sealedLoops).toBe(0);
    const open = { positions: source.positions, indices: source.indices.slice(0, -6) };
    expect(closeProjectionSurface(open).sealedLoops).toBe(1);
    const project = ([x,y,z]: [number, number, number]) => [16 + x * 4, 16 + y * 4, z] as [number,number,number];
    const image = projectThickness([open], project, 32, 32);
    const shifted = projectThickness([open], ([x,y,z]) => [16 + x * 4, 16 + y * 4, z + 200], 32, 32);
    expect(Array.from(image)).toEqual(Array.from(shifted));
    expect(image[16 * 32 + 16]).toBeCloseTo(2, 4);
    cube.dispose();
  });
  it("adds overlapping source meshes even when their triangle winding differs", () => {
    const cube = new BoxGeometry(2, 2, 2);
    const source = { positions: Array.from(cube.attributes.position.array), indices: Array.from(cube.index!.array) };
    const reversed = { positions: source.positions, indices: source.indices.slice() };
    for (let i = 0; i < reversed.indices.length; i += 3) [reversed.indices[i + 1], reversed.indices[i + 2]] = [reversed.indices[i + 2], reversed.indices[i + 1]];
    const image = thicknessImage([source, reversed], ([x,y,z]) => [16 + x * 4, 16 + y * 4, z], 32, 32);
    expect(image[16 * 32 + 16]).toBeCloseTo(4, 5);
    cube.dispose();
  });
  it("preserves subpixel vessel area rather than losing a narrow projected lumen", () => {
    const cube = new BoxGeometry(.25, 2, 1);
    const surface = { positions: Array.from(cube.attributes.position.array), indices: Array.from(cube.index!.array) };
    const projection = projectThickness([surface], ([x, y, z]) => [16.25 + x * 2, 16 + y * 2, z], 32, 32);
    expect(projection.reduce((a, b) => a + b, 0)).toBeCloseTo(2, 4);
    expect(projection.some((value) => value > 0 && value < 1)).toBe(true);
    cube.dispose();
  });
  it("delays distal arrival, washes the bolus out and freezes the captured roadmap time", () => {
    const network = makeReferenceNetwork();
    const times = arrivalTimes(network, "ref-ICA-L", .5);
    expect(times.get("ref-M1-L")).toBeGreaterThan(times.get("ref-ICA-L")!);
    expect(bolusConcentration(.1, .4)).toBe(0);
    expect(bolusConcentration(1.5, .4)).toBeGreaterThan(.9);
    expect(bolusConcentration(5, .4)).toBe(0);
    let state = createStation("diagnostic", "reference");
    state = { ...state, contrast: { edge: "ref-ICA-L", at: 1, originT: .5 }, clock: 2.5 };
    state = stationReducer(state, { type: "mask" });
    expect(state.mask?.contrastAge).toBe(1.5);
    expect(state.mask?.contrastOrigin?.originT).toBe(.5);
    const later = stationReducer(state, { type: "tick", dt: .1 });
    expect(later.mask?.contrastAge).toBe(1.5);
  });
});
