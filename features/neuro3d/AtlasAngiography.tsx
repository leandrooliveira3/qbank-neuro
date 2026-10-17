import React, { useEffect, useMemo, useRef, useState } from "react";
import { useReferenceGeometry } from "./simulation/station/referenceGeometry";
import { thicknessImage, attenuationRGBA } from "./simulation/station/radiograph";
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
      const contrast = thicknessImage(vessels, project, WIDTH, HEIGHT);
      const bones = boneOpacity > 0 ? thicknessImage([...geometry.values()].filter((s) => s.layer === "bone"), project, WIDTH, HEIGHT) : null;
      const vascular = attenuationRGBA(contrast, 2);
      const pixels = new Uint8ClampedArray(WIDTH * HEIGHT * 4);
      for (let i = 0; i < contrast.length; i++) {
        const x = i % WIDTH, y = Math.floor(i / WIDTH);
        const vignette = Math.min(1, ((x - WIDTH / 2) ** 2 + (y - HEIGHT / 2) ** 2) / (WIDTH * HEIGHT));
        const background = 230 - 22 * vignette;
        const osseous = bones ? 1 - Math.exp(-0.45 * boneOpacity * bones[i]) : 0;
        const value = (background * (1 - osseous) + 65 * osseous) * (1 - vascular[i * 4 + 3] / 255);
        pixels[i * 4] = pixels[i * 4 + 1] = pixels[i * 4 + 2] = value;
        pixels[i * 4 + 3] = 255;
      }
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
