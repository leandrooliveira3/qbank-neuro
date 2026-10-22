import {it,expect} from 'vitest';
import {extractSurface,surfacePlan,surfaceSection} from './surface';
import {importCropReview} from './metadata';
import {voxelToWorld,type VolumeHeader,type Box3i} from './geometry';
import type {LocalGeometry} from './reader';
const h:VolumeHeader={dimensions:[8,6,4],spacing:[2,3,4],toWorld:[0,1,0,0,-1,0,0,0,0,0,1,0,10,-5,7,1],rawName:'own.raw',orientation:'fixture',bytes:384};
const voi:Box3i=[1,6,1,5,0,3];
const meta:LocalGeometry={volume:h,detectors:[{name:'own.rad',header:{dimensions:[16,12],spacing:[1,1],bytes:768,toWorld:h.toWorld,sourceWorld:[0,0,-10]}}],digests:[{name:'own.raw',sha256:'a'.repeat(64),bytes:384}],targets:[],minimum:0,maximum:7};
function review(){return {schema:1,cropConvention:'zero-based-inclusive',matrixLayout:'4x4 column-major, homogeneous column vectors',coordinateSystem:'Native GS-CA Sv/Sw millimetres; no DICOM LPS/RAS or atlas registration',volume:h,detectors:meta.detectors,sourceDigests:meta.digests,voi,roi:[1,8,2,10],selectedDetector:'own.rad'};}
it('imports only matching local crop metadata with explicit zero-inclusive bounds and immutable frame',()=>{
 const r=review();expect(importCropReview(JSON.stringify(r),meta)).toEqual({voi,roi:r.roi,detectorName:'own.rad'});
 for(const mutation of [{cropConvention:'one-based'},{matrixLayout:'row-major'},{sourceDigests:[]},{voi:[1,8,1,5,0,3]},{roi:[1,16,2,10]},{selectedDetector:'other.rad'},{volume:{...h,spacing:[1,1,1]}}])expect(()=>importCropReview(JSON.stringify({...r,...mutation}),meta)).toThrow();
 expect(()=>importCropReview(JSON.stringify({...r,sourceDigests:[...meta.digests,...meta.digests]}),meta)).toThrow();
 expect(()=>importCropReview('x'.repeat(1_000_001),meta)).toThrow();
 // Other fields must never replace target positions or transforms.
 expect(importCropReview(JSON.stringify({...r,selectedVoxel:[99,99,99],atlasTransform:[1]}),meta)).not.toHaveProperty('selectedVoxel');
});
it('generates the analytic ramp plane in full affine Sw with crop endpoints and no padding caps',()=>{
 const values=Int16Array.from({length:192},(_,i)=>i%8),surface=extractSurface(values,h,voi,2.5,60,[0,7]);
 expect(surface.triangles).toBeGreaterThan(0);expect(surface.coordinateSystem).toBe('GS-CA Sw mm');
 for(let i=0;i<surface.voxels.length;i+=3){const p=Array.from(surface.voxels.slice(i,i+3)) as [number,number,number];expect(p[0]).toBeCloseTo(2.5,5);p.forEach((n,k)=>{expect(n).toBeGreaterThanOrEqual(voi[k*2]-1e-5);expect(n).toBeLessThanOrEqual(voi[k*2+1]+1e-5);});voxelToWorld(p,h).forEach((n,k)=>expect(surface.positions[i+k]).toBeCloseTo(n,4));}
 const sections=surfaceSection(surface.voxels,2,1);expect(sections.length).toBeGreaterThan(0);for(const s of sections){expect(s[2]).toBeCloseTo(1);expect(s[5]).toBeCloseTo(1);expect(s[0]).toBeCloseTo(2.5);}
 expect(surfaceSection(surface.voxels,0,6)).toHaveLength(0);
});
it('explicitly covers uneven sampling endpoints and rejects empty, thin or invalid preview requests',()=>{
 const large={...h,dimensions:[512,512,391] as [number,number,number]},p=surfacePlan(large,[5,510,2,511,3,390],60);
 expect(p.stride).toBe(9);expect(p.coordinates.map(c=>[c[0],c.at(-1)])).toEqual([[5,510],[2,511],[3,390]]);expect(Math.max(...p.sampleDimensions)).toBeLessThanOrEqual(61);expect(p.estimatedWorkingBytes).toBeLessThan(250_000_000);
 const values=new Int16Array(192);expect(()=>extractSurface(values,h,voi,NaN,60,[0,7])).toThrow();expect(()=>extractSurface(values,h,voi,3,60,[0,7])).toThrow('Sem superfície');expect(()=>surfacePlan(h,[1,1,0,5,0,3],60)).toThrow();
});
