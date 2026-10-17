import json,numpy as np,trimesh
from pathlib import Path
from scipy.ndimage import distance_transform_edt,label
from scipy.sparse import coo_matrix
from scipy.sparse.csgraph import dijkstra
from scipy.spatial import cKDTree
from skimage.morphology import skeletonize
from collections import defaultdict
D = {}

def capped(item):
 v=np.array(item['positions']);f=np.array(item['faces']);edges=np.sort(np.concatenate([f[:,[0,1]],f[:,[1,2]],f[:,[2,0]]]),axis=1)
 edge,count=np.unique(edges,axis=0,return_counts=True);boundary=edge[count==1];graph=defaultdict(list)
 for a,b in boundary:graph[int(a)].append(int(b));graph[int(b)].append(int(a))
 seen=set();caps=[]
 for start in graph:
  if start in seen:continue
  component=set([start]);stack=[start]
  while stack:
   for n in graph[stack.pop()]:
    if n not in component:component.add(n);stack.append(n)
  seen.update(component);center=v[list(component)].mean(axis=0);idx=len(v);v=np.vstack([v,center])
  # Only boundary triangles for voxel closure; orientation is irrelevant here.
  for a,b in boundary:
   if a in component:caps.append([int(a),int(b),idx])
 if caps:f=np.vstack([f,np.array(caps)])
 return trimesh.Trimesh(v,f,process=False)

def centerline(id,pitch=.08):
 mesh=capped(D[id]);vox=mesh.voxelized(pitch).fill();mask=vox.matrix
 sk=skeletonize(mask);ijk=np.argwhere(sk)
 if len(ijk)<2:raise ValueError('empty skeleton '+id)
 # Keep largest connected component rather than silently joining disconnected vessels.
 labs,num=label(sk,structure=np.ones((3,3,3)));sizes=np.bincount(labs.ravel());sizes[0]=0;ijk=np.argwhere(labs==sizes.argmax())
 coords=vox.indices_to_points(ijk);tree=cKDTree(ijk);pairs=np.array(list(tree.query_pairs(1.75)))
 rows=np.r_[pairs[:,0],pairs[:,1]];cols=np.r_[pairs[:,1],pairs[:,0]];weights=np.linalg.norm(ijk[rows]-ijk[cols],axis=1)*pitch
 graph=coo_matrix((weights,(rows,cols)),shape=(len(ijk),len(ijk))).tocsr()
 distance=dijkstra(graph,indices=0);a=np.argmax(distance)
 distance,prev=dijkstra(graph,indices=a,return_predecessors=True);b=np.argmax(distance)
 path=[int(b)]
 while path[-1]!=a:
  n=int(prev[path[-1]])
  if n<0:raise ValueError('disconnected '+id)
  path.append(n)
 path=path[::-1];p=coords[path];r=distance_transform_edt(mask)[tuple(ijk[path].T)]*pitch
 # Smooth voxel stair steps; retain endpoints and original coordinate frame.
 from scipy.ndimage import gaussian_filter1d
 p[1:-1]=gaussian_filter1d(p,sigma=1,axis=0)[1:-1]
 indices=np.arange(0,len(p),max(1,len(p)//100));indices=np.unique(np.r_[indices,len(p)-1]);p=p[indices];r=r[indices]
 return {'id':id,'points':np.round(p,4).tolist(),'radii':np.round(r,4).tolist(),'maxComponents':int(num),'meshWatertightAfterCapping':mesh.is_watertight,'pitchCm':pitch,'lengthCm':round(float(np.linalg.norm(np.diff(p,axis=0),axis=1).sum()),3)}

if __name__=='__main__':
 ids=['left_common_carotid_artery','internal_carotid_artery_l','external_carotid_artery_l','middle_cerebral_artery_m1_segment_l','anterior_cerebral_artery_l','ophthalmic_artery_l']
 out=[]
 for id in ids:
  c=centerline(id);out.append(c);print(id,c['lengthCm'],c['points'][0],c['points'][-1],len(c['points']))
 Path(sys.argv[2]).write_text(json.dumps(out))
