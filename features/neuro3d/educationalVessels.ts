import {CatmullRomCurve3,Vector3} from "three";
import catalogue from "./educational-vascular-paths.json";
import {sourceStructures} from "./openAnatomy";
import {vesselSurface} from "./simulation/station/surfaces";
import type {P3,Vessel} from "./simulation/station/network";

/** Original illustrative paths. Never infer measured coordinates, patent
 * anastomoses, drainage direction, individual anatomy or catheter eligibility.
 * Parent IDs are study relations only; no automatic snapping/bridging to source.
 */
const existingIds=new Set(sourceStructures.map(row=>row.id));
const templateIds=new Set(catalogue.templates.flatMap(row=>row.paired ? [`${row.id}_l`,`${row.id}_r`] : [row.id]));
const allIds=new Set([...existingIds,...templateIds,
  ...["l","r"].flatMap(side=>["anterior_choroidal_artery","inferior_hypophyseal_artery","marginal_tentorial_artery","inferolateral_trunk","jugular_division_of_ascending_pharyngeal_artery","hypoglossal_division_of_ascending_pharyngeal_artery"].map(id=>`${id}_${side}`))]);
export const educationalVessels=catalogue.templates.flatMap(template=>(template.paired ? ["l","r"] : [""]).map(side=>{
  const id=template.id+(side ? `_${side}` : "");
  if(existingIds.has(id)) throw new Error(`Educational vessel duplicates an imported identity: ${id}`);
  const parentId=side && allIds.has(`${template.parent}_${side}`) ? `${template.parent}_${side}` : template.parent;
  if(!allIds.has(parentId)) throw new Error(`Unresolved educational study parent: ${id} -> ${parentId}`);
  const paths=template.paths.map(path=>new CatmullRomCurve3(path.map(p=>new Vector3(side === "r" ? -p[0] : p[0],p[1],p[2])),false,"centripetal").getPoints(48).map(p=>p.toArray() as P3));
  const positions:number[]=[],indices:number[]=[];
  for(const points of paths) {
    const vessel:Vessel={id,name:template.name,anatomicalId:id,points,radius:template.radius,children:[],synthetic:true};
    const surface=vesselSurface(vessel,t=>template.radius*(1-.35*t),1,32,10);
    const offset=positions.length/3;
    positions.push(...surface.positions);indices.push(...Array.from(surface.indices,index=>index+offset));
  }
  const surface={positions,indices};
  const bounds=[Math.min,Math.max].map(extreme=>[0,1,2].map(k=>extreme(...positions.filter((_,i)=>i%3 === k))));
  const layer=template.reference.includes("/venous-brain-anatomy/") ? "venous" as const : "arterial" as const;
  const groupNote=template.paths.length>1 || /plexus|veins|arteries|branches|vasocorona|arcade|system|pathway/.test(template.id)
    ? "Grupo/rede com trajetos representativos; não individualiza todos os componentes ou níveis. " : "";
  return {id,name:`${template.name}${side ? side === "l" ? " esquerda" : " direita" : ""}`,
    latin:template.id.replaceAll("_"," "),layer,path:["Trajetos ilustrativos adicionais",template.group],
    bounds:bounds.map(p=>[p[0]/100,(p[1]+160)/100,p[2]/100]),surface,points:paths[0],paths,
    parentId,rootId:`educational:${id}`,anchorIndex:-1,rootFraction:-1,
    reference:template.reference,status:"reconstructed-unvalidated" as const,
    illustrative:true as const,variant:template.variant,embryonic:template.group === "Variante embrionária",proceduralEligible:false as const,
    coordinateBasis:"original-hand-authored-controls" as const,
    note:`Trajeto ilustrativo original, NÃO segmentado de exame nem recuperado como malha nomeada de repositório. ${groupNote}${template.variant ? "Variante opcional; não se presume coexistência com as outras vias. " : ""}Identidade e relações orientadas pelas referências; coordenadas e calibres arbitrados para estudo, sem homologação anatômica. A relação com o vaso pai não certifica óstio, drenagem ou luz contínua. Não navegável por instrumentos.`,
  };
}));
export const educationalVesselIds=new Set(educationalVessels.map(row=>row.id));
