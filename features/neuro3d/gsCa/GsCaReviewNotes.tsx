import React,{useEffect,useRef,useState} from 'react';
import type {LocalGeometry} from './reader';
import {voxelToWorld,type P3} from './geometry';
import type {SurfacePreview} from './surface';
import {bindSurface,reviewContextHash,parseReviewNote,parseNotesBook,mergeNotes,noteMatchesSurface,type ReviewNote,type NotesBook} from './reviewNotes';

export default function GsCaReviewNotes({meta,surface,componentId,point,axis,onLocate,onNotes}:{meta:LocalGeometry;surface?:SurfacePreview;componentId:number|null;point:P3;axis:number;onLocate:(n:ReviewNote)=>void;onNotes:(notes:ReviewNote[])=>void}){
 const [context,setContext]=useState(''),[notes,setNotes]=useState<ReviewNote[]>([]),[pending,setPending]=useState<NotesBook>(),[error,setError]=useState(''),[notice,setNotice]=useState('');
 const [title,setTitle]=useState(''),[body,setBody]=useState(''),[reference,setReference]=useState(''),[kind,setKind]=useState<ReviewNote['kind']>('hypothesis'),[editId,setEditId]=useState<string>(),[deleted,setDeleted]=useState<ReviewNote>();
 const sequence=useRef(0);
 useEffect(()=>{let alive=true;void reviewContextHash(meta).then(v=>{if(alive)setContext(v);}).catch(()=>{if(alive)setError('Não foi possível vincular os hashes do caso.');});return()=>{alive=false;++sequence.current;};},[meta]);
 useEffect(()=>{onNotes(notes);},[notes,onNotes]);
 function reset(){setEditId(undefined);setTitle('');setBody('');setReference('');setKind('hypothesis');}
 function save(){try{
  const old=notes.find(n=>n.id===editId);if(!old&&(!surface||!context))throw Error('Gere uma superfície antes de anotar.');
  const base=old??{id:crypto.randomUUID(),createdAt:new Date().toISOString(),voxel:[...point],worldMm:voxelToWorld(point,meta.volume),axis,displayedIndex:Math.round(point[axis]),surface:bindSurface(surface!,componentId),anatomicalIdentityVerified:false};
  const note=parseReviewNote({...base,kind,title,text:body,referenceUrl:reference},meta);
  if(old)setNotes(notes.map(n=>n.id===old.id?note:n));else setNotes(mergeNotes(notes,[note]));reset();setError('');setNotice('Anotação pessoal salva nesta sessão; exporte o JSON para conservar.');
 }catch(e){setError((e as Error).message);}}
 async function read(file?:File){setPending(undefined);setError('');const current=++sequence.current;if(!file||!context)return;try{
  if(file.size>1_000_000)throw Error('Arquivo de anotações acima de 1 MB.');const bytes=await file.arrayBuffer(),text=new TextDecoder('utf-8',{fatal:true}).decode(bytes),book=parseNotesBook(text,context,meta);if(current===sequence.current)setPending(book);
 }catch(e){if(current===sequence.current)setError((e as Error).message);}}
 function exportNotes(){if(!context)return;const book:NotesBook={format:'qbank-gsca-study-notes',version:1,contextSha256:context,sourceDigests:meta.digests,notes,anatomicalIdentityVerified:false,registrationAccuracyValidated:false},url=URL.createObjectURL(new Blob([JSON.stringify(book,null,2)],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download='anotacoes-vasculares-locais.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
 return <section aria-label="Anotações vasculares pessoais"><h3>Revisão pessoal vinculada ao caso</h3><p>Anote hipóteses e observações visuais no ponto contínuo atual. Elas não recebem identidade anatômica comprovada. O vínculo registra hashes dos arquivos e da malha, recorte, limiar e amostragem; outra geração pode alterar os componentes. O JSON não inclui os arquivos de imagem. Sem envio ou armazenamento automático: exporte antes de remover o caso ou sair da aba.</p>
 <p data-testid="gsca-notes-count">{notes.length}/100 anotações · {context?'contexto vinculado aos hashes':'conferindo contexto…'}</p>
 <label>Título da anotação<input aria-label="Título da anotação vascular" maxLength={120} value={title} onChange={e=>setTitle(e.target.value)}/></label>
 <label>Tipo de anotação<select aria-label="Tipo da anotação vascular" value={kind} onChange={e=>setKind(e.target.value as ReviewNote['kind'])}><option value="hypothesis">Hipótese do usuário</option><option value="visual-observation">Observação visual · sem validação anatômica</option></select></label>
 <label>Descrição<textarea aria-label="Descrição da anotação vascular" maxLength={2000} value={body} onChange={e=>setBody(e.target.value)}/></label>
 <label>Referência opcional (HTTPS)<input aria-label="Referência da anotação vascular" maxLength={600} value={reference} onChange={e=>setReference(e.target.value)}/></label>
 <p>{editId?'Editando apenas o texto e o tipo; ponto e superfície originais são preservados.':surface?`Ponto ${point.join(', ')} · componente ${componentId===null?'todos':componentId+1} · limiar ${surface.threshold} · passo ${surface.stride}`:'Gere uma superfície para registrar uma nova anotação.'}</p>
 <button disabled={!context||!editId&&!surface?.meshSha256} onClick={save}>{editId?'Atualizar anotação pessoal':'Salvar anotação pessoal'}</button>{editId&&<button onClick={reset}>Cancelar edição</button>}
 <button disabled={!context||!notes.length} onClick={exportNotes}>Exportar anotações locais</button><label>Importar anotações JSON<input aria-label="Importar anotações vasculares" type="file" accept=".json" disabled={!context} onChange={e=>{void read(e.target.files?.[0]);e.target.value='';}}/></label>
 {pending&&<><p data-testid="gsca-notes-preview">Prévia: {pending.notes.length} anotações pessoais do mesmo contexto. Nenhuma matriz, nome do atlas ou alegação clínica será aplicada.</p><button onClick={()=>{try{setNotes(mergeNotes(notes,pending.notes));setPending(undefined);setError('');setNotice('Anotações mescladas; registros iguais não foram duplicados.');}catch(e){setError((e as Error).message);}}}>Mesclar anotações conferidas</button><button onClick={()=>setPending(undefined)}>Descartar importação de anotações</button></>}
 {error&&<p role="alert">{error}</p>}{notice&&<p role="status">{notice}</p>}
 <p>Marcadores azuis nos cortes representam pontos pessoais no corte inteiro mais próximo. Uma anotação importada continua sendo pessoal; o sistema não comprova seu conteúdo.</p>
 {notes.map((n,i)=><article key={n.id} data-testid="gsca-review-note" data-note-id={n.id}><h4>N{i+1} · {n.title}</h4><p>{n.kind==='hypothesis'?'Hipótese do usuário':'Observação visual'} · identidade anatômica não comprovada.</p><p>{n.text}</p><p>Voxel contínuo {n.voxel.join(', ')} · corte registrado {['X','Y','Z'][n.axis]} {n.displayedIndex} · limiar {n.surface.threshold} · passo {n.surface.stride} · {n.surface.component?`componente ${n.surface.component.id+1}`:'todos os componentes'}</p><p>{noteMatchesSurface(n,surface)?'Malha atual coincide com o contexto geométrico anotado.':'Superfície diferente ou ausente; reabra o contexto e gere a prévia para conferir o vínculo.'}</p>{n.referenceUrl&&<a href={n.referenceUrl} target="_blank" rel="noreferrer">Referência anotada pelo usuário</a>}<button onClick={()=>onLocate(n)}>Reabrir contexto da anotação</button><button onClick={()=>{setEditId(n.id);setTitle(n.title);setBody(n.text);setReference(n.referenceUrl);setKind(n.kind);setError('');}}>Editar anotação</button><button onClick={()=>{setDeleted(n);setNotes(notes.filter(row=>row.id!==n.id));if(editId===n.id)reset();}}>Remover anotação</button></article>)}
 {deleted&&<button onClick={()=>{try{setNotes(mergeNotes(notes,[deleted]));setDeleted(undefined);setError('');}catch(e){setError((e as Error).message);}}}>Desfazer última remoção</button>}
 </section>;
}
