import {test,expect} from '@playwright/test';

test('illustrative veins are discoverable, explicitly labeled and shared between 3D and venous 2D without camera jumps',async({page})=>{
  const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto('/#/tools/neuro3d');
  const stage=page.getByTestId('detailed-atlas-canvas');
  const canvas=stage.locator('canvas');
  await expect(canvas).toHaveAttribute('data-detailed-atlas-rendered','true',{timeout:45000});
  await expect(page.getByLabel('Trajetos ilustrativos adicionais (301)')).not.toBeChecked();
  await expect(stage).toHaveAttribute('data-illustrative-visible','');
  const pose=await canvas.getAttribute('data-atlas-camera-pose');
  await page.getByRole('button',{name:'Estruturas',exact:true}).click();
  await page.getByLabel('Buscar no atlas detalhado').fill('Veia cerebral magna');
  await page.locator('.nda-list button').click();
  await expect(canvas).toHaveAttribute('data-atlas-camera-pose',pose!);
  await expect(page.getByTestId('illustrative-selection')).toContainText('TRAJETO ILUSTRATIVO');
  await expect(stage).toHaveAttribute('data-illustrative-visible','great_cerebral_vein');
  await page.getByRole('button',{name:'Isolar árvore didática',exact:true}).click();
  await expect(page.getByLabel('Estruturas selecionáveis')).toHaveValue('venous');
  await page.getByRole('button',{name:'Focar seleção',exact:true}).click();
  await page.screenshot({path:`test-results/illustrative-deep-veins-${test.info().project.name}.png`,fullPage:true});
  await page.getByRole('button',{name:'Angiografia',exact:true}).click();
  await page.getByRole('button',{name:'Focar seleção',exact:true}).click();
  await expect(page.locator('.nda-angiography')).toHaveAttribute('aria-busy','false',{timeout:30000});
  const detector=page.getByTestId('atlas-angiography');
  await expect(detector).toHaveAttribute('data-selected-structure','great_cerebral_vein');
  const gold=await detector.evaluate((element:HTMLCanvasElement)=>{
    const data=element.getContext('2d')!.getImageData(0,0,element.width,element.height).data;
    let count=0;for(let i=0;i<data.length;i+=4)if(data[i]>data[i+2]+20 && data[i+1]>data[i+2]+10) count++;return count;
  });expect(gold).toBeGreaterThan(0);
  await page.getByRole('button',{name:'Camadas',exact:true}).click();
  await expect(page.getByLabel('Camada vascular na angiografia')).toHaveValue('venous');
  await page.getByRole('button',{name:'Ocultar camada · Veias e seios',exact:true}).click();
  await expect(stage).toHaveAttribute('data-illustrative-visible','');
  expect(errors).toEqual([]);
});

test('variants remain optional and manual hiding overrides illustrative visibility',async({page})=>{
  await page.goto('/#/tools/neuro3d');
  const stage=page.getByTestId('detailed-atlas-canvas');
  await expect(stage.locator('canvas')).toHaveAttribute('data-detailed-atlas-rendered','true',{timeout:45000});
  await page.getByLabel('Trajetos ilustrativos adicionais (301)').check();
  await expect(stage).not.toHaveAttribute('data-illustrative-visible',/persistent_trigeminal/);
  await page.getByLabel('Incluir variantes ilustrativas').check();
  await expect(stage).toHaveAttribute('data-illustrative-visible',/persistent_trigeminal_artery_l/);
  await page.getByRole('button',{name:'Estruturas',exact:true}).click();
  await page.getByLabel('Buscar no atlas detalhado').fill('Artéria trigeminal persistente');
  await page.locator('.nda-list button').filter({hasText:'esquerda'}).click();
  await expect(page.getByTestId('detailed-structure')).toContainText('Variante opcional');
  await page.getByRole('button',{name:'Ocultar estrutura',exact:true}).click();
  await expect(stage).not.toHaveAttribute('data-illustrative-visible',/persistent_trigeminal_artery_l/);
  await expect(stage).toHaveAttribute('data-illustrative-visible',/persistent_trigeminal_artery_r/);
  await page.getByRole('button',{name:'Restaurar visão',exact:true}).click();
  await expect(page.getByLabel('Trajetos ilustrativos adicionais (301)')).not.toBeChecked();
  await expect(page.getByLabel('Incluir variantes ilustrativas')).not.toBeChecked();
  await expect(stage).toHaveAttribute('data-illustrative-visible','');
});
