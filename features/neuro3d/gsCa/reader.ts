import {parseMhd,parseRad,parseTargets,type VolumeHeader,type DetectorHeader,type P3} from './geometry';
export interface LocalGeometry {volume:VolumeHeader;detectors:{name:string;header:DetectorHeader}[];targets:P3[];digests:{name:string;sha256:string;bytes:number}[];minimum:number;maximum:number}
export async function readGeometryFiles(files:File[]){
 if(!files.length||files.length>30||files.reduce((s,f)=>s+f.size,0)>384_000_000)throw Error('Selecione até 30 arquivos extraídos de um caso, total máximo de 384 MB.');
 const map=new Map<string,File>();for(const f of files){const key=f.name.toLowerCase();if(map.has(key))throw Error('Nomes duplicados: selecione apenas um caso.');map.set(key,f);}
 const headers=files.filter(f=>/\.mhd$/i.test(f.name));if(headers.length!==1)throw Error('Selecione exatamente um MHD e seu RAW, com RAD/RAW opcionais.');if(headers[0].size>65536)throw Error('Cabeçalho excessivo.');
 const volume=parseMhd(await headers[0].text()),raw=map.get(volume.rawName.toLowerCase());if(!raw||raw.size!==volume.bytes)throw Error('RAW do volume ausente ou tamanho incompatível.');
 const caseId=headers[0].name.match(/^Dataset(\d+)_/i)?.[1],detectors:LocalGeometry['detectors']=[],imageFiles=new Map<string,File>();
 for(const file of files.filter(f=>/\.rad$/i.test(f.name))){if(file.size>65536)throw Error('RAD excessivo.');if(caseId&&file.name.match(/^Dataset(\d+)_/i)?.[1]!==caseId)throw Error('Projeção pertence a outro caso.');const header=parseRad(await file.text()),image=map.get(file.name.replace(/\.rad$/i,'.raw').toLowerCase());if(!image||image.size!==header.bytes)throw Error('RAW de projeção ausente ou tamanho incompatível.');detectors.push({name:file.name,header});imageFiles.set(file.name,image);}
 if(detectors.length>4||2*volume.bytes+Math.max(0,...detectors.map(d=>d.header.bytes))+8_000_000>512_000_000)throw Error('Limite estimado de memória local excedido.');
 const targetFile=files.find(f=>/_3D_DSA_Target_Points\.txt$/i.test(f.name));if(targetFile&&caseId&&targetFile.name.match(/^Dataset(\d+)_/i)?.[1]!==caseId)throw Error('Alvos pertencem a outro caso.');if(targetFile&&targetFile.size>1_000_000)throw Error('Lista de alvos excessiva.');const targets=targetFile?parseTargets(await targetFile.text()):[];
 const buffer=await raw.arrayBuffer(),little=new Uint8Array(new Uint16Array([1]).buffer)[0]===1;
 if(!little)throw Error('Arquitetura little-endian necessária para este leitor.');const values=new Int16Array(buffer);let minimum=Infinity,maximum=-Infinity;for(const value of values){minimum=Math.min(minimum,value);maximum=Math.max(maximum,value);}
 const digests:LocalGeometry['digests']=[];
 const digest=async(file:File,bytes?:ArrayBuffer)=>{const b=bytes??await file.arrayBuffer(),hash=await crypto.subtle.digest('SHA-256',b);digests.push({name:file.name,sha256:Array.from(new Uint8Array(hash),n=>n.toString(16).padStart(2,'0')).join(''),bytes:file.size});};
 await digest(raw,buffer);await digest(headers[0]);for(const file of files.filter(f=>/\.rad$/i.test(f.name)))await digest(file);if(targetFile)await digest(targetFile);
 return {metadata:{volume,detectors,targets,digests,minimum,maximum},values,imageFiles};
}
