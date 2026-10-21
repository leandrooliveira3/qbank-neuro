"""Audit sampled illustrative Galen axis against ALL original sinus triangles.
Input is decode_reference_meshes.mjs output, not the simplified projection pack.
No snapping, registration, bridge, naming correction or anatomy approval.
"""
import argparse,hashlib,json,struct
from pathlib import Path
import numpy as np
ROOT=Path(__file__).resolve().parents[2]
def closest(p,t):
    a,b,c=t[:,0],t[:,1],t[:,2];ab=b-a;ac=c-a;n=np.cross(ab,ac);nn=(n*n).sum(1)
    projected=p-((p-a)*n).sum(1)[:,None]*n/np.maximum(nn[:,None],1e-30)
    d00=(ab*ab).sum(1);d01=(ab*ac).sum(1);d11=(ac*ac).sum(1);v=projected-a
    d20=(v*ab).sum(1);d21=(v*ac).sum(1);den=d00*d11-d01*d01
    u=(d11*d20-d01*d21)/np.maximum(den,1e-30);w=(d00*d21-d01*d20)/np.maximum(den,1e-30)
    valid=(nn>1e-20)&(u>=0)&(w>=0)&(u+w<=1)
    candidates=[]
    q=projected.copy();q[~valid]=np.inf;candidates.append(q)
    for x,y in [(a,b),(b,c),(c,a)]:
        edge=y-x;f=np.clip(((p-x)*edge).sum(1)/np.maximum((edge*edge).sum(1),1e-30),0,1);candidates.append(x+f[:,None]*edge)
    q=np.concatenate(candidates);dist=((q-p)**2).sum(1);i=int(dist.argmin());return float(np.sqrt(dist[i])),q[i].tolist()
if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--decoded',type=Path,required=True);args=p.parse_args();raw=args.decoded.read_bytes();meshes=json.loads(raw)
    manifest=json.loads((ROOT/'features/neuro3d/open-anatomy.json').read_text());landmarks=json.loads((ROOT/'features/neuro3d/landmarks.json').read_text());verified=[]
    for asset in manifest['assets']+landmarks['assets']:
        payload=(ROOT/'public/neuro3d/open-anatomy'/asset['file']).read_bytes();h=hashlib.sha256(payload).hexdigest()
        if h!=asset['sha256']:raise ValueError('Source hash mismatch')
        verified.append({'file':asset['file'],'sha256':h})
    mesh=meshes['straight_sinus'];points=np.array(mesh['positions']);faces=np.array(mesh['faces']);tri=points[faces]
    glb=(ROOT/'public/neuro3d/open-anatomy/cardiovascular_head.glb').read_bytes();doc=json.loads(glb[20:20+struct.unpack_from('<I',glb,12)[0]])
    index,node=next((i,n) for i,n in enumerate(doc['nodes']) if n.get('extras',{}).get('qbankAnatomyId')=='straight_sinus')
    primitives=doc['meshes'][node['mesh']]['primitives']
    if len(primitives)!=1 or any(index in n.get('children',[]) for n in doc['nodes']):raise ValueError('Decoder assumptions invalid for full sinus')
    primitive=primitives[0]
    if doc['accessors'][primitive['attributes']['POSITION']]['count']!=len(points) or doc['accessors'][primitive['indices']]['count']!=len(faces)*3:raise ValueError('Original geometry incomplete')
    prior=json.loads((ROOT/'docs/neuro3d-inventory-reconciliation.json').read_text());samples=[]
    for row in prior['galenStraight']['sampledAxisDistances']:
        distance,q=closest(np.array(row['pointAtlasCm']),tri);samples.append({'axisIndex':row['index'],'pointAtlasCm':row['pointAtlasCm'],'distanceToOriginalTrianglesCm':distance,'closestPointAtlasCm':q})
    context=[]
    for id in ['straight_sinus','thalamus_l','thalamus_r','midbrain_l','midbrain_r','occipital_pole_l','occipital_pole_r','occipital_bone']:
        if id in meshes:
            v=np.array(meshes[id]['positions']);context.append({'id':id,'vertices':len(v),'triangles':len(meshes[id]['faces']),'boundsAtlasCm':[v.min(0).tolist(),v.max(0).tolist()],'identityApproved':False})
    result={'schema':1,'coordinateSystem':'atlas centimetres; original node transforms baked x100, Y-160','decodedSHA256':hashlib.sha256(raw).hexdigest(),'verifiedSourceAssets':verified,
            'originalSinusVertices':len(points),'originalSinusTriangles':len(faces),'context':context,'samples':samples,'connectionVerified':False,'anatomicalApproval':False,
            'method':'For every sampled illustrative axis point: closest point over every original triangle, including face projection and all edge segments. Not a wall-to-wall or continuous-axis distance. No geometric correction.',
            'limitations':'Labels and authored Galen path unreviewed. Nearest point does not identify an ostium or prove drainage/patency. Seven diagram identities unchanged.'}
    (ROOT/'docs/neuro3d-straight-sinus-original-audit.json').write_text(json.dumps(result,indent=2)+'\n')
    print(json.dumps({k:result[k] for k in ['originalSinusVertices','originalSinusTriangles','context']}));print(json.dumps([samples[0],samples[-1]]))
