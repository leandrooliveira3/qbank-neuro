"""Preserve original distal ACA surfaces where global decimation broke topology.
Usage: python3 export_projection_overrides.py DECODED_JSON REPO_ROOT
Source is decode_reference_meshes.mjs output in the unchanged atlas cm frame.
"""
import gzip
import hashlib
import json
import sys
from pathlib import Path

source = json.loads(Path(sys.argv[1]).read_text())
root = Path(sys.argv[2])
ids = [f"{artery}_{side}" for artery in ["pericallosal_artery", "callosomarginal_artery"] for side in ["l", "r"]]
records = []
for identifier in ids:
    item = source[identifier]
    records.append({"id": identifier, "layer": "arterial",
                    "positions": [value for point in item["positions"] for value in point],
                    "indices": [value for face in item["faces"] for value in face]})
encoded = json.dumps(records, separators=(",", ":")).encode()
compressed = gzip.compress(encoded, mtime=0)
path = root / "public/neuro3d/open-anatomy/reference-distal-aca.bin"
path.write_bytes(compressed)
metadata = {"version": 1, "sourceCommit": json.loads((root / "features/neuro3d/open-anatomy.json").read_text())["sourceCommit"],
            "attribution": "BodyParts3D / DBCLS -> Z-Anatomy -> Anatria3D -> QBank-Neuro source-frame projection subset", "file": path.name, "size": len(compressed), "uncompressedSize": len(encoded),
            "sha256": hashlib.sha256(compressed).hexdigest(), "license": "CC-BY-SA-4.0",
            "coordinateSystem": "Source world cm, Y minus160; identical to decoded atlas; no recentering or registration",
            "structures": [{"id": row["id"], "faces": len(row["indices"]) // 3} for row in records],
            "reason": "Retain source distal ACA components instead of global 700-face decimation; source openings computationally capped only by projector"}
(root / "features/neuro3d/reference-distal-aca.json").write_text(json.dumps(metadata, indent=2) + "\n")
print(json.dumps({"compressedBytes": len(compressed), "faces": sum(len(row["indices"]) // 3 for row in records)}))
