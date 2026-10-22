"""Audit original local 3D-2D-GS-CA ZIPs without extracting or publishing images.

Independent header parsing and ray/plane geometry; does not run supplied
Matlab, MEX or C++ code. Requires numpy. Output contains hashes and aggregate
checks only, not source images, target coordinates or calibration matrices.
"""
import argparse,hashlib,io,json,re,zipfile
from pathlib import Path
import numpy as np

NUMBER=r'[-+]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][-+]?\d+)?'
def numbers(text):return [float(x) for x in re.findall(NUMBER,text)]
def field(text,name):
    match=re.search(r'^'+re.escape(name)+r'\s*[=:]\s*([^\r\n]+)',text,re.M)
    if not match:raise ValueError('Missing header field '+name)
    return match.group(1).strip()
def after(text,name,count):
    tail=text.split(name,1)[1];tail=re.sub(r'^\s*[=:]?','',tail)
    result=numbers(tail)[:count]
    if len(result)!=count:raise ValueError('Incomplete '+name)
    return result
def volume_header(text):
    dims=[int(x) for x in numbers(field(text,'DimSize'))]
    spacing=numbers(field(text,'ElementSpacing'));position=numbers(field(text,'Position'))
    orient=after(text,'Orientation =',9)
    matrix=np.eye(4);matrix[:3,:3]=np.array(orient).reshape(3,3);matrix[:3,3]=position
    if len(dims)!=3 or len(spacing)!=3 or min(dims+spacing)<=0:raise ValueError('Invalid dimensions/spacing')
    if field(text,'ElementType')!='MET_SHORT' or field(text,'ElementByteOrderMSB')!='False':raise ValueError('Unsupported raw volume encoding')
    return dims,spacing,matrix
def detector_header(text):
    dims=[int(x) for x in numbers(field(text,'Size[pixels]'))];spacing=numbers(field(text,'Step[mm]'))
    matrix=np.array(after(text,'TPosition:',16)).reshape(4,4);source=np.array(numbers(field(text,'SourcePosition[mm]')))
    if len(dims)!=2 or len(spacing)!=2 or source.shape!=(3,) or min(dims+spacing)<=0:raise ValueError('Invalid detector header')
    if field(text,'DataType')!='float':raise ValueError('Unsupported detector encoding')
    return dims,spacing,matrix,source
def transform(points,matrix):return np.column_stack([points,np.ones(len(points))]).dot(matrix.T)[:,:3]
def project(points_world,detector_to_world,source_world,spacing):
    """Project onto local detector z=0; indices are zero based, no flip/centering."""
    inverse=np.linalg.inv(detector_to_world)
    points=transform(points_world,inverse);source=transform(np.asarray(source_world).reshape(1,3),inverse)[0]
    delta=points-source;denominator=delta[:,2]
    if np.any(np.abs(denominator)<1e-10):raise ValueError('Ray parallel to detector')
    t=-source[2]/denominator
    if not np.isfinite(t).all() or np.any(t<=0):raise ValueError('Invalid source-to-detector intersection')
    local=source+t[:,None]*delta
    return local[:,:2]/spacing,transform(local,detector_to_world)
def stream_entry(archive,entry,dtype):
    h=hashlib.sha256();count=0;lo=float('inf');hi=float('-inf');finite=True
    with archive.open(entry) as f:
        while raw:=f.read(8*1024*1024):
            h.update(raw);a=np.frombuffer(raw,dtype=dtype);count+=len(a)
            finite=finite and bool(np.isfinite(a).all());lo=min(lo,float(a.min()));hi=max(hi,float(a.max()))
    if not finite:raise ValueError('Nonfinite data '+entry)
    return {'sha256':h.hexdigest(),'values':count,'minimum':lo,'maximum':hi,'crcVerified':True}
def audit(folder,output):
    rows=[];source_hashes=[]
    for case in range(1,11):
        path=folder/f'3D-2D-GS-CA_dataset{case:02d}.zip'
        with path.open('rb') as f:checksum=hashlib.file_digest(f,'sha256').hexdigest()
        source_hashes.append({'file':path.name,'bytes':path.stat().st_size,'sha256':checksum})
        with zipfile.ZipFile(path) as z:
            prefix=f'Dataset {case}/Dataset{case}'
            mhd=z.read(prefix+'_3D-DSA.mhd').decode('ascii')
            dims,spacing,tg=volume_header(mhd)
            volume=stream_entry(z,prefix+'_3D-DSA.raw','<i2')
            if volume['values']!=np.prod(dims):raise ValueError('Volume byte count mismatch')
            targets=np.loadtxt(io.BytesIO(z.read(prefix+'_3D_DSA_Target_Points.txt')))
            if targets.ndim!=2 or targets.shape[1]!=3 or not np.isfinite(targets).all():raise ValueError('Invalid targets')
            points_world=transform(targets,tg);views=[]
            for view in ['AP','LAT']:
                parsed=[];images=[]
                for modality in ['DSA','MAX']:
                    base=prefix+f'_2D_{modality}_{view}'
                    header=z.read(base+'.rad').decode('ascii');parsed.append(detector_header(header))
                    image=stream_entry(z,base+'.raw','<f4')
                    if image['values']!=np.prod(parsed[-1][0]):raise ValueError('Detector byte count mismatch')
                    images.append({'modality':modality,**image})
                detdims,step,ts,source=parsed[0]
                matching=all(np.array_equal(a,b) for a,b in zip(parsed[0],parsed[1]))
                pixels,detector_points=project(points_world,ts,source,np.array(step))
                rays=detector_points-source;direction=rays/np.linalg.norm(rays,axis=1)[:,None]
                residual=np.linalg.norm(np.cross(points_world-source,direction),axis=1)
                inside=np.all((pixels>=0)&(pixels<=np.array(detdims)-1),axis=1)
                views.append({'view':view,'dimensions':detdims,'pixelSpacingMm':step,'dsaMaxSameGeometry':matching,
                    'rotationDeterminant':float(np.linalg.det(ts[:3,:3])),
                    'orthogonalityMaxError':float(np.max(np.abs(ts[:3,:3].T@ts[:3,:3]-np.eye(3)))),
                    'targetsInsideDetector':int(inside.sum()),'rayRoundTripMaxResidualMm':float(residual.max()),'images':images})
            initial=np.loadtxt(io.BytesIO(z.read(prefix+'_3D_DSA_Displacements.txt')))
            if initial.shape!=(1600,4) or not np.isfinite(initial).all():raise ValueError('Invalid displacement matrix collection')
            rows.append({'case':case,'dimensions':dims,'spacingMm':spacing,'volume':volume,'targetCount':len(targets),
                'targetPointsWithinVolumeExtent':bool(np.all((targets>=0)&(targets<=((np.array(dims)-1)*spacing)))),
                'displacementCount':400,'views':views})
    gold=folder/'3D-2D-GS-CA_gold-standard.zip'
    with gold.open('rb') as f:checksum=hashlib.file_digest(f,'sha256').hexdigest()
    with zipfile.ZipFile(gold) as z:
        bad=z.testzip()
        if bad:raise ValueError('Gold ZIP CRC mismatch '+bad)
        result_files=[n for n in z.namelist() if n.endswith('.txt') and n.startswith('Results/MGP/')]
        for name in result_files:
            a=np.loadtxt(io.BytesIO(z.read(name)))
            if a.shape!=(1600,4) or not np.isfinite(a).all():raise ValueError('Invalid result matrices')
    source_hashes.append({'file':gold.name,'bytes':gold.stat().st_size,'sha256':checksum,'crcVerified':True})
    report={'schema':1,'source':'https://lit.fe.uni-lj.si/en/research/resources/3D-2D-GS-CA/',
        'licenseObserved':'CC BY-NC-ND on source page; guide also requires signed agreement and prohibits unauthorized distribution; no data redistributed',
        'sourceArchives':source_hashes,'cases':rows,'goldStandardResultCollections':len(result_files),
        'executed':'Independent local Python/numpy header, byte-count, CRC, SHA, finite-data and ray/plane consistency checks',
        'notExecuted':['Matlab/MEX binaries','MGP registration algorithm','Image landmark or clinical accuracy validation','App import or atlas registration'],
        'coordinatePolicy':'Source Sv/Sw millimetres retained; no automatic RAS/LPS/atlas conversion',
        'limitations':'Round-trip residual is internal algebraic consistency, not observed landmark error, mTRE/mRPD or reproduction of published accuracy.'}
    output.write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8')
    print(json.dumps({'cases':len(rows),'views':sum(len(x['views']) for x in rows),'goldCollections':len(result_files),
        'maxRoundTripMm':max(v['rayRoundTripMaxResidualMm'] for c in rows for v in c['views']),'report':str(output)}))
if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--source-dir',type=Path,required=True);p.add_argument('--report',type=Path,required=True);args=p.parse_args();audit(args.source_dir,args.report)
