import { describe, it, expect } from "vitest";
import { BoxGeometry, Group, Mesh, MeshStandardMaterial, Plane, Raycaster, Vector3 } from "three";
import { structureVisible, visibleAtlasRaycast } from "./atlasInteraction";

describe("atlas picking follows displayed anatomy", () => {
  it("never reveals a selected structure whose layer or individual visibility is off", () => {
    expect(structureVisible("bone", "bone", {bone: 0}, "bone", false, new Set())).toBe(false);
    expect(structureVisible("artery", "arterial", {arterial: 1}, "artery", true, new Set(["artery"]))).toBe(false);
    expect(structureVisible("nerve", "nerve", {nerve: 1}, "nerve", false, new Set(), true)).toBe(false);
    expect(structureVisible("artery", "arterial", {arterial: 1}, "artery", true, new Set())).toBe(true);
  });
  it("picks the vessel behind invisible, nonselectable or clipped foreground context", () => {
    const front = new Mesh(new BoxGeometry(2, 2, 1), new MeshStandardMaterial());
    const vessel = new Mesh(new BoxGeometry(1, 1, 1), new MeshStandardMaterial());
    front.position.z = 2; front.raycast = visibleAtlasRaycast; vessel.raycast = visibleAtlasRaycast;
    const root = new Group(); root.add(front, vessel); root.updateMatrixWorld(true);
    const ray = new Raycaster(new Vector3(0,0,5), new Vector3(0,0,-1));
    expect(ray.intersectObjects([root])[0].object).toBe(front);
    front.visible = false;
    expect(ray.intersectObjects([root])[0].object).toBe(vessel);
    front.visible = true; front.userData.atlasPickable = false;
    expect(ray.intersectObjects([root])[0].object).toBe(vessel);
    front.userData.atlasPickable = true; front.material.clippingPlanes = [new Plane(new Vector3(0,0,-1), 1)];
    expect(ray.intersectObjects([root])[0].object).toBe(vessel);
    root.visible = false;
    expect(ray.intersectObjects([root])).toHaveLength(0);
    for (const mesh of [front, vessel]) { mesh.geometry.dispose(); mesh.material.dispose(); }
  });
});
