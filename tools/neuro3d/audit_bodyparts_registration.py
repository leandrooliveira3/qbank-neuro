"""Exploratory source-frame comparison, not anatomical registration validation.
Usage: python3 audit_bodyparts_registration.py CANDIDATES_JSON DECODED_ATLAS_JSON
CANDIDATES_JSON maps OBJ ids to {content, sha}, fetched at the audited commit.
See docs/neuro3d-alternative-anatomy-audit.json for source ids and hashes.
"""
import sys,json,numpy as np
from scipy.spatial import cKDTree
from scipy.optimize import least_squares
from scipy.spatial.transform import Rotation
from pathlib import Path
c=json.loads(Path(sys.argv[1]).read_text());d=json.loads(Path(sys.argv[2]).read_text())
def obj(id):return np.array([[float(k) for k in l.split()[1:4]] for l in c[id]['content'].splitlines() if l.startswith('v ')])
# Fixed conversion of BodyParts3D mm/Z-superior to atlas cm/Y-superior.
def oriented(p):return np.c_[p[:,0],p[:,2],-p[:,1]]/10
pairs=[('FJ1682','internal_carotid_artery_r'),('FJ1682M','internal_carotid_artery_l'),('FJ1695','ophthalmic_artery_r'),('FJ1695M','ophthalmic_artery_l')]
source=[oriented(obj(a)) for a,b in pairs];target=[np.array(d[b]['positions']) for a,b in pairs];trees=[cKDTree(p) for p in target]
offset=np.mean(np.vstack(target),0)-np.mean(np.vstack(source),0)
# Similarity only: never warp individual candidate vessels to make them fit.
def transform(p,v):return Rotation.from_rotvec(v[:3]).apply(p)*np.exp(v[3])+v[4:]
def residual(v):return np.concatenate([tree.query(transform(p,v))[0]/np.sqrt(len(p)) for p,tree in zip(source,trees)])
fit=least_squares(residual,np.r_[np.zeros(4),offset],max_nfev=100)
print('fit',fit.x)
for pair,p,tree in zip(pairs,source,trees):
 dist=tree.query(transform(p,fit.x))[0];print(pair[0],pair[1],'medianCm',np.median(dist),'p95Cm',np.quantile(dist,.95),'maxCm',max(dist))
