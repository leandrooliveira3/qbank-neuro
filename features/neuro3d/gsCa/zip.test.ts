import {it,expect} from 'vitest';
import JSZip from 'jszip';
import {inspectZip,extractZip,crc32,zipLimits} from './zip';
async function archive(options:{streamFiles?:boolean;compression?:'STORE'|'DEFLATE';name?:string;data?:string}={}){
 const z=new JSZip();z.file(options.name??'Dataset 1/Dataset1_3D-DSA.mhd',options.data??'own fixture');z.file('Dataset 1/Dataset1_3D-DSA.raw',new Uint8Array([1,2,3,4]));z.file('Dataset 1/vendor.m','not executed');
 return new Uint8Array(await z.generateAsync({type:'arraybuffer',compression:options.compression??'STORE',streamFiles:options.streamFiles??false}));
}
const file=(b:Uint8Array)=>new File([new Uint8Array(b)],'fixture.zip');
const central=(b:Uint8Array)=>{const d=new DataView(b.buffer);for(let p=0;p<b.length-46;p++)if(d.getUint32(p,true)===0x02014b50&&d.getUint32(p+24,true)>0)return p;throw Error('fixture');};
it('preflights classic STORE and DEFLATE, signed descriptors, folders and excluded vendor content before bounded extraction',async()=>{
 for(const compression of ['STORE','DEFLATE'] as const)for(const streamFiles of [false,true]){
  const f=file(await archive({compression,streamFiles})),plan=await inspectZip(f),progress:string[]=[];
  expect(plan.entries.filter(e=>e.selected)).toHaveLength(2);expect(plan.entries.find(e=>e.name==='vendor.m')?.selected).toBe(false);
  const result=await extractZip(f,plan,n=>progress.push(n));expect(result.map(f=>f.name)).toEqual(['Dataset1_3D-DSA.mhd','Dataset1_3D-DSA.raw']);expect(await result[0].text()).toBe('own fixture');expect(progress.length).toBeGreaterThan(0);
 }
 expect(crc32(new TextEncoder().encode('123456789'))).toBe(0xcbf43926);
});
it('rejects traversal, absolute, alternate names, symlinks, encryption and unsupported compression before extraction',async()=>{
 for(const name of ['../bad.mhd','/bad.mhd','C:/bad.mhd','a\\bad.mhd'])await expect(inspectZip(file(await archive({name})))).rejects.toThrow('ZIP:');
 for(const mutation of [(d:DataView,p:number)=>d.setUint16(p+8,1,true),(d:DataView,p:number)=>d.setUint16(p+10,99,true),(d:DataView,p:number)=>d.setUint32(p+38,0xa1ff0000,true)]){
  const b=await archive();mutation(new DataView(b.buffer),central(b));await expect(inspectZip(file(b))).rejects.toThrow('ZIP:');
 }
});
it('rejects duplicates, mixed cases, declared expansion bombs, oversized directory and truncated archives',async()=>{
 const duplicate=new JSZip();duplicate.file('a/one.mhd','x');duplicate.file('b/ONE.mhd','x');await expect(inspectZip(file(new Uint8Array(await duplicate.generateAsync({type:'arraybuffer'}))))).rejects.toThrow('duplicados');
 const mixed=new JSZip();mixed.file('Dataset1_3D-DSA.mhd','x');mixed.file('Dataset2_3D-DSA.raw','x');await expect(inspectZip(file(new Uint8Array(await mixed.generateAsync({type:'arraybuffer'}))))).rejects.toThrow('casos diferentes');
 const bomb=await archive(),p=central(bomb),d=new DataView(bomb.buffer);d.setUint32(p+24,zipLimits.expandedBytes+1,true);await expect(inspectZip(file(bomb))).rejects.toThrow('limites');
 const b=await archive();await expect(inspectZip(file(b.slice(0,-2)))).rejects.toThrow();
 const many=new JSZip();for(let i=0;i<65;i++)many.file(`${i}.mhd`,'x');await expect(inspectZip(file(new Uint8Array(await many.generateAsync({type:'arraybuffer'}))))).rejects.toThrow('64 entradas');
});
it('rejects local/central name divergence, overlapping ranges, self extracting prefixes and edited inventory',async()=>{
 const b=await archive(),p=central(b),d=new DataView(b.buffer),local=d.getUint32(p+42,true);b[local+30]^=1;await expect(inspectZip(file(b))).rejects.toThrow('nome local');
 const overlap=await archive(),od=new DataView(overlap.buffer);od.setUint32(central(overlap)+42,0,true);await expect(inspectZip(file(overlap))).rejects.toThrow();
 const f=file(await archive()),plan=await inspectZip(f);await expect(extractZip(f,{...plan,selectedBytes:0})).rejects.toThrow('inventário');
 const prefix=await archive();const prefixed=new Uint8Array(prefix.length+1);prefixed.set(prefix,1);await expect(inspectZip(file(prefixed))).rejects.toThrow();
});
it('checks actual length and CRC and stops forged compressed output at its advertised bound',async()=>{
 const corrupt=await archive(),f=file(corrupt),plan=await inspectZip(f),first=plan.entries.find(e=>e.selected)!;corrupt[first.start]^=1;
 const cf=file(corrupt);await expect(extractZip(cf,await inspectZip(cf))).rejects.toThrow('CRC-32');
 const b=await archive({compression:'DEFLATE',data:'oversized output despite declared small size'}),p=central(b),d=new DataView(b.buffer),local=d.getUint32(p+42,true);d.setUint32(p+24,1,true);d.setUint32(local+22,1,true);
 const forged=file(b);await expect(extractZip(forged,await inspectZip(forged))).rejects.toThrow('saída real');
});
