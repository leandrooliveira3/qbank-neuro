import React, { Component, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei/core/Gltf";
import { OrbitControls } from "@react-three/drei/core/OrbitControls";
import { Mesh, MeshStandardMaterial, Plane, Vector3 } from "three";
import type { OrbitControls as Controls } from "three-stdlib";
import { initialOpacity, openAnatomy, openAssetUrl, openLayerNames, OpenStructure, worldPoint } from "./openAnatomy";
import { normalize } from "./model";
import "./detailed-atlas.css";

type View = "Oblíqua" | "AP" | "Lateral" | "Posterior";
const colors: Record<string, string> = {
  arterial: "#b53d4c", venous: "#46649b", bone: "#e8d9bb", tissue: "#c9ada4", nerve: "#e8cc78",
};
class Boundary extends Component<{ children: React.ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    return this.state.failed ? <div role="alert" className="nda-failure">Não foi possível abrir a geometria 3D. A lista de estruturas continua disponível. Recarregue para tentar novamente.</div> : this.props.children;
  }
}
function Asset({ file, opacity, selected, isolate, cut, onSelect }: {
  file: string; opacity: Record<string, number>; selected: string | null;
  isolate: boolean; cut: { axis: string; offset: number }; onSelect: (id: string) => void;
}) {
  const { scene } = useGLTF(openAssetUrl(file), openAssetUrl("draco/"));
  const invalidate = useThree((state) => state.invalidate);
  const byId = useMemo(() => new Map(openAnatomy.structures.map((o) => [o.id, o])), []);
  const instance = useMemo(() => {
    const root = scene.clone(true);
    root.traverse((node) => {
      if (node instanceof Mesh) node.material = new MeshStandardMaterial({ roughness: 0.7, metalness: 0 });
    });
    return root;
  }, [scene]);
  useEffect(() => () => instance.traverse((node) => {
    if (node instanceof Mesh) (node.material as MeshStandardMaterial).dispose();
  }), [instance]);
  useEffect(() => {
    const plane = cut.axis === "none" ? [] : [new Plane(
      new Vector3(cut.axis === "sagittal" ? -1 : 0, cut.axis === "axial" ? -1 : 0, cut.axis === "coronal" ? -1 : 0), cut.offset,
    )];
    instance.traverse((node) => {
      if (!(node instanceof Mesh)) return;
      const item = byId.get(node.userData.qbankAnatomyId);
      if (!item) { node.visible = false; return; }
      const value = opacity[item.layer] ?? 1;
      node.visible = value > 0 && (!isolate || !selected || selected === item.id);
      const material = node.material as MeshStandardMaterial;
      material.color.set(colors[item.layer]);
      const alpha = selected === item.id ? 1 : value;
      if (material.transparent !== (alpha < 1) || material.clippingPlanes?.length !== plane.length) material.needsUpdate = true;
      material.opacity = alpha; material.transparent = alpha < 1; material.depthWrite = alpha === 1;
      material.emissive.set(selected === item.id ? "#245b50" : "#000000");
      material.emissiveIntensity = selected === item.id ? 0.4 : 0;
      material.clippingPlanes = plane;
      node.onAfterRender = (renderer) => { renderer.domElement.dataset.detailedAtlasRendered = "true"; };
    });
    invalidate();
  }, [instance, opacity, selected, isolate, cut, byId, invalidate]);
  return <primitive object={instance} dispose={null} onClick={(event) => {
    event.stopPropagation();
    const id = event.object.userData.qbankAnatomyId;
    if (id) onSelect(id);
  }} />;
}
function Camera({ selected, view, reset }: { selected?: OpenStructure; view: View; reset: number }) {
  const ref = useRef<Controls>(null);
  const { camera, invalidate } = useThree();
  useEffect(() => {
    let target = new Vector3(0, -3, 0), distance = 58;
    if (selected) {
      const a = new Vector3(...worldPoint(selected.bounds[0]));
      const b = new Vector3(...worldPoint(selected.bounds[1]));
      target = a.clone().add(b).multiplyScalar(0.5);
      distance = Math.max(5, a.distanceTo(b) * 2.1);
    }
    const direction = view === "AP" ? new Vector3(0, 0, 1) : view === "Lateral" ? new Vector3(1, 0, 0)
      : view === "Posterior" ? new Vector3(0, 0, -1) : new Vector3(0.6, 0.2, 1).normalize();
    camera.position.copy(target.clone().add(direction.multiplyScalar(distance)));
    camera.lookAt(target); ref.current?.target.copy(target); ref.current?.update(); invalidate();
  }, [selected, view, reset, camera, invalidate]);
  return <OrbitControls ref={ref} makeDefault minDistance={1} maxDistance={130} enableDamping />;
}
export default function DetailedAtlas() {
  const [opacity, setOpacity] = useState(initialOpacity);
  const [selected, setSelected] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [isolate, setIsolate] = useState(false);
  const [view, setView] = useState<View>("Oblíqua");
  const [reset, setReset] = useState(0);
  const [cut, setCut] = useState({ axis: "none", offset: 0 });
  const item = openAnatomy.structures.find((o) => o.id === selected);
  const matches = useMemo(() => openAnatomy.structures.filter((o) => normalize(`${o.name} ${o.latin} ${o.path.join(" ")}`).includes(normalize(search))), [search]);
  return <section className="nda" aria-label="Atlas anatômico de superfícies">
    <header><div><span className="n3-eyebrow">CABEÇA E PESCOÇO · SUPERFÍCIES ANATÔMICAS</span>
      <h2>Anatomia neurovascular</h2><p>{openAnatomy.structures.length} estruturas · crânio, encéfalo, nervos, artérias e veias</p></div>
      <button onClick={() => { setSelected(null); setIsolate(false); setOpacity(initialOpacity); setCut({ axis: "none", offset: 0 }); setReset((n) => n + 1); }}>Restaurar visão</button>
    </header>
    <div className="nda-workspace">
      <aside className="nda-controls"><h3>Camadas</h3>
        {Object.entries(openLayerNames).map(([key, label]) => <label key={key} className="nda-layer">
          <span>{label}<output>{Math.round(opacity[key] * 100)}%</output></span>
          <input type="range" min="0" max="100" step="5" aria-label={`Opacidade · ${label}`} value={Math.round(opacity[key] * 100)} onChange={(e) => setOpacity((old) => ({ ...old, [key]: Number(e.target.value) / 100 }))} />
        </label>)}
        <label><input type="checkbox" checked={isolate} onChange={(e) => setIsolate(e.target.checked)} /> Isolar estrutura selecionada</label>
        <h3>Corte de exploração</h3>
        <select aria-label="Plano de corte anatômico" value={cut.axis} onChange={(e) => setCut({ axis: e.target.value, offset: 0 })}>
          <option value="none">Sem corte</option><option value="axial">Axial</option><option value="coronal">Coronal</option><option value="sagittal">Sagital</option>
        </select>
        {cut.axis !== "none" && <label>Posição do corte<input type="range" aria-label="Posição do corte anatômico" min="-25" max="25" step="0.5" value={cut.offset} onChange={(e) => setCut((old) => ({ ...old, offset: Number(e.target.value) }))} /></label>}
        <small>Corte geométrico da superfície. Não corresponde a uma imagem de TC ou RM.</small>
      </aside>
      <div className="nda-stage"><nav aria-label="Vistas do modelo detalhado">
        {(["AP", "Lateral", "Oblíqua", "Posterior"] as View[]).map((name) => <button key={name} aria-pressed={view === name} onClick={() => setView(name)}>{name}</button>)}
      </nav><div className="nda-canvas" data-testid="detailed-atlas-canvas"><Boundary>
        <Canvas frameloop="demand" dpr={[1, 1.5]} camera={{ position: [30, 10, 50], near: 0.1, far: 250, fov: 40 }} gl={{ antialias: true, localClippingEnabled: true }}
          fallback={<p>WebGL indisponível neste navegador. Explore a lista de estruturas.</p>}>
          <color attach="background" args={["#101b25"]} /><ambientLight intensity={1.1} />
          <directionalLight position={[15, 25, 35]} intensity={2.4} /><directionalLight position={[-20, 10, -15]} intensity={1.2} />
          <Suspense fallback={null}><group scale={100} position={[0, -160, 0]}>
            {openAnatomy.assets.map((asset) => <Asset key={asset.file} file={asset.file} opacity={opacity} selected={selected} isolate={isolate} cut={cut} onSelect={setSelected} />)}
          </group></Suspense><Camera selected={item} view={view} reset={reset} />
        </Canvas></Boundary></div>
        <p className="nda-hint">Arraste para girar · roda/pinça para ampliar · clique para selecionar</p>
        <p className="nda-credit">Malhas: BodyParts3D / DBCLS → Z-Anatomy → Anatria3D. Recorte QBank-Neuro, <a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noreferrer">CC BY-SA 4.0</a>. <a href={openAssetUrl("NOTICE")} target="_blank" rel="noreferrer">Créditos e alterações</a>.</p>
      </div>
      <aside className="nda-inspector"><h3>Estruturas</h3><input aria-label="Buscar no atlas detalhado" placeholder="Nome em inglês ou latim…" value={search} onChange={(e) => setSearch(e.target.value)} />
        <small>{matches.length} resultados</small><div className="nda-list">
          {matches.map((o) => <button key={o.id} aria-pressed={selected === o.id} onClick={() => setSelected(o.id)}>{o.name}<small>{openLayerNames[o.layer]}</small></button>)}
        </div>
        {item && <article data-testid="detailed-structure"><h3>{item.name}</h3><p><i>{item.latin}</i></p><small>{item.path.join(" › ")}</small>
          <p>Rótulo de origem ainda não revisado. A presença da malha não confirma todos os detalhes ou variantes desta estrutura.</p></article>}
      </aside>
    </div>
    <p className="nda-status">Base anatômica de referência, ainda sem homologação neurovascular. Geometria dos vasos pequenos, completude e relação com imagens angiográficas estão em revisão.</p>
  </section>;
}
