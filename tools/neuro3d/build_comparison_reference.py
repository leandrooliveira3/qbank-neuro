"""Build inspectable, independent RAS-mm surfaces; never register to the atlas.

Offline dependencies: nibabel, numpy, scikit-image, fast-simplification.
Input downloads remain outside the repository. Output stores compressed binary
geometry in a JSON envelope so provenance and transport are reproducible.
"""
import argparse,base64,gzip,hashlib,json,struct
from pathlib import Path
import numpy as np
import nibabel as nib
from skimage.measure import marching_cubes
from scipy.sparse import coo_matrix
from scipy.sparse.csgraph import connected_components
import fast_simplification

ROOT=Path(__file__).resolve().parents[2]
def sha(raw):return hashlib.sha256(raw).hexdigest()
def component_count(vertices,faces):
    used=np.unique(faces);edges=np.concatenate((faces[:,[0,1]],faces[:,[1,2]],faces[:,[2,0]]))
    graph=coo_matrix((np.ones(len(edges)),(edges[:,0],edges[:,1])),shape=(len(vertices),len(vertices))).tocsr()
    return int(connected_components(graph[used][:,used],directed=False,return_labels=False))
def simplify_components(vertices,faces):
    edges=np.concatenate((faces[:,[0,1]],faces[:,[1,2]],faces[:,[2,0]]))
    graph=coo_matrix((np.ones(len(edges)),(edges[:,0],edges[:,1])),shape=(len(vertices),len(vertices))).tocsr()
    count,labels=connected_components(graph,directed=False)
    result_v=[];result_f=[];offset=0;ratio=min(1,45000/len(faces))
    for label in range(count):
        selected=faces[labels[faces[:,0]]==label]
        if not len(selected):continue
        ids,local=np.unique(selected,return_inverse=True);v=vertices[ids];f=local.reshape(-1,3)
        target=max(4,int(len(f)*ratio))
        if len(f)>target:v,f=fast_simplification.simplify(v,f,target_count=target,preserve_border=True)
        if not len(f):raise ValueError('Simplification removed a component')
        result_v.append(v);result_f.append(f+offset);offset+=len(v)
    return np.concatenate(result_v),np.concatenate(result_f)
def build(path,kind,threshold,output):
    raw=path.read_bytes()
    if kind=='brave' and sha(raw)!='662b162e982eaf51bc9e68e62b181ebc9c16b7e8675ae2caea38650616a7e86d':raise ValueError('Unexpected BRAVE label SHA256')
    if kind=='venat' and sha(raw)!='af222f62aa94a1bfd873e2822fce0daf472ed632f2c9957b45ad26069be86c35':raise ValueError('Unexpected VENAT source SHA256')
    image=nib.load(path);data=image.get_fdata(dtype=np.float32)
    if data.ndim!=3 or not np.isfinite(data).all():raise ValueError('Expected finite 3D volume')
    if image.header.get_xyzt_units()[0]!='mm' or not np.isfinite(image.affine).all() or abs(np.linalg.det(image.affine[:3,:3]))<1e-9:raise ValueError('Invalid physical affine or units')
    if not (image.header['sform_code']>0 or image.header['qform_code']>0):raise ValueError('Missing declared physical reference')
    if data.min()<0 or data.max()>1:raise ValueError('Expected binary labels or partial-volume fractions')
    if kind=='brave' and not np.isin(data,[0,1]).all():raise ValueError('BRAVE expected binary labels')
    vertices,faces,_,_=marching_cubes(data,level=threshold,allow_degenerate=False)
    vertices=nib.affines.apply_affine(image.affine,vertices)
    if np.linalg.det(image.affine[:3,:3])<0:faces=faces[:,[0,2,1]]
    original={'vertices':len(vertices),'triangles':len(faces),'components':component_count(vertices,faces)}
    vertices,faces=simplify_components(vertices,faces)
    if component_count(vertices,faces)!=original['components']:raise ValueError('Connected-component count changed')
    if not np.isfinite(vertices).all() or faces.min()<0 or faces.max()>=len(vertices):raise ValueError('Invalid derived surface')
    vertices=vertices.astype('<f4');faces=faces.astype('<u4')
    binary=struct.pack('<4sII',b'QVR1',len(vertices),len(faces))+vertices.tobytes()+faces.tobytes()
    compressed=gzip.compress(binary,mtime=0);key=f'{kind}-{threshold:g}'
    envelope={'format':'QVR1-gzip-base64','data':base64.b64encode(compressed).decode('ascii')}
    output.mkdir(parents=True,exist_ok=True);asset=output/f'{key}.mesh.json';asset.write_text(json.dumps(envelope,separators=(',',':')),encoding='utf-8')
    return {'key':key,'kind':kind,'file':asset.name,'threshold':threshold,'sourceSHA256':sha(raw),'assetSHA256':sha(asset.read_bytes()),'compressedSHA256':sha(compressed),
        'vertices':len(vertices),'triangles':len(faces),'components':component_count(vertices,faces),'original':original,
        'sourceShape':list(data.shape),'voxelToRASmm':image.affine.tolist(),'sformCode':int(image.header['sform_code']),'qformCode':int(image.header['qform_code']),
        'coordinateSystem':'NIfTI RAS mm; native file affine','boundsRASmm':[vertices.min(0).tolist(),vertices.max(0).tolist()],
        'method':'marching cubes full-resolution; independent per-component quadric simplification target about 45000 triangles, minimum 4 per component, border preservation; no smoothing, pruning, naming or atlas registration',
        'topologyPreservationGuaranteed':False,'registrationToAtlas':None,'anatomicalApproval':False}
if __name__=='__main__':
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('--input-dir',type=Path,required=True);args=p.parse_args()
    out=ROOT/'public/neuro3d/comparison';rows=[]
    rows.append(build(args.input_dir/'brave-label.nii.gz','brave',.5,out))
    for threshold in [.1,.2]:
        path=args.input_dir/'VENAT_PartialVolume.nii.gz'
        if path.exists():rows.append(build(path,'venat',threshold,out))
    (ROOT/'features/neuro3d/comparison/manifest.json').parent.mkdir(exist_ok=True)
    sources={
        'brave':{'record':'https://zenodo.org/records/3968844','doi':'10.5281/zenodo.3968844','license':'MIT','licenseURL':'https://opensource.org/license/mit','attribution':'Hilbert, Madai, Akay, Aydin, Behland, Sobesky, Galinovic, Khalil, Taha, Wuerfel, Dusek, Niendorf, Fiebach, Frey, Livne (2020)',
                 'archive':'GroundTruth.zip','archiveMD5':'fdd563d92d0848d991b217289147cbfa','archiveSHA256':'b857d129527da9163b2716dd32f5ec73a7b3482174e9149653b274845225aa32','selected':'GroundTruth/pat_1/001_Vessel-Manual-Gold-int.nii.gz','space':'Native NIfTI header RAS/mm; no MNI registration inferred'},
        'venat':{'record':'https://figshare.com/articles/dataset/VENAT_Probability_map_nii_gz/7205960','license':'CC-BY-4.0','licenseURL':'https://creativecommons.org/licenses/by/4.0/','attribution':'Huck et al., VENAT; High resolution atlas of the venous brain vasculature from 7 T quantitative susceptibility maps (2019), DOI 10.1007/s00429-019-01919-4',
                 'file':'VENAT_PartialVolume.nii.gz','fileMD5':'2fcfec7e50e1d7c3f6f5e3e5be4e9d53','space':'MNI152; NIfTI header RAS/mm; cohort-mean partial volume, not a named categorical segmentation'}}
    import skimage,importlib.metadata
    versions={name:importlib.metadata.version(name) for name in ['nibabel','numpy','scikit-image','fast-simplification']}
    (ROOT/'features/neuro3d/comparison/manifest.json').write_text(json.dumps({'schema':1,'sources':sources,'toolVersions':versions,'surfaces':rows},indent=2)+'\n',encoding='utf-8')
    print(json.dumps([{'key':r['key'],'original':r['original'],'triangles':r['triangles'],'components':r['components']} for r in rows]))
