import {it,expect} from 'vitest';
import {extractSurface} from './surface';
import {surfaceHash,reviewContextHash,bindSurface,parseReviewNote,parseNotesBook,mergeNotes,noteMatchesSurface,type NotesBook} from './reviewNotes';
import {voxelToWorld,type P3} from './geometry';
import type {LocalGeometry} from './reader';
async function fixture(){
 const meta:LocalGeometry={volume:{dimensions:[8,6,4],spacing:[2,3,4],toWorld:[0,1,0,0,-1,0,0,0,0,0,1,0,10,-5,7,1],bytes:384,rawName:'own.raw',orientation:'own'},detectors:[],targets:[],digests:[{name:'own.raw',sha256:'a'.repeat(64),bytes:384},{name:'own.mhd',sha256:'b'.repeat(64),bytes:200}],minimum:0,maximum:7};
 const surface=extractSurface(Int16Array.from({length:192},(_,i)=>i%8),meta.volume,[0,7,0,5,0,3],3.5,60,[0,7]);surface.meshSha256=await surfaceHash(surface);
 const voxel:P3=[2.5,1.5,1.25],note=parseReviewNote({id:crypto.randomUUID(),createdAt:new Date().toISOString(),kind:'hypothesis',title:'Minha hipótese',text:'Conferir nos cortes; sem nome comprovado.',referenceUrl:'https://neuroangio.org/',voxel,worldMm:voxelToWorld(voxel,meta.volume),axis:2,displayedIndex:1,surface:bindSurface(surface,0),anatomicalIdentityVerified:false},meta);
 const book:NotesBook={format:'qbank-gsca-study-notes',version:1,contextSha256:await reviewContextHash(meta),sourceDigests:meta.digests,notes:[note],anatomicalIdentityVerified:false,registrationAccuracyValidated:false};return {meta,surface,note,book};
}
it('round-trips source-bound hypotheses with fractional points, full affine Sw and distinct displayed plane',async()=>{
 const {meta,surface,note,book}=await fixture(),r=parseNotesBook(JSON.stringify(book),book.contextSha256,meta);expect(r.notes[0].voxel).toEqual([2.5,1.5,1.25]);expect(r.notes[0].displayedIndex).toBe(1);expect(r.notes[0].worldMm).toEqual(voxelToWorld(note.voxel,meta.volume));expect(noteMatchesSurface(r.notes[0],surface)).toBe(true);
 expect(await reviewContextHash({...meta,digests:[...meta.digests].reverse()})).toBe(book.contextSha256);expect(await reviewContextHash({...meta,digests:[]})).not.toBe(book.contextSha256);
});
it('rejects another case, forged validation, unsafe URLs, inconsistent coordinates and sampling',async()=>{
 const {meta,note,book}=await fixture();
 for(const b of [{...book,contextSha256:'f'.repeat(64)},{...book,registrationAccuracyValidated:true},{...book,notes:[{...note,anatomicalIdentityVerified:true}]},{...book,notes:[note,note]}])expect(()=>parseNotesBook(JSON.stringify(b),book.contextSha256,meta)).toThrow();
 for(const patch of [{referenceUrl:'javascript:alert(1)'},{referenceUrl:'https://user:pass@example.com'},{worldMm:[0,0,0]},{displayedIndex:1.25},{surface:{...note.surface,stride:2}},{voxel:[99,1,1]}])expect(()=>parseReviewNote({...note,...patch},meta)).toThrow();
 expect(()=>parseNotesBook('x'.repeat(1_000_001),book.contextSha256,meta)).toThrow('1 MB');
});
it('links component identity to exact mesh bytes and parameters, never matching only rank or proximity',async()=>{
 const {meta,surface,note}=await fixture(),second=extractSurface(Int16Array.from({length:192},(_,i)=>i%8),meta.volume,[0,7,0,5,0,3],3.5,60,[0,7]);expect(await surfaceHash(second)).toBe(surface.meshSha256);
 second.voxels[0]+=.001;expect(await surfaceHash(second)).not.toBe(surface.meshSha256);
 expect(await surfaceHash({...surface,detail:90})).not.toBe(surface.meshSha256);expect(noteMatchesSurface(note,{...surface,meshSha256:'f'.repeat(64)})).toBe(false);expect(noteMatchesSurface({...note,surface:{...note.surface,component:{...note.surface.component!,id:99}}},surface)).toBe(false);expect(noteMatchesSurface({...note,surface:{...note.surface,threshold:4}},surface)).toBe(false);
});
it('merges identical notes without duplication and rejects conflicting IDs atomically',async()=>{
 const {note}=await fixture(),current=[note];expect(mergeNotes(current,[note])).toHaveLength(1);expect(()=>mergeNotes(current,[{...note,title:'Outro conteúdo'}])).toThrow('diferente');expect(current[0].title).toBe('Minha hipótese');
 const hundred=Array.from({length:100},()=>({...note,id:crypto.randomUUID()}));expect(()=>mergeNotes(hundred,[note])).toThrow('100');
});
