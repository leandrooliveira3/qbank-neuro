"""Numerical audit of every ORIGINAL arterial and venous source mesh.

These checks detect corrupt, degenerate, open or disconnected geometry. They
cannot approve anatomical identity, origin, course, branches or drainage.
Source payloads and transforms are never changed by this script.
"""
import argparse, gzip, json, hashlib
from pathlib import Path
import numpy as np
from scipy.sparse import coo_matrix
from scipy.sparse.csgraph import connected_components
from scipy.spatial import cKDTree

ROOT=Path(__file__).resolve().parents[2]
PACKS=['open-anatomy','landmarks','supra-aortic','body-access','craniocervical','unindexed-vessels']


def audit_mesh(item, surface):
    vertices=np.asarray(surface['positions'],dtype=float).reshape(-1,3)
    faces=np.asarray(surface.get('faces',surface.get('indices')),dtype=np.int64).reshape(-1,3)
    finite=bool(np.isfinite(vertices).all())
    indices=bool(len(faces) and faces.min()>=0 and faces.max()<len(vertices))
    result={'id':item['id'],'layer':item['layer'],'vertices':len(vertices),'triangles':len(faces),'finite':finite,'indicesValid':indices,'anatomicalApproval':False}
    if not finite or not indices:return result
    triangles=vertices[faces]
    areas=np.linalg.norm(np.cross(triangles[:,1]-triangles[:,0],triangles[:,2]-triangles[:,0]),axis=1)/2
    edges=np.sort(np.concatenate([faces[:,[0,1]],faces[:,[1,2]],faces[:,[2,0]]]),axis=1)
    unique,counts=np.unique(edges,axis=0,return_counts=True)
    used=np.unique(faces)
    graph=coo_matrix((np.ones(len(unique)*2),(np.r_[unique[:,0],unique[:,1]],np.r_[unique[:,1],unique[:,0]])),shape=(len(vertices),len(vertices))).tocsr()
    components,labels=connected_components(graph[used][:,used],directed=False)
    source_labels=np.full(len(vertices),-1,dtype=int);source_labels[used]=labels
    component_records=[]
    for component in range(components):
        points=vertices[used[labels==component]]
        selected=source_labels[faces[:,0]]==component
        component_records.append({'ordinal':component+1,'vertices':len(points),'triangles':int(selected.sum()),
                                  'boundsCm':[points.min(axis=0).tolist(),points.max(axis=0).tolist()],
                                  'surfaceAreaCm2':round(float(areas[selected].sum()),5),
                                  'anatomicalIdentityAssigned':False})
    expected=np.asarray(item['bounds'])*100;expected[:,1]-=160
    low,high=vertices.min(axis=0),vertices.max(axis=0)
    result.update(usedVertexComponents=int(components),unusedVertices=int(len(vertices)-len(used)),
                  boundaryEdges=int((counts==1).sum()),nonManifoldEdges=int((counts>2).sum()),
                  degenerateTriangles=int((areas<1e-10).sum()),surfaceAreaCm2=round(float(areas.sum()),5),
                  boundsCm=[low.tolist(),high.tolist()],centroidCm=vertices.mean(axis=0).tolist(),
                  maxBoundsDifferenceCm=round(float(np.abs(np.vstack([low,high])-expected).max()),6),components=component_records)
    return result


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--decoded',type=Path,required=True,help='Unmodified decoded cardiovascular_head.glb in atlas cm')
    parser.add_argument('--output',type=Path,default=ROOT/'docs/neuro3d-vascular-geometry-audit.json')
    args=parser.parse_args()
    manifests=[json.loads((ROOT/f'features/neuro3d/{pack}.json').read_text()) for pack in PACKS]
    source=[item for manifest in manifests for item in manifest['structures'] if item['layer'] in ['arterial','venous']]
    files={item['file'] for item in source}
    verified_assets=[]
    for manifest in manifests:
        for asset in manifest['assets']:
            if asset['file'] not in files:continue
            raw=(ROOT/'public/neuro3d/open-anatomy'/asset['file']).read_bytes()
            digest=hashlib.sha256(raw).hexdigest()
            if digest != asset['sha256']:raise ValueError(f"Source asset hash mismatch: {asset['file']}")
            verified_assets.append({'file':asset['file'],'sha256':digest})
    surfaces=json.loads(args.decoded.read_text())
    for filename in ['reference-landmarks.json','reference-supra-aortic.json','reference-body-access.json','reference-craniocervical.json','reference-unindexed-vessels.json']:
        pack=json.loads((ROOT/'features/neuro3d'/filename).read_text())
        raw=(ROOT/'public/neuro3d/open-anatomy'/pack['file']).read_bytes()
        if hashlib.sha256(raw).hexdigest() != pack['sha256']:raise ValueError(f"Projection pack hash mismatch: {pack['file']}")
        rows=json.loads(gzip.decompress(raw))
        for row in rows:surfaces.setdefault(row['id'],row)
    missing=[item['id'] for item in source if item['id'] not in surfaces]
    if missing:raise ValueError(f'Unaccounted source geometry: {missing}')
    records=[audit_mesh(item,surfaces[item['id']]) for item in source]
    # Only explicitly declared candidate junctions are measured. Proximity does
    # not prove a patent lumen, flow direction, shared origin or normal variant.
    links=[]
    for side in ['l','r']:
        for a,b in [('external_carotid_artery','maxillary_artery'),('external_carotid_artery','ascending_pharyngeal_artery'),('transverse_sinus','sigmoid_sinus'),('sigmoid_sinus','internal_jugular_vein')]+[
                ('maxillary_artery',branch) for branch in ['middle_meningeal_artery','inferior_alveolar_artery','infra_orbital_artery','anterior_deep_temporal_artery','posterior_deep_temporal_artery','posterior_superior_alveolar_artery','buccal_artery','descending_palatine_artery','artery_of_pterygoid_canal']]:
            left,right=f'{a}_{side}',f'{b}_{side}'
            va=np.asarray(surfaces[left]['positions']).reshape(-1,3);vb=np.asarray(surfaces[right]['positions']).reshape(-1,3)
            distance=float(cKDTree(va).query(vb)[0].min())
            links.append({'from':left,'to':right,'minimumSurfaceVertexDistanceCm':round(distance,6),'connectionVerified':False,
                          'interpretation':'Candidate named relationship only; origins can vary, especially vidian. No lumen/flow/side-branch identity inferred from proximity.'})
    # Compare every explicitly sided homolog in the supplied source. Reflect x
    # only for a numerical comparison, NEVER to create or replace a vessel.
    # Symmetry is not proof of anatomy, patient origin or a shared lumen.
    source_ids={item['id'] for item in source}
    bilateral=[]
    for item in source:
        left=item['id']
        right=left[:-2]+'_r' if left.endswith('_l') else 'right_'+left[5:] if left.startswith('left_') else None
        if right not in source_ids:continue
        va=np.asarray(surfaces[left]['positions']).reshape(-1,3).copy()
        vb=np.asarray(surfaces[right]['positions']).reshape(-1,3)
        va[:,0]*=-1
        ab=cKDTree(vb).query(va)[0];ba=cKDTree(va).query(vb)[0]
        bilateral.append({'left':left,'right':right,'layer':item['layer'],
                          'comparisonPlane':'atlas x=0; virtual reflection only',
                          'maximumBidirectionalVertexDistanceCm':round(float(max(ab.max(),ba.max())),8),
                          'rmsBidirectionalVertexDistanceCm':round(float(np.sqrt((np.sum(ab**2)+np.sum(ba**2))/(len(ab)+len(ba)))),8),
                          'leftVertices':len(va),'rightVertices':len(vb),'anatomicalSymmetryApproved':False})
    report={'method':'Original geometry only; no smoothing, capping, registration or anatomical correction',
            'decodedInputSHA256':hashlib.sha256(args.decoded.read_bytes()).hexdigest(),'verifiedOriginalAssets':verified_assets,
            'counts':{'arterial':sum(r['layer']=='arterial' for r in records),'venous':sum(r['layer']=='venous' for r in records),'anatomicallyApproved':0},
            'meshes':records,'candidateJunctionDistances':links,'bilateralGeometryComparisons':bilateral,
            'interpretation':'Open boundaries may be original vessel cuts. Disconnected pieces can represent grouped branches. Neither is automatically an anatomical defect. Every flagged finding requires individual review.'}
    args.output.write_text(json.dumps(report,indent=2)+'\n')
    print(json.dumps({'meshes':len(records),'invalidIndices':sum(not r['indicesValid'] for r in records),'nonFinite':sum(not r['finite'] for r in records),'openMeshes':sum(r.get('boundaryEdges',0)>0 for r in records),'multipleComponents':sum(r.get('usedVertexComponents',1)>1 for r in records),'bilateralPairs':len(bilateral),'pairsWithinOneMicron':sum(row['maximumBidirectionalVertexDistanceCm']<=0.0001 for row in bilateral)}))

if __name__=='__main__':main()
