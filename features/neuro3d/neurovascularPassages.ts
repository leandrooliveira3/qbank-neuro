import {openAnatomy} from './openAnatomy';
import {reconstructedVessels} from './reconstructedVessels';
const na='https://neuroangio.org/anatomy-and-variants/';
export const passageReferences={
  ilt:na+'inferolateral-trunk/',orbit:na+'ophthalmic-artery-old/',
  collaterals:'https://neuroangio.org/sample-page/neuroangio-topics/intracranial-collateral-pathways/',
  lasjauniasILT:'https://pubmed.ncbi.nlm.nih.gov/876454/',
  lasjauniasAMA:'https://pubmed.ncbi.nlm.nih.gov/959564/',
  ama:'https://pubmed.ncbi.nlm.nih.gov/207149/',
};
export const passageBookEvidence={title:'Lasjaunias, Berenstein, ter Brugge · Clinical Vascular Anatomy and Variations, 2001',
  sha256:'421e89836286424a9642a4442d7cd218be333d8a911004032775e720ff97d327',
  inspectedPDFPages:[293,317,322,437,475,490],visuallyInspectedPDFPages:[317,437,475],
  printedPages:['273','297','302','418','456','471'],redistributed:false};
export interface NeurovascularPassage {
  id:string;name:string;vessels:string[];context:string[];structures:string;
  segment:string;relationship:string;references:string[];sourceReview:string;
  links?:[string,string][];
}
export const neurovascularPassages:NeurovascularPassage[]=[
  {id:'rotundum',name:'Forame redondo · V2',vessels:['maxillary_artery','artery_of_foramen_rotundum_from_maxillary','foramen_rotundum_branch','inferolateral_trunk','internal_carotid_artery'],context:['sphenoid_bone','maxillary_nerve'],structures:'Nervo maxilar (V2) e artéria do forame redondo.',segment:'ACI cavernosa · C4',relationship:'Rede maxilar–ramo do forame redondo–ILT. Ramos dos dois lados da comunicação precisam ser individualizados.',references:[passageReferences.ilt,passageReferences.lasjauniasILT],sourceReview:'Neuroangio consultado; resumo do estudo anatômico de Lasjaunias/Moret/Mink consultado, sem alegar revisão integral do livro.'},
  {id:'ovale',name:'Forame oval · V3',vessels:['maxillary_artery','accessory_meningeal_artery','foramen_ovale_branch','inferolateral_trunk','internal_carotid_artery'],context:['sphenoid_bone','anterior_division_of_mandibular_nerve','posterior_division_of_mandibular_nerve'],structures:'Nervo mandibular (V3); contribuição intracraniana da meníngea acessória.',segment:'ACI cavernosa · C4',relationship:'A meníngea acessória tem importante distribuição extracraniana; seu ramo intracraniano e a rede do ILT não devem ser substituídos pela malha do tronco.',references:[passageReferences.ilt,passageReferences.lasjauniasAMA,passageReferences.ama],sourceReview:'Neuroangio e resumos anatômicos primários consultados. Configuração e contribuição são variáveis.'},
  {id:'vesalius',name:'Forame de Vesálio · via alternativa',vessels:['accessory_meningeal_artery','inferolateral_trunk'],context:['sphenoid_bone'],structures:'Via alternativa do ramo meníngeo acessório; região da emissária esfenoidal.',segment:'Interface meníngea acessória–cavernosa',relationship:'A passagem pelo oval não é universal: Lasjaunias descreve exemplo pelo forame de Vesálio. Variante não deve ser adicionada como conexão obrigatória simultânea.',references:[passageReferences.lasjauniasAMA,passageReferences.ilt],sourceReview:'Lasjaunias 2001, p.273, legenda da Fig.4.9: texto conferido no PDF original. Coordenadas individuais do forame não estabelecidas.'},
  {id:'vidian',name:'Canal pterigóideo · vidiano',vessels:['maxillary_artery','artery_of_pterygoid_canal','internal_carotid_artery'],context:['sphenoid_bone','nerve_of_pterygoid_canal'],structures:'Artéria e nervo do canal pterigóideo.',segment:'ACI petrosa · C2',relationship:'Via maxilar–vidiana–ACI petrosa; distinguir as contribuições faríngea, pterigovaginal e do lácero. Não equivale a toda a carótida interna.',references:[passageReferences.collaterals],sourceReview:'Página de colaterais Neuroangio consultada. Segmento indicado é referência topográfica, sem segmentar a malha da ACI automaticamente.'},
  {id:'spinosum',name:'Forame espinhoso · meníngea média',vessels:['maxillary_artery','middle_meningeal_artery','cavernous_branch_of_middle_meningeal_artery','inferolateral_trunk'],context:['sphenoid_bone'],structures:'Artéria meníngea média e seu componente cavernoso.',segment:'Rede cavernosa do ILT',relationship:'Entrada da meníngea média pelo espinhoso e comunicação do ramo cavernoso com ILT. Não confundir esse ramo com os ramos frontal, parietal ou petroso.',references:[passageReferences.ilt,passageReferences.lasjauniasILT],sourceReview:'Neuroangio consultado; a extensão da malha original da meníngea média permanece em revisão.'},
  {id:'meningolacrimal',name:'Forame meningo-orbitário · Hyrtl',vessels:['middle_meningeal_artery','sphenoid_ridge_branch','lacrimal_artery','ophthalmic_artery'],context:['sphenoid_bone'],structures:'Comunicação meningo-lacrimal, quando presente.',segment:'Meníngea média ↔ lacrimal/oftálmica',relationship:'Via meningo-lacrimal pelo canal meningo-orbitário; distinguir da via pela fissura orbitária superior e de origem meníngea da oftálmica. Não se presume coexistência.',references:[passageReferences.orbit],sourceReview:'Página oftálmica Neuroangio consultada. Não é uma comunicação patente demonstrada neste atlas.'},
  {id:'superior-orbital-fissure',name:'Fissura orbitária superior · rede recorrente',vessels:['superior_orbital_fissure_artery','deep_recurrent_meningeal_branch','middle_meningeal_artery','ophthalmic_artery','inferolateral_trunk'],context:['sphenoid_bone'],structures:'Contribuições orbitárias e recorrentes; marcos da fissura superior.',segment:'Interface meníngea–oftálmica–ILT',relationship:'Vias alternativas e variáveis, não uma sequência única obrigatória. O nome recorrente não certifica a identidade com todo ramo do ILT.',references:[passageReferences.orbit,passageReferences.ilt],sourceReview:'Referências Neuroangio consultadas. A nomenclatura histórica e a configuração individual exigem conferência.',links:[['superior_orbital_fissure_artery','inferolateral_trunk'],['deep_recurrent_meningeal_branch','ophthalmic_artery'],['deep_recurrent_meningeal_branch','middle_meningeal_artery']]},
  {id:'hypoglossal-canal',name:'Canal do hipoglosso · XII',vessels:['ascending_pharyngeal_artery','hypoglossal_division_of_ascending_pharyngeal_artery','arterial_branch_to_hypoglossal_nerve'],context:['occipital_bone','hypoglossal_nerve'],structures:'Nervo hipoglosso e divisão hipoglossa neuromeníngea adulta.',segment:'Faríngea ascendente · divisão neuromeníngea',relationship:'Divisão adulta distinta da persistência embrionária da artéria hipoglossa. As comunicações clivais e odontoideas exigem revisão própria.',references:[na+'ascending-pharyngeal-artery/',na+'diagrams-and-drawings/'],sourceReview:'Relações da legenda e revisão de vias anteriores preservadas; capítulo dedicado não foi relido integralmente neste lote.'},
  {id:'jugular-foramen',name:'Forame jugular · IX–X–XI',vessels:['ascending_pharyngeal_artery','jugular_division_of_ascending_pharyngeal_artery'],context:['occipital_bone','temporal_bone','glossopharyngeal_nerve','vagus_nerve','accessory_nerve'],structures:'Nervos IX, X e XI; componente jugular neuromeníngeo.',segment:'Faríngea ascendente · divisão jugular',relationship:'Contexto de vasa nervorum. Não equiparar o ramo arterial à jugular interna ou aos seios venosos do mesmo forame.',references:[na+'ascending-pharyngeal-artery/',na+'diagrams-and-drawings/'],sourceReview:'Relações da legenda e revisão de vias anteriores preservadas; trajeto geométrico e conteúdo individual precisam de revisão.'},
];
for(const row of neurovascularPassages)if(['rotundum','ovale','vidian','spinosum','meningolacrimal','superior-orbital-fissure'].includes(row.id)){
  row.sourceReview+=' Conferência dirigida adicional no livro original Lasjaunias 2001: pp.273,297,302,418,456 e471; três páginas também inspecionadas visualmente. Não houve leitura integral do livro.';
}
const all=new Map([...openAnatomy.structures,...reconstructedVessels].map(item=>[item.id,item]));
// Exact source IDs include the cranial nerve number; no positional matching.
const contextSourceIds:Record<string,string>={hypoglossal_nerve:'hypoglossal_nerve_xii',glossopharyngeal_nerve:'glossopharyngeal_nerve_ix',vagus_nerve:'vagus_nerve_x',accessory_nerve:'accessory_nerve_xi'};
export function resolvePassage(row:NeurovascularPassage,side:'l'|'r'){
  const resolve=(id:string)=>{const sourceId=contextSourceIds[id]??id;return all.has(`${sourceId}_${side}`)?`${sourceId}_${side}`:sourceId;};
  const expected=row.vessels.map(resolve),contextExpected=row.context.map(resolve);
  return {row,side,vesselIds:expected.filter(id=>all.has(id)),missingVesselIds:expected.filter(id=>!all.has(id)),
    contextIds:contextExpected.filter(id=>all.has(id)),missingContextIds:contextExpected.filter(id=>!all.has(id)),
    foramenSurfaceIdentified:false,trajectoryCompleteVerified:false,anastomosisLumenVerified:false,
    // Only bibliographic graph links, not procedural flow edges or new tubes.
    studyLinks:(row.links??row.vessels.slice(1).map((id,i)=>[row.vessels[i],id] as [string,string])).map(([from,to])=>({from:resolve(from),to:resolve(to),kind:'bibliographic' as const,geometryVerified:false})),
  };
}
export function passagesForVessel(id:string){return neurovascularPassages.filter(row=>row.vessels.includes(id.replace(/_[lr]$/,'')));}
