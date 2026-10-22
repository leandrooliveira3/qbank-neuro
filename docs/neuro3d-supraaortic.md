# Supra-aortic and lower cervical source anatomy

At the supra-aortic checkpoint, the atlas had 558 imported structures plus 18 explicitly unvalidated illustrative arterial reconstructions (576 selectable entries). The subsequent body-access update brings this to 584; see `neuro3d-access-and-3d-update.md`. This update adds 14 original arterial meshes previously excluded by the head/neck spatial filter:

| Source IDs | Meshes |
| --- | ---: |
| `aortic_arch`, `brachiocephalic_trunk` | 2 |
| `left_subclavian_artery`, `right_subclavian_artery` | 2 |
| `thyrocervical_trunk_l/r`, `costocervical_trunk_l/r` | 4 |
| `inferior_thyroid_artery_l/r` | 2 |
| `supreme_intercostal_artery_l/r`, `transverse_cervical_artery_l/r` | 4 |

`tools/neuro3d/import_supraaortic.py` extracts explicit manifest identities from the pinned Anatria3D cardiovascular source, using the same subset extractor as the existing atlas. Draco geometry and original node transforms are preserved in `supra_aortic.glb`; hashes, bounds, labels, upstream asset hash and source commit are recorded in `supra-aortic.json`. This is the same source frame as the existing vessels and skull, without separate centering or patient registration. Source labels remain unreviewed. BodyParts3D / DBCLS → Z-Anatomy → Anatria3D, CC BY-SA 4.0.

To reproduce projection context, decode `supra_aortic.glb` with `decode_reference_meshes.mjs`, then run `package_landmark_geometry.py DECODED_JSON supra-aortic reference-supra-aortic`. The package supports the original landmark defaults and supplemental named manifests. Projection surfaces preserve the common world frame in cm (Y minus160), with a 4000-face cap per mesh. The GLB retains original resolution.

## Exploration and detector field

“Arco e troncos supra-aórticos” focuses the source arch in 3D and selects a cervicothoracic detector field (center `[0,-18,0]` cm). The angiographic panel offers cranial, cervicothoracic and selected-structure fields. “Focar seleção” also centers the detector on the selected bounds. Rotation occurs around the requested field center through detector translation; source vertices are never moved.

`atlasProjection.ts` handles detector centering and its inverse for ray picking. Tests check point roundtrips at oblique, lateral and craniocaudal angles, multiple magnifications and a nonzero field center. Browser tests click the projected arch after changing fields, ensuring the annotation, source selection and inverse projection agree. The atlas continues to opacify all enabled vascular layers; it is not selective catheter angiography.

## Inventory corrections and limits

The Neuroangio index https://neuroangio.org/anatomy-and-variants/ repeats **105** for the supreme intercostal and inferior thyroid arteries. Original numbering is preserved, while the exact label disambiguates the identity. Six supplemental source groups expose the arch, brachiocephalic trunk, subclavians, thyrocervical trunks, costocervical trunks and transverse cervical arteries. The inventory has 130 entries; superior thyroid and other missing vessels are still marked pending rather than mapped to neighboring arteries.

Reference pages: https://neuroangio.org/anatomy-and-variants/aortic-arch/ and the main index above. No source images were copied into the app. No new AI inference was executed. Previously documented repository audits remain available.

The procedure station at this checkpoint started in the left cervical ICA. The subsequent access update adds radial/femoral/arch navigation and didactic arch deformations; see `neuro3d-access-and-3d-update.md` for their limits. These remain unvalidated numerical junctions and variants. Unit tests ensure a selective ICA injection does not opacify these upstream surfaces. Bone and sellar context from the previous update remains intact; clinical and fine-anatomy review is still required.

## Verification

- GLB node identities, SHA-256 hashes and bounds checked by asset tests.
- All 14 projection surfaces checked against source-world bounds and index ranges.
- Detector inverse checked against the source projection across angles/zoom.
- Browser flow: presentation → original GLB → compressed projection fetch/integrity/decompression → rasterization → field changes → click identification; desktop/mobile coverage.
- This feature uses static local assets and requires no new API, credentials or database changes.
