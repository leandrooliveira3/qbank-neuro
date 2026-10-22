import {test,expect} from '@playwright/test';
test('bone-rim evidence remains source-bound through native cuts, focused field, export and 3D without certifying a foramen',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/#/tools/neuro3d');await page.getByRole('button',{name:'Forames',exact:true}).click();
 await page.locator('[data-passage="rotundum"]').getByRole('button',{name:'Inspecionar cortes e separações',exact:true}).click();
 for(const side of ['l','r']){
  await page.getByLabel('Lado dos forames',{exact:true}).selectOption(side);
  const inspector=page.getByTestId('passage-inspector'),svg=page.getByTestId('passage-section');await expect(svg).toHaveAttribute('data-busy','false',{timeout:45000});
  await inspector.getByText('Evidência óssea dirigida de V2',{exact:true}).click();
  for(const offset of ['2.9','3.0']){
   await inspector.locator(`[data-skull-witness="v2-rim-${side}-${offset}"]`).click();await expect(svg).toHaveAttribute('data-busy','false');await expect(svg.getByTestId('bone-evidence-contour')).toBeVisible();
   await expect(svg).toHaveAttribute('viewBox','-0.5 -0.5 1 1');await expect(inspector.getByTestId('skull-witness-status')).toContainText('não centro do forame');
   const event=page.waitForEvent('download');await inspector.getByRole('button',{name:'Exportar evidência da via',exact:true}).click();const download=await event,stream=await download.createReadStream(),chunks:Buffer[]=[];for await(const chunk of stream!)chunks.push(chunk);const data=JSON.parse(Buffer.concat(chunks).toString());
   expect(data.reviewWitness.id).toBe(`v2-rim-${side}-${offset}`);expect(data.reviewWitness.strictSectionEnclosure).toBe(true);expect(data.reviewWitness.namedForamenVerified).toBe(false);expect(data.reviewWitness.full3DTunnelVerified).toBe(false);expect(data.fieldSpanCm).toBe(1);
   expect(data.sourceLineageAudit.vascularNodes).toHaveLength(6);expect(data.sourceLineageAudit.foramenLabels.every((r:{listedAsSkipped:boolean;hasGLBNode:boolean})=>r.listedAsSkipped&&!r.hasGLBNode)).toBe(true);
   await inspector.getByRole('button',{name:'Ampliar inspeção física',exact:true}).click();await svg.screenshot({path:`test-results/bone-rim-${side}-${offset}-${test.info().project.name}.png`});
   await inspector.getByRole('button',{name:'Reduzir inspeção física',exact:true}).click();await inspector.getByRole('button',{name:'Mostrar plano no atlas 3D',exact:true}).click();
   await expect(page.getByTestId('inspection-plane-context')).toContainText('Ponto branco: borda óssea em revisão');
   const canvas=page.locator('.nda-canvas canvas');await expect(canvas).toHaveAttribute('data-passage-plane',new RegExp(`v2-rim-${side}-${offset}`));
   const pose=JSON.parse((await canvas.getAttribute('data-passage-plane'))!);expect(pose.position).toEqual(data.reviewWitness.pointCm);expect(pose.reviewWitness.sourceTriangle).toBe(data.reviewWitness.sourceTriangle);
   const camera=(await canvas.getAttribute('data-atlas-camera-pose'))!.split(',').map(Number);for(let k=0;k<3;k++)expect(camera[k+3]).toBeCloseTo(data.reviewWitness.pointCm[k],4);
   if(offset==='3.0'&&side==='r')await page.locator('.nda-stage').screenshot({path:`test-results/bone-witness-3d-${test.info().project.name}.png`});
   await page.getByRole('button',{name:'Ocultar plano de inspeção',exact:true}).click();
  }
 }
 await page.getByLabel('Lado dos forames',{exact:true}).selectOption('l');
 for(const id of ['vidian','meningolacrimal']){
  await page.locator(`[data-passage="${id}"]`).getByRole('button',{name:'Inspecionar cortes e separações',exact:true}).click();
  await expect(page.getByTestId('passage-section')).toHaveAttribute('data-busy','false',{timeout:45000});
  await page.getByTestId('passage-components').getByText('Componentes da via e comprovação de origem',{exact:true}).click();
  await expect(page.getByTestId('passage-components')).toContainText(id==='vidian'?'vidiana ICA e vidiana IMAX':'três controles escritos');
 }
 expect(errors).toEqual([]);
});
test('venous term reconciliation preserves lateralized gaps and exports rejected homonyms without creating identities',async({page})=>{
 await page.goto('/#/tools/neuro3d');await page.getByRole('button',{name:'Neuroangio',exact:true}).click();
 const review=page.getByTestId('venous-directed-review');await review.getByText('Revisão venosa · tributárias, trajetos e alternativas',{exact:true}).click();
 await review.getByLabel('Lado da revisão venosa',{exact:true}).selectOption('r');await expect(review.locator('[data-venous-missing="posterior_caudate_veins_r"]')).toBeVisible();
 const terms=review.getByTestId('venous-terms');await terms.getByText('Termos reconciliados · correspondência ainda pendente',{exact:true}).click();await expect(terms.locator('article')).toHaveCount(7);
 await expect(terms).toContainText('membro superior');await expect(terms).toContainText('arterial e extracraniano');
 const event=page.waitForEvent('download');await page.getByRole('button',{name:'Exportar auditoria Neuroangio',exact:true}).click();const download=await event,stream=await download.createReadStream(),chunks:Buffer[]=[];for await(const chunk of stream!)chunks.push(chunk);const data=JSON.parse(Buffer.concat(chunks).toString());
 expect(data.venousTermReconciliation).toHaveLength(7);expect(data.venousTermReconciliation.every((r:{confirmedAtlasId:null;geometryCreated:boolean})=>r.confirmedAtlasId===null&&!r.geometryCreated)).toBe(true);
 expect(data.counts.missingIndividualIds).toBe(20);expect(data.counts.referenceMissingIndividualIds).toBe(373);expect(data.atlasComplete).toBe(false);
});
