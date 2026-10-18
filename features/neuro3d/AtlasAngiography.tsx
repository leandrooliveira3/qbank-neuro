import { BufferGeometry, Float32BufferAttribute, Mesh, MeshBasicMaterial, DoubleSide, Raycaster, Vector3 } from "three";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useReferenceGeometry } from "./simulation/station/referenceGeometry";
import { WIDTH, HEIGHT } from "./simulation/station/projectionMath";
import type { AtlasProjectionRequest } from "./atlasRadiograph";
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
  const [renderError, setRenderError] = useState<string>();
  const generation = useRef(0);
  const workerState = useRef<{worker: Worker; inFlight: boolean; pending?: AtlasProjectionRequest}>(null);
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
    // An image awaiting a newer pose must not be picked using that newer pose.
    if (busy || error || renderError) return;
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
    let worker: Worker;
    try { worker = new Worker(new URL("./atlasProjection.worker.ts", import.meta.url), {type: "module"}); }
    catch { setRenderError("Não foi possível iniciar o cálculo angiográfico. Recarregue para tentar novamente."); setBusy(false); return; }
    const state: NonNullable<typeof workerState.current> = {worker, inFlight: false};
    workerState.current = state;
    worker.onmessage = (event: MessageEvent<{id: number; pixels?: Uint8ClampedArray; error?: string}>) => {
      state.inFlight = false;
      if (event.data.id === generation.current) {
        if (event.data.error) setRenderError(event.data.error);
        else if (event.data.pixels) {
          canvas.current?.getContext("2d")?.putImageData(new ImageData(event.data.pixels, WIDTH, HEIGHT), 0, 0);
          if (canvas.current) canvas.current.dataset.projectionReady = "true";
          setRenderError(undefined);
        }
        setBusy(false);
      }
      if (state.pending) { const request = state.pending; state.pending = undefined; state.inFlight = true; worker.postMessage({kind: "render", request}); }
    };
    worker.onerror = () => { state.inFlight = false; state.pending = undefined; setRenderError("Falha ao calcular a projeção. Recarregue para tentar novamente."); setBusy(false); };
    worker.postMessage({kind: "init", surfaces: [...geometry.values()].map(({id, layer, positions, indices}) => ({id, layer, positions, indices}))});
    return () => { worker.terminate(); if (workerState.current === state) workerState.current = null; };
  }, [geometry]);
  useEffect(() => {
    const state = workerState.current;
    if (!state) return;
    setBusy(true);
    if (canvas.current) canvas.current.dataset.projectionReady = "false";
    const request = {id: ++generation.current, view, boneOpacity, selected, isolate, layers, contrastLayer};
    // Retain only the newest queued pose while the worker computes the current one.
    if (state.inFlight) state.pending = request;
    else { state.inFlight = true; state.worker.postMessage({kind: "render", request}); }
  }, [geometry, view, boneOpacity, selected, isolate, layers, contrastLayer]);
  return <div className="nda-angiography" aria-busy={busy && !error && !renderError}>
    <canvas ref={canvas} width={WIDTH} height={HEIGHT} data-testid="atlas-angiography" data-selected-structure={selected ?? ""} data-field-center={center.join(",")} onClick={pick}
      role="img" aria-label="Projeção angiográfica sintética das superfícies do atlas" />
    {error || renderError ? <p role="alert">{error || renderError}</p> : busy && <p role="status">Calculando projeção das superfícies…</p>}
    <span className="nda-projection-label">{boneOpacity > 0 ? "ANGIOGRAFIA COM OSSO" : "DSA SINTÉTICA"} · {yaw}° / {pitch}°{selected && " · dourado: marcação da seleção"}</span>
  </div>;
}
