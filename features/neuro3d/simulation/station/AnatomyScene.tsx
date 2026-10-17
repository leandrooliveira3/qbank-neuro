import React, { Component, useMemo, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei/core/OrbitControls";
import { BufferGeometry, Float32BufferAttribute, CatmullRomCurve3, DoubleSide, Vector3 } from "three";
import { caseFor, networkFor, StationState } from "./engine";
import { P3, pointAt, locate, trackPoints } from "./network";
import { instrumentPoints } from "./mechanics";
import { lumenFactor, devicePoints } from "./imaging";
import ReferenceAnatomy from "./ReferenceAnatomy";
import { sacRadius, vesselSurface, Surface } from "./surfaces";
class Boundary extends Component<
  { children: React.ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <p>3D indisponível. Os monitores 2D continuam operacionais.</p>
    ) : (
      this.props.children
    );
  }
}
function Tube({
  points,
  radius,
  color,
  opacity = 1,
}: {
  points: P3[];
  radius: number;
  color: string;
  opacity?: number;
}) {
  const curve = useMemo(
    () => new CatmullRomCurve3(points.map((p) => new Vector3(...p))),
    [points],
  );
  if (
    points.length < 2 ||
    !points.some((p) => p.some((v, i) => Math.abs(v - points[0][i]) > 0.00001))
  )
    return null;
  return (
    <mesh>
      <tubeGeometry
        args={[curve, Math.max(16, points.length * 4), radius, 9, false]}
      />
      <meshStandardMaterial
        color={color}
        transparent={opacity < 1}
        opacity={opacity}
        depthWrite={opacity === 1}
        side={DoubleSide}
      />
    </mesh>
  );
}
function Lumen({ surface, sac }: { surface: Surface; sac: boolean }) {
  const geometry = useMemo(() => {
    const result = new BufferGeometry();
    result.setAttribute("position", new Float32BufferAttribute(surface.positions, 3));
    result.setIndex(Array.from(surface.indices));
    result.computeVertexNormals();
    return result;
  }, [surface]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return <mesh geometry={geometry}>
    <meshStandardMaterial color={sac ? "#bd5364" : "#ba7880"}
      transparent opacity={0.29} depthWrite={false} side={DoubleSide} roughness={0.62} />
  </mesh>;
}
function Content({ s }: { s: StationState }) {
  const n = networkFor(s),
    c = caseFor(s);
  const vessels = useMemo(() => Object.values(n).map((v) => ({
    id: v.id,
    surface: vesselSurface(v, v.id === "sac" ? sacRadius : (t) =>
      v.radius * (c.kind === "carotid" && v.id === c.target
        ? lumenFactor(t, c.targetT, s.dilation) : 1)),
  })), [n, c, s.dilation]);
  const tools = useMemo(
    () =>
      (["wire", "catheter", "micro"] as const).map((k) => ({
        key: k,
        points: instrumentPoints(s, n, k),
      })),
    [n, s.tools, s.rotation, s.catheterShape, s.wireKind],
  );
  const dev = useMemo(() => devicePoints(s, n), [n, s.device]);
  const target = pointAt(n[c.target], c.targetT);
  return (
    <group>
      {s.geometry === "reference" ? <ReferenceAnatomy s={s} /> : vessels.map((v) => <Lumen key={v.id} surface={v.surface} sac={v.id === "sac"} />)}
      {tools.map((t, i) => (
        <Tube
          key={t.key}
          points={t.points}
          radius={[0.027, 0.08, 0.045][i]}
          color={["#f2d281", "#75b7d4", "#e6ecf0"][i]}
        />
      ))}
      {dev.length > 1 && <Tube points={dev} radius={0.025} color="#c9e0e8" />}
      {s.implants.map((d, i) => {
        const p = locate(n, d.track).point;
        return (
          <mesh key={i} position={p}>
            <torusKnotGeometry args={[0.19, 0.035, 55, 6]} />
            <meshStandardMaterial color="#dae2e6" />
          </mesh>
        );
      })}
      {s.clot && (
        <mesh position={target}>
          <capsuleGeometry args={[0.16, 0.55, 6, 12]} />
          <meshStandardMaterial color="#912f37" />
        </mesh>
      )}
      {c.kind === "carotid" && (
        <mesh position={target}>
          <torusGeometry args={[0.18, 0.1 * (1 - s.dilation * 0.8), 8, 24]} />
          <meshStandardMaterial color="#bd9a6a" />
        </mesh>
      )}
    </group>
  );
}
export default function AnatomyScene({ s }: { s: StationState }) {
  return (
    <Boundary>
      <div className="nvs-anatomy" data-testid="station-3d">
        <Canvas
          frameloop="demand"
          camera={{ position: [0, -2, 32], fov: 55 }}
          dpr={[1, 1.3]}
          fallback={<p>Visão 3D indisponível; monitores 2D operacionais.</p>}
        >
          <color attach="background" args={["#09141c"]} />
          <ambientLight intensity={1.5} />
          <directionalLight position={[5, 10, 15]} intensity={2.5} />
          <Content s={s} />
          <OrbitControls
            makeDefault
            target={[0, -4, 0]}
            minDistance={3}
            maxDistance={65}
          />
        </Canvas>
      </div>
    </Boundary>
  );
}
