import {it,expect} from 'vitest';
import {meshComponents,componentTriangles} from './components';
import {decodeVendorSheet,readVendorCrops} from './vendorCrops';
import type {LocalGeometry} from './reader';
import type {WorkSheet} from 'xlsx';
it('isolates exact shared-edge components without proximity welding or vertex-only bridges',()=>{
 const a=[0,0,0,1,0,0,0,1,0],b=[1,0,0,1,1,0,0,1,0],touch=[1,1,0,2,1,0,2,2,0],near=a.map((n,i)=>i%3===2?n+.000001:n),v=new Float32Array([...a,...b,...touch,...near]),r=meshComponents(v);
 expect(r.components.map(c=>c.triangles)).toEqual([2,1,1]);expect(r.componentIds[0]).toBe(r.componentIds[1]);expect(r.componentIds[2]).not.toBe(r.componentIds[1]);expect(r.componentIds[3]).not.toBe(r.componentIds[0]);
 const selected=componentTriangles({...r,positions:v,voxels:v,triangles:4},0);expect(selected.triangles).toBe(2);expect([...selected.voxels]).toEqual([...a,...b]);expect(componentTriangles({...r,positions:v,voxels:v,triangles:4},null).triangles).toBe(4);
 expect(()=>componentTriangles({...r,positions:v,voxels:v,triangles:4},20)).toThrow();
});
function fixture(){
 const h={dimensions:[8,6,4] as [number,number,number],spacing:[1,1,1] as [number,number,number],toWorld:[],rawName:'own.raw',orientation:'own',bytes:384};
 const d={dimensions:[16,12] as [number,number],spacing:[1,1] as [number,number],toWorld:[],sourceWorld:[0,0,-10] as [number,number,number],bytes:768};
 const meta:LocalGeometry={volume:h,detectors:[{name:'Dataset1_2D_DSA_AP.rad',header:d},{name:'Dataset1_2D_MAX_AP.rad',header:d},{name:'Dataset1_2D_DSA_LAT.rad',header:d}],digests:[],minimum:0,maximum:1,targets:[]},s:WorkSheet={};
 for(const [r,label,values] of [[3,'VOI ixmin, ixmax, iymin, iymax, izmin, izmax',[1,6,0,5,0,3]],[4,'ROI LAT ixmin, ixmax, iymin, iymax',[0,15,0,11]],[5,'ROI AP ixmin, ixmax, iymin, iymax',[2,13,1,10]]] as [number,string,number[]][]){s[`A${r}`]={t:'s',v:label};values.forEach((v,i)=>{s[`${String.fromCharCode(66+i)}${r}`]={t:'n',v};});}
 return {meta,s};
}
it('decodes labeled numeric XLS bounds as zero-inclusive x/y/z and AP/LAT for both modalities',()=>{
 const {meta,s}=fixture(),r=decodeVendorSheet(s,meta);expect(r.voi).toEqual([1,6,0,5,0,3]);expect(r.rois[meta.detectors[0].name]).toEqual([2,13,1,10]);expect(r.rois[meta.detectors[1].name]).toEqual([2,13,1,10]);expect(r.rois[meta.detectors[2].name]).toEqual([0,15,0,11]);
 s.B3={t:'n',v:1,f:'1'};expect(()=>decodeVendorSheet(s,meta)).toThrow('literal');delete s.B3.f;s.G3.v=4;expect(()=>decodeVendorSheet(s,meta)).toThrow('VOI');s.G3.v=3;s.A4.v='ROI unknown';expect(()=>decodeVendorSheet(s,meta)).toThrow('Rótulo');
});
it('rejects unknown XLS bytes before parser loading and does not guess a new version',async()=>{
 const {meta}=fixture();await expect(readVendorCrops(new File(['not an xls'],'database_info.xls'),meta)).rejects.toThrow('versão');await expect(readVendorCrops(new File(['x'],'other.xls'),meta)).rejects.toThrow('original');
});
