import React, { Component, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei/core/Gltf";
import { OrbitControls } from "@react-three/drei/core/OrbitControls";
import { Mesh, MeshStandardMaterial, Plane, Vector3, MOUSE, TOUCH, OrthographicCamera, PerspectiveCamera } from "three";
import type { OrbitControls as Controls } from "three-stdlib";
import { initialOpacity, openAnatomy, openAssetUrl, openLayerNames, worldPoint } from "./openAnatomy";
import { directionFromAngles, anglesFromDirection, type AngiographyPose } from "./angiographyPose";
import { structureVisible, visibleAtlasRaycast, type AtlasTool, type PickScope } from "./atlasInteraction";
import { normalize } from "./model";
import "./detailed-atlas.css";
import { anatomicalInventory } from "./anatomicalInventory";
import DiagramInventory from "./DiagramInventory";
import ReconstructedSurfaces from "./ReconstructedSurfaces";
import { reconstructedArteries } from "./reconstructedArteries";
import type { P3 } from "./simulation/station/network";
import AtlasAngiography from "./AtlasAngiography";
import { coverageReview, coverageStatus } from "./coverageReview";
import craniocervical from "./craniocervical.json";
import contextAudit from "../../docs/neuro3d-craniocervical-audit.json";

const landmarkShortcuts = [["aortic_arch", "Arco aórtico"], ["brachiocephalic_trunk", "Tronco braquiocefálico"], ["left_subclavian_artery", "Subclávia esquerda"], ["right_subclavian_artery", "Subclávia direita"], ["inferior_thyroid_artery_l", "Tireoidiana inferior esquerda"], ["inferior_thyroid_artery_r", "Tireoidiana inferior direita"], ["sphenoid_bone", "Esfenoide"], ["temporal_bone_l", "Temporal esquerdo"], ["adenohypophysis", "Adeno-hipófise"], ["neurohypophysis", "Neuro-hipófise"], ["cavernous_sinus_l", "Seio cavernoso esquerdo"], ["cavernous_sinus_r", "Seio cavernoso direito"], ["optic_chiasm_l", "Quiasma óptico"], ["falx_cerebri", "Foice cerebral"], ["tentorium_cerebelli_l", "Tentório esquerdo"]];
const landmarkAliases: Record<string, string> = Object.fromEntries(landmarkShortcuts);
const atlasStructures = [...openAnatomy.structures, ...reconstructedArteries];
const diagramLabelsByStructure = new Map<string, typeof anatomicalInventory>();
for (const row of anatomicalInventory) for (const id of row.ids) {
  const labels = diagramLabelsByStructure.get(id) ?? [];
  labels.push(row); diagramLabelsByStructure.set(id, labels);
}
type AtlasStructure = typeof atlasStructures[number];
type View = "Oblíqua" | "AP" | "Lateral" | "Posterior";
const colors: Record<string, string> = {
  arterial: "#b53d4c", venous: "#46649b", bone: "#e8d9bb", tissue: "#c9ada4", nerve: "#e8cc78", gland: "#ed91b8", dura: "#b7c9db",
  muscle: "#a65c58", ligament: "#d9d8c4", cartilage: "#a2cfda", visceral: "#c89598", lymphatic: "#8db896",
  cavity: "#72b1d0", attachment: "#d6a476", region: "#ae93bc",
};
class Boundary extends Component<{ children: React.ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    return this.state.failed ? <div role="alert" className="nda-failure">Não foi possível abrir a geometria 3D. A lista de estruturas continua disponível. Experimente a representação Angiografia 2D ou recarregue para tentar novamente.</div> : this.props.children;
  }
}
function Asset({ file, opacity, selected, isolate, cut, onSelect, angiographic, contrastLayer, hidden, pickScope, tool }: {
  hidden: ReadonlySet<string>; pickScope: PickScope; tool: AtlasTool;
  angiographic: boolean; contrastLayer: string; file: string; opacity: Record<string, number>; selected: string | null;
  isolate: boolean; cut: { axis: string; offset: number }; onSelect: (id: string) => void;
}) {
  const { scene } = useGLTF(openAssetUrl(file), openAssetUrl("draco/"));
  const invalidate = useThree((state) => state.invalidate);
  const byId = useMemo(() => new Map(openAnatomy.structures.map((o) => [o.id, o])), []);
  const instance = useMemo(() => {
    const root = scene.clone(true);
    root.traverse((node) => {
      if (node instanceof Mesh) { node.material = new MeshStandardMaterial({ roughness: 0.7, metalness: 0 }); node.raycast = visibleAtlasRaycast; }
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
      node.visible = structureVisible(item.id, item.layer, opacity, selected, isolate, hidden, angiographic, contrastLayer);
      node.userData.atlasPickable = tool === "select" && (pickScope === "all" || pickScope === item.layer || pickScope === "vascular" && ["arterial", "venous"].includes(item.layer));
      const material = node.material as MeshStandardMaterial;
      material.color.set(selected === item.id ? "#ffd45a" : angiographic ? item.layer === "bone" ? "#7d8990" : "#e6edf2" : colors[item.layer]);
      const alpha = value;
      if (material.transparent !== (alpha < 1) || material.clippingPlanes?.length !== plane.length) material.needsUpdate = true;
      material.opacity = alpha; material.transparent = alpha < 1; material.depthWrite = alpha === 1;
      material.emissive.set(selected === item.id ? "#b77912" : "#000000");
      material.emissiveIntensity = selected === item.id ? 0.65 : 0;
      material.clippingPlanes = plane;
      node.onAfterRender = (renderer) => { renderer.domElement.dataset.detailedAtlasRendered = "true"; renderer.domElement.dataset.angiography3dRendered = angiographic ? "true" : "false"; };
    });
    invalidate();
  }, [instance, opacity, selected, isolate, cut, byId, invalidate, angiographic, contrastLayer, hidden, pickScope, tool]);
  return <primitive object={instance} dispose={null} onClick={(event) => {
    event.stopPropagation();
    const id = event.object.userData.qbankAnatomyId;
    if (id && event.button === 0 && event.delta <= 3 && event.object.visible && event.object.userData.atlasPickable) onSelect(id);
  }} />;
}
function Camera({ selected, view, reset, focus, tool, poseRef }: { selected?: AtlasStructure; view: View; reset: number; focus: number; tool: AtlasTool; poseRef: React.RefObject<AngiographyPose> }) {
  const ref = useRef<Controls>(null);
  const { camera, invalidate, gl, size } = useThree();
  const detectorScale = Math.min(size.width / 600, size.height / 560);
  const reportPose = () => {
    if (!ref.current) return;
    const direction = camera.position.clone().sub(ref.current.target);
    const angles = anglesFromDirection(direction.toArray() as P3);
    if (camera instanceof OrthographicCamera) {
      const baseZoom = size.height / (12 * (camera.top - camera.bottom) * detectorScale);
      ref.current.minZoom = 0.1 / baseZoom; ref.current.maxZoom = 12 / baseZoom;
    }
    const zoom = camera instanceof OrthographicCamera ? size.height * camera.zoom / (12 * (camera.top - camera.bottom) * detectorScale) : size.height / (24 * direction.length() * Math.tan((camera as PerspectiveCamera).fov * Math.PI / 360) * detectorScale);
    poseRef.current = { ...angles, zoom, center: ref.current.target.toArray() as P3 };
    gl.domElement.dataset.atlasCameraPose = [...camera.position.toArray(), ...ref.current.target.toArray()].map(v => v.toFixed(5)).join(",");
  };
  const selectionRef = useRef(selected); selectionRef.current = selected;
  const initialPose = useRef({ ...poseRef.current, center: [...poseRef.current.center] as P3 });
  const previous = useRef({ view, reset, focus, width: size.width, height: size.height });
  const mounted = useRef(false);
  useEffect(() => {
    let target = new Vector3(0, -3, 0), distance = 48;
    const selected = selectionRef.current;
    const focusing = focus !== previous.current.focus;
    const orienting = view !== previous.current.view;
    const restoring = reset !== previous.current.reset;
    const resizing = size.width !== previous.current.width || size.height !== previous.current.height;
    const requestedPose = mounted.current ? poseRef.current : initialPose.current;
    const oldDirection = camera.position.clone().sub(ref.current?.target ?? new Vector3()).normalize();
    if (selected && (focusing || orienting) && !restoring) {
      const a = new Vector3(...worldPoint(selected.bounds[0]));
      const b = new Vector3(...worldPoint(selected.bounds[1]));
      target = a.clone().add(b).multiplyScalar(0.5);
      distance = Math.max(5, a.distanceTo(b) * 2.1);
    }
    const direction = view === "AP" ? new Vector3(0, 0, 1) : view === "Lateral" ? new Vector3(1, 0, 0)
      : view === "Posterior" ? new Vector3(0, 0, -1) : new Vector3(0.6, 0.2, 1).normalize();
    if (focusing) direction.copy(oldDirection);
    if (!mounted.current || resizing) { target = new Vector3(...requestedPose.center); direction.set(...directionFromAngles(requestedPose.yaw, requestedPose.pitch)); }
    if (camera instanceof OrthographicCamera) {
      const zoom = focusing ? Math.min(12, 50 / distance) : restoring ? 1 : requestedPose.zoom;
      camera.left = -size.width / (24 * zoom * detectorScale); camera.right = -camera.left;
      camera.top = size.height / (24 * zoom * detectorScale); camera.bottom = -camera.top; camera.zoom = 1; camera.updateProjectionMatrix();
    }
    mounted.current = true;
    previous.current = { view, reset, focus, width: size.width, height: size.height };
    camera.position.copy(target.clone().add(direction.multiplyScalar(distance)));
    camera.lookAt(target); ref.current?.target.copy(target); ref.current?.update(); reportPose(); invalidate();
  }, [view, reset, focus, camera, invalidate, gl, size.width, size.height]);
  return <OrbitControls onChange={reportPose} ref={ref} makeDefault minDistance={1} maxDistance={350} enableDamping={false} mouseButtons={{ LEFT: tool === "rotate" ? MOUSE.ROTATE : tool === "pan" ? MOUSE.PAN : -1 as MOUSE, MIDDLE: MOUSE.DOLLY, RIGHT: tool === "rotate" ? MOUSE.PAN : MOUSE.ROTATE }} touches={{ ONE: tool === "rotate" ? TOUCH.ROTATE : tool === "pan" ? TOUCH.PAN : -1 as TOUCH, TWO: TOUCH.DOLLY_PAN }} />;
}
export default function DetailedAtlas({ selected, onSelect: setSelected }: { selected: string | null; onSelect: (id: string | null) => void }) {
  const poseRef = useRef<AngiographyPose>({ yaw: 31, pitch: 10, zoom: 1, center: [0,-3,0] });
  const [linkedCenter, setLinkedCenter] = useState<P3>([0,-3,0]);
  const [tool, setTool] = useState<AtlasTool>("select");
  const [pickScope, setPickScope] = useState<PickScope>("arterial");
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const [focus, setFocus] = useState(0);
  const [contrastLayer, setContrastLayer] = useState("arterial");
  const [imageMode, setImageMode] = useState(false);
  const [angiographic3D, setAngiographic3D] = useState(false);
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
    if (imageField === "linked") return linkedCenter;
    if (imageField === "selection" && item) {
      const low = worldPoint(item.bounds[0]), high = worldPoint(item.bounds[1]);
      return low.map((value, k) => (value + high[k]) / 2) as P3;
    }
    return imageField === "supraaortic" ? [0, -18, 0] : [0, 0, 0];
  }, [imageField, item, linkedCenter]);
  useEffect(() => { if (imageMode) poseRef.current = {yaw, pitch, zoom: imageZoom, center: imageCenter}; }, [imageMode, yaw, pitch, imageZoom, imageCenter]);
  const matches = useMemo(() => {
    const needle = normalize(search.trim());
    return atlasStructures.filter((o) => {
      const labels = diagramLabelsByStructure.get(o.id) ?? [];
      return /^\d+[a-z]?$/.test(needle) ? labels.some((row) => row.number === needle)
        : normalize(`${o.name} ${o.latin} ${"portuguese" in o ? o.portuguese : ""} ${o.path.join(" ")} ${landmarkAliases[o.id] ?? ""} ${labels.map((row) => row.portuguese).join(" ")}`).includes(needle);
    });
  }, [search]);
  function restore() {
    setHidden(new Set()); setView("Oblíqua"); setTool("select"); setPickScope("arterial"); setIsolate(false); setOpacity(initialOpacity); setPresentation("vascular");
    setImageMode(false); setAngiographic3D(false); setContrastLayer("arterial"); setYaw(0); setPitch(0); setImageZoom(1); setImageBone(0); setImageField("cranial"); poseRef.current = {yaw:31,pitch:10,zoom:1,center:[0,-3,0]};
    setCut({ axis: "none", offset: 0 }); setReset((n) => n + 1);
  }
  return <section className={`nda ${expanded ? "nda-expanded" : ""}`} aria-label="Atlas anatômico de superfícies">
    <header><div><span className="n3-eyebrow">EXPLORAR · CABEÇA E PESCOÇO</span>
      <h2>Anatomia neurovascular</h2><p>{openAnatomy.structures.length} estruturas importadas + {reconstructedArteries.length} reconstruções didáticas</p></div>
      <div className="nda-actions"><button onClick={restore}>Restaurar visão</button>
      <button aria-pressed={expanded} onClick={() => setExpanded((value) => !value)}>{expanded ? "Reduzir área 3D" : "Ampliar área 3D"}</button></div>
    </header>
    {item && <div className="nda-selection" data-testid="atlas-selection" data-selected-id={item.id} role="status"><div><strong>{item.name}</strong>{(hidden.has(item.id) || opacity[item.layer] === 0) && <small>Estrutura oculta. Use Revelar seleção para mostrá-la.</small>}<small>{openLayerNames[item.layer]} · seleção mantida até escolher outra estrutura ou limpar</small>
      {anatomicalInventory.some((row) => row.ids.includes(item.id)) && <small data-testid="selected-diagram-numbers">Neuroangio: {anatomicalInventory.filter((row) => row.ids.includes(item.id)).map((row) => `${row.number} (${row.status === "partial" ? "parcial" : "identificado"})`).join(" · ")}</small>}</div><button onClick={() => { setFocus((n) => n + 1); setImageField("selection"); }}>Focar seleção</button><button aria-pressed={isolate} onClick={() => setIsolate((value) => !value)}>Isolar seleção</button><button onClick={() => { if (selected) setHidden(old => new Set([...old, selected])); setSelected(null); setIsolate(false); }}>Ocultar estrutura</button><button onClick={() => { if (item) { setHidden(old => { const next = new Set(old); next.delete(item.id); return next; }); setOpacity(old => ({ ...old, [item.layer]: 1 })); } }}>Revelar seleção</button><button onClick={() => { setSelected(null); setIsolate(false); }}>Limpar seleção</button></div>}
    <div className="nda-workspace">
      <div className="nda-stage"><nav className="nda-mode" aria-label="Representação do atlas">
        <button aria-pressed={!imageMode && !angiographic3D} onClick={() => { setImageMode(false); setAngiographic3D(false); }}>Superfícies anatômicas 3D</button>
        <button aria-pressed={imageMode} onClick={() => { const pose = poseRef.current; setYaw(pose.yaw); setPitch(pose.pitch); setImageZoom(pose.zoom); setLinkedCenter(pose.center); setImageField("linked"); setImageMode(true); setAngiographic3D(false); }}>Angiografia</button>
        <button aria-pressed={angiographic3D} onClick={() => { setImageMode(false); setAngiographic3D(true); }}>Angiografia 3D</button>
      </nav><div className="nda-toolbar"><nav aria-label="Vistas do modelo detalhado">
        {(["AP", "Lateral", "Oblíqua", "Posterior"] as View[]).map((name) => <button key={name} aria-pressed={view === name} onClick={() => { setView(name); setYaw(name === "Lateral" ? 90 : name === "Posterior" ? 180 : name === "Oblíqua" ? 30 : 0); setPitch(0); }}>{name}</button>)}
      </nav><select aria-label="Apresentação anatômica" value={presentation} onChange={(event) => {
        const mode = event.target.value; setPresentation(mode);
        if (mode === "supraaortic") {
          setOpacity({ ...initialOpacity, bone: 0, tissue: 0, nerve: 0, gland: 0, dura: 0, venous: 0.15 });
          setSelected("aortic_arch"); setFocus(n => n + 1); setImageField("supraaortic"); setImageZoom(1.5); return;
        }
        setImageField(mode === "sellar" ? "selection" : "cranial");
        setOpacity(mode === "bone" ? { ...initialOpacity, bone: 0.65, tissue: 0, nerve: 0.5 } : mode === "brain" ? { ...initialOpacity, tissue: 0.85, bone: 0, nerve: 0.5, arterial: 0.5, venous: 0.2 } : mode === "sellar" ? { ...initialOpacity, bone: 0.12, tissue: 0.02, dura: 0.2, gland: 1, venous: 0.8 } : initialOpacity);
        if (mode === "sellar") { setSelected("adenohypophysis"); setFocus(n => n + 1); }
      }}><option value="custom" disabled>Personalizada</option><option value="vascular">Visão vascular</option><option value="bone">Vasos e osso</option><option value="brain">Encéfalo</option><option value="sellar">Região selar e cavernosa</option><option value="supraaortic">Arco e troncos supra-aórticos</option></select></div>
      {!imageMode && <div className="nda-interaction" aria-label="Controles de manipulação 3D">
        <div role="group" aria-label="Ferramenta 3D">{([['select','Selecionar'],['rotate','Girar'],['pan','Mover']] as const).map(([value,label]) => <button key={value} aria-pressed={tool === value} onClick={() => setTool(value)}>{label}</button>)}</div>
        <label>Selecionar ao clicar<select aria-label="Estruturas selecionáveis" value={pickScope} onChange={e => setPickScope(e.target.value as PickScope)}><option value="arterial">Artérias</option><option value="venous">Veias e seios</option><option value="vascular">Todos os vasos</option><option value="all">Todas as estruturas visíveis</option></select></label>
        <button onClick={() => { setPresentation("custom"); setOpacity(Object.fromEntries(Object.keys(initialOpacity).map(layer => [layer, layer === "arterial" || layer === "venous" ? 1 : 0]))); }}>Somente vasos</button>
        {!!hidden.size && <button onClick={() => setHidden(new Set())}>Reexibir ocultas ({hidden.size})</button>}
        <p>{tool === "select" ? "Clique ou toque para identificar sem mover a câmera. Botão direito + arraste para girar." : tool === "rotate" ? "Arraste para girar. Volte a Selecionar para identificar uma estrutura." : "Arraste para deslocar. Volte a Selecionar para identificar uma estrutura."} Roda para zoom; dois dedos para mover e ampliar. Focar seleção é uma ação separada.</p>
      </div>}
      <div className="nda-canvas" data-testid="detailed-atlas-canvas" data-representation={imageMode ? "angiography-2d" : angiographic3D ? "angiography-3d" : "anatomy-3d"}><Boundary key={imageMode ? "2d" : angiographic3D ? "angio3d" : "anatomy3d"}>
        {imageMode ? <AtlasAngiography hidden={hidden} center={imageCenter} yaw={yaw} pitch={pitch} zoom={imageZoom} boneOpacity={imageBone} selected={selected} isolate={isolate} layers={opacity} contrastLayer={contrastLayer} onSelect={setSelected} /> : <Canvas key={angiographic3D ? "angiographic" : "anatomic"} orthographic={angiographic3D} frameloop="demand" dpr={[1, 1.5]} camera={{ position: [30, 10, 50], near: 0.1, far: 600, fov: 40 }} gl={{ antialias: true, localClippingEnabled: true }}
          fallback={<p>WebGL indisponível neste navegador. Explore a lista de estruturas.</p>}>
          <color attach="background" args={[angiographic3D ? "#05090d" : "#101b25"]} /><ambientLight intensity={1.1} />
          <directionalLight position={[15, 25, 35]} intensity={2.4} /><directionalLight position={[-20, 10, -15]} intensity={1.2} />
          <Suspense fallback={null}><group scale={100} position={[0, -160, 0]}>
            {openAnatomy.assets.map((asset) => <Asset key={asset.file} file={asset.file} hidden={hidden} pickScope={pickScope} tool={tool} angiographic={angiographic3D} contrastLayer={contrastLayer} opacity={opacity} selected={selected} isolate={isolate} cut={cut} onSelect={(id) => { setSelected(id); setPanel("Estruturas"); }} />)}
          </group><ReconstructedSurfaces hidden={hidden} tool={tool} pickScope={pickScope} angiographic={angiographic3D} opacity={angiographic3D && contrastLayer === "venous" ? { ...opacity, arterial: 0 } : opacity} selected={selected} isolate={isolate} cut={cut} onSelect={(id) => { setSelected(id); setPanel("Estruturas"); }} /></Suspense><Camera selected={item} view={view} reset={reset} focus={focus} tool={tool} poseRef={poseRef} />
        </Canvas>}</Boundary>
        <div className="nda-canvas-caption">{item ? item.name : "Selecione uma estrutura para explorar"}<small>{imageMode ? "Projeção das mesmas superfícies · ajuste os ângulos no painel" : angiographic3D ? "Vista vascular 3D vinculada à projeção 2D · selecione Girar para rotacionar" : "Escolha Selecionar, Girar ou Mover nos controles acima"}</small></div>
      </div></div>
      <aside className="nda-sidebar"><nav aria-label="Painel do atlas detalhado">
        {["Camadas", "Estruturas", "Revisão", "Inventário"].map((name) => <button key={name} aria-pressed={panel === name} onClick={() => setPanel(name)}>{name}</button>)}
      </nav>
      {panel === "Camadas" && <div className="nda-controls" key={reset}>{(imageMode || angiographic3D) && <label>Camada contrastada<select aria-label="Camada vascular na angiografia" value={contrastLayer} onChange={(e) => setContrastLayer(e.target.value)}><option value="arterial">Artérias</option><option value="venous">Veias e seios</option><option value="both">Artérias e veias</option></select></label>}{angiographic3D && <><h3>Vista angiográfica 3D</h3><p className="nda-help">Vista vascular ortográfica vinculada à angiografia 2D: orientação, centro, ampliação, seleção e ocultações são compartilhados ao alternar. Use Girar para explorar e Selecionar para identificar. Esta etapa usa superfícies do atlas; a aquisição rotacional e reconstrução volumétrica ainda não estão implementadas.</p></>}{imageMode && <div className="nda-projection-controls">
        <h3>Imagem angiográfica</h3><p className="nda-help">Projeção sintética do atlas. Todos os vasos visíveis são opacificados; não é uma injeção seletiva. Use a estação para cateterização.</p>
        <label>Campo angiográfico<select aria-label="Campo angiográfico" value={imageField} onChange={(event) => setImageField(event.target.value)}><option value="linked">Mesmo campo da vista 3D</option><option value="cranial">Cabeça</option><option value="supraaortic">Cervicotorácico</option><option value="selection" disabled={!item}>Centrado na seleção</option></select></label>

        <label>Rotação LAO / RAO <output>{yaw}°</output><input aria-label="Rotação angiográfica" type="range" min="-180" max="180" step="5" value={yaw} onChange={(e) => setYaw(Number(e.target.value))} /></label>
        <label>Angulação cranial / caudal <output>{pitch}°</output><input aria-label="Angulação angiográfica" type="range" min="-60" max="60" step="5" value={pitch} onChange={(e) => setPitch(Number(e.target.value))} /></label>
        <label>Ampliação <output>{imageZoom.toFixed(1)}×</output><input aria-label="Ampliação angiográfica" type="range" min="0.1" max="12" step="0.1" value={imageZoom} onChange={(e) => setImageZoom(Number(e.target.value))} /></label>
        <label>Sobreposição óssea <output>{Math.round(imageBone * 100)}%</output><input aria-label="Sobreposição óssea angiográfica" type="range" min="0" max="1" step="0.05" value={imageBone} onChange={(e) => setImageBone(Number(e.target.value))} /></label>
        <small>Opacidade vascular controla inclusão de camadas. Cortes de exploração aplicam-se à visão 3D.</small>
      </div>}<h3>Marcos anatômicos</h3><div className="nda-landmarks">{landmarkShortcuts.map(([id, label]) => <button key={id} aria-pressed={selected === id} onClick={() => setSelected(id)}>{label}</button>)}</div><h3>Visibilidade das camadas</h3><p className="nda-help">Ajuste a transparência para revelar as relações entre vasos, ossos e nervos. Camadas em 0% ficam ocultas e não recebem cliques, inclusive a estrutura selecionada. Use Revelar seleção para mostrá-la novamente.</p>
        {Object.entries(openLayerNames).map(([key, label]) => <div key={key} className="nda-layer"><label><span>{label}<output>{Math.round(opacity[key] * 100)}%</output></span>
          <input type="range" min="0" max="100" step="5" aria-label={`Opacidade · ${label}`} value={Math.round(opacity[key] * 100)} onChange={(event) => { setPresentation("custom"); setOpacity((old) => ({ ...old, [key]: Number(event.target.value) / 100 })); }} />
        </label><button aria-label={`${opacity[key] > 0 ? "Ocultar" : "Mostrar"} camada · ${label}`} onClick={() => { setPresentation("custom"); setOpacity(old => ({ ...old, [key]: old[key] > 0 ? 0 : initialOpacity[key] || 1 })); }}>{opacity[key] > 0 ? "Ocultar camada" : "Mostrar camada"}</button></div>)}
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
        <details><summary>Estruturas cranianas e cervicais recuperadas ({craniocervical.structures.length})</summary>
          <p className="nda-help">CC BY-SA 4.0 · coordenadas originais preservadas. Regiões, cavidades e inserções são camadas de contexto. Selecione para identificar em 3D ou marcar a projeção 2D.</p>
          {Object.entries(openLayerNames).map(([layer, label]) => {
            const rows = craniocervical.structures.filter((structure) => structure.layer === layer);
            return rows.length > 0 && <details key={layer}><summary>{label} ({rows.length})</summary>{rows.map((structure) => <button key={structure.id} onClick={() => { setSelected(structure.id); setPanel("Estruturas"); }}>{structure.name}</button>)}</details>;
          })}
          <details><summary>Elementos sem superfície utilizável na fonte</summary>{contextAudit.excludedCandidates.filter((row) => !["meso_appendix", "mesocolon", "greater_omentum", "lesser_omentum"].includes(row.id)).map((row) => <p key={row.id}>{row.id}: {row.reason === "source-node-missing" ? "rótulo sem nó correspondente no arquivo de origem" : "superfície degenerada na origem"}</p>)}</details>
        </details>
        <DiagramInventory onSelect={(id) => { setSelected(id); setPanel("Estruturas"); }} />
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
