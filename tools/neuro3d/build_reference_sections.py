"""Extract selected ORIGINAL voxel planes, no resampling or atlas registration.
Offline: nibabel/numpy. Float32 values retain label/PVF semantics, not MR intensity.
"""
import argparse,base64,gzip,hashlib,json,struct
from pathlib import Path
import numpy as np
import nibabel as nib
ROOT=Path(__file__).resolve().parents[2]
def digest(b):return hashlib.sha256(b).hexdigest()
def build(folder):
    manifest=json.loads((ROOT/'features/neuro3d/comparison/manifest.json').read_text())
    rows=[];out=ROOT/'public/neuro3d/comparison/sections';out.mkdir(exist_ok=True)
    for kind,name in [('brave','brave-label.nii.gz'),('venat','VENAT_PartialVolume.nii.gz')]:
        path=folder/name;source=digest(path.read_bytes());ref=next(r for r in manifest['surfaces'] if r['kind']==kind)
        if source!=ref['sourceSHA256']:raise ValueError('Source checksum mismatch')
        img=nib.load(path);data=img.get_fdata(dtype=np.float32)
        if not np.isfinite(data).all() or img.header.get_xyzt_units()[0]!='mm':raise ValueError('Invalid source')
        for axis in range(3):
            u,v=[a for a in range(3) if a!=axis]
            for index in np.unique(np.rint(np.linspace(0,data.shape[axis]-1,7)).astype(int)):
                # np.take retains native order u,v; rows go v decreasing (up positive v).
                plane=np.take(data,index,axis=axis).T[::-1].copy().astype('<f4')
                width,height=plane.shape[1],plane.shape[0]
                raw=struct.pack('<4sII',b'QVS1',width,height)+plane.tobytes();compressed=gzip.compress(raw,mtime=0)
                key=f'{kind}-{axis}-{index}';file=key+'.json';payload=json.dumps({'format':'QVS1-gzip-base64','data':base64.b64encode(compressed).decode()},separators=(',',':')).encode()
                (out/file).write_bytes(payload)
                rows.append({'key':key,'kind':kind,'axis':axis,'index':int(index),'uAxis':u,'vAxis':v,'width':width,'height':height,'shape':list(data.shape),
                    'file':file,'assetSHA256':digest(payload),'sourceSHA256':source,'voxelToRASmm':img.affine.tolist(),
                    'pixelSpacingMm':[float(np.linalg.norm(img.affine[:3,u])),float(np.linalg.norm(img.affine[:3,v]))],
                    'minimum':float(plane.min()),'maximum':float(plane.max()),'resampled':False,'quantized':False})
    (ROOT/'features/neuro3d/comparison/sections.json').write_text(json.dumps({'schema':1,'method':'Seven original voxel planes per native axis; float32, no resampling. Top row is largest v index. Native voxel indices are zero-based.','sections':rows},indent=2)+'\n')
    print(json.dumps({'planes':len(rows),'payloadBytes':sum(p.stat().st_size for p in out.glob('*.json'))}))
if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--input-dir',type=Path,required=True);args=p.parse_args();build(args.input_dir)
