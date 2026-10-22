import {it,expect} from 'vitest';
import {neurovascularPassages,resolvePassage,passagesForVessel} from './neurovascularPassages';
import {vascularStudyFamily} from './vascularStudyFamilies';
it('resolves named vascular links per side without opposite-side substitution or certifying a foramen or patent lumen',()=>{
  for(const row of neurovascularPassages)for(const side of ['l','r'] as const){
    const result=resolvePassage(row,side);
    expect(result.vesselIds.length).toBeGreaterThan(1);expect(result.missingVesselIds).toEqual([]);
    expect(result.vesselIds.some(id=>id.endsWith(side==='l'?'_r':'_l'))).toBe(false);
    expect(result.foramenSurfaceIdentified).toBe(false);expect(result.anastomosisLumenVerified).toBe(false);
    expect(result.trajectoryCompleteVerified).toBe(false);
    for(const edge of result.studyLinks){expect(result.vesselIds).toContain(edge.from);expect(result.vesselIds).toContain(edge.to);expect(edge.geometryVerified).toBe(false);}
  }
});
it('distinguishes C2 from C4, alternative orbital and Vesalius paths, and individual MMA branches from the trunk',()=>{
  expect(neurovascularPassages.find(row=>row.id==='vidian')?.segment).toContain('C2');
  expect(neurovascularPassages.find(row=>row.id==='rotundum')?.segment).toContain('C4');
  expect(neurovascularPassages.find(row=>row.id==='vesalius')?.relationship).toContain('não é universal');
  expect(resolvePassage(neurovascularPassages.find(row=>row.id==='hypoglossal-canal')!,'l').contextIds).toContain('hypoglossal_nerve_xii_l');
  expect(resolvePassage(neurovascularPassages.find(row=>row.id==='jugular-foramen')!,'r').contextIds).toEqual(expect.arrayContaining(['glossopharyngeal_nerve_ix_r','vagus_nerve_x_r','accessory_nerve_xi_r']));
  expect(passagesForVessel('middle_meningeal_artery_l').map(row=>row.id)).toEqual(expect.arrayContaining(['spinosum','meningolacrimal','superior-orbital-fissure']));
  const family=vascularStudyFamily('middle_meningeal_artery_l');
  expect(family.ids.has('cavernous_branch_of_middle_meningeal_artery_l')).toBe(true);
  expect(family.ids.has('sphenoid_ridge_branch_l')).toBe(true);
  expect(family.ids.has('cavernous_branch_of_middle_meningeal_artery_r')).toBe(false);
});
