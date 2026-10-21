import {openAnatomy} from './openAnatomy';
import {reconstructedVessels} from './reconstructedVessels';
import {vascularQuarantine} from './vascularQuarantine';
const structures=new Map([...openAnatomy.structures,...reconstructedVessels].map(row=>[row.id,row]));
/** An explicit reveal-and-isolate action, never a change to source geometry.
 * Ordinary selection/visibility controls retain their existing semantics. */
export function vascularExploration(id:string,hidden:ReadonlySet<string>,opacity:Record<string,number>){
  const item=structures.get(id);
  if(!item||!['arterial','venous'].includes(item.layer))return undefined;
  // A corrected reconstruction can reuse a quarantined original ID.
  if(vascularQuarantine.has(id)&&!reconstructedVessels.some(row=>row.id===id))return undefined;
  const nextHidden=new Set(hidden);nextHidden.delete(id);
  return {item,hidden:nextHidden,opacity:{...opacity,[item.layer]:1},layer:item.layer as 'arterial'|'venous',
    embryonic:'embryonic' in item&&item.embryonic===true};
}
