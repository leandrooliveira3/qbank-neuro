import raw from "../../reference-network.json";
import type { Network, P3, Vessel } from "./network";
import { distance, edgeLength, pointAt } from "./network";

export function makeReferenceNetwork(aneurysm = false): Network {
  const network = structuredClone(raw.routes) as unknown as Network;
  if (!aneurysm) return network;
  const parent = network["ref-ICA-L"];
  const at = edgeLength(parent) * 0.85;
  const p = pointAt(parent, 0.85);
  const splitFraction = sourceFraction(parent, 0.85);
  let length = 0, index = 1;
  for (; index < parent.points.length; index++) {
    const next = length + distance(parent.points[index - 1], parent.points[index]);
    if (next >= at) break;
    length = next;
  }
  network["ref-ICA-L-distal"] = {
    ...parent, id: "ref-ICA-L-distal", name: "ACI esquerda · distal ao colo virtual",
    points: [p, ...parent.points.slice(index)], children: [...parent.children],
    sourceRange: [splitFraction, 1],
  };
  parent.points = [...parent.points.slice(0, index), p];
  parent.sourceRange = [parent.sourceRange?.[0] ?? 0, splitFraction];
  parent.children = ["ref-ICA-L-distal", "sac"];
  network.sac = {
    id: "sac", name: "Saco aneurismático virtual", anatomicalId: "lesion-aneurysm",
    points: [p, [p[0] - 0.65, p[1] + 0.1, p[2] + 0.3], [p[0] - 1.2, p[1] + 0.5, p[2] + 0.4]] as P3[],
    radius: 0.48, children: [], synthetic: true,
  };
  return network;
}

export function sourceFraction(vessel: Vessel, fraction: number) {
  const length = edgeLength(vessel);
  const junction = vessel.junctionGapCm ?? 0;
  const t = Math.max(0, Math.min(1, (fraction * length - junction) / Math.max(0.001, length - junction)));
  const [start, end] = vessel.sourceRange ?? [0, 1];
  return start + (end - start) * t;
}
