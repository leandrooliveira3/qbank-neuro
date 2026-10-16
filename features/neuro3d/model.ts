import raw from "./dataset.json";
import manifest from "./models.json";

export interface Structure {
  id: string;
  name: string;
  points: number[][];
  color: string;
  radius: number;
  layer: string;
  scene: string;
  description: string;
  importance: string;
  references: string[];
  variants: string[];
  stages: number[];
  geometry_status: string;
  uncertainty?: string;
}
export interface SceneMeta {
  name: string;
  summary: string;
  center: number[];
  distance: number;
  yaw: number;
  pitch: number;
  group: string;
}
export interface Question {
  id: string;
  front: string;
  alternatives: string[];
  correct: number;
  explanation: string;
  scene: string;
  references: string[];
}
export interface AtlasData {
  scenes: Record<string, Structure[]>;
  scene_meta: Record<string, SceneMeta>;
  sources: Record<string, string>;
  variants: Record<
    string,
    { id: string; name: string; description?: string }[]
  >;
  stages: { id: number; title: string; description: string }[];
  curriculum: {
    id: string;
    title: string;
    scene: string;
    topics: { id: string; title: string; status: string }[];
    status: string;
  }[];
  questions: Question[];
  index: {
    id: string;
    topic: string;
    axis: string;
    sources: string;
    alert: string;
    status: string;
    approved: boolean;
  }[];
}
export const data = raw as AtlasData;
export const models = manifest.models;
export const layerNames: Record<string, string> = {
  arterial: "Artérias",
  venous: "Veias",
  bone: "Referências estruturais",
  dura: "Dura",
  nerve: "Nervos",
  shunt: "Shunts",
  device: "Dispositivos",
  tissue: "Tecido medular",
  primitive: "Vasos embrionários",
};
export const normalize = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
export function visibleStructures(
  scene: string,
  variant: string,
  stage: number,
  layers?: string[],
) {
  return (data.scenes[scene] ?? []).filter(
    (o) =>
      (!o.variants.length || o.variants.includes(variant)) &&
      (scene !== "embryo" || o.stages.includes(stage)) &&
      (!layers || layers.includes(o.layer)),
  );
}
export function modelUrl(scene: string, variant: string, stage: number) {
  const configuration =
    scene === "embryo"
      ? `etapa${stage + 1}`
      : data.variants[scene]?.length
        ? variant
        : "default";
  const entry = models.find(
    (m) =>
      m.scene === scene &&
      (m.configuration === configuration ||
        (!data.variants[scene]?.length && scene !== "embryo")),
  );
  if (!entry)
    throw new Error(`Modelo não encontrado: ${scene}/${configuration}`);
  return `${import.meta.env.BASE_URL}neuro3d/models/${entry.file}`;
}
export function findStructures(query: string) {
  const term = normalize(query);
  return term
    ? Object.values(data.scenes)
        .flat()
        .filter((o) =>
          normalize(`${o.name} ${o.id} ${o.description}`).includes(term),
        )
        .slice(0, 30)
    : [];
}
export interface Answer {
  answer: number;
  correct: boolean;
  at: string;
}
export interface Progress {
  version: 1;
  answers: Record<string, Answer>;
  visited: string[];
}
export const emptyProgress = (): Progress => ({
  version: 1,
  answers: {},
  visited: [],
});
export function parseProgress(text: string): Progress {
  const parsed = JSON.parse(text);
  if (
    parsed?.version !== 1 ||
    !parsed.answers ||
    typeof parsed.answers !== "object" ||
    Array.isArray(parsed.answers) ||
    !Array.isArray(parsed.visited)
  )
    throw new Error("Formato de progresso inválido.");
  const answers: Record<string, Answer> = {};
  for (const q of data.questions) {
    const a = parsed.answers[q.id];
    if (
      a &&
      Number.isInteger(a.answer) &&
      a.answer >= 0 &&
      a.answer < q.alternatives.length &&
      typeof a.at === "string" &&
      Number.isFinite(Date.parse(a.at))
    )
      answers[q.id] = {
        answer: a.answer,
        correct: a.answer === q.correct,
        at: a.at,
      };
  }
  return {
    version: 1,
    answers,
    visited: parsed.visited.filter(
      (s: unknown) => typeof s === "string" && !!data.scenes[s as string],
    ),
  };
}
export function exportQuestions() {
  return data.questions.map((q) => ({
    categoria: "Neurorradiologia Intervencionista",
    subcategoria: data.scene_meta[q.scene].name,
    enunciado: q.front,
    alternativas: q.alternatives,
    gabarito: String.fromCharCode(65 + q.correct),
    comentario: q.explanation,
    justificativa_incorretas: {},
    dificuldade: "media",
    tags: ["NRI", "Neuro3D", q.scene],
    fontes: q.references.map((r) => data.sources[r]),
  }));
}
