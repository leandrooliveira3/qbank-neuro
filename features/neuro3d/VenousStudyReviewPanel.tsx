import React,{useState} from 'react';
import {venousStudyReviews,resolveVenousReview} from './venousStudyReview';
export default function VenousStudyReviewPanel({onExplore}:{onExplore:(id:string)=>void}){
  const [side,setSide]=useState<'l'|'r'>('l');
  return <details className="nda-venous-review" data-testid="venous-directed-review"><summary>Revisão venosa · tributárias, trajetos e alternativas</summary>
    <p>Três capítulos com texto consultado diretamente. Imagens e vídeos não foram revisados integralmente. Não são cadeias obrigatórias de drenagem ou conexões geométricas aprovadas.</p>
    <label>Lado da revisão venosa<select aria-label="Lado da revisão venosa" value={side} onChange={e=>setSide(e.target.value as typeof side)}><option value="l">Esquerdo</option><option value="r">Direito</option></select></label>
    {venousStudyReviews.map(row=><article key={row.id} data-venous-review={row.id}><h4>{row.name}</h4><p>{row.note}</p>
      {resolveVenousReview(row,side).map(({id,item,missing,origin})=>missing?<p key={id} data-venous-missing={id}>Sem geometria individual: {id}</p>:<button key={id} data-venous-id={id} onClick={()=>onExplore(id)}>{item!.name} · {origin==='imported'?'origem importada':'ilustração'}</button>)}
      {row.unresolvedTerms.map(text=><p key={text}>{text}</p>)}<a href={row.url} target="_blank" rel="noreferrer">Capítulo Neuroangio consultado</a>
    </article>)}
    <p>Galeno–seio reto permanece discordante. Os termos adicionais pendentes não foram convertidos em identidades por proximidade. O inventário atual continua com20IDs sem geometria e373sem referência; esta revisão não o certifica como exaustivo.</p>
  </details>;
}
