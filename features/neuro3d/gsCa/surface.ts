import {MarchingCubes} from 'three/examples/jsm/objects/MarchingCubes.js';
import {MeshBasicMaterial} from 'three';
import {validateBox,voxelToWorld,type VolumeHeader,type Box3i,type P3} from './geometry';

export interface SurfacePreview {
 positions:Float32Array; voxels:Float32Array; threshold:number; stride:number;
 sampleDimensions:number[]; triangles:number; voi:Box3i; estimatedWorkingBytes:number;
 coordinateSystem:'GS-CA Sw mm';
}
const maxTriangles=150_000;
export function surfacePlan(h:VolumeHeader,voi:Box3i,detail:60|90){
 validateBox(voi,h.dimensions);
 if(detail!==60&&detail!==90)throw Error('Resolução de amostragem inválida.');
 if([0,1,2].some(k=>voi[2*k]===voi[2*k+1]))throw Error('A superfície requer ao menos dois voxels em cada eixo.');
 const stride=Math.max(1,Math.ceil(Math.max(...[0,1,2].map(k=>voi[k*2+1]-voi[k*2]))/detail));
 const coordinates=[0,1,2].map(k=>Array.from({length:Math.ceil((voi[k*2+1]-voi[k*2])/stride)+1},(_,i)=>Math.min(voi[k*2+1],voi[k*2]+i*stride)));
 const sampleDimensions=coordinates.map(c=>c.length),resolution=Math.max(...sampleDimensions)+6;
 // Field + normal cache, marching buffers, output arrays, JS staging, transfer and GPU margin.
 const estimatedWorkingBytes=resolution**3*16+maxTriangles*9*4*8+8_000_000;
 return {stride,coordinates,sampleDimensions,resolution,estimatedWorkingBytes};
}
export function extractSurface(values:Int16Array,h:VolumeHeader,voi:Box3i,threshold:number,detail:60|90,range:[number,number]):SurfacePreview{
 if(!Number.isFinite(threshold)||threshold<=range[0]||threshold>=range[1])throw Error('Limiar deve estar entre o mínimo e máximo do volume.');
 if(values.length!==h.dimensions.reduce((a,b)=>a*b,1))throw Error('Volume incompleto.');
 const plan=surfacePlan(h,voi,detail),{resolution,coordinates,sampleDimensions}=plan;
 const material=new MeshBasicMaterial(),cubes=new MarchingCubes(resolution,material,false,false,maxTriangles);
 try{
  cubes.field.fill(range[0]);cubes.isolation=threshold;
  for(let z=0;z<sampleDimensions[2];z++)for(let y=0;y<sampleDimensions[1];y++)for(let x=0;x<sampleDimensions[0];x++){
   cubes.field[(z+2)*resolution**2+(y+2)*resolution+x+2]=values[coordinates[0][x]+h.dimensions[0]*(coordinates[1][y]+h.dimensions[1]*coordinates[2][z])];
  }
  cubes.update();
  if(cubes.count>maxTriangles*3)throw Error('Superfície excedeu 150 mil triângulos; reduza VOI ou resolução. Nenhuma malha parcial é aceita.');
  const world:number[]=[],voxels:number[]=[];
  for(let i=0;i<cubes.count;i+=3){
   const triangle=[0,1,2].map(v=>[0,1,2].map(k=>(cubes.positionArray[(i+v)*3+k]+1)*resolution/2-2));
   // Padding must never create artificial closing caps at the crop boundary.
   if(triangle.some(p=>p.some((n,k)=>n < -1e-5||n > sampleDimensions[k]-1+1e-5)))continue;
   for(const p of triangle){const voxel=p.map((n,k)=>{const c=coordinates[k],a=Math.max(0,Math.min(c.length-1,n)),j=Math.floor(a);return c[j]+(c[Math.min(j+1,c.length-1)]-c[j])*(a-j);}) as P3;voxels.push(...voxel);world.push(...voxelToWorld(voxel,h));}
  }
  if(!world.length||!world.every(Number.isFinite))throw Error('Sem superfície válida nesta VOI e limiar.');
  return {positions:new Float32Array(world),voxels:new Float32Array(voxels),threshold,stride:plan.stride,sampleDimensions,triangles:world.length/9,voi:[...voi],estimatedWorkingBytes:plan.estimatedWorkingBytes,coordinateSystem:'GS-CA Sw mm'};
 }finally{cubes.geometry.dispose();material.dispose();}
}

/** Intersect the actual preview triangles with the displayed integer voxel plane. */
export function surfaceSection(voxels:Float32Array,axis:number,index:number){
 const segments:number[][]=[];
 for(let i=0;i<voxels.length;i+=9){
  const points:number[][]=[];
  for(const [a,b] of [[0,1],[1,2],[2,0]]){
   const va=voxels[i+a*3+axis]-index,vb=voxels[i+b*3+axis]-index;
   if((va<=0&&vb>0)||(vb<=0&&va>0)){const t=va/(va-vb);points.push([0,1,2].map(k=>voxels[i+a*3+k]+t*(voxels[i+b*3+k]-voxels[i+a*3+k])));}
  }
  if(points.length===2)segments.push([...points[0],...points[1]]);
 }
 return segments;
}
