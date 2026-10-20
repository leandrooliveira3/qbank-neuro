import { describe, it, expect } from "vitest";
import { reconstructedArteries } from "./reconstructedArteries";
import { anatomicalInventory } from "./anatomicalInventory";
import { createStation, networkFor, opacifiedEdges } from "./simulation/station/engine";
import { referenceContrast } from "./simulation/station/referenceScene";
import { readFileSync } from "node:fs";
import metadata from "./reference-surfaces.json";
import sourceAxes from "./reference-network.json";
import accessAxes from "./reference-access-network.json";
import type { ReferenceGeometry } from "./simulation/station/referenceGeometry";

describe("reconstructed educational arterial surfaces", () => {
  it("keeps meshes closed, bounds finite and mirrored sides consistently wound", () => {
    expect(new Set(reconstructedArteries.map((row) => row.id)).size).toBe(reconstructedArteries.length);
    expect(reconstructedArteries.some(row=>row.id === "lingual_artery_l")).toBe(true);
    for (const row of reconstructedArteries) {
      expect(row.surface.positions.every(Number.isFinite)).toBe(true);
      expect(row.bounds.flat().every(Number.isFinite)).toBe(true);
      const edges = new Map<string, number>();
      const indices = row.surface.indices;
      for (let i = 0; i < indices.length; i += 3) for (let k = 0; k < 3; k++) {
        const a = indices[i + k], b = indices[i + (k + 1) % 3], key = [Math.min(a, b), Math.max(a, b)].join(":");
        edges.set(key, (edges.get(key) ?? 0) + 1);
      }
      expect([...edges.values()].every((count) => count === 2)).toBe(true);
      if (row.parentId.startsWith("internal_carotid")) expect(row.points[0][0] * (row.id.endsWith("_l") ? 1 : -1)).toBeGreaterThan(0);
    }
  });
  it("fills left ICA reconstructions but never the right side or downstream of cervical contrast", () => {
    const bytes = readFileSync("public/neuro3d/open-anatomy/reference-surfaces.bin");
    const buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
    const geometry: ReferenceGeometry = new Map(metadata.structures.map((row) => [row.id, {
      id: row.id, layer: row.layer,
      positions: new Float32Array(buffer, row.positionsOffset, row.positionsCount),
      indices: new Uint32Array(buffer, row.indicesOffset, row.indicesCount),
    }]));
    for (const row of reconstructedArteries) geometry.set(row.id, { id: row.id, layer: "arterial", positions: new Float32Array(row.surface.positions), indices: new Uint32Array(row.surface.indices) });
    const state = { ...createStation("diagnostic", "reference"), contrast: { edge: "ref-ICA-L", at: 0 } };
    const surfaces = referenceContrast(state, geometry, opacifiedEdges(state, networkFor(state)));
    for (const row of reconstructedArteries) expect(surfaces.includes(geometry.get(row.id)!)).toBe(row.rootId === "internal_carotid_artery_l");
    const proximal = referenceContrast(state, geometry, ["access"]);
    for (const row of reconstructedArteries) expect(proximal.includes(geometry.get(row.id)!)).toBe(false);
  });
  it("disambiguates the repeated source number 105 by artery identity", () => {
    const rows = anatomicalInventory.filter((row) => row.number === "105");
    expect(rows).toHaveLength(2);
    expect(rows.find((row) => row.label === "inferior thyroid")?.ids.sort()).toEqual(["inferior_thyroid_artery_l", "inferior_thyroid_artery_r"]);
    expect(rows.find((row) => row.label === "supreme intercostal")?.ids.sort()).toEqual(["supreme_intercostal_artery_l", "supreme_intercostal_artery_r"]);
    expect(anatomicalInventory.find((row) => row.number === "106")?.status).toBe("missing");
    expect(anatomicalInventory.find((row) => row.number === "arch")?.ids).toEqual(["aortic_arch"]);
  });
  it("retains the full source index and never equates grouped or absent structures with complete geometry", () => {
    expect(anatomicalInventory).toHaveLength(142);
    expect(anatomicalInventory.find((row) => row.number === "2")?.status).toBe("reconstructed");
    expect(anatomicalInventory.find((row) => row.number === "109")?.status).toBe("missing");
    expect(anatomicalInventory.find((row) => row.number === "19")?.status).toBe("missing");
    expect(anatomicalInventory.find((row) => row.number === "95")?.status).toBe("missing");
  });
  it("anchors each root branch to its own carotid and preserves parent-child endpoints", () => {
    for (const branch of reconstructedArteries) {
      if (branch.parentId.startsWith("internal_carotid")) {
        const axis = branch.id.endsWith("_l") ? sourceAxes.originalAxes.internal_carotid_artery_l.points : accessAxes.originalAxes.internal_carotid_artery_r.points;
        expect(branch.points[0]).toEqual(axis[branch.anchorIndex]);
      } else if (branch.parentId.startsWith("external_carotid")) {
        const axis = branch.id.endsWith("_l") ? accessAxes.originalAxes.external_carotid_artery_l.points : accessAxes.originalAxes.external_carotid_artery_r.points;
        expect(branch.points[0]).toEqual(axis[branch.anchorIndex]);
      } else {
        const parent = reconstructedArteries.find(row => row.id === branch.parentId)!;
        expect(branch.points[0]).toEqual("parentAnchorIndex" in branch ? parent.points[Number(branch.parentAnchorIndex)] : parent.points.at(-1));
      }
    }
  });
});
