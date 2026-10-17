import React, { useEffect, useMemo, useRef, useState } from "react";
import { useReferenceGeometry } from "./simulation/station/referenceGeometry";
import { projectThickness, detectorImage } from "./simulation/station/detector";
import { projectSpatial, WIDTH, HEIGHT } from "./simulation/station/imaging";
import type { View } from "./simulation/station/engine";

export function atlasProjection(yaw: number, pitch: number, zoom: number): View {
  return { yaw, pitch, yawB: 90, pitchB: 0, zoom, panX: 0, panY: 0,
    gain: 1, collimation: 100, boneOpacity: 1 };
}

/** Projects the atlas source surfaces, without centerline/SVG substitutes. */
export default function AtlasAngiography({ yaw, pitch, zoom, boneOpacity, selected, isolate, layers, contrastLayer }: {
  yaw: number; pitch: number; zoom: number; boneOpacity: number;
  contrastLayer: string; selected: string | null; isolate: boolean; layers: Record<string, number>;
}) {
  const { geometry, error } = useReferenceGeometry();
  const canvas = useRef<HTMLCanvasElement>(null);
  const [busy, setBusy] = useState(true);
  const view = useMemo(() => atlasProjection(yaw, pitch, zoom), [yaw, pitch, zoom]);
  useEffect(() => {
    if (!geometry) return;
    setBusy(true);
    // Defer rasterization so the projection controls can paint first.
    const task = window.setTimeout(() => {
      const context = canvas.current?.getContext("2d");
      if (!context) return;
      const vessels = [...geometry.values()].filter((surface) =>
        (contrastLayer === "both" ? surface.layer === "arterial" || surface.layer === "venous" : surface.layer === contrastLayer) && (layers[surface.layer] ?? 0) > 0 &&
        (!isolate || !selected || surface.id === selected));
      const project = (point: [number, number, number]) => projectSpatial(point, view);
      const contrast = projectThickness(vessels, project, WIDTH, HEIGHT);
      const bones = boneOpacity > 0 ? projectThickness([...geometry.values()].filter((s) => s.layer === "bone"), project, WIDTH, HEIGHT) : null;
      const pixels = detectorImage(contrast, bones, WIDTH, HEIGHT, boneOpacity);
      context.putImageData(new ImageData(pixels, WIDTH, HEIGHT), 0, 0);
      canvas.current!.dataset.projectionReady = "true";
      setBusy(false);
    }, 30);
    return () => window.clearTimeout(task);
  }, [geometry, view, boneOpacity, selected, isolate, layers, contrastLayer]);
  return <div className="nda-angiography" aria-busy={busy}>
    <canvas ref={canvas} width={WIDTH} height={HEIGHT} data-testid="atlas-angiography"
      role="img" aria-label="Projeção angiográfica sintética das superfícies do atlas" />
    {error ? <p role="alert">{error}</p> : busy && <p role="status">Calculando projeção das superfícies…</p>}
    <span className="nda-projection-label">{boneOpacity > 0 ? "ANGIOGRAFIA COM OSSO" : "DSA SINTÉTICA"} · {yaw}° / {pitch}°</span>
  </div>;
}
