import { assemblePatientVolume, parsePatientDicom, type PatientVolume, type DicomFrame } from './dicomVolume';
import { patientSurface } from './patientSurface';
let volume: PatientVolume | undefined;
const send = (message: unknown, transfer: Transferable[] = []) => (self as unknown as { postMessage: (message: unknown, transfer: Transferable[]) => void }).postMessage(message, transfer);
self.onmessage = async (event: MessageEvent<{kind:string;files?:File[];threshold?:number;slice?:number}>) => {
  const request = event.data;
  try {
    if(request.kind === 'load') {
      volume = undefined;
      const files=request.files ?? [];
      if(!files.length || files.length>2000 || files.reduce((sum,file)=>sum+file.size,0)>512_000_000)throw new Error('Selecione até 2.000 arquivos de uma série, com total máximo de 512 MB.');
      const frames:DicomFrame[]=[],digests:string[]=[];
      for(const file of files) {
        const bytes=new Uint8Array(await file.arrayBuffer());
        frames.push(...parsePatientDicom(bytes));
        if(frames.reduce((sum,frame)=>sum+frame.pixels.length,0)>32_000_000)throw new Error('Volume acima do limite local de 32 milhões de voxels.');
        const hash=await crypto.subtle.digest('SHA-256',bytes);
        digests.push(Array.from(new Uint8Array(hash),v=>v.toString(16).padStart(2,'0')).join(''));
      }
      volume=assemblePatientVolume(frames);
      const { values,...metadata }=volume;
      send({kind:'ready',metadata,digests});
    } else if(request.kind === 'mesh' && volume) {
      const mesh=patientSurface(volume,request.threshold!);
      send({kind:'mesh',...mesh},[mesh.positions.buffer]);
    } else if(request.kind === 'slice' && volume) {
      const slice=request.slice!;
      if(!Number.isInteger(slice)||slice<0||slice>=volume.dimensions[2])throw new Error('Corte fora do volume.');
      const [width,height]=volume.dimensions;
      const pixels=new Uint8ClampedArray(width*height*4);
      for(let i=0;i<width*height;i++) {
        const value=volume.values[slice*width*height+i];
        const gray=Math.round(255*(value-volume.minimum)/(volume.maximum-volume.minimum));
        pixels.set([gray,gray,gray,255],i*4);
      }
      send({kind:'slice',slice,width,height,pixels},[pixels.buffer]);
    }
  } catch(error) {send({kind:'error',operation:request.kind,error:error instanceof Error?error.message:'Não foi possível processar a série.'});}
};
