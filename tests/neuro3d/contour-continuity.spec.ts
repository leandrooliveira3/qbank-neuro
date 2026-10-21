import {test,expect} from '@playwright/test';
test('continuity levels keep physical plane, source diagnostics and motor-root limits through export',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/#/tools/neuro3d');await page.getByRole('button',{name:'Forames',exact:true}).click();
 await page.locator('[data-passage="rotundum"]').getByRole('button',{name:'Inspecionar cortes e separações',exact:true}).click();
 for(const side of ['l','r']){
  await page.getByLabel('Lado dos forames',{exact:true}).selectOption(side);
  const inspector=page.getByTestId('passage-inspector'),svg=page.getByTestId('passage-section');await expect(svg).toHaveAttribute('data-busy','false',{timeout:45000});
  const review=inspector.getByTestId('contour-continuity');await review.getByText('Hierarquia e continuidade amostrada de V2',{exact:true}).click();
  await expect(review.locator('[data-continuity-level]')).toHaveCount(21);await expect(review).toContainText('após conferir costuras: 32');
  for(const z of ['2.8','3.16']){
   await review.locator(`[data-continuity-level="${z}"]`).click();await expect(svg).toHaveAttribute('data-busy','false');await expect(svg).toHaveAttribute('data-offset-cm',z);await expect(svg).toHaveAttribute('data-axis','z');
   await inspector.getByRole('button',{name:'Ampliar inspeção física',exact:true}).click();await svg.scrollIntoViewIfNeeded();await svg.screenshot({path:`test-results/continuity-${side}-${z}-${test.info().project.name}.png`});await inspector.getByRole('button',{name:'Reduzir inspeção física',exact:true}).click();
   await inspector.getByRole('button',{name:'Mostrar plano no atlas 3D',exact:true}).click();
   const canvas=page.locator('.nda-canvas canvas');await expect(canvas).toHaveAttribute('data-passage-plane',/rotundum/);
   const plane=JSON.parse((await canvas.getAttribute('data-passage-plane'))!);expect(plane.position[2]).toBe(Number(z));
   await page.getByRole('button',{name:'Ocultar plano de inspeção',exact:true}).click();
  }
  const event=page.waitForEvent('download');await inspector.getByRole('button',{name:'Exportar evidência da via',exact:true}).click();const stream=await(await event).createReadStream(),chunks:Buffer[]=[];for await(const c of stream!)chunks.push(c);const data=JSON.parse(Buffer.concat(chunks).toString());
  expect(data.continuityReview.v2).toHaveLength(1);expect(data.continuityReview.v2[0].side).toBe(side);expect(data.continuityReview.v2[0].sections).toHaveLength(21);expect(data.continuityReview.namedForamenVerified).toBe(false);expect(data.foramenPositionVerified).toBe(false);
 }
 await page.locator('[data-passage="ovale"]').getByRole('button',{name:'Inspecionar cortes e separações',exact:true}).click();
 for(const side of ['l','r']){
  await page.getByLabel('Lado dos forames',{exact:true}).selectOption(side);await expect(page.getByTestId('passage-section')).toHaveAttribute('data-busy','false',{timeout:45000});
  const context=page.getByTestId('motor-root-context');await context.getByText('Raiz motora original · limite do contexto do oval',{exact:true}).click();await expect(context).toContainText(`motor_root_of_trigeminal_nerve_${side}`);await expect(context).toContainText('não representa o percurso completo');
  await context.screenshot({path:`test-results/motor-root-${side}-${test.info().project.name}.png`});await context.getByRole('button',{name:'Selecionar raiz motora de origem',exact:true}).click();
  await expect(page.getByTestId('atlas-selection')).toHaveAttribute('data-selected-id',`motor_root_of_trigeminal_nerve_${side}`);
  if(side==='l'){await page.getByRole('button',{name:'Forames',exact:true}).click();await page.locator('[data-passage="ovale"]').getByRole('button',{name:'Inspecionar cortes e separações',exact:true}).click();}
 }
 expect(errors).toEqual([]);
});
