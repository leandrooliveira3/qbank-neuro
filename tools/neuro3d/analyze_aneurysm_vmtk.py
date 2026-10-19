#!/usr/bin/env python3
"""Offline adapter for a neck-delimited aneurysm surface; never changes atlas anatomy.

Requires the independently installed GPLv3 vmtk4aneurysms, VMTK and VTK.
No upstream implementation is copied or bundled with the browser application.
"""
import argparse
import hashlib
import json
import math
from pathlib import Path


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("surface", type=Path, help="VTP sac surface open at its neck; not the entire arterial tree")
    parser.add_argument("--output", required=True, type=Path)
    parser.add_argument("--units", required=True, choices=["mm", "cm", "m"])
    parser.add_argument("--location", required=True, choices=["ica-ophthalmic", "ica-pcom", "acom", "mca-bifurcation", "basilar-apex", "pica", "other"])
    parser.add_argument("--parent-id", required=True, help="Explicit parent vessel ID; label only, not proof of registration")
    args = parser.parse_args()
    try:
        import vtk
        from vmtk4aneurysms.aneurysms import Aneurysm
    except ImportError as error:
        parser.exit(2, f"Missing offline dependency: {error}. Install VTK/VMTK/vmtk4aneurysms in a separate Python environment.\n")
    reader = vtk.vtkXMLPolyDataReader()
    reader.SetFileName(str(args.surface))
    reader.Update()
    surface = reader.GetOutput()
    if not surface.GetNumberOfPoints() or not surface.GetNumberOfCells():
        parser.error("The VTP surface is empty or unreadable")
    # The upstream Aneurysm contract requires an open neck. Reject closed spheres.
    boundary = vtk.vtkFeatureEdges()
    boundary.SetInputData(surface)
    boundary.BoundaryEdgesOn()
    boundary.FeatureEdgesOff()
    boundary.ManifoldEdgesOff()
    boundary.NonManifoldEdgesOff()
    boundary.Update()
    if not boundary.GetOutput().GetNumberOfCells():
        parser.error("The aneurysm surface must have an open, neck-delimited boundary")
    connectivity = vtk.vtkPolyDataConnectivityFilter()
    connectivity.SetInputData(boundary.GetOutput())
    connectivity.SetExtractionModeToAllRegions()
    connectivity.Update()
    if connectivity.GetNumberOfExtractedRegions() != 1:
        parser.error("Expected one neck boundary; multiple holes require geometric review")
    transform = vtk.vtkTransform()
    scale = {"mm": 0.1, "cm": 1.0, "m": 100.0}[args.units]
    transform.Scale(scale, scale, scale)
    scaling = vtk.vtkTransformPolyDataFilter()
    scaling.SetTransform(transform)
    scaling.SetInputData(surface)
    scaling.Update()
    aneurysm = Aneurysm(scaling.GetOutput(), aneurysm_type="saccular", label=args.parent_id)
    methods = {
        "neckDiameterCm": "GetNeckDiameter", "maximumHeightCm": "GetMaximumNormalHeight",
        "maximumDiameterCm": "GetMaximumDiameter", "surfaceAreaCm2": "GetAneurysmSurfaceArea",
        "volumeCm3": "GetAneurysmVolume", "ostiumAreaCm2": "GetOstiumArea",
        "aspectRatio": "GetAspectRatio", "bottleneckFactor": "GetBottleneckFactor",
    }
    metrics = {name: float(getattr(aneurysm, method)()) for name, method in methods.items()}
    if any(not math.isfinite(value) or value <= 0 for value in metrics.values()):
        parser.error("Nonfinite or nonpositive morphometry; inspect the input geometry")
    report = {"schemaVersion": 1, "source": str(args.surface.name),
        "sourceSha256": hashlib.sha256(args.surface.read_bytes()).hexdigest(),
        "tool": "vmtk4aneurysms", "toolLicense": "GPL-3.0", "units": "cm",
        "location": args.location, "parentId": args.parent_id, "metrics": metrics,
        "registrationStatus": "not-registered-to-atlas", "neckUnionStatus": "not-verified",
        "clinicalValidation": False, "flowModel": False}
    args.output.write_text(json.dumps(report, indent=2, allow_nan=False) + "\n")


if __name__ == "__main__":
    main()
