import {test,expect} from '@playwright/test';

test('revised APA tree retains its identity across 3D and 2D and the whole review exposes missing deep veins',async({page})=>{
  const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto('/#/tools/neuro3d');
  await page.getByRole('button',{name:'Estruturas',exact:true}).click();
  await page.getByLabel('Buscar no atlas detalhado').fill('47');
  await expect(page.locator('.nda-list button')).toHaveCount(2);
  await page.getByRole('button',{name:'Artéria faríngea ascendente esquerda Reconstrução didática · não validada',exact:true}).click();
  await expect(page.getByTestId('atlas-selection')).toHaveAttribute('data-selected-id','ascending_pharyngeal_artery_l');
  await page.getByRole('button',{name:'Somente vasos',exact:true}).click();
  await page.getByRole('button',{name:'Isolar árvore didática',exact:true}).click();
  await page.getByRole('button',{name:'Focar seleção',exact:true}).click();
  await expect(page.locator('canvas')).toHaveAttribute('data-detailed-atlas-rendered','true',{timeout:45000});
  await page.screenshot({path:`test-results/apa-rebuilt-tree-${test.info().project.name}.png`,fullPage:true});
  await page.getByRole('button',{name:'Angiografia',exact:true}).click();
  const detector=page.getByTestId('atlas-angiography');
  await expect(page.locator('.nda-angiography')).toHaveAttribute('aria-busy','false',{timeout:30000});
  await expect(detector).toHaveAttribute('data-selected-structure','ascending_pharyngeal_artery_l');
  const gold=await detector.evaluate((canvas:HTMLCanvasElement)=>{
    const data=canvas.getContext('2d')!.getImageData(0,0,canvas.width,canvas.height).data;
    let count=0;for(let i=0;i<data.length;i+=4)if(data[i]>data[i+2]+20&&data[i+1]>data[i+2]+10)count++;
    return count;
  });expect(gold).toBeGreaterThan(0);
  await page.getByRole('button',{name:'Vasos',exact:true}).click();
  await page.getByLabel('Escopo da revisão vascular').selectOption('venous');
  await page.getByLabel('Buscar na revisão vascular integral').fill('Galeno');
  await expect(page.locator('[data-venous-requirement="great_cerebral_vein"]')).toContainText('Malha individual ausente');
  await page.getByLabel('Escopo da revisão vascular').selectOption('maxillary');
  await page.getByLabel('Buscar na revisão vascular integral').fill('meníngea acessória');
  await expect(page.locator('[data-maxillary-branch="accessory-meningeal"]')).toContainText('Malha individual ausente');
  expect(errors).toEqual([]);
});
