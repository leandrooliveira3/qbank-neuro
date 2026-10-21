"""Compare immutable Anatria source with the Qbank subset, never modify either.
Source directory contains files fetched from the pinned upstream revision.
"""
import argparse,hashlib,json,struct
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
def sha(raw):return hashlib.sha256(raw).hexdigest()
def glb(path):
    raw=path.read_bytes();size=struct.unpack_from('<I',raw,12)[0]
    return raw,json.loads(raw[20:20+size]),raw[28+size:]
def evidence(doc,binary,name):
    index,node=next((i,n) for i,n in enumerate(doc['nodes']) if n['name']==name)
    primitive=doc['meshes'][node['mesh']]['primitives'][0]
    extension=primitive['extensions']['KHR_draco_mesh_compression'];view=doc['bufferViews'][extension['bufferView']]
    start=view.get('byteOffset',0);payload=binary[start:start+view['byteLength']]
    return {'nodeName':node['name'],'translation':node.get('translation',[0,0,0]),'rotation':node.get('rotation',[0,0,0,1]),'scale':node.get('scale',[1,1,1]),'matrix':node.get('matrix'),
            'parents':[n['name'] for n in doc['nodes'] if index in n.get('children',[])],
            'primitives':len(doc['meshes'][node['mesh']]['primitives']),'vertices':doc['accessors'][primitive['attributes']['POSITION']]['count'],
            'indexCount':doc['accessors'][primitive['indices']]['count'],'dracoSHA256':sha(payload),'dracoBytes':len(payload),'dracoAttributes':extension['attributes']}
if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--source-dir',type=Path,required=True);args=p.parse_args();folder=args.source_dir
    local=json.loads((ROOT/'features/neuro3d/open-anatomy.json').read_text());asset=next(a for a in local['assets'] if a['file']=='cardiovascular_head.glb')
    upstream,ud,ub=glb(folder/'cardiovascular_male.glb');subset,sd,sb=glb(ROOT/'public/neuro3d/open-anatomy/cardiovascular_head.glb')
    if sha(upstream)!=asset['upstreamSha256'] or sha(subset)!=asset['sha256']:raise ValueError('Source or subset hash mismatch')
    original=evidence(ud,ub,'Straight sinus');derived=evidence(sd,sb,'Straight sinus')
    if original!=derived:raise ValueError('Node transform or compressed primitive changed')
    sourceManifest=json.loads((folder/'manifest.json').read_text());organ=next(o for o in sourceManifest['organs'] if o['organ_id']=='straight_sinus')
    audit=json.loads((folder/'vendor-audit.json').read_text())['objects']['Straight sinus']
    report=next(o for o in json.loads((folder/'vendor-reports-cardiovascular.json').read_text())['objects'] if o['name']=='Straight sinus')
    ta2=next(line for line in (folder/'vendor-TA2.csv').read_text(encoding='utf-8-sig').splitlines() if ';Sinus rectus;' in line)
    rows=json.loads((folder/'downloads.json').read_text())
    result={'schema':1,'sourceRepository':local['sourceRepository'],'sourceCommit':local['sourceCommit'],'license':'CC-BY-SA-4.0','organ':organ,'originalObjectAudit':audit,'evaluatedExportReport':report,
        'ta2Row':ta2,'upstreamGLBSHA256':sha(upstream),'qbankSubsetSHA256':sha(subset),'sourceAndSubsetPrimitive':original,'primitiveAndTransformsExactlyEqual':True,
        'displayTransform':{'scale':100,'translation':[0,-160,0],'units':'source glTF metres -> atlas centimetres, Y up'},
        'sourceFiles':rows,'scientificStatus':{'anatomicalIdentityApproved':False,'clinicalSegmentationEstablished':False,'connectionToGalenVerified':False},
        'lineageLimits':'Anatria vendor audit records a Blender CURVE, evaluated to a mesh before glTF export. TA2/name agreement is nomenclature only. NOTICE declares Z-Anatomy derived from BodyParts3D, but no object-specific BodyParts3D/FMA mesh identifier or patient segmentation provenance was established. Original Startup.blend was not independently inspected in this audit. No warp, bridge or renaming performed.'}
    (ROOT/'docs/neuro3d-sinus-lineage-audit.json').write_text(json.dumps(result,indent=2,ensure_ascii=False)+'\n',encoding='utf-8')
    print(json.dumps({'primitiveAndTransformsExactlyEqual':True,'objectType':audit['type'],'exportPolygons':report['polygons'],'sourceAndSubsetPrimitive':original},ensure_ascii=False))
