import React from "react";
import { directionFromAngles, type AngiographyPose } from "../angiographyPose";
import "./study.css";
export const studyPresets = [
  { name: "AP de estudo", yaw: 0, pitch: 0 },
  { name: "Lateral de estudo", yaw: 90, pitch: 0 },
  { name: "Oblíqua +30°", yaw: 30, pitch: 0 },
  { name: "Oblíqua −30°", yaw: -30, pitch: 0 },
  { name: "Inclinação +20°", yaw: 0, pitch: 20 },
  { name: "Inclinação −20°", yaw: 0, pitch: -20 },
] as const;
export function studyPose(
  pose: AngiographyPose,
  yaw: number,
  pitch: number,
): AngiographyPose {
  if (!Number.isFinite(yaw) || !Number.isFinite(pitch))
    throw Error("Ângulos inválidos");
  return {
    ...pose,
    yaw: Math.max(-180, Math.min(180, yaw)),
    pitch: Math.max(-60, Math.min(60, pitch)),
    center: [...pose.center],
  };
}
export default function ProjectionStudy({
  pose,
  compare,
  onCompare,
  onPose,
}: {
  pose: AngiographyPose;
  compare: boolean;
  onCompare: () => void;
  onPose: (pose: AngiographyPose) => void;
}) {
  const direction = directionFromAngles(pose.yaw, pose.pitch),
    cx = 100,
    cy = 72;
  return (
    <section className="nps" aria-label="Laboratório de projeções">
      <div className="nps-heading">
        <div>
          <small>ANATOMIA → PROJEÇÃO</small>
          <h3>Entenda o ângulo. Reconheça o vaso.</h3>
        </div>
        <button aria-pressed={compare} onClick={onCompare}>
          {compare ? "Fechar comparação" : "Comparar 3D + 2D"}
        </button>
      </div>
      <p>
        Gire a anatomia para observar a mesma orientação na projeção. Selecione
        o mesmo vaso nas duas vistas.
      </p>
      <div className="nps-controls">
        <div>
          <div className="nps-presets">
            {studyPresets.map((p) => (
              <button
                key={p.name}
                aria-pressed={
                  Math.abs(pose.yaw - p.yaw) < 0.1 &&
                  Math.abs(pose.pitch - p.pitch) < 0.1
                }
                onClick={() => onPose(studyPose(pose, p.yaw, p.pitch))}
              >
                {p.name}
              </button>
            ))}
          </div>
          <label>
            Rotação do atlas · α <output>{pose.yaw.toFixed(1)}°</output>
            <input
              type="range"
              min="-180"
              max="180"
              step="1"
              aria-label="Rotação de estudo"
              value={pose.yaw}
              onChange={(e) =>
                onPose(studyPose(pose, +e.target.value, pose.pitch))
              }
            />
          </label>
          <label>
            Inclinação do atlas · β <output>{pose.pitch.toFixed(1)}°</output>
            <input
              type="range"
              min="-60"
              max="60"
              step="1"
              aria-label="Inclinação de estudo"
              value={pose.pitch}
              onChange={(e) =>
                onPose(studyPose(pose, pose.yaw, +e.target.value))
              }
            />
          </label>
          <div className="nps-presets">
            <button
              onClick={() =>
                onPose({ ...pose, zoom: Math.min(12, pose.zoom * 1.2) })
              }
            >
              Ampliar +
            </button>
            <button
              onClick={() =>
                onPose({ ...pose, zoom: Math.max(0.1, pose.zoom / 1.2) })
              }
            >
              Reduzir −
            </button>
            <span>{pose.zoom.toFixed(2)}×</span>
          </div>
        </div>
        <figure>
          <svg
            viewBox="0 0 200 145"
            role="img"
            aria-label={`Eixo de observação no plano XZ: rotação ${pose.yaw.toFixed(1)} graus`}
          >
            <ellipse
              cx={cx}
              cy={cy}
              rx="51"
              ry="51"
              fill="none"
              stroke="#355464"
              strokeDasharray="3 5"
            />
            <line x1="20" y1={cy} x2="180" y2={cy} stroke="#29424d" />
            <line x1={cx} y1="10" x2={cx} y2="132" stroke="#29424d" />
            <ellipse cx={cx} cy={cy} rx="17" ry="22" fill="#355f65" />
            <line
              x1={cx}
              y1={cy}
              x2={cx + direction[0] * 62}
              y2={cy - direction[2] * 62}
              stroke="#7bdac5"
              strokeWidth="3"
            />
            <circle
              cx={cx + direction[0] * 62}
              cy={cy - direction[2] * 62}
              r="6"
              fill="#7bdac5"
            />
            <text x="173" y="65" fill="#91adb9" fontSize="10">
              X
            </text>
            <text x="107" y="16" fill="#91adb9" fontSize="10">
              Z
            </text>
          </svg>
          <figcaption>
            Eixo de observação · paciente fixo
            <br />
            Esquema de orientação, sem escala física
          </figcaption>
        </figure>
      </div>
      <details>
        <summary>Geometria e limites desta comparação</summary>
        <p>
          A projeção usa as superfícies do atlas e um modelo ortográfico
          existente. Não simula atenuação, transporte de contraste nem cine
          clínico. α/β são ângulos internos do atlas; estes botões não são
          protocolos de aquisição nem ângulos DICOM calibrados. Centro,
          ampliação, seleção e ocultações são compartilhados; osso de contexto
          3D e sobreposição 2D têm controles distintos. O 2D geral usa a cópia
          simplificada das superfícies.
        </p>
        <p>
          Referência de organização:{" "}
          <a href="https://learncoronary.com/" target="_blank" rel="noreferrer">
            LearnCoronary
          </a>
          . Implementação própria; a aquisição perspectiva daquele site não foi
          transplantada para este atlas.
        </p>
      </details>
    </section>
  );
}
