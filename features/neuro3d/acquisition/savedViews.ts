import type { AngiographyPose } from "../angiographyPose";
export const savedViewsKey = "qbank_neuro3d_acquisition_views_v1";
export type SavedView = {
  id: string;
  name: string;
  createdAt: string;
  pose: AngiographyPose;
};
export type ViewCollection = {
  schema: "qbank-atlas-acquisition-views";
  version: 1;
  space: "atlas-world-v1";
  projection: "orthographic";
  scope: "pose-only";
  views: SavedView[];
};
export function checkedPose(value: unknown): AngiographyPose {
  const v = value as AngiographyPose;
  if (
    !v ||
    !Number.isFinite(v.yaw) ||
    Math.abs(v.yaw) > 180 ||
    !Number.isFinite(v.pitch) ||
    Math.abs(v.pitch) > 90 ||
    !Number.isFinite(v.zoom) ||
    v.zoom < 0.1 ||
    v.zoom > 12 ||
    !Array.isArray(v.center) ||
    v.center.length !== 3 ||
    v.center.some((n) => !Number.isFinite(n) || Math.abs(n) > 100000)
  )
    throw Error("A vista contém ângulos, centro ou ampliação inválidos.");
  return { yaw: v.yaw, pitch: v.pitch, zoom: v.zoom, center: [...v.center] };
}
export function collection(views: SavedView[]): ViewCollection {
  return {
    schema: "qbank-atlas-acquisition-views",
    version: 1,
    space: "atlas-world-v1",
    projection: "orthographic",
    scope: "pose-only",
    views,
  };
}
export function parseViews(text: string): SavedView[] {
  if (text.length > 100000) throw Error("O arquivo de vistas excede 100 KB.");
  const d = JSON.parse(text);
  if (
    d?.schema !== "qbank-atlas-acquisition-views" ||
    d.version !== 1 ||
    d.space !== "atlas-world-v1" ||
    d.projection !== "orthographic" ||
    d.scope !== "pose-only" ||
    !Array.isArray(d.views) ||
    d.views.length > 50
  )
    throw Error(
      "Arquivo incompatível. Use o JSON de vistas deste atlas (até 50 vistas).",
    );
  const ids = new Set<string>();
  return d.views.map((v: SavedView) => {
    if (
      !v ||
      typeof v.id !== "string" ||
      !/^[a-zA-Z0-9_-]{1,100}$/.test(v.id) ||
      ids.has(v.id) ||
      typeof v.name !== "string" ||
      !v.name.trim() ||
      v.name.trim().length > 80 ||
      typeof v.createdAt !== "string" ||
      !/^\d{4}-\d{2}-\d{2}T/.test(v.createdAt) ||
      !Number.isFinite(Date.parse(v.createdAt))
    )
      throw Error(
        "A coleção possui nome, data ou identificador inválido/duplicado.",
      );
    ids.add(v.id);
    return {
      id: v.id,
      name: v.name.trim(),
      createdAt: v.createdAt,
      pose: checkedPose(v.pose),
    };
  });
}
export function mergeViews(
  current: SavedView[],
  incoming: SavedView[],
): SavedView[] {
  const result = [...current];
  for (const item of incoming) {
    const old = result.find((x) => x.id === item.id);
    if (old) {
      if (JSON.stringify(old) !== JSON.stringify(item))
        throw Error(
          "Uma vista importada conflita com um identificador existente. Nenhuma alteração foi aplicada.",
        );
    } else result.push(item);
  }
  if (result.length > 50)
    throw Error(
      "Limite de 50 vistas; exporte e organize sua coleção antes de importar.",
    );
  return result;
}
export function copyPose(p: AngiographyPose): AngiographyPose {
  return { ...p, center: [...p.center] };
}
export function cameraPairAfter(
  p: AngiographyPose,
  linked: boolean,
  origin: "inspection" | "acquisition",
): { inspection?: AngiographyPose; acquisition?: AngiographyPose } {
  const pose = copyPose(p);
  return linked
    ? { inspection: pose, acquisition: copyPose(pose) }
    : origin === "inspection"
      ? { inspection: pose }
      : { acquisition: pose };
}
