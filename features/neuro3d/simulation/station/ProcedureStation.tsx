import React, {
  lazy,
  Suspense,
  useEffect,
  useReducer,
  useRef,
  useState,
} from "react";
import { data } from "../../model";
import { procedureCases } from "./cases";
import {
  caseFor,
  chosenBranch,
  createStation,
  families,
  Family,
  goalMet,
  networkFor,
  projectionKey,
  StationAction,
  StationState,
  stationReducer,
  Tool,
} from "./engine";
import { locate } from "./network";
import Fluoro from "./Fluoro";
import { contactEstimate } from "./mechanics";
import "./station.css";
const AnatomyScene = lazy(() => import("./AnatomyScene"));
const toolNames: Record<Tool, string> = {
  wire: "Guia",
  catheter: "Cateter-guia",
  micro: "Microcateter",
  device: "Dispositivo",
};
export default function ProcedureStation({
  onOpenAnatomy,
}: {
  onOpenAnatomy: (scene: string, variant: string) => void;
}) {
  const [s, dispatch] = useReducer(stationReducer, undefined, () =>
    createStation(),
  );
  const [frame, setFrame] = useState<StationState>(s);
  const [biplane, setBiplane] = useState(true),
    [anatomy, setAnatomy] = useState(true),
    [assist, setAssist] = useState(true),
    [family, setFamily] = useState<Family>("coil"),
    [notice, setNotice] = useState("");
  const [step, setStep] = useState(0.4);
  const lastPulse = useRef(0),
    shaft = useRef<{ x: number; y: number } | null>(null),
    pad = useRef<HTMLDivElement>(null);
  const c = caseFor(s),
    n = networkFor(s),
    branch = chosenBranch(s, n),
    at = locate(
      n,
      s.active === "device" && s.device
        ? s.device.track
        : s.tools[s.active === "device" ? "wire" : s.active],
    );
  useEffect(() => {
    let last = performance.now(),
      id = 0;
    const tick = (now: number) => {
      if (now - last >= 32) {
        dispatch({ type: "tick", dt: Math.min(0.1, (now - last) / 1000) });
        last = now;
      }
      id = requestAnimationFrame(tick);
    };
    id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, []);
  useEffect(() => {
    if (
      (s.pedal || s.acquiring > 0) &&
      s.clock - lastPulse.current >= 1 / s.fps - 0.002
    ) {
      setFrame(s);
      lastPulse.current = s.clock;
    }
  }, [s]);
  useEffect(() => {
    const keydown = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (
        t.matches("input,select,textarea") ||
        e.ctrlKey ||
        e.metaKey ||
        e.altKey
      )
        return;
      let action: StationAction | undefined;
      if (e.code === "Space") action = { type: "pedal", on: true };
      if (["ArrowUp", "KeyW"].includes(e.code))
        action = { type: "move", delta: step };
      if (["ArrowDown", "KeyS"].includes(e.code))
        action = { type: "move", delta: -step };
      if (["ArrowLeft", "KeyA"].includes(e.code))
        action = { type: "rotate", delta: -15 };
      if (["ArrowRight", "KeyD"].includes(e.code))
        action = { type: "rotate", delta: 15 };
      if (e.code === "KeyI") action = { type: "inject" };
      if (e.code === "KeyR") action = { type: "mask" };
      if (["Digit1", "Digit2", "Digit3", "Digit4"].includes(e.code))
        action = {
          type: "tool",
          tool: (["wire", "catheter", "micro", "device"] as Tool[])[
            Number(e.code.slice(-1)) - 1
          ],
        };
      if (action) {
        e.preventDefault();
        dispatch(action);
      }
    };
    const keyup = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        dispatch({ type: "pedal", on: false });
      }
    };
    const blur = () => dispatch({ type: "pedal", on: false });
    window.addEventListener("keydown", keydown);
    window.addEventListener("keyup", keyup);
    window.addEventListener("blur", blur);
    return () => {
      window.removeEventListener("keydown", keydown);
      window.removeEventListener("keyup", keyup);
      window.removeEventListener("blur", blur);
      dispatch({ type: "pedal", on: false });
    };
  }, [step]);
  useEffect(() => {
    const el = pad.current;
    if (!el) return;
    const wheel = (e: WheelEvent) => {
      e.preventDefault();
      dispatch(
        e.shiftKey
          ? { type: "rotate", delta: Math.sign(e.deltaY) * 10 }
          : { type: "move", delta: -Math.sign(e.deltaY) * step },
      );
    };
    el.addEventListener("wheel", wheel, { passive: false });
    return () => el.removeEventListener("wheel", wheel);
  }, [step]);
  function newCase(id: string) {
    const next = createStation(id);
    dispatch({ type: "new", caseId: id });
    setFrame(next);
    lastPulse.current = 0;
    setNotice("");
    setFamily(id === "m1" ? "retriever" : id === "cas" ? "stent" : "coil");
  }
  function saveSession() {
    dispatch({ type: "finish" });
    const report = {
      version: 2,
      caseId: s.caseId,
      at: new Date().toISOString(),
      objectiveGraphical: goalMet(s),
      exposureSimulatedSeconds: s.exposure,
      injections: s.injections,
      actions: s.attempts,
      events: s.log,
      implants: s.implants,
      model: "schematic-unvalidated",
    };
    try {
      const old = JSON.parse(
        localStorage.getItem("neuro3d_station_reports_v2") || "[]",
      );
      localStorage.setItem(
        "neuro3d_station_reports_v2",
        JSON.stringify(
          [report, ...(Array.isArray(old) ? old : [])].slice(0, 50),
        ),
      );
      setNotice("Sessão registrada neste navegador.");
    } catch {
      setNotice("Armazenamento indisponível; exporte a sessão.");
    }
  }
  function download() {
    const blob = new Blob(
        [
          JSON.stringify(
            { case: c, state: s, validation: "not-clinically-validated" },
            null,
            2,
          ),
        ],
        { type: "application/json" },
      ),
      url = URL.createObjectURL(blob),
      a = document.createElement("a");
    a.href = url;
    a.download = `neuro3d_sessao_${c.id}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  const control = (
    label: string,
    key: keyof StationState["view"],
    min: number,
    max: number,
    increment = 1,
  ) => (
    <label className="nvs-range" key={key}>
      {label}
      <b>
        {s.view[key].toFixed(increment < 1 ? 1 : 0)}
        {["yaw", "pitch", "yawB", "pitchB"].includes(key) ? "°" : ""}
      </b>
      <input
        aria-label={label}
        type="range"
        min={min}
        max={max}
        step={increment}
        value={s.view[key]}
        onChange={(e) =>
          dispatch({ type: "view", patch: { [key]: Number(e.target.value) } })
        }
      />
    </label>
  );
  return (
    <section className="nvs" aria-label="Estação virtual de neurointervenção">
      <header className="nvs-heading">
        <div>
          <span className="n3-eyebrow">
            ESTAÇÃO VIRTUAL · CONTROLE POR MOUSE E TECLADO
          </span>
          <h2>Neurointervenção</h2>
          <p>
            Rede vascular do atlas · manipulação coaxial · fluoroscopia ·
            roadmap
          </p>
        </div>
        <label>
          Caso clínico
          <select
            aria-label="Caso clínico"
            value={s.caseId}
            onChange={(e) => newCase(e.target.value)}
          >
            {procedureCases.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
        </label>
      </header>
      <div className="nvs-case">
        <div>
          <strong>{c.patient}</strong>
          <p>{c.brief}</p>
          <small>Objetivo: {c.goal}</small>
        </div>
        <div>
          <button onClick={() => newCase(s.caseId)}>Reiniciar caso</button>
          <button
            onClick={() =>
              onOpenAnatomy(
                c.kind === "carotid"
                  ? "aci"
                  : c.kind === "aneurysm"
                    ? "paraclinoid"
                    : "circle",
                "normal",
              )
            }
          >
            Consultar atlas
          </button>
        </div>
      </div>
      <div className="nvs-layout">
        <section className="nvs-main">
          <div className="nvs-imagingbar">
            <div className="nvs-mode">
              {(["fluoro", "dsa", "roadmap"] as const).map((mode) => (
                <button
                  key={mode}
                  aria-pressed={s.mode === mode}
                  onClick={() => dispatch({ type: "mode", mode })}
                >
                  {mode === "fluoro"
                    ? "Fluoro"
                    : mode === "dsa"
                      ? "DSA"
                      : "Roadmap"}
                </button>
              ))}
            </div>
            <span
              className={s.pedal || s.acquiring > 0 ? "nvs-rx on" : "nvs-rx"}
            >
              {s.pedal || s.acquiring > 0 ? "● RX ATIVO" : "○ RX PAUSADO"} ·{" "}
              {s.exposure.toFixed(1)} s simulados
            </span>
            <label>
              <input
                type="checkbox"
                checked={biplane}
                onChange={(e) => setBiplane(e.target.checked)}
              />
              Biplano
            </label>
          </div>
          <Fluoro frame={frame} current={s} biplane={biplane} />
          {s.mask && projectionKey(s.mask.view) !== projectionKey(s.view) && (
            <p className="nvs-alert" role="status">
              Geometria alterada: roadmap desalinhado. Faça nova aquisição e
              recapture a máscara.
            </p>
          )}
          <div className="nvs-acquisition">
            <button
              className={`nvs-pedal ${s.pedal ? "active" : ""}`}
              aria-label="Pedal de fluoroscopia"
              aria-pressed={s.pedal}
              onPointerDown={(e) => {
                e.currentTarget.setPointerCapture(e.pointerId);
                dispatch({ type: "pedal", on: true });
              }}
              onPointerUp={() => dispatch({ type: "pedal", on: false })}
              onPointerCancel={() => dispatch({ type: "pedal", on: false })}
              onBlur={() => dispatch({ type: "pedal", on: false })}
            >
              ◉ Manter RX <kbd>Espaço</kbd>
            </button>
            <button onClick={() => dispatch({ type: "inject" })}>
              Injetar contraste virtual <kbd>I</kbd>
            </button>
            <button onClick={() => dispatch({ type: "mask" })}>
              Capturar roadmap <kbd>R</kbd>
            </button>
            <label>
              Pulsos/s
              <select
                aria-label="Pulsos por segundo"
                value={s.fps}
                onChange={(e) =>
                  dispatch({ type: "fps", value: Number(e.target.value) })
                }
              >
                {[3, 7.5, 15, 30].map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="nvs-lower">
            <section className="nvs-manipulator">
              <h3>Manipulador virtual</h3>
              <div className="nvs-tools">
                {(Object.keys(toolNames) as Tool[]).map((t, i) => (
                  <button
                    key={t}
                    aria-pressed={s.active === t}
                    onClick={() => dispatch({ type: "tool", tool: t })}
                  >
                    {i + 1} · {toolNames[t]}
                  </button>
                ))}
              </div>
              <div
                ref={pad}
                className="nvs-shaft"
                tabIndex={0}
                aria-label="Manipulador virtual: arraste para avançar e girar"
                onPointerDown={(e) => {
                  e.currentTarget.setPointerCapture(e.pointerId);
                  shaft.current = { x: e.clientX, y: e.clientY };
                }}
                onPointerMove={(e) => {
                  if (!shaft.current) return;
                  const dy = e.clientY - shaft.current.y,
                    dx = e.clientX - shaft.current.x;
                  shaft.current = { x: e.clientX, y: e.clientY };
                  if (Math.abs(dy) > 0.5)
                    dispatch({ type: "move", delta: -dy * 0.035 });
                  if (Math.abs(dx) > 0.5)
                    dispatch({ type: "rotate", delta: dx * 1.5 });
                }}
                onPointerUp={() => {
                  shaft.current = null;
                }}
                onPointerCancel={() => {
                  shaft.current = null;
                }}
              >
                <span className="nvs-shaft-line" />
                <span
                  className="nvs-shaft-knob"
                  style={{ transform: `rotate(${s.rotation}deg)` }}
                >
                  ↻
                </span>
                <div>
                  <b>{toolNames[s.active]}</b>
                  <small>
                    Arraste ↑↓ para avançar/recuar · ←→ para girar
                    <br />
                    Roda: avanço · Shift+roda: rotação
                  </small>
                </div>
              </div>
              <div className="nvs-movement">
                <button
                  onClick={() => dispatch({ type: "move", delta: -step })}
                >
                  ↓ Recuar
                </button>
                <button
                  onClick={() => dispatch({ type: "rotate", delta: -30 })}
                >
                  ↶ Girar −30°
                </button>
                <button onClick={() => dispatch({ type: "rotate", delta: 30 })}>
                  ↷ Girar +30°
                </button>
                <button onClick={() => dispatch({ type: "move", delta: step })}>
                  ↑ Avançar
                </button>
              </div>
              <label>
                Passo de manipulação
                <select
                  aria-label="Passo de manipulação"
                  value={step}
                  onChange={(e) => setStep(Number(e.target.value))}
                >
                  <option value="0.15">Fino · 0,15 u</option>
                  <option value="0.4">Normal · 0,4 u</option>
                  <option value="1.2">Amplo · 1,2 u</option>
                </select>
              </label>
              <p className="nvs-readout">
                Contato geométrico aproximado{" "}
                {Math.round(contactEstimate(s, n) * 100)}% · Rotação{" "}
                {s.rotation.toFixed(0)}° · instrumento{" "}
                {s.active === "device"
                  ? s.device?.track.depth.toFixed(1) || "—"
                  : s.tools[s.active].depth.toFixed(1)}{" "}
                u
              </p>
              {assist && (
                <p className="nvs-hint">
                  Ponta: {n[at.edge].name}
                  {branch.branches.length > 1 ? (
                    <>
                      {" "}
                      · Bifurcação do guia:{" "}
                      {branch.branches.map((id) => n[id].name).join(" / ")}.
                      Orientação atual →{" "}
                      <strong>{n[branch.chosen!].name}</strong>
                    </>
                  ) : null}
                </p>
              )}
            </section>
            <section className="nvs-device">
              <h3>Bandeja de dispositivos</h3>
              <label>
                Guia
                <select
                  aria-label="Tipo de guia"
                  value={s.wireKind}
                  onChange={(e) =>
                    dispatch({ type: "wireKind", value: e.target.value })
                  }
                >
                  <option>Guia diagnóstico</option>
                  <option>Microguia</option>
                </select>
              </label>
              <label>
                Cateter
                <select
                  aria-label="Formato do cateter"
                  value={s.catheterShape}
                  onChange={(e) =>
                    dispatch({ type: "shape", value: e.target.value })
                  }
                >
                  <option>Multipropósito</option>
                  <option>Curva reversa tipo Simmons</option>
                  <option>Curva simples tipo JR</option>
                </select>
              </label>
              <label>
                Dispositivo terapêutico
                <select
                  aria-label="Dispositivo terapêutico"
                  value={family}
                  onChange={(e) => setFamily(e.target.value as Family)}
                >
                  {Object.entries(families).map(([id, name]) => (
                    <option key={id} value={id}>
                      {name} · genérico
                    </option>
                  ))}
                </select>
              </label>
              <button onClick={() => dispatch({ type: "load", family })}>
                Carregar dispositivo
              </button>
              {s.device && (
                <>
                  <p>
                    <b>{families[s.device.family]}</b> · abertura gráfica{" "}
                    {Math.round(s.device.open * 100)}%
                    {s.device.captured ? " · trombo engajado" : ""}
                    {s.device.detached ? " · destacado" : ""}
                  </p>
                  <div className="nvs-movement">
                    <button
                      onClick={() => dispatch({ type: "open", delta: -0.25 })}
                    >
                      Recolher / desinflar
                    </button>
                    <button
                      onClick={() => dispatch({ type: "open", delta: 0.25 })}
                    >
                      Abrir / inflar
                    </button>
                  </div>
                  <button onClick={() => dispatch({ type: "detach" })}>
                    Destacar / implantar
                  </button>
                  <button
                    aria-pressed={s.aspirating}
                    onClick={() => dispatch({ type: "aspirate" })}
                  >
                    {s.aspirating ? "Parar aspiração" : "Ativar aspiração"}
                  </button>
                </>
              )}
            </section>
          </div>
        </section>
        <aside className="nvs-console">
          <h3>Console da hemodinâmica</h3>
          <section>
            <h4>Arco C · plano A</h4>
            {control("RAO / LAO", "yaw", -110, 110)}
            {control("Caudal / cranial", "pitch", -75, 75)}
            <button
              onClick={() =>
                dispatch({ type: "view", patch: { yaw: 0, pitch: 0 } })
              }
            >
              AP
            </button>
            <button
              onClick={() =>
                dispatch({ type: "view", patch: { yaw: 90, pitch: 0 } })
              }
            >
              Lateral
            </button>
            <button
              onClick={() =>
                dispatch({ type: "view", patch: { yaw: -30, pitch: 20 } })
              }
            >
              Oblíqua
            </button>
          </section>
          {biplane && (
            <section>
              <h4>Arco C · plano B</h4>
              {control("RAO / LAO · B", "yawB", -110, 110)}
              {control("Caudal / cranial · B", "pitchB", -75, 75)}
              <button onClick={() => dispatch({ type: "view", patch: { yawB: 90, pitchB: 0 } })}>
                Lateral B
              </button>
            </section>
          )}
          <section>
            <h4>Mesa e campo</h4>
            {control("Mesa horizontal", "panX", -12, 12, 0.1)}
            {control("Mesa longitudinal", "panY", -12, 12, 0.1)}
            {control("Magnificação", "zoom", 0.5, 5, 0.1)}
            {control("Colimação", "collimation", 25, 100)}
            {control("Ganho da imagem", "gain", 0.4, 2, 0.1)}
            <button
              onClick={() => {
                const p = locate(n, s.tools.wire).point;
                dispatch({ type: "view", patch: { panX: -p[0], panY: -p[1] } });
              }}
            >
              Centralizar ponta do guia
            </button>
          </section>
          <section>
            <label>
              <input
                type="checkbox"
                checked={anatomy}
                onChange={(e) => setAnatomy(e.target.checked)}
              />
              Visão 3D auxiliar
            </label>
            <label>
              <input
                type="checkbox"
                checked={assist}
                onChange={(e) => setAssist(e.target.checked)}
              />
              Assistência de navegação
            </label>
            {anatomy && (
              <Suspense fallback={<p>Carregando anatomia…</p>}>
                <AnatomyScene s={s} />
              </Suspense>
            )}
          </section>
          <section className="nvs-outcome">
            <h4>Estado do caso · modelo gráfico</h4>
            <p>
              {c.kind === "stroke"
                ? s.clot
                  ? "Oclusão persiste"
                  : "Trombo removido"
                : c.kind === "aneurysm"
                  ? `${s.coilFill} coils no saco${s.parentCompromised ? " · comprometimento parental" : ""}`
                  : c.kind === "carotid"
                    ? `Expansão relativa ${Math.round(s.dilation * 100)}% · ${s.stented ? "stent implantado" : "sem stent"}`
                    : `${s.runs.length} aquisições seletivas`}
            </p>
            <b>
              {goalMet(s)
                ? "Objetivo gráfico atingido"
                : "Objetivo ainda incompleto"}
            </b>
            <p>
              {s.injections} injeções virtuais · {s.attempts} manobras
            </p>
            <button onClick={saveSession}>Encerrar e registrar sessão</button>
            <button onClick={download}>Exportar sessão</button>
            {notice && <p role="status">{notice}</p>}
          </section>
        </aside>
      </div>
      <section className="nvs-events" aria-live="polite">
        <h3>Eventos da sessão</h3>
        {s.log
          .slice(-6)
          .reverse()
          .map((e, i) => (
            <p key={`${e.time}-${i}`} className={e.level}>
              <time>{e.time.toFixed(1)} s</time>
              {e.message}
            </p>
          ))}
        {!s.log.length && (
          <p>
            Selecione um instrumento e comece a manipulação. Mantenha Espaço
            pressionado para visualizar o movimento.
          </p>
        )}
      </section>
      <details className="nvs-method">
        <summary>Referências, controles e limites do modelo</summary>
        <p>
          W/S ou ↑/↓: avanço/recuo; A/D ou ←/→: rotação; 1–4: instrumento;
          Espaço: fluoroscopia; I: contraste; R: captura de roadmap.
          Mouse/touch: manipulador virtual e botões. Não requer dispositivo
          externo.
        </p>
        <p>
          Rede montada a partir das curvas originais do atlas (arco, ACI
          Bouthillier C1–C7 e polígono de Willis), com transformação dos
          referenciais e conexões de montagem explicitamente sintéticas. Modelo
          de navegação por grafo, suporte coaxial e interação geométrica
          aproximada. Não há força/háptica, CFD, escala clínica ou homologação
          de proficiência. As regras de resultado e o tempo RX são simulações,
          não previsão de desfecho ou dose.
        </p>
        <ul>
          {c.references.map((r) => (
            <li key={r}>{data.sources[r]}</li>
          ))}
        </ul>
        <p>
          Referências documentais: metadados das demonstrações Mentice de
          coiling (BpPYaBwrbT8), trombectomia (SP0zbOw0fEA), carótida
          (rj6Ok5ywaD0) e habilidades de cateter (czY91bSZPXs), além da
          documentação pública do fabricante. Nesta revisão, não foi possível
          inspecionar os vídeos ou seus quadros por bloqueio de acesso do
          YouTube. A referência funcional foi a documentação oficial. Nenhum
          algoritmo, caso ou interface proprietária foi copiado.
        </p>
      </details>
    </section>
  );
}
