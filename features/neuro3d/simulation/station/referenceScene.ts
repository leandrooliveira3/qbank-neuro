import { caseFor, networkFor, StationState } from "./engine";
import { sourceFraction } from "./referenceNetwork";
import { ReferenceGeometry, routeSurface } from "./referenceGeometry";
import type { Surface } from "./surfaces";
import { sacRadius, vesselSurface } from "./surfaces";

export function referenceContrast(s: StationState, geometry: ReferenceGeometry, edges: string[]) {
  const network = networkFor(s), definition = caseFor(s), result: Surface[] = [];
  const additional = new Set<string>();
  for (const id of edges) {
    const route = network[id];
    if (!route) continue;
    if (id === "sac") { result.push(vesselSurface(route, sacRadius)); continue; }
    const source = geometry.get(route.sourceId ?? "");
    if (source) result.push(routeSurface(source, route,
      s.clot && definition.target === id ? definition.targetT : 1,
      definition.kind === "carotid" && definition.target === id
        ? { center: sourceFraction(route, definition.targetT), dilation: s.dilation } : undefined,
    ));
    if (!(s.clot && definition.target === id)) for (const branch of route.visualBranches ?? []) additional.add(branch);
  }
  for (const id of additional) { const surface = geometry.get(id); if (surface) result.push(surface); }
  return result;
}
