import {sourceStructures, openAnatomy} from "./openAnatomy";
import {reconstructedArteries} from "./reconstructedArteries";
import {diagramRegistry} from "./anatomicalInventory";
import {venousCoverage} from "./vascularReview";
import {maxillaryBranchReview} from "./maxillaryReview";
import {vascularFindings} from "./vascularFindings";

type Layer = "arterial" | "venous";
interface Requirement {
  id:string; name:string; layer:Layer; group:string; expectedIds:string[];
  references:string[]; note:string;
}
const arterial = "https://neuroangio.org/anatomy-and-variants/";
const venous = "https://neuroangio.org/venous-brain-anatomy/";
const requirements = new Map<string,Requirement>();
const keyOf = (id:string) => id.replace(/^(right|left)_/, "").replace(/_[lr]$/, "");
const pair = (id:string) => [`${id}_l`,`${id}_r`];
function add(row:Requirement) {
  const key = `${row.layer}:${row.id}`, previous = requirements.get(key);
  requirements.set(key, {...row,
    expectedIds:[...new Set([...(previous?.expectedIds ?? []),...row.expectedIds])],
    references:[...new Set([...(previous?.references ?? []),...row.references])],
  });
}

// Begin with EVERY supplied vascular identity. Unclassified records stay visible;
// a diagram omission must never erase a source vessel from the completeness review.
for (const item of [...sourceStructures,...reconstructedArteries]) {
  if (item.layer !== "arterial" && item.layer !== "venous") continue;
  const id=keyOf(item.id);
  add({id,name:item.name.replace(/\s+(esquerda|direita|esquerdo|direito)$/i,""),layer:item.layer,
    group:"Fonte · classificação individual pendente",expectedIds:[item.id],
    references:[item.layer === "arterial" ? arterial : venous],
    note:"Identidade da fonte contabilizada. Nome, origem/drenagem, trajeto e relações ainda precisam de conferência individual."});
}
const midline = new Set(["aortic_arch","brachiocephalic_trunk","basilar_artery","anterior_communicating_artery"]);
for (const row of diagramRegistry.entries) {
  // Figure-only labels without identity remain unresolved in Inventário, not invented here.
  if (row.kind === "figure-label" || row.kind === "source-conflict") continue;
  for (const target of row.targets) add({id:keyOf(target),name:row.targets.length === 1 ? row.label : target,
    layer:"arterial",group:"Índice arterial Neuroangio",
    expectedIds:/^(right|left)_/.test(target) || midline.has(target) ? [target] : pair(target),
    references:[arterial],note:`Legenda ${row.number}. ${row.note} Presença do tronco não comprova cobertura dos ramos.`});
}
for (const row of venousCoverage) add({id:row.id,name:row.name,layer:"venous",group:row.group,
  expectedIds:row.paired ? pair(row.id) : [row.id],references:[row.reference],
  note:"Conferir tributárias, destino, comunicações, variantes e fases da injeção. Ausência de malha individual não significa ausência no paciente."});
for (const row of maxillaryBranchReview) for (const target of row.targets) add({id:target,
  name:row.targets.length === 1 ? row.name : target,layer:"arterial",group:`Maxilar · ${row.segment.toLowerCase()}`,
  expectedIds:pair(target),references:[row.reference],note:row.note});

type Branch = [id:string,name:string];
function branches(group:string, reference:string, rows:Branch[], note:string) {
  for (const [id,name] of rows) add({id,name,layer:"arterial",group,expectedIds:pair(id),references:[reference],note});
}
const variability = "Nomes e territórios não impõem um padrão universal de origem ou número de ramos. Conferir configuração individual; um grupo terminal não substitui tronco, perfurantes ou segmentos não identificados.";
branches("ACA · ramos e perfurantes",`${arterial}anterior-cerebral-artery/`,[
  ["recurrent_artery_of_heubner","Artéria recorrente de Heubner"],
  ["medial_lenticulostriate_arteries","Artérias lenticuloestriadas mediais"],
  ["frontopolar_artery","Artéria frontopolar"],
  ["anterior_internal_frontal_artery","Artéria frontal interna anterior"],
  ["middle_internal_frontal_artery","Artéria frontal interna média"],
  ["posterior_internal_frontal_artery","Artéria frontal interna posterior"],
  ["paracentral_artery","Artéria paracentral"],
  ["superior_internal_parietal_artery","Artéria parietal interna superior"],
  ["inferior_internal_parietal_artery","Artéria parietal interna inferior"],
],variability);
add({id:"subcallosal_artery",name:"Artéria subcalosa e espectro caloso mediano",layer:"arterial",group:"ACoA · perfurantes",
  expectedIds:["subcallosal_artery"],references:[`${arterial}anterior-cerebral-artery/`],
  note:"Origem, número e extensão variáveis no complexo comunicante anterior. Não preencher com as pericalosas já presentes nem exigir um tronco bilateral."});
branches("ACM · divisões e ramos",`${arterial}middle-cerebral-artery/`,[
  ["middle_cerebral_artery_m2_superior_division","ACM · divisão superior M2"],
  ["middle_cerebral_artery_m2_inferior_division","ACM · divisão inferior M2"],
  ["middle_cerebral_artery_m4_cortical_branches","ACM · ramos corticais M4 individualizados"],
],"Os rótulos da fonte ‘ramos insulares M2’ e ‘segmento M3’ não homologam por si as divisões, limites segmentares ou cada ramo cortical. " + variability);
branches("ACoP · perfurantes","Borden, capítulo Intracranial vertebral-basilar circulation, pp. 164–166",[
  ["anterior_thalamoperforating_arteries","Artérias talamoperfurantes anteriores · ACoP"],
],variability);
branches("ACP · perfurantes, coroideas e córtex","Borden, capítulo Intracranial vertebral-basilar circulation, pp. 164–166",[
  ["posterior_thalamoperforating_arteries","Artérias talamoperfurantes posteriores · P1"],
  ["thalamogeniculate_arteries","Artérias talamogeniculadas"],
  ["medial_posterior_choroidal_artery","Artéria coroidea posterior medial"],
  ["lateral_posterior_choroidal_artery","Artéria coroidea posterior lateral"],
  ["anterior_temporal_branch_of_pca","Ramo temporal anterior da ACP"],
  ["middle_temporal_branches_of_pca","Ramos temporais médios da ACP"],
  ["posterior_temporal_branch_of_pca","Ramo temporal posterior da ACP"],
  ["calcarine_artery","Artéria calcarina"],
  ["posterior_pericallosal_artery","Artéria pericalosa posterior · esplenial"],
],"Os rótulos occipitais medial/lateral da fonte não são automaticamente equivalentes a cada ramo cortical nomeado. " + variability);
branches("ACI · ramos hipofisários e coroideos",arterial,[
  ["superior_hypophyseal_arteries","Artérias hipofisárias superiores"],
  ["capsular_artery_of_mcconnell","Artéria capsular de McConnell"],
  ["anterior_choroidal_artery_plexal_branches","Coroidea anterior · ramos plexais"],
  ["anterior_choroidal_artery_cisternal_perforators","Coroidea anterior · perfurantes cisternais"],
],variability);
branches("Cerebelo e tronco · ramos","Borden, capítulo Intracranial vertebral-basilar circulation, pp. 162–166",[
  ["medial_branch_of_pica","PICA · divisão medial / vermiana"],
  ["lateral_branch_of_pica","PICA · divisão lateral / hemisférica"],
  ["perforating_branches_of_pica","PICA · perfurantes bulbares"],
  ["choroidal_branches_of_pica","PICA · ramos coroideos"],
  ["labyrinthine_artery","Artéria labiríntica · origem variável"],
  ["subarcuate_artery","Artéria subarqueada"],
  ["perforating_branches_of_aica","AICA · perfurantes"],
  ["cortical_branches_of_aica","AICA · ramos corticais"],
  ["vermian_branch_of_superior_cerebellar_artery","ACS · ramos vermianos"],
  ["hemispheric_branch_of_superior_cerebellar_artery","ACS · ramos hemisféricos"],
  ["perforating_branches_of_superior_cerebellar_artery","ACS · perfurantes"],
  ["anterior_meningeal_branch_of_vertebral_artery","Vertebral · ramo meníngeo anterior"],
  ["posterior_meningeal_artery","Artéria meníngea posterior · origem variável"],
],variability);
branches("Cervical e medular · ramos",arterial,[
  ["ascending_cervical_artery","Artéria cervical ascendente"],
  ["posterior_spinal_artery","Artéria espinal posterior"],
  ["lateral_spinal_artery","Artéria espinal lateral"],
  ["radiculomedullary_arteries","Artérias radiculomedulares"],
  ["radiculopial_arteries","Artérias radiculopiais"],
  ["radiculomeningeal_arteries","Artérias radiculomeníngeas"],
  ["segmental_spinal_arteries","Artérias segmentares espinais"],
  ["sulcocommissural_arteries","Artérias sulcocomissurais"],
],"Matriz inicial de famílias; nível segmentar, origem e lateralidade de cada vaso exigem detalhamento. Não modelar todos os níveis por espelhamento. " + variability);
branches("ACE · ramos ainda sem identidade individual",arterial,[
  ["posterior_auricular_artery","Artéria auricular posterior"],
  ["ascending_palatine_artery","Artéria palatina ascendente"],
  ["tonsillar_branch_of_facial_artery","Ramo tonsilar da facial"],
  ["parietal_branch_of_superficial_temporal_artery","Ramo parietal da temporal superficial"],
  ["petrosal_branch_of_middle_meningeal_artery","Ramo petroso da meníngea média"],
  ["frontal_branch_of_middle_meningeal_artery","Ramo frontal da meníngea média"],
  ["parietal_branch_of_middle_meningeal_artery","Ramo parietal da meníngea média"],
  ["petrosquamosal_branch_of_middle_meningeal_artery","Ramo petrosquamoso da meníngea média"],
  ["stylomastoid_artery","Artéria estilomastóidea · origem variável"],
],"Um ramo pode estar incluído em uma malha agrupada sem identificação individual; examinar a fonte antes de reconstruir ou duplicar. " + variability);

const effective = new Map([...openAnatomy.structures,...reconstructedArteries].map(row=>[row.id,row]));
const source = new Map(sourceStructures.map(row=>[row.id,row]));
const rebuilt = new Set(reconstructedArteries.map(row=>row.id));
// Keep every diagram entry that cannot be mapped explicitly. These overlap
// named requirements and are NOT added to the unique vessel totals.
export const unmappedVascularDiagramEntries=diagramRegistry.entries.filter(row=>!row.targets.length || row.kind === "figure-label" || row.kind === "source-conflict");
/** Exact ID coverage only. No nearest-name match, parent substitution or implied lumen. */
export function resolveVascularRequirement(row:Requirement, available:ReadonlyMap<string,{layer:string}>) {
  const ids=row.expectedIds.filter(id=>available.get(id)?.layer === row.layer);
  const missingIds=row.expectedIds.filter(id=>!ids.includes(id));
  return {...row,ids,missingIds,status:ids.length === 0 ? "missing" : missingIds.length ? "partial" : "present-unverified"};
}
export const vascularCompleteness = [...requirements.values()].map(row=>({
  ...resolveVascularRequirement(row,effective),
  sourceIds:row.expectedIds.filter(id=>source.get(id)?.layer === row.layer),
  reconstructedIds:row.expectedIds.filter(id=>rebuilt.has(id)),
  findings:[...new Set(row.expectedIds.flatMap(id=>vascularFindings.has(id) ? [vascularFindings.get(id)!] : []))],
  anatomicalApproval:false,
}));
export const vascularCompletenessCounts = {
  requirements:vascularCompleteness.length,
  missing:vascularCompleteness.filter(row=>row.status === "missing").length,
  partial:vascularCompleteness.filter(row=>row.status === "partial").length,
  presentUnverified:vascularCompleteness.filter(row=>row.status === "present-unverified").length,
  missingIndividualIds:vascularCompleteness.reduce((sum,row)=>sum+row.missingIds.length,0),
};
