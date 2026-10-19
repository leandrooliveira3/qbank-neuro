import { Mesh, type Intersection, type Raycaster, type MeshStandardMaterial } from "three";

export type AtlasTool = "select" | "rotate" | "pan";
export type PickScope = "vascular" | "arterial" | "venous" | "all";

export function structureVisible(id: string, layer: string, opacity: Record<string, number>, selected: string | null,
  isolate: boolean, hidden: ReadonlySet<string>, angiographic = false, contrastLayer = "arterial") {
  return !hidden.has(id) && (opacity[layer] ?? 1) > 0 && (!isolate || !selected || selected === id)
    && (!angiographic || layer === "bone" || (contrastLayer === "both" ? layer === "arterial" || layer === "venous" : layer === contrastLayer));
}

/** Rendering visibility and GPU clipping do not automatically constrain Three's raycaster. */
export function visibleAtlasRaycast(this: Mesh, raycaster: Raycaster, intersections: Intersection[]) {
  if (this.userData.atlasPickable === false) return;
  for (let object = this as Mesh | null; object; object = object.parent as Mesh | null) if (!object.visible) return;
  const material = this.material as MeshStandardMaterial;
  if (!material.visible || material.opacity <= 0) return;
  const hits: Intersection[] = [];
  Mesh.prototype.raycast.call(this, raycaster, hits);
  for (const hit of hits) if (!material.clippingPlanes?.some(plane => plane.distanceToPoint(hit.point) < 0)) intersections.push(hit);
}
