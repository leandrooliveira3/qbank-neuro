"""Build an explicitly unvalidated source-frame arch access graph with lumen checks.
Usage: python build_access_network.py DECODED_JSON AXES_JSON
Missing carotid axes are read from the existing pinned reference axes or extracted.
"""
import argparse,json,copy,numpy as np
from pathlib import Path
import extract_reference_axes as ex
from import_open_anatomy import ROOT

def main():
 parser=argparse.ArgumentParser();parser.add_argument('decoded',type=Path);parser.add_argument('axes',type=Path);args=parser.parse_args()
 ex.D=json.loads(args.decoded.read_text());raw=json.loads((ROOT/'features/neuro3d/reference-network.json').read_text())
 source=json.loads(args.axes.read_text());axes={r['id']:r for r in source} if isinstance(source,list) else source
 ids=['aortic_arch','brachiocephalic_trunk','left_common_carotid_artery','right_common_carotid_artery','left_subclavian_artery','right_subclavian_artery','internal_carotid_artery_l','internal_carotid_artery_r','external_carotid_artery_l','external_carotid_artery_r']
 for id in ids:
  if id not in axes:axes[id]=copy.deepcopy(raw['originalAxes'].get(id)) if id in raw['originalAxes'] else ex.centerline(id)
 # Arc is traversed retrograde from its posterior/descending side; carotids from caudal to cranial.
 for id in ids:
  points=axes[id]['points']; reverse=points[0][2]>points[-1][2] if id=='aortic_arch' else points[0][1]>points[-1][1]
  if id in ['left_subclavian_artery','right_subclavian_artery']:reverse=abs(points[0][0])>abs(points[-1][0])
  if reverse:axes[id]['points'].reverse();axes[id]['radii'].reverse()
 grids={};checks=[];routes={}
 def check(parent,child,a,b):
  gap=float(np.linalg.norm(np.array(a)-b));samples=np.linspace(a,b,max(3,int(gap/.04)+1));inside=np.zeros(len(samples),bool)
  for id in [parent,child]:
   if id not in grids:grids[id]=ex.capped(ex.D[id]).voxelized(.08).fill()
   for offset in [[0,0,0],[.08,0,0],[-.08,0,0],[0,.08,0],[0,-.08,0],[0,0,.08],[0,0,-.08]]:inside|=grids[id].is_filled(samples+offset)
  row={'parentSource':parent,'childSource':child,'from':a,'to':b,'gapCm':gap,'samples':len(samples),'outsideLumenSamples':int((~inside).sum()),'toleranceCm':.08}
  checks.append(row)
  if row['outsideLumenSamples']:raise ValueError('Bridge leaves source lumen '+json.dumps(row))
  return gap
 def add(id,sid,name,points,children=None,sourceRange=None,gap=0):
  routes[id]={'id':id,'name':name,'anatomicalId':sid,'sourceId':sid,'points':points,'radius':float(np.median(axes[sid]['radii'])),'children':children or [],'sourceRange':sourceRange or [0,1],'junctionGapCm':gap,'syntheticJunction':gap>0}
 arc=axes['aortic_arch']['points'];length=np.r_[0,np.cumsum(np.linalg.norm(np.diff(arc,axis=0),axis=1))];fractions=length/length[-1]
 branches=[]
 for sid,rid,name in [('left_subclavian_artery','ref-SUB-L','Subclávia esquerda'),('left_common_carotid_artery','ref-CCA-L','Carótida comum esquerda'),('brachiocephalic_trunk','ref-BCT','Tronco braquiocefálico')]:
  idx=int(np.argmin(np.linalg.norm(np.array(arc)-axes[sid]['points'][0],axis=1)));branches.append((idx,sid,rid,name))
 branches.sort();assert len({row[0] for row in branches})==3
 start=0
 for k,(idx,sid,rid,name) in enumerate(branches):
  current='access' if k==0 else 'ref-ARCH-'+str(k);following='ref-ARCH-'+str(k+1)
  add(current,'aortic_arch','Arco aórtico · entrada descendente' if k==0 else 'Arco aórtico · segmento '+str(k+1),arc[start:idx+1],[following,rid],[float(fractions[start]),float(fractions[idx])])
  gap=check('aortic_arch',sid,arc[idx],axes[sid]['points'][0]);add(rid,sid,name,[arc[idx]]+axes[sid]['points'],gap=gap);start=idx
 add('ref-ARCH-3','aortic_arch','Arco aórtico · extremidade ascendente',arc[start:],sourceRange=[float(fractions[start]),1])
 def attach(parentId,childId,sid,name,points=None,sourceRange=None):
  parent=routes[parentId];p=points or axes[sid]['points'];gap=check(parent['sourceId'],sid,parent['points'][-1],p[0]);add(childId,sid,name,[parent['points'][-1]]+p,sourceRange=sourceRange,gap=gap);parent['children'].append(childId)
 attach('ref-BCT','ref-CCA-R','right_common_carotid_artery','Carótida comum direita')
 attach('ref-BCT','ref-SUB-R','right_subclavian_artery','Subclávia direita')
 # Retain the existing short cervical ICA entry and all established left intracranial routes.
 old=raw['routes']['access'];attach('ref-CCA-L','ref-ICA-L-entry','internal_carotid_artery_l','Entrada cervical da ACI esquerda',points=old['points'],sourceRange=old['sourceRange']);routes['ref-ICA-L-entry']['children']=['ref-ICA-L']
 attach('ref-CCA-L','ref-ECA-L','external_carotid_artery_l','Carótida externa esquerda')
 attach('ref-CCA-R','ref-ICA-R','internal_carotid_artery_r','Carótida interna direita · ramo terminal deste exercício')
 attach('ref-CCA-R','ref-ECA-R','external_carotid_artery_r','Carótida externa direita')
 result={'version':1,'sourceCommit':raw['sourceCommit'],'license':'CC-BY-SA-4.0','units':'cm','entry':'Virtual descending-side arch entry, no femoral or whole descending aorta reconstruction','method':'Source-frame voxel skeletons; piecewise arch; numerical in-lumen junctions, not clinical validation','reviewStatus':'unvalidated-educational','routes':routes,'originalAxes':{id:axes[id] for id in ids},'junctions':checks,'limits':['Retrograde access tree is not a haemodynamic flow model','Subclavians and external carotids terminate here; no branch navigation','Right intracranial branches and femoral/radial access are not navigable']}
 (ROOT/'features/neuro3d/reference-access-network.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
 print(json.dumps({'routes':len(routes),'junctions':len(checks),'outsideLumenSamples':sum(row['outsideLumenSamples'] for row in checks)}))
if __name__=='__main__':main()
