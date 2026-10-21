import {it,expect} from 'vitest';
import {createHash} from 'node:crypto';
import report from './passage-geometry-audit.json';
import {reconstructedVessels} from './reconstructedVessels';
import {openAnatomy} from './openAnatomy';
import {surfaceEvidenceBytes} from './passageGeometry';
import {resolveVenousReview,venousStudyReviews} from './venousStudyReview';
it('keeps targeted evidence bilateral, source-bound and separate from anatomical approval',()=>{
  expect(report.routes).toHaveLength(8);expect(report.routes.flatMap(r=>r.links)).toHaveLength(26);
  for(const source of report.sourceFiles)expect(openAnatomy.assets.find(a=>a.file===source.file)?.sha256).toBe(source.sha256);
  for(const route of report.routes){
    expect(route.foramenPositionVerified).toBe(false);expect(route.anastomosisLumenVerified).toBe(false);
    for(const s of route.surfaces){
      expect(s.id.endsWith(route.side==='l'?'_r':'_l')).toBe(false);
      if(s.origin==='illustrative'){
        const item=reconstructedVessels.find(v=>v.id===s.id)!;
        expect(createHash('sha256').update(new Uint8Array(surfaceEvidenceBytes({id:item.id,layer:item.layer,origin:'illustrative',...item.surface}))).digest('hex')).toBe(s.sha256);
      }
    }
    for(const link of route.links){
      expect(link.aabbLowerBoundCm).toBeLessThanOrEqual(link.sampledUpperBoundCm+1e-7);
      expect(Math.hypot(...link.witness.from.map((v,k)=>v-link.witness.to[k]))).toBeCloseTo(link.sampledUpperBoundCm,9);
      expect(link.witness.targetBarycentric.reduce((a,b)=>a+b)).toBeCloseTo(1,9);expect(link.continuousLumenVerified).toBe(false);
    }
  }
});
it('retains genuine spatial separation findings and does not equate overlapping bounds with continuity',()=>{
  const separated=report.routes.flatMap(r=>r.links).filter(l=>l.globalSeparationProven);
  expect(separated).toHaveLength(4);
  for(const side of ['l','r']){
    const vidian=separated.find(l=>l.from===`artery_of_pterygoid_canal_${side}`)!;
    expect(vidian.aabbLowerBoundCm*10).toBeGreaterThan(4.57);
    expect(separated.find(l=>l.from===`sphenoid_ridge_branch_${side}`)!.aabbLowerBoundCm*10).toBeGreaterThan(3.78);
  }
  expect(report.routes.every(r=>r.fullCourseVerified===false)).toBe(true);
});
it('maps venous review by exact side while preserving absent tributaries and distinct unresolved terms',()=>{
  for(const row of venousStudyReviews)for(const side of ['l','r'] as const){
    for(const item of resolveVenousReview(row,side))if(item.item){expect(item.item.layer).toBe('venous');expect(item.id.endsWith(side==='l'?'_r':'_l')).toBe(false);}
  }
  const deep=resolveVenousReview(venousStudyReviews[0],'r');
  expect(deep.find(r=>r.id==='direct_lateral_vein_r')?.origin).toBe('illustrative');
  expect(deep.find(r=>r.id==='posterior_caudate_veins')?.missing).toBe(true);
  expect(venousStudyReviews[2].url).toContain('/veins-posterior-fossa/');
});
