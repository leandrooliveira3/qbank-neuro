import type {Point3,SurfaceSection} from './passageGeometry';
export interface SectionLoop {points:Point3[];areaCm2:number;sourceTriangles:number[]}
/** Numeric endpoint welding only. Open/branched components are never closed.
 * A closed section contour is NOT certification of a foramen or 3D tunnel. */
export function sectionContours(section:Pick<SurfaceSection,'segments'>&{triangleIds?:number[]},u:number,v:number,tolerance=1e-6){
  if(!Number.isFinite(tolerance)||tolerance<=0||u===v||![u,v].every(n=>[0,1,2].includes(n)))throw Error('Parâmetros de contorno inválidos');
  const points:Point3[]=[],adj:number[][]=[],buckets=new Map<string,number[]>(),edges=new Map<string,number>();let duplicateEdges=0;
  const node=(p:Point3)=>{
    const q=p.map(n=>Math.floor(n/tolerance));
    for(let a=-1;a<=1;a++)for(let b=-1;b<=1;b++)for(let c=-1;c<=1;c++){
      const key=[q[0]+a,q[1]+b,q[2]+c].join(':');
      for(const i of buckets.get(key)??[])if(Math.hypot(...p.map((n,k)=>n-points[i][k]))<=tolerance)return i;
    }
    const i=points.length,key=q.join(':');points.push(p);adj.push([]);buckets.set(key,[...(buckets.get(key)??[]),i]);return i;
  };
  section.segments.forEach(([p,q],i)=>{
    const a=node(p),b=node(q);if(a===b)return;const key=a<b?`${a}:${b}`:`${b}:${a}`;
    if(edges.has(key)){duplicateEdges++;return;}edges.set(key,section.triangleIds?.[i]??-1);adj[a].push(b);adj[b].push(a);
  });
  const seen=new Set<number>(),loops:SectionLoop[]=[];let openComponents=0,branchedComponents=0,invalidLoops=0;
  for(let start=0;start<points.length;start++){
    if(seen.has(start)||!adj[start].length)continue;const component:number[]=[],stack=[start];seen.add(start);
    while(stack.length){const i=stack.pop()!;component.push(i);for(const j of adj[i])if(!seen.has(j)){seen.add(j);stack.push(j);}}
    if(component.some(i=>adj[i].length!==2)){if(component.some(i=>adj[i].length>2))branchedComponents++;else openComponents++;continue;}
    const indices=[start];let previous=-1,current=start;
    do{const next=adj[current].find(i=>i!==previous)!;previous=current;current=next;if(current!==start)indices.push(current);}while(current!==start&&indices.length<=component.length);
    if(current!==start||indices.length!==component.length){branchedComponents++;continue;}
    const polygon=indices.map(i=>points[i]);let twiceArea=0;
    polygon.forEach((p,i)=>{const q=polygon[(i+1)%polygon.length];twiceArea+=p[u]*q[v]-q[u]*p[v];});
    let crossing=false;
    for(let i=0;i<polygon.length;i++)for(let j=i+2;j<polygon.length;j++)if(!(i===0&&j===polygon.length-1)&&segmentsTouch(polygon[i],polygon[(i+1)%polygon.length],polygon[j],polygon[(j+1)%polygon.length],u,v,tolerance))crossing=true;
    if(crossing||Math.abs(twiceArea)<tolerance*tolerance){invalidLoops++;continue;}
    loops.push({points:polygon,areaCm2:Math.abs(twiceArea)/2,sourceTriangles:indices.map((a,i)=>{const b=indices[(i+1)%indices.length],key=a<b?`${a}:${b}`:`${b}:${a}`;return edges.get(key)!;})});
  }
  return {loops,openComponents,branchedComponents,duplicateEdges,invalidLoops,weldToleranceCm:tolerance};
}
function segmentsTouch(a:Point3,b:Point3,c:Point3,d:Point3,u:number,v:number,tolerance:number){
  const orient=(p:Point3,q:Point3,r:Point3)=>(q[u]-p[u])*(r[v]-p[v])-(q[v]-p[v])*(r[u]-p[u]);
  if(orient(a,b,c)*orient(a,b,d)<0&&orient(c,d,a)*orient(c,d,b)<0)return true;
  const distance=(p:Point3,q:Point3,r:Point3)=>{const dx=r[u]-q[u],dy=r[v]-q[v],t=Math.max(0,Math.min(1,((p[u]-q[u])*dx+(p[v]-q[v])*dy)/(dx*dx+dy*dy||1)));return Math.hypot(p[u]-q[u]-t*dx,p[v]-q[v]-t*dy);};
  return Math.min(distance(a,c,d),distance(b,c,d),distance(c,a,b),distance(d,a,b))<=tolerance;
}
export function strictlyEncloses(outer:SectionLoop,inner:SectionLoop,u:number,v:number,tolerance=1e-6){
  if(!outer.points.length||!inner.points.length||u===v||![u,v].every(k=>[0,1,2].includes(k)))return false;
  const normal=3-u-v,offset=outer.points[0][normal];
  if([...outer.points,...inner.points].some(p=>Math.abs(p[normal]-offset)>tolerance))return false;
  if(!inner.points.every(p=>pointInContour(p,outer,u,v,tolerance)==='inside'))return false;
  return !outer.points.some((a,i)=>inner.points.some((c,j)=>segmentsTouch(a,outer.points[(i+1)%outer.points.length],c,inner.points[(j+1)%inner.points.length],u,v,tolerance)));
}
export function pointInContour(p:Point3,loop:SectionLoop,u:number,v:number,tolerance=1e-6){
  let inside=false;
  for(let i=0,j=loop.points.length-1;i<loop.points.length;j=i++){
    const a=loop.points[j],b=loop.points[i],dx=b[u]-a[u],dy=b[v]-a[v],t=Math.max(0,Math.min(1,((p[u]-a[u])*dx+(p[v]-a[v])*dy)/(dx*dx+dy*dy||1)));
    if(Math.hypot(p[u]-a[u]-t*dx,p[v]-a[v]-t*dy)<=tolerance)return 'boundary' as const;
    if((a[v]>p[v])!==(b[v]>p[v])&&p[u]<(b[u]-a[u])*(p[v]-a[v])/(b[v]-a[v])+a[u])inside=!inside;
  }
  return inside?'inside' as const:'outside' as const;
}
