import React, { useMemo } from "react";
import type { Network } from "./network";
import type { ProcedureCase } from "./cases";
import type { View } from "./engine";
import { HEIGHT, WIDTH, lumenFactor, projectSpatial } from "./imaging";
import { sacRadius, vesselSurface } from "./surfaces";
import { attenuationRGBA, thicknessImage } from "./radiograph";

export default function VascularImage({
  network, definition, edges, view, plane, clot, dilation, opacity, inverted = false,
}: {
  network: Network;
  definition: ProcedureCase;
  edges: string[];
  view: View;
  plane: number;
  clot: boolean;
  dilation: number;
  opacity: number;
  inverted?: boolean;
}) {
  const edgeKey = edges.join("|");
  const surfaces = useMemo(() => edges.map((id) => {
    const vessel = network[id];
    const focal = definition.kind === "carotid" && id === definition.target;
    const limit = clot && id === definition.target ? definition.targetT : 1;
    return vesselSurface(vessel, id === "sac" ? sacRadius : (t) =>
      vessel.radius * (focal ? lumenFactor(t, definition.targetT, dilation) : 1), limit,
    );
  }), [network, definition, edgeKey, clot, dilation]);
  const url = useMemo(() => {
    if (!surfaces.length) return null;
    const canvas = document.createElement("canvas");
    canvas.width = WIDTH; canvas.height = HEIGHT;
    const context = canvas.getContext("2d");
    if (!context) return null;
    const thickness = thicknessImage(surfaces, (p) => projectSpatial(p, view, plane), WIDTH, HEIGHT);
    const pixels = attenuationRGBA(thickness);
    if (inverted) for (let i = 0; i < pixels.length; i += 4) {
      pixels[i] = 247; pixels[i + 1] = 251; pixels[i + 2] = 253;
    }
    context.putImageData(new ImageData(pixels, WIDTH, HEIGHT), 0, 0);
    return canvas.toDataURL();
  }, [surfaces, view, plane, inverted]);
  return url ? <image data-testid="vascular-attenuation" href={url} width={WIDTH} height={HEIGHT} opacity={opacity} /> : null;
}
