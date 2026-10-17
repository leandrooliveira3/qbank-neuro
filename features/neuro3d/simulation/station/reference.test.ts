import { describe, expect, it } from "vitest";
import { gunzipSync } from "node:zlib";
import supraAortic from "../../reference-supra-aortic.json";
import { openAnatomy, worldPoint } from "../../openAnatomy";
import landmarksMetadata from "../../reference-landmarks.json";
import distalMetadata from "../../reference-distal-aca.json";
import { closeProjectionSurface } from "./projectionClosure";
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
  it("preserves the source frame for all additional supra-aortic surfaces and excludes them from selective ICA injections", () => {
    const compressed = readFileSync(`public/neuro3d/open-anatomy/${supraAortic.file}`);
    expect(compressed.length).toBe(supraAortic.size);
    expect(createHash("sha256").update(compressed).digest("hex")).toBe(supraAortic.sha256);
    const decoded = gunzipSync(compressed);
    expect(decoded.length).toBe(supraAortic.uncompressedSize);
    const rows = JSON.parse(decoded.toString()) as {id: string; layer: string; positions: number[]; indices: number[]}[];
    expect(rows).toHaveLength(14);
    const combined: ReferenceGeometry = new Map(geometry);
    for (const row of rows) {
      const source = openAnatomy.structures.find((item) => item.id === row.id)!;
      const low = worldPoint(source.bounds[0]), high = worldPoint(source.bounds[1]);
      row.positions.forEach((value, i) => {
        expect(value).toBeGreaterThanOrEqual(low[i % 3] - .02);
        expect(value).toBeLessThanOrEqual(high[i % 3] + .02);
      });
      expect(row.layer).toBe("arterial");
      expect(row.indices.every((index) => index >= 0 && index < row.positions.length / 3)).toBe(true);
      combined.set(row.id, {...row, positions: new Float32Array(row.positions), indices: new Uint32Array(row.indices)});
    }
    const state = { ...createStation("diagnostic", "reference"), contrast: { edge: "ref-ICA-L", at: 0 } };
    const contrast = referenceContrast(state, combined, opacifiedEdges(state, networkFor(state)));
    for (const row of rows) expect(contrast).not.toContain(combined.get(row.id));
  });
  it("verifies source-aligned skull and sellar projection context without misclassifying soft tissue as bone", () => {
    const compressed = readFileSync(`public/neuro3d/open-anatomy/${landmarksMetadata.file}`);
    expect(compressed.length).toBe(landmarksMetadata.size);
    expect(createHash("sha256").update(compressed).digest("hex")).toBe(landmarksMetadata.sha256);
    const decoded = gunzipSync(compressed);
    expect(decoded.length).toBe(landmarksMetadata.uncompressedSize);
    const rows = JSON.parse(decoded.toString()) as {id: string; layer: string; positions: number[]; indices: number[]}[];
    expect(rows).toHaveLength(31);
    for (const row of rows) {
      expect(row.positions.every(Number.isFinite)).toBe(true);
      expect(row.indices.every((index) => index >= 0 && index < row.positions.length / 3)).toBe(true);
      expect(row.indices.length / 3).toBeLessThanOrEqual(4000);
    }
    expect(rows.find((row) => row.id === "adenohypophysis")?.layer).toBe("gland");
    expect(rows.find((row) => row.id === "sphenoid_bone")?.layer).toBe("bone");
  });
  it("preserves verified original distal ACA components instead of the damaged low-resolution surfaces", () => {
    const compressed = readFileSync(`public/neuro3d/open-anatomy/${distalMetadata.file}`);
    expect(compressed.length).toBe(distalMetadata.size);
    expect(createHash("sha256").update(compressed).digest("hex")).toBe(distalMetadata.sha256);
    const decoded = gunzipSync(compressed);
    expect(decoded.length).toBe(distalMetadata.uncompressedSize);
    const rows = JSON.parse(decoded.toString()) as { id: string; positions: number[]; indices: number[] }[];
    expect(rows).toHaveLength(4);
    for (const row of rows) {
      expect(row.indices.length / 3).toBe(distalMetadata.structures.find((item) => item.id === row.id)?.faces);
      expect(row.positions.every(Number.isFinite)).toBe(true);
      const closed = closeProjectionSurface(row);
      expect(closed.nonManifoldEdges).toBe(0);
      expect(closed.sealedLoops).toBeGreaterThan(0);
    }
  });
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
  it("includes existing distal ACA meshes selectively without filling them from an M1-only injection", () => {
    const state = createStation("diagnostic", "reference");
    const aca = referenceContrast(state, geometry, ["ref-ACA-L"]);
    const mca = referenceContrast(state, geometry, ["ref-M1-L"]);
    for (const id of ["pericallosal_artery_l", "callosomarginal_artery_l", "frontal_branches_of_callosomarginal_artery_l"]) {
      expect(geometry.has(id)).toBe(true);
      expect(aca).toContain(geometry.get(id));
      expect(mca).not.toContain(geometry.get(id));
    }
    expect(mca).toContain(geometry.get("postcentral_arterial_branch_l"));
    expect(aca).not.toContain(geometry.get("posterior_communicating_artery_r"));
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
