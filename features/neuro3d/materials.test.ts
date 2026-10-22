import { describe, expect, it } from "vitest";
import { MeshStandardMaterial, Texture } from "three";
import { cloneAtlasMaterial } from "./materials";

describe("authored anatomical materials", () => {
  it("preserves textures and surface parameters without changing cached GLB materials", () => {
    const map = new Texture();
    const source = new MeshStandardMaterial({ color: "#e8d6b0", map, roughness: 0.8, metalness: 0 });
    const entry = cloneAtlasMaterial(source);
    const material = entry.material as MeshStandardMaterial;
    entry.update(0.3, true);
    expect(material.map).toBe(map);
    expect(material.roughness).toBe(0.8);
    expect(material.color.equals(source.color)).toBe(true);
    expect(source.opacity).toBe(1);
    expect(source.emissive.getHex()).toBe(0);
    expect(material.opacity).toBe(0.3);
    expect(material.depthWrite).toBe(false);
    entry.update(1, false);
    expect(material.opacity).toBe(1);
    expect(material.transparent).toBe(false);
    expect(material.depthWrite).toBe(true);
    expect(material.emissive.equals(source.emissive)).toBe(true);
  });
  it("restores authored transparency instead of accumulating opacity changes", () => {
    const entry = cloneAtlasMaterial(new MeshStandardMaterial({ opacity: 0.6, transparent: true, depthWrite: false }));
    entry.update(0.5, false);
    entry.update(0.5, false);
    expect(entry.material.opacity).toBe(0.3);
    entry.update(1, false);
    expect(entry.material.opacity).toBe(0.6);
    expect(entry.material.transparent).toBe(true);
    expect(entry.material.depthWrite).toBe(false);
  });
});
