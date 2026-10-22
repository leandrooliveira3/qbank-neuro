import React,{useState} from 'react';
import report from './skull-boundary-evidence.json';
import {openAnatomy} from './openAnatomy';
import type {PassageInspectionPlane,Point3} from './passageGeometry';
export default function SkullBoundaryReview({side,onShowPlane}:{side:'l'|'r';onShowPlane:(p:PassageInspectionPlane)=>void}){
 const row=report.sides.find(r=>r.side===side)!;
 const [cutId,setCutId]=useState(row.cuts[0].id),[expanded,setExpanded]=useState(false);
 const cut=row.cuts.find(c=>c.id===cutId)??row.cuts[0];
 const valid=report.sourceFiles.every(f=>openAnatomy.assets.some(a=>a.file===f.file&&a.sha256===f.sha256));
 function download(){const url=URL.createObjectURL(new Blob([JSON.stringify(report,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='bordas-esfenoide-e-cortes-obliquos.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
 return <details data-testid="skull-boundary-review"><summary>Bordas localizadas e cortes oblíquos</summary>
  {!valid?<p role="alert">Evidência incompatível com a fonte atual.</p>:<>
   <p>32 arestas abertas em dois grupos de 16, com faces e vértices originais. Os grupos não receberam nomes de forames. Destaque rosa é sobreposição de revisão, sem reparo da malha.</p>
   {report.boundaries.groups.map(g=><button key={g.id} data-boundary-id={g.id} onClick={()=>{const center=g.boundsCm.map(([a,b])=>(a+b)/2) as Point3;onShowPlane({passageId:'rotundum',side,axis:'z',offsetCm:center[2],centerCm:center,spanCm:2,reviewSegments:g.edgeIds.map(i=>report.boundaries.boundary[i].pointsCm as [Point3,Point3])});}}>Mostrar {g.id} · {g.edgeIds.length} arestas no 3D</button>)}
   <p>Refinamento dirigido: contenção demonstrada em Z31,42 mm e não demonstrada em Z31,44 mm, bilateralmente. As sondagens ficam a {(row.probeToBoundaryEdgesCm*10).toFixed(2)} mm nominais das arestas abertas. Distância ponto→arestas não é distância global nem explica por si só a mudança.</p>
   <label>Corte oblíquo<select aria-label="Corte oblíquo de V2" value={cut.id} onChange={e=>setCutId(e.target.value)}>{row.cuts.map(c=><option key={c.id} value={c.id}>{c.name==='transverse-local'?'Transverso à direção local estimada':'Longitudinal à direção local estimada'}</option>)}</select></label>
   <p>Direção estimada de duas secções V2 anteriores; origem matemática, sem centro de forame ou eixo anatômico certificado. Osso cinza e V2 violeta. Nestes cortes, contenção integral não demonstrada; não equivale a ausência do canal.</p>
   <div className={expanded?'nda-passage-inspector nda-passage-expanded':''}><button onClick={()=>setExpanded(v=>!v)}>{expanded?'Reduzir corte oblíquo':'Ampliar corte oblíquo'}</button>
    <svg role="img" aria-label="Corte oblíquo original V2" data-testid="oblique-section" data-cut-id={cut.id} viewBox="-0.5 -0.5 1 1" style={{background:'#07141c'}}>
     <defs><clipPath id={`oblique-${side}`}><rect x="-0.5" y="-0.5" width="1" height="1"/></clipPath></defs><g clipPath={`url(#oblique-${side})`}>{cut.sections.map(s=><path key={s.id} data-source-id={s.id} d={s.segments.map(([a,b])=>`M${a[0]},${-a[1]}L${b[0]},${-b[1]}`).join(' ')} fill="none" stroke={s.layer==='bone'?'#a7b6c1':'#bd9cef'} strokeWidth=".002"/>)}</g><path d="M-.45,.45h.2" stroke="white" strokeWidth=".003"/><text x="-.45" y=".43" fill="white" fontSize=".025">2 mm nominais</text>
    </svg>
   </div>
   <button onClick={()=>onShowPlane({passageId:'rotundum',side,axis:'z',offsetCm:cut.frame.originCm[2],centerCm:cut.frame.originCm as Point3,spanCm:1,frame:cut.frame as PassageInspectionPlane['frame']})}>Mostrar corte oblíquo no atlas 3D</button>
   <button onClick={download}>Exportar bordas e cortes oblíquos</button>
   <p>Transformação de inspeção reversível no mesmo atlas, não registro entre fontes. Triângulos e hashes preservados. Sem novas conexões vasculares ou identificação por proximidade.</p>
  </>}
 </details>;
}
