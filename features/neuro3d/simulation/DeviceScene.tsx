import React, { Component, useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei/core/OrbitControls";
import { CatmullRomCurve3, Vector3 } from "three";
import type { Device } from "./engine";
import { pointOnRoute, route } from "./geometry";
import type { TrainingCase } from "./cases";
interface Props {
  position: number;
  deployment: number;
  device: Device | null;
  anatomy: TrainingCase["anatomy"];
}
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
      <p>Visualização 3D indisponível. Use as projeções esquemáticas abaixo.</p>
    ) : (
      this.props.children
    );
  }
}
function Geometry({ position, deployment, device, anatomy }: Props) {
  const curve = useMemo(
    () =>
      new CatmullRomCurve3(
        route.map((p) => new Vector3(...p)),
        false,
        "centripetal",
      ),
    [],
  );
  const tip = pointOnRoute(position),
    target = pointOnRoute(80),
    amount = deployment / 100;
  const wire = useMemo(() => {
    const n = Math.max(2, Math.ceil(position));
    return new CatmullRomCurve3(
      Array.from(
        { length: n + 1 },
        (_, i) => new Vector3(...pointOnRoute((position * i) / n)),
      ),
    );
  }, [position]);
  const helix = useMemo(
    () =>
      new CatmullRomCurve3(
        Array.from({ length: 100 }, (_, i) => {
          const a = (i / 99) * Math.PI * 10;
          return new Vector3(
            Math.cos(a) * 0.55,
            Math.sin(a) * 0.55,
            (i / 99 - 0.5) * 0.8,
          );
        }),
      ),
    [],
  );
  return (
    <group>
      <mesh>
        <tubeGeometry args={[curve, 90, 0.3, 12, false]} />
        <meshStandardMaterial
          color="#e6a5a6"
          transparent
          opacity={0.33}
          depthWrite={false}
        />
      </mesh>
      <mesh>
        <tubeGeometry args={[wire, 80, 0.055, 8, false]} />
        <meshStandardMaterial color="#fff0a9" />
      </mesh>
      <mesh position={tip}>
        <sphereGeometry args={[0.14, 16, 12]} />
        <meshStandardMaterial color="#f9e48d" emissive="#886900" />
      </mesh>
      <mesh position={target}>
        <torusGeometry args={[0.55, 0.025, 8, 32]} />
        <meshBasicMaterial color="#65e4c6" />
      </mesh>
      {anatomy === "aneurysm" && (
        <mesh position={[target[0] + 0.7, target[1], target[2]]}>
          <sphereGeometry args={[0.8, 24, 18]} />
          <meshStandardMaterial
            color="#cc788c"
            transparent
            opacity={0.3}
            depthWrite={false}
          />
        </mesh>
      )}
      {anatomy === "clot" && (
        <mesh position={target}>
          <sphereGeometry args={[0.26, 20, 12]} />
          <meshStandardMaterial color="#bc543e" />
        </mesh>
      )}
      {anatomy === "stenosis" && (
        <mesh position={target}>
          <torusGeometry args={[0.22, 0.12, 12, 24]} />
          <meshStandardMaterial color="#b89b5d" />
        </mesh>
      )}
      {anatomy === "shunt" && (
        <mesh position={[target[0] + 0.6, target[1], target[2]]}>
          <torusKnotGeometry args={[0.5, 0.12, 80, 8]} />
          <meshStandardMaterial color="#c15c90" />
        </mesh>
      )}
      {anatomy === "branch" && (
        <mesh
          position={[target[0] + 0.65, target[1] + 0.3, target[2]]}
          rotation={[0, 0, -1.1]}
        >
          <cylinderGeometry args={[0.13, 0.13, 1.5, 12]} />
          <meshStandardMaterial color="#ba90de" transparent opacity={0.6} />
        </mesh>
      )}
      {amount > 0 && device && (
        <group
          position={
            device === "coil" ? [target[0] + 0.7, target[1], target[2]] : tip
          }
        >
          {device === "coil" ? (
            <mesh scale={amount}>
              <tubeGeometry args={[helix, 140, 0.04, 8, false]} />
              <meshStandardMaterial
                color="#d7e6ee"
                metalness={0.6}
                roughness={0.3}
              />
            </mesh>
          ) : device === "balloon" ? (
            <mesh scale={[amount, 1, amount]}>
              <sphereGeometry args={[0.5, 24, 18]} />
              <meshStandardMaterial color="#6bbde4" transparent opacity={0.6} />
            </mesh>
          ) : device === "aspiration" || device === "microcatheter" ? (
            <mesh rotation={[0, 0, -0.3]}>
              <cylinderGeometry
                args={[
                  device === "aspiration" ? 0.21 : 0.1,
                  device === "aspiration" ? 0.21 : 0.1,
                  1.6 * amount,
                  18,
                  1,
                  true,
                ]}
              />
              <meshStandardMaterial color="#eae9c5" side={2} />
            </mesh>
          ) : (
            <mesh scale={[amount, 1, amount]}>
              <cylinderGeometry
                args={[
                  0.38,
                  0.38,
                  1.8,
                  device === "flow-diverter" ? 32 : 16,
                  device === "flow-diverter" ? 12 : 5,
                  true,
                ]}
              />
              <meshBasicMaterial
                color={device === "retriever" ? "#e8d4a2" : "#8adee2"}
                wireframe
              />
            </mesh>
          )}
        </group>
      )}
    </group>
  );
}
export default function DeviceScene(props: Props) {
  return (
    <Boundary>
      <div className="n3-devicecanvas" data-testid="device-3d">
        <Canvas
          camera={{ position: [0, 0, 12], fov: 48 }}
          frameloop="demand"
          dpr={[1, 1.5]}
          fallback={
            <p>3D indisponível; projeções abaixo permanecem disponíveis.</p>
          }
        >
          <color attach="background" args={["#07131e"]} />
          <ambientLight intensity={1.8} />
          <directionalLight position={[4, 6, 8]} intensity={2.5} />
          <Geometry {...props} />
          <OrbitControls makeDefault minDistance={6} maxDistance={25} />
        </Canvas>
      </div>
    </Boundary>
  );
}
