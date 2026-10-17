import { Color, Material, MeshStandardMaterial } from "three";

export function cloneAtlasMaterial(source: Material) {
  const material = source.clone();
  const standard = material instanceof MeshStandardMaterial ? material : null;
  const original = {
    opacity: material.opacity,
    transparent: material.transparent,
    depthWrite: material.depthWrite,
    emissive: standard?.emissive.clone(),
    emissiveIntensity: standard?.emissiveIntensity,
  };
  return {
    material,
    update(layerOpacity: number, selected: boolean) {
      const factor = Number.isFinite(layerOpacity)
        ? Math.max(0, Math.min(1, layerOpacity))
        : 1;
      material.opacity = original.opacity * factor;
      const transparent = original.transparent || factor < 1;
      if (material.transparent !== transparent) material.needsUpdate = true;
      material.transparent = transparent;
      material.depthWrite = factor < 1 ? false : original.depthWrite;
      if (standard && original.emissive) {
        standard.emissive.copy(selected ? new Color("#237c72") : original.emissive);
        standard.emissiveIntensity = selected ? 0.65 : original.emissiveIntensity!;
      }
    },
  };
}
