// Deliberately limited classic ZIP reader: no filesystem writes, recursive extraction or vendor execution.
export const zipLimits={archiveBytes:192_000_000,expandedBytes:384_000_000,entries:64,ratio:250,workingBytes:768*1024*1024};
export interface ZipEntry {path:string;name:string;size:number;compressed:number;crc:number;method:number;start:number;end:number;selected:boolean}
export interface ZipInventory {archiveName:string;archiveBytes:number;expandedBytes:number;selectedBytes:number;estimatedWorkingBytes:number;entries:ZipEntry[]}
const fail=(s:string):never=>{throw Error(`ZIP: ${s}`);};
const view=(b:ArrayBuffer)=>new DataView(b);
async function bytes(file:Blob,start:number,length:number){if(start<0||length<0||start+length>file.size)fail('estrutura truncada.');return new Uint8Array(await file.slice(start,start+length).arrayBuffer());}
function ascii(b:Uint8Array){if(b.some(c=>c<32||c>126))fail('nomes devem usar ASCII simples.');return String.fromCharCode(...b);}
function extras(b:Uint8Array){const d=new DataView(b.buffer,b.byteOffset,b.byteLength);let p=0;while(p<b.length){if(p+4>b.length||p+4+d.getUint16(p+2,true)>b.length)fail('campo extra truncado.');if([1,0x7075,0x6375,0x9901].includes(d.getUint16(p,true)))fail('ZIP64, nomes alternativos e criptografia não são suportados.');p+=4+d.getUint16(p+2,true);}}
export async function inspectZip(file:File):Promise<ZipInventory>{
 if(file.size<22||file.size>zipLimits.archiveBytes)fail('arquivo deve ter entre 22 bytes e 192 MB.');
 const tail=await bytes(file,Math.max(0,file.size-65557),Math.min(file.size,65557)),t=new DataView(tail.buffer);let e=-1;
 for(let p=tail.length-22;p>=0;p--)if(t.getUint32(p,true)===0x06054b50&&p+22+t.getUint16(p+20,true)===tail.length){e=p;break;}
 if(e<0)fail('diretório final ausente ou dados após seu término.');
 const count=t.getUint16(e+10,true),size=t.getUint32(e+12,true),offset=t.getUint32(e+16,true),end=file.size-tail.length+e;
 if(t.getUint16(e+4,true)||t.getUint16(e+6,true)||t.getUint16(e+8,true)!==count||count===65535||size===0xffffffff||offset===0xffffffff)fail('volumes múltiplos e ZIP64 não são suportados.');
 if(!count||count>zipLimits.entries||size>128_000||offset+size!==end)fail('diretório fora dos limites (até 64 entradas).');
 const central=await bytes(file,offset,size),d=new DataView(central.buffer),entries:ZipEntry[]=[],occupied:{start:number;end:number}[]=[],paths=new Set<string>(),names=new Set<string>();let p=0,total=0;
 for(let i=0;i<count;i++){
  if(p+46>size||d.getUint32(p,true)!==0x02014b50)fail('entrada central inválida.');
  const version=d.getUint16(p+6,true),flags=d.getUint16(p+8,true),method=d.getUint16(p+10,true),crc=d.getUint32(p+16,true),compressed=d.getUint32(p+20,true),length=d.getUint32(p+24,true),n=d.getUint16(p+28,true),x=d.getUint16(p+30,true),c=d.getUint16(p+32,true),local=d.getUint32(p+42,true);
  if(p+46+n+x+c>size||!n||n>240)fail('nome ou entrada central truncada.');
  if(version>20||flags&~0x80e||![0,8].includes(method)||d.getUint16(p+34,true))fail('método, flags ou versão não suportados; use STORE/DEFLATE sem senha.');
  const path=ascii(central.subarray(p+46,p+46+n)),directory=path.endsWith('/'),parts=(directory?path.slice(0,-1):path).split('/'),name=parts.at(-1)!;
  if(parts.some(s=>!s||s==='.'||s==='..')||/[\\:]/.test(path)||paths.has(path.toLowerCase())||((d.getUint32(p+38,true)>>>16)&0xf000)===0xa000)fail('caminho inseguro, duplicado ou link simbólico.');
  paths.add(path.toLowerCase());extras(central.subarray(p+46+n,p+46+n+x));
  if(length===0xffffffff||compressed===0xffffffff||length>zipLimits.expandedBytes||(length>0&&(!compressed||length/compressed>zipLimits.ratio))||method===0&&length!==compressed)fail('tamanho ou razão de expansão excede os limites.');
  total+=length;if(total>zipLimits.expandedBytes)fail('expansão declarada acima de 384 MB.');
  if(directory&&(length||compressed||method!==0))fail('diretório com conteúdo.');
  const selected=!directory&&(/\.(mhd|rad|raw)$/i.test(name)||/_3D_DSA_Target_Points\.txt$/i.test(name));
  if(selected){if(names.has(name.toLowerCase()))fail('nomes de dados duplicados em pastas diferentes.');names.add(name.toLowerCase());if(length>(/\.(mhd|rad)$/i.test(name)?65536:/\.txt$/i.test(name)?1_000_000:224_000_000))fail('arquivo de dados acima do limite.');}
  const localBytes=await bytes(file,local,30),h=new DataView(localBytes.buffer);
  if(h.getUint32(0,true)!==0x04034b50||h.getUint16(4,true)!==version||h.getUint16(6,true)!==flags||h.getUint16(8,true)!==method)fail('cabeçalhos local e central divergem.');
  const ln=h.getUint16(26,true),lx=h.getUint16(28,true);if(ln!==n||lx>65535)fail('nome local divergente.');
  const variable=await bytes(file,local+30,ln+lx);if(ascii(variable.subarray(0,ln))!==path)fail('nome local divergente.');extras(variable.subarray(ln));
  if(!(flags&8)&&(h.getUint32(14,true)!==crc||h.getUint32(18,true)!==compressed||h.getUint32(22,true)!==length))fail('tamanhos ou CRC locais divergentes.');
  const start=local+30+ln+lx;let finish=start+compressed;
  if(flags&8){const descriptor=await bytes(file,finish,12),v=new DataView(descriptor.buffer);const signed=v.getUint32(0,true)===0x08074b50,dd=signed?view((await bytes(file,finish+4,12)).buffer):v;if(dd.getUint32(0,true)!==crc||dd.getUint32(4,true)!==compressed||dd.getUint32(8,true)!==length)fail('descritor de dados divergente.');finish+=signed?16:12;}
  if(finish>offset||local>=offset)fail('dados sobrepõem o diretório.');
  entries.push({path,name,size:length,compressed,crc,method,start,end:finish,selected});
  // Keep the complete occupied interval for overlap/gap checks, including headers/descriptors.
  occupied.push({start:local,end:finish});
  p+=46+n+x+c;
 }
 if(p!==size)fail('tamanho do diretório divergente.');
 occupied.sort((a,b)=>a.start-b.start);let cursor=0;for(const interval of occupied){if(interval.start!==cursor)fail('entradas sobrepostas, prefixo executável ou dados não inventariados.');cursor=interval.end;}if(cursor!==offset)fail('dados não inventariados antes do diretório.');
 const selected=entries.filter(e=>e.selected),mhd=selected.filter(e=>/\.mhd$/i.test(e.name));
 if(mhd.length!==1||selected.length>30)fail('selecione um ZIP de um único caso com exatamente um MHD.');
 const caseIds=new Set(selected.map(e=>e.name.match(/^Dataset(\d+)_/i)?.[1]).filter(Boolean));if(caseIds.size>1)fail('dados pertencem a casos diferentes.');
 const selectedBytes=selected.reduce((s,e)=>s+e.size,0),largest=Math.max(...selected.map(e=>e.size)),estimatedWorkingBytes=file.size+selectedBytes+2*largest+8_000_000;
 if(estimatedWorkingBytes>zipLimits.workingBytes)fail('estimativa ZIP acima de 768 MiB; use arquivos extraídos.');
 return {archiveName:file.name,archiveBytes:file.size,expandedBytes:total,selectedBytes,estimatedWorkingBytes,entries};
}
const table=Uint32Array.from({length:256},(_,n)=>{for(let k=0;k<8;k++)n=n&1?0xedb88320^(n>>>1):n>>>1;return n>>>0;});
export function crc32(b:Uint8Array,previous=0){let n=previous^0xffffffff;for(const x of b)n=table[(n^x)&255]^(n>>>8);return (n^0xffffffff)>>>0;}
export async function extractZip(file:File,inventory:ZipInventory,progress:(name:string,completed:number,total:number)=>void=()=>{}){
 // Inventory is recomputed, never trusted from UI/JSON. No decompression precedes this check.
 const plan=await inspectZip(file);if(JSON.stringify(plan)!==JSON.stringify(inventory))fail('inventário foi alterado.');
 const files:File[]=[];const selected=plan.entries.filter(e=>e.selected);
 for(const e of selected){
  let stream=file.slice(e.start,e.start+e.compressed).stream();
  if(e.method===8){try{stream=stream.pipeThrough(new DecompressionStream('deflate-raw'));}catch{fail('DEFLATE local indisponível neste navegador; use arquivos extraídos.');}}
  const reader=stream.getReader(),output=new Uint8Array(e.size);let used=0,crc=0;
  try{for(;;){const {value,done}=await reader.read();if(done)break;if(used+value.length>e.size)fail('saída real excede o tamanho declarado.');output.set(value,used);used+=value.length;crc=crc32(value,crc);progress(e.name,files.length,selected.length);}
   if(used!==e.size||crc!==e.crc)fail('tamanho real ou CRC-32 inválido.');
  }finally{await reader.cancel().catch(()=>{});reader.releaseLock();}
  files.push(new File([output],e.name,{type:'application/octet-stream'}));progress(e.name,files.length,selected.length);
 }
 return files;
}
