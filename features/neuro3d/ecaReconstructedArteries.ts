import { CatmullRomCurve3, Vector3 } from "three";
import axes from "./reference-access-network.json";
import { vesselSurface } from "./simulation/station/surfaces";
import type { P3, Vessel } from "./simulation/station/network";

/** Landmark-guided educational geometry, not patient segmentation or a validated catheter route.
 * Positions are cm in the existing atlas frame. Origins use each side's own ECA axis.
 * References: Borden, 3D Angiographic Atlas, figs 2.1–2.4; Krings, case 30;
 * Neuroangio APA and lingual pages. The drawings supply topology, not measured 3D coordinates.
 */
const apa = "https://neuroangio.org/anatomy-and-variants/ascending-pharyngeal-artery/";
const lingual = "https://neuroangio.org/anatomy-and-variants/lingual-artery/";
interface Template { id:string; name:string; parent:string; radius:number; points:P3[]; reference:string }
const templates: Template[] = [
  {id:"ascending_pharyngeal_artery",name:"Artéria faríngea ascendente",parent:"external_carotid_artery",radius:.055,reference:apa,
    points:[[3.3,-9.7,.2],[2.85,-9.1,.22],[2.4,-7.6,.24],[2.15,-6.2,.25],[2.0,-5.1,.3]]},
  {id:"pharyngeal_trunk_of_ascending_pharyngeal_artery",name:"Tronco faríngeo da faríngea ascendente",parent:"ascending_pharyngeal_artery",radius:.035,reference:apa,
    points:[[2.4,-7.6,.24],[2.0,-7.0,.65],[1.8,-5.6,1.0],[1.7,-3.4,1.3]]},
  {id:"inferior_pharyngeal_branch",name:"Ramo faríngeo inferior",parent:"pharyngeal_trunk_of_ascending_pharyngeal_artery",radius:.021,reference:apa,
    points:[[2.0,-7.0,.65],[1.6,-7.1,1.2],[1.0,-7.0,1.6]]},
  {id:"middle_pharyngeal_branch",name:"Ramo faríngeo médio",parent:"pharyngeal_trunk_of_ascending_pharyngeal_artery",radius:.021,reference:apa,
    points:[[1.8,-5.6,1.0],[1.3,-5.4,1.5],[.7,-5.3,1.7]]},
  {id:"superior_pharyngeal_branch",name:"Ramo faríngeo superior",parent:"pharyngeal_trunk_of_ascending_pharyngeal_artery",radius:.024,reference:apa,
    points:[[1.7,-3.4,1.3],[1.4,-3.2,1.65],[.8,-3.1,1.8]]},
  {id:"neuromeningeal_trunk",name:"Tronco neuromeníngeo da faríngea ascendente",parent:"ascending_pharyngeal_artery",radius:.035,reference:apa,
    points:[[2.0,-5.1,.3],[2.05,-4.7,-.2],[2.15,-4.4,-.65]]},
  {id:"hypoglossal_division_of_ascending_pharyngeal_artery",name:"Divisão hipoglossa da faríngea ascendente",parent:"neuromeningeal_trunk",radius:.025,reference:apa,
    points:[[2.15,-4.4,-.65],[1.85,-4.2,-1.25],[1.6,-3.95,-1.65],[1.25,-3.7,-1.35]]},
  {id:"jugular_division_of_ascending_pharyngeal_artery",name:"Divisão jugular da faríngea ascendente",parent:"neuromeningeal_trunk",radius:.025,reference:apa,
    points:[[2.15,-4.4,-.65],[2.65,-4.0,-.9],[3.0,-3.65,-1.1],[3.2,-3.35,-1.65]]},
  {id:"inferior_tympanic_artery",name:"Artéria timpânica inferior",parent:"neuromeningeal_trunk",radius:.018,reference:apa,
    points:[[2.05,-4.7,-.2],[2.55,-4.1,.0],[3.0,-3.45,.25]]},
  {id:"lacerum_branch_of_ascending_pharyngeal_artery",name:"Ramo do forame lacerado da faríngea ascendente",parent:"pharyngeal_trunk_of_ascending_pharyngeal_artery",radius:.018,reference:apa,
    points:[[1.7,-3.4,1.3],[1.8,-3.1,1.25],[1.95,-2.8,1.1]]},
  {id:"musculospinal_branch_of_ascending_pharyngeal_artery",name:"Ramo musculoespinal da faríngea ascendente",parent:"ascending_pharyngeal_artery",radius:.023,reference:apa,
    points:[[2.4,-7.6,.24],[2.25,-7.1,-.6],[2.1,-6.6,-1.5],[1.9,-6.3,-2.2]]},
  {id:"ascending_clival_branch_of_hypoglossal_division",name:"Ramo clival ascendente da divisão hipoglossa",parent:"hypoglossal_division_of_ascending_pharyngeal_artery",radius:.018,reference:apa,
    points:[[1.25,-3.7,-1.35],[.9,-3.25,-1.1],[.65,-2.7,-.8]]},
  {id:"lingual_artery",name:"Artéria lingual",parent:"external_carotid_artery",radius:.085,reference:lingual,
    points:[[3.5,-8.6,.4],[2.8,-8.8,1.4],[2.3,-8.8,2.6],[2.0,-8.4,3.6],[1.8,-7.6,4.7]]},
  {id:"deep_lingual_artery",name:"Artéria profunda da língua",parent:"lingual_artery",radius:.05,reference:lingual,
    points:[[1.8,-7.6,4.7],[1.4,-7.1,5.8],[.95,-6.7,6.6],[.45,-6.5,7.1]]},
  {id:"sublingual_artery",name:"Artéria sublingual",parent:"lingual_artery",radius:.035,reference:lingual,
    points:[[2.0,-8.4,3.6],[1.6,-8.65,4.8],[1.2,-8.65,5.8],[.8,-8.7,6.8]]},
  {id:"dorsal_lingual_branches",name:"Ramos dorsais da língua",parent:"lingual_artery",radius:.03,reference:lingual,
    points:[[2.3,-8.8,2.6],[2.0,-7.8,2.8],[1.6,-6.8,3.0],[1.2,-6.1,3.5]]},
  {id:"suprahyoid_branch_of_lingual_artery",name:"Ramo supra-hióideo da lingual",parent:"lingual_artery",radius:.022,reference:lingual,
    points:[[2.8,-8.8,1.4],[2.1,-9.0,2.0],[1.2,-9.15,2.5],[.4,-9.2,2.8]]},
];

function nearest(points:P3[], point:P3) {
  return points.reduce((best,p,i)=>Math.hypot(...p.map((v,k)=>v-point[k])) < Math.hypot(...points[best].map((v,k)=>v-point[k])) ? i : best,0);
}
export const ecaReconstructedArteries = (["l","r"] as const).flatMap(side => {
  const axis = axes.originalAxes[side === "l" ? "external_carotid_artery_l" : "external_carotid_artery_r"].points as P3[];
  const built = new Map<string,P3[]>(), origins = new Map<string,number>();
  return templates.map(template => {
    const controls = template.points.map(([x,y,z])=>[side === "l" ? x : -x,y,z] as P3);
    const parentPoints = template.parent === "external_carotid_artery" ? axis : built.get(template.parent)!;
    const parentAnchorIndex = nearest(parentPoints,controls[0]);
    controls[0] = [...parentPoints[parentAnchorIndex]];
    const rootIndex = template.parent === "external_carotid_artery" ? parentAnchorIndex : origins.get(template.parent)!;
    const points = new CatmullRomCurve3(controls.map(p=>new Vector3(...p)),false,"centripetal").getPoints(80).map(p=>p.toArray() as P3);
    built.set(template.id,points); origins.set(template.id,rootIndex);
    const id = `${template.id}_${side}`, radius = template.radius;
    const vessel:Vessel = {id,name:template.name,anatomicalId:id,points,radius,children:[],synthetic:true};
    const surface = vesselSurface(vessel,t=>radius*(1-.55*t),1,48,16);
    const bounds = [Math.min,Math.max].map(extreme=>[0,1,2].map(k=>extreme(...points.map(p=>p[k]))+(extreme===Math.min?-radius:radius)));
    const arc = axis.slice(1).map((p,i)=>Math.hypot(...p.map((v,k)=>v-axis[i][k])));
    const rootFraction = arc.slice(0,rootIndex).reduce((a,b)=>a+b,0)/arc.reduce((a,b)=>a+b,0);
    return {id,name:`${template.name} ${side === "l" ? "esquerda" : "direita"}`,latin:template.id.replaceAll("_"," "),layer:"arterial",
      path:["Reconstruções didáticas","ACE",side === "l" ? "Esquerda" : "Direita"],
      bounds:bounds.map(p=>[p[0]/100,(p[1]+160)/100,p[2]/100]),surface,points,
      parentId:`${template.parent}_${side}`,parentAnchorIndex,rootId:`external_carotid_artery_${side}`,anchorIndex:rootIndex,rootFraction,
      reference:template.reference,status:"reconstructed-unvalidated" as const,
      note:"Reconstrução didática original: topologia orientada por Borden (figs. 2.1–2.4), Krings (caso 30) e Neuroangio. Origem ancorada na ACE do próprio lado e continuidade numérica dos ramos. Coordenadas intermediárias, relação fina com canais/forames e calibre ainda não homologados. Não representa anastomose aberta nem trajeto de cateter."};
  });
});
