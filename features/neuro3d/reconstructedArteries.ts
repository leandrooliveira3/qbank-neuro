import { CatmullRomCurve3, Vector3 } from "three";
import axes from "./reference-network.json";
import { vesselSurface } from "./simulation/station/surfaces";
import type { P3, Vessel } from "./simulation/station/network";

/** Original educational reconstructions in the source frame (cm).
 * ICA anchor indices are explicitly versioned against reference-network.json.
 * These are NOT segmentations, validated anastomoses or device routes.
 */
const source = axes.originalAxes.internal_carotid_artery_l.points as P3[];
const mhtSource = "https://neuroangio.org/anatomy-and-variants/meningohypophyseal-trunk/";
const iltSource = "https://neuroangio.org/anatomy-and-variants/inferolateral-trunk/";
const achSource = "https://neuroangio.org/anatomy-and-variants/anterior-choroidal-artery/";
interface Template { id: string; name: string; parent: string; anchor: number; radius: number; points: P3[]; reference: string }
const templates: Template[] = [
  { id: "meningohypophyseal_trunk", name: "Tronco meningohipofisário", parent: "internal_carotid_artery", anchor: 111, radius: 0.045,
    points: [source[111], [1.8, -2.1, 0.2], [1.55, -1.9, -0.1]], reference: mhtSource },
  { id: "inferior_hypophyseal_artery", name: "Artéria hipofisária inferior", parent: "meningohypophyseal_trunk", anchor: 111, radius: 0.025,
    points: [[1.55, -1.9, -0.1], [1.1, -1.8, 0.1], [0.45, -1.6, 0.35], [0.12, -1.55, 0.3]], reference: mhtSource },
  { id: "medial_clival_branch", name: "Ramo clival medial do MHT", parent: "meningohypophyseal_trunk", anchor: 111, radius: 0.025,
    points: [[1.55, -1.9, -0.1], [1.1, -2.1, -0.35], [0.7, -2.9, -0.5], [0.35, -3.5, -0.6]], reference: mhtSource },
  { id: "marginal_tentorial_artery", name: "Artéria tentorial marginal · Bernasconi-Cassinari", parent: "meningohypophyseal_trunk", anchor: 111, radius: 0.035,
    points: [[1.55, -1.9, -0.1], [1.7, -1.3, -0.8], [2, -0.8, -2.1], [1.8, -0.2, -3.7], [0.7, 0.5, -5]], reference: mhtSource },
  { id: "inferolateral_trunk", name: "Tronco inferolateral", parent: "internal_carotid_artery", anchor: 125, radius: 0.04,
    points: [source[125], [1.95, -2.1, 1.5], [2.35, -2.4, 1.35]], reference: iltSource },
  { id: "foramen_rotundum_branch", name: "Ramo do forame redondo do ILT", parent: "inferolateral_trunk", anchor: 125, radius: 0.025,
    points: [[2.35, -2.4, 1.35], [2.55, -2.7, 1.9], [2.7, -3.1, 2.5]], reference: iltSource },
  { id: "foramen_ovale_branch", name: "Ramo do forame oval do ILT", parent: "inferolateral_trunk", anchor: 125, radius: 0.025,
    points: [[2.35, -2.4, 1.35], [2.7, -2.9, 0.8], [3.05, -3.45, 0.45]], reference: iltSource },
  { id: "anteromedial_ilt_branch", name: "Ramo anteromedial do ILT", parent: "inferolateral_trunk", anchor: 125, radius: 0.025,
    points: [[2.35, -2.4, 1.35], [2.1, -2, 2], [1.95, -1.6, 2.8]], reference: iltSource },
  { id: "anterior_choroidal_artery", name: "Artéria coroidea anterior", parent: "internal_carotid_artery", anchor: 153, radius: 0.055,
    points: [source[153], [1.65, -0.05, 1.7], [1.9, -0.2, 0.5], [2, -0.3, -0.7], [2.35, -0.05, -1.8], [2.7, 0.6, -2.7], [2.9, 1.2, -3.4]], reference: achSource },
];
export const reconstructedArteries = (["l", "r"] as const).flatMap((side) => templates.map((template) => {
  const sign = side === "l" ? 1 : -1;
  const points = template.points.map(([x, y, z]) => [sign * x, y, z] as P3);
  const id = `${template.id}_${side}`;
  const smooth = new CatmullRomCurve3(points.map((point) => new Vector3(...point)), false, "centripetal").getPoints(96).map((point) => point.toArray() as P3);
  const vessel: Vessel = { id, name: template.name, anatomicalId: id, points: smooth,
    radius: template.radius, children: [], synthetic: true };
  const surface = vesselSurface(vessel, (t) => template.radius * (1 - 0.55 * t), 1, 48, 16);
  const sourceArc = source.slice(1).map((point, i) => Math.hypot(...point.map((value, k) => value - source[i][k])));
  const rootFraction = sourceArc.slice(0, template.anchor).reduce((sum, value) => sum + value, 0) / sourceArc.reduce((sum, value) => sum + value, 0);
  const min = [0, 1, 2].map((k) => Math.min(...smooth.map((p) => p[k])) - template.radius);
  const max = [0, 1, 2].map((k) => Math.max(...smooth.map((p) => p[k])) + template.radius);
  const toSource = (p: number[]) => [p[0] / 100, (p[1] + 160) / 100, p[2] / 100];
  return { id, name: `${template.name} ${side === "l" ? "esquerda" : "direita"}`, latin: template.id.replaceAll("_", " "),
    layer: "arterial", path: ["Reconstruções didáticas", "ACI", side === "l" ? "Esquerda" : "Direita"],
    bounds: [toSource(min), toSource(max)], surface, points, parentId: `${template.parent}_${side}`,
    rootId: `internal_carotid_artery_${side}`, anchorIndex: template.anchor, rootFraction,
    reference: template.reference, status: "reconstructed-unvalidated" as const,
    note: "Trajeto e calibre ilustrativos, ancorados na ACI da base. Simetria bilateral construída; relações finas e óstios não validados. Não navegável por instrumentos.",
  };
}));
