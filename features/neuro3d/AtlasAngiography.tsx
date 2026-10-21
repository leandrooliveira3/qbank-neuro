import { BufferGeometry, Float32BufferAttribute, Mesh, MeshBasicMaterial, DoubleSide, Raycaster, Vector3 } from "three";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useReferenceGeometry } from "./simulation/station/referenceGeometry";
import { WIDTH, HEIGHT } from "./simulation/station/projectionMath";
import type { AtlasProjectionRequest } from "./atlasRadiograph";
import type { P3 } from "./simulation/station/network";
import { atlasProjection, unprojectAtlasPixel, panAtlasField, zoomAtlasField } from "./atlasProjection";

/** Projects the atlas source surfaces, without centerline/SVG substitutes. */
const noHiddenStructures: ReadonlySet<string> = new Set();
export default function AtlasAngiography({ yaw, pitch, zoom, boneOpacity, selected, isolate, layers, contrastLayer, onSelect, center, hidden = noHiddenStructures, tool = "select", onFieldChange }: {
  tool?: "select" | "rotate" | "pan"; onFieldChange?: (center: P3, zoom: number) => void;
  hidden?: ReadonlySet<string>;
  center: P3; yaw: number; pitch: number; zoom: number; boneOpacity: number;
  onSelect: (id: string) => void; contrastLayer: string; selected: string | null; isolate: boolean; layers: Record<string, number>;
}) {
  const { geometry, error } = useReferenceGeometry();
  const canvas = useRef<HTMLCanvasElement>(null);
  const drag = useRef<{ id: number; x: number; y: number; scale: number; center: P3; view: ReturnType<typeof atlasProjection> }>(null);
  const [busy, setBusy] = useState(true);
  const [renderError, setRenderError] = useState<string>();
  const generation = useRef(0);
  const workerState = useRef<{worker: Worker; inFlight: boolean; pending?: AtlasProjectionRequest}>(null);
  const view = useMemo(() => atlasProjection(yaw, pitch, zoom, center), [yaw, pitch, zoom, center]);
  const frameKey = JSON.stringify([view, layers, contrastLayer, boneOpacity, [...hidden].sort(), isolate ? selected : null]);
  const visibilityKey=JSON.stringify([layers,contrastLayer,boneOpacity,[...hidden].sort(),isolate?selected:null]);
  const renderedVisibilityKey=useRef<string|null>(null);
  const requestKeys=useRef(new Map<number,{frame:string;visibility:string}>());
  const renderedFrameKey = useRef<string>(null);
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
  const fieldRef = useRef({center, zoom, view, onFieldChange}); fieldRef.current = {center, zoom, view, onFieldChange};
  useEffect(() => {
    const element = canvas.current; if (!element) return;
    const wheel = (event: WheelEvent) => {
      const rect = element.getBoundingClientRect(), scale = Math.min(rect.width/WIDTH, rect.height/HEIGHT);
      const px = (event.clientX-rect.left-(rect.width-WIDTH*scale)/2)/scale;
      const py = (event.clientY-rect.top-(rect.height-HEIGHT*scale)/2)/scale;
      const field = fieldRef.current;
      if (!field.onFieldChange || px < 0 || py < 0 || px > WIDTH || py > HEIGHT) return;
      event.preventDefault();
      const delta = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? rect.height : 1);
      const next = Math.max(.1,Math.min(12,field.zoom*Math.exp(-delta*.001)));
      field.onFieldChange(zoomAtlasField(field.center,field.view,next,px,py),next);
    };
    element.addEventListener("wheel",wheel,{passive:false});
    return () => element.removeEventListener("wheel",wheel);
  }, []);
  function startPan(event: React.PointerEvent<HTMLCanvasElement>) {
    if (tool !== "pan" || event.button !== 0 || !onFieldChange) return;
    const rect = event.currentTarget.getBoundingClientRect();
    drag.current = {id:event.pointerId,x:event.clientX,y:event.clientY,scale:Math.min(rect.width/WIDTH,rect.height/HEIGHT),center,view};
    event.currentTarget.setPointerCapture(event.pointerId);
  }
  function movePan(event: React.PointerEvent<HTMLCanvasElement>) {
    const start = drag.current;
    if (!start || start.id !== event.pointerId) return;
    onFieldChange?.(panAtlasField(start.center,start.view,(event.clientX-start.x)/start.scale,(event.clientY-start.y)/start.scale),start.view.zoom);
  }
  function endPan(event: React.PointerEvent<HTMLCanvasElement>) { if (drag.current?.id === event.pointerId) drag.current = null; }

  function pick(event: React.MouseEvent<HTMLCanvasElement>) {
    // An image awaiting a newer pose must not be picked using that newer pose.
    if (tool !== "select" || renderedFrameKey.current !== frameKey || error || renderError) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const scale = Math.min(rect.width / WIDTH, rect.height / HEIGHT);
    const px = (event.clientX - rect.left - (rect.width - WIDTH * scale) / 2) / scale;
    const py = (event.clientY - rect.top - (rect.height - HEIGHT * scale) / 2) / scale;
    if (px < 0 || py < 0 || px > WIDTH || py > HEIGHT) return;
    const origin = new Vector3(...unprojectAtlasPixel(px, py, 200, view));
    const ray = new Raycaster(origin, new Vector3(...unprojectAtlasPixel(px, py, -200, view)).sub(origin).normalize());
    const visible = pickMeshes.filter((mesh) => !hidden.has(mesh.userData.id) && (!isolate || !selected || selected === mesh.userData.id) &&
      (layers[mesh.userData.layer] ?? 0) > 0);
    const vessels = visible.filter((mesh) => contrastLayer === "both" ? ["arterial", "venous"].includes(mesh.userData.layer) : mesh.userData.layer === contrastLayer);
    const hit = ray.intersectObjects(vessels, false)[0]
      ?? ray.intersectObjects(visible.filter((mesh) => mesh.userData.id === selected), false)[0]
      ?? (boneOpacity > 0 ? ray.intersectObjects(visible.filter((mesh) => mesh.userData.layer === "bone"), false)[0] : undefined);
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
          const keys=requestKeys.current.get(event.data.id);
          renderedFrameKey.current=keys?.frame??null;renderedVisibilityKey.current=keys?.visibility??null;
          setRenderError(undefined);
        }
        setBusy(false);
      }
      requestKeys.current.delete(event.data.id);
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
    const request = {id: ++generation.current, view, boneOpacity, selected, isolate, layers, contrastLayer, hidden: [...hidden]};
    requestKeys.current.set(request.id,{frame:frameKey,visibility:visibilityKey});
    if(state.pending)requestKeys.current.delete(state.pending.id);
    // Retain only the newest queued pose while the worker computes the current one.
    if (state.inFlight) state.pending = request;
    else { state.inFlight = true; state.worker.postMessage({kind: "render", request}); }
  }, [geometry, view, boneOpacity, selected, isolate, layers, contrastLayer, hidden]);
  return <div className="nda-angiography" aria-busy={busy && !error && !renderError}>
    <canvas ref={canvas} style={{visibility:!error&&!renderError&&renderedVisibilityKey.current===visibilityKey?"visible":"hidden",cursor:tool === "pan" ? "grab" : "crosshair"}} width={WIDTH} height={HEIGHT} data-testid="atlas-angiography" data-selected-structure={selected ?? ""} data-field-center={center.join(",")} data-yaw={yaw} data-pitch={pitch} data-zoom={zoom} onClick={pick} onPointerDown={startPan} onPointerMove={movePan} onPointerUp={endPan} onPointerCancel={endPan} onLostPointerCapture={endPan}
      role="img" aria-label="Projeção angiográfica sintética das superfícies do atlas" />
    {error || renderError ? <p role="alert">{error || renderError}</p> : busy && <p role="status">Calculando projeção das superfícies…</p>}
    <span className="nda-projection-label">{boneOpacity > 0 ? "ANGIOGRAFIA COM OSSO" : "DSA SINTÉTICA"} · {Math.round(yaw*10)/10}° / {Math.round(pitch*10)/10}°{selected && " · dourado: marcação da seleção"}</span>
  </div>;
}
