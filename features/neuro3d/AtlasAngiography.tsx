import { BufferGeometry, Float32BufferAttribute, Mesh, MeshBasicMaterial, DoubleSide, Raycaster, Vector3 } from "three";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useReferenceGeometry } from "./simulation/station/referenceGeometry";
import { projectThickness, detectorImage } from "./simulation/station/detector";
import { projectSpatial, WIDTH, HEIGHT } from "./simulation/station/imaging";
import type { P3 } from "./simulation/station/network";
import { atlasProjection, unprojectAtlasPixel } from "./atlasProjection";

/** Projects the atlas source surfaces, without centerline/SVG substitutes. */
export default function AtlasAngiography({ yaw, pitch, zoom, boneOpacity, selected, isolate, layers, contrastLayer, onSelect, center }: {
  center: P3; yaw: number; pitch: number; zoom: number; boneOpacity: number;
  onSelect: (id: string) => void; contrastLayer: string; selected: string | null; isolate: boolean; layers: Record<string, number>;
}) {
  const { geometry, error } = useReferenceGeometry();
  const canvas = useRef<HTMLCanvasElement>(null);
  const [busy, setBusy] = useState(true);
  const view = useMemo(() => atlasProjection(yaw, pitch, zoom, center), [yaw, pitch, zoom, center]);
  const pickMeshes = useMemo(() => {
    if (!geometry) return [];
    const material = new MeshBasicMaterial({ side: DoubleSide });
    return [...geometry.values()].map((surface) => {
      const buffer = new BufferGeometry();
      buffer.setAttribute("position", new Float32BufferAttribute(surface.positions, 3));
      buffer.setIndex(Array.from(surface.indices)); buffer.computeBoundingSphere();
      const mesh = new Mesh(buffer, material); mesh.userData = { id: surface.id, layer: surface.layer };
      return mesh;
    });
  }, [geometry]);
  useEffect(() => () => { pickMeshes.forEach((mesh) => mesh.geometry.dispose()); pickMeshes[0]?.material.dispose(); }, [pickMeshes]);
  function pick(event: React.MouseEvent<HTMLCanvasElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const scale = Math.min(rect.width / WIDTH, rect.height / HEIGHT);
    const px = (event.clientX - rect.left - (rect.width - WIDTH * scale) / 2) / scale;
    const py = (event.clientY - rect.top - (rect.height - HEIGHT * scale) / 2) / scale;
    if (px < 0 || py < 0 || px > WIDTH || py > HEIGHT) return;
    const origin = new Vector3(...unprojectAtlasPixel(px, py, 200, view));
    const ray = new Raycaster(origin, new Vector3(...unprojectAtlasPixel(px, py, -200, view)).sub(origin).normalize());
    const visible = pickMeshes.filter((mesh) => (!isolate || !selected || selected === mesh.userData.id) &&
      (mesh.userData.id === selected || (layers[mesh.userData.layer] ?? 0) > 0));
    const vessels = visible.filter((mesh) => contrastLayer === "both" ? ["arterial", "venous"].includes(mesh.userData.layer) : mesh.userData.layer === contrastLayer);
    const hit = ray.intersectObjects(vessels, false)[0] ?? (boneOpacity > 0 ? ray.intersectObjects(visible.filter((mesh) => mesh.userData.layer === "bone"), false)[0] : undefined);
    if (hit) onSelect(hit.object.userData.id);
  }
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
      const selectedSurface = selected ? geometry.get(selected) : undefined;
      if (selectedSurface) {
        // Gold is an identification overlay, never part of the radiographic signal.
        const mask = projectThickness([selectedSurface], project, WIDTH, HEIGHT);
        for (let y = 1; y < HEIGHT - 1; y++) for (let x = 1; x < WIDTH - 1; x++) {
          const i = y * WIDTH + x;
          if (mask[i] <= 0) continue;
          const edge = mask[i - 1] <= 0 || mask[i + 1] <= 0 || mask[i - WIDTH] <= 0 || mask[i + WIDTH] <= 0;
          const alpha = edge ? 0.95 : 0.2;
          [255, 199, 54].forEach((value, k) => { pixels[i * 4 + k] = Math.round(pixels[i * 4 + k] * (1 - alpha) + value * alpha); });
        }
      }
      context.putImageData(new ImageData(pixels, WIDTH, HEIGHT), 0, 0);
      canvas.current!.dataset.projectionReady = "true";
      setBusy(false);
    }, 30);
    return () => window.clearTimeout(task);
  }, [geometry, view, boneOpacity, selected, isolate, layers, contrastLayer]);
  return <div className="nda-angiography" aria-busy={busy}>
    <canvas ref={canvas} width={WIDTH} height={HEIGHT} data-testid="atlas-angiography" data-selected-structure={selected ?? ""} data-field-center={center.join(",")} onClick={pick}
      role="img" aria-label="Projeção angiográfica sintética das superfícies do atlas" />
    {error ? <p role="alert">{error}</p> : busy && <p role="status">Calculando projeção das superfícies…</p>}
    <span className="nda-projection-label">{boneOpacity > 0 ? "ANGIOGRAFIA COM OSSO" : "DSA SINTÉTICA"} · {yaw}° / {pitch}°{selected && " · dourado: marcação da seleção"}</span>
  </div>;
}
