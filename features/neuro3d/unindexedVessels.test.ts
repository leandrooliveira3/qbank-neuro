import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { gunzipSync } from "node:zlib";
import recovered from "./unindexed-vessels.json";
import projection from "./reference-unindexed-vessels.json";
import { anatomicalInventory } from "./anatomicalInventory";
import { openAnatomy, worldPoint } from "./openAnatomy";

describe("source vessels omitted by the upstream organ manifest", () => {
  it("restores both MCA M2/M3 sides and records every addition under item 118", () => {
    const row = anatomicalInventory.find(item => item.number === "118")!;
    expect(recovered.structures).toHaveLength(28);
    expect(row.status).toBe("partial");
    expect(row.ids).toHaveLength(34);
    for (const side of ["l", "r"]) for (const id of ["middle_cerebral_artery_m1_segment", "middle_cerebral_artery_m3_segment", "insular_branches_of_middle_cerebral_artery_m2"])
      expect(row.ids, id).toContain(`${id}_${side}`);
    for (const structure of recovered.structures) {
      expect(row.ids.includes(structure.id)).toBe(structure.sourceRegion === "mca");
      expect(openAnatomy.structures.filter(item => item.id === structure.id)).toHaveLength(1);
    }
    const cervical = anatomicalInventory.find(item => item.number === "transverse-cervical")!;
    expect(cervical.ids).toHaveLength(6);
    expect(cervical.ids).toContain("deep_branch_of_transverse_cervical_artery_l");
    expect(cervical.ids).toContain("superficial_branch_of_transverse_cervical_artery_r");
    expect(cervical.ids).not.toContain("deep_cervical_artery_l");
    // Facial angular arteries and the angular gyrus itself are different entities.
    expect(row.ids.some(id => /^angular_artery_[lr]$/.test(id))).toBe(false);
    expect(row.ids.some(id => /^angular_gyrus_[lr]$/.test(id))).toBe(false);
    expect(row.ids).toContain("arterial_branch_to_angular_gyrus_l");
  });
  it("preserves the source node transforms and excludes unknown labels", () => {
    const asset = recovered.assets[0];
    const raw = readFileSync(`public/neuro3d/open-anatomy/${asset.file}`);
    expect(createHash("sha256").update(raw).digest("hex")).toBe(asset.sha256);
    expect(asset.upstreamSha256).toBe(openAnatomy.assets.find(item => item.file === "cardiovascular_head.glb")?.upstreamSha256);
    const length = raw.readUInt32LE(12);
    const doc = JSON.parse(raw.subarray(20, 20 + length).toString());
    expect(doc.nodes).toHaveLength(28);
    expect(new Set(doc.nodes.map((node: {extras: {qbankAnatomyId: string}}) => node.extras.qbankAnatomyId)).size).toBe(28);
    for (const row of recovered.structures) {
      expect(row.layer).toBe("arterial");
      expect(row.name.includes("?")).toBe(false);
      expect(row.reviewStatus).toBe("source-node-label-unreviewed");
      const node = doc.nodes.find((item: {name: string}) => item.name === row.node);
      expect(node?.extras.qbankAnatomyId).toBe(row.id);
      expect(row.bounds[0][1]).toBeGreaterThan(row.sourceRegion === "mca" ? 1.48 : 1.2);
      expect(row.bounds[1][1]).toBeLessThan(1.75);
    }
  });
  it("projects the same geometry IDs in the shared world frame with valid triangles", () => {
    const bytes = readFileSync(`public/neuro3d/open-anatomy/${projection.file}`);
    expect(bytes.length).toBe(projection.size);
    expect(createHash("sha256").update(bytes).digest("hex")).toBe(projection.sha256);
    const decoded = gunzipSync(bytes);
    expect(decoded.length).toBe(projection.uncompressedSize);
    const rows = JSON.parse(decoded.toString()) as {id: string; layer: string; positions: number[]; indices: number[]}[];
    expect(rows).toHaveLength(28);
    for (const row of rows) {
      const item = recovered.structures.find(item => item.id === row.id)!;
      expect(item, row.id).toBeDefined();
      expect(row.layer).toBe("arterial");
      const low = worldPoint(item.bounds[0]), high = worldPoint(item.bounds[1]);
      expect(row.positions.length % 3).toBe(0);
      expect(row.indices.length % 3).toBe(0);
      expect(row.indices.every(index => Number.isInteger(index) && index >= 0 && index < row.positions.length / 3)).toBe(true);
      expect(row.positions.every((value, i) => Number.isFinite(value) && value >= low[i % 3] - .02 && value <= high[i % 3] + .02), row.id).toBe(true);
    }
  });
});
