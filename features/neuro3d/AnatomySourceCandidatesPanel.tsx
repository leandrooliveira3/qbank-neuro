import React,{useState} from 'react';
import {anatomySourceCandidates,venousGeometryCandidates} from './anatomySourceCandidates';
export default function AnatomySourceCandidatesPanel(){
 const [filter,setFilter]=useState('all');
 return <details data-testid="anatomy-source-candidates"><summary>Fontes complementares · utilidade e limites</summary><p>As 12 fontes enviadas foram avaliadas em 22/10/2026. Consultar não significa importar dados ou executar ferramentas. Nenhuma nova consulta reduz as 20 ausências, 373 lacunas ou sete termos venosos pendentes.</p><label>Mostrar fontes<select aria-label="Filtro das fontes complementares" value={filter} onChange={e=>setFilter(e.target.value)}><option value="all">Todas as 12 fontes enviadas</option><option value="context">Contexto cortical e subcortical</option><option value="development">Desenvolvimento e embriologia</option><option value="vascular">Referência vascular e osso</option><option value="tools">Ferramentas de processamento</option></select></label>
 {anatomySourceCandidates.filter(r=>filter==='all'||r.group===filter).map(r=><article key={r.id} data-source-candidate={r.id}><h4>{r.name}</h4><p>{r.status}</p><p>{r.use}</p><p>{r.limit}</p><a href={r.url} target="_blank" rel="noreferrer">Abrir fonte original</a></article>)}
 <h4>Busca dirigida de geometria venosa individual</h4>{venousGeometryCandidates.map(r=><article key={r.id} data-venous-candidate={r.id}><h4>{r.name}</h4><p>{r.terms}</p><p>{r.evidence}</p><p>Pendente: {r.block}</p><a href={r.url} target="_blank" rel="noreferrer">Confrontar referência</a></article>)}
 </details>;
}
