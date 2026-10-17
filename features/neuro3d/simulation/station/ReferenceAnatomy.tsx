import React, { useEffect, useMemo } from "react";
import { BufferGeometry, Float32BufferAttribute, DoubleSide } from "three";
import type { Surface } from "./surfaces";
import { useReferenceGeometry, routeSurface } from "./referenceGeometry";
import { caseFor, networkFor, StationState } from "./engine";
import { sourceFraction } from "./referenceNetwork";
import { sacRadius, vesselSurface } from "./surfaces";

function SurfaceMesh({ surface, color, opacity }: { surface: Surface; color: string; opacity: number }) {
  const geometry = useMemo(() => {
    const mesh = new BufferGeometry();
    mesh.setAttribute("position", new Float32BufferAttribute(surface.positions, 3));
    mesh.setIndex(Array.from(surface.indices)); mesh.computeVertexNormals();
    return mesh;
  }, [surface]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return <mesh geometry={geometry}><meshStandardMaterial color={color} roughness={0.65} transparent opacity={opacity} depthWrite={false} side={DoubleSide} /></mesh>;
}
export default function ReferenceAnatomy({ s }: { s: StationState }) {
  const { geometry } = useReferenceGeometry();
  const network = networkFor(s), definition = caseFor(s);
  const surfaces = useMemo(() => {
    if (!geometry) return [];
    return [...geometry.values()].filter((surface) => surface.layer === "bone" || surface.layer === "arterial").map((surface) => {
      const target = network[definition.target];
      const lesion = definition.kind === "carotid" && surface.id === target.sourceId;
      return { id: surface.id, layer: surface.layer,
        surface: lesion ? routeSurface(surface, { ...target, sourceRange: [0, 1] }, 1, {
          center: sourceFraction(target, definition.targetT), dilation: s.dilation,
        }) : surface,
      };
    });
  }, [geometry, network, definition, s.dilation]);
  const sac = useMemo(() => network.sac ? vesselSurface(network.sac, sacRadius) : null, [network]);
  return <group>
    {surfaces.map((entry) => <SurfaceMesh key={entry.id} surface={entry.surface}
      color={entry.layer === "bone" ? "#d7c8ac" : "#bf6878"}
      opacity={entry.layer === "bone" ? s.view.boneOpacity * 0.4 : 0.2} />)}
    {sac && <SurfaceMesh surface={sac} color="#d95c77" opacity={0.3} />}
  </group>;
}
