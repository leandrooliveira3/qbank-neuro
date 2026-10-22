import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { gunzipSync } from "node:zlib";
import body from "../../reference-body-access-network.json";
import { createStation, networkFor, opacifiedEdges, stationReducer } from "./engine";
import { distance, edgeLength, locate, targetTrack } from "./network";
import { morphArchPoint, archProfileData, type ArchProfile } from "./archMorphology";
import { morphReferenceGeometry, type ReferenceGeometry } from "./referenceGeometry";
import { arrivalTimes } from "./contrast";

describe("registered body access and didactic arch profiles", () => {
  it("keeps every route connected and reachable for both entries, every profile and case", () => {
    expect(body.junctions).toHaveLength(8);
    expect(body.junctions.every(j => j.outsideLumenSamples === 0 && j.toleranceCm === .12)).toBe(true);
    for (const entry of ["femoral", "radial"] as const) for (const profile of ["source", "I", "II", "III"] as const) for (const caseId of ["diagnostic", "saccular", "m1", "cas"]) {
      const network = networkFor(createStation(caseId, "reference", entry, profile));
      for (const vessel of Object.values(network)) {
        expect(edgeLength(vessel)).toBeGreaterThan(0);
        for (const child of vessel.children) expect(distance(vessel.points.at(-1)!, network[child].points[0])).toBeLessThan(1e-8);
        const track = targetTrack(network, vessel.id, .5);
        expect(locate(network, track).edge).toBe(vessel.id);
        expect(new Set(track.path).size).toBe(track.path.length);
      }
      const next = stationReducer(createStation(caseId, "reference", entry, profile), {type: "new", caseId: "m1"});
      expect(next.referenceEntry).toBe(entry); expect(next.archProfile).toBe(profile);
    }
  });
  it("keeps navigation direction separate from peripheral contrast direction", () => {
    for (const entry of ["radial", "femoral"] as const) {
      const state = createStation("diagnostic", "reference", entry), network = networkFor(state);
      expect(opacifiedEdges({...state, contrast: {edge: "access", at: 0}}, network)).toEqual(["access"]);
      const left = opacifiedEdges({...state, contrast: {edge: "ref-CCA-L", at: 0}}, network);
      expect(left).toContain("ref-ICA-L"); expect(left).not.toContain("ref-CCA-R");
      expect(arrivalTimes(network, "access").size).toBe(1);
      expect(arrivalTimes(network, "ref-CCA-L").has("ref-ICA-L")).toBe(true);
    }
    const n = networkFor(createStation("diagnostic", "reference", "radial"));
    const start = arrivalTimes(n, "ref-SUB-R", 0), end = arrivalTimes(n, "ref-SUB-R", 1);
    expect(start.get("ref-AXILLARY-R")).toBe(0);
    expect(end.get("ref-AXILLARY-R")).toBeGreaterThan(0);
    expect(start.has("ref-CCA-R")).toBe(false);
  });
  it("deforms actual source vertices and axes together without mutating source geometry", () => {
    const pack = JSON.parse(gunzipSync(readFileSync("public/neuro3d/open-anatomy/reference-supra-aortic.bin")).toString());
    const arch = pack.find((surface: {id: string}) => surface.id === "aortic_arch");
    const source: ReferenceGeometry = new Map([[arch.id, {...arch, positions: new Float32Array(arch.positions), indices: new Uint32Array(arch.indices), axis: [archProfileData.brachiocephalicOriginProxy]}]]);
    const original = source.get(arch.id)!.positions.slice();
    for (const profile of ["I", "II", "III"] as ArchProfile[]) {
      const result = morphReferenceGeometry(source, profile), surface = result.get(arch.id)!;
      let apex = -Infinity;
      for (let i = 1; i < surface.positions.length; i += 3) apex = Math.max(apex, surface.positions[i]);
      const origin = morphArchPoint(archProfileData.brachiocephalicOriginProxy as [number,number,number], profile);
      expect((apex - origin[1]) / archProfileData.leftCCADiameterProxyCm).toBeCloseTo(archProfileData.profiles[profile as "I"].heightRatio, 4);
      expect(surface.axis![0]).toEqual(origin);
      expect(morphReferenceGeometry(source, profile)).toBe(result);
      expect(archProfileData.profiles[profile as "I"].minimumVerticalJacobianBound).toBeGreaterThan(.89);
    }
    expect(source.get(arch.id)!.positions).toEqual(original);
    expect(morphReferenceGeometry(source, "source")).toBe(source);
  });
});
