"""Extract CC BY-SA 4.0 atlas assets without copying Anatria application code.
Usage: python3 tools/neuro3d/import_open_anatomy.py /path/to/Anatria-3D
Transforms are preserved, Draco buffers are copied without recompression.
"""
import argparse, copy, hashlib, json, struct, subprocess
from pathlib import Path
import numpy as np

ROOT = Path(__file__).resolve().parents[2]

def read_glb(path):
    raw = path.read_bytes()
    assert raw[:4] == b'glTF'
    size = struct.unpack_from('<I', raw, 12)[0]
    document = json.loads(raw[20:20 + size])
    offset = 20 + size
    assert raw[offset + 4:offset + 8] == b'BIN\0'
    return document, raw[offset + 8:]

def bounds(doc, node):
    assert not node.get('children'), 'hierarchical input needs explicit parent transform handling'
    p = doc['meshes'][node['mesh']]['primitives'][0]
    a = doc['accessors'][p['attributes']['POSITION']]
    corners = np.array([[x,y,z] for x in [a['min'][0],a['max'][0]] for y in [a['min'][1],a['max'][1]] for z in [a['min'][2],a['max'][2]]])
    corners *= np.array(node.get('scale', [1,1,1]))
    x,y,z,w = node.get('rotation',[0,0,0,1])
    rotation = np.array([[1-2*(y*y+z*z),2*(x*y-z*w),2*(x*z+y*w)], [2*(x*y+z*w),1-2*(x*x+z*z),2*(y*z-x*w)], [2*(x*z-y*w),2*(y*z+x*w),1-2*(x*x+y*y)]])
    corners = corners @ rotation.T + np.array(node.get('translation',[0,0,0]))
    return corners.min(axis=0).tolist(), corners.max(axis=0).tolist()

def subset(doc, binary, selected):
    out = {'asset': {'version':'2.0','generator':'QBank-Neuro anatomy subset extractor'}, 'scene':0, 'scenes':[{'nodes':[]}], 'nodes':[], 'meshes':[], 'accessors':[], 'bufferViews':[], 'extensionsUsed':['KHR_draco_mesh_compression'], 'extensionsRequired':['KHR_draco_mesh_compression']}
    data=bytearray(); accessors={}; views={}
    def view(index):
        if index not in views:
            original=doc['bufferViews'][index]; start=original.get('byteOffset',0)
            while len(data)%4:data.append(0)
            views[index]=len(out['bufferViews'])
            out['bufferViews'].append({'buffer':0,'byteOffset':len(data),'byteLength':original['byteLength']})
            data.extend(binary[start:start+original['byteLength']])
        return views[index]
    def accessor(index):
        if index not in accessors:
            original=copy.deepcopy(doc['accessors'][index])
            if 'bufferView' in original:original['bufferView']=view(original['bufferView'])
            assert 'sparse' not in original
            accessors[index]=len(out['accessors']);out['accessors'].append(original)
        return accessors[index]
    for node in selected:
        new=copy.deepcopy(node);mesh=copy.deepcopy(doc['meshes'][node['mesh']])
        for p in mesh['primitives']:
            p['attributes']={key:accessor(value) for key,value in p['attributes'].items()}
            if 'indices' in p:p['indices']=accessor(p['indices'])
            p.pop('material',None)
            e=p['extensions']['KHR_draco_mesh_compression'];e['bufferView']=view(e['bufferView'])
        new['mesh']=len(out['meshes']);out['meshes'].append(mesh)
        out['scenes'][0]['nodes'].append(len(out['nodes']));out['nodes'].append(new)
    out['buffers']=[{'byteLength':len(data)}]
    encoded=json.dumps(out,separators=(',',':')).encode()
    encoded += b' '*((-len(encoded))%4); data += b'\0'*((-len(data))%4)
    return struct.pack('<4sII',b'glTF',2,28+len(encoded)+len(data))+struct.pack('<I4s',len(encoded),b'JSON')+encoded+struct.pack('<I4s',len(data),b'BIN\0')+data

def main():
    parser=argparse.ArgumentParser();parser.add_argument('source',type=Path);args=parser.parse_args()
    source=args.source/'public/anatomy'; manifest=json.loads((source/'manifest.json').read_text())
    target=ROOT/'public/neuro3d/open-anatomy';target.mkdir(parents=True,exist_ok=True)
    organs=[]; assets=[]
    for system in ['skeletal','nervous','cardiovascular']:
        file=system+'_male.glb';doc,binary=read_glb(source/file)
        byname={n['name']:n for n in doc['nodes'] if 'mesh' in n}
        selected=[]
        for organ in manifest['organs']:
            if organ['system']!=system:continue
            node=byname.get(organ['node'])
            if node is None:raise ValueError('Missing node '+organ['node'])
            low,high=bounds(doc,node); path=organ['path']; name=organ['node']
            take = system=='skeletal' and (any(x in path for x in ['Cranium','Extracranial bones of head','Cervical vertebrae']))
            take |= system=='nervous' and any(x in path for x in ['Brain','Cranial nerves','Sense organs'])
            take |= system=='cardiovascular' and high[1]>=1.48 and low[1]>=1.20
            if not take:continue
            layer = 'bone' if system=='skeletal' else ('venous' if 'Systemic veins' in path else 'arterial') if system=='cardiovascular' else ('nerve' if 'Cranial nerves' in path else 'tissue')
            node=copy.deepcopy(node)
            node.setdefault('extras',{})['qbankAnatomyId']=organ['organ_id']
            selected.append(node)
            organs.append({'id':organ['organ_id'],'name':organ['name_en'],'latin':organ['ta2_latin'],'node':name,'layer':layer,'file':system+'_head.glb','path':path,'bounds':[low,high],'reviewStatus':'upstream-label-unreviewed'})
        raw=subset(doc,binary,selected);out=system+'_head.glb';(target/out).write_bytes(raw)
        assets.append({'file':out,'sha256':hashlib.sha256(raw).hexdigest(),'size':len(raw),'structures':len(selected),'upstreamSha256':hashlib.sha256((source/file).read_bytes()).hexdigest()})
    result={'version':1,'sourceRepository':'https://github.com/Nurkan1/Anatria-3D','sourceCommit':subprocess.check_output(['git','-C',str(args.source),'rev-parse','HEAD'],text=True).strip(),'license':'CC-BY-SA-4.0','attribution':'BodyParts3D / DBCLS → Z-Anatomy → Anatria3D → QBank-Neuro head/neck subset','coordinateSystem':'Upstream glTF coordinates, metres, Y up; original node transforms retained. Not registered to patient images.','assets':assets,'structures':organs}
    (ROOT/'features/neuro3d/open-anatomy.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
    (target/'LICENSE').write_text((source/'LICENSE').read_text())
    (target/'NOTICE').write_text((source/'NOTICE').read_text()+'\nQBank-Neuro adaptations (2026-10-17): head/neck subset selected from male skeletal, nervous and cardiovascular models; source node transforms and Draco geometry preserved, unused mesh buffers removed, no new anatomical validation. Adapted assets and derived labels remain CC BY-SA 4.0.\n')
    decoder=args.source/'public/draco/gltf';dest=target/'draco';dest.mkdir(exist_ok=True)
    for name in ['draco_wasm_wrapper.js','draco_decoder.wasm']:(dest/name).write_bytes((decoder/name).read_bytes())
    (dest/'LICENSE').write_text(subprocess.check_output(['git','-C',str(args.source),'show','HEAD:LICENSES/Apache-2.0.txt'],text=True))
    (dest/'NOTICE').write_text('Google Draco glTF decoder; Apache License 2.0. Source: https://github.com/google/draco ; distributed with Anatria3D.\n')
    print(json.dumps({'structures':len(organs),'assets':assets},indent=2))
if __name__=='__main__':main()
