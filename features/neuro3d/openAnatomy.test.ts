import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { gunzipSync } from "node:zlib";
import bodyPack from "./reference-body-access.json";
import contextPack from "./reference-craniocervical.json";
import context from "./craniocervical.json";
import { initialOpacity, openLayerNames } from "./openAnatomy";
import { openAnatomy, worldPoint } from "./openAnatomy";

describe("imported open anatomical assets", () => {
  it("preserves head/neck context identity, layer semantics and projection coordinates", () => {
    expect(context.sourceCommit).toBe(openAnatomy.sourceCommit);
    expect(context.license).toBe("CC-BY-SA-4.0");
    for (const id of ["trochlear_nerve_iv_l", "trochlear_nerve_iv_r", "abducens_nerve_vi_l", "abducens_nerve_vi_r", "thyroid_gland", "pineal_gland", "parotid_gland_l", "intervertebral_disc_c2_c3", "pterygospinous_ligament_r", "carotid_triangle_l", "right_brachiocephalic_vein"])
      expect(context.structures.some(row => row.id === id), id).toBe(true);
    const bytes = readFileSync(`public/neuro3d/open-anatomy/${contextPack.file}`);
    expect(bytes.length).toBe(contextPack.size);
    expect(createHash("sha256").update(bytes).digest("hex")).toBe(contextPack.sha256);
    const decoded = gunzipSync(bytes); expect(decoded.length).toBe(contextPack.uncompressedSize);
    const rows = JSON.parse(decoded.toString()) as {id: string; layer: string; positions: number[]; indices: number[]}[];
    expect(new Set(rows.map(row => row.id)).size).toBe(context.structures.length);
    expect(rows).toHaveLength(context.structures.length);
    for (const row of rows) {
      const source = context.structures.find(item => item.id === row.id)!;
      expect(source, row.id).toBeDefined();
      expect(row.layer).toBe(source.layer);
      expect(openLayerNames[row.layer], row.id).toBeTruthy();
      expect(initialOpacity[row.layer], row.id).toBeGreaterThanOrEqual(0);
      const low = worldPoint(source.bounds[0]), high = worldPoint(source.bounds[1]);
      expect(row.indices.length % 3).toBe(0);
      expect(row.indices.length).toBeGreaterThan(0);
      expect(row.indices.every(index => Number.isInteger(index) && index >= 0 && index < row.positions.length / 3)).toBe(true);
      expect(row.positions.every((value, i) => Number.isFinite(value) && value >= low[i % 3] - .02 && value <= high[i % 3] + .02), row.id).toBe(true);
    }
    for (const row of context.structures.filter(item => item.id.includes('sinus_of_') || item.id.includes('_cells_of_ethmoid_')))
      expect(row.layer).toBe("cavity");
  });
  it("includes skull-base bones, pituitary lobes, dura and cavernous landmarks in distinct layers", () => {
    const expected = { sphenoid_bone: "bone", ethmoid_bone: "bone", frontal_bone: "bone", occipital_bone: "bone", temporal_bone_l: "bone", parietal_bone_r: "bone", adenohypophysis: "gland", neurohypophysis: "gland", falx_cerebri: "dura", tentorium_cerebelli_l: "dura", cavernous_sinus_l: "venous", cavernous_sinus_r: "venous" };
    for (const [id, layer] of Object.entries(expected)) expect(openAnatomy.structures.find((row) => row.id === id)?.layer, id).toBe(layer);
    expect(openAnatomy.structures.filter((row) => row.layer === "bone").some((row) => row.id.includes("sinus_of_"))).toBe(false);
  });
  it("keeps the added aortic and access projection meshes in their original world frame", () => {
    const bytes = readFileSync(`public/neuro3d/open-anatomy/${bodyPack.file}`);
    expect(bytes.length).toBe(bodyPack.size);
    expect(createHash("sha256").update(bytes).digest("hex")).toBe(bodyPack.sha256);
    const decoded = gunzipSync(bytes); expect(decoded.length).toBe(bodyPack.uncompressedSize);
    const rows = JSON.parse(decoded.toString()) as {id: string; positions: number[]; indices: number[]}[];
    expect(rows).toHaveLength(8);
    for (const row of rows) {
      const source = openAnatomy.structures.find(item => item.id === row.id)!;
      const low = worldPoint(source.bounds[0]), high = worldPoint(source.bounds[1]);
      expect(row.indices.every(index => index >= 0 && index < row.positions.length / 3)).toBe(true);
      expect(row.positions.every((value, i) => Number.isFinite(value) && value >= low[i % 3] - .02 && value <= high[i % 3] + .02)).toBe(true);
    }
  });
  it("maps every structure to one preserved GLB node and verifies delivered bytes", () => {
    const ids = new Set<string>();
    for (const asset of openAnatomy.assets) {
      const bytes = readFileSync(`public/neuro3d/open-anatomy/${asset.file}`);
      expect(createHash("sha256").update(bytes).digest("hex")).toBe(asset.sha256);
      const length = bytes.readUInt32LE(12);
      const glb = JSON.parse(bytes.subarray(20, 20 + length).toString());
      const nodes = glb.nodes as { extras: { qbankAnatomyId: string } }[];
      const rows = openAnatomy.structures.filter((o) => o.file === asset.file);
      expect(nodes.length).toBe(rows.length);
      for (const row of rows) {
        expect(ids.has(row.id)).toBe(false); ids.add(row.id);
        expect(nodes.filter((n) => n.extras.qbankAnatomyId === row.id)).toHaveLength(1);
        expect(row.bounds.flat().every(Number.isFinite)).toBe(true);
        for (let k = 0; k < 3; k++) expect(row.bounds[0][k]).toBeLessThanOrEqual(row.bounds[1][k]);
      }
    }
    for (const name of ["Basilar artery", "Internal carotid artery.l", "Cavernous sinus.l", "Optic chiasm.l", "Atlas (C1)"])
      expect(openAnatomy.structures.some((o) => o.node === name), name).toBe(true);
    expect(readFileSync("public/neuro3d/open-anatomy/NOTICE", "utf8")).toContain("CC BY-SA 4.0");
  });
});
