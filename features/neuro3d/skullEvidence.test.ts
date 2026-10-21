import {it,expect} from 'vitest';
import evidence from './skull-landmark-evidence.json';
import audit from '../../docs/neuro3d-skull-source-audit.json';
import passage from './passage-geometry-audit.json';
import {strictlyEncloses} from './sectionContours';
import type {SectionLoop} from './sectionContours';
import {venousTermReconciliation} from './venousTermReconciliation';
it('keeps four bone-rim witnesses tied to existing original surfaces without certifying named foramina',()=>{
 expect(evidence.candidates).toHaveLength(4);
 for(const c of evidence.candidates){
  const route=passage.routes.find(r=>r.id==='rotundum'&&r.side===c.side)!;
  expect(route.surfaces.find(s=>s.id===c.boneId)?.sha256).toBe(c.boneSurfaceSHA256);expect(route.surfaces.find(s=>s.id===c.nerveId)?.sha256).toBe(c.nerveSurfaceSHA256);
  expect(c.boneContour.points).toContainEqual(c.pointCm);expect(c.boneContour.sourceTriangles).toContain(c.sourceTriangle);
  expect(c.barycentric.reduce((a,b)=>a+b)).toBeCloseTo(1,10);expect(c.barycentric.every(v=>v>=-1e-6&&v<=1+1e-6)).toBe(true);
  expect(c.residualCm).toBeLessThan(1e-6);expect(c.namedForamenVerified).toBe(false);expect(c.full3DTunnelVerified).toBe(false);expect(c.arterialPassageVerified).toBe(false);
  expect(strictlyEncloses(c.boneContour as SectionLoop,c.nerveContour as SectionLoop,0,1)).toBe(true);
  for(const d of c.relatedArterialDistances){expect(d.surfaceSHA256).toBe(route.surfaces.find(s=>s.id===d.id)?.sha256);expect(Math.hypot(...d.targetPointCm.map((v,k)=>v-c.pointCm[k]))).toBeCloseTo(d.pointToAllTrianglesDistanceCm,10);}
 }
});
it('distinguishes vendor labels with no exported geometry from source vessel meshes and authored controls',()=>{
 expect(audit.vascularNodes).toHaveLength(6);expect(audit.vascularNodes.every(r=>r.primitiveAndTransformExactlyEqual)).toBe(true);
 expect(audit.foramenLabels).toHaveLength(4);expect(audit.foramenLabels.every(r=>r.listedAsSkipped&&!r.hasGLBNode&&!r.exportedReportObject)).toBe(true);
 expect(audit.sphenoidRidgeIllustration.paths[0]).toHaveLength(3);
});
it('does not create venous identities from homonyms or transverse/longitudinal collectors',()=>{
 expect(venousTermReconciliation).toHaveLength(7);
 expect(venousTermReconciliation.every(r=>r.confirmedAtlasId===null&&!r.geometryCreated)).toBe(true);
 expect(venousTermReconciliation.find(r=>r.sourceTerm==='brachial vein')?.rejected).toContain('brachial_veins_l');
 expect(venousTermReconciliation.find(r=>r.sourceTerm==='tonsillar veins')?.rejected).toContain('tonsillar_branch_of_facial_artery');
 expect(venousTermReconciliation.every(r=>r.nomenclatureCheck.result?.confirmedAtlasId===null&&!r.nomenclatureCheck.result.geometryVerified)).toBe(true);
 expect(venousTermReconciliation.find(r=>r.sourceTerm==='brachial vein')?.nomenclatureCheck.result?.lexicalMatches).toEqual([{sourceId:'4982',englishLabel:'Brachial veins'}]);
});
