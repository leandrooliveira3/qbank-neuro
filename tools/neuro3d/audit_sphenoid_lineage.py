"""One source object, read-only comparison; never runs the sinus audit."""
import json,hashlib,importlib.util
from pathlib import Path
root=Path(__file__).resolve().parents[2]
spec=importlib.util.spec_from_file_location('helpers',Path(__file__).with_name('audit_sinus_lineage.py'));m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
up,ud,ub=m.glb(root.parent/'artifacts/skull-evidence/skeletal_male.glb');local,ld,lb=m.glb(root/'public/neuro3d/open-anatomy/landmarks_bone.glb')
meta=json.loads((root/'features/neuro3d/landmarks.json').read_text(encoding='utf-8'));asset=next(a for a in meta['assets'] if a['file']=='landmarks_bone.glb')
assert m.sha(up)==asset['upstreamSha256'] and m.sha(local)==asset['sha256']
original=m.evidence(ud,ub,'Sphenoid bone');derived=m.evidence(ld,lb,'Sphenoid bone');assert original==derived
def ancestry(doc):
 i=next(i for i,n in enumerate(doc['nodes']) if n['name']=='Sphenoid bone');rows=[];seen=set()
 while True:
  assert i not in seen;seen.add(i);n=doc['nodes'][i];rows.append({k:n[k] for k in ['name','matrix','translation','rotation','scale'] if k in n})
  parents=[j for j,p in enumerate(doc['nodes']) if i in p.get('children',[])];assert len(parents)<2
  if not parents:return rows
  i=parents[0]
assert ancestry(ud)==ancestry(ld)
r={'schema':1,'sourceCommit':'6320bd64df8db2fcfed358a27c85d1fcc1c5913c','license':'CC-BY-SA-4.0','upstreamSHA256':m.sha(up),'subsetSHA256':m.sha(local),'primitiveAndFullAncestryExactlyEqual':True,'sourcePrimitive':original,'ancestry':ancestry(ud),'conclusion':'The identical compressed primitive and full ancestor transforms establish that source-mesh boundary defects were not introduced by the Qbank subset. This does not establish the anatomical identity or cause of each opening. No original Blender file executed, no repair or object renaming.'}
(root/'features/neuro3d/sphenoid-lineage-evidence.json').write_text(json.dumps(r,indent=2)+'\n',encoding='utf-8');print(json.dumps({'equal':True,'sourceObject':original['nodeName'],'parents':r['ancestry']}))
