import type {Box3i} from './geometry';
export interface MeshComponent {id:number;triangles:number;voxelBounds:Box3i}
/** Exact shared edges only: no tolerance weld, proximity link or vertex-only connection. */
export function meshComponents(voxels:Float32Array){
 const count=voxels.length/9;
 if(!Number.isInteger(count)||count>150_000)throw Error('Malha excede o limite de análise.');
 const parent=Uint32Array.from({length:count},(_,i)=>i),vertexIds=new Map<string,number>(),edges=new Map<string,number>();
 function find(n:number):number{while(parent[n]!==n){parent[n]=parent[parent[n]];n=parent[n];}return n;}
 for(let t=0;t<count;t++){
  const ids=[0,1,2].map(v=>{const i=t*9+v*3,p=[voxels[i],voxels[i+1],voxels[i+2]];if(!p.every(Number.isFinite))throw Error('Vértice não finito.');const key=p.join(',');let id=vertexIds.get(key);if(id===undefined){id=vertexIds.size;vertexIds.set(key,id);}return id;});
  for(const [a,b] of [[0,1],[1,2],[2,0]]){if(ids[a]===ids[b])continue;const key=ids[a]<ids[b]?`${ids[a]}:${ids[b]}`:`${ids[b]}:${ids[a]}`,other=edges.get(key);if(other===undefined)edges.set(key,t);else{const x=find(t),y=find(other);if(x!==y)parent[x]=y;}}
 }
 const groups=new Map<number,MeshComponent>();
 for(let t=0;t<count;t++){const root=find(t);let c=groups.get(root);if(!c){c={id:root,triangles:0,voxelBounds:[Infinity,-Infinity,Infinity,-Infinity,Infinity,-Infinity]};groups.set(root,c);}c.triangles++;for(let v=0;v<3;v++)for(let k=0;k<3;k++){const n=voxels[t*9+v*3+k];c.voxelBounds[k*2]=Math.min(c.voxelBounds[k*2],n);c.voxelBounds[k*2+1]=Math.max(c.voxelBounds[k*2+1],n);}}
 const components=[...groups.values()].sort((a,b)=>b.triangles-a.triangles||a.id-b.id),ranks=new Map(components.map((c,i)=>[c.id,i]));
 components.forEach((c,i)=>{c.id=i;});const componentIds=new Uint32Array(count);for(let t=0;t<count;t++)componentIds[t]=ranks.get(find(t))!;
 return {components,componentIds};
}
export function componentTriangles<T extends {positions:Float32Array;voxels:Float32Array;triangles:number;componentIds:Uint32Array;components:MeshComponent[]}>(surface:T,id:number|null):T{
 if(id===null)return surface;
 const component=surface.components[id];if(!component)throw Error('Componente ausente.');
 const positions=new Float32Array(component.triangles*9),voxels=new Float32Array(positions.length),componentIds=new Uint32Array(component.triangles);let j=0;
 for(let t=0;t<surface.componentIds.length;t++)if(surface.componentIds[t]===id){positions.set(surface.positions.subarray(t*9,t*9+9),j*9);voxels.set(surface.voxels.subarray(t*9,t*9+9),j*9);componentIds[j++]=id;}
 return {...surface,positions,voxels,componentIds,triangles:j};
}
