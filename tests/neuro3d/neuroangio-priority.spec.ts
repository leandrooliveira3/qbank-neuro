import {test,expect} from '@playwright/test';
import {readFileSync} from 'node:fs';

test('Neuroangio exploration reveals an isolated original vein in 3D and full-source angiography, with recoverable integrity errors',async({page})=>{
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('/#/tools/neuro3d');
  await page.getByLabel('Opacidade · Veias e seios',{exact:true}).fill('0');
  await page.getByRole('button',{name:'Explorar índice Neuroangio',exact:true}).click();
  await page.getByLabel('Buscar vaso no índice Neuroangio').fill('straight_sinus');
  await page.getByRole('button',{name:'Revelar e isolar straight_sinus',exact:true}).click();
  await expect(page.getByTestId('atlas-selection')).toHaveAttribute('data-selected-id','straight_sinus');
  await expect(page.getByTestId('atlas-selection')).not.toContainText('Estrutura oculta');
  await expect(page.getByRole('button',{name:'Isolar seleção',exact:true})).toHaveAttribute('aria-pressed','true');
  await expect(page.locator('.nda-canvas canvas')).toHaveAttribute('data-detailed-atlas-rendered','true',{timeout:45000});
  await page.locator('.nda-stage').screenshot({path:`test-results/neuroangio-vein-3d-${test.info().project.name}.png`});
  let corrupt=true;
  await page.route('**/neuro3d/open-anatomy/cardiovascular_head.glb',async route=>{
    if(!corrupt){await route.continue();return;}
    await route.fulfill({status:200,body:Buffer.from('bad source'),contentType:'model/gltf-binary'});
  });
  await page.getByRole('button',{name:'Angiografia',exact:true}).click();
  await expect(page.getByRole('alert')).toContainText('Integridade');
  await expect(page.getByTestId('atlas-angiography')).toBeHidden();
  corrupt=false;await page.getByRole('button',{name:'Reabrir malha original',exact:true}).click();
  const detector=page.getByTestId('atlas-angiography');
  await expect(page.locator('.nda-angiography')).toHaveAttribute('aria-busy','false',{timeout:45000});
  await expect(detector).toBeVisible();await expect(detector).toHaveAttribute('data-geometry-detail','original');
  await expect(detector).toHaveAttribute('data-source-triangles','2304');
  const point=await detector.evaluate((c:HTMLCanvasElement)=>{
    const data=c.getContext('2d')!.getImageData(0,0,c.width,c.height).data;
    for(let i=0;i<data.length;i+=4)if(data[i]>data[i+2]+25&&data[i+1]>data[i+2]+10)return {x:(i/4)%c.width,y:Math.floor(i/4/c.width)};
    return null;
  });expect(point).not.toBeNull();
  const box=(await detector.boundingBox())!,scale=Math.min(box.width/600,box.height/560);
  await detector.click({position:{x:(box.width-600*scale)/2+point!.x*scale,y:(box.height-560*scale)/2+point!.y*scale}});
  await expect(page.getByTestId('atlas-selection')).toHaveAttribute('data-selected-id','straight_sinus');
  await page.locator('.nda-stage').screenshot({path:`test-results/neuroangio-vein-original-2d-${test.info().project.name}.png`});
  await page.getByLabel('Usar malha original na seleção importada isolada').uncheck();
  await expect(detector).toHaveAttribute('data-geometry-detail','simplified');
  await expect(page.locator('.nda-angiography')).toHaveAttribute('aria-busy','false');
  expect(errors).toEqual([]);
});

test('Neuroangio inventory distinguishes image references, illustrative vessels and newly exposed geometry gaps',async({page})=>{
  await page.goto('/#/tools/neuro3d');await page.getByRole('button',{name:'Explorar índice Neuroangio',exact:true}).click();
  const search=page.getByLabel('Buscar vaso no índice Neuroangio');await search.fill('Heubner');
  await expect(page.locator('[data-neuroangio-id="recurrent_artery_of_heubner"]')).toContainText('referência individual pendente');
  await page.getByRole('button',{name:'Revelar e isolar recurrent_artery_of_heubner_l',exact:true}).click();
  await expect(page.getByTestId('atlas-selection')).toHaveAttribute('data-selected-id','recurrent_artery_of_heubner_l');
  await expect(page.getByTestId('detailed-atlas-canvas')).toHaveAttribute('data-illustrative-visible','recurrent_artery_of_heubner_l');
  await page.getByRole('button',{name:'Explorar índice Neuroangio',exact:true}).click();await search.fill('Rolando');
  const gap=page.locator('[data-neuroangio-id="vein_of_rolando"]');await expect(gap).toContainText('Sem superfície identificada');
  await expect(gap.getByRole('button')).toHaveCount(0);
  const download=page.waitForEvent('download');await page.getByRole('button',{name:'Exportar auditoria Neuroangio'}).click();
  const report=JSON.parse(readFileSync((await(await download).path())!,'utf8'));
  expect(report.counts.missingIndividualIds).toBe(20);expect(report.atlasComplete).toBe(false);
  expect(report.datasetEvidence.every((d:{namedVesselCorrespondence:boolean})=>d.namedVesselCorrespondence===false)).toBe(true);
  expect(report.requirements.find((r:{id:string})=>r.id==='vein_of_rolando').ids).toEqual([]);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});

test('isolated PICA angiography uses its full source triangles rather than the general projection simplification',async({page})=>{
  await page.goto('/#/tools/neuro3d');await page.getByRole('button',{name:'Explorar índice Neuroangio',exact:true}).click();
  await page.getByLabel('Buscar vaso no índice Neuroangio').fill('posterior_inferior_cerebellar_artery');
  await page.getByRole('button',{name:'Revelar e isolar posterior_inferior_cerebellar_artery_l',exact:true}).click();
  await page.getByRole('button',{name:'Angiografia',exact:true}).click();
  const detector=page.getByTestId('atlas-angiography');
  await expect(page.locator('.nda-angiography')).toHaveAttribute('aria-busy','false',{timeout:45000});
  await expect(detector).toBeVisible();await expect(detector).toHaveAttribute('data-source-triangles','37728');
  expect(await detector.evaluate((canvas:HTMLCanvasElement)=>{
    const pixels=canvas.getContext('2d')!.getImageData(0,0,canvas.width,canvas.height).data;
    let gold=0;for(let i=0;i<pixels.length;i+=4)if(pixels[i]>pixels[i+2]+25&&pixels[i+1]>pixels[i+2]+10)gold++;return gold;
  })).toBeGreaterThan(20);
  await page.locator('.nda-stage').screenshot({path:`test-results/neuroangio-pica-original-${test.info().project.name}.png`});
});
