"""Projection context derived from source meshes; original 3D assets remain intact."""
import gzip, hashlib, json, sys
from pathlib import Path
import numpy as np
import trimesh
from import_open_anatomy import ROOT
source=json.loads(Path(sys.argv[1]).read_text())
manifest_name=sys.argv[2] if len(sys.argv)>2 else 'landmarks'
output_name=sys.argv[3] if len(sys.argv)>3 else 'reference-landmarks'
manifest=json.loads((ROOT/f'features/neuro3d/{manifest_name}.json').read_text())
records=[]; inventory=[]
for item in manifest['structures']:
    raw=source[item['id']]
    mesh=trimesh.Trimesh(np.array(raw['positions']),np.array(raw['faces']),process=False)
    limit = 4000 if item['layer'] in ['bone', 'arterial', 'venous', 'nerve'] else 1000
    retained = False
    if len(mesh.faces)>limit:
        simplified=mesh.simplify_quadric_decimation(face_count=limit)
        if np.all(simplified.bounds[0] >= mesh.bounds[0] - .01) and np.all(simplified.bounds[1] <= mesh.bounds[1] + .01):
            mesh=simplified
        else:
            retained = True
    mesh.fix_normals(multibody=True)
    records.append({'id':item['id'],'layer':item['layer'],'positions':np.asarray(mesh.vertices,dtype=np.float32).reshape(-1).tolist(),'indices':mesh.faces.reshape(-1).tolist()})
    inventory.append({'id':item['id'],'layer':item['layer'],'originalFaces':len(raw['faces']),'faces':len(mesh.faces),'retainedOriginalForBounds':retained})
encoded=json.dumps(records,separators=(',',':')).encode();compressed=gzip.compress(encoded,mtime=0)
file=output_name+'.bin';(ROOT/'public/neuro3d/open-anatomy'/file).write_bytes(compressed)
metadata={key:manifest[key] for key in ['sourceCommit','license','attribution','coordinateSystem']}
metadata.update(file=file,size=len(compressed),uncompressedSize=len(encoded),sha256=hashlib.sha256(compressed).hexdigest(),structures=inventory,projectionCoordinates='Source world cm; Y minus160, same as atlas. Target 4000 faces for bone/vessels/nerves; 1000 for other context; original retained if simplification exceeds source bounds by 0.01cm. Only bone and vessels contribute radiographic signal; other layers are selection annotations only.')
(ROOT/f'features/neuro3d/{output_name}.json').write_text(json.dumps(metadata,indent=2)+'\n')
print(len(records),'surfaces;',len(compressed),'bytes')
