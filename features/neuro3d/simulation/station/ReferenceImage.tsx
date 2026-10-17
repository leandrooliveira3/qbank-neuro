import React, { useMemo } from "react";
import { StationState } from "./engine";
import { useReferenceGeometry } from "./referenceGeometry";
import { referenceContrast } from "./referenceScene";
import { HEIGHT, WIDTH, projectSpatial } from "./imaging";
import { attenuationRGBA, thicknessImage } from "./radiograph";

export default function ReferenceImage({ state, edges = [], plane, opacity, bone = false, inverted = false }: {
  state: StationState; edges?: string[]; plane: number; opacity: number; bone?: boolean; inverted?: boolean;
}) {
  const { geometry, error } = useReferenceGeometry();
  const edgeKey = edges.join("|");
  const surfaces = useMemo(() => !geometry ? [] : bone
    ? [...geometry.values()].filter((surface) => surface.layer === "bone")
    : referenceContrast(state, geometry, edges),
  [geometry, bone, edgeKey, state.caseId, state.clot, state.dilation]);
  const url = useMemo(() => {
    if (!surfaces.length) return null;
    const canvas = document.createElement("canvas"); canvas.width = WIDTH; canvas.height = HEIGHT;
    const context = canvas.getContext("2d"); if (!context) return null;
    const thickness = thicknessImage(surfaces, (p) => projectSpatial(p, state.view, plane), WIDTH, HEIGHT);
    const pixels = attenuationRGBA(thickness, bone ? 0.45 : 2);
    if (inverted) for (let i = 0; i < pixels.length; i += 4) { pixels[i] = 247; pixels[i + 1] = 251; pixels[i + 2] = 253; }
    context.putImageData(new ImageData(pixels, WIDTH, HEIGHT), 0, 0);
    return canvas.toDataURL();
  }, [surfaces, state.view, plane, bone, inverted]);
  if (error) return <text x="20" y="60" fill="#8c3028">{error}</text>;
  return url ? <image data-testid={bone ? "reference-bone-projection" : "reference-angiogram"} href={url} width={WIDTH} height={HEIGHT} opacity={opacity} /> : null;
}
