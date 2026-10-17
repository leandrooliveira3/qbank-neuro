"""Extract omitted supra-aortic/cervical source surfaces, preserving source transforms."""
import copy, hashlib, json, sys
from pathlib import Path
from import_open_anatomy import ROOT, read_glb, bounds, subset

IDS={'aortic_arch','brachiocephalic_trunk','right_subclavian_artery','left_subclavian_artery'}
for name in ['inferior_thyroid_artery','thyrocervical_trunk','costocervical_trunk','supreme_intercostal_artery','transverse_cervical_artery']:
    IDS.update({name+'_l',name+'_r'})

def main():
    source=Path(sys.argv[1])/'public/anatomy'
    original=json.loads((ROOT/'features/neuro3d/open-anatomy.json').read_text())
    manifest=json.loads((source/'manifest.json').read_text())
    doc,binary=read_glb(source/'cardiovascular_male.glb')
    nodes={n['name']:n for n in doc['nodes'] if 'mesh' in n}; selected=[]; structures=[]
    file='supra_aortic.glb'
    for organ in manifest['organs']:
        if organ['organ_id'] not in IDS:continue
        assert organ['system']=='cardiovascular' and 'Systemic arteries' in organ['path']
        node=copy.deepcopy(nodes[organ['node']]); low,high=bounds(doc,node)
        node.setdefault('extras',{})['qbankAnatomyId']=organ['organ_id']; selected.append(node)
        structures.append({'id':organ['organ_id'],'name':organ['name_en'],'latin':organ['ta2_latin'],'node':organ['node'],'layer':'arterial','file':file,'path':organ['path'],'bounds':[low,high],'reviewStatus':'upstream-label-unreviewed'})
    assert {row['id'] for row in structures}==IDS
    assert not IDS.intersection(row['id'] for row in original['structures'])
    raw=subset(doc,binary,selected);(ROOT/'public/neuro3d/open-anatomy'/file).write_bytes(raw)
    result={key:original[key] for key in ['sourceRepository','sourceCommit','license','attribution','coordinateSystem']}
    result.update(structures=structures,assets=[{'file':file,'sha256':hashlib.sha256(raw).hexdigest(),'size':len(raw),'structures':len(selected),'upstreamSha256':hashlib.sha256((source/'cardiovascular_male.glb').read_bytes()).hexdigest()}])
    (ROOT/'features/neuro3d/supra-aortic.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
    print(len(structures),'arteries;',len(raw),'bytes')
if __name__=='__main__':main()
