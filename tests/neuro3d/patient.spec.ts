import {test,expect} from '@playwright/test';
import {readFile} from 'node:fs/promises';
import JSZip from 'jszip';
import {dicomFixture} from './dicom-fixture';

test('imports an oblique DICOM volume locally, previews its surface and exports physical provenance',async({page})=>{
  const errors:string[]=[],uploads:string[]=[];
  page.on('pageerror',error=>errors.push(error.message));
  page.on('request',request=>{if(request.method()==='POST')uploads.push(request.url());});
  await page.goto('/#/tools/neuro3d');
  await page.getByRole('button',{name:'Paciente 3D',exact:true}).click();
  await page.getByLabel('Importar volume DICOM do paciente').setInputFiles(Array.from({length:8},(_,z)=>({name:`synthetic-${z}.dcm`,mimeType:'application/dicom',buffer:dicomFixture(z)})));
  await expect(page.getByTestId('patient-volume-metadata')).toContainText('8 × 8 × 8');
  await expect(page.getByTestId('patient-volume-metadata')).toContainText('0.500 × 0.300 × 0.600 mm');
  await page.getByRole('button',{name:'Gerar prévia 3D',exact:true}).click();
  await expect(page.getByTestId('patient-mesh-metadata')).toContainText('prévia não revisada');
  const pending=page.waitForEvent('download');
  await page.getByRole('button',{name:'Exportar superfície e proveniência',exact:true}).click();
  const download=await pending,zip=await JSZip.loadAsync(await readFile((await download.path())!));
  const provenance=JSON.parse(await zip.file('provenance.json')!.async('string'));
  expect(provenance.coordinateSystem).toBe('DICOM LPS mm');expect(provenance.sourceSHA256).toHaveLength(8);
  expect(provenance.anatomicalReview).toBe(false);expect(provenance.deviceRecommendation).toBeNull();
  expect(await zip.file('surface-lps-mm.ply')!.async('string')).toContain('format ascii 1.0');
  await page.screenshot({path:`test-results/patient-local-volume-${test.info().project.name}.png`,fullPage:true});
  await page.getByRole('button',{name:'Remover exame',exact:true}).click();
  await expect(page.getByTestId('patient-volume-metadata')).toHaveCount(0);
  expect(uploads).toEqual([]);expect(errors).toEqual([]);
});

test('keeps raw angiographic projections out of the reconstructed volume path',async({page})=>{
  await page.goto('/#/tools/neuro3d');await page.getByRole('button',{name:'Paciente 3D',exact:true}).click();
  await page.getByLabel('Importar volume DICOM do paciente').setInputFiles({name:'synthetic-xa.dcm',mimeType:'application/dicom',buffer:dicomFixture(0,{sop:'1.2.840.10008.5.1.4.1.1.12.1'})});
  await expect(page.getByRole('alert')).toContainText('projeções');
  await expect(page.getByRole('button',{name:'Gerar prévia 3D',exact:true})).toHaveCount(0);
});
