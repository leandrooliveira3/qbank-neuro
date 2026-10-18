import { describe, expect, it } from "vitest";
import { anatomicalInventory, diagramRegistry } from "./anatomicalInventory";
import { openAnatomy } from "./openAnatomy";
import { reconstructedArteries } from "./reconstructedArteries";

describe("Neuroangio numbered anatomical correspondence", () => {
  it("retains atomic legend entries and source ambiguities", () => {
    expect(new Set(anatomicalInventory.map(row => row.key)).size).toBe(anatomicalInventory.length);
    expect(anatomicalInventory.filter(row => row.sourceEvidence === "legend")).toHaveLength(130);
    expect(anatomicalInventory.filter(row => row.sourceEvidence === "figure-only")).toHaveLength(6);
    for (const number of ["12a", "14a", "14b", "26a", "37a", "116a", "116b"])
      expect(anatomicalInventory.find(row => row.number === number)?.sourceEvidence).toBe("legend");
    expect(anatomicalInventory.filter(row => row.number === "8")).toHaveLength(1);
    expect(anatomicalInventory.filter(row => row.number === "105")).toHaveLength(2);
    expect(anatomicalInventory.find(row => row.number === "107")?.status).toBe("unresolved");
    expect(anatomicalInventory.find(row => row.number === "107")?.ids).toEqual([]);
    for (const row of anatomicalInventory.filter(row => row.sourceEvidence === "figure-only")) {
      expect(row.status).toBe("unresolved"); expect(row.ids).toEqual([]);
    }
  });
  it("does not substitute ordinary intracranial arteries for the ventral ophthalmic variant", () => {
    const variant = anatomicalInventory.find(row => row.number === "109")!;
    expect(variant.kind).toBe("variant"); expect(variant.ids).toEqual([]);
    for (const number of ["110", "111", "112", "114", "115", "116", "117", "118"])
      expect(anatomicalInventory.find(row => row.number === number)?.ids.length).toBeGreaterThan(0);
  });
  it("separates sphenopalatine septal supply from connected ethmoidal supply", () => {
    const septal = anatomicalInventory.find(row => row.number === "63")!;
    expect(septal.ids.every(id => id.startsWith("posterior_septal_branches_of_sphenopalatine_artery"))).toBe(true);
    expect(septal.status).toBe("partial");
    expect(septal.relations.some(relation => relation.toNumber === "66")).toBe(true);
    expect(septal.relations.some(relation => relation.toNumber === "67")).toBe(true);
    expect(anatomicalInventory.find(row => row.number === "8")?.ids).toHaveLength(4);
  });
  it("does not claim a complete arcade from one branch or a complete MCA from M1", () => {
    for (const number of ["17", "18", "36", "37"]) {
      const row = anatomicalInventory.find(item => item.number === number)!;
      expect(row.status).toBe("partial"); expect(row.geometryKinds).toEqual(["reconstructed"]);
    }
    expect(anatomicalInventory.find(row => row.number === "118")?.status).toBe("partial");
    expect(anatomicalInventory.find(row => row.number === "57")?.status).toBe("imported");
  });
  it("maps only arterial geometry, never nerves, venous sinuses or glands", () => {
    const structures = new Map([...openAnatomy.structures, ...reconstructedArteries].map(item => [item.id, item]));
    for (const row of anatomicalInventory) for (const id of row.ids) expect(structures.get(id)?.layer, id).toBe("arterial");
    for (const number of ["12a", "14b", "15", "94", "96", "116a", "116b"])
      expect(anatomicalInventory.find(row => row.number === number)?.ids).toEqual([]);
  });
  it("keeps referenced network relations separate from the simulation flow graph", () => {
    const numbers = new Set(anatomicalInventory.map(row => row.number));
    for (const relation of diagramRegistry.relations) {
      expect(numbers.has(relation.fromNumber)).toBe(true); expect(numbers.has(relation.toNumber)).toBe(true);
      expect(relation.flowModel).toBe(false); expect(relation.geometryStatus).toBe("not-validated");
      expect(relation.reference.startsWith("https://neuroangio.org/")).toBe(true);
    }
    for (const row of anatomicalInventory) if (row.parent) expect(numbers.has(row.parent), row.key).toBe(true);
  });
});
