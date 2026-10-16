export type Device =
  | "coil"
  | "flow-diverter"
  | "stent"
  | "balloon"
  | "retriever"
  | "aspiration"
  | "microcatheter";
export const deviceNames: Record<Device, string> = {
  coil: "Coil",
  "flow-diverter": "Diversor de fluxo",
  stent: "Stent",
  balloon: "Balão",
  retriever: "Stent retriever",
  aspiration: "Cateter de aspiração",
  microcatheter: "Microcateter",
};
export type Phase =
  "briefing" | "selection" | "navigation" | "deployment" | "debrief";
export interface Session {
  phase: Phase;
  device: Device | null;
  position: number;
  deployment: number;
  actions: number;
  checks: string[];
  events: string[];
  answers: Record<string, number>;
  startedAt: string;
}
export type Action =
  | { type: "start" }
  | { type: "device"; device: Device }
  | { type: "navigate"; position: number }
  | { type: "deploy"; amount: number }
  | { type: "check"; id: string }
  | { type: "event"; id: string }
  | { type: "answer"; id: string; answer: number }
  | { type: "next" };
export const initialSession = (): Session => ({
  phase: "briefing",
  device: null,
  position: 0,
  deployment: 0,
  actions: 0,
  checks: [],
  events: [],
  answers: {},
  startedAt: new Date().toISOString(),
});
const clamp = (n: number) =>
  Number.isFinite(n) ? Math.max(0, Math.min(100, n)) : 0;
export const requiredChecks = ["anatomy", "projection", "device"];
export function transition(s: Session, a: Action, expected: Device): Session {
  switch (a.type) {
    case "start":
      return s.phase === "briefing"
        ? { ...s, phase: "selection", actions: s.actions + 1 }
        : s;
    case "device":
      return s.phase === "selection"
        ? { ...s, device: a.device, actions: s.actions + 1 }
        : s;
    case "navigate":
      return s.phase === "navigation"
        ? { ...s, position: clamp(a.position), actions: s.actions + 1 }
        : s;
    case "deploy":
      return s.phase === "deployment"
        ? { ...s, deployment: clamp(a.amount), actions: s.actions + 1 }
        : s;
    case "check":
      return ["selection", "navigation"].includes(s.phase) &&
        requiredChecks.includes(a.id)
        ? {
            ...s,
            checks: Array.from(new Set([...s.checks, a.id])),
            actions: s.actions + 1,
          }
        : s;
    case "event":
      return ["navigation", "deployment"].includes(s.phase)
        ? {
            ...s,
            phase: "navigation",
            deployment: 0,
            checks: s.checks.filter((c) => c !== "projection"),
            events: [...s.events, a.id],
            actions: s.actions + 1,
          }
        : s;
    case "answer":
      return s.phase === "debrief" &&
        Number.isInteger(a.answer) &&
        a.answer >= 0
        ? { ...s, answers: { ...s.answers, [a.id]: a.answer } }
        : s;
    case "next":
      if (s.phase === "selection" && s.device === expected)
        return { ...s, phase: "navigation", actions: s.actions + 1 };
      if (
        s.phase === "navigation" &&
        s.position >= 72 &&
        s.position <= 88 &&
        requiredChecks.every((c) => s.checks.includes(c))
      )
        return { ...s, phase: "deployment", actions: s.actions + 1 };
      if (s.phase === "deployment" && s.deployment === 100)
        return { ...s, phase: "debrief", actions: s.actions + 1 };
      return s;
  }
}
export interface Report {
  version: 1;
  caseId: string;
  session: Session;
  completedAt: string;
}
export function isReport(value: unknown): value is Report {
  const r = value as Report;
  return (
    !!r &&
    r.version === 1 &&
    typeof r.caseId === "string" &&
    r.session?.phase === "debrief" &&
    Number.isFinite(r.session.actions) &&
    Array.isArray(r.session.checks) &&
    Array.isArray(r.session.events) &&
    r.session.answers !== null &&
    typeof r.session.answers === "object" &&
    !Array.isArray(r.session.answers) &&
    typeof r.completedAt === "string"
  );
}
