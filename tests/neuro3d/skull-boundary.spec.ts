import {test,expect} from '@playwright/test';
test('localized source edges and oblique sections remain physically linked to 3D and exported lineage',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/#/tools/neuro3d');await page.getByRole('button',{name:'Forames',exact:true}).click();await page.locator('[data-passage="rotundum"]').getByRole('button',{name:'Inspecionar cortes e separações',exact:true}).click();
 for(const side of ['l','r']){
  await page.getByLabel('Lado dos forames',{exact:true}).selectOption(side);await expect(page.getByTestId('passage-section')).toHaveAttribute('data-busy','false',{timeout:45000});
  const review=page.getByTestId('skull-boundary-review');await review.getByText('Bordas localizadas e cortes oblíquos',{exact:true}).click();await expect(review).toContainText('Z31,42');
  for(const group of ['boundary-1','boundary-2']){await review.locator(`[data-boundary-id="${group}"]`).click();const canvas=page.locator('.nda-canvas canvas');await expect(canvas).toHaveAttribute('data-passage-plane',/"reviewSegmentCount":16/);await page.locator('.nda-stage').screenshot({path:`test-results/${group}-${side}-${test.info().project.name}.png`});await page.getByRole('button',{name:'Ocultar plano de inspeção',exact:true}).click();}
  for(const kind of ['transverse-local','longitudinal-local']){
   await review.getByLabel('Corte oblíquo de V2',{exact:true}).selectOption(`${kind}-${side}`);const svg=review.getByTestId('oblique-section');await expect(svg).toHaveAttribute('data-cut-id',`${kind}-${side}`);await expect(svg.locator('[data-source-id]')).toHaveCount(2);
   await review.getByRole('button',{name:'Ampliar corte oblíquo',exact:true}).click();await svg.screenshot({path:`test-results/oblique-${kind}-${side}-${test.info().project.name}.png`});await review.getByRole('button',{name:'Reduzir corte oblíquo',exact:true}).click();
   await review.getByRole('button',{name:'Mostrar corte oblíquo no atlas 3D',exact:true}).click();await expect(page.getByTestId('inspection-plane-context')).toContainText('Plano oblíquo');const canvas=page.locator('.nda-canvas canvas');await expect(canvas).toHaveAttribute('data-passage-plane',/"frame":/);const p=JSON.parse((await canvas.getAttribute('data-passage-plane'))!);expect(p.position).toEqual(p.frame.originCm);await expect.poll(async()=>{const c=(await canvas.getAttribute('data-atlas-camera-pose'))!.split(',').map(Number);return Math.hypot(...p.position.map((v:number,k:number)=>v-c[k+3]));}).toBeLessThan(.0001);await page.getByRole('button',{name:'Ocultar plano de inspeção',exact:true}).click();
  }
  const event=page.waitForEvent('download');await review.getByRole('button',{name:'Exportar bordas e cortes oblíquos',exact:true}).click();const stream=await(await event).createReadStream(),chunks:Buffer[]=[];for await(const c of stream!)chunks.push(c);const data=JSON.parse(Buffer.concat(chunks).toString());expect(data.boundaries.boundary).toHaveLength(32);expect(data.boundaries.groups.every((g:{anatomicalIdentity:null})=>g.anatomicalIdentity===null)).toBe(true);expect(data.sides.every((s:{namedForamenVerified:boolean})=>!s.namedForamenVerified)).toBe(true);
 }
 expect(errors).toEqual([]);
});
