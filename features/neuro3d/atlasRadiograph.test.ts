import { describe, expect, it } from "vitest";
import { BoxGeometry } from "three";
import { renderAtlasRadiograph, type AtlasProjectionRequest } from "./atlasRadiograph";
import { atlasProjection } from "./atlasProjection";
import { WIDTH, HEIGHT } from "./simulation/station/projectionMath";

describe("worker-safe source atlas projection", () => {
  it("keeps nonvascular context out of iodine and bone signal while allowing selected annotations", () => {
    const cube = new BoxGeometry(1, 1, 1);
    const base = {id: "context", positions: new Float32Array(cube.attributes.position.array), indices: new Uint32Array(cube.index!.array)};
    const request: AtlasProjectionRequest = {id: 1, view: atlasProjection(0, 0, 1), contrastLayer: "both", layers: {}, selected: null, isolate: false, boneOpacity: 1};
    const empty = renderAtlasRadiograph([], request);
    for (const layer of ["muscle", "ligament", "cartilage", "cavity", "region", "attachment", "lymphatic", "gland", "nerve", "visceral"]) {
      const surface = {...base, layer};
      const unselected = renderAtlasRadiograph([surface], {...request, layers: {[layer]: 1}});
      expect(unselected.every((value, i) => value === empty[i])).toBe(true);
      const annotated = renderAtlasRadiograph([surface], {...request, selected: "context"});
      const center = (HEIGHT / 2 * WIDTH + WIDTH / 2) * 4;
      expect(annotated[center]).toBeGreaterThan(annotated[center + 2]);
    }
    cube.dispose();
  });
  it("separates arterial/venous signal and keeps hidden selected landmarks as gold annotations", () => {
    const cube = new BoxGeometry(1, 1, 1);
    const surface = {id: "artery", layer: "arterial", positions: new Float32Array(cube.attributes.position.array), indices: new Uint32Array(cube.index!.array)};
    const vein = {...surface, id: "vein", layer: "venous", positions: surface.positions.map((v, i) => i % 3 === 0 ? v + 4 : v)};
    const request: AtlasProjectionRequest = {id: 1, view: atlasProjection(0, 0, 1, [0,0,0]), contrastLayer: "arterial", layers: {arterial: 1, venous: 1}, selected: null, isolate: false, boneOpacity: 0};
    const at = (x: number) => (HEIGHT / 2 * WIDTH + WIDTH / 2 + x * 12) * 4;
    const arterial = renderAtlasRadiograph([surface, vein], request);
    const venous = renderAtlasRadiograph([surface, vein], {...request, contrastLayer: "venous"});
    expect(arterial[at(0)]).toBeLessThan(venous[at(0)]);
    expect(venous[at(4)]).toBeLessThan(arterial[at(4)]);
    const annotated = renderAtlasRadiograph([surface, vein], {...request, contrastLayer: "venous", selected: "artery", layers: {arterial: 0, venous: 1}});
    expect(annotated[at(0)]).toBeGreaterThan(annotated[at(0) + 2]);
    expect(annotated.slice(at(4), at(4) + 4)).toEqual(venous.slice(at(4), at(4) + 4));
    cube.dispose();
  });
});
