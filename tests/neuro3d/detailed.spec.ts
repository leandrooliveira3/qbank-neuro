import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';

// Read the pinned data directly; browser tests should not load Vite-only modules
// through Node's ESM loader, which requires JSON import attributes.
const readManifest = (name: string) => JSON.parse(readFileSync(new URL(`../../features/neuro3d/${name}.json`, import.meta.url), 'utf8'));
const importedStructureCount = ['open-anatomy', 'landmarks', 'supra-aortic', 'body-access', 'craniocervical', 'unindexed-vessels']
  .reduce((count, name) => count + readManifest(name).structures.length, 0);
const didacticStructureCount = 18;
const diagramEntryCount = readManifest('diagram-registry').entries.length;
test('loads open meshes, selects basilar artery, isolates and clips the same aligned anatomy', async ({page}) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/#/tools/neuro3d');
  await expect(page.getByRole('heading', {name:'Anatomia neurovascular', exact:true})).toBeVisible();
  await expect(page.locator('canvas')).toHaveAttribute('data-detailed-atlas-rendered','true',{timeout:45000});
  await page.getByRole("button", {name:"Estruturas",exact:true}).click();
  await expect(page.locator('.nda-list button')).toHaveCount(importedStructureCount + didacticStructureCount);
  await page.getByLabel('Buscar no atlas detalhado').fill('Basilar artery');
  await page.getByRole('button',{name:'Basilar artery Artérias',exact:true}).click();
  await expect(page.getByTestId('detailed-structure')).toContainText('Basilar artery');
  await page.getByLabel('Isolar estrutura selecionada').check();
  await page.getByRole("button", {name:"Camadas",exact:true}).click();
  await page.getByLabel('Plano de corte anatômico').selectOption('sagittal');
  await page.getByLabel('Posição do corte anatômico').fill('2');
  await page.getByRole('button',{name:'Restaurar visão',exact:true}).click();
  await expect(page.getByLabel('Plano de corte anatômico')).toHaveValue('none');
  await page.screenshot({path:`test-results/detailed-${test.info().project.name}.png`, fullPage:true});
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.getByRole('button',{name:'Ampliar área 3D',exact:true}).click();
  await expect(page.locator('.nda')).toHaveClass(/nda-expanded/);
  await page.keyboard.press('Escape');
  await expect(page.locator('.nda')).not.toHaveClass(/nda-expanded/);
  await page.getByRole('button',{name:'Revisão',exact:true}).click();
  await expect(page.locator('.nda-review')).toContainText('Tronco meningohipofisário');
  expect(errors).toEqual([]);
});

test('reference navigation and biplane angiograms share anatomical surfaces, with imported bone removed in synthetic DSA mode', async ({page}) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/#/tools/neuro3d');
  await page.getByRole('button',{name:'Simulação',exact:true}).click();
  await expect(page.getByLabel('Base anatômica da simulação')).toHaveValue('reference');
  const pedal = page.getByRole('button',{name:'Pedal de fluoroscopia',exact:true});
  await pedal.press('Space');
  await page.keyboard.down('Space');
  await expect(page.getByTestId('reference-bone-projection')).toHaveCount(2, {timeout:30000});
  await page.keyboard.up('Space');
  await page.getByLabel('Passo de manipulação',{exact:true}).selectOption('1.2');
  await page.getByRole('button',{name:'↑ Avançar',exact:true}).click();
  await page.getByRole('button',{name:'↑ Avançar',exact:true}).click();
  await page.getByRole('button',{name:'2 · Cateter-guia',exact:true}).click();
  await page.getByRole('button',{name:'↑ Avançar',exact:true}).click();
  await page.getByRole('button',{name:'DSA',exact:true}).click();
  await page.getByRole('button',{name:/Injetar contraste virtual/}).click();
  await expect(page.getByTestId('reference-angiogram')).toHaveCount(2, {timeout:30000});
  await expect(page.getByTestId('reference-bone-projection')).toHaveCount(0);
  await page.screenshot({path:`test-results/reference-station-${test.info().project.name}.png`,fullPage:true});
  expect(errors).toEqual([]);
});

test('surface atlas transitions to the same angiographic geometry, adds bone and inspects reconstructed arteries', async ({page}) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/#/tools/neuro3d');
  await page.getByRole('button',{name:'Atlas',exact:true}).click();
  await expect(page.getByRole('button',{name:'Atlas de superfícies e angiografia',exact:true})).toHaveAttribute('aria-pressed','true');
  await page.getByRole('button',{name:'Angiografia',exact:true}).click();
  const image = page.getByTestId('atlas-angiography');
  await expect(image).toHaveAttribute('data-projection-ready','true',{timeout:30000});
  const before = await image.evaluate((node: HTMLCanvasElement) => node.toDataURL());
  await page.getByLabel('Sobreposição óssea angiográfica').fill('0.65');
  await expect(page.locator('.nda-angiography')).toHaveAttribute('aria-busy','false');
  await expect.poll(() => image.evaluate((node: HTMLCanvasElement) => node.toDataURL())).not.toBe(before);
  await page.screenshot({path:`test-results/atlas-angiography-${test.info().project.name}.png`, fullPage:true});
  await page.getByLabel('Rotação angiográfica').fill('15');
  await page.getByLabel('Rotação angiográfica').fill('30');
  await page.getByLabel('Rotação angiográfica').fill('45');
  await expect(page.locator('.nda-projection-label')).toContainText('45°');
  await expect(page.locator('.nda-angiography')).toHaveAttribute('aria-busy', 'false', {timeout: 30000});
  await expect(image).toHaveAttribute('data-projection-ready', 'true');
  await page.getByRole('button',{name:'Estruturas',exact:true}).click();
  await page.getByLabel('Buscar no atlas detalhado').fill('coroidea');
  await expect(page.locator('.nda-list button')).toHaveCount(2);
  await page.locator('.nda-list button').first().click();
  await expect(page.getByTestId('detailed-structure')).toContainText('Reconstrução didática');
  await page.getByLabel('Isolar estrutura selecionada').check();
  await page.getByRole('button',{name:'Superfícies anatômicas 3D',exact:true}).click();
  await expect(page.locator('canvas')).toHaveAttribute('data-detailed-atlas-rendered','true');
  await page.getByRole('button',{name:'Inventário',exact:true}).click();
  await expect(page.getByTestId('diagram-inventory').locator('article')).toHaveCount(diagramEntryCount);
  await expect(page.locator('.nda-review')).toContainText('Sem malha individual identificada');
  await page.getByLabel('Buscar no diagrama Neuroangio').fill('109');
  await expect(page.getByTestId('diagram-inventory').locator('article')).toHaveCount(1);
  await expect(page.getByTestId('diagram-inventory')).toContainText('oftálmica ventral');
  await expect(page.getByTestId('diagram-inventory').locator('article')).toContainText('Pendente');
  await page.getByRole('button',{name:'Mostrar todo o índice',exact:true}).click();
  await page.screenshot({path:`test-results/atlas-transition-${test.info().project.name}.png`, fullPage:true});
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  expect(errors).toEqual([]);
});

test('contrast passage changes the detector image and roadmap keeps its capture time', async ({page}) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/#/tools/neuro3d');
  await page.getByRole('button',{name:'Simulação',exact:true}).click();
  await page.getByLabel('Passo de manipulação',{exact:true}).selectOption('1.2');
  await page.getByRole('button',{name:'↑ Avançar',exact:true}).click();
  await page.getByRole('button',{name:'↑ Avançar',exact:true}).click();
  await page.getByRole('button',{name:'2 · Cateter-guia',exact:true}).click();
  await page.getByRole('button',{name:'↑ Avançar',exact:true}).click();
  await page.getByRole('button',{name:'DSA',exact:true}).click();
  await page.getByRole('button',{name:/Injetar contraste virtual/}).click();
  const live = page.getByTestId('reference-angiogram').first();
  await expect(live).toBeVisible();
  const first = await live.getAttribute('href');
  await expect.poll(() => live.getAttribute('href')).not.toBe(first);
  await expect.poll(async () => Number(await live.getAttribute('data-contrast-age'))).toBeGreaterThan(.6);
  await expect.poll(async () => Number(await live.getAttribute('data-contrast-age'))).toBeGreaterThan(2.2);
  await page.getByRole('button',{name:/Capturar roadmap/}).click();
  const roadmap = page.getByTestId('reference-roadmap').first();
  await expect(roadmap).toBeVisible();
  const age = await roadmap.getAttribute('data-contrast-age');
  const image = await roadmap.getAttribute('href');
  await page.getByRole('button',{name:/Injetar contraste virtual/}).click();
  await expect.poll(async () => Number(await live.getAttribute('data-contrast-age'))).toBeGreaterThan(.3);
  await expect(roadmap).toHaveAttribute('data-contrast-age',age!);
  await expect(roadmap).toHaveAttribute('href',image!);
  await page.screenshot({path:`test-results/angiographic-acquisition-${test.info().project.name}.png`,fullPage:true});
  expect(errors).toEqual([]);
});

test('sellar landmarks stay selected across representations, layers and atlas tabs until explicitly cleared', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/#/tools/neuro3d');
  await page.getByLabel('Apresentação anatômica').selectOption('sellar');
  const selection = page.getByTestId('atlas-selection');
  await expect(selection).toHaveAttribute('data-selected-id', 'adenohypophysis');
  await expect(page.locator('canvas')).toHaveAttribute('data-detailed-atlas-rendered', 'true');
  await page.getByLabel('Opacidade · Glândulas', { exact: true }).fill('0');
  await expect(selection).toContainText('Adenohypophysis');
  await page.getByRole('button', { name: 'Angiografia', exact: true }).click();
  await expect(page.getByTestId('atlas-angiography')).toHaveAttribute('data-selected-structure', 'adenohypophysis');
  await expect(page.locator('.nda-angiography')).toHaveAttribute('aria-busy', 'false', { timeout: 30000 });
  await page.getByRole('button', { name: 'Atlas', exact: true }).click();
  await expect(selection).toHaveAttribute('data-selected-id', 'adenohypophysis');
  await page.getByRole('button', { name: 'Restaurar visão', exact: true }).click();
  await expect(selection).toHaveAttribute('data-selected-id', 'adenohypophysis');
  await page.getByRole('button', { name: 'Seio cavernoso esquerdo', exact: true }).click();
  await expect(selection).toHaveAttribute('data-selected-id', 'cavernous_sinus_l');
  await page.getByRole('button', { name: 'Anatomia detalhada', exact: true }).click();
  await expect(selection).toHaveAttribute('data-selected-id', 'cavernous_sinus_l');
  await page.getByRole('button', { name: 'Esfenoide', exact: true }).click();
  await expect(selection).toHaveAttribute('data-selected-id', 'sphenoid_bone');
  await expect(page.locator('canvas')).toHaveAttribute('data-detailed-atlas-rendered', 'true');
  await page.screenshot({path: `test-results/skull-landmarks-${test.info().project.name}.png`, fullPage: true});
  await page.getByRole('button', { name: 'Limpar seleção', exact: true }).click();
  await expect(selection).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('clicking an angiographic vessel pins its identity and an empty click keeps it selected', async ({ page }) => {
  await page.goto('/#/tools/neuro3d');
  await page.getByRole('button', { name: 'Estruturas', exact: true }).click();
  await page.getByLabel('Buscar no atlas detalhado').fill('Basilar artery');
  await page.getByRole('button', {name: 'Basilar artery Artérias', exact: true}).click();
  await page.getByRole('button', { name: 'Isolar seleção', exact: true }).click();
  await page.getByRole('button', { name: 'AP', exact: true }).click();
  await page.getByRole('button', { name: 'Angiografia', exact: true }).click();
  const canvas = page.getByTestId('atlas-angiography');
  await expect(page.locator('.nda-angiography')).toHaveAttribute('aria-busy', 'false', { timeout: 30000 });
  const point = await canvas.evaluate((node: HTMLCanvasElement) => {
    const data = node.getContext('2d')!.getImageData(0, 0, node.width, node.height).data;
    // The gold interior identifies a real source-surface footprint, not a hand-coded screen coordinate.
    const samples: number[] = [];
    for (let i = 0; i < data.length; i += 4) if (data[i] > data[i + 2] + 20 && data[i + 1] > data[i + 2] + 10) samples.push(i / 4);
    if (!samples.length) throw new Error('Selected source surface did not receive a projected outline');
    // Pick the interior, rather than an antialiased outline pixel just outside the mesh.
    const gold = new Set(samples);
    const pixel = samples.reduce((best, candidate) => {
      const score = (p: number) => {
        let count = 0;
        for (let y = -3; y <= 3; y++) for (let x = -3; x <= 3; x++) if (gold.has(p + y * node.width + x)) count++;
        return count;
      };
      return score(candidate) > score(best) ? candidate : best;
    });
    const rect = node.getBoundingClientRect(), scale = Math.min(rect.width / node.width, rect.height / node.height);
    return { x: (rect.width - node.width * scale) / 2 + (pixel % node.width + .5) * scale,
      y: (rect.height - node.height * scale) / 2 + (Math.floor(pixel / node.width) + .5) * scale };
  });
  await page.getByRole('button', { name: 'Limpar seleção', exact: true }).click();
  await expect(page.locator('.nda-angiography')).toHaveAttribute('aria-busy', 'false');
  await canvas.click({ position: point });
  const selection = page.getByTestId('atlas-selection');
  await expect(selection).toBeVisible();
  const id = await selection.getAttribute('data-selected-id');
  await expect(page.locator('.nda-angiography')).toHaveAttribute('aria-busy', 'false');
  const empty = await canvas.evaluate((node: HTMLCanvasElement) => {
    const pixels = node.getContext('2d')!.getImageData(0, 0, node.width, node.height).data;
    for (let y = 10; y < node.height - 10; y += 10) for (let x = 10; x < node.width - 10; x += 10) {
      let clear = true;
      for (let dy = -5; dy <= 5; dy++) for (let dx = -5; dx <= 5; dx++) {
        const i = ((y + dy) * node.width + x + dx) * 4;
        if (pixels[i] !== 228 || pixels[i + 1] !== 228 || pixels[i + 2] !== 228) clear = false;
      }
      if (clear) {
        const rect = node.getBoundingClientRect(), scale = Math.min(rect.width / node.width, rect.height / node.height);
        return { x: (rect.width - node.width * scale) / 2 + x * scale,
          y: (rect.height - node.height * scale) / 2 + y * scale };
      }
    }
    throw new Error('No empty detector patch found');
  });
  await canvas.click({ position: empty });
  await expect(selection).toHaveAttribute('data-selected-id', id!);
});

test('supra-aortic source anatomy is framed in 3D and angiography, with picking preserved after recentering', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/#/tools/neuro3d');
  await page.getByLabel('Apresentação anatômica').selectOption('supraaortic');
  const selection = page.getByTestId('atlas-selection');
  await expect(selection).toHaveAttribute('data-selected-id', 'aortic_arch');
  await expect(page.locator('canvas')).toHaveAttribute('data-detailed-atlas-rendered', 'true');
  const pose = (await page.locator('canvas').getAttribute('data-atlas-camera-pose'))!.split(',').map(Number).slice(3);
  await page.getByRole('button', { name: 'Angiografia', exact: true }).click();
  const canvas = page.getByTestId('atlas-angiography');
  const center = (await canvas.getAttribute('data-field-center'))!.split(',').map(Number);
  center.forEach((value, i) => expect(value).toBeCloseTo(pose[i], 4));
  await expect(page.locator('.nda-angiography')).toHaveAttribute('aria-busy', 'false', {timeout: 30000});
  await page.getByRole('button', {name: 'Focar seleção', exact: true}).click();
  await expect(canvas).not.toHaveAttribute('data-field-center', '0,-18,0');
  await expect(page.locator('.nda-angiography')).toHaveAttribute('aria-busy', 'false');
  await page.getByLabel('Campo angiográfico', {exact: true}).selectOption('supraaortic');
  await expect(page.locator('.nda-angiography')).toHaveAttribute('aria-busy', 'false');
  const point = await canvas.evaluate((node: HTMLCanvasElement) => {
    const data = node.getContext('2d')!.getImageData(0, 0, node.width, node.height).data;
    const selected: number[] = [];
    for (let i = 0; i < data.length; i += 4) if (data[i] > data[i + 2] + 20 && data[i + 1] > data[i + 2] + 10) selected.push(i / 4);
    if (!selected.length) throw Error('Aortic source geometry is outside the detector field');
    const pixel = selected[Math.floor(selected.length * .8)];
    const box = node.getBoundingClientRect(), scale = Math.min(box.width / node.width, box.height / node.height);
    return {x: (box.width - node.width * scale) / 2 + (pixel % node.width + .5) * scale,
      y: (box.height - node.height * scale) / 2 + (Math.floor(pixel / node.width) + .5) * scale};
  });
  await page.getByRole('button', {name: 'Limpar seleção', exact: true}).click();
  await expect(selection).toHaveCount(0);
  await canvas.click({position: point});
  await expect(selection).toHaveAttribute('data-selected-id', 'aortic_arch');
  await page.screenshot({path: `test-results/supra-aortic-${test.info().project.name}.png`, fullPage: true});
  await page.getByRole('button', {name: 'Superfícies anatômicas 3D', exact: true}).click();
  await page.getByRole('button', {name: 'Estruturas', exact: true}).click();
  await page.getByLabel('Buscar no atlas detalhado').fill('tireoidiana inferior');
  await expect(page.locator('.nda-list button')).toHaveCount(2);
  expect(errors).toEqual([]);
});

test('angiography 3D rotates source meshes and retains selection across 2D and anatomical views', async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto('/#/tools/neuro3d');
  await page.getByLabel('Apresentação anatômica').selectOption('supraaortic');
  await page.getByRole('button', {name: 'Angiografia 3D', exact: true}).click();
  const stage = page.getByTestId('detailed-atlas-canvas');
  await expect(stage).toHaveAttribute('data-representation', 'angiography-3d');
  const canvas = stage.locator('canvas');
  await expect(canvas).toHaveAttribute('data-angiography3d-rendered', 'true');
  await page.getByRole('button', {name: 'Girar', exact: true}).click();
  const before = await canvas.screenshot();
  const box = await canvas.boundingBox();
  await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
  await page.mouse.down(); await page.mouse.move(box!.x + box!.width * .7, box!.y + box!.height * .55, {steps: 12}); await page.mouse.up();
  await expect.poll(async () => (await canvas.screenshot()).equals(before)).toBe(false);
  await expect(page.getByTestId('atlas-selection')).toHaveAttribute('data-selected-id', 'aortic_arch');
  const arterial = await canvas.screenshot();
  await page.getByLabel('Camada vascular na angiografia', {exact: true}).selectOption('venous');
  await expect.poll(async () => (await canvas.screenshot()).equals(arterial)).toBe(false);
  await expect(page.getByTestId('atlas-selection')).toHaveAttribute('data-selected-id', 'aortic_arch');
  await page.getByLabel('Camada vascular na angiografia', {exact: true}).selectOption('arterial');
  await page.screenshot({path: `test-results/angiography-3d-${test.info().project.name}.png`, fullPage: true});
  await page.getByRole('button', {name: 'Angiografia', exact: true}).click();
  await expect(page.getByTestId('atlas-angiography')).toHaveAttribute('data-selected-structure', 'aortic_arch');
  await page.getByRole('button', {name: 'Superfícies anatômicas 3D', exact: true}).click();
  await expect(stage).toHaveAttribute('data-representation', 'anatomy-3d');
  expect(errors).toEqual([]);
});
