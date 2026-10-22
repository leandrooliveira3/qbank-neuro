import {it,expect} from 'vitest';import {BoxGeometry} from 'three';
import {sectionSurface,type PassageSurface} from './passageGeometry';
import {sectionContours} from './sectionContours';
import {sectionHierarchy,meshTopology,seamTopology,windingAt} from './sectionHierarchy';
import report from './contour-continuity-evidence.json';
const box=(size:number):PassageSurface=>{const g=new BoxGeometry(size,size,size);return {id:'fixture',layer:'bone',origin:'imported',positions:Array.from(g.attributes.position.array),indices:Array.from(g.index!.array)};};
it('distinguishes indexed seams from closed consistently oriented surface without healing the input',()=>{
 const s=box(2),before=Array.from(s.indices);expect(meshTopology(s).boundaryEdges).toBeGreaterThan(0);
 expect(seamTopology(s)).toMatchObject({diagnosticOnly:true,maxDisplacementCm:0,topology:{boundaryEdges:0,closedConsistentlyOriented:true}});
 expect(Array.from(s.indices)).toEqual(before);expect(seamTopology({...s,indices:before.slice(3)}).topology.closedConsistentlyOriented).toBe(false);
 expect(()=>seamTopology(s,0)).toThrow();
});
it('derives opposite oriented contours and nesting from a hollow fixture, independent of loop traversal',()=>{
 const a=box(4),b=box(2),n=a.positions.length/3,ids=Array.from(b.indices);for(let i=0;i<ids.length;i+=3)[ids[i],ids[i+1]]=[ids[i+1],ids[i]];
 const s={...a,positions:[...Array.from(a.positions),...Array.from(b.positions)],indices:[...Array.from(a.indices),...ids.map(i=>i+n)]};
 for(const [u,v,axis] of [[0,1,2],[0,2,1],[2,1,0]]){
  const section=sectionSurface(s,axis,0),loops=sectionContours(section,u,v).loops,h=sectionHierarchy(loops,s,u,v).sort((a,b)=>b.areaCm2-a.areaCm2);
  expect(h.map(x=>x.depth)).toEqual([0,1]);expect(h.map(x=>x.sourceSignedAreaCm2)).toEqual([16,-4]);expect(h.every(x=>x.orientationConsistent)).toBe(true);
  const shuffled=sectionContours({...section,segments:[...section.segments].reverse().map(([a,b])=>[b,a]),triangleIds:[...section.triangleIds].reverse()},u,v).loops;
  expect(sectionHierarchy(shuffled,s,u,v).map(x=>x.sourceSignedAreaCm2).sort((a,b)=>a!-b!)).toEqual([-4,16]);
 }
 expect(windingAt(s,[0,0,0])).toBeCloseTo(0,10);expect(windingAt(s,[1.5,0,0])).toBeCloseTo(1,10);
});
it('rejects inconsistent face directions rather than assigning a solid label to a closed contour',()=>{
 const s=box(2),indices=Array.from(s.indices);[indices[0],indices[1]]=[indices[1],indices[0]];const broken={...s,indices};
 expect(seamTopology(broken).topology.inconsistentEdges).toBeGreaterThan(0);
 const section=sectionSurface(broken,2,0),h=sectionHierarchy(sectionContours(section,0,1).loops,broken,0,1);
 expect(h.some(x=>!x.orientationConsistent&&x.sourceSignedAreaCm2===null)).toBe(true);
});
it('keeps bilateral continuity samples, open bone and short motor-root identity uncertified',()=>{
 expect(report.boneTopology).toMatchObject({vertices:3705,faces:7308,degenerateFaces:4,closedConsistentlyOriented:false});
 expect(report.boneSeamDiagnostic.topology.boundaryEdges).toBe(32);
 for(const row of report.v2){expect(row.sections).toHaveLength(21);expect(row.sections.filter(s=>s.matches.some(m=>m.containerIndex!==null))).toHaveLength(18);expect(row.transitions.filter(t=>t.maxSharedBoneTriangles>0)).toHaveLength(17);expect(row.fullTunnelVerified).toBe(false);expect(row.namedForamenVerified).toBe(false);}
 for(const row of report.motorRoots){expect(row.id).toMatch(/^motor_root_of_trigeminal_nerve_[lr]$/);expect(row.boneAabbLowerBoundCm).toBeGreaterThan(1.214);expect(row.completeCourseVerified).toBe(false);expect(row.foramenOvaleVerified).toBe(false);expect(row.sections.every(s=>s.boneSegments===0&&s.strictBoneContainers.every(n=>n===0))).toBe(true);}
 expect(report.sourceFiles.every(s=>/^[a-f0-9]{64}$/.test(s.sha256))).toBe(true);
});
