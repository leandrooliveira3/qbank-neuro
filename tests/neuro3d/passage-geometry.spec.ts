import {test,expect} from '@playwright/test';
test('four routes retain both sides, verified original cuts, physical units and unresolved lumen in the exported evidence',async({page})=>{
  const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto('/#/tools/neuro3d');await page.getByRole('button',{name:'Forames',exact:true}).click();
  for(const id of ['rotundum','ovale','vidian','meningolacrimal']){
    const row=page.locator(`article[data-passage="${id}"]`);await row.getByRole('button',{name:'Inspecionar cortes e separações',exact:true}).click();
    for(const side of ['l','r']){
      await page.getByLabel('Lado dos forames',{exact:true}).selectOption(side);
      const inspector=page.getByTestId('passage-inspector');await expect(inspector).toHaveAttribute('data-route',`${id}:${side}`);
      const svg=inspector.getByTestId('passage-section');await expect(svg).toHaveAttribute('data-busy','false',{timeout:45000});
      await expect(svg.locator('[data-surface-id="sphenoid_bone"]')).toHaveAttribute('data-origin','imported');
      expect(Number(await svg.locator('[data-surface-id="sphenoid_bone"]').getAttribute('data-segments'))).toBeGreaterThan(0);
      await inspector.getByLabel('Plano de inspeção',{exact:true}).selectOption('x');await expect(svg).toHaveAttribute('data-axis','x');await expect(svg).toHaveAttribute('data-busy','false');
      await inspector.getByLabel('Plano de inspeção',{exact:true}).selectOption('z');await expect(svg).toHaveAttribute('data-busy','false');
      if(id==='vidian'){
        await inspector.getByLabel('Elo bibliográfico da inspeção',{exact:true}).selectOption('1');await expect(inspector.getByTestId('passage-distance')).toContainText('4.578 mm');
        const download=page.waitForEvent('download');await inspector.getByRole('button',{name:'Exportar evidência da via',exact:true}).click();const file=await download;
        const stream=await file.createReadStream(),chunks:Buffer[]=[];for await(const chunk of stream!)chunks.push(chunk);const data=JSON.parse(Buffer.concat(chunks).toString());
        expect(data.route.side).toBe(side);expect(data.route.links[1].continuousLumenVerified).toBe(false);expect(data.route.links[1].globalSeparationProven).toBe(true);
        expect(data.foramenPositionVerified).toBe(false);expect(data.anastomosisLumenVerified).toBe(false);expect(data.sourceFiles).toHaveLength(3);
        expect(data.route.surfaces.every((s:{sha256:string})=>/^[a-f0-9]{64}$/.test(s.sha256))).toBe(true);
        expect(data.plane.axis).toBe('z');expect(data.sectionCounts.some((s:{segments:number})=>s.segments>0)).toBe(true);
      }
      if(side==='r'){
        await inspector.getByRole('button',{name:'Ampliar inspeção física',exact:true}).click();
        await svg.scrollIntoViewIfNeeded();await svg.screenshot({path:`test-results/passage-${id}-${test.info().project.name}.png`});
        await inspector.getByRole('button',{name:'Reduzir inspeção física',exact:true}).click();
        await inspector.getByRole('button',{name:'Mostrar plano no atlas 3D',exact:true}).click();
        await expect(page.getByTestId('inspection-plane-context')).toContainText(`${id} · direita`);
        const canvas=page.locator('.nda-canvas canvas');await expect(canvas).toHaveAttribute('data-passage-plane',/"axis":"z"/);
        const pose=JSON.parse((await canvas.getAttribute('data-passage-plane'))!);expect(pose.position[2]).toBe(Number(await svg.getAttribute('data-offset-cm')));
        if(id==='rotundum')await page.locator('.nda-stage').screenshot({path:`test-results/passage-plane-3d-${test.info().project.name}.png`});
        await page.getByRole('button',{name:'Ocultar plano de inspeção',exact:true}).click();await expect(page.getByTestId('inspection-plane-context')).toHaveCount(0);
      }
    }
    await page.getByLabel('Lado dos forames',{exact:true}).selectOption('l');
  }
  expect(errors).toEqual([]);
});
test('source integrity errors recover, and venous review reveals an exact lateralized vein with original gaps preserved',async({page})=>{
  await page.goto('/#/tools/neuro3d');await expect(page.locator('.nda-canvas canvas')).toHaveAttribute('data-detailed-atlas-rendered','true',{timeout:45000});
  await page.getByRole('button',{name:'Forames',exact:true}).click();
  await page.route('**/landmarks_bone.glb',route=>route.fulfill({status:200,body:'corrupt'}));
  await page.locator('[data-passage="rotundum"]').getByRole('button',{name:'Inspecionar cortes e separações',exact:true}).click();
  await expect(page.getByTestId('passage-inspector').getByRole('alert')).toContainText('Integridade');
  await expect(page.getByRole('button',{name:'Exportar evidência da via',exact:true})).toBeDisabled();
  await page.unroute('**/landmarks_bone.glb');await page.getByRole('button',{name:'Tentar abrir cortes novamente',exact:true}).click();
  await expect(page.getByTestId('passage-section')).toHaveAttribute('data-busy','false',{timeout:45000});
  await page.getByRole('button',{name:'Neuroangio',exact:true}).click();
  const review=page.getByTestId('venous-directed-review');await review.getByText('Revisão venosa · tributárias, trajetos e alternativas',{exact:true}).click();
  await review.getByLabel('Lado da revisão venosa',{exact:true}).selectOption('r');
  await expect(review.locator('[data-venous-missing="posterior_caudate_veins_r"]')).toBeVisible();
  await review.locator('button[data-venous-id="direct_lateral_vein_r"]').click();
  await expect(page.getByTestId('atlas-selection')).toHaveAttribute('data-selected-id','direct_lateral_vein_r');
  await expect(page.getByTestId('detailed-atlas-canvas')).toHaveAttribute('data-illustrative-visible','direct_lateral_vein_r');
});
