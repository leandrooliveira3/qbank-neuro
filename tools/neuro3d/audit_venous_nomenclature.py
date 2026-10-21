"""Directed English-label check only; not a vascular geometry audit."""
from pathlib import Path
import hashlib,json,re
source=Path('../artifacts/sinus-lineage/vendor-TA2.csv')
data=source.read_bytes()
blob_sha=hashlib.sha1(b'blob '+str(len(data)).encode()+b'\0'+data).hexdigest()
if blob_sha!='71bef934c23d207550ad1f318ec6edd8551cdba4':raise ValueError('Fixed source blob mismatch')
rows=[]
for line in data.decode('utf-8-sig').splitlines():
    fields=line.strip('"').split(';')
    if len(fields)>2 and fields[0].isdigit():rows.append({'sourceId':fields[0],'englishLabel':fields[1]})
terms=['medial atrial vein','transverse caudate veins','interpeduncular vein','transverse pontine vein','pontomedullary sulcus vein','brachial vein','tonsillar veins']
normalize=lambda s:re.sub(r'\bveins\b','vein',s.lower().strip())
near=[r for r in rows if re.search(r'\bveins?\b',r['englishLabel'],re.I) and re.search(r'atrial|caudate|pontine|brachial|tonsillar|interpedunc|pontomedull',r['englishLabel'],re.I)]
result={'schema':1,'sourceCommit':'6320bd64df8db2fcfed358a27c85d1fcc1c5913c','sourceURL':'https://github.com/anatriacom/anatria/blob/6320bd64df8db2fcfed358a27c85d1fcc1c5913c/tools/asset-pipeline/vendor/TA2.csv','sourceBlobSHA1':blob_sha,'sourceSHA256':hashlib.sha256(data).hexdigest(),'englishRowsChecked':len(rows),
 'method':'English labels only, case-insensitive exact match after vein/veins normalization. No Latin/translation equivalence or geometry inferred. Source numeric IDs are terminology rows, NOT atlas mesh identities.',
 'terms':[{'sourceTerm':t,'lexicalMatches':[r for r in rows if normalize(r['englishLabel'])==normalize(t)],'confirmedAtlasId':None,'geometryVerified':False} for t in terms],
 'nearbyLabels':near,'limits':'Brachial veins is an English lexical match only and remains rejected as posterior-fossa geometry: source meshes are upper-limb homonyms. Generic Pontine veins does not individualize a transverse vein. Atrial cardiac labels and hepatic caudate branches are not cerebral vessels. Missing exact label is not anatomical absence. Original CSV not redistributed; underlying nomenclature rights not reassigned.'}
Path('features/neuro3d/venous-nomenclature-audit.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps({'rows':len(rows),'matches':[(r['sourceTerm'],len(r['lexicalMatches'])) for r in result['terms']],'nearby':near}))
