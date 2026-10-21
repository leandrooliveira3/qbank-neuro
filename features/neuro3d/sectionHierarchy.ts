import type {PassageSurface,Point3} from './passageGeometry';
import {strictlyEncloses,type SectionLoop} from './sectionContours';

/** Preserve source winding: traversal direction in sectionContours is arbitrary.
 * A nesting depth alone never classifies bone versus empty space. */
export function sectionHierarchy(loops:SectionLoop[],surface:PassageSurface,u:number,v:number){
  if(u===v||![u,v].every(k=>[0,1,2].includes(k)))throw Error('Invalid section axes');
  const normal=3-u-v;
  return loops.map((loop,index)=>{
    const ancestors=loops.flatMap((outer,i)=>i!==index&&strictlyEncloses(outer,loop,u,v)?[i]:[]).sort((a,b)=>loops[a].areaCm2-loops[b].areaCm2);
    let positive=0,negative=0,ambiguous=0,area=0;
    loop.points.forEach((p,i)=>{
      const q=loop.points[(i+1)%loop.points.length],face=loop.sourceTriangles[i];
      const vertex=(j:number)=>[0,1,2].map(k=>surface.positions[surface.indices[face*3+j]*3+k]) as Point3;
      const a=vertex(0),b=vertex(1),c=vertex(2),ab=b.map((x,k)=>x-a[k]),ac=c.map((x,k)=>x-a[k]);
      const n=[ab[1]*ac[2]-ab[2]*ac[1],ab[2]*ac[0]-ab[0]*ac[2],ab[0]*ac[1]-ab[1]*ac[0]];
      // In the selected UV projection, N_plane cross N_face gives positive boundary traversal.
      const agreement=(q[v]-p[v])*n[u]-(q[u]-p[u])*n[v];
      if(!Number.isFinite(agreement)||Math.abs(agreement)<1e-16)ambiguous++;else if(agreement>0)positive++;else negative++;
      area+=p[u]*q[v]-q[u]*p[v];
    });
    const consistent=ambiguous===0&&(positive===0||negative===0);
    return {index,parent:ancestors[0]??null,depth:ancestors.length,areaCm2:loop.areaCm2,
      sourceSignedAreaCm2:consistent?area/2*(positive?1:-1):null,
      orientationConsistent:consistent,positiveEdges:positive,negativeEdges:negative,ambiguousEdges:ambiguous,
      normalAxis:normal,sourceTriangles:loop.sourceTriangles};
  });
}

/** Exact-index edge topology: no healing or welding. Seams may explain open
 * edges but do not authorize silently closing a source mesh. */
export function meshTopology(surface:PassageSurface){
  const edges=new Map<string,{faces:number[];direction:number}>(),adj=new Map<number,number[]>();let degenerateFaces=0;
  for(let f=0;f<surface.indices.length/3;f++){
    const ids=[0,1,2].map(k=>surface.indices[f*3+k]);
    const [a,b,c]=ids.map(id=>[0,1,2].map(k=>surface.positions[id*3+k]));
    const ab=b.map((n,k)=>n-a[k]),ac=c.map((n,k)=>n-a[k]);
    if(new Set(ids).size<3||Math.hypot(ab[1]*ac[2]-ab[2]*ac[1],ab[2]*ac[0]-ab[0]*ac[2],ab[0]*ac[1]-ab[1]*ac[0])<1e-14){degenerateFaces++;continue;}
    for(let k=0;k<3;k++){
      const a=ids[k],b=ids[(k+1)%3],key=a<b?`${a}:${b}`:`${b}:${a}`,edge=edges.get(key)??{faces:[],direction:0};
      edge.faces.push(f);edge.direction+=a<b?1:-1;edges.set(key,edge);
    }
  }
  let boundaryEdges=0,nonManifoldEdges=0,inconsistentEdges=0;
  for(const edge of edges.values()){
    if(edge.faces.length===1)boundaryEdges++;else if(edge.faces.length!==2)nonManifoldEdges++;else if(edge.direction!==0)inconsistentEdges++;
    for(const f of edge.faces)adj.set(f,[...(adj.get(f)??[]),...edge.faces.filter(g=>g!==f)]);
  }
  const seen=new Set<number>(),components:number[][]=[];
  for(const f of adj.keys())if(!seen.has(f)){const stack=[f],group:number[]=[];seen.add(f);while(stack.length){const i=stack.pop()!;group.push(i);for(const j of adj.get(i)??[])if(!seen.has(j)){seen.add(j);stack.push(j);}}components.push(group);}
  return {vertices:surface.positions.length/3,faces:surface.indices.length/3,boundaryEdges,nonManifoldEdges,inconsistentEdges,degenerateFaces,
    componentFaces:components.map(c=>c.length),closedConsistentlyOriented:boundaryEdges===0&&nonManifoldEdges===0&&inconsistentEdges===0&&degenerateFaces===0};
}

/** Diagnostic copy only: test whether coincident seams explain index borders.
 * Never write these welded indices back into the atlas. */
export function seamTopology(surface:PassageSurface,tolerance=1e-6){
  if(!Number.isFinite(tolerance)||tolerance<=0)throw Error('Invalid seam tolerance');
  const points:Point3[]=[],buckets=new Map<string,number[]>(),remap:number[]=[];let maxDisplacementCm=0;
  for(let i=0;i<surface.positions.length;i+=3){
    const p=[surface.positions[i],surface.positions[i+1],surface.positions[i+2]] as Point3,q=p.map(n=>Math.floor(n/tolerance));let found=-1;
    for(let a=-1;a<=1;a++)for(let b=-1;b<=1;b++)for(let c=-1;c<=1;c++)for(const j of buckets.get([q[0]+a,q[1]+b,q[2]+c].join(':'))??[]){
      const d=Math.hypot(...p.map((n,k)=>n-points[j][k]));if(d<=tolerance){found=j;maxDisplacementCm=Math.max(maxDisplacementCm,d);break;}
    }
    if(found<0){found=points.length;points.push(p);const key=q.join(':');buckets.set(key,[...(buckets.get(key)??[]),found]);}
    remap.push(found);
  }
  return {toleranceCm:tolerance,maxDisplacementCm,diagnosticOnly:true,topology:meshTopology({...surface,positions:points.flat(),indices:Array.from(surface.indices,n=>remap[n])})};
}

/** Generalized winding diagnostic, not a solid certificate: closedness,
 * orientation and self-intersection require independent checks. */
export function windingAt(surface:PassageSurface,p:Point3){
  let sum=0;
  for(let f=0;f<surface.indices.length;f+=3){
    const [a,b,c]=[0,1,2].map(j=>[0,1,2].map(k=>surface.positions[surface.indices[f+j]*3+k]-p[k]));
    const dot=(x:number[],y:number[])=>x.reduce((s,n,k)=>s+n*y[k],0),la=Math.hypot(...a),lb=Math.hypot(...b),lc=Math.hypot(...c);
    if(Math.min(la,lb,lc)<1e-12)return null;
    const det=a[0]*(b[1]*c[2]-b[2]*c[1])-a[1]*(b[0]*c[2]-b[2]*c[0])+a[2]*(b[0]*c[1]-b[1]*c[0]);
    sum+=2*Math.atan2(det,la*lb*lc+dot(a,b)*lc+dot(b,c)*la+dot(c,a)*lb);
  }
  return sum/(4*Math.PI);
}
