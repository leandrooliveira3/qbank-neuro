import type { StationState } from "./engine";
import { Network, P3, locate, trackPoints } from "./network";
export function instrumentPoints(
  s: StationState,
  n: Network,
  tool: "wire" | "catheter" | "micro",
): P3[] {
  const track = s.tools[tool],
    points = trackPoints(n, track);
  if (points.length < 3 || track.depth < 0.1) return points;
  const at = locate(n, track),
    vessel = n[at.edge];
  const supported = tool !== "wire" && s.tools.wire.depth > track.depth + 0.4;
  const desired =
    tool === "wire"
      ? s.wireKind === "Microguia"
        ? 0.07
        : 0.18
      : tool === "catheter"
        ? s.catheterShape.includes("Simmons")
          ? 0.7
          : s.catheterShape.includes("JR")
            ? 0.35
            : 0.12
        : 0.05;
  const amplitude = s.geometry === "reference"
    ? (supported ? 0 : Math.min(desired, vessel.radius * 0.25, 0.04))
    : supported ? 0.015 : Math.min(desired, vessel.radius * 0.8);
  const angle = (s.rotation * Math.PI) / 180,
    start = Math.max(0, points.length - 9);
  return points.map((p, i) => {
    if (i < start) return p;
    const t = (i - start) / Math.max(1, points.length - 1 - start);
    const bend =
      (tool === "catheter" && s.catheterShape.includes("Simmons")
        ? Math.sin(t * Math.PI * 1.65)
        : Math.sin(t * Math.PI * 0.8)) * amplitude;
    return [
      p[0] + Math.cos(angle) * bend,
      p[1],
      p[2] + Math.sin(angle) * bend,
    ] as P3;
  });
}
export function contactEstimate(s: StationState, n: Network) {
  if (s.active === "device") return 0;
  const at = locate(n, s.tools[s.active]),
    r = n[at.edge].radius;
  const demand =
    s.active === "wire"
      ? s.wireKind === "Microguia"
        ? 0.07
        : 0.18
      : s.active === "catheter"
        ? s.catheterShape.includes("Simmons")
          ? 0.7
          : 0.2
        : 0.05;
  return Math.max(0, Math.min(1, (demand - r * 0.8) / (demand || 1)));
}
