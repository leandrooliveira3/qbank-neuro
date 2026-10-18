"""Recover named mesh nodes omitted from the pinned source's organ manifest.

Usage: python3 tools/neuro3d/import_unindexed_vessels.py SOURCE_DIRECTORY
SOURCE_DIRECTORY contains cardiovascular_male.glb and manifest.json at the
same pinned Anatria3D revision as the current atlas. No geometry is generated.
"""
import copy
import hashlib
import json
import sys
from pathlib import Path
from import_open_anatomy import ROOT, read_glb, bounds, subset

BASES = ['open-anatomy', 'landmarks', 'supra-aortic', 'body-access', 'craniocervical']
PAIRED = {
    'Anterior temporal branch': ('anterior_temporal_branch_of_mca', 'Ramo temporal anterior da ACM'),
    'Artery of central sulcus': ('artery_of_central_sulcus', 'Artéria do sulco central'),
    'Artery of precentral sulcus': ('artery_of_precentral_sulcus', 'Artéria do sulco pré-central'),
    'Branch to angular gyrus': ('arterial_branch_to_angular_gyrus', 'Ramo arterial para o giro angular'),
    'Distal lateral striate branches': ('distal_lateral_striate_branches', 'Ramos estriados laterais distais'),
    'Lateral frontobasal artery': ('lateral_frontobasal_artery', 'Artéria frontobasal lateral'),
    'Posterior parietal artery': ('posterior_parietal_artery', 'Artéria parietal posterior'),
    'Posterior temporal branch': ('posterior_temporal_branch_of_mca', 'Ramo temporal posterior da ACM'),
    'Prefrontal artery': ('prefrontal_artery', 'Artéria pré-frontal'),
    'Proximal lateral striate branches': ('proximal_lateral_striate_branches', 'Ramos estriados laterais proximais'),
    'Temporo-occipital branch': ('temporo_occipital_branch_of_mca', 'Ramo temporo-occipital da ACM'),
}
SINGLE = {
    'Insular branches of middle cerebral artery (M2-segment).l': ('insular_branches_of_middle_cerebral_artery_m2_l', 'Ramos insulares da ACM, M2 esquerdo'),
    'Middle cerebral artery (M3 segment).l': ('middle_cerebral_artery_m3_segment_l', 'ACM, segmento M3 esquerdo'),
}
CERVICAL = {
    '(Deep branch of transverse cervical artery)': ('deep_branch_of_transverse_cervical_artery', 'Ramo profundo da artéria cervical transversa'),
    '(Superficial branch of transverse cervical artery)': ('superficial_branch_of_transverse_cervical_artery', 'Ramo superficial da artéria cervical transversa'),
}


def geometry_identity(doc, binary, node):
    """Exact source payload + transform fingerprint, not approximate anatomy."""
    parts = []
    for primitive in doc['meshes'][node['mesh']]['primitives']:
        ext = primitive['extensions']['KHR_draco_mesh_compression']
        view = doc['bufferViews'][ext['bufferView']]
        start = view.get('byteOffset', 0)
        parts.append(hashlib.sha256(binary[start:start+view['byteLength']]).hexdigest())
    return (tuple(parts), json.dumps({k: node.get(k) for k in ['translation', 'rotation', 'scale', 'matrix']}, sort_keys=True))


def main():
    source = Path(sys.argv[1]); original_path = source/'cardiovascular_male.glb'
    base = json.loads((ROOT/'features/neuro3d/open-anatomy.json').read_text())
    expected_hash = next(a['upstreamSha256'] for a in base['assets'] if a['file'] == 'cardiovascular_head.glb')
    raw_hash = hashlib.sha256(original_path.read_bytes()).hexdigest()
    assert raw_hash == expected_hash, 'The source geometry is not the pinned atlas revision'
    doc, binary = read_glb(original_path)
    manifest = json.loads((source/'manifest.json').read_text())
    declared = {o['node'] for o in manifest['organs'] if o['system'] == 'cardiovascular'}
    existing = [o for name in BASES for o in json.loads((ROOT/f'features/neuro3d/{name}.json').read_text())['structures']]
    existing_ids = {o['id'] for o in existing}; existing_names = {o['node'] for o in existing}
    wanted = dict(SINGLE)
    for name, (ident, portuguese) in PAIRED.items():
        for side, suffix in [('l', 'esquerdo'), ('r', 'direito')]:
            wanted[name+'.'+side] = (ident+'_'+side, portuguese+' · '+suffix)
    for name, (ident, portuguese) in CERVICAL.items():
        for side, suffix in [('l', 'esquerdo'), ('r', 'direito')]:
            wanted[name+'.'+side] = (ident+'_'+side, portuguese+' · '+suffix)
    nodes = {node['name']: node for node in doc['nodes'] if 'mesh' in node}
    assert set(wanted) <= set(nodes), 'An expected source node is missing'
    assert not (set(wanted) & declared), 'This extractor only handles unindexed nodes'
    assert len(doc['scenes'][doc.get('scene', 0)]['nodes']) == len(nodes), 'Unexpected hierarchy; parent transforms need support'
    fingerprints = {geometry_identity(doc, binary, nodes[name]) for name in existing_names if name in nodes}
    selected, structures = [], []
    for name, (ident, portuguese) in wanted.items():
        assert ident not in existing_ids and name not in existing_names, 'Duplicate anatomical ID/node'
        node = copy.deepcopy(nodes[name])
        assert not node.get('children') and 'matrix' not in node
        fingerprint = geometry_identity(doc, binary, node)
        assert fingerprint not in fingerprints, 'Exact duplicate of existing source geometry'
        fingerprints.add(fingerprint)
        low, high = bounds(doc, node)
        cervical = name.startswith('(')
        assert low[1] > (1.2 if cervical else 1.48) and high[1] < (1.48 if cervical else 1.75), 'Unexpected regional bounds'
        node.setdefault('extras', {})['qbankAnatomyId'] = ident
        selected.append(node)
        structures.append({'id': ident, 'name': name, 'latin': '', 'node': name,
                           'layer': 'arterial', 'file': 'unindexed_vessels.glb',
                           'path': ['Systemic arteries', 'Transverse cervical artery' if cervical else 'Middle cerebral artery', 'Recovered source nodes'],
                           'sourceRegion': 'transverse-cervical' if cervical else 'mca',
                           'bounds': [low, high], 'reviewStatus': 'source-node-label-unreviewed',
                           'portuguese': portuguese})
    raw = subset(doc, binary, selected)
    target = ROOT/'public/neuro3d/open-anatomy'
    (target/'unindexed_vessels.glb').write_bytes(raw)
    result = {key: base[key] for key in ['sourceRepository', 'sourceCommit', 'license', 'attribution', 'coordinateSystem']}
    result.update(assets=[{'file': 'unindexed_vessels.glb', 'sha256': hashlib.sha256(raw).hexdigest(),
                          'size': len(raw), 'structures': len(structures), 'upstreamSha256': raw_hash}], structures=structures)
    (ROOT/'features/neuro3d/unindexed-vessels.json').write_text(json.dumps(result, ensure_ascii=False, indent=2)+'\n')
    excluded = sorted(set(nodes)-declared-set(wanted))
    audit = {'sourceCommit': base['sourceCommit'], 'sourceFile': 'cardiovascular_male.glb', 'sourceSha256': raw_hash,
             'meshNodes': len(nodes), 'manifestNodes': len(declared), 'unindexedNodes': len(set(nodes)-declared),
             'importedNodes': len(structures), 'importedNames': list(wanted), 'remainingUnindexedNames': excluded,
             'geometryPolicy': 'Original Draco geometry and complete node transforms retained; no per-vessel fitting, mirroring, anatomical renaming or generated tubes.',
             'review': 'Names identify source nodes, not independently validated origins or vascular territories.'}
    (ROOT/'docs/neuro3d-unindexed-vessels-audit.json').write_text(json.dumps(audit, ensure_ascii=False, indent=2)+'\n')
    print(json.dumps({'imported': len(structures), 'unindexed': audit['unindexedNodes'], 'remaining': len(excluded), 'bytes': len(raw)}))


if __name__ == '__main__': main()
