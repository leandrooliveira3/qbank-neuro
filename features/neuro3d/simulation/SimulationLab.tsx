import React, { lazy, Suspense, useEffect, useState } from "react";
import { data } from "../model";
import { trainingCases, TrainingCase } from "./cases";
import {
  deviceNames,
  Device,
  initialSession,
  isReport,
  Report,
  requiredChecks,
  transition,
} from "./engine";
import { pointOnRoute, projected, route } from "./geometry";
import VideoLibrary from "./VideoLibrary";
const DeviceScene = lazy(() => import("./DeviceScene"));
const historyKey = "qbank_neuro3d_simulation_v1";
const phaseNames = {
  briefing: "Briefing",
  selection: "Dispositivo",
  navigation: "Navegação",
  deployment: "Demonstração",
  debrief: "Revisão",
};
const checkNames: Record<string, string> = {
  anatomy: "Examinei o alvo e a anatomia vinculada",
  projection: "Comparei duas projeções esquemáticas",
  device: "Reconheci a função e os limites da família de dispositivo",
};
function loadReports(): Report[] {
  try {
    const x = JSON.parse(localStorage.getItem(historyKey) || "[]");
    return Array.isArray(x)
      ? x
          .filter(isReport)
          .filter((r) => trainingCases.some((c) => c.id === r.caseId))
          .slice(0, 40)
      : [];
  } catch {
    return [];
  }
}
function Biplane({
  position,
  deployment,
  angle,
  anatomy,
  visible,
  device,
}: {
  position: number;
  deployment: number;
  angle: number;
  anatomy: TrainingCase["anatomy"];
  visible: boolean;
  device: Device | null;
}) {
  const tip = pointOnRoute(position),
    target = pointOnRoute(80);
  return (
    <div className="n3-biplane">
      {[angle, angle + 90].map((a, index) => {
        const p = projected(tip, a),
          t = projected(target, a);
        return (
          <figure key={index}>
            <figcaption>
              Plano {index ? "B" : "A"} · {a}° · projeção esquemática
            </figcaption>
            <svg
              viewBox="0 0 320 300"
              role="img"
              aria-label={`Projeção ${index ? "B" : "A"} do dispositivo`}
            >
              <defs>
                <pattern
                  id={`grid-${index}`}
                  width="20"
                  height="20"
                  patternUnits="userSpaceOnUse"
                >
                  <path
                    d="M20 0H0V20"
                    fill="none"
                    stroke="#20303d"
                    strokeWidth=".5"
                  />
                </pattern>
              </defs>
              <rect width="320" height="300" fill={`url(#grid-${index})`} />
              {visible && (
                <>
                  <polyline
                    points={route
                      .map((p) => projected(p, a).join(","))
                      .join(" ")}
                    fill="none"
                    stroke="#96a4b1"
                    strokeWidth="12"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <circle
                    cx={t[0]}
                    cy={t[1]}
                    r={anatomy === "aneurysm" ? 22 : 11}
                    fill="none"
                    stroke="#d7959d"
                    strokeWidth="2"
                  />
                </>
              )}
              <polyline
                points={Array.from(
                  { length: Math.max(2, Math.ceil(position)) },
                  (_, i) =>
                    projected(
                      pointOnRoute(
                        (position * i) / Math.max(1, Math.ceil(position) - 1),
                      ),
                      a,
                    ).join(","),
                ).join(" ")}
                fill="none"
                stroke="#eed786"
                strokeWidth="2.5"
              />
              <circle cx={p[0]} cy={p[1]} r="5" fill="#ffe9a2" />
              {deployment > 0 && (
                <g transform={`translate(${p[0]},${p[1]})`}>
                  <rect
                    x={-deployment * 0.12}
                    y="-18"
                    width={deployment * 0.24}
                    height="36"
                    rx={device === "balloon" ? 10 : 2}
                    fill="none"
                    stroke="#68e6d1"
                    strokeWidth="2"
                  />
                  <line x1="-10" x2="10" y1="0" y2="0" stroke="#68e6d1" />
                </g>
              )}
              <text x="12" y="285" fill="#a9becb" fontSize="10">
                SEM ESCALA · SEM DOSE OU FLUXO CALCULADO
              </text>
            </svg>
          </figure>
        );
      })}
    </div>
  );
}
export default function SimulationLab({
  onOpenAnatomy,
  onOpenVideos,
}: {
  onOpenAnatomy: (scene: string, variant: string) => void;
  onOpenVideos: () => void;
}) {
  const [caseId, setCaseId] = useState(trainingCases[0].id),
    [session, setSession] = useState(initialSession),
    [reports, setReports] = useState(loadReports),
    [notice, setNotice] = useState(""),
    [angle, setAngle] = useState(0),
    [roadmap, setRoadmap] = useState(true),
    [show3D, setShow3D] = useState(true),
    [showVideos, setShowVideos] = useState(false);
  const current = trainingCases.find((c) => c.id === caseId)!;
  const send = (action: Parameters<typeof transition>[1]) =>
    setSession((s) => transition(s, action, current.device));
  useEffect(() => {
    try {
      localStorage.setItem(historyKey, JSON.stringify(reports));
    } catch {
      setNotice(
        "Armazenamento indisponível. Exporte o relatório para guardá-lo.",
      );
    }
  }, [reports]);
  const answered = session.answers[current.question.id];
  const saved = reports.some(
    (r) => r.caseId === caseId && r.session.startedAt === session.startedAt,
  );
  const readiness =
    session.phase === "selection"
      ? session.device === current.device
      : session.phase === "navigation"
        ? session.position >= 72 &&
          session.position <= 88 &&
          requiredChecks.every((c) => session.checks.includes(c))
        : session.phase === "deployment"
          ? session.deployment === 100
          : false;
  function chooseCase(id: string) {
    setCaseId(id);
    setSession(initialSession());
    setAngle(0);
    setRoadmap(true);
    setShowVideos(false);
    setNotice("");
  }
  function saveReport() {
    const report: Report = {
      version: 1,
      caseId,
      session,
      completedAt: new Date().toISOString(),
    };
    setReports((r) => [report, ...r].slice(0, 40));
    setNotice(
      "Revisão salva neste navegador. As métricas descrevem interação com a interface, sem certificação de competência.",
    );
  }
  function exportReport() {
    const blob = new Blob([JSON.stringify({ version: 1, reports }, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob),
      a = document.createElement("a");
    a.href = url;
    a.download = "neuro3d_simulacoes.json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return (
    <section className="n3-simulation">
      <div className="n3-simintro">
        <span className="n3-eyebrow">LABORATÓRIO DE CASOS E DISPOSITIVOS</span>
        <h2>Entender. Manipular. Revisar.</h2>
        <p>
          Oito exercícios fictícios com dispositivos genéricos e vídeos públicos
          da Mentice. Geometrias originais do QBank, sem conexão com o software
          Mentice, háptica ou física validada.
        </p>
        <button onClick={onOpenVideos}>Biblioteca completa de vídeos</button>
        <button onClick={exportReport}>
          Exportar revisões ({reports.length})
        </button>
      </div>
      <div className="n3-simlayout">
        <nav className="n3-cases" aria-label="Casos de simulação">
          {trainingCases.map((c, i) => (
            <button
              key={c.id}
              aria-pressed={caseId === c.id}
              onClick={() => chooseCase(c.id)}
            >
              <small>
                EXERCÍCIO {String(i + 1).padStart(2, "0")} · {c.topic}
              </small>
              {c.title}
              <span>
                {reports.some((r) => r.caseId === c.id)
                  ? "Revisão registrada"
                  : "Disponível"}
              </span>
            </button>
          ))}
        </nav>
        <div className="n3-simwork">
          <div className="n3-simbrief">
            <h3>{current.title}</h3>
            <p>{current.brief}</p>
            <p>
              <strong>Tarefa:</strong> {current.objective}
            </p>
            <p>{current.focus}</p>
            <button
              onClick={() => onOpenAnatomy(current.scene, current.variant)}
            >
              Explorar anatomia vinculada
            </button>
            <button onClick={() => setShowVideos((v) => !v)}>
              {showVideos ? "Ocultar vídeos" : "Vídeos deste exercício"}
            </button>
            <button onClick={() => chooseCase(caseId)}>
              Reiniciar exercício
            </button>
          </div>
          <ol className="n3-phases" aria-label="Etapas do exercício">
            {Object.entries(phaseNames).map(([id, title]) => (
              <li
                key={id}
                aria-current={session.phase === id ? "step" : undefined}
              >
                {title}
              </li>
            ))}
          </ol>
          {notice && (
            <p className="n3-notice" role="status">
              {notice}
            </p>
          )}
          {session.phase === "briefing" ? (
            <div className="n3-simstep">
              <h3>Antes de começar</h3>
              <p>
                Observe a demonstração e compare a família de dispositivos
                solicitada. Este exercício avalia reconhecimento e manipulação
                da interface; não indica uma estratégia para pacientes.
              </p>
              <p>
                As posições e percentuais são unidades da tarefa. A zona-alvo
                foi definida pelo autor para testar a interação e não representa
                um ponto de segurança anatômica.
              </p>
              <button onClick={() => send({ type: "start" })}>
                Iniciar exercício
              </button>
            </div>
          ) : (
            <>
              <div className="n3-simcontrols">
                <label>
                  Família solicitada:{" "}
                  <strong>{deviceNames[current.device]}</strong>
                  <select
                    aria-label="Família de dispositivo"
                    disabled={session.phase !== "selection"}
                    value={session.device || ""}
                    onChange={(e) =>
                      send({ type: "device", device: e.target.value as Device })
                    }
                  >
                    <option value="" disabled>
                      Selecione uma família
                    </option>
                    {Object.entries(deviceNames).map(([id, name]) => (
                      <option key={id} value={id}>
                        {name}
                      </option>
                    ))}
                  </select>
                </label>
                {session.phase === "selection" &&
                  session.device &&
                  session.device !== current.device && (
                    <p role="status">
                      A tarefa pede {deviceNames[current.device]}. A seleção
                      aqui compara funções; não classifica a indicação clínica
                      de outras famílias.
                    </p>
                  )}
                <label>
                  <input
                    type="checkbox"
                    checked={show3D}
                    onChange={(e) => setShow3D(e.target.checked)}
                  />
                  Modelo 3D
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={roadmap}
                    onChange={(e) => setRoadmap(e.target.checked)}
                  />
                  Realce vascular esquemático
                </label>
              </div>
              {show3D && (
                <Suspense fallback={<p>Carregando modelo original…</p>}>
                  <DeviceScene
                    position={session.position}
                    deployment={session.deployment}
                    device={session.device}
                    anatomy={current.anatomy}
                  />
                </Suspense>
              )}
              <Biplane
                position={session.position}
                deployment={session.deployment}
                angle={angle}
                anatomy={current.anatomy}
                visible={roadmap}
                device={session.device}
              />
              <label className="n3-carm">
                Ângulo do plano A: {angle}°{" "}
                <input
                  aria-label="Ângulo da projeção"
                  type="range"
                  min="-90"
                  max="90"
                  value={angle}
                  onChange={(e) => setAngle(Number(e.target.value))}
                />
              </label>
              <div className="n3-simstep" data-testid="simulation-step">
                <h3>{phaseNames[session.phase]}</h3>
                {session.phase === "navigation" && (
                  <>
                    <label>
                      Posição na trajetória: {session.position}%{" "}
                      <input
                        aria-label="Posição na trajetória"
                        type="range"
                        min="0"
                        max="100"
                        value={session.position}
                        onChange={(e) =>
                          send({
                            type: "navigate",
                            position: Number(e.target.value),
                          })
                        }
                      />
                    </label>
                    <div>
                      <button
                        onClick={() =>
                          send({
                            type: "navigate",
                            position: session.position - 5,
                          })
                        }
                      >
                        Recuar cursor
                      </button>
                      <button
                        onClick={() =>
                          send({
                            type: "navigate",
                            position: session.position + 5,
                          })
                        }
                      >
                        Avançar cursor
                      </button>
                    </div>
                    <p>
                      Zona da tarefa: 72–88%. Trajetória pré-definida; não há
                      navegação livre ou força de contato simulada.
                    </p>
                    <fieldset>
                      <legend>Verificações para continuar</legend>
                      {requiredChecks.map((id) => (
                        <label key={id}>
                          <input
                            type="checkbox"
                            checked={session.checks.includes(id)}
                            onChange={() => send({ type: "check", id })}
                            disabled={session.checks.includes(id)}
                          />
                          {checkNames[id]}
                        </label>
                      ))}
                    </fieldset>
                  </>
                )}
                {session.phase === "deployment" && (
                  <>
                    <label>
                      Progresso da demonstração: {session.deployment}%{" "}
                      <input
                        aria-label="Progresso do dispositivo"
                        type="range"
                        min="0"
                        max="100"
                        value={session.deployment}
                        onChange={(e) =>
                          send({
                            type: "deploy",
                            amount: Number(e.target.value),
                          })
                        }
                      />
                    </label>
                    <p>
                      Percentual gráfico de abertura/expansão. Não corresponde a
                      pressão, volume, distância, grau de oclusão ou implantação
                      real.
                    </p>
                  </>
                )}
                {["navigation", "deployment"].includes(session.phase) && (
                  <button
                    onClick={() =>
                      send({ type: "event", id: "projection-overlap" })
                    }
                  >
                    Treinar intercorrência: projeção ambígua
                  </button>
                )}
                {session.events.length > 0 && (
                  <p role="status">
                    Intercorrências acionadas: {session.events.length}. Compare
                    novamente as projeções e refaça a verificação do plano antes
                    de continuar.
                  </p>
                )}
                {session.phase !== "debrief" && (
                  <button
                    disabled={!readiness}
                    onClick={() => send({ type: "next" })}
                  >
                    Continuar etapa
                  </button>
                )}
                {session.phase === "debrief" && (
                  <>
                    <p>
                      {session.actions} ações na interface ·{" "}
                      {session.checks.length}/3 verificações ·{" "}
                      {session.events.length} intercorrências acionadas. Esses
                      números não medem segurança clínica, dose ou proficiência
                      técnica.
                    </p>
                    <h4>{current.question.prompt}</h4>
                    <div className="n3-choices">
                      {current.question.options.map((o, i) => (
                        <button
                          key={o}
                          disabled={answered !== undefined}
                          onClick={() =>
                            send({
                              type: "answer",
                              id: current.question.id,
                              answer: i,
                            })
                          }
                        >
                          {String.fromCharCode(65 + i)}. {o}
                        </button>
                      ))}
                    </div>
                    {answered !== undefined && (
                      <div className="n3-explanation" role="status">
                        <strong>
                          {answered === current.question.correct
                            ? "Conceito reconhecido."
                            : "Revise este conceito."}
                        </strong>
                        <p>{current.question.explanation}</p>
                        <small>
                          Fonte: {data.sources[current.question.source]}
                        </small>
                      </div>
                    )}
                    <button
                      disabled={answered === undefined || saved}
                      onClick={saveReport}
                    >
                      {saved ? "Revisão salva" : "Salvar revisão"}
                    </button>
                  </>
                )}
              </div>
            </>
          )}
          {showVideos && (
            <VideoLibrary key={caseId} videoIds={current.videoIds} />
          )}
          <details className="n3-simsources">
            <summary>Fontes e limites do exercício</summary>
            <ul>
              {current.sources.map((id) => (
                <li key={id}>{data.sources[id]}</li>
              ))}
            </ul>
            <p>
              Casos e geometrias fictícios, criados para esta ferramenta. Não
              foram extraídos dos casos proprietários da Mentice. Vídeos são
              referências externas, com autoria preservada. Nenhuma
              especificação de dispositivo foi inferida sem sua IFU.
            </p>
          </details>
        </div>
      </div>
    </section>
  );
}
