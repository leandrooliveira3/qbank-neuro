import type {LocalGeometry} from './reader';
import {voxelToWorld,validateBox,type P3,type Box3i} from './geometry';
import {surfacePlan,type SurfacePreview} from './surface';

export const reviewMethod='gsca-marching-cubes-exact-edges-v1';
export interface SurfaceBinding {
 meshSha256:string;method:typeof reviewMethod;voi:Box3i;threshold:number;detail:60|90;
 stride:number;sampleDimensions:number[];triangles:number;componentCount:number;
 component:{id:number;triangles:number;voxelBounds:Box3i}|null;
}
export interface ReviewNote {
 id:string;createdAt:string;kind:'hypothesis'|'visual-observation';title:string;text:string;referenceUrl:string;
 voxel:P3;worldMm:P3;axis:number;displayedIndex:number;surface:SurfaceBinding;
 anatomicalIdentityVerified:false;
}
export interface NotesBook {format:'qbank-gsca-study-notes';version:1;contextSha256:string;sourceDigests:LocalGeometry['digests'];notes:ReviewNote[];anatomicalIdentityVerified:false;registrationAccuracyValidated:false}
export async function sha256(bytes:ArrayBuffer|Uint8Array){const hash=await crypto.subtle.digest('SHA-256',bytes as BufferSource);return Array.from(new Uint8Array(hash),n=>n.toString(16).padStart(2,'0')).join('');}
export async function reviewContextHash(meta:LocalGeometry){
 const context={frame:'GS-CA native Sv/Sw mm',matrixLayout:'4x4 column-major',volume:meta.volume,sources:[...meta.digests].sort((a,b)=>a.name.localeCompare(b.name,'en'))};
 return sha256(new TextEncoder().encode(JSON.stringify(context)));
}
export async function surfaceHash(surface:SurfacePreview){
 const header=new TextEncoder().encode(JSON.stringify({method:reviewMethod,voi:surface.voi,threshold:surface.threshold,detail:surface.detail,stride:surface.stride,sampleDimensions:surface.sampleDimensions}));
 const views=[header,new Uint8Array(surface.positions.buffer,surface.positions.byteOffset,surface.positions.byteLength),new Uint8Array(surface.voxels.buffer,surface.voxels.byteOffset,surface.voxels.byteLength),new Uint8Array(surface.componentIds.buffer,surface.componentIds.byteOffset,surface.componentIds.byteLength)];
 const bytes=new Uint8Array(views.reduce((sum,b)=>sum+b.length,0));let offset=0;for(const b of views){bytes.set(b,offset);offset+=b.length;}return sha256(bytes);
}
export function bindSurface(surface:SurfacePreview,id:number|null):SurfaceBinding{
 if(!surface.meshSha256)throw Error('Aguarde o hash da superfície.');
 const c=id===null?null:surface.components[id];if(id!==null&&!c)throw Error('Componente ausente.');
 return {meshSha256:surface.meshSha256,method:reviewMethod,voi:[...surface.voi],threshold:surface.threshold,detail:surface.detail,stride:surface.stride,sampleDimensions:[...surface.sampleDimensions],triangles:surface.triangles,componentCount:surface.components.length,component:c?{...c,voxelBounds:[...c.voxelBounds]}:null};
}
function integer(n:unknown,min:number,max:number){return typeof n==='number'&&Number.isSafeInteger(n)&&n>=min&&n<=max;}
function text(value:unknown,max:number,required=false){if(typeof value!=='string'||value.length>max||(required&&!value.trim()))throw Error('Texto ausente ou excessivo.');return value.trim();}
function vector(value:unknown):P3{if(!Array.isArray(value)||value.length!==3||!value.every(n=>typeof n==='number'&&Number.isFinite(n)))throw Error('Coordenada inválida.');return [...value] as P3;}
export function parseReviewNote(input:unknown,meta:LocalGeometry):ReviewNote{
 const n=input as ReviewNote;if(!n||typeof n!=='object'||!/^[a-f0-9-]{36}$/i.test(n.id)||typeof n.createdAt!=='string'||n.createdAt.length>32||!Number.isFinite(Date.parse(n.createdAt))||!['hypothesis','visual-observation'].includes(n.kind)||n.anatomicalIdentityVerified!==false)throw Error('Anotação não é uma hipótese/observação pessoal válida.');
 const voxel=vector(n.voxel),worldMm=vector(n.worldMm),s=n.surface;
 if(voxel.some((v,k)=>v<0||v>meta.volume.dimensions[k]-1)||worldMm.some((v,k)=>Math.abs(v-voxelToWorld(voxel,meta.volume)[k])>1e-8))throw Error('Ponto ou transformação Sw incompatível.');
 if(!integer(n.axis,0,2)||n.displayedIndex!==Math.round(voxel[n.axis]))throw Error('Corte inteiro incompatível com o ponto contínuo.');
 if(!s||s.method!==reviewMethod||!/^[a-f0-9]{64}$/.test(s.meshSha256)||!Array.isArray(s.voi)||s.voi.length!==6)throw Error('Vínculo da superfície inválido.');
 const voi=validateBox([...s.voi] as Box3i,meta.volume.dimensions);
 if(voxel.some((v,k)=>v<voi[k*2]||v>voi[k*2+1])||!Number.isFinite(s.threshold)||s.threshold<=meta.minimum||s.threshold>=meta.maximum||![60,90].includes(s.detail)||!integer(s.stride,1,16384)||!integer(s.triangles,1,150000)||!integer(s.componentCount,1,s.triangles)||!Array.isArray(s.sampleDimensions)||s.sampleDimensions.length!==3||!s.sampleDimensions.every(v=>integer(v,2,91)))throw Error('Parâmetros da superfície incompatíveis.');
 let component:SurfaceBinding['component']=null;
 const plan=surfacePlan(meta.volume,voi,s.detail);if(plan.stride!==s.stride||JSON.stringify(plan.sampleDimensions)!==JSON.stringify(s.sampleDimensions))throw Error('Amostragem não corresponde aos parâmetros registrados.');
 if(s.component!==null){const c=s.component;if(!c||!integer(c.id,0,s.componentCount-1)||!integer(c.triangles,1,s.triangles)||!Array.isArray(c.voxelBounds)||c.voxelBounds.length!==6||!c.voxelBounds.every(Number.isFinite)||[0,1,2].some(k=>c.voxelBounds[k*2]<voi[k*2]-1e-4||c.voxelBounds[k*2]>c.voxelBounds[k*2+1]||c.voxelBounds[k*2+1]>voi[k*2+1]+1e-4))throw Error('Componente incompatível.');component={id:c.id,triangles:c.triangles,voxelBounds:[...c.voxelBounds]};}
 const referenceUrl=text(n.referenceUrl,600);if(referenceUrl){let u:URL;try{u=new URL(referenceUrl);}catch{throw Error('Referência deve ser uma URL HTTPS.');}if(u.protocol!=='https:'||u.username||u.password)throw Error('Referência deve ser uma URL HTTPS sem credenciais.');}
 return {id:n.id,createdAt:n.createdAt,kind:n.kind,title:text(n.title,120,true),text:text(n.text,2000),referenceUrl,voxel,worldMm,axis:n.axis,displayedIndex:n.displayedIndex,surface:{meshSha256:s.meshSha256,method:reviewMethod,voi,threshold:s.threshold,detail:s.detail,stride:s.stride,sampleDimensions:[...s.sampleDimensions],triangles:s.triangles,componentCount:s.componentCount,component},anatomicalIdentityVerified:false};
}
export function parseNotesBook(text:string,contextSha256:string,meta:LocalGeometry):NotesBook{
 if(text.length>1_000_000)throw Error('Arquivo de anotações acima de 1 MB.');const b=JSON.parse(text);
 if(b?.format!=='qbank-gsca-study-notes'||b.version!==1||b.contextSha256!==contextSha256||b.anatomicalIdentityVerified!==false||b.registrationAccuracyValidated!==false||!Array.isArray(b.notes)||b.notes.length>100)throw Error('Formato, hashes do caso ou alegações de validação incompatíveis.');
 if(!Array.isArray(b.sourceDigests)||b.sourceDigests.length!==meta.digests.length||meta.digests.some(d=>b.sourceDigests.filter((v:{name:string;sha256:string;bytes:number})=>v?.name===d.name&&v.sha256===d.sha256&&v.bytes===d.bytes).length!==1))throw Error('Hashes individuais incompatíveis.');
 const notes=b.notes.map((n:unknown)=>parseReviewNote(n,meta));if(new Set(notes.map((n:ReviewNote)=>n.id)).size!==notes.length)throw Error('IDs de anotações duplicados.');
 return {format:'qbank-gsca-study-notes',version:1,contextSha256,sourceDigests:meta.digests.map(d=>({...d})),notes,anatomicalIdentityVerified:false,registrationAccuracyValidated:false};
}
export function mergeNotes(current:ReviewNote[],incoming:ReviewNote[]){
 const map=new Map(current.map(n=>[n.id,n]));for(const n of incoming){const old=map.get(n.id);if(old&&JSON.stringify(old)!==JSON.stringify(n))throw Error('ID já existe com conteúdo diferente; nenhuma anotação foi substituída.');map.set(n.id,n);}if(map.size>100)throw Error('Limite de 100 anotações por caso.');return [...map.values()];
}
export function noteMatchesSurface(note:ReviewNote,surface?:SurfacePreview){
 if(!surface?.meshSha256||surface.meshSha256!==note.surface.meshSha256)return false;
 if(note.surface.component&&!surface.components[note.surface.component.id])return false;
 return JSON.stringify(bindSurface(surface,note.surface.component?.id??null))===JSON.stringify(note.surface);
}
