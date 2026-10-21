import React, { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  data,
  emptyProgress,
  exportQuestions,
  findStructures,
  layerNames,
  normalize,
  parseProgress,
  Progress,
  Structure,
  visibleStructures,
} from "./model";
import "./neuro3d.css";
import { openAnatomy } from "./openAnatomy";
import { reconstructedVessels } from "./reconstructedVessels";
const SimulationLab = lazy(
  () => import("./simulation/station/ProcedureStation"),
);
const DetailedAtlas = lazy(() => import("./DetailedAtlas"));
const PatientLab = lazy(() => import("./patient/PatientLab"));
const TcdLab = lazy(() => import("./tcd/TcdLab"));
const ReferenceComparator = lazy(() => import("./comparison/ReferenceComparator"));
const Viewer = lazy(() => import("./Viewer"));
const progressKey = "qbank_neuro3d_progress_v1";
function download(name: string, value: unknown) {
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(value, null, 2)], { type: "application/json" }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function loadProgress() {
  try {
    return parseProgress(localStorage.getItem(progressKey) || "null");
  } catch {
    return emptyProgress();
  }
}
export default function Neuro3DAtlas() {
  const [atlasMode, setAtlasMode] = useState("surface");
  const [scene, setScene] = useState("arch");
  const [variant, setVariant] = useState("normal");
  const [stage, setStage] = useState(1);
  const [layers, setLayers] = useState(Object.keys(layerNames));
  const [layerOpacity, setLayerOpacity] = useState<Record<string, number>>({});
  const [selected, setSelected] = useState<string | null>(null);
  const [tab, setTab] = useState("Anatomia detalhada");
  const [detailedSelected, setDetailedSelected] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [registrySearch, setRegistrySearch] = useState("");
  const [labels, setLabels] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState<Progress>(loadProgress);
  const [notice, setNotice] = useState("");
  const [quizIndex, setQuizIndex] = useState(0);
  const [scope, setScope] = useState("all");
  const [answer, setAnswer] = useState<number | null>(null);
  const [compare, setCompare] = useState(false);
  const [compareVariant, setCompareVariant] = useState("common");
  const surfaceAtlas = tab === "Anatomia detalhada" || (tab === "Atlas" && atlasMode === "surface");
  const objects = useMemo(
    () => visibleStructures(scene, variant, stage, layers),
    [scene, variant, stage, layers],
  );
  const active = objects.find((o) => o.id === selected);
  const variants = data.variants[scene] || [];
  const meta = data.scene_meta[scene];
  const results = useMemo(() => findStructures(search), [search]);
  const questions =
    scope === "scene"
      ? data.questions.filter((q) => q.scene === scene)
      : data.questions;
  const question = questions[quizIndex % Math.max(questions.length, 1)];
  const answers = Object.values(progress.answers);
  useEffect(() => {
    try {
      localStorage.setItem(progressKey, JSON.stringify(progress));
    } catch {
      setNotice(
        "Armazenamento indisponível. Exporte seu progresso antes de sair.",
      );
    }
  }, [progress]);
  useEffect(() => {
    if (!playing || scene !== "embryo" || tab !== "Atlas") return;
    const t = setInterval(() => setStage((s) => (s + 1) % 4), 2200);
    return () => clearInterval(t);
  }, [playing, scene, tab]);
  useEffect(() => {
    if (selected && !objects.some((o) => o.id === selected)) setSelected(null);
  }, [objects, selected]);
  function openScene(id: string, target?: Structure) {
    if (!data.scenes[id]) return;
    setAtlasMode("concept");
    setScene(id);
    setVariant(target?.variants[0] || data.variants[id]?.[0]?.id || "normal");
    setStage(target?.stages[0] ?? 1);
    setLayers(Object.keys(layerNames));
    setLayerOpacity({});
    setSelected(target?.id || null);
    setPlaying(false);
    setTab("Atlas");
    setCompare(false);
    setCompareVariant(data.variants[id]?.[1]?.id || "normal");
    setSearch("");
    setAnswer(null);
    setQuizIndex(0);
    setProgress((p) => ({
      ...p,
      visited: Array.from(new Set([...p.visited, id])),
    }));
  }
  function chooseAnswer(i: number) {
    if (answer !== null || !question) return;
    setAnswer(i);
    setProgress((p) => ({
      ...p,
      answers: {
        ...p.answers,
        [question.id]: {
          answer: i,
          correct: i === question.correct,
          at: new Date().toISOString(),
        },
      },
    }));
  }
  async function importProgress(file: File | undefined) {
    if (!file) return;
    try {
      if (file.size > 1000000) throw Error("Arquivo muito grande.");
      setProgress(parseProgress(await file.text()));
      setNotice("Progresso importado neste navegador.");
    } catch {
      setNotice(
        "Arquivo de progresso inválido; os dados anteriores foram preservados.",
      );
    }
  }
  return (
    <main className="n3">
      <header className="n3-header">
        <div>
          <Link to="/" className="n3-back">
            ← QBank-Neuro
          </Link>
          <span className="n3-eyebrow">
            ANATOMIA · IMAGEM · SIMULAÇÃO
          </span>
          <h1>
            QBank-Neuro <em>3D</em>
          </h1>
          <p>Explore a anatomia e pratique a navegação no mesmo espaço.</p>
        </div>
        <div className="n3-metrics">
          <span>
            <b>{surfaceAtlas ? String(openAnatomy.structures.length + reconstructedVessels.length) : "12"}</b>{surfaceAtlas ? "estruturas" : "cenas"}
          </span>
          <span>
            <b>126</b>registros
          </span>
          <span>
            <b>{answers.length}/25</b>questões
          </span>
        </div>
      </header>
      <aside className="n3-warning" role="note">
        <strong>{tab === "Referências vasculares" ? "Referências derivadas de imagem · espaços independentes." : tab === "Paciente 3D" ? "Prévia derivada do exame · revisão necessária." : tab === "Anatomia detalhada" ? "Base anatômica de referência · revisão em andamento." : tab === "Simulação" ? "Simulação educacional · geometria em revisão." : tab === "Atlas" && atlasMode === "surface" ? "Base anatômica de referência · revisão em andamento." : "Geometria esquemática · não homologada."}</strong> Uso
        educacional. {tab === "Paciente 3D" ? "Coordenadas físicas preservadas; segmentação e medidas ainda precisam de revisão. Sem recomendação automática de dispositivo ou técnica." : "Sem escala clínica, planejamento de pacientes ou simulação hemodinâmica validada."}
      </aside>
      <div className="n3-topbar">
        <nav aria-label="Seções do atlas">
          {[
            "Anatomia detalhada",
            "Atlas",
            "Referências vasculares",
            "Simulação",
            "Paciente 3D",
            "Doppler transcraniano",
            "Módulos",
            "Questões",
            "Matriz",
            "Progresso",
          ].map((t) => (
            <button key={t} aria-pressed={tab === t} onClick={() => setTab(t)}>
              {t}
            </button>
          ))}
        </nav>
        {tab === "Atlas" && atlasMode === "concept" && <div className="n3-search">
          <label htmlFor="n3-search">Busca livre em todas as cenas</label>
          <input
            id="n3-search"
            placeholder="Vaso, segmento ou conceito…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <div className="n3-results">
              {results.length ? (
                results.map((o) => (
                  <button key={o.id} onClick={() => openScene(o.scene, o)}>
                    {o.name}
                    <small>{data.scene_meta[o.scene].name}</small>
                  </button>
                ))
              ) : (
                <p>Nenhuma estrutura encontrada.</p>
              )}
            </div>
          )}
        </div>}
      </div>
      {notice && (
        <p role="status" className="n3-notice">
          {notice}
          <button onClick={() => setNotice("")} aria-label="Fechar aviso">
            ×
          </button>
        </p>
      )}
      {tab === "Anatomia detalhada" && (
        <Suspense fallback={<p role="status">Carregando atlas de superfícies…</p>}><DetailedAtlas selected={detailedSelected} onSelect={setDetailedSelected} /></Suspense>
      )}
      {tab === "Atlas" && <nav className="nda-mode" aria-label="Conteúdo do atlas">
        <button aria-pressed={atlasMode === "surface"} onClick={() => setAtlasMode("surface")}>Atlas de superfícies e angiografia</button>
        <button aria-pressed={atlasMode === "concept"} onClick={() => setAtlasMode("concept")}>Embriologia e variantes conceituais</button>
      </nav>}
      {tab === "Atlas" && atlasMode === "surface" && <Suspense fallback={<p role="status">Carregando superfícies anatômicas…</p>}><DetailedAtlas selected={detailedSelected} onSelect={setDetailedSelected} /></Suspense>}
      {tab === "Atlas" && atlasMode === "concept" && (
        <div className="n3-workspace">
          <aside className="n3-scenes">
            <h2>Explorar anatomia</h2>
            {Object.entries(data.scene_meta).map(([id, m]) => (
              <button
                key={id}
                onClick={() => openScene(id)}
                aria-pressed={scene === id}
              >
                <small>{m.group}</small>
                {m.name}
                <span>{data.scenes[id].length} estruturas</span>
              </button>
            ))}
          </aside>
          <section className="n3-main">
            <div className="n3-sceneheading">
              <small>{meta.group}</small>
              <h2>{meta.name}</h2>
              <p>{meta.summary}</p>
            </div>
            {variants.length > 0 && (
              <div className="n3-variants" aria-label="Variantes">
                {variants.map((v) => (
                  <button
                    key={v.id}
                    aria-pressed={variant === v.id}
                    onClick={() => {
                      setVariant(v.id);
                      setSelected(null);
                    }}
                  >
                    {v.name}
                  </button>
                ))}
                <p>{variants.find((v) => v.id === variant)?.description}</p>
                <label>
                  <input
                    type="checkbox"
                    checked={compare}
                    onChange={(e) => setCompare(e.target.checked)}
                  />{" "}
                  Comparar configurações
                </label>
                {compare && (
                  <label>
                    Segunda configuração{" "}
                    <select
                      aria-label="Segunda configuração"
                      value={compareVariant}
                      onChange={(e) => setCompareVariant(e.target.value)}
                    >
                      {variants.map((v) => (
                        <option value={v.id} key={v.id}>
                          {v.name}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
              </div>
            )}
            {scene === "embryo" && (
              <section className="n3-timeline">
                <div>
                  <strong>{data.stages[stage].title}</strong>
                  <span>Estágio {stage + 1}/4 · sem idade fixa</span>
                </div>
                <p>{data.stages[stage].description}</p>
                <input
                  aria-label="Estágio embrionário"
                  type="range"
                  min="0"
                  max="3"
                  value={stage}
                  onChange={(e) => setStage(Number(e.target.value))}
                />
                <button
                  aria-pressed={playing}
                  onClick={() => setPlaying((v) => !v)}
                >
                  {playing ? "Pausar" : "Animar estágios"}
                </button>
                <p>
                  Sequência discreta ilustrativa; não representa cronologia
                  exata nem morfogênese contínua validada. Lasjaunias:
                  segmentação embriológica independente de Bouthillier.
                </p>
              </section>
            )}
            <div className={compare ? "n3-viewpair" : "n3-viewsolo"}>
              <Suspense
                fallback={<p role="status">Carregando visualizador…</p>}
              >
                <Viewer
                  scene={scene}
                  variant={variant}
                  stage={stage}
                  objects={objects}
                  selected={selected}
                  onSelect={setSelected}
                  labels={labels}
                  layerOpacity={layerOpacity}
                />
                {compare && (
                  <Viewer
                    scene={scene}
                    variant={compareVariant}
                    stage={stage}
                    objects={visibleStructures(
                      scene,
                      compareVariant,
                      stage,
                      layers,
                    )}
                    selected={null}
                    onSelect={(id) => {
                      const o = data.scenes[scene].find((x) => x.id === id);
                      if (o) {
                        setVariant(compareVariant);
                        setCompareVariant(variant);
                        setSelected(id);
                      }
                    }}
                    labels={false}
                    layerOpacity={layerOpacity}
                  />
                )}
              </Suspense>
            </div>
            <fieldset className="n3-layers">
              <legend>Camadas e etiquetas</legend>
              {Object.keys(layerNames)
                .filter((l) => data.scenes[scene].some((o) => o.layer === l))
                .map((l) => (
                  <label key={l}>
                    <input
                      type="checkbox"
                      checked={layers.includes(l)}
                      onChange={(e) =>
                        setLayers((p) =>
                          e.target.checked
                            ? [...p, l]
                            : p.filter((x) => x !== l),
                        )
                      }
                    />
                    {layerNames[l]}
                  </label>
                ))}
              {["bone", "dura", "tissue"].filter((layer) =>
                layers.includes(layer) && data.scenes[scene].some((o) => o.layer === layer),
              ).map((layer) => (
                <label key={`opacity-${layer}`}>
                  Opacidade · {layerNames[layer]}
                  <input type="range" min="0" max="100" step="5"
                    aria-label={`Opacidade · ${layerNames[layer]}`}
                    value={Math.round((layerOpacity[layer] ?? 1) * 100)}
                    onChange={(event) => setLayerOpacity((previous) => ({
                      ...previous, [layer]: Number(event.target.value) / 100,
                    }))}
                  />
                  <output>{Math.round((layerOpacity[layer] ?? 1) * 100)}%</output>
                </label>
              ))}
              <label>
                <input
                  type="checkbox"
                  checked={labels}
                  onChange={(e) => setLabels(e.target.checked)}
                />
                Etiqueta selecionada
              </label>
            </fieldset>
            <div className="n3-details">
              <section>
                <h3>Estruturas visíveis ({objects.length})</h3>
                <div className="n3-objectlist">
                  {objects.map((o) => (
                    <button
                      key={o.id}
                      aria-pressed={selected === o.id}
                      onClick={() => setSelected(o.id)}
                    >
                      <i style={{ background: o.color }} />
                      {o.name}
                    </button>
                  ))}
                  {!objects.length && (
                    <p>Nenhuma estrutura nas camadas selecionadas.</p>
                  )}
                </div>
              </section>
              <section aria-live="polite" className="n3-dossier">
                {active ? (
                  <>
                    <small>
                      {active.id} · {layerNames[active.layer]}
                    </small>
                    <h3>{active.name}</h3>
                    <p>{active.description}</p>
                    <h4>Por que importa</h4>
                    <p>{active.importance}</p>
                    {active.uncertainty && (
                      <p className="n3-warning">{active.uncertainty}</p>
                    )}
                    <h4>Fontes</h4>
                    <ul>
                      {active.references.map((r) => (
                        <li key={r}>{data.sources[r]}</li>
                      ))}
                    </ul>
                    <p className="n3-muted">
                      Revisão documental herdada do protótipo; geometria não
                      homologada por especialista independente.
                    </p>
                  </>
                ) : (
                  <p>
                    Selecione uma estrutura no modelo ou na lista para consultar
                    descrição e fontes.
                  </p>
                )}
              </section>
            </div>
          </section>
        </div>
      )}
      {tab === "Módulos" && (
        <section className="n3-panel">
          <h2>Percurso de estudo</h2>
          <p>
            16 módulos catalogados, 84 tópicos previstos. As cenas disponíveis
            são exercícios conceituais; a indicação de um cenário não significa
            que todas as aulas daquele módulo estejam implementadas.
          </p>
          <div className="n3-modules">
            {data.curriculum.map((m, i) => (
              <article key={m.id}>
                <span className="n3-eyebrow">{m.id} · conteúdo parcial</span>
                <h3>{m.title}</h3>
                <details>
                  <summary>{m.topics.length} tópicos previstos</summary>
                  <ul>
                    {m.topics.map((t) => (
                      <li key={t.id}>
                        {t.title} <small>— previsto</small>
                      </li>
                    ))}
                  </ul>
                </details>
                <p>
                  Exploração disponível:{" "}
                  {data.scene_meta[m.scene]?.name || "Sem cena dedicada"}
                </p>
                {data.scenes[m.scene] && (
                  <button onClick={() => openScene(m.scene)}>
                    Explorar cena vinculada →
                  </button>
                )}
                <small>
                  Etapa {i + 1} do percurso; acesso livre para revisão.
                </small>
              </article>
            ))}
          </div>
        </section>
      )}
      {tab === "Questões" && (
        <section className="n3-panel n3-quiz">
          <h2>Revisão ativa</h2>
          <label>
            Conjunto{" "}
            <select
              value={scope}
              onChange={(e) => {
                setScope(e.target.value);
                setQuizIndex(0);
                setAnswer(null);
              }}
            >
              <option value="all">Todas as 25 questões</option>
              <option value="scene">Cena atual: {meta.name}</option>
            </select>
          </label>
          {question ? (
            <article key={question.id}>
              <small>
                {question.id} · {(quizIndex % questions.length) + 1}/
                {questions.length}
              </small>
              <h3>{question.front}</h3>
              <div className="n3-choices">
                {question.alternatives.map((a, i) => (
                  <button
                    key={i}
                    disabled={answer !== null}
                    className={
                      answer !== null
                        ? i === question.correct
                          ? "correct"
                          : i === answer
                            ? "incorrect"
                            : ""
                        : ""
                    }
                    onClick={() => chooseAnswer(i)}
                  >
                    {String.fromCharCode(65 + i)}. {a}
                  </button>
                ))}
              </div>
              {answer !== null && (
                <div role="status" className="n3-explanation">
                  <strong>
                    {answer === question.correct
                      ? "Correto."
                      : "Vamos revisar."}
                  </strong>
                  <p>{question.explanation}</p>
                  <ul>
                    {question.references.map((r) => (
                      <li key={r}>Fonte: {data.sources[r]}</li>
                    ))}
                  </ul>
                  <button onClick={() => openScene(question.scene)}>
                    Ver anatomia relacionada
                  </button>
                </div>
              )}
              <button
                onClick={() => {
                  setQuizIndex((i) => (i + 1) % questions.length);
                  setAnswer(null);
                }}
              >
                Próxima questão →
              </button>
            </article>
          ) : (
            <p>Esta cena ainda não tem questões específicas.</p>
          )}
          <button
            onClick={() =>
              download("neuro3d_questoes_qbank.json", exportQuestions())
            }
          >
            Exportar questões para importar no QBank
          </button>
          <p>
            Questões originais do protótipo. Progresso salvo apenas neste
            navegador.
          </p>
        </section>
      )}
      {tab === "Matriz" && (
        <section className="n3-panel">
          <h2>Rastreabilidade científica</h2>
          <p>
            126 entradas preservadas. A revisão V2 foi dirigida a 21 afirmações;
            o estado documental de uma entrada não certifica sua geometria.
          </p>
          <label>
            Filtrar matriz{" "}
            <input
              value={registrySearch}
              onChange={(e) => setRegistrySearch(e.target.value)}
              placeholder="Conceito, eixo ou código"
            />
          </label>
          <div className="n3-registry">
            {data.index
              .filter((i) =>
                normalize(`${i.id} ${i.topic} ${i.axis}`).includes(
                  normalize(registrySearch),
                ),
              )
              .map((i) => (
                <article key={i.id}>
                  <small>
                    {i.id} · {i.axis}
                  </small>
                  <h3>{i.topic}</h3>
                  <p>{i.alert}</p>
                  <p>
                    <b>Fonte:</b> {i.sources}
                  </p>
                  <p>{i.status}</p>
                  <span>Homologação humana pendente</span>
                </article>
              ))}
          </div>
        </section>
      )}
      {tab === "Progresso" && (
        <section className="n3-panel">
          <h2>Seu estudo neste navegador</h2>
          <p>
            {progress.visited.length}/12 cenas visitadas · {answers.length}/25
            questões respondidas · {answers.filter((a) => a.correct).length}{" "}
            acertos na última tentativa.
          </p>
          <p>
            Sem sincronização Supabase nesta versão. Exporte os dados para
            levá-los a outro dispositivo.
          </p>
          <button onClick={() => download("neuro3d_progresso.json", progress)}>
            Exportar progresso
          </button>
          <label className="n3-import">
            Importar progresso{" "}
            <input
              aria-label="Importar progresso"
              type="file"
              accept="application/json,.json"
              onChange={(e) => {
                void importProgress(e.target.files?.[0]);
                e.target.value = "";
              }}
            />
          </label>
        </section>
      )}
      {tab === "Paciente 3D" && <Suspense fallback={<p role="status">Carregando importação DICOM…</p>}><PatientLab /></Suspense>}
      {tab === "Referências vasculares" && <Suspense fallback={<p role="status">Carregando referências independentes…</p>}><ReferenceComparator /></Suspense>}
      {tab === "Doppler transcraniano" && <Suspense fallback={<p role="status">Carregando Doppler…</p>}><TcdLab /></Suspense>}
      {tab === "Simulação" && (
        <Suspense fallback={<p role="status">Carregando laboratório…</p>}>
          <SimulationLab
            onOpenAnatomy={(s, v) => {
              openScene(s);
              setVariant(v);
            }}
          />
        </Suspense>
      )}
      <footer className="n3-footer">
        Bouthillier C1–C7 · embriologia de Lasjaunias em eixo independente ·
        fontes por estrutura · nenhuma malha homologada.
      </footer>
    </main>
  );
}
