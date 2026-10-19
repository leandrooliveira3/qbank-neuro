import { test, expect } from '@playwright/test';

test('selection preserves camera, hidden context stays hidden, and navigation is explicit', async ({page}) => {
  await page.goto('/#/tools/neuro3d');
  const canvas = page.getByTestId('detailed-atlas-canvas').locator('canvas');
  await expect(canvas).toHaveAttribute('data-detailed-atlas-rendered', 'true', {timeout:45000});
  const pose = await canvas.getAttribute('data-atlas-camera-pose');
  await page.getByRole('button', {name:'Esfenoide',exact:true}).click();
  await expect(canvas).toHaveAttribute('data-atlas-camera-pose', pose!);
  await page.getByRole('button', {name:'Ocultar camada · Crânio e coluna cervical',exact:true}).click();
  await expect(page.getByLabel('Opacidade · Crânio e coluna cervical',{exact:true})).toHaveValue('0');
  await expect(page.getByTestId('atlas-selection')).toContainText('Estrutura oculta');
  await page.getByRole('button', {name:'Estruturas',exact:true}).click();
  await page.getByLabel('Buscar no atlas detalhado').fill('72');
  await expect(page.locator('.nda-list button')).toHaveCount(6);
  await page.locator('.nda-list button').first().click();
  await expect(canvas).toHaveAttribute('data-atlas-camera-pose', pose!);
  await page.getByRole('button', {name:'Focar seleção',exact:true}).click();
  await expect(canvas).not.toHaveAttribute('data-atlas-camera-pose', pose!);
  await page.getByRole('button', {name:'Ocultar estrutura',exact:true}).click();
  await expect(page.getByTestId('atlas-selection')).toHaveCount(0);
  await expect(page.getByRole('button', {name:'Reexibir ocultas (1)',exact:true})).toBeVisible();
  await page.getByRole('button', {name:'Girar',exact:true}).click();
  await expect(page.getByRole('button', {name:'Girar',exact:true})).toHaveAttribute('aria-pressed','true');
  await page.getByRole('button', {name:'Restaurar visão',exact:true}).click();
  await expect(page.getByRole('button', {name:'Selecionar',exact:true})).toHaveAttribute('aria-pressed','true');
  await expect(page.getByRole('button', {name:'Reexibir ocultas (1)',exact:true})).toHaveCount(0);
});

test('angiographic 2D pose and field are retained in the orthographic 3D view', async ({page}) => {
  await page.goto('/#/tools/neuro3d');
  await expect(page.locator('canvas')).toHaveAttribute('data-detailed-atlas-rendered','true',{timeout:45000});
  await page.getByRole('button',{name:'Angiografia',exact:true}).click();
  await page.getByLabel('Rotação angiográfica').fill('65');
  await page.getByLabel('Angulação angiográfica').fill('25');
  await page.getByLabel('Ampliação angiográfica').fill('1.7');
  const detector = page.getByTestId('atlas-angiography');
  const center = await detector.getAttribute('data-field-center');
  await page.getByRole('button',{name:'Angiografia 3D',exact:true}).click();
  const canvas = page.getByTestId('detailed-atlas-canvas').locator('canvas');
  await expect(canvas).toHaveAttribute('data-angiography3d-rendered','true',{timeout:45000});
  await page.getByRole('button',{name:'Angiografia',exact:true}).click();
  await expect(detector).toHaveAttribute('data-field-center',center!);
  await expect.poll(async()=>Number(await detector.getAttribute('data-yaw'))).toBeCloseTo(65,4);
  await expect.poll(async()=>Number(await detector.getAttribute('data-pitch'))).toBeCloseTo(25,4);
  await expect.poll(async()=>Number(await detector.getAttribute('data-zoom'))).toBeCloseTo(1.7,4);
});
