import {openAnatomy} from './openAnatomy';
import {reconstructedVessels} from './reconstructedVessels';
const root='https://neuroangio.org/venous-brain-anatomy/';
/** Directed text review only. These are study sets, not mandatory flow chains. */
export const venousStudyReviews=[
  {id:'deep',name:'Cerebral interna · tributárias e anéis',url:root+'internal-cerebral-vein/',
    note:'Confrontar os canais com ventrículos e fases tardias. As conexões direta lateral e ventricular inferior podem redistribuir territórios; o ângulo venoso isolado não fixa o forame de Monro. Os conjuntos ilustrativos não individualizam todas as tributárias.',
    ids:['internal_cerebral_vein','anterior_septal_vein','posterior_septal_vein','thalamostriate_vein','direct_lateral_vein','anterior_caudate_vein','longitudinal_caudate_vein','posterior_caudate_veins','inferior_ventricular_vein','superior_choroidal_vein','lateral_atrial_veins','basal_vein_of_rosenthal'],
    unresolvedTerms:['Veia atrial medial: identidade individual e correspondência de fonte ainda não estabelecidas.','Veias caudadas transversas: um grupo longitudinal ou medular não prova sua individualização.']},
  {id:'sinuses',name:'Seios · tributárias e saídas alternativas',url:root+'venous-sinuses/',
    note:'Distinguir coletores, emissárias e alternativas de drenagem. A relação entre calibres depende dos territórios coletados. A conexão silviana–cavernosa e a nomenclatura esfenoparietal não devem ser impostas como uma via invariável.',
    ids:['superior_sagittal_sinus','inferior_sagittal_sinus','straight_sinus','transverse_sinus','sigmoid_sinus','cavernous_sinus','superior_petrosal_sinus','inferior_petrosal_sinus','sphenoparietal_sinus','paracavernous_sinus','diploic_veins','mastoid_emissary_vein','condylar_emissary_veins'],
    unresolvedTerms:['Separar cada canal emissário e seu orifício ósseo: grupos representativos não comprovam todos os trajetos.']},
  {id:'posterior',name:'Fossa posterior · superfícies e canais',url:root+'veins-posterior-fossa/',
    note:'Revisar três superfícies cerebelares, vermis e canais longitudinais do tronco. A dominância e as conexões transversas variam. A injeção e a fase alteram o que se vê; não opacificar um canal não comprova ausência.',
    ids:['precentral_cerebellar_vein','superior_vermian_vein','inferior_vermian_veins','superior_hemispheric_cerebellar_veins','inferior_hemispheric_cerebellar_veins','petrosal_vein','lateral_mesencephalic_vein','lateral_medullary_vein','anterior_pontomesencephalic_vein','anterior_pontomedullary_vein','cerebellopontine_fissure_vein','superior_petrosal_sinus'],
    unresolvedTerms:['Veias interpeduncular, pontina transversa e do sulco pontomedular: conferir identidade individual antes de assimilar a um canal longitudinal.','Ramo braquial e conexões tonsilares: revisão individual pendente.']},
];
const all=new Map([...openAnatomy.structures,...reconstructedVessels].map(row=>[row.id,row]));
export function resolveVenousReview(row:typeof venousStudyReviews[number],side:'l'|'r'){
  return row.ids.map(base=>{const id=all.has(`${base}_${side}`)?`${base}_${side}`:base,item=all.get(id);return {id,item,missing:!item,origin:item?('status'in item?'illustrative':'imported'):'missing'};});
}
