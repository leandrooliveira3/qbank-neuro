"""Derive illustrative I/II/III geometric profiles; never classify a patient scan.
Reference: Madhwal height/left CCA diameter convention, not branching variants.
"""
import json,gzip,numpy as np
from pathlib import Path
from import_open_anatomy import ROOT
rows=json.loads(gzip.decompress((ROOT/'public/neuro3d/open-anatomy/reference-supra-aortic.bin').read_bytes()))
arch=np.array(next(row['positions'] for row in rows if row['id']=='aortic_arch')).reshape(-1,3)
axes=json.loads((ROOT/'features/neuro3d/reference-access-network.json').read_text())['originalAxes']
origin=np.array(axes['brachiocephalic_trunk']['points'][0]);apex=arch[arch[:,1].argmax()]
diameter=float(2*np.median(axes['left_common_carotid_artery']['radii']))
sigma=float(np.linalg.norm((apex-origin)[[0,2]])/np.sqrt(-2*np.log(.15)));assert sigma>.01
smooth=lambda v:np.clip(v,0,1)**2*(3-2*np.clip(v,0,1))
def weights(p):return np.exp(-np.sum((p[:,[0,2]]-apex[[0,2]])**2,axis=1)/(2*sigma*sigma))*smooth((p[:,1]+45)/20)*(1-smooth((p[:,1]+15)/20))
w=weights(arch);ob=float(weights(origin[None,:])[0])
def ratio(a):return float((np.max(arch[:,1]+a*w)-(origin[1]+a*ob))/diameter)
profiles={}
for name,target in [('I',.75),('II',1.5),('III',2.5)]:
 candidates=[];samples=np.linspace(-6,6,2401)
 for lo,hi in zip(samples[:-1],samples[1:]):
  if (ratio(lo)-target)*(ratio(hi)-target)>0:continue
  for _ in range(45):
   mid=(lo+hi)/2
   if (ratio(lo)-target)*(ratio(mid)-target)<=0:hi=mid
   else:lo=mid
  candidates.append((lo+hi)/2)
 if not candidates:raise ValueError('No non-folding profile for '+name)
 a=min(candidates,key=abs);assert 1-abs(a)*.075>0
 profiles[name]={'amplitudeCm':a,'heightRatio':ratio(a),'minimumVerticalJacobianBound':1-abs(a)*.075}
result={'version':1,'sourceCommit':json.loads((ROOT/'features/neuro3d/reference-access-network.json').read_text())['sourceCommit'],'license':'CC-BY-SA-4.0','apexAnchor':apex.tolist(),'brachiocephalicOriginProxy':origin.tolist(),'leftCCADiameterProxyCm':diameter,'sigmaCm':sigma,'baselineRatio':ratio(0),'profiles':profiles,'status':'illustrative-deformation-unvalidated','measurement':'Distance from synthetic outer arch apex to source-axis proximal brachiocephalic endpoint / median source-axis left CCA diameter; source endpoint is an educational ostium proxy, not a validated ostial measurement','reference':'https://pmc.ncbi.nlm.nih.gov/articles/PMC3035863/','limits':['Not patient anatomy or a validated catheterization difficulty score','All source meshes and device routes must receive the same coordinate transform','Branch origin variants such as bovine arch are a separate classification']}
(ROOT/'features/neuro3d/arch-profiles.json').write_text(json.dumps(result,indent=2)+'\n');print(json.dumps(profiles,indent=2))
