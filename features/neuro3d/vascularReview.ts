import { sourceStructures, openAnatomy } from "./openAnatomy";
import { reconstructedArteries } from "./reconstructedArteries";
import { anatomicalInventory } from "./anatomicalInventory";
import { vascularQuarantine } from "./vascularQuarantine";

const venousSource = "https://neuroangio.org/venous-brain-anatomy/";
const arterialSource = "https://neuroangio.org/anatomy-and-variants/";
export const vascularChecklist = ["Identidade e lado", "Origem ou drenagem", "Trajeto e marcos", "Ramos ou tributárias", "Anastomoses e variantes", "Conferência AP/lateral/oblíquas"];

/** Every supplied vascular mesh remains represented here, including quarantined originals.
 * A source label and valid bounding box do not constitute an anatomical approval.
 */
export const vascularMeshReview = [
  ...sourceStructures.filter(item=>item.layer === "arterial" || item.layer === "venous").map(item=>({
    key:`source:${item.id}`, id:item.id, name:item.name, layer:item.layer, kind:"imported", file:item.file,
    status:vascularQuarantine.has(item.id) ? "disputed" : "pending", selectable:!vascularQuarantine.has(item.id),
    note:vascularQuarantine.get(item.id) ?? "Malha da fonte ainda sem verificação individual de origem, trajeto, ramos e conexões.",
    boundsFinite:item.bounds.flat().every(Number.isFinite),
    reference:item.layer === "venous" ? venousSource : arterialSource,
  })),
  ...reconstructedArteries.map(item=>({key:`reconstruction:${item.id}`,id:item.id,name:item.name,layer:item.layer,kind:"reconstructed",file:"geometria didática original",
    status:"pending",selectable:true,note:item.note,boundsFinite:item.bounds.flat().every(Number.isFinite),reference:item.reference})),
];

interface Required {id:string; name:string; group:string; paired:boolean; reference:string}
const venousRequirements:Required[] = [
  ["great_cerebral_vein","Veia cerebral magna · Galeno","Profundo",false],
  ["internal_cerebral_vein","Veia cerebral interna","Profundo",true],
  ["basal_vein_of_rosenthal","Veia basal · Rosenthal","Profundo",true],
  ["thalamostriate_vein","Veia talamoestriada","Profundo",true],
  ["anterior_septal_vein","Veia septal anterior","Profundo",true],
  ["posterior_septal_vein","Veia septal posterior","Profundo",true],
  ["direct_lateral_vein","Veia lateral direta","Profundo",true],
  ["anterior_caudate_vein","Veia caudada anterior","Profundo",true],
  ["longitudinal_caudate_vein","Veia caudada longitudinal","Profundo",true],
  ["superior_choroidal_vein","Veia coroidea superior","Profundo",true],
  ["inferior_ventricular_vein","Veia ventricular inferior","Profundo",true],
  ["deep_middle_cerebral_vein","Veia cerebral média profunda","Profundo",true],
  ["inferior_striate_veins","Veias estriadas inferiores","Profundo",true],
  ["uncal_vein","Veia uncal","Profundo",true],
  ["superficial_middle_cerebral_vein","Veia cerebral média superficial · silviana","Superficial",true],
  ["superior_anastomotic_vein","Veia anastomótica superior · Trolard","Superficial",true],
  ["inferior_anastomotic_vein","Veia anastomótica inferior · Labbé","Superficial",true],
  ["superior_cerebral_veins","Veias cerebrais superiores e pontes corticais","Superficial",true],
  ["inferior_cerebral_veins","Veias cerebrais inferiores","Superficial",true],
  ["medullary_veins","Veias medulares cerebrais","Profundo",true],
  ["transcerebral_veins","Veias transcerebrais","Profundo",true],
  ["precentral_cerebellar_vein","Veia pré-central cerebelar","Fossa posterior",false],
  ["superior_vermian_vein","Veia vermiana superior","Fossa posterior",false],
  ["inferior_vermian_veins","Veias vermianas inferiores","Fossa posterior",true],
  ["petrosal_vein","Veia petrosa e tributárias","Fossa posterior",true],
  ["lateral_mesencephalic_vein","Veia mesencefálica lateral","Fossa posterior",true],
  ["anterior_pontomesencephalic_vein","Veia pontomesencefálica anterior","Fossa posterior",false],
  ["anterior_pontomedullary_vein","Veia pontobulbar anterior","Fossa posterior",false],
  ["lateral_medullary_vein","Veia bulbar lateral","Fossa posterior",true],
  ["cerebellopontine_fissure_vein","Veia da fissura cerebelopontina","Fossa posterior",true],
  ["superior_hemispheric_cerebellar_veins","Veias hemisféricas cerebelares superiores","Fossa posterior",true],
  ["inferior_hemispheric_cerebellar_veins","Veias hemisféricas cerebelares inferiores","Fossa posterior",true],
  ["superior_sagittal_sinus","Seio sagital superior","Seios durais",false],
  ["inferior_sagittal_sinus","Seio sagital inferior","Seios durais",false],
  ["straight_sinus","Seio reto","Seios durais",false],
  ["confluence_of_sinuses","Confluência dos seios · torcular","Seios durais",false],
  ["transverse_sinus","Seio transverso","Seios durais",true],
  ["sigmoid_sinus","Seio sigmoide","Seios durais",true],
  ["occipital_sinus","Seio occipital","Seios durais",false],
  ["marginal_sinus","Seio marginal","Seios durais",false],
  ["falcine_sinus","Seio falcino persistente · variante","Seios durais",false],
  ["cavernous_sinus","Seio cavernoso","Base do crânio",true],
  ["sphenoparietal_sinus","Seio esfenoparietal e alternativas de drenagem","Base do crânio",true],
  ["sphenobasal_sinus","Seio esfenobasal · variante","Base do crânio",true],
  ["sphenopetrosal_sinus","Seio esfenopetroso · variante","Base do crânio",true],
  ["superior_petrosal_sinus","Seio petroso superior","Base do crânio",true],
  ["inferior_petrosal_sinus","Seio petroso inferior","Base do crânio",true],
  ["basilar_venous_plexus","Plexo venoso basilar","Base do crânio",false],
  ["anterior_intercavernous_sinus","Seio intercavernoso anterior","Base do crânio",false],
  ["posterior_intercavernous_sinus","Seio intercavernoso posterior","Base do crânio",false],
  ["superior_ophthalmic_vein","Veia oftálmica superior","Órbita e emissárias",true],
  ["inferior_ophthalmic_vein","Veia oftálmica inferior","Órbita e emissárias",true],
  ["pterygoid_venous_plexus","Plexo venoso pterigóideo","Órbita e emissárias",true],
  ["diploic_veins","Veias diploicas","Órbita e emissárias",true],
  ["mastoid_emissary_vein","Veia emissária mastoidea","Órbita e emissárias",true],
  ["condylar_emissary_veins","Veias emissárias condilares e confluência","Órbita e emissárias",true],
  ["parietal_emissary_vein","Veia emissária parietal","Órbita e emissárias",true],
  ["internal_jugular_vein","Veia jugular interna","Cervical",true],
  ["external_jugular_vein","Veia jugular externa","Cervical",true],
  ["vertebral_vein","Veia vertebral","Cervical",true],
  ["anterior_spinal_vein","Veia espinal anterior","Medula",false],
  ["posterior_spinal_veins","Veias espinais posteriores","Medula",true],
  ["radiculomedullary_veins","Veias radiculomedulares","Medula",true],
  ["perimedullary_venous_plexus","Rede venosa perimedular","Medula",false],
  ["internal_vertebral_venous_plexus","Plexo venoso vertebral interno · epidural","Medula",false],
  ["external_vertebral_venous_plexus","Plexo venoso vertebral externo","Medula",false],
].map(([id,name,group,paired])=>({id:id as string,name:name as string,group:group as string,paired:paired as boolean,reference:venousSource}));

const venousDrainage:Record<string,string[]> = {
  great_cerebral_vein:["straight_sinus"], internal_cerebral_vein:["great_cerebral_vein"],
  basal_vein_of_rosenthal:["great_cerebral_vein","cavernous_sinus","superior_petrosal_sinus"],
  thalamostriate_vein:["internal_cerebral_vein"],anterior_septal_vein:["internal_cerebral_vein"],
  superior_anastomotic_vein:["superior_sagittal_sinus"],inferior_anastomotic_vein:["transverse_sinus"],
  superficial_middle_cerebral_vein:["cavernous_sinus","sphenobasal_sinus","sphenopetrosal_sinus"],
  precentral_cerebellar_vein:["great_cerebral_vein"],petrosal_vein:["superior_petrosal_sinus"],
  superior_sagittal_sinus:["confluence_of_sinuses"],inferior_sagittal_sinus:["straight_sinus"],
  straight_sinus:["confluence_of_sinuses"],confluence_of_sinuses:["transverse_sinus"],
  transverse_sinus:["sigmoid_sinus"],sigmoid_sinus:["internal_jugular_vein"],
  inferior_petrosal_sinus:["internal_jugular_vein"],superior_petrosal_sinus:["transverse_sinus","sigmoid_sinus"],
  cavernous_sinus:["inferior_petrosal_sinus","superior_petrosal_sinus","pterygoid_venous_plexus"],
  superior_ophthalmic_vein:["cavernous_sinus"],inferior_ophthalmic_vein:["cavernous_sinus","pterygoid_venous_plexus"],
  basilar_venous_plexus:["cavernous_sinus","inferior_petrosal_sinus","internal_vertebral_venous_plexus"],
};
const effective = [...openAnatomy.structures,...reconstructedArteries];
export const venousCoverage = venousRequirements.map(row=>{
  const expected = row.paired ? [`${row.id}_l`,`${row.id}_r`] : [row.id];
  const ids = expected.filter(id=>effective.some(item=>item.id === id && item.layer === "venous"));
  return {...row,ids,drainageTargets:venousDrainage[row.id] ?? [],drainageGeometryVerified:false,status:ids.length === expected.length ? "present-unverified" : ids.length ? "partial" : "missing"};
});
export const arterialCoverage = anatomicalInventory;
export const vascularReviewCounts = {
  importedArterial:sourceStructures.filter(row=>row.layer === "arterial").length,
  importedVenous:sourceStructures.filter(row=>row.layer === "venous").length,
  reconstructed:reconstructedArteries.length,
  disputed:vascularQuarantine.size,
  anatomicallyApproved:0,
};

export {maxillaryBranchReview} from "./maxillaryReview";
