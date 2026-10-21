"""Compare every shipped section value with its original NIfTI voxel plane."""
import argparse,base64,gzip,hashlib,json,struct
from pathlib import Path
import nibabel as nib
import numpy as np
ROOT=Path(__file__).resolve().parents[2]
if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--input-dir',type=Path,required=True);args=p.parse_args()
    catalogue=json.loads((ROOT/'features/neuro3d/comparison/sections.json').read_text());result=[]
    for kind,name in [('brave','brave-label.nii.gz'),('venat','VENAT_PartialVolume.nii.gz')]:
        source=args.input_dir/name;img=nib.load(source);data=img.get_fdata(dtype=np.float32);sha=hashlib.sha256(source.read_bytes()).hexdigest()
        planes=[s for s in catalogue['sections'] if s['kind']==kind]
        for s in planes:
            raw=(ROOT/'public/neuro3d/comparison/sections'/s['file']).read_bytes()
            if hashlib.sha256(raw).hexdigest()!=s['assetSHA256'] or s['sourceSHA256']!=sha:raise ValueError('Hash mismatch')
            blob=gzip.decompress(base64.b64decode(json.loads(raw)['data']));magic,w,h=struct.unpack_from('<4sII',blob)
            values=np.frombuffer(blob,offset=12,dtype='<f4').reshape(h,w)
            expected=np.take(data,s['index'],axis=s['axis']).T[::-1]
            if magic!=b'QVS1' or not np.array_equal(values,expected) or not np.array_equal(np.array(s['voxelToRASmm']),img.affine):raise ValueError('Voxel or affine changed')
        result.append({'kind':kind,'sourceSHA256':sha,'planes':len(planes),'voxelsCompared':sum(s['width']*s['height'] for s in planes),'allValuesExactlyEqual':True,'nativeAffineEqual':True,'resampled':False,'quantized':False})
    report={'schema':1,'sources':result,'totalPlanes':len(catalogue['sections']),'anatomicalApproval':False,'atlasRegistration':None}
    (ROOT/'docs/neuro3d-sectional-source-audit.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report))
