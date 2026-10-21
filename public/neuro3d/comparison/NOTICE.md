# Independent vascular references

BRAVE-NET: Hilbert, Adam; Madai, Vince I.; Akay, Ela M.; Aydin, Orhun U.;
Behland, Jonas; Sobesky, Jan; Galinovic, Ivana; Khalil, Ahmed A.; Taha, Abdel A.;
Wuerfel, Jens; Dusek, Petr; Niendorf, Thoralf; Fiebach, Jochen B.; Frey, Dietmar;
Livne, Michelle. Ground truth labels for BRAVE-NET (2020).
https://doi.org/10.5281/zenodo.3968844
The dataset record declares MIT (metadata retrieved 21 October 2026).
Selected manual label: GroundTruth/pat_1/001_Vessel-Manual-Gold-int.nii.gz.
This is a label-derived surface; no original MRA intensity volume is bundled.

MIT License

Copyright: the BRAVE-NET dataset contributors named above (2020).
Attribution follows the dataset record; no additional copyright holder is inferred.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

VENAT: Huck et al. High resolution atlas of the venous brain vasculature from
7 T quantitative susceptibility maps, Brain Structure and Function (2019).
https://doi.org/10.1007/s00429-019-01919-4
Data: https://figshare.com/articles/dataset/VENAT_Probability_map_nii_gz/7205960
File: VENAT_PartialVolume.nii.gz, MD5 2fcfec7e50e1d7c3f6f5e3e5be4e9d53.
CC BY 4.0: https://creativecommons.org/licenses/by/4.0/
The license was recorded in the prior source audit. The downloaded original
was verified against that audit's SHA256 in this stage. The API metadata
could not be retrieved again in this stage due to TLS/access failures.

Modifications by Qbank-Neuro (21 October 2026): full-resolution marching cubes;
threshold BRAVE 0.5 and VENAT 0.1/0.2; physical NIfTI affine applied; separate
quadric simplification of every connected component, no component pruning;
RAS-mm float32 positions and uint32 triangles in a gzip/base64 JSON envelope.
Original and derived hashes, affines, counts and tool versions are stored in
features/neuro3d/comparison/manifest.json. These derived files retain their
respective source licenses. No atlas registration or anatomical approval is
implied. Fine branches, calibres and topology may be altered by simplification.
