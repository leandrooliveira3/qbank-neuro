import React, { useMemo } from "react";
import { StationState, networkFor } from "./engine";
import { useReferenceGeometry } from "./referenceGeometry";
import { referenceContrast } from "./referenceScene";
import { HEIGHT, WIDTH, projectSpatial } from "./imaging";
import { attenuationRGBA } from "./radiograph";
import { projectThickness, contrastOverlay } from "./detector";
import { arrivalTimes, bolusConcentration } from "./contrast";

export default function ReferenceImage({ state, edges = [], plane, opacity, bone = false, inverted = false }: {
  state: StationState; edges?: string[]; plane: number; opacity: number; bone?: boolean; inverted?: boolean;
}) {
  const { geometry, error } = useReferenceGeometry(state.archProfile);
  const edgeKey = edges.join("|");
  // The expensive projections depend on geometry and pose, not the simulation clock.
  const groups = useMemo(() => {
    if (!geometry) return [];
    return bone ? [{ id: "bone", surfaces: [...geometry.values()].filter((surface) => surface.layer === "bone") }]
      : edges.map((id) => ({ id, surfaces: referenceContrast(state, geometry, [id]) }));
  }, [geometry, bone, edgeKey, state.caseId, state.clot, state.dilation, state.geometry, state.referenceEntry, state.archProfile]);
  const projections = useMemo(() => groups.map((group) => ({ id: group.id,
    pixels: projectThickness(group.surfaces, (point) => projectSpatial(point, state.view, plane), WIDTH, HEIGHT),
  })), [groups, state.view, plane]);
  const network = useMemo(() => networkFor(state), [state.caseId, state.geometry, state.referenceEntry, state.archProfile]);
  const origin = inverted ? state.mask?.contrastOrigin : state.contrast;
  const times = useMemo(() => arrivalTimes(network, origin?.edge ?? edges[0] ?? "access", origin?.originT ?? 0), [network, origin?.edge, origin?.originT, edgeKey]);
  const age = bone ? 0 : inverted ? state.mask?.contrastAge ?? 1.2 : state.contrast ? state.clock - state.contrast.at : 20;
  const url = useMemo(() => {
    if (!projections.length) return null;
    const canvas = document.createElement("canvas"); canvas.width = WIDTH; canvas.height = HEIGHT;
    const context = canvas.getContext("2d"); if (!context) return null;
    const thickness = new Float32Array(WIDTH * HEIGHT);
    for (const group of projections) {
      const concentration = bone ? 1 : bolusConcentration(age, times.get(group.id) ?? 0);
      for (let i = 0; i < thickness.length; i++) thickness[i] += group.pixels[i] * concentration;
    }
    const pixels = bone ? attenuationRGBA(thickness, 0.45) : contrastOverlay(thickness, WIDTH, HEIGHT, 1, inverted);
    context.putImageData(new ImageData(pixels, WIDTH, HEIGHT), 0, 0);
    return canvas.toDataURL();
  }, [projections, bone, inverted, age, times]);
  if (error) return <text x="20" y="60" fill="#8c3028">{error}</text>;
  return url ? <image data-testid={bone ? "reference-bone-projection" : inverted ? "reference-roadmap" : "reference-angiogram"} data-contrast-age={bone ? undefined : age.toFixed(2)} href={url} width={WIDTH} height={HEIGHT} opacity={opacity} /> : null;
}
