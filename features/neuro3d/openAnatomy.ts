import raw from "./open-anatomy.json";

import landmarks from "./landmarks.json";
import bodyAccess from "./body-access.json";
import supraAortic from "./supra-aortic.json";
import craniocervical from "./craniocervical.json";
import unindexed from "./unindexed-vessels.json";

export const openAnatomy = { ...raw, structures: [...raw.structures, ...landmarks.structures, ...supraAortic.structures, ...bodyAccess.structures, ...craniocervical.structures, ...unindexed.structures], assets: [...raw.assets, ...landmarks.assets, ...supraAortic.assets, ...bodyAccess.assets, ...craniocervical.assets, ...unindexed.assets] };
export type OpenStructure = typeof openAnatomy.structures[number];
export const openLayerNames: Record<string, string> = {
  arterial: "Artérias", venous: "Veias e seios", bone: "Crânio e coluna cervical",
  tissue: "Encéfalo e órgãos dos sentidos", nerve: "Nervos cranianos e cervicais", gland: "Glândulas", dura: "Dura-máter",
  muscle: "Músculos", ligament: "Ligamentos, fáscias e articulações", cartilage: "Cartilagens e discos",
  visceral: "Órgãos e ductos cervicofaciais", lymphatic: "Linfonodos e tonsilas", cavity: "Cavidades aéreas",
  attachment: "Áreas de inserção muscular", region: "Regiões e marcos de superfície",
};
export const initialOpacity: Record<string, number> = {
  arterial: 1, venous: 0.65, bone: 0.12, tissue: 0.08, nerve: 1, gland: 1, dura: 0.12,
  muscle: 0, ligament: 0, cartilage: 0, visceral: 0, lymphatic: 0, cavity: 0, attachment: 0, region: 0,
};
export const openAssetUrl = (file: string) => `${import.meta.env.BASE_URL}neuro3d/open-anatomy/${file}`;
export function worldPoint(point: number[]) {
  return [point[0] * 100, point[1] * 100 - 160, point[2] * 100] as [number, number, number];
}
