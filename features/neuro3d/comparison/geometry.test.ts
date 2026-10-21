import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {gunzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import {decodeReferenceGeometry,displayPoint} from './geometry';
import manifest from './manifest.json';
import reconciliation from '../../../docs/neuro3d-inventory-reconciliation.json';
import {vascularCompletenessCounts} from '../vascularCompleteness';
describe('independent physical reference geometry',()=>{
  it('verifies every shipped surface and retains all original components without atlas registration',()=>{
    expect(manifest.surfaces).toHaveLength(3);
    for(const surface of manifest.surfaces){
      const raw=readFileSync(`public/neuro3d/comparison/${surface.file}`);
      expect(createHash('sha256').update(raw).digest('hex')).toBe(surface.assetSHA256);
      const compressed=Buffer.from(JSON.parse(raw.toString()).data,'base64');
      expect(createHash('sha256').update(compressed).digest('hex')).toBe(surface.compressedSHA256);
      const bytes=gunzipSync(compressed);const buffer=bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength);
      const decoded=decodeReferenceGeometry(buffer,surface);expect(decoded.positions).toHaveLength(surface.vertices*3);
      expect(surface.components).toBe(surface.original.components);expect(surface.registrationToAtlas).toBe(null);
      expect(surface.anatomicalApproval).toBe(false);
      for(let k=0;k<3;k++){
        let low=Infinity,high=-Infinity;for(let i=k;i<decoded.positions.length;i+=3){low=Math.min(low,decoded.positions[i]);high=Math.max(high,decoded.positions[i]);}
        expect(low).toBeCloseTo(surface.boundsRASmm[0][k],4);expect(high).toBeCloseTo(surface.boundsRASmm[1][k],4);
      }
    }
  });
  it('rejects invalid dimensions, truncated geometry, nonfinite coordinates and out-of-range indices',()=>{
    const b=new ArrayBuffer(12+36+12),v=new DataView(b);v.setUint32(0,0x31525651,true);v.setUint32(4,3,true);v.setUint32(8,1,true);
    expect(()=>decodeReferenceGeometry(b,{vertices:4,triangles:1})).toThrow();
    expect(()=>decodeReferenceGeometry(b.slice(0,-1),{vertices:3,triangles:1})).toThrow();
    v.setFloat32(12,NaN,true);expect(()=>decodeReferenceGeometry(b,{vertices:3,triangles:1})).toThrow();v.setFloat32(12,0,true);
    v.setUint32(48,3,true);expect(()=>decodeReferenceGeometry(b,{vertices:3,triangles:1})).toThrow();
    expect(displayPoint([10,20,30])).toEqual([-10,30,20]);
  });
  it('keeps current coverage and unresolved Galen/straight junction distinct from mere ID presence',()=>{
    expect(reconciliation.coverageCounts).toEqual(vascularCompletenessCounts);
    expect(reconciliation.unresolvedDiagram).toHaveLength(7);
    expect(reconciliation.galenStraight.connectionVerified).toBe(false);
    expect(reconciliation.galenStraight.identityApproved).toBe(false);
    expect(reconciliation.galenStraight.sampledAxisDistances.every(row=>row.minimumDistanceToProjectionVerticesCm>0)).toBe(true);
  });
});
