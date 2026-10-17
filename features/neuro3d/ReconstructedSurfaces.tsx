import React, { useEffect, useMemo } from "react";
import { BufferGeometry, Float32BufferAttribute, Plane, Vector3 } from "three";
import { reconstructedArteries } from "./reconstructedArteries";

export default function ReconstructedSurfaces({ opacity, selected, isolate, cut, onSelect }: {
  opacity: Record<string, number>; selected: string | null; isolate: boolean;
  cut: { axis: string; offset: number }; onSelect: (id: string) => void;
}) {
  const meshes = useMemo(() => reconstructedArteries.map((item) => {
    const geometry = new BufferGeometry();
    geometry.setAttribute("position", new Float32BufferAttribute(item.surface.positions, 3));
    geometry.setIndex(Array.from(item.surface.indices)); geometry.computeVertexNormals();
    return { item, geometry };
  }), []);
  const planes = useMemo(() => cut.axis === "none" ? [] : [new Plane(new Vector3(
    cut.axis === "sagittal" ? -1 : 0, cut.axis === "axial" ? -1 : 0, cut.axis === "coronal" ? -1 : 0), cut.offset)], [cut]);
  useEffect(() => () => meshes.forEach(({ geometry }) => geometry.dispose()), [meshes]);
  return <group>{meshes.map(({ item, geometry }) => <mesh key={item.id} geometry={geometry}
    visible={(opacity.arterial ?? 1) > 0 && (!isolate || !selected || selected === item.id)}
    onAfterRender={(renderer) => { renderer.domElement.dataset.detailedAtlasRendered = "true"; }}
    onClick={(event) => { event.stopPropagation(); onSelect(item.id); }}>
    <meshStandardMaterial color={selected === item.id ? "#ffe4a5" : "#dc985e"} roughness={0.6}
      opacity={opacity.arterial ?? 1} transparent={(opacity.arterial ?? 1) < 1}
      depthWrite={(opacity.arterial ?? 1) === 1} clippingPlanes={planes} />
  </mesh>)}</group>;
}
