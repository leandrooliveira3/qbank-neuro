import {build} from 'esbuild';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {pathToFileURL,fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const dir=await fs.mkdtemp(path.join(os.tmpdir(),'vascular-review-'));
try {
  const file=path.join(dir,'review.mjs');
  await build({entryPoints:[path.join(root,'features/neuro3d/vascularReview.ts')],bundle:true,platform:'node',format:'esm',outfile:file,define:{'import.meta.env.BASE_URL':'"/"'},logLevel:'silent'});
  const {vascularMeshReview,venousCoverage,vascularReviewCounts,vascularChecklist,maxillaryBranchReview}=await import(pathToFileURL(file).href);
  const report={scope:'All source arterial and venous meshes plus explicit reconstructions; no anatomical approvals inferred',counts:vascularReviewCounts,checklist:vascularChecklist,meshes:vascularMeshReview,venousRequirements:venousCoverage,maxillaryRequirements:maxillaryBranchReview};
  await fs.writeFile(path.join(root,'docs/neuro3d-whole-vascular-review.json'),JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify({counts:vascularReviewCounts,reviewedRecords:vascularMeshReview.length,venousRequired:venousCoverage.length,venousMissing:venousCoverage.filter(row=>row.status==='missing').length}));
} finally {await fs.rm(dir,{recursive:true,force:true});}
