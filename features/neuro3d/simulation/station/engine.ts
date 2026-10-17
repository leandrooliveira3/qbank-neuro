import {
  edgeLength,
  locate,
  makeNetwork,
  targetTrack,
  totalLength,
  Track,
  Network,
} from "./network";
import { ProcedureCase, procedureCases } from "./cases";
export type Family =
  | "coil"
  | "retriever"
  | "aspiration"
  | "balloon"
  | "stent"
  | "protection"
  | "flow-diverter";
export const families: Record<Family, string> = {
  coil: "Coil destacável",
  retriever: "Stent retriever",
  aspiration: "Cateter de aspiração",
  balloon: "Balão de angioplastia",
  stent: "Stent carotídeo",
  protection: "Proteção distal",
  "flow-diverter": "Diversor de fluxo · visualização conceitual",
};
export type Tool = "wire" | "catheter" | "micro" | "device";
export interface View {
  yaw: number;
  pitch: number;
  yawB: number;
  pitchB: number;
  panX: number;
  panY: number;
  zoom: number;
  collimation: number;
  gain: number;
}
export interface DeviceState {
  family: Family;
  track: Track;
  open: number;
  detached: boolean;
  captured: boolean;
}
export interface Intervention {
  family: Family;
  track: Track;
  amount: number;
}
export interface ImageMask {
  view: View;
  edges: string[];
  clot: boolean;
  dilation: number;
}
export interface StationState {
  caseId: string;
  tools: Record<"wire" | "catheter" | "micro", Track>;
  active: Tool;
  rotation: number;
  catheterShape: string;
  wireKind: string;
  device: DeviceState | null;
  implants: Intervention[];
  view: View;
  mode: "fluoro" | "dsa" | "roadmap";
  pedal: boolean;
  acquiring: number;
  fps: number;
  clock: number;
  exposure: number;
  injections: number;
  contrast: { edge: string; at: number } | null;
  mask: ImageMask | null;
  clot: boolean;
  coilFill: number;
  parentCompromised: boolean;
  dilation: number;
  stented: boolean;
  protected: boolean;
  aspirating: boolean;
  attempts: number;
  log: { time: number; message: string; level: "info" | "warning" }[];
  runs: { territory: string; time: number }[];
  completed: boolean;
}
export type StationAction =
  | { type: "new"; caseId: string }
  | { type: "tool"; tool: Tool }
  | { type: "move"; delta: number }
  | { type: "rotate"; delta: number }
  | { type: "pedal"; on: boolean }
  | { type: "tick"; dt: number }
  | { type: "view"; patch: Partial<View> }
  | { type: "mode"; mode: StationState["mode"] }
  | { type: "inject" }
  | { type: "mask" }
  | { type: "load"; family: Family }
  | { type: "open"; delta: number }
  | { type: "detach" }
  | { type: "aspirate" }
  | { type: "fps"; value: number }
  | { type: "shape"; value: string }
  | { type: "wireKind"; value: string }
  | { type: "finish" };
export function createStation(caseId = procedureCases[0].id): StationState {
  const c = procedureCases.find((c) => c.id === caseId) || procedureCases[0];
  const track = () => ({ path: ["access"], depth: 0 });
  return {
    caseId: c.id,
    tools: { wire: track(), catheter: track(), micro: track() },
    active: "wire",
    rotation: 0,
    catheterShape: "Multipropósito",
    wireKind: "Guia diagnóstico",
    device: null,
    implants: [],
    view: {
      yaw: 0,
      pitch: 0,
      yawB: 90,
      pitchB: 0,
      panX: 0,
      panY: c.initialView.panY,
      zoom: c.initialView.zoom,
      collimation: 96,
      gain: 1,
    },
    mode: "fluoro",
    pedal: false,
    acquiring: 0,
    fps: 7.5,
    clock: 0,
    exposure: 0,
    injections: 0,
    contrast: null,
    mask: null,
    clot: c.kind === "stroke",
    coilFill: 0,
    parentCompromised: false,
    dilation: 0,
    stented: false,
    protected: false,
    aspirating: false,
    attempts: 0,
    log: [],
    runs: [],
    completed: false,
  };
}
export function caseFor(s: StationState) {
  return procedureCases.find((c) => c.id === s.caseId)!;
}
const networkCache = new Map<string, Network>();
export function networkFor(s: StationState) {
  if (!networkCache.has(s.caseId))
    networkCache.set(s.caseId, makeNetwork(caseFor(s).kind === "aneurysm"));
  return networkCache.get(s.caseId)!;
}
const note = (
  s: StationState,
  message: string,
  warning = false,
): StationState => ({
  ...s,
  log: [
    ...s.log,
    {
      time: s.clock,
      message,
      level: warning ? ("warning" as const) : ("info" as const),
    },
  ].slice(-150),
});
const clamp = (v: number, min: number, max: number) =>
  Math.max(min, Math.min(max, v));
export function projectionKey(v: View) {
  return [v.yaw, v.pitch, v.yawB, v.pitchB, v.panX, v.panY, v.zoom]
    .map((n) => n.toFixed(2))
    .join("|");
}
export function chosenBranch(s: StationState, n: Network) {
  const wire = s.tools.wire;
  const at = locate(n, wire),
    v = n[at.edge];
  const branches = v.children;
  return {
    at,
    branches,
    chosen: branches.length
      ? branches[
          Math.floor(
            ((((s.rotation % 360) + 360) % 360) / 360) * branches.length,
          ) % branches.length
        ]
      : null,
  };
}
export function moveWire(
  n: Network,
  track: Track,
  delta: number,
  rotation: number,
): Track {
  if (delta <= 0)
    return {
      ...track,
      depth: clamp(track.depth + delta, 0, totalLength(n, track.path)),
    };
  let sum = 0,
    end = 0;
  for (let i = 0; i < track.path.length; i++) {
    sum += edgeLength(n[track.path[i]]);
    end = i;
    if (sum >= track.depth - 0.000001) break;
  }
  const path = track.path.slice(0, end + 1);
  let max = totalLength(n, path),
    desired = track.depth + delta;
  for (let i = 0; i < 60 && desired > max; i++) {
    const children = n[path.at(-1)!].children;
    if (!children.length) {
      desired = max;
      break;
    }
    const index =
      Math.floor(((((rotation % 360) + 360) % 360) / 360) * children.length) %
      children.length;
    const id = children[index];
    if (path.includes(id)) {
      desired = max;
      break;
    }
    path.push(id);
    max += edgeLength(n[id]);
  }
  return { path, depth: Math.max(0, Math.min(desired, max)) };
}
function commonLength(n: Network, a: Track, b: Track) {
  let length = 0;
  for (let i = 0; i < Math.min(a.path.length, b.path.length); i++) {
    if (a.path[i] !== b.path[i]) break;
    length += edgeLength(n[a.path[i]]);
  }
  return length;
}
export function opacifiedEdges(s: StationState, n: Network): string[] {
  if (!s.contrast || s.clock - s.contrast.at > 5) return [];
  const out: string[] = [];
  const walk = (id: string) => {
    if (out.includes(id)) return;
    out.push(id);
    if (s.clot && id === caseFor(s).target) return;
    for (const c of n[id]?.children || []) walk(c);
  };
  // Femoral entry is a synthetic access route, not antegrade cerebral blood flow.
  if (s.contrast.edge === "access") return ["access"];
  walk(s.contrast.edge);
  return out;
}
export function nearTarget(
  s: StationState,
  n: Network,
  t: Track,
  tolerance = 0.35,
) {
  const c = caseFor(s),
    at = locate(n, t);
  return at.edge === c.target && Math.abs(at.t - c.targetT) < tolerance;
}
export function goalMet(s: StationState) {
  const kind = caseFor(s).kind;
  if (kind === "aneurysm") return s.coilFill >= 3 && !s.parentCompromised;
  if (kind === "stroke")
    return (
      !s.clot &&
      s.runs.some(
        (r) =>
          (r.territory.includes("ICA") || r.territory === "CI-M1L") &&
          r.time >
            (s.log.filter((e) => e.message.includes("Trombo removido")).at(-1)
              ?.time ?? Infinity),
      )
    );
  if (kind === "carotid") return s.stented && s.dilation >= 0.6;
  return (
    s.runs.some((r) => r.territory.includes("ICA")) &&
    s.runs.some((r) => r.territory === "CI-BA" || r.territory.includes("vert_"))
  );
}
export function stationReducer(
  s: StationState,
  a: StationAction,
): StationState {
  if (a.type === "new") return createStation(a.caseId);
  if (s.completed && !["new", "view", "tool"].includes(a.type)) return s;
  const n = networkFor(s),
    c = caseFor(s);
  switch (a.type) {
    case "tool":
      return { ...s, active: a.tool };
    case "rotate":
      return { ...s, rotation: (((s.rotation + a.delta) % 360) + 360) % 360 };
    case "shape":
      return { ...s, catheterShape: a.value };
    case "wireKind":
      return note(
        {
          ...s,
          wireKind: a.value,
          tools: {
            ...s.tools,
            wire: {
              path: [...s.tools.catheter.path],
              depth: s.tools.catheter.depth,
            },
          },
        },
        "Guia trocado através do cateter no modelo.",
      );
    case "pedal":
      return { ...s, pedal: a.on };
    case "fps":
      return [3, 7.5, 15, 30].includes(a.value) ? { ...s, fps: a.value } : s;
    case "mode":
      return a.mode === "roadmap" && !s.mask
        ? note(
            s,
            "Adquira contraste e capture uma máscara antes de ativar roadmap.",
            true,
          )
        : { ...s, mode: a.mode };
    case "view": {
      const p = a.patch;
      return {
        ...s,
        view: {
          yaw: clamp(p.yaw ?? s.view.yaw, -110, 110),
          pitch: clamp(p.pitch ?? s.view.pitch, -75, 75),
          yawB: clamp(p.yawB ?? s.view.yawB, -110, 110),
          pitchB: clamp(p.pitchB ?? s.view.pitchB, -75, 75),
          panX: clamp(p.panX ?? s.view.panX, -12, 12),
          panY: clamp(p.panY ?? s.view.panY, -12, 12),
          zoom: clamp(p.zoom ?? s.view.zoom, 0.5, 5),
          collimation: clamp(p.collimation ?? s.view.collimation, 25, 100),
          gain: clamp(p.gain ?? s.view.gain, 0.4, 2),
        },
      };
    }
    case "move": {
      if (!Number.isFinite(a.delta) || s.completed) return s;
      const delta = clamp(a.delta, -1.5, 1.5);
      let result = s;
      if (s.active === "wire") {
        let wire = moveWire(n, s.tools.wire, delta, s.rotation);
        const next = locate(n, wire);
        if (
          delta > 0 &&
          s.wireKind === "Guia diagnóstico" &&
          (next.edge.startsWith("CI-") ||
            /ICA-[LR]-C[2-7]/.test(next.edge) ||
            next.edge === "sac")
        )
          return note(
            s,
            "Perfil diagnóstico limitado à navegação proximal neste modelo. Posicione o cateter e troque para microguia.",
            true,
          );
        result = {
          ...s,
          tools: { ...s.tools, wire },
          attempts: s.attempts + 1,
        };
      } else {
        if (s.active === "device" && !s.device)
          return note(s, "Selecione e carregue um dispositivo.", true);
        const current =
          s.active === "device" ? s.device!.track : s.tools[s.active];
        const support =
          s.active === "device" &&
          ["coil", "retriever", "flow-diverter"].includes(s.device!.family)
            ? s.tools.micro
            : s.tools.wire;
        let desired = Math.max(0, current.depth + delta);
        if (delta > 0 && desired > support.depth + 0.0001)
          return note(
            s,
            "Avanço limitado: o sistema de suporte precisa alcançar essa posição no modelo.",
            true,
          );
        if (
          delta > 0 &&
          current.depth > commonLength(n, current, support) + 0.001
        )
          return note(
            s,
            "Trajetórias divergentes: recue o instrumento antes de trocar de ramo.",
            true,
          );
        const track: Track =
          delta > 0
            ? { path: [...support.path], depth: desired }
            : { ...current, depth: desired };
        if (s.active === "device") {
          if (s.device!.detached)
            return note(
              s,
              "Dispositivo destacado: carregue um novo para continuar.",
              true,
            );
          let d = { ...s.device!, track };
          let clot = s.clot;
          if (
            delta < 0 &&
            d.family === "retriever" &&
            d.captured &&
            s.clot &&
            locate(n, track).edge.startsWith("ICA-")
          ) {
            clot = false;
            result = note(
              s,
              "Trombo removido no modelo simplificado. Adquira nova imagem para avaliar enchimento.",
            );
          }
          result = { ...result, device: d, clot, attempts: s.attempts + 1 };
        } else
          result = {
            ...s,
            tools: { ...s.tools, [s.active]: track },
            attempts: s.attempts + 1,
          };
      }
      if (
        !s.pedal &&
        s.acquiring <= 0 &&
        s.log.at(-1)?.message !== "Movimento sem fluoroscopia ativa."
      )
        result = note(result, "Movimento sem fluoroscopia ativa.", true);
      return result;
    }
    case "inject": {
      const origin = locate(n, s.tools.catheter);
      if (s.tools.catheter.depth < 1)
        return note(
          s,
          "Avance o cateter antes de injetar contraste virtual.",
          true,
        );
      return note(
        {
          ...s,
          contrast: { edge: origin.edge, at: s.clock },
          injections: s.injections + 1,
          acquiring: s.mode === "dsa" ? 4 : s.acquiring,
          runs:
            s.mode === "dsa"
              ? [...s.runs, { territory: origin.edge, time: s.clock }]
              : s.runs,
        },
        `Contraste virtual: ${n[origin.edge].name}.`,
      );
    }
    case "mask": {
      const edges = opacifiedEdges(s, n);
      if (!edges.length)
        return note(
          s,
          "Não há imagem contrastada para capturar a máscara.",
          true,
        );
      return note(
        {
          ...s,
          mask: {
            view: { ...s.view },
            edges,
            clot: s.clot,
            dilation: s.dilation,
          },
          mode: "roadmap",
        },
        "Máscara de roadmap capturada nesta projeção.",
      );
    }
    case "load": {
      return note(
        {
          ...s,
          device: {
            family: a.family,
            track: { path: ["access"], depth: 0 },
            open: 0,
            detached: false,
            captured: false,
          },
          active: "device",
        },
        `${families[a.family]} carregado. Avance pelo sistema de suporte.`,
      );
    }
    case "open": {
      if (!s.device || s.device.detached)
        return note(s, "Não há dispositivo ativo para manipular.", true);
      const d = { ...s.device, open: clamp(s.device.open + a.delta, 0, 1) },
        at = locate(n, d.track);
      let out = { ...s, device: d };
      if (
        d.family === "retriever" &&
        s.clot &&
        at.edge === c.target &&
        at.t >= c.targetT &&
        d.open > 0.6
      )
        out.device = { ...d, captured: true };
      if (d.family === "balloon" && nearTarget(s, n, d.track) && d.open > 0.5)
        out.dilation = Math.max(s.dilation, d.open * 0.75);
      if (
        d.family === "protection" &&
        at.edge === c.target &&
        at.t > c.targetT &&
        d.open > 0.6
      )
        out.protected = true;
      if (d.family === "stent" && nearTarget(s, n, d.track) && d.open >= 1) {
        out.stented = true;
        out.dilation = Math.max(out.dilation, 0.85);
        if (!s.protected)
          out = note(
            out,
            "Expansão sem proteção distal registrada no cenário.",
            true,
          );
      }
      return out;
    }
    case "detach": {
      if (
        s.device &&
        !["coil", "stent", "flow-diverter"].includes(s.device.family)
      )
        return note(
          s,
          "Esta família não é destacável; recolha ou remova o dispositivo.",
          true,
        );
      if (!s.device || s.device.open < 0.5 || s.device.detached)
        return note(s, "Abra o dispositivo antes de destacá-lo.", true);
      const d = s.device,
        at = locate(n, d.track);
      let out = {
        ...s,
        device: { ...d, detached: true },
        implants: [
          ...s.implants,
          { family: d.family, track: { ...d.track }, amount: d.open },
        ],
      };
      if (d.family === "coil") {
        if (at.edge === "sac") {
          out.coilFill = s.coilFill + 1;
          out = note(
            out,
            "Coil destacado no saco; ocupação gráfica atualizada.",
          );
        } else {
          out.parentCompromised = true;
          out = note(
            out,
            "Coil destacado fora do saco: comprometimento parental no exercício.",
            true,
          );
        }
      }
      if (d.family === "stent" && nearTarget(s, n, d.track)) {
        out.stented = true;
        out.dilation = Math.max(out.dilation, 0.85);
      }
      return out;
    }
    case "aspirate":
      return s.device?.family === "aspiration" ||
        s.device?.family === "retriever"
        ? { ...s, aspirating: !s.aspirating }
        : note(
            s,
            "Carregue um cateter de aspiração ou sistema de retriever.",
            true,
          );
    case "tick": {
      const dt = clamp(a.dt, 0, 0.5);
      let out = {
        ...s,
        clock: s.clock + dt,
        exposure: s.exposure + (s.pedal || s.acquiring > 0 ? dt : 0),
        acquiring: Math.max(0, s.acquiring - dt),
      };
      if (
        s.aspirating &&
        s.clot &&
        s.device?.family === "aspiration" &&
        nearTarget(s, n, s.device.track, 0.18)
      )
        out = note(
          { ...out, clot: false },
          "Trombo removido por aspiração no modelo simplificado.",
        );
      return out;
    }
    case "finish":
      return note(
        {
          ...s,
          completed: true,
          pedal: false,
          aspirating: false,
          acquiring: 0,
        },
        goalMet(s)
          ? "Sessão encerrada: objetivo gráfico atingido."
          : "Sessão encerrada: objetivo gráfico ainda incompleto.",
      );
  }
}
