# Skull, sellar and dural landmarks

The atlas now contains 544 imported structures and 18 explicitly illustrative arterial reconstructions (562 selectable entries). The original skeletal filter only recognized selected manifest paths and missed cranial bones labeled `Axial skeleton`. The pituitary was in the endocrine source, outside the original import. Cavernous/intercavernous sinuses, optic nerves/chiasm and hypothalamus were already present.

## Added source meshes

- 26 bones: frontal, occipital, sphenoid, ethmoid, vomer, bilateral parietal/temporal/zygomatic/nasal/lacrimal/palatine/inferior nasal concha, bilateral malleus/incus/stapes, and hyoid.
- Adenohypophysis and neurohypophysis, assigned a separate endocrine layer.
- Falx cerebri and bilateral tentorium cerebelli, assigned a dural layer.

The three supplemental GLBs retain original Draco geometry and node transforms from the same pinned Anatria3D source as the existing atlas. No structure is independently centered, fitted or registered. `landmarks.json` records source, coordinate frame and SHA-256 hashes. `import_landmarks.py` reproduces the extraction and rejects missing expected IDs. Asset licenses and adaptations are recorded in the public NOTICE: BodyParts3D / DBCLS → Z-Anatomy → Anatria3D; CC BY-SA 4.0.

The projection package retains the same frame in cm and reduces each new surface to at most 4000 faces, with integrity checks. The 3D GLBs preserve full source resolution. Only bone contributes to radiographic bone attenuation; pituitary and dura can receive a gold **identification overlay**, never iodine or osseous attenuation. Skeletal air-space meshes were deliberately excluded from the bone layer. Existing nerve/brain structures without a projection mesh retain their selected name but have no 2D outline.

## Selection and exploration

Selection is owned by the shared atlas page, so switching between Detailed Anatomy and Atlas preserves the selected ID. Representation changes, empty clicks and view restoration do not clear selection. An explicit Clear selection action does. Selected source and reconstructed meshes stay visible with their layer opacity at zero, receive a gold highlight, and remain identified in a persistent accessible status bar. Orbit gestures do not trigger selection. Clipping planes still apply to selected meshes.

The sellar/cavernous presentation and quick landmarks expose pituitary lobes, cavernous sinuses, sphenoid, temporal bone, chiasm, falx and tentorium. Portuguese aliases supplement source English/Latin search labels. The angiographic canvas raycasts the original-frame projection geometry, prioritizing visible contrasted vessels before optional bone. Its gold outline is separate from detector signal; it is an educational annotation.

## Remaining review

Imported labels and spatial relationships need specialist review. Source presence does not establish clinical accuracy. The sphenoid includes source sellar/clinoid geometry, but individual foramina, dural rings, cavernous-sinus compartments, pituitary stalk, skull-base ligaments and all perforating/meningeal arteries are not asserted as separate validated meshes. The arterial inventory derived from https://neuroangio.org/anatomy-and-variants/ continues to expose partial and missing branches. No new patient dataset, model inference, clinical registration or validated Mentice-equivalent simulation is claimed.

The earlier repository audit remains in `neuro3d-angiography-repository-audit.json`: IntrA, Vessel-Diffusion, carotid-segmentation, threeBrain, angio3d and CIS-UNet, plus the MRI segmentation topic index. This update imports source atlas anatomy; it does not claim that those research models were trained or executed.
