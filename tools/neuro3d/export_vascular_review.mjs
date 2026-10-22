import {build} from 'esbuild';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {pathToFileURL,fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const dir=await fs.mkdtemp(path.join(os.tmpdir(),'vascular-review-'));
try {
  const file=path.join(dir,'review.mjs');
  await build({stdin:{contents:`export * from ${JSON.stringify(path.join(root,'features/neuro3d/vascularReview.ts'))}; export * from ${JSON.stringify(path.join(root,'features/neuro3d/vascularCompleteness.ts'))}; export * from ${JSON.stringify(path.join(root,'features/neuro3d/vascularStudyFamilies.ts'))}; export * from ${JSON.stringify(path.join(root,'features/neuro3d/educationalVessels.ts'))};`,resolveDir:root},bundle:true,platform:'node',format:'esm',outfile:file,define:{'import.meta.env.BASE_URL':'"/"'},logLevel:'silent'});
  const {vascularMeshReview,venousCoverage,vascularReviewCounts,vascularChecklist,maxillaryBranchReview}=await import(pathToFileURL(file).href);
  const {vascularCompleteness,vascularCompletenessCounts,unmappedVascularDiagramEntries}=await import(pathToFileURL(file).href);
  const {vascularStudyRelations}=await import(pathToFileURL(file).href);
  const {educationalVessels}=await import(pathToFileURL(file).href);
  const report={illustrations:educationalVessels.map(({id,layer,parentId,bounds,reference,note,variant,coordinateBasis,proceduralEligible})=>({id,layer,parentId,bounds,reference,note,variant,coordinateBasis,proceduralEligible})),scope:'All source arterial and venous meshes plus explicit reconstructions and expandable individual requirements; no anatomical approvals or exhaustive variants inferred',counts:vascularReviewCounts,checklist:vascularChecklist,meshes:vascularMeshReview,venousRequirements:venousCoverage,maxillaryRequirements:maxillaryBranchReview,completenessCounts:vascularCompletenessCounts,completeness:vascularCompleteness,unmappedDiagramEntries:unmappedVascularDiagramEntries,studyRelations:vascularStudyRelations,studyRelationsAreNavigationGraph:false};
  await fs.writeFile(path.join(root,'docs/neuro3d-whole-vascular-review.json'),JSON.stringify(report,null,2)+'\n');
  const escape=value=>value.replace(/\|/g,'\\|').replace(/\n/g,' ');
  const lines=['# Ausências individuais e correspondências pendentes','',
    'Gerado por `node tools/neuro3d/export_vascular_review.mjs` a partir da mesma matriz do aplicativo. Não é um certificado de completude anatômica. Não altera geometrias, licenças ou o grafo de fluxo. Uma ausência individual pode estar agrupada em outra malha e exige inspeção antes de reconstrução.','',
    `${vascularCompletenessCounts.requirements} identidades/grupos; ${vascularCompletenessCounts.missing} sem malha individual; ${vascularCompletenessCounts.partial} parciais; ${vascularCompletenessCounts.presentUnverified} presentes sem homologação. ${vascularCompletenessCounts.missingIndividualIds} IDs individuais sem representação. ${vascularCompletenessCounts.illustratedIndividualIds} IDs contam somente com os novos trajetos ilustrativos; ${vascularCompletenessCounts.referenceMissingIndividualIds} IDs não têm malha importada ativa. Uma ilustração não resolve registro ou precisão anatômica.`, '',
    '| Sistema | Região/família | Vaso ou grupo | IDs sem geometria individual |','| --- | --- | --- | --- |',
    ...vascularCompleteness.filter(row=>row.missingIds.length).map(row=>`| ${row.layer === 'arterial' ? 'Arterial' : 'Venoso'} | ${escape(row.group)} | ${escape(row.name)} | ${row.missingIds.map(id=>'`'+id+'`').join(', ')} |`),
    '', '## Identidades sem malha importada ativa', '',
    'A tabela distingue presença de uma curva de estudo da recuperação de uma malha de referência. Inclui reconstruções anteriores e novas; não é uma lista de vasos clinicamente validados.', '',
    '| Sistema | Vaso ou grupo | IDs sem malha importada ativa |', '| --- | --- | --- |',
    ...vascularCompleteness.filter(row=>row.referenceMissingIds.length).map(row=>`| ${row.layer === 'arterial' ? 'Arterial' : 'Venoso'} | ${escape(row.name)} | ${row.referenceMissingIds.map(id=>'`'+id+'`').join(', ')} |`),
    '',`## Legenda sem correspondência explícita (${unmappedVascularDiagramEntries.length} entradas)`, '',
    'Estas entradas podem se sobrepor a exigências acima; não são somadas como novos vasos. Mantêm-se as divergências da legenda e os rótulos ainda sem alvo.','',
    '| Número | Estrutura | Pendência |','| --- | --- | --- |',
    ...unmappedVascularDiagramEntries.map(row=>`| ${row.number} | ${escape(row.portuguese)} | ${escape(row.note || 'Correspondência geométrica individual pendente.')} |`),''];
  await fs.writeFile(path.join(root,'docs/neuro3d-missing-vascular-identities.md'),lines.join('\n'));
  console.log(JSON.stringify({counts:vascularReviewCounts,reviewedRecords:vascularMeshReview.length,venousRequired:venousCoverage.length,venousMissing:venousCoverage.filter(row=>row.status==='missing').length,completeness:vascularCompletenessCounts}));
} finally {await fs.rm(dir,{recursive:true,force:true});}
