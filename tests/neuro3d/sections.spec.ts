import {test,expect} from '@playwright/test';
import {readFileSync} from 'node:fs';
test('native reference sections record physical manual marks and reject stale corrupted slices',async({page})=>{
  await page.goto('/#/tools/neuro3d');await page.getByRole('button',{name:'Referências vasculares',exact:true}).click();
  const card=page.getByRole('article',{name:'VENAT · venoso'});await card.getByRole('button',{name:'Inspecionar cortes e marcos',exact:true}).click();
  const section=page.getByRole('region',{name:'Cortes venat'});await expect(page.getByTestId('section-venat')).toHaveAttribute('data-state','ready',{timeout:45000});
  await section.getByLabel('Nome do marco venat').fill('Ponto de revisão sem identidade');
  await section.getByRole('button',{name:'Marcar voxel venat'}).focus();await page.keyboard.press('Enter');
  await expect(section).toContainText('1 marco(s) manual(is)');
  const promise=page.waitForEvent('download');await section.getByRole('button',{name:'Exportar marcos e proveniência'}).click();
  const report=JSON.parse(readFileSync((await(await promise).path())!,'utf-8'));expect(report.marks).toHaveLength(1);expect(report.marks[0].ras.every(Number.isFinite)).toBe(true);expect(report.atlasRegistration).toBeNull();expect(report.anatomicalApproval).toBe(false);
  await card.getByRole('button',{name:'Fechar cortes',exact:true}).click();await card.getByRole('button',{name:'Inspecionar cortes e marcos',exact:true}).click();await expect(section).toContainText('1 marco(s) manual(is)');
  await section.getByLabel('Eixo dos cortes venat').selectOption('0');await expect(page.getByTestId('section-venat')).toHaveAttribute('data-state','ready');
  await section.screenshot({path:`test-results/sections-${test.info().project.name}.png`});
  await page.route('**/sections/venat-0-0.json',route=>route.fulfill({body:'{}',contentType:'application/json'}));await section.getByLabel('Corte selecionado venat').selectOption('0');
  await expect(section.getByRole('alert')).toContainText('integridade');await expect(section.locator('canvas')).toHaveCount(0);
  await section.getByRole('button',{name:'Desfazer último marco'}).click();await expect(section).toContainText('0 marco(s) manual(is)');
});
test('original straight-sinus context is reversible and does not mark the Galen relation approved',async({page})=>{
  await page.goto('/#/tools/neuro3d');await page.getByRole('button',{name:'Revisar Galeno e seio reto com contexto'}).click();
  await expect(page.getByTestId('detailed-atlas-canvas')).toHaveAttribute('data-dangerous-connection','deep-venous-review');
  await expect(page.getByTestId('atlas-selection')).toHaveAttribute('data-selected-id','straight_sinus');
  await expect(page.getByText('Seio reto: malha original completa em 3D.',{exact:false})).toBeVisible();
  await expect(page.locator('canvas')).toHaveAttribute('data-detailed-atlas-rendered','true',{timeout:45000});
  await page.getByRole('button',{name:'Lateral',exact:true}).click();await page.getByTestId('detailed-atlas-canvas').screenshot({path:`test-results/straight-sinus-context-${test.info().project.name}.png`});
  await page.getByRole('button',{name:'Mostrar rede vascular completa',exact:true}).click();await expect(page.getByTestId('detailed-atlas-canvas')).toHaveAttribute('data-dangerous-connection','');
});
