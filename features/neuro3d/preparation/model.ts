export const baseline = Object.freeze({
  lessons: 60,
  total: 120,
  correct: 296,
  questions: 298,
  source: "NRI_MASTER_2026-11-05.md · registro confirmado em 05/11/2026",
});
export const blocks = [
  ["Carótida externa e base do crânio", 6],
  ["Embriologia vascular · Lasjaunias", 13],
  ["Anatomia arterial intracraniana", 10],
  ["Sistema venoso cerebral", 8],
  ["Anatomia vascular medular", 7],
  ["FAV durais e carotidocavernosas", 8],
  ["MAVs, aneurismas e hemorragias", 10],
  ["AVCi, trombectomia e doença oclusiva", 10],
  ["Angiografia, radiação e materiais", 10],
  ["Tumores e procedimentos especiais", 8],
  ["Vasculopatias e síndromes neurovasculares", 8],
  ["Ensaios clínicos · LINNC 2026", 12],
  ["Diretriz AHA/ASA 2026 · AVCi", 10],
] as const;
export const priorities = [
  "Embriologia carotídea/oftálmica",
  "Anatomia medular",
  "DSA",
  "Microcateterismo",
  "Fístulas carotidocavernosas",
  "MAVs",
  "Veia de Galeno",
  "Aneurismas complexos",
  "DCI",
];
export type Kind = "lesson" | "checkpoint" | "review";
export type Session = {
  id: string;
  kind: Kind;
  label: string;
  topic: string;
  date: string;
  answers: string;
  key: string;
  evidence: string;
  validated: boolean;
  supersedes?: string;
};
export type Question = {
  id: string;
  topic: string;
  stem: string;
  options: string[];
  key?: string;
  evidence?: string;
};
export type Attempt = {
  id: string;
  questionId: string;
  topic: string;
  answer: string;
  date: string;
  key?: string;
  evidence?: string;
};
export type Gap = {
  id: string;
  topic: string;
  note: string;
  status: string;
  evidence?: string;
};
export type Cycle = {
  id: string;
  topic: string;
  d0: string;
  done: Record<string, { date: string; evidence: string }>;
};
export type State = {
  version: 1;
  sessions: Session[];
  questions: Question[];
  attempts: Attempt[];
  gaps: Gap[];
  cycles: Cycle[];
  files: { id: string; name: string; text: string; blob: Blob; date: string }[];
  plan: Record<string, number[]>;
};
export const uid = () => crypto.randomUUID();
export const today = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
export function isoDate(s: string) {
  return (
    /^\d{4}-\d{2}-\d{2}$/.test(s) &&
    !isNaN(Date.parse(s + "T12:00:00Z")) &&
    new Date(s + "T12:00:00Z").toISOString().slice(0, 10) === s
  );
}
export function due(s: string, n: number) {
  const d = new Date(s + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
export const letters = (s: string) => s.toUpperCase().replace(/[\s,;]+/g, "");
export function grade(a: string, k: string) {
  if (!/^[A-E]+$/.test(a) || !/^[A-E]+$/.test(k) || a.length !== k.length)
    throw Error(
      "Respostas e gabarito exigem a mesma quantidade de alternativas A–E.",
    );
  return [...a].filter((x, i) => x === k[i]).length;
}
export const seeds: Question[] = [
  {
    id: "master-q2",
    topic: "Anatomia arterial intracraniana",
    stem: "Após oclusão da artéria coroidea anterior esquerda, qual conjunto é mais compatível com comprometimento de seu território clássico?",
    options: [
      "Hemiparesia direita, hemihipoestesia direita e hemianopsia homônima direita.",
      "Paraparesia, abulia e incontinência urinária.",
      "Paralisia facial periférica esquerda, surdez esquerda e ataxia.",
      "Afasia de condução isolada e apraxia ideomotora bilateral.",
      "Amaurose monocular esquerda e paresia isolada do VI nervo esquerdo.",
    ],
  },
  {
    id: "master-q7",
    topic: "Fístulas carotidocavernosas",
    stem: "A angiografia demonstra comunicação direta entre a carótida interna intracavernosa e o seio cavernoso. Pela classificação de Barrow, trata-se de:",
    options: [
      "Tipo C.",
      "Tipo D.",
      "Tipo A.",
      "Tipo B.",
      "Não pode ser classificada sem medir a pressão intraocular.",
    ],
  },
];
export function initial(): State {
  return {
    version: 1,
    sessions: [],
    questions: seeds,
    attempts: [],
    gaps: priorities.map((topic, i) => ({
      id: "priority-" + i,
      topic,
      note: "Prioridade de revisão solicitada; domínio ainda não medido nesta aba.",
      status: "Aberta",
    })),
    cycles: [],
    files: [],
    plan: {},
  };
}
export function active(s: State) {
  const replaced = new Set(s.sessions.map((x) => x.supersedes));
  return s.sessions.filter((x) => !replaced.has(x.id));
}
export function metrics(s: State) {
  const a = active(s).filter((x) => x.kind === "lesson" && x.validated);
  return {
    lessons: 60 + a.length,
    questions: 298 + a.reduce((n, x) => n + x.answers.length, 0),
    correct: 296 + a.reduce((n, x) => n + grade(x.answers, x.key), 0),
  };
}
export function blockDone(s: State, i: number) {
  return (
    (i < 6 ? blocks[i][1] : i === 6 ? 8 : 0) +
    active(s).filter(
      (x) =>
        x.kind === "lesson" &&
        x.validated &&
        Number(x.label.match(/^\d+/)?.[0]) === i + 1,
    ).length
  );
}
export function validate(s: Session, existing: Session[]) {
  if (
    !s.label.trim() ||
    !s.topic.trim() ||
    !isoDate(s.date) ||
    s.date > today() ||
    !/^[A-E]+$/.test(s.answers)
  )
    throw Error(
      "Informe identificação, tema, data real não futura e respostas A–E.",
    );
  if (s.validated) {
    if (!s.evidence.trim())
      throw Error("A correção exige fonte de gabarito validado.");
    grade(s.answers, s.key);
  }
  if (
    s.supersedes &&
    !existing.some(
      (x) =>
        x.id === s.supersedes &&
        !x.validated &&
        x.kind === s.kind &&
        x.label === s.label,
    )
  )
    throw Error("Só é possível corrigir uma avaliação pendente existente.");
  if (s.kind === "lesson") {
    const m = /^(\d{1,2})([A-M])$/.exec(s.label);
    if (
      !m ||
      +m[1] < 1 ||
      +m[1] > 13 ||
      m[2].charCodeAt(0) - 65 >= blocks[+m[1] - 1][1]
    )
      throw Error("Código de aula inválido. Use 7I, 8A, 12A–12L ou 13A–13J.");
    if (+m[1] < 7 || (+m[1] === 7 && m[2] <= "H"))
      throw Error("Aula já incluída no histórico; registre uma revisão.");
    if (s.answers.length !== 5) throw Error("Cada aula exige cinco respostas.");
  }
  if (s.kind === "checkpoint" && !/^CP[2-9]\d*$/.test(s.label))
    throw Error("Use CP2 ou um checkpoint posterior; CP1 está preservado.");
  if (
    s.kind === "checkpoint" &&
    s.label === "CP2" &&
    (s.answers.length > 30 || (s.validated && s.answers.length !== 30))
  )
    throw Error(
      "CP2 exige 30 respostas para conclusão validada. Salve respostas parciais como pendentes.",
    );
  if (
    s.kind !== "review" &&
    existing.some(
      (x) => x.kind === s.kind && x.label === s.label && x.id !== s.supersedes,
    )
  )
    throw Error("Avaliação já registrada. Abra sua correção pendente.");
}
export function parseQuestions(text: string) {
  const d = JSON.parse(text),
    rows = Array.isArray(d) ? d : d.questions;
  if (!Array.isArray(rows) || rows.length > 1000)
    throw Error("Esperado array de até 1.000 questões.");
  return rows.map((q, i): Question => {
    if (
      typeof q.stem !== "string" ||
      !q.stem.trim() ||
      typeof q.topic !== "string" ||
      !q.topic.trim() ||
      !Array.isArray(q.options) ||
      q.options.length !== 5 ||
      q.options.some((x: unknown) => typeof x !== "string" || !x.trim())
    )
      throw Error(`Questão ${i + 1}: informe stem, topic e cinco options.`);
    return { id: uid(), stem: q.stem, topic: q.topic, options: q.options };
  });
}
export function csvQuestions(text: string) {
  const rows: string[][] = [];
  let row: string[] = [],
    cell = "",
    quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') {
      if (quoted && text[i + 1] === '"') {
        cell += '"';
        i++;
      } else quoted = !quoted;
    } else if (c === "," && !quoted) {
      row.push(cell);
      cell = "";
    } else if (c === "\n" && !quoted) {
      row.push(cell.replace(/\r$/, ""));
      rows.push(row);
      row = [];
      cell = "";
    } else cell += c;
  }
  if (quoted) throw Error("Aspas do CSV não fechadas.");
  row.push(cell.replace(/\r$/, ""));
  if (row.some(Boolean)) rows.push(row);
  const h = (rows.shift() || []).map((x) => x.replace(/^\uFEFF/, "").trim());
  if (!["stem", "topic", "A", "B", "C", "D", "E"].every((x) => h.includes(x)))
    throw Error("CSV exige stem,topic,A,B,C,D,E.");
  return parseQuestions(
    JSON.stringify(
      rows
        .filter((r) => r.some(Boolean))
        .map((r) => ({
          stem: r[h.indexOf("stem")],
          topic: r[h.indexOf("topic")],
          options: ["A", "B", "C", "D", "E"].map((x) => r[h.indexOf(x)]),
        })),
    ),
  );
}
export function database(value?: State): Promise<State> {
  return new Promise((resolve, reject) => {
    const o = indexedDB.open("neuro3d-nri-2027", 1);
    o.onupgradeneeded = () => o.result.createObjectStore("records");
    o.onerror = () => reject(o.error);
    o.onsuccess = () => {
      const db = o.result,
        t = db.transaction("records", value ? "readwrite" : "readonly"),
        store = t.objectStore("records");
      let result: State;
      if (value) store.put(value, "state");
      else {
        const r = store.get("state");
        r.onsuccess = () => {
          result = r.result || initial();
        };
      }
      t.oncomplete = () => {
        db.close();
        resolve(value || result);
      };
      t.onerror = () => {
        db.close();
        reject(t.error);
      };
    };
  });
}
