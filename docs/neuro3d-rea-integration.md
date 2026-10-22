# REA and comparative application review

REA is integrated as pinned, isolated development tooling in `tools/rea`, not as an anatomical model or a simulation engine. This review prioritizes tools that address concrete gaps: registered radiology volumes, reliable vessel centerlines, and flexible instrument mechanics. It does not claim to have read every relevant application on the internet or every line of these repositories.

## Analysis actually executed

`rea-agents@6.5.0` was installed with lifecycle scripts disabled, and `rea --version` returned 6.5.0. The upstream MIT license and complete analysis skill were reviewed. A static `inspect-artifact` run on the user-supplied Smart Device decompiler ZIP completed successfully. The compact evidence receipt is `neuro3d-rea-evidence.json`; the source ZIP, extracted files and full report are not redistributed.

The archive inventory records 13,127 artifact nodes, 13,221 occurrences and 13,220 edges. These are archive graph counts, not anatomical structures or application functions. The provider explicitly limits its authority to static artifact inspection. It did not execute the app, infer catheter physics, recover Flutter native semantics, or validate its medical content. No code or assets from that app were copied into QBank.

## Primary-source comparison

README blob hashes and exact URLs are recorded in `neuro3d-rea-source-ledger.json`. Unless stated otherwise, this is documentation/source triage, not an installed or benchmarked integration.

| Project | Reviewed evidence and practical use | Current boundary |
|---|---|---|
| [REA](https://github.com/morluto/rea) | Full upstream analysis skill, README, package, artifact/JavaScript guides; actual archive inventory and local compiled-app analysis workflow | Development tooling installed and wrapper committed; does not generate anatomy |
| [vtk.js](https://github.com/Kitware/vtk-js) | README and `Sources/Rendering/Core/VolumeMapper/index.js`; volume mapper exposes composite, MIP and Radon modes | Candidate for real 3DRA/CTA volume rendering; current angiography 3D uses source meshes, not acquired voxels. README identifies BSD-3-Clause |
| [VolView](https://github.com/Kitware/VolView) | README: browser-local DICOM loading, 2D slices and cinematic volume rendering | Reference for an eventual volume workspace; not embedded or runtime-tested |
| [Cornerstone3D](https://github.com/cornerstonejs/cornerstone3D) | README: image/volume loaders, DICOMweb, GPU rendering and OHIF integration | Candidate image-loading/MPR layer; MIT stated in README; not connected to simulation |
| [OHIF](https://github.com/OHIF/Viewers) | README: viewer architecture, modes/extensions and Cornerstone integration | Candidate radiology workspace; MIT stated in README; no PACS or patient data connection |
| [Slicer](https://github.com/Slicer/Slicer) | README and complete `License.txt`, a BSD-style Slicer agreement with specific redistribution terms | Offline segmentation/registration reference; not a browser dependency |
| [Slicer VMTK](https://github.com/vmtk/SlicerExtension-VMTK) | README and complete `Docs/ExtractCenterline.md`: endpoint-directed Voronoi centerlines, mesh quality checks and unreachable-endpoint limits | Priority next experiment against present voxel skeletons; not installed or executed here |
| [SOFA BeamAdapter](https://github.com/sofa-framework/BeamAdapter) | README: Kirchhoff rod FEM, concentric flexible instruments and deployment | Priority physics prototype; native SOFA dependency, no imported mechanics or commercial calibration |
| [SimVascular](https://github.com/SimVascular/SimVascular) | README: image-to-vessel geometry and numerical blood-flow simulation | Possible offline CFD pipeline; license file not resolved in this pass; no code reuse or solver execution |
| [OABrowser](https://github.com/mhalle/oabrowser) | README: atlas data-directory viewer, associated SPL brain atlas | Reference for coordinated atlas data and viewer; not imported; atlas and software licenses need separate review |
| [Mentice](https://www.mentice.com/neurovascular) / [VIST](https://www.mentice.com/vist-virtual-patient) | Public vendor pages describing neurovascular simulation and virtual-patient workflows | Product/workflow reference only; no access to internal code, algorithms or commercial assets |
| [ANGIO Mentor](https://surgicalscience.com/simulators/angio-mentor/) | Public module listing and [transradial cerebral module](https://surgicalscience.com/simulators/angio-mentor/transradial-cerebral-module/) | Reference for radial cerebral training workflow, not an implemented haptic equivalent |

The prior user-requested repositories remain tracked in `neuro3d-angiography-repository-audit.json` and `neuro3d-alternative-anatomy-audit.json`: IntrA, Vessel-Diffusion, carotid-segmentation, threeBrain, angio3d, CIS-UNet and MRI-segmentation topic discovery. The topic page is an index, not a reusable model. Their earlier audit status has not been promoted to installed/executed merely because REA is now available.

## Next implementation experiments

1. Benchmark VMTK centerlines on the same source vessels and report lumen containment, branch coverage and coordinate agreement before replacing routes.
2. Add a de-identified open CTA/3DRA volume with explicit spacing/orientation and shared registration to the mesh atlas, using a vetted volume renderer. Keep source meshes distinct from acquired volumes.
3. Prototype BeamAdapter in an isolated native service; compare bending, wall contact, friction and device constraints before claiming physical realism.
4. Extend validated navigable branches, starting with right intracranial and vertebrobasilar access, and audit against the Neuroangio anatomy list. Present mesh presence separately from navigability and expert validation.

## Limite observado do analisador JavaScript neste ambiente

O wrapper foi executado sobre uma cópia isolada do bundle compilado `atlasProjection.worker-D3zCFYWO.js` (4.647 bytes). A análise semântica não pôde iniciar: o provedor `process-ownership` retornou `capability_unavailable`, pois o comando procps `ps -axo pid=,ppid=,pgid=,uid=,stat=,command=` falhou com `fatal library error, lookup self`. Nenhuma tentativa foi feita de contornar a inspeção de processos do REA. Isso não deve ser apresentado como análise semântica concluída.

Como operação estática independente, `inspect-artifact` no arquivo compilado concluiu o inventário: formato `javascript-bundle`, um nó, uma ocorrência, sem filhos. O recibo está em `neuro3d-rea-worker-evidence.json`; essa classificação não prova semântica, correção da imagem ou comportamento médico. A validação funcional vem dos testes do projeto e do navegador.
