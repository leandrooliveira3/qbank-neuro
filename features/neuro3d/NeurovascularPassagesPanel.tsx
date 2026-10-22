import React,{Suspense,lazy,useState} from 'react';
import {neurovascularPassages,resolvePassage,passageBookEvidence} from './neurovascularPassages';
import {openAnatomy} from './openAnatomy';
import {reconstructedVessels} from './reconstructedVessels';
import type {PassageInspectionPlane} from './passageGeometry';
const names=new Map([...openAnatomy.structures,...reconstructedVessels].map(row=>[row.id,row.name]));
const PassageGeometryInspector=lazy(()=>import('./PassageGeometryInspector'));
export default function NeurovascularPassagesPanel({onExplore,onSelect,onShowPlane}:{onExplore:(id:string,side:'l'|'r')=>void;onSelect:(id:string)=>void;onShowPlane:(plane:PassageInspectionPlane)=>void}){
  const [side,setSide]=useState<'l'|'r'>('l');
  const [inspection,setInspection]=useState<string|null>(null);
  return <section aria-label="Forames e conexões neurovasculares" className="nda-neuroangio"><h3>Forames, trajetos e anastomoses</h3>
    <p>Identificação bibliográfica e contexto 3D de vasos, osso e nervos. Os forames ainda não possuem superfícies ou coordenadas individuais verificadas; o nome do contexto não marca um ponto exato no osso.</p>
    <details><summary>Conferência em Lasjaunias</summary><p>{passageBookEvidence.title}. Páginas conferidas: {passageBookEvidence.printedPages.join(', ')}. Conferência dirigida, sem redistribuir texto ou figuras do livro.</p></details>
    <label>Lado<select aria-label="Lado dos forames" value={side} onChange={e=>setSide(e.target.value as 'l'|'r')}><option value="l">Esquerdo</option><option value="r">Direito</option></select></label>
    {neurovascularPassages.map(row=>{const resolved=resolvePassage(row,side);return <article key={row.id} data-passage={row.id}>
      <h4>{row.name}</h4><p>{row.structures}</p><strong>{row.segment}</strong><p>{row.relationship}</p>
      <button onClick={()=>onExplore(row.id,side)}>Explorar {row.name}</button>
      {['rotundum','ovale','vidian','meningolacrimal'].includes(row.id)&&<button aria-expanded={inspection===row.id} onClick={()=>setInspection(old=>old===row.id?null:row.id)}>Inspecionar cortes e separações</button>}
      {inspection===row.id&&<Suspense fallback={<p role="status">Abrindo inspeção física…</p>}><PassageGeometryInspector key={`${row.id}:${side}`} id={row.id} side={side} onSelect={onSelect} onShowPlane={onShowPlane}/></Suspense>}
      <details><summary>Vasos e elos da rede bibliográfica</summary>{resolved.vesselIds.map(id=><button key={id} data-vessel-id={id} onClick={()=>onSelect(id)}>{names.get(id)}</button>)}
      <p>Elos vinculados para estudo; patência, óstios e continuidade de superfície permanecem sem comprovação.</p>
      {!!resolved.missingVesselIds.length&&<p>Ramos sem superfície: {resolved.missingVesselIds.join(', ')}</p>}
      <p>{row.sourceReview}</p>{row.references.map(url=><a key={url} href={url} target="_blank" rel="noreferrer">Referência da conexão</a>)}</details>
      <details><summary>Contexto osteoneural disponível</summary>{resolved.contextIds.map(id=><button key={id} onClick={()=>onSelect(id)}>{names.get(id)}</button>)}
      {!!resolved.missingContextIds.length&&<p>Contextos sem identidade individual: {resolved.missingContextIds.join(', ')}</p>}</details>
    </article>;})}
  </section>;
}
