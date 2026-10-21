import {Vector3} from 'three';
import {sectionSurface,type PassageSurface,type Point3} from './passageGeometry';
/** Exact-coordinate diagnostic aliases only; never mutate source indices. */
export function sourceBoundaries(surface:PassageSurface){
 const canonical=new Map<string,number>(),remap:number[]=[],aliases=new Map<number,number[]>();
 for(let i=0;i<surface.positions.length/3;i++){const key=Array.from({length:3},(_,k)=>surface.positions[i*3+k]).join(':');const id=canonical.get(key)??i;canonical.set(key,id);remap.push(id);aliases.set(id,[...(aliases.get(id)??[]),i]);}
 const point=(id:number)=>Array.from({length:3},(_,k)=>surface.positions[id*3+k]) as Point3;
 const edges=new Map<string,{a:number;b:number;faces:number[];originalEdges:number[][]}>(),degenerateFaces:number[]=[];
 for(let f=0;f<surface.indices.length/3;f++){
  const ids=[0,1,2].map(k=>surface.indices[f*3+k]),[a,b,c]=ids.map(id=>new Vector3(...point(id)));
  if(b.sub(a).cross(c.sub(a)).length()<1e-14){degenerateFaces.push(f);continue;}
  for(let k=0;k<3;k++){const a=remap[ids[k]],b=remap[ids[(k+1)%3]],key=[Math.min(a,b),Math.max(a,b)].join(':');const e=edges.get(key)??{a,b,faces:[],originalEdges:[]};e.faces.push(f);e.originalEdges.push([ids[k],ids[(k+1)%3]]);edges.set(key,e);}
 }
 const boundary=[...edges.values()].filter(e=>e.faces.length===1).map((e,i)=>({id:i,...e,pointsCm:[point(e.a),point(e.b)],aliases:[aliases.get(e.a)!,aliases.get(e.b)!]}));
 const seen=new Set<number>(),groups=[];
 for(const edge of boundary)if(!seen.has(edge.id)){
  const stack=[edge.id],ids:number[]=[];seen.add(edge.id);
  while(stack.length){const id=stack.pop()!;ids.push(id);const e=boundary[id];for(const other of boundary)if(!seen.has(other.id)&&[e.a,e.b].some(v=>other.a===v||other.b===v)){seen.add(other.id);stack.push(other.id);}}
  const es=ids.map(i=>boundary[i]),vertices=[...new Set(es.flatMap(e=>[e.a,e.b]))],points=vertices.map(point);
  groups.push({id:`boundary-${groups.length+1}`,edgeIds:ids,sourceFaces:es.map(e=>e.faces[0]),pointsCm:points,
   boundsCm:[0,1,2].map(k=>[Math.min(...points.map(p=>p[k])),Math.max(...points.map(p=>p[k]))]),
   closedDegreeTwo:vertices.every(v=>es.filter(e=>e.a===v||e.b===v).length===2),anatomicalIdentity:null});
 }
 return {method:'Exact coordinate aliases; exclude area<1e-14cm² doubled-area faces. Original source edges/faces retained. No healing, no named aperture.',boundary,groups,degenerateFaces};
}
export interface SectionFrame {originCm:Point3;u:Point3;v:Point3;normal:Point3}
export function sectionFrame(originCm:Point3,normal:Point3):SectionFrame{
 const n=new Vector3(...normal);if(![...originCm,...normal].every(Number.isFinite)||n.length()<1e-12)throw Error('Invalid plane');n.normalize();
 const ref=Math.abs(n.y)<.9?new Vector3(0,1,0):new Vector3(1,0,0),u=ref.cross(n).normalize(),v=n.clone().cross(u);
 return {originCm:[...originCm],u:u.toArray() as Point3,v:v.toArray() as Point3,normal:n.toArray() as Point3};
}
export function toSection(p:Point3,f:SectionFrame):Point3{const d=p.map((n,k)=>n-f.originCm[k]);return [f.u,f.v,f.normal].map(a=>a.reduce((s,n,k)=>s+n*d[k],0)) as Point3;}
export function fromSection(p:Point3,f:SectionFrame):Point3{return [0,1,2].map(k=>f.originCm[k]+p[0]*f.u[k]+p[1]*f.v[k]+p[2]*f.normal[k]) as Point3;}
export function framedSurface(surface:PassageSurface,f:SectionFrame):PassageSurface{
 return {...surface,positions:Array.from({length:surface.positions.length/3},(_,i)=>toSection([surface.positions[i*3],surface.positions[i*3+1],surface.positions[i*3+2]],f)).flat()};
}
export function obliqueSection(surface:PassageSurface,f:SectionFrame){
 const local=sectionSurface(framedSurface(surface,f),2,0);
 return {local,world:{...local,segments:local.segments.map(([a,b])=>[fromSection(a,f),fromSection(b,f)] as [Point3,Point3])}};
}
