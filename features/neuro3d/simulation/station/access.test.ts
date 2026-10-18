import { describe, expect, it } from "vitest";
import data from "../../reference-access-network.json";
import { createStation, networkFor, opacifiedEdges, stationReducer } from "./engine";
import { distance, edgeLength, locate } from "./network";
import { targetTrack, totalLength } from "./network";
import { moveWire } from "./engine";

describe("source-frame arch navigation", () => {
  it("keeps each numerical junction within the recorded source-lumen tolerance and exposes continuous reachable routes", () => {
    expect(data.junctions).toHaveLength(9);
    for (const junction of data.junctions) {
      expect(junction.outsideLumenSamples).toBe(0);
      expect(junction.toleranceCm).toBe(.08);
      expect(junction.samples).toBeGreaterThan(2);
    }
    for (const caseId of ["diagnostic", "saccular", "m1", "cas"]) {
      const network = networkFor(createStation(caseId, "reference", "arch"));
      for (const vessel of Object.values(network)) {
        expect(edgeLength(vessel)).toBeGreaterThan(0);
        for (const child of vessel.children) expect(distance(vessel.points.at(-1)!, network[child].points[0])).toBeLessThan(1e-8);
        const track = targetTrack(network, vessel.id, .5);
        expect(locate(network, track).edge).toBe(vessel.id);
        expect(new Set(track.path).size).toBe(track.path.length);
      }
    }
  });
  it("advances and retracts a wire from the arch into either carotid circulation while keeping instruments independent", () => {
    const network = networkFor(createStation("diagnostic", "reference", "arch"));
    for (const destination of ["ref-ICA-L", "ref-ICA-R", "ref-ECA-L", "ref-ECA-R", "ref-SUB-L", "ref-SUB-R"]) {
      const expected = targetTrack(network, destination, .2);
      let track = {path: ["access"], depth: 0};
      for (const next of expected.path.slice(1)) {
        const current = network[track.path.at(-1)!];
        const rotation = current.children.indexOf(next) * 360 / current.children.length + 1;
        track = moveWire(network, track, totalLength(network, track.path) - track.depth + .0001, rotation);
        expect(track.path.at(-1)).toBe(next);
      }
      expect(locate(network, track).edge).toBe(destination);
      const back = moveWire(network, track, -track.depth, 0);
      expect(locate(network, back).edge).toBe("access");
    }
    let state = createStation("diagnostic", "reference", "arch");
    state = stationReducer(state, {type: "move", delta: 1});
    expect(state.tools.catheter.depth).toBe(0); expect(state.tools.wire.depth).toBeGreaterThan(0);
    state = stationReducer(state, {type: "new", caseId: "m1"});
    expect(state.referenceEntry).toBe("arch"); expect(state.tools.wire.depth).toBe(0);
  });
  it("fills arch descendants but keeps a selective common-carotid injection on its own side", () => {
    let state = createStation("diagnostic", "reference", "arch");
    const network = networkFor(state);
    state = {...state, contrast: {edge: "access", at: 0}};
    expect(opacifiedEdges(state, network)).toContain("ref-CCA-L");
    expect(opacifiedEdges(state, network)).toContain("ref-CCA-R");
    const left = opacifiedEdges({...state, contrast: {edge: "ref-CCA-L", at: 0}}, network);
    expect(left).toContain("ref-ICA-L"); expect(left).not.toContain("ref-CCA-R"); expect(left).not.toContain("access");
    const cervical = createStation("diagnostic", "reference");
    expect(opacifiedEdges({...cervical, contrast: {edge: "access", at: 0}}, networkFor(cervical))).toEqual(["access"]);
  });
});
