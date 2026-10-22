import {test,expect} from '@playwright/test';
import {readFileSync} from 'node:fs';
import {centeredReferencePoint} from '../../features/neuro3d/comparison/geometry';
for(const kind of ['brave','venat'] as const)test(`physical ${kind} mark links original section, 3D and provenance without cross-source registration`,async({page})=>{
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('/#/tools/neuro3d');await page.getByRole('button',{name:'Referências vasculares',exact:true}).click();
  const card=page.getByRole('article',{name:kind==='brave'?'BRAVE-NET · arterial':'VENAT · venoso'});
  await expect(page.getByTestId(`${kind}-reference-view`)).toHaveAttribute('data-state','ready',{timeout:45000});
  await card.getByRole('button',{name:'Inspecionar cortes e marcos',exact:true}).click();
  const section=page.getByRole('region',{name:`Cortes ${kind}`});await expect(page.getByTestId(`section-${kind}`)).toHaveAttribute('data-state','ready');
  await section.getByRole('button',{name:`Marcar voxel ${kind}`}).focus();await page.keyboard.press('Enter');
  await expect(page.getByTestId(`linked-${kind}`)).toHaveAttribute('data-marks','1');
  const key=await page.getByTestId(`linked-${kind}`).getAttribute('data-plane');expect(key).toMatch(new RegExp(`^${kind}-2-`));
  await card.getByRole('button',{name:'Adicionar vista ao registro',exact:true}).click();
  const promise=page.waitForEvent('download');await page.getByRole('button',{name:'Exportar proveniência e vistas',exact:true}).click();
  const report=JSON.parse(readFileSync((await(await promise).path())!,'utf8')),view=report.recordedViews[0],mark=view.marks[0];
  expect(view.plane.key).toBe(mark.key);expect(view.plane.sourceSHA256).toBe(mark.sourceSHA256);expect(view.linkedVisible).toBe(true);expect(report.interSourceRegistration).toBeNull();
  await section.getByLabel(`Eixo dos cortes ${kind}`).selectOption('0');await expect(page.getByTestId(`linked-${kind}`)).toHaveAttribute('data-plane',new RegExp(`^${kind}-0-`));
  // In the AP orthographic preset, the stored physical display point projects
  // directly through the recorded camera zoom. Click the actual 3D sphere.
  const surface=report.sources.find((s:{key:string})=>s.key===view.key),center=surface.boundsRASmm[0].map((v:number,k:number)=>(v+surface.boundsRASmm[1][k])/2),point=centeredReferencePoint(mark.ras,center);
  const canvas=page.getByTestId(`${kind}-reference-view`).locator('canvas'),rect=(await canvas.boundingBox())!;
  const x=rect.width/2+point[0]*view.pose.zoom,y=rect.height/2-point[1]*view.pose.zoom;
  expect(x).toBeGreaterThan(0);expect(x).toBeLessThan(rect.width);expect(y).toBeGreaterThan(0);expect(y).toBeLessThan(rect.height);
  await canvas.click({position:{x,y}});
  await expect(section.getByLabel(`Eixo dos cortes ${kind}`)).toHaveValue('2');await expect(page.getByTestId(`linked-${kind}`)).toHaveAttribute('data-plane',key!);
  await card.getByLabel(`Mostrar vínculos físicos ${kind}`).uncheck();
  await card.getByRole('button',{name:'Adicionar vista ao registro',exact:true}).click();
  const hiddenDownload=page.waitForEvent('download');await page.getByRole('button',{name:'Exportar proveniência e vistas',exact:true}).click();
  const hiddenReport=JSON.parse(readFileSync((await(await hiddenDownload).path())!,'utf8'));expect(hiddenReport.recordedViews[0].linkedVisible).toBe(false);expect(hiddenReport.recordedViews[0].marks[0].ras).toEqual(mark.ras);
  await card.getByLabel(`Mostrar vínculos físicos ${kind}`).check();
  await card.screenshot({path:`test-results/linked-${kind}-${test.info().project.name}.png`});
  expect(errors).toEqual([]);
});
