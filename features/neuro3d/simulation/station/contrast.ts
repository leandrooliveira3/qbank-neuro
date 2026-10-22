import { edgeLength, type Network } from "./network";

/** Directed illustrative bolus transit, in atlas cm and seconds. Not CFD. */
export function arrivalTimes(network: Network, origin: string, originT = 0) {
  const times = new Map<string, number>();
  const visit = (id: string, delay: number) => {
    if (!network[id] || (times.has(id) && times.get(id)! <= delay)) return;
    times.set(id, delay);
    const originFraction = Math.max(0, Math.min(1, originT));
    const remaining = edgeLength(network[id]) * (id === origin ? network[id].contrastReverse ? originFraction : 1 - originFraction : 1);
    for (const child of (network[id].contrastChildren ?? network[id].children)) visit(child, delay + remaining / 12);
  };
  visit(origin, 0);
  return times;
}
export function bolusConcentration(age: number, arrival = 0) {
  const local = age - arrival;
  if (!Number.isFinite(local) || local <= 0 || age >= 5) return 0;
  const rise = Math.min(1, local / 0.45);
  const fall = Math.max(0, Math.min(1, (4.8 - local) / 1.8));
  return rise * rise * (3 - 2 * rise) * fall;
}
export function bolusLabel(age: number) {
  return age < 0.45 ? "Entrada do contraste" : age < 1.7 ? "Preenchimento arterial" : age < 3.2 ? "Opacificação arterial" : age < 5 ? "Lavagem do contraste" : "Sem contraste";
}
