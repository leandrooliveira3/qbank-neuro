import {test,expect} from '@playwright/test';
import JSZip from 'jszip';
async function fixture(corrupt=false,unsafe=false){
 const z=new JSZip(),mhd='NDims = 3\nDimSize = 8 6 4\nElementSpacing = 1 1 1\nPosition = 0 0 0\nOrientation = 1 0 0\n0 1 0\n0 0 1\nAnatomicalOrientation = R P I\nElementByteOrderMSB = False\nElementType = MET_SHORT\nElementDataFile = Dataset1_3D-DSA.raw\n';
 const v=Buffer.alloc(384);for(let i=0;i<192;i++)v.writeInt16LE(i,i*2);
 z.file(unsafe?'../Dataset1_3D-DSA.mhd':'Dataset 1/Dataset1_3D-DSA.mhd',mhd);z.file('Dataset 1/Dataset1_3D-DSA.raw',v);z.file('Dataset 1/Dataset1_3D_DSA_Target_Points.txt','2.5 1.5 1.25');z.file('Dataset 1/vendor.m','never execute');
 const b=await z.generateAsync({type:'nodebuffer',compression:'STORE'});if(corrupt){for(let i=0;i<b.length-46;i++)if(b.readUInt32LE(i)===0x02014b50&&b.readUInt32LE(i+24)>0){const local=b.readUInt32LE(i+42);b[local+30+b.readUInt16LE(local+26)+b.readUInt16LE(local+28)]^=1;break;}}
 return {name:'own-case.zip',mimeType:'application/zip',buffer:b};
}
test('ZIP inventory, cancellation, bounded extraction, fractional target, surface and evidence remain local',async({page})=>{
 const errors:string[]=[],sent:string[]=[];page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(r.method()!=='GET')sent.push(r.url());});
 await page.goto('/#/tools/neuro3d');await page.getByRole('button',{name:'Geometria 3D–2D',exact:true}).click();
 const zip=await fixture();await page.getByLabel('Importar ZIP GS-CA',{exact:true}).setInputFiles(zip);await expect(page.getByTestId('gsca-zip-inventory')).toContainText('3 arquivos selecionados');await expect(page.getByTestId('gsca-metadata')).toHaveCount(0);await expect(page.getByText(/vendor.m · .*ignorado/)).toBeVisible();
 await page.getByLabel('Prévia do ZIP',{exact:true}).screenshot({path:`test-results/gsca-zip-preview-${test.info().project.name}.png`});
 await page.getByRole('button',{name:'Cancelar importação ZIP',exact:true}).click();await expect(page.getByTestId('gsca-zip-inventory')).toHaveCount(0);await expect(page.getByTestId('gsca-metadata')).toHaveCount(0);
 await page.getByLabel('Importar ZIP GS-CA',{exact:true}).setInputFiles(zip);await page.getByRole('button',{name:'Extrair e abrir caso local',exact:true}).click();await expect(page.getByTestId('gsca-zip-loaded')).toBeVisible();await expect(page.getByTestId('gsca-metadata')).toContainText('8 × 6 × 4');await expect(page.getByTestId('gsca-slice')).toHaveAttribute('data-busy','false');
 await page.getByLabel('Alvo GS-CA',{exact:true}).selectOption('0');await expect(page.getByTestId('gsca-point')).toContainText('2.5, 1.5, 1.25');await page.getByLabel('Limiar da superfície',{exact:true}).fill('90');await page.getByRole('button',{name:'Gerar prévia vascular',exact:true}).click();await expect(page.getByTestId('gsca-surface')).toBeVisible();
 const event=page.waitForEvent('download');await page.getByRole('button',{name:'Exportar revisão geométrica local',exact:true}).click();const chunks:Buffer[]=[];for await(const c of (await(await event).createReadStream())!)chunks.push(c);const report=JSON.parse(Buffer.concat(chunks).toString());
 expect(report.selectedVoxel).toEqual([2.5,1.5,1.25]);expect(report.registrationAccuracyValidated).toBe(false);expect(report.anatomicalIdentityAssigned).toBe(false);expect(report.sourceDigests).toHaveLength(3);expect(report.zipImport.entries.filter((e:{selected:boolean})=>e.selected)).toHaveLength(3);
 await page.getByRole('button',{name:'Remover caso local',exact:true}).click();await expect(page.getByTestId('gsca-zip-loaded')).toHaveCount(0);expect(errors).toEqual([]);expect(sent).toEqual([]);
});
test('ZIP rejects unsafe paths before preview and CRC corruption during extraction, then recovers',async({page})=>{
 await page.goto('/#/tools/neuro3d');await page.getByRole('button',{name:'Geometria 3D–2D',exact:true}).click();const input=page.getByLabel('Importar ZIP GS-CA',{exact:true});
 await input.setInputFiles(await fixture(false,true));await expect(page.getByRole('alert')).toContainText('caminho inseguro');await expect(page.getByTestId('gsca-zip-inventory')).toHaveCount(0);
 await input.setInputFiles(await fixture(true));await page.getByRole('button',{name:'Extrair e abrir caso local',exact:true}).click();await expect(page.getByRole('alert')).toContainText('CRC-32');await expect(page.getByTestId('gsca-metadata')).toHaveCount(0);
 await page.getByRole('button',{name:'Cancelar importação ZIP',exact:true}).click();await input.setInputFiles(await fixture());await page.getByRole('button',{name:'Extrair e abrir caso local',exact:true}).click();await expect(page.getByTestId('gsca-metadata')).toContainText('8 × 6 × 4');
});
