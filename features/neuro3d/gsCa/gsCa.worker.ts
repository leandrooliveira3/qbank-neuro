import {readGeometryFiles} from './reader';
import {renderSlice,validateRoi,type Box3i} from './geometry';
let data:Awaited<ReturnType<typeof readGeometryFiles>>|undefined,image:{name:string;values:Float32Array;minimum:number;maximum:number;sha256:string}|undefined,detectorSequence=0;
const send=(message:unknown,transfer:Transferable[]=[])=>self.postMessage(message,{transfer});
self.onmessage=async(event:MessageEvent)=>{
 const q=event.data;
 try{
  if(q.kind==='load'){data=await readGeometryFiles(q.files);send({kind:'ready',metadata:data.metadata});}
  else if(q.kind==='slice'&&data){const r=renderSlice(data.values,data.metadata.volume,q.axis,q.index,q.voi as Box3i,q.window);send({kind:'slice',key:q.key,sequence:q.sequence,...r},[r.pixels.buffer]);}
  else if(q.kind==='detector'&&data){
   const sequence=++detectorSequence,d=data.metadata.detectors.find(d=>d.name===q.name),file=data.imageFiles.get(q.name);if(!d||!file)throw Error('Projeção ausente.');
   if(image?.name!==q.name){const buffer=await file.arrayBuffer(),values=new Float32Array(buffer);let minimum=Infinity,maximum=-Infinity;for(const value of values){if(!Number.isFinite(value))throw Error('Detector contém valores não finitos.');minimum=Math.min(minimum,value);maximum=Math.max(maximum,value);}const hash=await crypto.subtle.digest('SHA-256',buffer);if(sequence!==detectorSequence)return;image={name:q.name,values,minimum,maximum,sha256:Array.from(new Uint8Array(hash),n=>n.toString(16).padStart(2,'0')).join('')};}
   const roi=validateRoi(q.roi,d.header.dimensions),stride=Math.max(1,Math.ceil(Math.max(roi[1]-roi[0]+1,roi[3]-roi[2]+1)/1024)),width=Math.ceil((roi[1]-roi[0]+1)/stride),height=Math.ceil((roi[3]-roi[2]+1)/stride),pixels=new Uint8ClampedArray(width*height*4);
   const window=q.window??[image.minimum,image.maximum===image.minimum?image.minimum+1:image.maximum];if(!window.every(Number.isFinite)||window[1]<=window[0])throw Error('Janela do detector inválida.');
   for(let y=0;y<height;y++)for(let x=0;x<width;x++){const value=image.values[roi[0]+x*stride+d.header.dimensions[0]*(roi[2]+y*stride)],g=Math.max(0,Math.min(255,255*(value-window[0])/(window[1]-window[0])));pixels.set([g,g,g,255],(x+y*width)*4);}
   send({kind:'detector',key:q.key,sequence:q.sequence,pixels,width,height,stride,minimum:image.minimum,maximum:image.maximum,sha256:image.sha256,bytes:file.size,name:file.name,window},[pixels.buffer]);
  }
 }catch(e){send({kind:'error',requestKind:q.kind,sequence:q.sequence,error:e instanceof Error?e.message:String(e)});}
};
