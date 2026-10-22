import React,{useMemo,useEffect} from 'react';import {Canvas,useThree} from '@react-three/fiber';import {OrbitControls} from '@react-three/drei/core/OrbitControls';
import {voxelToWorld,projectWorld,type P3,type Box3i,type VolumeHeader,type DetectorHeader} from './geometry';
import {BufferGeometry,BufferAttribute,DoubleSide} from 'three';
import type {SurfacePreview} from './surface';
function FitVoi({span}:{span:number}){
 const {camera,controls}=useThree();
 useEffect(()=>{camera.position.set(span*1.6,span,span*1.8);camera.lookAt(0,0,0);const orbit=controls as unknown as {target?:{set:(x:number,y:number,z:number)=>void};update?:()=>void}|undefined;orbit?.target?.set(0,0,0);orbit?.update?.();},[span,camera,controls]);return null;
}
function SurfaceMesh({surface,center,onComponent}:{surface:SurfacePreview;center:P3;onComponent?:(id:number)=>void}){
 const geometry=useMemo(()=>{const g=new BufferGeometry(),a=new Float32Array(surface.positions);for(let i=0;i<a.length;i++)a[i]-=center[i%3];g.setAttribute('position',new BufferAttribute(a,3));g.computeVertexNormals();return g;},[surface,center[0],center[1],center[2]]);
 useEffect(()=>()=>geometry.dispose(),[geometry]);return <mesh geometry={geometry} onClick={e=>{e.stopPropagation();if(e.faceIndex!=null)onComponent?.(surface.componentIds[e.faceIndex]);}}><meshStandardMaterial color="#e7bb62" side={DoubleSide} roughness={.65}/></mesh>;
}
export default function GsCaScene({volume,voi,point,detector,surface,onComponent}:{volume:VolumeHeader;voi:Box3i;point:P3;detector?:DetectorHeader;surface?:SurfacePreview;onComponent?:(id:number)=>void}){
 const center=voxelToWorld([0,1,2].map(k=>(voi[k*2]+voi[k*2+1])/2) as P3,volume),shift=(p:P3)=>p.map((n,k)=>n-center[k]) as P3;
 const positions=useMemo(()=>{const corners=Array.from({length:8},(_,i)=>voxelToWorld([voi[(i&1)?1:0],voi[(i&2)?3:2],voi[(i&4)?5:4]],volume)),edges:number[]=[];for(let i=0;i<8;i++)for(const bit of [1,2,4])if(!(i&bit))edges.push(...shift(corners[i]),...shift(corners[i|bit]));return new Float32Array(edges);},[volume,voi]);
 const world=voxelToWorld(point,volume),p=shift(world),span=Math.max(1,...Array.from(positions,n=>Math.abs(n)*2));
 let beam:Float32Array|undefined;try{if(detector){const end=projectWorld(world,detector).detectorWorld;beam=new Float32Array([...shift(detector.sourceWorld),...shift(end)]);}}catch{}
 return <div className="gsca-scene" aria-label="Geometria física 3D independente"><Canvas camera={{position:[span*1.6,span,span*1.8],near:.01,far:10000}}><FitVoi span={span}/><ambientLight intensity={1.5}/><directionalLight position={[span,span,span]} intensity={2}/>{surface&&<SurfaceMesh surface={surface} center={center} onComponent={onComponent}/>}<lineSegments><bufferGeometry><bufferAttribute attach="attributes-position" args={[positions,3]}/></bufferGeometry><lineBasicMaterial color="#7ad9dd"/></lineSegments>{beam&&<lineSegments><bufferGeometry><bufferAttribute attach="attributes-position" args={[beam,3]}/></bufferGeometry><lineBasicMaterial color="#fbaf56"/></lineSegments>}<mesh position={p}><sphereGeometry args={[Math.max(...volume.spacing)*2,12,8]}/><meshBasicMaterial color="#ff79ba"/></mesh><OrbitControls makeDefault/></Canvas><p>Caixa, raio e prévia opcional no espaço Sw da fonte. Superfície por limiar não comprova identidade ou continuidade vascular. A câmera acompanha a VOI; a translação visual centra a caixa, sem alterar as coordenadas exportadas.</p></div>;
}
