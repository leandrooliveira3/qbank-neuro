import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { openAnatomy } from "./openAnatomy";

describe("imported open anatomical assets", () => {
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
