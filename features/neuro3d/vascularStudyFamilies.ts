import {vascularCompleteness} from "./vascularCompleteness";
import {venousCoverage} from "./vascularReview";
import {maxillaryBranchReview} from "./maxillaryReview";
import {reconstructedVessels} from "./reconstructedVessels";

/** Study membership only: a named branch/territory or upstream venous pathway.
 * These relations NEVER modify the navigation/contrast graph or join surfaces.
 * Variable origins and alternative drainage remain individual-review questions.
 */
export const vascularBaseId=(id:string)=>id.replace(/^(left|right)_/,"").replace(/_[lr]$/,"");
const sideOf=(id:string)=>id.endsWith("_l") || id.startsWith("left_") ? "l" : id.endsWith("_r") || id.startsWith("right_") ? "r" : null;
const branches:Record<string,string[]>={
  common_carotid_artery:["internal_carotid_artery","external_carotid_artery"],
  external_carotid_artery:["superior_thyroid_artery","ascending_pharyngeal_artery","lingual_artery","facial_artery","occipital_artery","posterior_auricular_artery","maxillary_artery","superficial_temporal_artery"],
  internal_carotid_artery:["meningohypophyseal_trunk","inferolateral_trunk","superior_hypophyseal_arteries","capsular_artery_of_mcconnell","ophthalmic_artery","anterior_choroidal_artery","posterior_communicating_artery","anterior_cerebral_artery","middle_cerebral_artery_m1_segment"],
  inferior_alveolar_artery:["mental_branch_of_inferior_alveolar_artery","mylohyoid_branch_of_inferior_alveolar_artery"],
  infra_orbital_artery:["anterior_superior_alveolar_artery","middle_superior_alveolar_artery"],
  descending_palatine_artery:["greater_palatine_artery","lesser_palatine_artery"],
  sphenopalatine_artery:["posterior_septal_branches_of_sphenopalatine_artery","posterior_lateral_nasal_branches_of_sphenopalatine_artery"],
  middle_meningeal_artery:["frontal_branch_of_middle_meningeal_artery","parietal_branch_of_middle_meningeal_artery","petrosal_branch_of_middle_meningeal_artery","petrosquamosal_branch_of_middle_meningeal_artery","cavernous_branch_of_middle_meningeal_artery","sphenoid_ridge_branch"],
  facial_artery:["ascending_palatine_artery","tonsillar_branch_of_facial_artery","submental_artery","angular_artery","inferior_labial_artery","superior_labial_artery"],
  superficial_temporal_artery:["frontal_branch_of_superficial_temporal_artery","parietal_branch_of_superficial_temporal_artery","transverse_facial_artery"],
  ophthalmic_artery:["central_retinal_artery","short_posterior_ciliary_arteries","long_posterior_ciliary_arteries","lacrimal_artery","anterior_ethmoidal_artery","posterior_ethmoidal_artery","supra_orbital_artery","supratrochlear_artery"],
  anterior_ethmoidal_artery:["anterior_septal_branches_of_anterior_ethmoidal_artery"],
  posterior_ethmoidal_artery:["septal_branches_of_posterior_ethmoidal_artery"],
  anterior_cerebral_artery:["pericallosal_artery","callosomarginal_artery","orbitofrontal_branches_of_anterior_cerebral_artery","recurrent_artery_of_heubner","medial_lenticulostriate_arteries","frontopolar_artery","anterior_internal_frontal_artery","middle_internal_frontal_artery","posterior_internal_frontal_artery","paracentral_artery","superior_internal_parietal_artery","inferior_internal_parietal_artery"],
  callosomarginal_artery:["frontal_branches_of_callosomarginal_artery"],
  anterior_communicating_artery:["subcallosal_artery"],
  posterior_communicating_artery:["anterior_thalamoperforating_arteries"],
  anterior_choroidal_artery:["anterior_choroidal_artery_plexal_branches","anterior_choroidal_artery_cisternal_perforators"],
  posterior_cerebral_artery:["medial_occipital_artery","lateral_occipital_artery","parieto_occipital_artery","posterior_thalamoperforating_arteries","thalamogeniculate_arteries","medial_posterior_choroidal_artery","lateral_posterior_choroidal_artery","anterior_temporal_branch_of_pca","middle_temporal_branches_of_pca","posterior_temporal_branch_of_pca","calcarine_artery","posterior_pericallosal_artery"],
  vertebral_artery:["posterior_inferior_cerebellar_artery","anterior_spinal_artery","posterior_spinal_artery","lateral_spinal_artery","anterior_meningeal_branch_of_vertebral_artery","posterior_meningeal_artery"],
  basilar_artery:["posterior_cerebral_artery","superior_cerebellar_artery","anterior_inferior_cerebellar_artery","lateral_pontine_branches_of_basilar_artery","medial_pontine_branches_of_basilar_artery"],
  posterior_inferior_cerebellar_artery:["medial_branch_of_pica","lateral_branch_of_pica","perforating_branches_of_pica","choroidal_branches_of_pica"],
  anterior_inferior_cerebellar_artery:["labyrinthine_artery","subarcuate_artery","perforating_branches_of_aica","cortical_branches_of_aica"],
  superior_cerebellar_artery:["vermian_branch_of_superior_cerebellar_artery","hemispheric_branch_of_superior_cerebellar_artery","perforating_branches_of_superior_cerebellar_artery"],
  subclavian_artery:["vertebral_artery","thyrocervical_trunk","costocervical_trunk"],
  thyrocervical_trunk:["inferior_thyroid_artery","ascending_cervical_artery","transverse_cervical_artery"],
  costocervical_trunk:["deep_cervical_artery","supreme_intercostal_artery"],
  anterior_spinal_artery:["sulcocommissural_arteries"],
  transverse_cervical_artery:["deep_branch_of_transverse_cervical_artery","superficial_branch_of_transverse_cervical_artery"],
  internal_jugular_vein:["common_facial_vein","lingual_vein","superior_thyroid_vein"],
  common_facial_vein:["facial_vein","anterior_division_of_retromandibular_vein"],
  facial_vein:["angular_vein","superior_labial_vein","inferior_labial_veins","submental_vein"],
  external_jugular_vein:["posterior_division_of_retromandibular_vein","posterior_auricular_vein"],
  retromandibular_vein:["maxillary_veins","superficial_temporal_veins"],
  anterior_division_of_retromandibular_vein:["retromandibular_vein"],
  posterior_division_of_retromandibular_vein:["retromandibular_vein"],
};
// Keep nested distal branches under their named trunk, even if that trunk lacks a mesh.
const nested=new Set(["anterior_superior_alveolar_artery","middle_superior_alveolar_artery","greater_palatine_artery","lesser_palatine_artery","posterior_septal_branches_of_sphenopalatine_artery","posterior_lateral_nasal_branches_of_sphenopalatine_artery"]);
branches.maxillary_artery=maxillaryBranchReview.flatMap(row=>row.targets).filter(id=>!nested.has(id));
branches.middle_cerebral_artery_m1_segment=vascularCompleteness.filter(row=>row.layer === "arterial" &&
  (row.group === "ACM · divisões e ramos" || ["middle_cerebral_artery_m3_segment","insular_branches_of_middle_cerebral_artery_m2","parietal_branches_of_middle_cerebral_artery","temporal_branches_of_middle_cerebral_artery","postcentral_arterial_branch","anterior_temporal_branch_of_mca","artery_of_central_sulcus","artery_of_precentral_sulcus","arterial_branch_to_angular_gyrus","distal_lateral_striate_branches","lateral_frontobasal_artery","posterior_parietal_artery","posterior_temporal_branch_of_mca","prefrontal_artery","proximal_lateral_striate_branches","temporo_occipital_branch_of_mca"].includes(row.id))).map(row=>row.id);
const append=(parent:string,child:string)=>{ branches[parent] ??=[]; if(!branches[parent].includes(child)) branches[parent].push(child); };
for(const row of reconstructedVessels) append(vascularBaseId(row.parentId),vascularBaseId(row.id));
// Collectors point to reference upstream pathways for visual study, including alternatives.
for(const row of venousCoverage) for(const target of row.drainageTargets) append(target,row.id);

export const vascularStudyRelations=Object.entries(branches).flatMap(([parent,children])=>children.map(child=>({parent,child,geometryConnectionVerified:false as const})));
const byBase=new Map(vascularCompleteness.map(row=>[row.id,row]));
export function vascularStudyFamily(selectedId:string) {
  const root=vascularBaseId(selectedId),side=sideOf(selectedId),visited=new Set<string>(),queue=[root];
  while(queue.length) {
    const id=queue.shift()!; if(visited.has(id)) continue;
    visited.add(id); queue.push(...(branches[id] ?? []));
  }
  const rows=[...visited].flatMap(id=>{
    const row=byBase.get(id); if(!row) return [];
    const expectedIds=row.expectedIds.filter(id=>!side || !sideOf(id) || sideOf(id) === side);
    const ids=row.ids.filter(id=>expectedIds.includes(id));
    return [{...row,expectedIds,ids,missingIds:expectedIds.filter(id=>!ids.includes(id)),root:id === root}];
  });
  const ids=new Set(rows.flatMap(row=>row.ids));
  const contextIds=new Set<string>();
  // Existing didactic branches retain the ipsilateral carotid context.
  const reconstructed=reconstructedVessels.find(row=>row.id === selectedId);
  if(reconstructed) {contextIds.add(reconstructed.rootId);if(reconstructed.rootId.startsWith("external_")) contextIds.add(reconstructed.rootId.replace("external_","internal_"));}
  for(const [parent,children] of Object.entries(branches)) if(children.includes(root)) {
    const row=byBase.get(parent);
    row?.ids.filter(id=>!side || !sideOf(id) || sideOf(id) === side).forEach(id=>contextIds.add(id));
  }
  return {root,side,rows,ids,contextIds,hasBranches:visited.size>1,
    missingIds:rows.flatMap(row=>row.missingIds),
    relationNote:rows[0]?.layer === "venous" ? "Vias tributárias usuais ou alternativas de referência; não se presume coexistência, direção de fluxo neste modelo ou continuidade geométrica." : "Ramos e territórios de estudo. Origens variáveis e relações ainda não homologadas; o agrupamento não comprova continuidade geométrica nem cria caminhos de cateter."};
}

export function hiddenOutsideStudyFamily(root:string,structures:readonly {id:string}[],manual:ReadonlySet<string>) {
  const family=vascularStudyFamily(root);
  return new Set([...manual,...structures.filter(row=>!family.ids.has(row.id) && !family.contextIds.has(row.id)).map(row=>row.id)]);
}
