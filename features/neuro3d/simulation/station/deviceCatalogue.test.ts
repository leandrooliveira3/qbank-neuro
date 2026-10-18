import { describe, expect, it } from "vitest";
import { deviceCatalogue, validCatalogueChoice, catalogueFamilies, catalogueBehavior } from "./deviceCatalogue";
import { createStation, stationReducer } from "./engine";
describe("user device catalogue", () => {
  it("preserves all classes, products, kits and representative-specification provenance", () => {
    expect(deviceCatalogue.records).toHaveLength(41);
    expect(deviceCatalogue.records.flatMap(r => r.products)).toHaveLength(147);
    expect(deviceCatalogue.kits).toHaveLength(14);
    expect(new Set(deviceCatalogue.records.map(r => r.id)).size).toBe(41);
    expect(deviceCatalogue.sourceSha256).toMatch(/^[a-f0-9]{64}$/);
    for (const record of deviceCatalogue.records) {
      expect(record.specificationStatus).toContain("not-independently-IFU-verified");
      expect(record.dimensions.length).toBeGreaterThan(0);
      for (const product of record.products) expect(validCatalogueChoice({recordId: record.id, product})).toBe(true);
    }
    expect(deviceCatalogue.kits.every(k => k.composition.length > 20)).toBe(true);
  });
  it("rejects fabricated products and incompatible class mappings, and keeps unsupported products catalogue-only", () => {
    const state = createStation("diagnostic", "reference");
    const record = deviceCatalogue.records.find(r => catalogueFamilies[r.id] === "retriever")!;
    const choice = {recordId: record.id, product: record.products[0]};
    const added = stationReducer(state, {type: "catalogue-add", choice});
    expect(added.catalogueTray).toEqual([choice]);
    expect(stationReducer(added, {type: "catalogue-add", choice})).toBe(added);
    expect(stationReducer(state, {type: "catalogue-add", choice: {...choice, product: "fabricated"}})).toBe(state);
    expect(stationReducer(state, {type: "load", family: "coil", catalogueChoice: choice})).toBe(state);
    expect(stationReducer(state, {type: "load", family: "retriever", catalogueChoice: choice}).device?.catalogueChoice).toEqual(choice);
    const liquid = deviceCatalogue.records.find(r => r.products.some(p => p.includes("Onyx")))!;
    expect(catalogueBehavior(liquid.id)).toContain("pendente");
    expect(stationReducer(state, {type: "load", family: "coil", catalogueChoice: {recordId: liquid.id, product: liquid.products[0]}})).toBe(state);
    expect(stationReducer(state, {type: "catalogue-kit", id: "unknown"})).toBe(state);
    expect(stationReducer(state, {type: "catalogue-kit", id: deviceCatalogue.kits[0].id}).preparedKit).toBe(deviceCatalogue.kits[0].id);
  });
});
