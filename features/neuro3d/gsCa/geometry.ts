import {Matrix4,Vector3} from 'three';
export type P3=[number,number,number];
export type Box3i=[number,number,number,number,number,number];
export interface VolumeHeader {dimensions:P3;spacing:P3;toWorld:number[];rawName:string;orientation:string;bytes:number}
export interface DetectorHeader {dimensions:[number,number];spacing:[number,number];toWorld:number[];sourceWorld:P3;bytes:number}
function clean(text:string){if(text.length>65536||text.includes('\0'))throw Error('Cabeçalho inválido ou excessivo.');return text.replace(/\r/g,'\n').replace(/\n+/g,'\n');}
function field(text:string,name:string){const line=text.split('\n').find(l=>l.trimStart().startsWith(name+' =')||l.trimStart().startsWith(name+':'));if(!line)throw Error('Campo ausente: '+name);return line.slice(line.indexOf(line.includes('=')?'=':':')+1).trim();}
function numbers(text:string,count:number){const values=text.trim().split(/\s+/).map(Number);if(values.length!==count||!values.every(Number.isFinite))throw Error('Quantidade numérica inválida.');return values;}
function block(text:string,name:string,count:number){const lines=text.split('\n'),i=lines.findIndex(l=>l.trimStart().startsWith(name));if(i<0)throw Error('Campo ausente: '+name);const first=lines[i].slice(lines[i].indexOf(lines[i].includes('=')?'=':':')+1),parts=[first];for(const line of lines.slice(i+1)){if(!/^[\s+\-.0-9eE]*$/.test(line))break;parts.push(line);}return numbers(parts.join(' '),count);}
function affine(rows:number[]){const m=new Matrix4().fromArray(rows).transpose();if(rows.length!==16||![...m.elements].every(Number.isFinite)||rows.slice(12).some((v,i)=>Math.abs(v-[0,0,0,1][i])>1e-8)||(!Number.isFinite(m.determinant())||Math.abs(m.determinant())<1e-10))throw Error('Transformação afim singular ou inválida.');return m.elements;}
function dimensions(a:number[]){if(!a.every(n=>Number.isSafeInteger(n)&&n>0&&n<=16384))throw Error('Dimensões inválidas.');return a;}
export function parseMhd(source:string):VolumeHeader{
 const t=clean(source);if(field(t,'NDims')!=='3'||field(t,'ElementType')!=='MET_SHORT'||field(t,'ElementByteOrderMSB')!=='False'||/^(?:CompressedData\s*=\s*True|BinaryData\s*=\s*False|HeaderSize\s*=\s*(?!0\s*$)[-\d]+|ElementNumberOfChannels\s*=\s*(?!1\s*$)\d+)/m.test(t))throw Error('Volume suportado: MHD 3D signed16 little-endian sem compressão, um canal e sem prefixo RAW.');
 const d=dimensions(numbers(field(t,'DimSize'),3)) as P3,s=numbers(field(t,'ElementSpacing'),3) as P3,p=numbers(field(t,'Position'),3),r=block(t,'Orientation =',9);
 if(!s.every(v=>v>0))throw Error('Espaçamento inválido.');const rawName=field(t,'ElementDataFile').replace(/^"|"$/g,'');if(!/^[^/\\:]+\.raw$/i.test(rawName))throw Error('Selecione o RAW local indicado pelo MHD, sem caminhos externos.');
 const bytes=d.reduce((a,b)=>a*b,2);if(!Number.isSafeInteger(bytes)||bytes>224_000_000)throw Error('Volume acima do limite local de 224 MB signed16.');
 return {dimensions:d,spacing:s,toWorld:affine([r[0],r[1],r[2],p[0],r[3],r[4],r[5],p[1],r[6],r[7],r[8],p[2],0,0,0,1]),rawName,orientation:field(t,'AnatomicalOrientation'),bytes};
}
export function parseRad(source:string):DetectorHeader{
 const t=clean(source);if(field(t,'DataType')!=='float')throw Error('Detector suportado: float32 little-endian.');const d=dimensions(numbers(field(t,'Size[pixels]'),2)) as [number,number],s=numbers(field(t,'Step[mm]'),2) as [number,number];if(!s.every(n=>n>0))throw Error('Espaçamento do detector inválido.');const bytes=d[0]*d[1]*4;if(bytes>64_000_000)throw Error('Detector acima do limite local de 64 MB.');
 return {dimensions:d,spacing:s,toWorld:affine(block(t,'TPosition:',16)),sourceWorld:numbers(field(t,'SourcePosition[mm]'),3) as P3,bytes};
}
export function transform(p:P3,m:number[]):P3{return new Vector3(...p).applyMatrix4(new Matrix4().fromArray(m)).toArray() as P3;}
export function voxelToWorld(p:P3,h:VolumeHeader):P3{return transform(p.map((n,k)=>n*h.spacing[k]) as P3,h.toWorld);}
export function worldToVoxel(p:P3,h:VolumeHeader):P3{return transform(p,new Matrix4().fromArray(h.toWorld).invert().elements).map((n,k)=>n/h.spacing[k]) as P3;}
export function detectorRay(pixel:[number,number],h:DetectorHeader){const detectorWorld=transform([pixel[0]*h.spacing[0],pixel[1]*h.spacing[1],0],h.toWorld);return {sourceWorld:h.sourceWorld,detectorWorld};}
export function projectWorld(p:P3,h:DetectorHeader){
 const inverse=new Matrix4().fromArray(h.toWorld).invert().elements,q=transform(p,inverse),s=transform(h.sourceWorld,inverse),dz=q[2]-s[2];if(Math.abs(dz)<1e-10)throw Error('Raio paralelo ao detector.');const t=-s[2]/dz;if(t<=0||!Number.isFinite(t))throw Error('Projeção atrás da fonte.');const local=q.map((n,k)=>s[k]+t*(n-s[k]));return {pixel:[local[0]/h.spacing[0],local[1]/h.spacing[1]] as [number,number],detectorWorld:transform(local as P3,h.toWorld)};
}
export function rayAtVolumeSlice(pixel:[number,number],det:DetectorHeader,vol:VolumeHeader,axis:number,index:number):P3{
 const ray=detectorRay(pixel,det),s=worldToVoxel(ray.sourceWorld,vol),d=worldToVoxel(ray.detectorWorld,vol),den=d[axis]-s[axis];if(Math.abs(den)<1e-10)throw Error('Raio paralelo ao corte atual.');const t=(index-s[axis])/den;if(t<=0)throw Error('Interseção atrás da fonte.');return s.map((n,k)=>n+t*(d[k]-n)) as P3;
}
export function validateBox(box:Box3i,dims:P3){if(!box.every(Number.isInteger)||[0,1,2].some(k=>box[k*2]<0||box[k*2]>box[k*2+1]||box[k*2+1]>=dims[k]))throw Error('VOI fora do volume: índices inteiros zero, limites inclusivos.');return box;}
export function validateRoi(roi:[number,number,number,number],dims:[number,number]){if(!roi.every(Number.isInteger)||roi[0]<0||roi[2]<0||roi[0]>roi[1]||roi[2]>roi[3]||roi[1]>=dims[0]||roi[3]>=dims[1])throw Error('ROI fora do detector: limites inclusivos em pixels zero.');return roi;}
export const sliceAxes=[[1,2],[0,2],[0,1]] as const;
/** Native scalar grid, x fastest. No centering, flipping or implicit LPS/RAS. */
export function renderSlice(values:Int16Array,h:VolumeHeader,axis:number,index:number,voi:Box3i,window:[number,number]){
 validateBox(voi,h.dimensions);if(![0,1,2].includes(axis)||!Number.isInteger(index)||index<voi[axis*2]||index>voi[axis*2+1])throw Error('Corte fora da VOI.');if(!window.every(Number.isFinite)||window[1]<=window[0])throw Error('Janela inválida.');
 const [u,v]=sliceAxes[axis],width=voi[u*2+1]-voi[u*2]+1,height=voi[v*2+1]-voi[v*2]+1;if(width*height>4_000_000)throw Error('Corte acima de quatro milhões de pixels.');const pixels=new Uint8ClampedArray(width*height*4);
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){const p=[0,0,0];p[axis]=index;p[u]=x+voi[u*2];p[v]=y+voi[v*2];const value=values[p[0]+h.dimensions[0]*(p[1]+h.dimensions[1]*p[2])],g=Math.max(0,Math.min(255,255*(value-window[0])/(window[1]-window[0]))),i=(x+y*width)*4;pixels.set([g,g,g,255],i);}
 return {pixels,width,height,origin:[voi[u*2],voi[v*2]],axes:[u,v]};
}
export function parseTargets(text:string):P3[]{if(text.length>1_000_000)throw Error('Lista de alvos excessiva.');const lines=text.trim().split(/\r?\n/).filter(l=>l.trim());if(lines.length>10000)throw Error('Mais de 10.000 alvos.');return lines.map(line=>numbers(line,3) as P3);}
