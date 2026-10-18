"""Recover the remaining source head/neck context without moving any mesh.

Usage: python3 tools/neuro3d/import_craniocervical.py /path/to/Anatria-3D
The spatial envelope is a reproducible selection rule, not anatomical validation.
Air cavities, regional labels and attachment footprints have distinct layers.
"""
import copy
import hashlib
import json
import subprocess
import sys
from collections import Counter
from pathlib import Path

from import_open_anatomy import ROOT, bounds, read_glb, subset

BASES = ['open-anatomy', 'landmarks', 'supra-aortic', 'body-access']
SYSTEMS = ['skeletal', 'nervous', 'cardiovascular', 'endocrine', 'articular',
           'muscular', 'digestive', 'respiratory', 'lymphatic', 'regional']
# Cervicothoracic venous outlets otherwise fall just below the neck envelope.
OUTLETS = {'right_brachiocephalic_vein', 'left_brachiocephalic_vein',
           'right_subclavian_vein', 'left_subclavian_vein'}


def layer_for(organ):
    system, ident, path = organ['system'], organ['organ_id'], organ['path']
    if system == 'skeletal':
        if 'sinus_of_' in ident or '_cells_of_ethmoid_' in ident: return 'cavity'
        if 'cartilage' in ident or 'disc_' in ident or 'nucleus_pulposus' in ident: return 'cartilage'
        return 'ligament' if 'ligament' in ident else 'bone'
    if system == 'nervous': return 'tissue' if 'Central nervous system' in path else 'nerve'
    if system == 'cardiovascular': return 'venous' if 'Systemic veins' in path else 'arterial'
    if system == 'endocrine' or system == 'digestive' and 'gland' in ident: return 'gland'
    if system == 'articular': return 'ligament'
    if system == 'muscular':
        if 'Muscular insertions' in path: return 'attachment'
        if any(word in ident for word in ['fascia', 'aponeurosis', 'ring', 'tendon', 'trochlea', 'tarsus']): return 'ligament'
        return 'muscle'
    return {'regional': 'region', 'lymphatic': 'lymphatic'}.get(system, 'visceral')


def main():
    checkout = Path(sys.argv[1]); source = checkout / 'public/anatomy'
    bases = [json.loads((ROOT/f'features/neuro3d/{name}.json').read_text()) for name in BASES]
    commit = subprocess.check_output(['git', '-C', str(checkout), 'rev-parse', 'HEAD'], text=True).strip()
    assert commit == bases[0]['sourceCommit'], 'Use the same pinned source as the existing atlas'
    existing = {row['id'] for base in bases for row in base['structures']}
    manifest = json.loads((source/'manifest.json').read_text())
    structures, assets, audit = [], [], []
    for system in SYSTEMS:
        original = source/f'{system}_male.glb'
        doc, binary = read_glb(original)
        nodes = {node['name']: node for node in doc['nodes'] if 'mesh' in node}
        selected = []
        for organ in manifest['organs']:
            if organ['system'] != system or organ['organ_id'] in existing: continue
            ident = organ['organ_id']; node = nodes.get(organ['node'])
            if node is None:
                audit.append({'id': ident, 'system': system, 'reason': 'source-node-missing'}); continue
            assert 'matrix' not in node, 'matrix transforms require explicit support'
            low, high = bounds(doc, node)
            in_envelope = low[1] >= 1.32 and high[1] >= 1.44 and max(abs(low[0]), abs(high[0])) < .18
            if not in_envelope and ident not in OUTLETS: continue
            # Degenerate source marker planes are not an organ surface.
            if min(high[k]-low[k] for k in range(3)) < 1e-6:
                audit.append({'id': ident, 'system': system, 'reason': 'degenerate-source-surface'}); continue
            assert ident not in existing, f'duplicate id {ident}'
            existing.add(ident)
            new = copy.deepcopy(node); new.setdefault('extras', {})['qbankAnatomyId'] = ident
            selected.append(new)
            structures.append({'id': ident, 'name': organ['name_en'], 'latin': organ['ta2_latin'],
                               'node': organ['node'], 'layer': layer_for(organ), 'file': f'context_{system}.glb',
                               'path': organ['path'], 'bounds': [low, high], 'reviewStatus': 'upstream-label-unreviewed'})
        if not selected: continue
        raw = subset(doc, binary, selected); file = f'context_{system}.glb'
        (ROOT/'public/neuro3d/open-anatomy'/file).write_bytes(raw)
        assets.append({'file': file, 'sha256': hashlib.sha256(raw).hexdigest(), 'size': len(raw),
                       'structures': len(selected), 'upstreamSha256': hashlib.sha256(original.read_bytes()).hexdigest()})
    result = {key: bases[0][key] for key in ['sourceRepository', 'sourceCommit', 'license', 'attribution', 'coordinateSystem']}
    result.update(assets=assets, structures=structures)
    (ROOT/'features/neuro3d/craniocervical.json').write_text(json.dumps(result, ensure_ascii=False, indent=2)+'\n')
    audit_doc = {'sourceCommit': commit, 'rule': 'New male-atlas nodes: minY >= 1.32m, maxY >= 1.44m, absX < 0.18m, plus 4 named venous outlets. Original whole meshes and transforms preserved.',
                 'layers': dict(Counter(row['layer'] for row in structures)), 'imported': len(structures),
                 'excludedCandidates': audit, 'licenseFiles': ['LICENSE', 'NOTICE']}
    (ROOT/'docs/neuro3d-craniocervical-audit.json').write_text(json.dumps(audit_doc, ensure_ascii=False, indent=2)+'\n')
    print(json.dumps({'imported': len(structures), 'layers': audit_doc['layers'], 'excluded': len(audit), 'bytes': sum(a['size'] for a in assets)}))


if __name__ == '__main__': main()
