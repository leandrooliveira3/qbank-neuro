import React, { Component, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei/core/Gltf";
import { OrbitControls } from "@react-three/drei/core/OrbitControls";
import { Mesh, MeshStandardMaterial, Plane, Vector3 } from "three";
import type { OrbitControls as Controls } from "three-stdlib";
import { initialOpacity, openAnatomy, openAssetUrl, openLayerNames, worldPoint } from "./openAnatomy";
import { normalize } from "./model";
import "./detailed-atlas.css";
import { anatomicalInventory, inventoryStatus } from "./anatomicalInventory";
import ReconstructedSurfaces from "./ReconstructedSurfaces";
import { reconstructedArteries } from "./reconstructedArteries";
import type { P3 } from "./simulation/station/network";
import AtlasAngiography from "./AtlasAngiography";
import { coverageReview, coverageStatus } from "./coverageReview";

const landmarkShortcuts = [["aortic_arch", "Arco aórtico"], ["brachiocephalic_trunk", "Tronco braquiocefálico"], ["left_subclavian_artery", "Subclávia esquerda"], ["right_subclavian_artery", "Subclávia direita"], ["inferior_thyroid_artery_l", "Tireoidiana inferior esquerda"], ["inferior_thyroid_artery_r", "Tireoidiana inferior direita"], ["sphenoid_bone", "Esfenoide"], ["temporal_bone_l", "Temporal esquerdo"], ["adenohypophysis", "Adeno-hipófise"], ["neurohypophysis", "Neuro-hipófise"], ["cavernous_sinus_l", "Seio cavernoso esquerdo"], ["cavernous_sinus_r", "Seio cavernoso direito"], ["optic_chiasm_l", "Quiasma óptico"], ["falx_cerebri", "Foice cerebral"], ["tentorium_cerebelli_l", "Tentório esquerdo"]];
const landmarkAliases: Record<string, string> = Object.fromEntries(landmarkShortcuts);
const atlasStructures = [...openAnatomy.structures, ...reconstructedArteries];
type AtlasStructure = typeof atlasStructures[number];
type View = "Oblíqua" | "AP" | "Lateral" | "Posterior";
const colors: Record<string, string> = {
  arterial: "#b53d4c", venous: "#46649b", bone: "#e8d9bb", tissue: "#c9ada4", nerve: "#e8cc78", gland: "#ed91b8", dura: "#b7c9db",
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
      node.visible = (value > 0 || selected === item.id) && (!isolate || !selected || selected === item.id);
      const material = node.material as MeshStandardMaterial;
      material.color.set(selected === item.id ? "#ffd45a" : colors[item.layer]);
      const alpha = selected === item.id ? 1 : value;
      if (material.transparent !== (alpha < 1) || material.clippingPlanes?.length !== plane.length) material.needsUpdate = true;
      material.opacity = alpha; material.transparent = alpha < 1; material.depthWrite = alpha === 1;
      material.emissive.set(selected === item.id ? "#b77912" : "#000000");
      material.emissiveIntensity = selected === item.id ? 0.65 : 0;
      material.clippingPlanes = plane;
      node.onAfterRender = (renderer) => { renderer.domElement.dataset.detailedAtlasRendered = "true"; };
    });
    invalidate();
  }, [instance, opacity, selected, isolate, cut, byId, invalidate]);
  return <primitive object={instance} dispose={null} onClick={(event) => {
    event.stopPropagation();
    const id = event.object.userData.qbankAnatomyId;
    if (id && event.delta <= 3) onSelect(id);
  }} />;
}
function Camera({ selected, view, reset }: { selected?: AtlasStructure; view: View; reset: number }) {
  const ref = useRef<Controls>(null);
  const { camera, invalidate } = useThree();
  useEffect(() => {
    let target = new Vector3(0, -3, 0), distance = 48;
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
export default function DetailedAtlas({ selected, onSelect: setSelected }: { selected: string | null; onSelect: (id: string | null) => void }) {
  const [contrastLayer, setContrastLayer] = useState("arterial");
  const [imageMode, setImageMode] = useState(false);
  const [yaw, setYaw] = useState(0);
  const [pitch, setPitch] = useState(0);
  const [imageZoom, setImageZoom] = useState(1);
  const [imageBone, setImageBone] = useState(0);
  const [imageField, setImageField] = useState("cranial");
  const [presentation, setPresentation] = useState("vascular");
  const [panel, setPanel] = useState("Camadas");
  const [expanded, setExpanded] = useState(false);
  useEffect(() => { const escape = (event: KeyboardEvent) => { if (event.key === "Escape") setExpanded(false); }; window.addEventListener("keydown", escape); return () => window.removeEventListener("keydown", escape); }, []);
  const [opacity, setOpacity] = useState(initialOpacity);
  const [search, setSearch] = useState("");
  const [isolate, setIsolate] = useState(false);
  const [view, setView] = useState<View>("Oblíqua");
  const [reset, setReset] = useState(0);
  const [cut, setCut] = useState({ axis: "none", offset: 0 });
  const item = atlasStructures.find((o) => o.id === selected);
  const imageCenter = useMemo<P3>(() => {
    if (imageField === "selection" && item) {
      const low = worldPoint(item.bounds[0]), high = worldPoint(item.bounds[1]);
      return low.map((value, k) => (value + high[k]) / 2) as P3;
    }
    return imageField === "supraaortic" ? [0, -18, 0] : [0, 0, 0];
  }, [imageField, item]);
  const matches = useMemo(() => atlasStructures.filter((o) => normalize(`${o.name} ${o.latin} ${o.path.join(" ")} ${landmarkAliases[o.id] ?? ""}`).includes(normalize(search))), [search]);
  function restore() {
    setIsolate(false); setOpacity(initialOpacity); setPresentation("vascular");
    setImageMode(false); setContrastLayer("arterial"); setYaw(0); setPitch(0); setImageZoom(1); setImageBone(0); setImageField("cranial");
    setCut({ axis: "none", offset: 0 }); setReset((n) => n + 1);
  }
  return <section className={`nda ${expanded ? "nda-expanded" : ""}`} aria-label="Atlas anatômico de superfícies">
    <header><div><span className="n3-eyebrow">EXPLORAR · CABEÇA E PESCOÇO</span>
      <h2>Anatomia neurovascular</h2><p>{openAnatomy.structures.length} estruturas importadas + {reconstructedArteries.length} reconstruções didáticas</p></div>
      <div className="nda-actions"><button onClick={restore}>Restaurar visão</button>
      <button aria-pressed={expanded} onClick={() => setExpanded((value) => !value)}>{expanded ? "Reduzir área 3D" : "Ampliar área 3D"}</button></div>
    </header>
    {item && <div className="nda-selection" data-testid="atlas-selection" data-selected-id={item.id} role="status"><div><strong>{item.name}</strong><small>{openLayerNames[item.layer]} · seleção mantida até escolher outra estrutura ou limpar</small></div><button onClick={() => { setReset((n) => n + 1); setImageField("selection"); }}>Focar seleção</button><button aria-pressed={isolate} onClick={() => setIsolate((value) => !value)}>Isolar seleção</button><button onClick={() => { setSelected(null); setIsolate(false); }}>Limpar seleção</button></div>}
    <div className="nda-workspace">
      <div className="nda-stage"><nav className="nda-mode" aria-label="Representação do atlas">
        <button aria-pressed={!imageMode} onClick={() => setImageMode(false)}>Superfícies anatômicas 3D</button>
        <button aria-pressed={imageMode} onClick={() => { setImageMode(true); setYaw(view === "Lateral" ? 90 : view === "Posterior" ? 180 : view === "Oblíqua" ? 30 : 0); }}>Angiografia</button>
      </nav><div className="nda-toolbar"><nav aria-label="Vistas do modelo detalhado">
        {(["AP", "Lateral", "Oblíqua", "Posterior"] as View[]).map((name) => <button key={name} aria-pressed={view === name} onClick={() => { setView(name); setYaw(name === "Lateral" ? 90 : name === "Posterior" ? 180 : name === "Oblíqua" ? 30 : 0); setPitch(0); }}>{name}</button>)}
      </nav><select aria-label="Apresentação anatômica" value={presentation} onChange={(event) => {
        const mode = event.target.value; setPresentation(mode);
        if (mode === "supraaortic") {
          setOpacity({ ...initialOpacity, bone: 0, tissue: 0, nerve: 0, gland: 0, dura: 0, venous: 0.15 });
          setSelected("aortic_arch"); setImageField("supraaortic"); setImageZoom(1.5); return;
        }
        setImageField(mode === "sellar" ? "selection" : "cranial");
        setOpacity(mode === "bone" ? { ...initialOpacity, bone: 0.65, tissue: 0, nerve: 0.5 } : mode === "brain" ? { ...initialOpacity, tissue: 0.85, bone: 0, nerve: 0.5, arterial: 0.5, venous: 0.2 } : mode === "sellar" ? { ...initialOpacity, bone: 0.12, tissue: 0.02, dura: 0.2, gland: 1, venous: 0.8 } : initialOpacity);
        if (mode === "sellar") setSelected("adenohypophysis");
      }}><option value="custom" disabled>Personalizada</option><option value="vascular">Visão vascular</option><option value="bone">Vasos e osso</option><option value="brain">Encéfalo</option><option value="sellar">Região selar e cavernosa</option><option value="supraaortic">Arco e troncos supra-aórticos</option></select></div>
      <div className="nda-canvas" data-testid="detailed-atlas-canvas"><Boundary>
        {imageMode ? <AtlasAngiography center={imageCenter} yaw={yaw} pitch={pitch} zoom={imageZoom} boneOpacity={imageBone} selected={selected} isolate={isolate} layers={opacity} contrastLayer={contrastLayer} onSelect={setSelected} /> : <Canvas frameloop="demand" dpr={[1, 1.5]} camera={{ position: [30, 10, 50], near: 0.1, far: 250, fov: 40 }} gl={{ antialias: true, localClippingEnabled: true }}
          fallback={<p>WebGL indisponível neste navegador. Explore a lista de estruturas.</p>}>
          <color attach="background" args={["#101b25"]} /><ambientLight intensity={1.1} />
          <directionalLight position={[15, 25, 35]} intensity={2.4} /><directionalLight position={[-20, 10, -15]} intensity={1.2} />
          <Suspense fallback={null}><group scale={100} position={[0, -160, 0]}>
            {openAnatomy.assets.map((asset) => <Asset key={asset.file} file={asset.file} opacity={opacity} selected={selected} isolate={isolate} cut={cut} onSelect={(id) => { setSelected(id); setPanel("Estruturas"); }} />)}
          </group><ReconstructedSurfaces opacity={opacity} selected={selected} isolate={isolate} cut={cut} onSelect={(id) => { setSelected(id); setPanel("Estruturas"); }} /></Suspense><Camera selected={item} view={view} reset={reset} />
        </Canvas>}</Boundary>
        <div className="nda-canvas-caption">{item ? item.name : "Selecione uma estrutura para explorar"}<small>{imageMode ? "Projeção das mesmas superfícies · ajuste os ângulos no painel" : "Arraste para girar · roda ou pinça para ampliar"}</small></div>
      </div></div>
      <aside className="nda-sidebar"><nav aria-label="Painel do atlas detalhado">
        {["Camadas", "Estruturas", "Revisão", "Inventário"].map((name) => <button key={name} aria-pressed={panel === name} onClick={() => setPanel(name)}>{name}</button>)}
      </nav>
      {panel === "Camadas" && <div className="nda-controls" key={reset}>{imageMode && <div className="nda-projection-controls">
        <h3>Imagem angiográfica</h3><p className="nda-help">Projeção sintética do atlas. Todos os vasos visíveis são opacificados; não é uma injeção seletiva. Use a estação para cateterização.</p>
        <label>Campo angiográfico<select aria-label="Campo angiográfico" value={imageField} onChange={(event) => setImageField(event.target.value)}><option value="cranial">Cabeça</option><option value="supraaortic">Cervicotorácico</option><option value="selection" disabled={!item}>Centrado na seleção</option></select></label>
        <label>Camada contrastada<select aria-label="Camada vascular na angiografia" value={contrastLayer} onChange={(e) => setContrastLayer(e.target.value)}><option value="arterial">Artérias</option><option value="venous">Veias e seios</option><option value="both">Artérias e veias</option></select></label>
        <label>Rotação LAO / RAO <output>{yaw}°</output><input aria-label="Rotação angiográfica" type="range" min="-180" max="180" step="5" value={yaw} onChange={(e) => setYaw(Number(e.target.value))} /></label>
        <label>Angulação cranial / caudal <output>{pitch}°</output><input aria-label="Angulação angiográfica" type="range" min="-60" max="60" step="5" value={pitch} onChange={(e) => setPitch(Number(e.target.value))} /></label>
        <label>Ampliação <output>{imageZoom.toFixed(1)}×</output><input aria-label="Ampliação angiográfica" type="range" min="0.5" max="2" step="0.1" value={imageZoom} onChange={(e) => setImageZoom(Number(e.target.value))} /></label>
        <label>Sobreposição óssea <output>{Math.round(imageBone * 100)}%</output><input aria-label="Sobreposição óssea angiográfica" type="range" min="0" max="1" step="0.05" value={imageBone} onChange={(e) => setImageBone(Number(e.target.value))} /></label>
        <small>Opacidade vascular controla inclusão de camadas. Cortes de exploração aplicam-se à visão 3D.</small>
      </div>}<h3>Marcos anatômicos</h3><div className="nda-landmarks">{landmarkShortcuts.map(([id, label]) => <button key={id} aria-pressed={selected === id} onClick={() => setSelected(id)}>{label}</button>)}</div><h3>Visibilidade das camadas</h3><p className="nda-help">Ajuste a transparência para revelar as relações entre vasos, ossos e nervos. A seleção permanece destacada mesmo com a camada oculta.</p>
        {Object.entries(openLayerNames).map(([key, label]) => <label key={key} className="nda-layer"><span>{label}<output>{Math.round(opacity[key] * 100)}%</output></span>
          <input type="range" min="0" max="100" step="5" aria-label={`Opacidade · ${label}`} value={Math.round(opacity[key] * 100)} onChange={(event) => { setPresentation("custom"); setOpacity((old) => ({ ...old, [key]: Number(event.target.value) / 100 })); }} />
        </label>)}
        <h3>Corte de exploração</h3><select aria-label="Plano de corte anatômico" value={cut.axis} onChange={(event) => setCut({ axis: event.target.value, offset: 0 })}>
          <option value="none">Sem corte</option><option value="axial">Axial</option><option value="coronal">Coronal</option><option value="sagittal">Sagital</option></select>
        {cut.axis !== "none" && <label>Posição do corte<input type="range" aria-label="Posição do corte anatômico" min="-25" max="25" step="0.5" value={cut.offset} onChange={(event) => setCut((old) => ({ ...old, offset: Number(event.target.value) }))} /></label>}
        <small>Corte geométrico de superfície; não corresponde a TC ou RM.</small>
      </div>}
      {panel === "Estruturas" && <div className="nda-inspector"><label className="nda-search-label">Encontrar estrutura<input aria-label="Buscar no atlas detalhado" placeholder="Português, inglês ou latim…" value={search} onChange={(event) => setSearch(event.target.value)} /></label>
        <div className="nda-resultcount">{matches.length} resultados</div><div className="nda-list">
          {matches.map((structure) => <button key={structure.id} aria-pressed={selected === structure.id} onClick={() => setSelected(structure.id)}>{structure.name}<small>{"status" in structure ? "Reconstrução didática · não validada" : openLayerNames[structure.layer]}</small></button>)}
        </div>
        {item && <article data-testid="detailed-structure"><h3>{item.name}</h3><p><i>{item.latin}</i></p><small>{item.path.join(" › ")}</small>
          <label className="nda-isolate"><input type="checkbox" checked={isolate} onChange={(event) => setIsolate(event.target.checked)} /> Isolar estrutura selecionada</label>
          {"status" in item ? <><p className="nda-reconstruction-note">Reconstrução didática · não validada</p><small>{item.note}</small><a href={item.reference} target="_blank" rel="noreferrer">Referência anatômica · Neuroangio</a></> : <small>Rótulo de origem ainda em revisão anatômica.</small>}</article>}
      </div>}
      {panel === "Inventário" && <div className="nda-review"><h3>Índice anatômico obrigatório</h3>
        <p className="nda-help">{anatomicalInventory.length} entradas, incluindo grupos originais e ramos desdobrados do índice. A lista mantém as pendências visíveis.</p>
        {Object.entries(inventoryStatus).map(([status, label]) => <small key={status}>{label}: {anatomicalInventory.filter((row) => row.status === status).length}</small>)}
        {anatomicalInventory.map((row) => <article key={row.key}><span className="nda-review-status">{inventoryStatus[row.status]}</span><h4>{row.number} · {row.label.replace(/https?:\/\/[^)\s]+/g, "").replace(/[\[\]]/g, "")}</h4><p>{row.note}</p>
          {row.ids.map((id) => <button key={id} onClick={() => { setSelected(id); setPanel("Estruturas"); }}>{atlasStructures.find((structure) => structure.id === id)?.name}</button>)}
        </article>)}
      </div>}
      {panel === "Revisão" && <div className="nda-review"><h3>Pequenos ramos e relações finas</h3><p className="nda-help">Inventário dirigido. Presença de uma malha não equivale a validação anatômica.</p>
        {coverageReview.map((review) => <article key={review.name}><span className={`nda-review-status ${review.status}`}>{coverageStatus[review.status]}</span><h4>{review.name}</h4><p>{review.note}</p><small>{review.reference}</small>
          {!!review.ids.length && <button onClick={() => { setSelected(review.ids[0]); setPanel("Estruturas"); }}>Inspecionar no modelo</button>}</article>)}
      </div>}
      </aside>
    </div>
    <footer className="nda-footer"><span>BodyParts3D / DBCLS · Z-Anatomy · Anatria3D · <a href={openAssetUrl("NOTICE")} target="_blank" rel="noreferrer">Créditos e CC BY-SA 4.0</a></span><span>Revisão anatômica em andamento</span></footer>
  </section>;
}
