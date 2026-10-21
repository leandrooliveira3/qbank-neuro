import {Triangle,Vector3} from 'three';
export type Point3=[number,number,number];
export interface PassageInspectionPlane {passageId:string;side:'l'|'r';axis:'x'|'y'|'z';offsetCm:number;centerCm:Point3}
export interface PassageSurface {id:string;layer:string;origin:'imported'|'illustrative';positions:ArrayLike<number>;indices:ArrayLike<number>}
export interface SurfaceSection {id:string;layer:string;origin:string;segments:[Point3,Point3][];coplanarTriangles:number}
export const sectionAxes={x:{normal:0,u:2,v:1,label:'X constante · Z/Y'},y:{normal:1,u:0,v:2,label:'Y constante · X/Z'},z:{normal:2,u:0,v:1,label:'Z constante · X/Y'}} as const;
export function inspectionPlanePose(plane:PassageInspectionPlane){
  const position=[...plane.centerCm] as Point3;position[sectionAxes[plane.axis].normal]=plane.offsetCm;
  const rotation:Point3=plane.axis==='x'?[0,Math.PI/2,0]:plane.axis==='y'?[Math.PI/2,0,0]:[0,0,0];
  return {position,rotation};
}
/** The atlas uses centimetres, Y-up; these are NOT patient RAS/LPS axes. */
export function sourceMetres(p:Point3):Point3{return [p[0]/100,(p[1]+160)/100,p[2]/100];}
/** Canonical little-endian float32 positions followed by uint32 indices. */
export function surfaceEvidenceBytes(s:PassageSurface){
  const buffer=new ArrayBuffer((s.positions.length+s.indices.length)*4),view=new DataView(buffer);
  for(let i=0;i<s.positions.length;i++)view.setFloat32(i*4,s.positions[i],true);
  for(let i=0;i<s.indices.length;i++)view.setUint32((s.positions.length+i)*4,s.indices[i],true);
  return buffer;
}
export function sectionSurface(surface:PassageSurface,axis:number,offset:number):SurfaceSection{
  if(![0,1,2].includes(axis)||!Number.isFinite(offset))throw Error('Plano inválido');
  const result:SurfaceSection={id:surface.id,layer:surface.layer,origin:surface.origin,segments:[],coplanarTriangles:0};
  const eps=1e-8;
  for(let i=0;i<surface.indices.length;i+=3){
    const points=[0,1,2].map(k=>Array.from({length:3},(_,j)=>surface.positions[surface.indices[i+k]*3+j]) as Point3);
    const d=points.map(p=>p[axis]-offset);
    if(d.every(v=>Math.abs(v)<=eps)){result.coplanarTriangles++;continue;}
    const hits:Point3[]=[];
    const add=(p:Point3)=>{if(!hits.some(q=>Math.hypot(...p.map((v,k)=>v-q[k]))<eps))hits.push(p);};
    for(let j=0;j<3;j++){
      const k=(j+1)%3;
      if(Math.abs(d[j])<=eps)add([...points[j]]);
      if(d[j]*d[k]<0){const t=d[j]/(d[j]-d[k]);add(points[j].map((v,n)=>v+t*(points[k][n]-v)) as Point3);}
    }
    if(hits.length===2)result.segments.push([hits[0],hits[1]]);
  }
  return result;
}
/** Exhaustive target triangles for each sampled source vertex. This is an
 * UPPER bound on the unknown global surface distance, never a lumen test. */
export function sampledSurfaceDistance(from:PassageSurface,to:PassageSurface,limit=32){
  const n=from.positions.length/3;if(!n||!to.indices.length||limit<2)throw Error('Superfície vazia');
  const triangle=new Triangle(),q=new Vector3(),p=new Vector3();let best=Infinity;
  let witness:{sourceVertex:number;targetTriangle:number;from:Point3;to:Point3;targetBarycentric:Point3}|undefined;
  const count=Math.min(n,limit),sampleIndices=count===1?[0]:Array.from(new Set(Array.from({length:count},(_,i)=>Math.round(i*(n-1)/(count-1)))));
  for(const vertex of sampleIndices){
    p.fromArray(from.positions as number[],vertex*3);
    for(let i=0;i<to.indices.length;i+=3){
      triangle.a.fromArray(to.positions as number[],to.indices[i]*3);triangle.b.fromArray(to.positions as number[],to.indices[i+1]*3);triangle.c.fromArray(to.positions as number[],to.indices[i+2]*3);
      if(triangle.getArea()<1e-14)continue;
      triangle.closestPointToPoint(p,q);const squared=p.distanceToSquared(q);
      if(squared<best){best=squared;witness={sourceVertex:vertex,targetTriangle:i/3,from:p.toArray() as Point3,to:q.toArray() as Point3,targetBarycentric:triangle.getBarycoord(q,new Vector3())!.toArray() as Point3};}
    }
  }
  if(!witness)throw Error('Sem triângulo utilizável');
  const bounds=(s:PassageSurface)=>[0,1,2].map(k=>{let min=Infinity,max=-Infinity;for(let i=k;i<s.positions.length;i+=3){min=Math.min(min,s.positions[i]);max=Math.max(max,s.positions[i]);}return [min,max];});
  const a=bounds(from),b=bounds(to),lowerBoundCm=Math.hypot(...a.map(([min,max],i)=>Math.max(0,min-b[i][1],b[i][0]-max)));
  return {sampledUpperBoundCm:Math.sqrt(best),aabbLowerBoundCm:lowerBoundCm,sampleCount:sampleIndices.length,witness,
    globalSeparationProven:lowerBoundCm>1e-8,continuousLumenVerified:false as const};
}
