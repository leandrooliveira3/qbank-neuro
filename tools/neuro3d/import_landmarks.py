"""Import missing skull, sellar and dural landmarks in the original atlas frame."""
import copy, hashlib, json, sys
from pathlib import Path
from import_open_anatomy import ROOT, read_glb, bounds, subset

SKULL = {'ethmoid_bone','frontal_bone','occipital_bone','sphenoid_bone','vomer','hyoid_bone'}
for name in ['parietal_bone','temporal_bone','lacrimal_bone','nasal_bone','palatine_bone','zygomatic_bone','inferior_nasal_concha_bone','incus','malleus','stapes']:
    SKULL.update({name+'_l',name+'_r'})
GROUPS = [('skeletal','bone',SKULL), ('endocrine','gland',{'adenohypophysis','neurohypophysis'}), ('nervous','dura',{'falx_cerebri','tentorium_cerebelli_l','tentorium_cerebelli_r'})]

def main():
    source=Path(sys.argv[1])/'public/anatomy'
    manifest=json.loads((source/'manifest.json').read_text())
    original=json.loads((ROOT/'features/neuro3d/open-anatomy.json').read_text())
    existing={o['id'] for o in original['structures']}
    structures=[]; assets=[]
    for system,layer,ids in GROUPS:
        doc,binary=read_glb(source/(system+'_male.glb'))
        nodes={n['name']:n for n in doc['nodes'] if 'mesh' in n}; selected=[]
        out='landmarks_'+layer+'.glb'
        found=set()
        for organ in manifest['organs']:
            if organ['system']!=system or organ['organ_id'] not in ids: continue
            found.add(organ['organ_id'])
            if organ['organ_id'] in existing:continue
            node=copy.deepcopy(nodes[organ['node']]); low,high=bounds(doc,node)
            node.setdefault('extras',{})['qbankAnatomyId']=organ['organ_id']; selected.append(node)
            structures.append({'id':organ['organ_id'],'name':organ['name_en'],'latin':organ['ta2_latin'],'node':organ['node'],'layer':layer,'file':out,'path':organ['path'],'bounds':[low,high],'reviewStatus':'upstream-label-unreviewed'})
        assert found==ids, ids-found
        raw=subset(doc,binary,selected)
        (ROOT/'public/neuro3d/open-anatomy'/out).write_bytes(raw)
        assets.append({'file':out,'sha256':hashlib.sha256(raw).hexdigest(),'size':len(raw),'structures':len(selected),'upstreamSha256':hashlib.sha256((source/(system+'_male.glb')).read_bytes()).hexdigest()})
    result={key:original[key] for key in ['sourceRepository','sourceCommit','license','attribution','coordinateSystem']}
    result.update(assets=assets,structures=structures)
    (ROOT/'features/neuro3d/landmarks.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps({'structures':len(structures),'assets':assets},indent=2))
if __name__=='__main__':main()
