import raw from "./open-anatomy.json";

import landmarks from "./landmarks.json";
import supraAortic from "./supra-aortic.json";

export const openAnatomy = { ...raw, structures: [...raw.structures, ...landmarks.structures, ...supraAortic.structures], assets: [...raw.assets, ...landmarks.assets, ...supraAortic.assets] };
export type OpenStructure = typeof openAnatomy.structures[number];
export const openLayerNames: Record<string, string> = {
  arterial: "Artérias", venous: "Veias e seios", bone: "Crânio e coluna cervical",
  tissue: "Encéfalo e órgãos dos sentidos", nerve: "Nervos cranianos", gland: "Hipófise", dura: "Dura-máter",
};
export const initialOpacity: Record<string, number> = {
  arterial: 1, venous: 0.65, bone: 0.12, tissue: 0.08, nerve: 1, gland: 1, dura: 0.12,
};
export const openAssetUrl = (file: string) => `${import.meta.env.BASE_URL}neuro3d/open-anatomy/${file}`;
export function worldPoint(point: number[]) {
  return [point[0] * 100, point[1] * 100 - 160, point[2] * 100] as [number, number, number];
}
