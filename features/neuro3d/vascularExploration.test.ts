import {it,expect} from 'vitest';
import {vascularExploration} from './vascularExploration';
import {openAnatomy} from './openAnatomy';
import {reconstructedVessels} from './reconstructedVessels';
import {structureVisible} from './atlasInteraction';
import {vascularCompleteness} from './vascularCompleteness';
it('explicit exploration reveals every available vascular identity on its own layer without changing input visibility or geometry',()=>{
  for(const item of [...openAnatomy.structures,...reconstructedVessels].filter(r=>['arterial','venous'].includes(r.layer))){
    const hidden=new Set([item.id,'keep-hidden']),opacity={arterial:0,venous:0,bone:.1};
    const plan=vascularExploration(item.id,hidden,opacity)!;
    expect(plan.item).toBe(item);expect(plan.hidden.has('keep-hidden')).toBe(true);
    expect(hidden.has(item.id)).toBe(true);expect(opacity[item.layer]).toBe(0);
    expect(structureVisible(item.id,item.layer,plan.opacity,item.id,true,plan.hidden,true,plan.layer)).toBe(true);
  }
});
it('keeps additional cited venous channels absent instead of substituting collectors or inventing dataset labels',()=>{
  for(const id of ['vein_of_rolando','anterior_cerebral_vein','tentorial_sinus','lateral_atrial_veins']){
    const row=vascularCompleteness.find(r=>r.id===id)!;
    expect(row.status).toBe('missing');expect(row.ids).toEqual([]);expect(row.expectedIds).toHaveLength(2);
    expect(vascularExploration(`${id}_l`,new Set(),{})).toBeUndefined();
  }
  expect(vascularExploration('sphenoid_bone',new Set(),{})).toBeUndefined();
});
