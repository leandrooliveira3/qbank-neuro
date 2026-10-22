"""Export reviewed label volumes in a declared physical frame, without atlas fusion.

Inputs: .nii/.nii.gz via nibabel, .mha/.mhd via SimpleITK, or .npz containing
labels (XYZ), affine (4x4, mm), and space ('RAS' or 'LPS'). Multi-channel
volumes require --channel. Supply a label map; anatomy is never inferred from
binary segmentations. Output GLB uses metres, +Y superior, -Z anterior.
"""
import argparse
import hashlib
import json
from pathlib import Path

import numpy as np
import trimesh
from scipy.ndimage import label as connected_components
from skimage.measure import marching_cubes


def load_volume(path, channel=None):
    path = Path(path)
    if path.name.endswith((".nii", ".nii.gz")):
        try:
            import nibabel as nib
        except ImportError as error:
            raise ValueError("NIfTI requires nibabel; install it in the import environment.") from error
        image = nib.load(str(path))
        data, affine, space = np.asanyarray(image.dataobj), np.asarray(image.affine), "RAS"
    elif path.suffix.lower() in (".mha", ".mhd"):
        try:
            import SimpleITK as sitk
        except ImportError as error:
            raise ValueError("MHA/MHD requires SimpleITK; install it in the import environment.") from error
        image = sitk.ReadImage(str(path))
        if image.GetDimension() != 3:
            raise ValueError("Only three spatial dimensions are supported.")
        data = sitk.GetArrayFromImage(image)
        data = data.transpose(2, 1, 0, 3) if data.ndim == 4 else data.transpose(2, 1, 0)
        affine = np.eye(4)
        affine[:3, :3] = np.array(image.GetDirection()).reshape(3, 3) @ np.diag(image.GetSpacing())
        affine[:3, 3] = image.GetOrigin()
        space = "LPS"
    elif path.suffix.lower() == ".npz":
        with np.load(path, allow_pickle=False) as archive:
            data, affine, space = archive["labels"], archive["affine"], str(archive["space"].item())
    else:
        raise ValueError("Supported inputs: NIfTI, MHA/MHD and explicit-frame NPZ.")
    if data.ndim == 4:
        if channel is None or not 0 <= channel < data.shape[3]:
            raise ValueError("Multi-channel data requires a valid --channel; lumen and wall are distinct.")
        data = data[..., channel]
    elif channel is not None:
        raise ValueError("--channel was supplied for a scalar volume.")
    if data.ndim != 3 or min(data.shape) < 2:
        raise ValueError("Expected a 3D label volume.")
    affine = np.asarray(affine, dtype=float)
    if affine.shape != (4, 4) or not np.isfinite(affine).all() or not np.allclose(affine[3], [0, 0, 0, 1]):
        raise ValueError("Invalid voxel-to-physical affine.")
    if abs(np.linalg.det(affine[:3, :3])) < 1e-10:
        raise ValueError("Singular spatial affine.")
    if space not in ("RAS", "LPS"):
        raise ValueError("Declare RAS or LPS physical coordinates.")
    if not np.isfinite(data).all() or not np.equal(data, np.floor(data)).all():
        raise ValueError("Expected finite integer labels, not probabilities or raw MRI intensities.")
    if space == "LPS":
        affine = np.diag([-1, -1, 1, 1]) @ affine
    return data, affine


def export_volume(data, ras_affine, label_map, output, source):
    output = Path(output)
    output.mkdir(parents=True, exist_ok=True)
    scene, records = trimesh.Scene(), []
    # RAS-mm -> glTF metres, preserving subject origin (no per-structure recentering).
    ras_to_gltf = np.array([[.001, 0, 0, 0], [0, 0, .001, 0], [0, -.001, 0, 0], [0, 0, 0, 1]])
    transform = ras_to_gltf @ ras_affine
    for value, specification in label_map.items():
        value = int(value)
        if value <= 0 or not isinstance(specification, dict) or not specification.get("name"):
            raise ValueError("Each positive label requires an explicit anatomical name.")
        mask = data == value
        if not mask.any():
            raise ValueError(f"Requested label {value} is absent.")
        vertices, faces, _, _ = marching_cubes(np.pad(mask.astype(np.uint8), 1), level=.5)
        vertices -= 1
        mesh = trimesh.Trimesh(vertices=vertices, faces=faces, process=False)
        mesh.apply_transform(transform)
        mesh.fix_normals(multibody=True)
        mesh.visual.vertex_colors = specification.get("rgba", [180, 55, 65, 255])
        scene.add_geometry(mesh, node_name=f"label-{value}", geom_name=f"label-{value}")
        _, components = connected_components(mask)
        boundary = any(np.take(mask, edge, axis).any() for axis in range(3) for edge in (0, -1))
        records.append({"label": value, "name": specification["name"], "node": f"label-{value}",
                        "voxels": int(mask.sum()), "components6": components,
                        "faces": len(faces), "watertight": bool(mesh.is_watertight),
                        "touchesVolumeBoundary": bool(boundary), "boundsMetres": mesh.bounds.tolist(),
                        "reviewStatus": "source-segmentation-unreviewed", "navigable": False})
    if not records:
        raise ValueError("Label map is empty.")
    raw = scene.export(file_type="glb")
    (output / "segmented-vessels.glb").write_bytes(raw)
    manifest = {"schemaVersion": 1, "source": source,
                "coordinateFrame": "Subject RAS-mm converted to glTF metres: (x,z,-y)/1000; origin preserved",
                "voxelToRASmm": ras_affine.tolist(), "voxelToGLTFmetres": transform.tolist(),
                "registrationToAtlas": None, "navigationGraph": None,
                "reviewStatus": "geometry-export-only; no anatomical validation or automatic atlas fusion",
                "file": "segmented-vessels.glb", "sha256": hashlib.sha256(raw).hexdigest(), "structures": records}
    (output / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n")
    return manifest


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("volume", type=Path)
    parser.add_argument("label_map", type=Path, help='JSON object: {"1":{"name":"Vascular mask"}}')
    parser.add_argument("output", type=Path)
    parser.add_argument("--channel", type=int)
    parser.add_argument("--source-url", required=True)
    parser.add_argument("--license", required=True, help="Actual data permission; model-code licence is not a dataset licence.")
    arguments = parser.parse_args()
    data, affine = load_volume(arguments.volume, arguments.channel)
    source = {"url": arguments.source_url, "license": arguments.license,
              "inputSHA256": hashlib.sha256(arguments.volume.read_bytes()).hexdigest(),
              "voxelDataSHA256": hashlib.sha256(np.ascontiguousarray(data).tobytes()).hexdigest(),
              "shapeXYZ": list(data.shape), "dtype": str(data.dtype),
              "channel": arguments.channel}
    manifest = export_volume(data, affine, json.loads(arguments.label_map.read_text()), arguments.output, source)
    print(json.dumps({"structures": len(manifest["structures"]), "registrationToAtlas": None,
                      "sha256": manifest["sha256"]}))


if __name__ == "__main__":
    main()
