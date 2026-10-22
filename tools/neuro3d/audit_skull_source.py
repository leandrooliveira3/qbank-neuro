"""Directed provenance audit against pinned CC BY-SA source, read-only inputs."""
import argparse,hashlib,json,struct,importlib.util
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
def sha(b):return hashlib.sha256(b).hexdigest()
def read(path):
 b=path.read_bytes();n=struct.unpack_from('<I',b,12)[0];return b,json.loads(b[20:20+n]),b[28+n:]
def main():
 p=argparse.ArgumentParser();p.add_argument('source',type=Path);p.add_argument('skull',type=Path);a=p.parse_args()
 spec=importlib.util.spec_from_file_location('lineage',Path(__file__).with_name('audit_sinus_lineage.py'));module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)
 raw=json.loads((ROOT/'features/neuro3d/open-anatomy.json').read_text());asset=next(x for x in raw['assets'] if x['file']=='cardiovascular_head.glb')
 ub,ud,ubin=read(a.source/'cardiovascular_male.glb');sb,sd,sbin=read(ROOT/'public/neuro3d/open-anatomy/cardiovascular_head.glb')
 assert sha(ub)==asset['upstreamSha256'] and sha(sb)==asset['sha256']
 audit=json.loads((a.source/'vendor-audit.json').read_text());export=json.loads((a.source/'vendor-reports-cardiovascular.json').read_text())
 rows=[]
 for item in raw['structures']:
  if item['id'].removesuffix('_l').removesuffix('_r') not in ['artery_of_pterygoid_canal','lacrimal_artery','middle_meningeal_artery']:continue
  original=module.evidence(ud,ubin,item['node']);derived=module.evidence(sd,sbin,item['node']);assert original==derived
  rows.append({'id':item['id'],'node':item['node'],'sourceObject':audit['objects'][item['node']],
   'exportReport':next(x for x in export['objects'] if x['name']==item['node']),
   'primitiveAndTransformExactlyEqual':True,'primitive':original,'anatomicalIdentityApproved':False})
 bone,bd,_=read(a.skull/'skeletal_male.glb');meta=json.loads((ROOT/'features/neuro3d/landmarks.json').read_text());boneasset=next(x for x in meta['assets'] if x['file']=='landmarks_bone.glb');assert sha(bone)==boneasset['upstreamSha256']
 skeletal=json.loads((a.skull/'vendor-reports-skeletal.json').read_text())
 labels=[]
 for name in ['Foramen rotundum.j','Foramen ovale.j','Foramen spinosum.j','Pterygoid canal.j']:
  labels.append({'name':name,'vendorType':audit['objects'][name]['type'],'listedAsSkipped':name in skeletal['skipped'],
   'exportedReportObject':any(x['name']==name for x in skeletal['objects']),'hasGLBNode':any(n['name']==name for n in bd['nodes']),
   'interpretation':'Vendor MESH type alone does not establish usable evaluated geometry; exporter skips objects with zero evaluated polygons.'})
 catalogue=json.loads((ROOT/'features/neuro3d/educational-vascular-paths.json').read_text())
 controls=next(t for t in catalogue['templates'] if t['id']=='sphenoid_ridge_branch')
 result={'schema':1,'baseCommit':'cc947c3e181816be6d91169ac0fcf616fe89dad5','sourceCommit':raw['sourceCommit'],'license':raw['license'],'attribution':raw['attribution'],
  'sourceFiles':[{'file':str(x.name),'sha256':sha(x.read_bytes())} for x in [a.source/'cardiovascular_male.glb',a.source/'vendor-audit.json',a.source/'vendor-reports-cardiovascular.json',a.skull/'skeletal_male.glb',a.skull/'vendor-reports-skeletal.json',ROOT/'features/neuro3d/educational-vascular-paths.json',ROOT/'tools/neuro3d/build_educational_vessels.py']],
  'vascularNodes':rows,'foramenLabels':labels,'sphenoidRidgeIllustration':controls,
  'limits':'No original Startup.blend execution, no BodyParts3D/FMA per-object mapping, no new geometry imported. Unchanged upstream primitives do not certify anatomy. Hand-authored sphenoid controls are not an imaged anastomosis. ICA-origin vidian component and meningo-lacrimal/recurrent component remain unrepresented or unverified as distinct roles.'}
 (ROOT/'docs/neuro3d-skull-source-audit.json').write_text(json.dumps(result,indent=2,ensure_ascii=False)+'\n',encoding='utf-8')
 print(json.dumps({'vascularNodesEqual':len(rows),'skippedForamenLabels':len(labels),'originalBoneSHA':sha(bone)}))
if __name__=='__main__':main()
