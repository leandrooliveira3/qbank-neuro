import {it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {gunzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import sections from './sections.json';
import {decodePlane,planePoint,planeCorners} from './sectionGeometry';
import {centeredReferencePoint} from './geometry';
it('checks all 42 exact native planes, file hashes and physical corner coordinates',()=>{
  expect(sections.sections).toHaveLength(42);
  for(const p of sections.sections){
    const raw=readFileSync(`public/neuro3d/comparison/sections/${p.file}`);expect(createHash('sha256').update(raw).digest('hex')).toBe(p.assetSHA256);
    const bytes=gunzipSync(Buffer.from(JSON.parse(raw.toString()).data,'base64'));
    const values=decodePlane(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),p);
    expect(values.length).toBe(p.width*p.height);expect(p.resampled).toBe(false);expect(p.quantized).toBe(false);
    const corner=planePoint(p,0,0);expect(corner.voxel[p.axis]).toBe(p.index);expect(corner.voxel[p.vAxis]).toBe(p.height-1);
    expect(corner.ras).toEqual(p.voxelToRASmm.slice(0,3).map(r=>r[0]*corner.voxel[0]+r[1]*corner.voxel[1]+r[2]*corner.voxel[2]+r[3]));
  }
});
it('maps an anisotropic reflected native plane without confusing RAS and LPS',()=>{
  const p={axis:2,index:4,uAxis:0,vAxis:1,width:3,height:5,voxelToRASmm:[[-.5,0,0,10],[0,2,0,-8],[0,0,3,7],[0,0,0,1]]};
  expect(planePoint(p,2,0)).toEqual({voxel:[2,4,4],ras:[9,0,19]});
  expect(()=>planePoint(p,3,0)).toThrow();expect(()=>decodePlane(new ArrayBuffer(4),p)).toThrow();
});
it('places original slice outline and voxel marks in the SAME native RAS to display transform as the surface',()=>{
  const p={axis:2,index:4,uAxis:0,vAxis:1,width:3,height:5,voxelToRASmm:[[-.5,0,0,10],[0,2,0,-8],[0,0,3,7],[0,0,0,1]]};
  const point=planePoint(p,2,0);expect(centeredReferencePoint(point.ras,[10,0,10])).toEqual([1,9,0]);
  expect(planeCorners(p)).toEqual([[10.25,-9,19],[8.75,-9,19],[8.75,1,19],[10.25,1,19]]);
  for(const corner of planeCorners(p))expect(centeredReferencePoint(corner,[10,0,10])[1]).toBe(9);
});
