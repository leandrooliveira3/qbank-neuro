import React, {
  Component,
  Suspense,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei/core/OrbitControls";
import { useGLTF } from "@react-three/drei/core/Gltf";
import {
  Box3,
  Mesh,
  MeshStandardMaterial,
  PropertyBinding,
  Vector3,
} from "three";
import type { OrbitControls as OrbitControlsType } from "three-stdlib";
import { data, modelUrl, Structure } from "./model";

type Props = {
  scene: string;
  variant: string;
  stage: number;
  objects: Structure[];
  selected: string | null;
  onSelect: (id: string) => void;
  labels: boolean;
};
class RenderBoundary extends Component<
  {
    children: React.ReactNode;
    fallback: React.ReactNode;
    onError?: () => void;
  },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    this.props.onError?.();
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}
function Model({
  url,
  objects,
  selected,
  onSelect,
  labels,
}: Omit<Props, "scene" | "variant" | "stage"> & { url: string }) {
  const { scene } = useGLTF(url);
  const invalidate = useThree((state) => state.invalidate);
  const cloned = useMemo(() => {
    const clone = scene.clone(true);
    clone.traverse((node) => {
      if (node instanceof Mesh) {
        node.material = new MeshStandardMaterial({
          color: 0xffffff,
          roughness: 0.38,
          metalness: 0.12,
        });
      }
    });
    return clone;
  }, [scene]);
  useEffect(
    () => () => {
      cloned.traverse((node) => {
        if (node instanceof Mesh)
          (node.material as MeshStandardMaterial).dispose();
      });
    },
    [cloned],
  );
  const byName = useMemo(
    () =>
      new Map(
        objects.map((o) => [PropertyBinding.sanitizeNodeName(o.name), o]),
      ),
    [objects],
  );
  useEffect(() => {
    cloned.traverse((node) => {
      if (!(node instanceof Mesh)) return;
      const o = byName.get(node.name);
      node.visible = !!o;
      node.userData.atlasId = o?.id;
      node.onAfterRender = (renderer) => {
        renderer.domElement.dataset.atlasRendered = url;
      };
      if (o) {
        const m = node.material as MeshStandardMaterial;
        m.color.set(o.color);
        m.emissive.set(o.id === selected ? "#237c72" : "#000000");
        m.emissiveIntensity = 0.65;
      }
    });
    invalidate();
  }, [cloned, byName, selected, scene, invalidate, url]);
  return (
    <group>
      <primitive
        object={cloned}
        dispose={null}
        onClick={(event: { stopPropagation: () => void; object: Mesh }) => {
          event.stopPropagation();
          const id = event.object.userData.atlasId;
          if (id) onSelect(id);
        }}
      />
    </group>
  );
}
function Camera({
  scene,
  view,
  reset,
}: {
  scene: string;
  view: string;
  reset: number;
}) {
  const controls = useRef<OrbitControlsType>(null);
  const { camera, invalidate } = useThree();
  useEffect(() => {
    const m = data.scene_meta[scene];
    const c = new Vector3(...(m.center as [number, number, number]));
    const offset =
      view === "Lateral"
        ? new Vector3(m.distance, 0, 0)
        : view === "AP"
          ? new Vector3(0, 0, m.distance)
          : new Vector3(
              Math.sin(m.yaw) * m.distance,
              Math.sin(m.pitch) * m.distance,
              Math.cos(m.yaw) * m.distance,
            );
    camera.position.copy(c.clone().add(offset));
    camera.lookAt(c);
    controls.current?.target.copy(c);
    controls.current?.update();
    invalidate();
  }, [scene, view, reset, camera, invalidate]);
  return (
    <OrbitControls
      ref={controls}
      makeDefault
      minDistance={3}
      maxDistance={50}
      enableDamping
    />
  );
}
function Compatible({
  objects,
  selected,
  onSelect,
}: Pick<Props, "objects" | "selected" | "onSelect">) {
  const points = objects.flatMap((o) => o.points);
  const bounds = new Box3().setFromPoints(
    points.map((p) => new Vector3(...(p as [number, number, number]))),
  );
  const size = bounds.getSize(new Vector3());
  const center = bounds.getCenter(new Vector3());
  const scale = 290 / Math.max(size.x, size.y, 1);
  const [angle, setAngle] = useState(0);
  const project = (p: number[]) => {
    const x = p[0] - center.x,
      z = p[2] - center.z;
    return `${180 + (x * Math.cos(angle) - z * Math.sin(angle)) * scale},${180 - (p[1] - center.y) * scale}`;
  };
  return (
    <div className="n3-compatible" data-testid="compatible-view">
      <p role="status">
        Modo compatível: projeção esquemática. WebGL ou modelo indisponível.
      </p>
      <label>
        Rotação da projeção{" "}
        <input
          aria-label="Rotação da projeção"
          type="range"
          min="-3.14"
          max="3.14"
          step="0.05"
          value={angle}
          onChange={(e) => setAngle(Number(e.target.value))}
        />
      </label>
      <svg viewBox="0 0 360 360" aria-label="Projeção dos vasos">
        {objects.map((o) => (
          <polyline
            key={o.id}
            points={o.points.map(project).join(" ")}
            fill="none"
            stroke={o.id === selected ? "#f8fafc" : o.color}
            strokeWidth={Math.max(2, o.radius * scale * 1.3)}
            strokeLinejoin="round"
            strokeLinecap="round"
            onClick={() => onSelect(o.id)}
          >
            <title>{o.name}</title>
          </polyline>
        ))}
      </svg>
      <p>Selecione as estruturas pela lista acessível.</p>
    </div>
  );
}
function hasWebGL() {
  try {
    const c = document.createElement("canvas");
    const context = c.getContext("webgl2");
    if (!context) return false;
    context.getExtension("WEBGL_lose_context")?.loseContext();
    return true;
  } catch {
    return false;
  }
}
function SelectedLabel({
  object,
  labelRef,
}: {
  object: Structure | undefined;
  labelRef: React.RefObject<HTMLSpanElement | null>;
}) {
  const point = useMemo(
    () =>
      object
        ? new Vector3(
            ...(object.points[Math.floor(object.points.length / 2)] as [
              number,
              number,
              number,
            ]),
          )
        : null,
    [object],
  );
  useFrame(({ camera, size }) => {
    if (!point || !labelRef.current) return;
    const p = point.clone().project(camera);
    labelRef.current.style.left = `${((p.x + 1) * size.width) / 2}px`;
    labelRef.current.style.top = `${((-p.y + 1) * size.height) / 2}px`;
    labelRef.current.style.visibility = p.z > 1 ? "hidden" : "visible";
  });
  return null;
}
export default function Viewer(props: Props) {
  const labelRef = useRef<HTMLSpanElement>(null);
  const selectedObject = props.objects.find((o) => o.id === props.selected);
  const [view, setView] = useState("Oblíqua");
  const [compatible, setCompatible] = useState(() => !hasWebGL());
  const [generation, setGeneration] = useState(0);
  const fallback = <Compatible {...props} />;
  const url = modelUrl(props.scene, props.variant, props.stage);
  return (
    <section className="n3-viewer" aria-label="Visualizador anatômico">
      <div className="n3-viewtools">
        {["AP", "Lateral", "Oblíqua"].map((v) => (
          <button
            key={v}
            aria-pressed={view === v}
            onClick={() => {
              setView(v);
              setGeneration((n) => n + 1);
            }}
          >
            {v}
          </button>
        ))}
        <button
          aria-pressed={compatible}
          onClick={() => setCompatible((v) => !v)}
        >
          {compatible ? "Tentar 3D" : "Modo compatível"}
        </button>
      </div>
      <div className="n3-canvas" data-testid="atlas-canvas">
        {compatible ? (
          fallback
        ) : (
          <RenderBoundary
            fallback={fallback}
            onError={() => setCompatible(true)}
          >
            <Canvas
              frameloop="demand"
              dpr={[1, 1.5]}
              camera={{ position: [0, 2, 18], fov: 45 }}
              gl={{ antialias: true }}
              onCreated={({ gl }) => {
                gl.domElement.addEventListener(
                  "webglcontextlost",
                  () => setCompatible(true),
                  { once: true },
                );
              }}
              fallback={fallback}
            >
              <color attach="background" args={["#091622"]} />
              <ambientLight intensity={1.4} />
              <directionalLight position={[5, 8, 10]} intensity={2.5} />
              <directionalLight position={[-5, 0, -5]} intensity={1} />
              <RenderBoundary
                key={url}
                fallback={null}
                onError={() => setCompatible(true)}
              >
                <Suspense fallback={null}>
                  <Model {...props} url={url} />
                </Suspense>
              </RenderBoundary>
              <SelectedLabel object={selectedObject} labelRef={labelRef} />
              <Camera scene={props.scene} view={view} reset={generation} />
            </Canvas>
          </RenderBoundary>
        )}
        {!compatible && props.labels && selectedObject && (
          <span ref={labelRef} className="n3-label n3-spatial-label">
            {selectedObject.name}
          </span>
        )}
      </div>
      <div className="n3-viewfoot">
        Arraste para girar · roda/pinça para ampliar · seleção também pela
        lista. Projeções ilustrativas, sem equivalência DSA validada.
      </div>
    </section>
  );
}
