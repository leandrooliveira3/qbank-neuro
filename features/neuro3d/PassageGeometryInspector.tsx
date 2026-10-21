import React,{useEffect,useRef,useState} from 'react';
import report from './passage-geometry-audit.json';
import {openAnatomy} from './openAnatomy';
import {reconstructedVessels} from './reconstructedVessels';
import {loadOriginalAtlasSurfaces} from './fullVascularSurface';
import {sectionAxes,sourceMetres,surfaceEvidenceBytes,type PassageSurface,type SurfaceSection,type Point3,type PassageInspectionPlane} from './passageGeometry';
import {sha256} from './comparison/geometry';
const names=new Map([...openAnatomy.structures,...reconstructedVessels].map(row=>[row.id,row.name]));
export default function PassageGeometryInspector({id,side,onSelect,onShowPlane}:{id:string;side:'l'|'r';onSelect:(id:string)=>void;onShowPlane:(plane:PassageInspectionPlane)=>void}){
  const route=report.routes.find(row=>row.id===id&&row.side===side)!;
  const [axis,setAxis]=useState<keyof typeof sectionAxes>('y'),[offset,setOffset]=useState(route.inspectionPoint[1]);
  const [edge,setEdge]=useState(0),[attempt,setAttempt]=useState(0),[error,setError]=useState(''),[busy,setBusy]=useState(true),[sections,setSections]=useState<SurfaceSection[]>([]);
  const [expanded,setExpanded]=useState(false);
  useEffect(()=>{if(!expanded)return;const escape=(event:KeyboardEvent)=>{if(event.key==='Escape')setExpanded(false);};window.addEventListener('keydown',escape);return()=>window.removeEventListener('keydown',escape);},[expanded]);
  const worker=useRef<Worker|null>(null),sequence=useRef(0),loaded=useRef(false),plane=useRef({axis:1,offset});
  plane.current={axis:sectionAxes[axis].normal,offset};
  useEffect(()=>{
    const abort=new AbortController();let disposed=false;loaded.current=false;setBusy(true);setError('');setSections([]);
    const w=new Worker(new URL('./passageSection.worker.ts',import.meta.url),{type:'module'});worker.current=w;
    w.onmessage=event=>{if(disposed||event.data.sequence!==sequence.current)return;setBusy(false);if(event.data.error)setError(event.data.error);else setSections(event.data.sections);};
    w.onerror=()=>{if(!disposed){setError('Não foi possível calcular o corte.');setBusy(false);}};
    (async()=>{
      for(const source of report.sourceFiles)if(openAnatomy.assets.find(a=>a.file===source.file)?.sha256!==source.sha256)throw Error('Auditoria incompatível com a fonte atual.');
      const originals=await loadOriginalAtlasSurfaces(route.surfaces.filter(s=>s.origin==='imported').map(s=>s.id),abort.signal);
      const surfaces:PassageSurface[]=originals.map(s=>({...s,origin:'imported'}));
      for(const item of route.surfaces.filter(s=>s.origin==='illustrative')){
        const r=reconstructedVessels.find(r=>r.id===item.id);if(!r)throw Error('Ramo ilustrativo ausente.');
        surfaces.push({id:r.id,layer:r.layer,origin:'illustrative',...r.surface});
      }
      for(const surface of surfaces){
        if(await sha256(surfaceEvidenceBytes(surface))!==route.surfaces.find(s=>s.id===surface.id)!.sha256)throw Error('Geometria diferente da auditoria: '+surface.id);
      }
      if(disposed)return;loaded.current=true;
      w.postMessage({surfaces,...plane.current,sequence:++sequence.current});
    })().catch(e=>{if(!disposed){setError(String(e.message));setBusy(false);}});
    return()=>{disposed=true;loaded.current=false;abort.abort();w.terminate();worker.current=null;};
  },[route,attempt]);
  useEffect(()=>{
    if(!loaded.current||!worker.current)return;setBusy(true);setError('');
    worker.current.postMessage({...plane.current,sequence:++sequence.current});
  },[axis,offset]);
  const a=sectionAxes[axis],centre=route.inspectionPoint,link=route.links[edge],points=[link.witness.from,link.witness.to] as Point3[];
  function exportEvidence(){
    const evidence={schema:1,scope:'Atlas model passage geometry, not patient registration',baseCommit:report.baseCommit,sourceCommit:report.sourceCommit,license:report.license,attribution:report.attribution,
      coordinateSystem:report.coordinateSystem,sourceFiles:report.sourceFiles,route,plane:{axis,normalAxis:a.normal,offsetCm:offset,offsetSourceMetres:sourceMetres([a.normal===0?offset:0,a.normal===1?offset:0,a.normal===2?offset:0] as Point3)[a.normal]},
      selectedLink:edge,sectionCounts:sections.map(s=>({id:s.id,origin:s.origin,segments:s.segments.length,coplanarTriangles:s.coplanarTriangles})),method:report.method,limitations:report.limitations,
      foramenPositionVerified:false,anastomosisLumenVerified:false};
    const url=URL.createObjectURL(new Blob([JSON.stringify(evidence,null,2)],{type:'application/json'}));
    const anchor=document.createElement('a');anchor.href=url;anchor.download=`via-${id}-${side}-evidencia.json`;anchor.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  return <section className={`nda-passage-inspector${expanded?' nda-passage-expanded':''}`} aria-label="Inspeção física da via" data-testid="passage-inspector" data-route={`${id}:${side}`}>
    <h4>Cortes e separações · {side==='l'?'esquerda':'direita'}</h4>
    <button aria-pressed={expanded} onClick={()=>setExpanded(v=>!v)}>{expanded?'Reduzir inspeção física':'Ampliar inspeção física'}</button>
    <p>Cortes das malhas originais e das ilustrações existentes, no mesmo espaço do atlas. O centro inicial acompanha um ramo; não identifica o forame. Sem transferência de rótulos entre datasets.</p>
    <label>Plano de inspeção<select aria-label="Plano de inspeção" value={axis} onChange={e=>{const next=e.target.value as typeof axis;setAxis(next);setOffset(centre[sectionAxes[next].normal]);}}>{Object.entries(sectionAxes).map(([key,value])=><option value={key} key={key}>{value.label}</option>)}</select></label>
    <label>Posição do corte · {(offset*10).toFixed(2)} mm nominais<input aria-label="Posição do corte da via" type="range" min={centre[a.normal]-3} max={centre[a.normal]+3} step={.01} value={offset} onChange={e=>setOffset(Number(e.target.value))}/></label>
    <p>Referencial: X/Y/Z do atlas, Y superior; não são eixos DICOM. Campo de 60 × 60 mm nominais. Osso cinza; nervo violeta; vaso original vermelho; ramo ilustrativo laranja tracejado.</p>
    {error?<div role="alert">{error}<button onClick={()=>setAttempt(n=>n+1)}>Tentar abrir cortes novamente</button></div>:<>
      <div role="status">{busy?'Calculando corte original…':`${sections.reduce((n,s)=>n+s.segments.length,0)} segmentos de interseção calculados.`}</div>
      <svg role="img" aria-label={`Corte físico da via ${id}`} viewBox="-3 -3 6 6" data-testid="passage-section" data-busy={String(busy)} data-axis={axis} data-offset-cm={offset} style={{visibility:busy?'hidden':'visible'}}>
        <defs><clipPath id={`clip-${id}-${side}`}><rect x="-3" y="-3" width="6" height="6"/></clipPath></defs>
        <g clipPath={`url(#clip-${id}-${side})`}>
          {sections.map(s=><path key={s.id} data-surface-id={s.id} data-origin={s.origin} data-segments={s.segments.length} d={s.segments.map(([p,q])=>`M${p[a.u]-centre[a.u]},${centre[a.v]-p[a.v]}L${q[a.u]-centre[a.u]},${centre[a.v]-q[a.v]}`).join(' ')} fill="none" stroke={s.layer==='bone'?'#a7b6c1':s.layer==='nerve'?'#bd9cef':s.origin==='imported'?'#ff7389':'#ffbe55'} strokeWidth={.012} strokeDasharray={s.origin==='illustrative'?'.04 .03':undefined}/>)}
          {points.map((p,i)=><circle key={i} data-witness={i} cx={p[a.u]-centre[a.u]} cy={centre[a.v]-p[a.v]} r={.055} fill={Math.abs(p[a.normal]-offset)<.001?['#5df5e5','#ff78dc'][i]:'none'} stroke={['#5df5e5','#ff78dc'][i]} strokeWidth={.02}/>)}
        </g>
        <path d="M-2.7,2.7h1" stroke="white" strokeWidth=".02"/><text x="-2.7" y="2.58" fill="white" fontSize=".13">10 mm nominais</text>
      </svg>
      <p>Círculos: projeções dos dois pontos comparados, sem linha de ligação. Vazados quando fora do corte. Triângulos coplanares omitidos: {sections.reduce((n,s)=>n+s.coplanarTriangles,0)}; corte vazio não prova ausência do vaso.</p>
    </>}
    <label>Elo bibliográfico<select aria-label="Elo bibliográfico da inspeção" value={edge} onChange={e=>setEdge(Number(e.target.value))}>{route.links.map((l,i)=><option key={i} value={i}>{names.get(l.from)} ↔ {names.get(l.to)}</option>)}</select></label>
    <p data-testid="passage-distance">Separação mínima garantida pelos limites espaciais: <strong>{(link.aabbLowerBoundCm*10).toFixed(3)} mm nominais</strong>. Distância encontrada na amostra: {(link.sampledUpperBoundCm*10).toFixed(3)} mm. O mínimo global pode ser menor que a amostra. Valor zero não comprova contato ou luz contínua.</p>
    <button onClick={()=>onSelect(link.from)}>Selecionar primeiro vaso</button><button onClick={()=>onSelect(link.to)}>Selecionar segundo vaso</button>
    <details><summary>Proveniência e limites desta medição</summary><p>{link.fromOrigin==='imported'?'Primeira superfície importada':'Primeira superfície ilustrativa'}; {link.toOrigin==='imported'?'segunda importada':'segunda ilustrativa'}.32vértices determinísticos da primeira superfície comparados com todos os triângulos não degenerados da segunda. Triângulo alvo {link.witness.targetTriangle}; não é correspondência anatômica comprovada.</p><p>Fonte: {report.sourceCommit}; {report.license}. {report.attribution}. Hierarquia original preservada; cortes do visor em float32. Óstios, luz, trajeto completo e ponto do forame continuam sem comprovação.</p></details>
    <button disabled={busy||!!error} onClick={exportEvidence}>Exportar evidência da via</button>
    <button disabled={busy||!!error} onClick={()=>{setExpanded(false);onShowPlane({passageId:id,side,axis,offsetCm:offset,centerCm:centre as Point3});}}>Mostrar plano no atlas 3D</button>
  </section>;
}
