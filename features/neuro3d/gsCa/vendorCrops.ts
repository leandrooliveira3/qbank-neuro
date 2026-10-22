import contracts from './source-contracts.json';
import {validateBox,validateRoi,type Box3i} from './geometry';
import type {LocalGeometry} from './reader';
import type {WorkSheet} from 'xlsx';
export interface VendorCrops {caseId:number;sheet:string;sha256:string;voi:Box3i;rois:Record<string,[number,number,number,number]>;convention:'zero-based-inclusive';source:'GS-CA guide pp8–9 / database_info.xls'}
export async function readVendorCrops(file:File,meta:LocalGeometry):Promise<VendorCrops>{
 if(file.name!=='database_info.xls'||file.size>1_000_000||!file.size)throw Error('Selecione database_info.xls original, até 1 MB.');
 const bytes=await file.arrayBuffer(),digest=await crypto.subtle.digest('SHA-256',bytes),sha256=Array.from(new Uint8Array(digest),n=>n.toString(16).padStart(2,'0')).join('');
 if(sha256!==contracts.xlsSha256)throw Error('XLS não corresponde à versão da fonte conferida; não será interpretado.');
 const n=Number(meta.volume.rawName.match(/^Dataset(\d+)_3D-DSA\.raw$/)?.[1]),contract=contracts.cases.find(c=>c.case===n);
 if(!contract||JSON.stringify(contract.dimensions)!==JSON.stringify(meta.volume.dimensions)||JSON.stringify(contract.spacing)!==JSON.stringify(meta.volume.spacing)||!meta.digests.some(d=>d.name===meta.volume.rawName&&d.sha256===contract.volumeSha256))throw Error('Volume não corresponde ao caso GS-CA auditado.');
 for(const [name,hash] of Object.entries(contract.headers)){if(/\.mhd$/i.test(name)||meta.detectors.some(d=>d.name===name))if(!meta.digests.some(d=>d.name===name&&d.sha256===hash))throw Error('Cabeçalho não corresponde à fonte: '+name);}
 // Hash gate precedes loading/parsing XLS. No formulas, macros or external links are run.
 const {read}=await import('xlsx');
 const book=read(bytes,{type:'array',cellFormula:true,cellHTML:false,cellText:false,bookVBA:false,sheetRows:6}),sheet=`Dataset ${n}`,s=book.Sheets[sheet];
 if(!s||book.SheetNames.length!==10)throw Error('Estrutura XLS inesperada.');
 return {...decodeVendorSheet(s,meta),caseId:n,sheet,sha256,convention:'zero-based-inclusive',source:'GS-CA guide pp8–9 / database_info.xls'};
}
export function decodeVendorSheet(s:WorkSheet,meta:LocalGeometry){
 const row=(index:number,label:string,count:number)=>{
  if(s[`A${index}`]?.v!==label)throw Error('Rótulo XLS inesperado.');
  return Array.from({length:count},(_,i)=>{const cell=s[`${String.fromCharCode(66+i)}${index}`];if(!cell||cell.t!=='n'||cell.f||!Number.isSafeInteger(cell.v))throw Error('Limite XLS não é inteiro literal.');return Number(cell.v);});
 };
 const voi=validateBox(row(3,'VOI ixmin, ixmax, iymin, iymax, izmin, izmax',6) as Box3i,meta.volume.dimensions),lat=row(4,'ROI LAT ixmin, ixmax, iymin, iymax',4),ap=row(5,'ROI AP ixmin, ixmax, iymin, iymax',4),rois:VendorCrops['rois']={};
 for(const d of meta.detectors){const view=d.name.match(/_(AP|LAT)\.rad$/)?.[1];if(!view)throw Error('Vista RAD sem vínculo AP/LAT comprovado.');rois[d.name]=validateRoi([...(view==='AP'?ap:lat)] as [number,number,number,number],d.header.dimensions);}
 return {voi,rois};
}
