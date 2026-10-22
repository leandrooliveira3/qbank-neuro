import {it,expect} from 'vitest';import {BoxGeometry,Vector3,Euler} from 'three';
import {sourceBoundaries,sectionFrame,toSection,fromSection,obliqueSection} from './skullBoundary';
import {inspectionPlanePose,type PassageSurface} from './passageGeometry';
import report from './skull-boundary-evidence.json';
const box=():PassageSurface=>{const g=new BoxGeometry(2,2,2);return {id:'box',layer:'bone',origin:'imported',positions:g.attributes.position.array,indices:g.index!.array};};
it('localizes a missing face across exact seams with original edge and triangle lineage without healing',()=>{
 const b=box(),source=Array.from(b.indices);expect(sourceBoundaries(b).boundary).toHaveLength(0);
 const r=sourceBoundaries({...b,indices:source.slice(6)});expect(r.boundary).toHaveLength(4);expect(r.groups).toHaveLength(1);expect(r.groups[0].closedDegreeTwo).toBe(true);
 expect(r.boundary.every(e=>e.faces.length===1&&e.originalEdges.length===1&&e.pointsCm.length===2)).toBe(true);expect(Array.from(b.indices)).toEqual(source);
});
it('keeps oblique native points and 3D plane axes in the same reversible frame',()=>{
 const f=sectionFrame([.1,.2,.3],[1,2,3]),p:[number,number,number]=[.2,-.1,.4];expect(fromSection(toSection(p,f),f).map((n,k)=>n-p[k]).every(n=>Math.abs(n)<1e-12)).toBe(true);
 const cut=obliqueSection(box(),f);expect(cut.local.segments.length).toBeGreaterThan(0);for(const [a,b] of cut.world.segments)for(const p of [a,b])expect(toSection(p,f)[2]).toBeCloseTo(0,12);
 const pose=inspectionPlanePose({passageId:'rotundum',side:'l',axis:'z',offsetCm:99,centerCm:[99,99,99],frame:f});expect(pose.position).toEqual(f.originCm);
 for(const [local,expected] of [[[1,0,0],f.u],[[0,1,0],f.v],[[0,0,1],f.normal]] as const){const v=new Vector3(...local).applyEuler(new Euler(...pose.rotation));expect(v.distanceTo(new Vector3(...expected))).toBeLessThan(1e-12);}
 expect(()=>sectionFrame([0,0,0],[0,0,0])).toThrow();
});
it('preserves 32 localized edges, two unnamed cycles and the refined bilateral containment limit',()=>{
 expect(report.boundaries.boundary).toHaveLength(32);expect(report.boundaries.groups.map(g=>g.edgeIds.length)).toEqual([16,16]);expect(report.boundaries.groups.every(g=>g.anatomicalIdentity===null)).toBe(true);
 for(const s of report.sides){expect(s.fineLevels).toHaveLength(9);expect(s.fineLevels[0].fullContainment).toBe(true);expect(s.fineLevels.slice(1).every(l=>!l.fullContainment)).toBe(true);expect(s.probeToBoundaryEdgesCm).toBeGreaterThan(1.39);expect(s.cuts).toHaveLength(2);expect(s.namedForamenVerified).toBe(false);}
});
