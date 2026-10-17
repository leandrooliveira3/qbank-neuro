import React from "react";
import VascularImage from "./VascularImage";
import { instrumentPoints } from "./mechanics";
import {
  StationState,
  networkFor,
  opacifiedEdges,
  caseFor,
  projectionKey,
} from "./engine";
import { locate, trackPoints } from "./network";
import {
  devicePoints,
  HEIGHT,
  imagePath,
  project,
  statusLabel,
  WIDTH,
} from "./imaging";
export default function Fluoro({
  frame,
  current,
  biplane,
}: {
  frame: StationState;
  current: StationState;
  biplane: boolean;
}) {
  const n = networkFor(frame),
    c = caseFor(frame),
    opacified = opacifiedEdges(frame, n);
  const age = frame.contrast ? frame.clock - frame.contrast.at : 20;
  const contrastOpacity = Math.max(0, Math.min(1, (5 - age) * 0.55));
  return (
    <div className={`nvs-screens ${biplane ? "biplane" : ""}`}>
      {(biplane ? [0, 90] : [0]).map((plane, index) => {
        return (
          <section
            className="nvs-detector"
            key={plane}
            aria-label={`Monitor ${index ? "B" : "A"}`}
          >
            <div className="nvs-monitorhead">
              <span>
                {index ? "B" : "A"} · {statusLabel(current)}
              </span>
              <b>
                {index ? frame.view.yawB : frame.view.yaw}° / {index ? frame.view.pitchB : frame.view.pitch}°
              </b>
            </div>
            <svg
              viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
              style={{ filter: `contrast(${frame.view.gain})` }}
              role="img"
              aria-label={`Imagem ${index ? "B" : "A"} da hemodinâmica`}
              data-testid={`fluoro-${index ? "B" : "A"}`}
            >
              <defs>
                <radialGradient id={`detector-${index}`}>
                  <stop offset="0" stopColor="#d4d8dc" />
                  <stop offset="1" stopColor="#959da5" />
                </radialGradient>
                <clipPath id={`collimator-${index}`}>
                  <rect
                    x={(WIDTH * (1 - frame.view.collimation / 100)) / 2}
                    y={(HEIGHT * (1 - frame.view.collimation / 100)) / 2}
                    width={(WIDTH * frame.view.collimation) / 100}
                    height={(HEIGHT * frame.view.collimation) / 100}
                  />
                </clipPath>
              </defs>
              <rect width={WIDTH} height={HEIGHT} fill="#0e1114" />
              <g clipPath={`url(#collimator-${index})`}>
                <rect
                  width={WIDTH}
                  height={HEIGHT}
                  fill={`url(#detector-${index})`}
                />
                <g
                  opacity={
                    frame.mode === "dsa" || frame.mode === "roadmap" ? 0 : 0.1
                  }
                >
                  <ellipse
                    cx="300"
                    cy="85"
                    rx="67"
                    ry="82"
                    fill="none"
                    stroke="#343d44"
                    strokeWidth="12"
                  />
                  <path
                    d="M286 150V540M314 150V540"
                    fill="none"
                    stroke="#505860"
                    strokeWidth="12"
                  />
                </g>
                {frame.mode === "roadmap" && frame.mask && (
                  <VascularImage network={n} definition={c} edges={frame.mask.edges}
                    view={frame.mask.view} plane={plane} clot={frame.mask.clot}
                    dilation={frame.mask.dilation} opacity={0.85} inverted />
                )}
                <VascularImage network={n} definition={c} edges={opacified}
                  view={frame.view} plane={plane} clot={frame.clot}
                  dilation={frame.dilation} opacity={contrastOpacity} />
                {(["wire", "catheter", "micro"] as const).map((tool, i) => (
                  <path
                    data-instrument={tool}
                    key={tool}
                    d={imagePath(
                      instrumentPoints(frame, n, tool),
                      frame.view,
                      plane,
                    )}
                    fill="none"
                    stroke={tool === "wire" ? "#171717" : "#36393b"}
                    strokeWidth={
                      (i === 0 ? 0.8 : i === 1 ? 2.9 : 1.4) * frame.view.zoom
                    }
                    strokeLinecap="round"
                  />
                ))}
                {frame.device && (
                  <>
                    <path
                      d={imagePath(
                        trackPoints(n, frame.device.track),
                        frame.view,
                        plane,
                      )}
                      fill="none"
                      stroke="#292e32"
                      strokeWidth={1.2 * frame.view.zoom}
                    />
                    <path
                      d={imagePath(devicePoints(frame, n), frame.view, plane)}
                      fill="none"
                      stroke="#111820"
                      strokeWidth={frame.device.family === "coil" ? 1.1 : 0.8}
                    />
                  </>
                )}
                {frame.implants.map((implant, i) => {
                  const p = locate(n, implant.track).point;
                  const [x, y] = project(p, frame.view, plane);
                  return (
                    <g key={i} transform={`translate(${x},${y})`}>
                      <ellipse
                        rx={5 * frame.view.zoom}
                        ry={
                          (implant.family === "coil" ? 5 : 11) * frame.view.zoom
                        }
                        fill="none"
                        stroke="#111"
                        strokeWidth="2"
                      />
                      <path
                        d={`M${-4 * frame.view.zoom},0h${8 * frame.view.zoom}`}
                        stroke="#111"
                      />
                    </g>
                  );
                })}
                {(["wire", "catheter", "micro"] as const).map((tool) => {
                  const [x, y] = project(
                    locate(n, frame.tools[tool]).point,
                    frame.view,
                    plane,
                  );
                  return (
                    <line
                      data-instrument={tool}
                      key={tool}
                      x1={x - 2}
                      x2={x + 2}
                      y1={y}
                      y2={y}
                      stroke="#090d10"
                      strokeWidth="2"
                    />
                  );
                })}
              </g>
              <text x="16" y="26" fontSize="12" fill="#17222a">
                QBank Neuro · {c.id.toUpperCase()} · SINTÉTICO
              </text>
              <text x="16" y="540" fontSize="10" fill="#26333c">
                {frame.fps} p/s · FOV relativo · SEM ESCALA CLÍNICA
              </text>
              <text x="440" y="540" fontSize="10" fill="#26333c">
                RX {current.exposure.toFixed(1)} s
              </text>
            </svg>
            <div className="nvs-monitorfoot">
              {frame.mode.toUpperCase()} ·{" "}
              {current.mask
                ? projectionKey(current.view) ===
                  projectionKey(current.mask.view)
                  ? "máscara alinhada"
                  : "MÁSCARA DESALINHADA"
                : "sem máscara"}{" "}
              · contraste virtual
            </div>
          </section>
        );
      })}
    </div>
  );
}
