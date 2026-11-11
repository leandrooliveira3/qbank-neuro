import React, { useEffect, useRef, useState } from "react";
import {
  active,
  baseline,
  blockDone,
  blocks,
  csvQuestions,
  database,
  due,
  grade,
  initial,
  isoDate,
  letters,
  metrics,
  parseQuestions,
  priorities,
  seeds,
  today,
  uid,
  validate,
} from "./model";
import type { Question, Session, State } from "./model";
import "./preparation.css";
const tabs = [
  "Visão geral",
  "Curso e checkpoints",
  "Revisões",
  "Questões A–E",
  "Erros e lacunas",
  "Arquivos e histórico",
];
const date = (s: string) => s.split("-").reverse().join("/");
const pct = (a: number, b: number) =>
  b ? `${((a / b) * 100).toFixed(2).replace(".", ",")}%` : "—";
function download(name: string, blob: Blob) {
  const u = URL.createObjectURL(blob),
    a = document.createElement("a");
  a.href = u;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(u), 1000);
}
const draftSession = (): Session => ({
  id: uid(),
  kind: "lesson",
  label: "7I",
  topic: "DCI",
  date: today(),
  answers: "",
  key: "",
  validated: false,
  evidence: "",
});
export default function Preparation() {
  const [s, setS] = useState(initial),
    [ready, setReady] = useState(false),
    [saving, setSaving] = useState("Carregando…"),
    [tab, setTab] = useState(tabs[0]),
    [filter, setFilter] = useState(""),
    [notice, setNotice] = useState("");
  const [draft, setDraft] = useState<Session | null>(null),
    [keyFor, setKeyFor] = useState(""),
    [keyValue, setKeyValue] = useState("A"),
    [keySource, setKeySource] = useState(""),
    [attest, setAttest] = useState(false),
    [question, setQuestion] = useState<Question | null>(null);
  const [topic, setTopic] = useState(priorities[0]),
    [note, setNote] = useState(""),
    [d0, setD0] = useState(today()),
    [review, setReview] = useState<{ id: string; step: number } | null>(null),
    [realDate, setRealDate] = useState(today()),
    [evidence, setEvidence] = useState("");
  const [preview, setPreview] = useState<{
      file: File;
      text: string;
      questions: Question[];
    } | null>(null),
    [fileId, setFileId] = useState(""),
    [busy, setBusy] = useState(false),
    [seconds, setSeconds] = useState(3600),
    [running, setRunning] = useState(false);
  const chain = useRef(Promise.resolve());
  useEffect(() => {
    let alive = true;
    database()
      .then((v) => {
        if (alive) {
          setS(v);
          setReady(true);
          setSaving("Salvo neste navegador");
        }
      })
      .catch(() =>
        setNotice(
          "Não foi possível abrir o armazenamento; os dados anteriores foram preservados.",
        ),
      );
    return () => {
      alive = false;
    };
  }, []);
  useEffect(() => {
    if (!ready) return;
    setSaving("Salvando…");
    chain.current = chain.current
      .catch(() => {})
      .then(async () => {
        await database(s);
      });
    chain.current
      .then(() => setSaving("Salvo neste navegador"))
      .catch(() => {
        setSaving("Falha ao salvar");
        setNotice(
          "Armazenamento indisponível ou cheio. Exporte seu backup antes de sair.",
        );
      });
  }, [s, ready]);
  useEffect(() => {
    if (!running) return;
    const start = Date.now(),
      remaining = seconds,
      t = setInterval(() => {
        const left = Math.max(
          0,
          remaining - Math.floor((Date.now() - start) / 1000),
        );
        setSeconds(left);
        if (!left) setRunning(false);
      }, 500);
    return () => clearInterval(t);
  }, [running]);
  const day = today(),
    m = metrics(s),
    sessions = active(s),
    plan = s.plan[day] || [],
    cp2 = sessions.find(
      (x) => x.kind === "checkpoint" && x.label === "CP2" && x.validated,
    ),
    pending = sessions.filter((x) => !x.validated),
    attempts = s.attempts.filter((x) => x.key);
  const match = (str: string) =>
    str
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .toLowerCase()
      .includes(
        filter
          .normalize("NFD")
          .replace(/\p{Diacritic}/gu, "")
          .toLowerCase(),
      );
  const topics = Array.from(
    new Set([
      ...priorities,
      ...s.questions.map((q) => q.topic),
      ...s.gaps.map((g) => g.topic),
    ]),
  );
  const openDraft = (value: Session) => {
    setNotice("");
    setDraft(value);
  };
  const fail = (e: unknown) => setNotice((e as Error).message);
  function record() {
    if (!draft) return;
    try {
      const v = {
        ...draft,
        id: uid(),
        label: draft.label.trim().toUpperCase(),
        answers: letters(draft.answers),
        key: letters(draft.key),
      };
      validate(v, sessions);
      setS((p) => ({
        ...p,
        sessions: [...p.sessions, v],
        gaps:
          v.validated && grade(v.answers, v.key) < v.answers.length
            ? [
                ...p.gaps,
                {
                  id: uid(),
                  topic: v.topic,
                  note: `${v.label}: erros nos itens ${[...v.answers].flatMap((a, i) => (a !== v.key[i] ? [i + 1] : [])).join(", ")}. Fonte: ${v.evidence}`,
                  status: "Aberta",
                },
              ]
            : p.gaps,
      }));
      setDraft(null);
      setNotice(
        v.validated
          ? "Correção validada registrada; histórico anterior preservado."
          : "Respostas salvas aguardando correção; métricas preservadas.",
      );
    } catch (e) {
      fail(e);
    }
  }
  function answer(q: Question, a: string) {
    setS((p) => ({
      ...p,
      attempts: [
        ...p.attempts,
        {
          id: uid(),
          questionId: q.id,
          topic: q.topic,
          answer: a,
          date: day,
          key: q.key,
          evidence: q.evidence,
        },
      ],
      gaps:
        q.key && a !== q.key
          ? [
              ...p.gaps,
              {
                id: uid(),
                topic: q.topic,
                note: `Erro em ${q.id}: ${a}; gabarito ${q.key}. Fonte: ${q.evidence}`,
                status: "Aberta",
              },
            ]
          : p.gaps,
    }));
    setNotice(
      q.key
        ? `${a === q.key ? "Correta" : "Revisar"} · resposta ${a} · gabarito ${q.key}.`
        : "Resposta registrada; aguardando gabarito validado.",
    );
  }
  function validateKey() {
    if (!attest || !keySource.trim())
      return setNotice("Informe a fonte e confirme a conferência do gabarito.");
    const q = s.questions.find((x) => x.id === keyFor);
    if (!q) return;
    setS((p) => ({
      ...p,
      questions: p.questions.map((x) =>
        x.id === q.id ? { ...x, key: keyValue, evidence: keySource } : x,
      ),
      attempts: p.attempts.map((a) =>
        a.questionId === q.id && !a.key
          ? { ...a, key: keyValue, evidence: keySource }
          : a,
      ),
      gaps: [
        ...p.gaps,
        ...p.attempts
          .filter(
            (a) => a.questionId === q.id && !a.key && a.answer !== keyValue,
          )
          .map((a) => ({
            id: uid(),
            topic: q.topic,
            note: `Erro em ${q.id}: ${a.answer}; gabarito ${keyValue}. Fonte: ${keySource}`,
            status: "Aberta",
          })),
      ],
    }));
    setKeyFor("");
    setNotice(
      "Tentativas pendentes corrigidas com a fonte validada. Histórico do curso preservado.",
    );
  }
  async function importFile(file?: File) {
    if (!file) return;
    setBusy(true);
    try {
      if (file.size > 15 * 1024 * 1024)
        throw Error("Limite de 15 MB por arquivo.");
      const ext = file.name.split(".").pop()?.toLowerCase();
      let text = "";
      if (["md", "txt", "json", "csv"].includes(ext || ""))
        text = await file.text();
      else if (ext === "docx") {
        const mammoth = await import("mammoth");
        text = (
          await mammoth.extractRawText({
            arrayBuffer: await file.arrayBuffer(),
          })
        ).value;
      } else if (ext === "pdf") {
        const pdf = await import("pdfjs-dist");
        pdf.GlobalWorkerOptions.workerSrc = new URL(
          "pdfjs-dist/build/pdf.worker.min.mjs",
          import.meta.url,
        ).href;
        const doc = await pdf.getDocument({
          data: await file.arrayBuffer(),
          isEvalSupported: false,
        }).promise;
        try {
          if (doc.numPages > 200) throw Error("PDF limitado a 200 páginas.");
          for (let i = 1; i <= doc.numPages; i++) {
            const page = await doc.getPage(i),
              content = await page.getTextContent();
            text +=
              `\nPágina ${i}\n` +
              content.items.map((x: any) => x.str || "").join(" ");
          }
        } finally {
          await doc.destroy();
        }
      } else
        throw Error(
          "Use Markdown, CSV, JSON, Word .docx ou PDF. Converta .doc para .docx.",
        );
      if (text.length > 2000000)
        throw Error("Texto extraído excede 2 milhões de caracteres.");
      let questions: Question[] = [];
      if (ext === "json") {
        const d = JSON.parse(text);
        if (Array.isArray(d) || Array.isArray(d.questions))
          questions = parseQuestions(text);
      }
      if (ext === "csv" && text.split("\n")[0].includes("stem"))
        questions = csvQuestions(text);
      setPreview({ file, text, questions });
    } catch (e) {
      fail(e);
    } finally {
      setBusy(false);
    }
  }
  async function backup() {
    try {
      const { default: JSZip } = await import("jszip"),
        zip = new JSZip();
      zip.file(
        "estado.json",
        JSON.stringify(
          { ...s, files: s.files.map(({ blob, ...f }) => f) },
          null,
          2,
        ),
      );
      s.files.forEach((f, i) =>
        zip.file(`arquivos/${i}-${f.name.replace(/[^\w.-]/g, "_")}`, f.blob),
      );
      zip.file(
        "LEIA-ME.txt",
        "Backup consultável NRI 2027: registros em estado.json e arquivos originais. Sem restauração automática de métricas.",
      );
      download(
        `NRI_2027_backup_${day}.zip`,
        await zip.generateAsync({ type: "blob" }),
      );
    } catch (e) {
      fail(e);
    }
  }
  return (
    <section className="nri" aria-label="Preparação NRI 2027">
      <datalist id="nri-topics">
        {topics.map((t) => (
          <option key={t} value={t} />
        ))}
      </datalist>
      <header className="nri-hero">
        <div>
          <span className="nri-kicker">SEU PERCURSO, COM CONTINUIDADE</span>
          <h2>
            Preparação <em>NRI 2027</em>
          </h2>
          <p>
            Um passo consistente por dia. Seu curso, revisões e lacunas no mesmo
            lugar.
          </p>
          <small>Histórico preservado · 13 blocos · 120 aulas</small>
        </div>
        <div>
          <span className="nri-kicker">ROTINA DE ESTUDO</span>
          <strong>
            60 <small>min / dia</small>
          </strong>
          <button onClick={() => setRunning(!running)}>
            {running ? "Pausar sessão" : "Iniciar sessão"} ↗
          </button>
        </div>
      </header>
      <div className="nri-toolbar">
        <nav aria-label="Preparação">
          {tabs.map((t) => (
            <button key={t} aria-pressed={t === tab} onClick={() => setTab(t)}>
              {t}
            </button>
          ))}
        </nav>
        <label>
          Filtrar por tema
          <input
            placeholder="Ex.: oftálmica, DSA…"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </label>
      </div>
      <div className="nri-local">
        <span>● {saving}</span>
        <button disabled={!ready} onClick={() => void backup()}>
          ↓ Exportar backup
        </button>
      </div>
      {notice && (
        <p className="nri-notice" role="status">
          {notice}
          <button aria-label="Fechar aviso" onClick={() => setNotice("")}>
            ×
          </button>
        </p>
      )}
      {!ready ? (
        <p>Carregando registro local…</p>
      ) : (
        <>
          {tab === tabs[0] && (
            <>
              <div className="nri-stats">
                {[
                  [
                    "Aulas concluídas",
                    `${m.lessons} / 120`,
                    `${pct(m.lessons, 120)} do curso`,
                  ],
                  [
                    "Questões das aulas",
                    `${m.correct} / ${m.questions}`,
                    `${pct(m.correct, m.questions)} de acerto · histórico separado`,
                  ],
                  ["Checkpoint 1", "29 / 30", "96,67% · não somado às aulas"],
                  [
                    "Checkpoint 2",
                    cp2
                      ? `${grade(cp2.answers, cp2.key)} / ${cp2.answers.length}`
                      : "Pendente",
                    "Concluir somente com evidência",
                  ],
                ].map(([label, value, note]) => (
                  <article className="nri-card nri-metric" key={label}>
                    <span>{label}</span>
                    <strong>{value}</strong>
                    <small>{note}</small>
                  </article>
                ))}
              </div>
              <div className="nri-columns">
                <div>
                  <section className="nri-card">
                    <span className="nri-kicker">CONTINUIDADE</span>
                    <h3>Retome de onde parou</h3>
                    <p>
                      Base confirmada: 7A–7H concluídas. 7I ministrada e
                      aguardando avaliação; 7J não iniciada no mestre.
                    </p>
                    <div className="nri-callout">
                      <strong>
                        {pending.length +
                          s.attempts.filter((a) => !a.key).length}{" "}
                        registros locais aguardando correção
                      </strong>
                      <p>
                        Sem gabarito validado, as respostas permanecem fora dos
                        resultados.
                      </p>
                      <button onClick={() => setTab(tabs[1])}>
                        Consultar →
                      </button>
                    </div>
                    <div className="nri-block-mini">
                      {blocks.map((b, i) => (
                        <button
                          key={i}
                          className={
                            blockDone(s, i) === b[1]
                              ? "complete"
                              : blockDone(s, i)
                                ? "current"
                                : ""
                          }
                          title={b[0]}
                          onClick={() => {
                            setTab(tabs[1]);
                            setFilter(`Bloco ${i + 1} `);
                          }}
                        >
                          <small>B{i + 1}</small>
                          {blockDone(s, i)}/{b[1]}
                        </button>
                      ))}
                    </div>
                  </section>
                  <section className="nri-card">
                    <span className="nri-kicker">FOCO DO CICLO</span>
                    <h3>Temas prioritários</h3>
                    <div className="nri-topics">
                      {s.gaps
                        .filter(
                          (g) => g.status !== "Resolvida" && match(g.topic),
                        )
                        .slice(0, 12)
                        .map((g) => (
                          <button
                            key={g.id}
                            onClick={() => {
                              setTab(tabs[4]);
                              setFilter(g.topic);
                            }}
                          >
                            {g.topic} ↗
                          </button>
                        ))}
                    </div>
                    <p className="nri-muted">
                      Prioridade de revisão não equivale a erro demonstrado. Os
                      dois erros históricos não foram individualizados.
                    </p>
                  </section>
                </div>
                <section className="nri-card">
                  <span className="nri-kicker">
                    PLANO DE HOJE · {date(day)}
                  </span>
                  <h3>Sua hora de estudo</h3>
                  <div className="nri-clock">
                    {String(Math.floor(seconds / 60)).padStart(2, "0")}:
                    {String(seconds % 60).padStart(2, "0")}
                  </div>
                  <div className="nri-actions">
                    <button onClick={() => setRunning(!running)}>
                      {running ? "Pausar" : "Iniciar"}
                    </button>
                    <button
                      onClick={() => {
                        setRunning(false);
                        setSeconds(3600);
                      }}
                    >
                      Reiniciar
                    </button>
                  </div>
                  {[
                    ["Revisão espaçada", 15],
                    ["Aula / lacuna prioritária", 25],
                    ["Questões objetivas", 15],
                    ["Registro de erros", 5],
                  ].map(([name, time], i) => (
                    <label className="nri-plan-step" key={i}>
                      <input
                        type="checkbox"
                        checked={plan.includes(i)}
                        onChange={(e) =>
                          setS((p) => ({
                            ...p,
                            plan: {
                              ...p.plan,
                              [day]: e.target.checked
                                ? [...plan, i]
                                : plan.filter((v) => v !== i),
                            },
                          }))
                        }
                      />
                      <span>{name}</span>
                      <b>{time}′</b>
                    </label>
                  ))}
                  <p className="nri-muted">
                    A lista e o temporizador não concluem avaliações
                    automaticamente.
                  </p>
                </section>
              </div>
              <Evolution state={s} match={match} />
            </>
          )}
          {tab === tabs[1] && (
            <>
              <div className="nri-heading">
                <h3>Curso e checkpoints</h3>
                <button
                  className="nri-primary"
                  onClick={() => openDraft(draftSession())}
                >
                  + Registrar avaliação
                </button>
              </div>
              <div className="nri-grid">
                {blocks
                  .map((b, i) => ({ b, i }))
                  .filter(({ b, i }) => match(`Bloco ${i + 1} ${b[0]}`))
                  .map(({ b, i }) => (
                    <article className="nri-card" key={i}>
                      <span className="nri-kicker">
                        BLOCO {i + 1} ·{" "}
                        {blockDone(s, i) === b[1]
                          ? "CONCLUÍDO"
                          : blockDone(s, i)
                            ? "EM ANDAMENTO"
                            : "A INICIAR"}
                      </span>
                      <h3>{b[0]}</h3>
                      <progress max={b[1]} value={blockDone(s, i)} />
                      <p>
                        {blockDone(s, i)}/{b[1]} aulas avaliadas
                      </p>
                      <small>
                        Questões iniciais sem distribuição por bloco; novas
                        avaliações abaixo.
                      </small>
                      <details>
                        <summary>Consultar aulas</summary>
                        {Array.from({ length: b[1] }, (_, j) => {
                          const code = `${i + 1}${String.fromCharCode(65 + j)}`,
                            confirmed = i < 6 || (i === 6 && j < 8),
                            v = sessions.find(
                              (x) => x.kind === "lesson" && x.label === code,
                            );
                          return (
                            <div className="nri-lesson" key={code}>
                              <strong>{code}</strong>
                              <span>
                                {confirmed
                                  ? "Concluída · agregado"
                                  : v?.validated
                                    ? `${grade(v.answers, v.key)}/${v.answers.length} · corrigida`
                                    : v
                                      ? "Aguardando correção"
                                      : code === "7I"
                                        ? "Ministrada · avaliação pendente"
                                        : "Não iniciada"}
                              </span>
                              {!confirmed && !v?.validated && (
                                <button
                                  onClick={() =>
                                    openDraft(
                                      v
                                        ? { ...v, supersedes: v.id }
                                        : {
                                            ...draftSession(),
                                            label: code,
                                            topic: b[0],
                                          },
                                    )
                                  }
                                >
                                  {v ? "Corrigir" : "Registrar"}
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </details>
                    </article>
                  ))}
              </div>
              <section className="nri-card">
                <h3>Checkpoints</h3>
                <p>CP1: 29/30 (96,67%) · registro separado</p>
                <p>
                  CP2:{" "}
                  {cp2
                    ? `${grade(cp2.answers, cp2.key)}/${cp2.answers.length} · validado`
                    : "Pendente; não incorporado ao histórico das aulas"}
                </p>
                <button
                  disabled={!!cp2}
                  onClick={() => {
                    const v = sessions.find(
                      (x) => x.kind === "checkpoint" && x.label === "CP2",
                    );
                    openDraft(
                      v
                        ? { ...v, supersedes: v.id }
                        : {
                            ...draftSession(),
                            kind: "checkpoint",
                            label: "CP2",
                            topic: "Blocos 1–6 + Galeno",
                          },
                    );
                  }}
                >
                  Registrar / corrigir CP2
                </button>
              </section>
              {pending.map((v) => (
                <section className="nri-card" key={v.id}>
                  <h3>{v.label} · aguardando correção</h3>
                  <p>
                    {v.topic} · {v.answers.length} respostas · {date(v.date)}
                  </p>
                  <button onClick={() => openDraft({ ...v, supersedes: v.id })}>
                    Abrir avaliação
                  </button>
                </section>
              ))}
            </>
          )}
          {tab === tabs[2] && (
            <>
              <section className="nri-card">
                <h3>D0, D+1, D+3, D+7 e D+14</h3>
                <p>
                  D0 é a data real da resposta diagnóstica. A passagem do tempo
                  não conclui revisões. Um novo ciclo conserva os anteriores.
                </p>
                <div className="nri-form-row">
                  <label>
                    Tema
                    <input
                      list="nri-topics"
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                    />
                  </label>
                  <label>
                    D0 real
                    <input
                      type="date"
                      max={day}
                      value={d0}
                      onChange={(e) => setD0(e.target.value)}
                    />
                  </label>
                  <button
                    onClick={() => {
                      if (!topic.trim() || !isoDate(d0) || d0 > day)
                        return setNotice(
                          "Informe tema e uma data real não futura.",
                        );
                      setS((p) => ({
                        ...p,
                        cycles: [
                          ...p.cycles,
                          { id: uid(), topic, d0, done: {} },
                        ],
                      }));
                    }}
                  >
                    Criar ciclo
                  </button>
                </div>
              </section>
              {!s.cycles.length && (
                <div className="nri-empty">
                  <h3>Seu calendário começa com evidência</h3>
                  <p>
                    Sem datas reais confirmadas nesta aba; cadastre seu primeiro
                    D0.
                  </p>
                </div>
              )}
              {s.cycles
                .filter((c) => match(c.topic))
                .map((c) => (
                  <section className="nri-card" key={c.id}>
                    <h3>{c.topic}</h3>
                    <div className="nri-schedule">
                      {[0, 1, 3, 7, 14].map((step) => (
                        <div
                          key={step}
                          className={
                            c.done[step]
                              ? "complete"
                              : due(c.d0, step) < day
                                ? "overdue"
                                : ""
                          }
                        >
                          <strong>{step ? `D+${step}` : "D0"}</strong>
                          <span>{date(due(c.d0, step))}</span>
                          {c.done[step] ? (
                            <>
                              <small>Realizada {date(c.done[step].date)}</small>
                              <details>
                                <summary>Evidência</summary>
                                {c.done[step].evidence}
                              </details>
                            </>
                          ) : (
                            <>
                              <small>
                                {due(c.d0, step) < day
                                  ? "Vencida"
                                  : due(c.d0, step) === day
                                    ? "Hoje"
                                    : "Agendada"}
                              </small>
                              <button
                                onClick={() => {
                                  setNotice("");
                                  setReview({ id: c.id, step });
                                  setRealDate(day);
                                  setEvidence("");
                                }}
                              >
                                Registrar realização
                              </button>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  </section>
                ))}
            </>
          )}
          {tab === tabs[3] && (
            <>
              <div className="nri-heading">
                <h3>Banco de questões objetivas</h3>
                <button
                  onClick={() => {
                    setNotice("");
                    setQuestion({
                      id: uid(),
                      topic: priorities[0],
                      stem: "",
                      options: ["", "", "", "", ""],
                    });
                  }}
                >
                  + Nova questão
                </button>
              </div>
              <p className="nri-muted">
                {s.questions.length} questões · {attempts.length} tentativas
                corrigidas · {s.attempts.length - attempts.length} aguardando
                gabarito. Duas questões autorais do mestre, sem gabaritos nesse
                arquivo.
              </p>
              {s.questions
                .filter((q) => match(q.topic + " " + q.stem))
                .map((q) => (
                  <article className="nri-card" key={q.id}>
                    <span className="nri-kicker">
                      {q.topic} ·{" "}
                      {q.key ? "GABARITO VALIDADO" : "GABARITO PENDENTE"}
                    </span>
                    <h3>{q.stem}</h3>
                    <div className="nri-options">
                      {q.options.map((o, i) => (
                        <button
                          key={i}
                          onClick={() => answer(q, String.fromCharCode(65 + i))}
                        >
                          <b>{String.fromCharCode(65 + i)}</b>
                          {o}
                        </button>
                      ))}
                    </div>
                    {s.attempts
                      .filter((a) => a.questionId === q.id)
                      .map((a) => (
                        <small key={a.id}>
                          {date(a.date)} · {a.answer} ·{" "}
                          {a.key
                            ? a.answer === a.key
                              ? "Correta"
                              : "Revisar"
                            : "Aguardando correção"}
                        </small>
                      ))}
                    {q.key ? (
                      <details>
                        <summary>Gabarito e fonte</summary>
                        {q.key} · {q.evidence}
                      </details>
                    ) : (
                      <button
                        onClick={() => {
                          setNotice("");
                          setKeyFor(q.id);
                          setKeyValue("A");
                          setKeySource("");
                          setAttest(false);
                        }}
                      >
                        Validar gabarito com fonte
                      </button>
                    )}
                  </article>
                ))}
            </>
          )}
          {tab === tabs[4] && (
            <>
              <section className="nri-card">
                <h3>Registrar lacuna</h3>
                <div className="nri-form-row">
                  <label>
                    Tema
                    <input
                      list="nri-topics"
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                    />
                  </label>
                  <label>
                    Erro, dúvida ou próximo passo
                    <input
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                    />
                  </label>
                  <button
                    onClick={() => {
                      if (!topic.trim() || !note.trim())
                        return setNotice("Informe tema e lacuna.");
                      setS((p) => ({
                        ...p,
                        gaps: [
                          ...p.gaps,
                          { id: uid(), topic, note, status: "Aberta" },
                        ],
                      }));
                      setNote("");
                    }}
                  >
                    Adicionar
                  </button>
                </div>
              </section>
              <div className="nri-grid">
                {s.gaps
                  .filter((g) => match(g.topic + " " + g.note))
                  .map((g) => (
                    <article className="nri-card" key={g.id}>
                      <span className="nri-kicker">
                        {g.id.startsWith("priority")
                          ? "PRIORIDADE DE REVISÃO"
                          : "LACUNA REGISTRADA"}
                      </span>
                      <h3>{g.topic}</h3>
                      <p>{g.note}</p>
                      <label>
                        Status
                        <select
                          value={g.status}
                          onChange={(e) => {
                            const status = e.target.value;
                            let proof = g.evidence;
                            if (status === "Resolvida") {
                              proof =
                                window.prompt(
                                  "Qual evidência de recuperação sustenta a resolução?",
                                ) || "";
                              if (!proof.trim()) return;
                            }
                            setS((p) => ({
                              ...p,
                              gaps: p.gaps.map((x) =>
                                x.id === g.id
                                  ? { ...x, status, evidence: proof }
                                  : x,
                              ),
                            }));
                          }}
                        >
                          {["Aberta", "Em revisão", "Resolvida"].map((x) => (
                            <option key={x}>{x}</option>
                          ))}
                        </select>
                      </label>
                      {g.evidence && <small>Evidência: {g.evidence}</small>}
                    </article>
                  ))}
              </div>
            </>
          )}
          {tab === tabs[5] && (
            <>
              <section className="nri-card">
                <span className="nri-kicker">FONTES DE CONTINUIDADE</span>
                <h3>Arquivos mestre e importação</h3>
                <p>
                  Markdown, CSV, JSON, Word (.docx) e PDF. Texto e originais
                  ficam neste navegador. PDFs digitalizados exigem OCR externo.
                </p>
                <label className="nri-upload">
                  <strong>
                    {busy
                      ? "Extraindo conteúdo…"
                      : "Selecionar arquivo mestre ou questões"}
                  </strong>
                  <span>Até 15 MB · PDF até 200 páginas</span>
                  <input
                    type="file"
                    disabled={busy}
                    accept=".md,.txt,.csv,.json,.docx,.pdf"
                    onChange={(e) => {
                      void importFile(e.target.files?.[0]);
                      e.target.value = "";
                    }}
                  />
                </label>
                <details>
                  <summary>Formato das questões</summary>
                  <p>
                    JSON: array de objetos com stem, topic e options (cinco
                    textos). CSV: stem,topic,A,B,C,D,E. Gabaritos importados
                    aguardam validação individual.
                  </p>
                  <button
                    onClick={() =>
                      download(
                        "NRI_modelo.json",
                        new Blob(
                          [
                            JSON.stringify(
                              seeds.map(({ id, ...q }) => q),
                              null,
                              2,
                            ),
                          ],
                          { type: "application/json" },
                        ),
                      )
                    }
                  >
                    Baixar modelo
                  </button>
                </details>
              </section>
              <section className="nri-card">
                <h3>Fonte inicial consultada</h3>
                <p>{baseline.source}</p>
                <p>
                  60/120 aulas; 296/298 questões; CP1 29/30; CP2 pendente.
                  Currículo de 13 blocos: Curso NRI 2027.docx (29/10).
                </p>
                <div className="nri-callout">
                  <strong>
                    Relatos posteriores aguardam documentação de validação
                  </strong>
                  <p>
                    Há relato de 74/120, 364/368, CP2 30/30 e 9C pendente, além
                    de R001/R002 12/12. Não incorporados sem a evidência
                    primária de correção. A ambiguidade de R002 permanece
                    aberta.
                  </p>
                </div>
              </section>
              <div className="nri-columns">
                <section className="nri-card">
                  <h3>Documentos importados</h3>
                  {!s.files.length ? (
                    <p>Nenhum documento importado.</p>
                  ) : (
                    s.files.map((f) => (
                      <div className="nri-file" key={f.id}>
                        <button onClick={() => setFileId(f.id)}>
                          {f.name}
                        </button>
                        <button onClick={() => download(f.name, f.blob)}>
                          Original ↓
                        </button>
                      </div>
                    ))
                  )}
                </section>
                <section className="nri-card">
                  <h3>Consultar texto</h3>
                  <pre className="nri-document">
                    {s.files.find((f) => f.id === fileId)?.text ||
                      "Selecione um arquivo. Importar um mestre não altera métricas; novas avaliações exigem evidência."}
                  </pre>
                </section>
              </div>
              <section className="nri-card">
                <h3>Histórico de avaliações · somente acréscimos</h3>
                {!s.sessions.length ? (
                  <p>Apenas o estado inicial confirmado está registrado.</p>
                ) : (
                  s.sessions.map((v) => (
                    <details key={v.id}>
                      <summary>
                        {v.label} · {date(v.date)} ·{" "}
                        {v.validated
                          ? `${grade(v.answers, v.key)}/${v.answers.length}`
                          : "Aguardando correção"}
                        {s.sessions.some((x) => x.supersedes === v.id)
                          ? " · versão anterior"
                          : ""}
                      </summary>
                      <p>
                        {v.topic} · Respostas: {v.answers} · Fonte:{" "}
                        {v.evidence || "Não informada"}
                      </p>
                    </details>
                  ))
                )}
              </section>
              <p className="nri-muted">
                Sem sincronização automática entre chats ou dispositivos. O
                backup ZIP reúne registros e originais para consulta; esta
                versão não restaura métricas automaticamente.
              </p>
            </>
          )}
        </>
      )}
      {draft && (
        <Modal
          title="Registrar avaliação"
          notice={notice}
          close={() => setDraft(null)}
        >
          <div className="nri-form">
            <label>
              Tipo
              <select
                value={draft.kind}
                disabled={!!draft.supersedes}
                onChange={(e) =>
                  setDraft({
                    ...draftSession(),
                    kind: e.target.value as Session["kind"],
                    label:
                      e.target.value === "checkpoint"
                        ? "CP2"
                        : e.target.value === "review"
                          ? "R003"
                          : "7I",
                  })
                }
              >
                <option value="lesson">Aula do curso</option>
                <option value="checkpoint">Checkpoint</option>
                <option value="review">Revisão separada</option>
              </select>
            </label>
            <label>
              Código / identificação
              <input
                value={draft.label}
                disabled={!!draft.supersedes}
                onChange={(e) => setDraft({ ...draft, label: e.target.value })}
              />
            </label>
            <label>
              Tema
              <input
                list="nri-topics"
                value={draft.topic}
                onChange={(e) => setDraft({ ...draft, topic: e.target.value })}
              />
            </label>
            <label>
              Data real das respostas
              <input
                type="date"
                max={day}
                value={draft.date}
                onChange={(e) => setDraft({ ...draft, date: e.target.value })}
              />
            </label>
            <label>
              Respostas em ordem (ex.: C E A D B)
              <input
                value={draft.answers}
                onChange={(e) =>
                  setDraft({ ...draft, answers: e.target.value })
                }
              />
            </label>
            <label className="nri-check">
              <input
                type="checkbox"
                checked={draft.validated}
                onChange={(e) =>
                  setDraft({ ...draft, validated: e.target.checked })
                }
              />{" "}
              Conferi o gabarito em fonte válida
            </label>
            {draft.validated && (
              <>
                <label>
                  Gabarito em ordem
                  <input
                    value={draft.key}
                    onChange={(e) =>
                      setDraft({ ...draft, key: e.target.value })
                    }
                  />
                </label>
                <label>
                  Fonte e evidência da correção
                  <textarea
                    value={draft.evidence}
                    onChange={(e) =>
                      setDraft({ ...draft, evidence: e.target.value })
                    }
                  />
                </label>
              </>
            )}
            <small>
              Sem validação, a aula permanece pendente. Checkpoints e revisões
              não alteram o histórico das aulas.
            </small>
            <button onClick={record}>Salvar registro</button>
          </div>
        </Modal>
      )}
      {question && (
        <Modal
          title="Nova questão A–E"
          notice={notice}
          close={() => setQuestion(null)}
        >
          <div className="nri-form">
            <label>
              Tema
              <input
                list="nri-topics"
                value={question.topic}
                onChange={(e) =>
                  setQuestion({ ...question, topic: e.target.value })
                }
              />
            </label>
            <label>
              Enunciado
              <textarea
                value={question.stem}
                onChange={(e) =>
                  setQuestion({ ...question, stem: e.target.value })
                }
              />
            </label>
            {question.options.map((o, i) => (
              <label key={i}>
                Alternativa {String.fromCharCode(65 + i)}
                <input
                  value={o}
                  onChange={(e) =>
                    setQuestion({
                      ...question,
                      options: question.options.map((v, j) =>
                        j === i ? e.target.value : v,
                      ),
                    })
                  }
                />
              </label>
            ))}
            <button
              onClick={() => {
                try {
                  const [q] = parseQuestions(JSON.stringify([question]));
                  setS((p) => ({ ...p, questions: [...p.questions, q] }));
                  setQuestion(null);
                } catch (e) {
                  fail(e);
                }
              }}
            >
              Adicionar sem gabarito
            </button>
          </div>
        </Modal>
      )}
      {keyFor && (
        <Modal
          title="Validar gabarito"
          notice={notice}
          close={() => setKeyFor("")}
        >
          <div className="nri-form">
            <label>
              Alternativa correta
              <select
                value={keyValue}
                onChange={(e) => setKeyValue(e.target.value)}
              >
                {["A", "B", "C", "D", "E"].map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
            </label>
            <label>
              Fonte validada
              <textarea
                value={keySource}
                onChange={(e) => setKeySource(e.target.value)}
              />
            </label>
            <label className="nri-check">
              <input
                type="checkbox"
                checked={attest}
                onChange={(e) => setAttest(e.target.checked)}
              />{" "}
              Conferi esta resposta na fonte indicada
            </label>
            <button onClick={validateKey}>Validar e corrigir pendências</button>
          </div>
        </Modal>
      )}
      {review && (
        <Modal
          title="Registrar revisão realizada"
          notice={notice}
          close={() => setReview(null)}
        >
          <div className="nri-form">
            <label>
              Data real
              <input
                type="date"
                max={day}
                value={realDate}
                onChange={(e) => setRealDate(e.target.value)}
              />
            </label>
            <label>
              Evidência / resultado
              <textarea
                value={evidence}
                onChange={(e) => setEvidence(e.target.value)}
              />
            </label>
            <button
              onClick={() => {
                const c = s.cycles.find((x) => x.id === review.id);
                if (
                  !c ||
                  !isoDate(realDate) ||
                  realDate > day ||
                  realDate < c.d0 ||
                  !evidence.trim()
                )
                  return setNotice(
                    "Informe data real a partir de D0 e evidência.",
                  );
                setS((p) => ({
                  ...p,
                  cycles: p.cycles.map((x) =>
                    x.id === review.id
                      ? {
                          ...x,
                          done: {
                            ...x.done,
                            [review.step]: { date: realDate, evidence },
                          },
                        }
                      : x,
                  ),
                }));
                setReview(null);
              }}
            >
              Registrar realização
            </button>
          </div>
        </Modal>
      )}
      {preview && (
        <Modal
          title={`Prévia · ${preview.file.name}`}
          close={() => setPreview(null)}
        >
          <p>
            {preview.questions.length
              ? `${preview.questions.length} questões A–E. Gabaritos aguardam validação individual.`
              : "Documento para consulta; nenhuma métrica será alterada."}
          </p>
          <pre className="nri-document">
            {preview.text.slice(0, 20000) ||
              "Sem texto extraído. O original será preservado."}
          </pre>
          <button
            onClick={() => {
              const id = uid();
              setS((p) => ({
                ...p,
                files: [
                  ...p.files,
                  {
                    id,
                    name: preview.file.name,
                    text: preview.text,
                    blob: preview.file,
                    date: day,
                  },
                ],
                questions: [
                  ...p.questions,
                  ...preview.questions.filter(
                    (q) =>
                      !p.questions.some(
                        (x) => x.stem === q.stem && x.topic === q.topic,
                      ),
                  ),
                ],
              }));
              setFileId(id);
              setPreview(null);
              setNotice("Importação aplicada; histórico preservado.");
            }}
          >
            Confirmar importação
          </button>
        </Modal>
      )}
    </section>
  );
}
function Modal({
  title,
  notice,
  children,
  close,
}: {
  title: string;
  notice?: string;
  children: React.ReactNode;
  close: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    ref.current?.showModal();
    return () => ref.current?.close();
  }, []);
  return (
    <dialog ref={ref} className="nri-modal" onCancel={close}>
      <div className="nri-heading">
        <h3>{title}</h3>
        <button onClick={close} aria-label="Fechar diálogo">
          ×
        </button>
      </div>
      {notice && <p role="alert">{notice}</p>}
      {children}
    </dialog>
  );
}
function Evolution({
  state: s,
  match,
}: {
  state: State;
  match: (s: string) => boolean;
}) {
  const sessions = active(s).filter((x) => x.kind === "review" && x.validated),
    records = [
      ...s.attempts.map((a) => ({
        topic: a.topic,
        date: a.date,
        correct: a.key ? Number(a.key === a.answer) : 0,
        total: a.key ? 1 : 0,
        pending: a.key ? 0 : 1,
      })),
      ...sessions.map((x) => ({
        topic: x.topic,
        date: x.date,
        correct: grade(x.answers, x.key),
        total: x.answers.length,
        pending: 0,
      })),
    ],
    topics = Array.from(new Set(records.map((x) => x.topic)));
  return (
    <section className="nri-card">
      <span className="nri-kicker">EVOLUÇÃO POR TEMA</span>
      <h3>Compare sua recuperação</h3>
      {!topics.length ? (
        <p>
          Sem avaliações individuais por tema. Os 296/298 agregados não permitem
          estimar domínio por assunto.
        </p>
      ) : (
        <div className="nri-table">
          <table>
            <thead>
              <tr>
                <th>Tema</th>
                <th>Primeira data</th>
                <th>Última data</th>
                <th>Corrigidas</th>
                <th>Pendentes</th>
              </tr>
            </thead>
            <tbody>
              {topics.filter(match).map((t) => {
                const r = records.filter((x) => x.topic === t),
                  dates = Array.from(
                    new Set(r.filter((x) => x.total).map((x) => x.date)),
                  ).sort(),
                  summary = (d: string) => {
                    const a = r.filter((x) => x.date === d);
                    return `${date(d)} · ${pct(
                      a.reduce((n, x) => n + x.correct, 0),
                      a.reduce((n, x) => n + x.total, 0),
                    )}`;
                  };
                return (
                  <tr key={t}>
                    <td>{t}</td>
                    <td>{dates.length ? summary(dates[0]) : "—"}</td>
                    <td>{dates.length ? summary(dates.at(-1)!) : "—"}</td>
                    <td>
                      {r.reduce((n, x) => n + x.correct, 0)}/
                      {r.reduce((n, x) => n + x.total, 0)}
                    </td>
                    <td>{r.reduce((n, x) => n + x.pending, 0)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <small>
        Comparação descritiva por data; novas tentativas preservam as
        anteriores.
      </small>
    </section>
  );
}
