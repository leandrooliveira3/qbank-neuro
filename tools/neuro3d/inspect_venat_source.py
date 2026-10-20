"""Inspect the CC BY 4.0 VENAT mean partial-volume map, without atlas fusion.

Requires numpy and VTK. Supply the original Figshare API record and NIfTI.
Checks the published size/MD5 before decoding. Optional isosurfaces retain
native MNI relationships; they are NOT categorical, individually named veins.
"""
import argparse
import hashlib
import json
from pathlib import Path

import numpy as np
import vtk
from vtk.util.numpy_support import vtk_to_numpy


def inspect(volume, record, surface_dir=None):
    if record['license']['name'] != 'CC BY 4.0':
        raise ValueError('Unexpected VENAT data license')
    source=next(row for row in record['files'] if row['name']=='VENAT_PartialVolume.nii.gz')
    raw=volume.read_bytes()
    if len(raw)!=source['size'] or hashlib.md5(raw).hexdigest()!=source['computed_md5']:
        raise ValueError('VENAT size/MD5 mismatch: incomplete or different source; decoding refused')
    reader=vtk.vtkNIFTIImageReader();reader.SetFileName(str(volume))
    errors=[];reader.AddObserver(vtk.vtkCommand.ErrorEvent,lambda *_:errors.append('NIfTI reader error'))
    reader.Update()
    if errors:raise ValueError('Unable to decode the verified NIfTI')
    image=reader.GetOutput();values=vtk_to_numpy(image.GetPointData().GetScalars())
    if not np.isfinite(values).all() or values.min()<0 or values.max()>1:
        raise ValueError('Expected finite partial-volume fractions in [0,1]')
    matrix=reader.GetSFormMatrix() or reader.GetQFormMatrix()
    if matrix is None:raise ValueError('A declared physical coordinate matrix is required')
    if reader.GetNIFTIHeader().GetXYZTUnits() & 7 != 2:raise ValueError('Expected millimetre spatial units')
    affine=np.array([[matrix.GetElement(i,j) for j in range(4)] for i in range(4)])
    report={'source':'https://figshare.com/articles/dataset/VENAT_Probability_map_nii_gz/7205960',
            'metadataAPI':'https://api.figshare.com/v2/articles/7205960',
            'title':record['title'],'version':record['version'],'license':record['license'],
            'sourceFile':source['name'],'downloadURL':source['download_url'],
            'inputBytes':len(raw),'inputMD5':source['computed_md5'],'inputMD5Verified':True,
            'inputSHA256':hashlib.sha256(raw).hexdigest(),
            'shapeXYZ':list(image.GetDimensions()),'spacingMm':list(image.GetSpacing()),
            'vtkPhysicalToRASmm':affine.tolist(),'scalarRange':[float(values.min()),float(values.max())],
            'nonzeroVoxels':int(np.count_nonzero(values)),'allFinite':True,
            'semantic':'Cohort-mean partial-volume fractions; not a categorical segmentation or an individual patient vascular tree',
            'registrationToAtlas':None,'individualAnatomicalNamesAssigned':False,'navigationGraph':None,
            'vtkVersion':vtk.vtkVersion.GetVTKVersion(),'isosurfaceInspections':[]}
    if surface_dir:
        surface_dir.mkdir(parents=True,exist_ok=True)
        for threshold in [.1,.2]:
            contour=vtk.vtkFlyingEdges3D();contour.SetInputConnection(reader.GetOutputPort())
            contour.SetValue(0,threshold);contour.ComputeNormalsOff();contour.Update()
            original=contour.GetOutput()
            decimator=vtk.vtkDecimatePro();decimator.SetInputData(original)
            decimator.SetTargetReduction(max(0,1-90000/original.GetNumberOfCells()))
            decimator.PreserveTopologyOn();decimator.BoundaryVertexDeletionOff();decimator.SplittingOff();decimator.Update()
            mesh=decimator.GetOutput();vertices=vtk_to_numpy(mesh.GetPoints().GetData()).astype(np.float64)
            faces=vtk_to_numpy(mesh.GetPolys().GetData()).reshape(-1,4)[:,1:]
            vertices=vertices@affine[:3,:3].T+affine[:3,3]
            # Native RAS-mm -> left/superior/anterior cm for inspection ONLY.
            vertices=vertices[:,[0,2,1]]*np.array([-.1,.1,.1])
            output=surface_dir/f'venat-{threshold:.1f}.npz'
            np.savez_compressed(output,positions=vertices.astype(np.float32),indices=faces.astype(np.uint32))
            report['isosurfaceInspections'].append({'meanPartialVolumeThreshold':threshold,
                'originalVertices':original.GetNumberOfPoints(),'originalTriangles':original.GetNumberOfCells(),
                'vertices':len(vertices),'triangles':len(faces),'boundsInspectionCm':[vertices.min(0).tolist(),vertices.max(0).tolist()],
                'method':'FlyingEdges; DecimatePro with topology preservation, no splitting, no boundary deletion, no smoothing or component pruning',
                'anatomicalApproval':False,'fileSHA256':hashlib.sha256(output.read_bytes()).hexdigest()})
    return report


if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--volume',required=True,type=Path)
    parser.add_argument('--record',required=True,type=Path)
    parser.add_argument('--report',required=True,type=Path)
    parser.add_argument('--surface-dir',type=Path)
    args=parser.parse_args()
    result=inspect(args.volume,json.loads(args.record.read_text()),args.surface_dir)
    args.report.write_text(json.dumps(result,indent=2)+'\n')
    print(json.dumps({key:result[key] for key in ['inputMD5Verified','shapeXYZ','scalarRange','registrationToAtlas']}))
