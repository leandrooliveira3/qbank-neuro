import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import metadata from "../../reference-surfaces.json";
import axes from "../../reference-network.json";
import { createStation, caseFor, networkFor, opacifiedEdges, stationReducer } from "./engine";
import { distance, locate, pointAt, targetTrack } from "./network";
import { referenceContrast } from "./referenceScene";
import type { ReferenceGeometry } from "./referenceGeometry";

const binary = readFileSync("public/neuro3d/open-anatomy/reference-surfaces.bin");
const buffer = binary.buffer.slice(binary.byteOffset, binary.byteOffset + binary.byteLength);
const geometry: ReferenceGeometry = new Map(metadata.structures.map((item) => [item.id, {
  id: item.id, layer: item.layer,
  positions: new Float32Array(buffer, item.positionsOffset, item.positionsCount),
  indices: new Uint32Array(buffer, item.indicesOffset, item.indicesCount),
  t: "tOffset" in item ? new Float32Array(buffer, item.tOffset, item.tCount) : undefined,
}]));
describe("shared anatomical reference", () => {
  it("uses verified asset bytes and source-frame axes, preserving continuous navigable junctions", () => {
    expect(createHash("sha256").update(binary).digest("hex")).toBe(metadata.sha256);
    expect(binary.length).toBe(metadata.size);
    for (const id of ["diagnostic", "saccular", "m1", "cas"]) {
      const state = createStation(id, "reference"), network = networkFor(state), definition = caseFor(state);
      expect(locate(network, targetTrack(network, definition.target, definition.targetT)).edge).toBe(definition.target);
      for (const vessel of Object.values(network)) for (const child of vessel.children)
        expect(distance(vessel.points.at(-1)!, network[child].points[0])).toBeLessThan(1e-8);
      const original = axes.originalAxes.internal_carotid_artery_l.points[1];
      expect(network["ref-ICA-L"].points[0]).toEqual(original);
    }
  });
  it("projects imported source surfaces and blocks downstream filling beyond the M1 clot", () => {
    let state = createStation("m1", "reference");
    state = { ...state, contrast: { edge: "ref-ICA-L", at: 0 } };
    const network = networkFor(state), edges = opacifiedEdges(state, network);
    expect(edges).toContain("ref-M1-L");
    const before = referenceContrast(state, geometry, edges);
    const after = referenceContrast({ ...state, clot: false }, geometry, edges);
    expect(after.length).toBeGreaterThan(before.length);
    const source = geometry.get("internal_carotid_artery_l")!;
    expect(Array.from(before[0].positions.slice(0, source.positions.length))).toEqual(Array.from(source.positions));
  });
  it("independent instruments travel in the extracted axis and case resets retain the selected basis", () => {
    let state = createStation("saccular", "reference");
    const network = networkFor(state), target = targetTrack(network, "sac", 0.55);
    state = { ...state, wireKind: "Microguia", tools: { wire: target, catheter: { ...target }, micro: { ...target } } };
    const point = locate(network, state.tools.micro).point;
    state = stationReducer(state, { type: "tool", tool: "wire" });
    state = stationReducer(state, { type: "move", delta: -1 });
    expect(locate(network, state.tools.micro).point).toEqual(point);
    expect(stationReducer(state, { type: "new", caseId: "m1" }).geometry).toBe("reference");
    expect(point.every(Number.isFinite)).toBe(true);
  });
});
