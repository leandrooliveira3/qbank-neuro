"""Meaningful coordinate/label integrity checks using explicitly synthetic volumes."""
import tempfile
import unittest
from pathlib import Path

import numpy as np
import trimesh
from import_vascular_segmentation import load_volume, export_volume


class ImportSegmentationTest(unittest.TestCase):
    def test_lps_affine_and_anisotropic_voxels_are_preserved_in_export(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory)
            labels = np.zeros((12, 13, 14), dtype=np.uint8)
            labels[2:6, 3:8, 4:10] = 1
            affine = np.diag([2., 3., 4., 1.])
            affine[:3, 3] = [100, 200, 300]
            np.savez(path / "source.npz", labels=labels, affine=affine, space="LPS")
            data, ras = load_volume(path / "source.npz")
            np.testing.assert_allclose(ras[:3, 3], [-100, -200, 300])
            result = export_volume(data, ras, {"1": {"name": "Synthetic tube"}}, path / "out", {"license": "CC0-synthetic-test"})
            # Physical RAS bounds of the marching-cubes half-voxel boundary.
            bounds = np.array(result["structures"][0]["boundsMetres"])
            np.testing.assert_allclose(bounds[0], [-.111, .314, .2075], atol=1e-6)
            np.testing.assert_allclose(bounds[1], [-.103, .338, .2225], atol=1e-6)
            exported = trimesh.load(path / "out" / "segmented-vessels.glb", force="scene")
            np.testing.assert_allclose(exported.bounds, bounds, atol=1e-6)
            self.assertTrue(result["structures"][0]["watertight"])
            self.assertFalse(result["structures"][0]["touchesVolumeBoundary"])
            self.assertIsNone(result["registrationToAtlas"])
            self.assertFalse(result["structures"][0]["navigable"])

    def test_probabilities_missing_labels_and_undeclared_channels_are_rejected(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory)
            np.savez(path / "probability.npz", labels=np.full((3, 3, 3), .2), affine=np.eye(4), space="RAS")
            with self.assertRaisesRegex(ValueError, "integer labels"):
                load_volume(path / "probability.npz")
            np.savez(path / "channels.npz", labels=np.zeros((3, 3, 3, 2)), affine=np.eye(4), space="RAS")
            with self.assertRaisesRegex(ValueError, "Multi-channel"):
                load_volume(path / "channels.npz")
            with self.assertRaisesRegex(ValueError, "absent"):
                export_volume(np.zeros((3, 3, 3)), np.eye(4), {"1": {"name": "Absent"}}, path / "out", {})


if __name__ == "__main__":
    unittest.main()
