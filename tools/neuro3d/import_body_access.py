"""Import original right radial/femoral access arteries in the shared atlas frame."""
import argparse,copy,hashlib,json
from pathlib import Path
from import_open_anatomy import ROOT,read_glb,bounds,subset
IDS={'thoracic_aorta','abdominal_aorta','common_iliac_artery_r','external_iliac_artery_r','femoral_artery_r','axillary_artery_r','brachial_artery_r','radial_artery_r'}
def main():
 p=argparse.ArgumentParser();p.add_argument('source',type=Path);p.add_argument('--stage',type=Path);a=p.parse_args()
 source=a.source/'public/anatomy';base=json.loads((ROOT/'features/neuro3d/open-anatomy.json').read_text());doc,binary=read_glb(source/'cardiovascular_male.glb');nodes={n['name']:n for n in doc['nodes'] if 'mesh' in n};selected=[];structures=[];file='body_access.glb'
 for organ in json.loads((source/'manifest.json').read_text())['organs']:
  if organ['organ_id'] not in IDS:continue
  assert organ['system']=='cardiovascular' and 'Systemic arteries' in organ['path']
  n=copy.deepcopy(nodes[organ['node']]);lo,hi=bounds(doc,n);n.setdefault('extras',{})['qbankAnatomyId']=organ['organ_id'];selected.append(n)
  structures.append({'id':organ['organ_id'],'name':organ['name_en'],'latin':organ['ta2_latin'],'node':organ['node'],'layer':'arterial','file':file,'path':organ['path'],'bounds':[lo,hi],'reviewStatus':'upstream-label-unreviewed'})
 assert {o['id'] for o in structures}==IDS
 target=a.stage or ROOT/'public/neuro3d/open-anatomy';target.mkdir(parents=True,exist_ok=True);encoded=subset(doc,binary,selected);(target/file).write_bytes(encoded)
 result={k:base[k] for k in ['sourceRepository','sourceCommit','license','attribution','coordinateSystem']};result.update(structures=structures,assets=[{'file':file,'size':len(encoded),'structures':len(structures),'sha256':hashlib.sha256(encoded).hexdigest(),'upstreamSha256':hashlib.sha256((source/'cardiovascular_male.glb').read_bytes()).hexdigest()}])
 metadata=(a.stage/'body-access.json') if a.stage else ROOT/'features/neuro3d/body-access.json';metadata.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n');print(len(structures),'arteries;',len(encoded),'bytes')
if __name__=='__main__':main()
