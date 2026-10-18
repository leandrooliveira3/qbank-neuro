"""Attach original right femoral/radial access axes, checking numerical junctions.
No needle, haemodynamic, device-force or patient-registration model is implied.
"""
import argparse,json,copy,numpy as np
from pathlib import Path
import extract_reference_axes as ex
from import_open_anatomy import ROOT

def main():
 p=argparse.ArgumentParser();p.add_argument('decoded',type=Path);p.add_argument('axes',type=Path);p.add_argument('--stage',type=Path);a=p.parse_args()
 ex.D=json.loads(a.decoded.read_text());base=json.loads((ROOT/'features/neuro3d/reference-access-network.json').read_text());axes={r['id']:r for r in json.loads(a.axes.read_text())}
 for row in axes.values():
  if row['points'][0][1]<row['points'][-1][1]:row['points'].reverse();row['radii'].reverse()
 routes=copy.deepcopy(base['routes']);routes['ref-ARCH-0']=routes.pop('access');routes['ref-ARCH-0']['id']='ref-ARCH-0';checks=[];grids={}
 def check(parent,child,a,b):
  gap=float(np.linalg.norm(np.array(a)-b));samples=np.linspace(a,b,max(3,int(gap/.06)+1));inside=np.zeros(len(samples),bool)
  for id in [parent,child]:
   if id not in grids:grids[id]=ex.capped(ex.D[id]).voxelized(.12).fill()
   for offset in [[0,0,0],[.12,0,0],[-.12,0,0],[0,.12,0],[0,-.12,0],[0,0,.12],[0,0,-.12]]:inside|=grids[id].is_filled(samples+offset)
  check={'parentSource':parent,'childSource':child,'from':a,'to':b,'gapCm':gap,'samples':len(samples),'outsideLumenSamples':int((~inside).sum()),'toleranceCm':.12};checks.append(check)
  if check['outsideLumenSamples']:raise ValueError('Bridge leaves source lumen '+json.dumps(check))
  return gap
 def add(id,sid,name,points,children,gap,reverse=False,range=None,end=False):
  routes[id]={'id':id,'sourceId':sid,'anatomicalId':sid,'name':name,'points':points,'children':children,'radius':float(np.median(axes[sid]['radii'])),'sourceRange':range or [0,1],'sourceReverse':reverse,'junctionGapCm':gap,'junctionAtEnd':end,'syntheticJunction':gap>0}
 child='ref-ARCH-0'
 for id,sid,name in [('ref-THORACIC','thoracic_aorta','Aorta torácica'),('ref-ABDOMINAL','abdominal_aorta','Aorta abdominal'),('ref-ILIAC-R','common_iliac_artery_r','Ilíaca comum direita'),('ref-EXT-ILIAC-R','external_iliac_artery_r','Ilíaca externa direita'),('access','femoral_artery_r','Acesso femoral direito · ponto virtual')]:
  row=axes[sid];points=copy.deepcopy(row['points']);sourceRange=[0,1]
  if sid=='femoral_artery_r':
   arc=np.r_[0,np.cumsum(np.linalg.norm(np.diff(points,axis=0),axis=1))];cut=max(1,int(np.searchsorted(arc,2)));points=points[:cut+1];sourceRange=[float(1-arc[cut]/arc[-1]),1]
  destination=routes[child]['points'][0];gap=check(sid,routes[child]['sourceId'],points[0],destination)
  add(id,sid,name,list(reversed(points))+[destination],[child],gap,True,sourceRange,True);child=id
 parent='ref-SUB-R'
 for id,sid,name in [('ref-AXILLARY-R','axillary_artery_r','Axilar direita'),('ref-BRACHIAL-R','brachial_artery_r','Braquial direita'),('ref-RADIAL-R','radial_artery_r','Radial direita · ponto virtual distal')]:
  start=routes[parent]['points'][-1];gap=check(routes[parent]['sourceId'],sid,start,axes[sid]['points'][0]);add(id,sid,name,[start]+axes[sid]['points'],[],gap);routes[parent]['children'].append(id);parent=id
 # Preserve a separate directed contrast topology before reversing access navigation.
 prefix={'access','ref-EXT-ILIAC-R','ref-ILIAC-R','ref-ABDOMINAL','ref-THORACIC'}
 for id,route in routes.items():route['contrastChildren']=[] if id in prefix else list(route['children'])
 femoral=copy.deepcopy(routes)
 # Treat the original edge tree as undirected geometry, then root at the distal radial endpoint.
 def key(point):return tuple(round(v,7) for v in point)
 graph={}
 for id,route in routes.items():
  for point in [route['points'][0],route['points'][-1]]:graph.setdefault(key(point),[]).append(id)
 radial={};seen=set()
 def walk(vertex):
  children=[]
  for id in graph[vertex]:
   if id in seen:continue
   seen.add(id);route=copy.deepcopy(routes[id]);reverse=key(route['points'][0])!=vertex
   if reverse:
    route['points'].reverse();route['sourceReverse']=not route.get('sourceReverse',False)
    lo,hi=route['sourceRange'];route['sourceRange']=[1-hi,1-lo]
    route['junctionAtEnd']=not route.get('junctionAtEnd',False);route['contrastReverse']=True
   external=[child for child in route['children'] if child not in routes]
   if reverse and external:raise ValueError('External branch needs explicit reroot handling: '+id)
   route['children']=walk(key(route['points'][-1]))+external;radial[id]=route;children.append(id)
  return children
 roots=walk(key(routes['ref-RADIAL-R']['points'][-1]));assert roots==['ref-RADIAL-R'] and len(seen)==len(routes)
 renames={'access':'ref-FEM-R','ref-RADIAL-R':'access'}
 radial={renames.get(id,id):dict(route,id=renames.get(id,id),children=[renames.get(c,c) for c in route['children']],contrastChildren=[renames.get(c,c) for c in route['contrastChildren']]) for id,route in radial.items()}
 radial['access']['name']='Acesso radial direito · ponto virtual distal'
 result={'version':1,'sourceCommit':base['sourceCommit'],'license':base['license'],'units':'cm','reviewStatus':'unvalidated-educational','routes':{'femoral':femoral,'radial':radial},'originalAxes':axes,'junctions':checks,'femoralPuncture':'Approximately 2 cm distal to proximal end of source femoral axis; virtual entry, not a puncture training landmark','radialPuncture':'Distal end of source right radial axis; virtual entry, hand/collateral circulation absent','limits':['Right-sided virtual accesses only','Numerical junctions within voxel tolerance; specialist review pending','Contrast graph separated from navigation; no full haemodynamics']}
 out=a.stage or ROOT/'features/neuro3d/reference-body-access-network.json';out.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n');print(json.dumps({'routesPerEntry':len(routes),'junctions':checks},indent=2))
if __name__=='__main__':main()
