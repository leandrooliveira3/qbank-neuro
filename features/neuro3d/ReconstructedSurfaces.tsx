import React, { useEffect, useMemo } from "react";
import { BufferGeometry, Float32BufferAttribute, Plane, Vector3 } from "three";
import { reconstructedVessels } from "./reconstructedVessels";
import { structureVisible, visibleAtlasRaycast, type AtlasTool, type PickScope } from "./atlasInteraction";

const noHiddenStructures: ReadonlySet<string> = new Set();
export default function ReconstructedSurfaces({ opacity, selected, isolate, cut, onSelect, angiographic = false, contrastLayer = "both", hidden = noHiddenStructures, tool = "select", pickScope = "arterial" }: {
  hidden?: ReadonlySet<string>; tool?: AtlasTool; pickScope?: PickScope;
  angiographic?: boolean; contrastLayer?: string; opacity: Record<string, number>; selected: string | null; isolate: boolean;
  cut: { axis: string; offset: number }; onSelect: (id: string) => void;
}) {
  const meshes = useMemo(() => reconstructedVessels.map((item) => {
    const geometry = new BufferGeometry();
    geometry.setAttribute("position", new Float32BufferAttribute(item.surface.positions, 3));
    geometry.setIndex(Array.from(item.surface.indices)); geometry.computeVertexNormals();
    return { item, geometry };
  }), []);
  const planes = useMemo(() => cut.axis === "none" ? [] : [new Plane(new Vector3(
    cut.axis === "sagittal" ? -1 : 0, cut.axis === "axial" ? -1 : 0, cut.axis === "coronal" ? -1 : 0), cut.offset)], [cut]);
  useEffect(() => () => meshes.forEach(({ geometry }) => geometry.dispose()), [meshes]);
  return <group>{meshes.map(({ item, geometry }) => <mesh key={item.id} geometry={geometry}
    visible={structureVisible(item.id, item.layer, opacity, selected, isolate, hidden, angiographic, contrastLayer)} raycast={visibleAtlasRaycast} userData={{ atlasPickable: tool === "select" && (pickScope === "all" || pickScope === "vascular" || pickScope === item.layer) }}
    onAfterRender={(renderer) => { renderer.domElement.dataset.detailedAtlasRendered = "true"; }}
    onClick={(event) => { event.stopPropagation(); if (tool === "select" && event.button === 0 && event.object.visible && event.object.userData.atlasPickable && event.delta <= 3) onSelect(item.id); }}>
    <meshStandardMaterial color={selected === item.id ? "#ffe4a5" : angiographic ? "#c0ccd5" : item.layer === "venous" ? "#779ed2" : "#dc985e"} roughness={0.6}
      opacity={opacity[item.layer] ?? 1} transparent={(opacity[item.layer] ?? 1) < 1}
      depthWrite={(opacity[item.layer] ?? 1) === 1} clippingPlanes={planes} />
  </mesh>)}</group>;
}
