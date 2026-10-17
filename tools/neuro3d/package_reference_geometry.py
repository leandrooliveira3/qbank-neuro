import sys,json,numpy as np,trimesh,hashlib
from pathlib import Path
from scipy.spatial import cKDTree
root=Path(sys.argv[3]);manifest=json.loads((root/'features/neuro3d/open-anatomy.json').read_text());D=json.loads(Path(sys.argv[1]).read_text());C={r['id']:r for r in json.loads(Path(sys.argv[2]).read_text())};blob=bytearray();records=[]
for o in manifest['structures']:
 if o['layer'] not in ['bone','arterial','venous']:continue
 item=D[o['id']];mesh=trimesh.Trimesh(np.array(item['positions']),np.array(item['faces']),process=False)
 cap=1200 if o['layer']=='bone' else 700
 if len(mesh.faces)>cap:mesh=mesh.simplify_quadric_decimation(face_count=cap)
 # Make each component consistently wound. Reflections were already baked in decode.
 mesh.fix_normals(multibody=True)
 p=np.asarray(mesh.vertices,dtype='<f4').reshape(-1);f=np.asarray(mesh.faces,dtype='<u4').reshape(-1)
 pos=len(blob);blob.extend(p.tobytes());ind=len(blob);blob.extend(f.tobytes())
 rec={'id':o['id'],'layer':o['layer'],'positionsOffset':pos,'positionsCount':len(p),'indicesOffset':ind,'indicesCount':len(f),'originalFaces':len(item['faces'])}
 if o['id'] in C:
  axis=np.array(C[o['id']]['points']);distance=np.r_[0,np.cumsum(np.linalg.norm(np.diff(axis,axis=0),axis=1))];t=distance/distance[-1]
  nearest=cKDTree(axis).query(mesh.vertices)[1];values=np.asarray(t[nearest],dtype='<f4');rec['tOffset']=len(blob);rec['tCount']=len(values);blob.extend(values.tobytes())
 records.append(rec)
binpath=root/'public/neuro3d/open-anatomy/reference-surfaces.bin';binpath.write_bytes(blob)
metadata={'version':1,'coordinateSystem':'centimetres; source glTF world ×100, Y minus160; same as atlas display','sourceCommit':manifest['sourceCommit'],'license':'CC-BY-SA-4.0','sha256':hashlib.sha256(blob).hexdigest(),'size':len(blob),'structures':records}
(root/'features/neuro3d/reference-surfaces.json').write_text(json.dumps(metadata,indent=2)+'\n')
# A focused, unilateral cervical-ICA entry. No synthetic femoral/arch registration.
ica=C['internal_carotid_artery_l'];points=ica['points'];r=ica['radii'];cum=np.r_[0,np.cumsum(np.linalg.norm(np.diff(points,axis=0),axis=1))];cum/=cum[-1]
net={'access':{'name':'Entrada cervical da ACI esquerda','anatomicalId':'internal_carotid_artery_l','sourceId':'internal_carotid_artery_l','sourceRange':[0,float(cum[1])],'points':points[:2],'radius':float(np.median(r[:2])),'children':['ref-ICA-L']},'ref-ICA-L':{'name':'Artéria carótida interna esquerda','anatomicalId':'internal_carotid_artery_l','sourceId':'internal_carotid_artery_l','sourceRange':[float(cum[1]),1],'points':points[1:],'radius':float(np.median(r)),'children':[]}}
end=np.array(points[-1]);connections=[]
for sid,id in [('middle_cerebral_artery_m1_segment_l','ref-M1-L'),('anterior_cerebral_artery_l','ref-ACA-L'),('ophthalmic_artery_l','ref-OA-L')]:
 c=C[sid];p=np.array(c['points']);rr=c['radii']
 reverse=bool(np.linalg.norm(p[0]-end)>np.linalg.norm(p[-1]-end))
 if reverse:p=p[::-1];rr=rr[::-1]
 gap=float(np.linalg.norm(p[0]-end));name=next(o['name'] for o in manifest['structures'] if o['id']==sid)
 net[id]={'name':name,'anatomicalId':sid,'sourceId':sid,'points':[end.tolist()]+p.tolist(),'radius':float(np.median(rr)),'children':[],'junctionGapCm':gap,'syntheticJunction':True,'sourceReverse':reverse}
 net['ref-ICA-L']['children'].append(id);connections.append({'parent':'ref-ICA-L','child':id,'centerlineGapCm':round(gap,4),'status':'numerically-bridged-within-source-voxel-tolerance; human-review-pending'})
extras={
 'ref-M1-L':['parietal_branches_of_middle_cerebral_artery_l','temporal_branches_of_middle_cerebral_artery_l'],
 'ref-ACA-L':['orbitofrontal_branches_of_anterior_cerebral_artery_l'],
 'ref-OA-L':[o['id'] for o in manifest['structures'] if o['layer']=='arterial' and o['id'].endswith('_l') and any(k in o['id'] for k in ['retinal','ciliary','ethmoidal','lacrimal','supraorbital','supratrochlear'])]}
for id,n in net.items():n['id']=id;n['visualBranches']=extras.get(id,[])
network={'version':1,'sourceCommit':manifest['sourceCommit'],'license':'CC-BY-SA-4.0','units':'cm','entry':'Left cervical ICA; upstream access not included','method':'0.8mm voxel medial skeleton; longest connected path; source frame preserved','reviewStatus':'numeric checks only; specialist review pending','connections':connections,'routes':net,'originalAxes':C}
(root/'features/neuro3d/reference-network.json').write_text(json.dumps(network,indent=2)+'\n')
print('binary',len(blob),'faces',sum(o['indicesCount']//3 for o in records),'routes',len(net))
