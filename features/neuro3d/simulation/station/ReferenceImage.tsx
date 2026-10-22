import React, { useEffect, useMemo, useRef } from "react";
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
  const canvasRef = useRef<HTMLCanvasElement>(null);
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
  const pixels = useMemo(() => {
    if (!projections.length) return null;
    const thickness = new Float32Array(WIDTH * HEIGHT);
    for (const group of projections) {
      const concentration = bone ? 1 : bolusConcentration(age, times.get(group.id) ?? 0);
      for (let i = 0; i < thickness.length; i++) thickness[i] += group.pixels[i] * concentration;
    }
    return bone ? attenuationRGBA(thickness, 0.45) : contrastOverlay(thickness, WIDTH, HEIGHT, 1, inverted);
  }, [projections, bone, inverted, age, times]);
  useEffect(() => {
    if (pixels) canvasRef.current?.getContext("2d")?.putImageData(new ImageData(pixels, WIDTH, HEIGHT), 0, 0);
  }, [pixels]);
  if (error) return <text x="20" y="60" fill="#8c3028">{error}</text>;
  // Paint pixels directly; encoding and decoding a PNG on every pulse blocks interaction.
  return pixels ? <foreignObject width={WIDTH} height={HEIGHT} opacity={opacity} pointerEvents="none">
    <canvas ref={canvasRef} width={WIDTH} height={HEIGHT} style={{ width: "100%", height: "100%", display: "block" }}
      data-testid={bone ? "reference-bone-projection" : inverted ? "reference-roadmap" : "reference-angiogram"}
      data-contrast-age={bone ? undefined : age.toFixed(2)} role="img" aria-label={bone ? "Projeção óssea" : inverted ? "Roadmap capturado" : "Passagem do contraste"} />
  </foreignObject> : null;
}
