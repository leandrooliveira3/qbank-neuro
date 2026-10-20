import {educationalVesselIds} from "./educationalVessels";
import {openAnatomy} from "./openAnatomy";
import {reconstructedVessels} from "./reconstructedVessels";
const model=[...openAnatomy.structures,...reconstructedVessels];
/** Borden, figs 2.2–2.4 (printed pp 16–18). Named branches are requirements,
 * not a declaration that every individual has the same origin or calibre. */
const branches:[string,string,string,string[]][]=[
  ["deep-auricular","Auricular profunda","Mandibular",["deep_auricular_artery"]],
  ["anterior-tympanic","Timpânica anterior","Mandibular",["anterior_tympanic_artery"]],
  ["middle-meningeal","Meníngea média","Mandibular",["middle_meningeal_artery"]],
  ["accessory-meningeal","Meníngea acessória","Mandibular",["accessory_meningeal_artery"]],
  ["inferior-alveolar","Alveolar inferior","Mandibular",["inferior_alveolar_artery"]],
  ["anterior-deep-temporal","Temporal profunda anterior","Pterigóidea",["anterior_deep_temporal_artery"]],
  ["posterior-deep-temporal","Temporal profunda posterior","Pterigóidea",["posterior_deep_temporal_artery"]],
  ["masseteric","Massetérica","Pterigóidea",["masseteric_artery"]],
  ["pterygoid","Ramos pterigóideos","Pterigóidea",["pterygoid_branches_of_maxillary_artery"]],
  ["buccal","Bucal","Pterigóidea",["buccal_artery"]],
  ["posterior-superior-alveolar","Alveolar superior posterior","Pterigopalatina",["posterior_superior_alveolar_artery"]],
  ["infraorbital","Infraorbitária e alveolares superiores anterior/média","Pterigopalatina",["infra_orbital_artery","anterior_superior_alveolar_artery","middle_superior_alveolar_artery"]],
  ["descending-palatine","Palatina descendente e palatinas maior/menores","Pterigopalatina",["descending_palatine_artery","greater_palatine_artery","lesser_palatine_artery"]],
  ["vidian-imax","Vidian da maxilar · artéria do canal pterigóideo","Pterigopalatina",["artery_of_pterygoid_canal"]],
  ["pterygovaginal","Faríngea · pterigovaginal/palatovaginal","Pterigopalatina",["pterygovaginal_artery"]],
  ["foramen-rotundum-imax","Artéria do forame redondo · lado maxilar","Pterigopalatina",["artery_of_foramen_rotundum_from_maxillary"]],
  ["sphenopalatine","Esfenopalatina: tronco e ramos septais/nasais laterais","Pterigopalatina",["sphenopalatine_artery","posterior_septal_branches_of_sphenopalatine_artery","posterior_lateral_nasal_branches_of_sphenopalatine_artery"]],
];
export const maxillaryBranchReview=branches.map(([key,name,segment,targets])=>{
  const ids=model.filter(row=>row.layer === "arterial" && targets.some(target=>row.id === `${target}_l` || row.id === `${target}_r`)).map(row=>row.id);
  const missing=targets.filter(target=>!["l","r"].every(side=>ids.includes(`${target}_${side}`)));
  return {key,name,segment,targets,ids,illustratedIds:ids.filter(id=>educationalVesselIds.has(id)),missing,status:!ids.length ? "missing" : missing.length ? "partial" : "present-unverified",reference:"Borden, 3D Angiographic Atlas, figs. 2.2–2.4, pp. 16–18; Krings, casos 25–30",note:key === "accessory-meningeal" ? "Não equiparar automaticamente o rótulo ‘accessory branch of middle meningeal artery’ da fonte à artéria meníngea acessória com passagem pelo forame oval." : key === "vidian-imax" ? "Conferir a origem maxilar; a contribuição carotídea vidiana é outra parte do espectro e não deve ser confundida com a origem da ACE." : key === "foramen-rotundum-imax" ? "O ramo do forame redondo do ILT não substitui a contribuição da maxilar. Verificar as duas extremidades e o canal, sem unir por proximidade." : "Conferir origem, relação com mandíbula/pterigóideos/fossa pterigopalatina, ramos e conexões em projeções complementares."};
});
