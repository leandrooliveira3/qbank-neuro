import { reconstructedVessels } from "./reconstructedVessels";
import { openAnatomy } from "./openAnatomy";

export interface CoverageItem {
  name: string; status: "present" | "partial" | "missing" | "reconstructed"; ids: string[]; note: string; reference: string;
}
const items: { name: string; ids: string[]; note: string; reference: string; partial?: boolean }[] = [
  { name: "Artéria oftálmica", ids: ["ophthalmic_artery_l", "ophthalmic_artery_r"], note: "Malhas presentes. Origem, cruzamento do nervo óptico e variantes ainda precisam de confronto por imagens.", reference: "Krings, casos 7–8; Neuroangio: Ophthalmic artery" },
  { name: "Artéria central da retina", ids: ["central_retinal_artery_l", "central_retinal_artery_r"], note: "Identificada no inventário. O trajeto intraneural não foi validado.", reference: "Krings, caso 8" },
  { name: "Artérias ciliares posteriores", ids: ["short_posterior_ciliary_arteries_l", "long_posterior_ciliary_arteries_l"], note: "Grupos de malhas identificados; contagem e distribuição individual são variáveis e ainda não foram revistas.", reference: "Krings, caso 8" },
  { name: "Artérias etmoidais", ids: ["anterior_ethmoidal_artery_l", "posterior_ethmoidal_artery_l"], note: "Malhas presentes. Anastomoses com território da ACE ainda não estão conectadas ao simulador.", reference: "Krings, caso 8; Neuroangio: Ophthalmic artery" },
  { name: "Artéria meníngea média", ids: ["middle_meningeal_artery_l", "middle_meningeal_artery_r"], note: "Artéria principal identificada. Ramos petroso e cavernoso e anastomoses orbitárias precisam ser acrescentados/revistos.", reference: "Neuroangio: Middle meningeal artery", partial: true },
  { name: "Tronco meningohipofisário", ids: ["meningohypophyseal_trunk_l", "meningohypophyseal_trunk_r"], note: "Reconstrução didática bilateral ancorada na ACI. Óstio, calibre e relações finas aproximados; não navegável por instrumentos.", reference: "Krings, caso 5; Neuroangio: Meningohypophyseal trunk" },
  { name: "Tronco inferolateral", ids: ["inferolateral_trunk_l", "inferolateral_trunk_r"], note: "Reconstrução didática bilateral ancorada na ACI. Óstio, calibre e relações finas aproximados; não navegável por instrumentos.", reference: "Krings, caso 5; Neuroangio: Inferolateral trunk" },
  { name: "Artéria coroidea anterior", ids: ["anterior_choroidal_artery_l", "anterior_choroidal_artery_r"], note: "Reconstrução didática bilateral ancorada na ACI. Óstio, calibre e relações finas aproximados; não navegável por instrumentos.", reference: "Krings, caso 9; Neuroangio: Anterior choroidal artery" },
  { name: "Anéis durais e carotid cave", ids: [], note: "Sem superfícies específicas. Não inferir compartimento intra/extradural pela origem da oftálmica ou somente pelo osso.", reference: "Krings, caso 6, pp. 27–28; Bouthillier C1–C7" },
  { name: "Nervo óptico e oculomotor", ids: ["optic_nerve_ii_l", "oculomotor_nerve_iii_l"], note: "Malhas presentes. Relações com ACI, canal óptico, clinoide e dura fina ainda pendentes de revisão.", reference: "Krings, caso 6" },
  { name: "Seio cavernoso", ids: ["cavernous_sinus_l", "cavernous_sinus_r"], note: "Compartimento venoso presente. Paredes, plexos e relações com nervos não foram homologados.", reference: "Krings, caso 33" },
  { name: "Circulação medular", ids: [], note: "O recorte atual é de cabeça/pescoço. A matriz medular exige um conjunto próprio de malhas e conexões.", reference: "Krings, casos 39–43" },
];
export const coverageReview: CoverageItem[] = items.map((item) => ({ ...item,
  status: item.ids.length && item.ids.every((id) => reconstructedVessels.some((branch) => branch.id === id)) ? "reconstructed" : !item.ids.length ? "missing" : item.partial || item.ids.some((id) => !openAnatomy.structures.some((structure) => structure.id === id)) ? "partial" : "present",
}));
export const coverageStatus = { present: "Malha identificada", partial: "Cobertura parcial", missing: "Ainda ausente", reconstructed: "Reconstrução didática · não validada" };
