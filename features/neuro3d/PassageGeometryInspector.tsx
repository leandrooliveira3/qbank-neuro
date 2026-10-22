import React,{useEffect,useRef,useState} from 'react';
import report from './passage-geometry-audit.json';
import skullEvidence from './skull-landmark-evidence.json';
import continuityEvidence from './contour-continuity-evidence.json';
import SkullBoundaryReview from './SkullBoundaryReview';
import {passageComponentReview,sourceAudit} from './passageComponentReview';
import {openAnatomy} from './openAnatomy';
import {reconstructedVessels} from './reconstructedVessels';
import {loadOriginalAtlasSurfaces} from './fullVascularSurface';
import {sectionAxes,sourceMetres,surfaceEvidenceBytes,type PassageSurface,type SurfaceSection,type Point3,type PassageInspectionPlane} from './passageGeometry';
import {sha256} from './comparison/geometry';
const names=new Map([...openAnatomy.structures,...reconstructedVessels].map(row=>[row.id,row.name]));
export default function PassageGeometryInspector({id,side,onSelect,onShowPlane}:{id:string;side:'l'|'r';onSelect:(id:string)=>void;onShowPlane:(plane:PassageInspectionPlane)=>void}){
  const route=report.routes.find(row=>row.id===id&&row.side===side)!;
  const candidates=skullEvidence.candidates.filter(c=>c.route===id&&c.side===side);
  const [centre,setCentre]=useState<Point3>(route.inspectionPoint as Point3),[witnessId,setWitnessId]=useState<string|null>(null);
  const [spanCm,setSpanCm]=useState(6);
  const witness=candidates.find(c=>c.id===witnessId);
  const continuity=continuityEvidence.v2.find(row=>row.side===side)!;
  const motorRoot=continuityEvidence.motorRoots.find(row=>row.id.endsWith(`_${side}`))!;
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
      for(const candidate of candidates){
        if(route.surfaces.find(s=>s.id===candidate.boneId)?.sha256!==candidate.boneSurfaceSHA256||route.surfaces.find(s=>s.id===candidate.nerveId)?.sha256!==candidate.nerveSurfaceSHA256)throw Error('Evidência óssea incompatível com as superfícies atuais.');
      }
      if(id==='rotundum'||id==='ovale')for(const source of continuityEvidence.sourceFiles)if(openAnatomy.assets.find(a=>a.file===source.file)?.sha256!==source.sha256)throw Error('Revisão de continuidade incompatível com a fonte atual.');
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
  const a=sectionAxes[axis],link=route.links[edge],points=[link.witness.from,link.witness.to] as Point3[],half=spanCm/2,scaleCm=spanCm>=6?1:spanCm>=2?.5:.2;
  function exportEvidence(){
    const evidence={schema:1,scope:'Atlas model passage geometry, not patient registration',baseCommit:report.baseCommit,sourceCommit:report.sourceCommit,license:report.license,attribution:report.attribution,
      coordinateSystem:report.coordinateSystem,sourceFiles:report.sourceFiles,route,plane:{axis,normalAxis:a.normal,offsetCm:offset,offsetSourceMetres:sourceMetres([a.normal===0?offset:0,a.normal===1?offset:0,a.normal===2?offset:0] as Point3)[a.normal]},
      selectedLink:edge,inspectionCenterCm:centre,fieldSpanCm:spanCm,reviewWitness:witness??null,componentReview:passageComponentReview[id],sourceLineageAudit:sourceAudit,sectionCounts:sections.map(s=>({id:s.id,origin:s.origin,segments:s.segments.length,coplanarTriangles:s.coplanarTriangles})),method:report.method,limitations:report.limitations,
      continuityReview:id==='rotundum'||id==='ovale'?{...continuityEvidence,v2:[continuity],motorRoots:[motorRoot]}:null,
      foramenPositionVerified:false,anastomosisLumenVerified:false};
    const url=URL.createObjectURL(new Blob([JSON.stringify(evidence,null,2)],{type:'application/json'}));
    const anchor=document.createElement('a');anchor.href=url;anchor.download=`via-${id}-${side}-evidencia.json`;anchor.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  return <section className={`nda-passage-inspector${expanded?' nda-passage-expanded':''}`} aria-label="Inspeção física da via" data-testid="passage-inspector" data-route={`${id}:${side}`}>
    <h4>Cortes e separações · {side==='l'?'esquerda':'direita'}</h4>
    <button aria-pressed={expanded} onClick={()=>setExpanded(v=>!v)}>{expanded?'Reduzir inspeção física':'Ampliar inspeção física'}</button>
    <p>Cortes das malhas originais e das ilustrações existentes, no mesmo espaço do atlas. O centro inicial acompanha um ramo; não identifica o forame. Sem transferência de rótulos entre datasets.</p>
    <details data-testid="passage-components"><summary>Componentes da via e comprovação de origem</summary>
      {passageComponentReview[id].roles.map(text=><p key={text}>{text}</p>)}
      <strong>Ainda sem comprovação:</strong>{passageComponentReview[id].missingOrUnverified.map(text=><p key={text}>{text}</p>)}
      <p>Auditoria dirigida: seis primitivas vasculares e transformações idênticas à fonte Anatria fixa; quatro rótulos ósseos não geraram geometria exportada. Não foi executado o Startup.blend.</p>
      {passageComponentReview[id].references.map(url=><a key={url} href={url} target="_blank" rel="noreferrer">Referência anatômica do componente</a>)}
    </details>
    {!!candidates.length&&<details data-testid="skull-evidence-controls"><summary>Evidência óssea dirigida de V2</summary><p>Contornos fechados do osso envolvendo toda a secção do nervo de origem, em dois planos por lado. Os pontos são bordas de triângulos do esfenoide, não centros do forame redondo. Nome anatômico e túnel3D continuam em revisão.</p>
      {candidates.map(c=><button key={c.id} data-skull-witness={c.id} disabled={busy||!!error} aria-pressed={witnessId===c.id} onClick={()=>{setWitnessId(c.id);setCentre(c.pointCm as Point3);setSpanCm(1);setAxis('z');setOffset(c.offsetCm);}}>{c.name}</button>)}
      <button onClick={()=>{setWitnessId(null);setCentre(route.inspectionPoint as Point3);setSpanCm(6);setAxis('y');setOffset(route.inspectionPoint[1]);}}>Voltar ao campo inicial do ramo</button>
    </details>}
    {id==='rotundum'&&<SkullBoundaryReview side={side} onShowPlane={onShowPlane}/>}
    {id==='rotundum'&&<details data-testid="contour-continuity"><summary>Hierarquia e continuidade amostrada de V2</summary>
      <p>21 cortes por lado, Z28–32 mm a cada 0,2 mm nominal. Em 18 níveis o perfil V2 está inteiramente contido; em 17 transições esses contornos compartilham faces originais. Nos níveis 31,6/31,8/32 mm não se demonstrou contenção integral.</p>
      <p>Os contornos internos têm orientação oposta ao contorno externo. Isso apoia a inspeção de uma cavidade, mas não certifica um forame. Bordas abertas por índices: {continuityEvidence.boneTopology.boundaryEdges}; após conferir costuras: {continuityEvidence.boneSeamDiagnostic.topology.boundaryEdges}. Não se fechou a malha; auto-interseções não foram verificadas.</p>
      <p>Selecione uma secção para conferir as malhas no plano físico. O ponto branco existente continua sendo uma borda, sem centro novo.</p>
      {continuity.sections.map(s=><button key={s.offsetCm} disabled={busy||!!error} data-continuity-level={s.offsetCm} aria-pressed={axis==='z'&&Math.abs(offset-s.offsetCm)<1e-7} onClick={()=>{const c=candidates[0];setWitnessId(c.id);setCentre(c.pointCm as Point3);setSpanCm(1);setAxis('z');setOffset(s.offsetCm);}}>{(s.offsetCm*10).toFixed(1)} mm · {s.matches.some(m=>m.containerIndex!==null)?'perfil contido':'contenção não demonstrada'}</button>)}
      <p>Winding por ângulo sólido é diagnóstico em ponto de sondagem matemático, não centro anatômico ou certificação de espaço vazio. Túnel completo e passagem arterial continuam sem comprovação.</p>
    </details>}
    {id==='ovale'&&<details data-testid="motor-root-context"><summary>Raiz motora original · limite do contexto do oval</summary>
      <p>Identidade de origem: {motorRoot.id}. {motorRoot.topology.vertices} vértices e {motorRoot.topology.faces} faces. Extensão Z de {(motorRoot.boundsCm[2][0]*10).toFixed(2)} a {(motorRoot.boundsCm[2][1]*10).toFixed(2)} mm nominais; não representa o percurso completo até o oval.</p>
      <p>Separação garantida pelas caixas espaciais até o esfenoide: {(motorRoot.boneAabbLowerBoundCm*10).toFixed(3)} mm nominais. Nos nove cortes do segmento não há interseção com o esfenoide; não prova ausência do forame. Raiz motora, tronco sensitivo V3 e divisões mandibulares são contextos distintos; não foram assimilados ou conectados.</p>
      <button onClick={()=>onSelect(motorRoot.id)}>Selecionar raiz motora de origem</button>
    </details>}
    {witness&&<div data-testid="skull-witness-status"><p>Borda óssea em revisão · triângulo {witness.sourceTriangle}. Contenção seccional comprovada; identidade do forame e passagem arterial não comprovadas. Cruz branca: ponto na borda, não centro do forame.</p><details><summary>Distância desta borda aos ramos ilustrativos</summary>{witness.relatedArterialDistances.map(d=><p key={d.id}>{names.get(d.id)}: {(d.pointToAllTrianglesDistanceCm*10).toFixed(2)} mm nominais do ponto a todas as faces do ramo. Não é medida de lúmen ou distância global entre superfícies.</p>)}</details></div>}
    <label>Plano de inspeção<select aria-label="Plano de inspeção" value={axis} onChange={e=>{const next=e.target.value as typeof axis;setAxis(next);setOffset(centre[sectionAxes[next].normal]);}}>{Object.entries(sectionAxes).map(([key,value])=><option value={key} key={key}>{value.label}</option>)}</select></label>
    <label>Posição do corte · {(offset*10).toFixed(2)} mm nominais<input aria-label="Posição do corte da via" type="range" min={centre[a.normal]-3} max={centre[a.normal]+3} step={.01} value={offset} onChange={e=>setOffset(Number(e.target.value))}/></label>
    <label>Campo da inspeção<select aria-label="Campo da inspeção" value={spanCm} onChange={e=>setSpanCm(Number(e.target.value))}><option value={6}>60 mm</option><option value={2}>20 mm</option><option value={1}>10 mm</option></select></label>
    <p>Referencial: X/Y/Z do atlas, Y superior; não são eixos DICOM. Campo de {spanCm*10} × {spanCm*10} mm nominais. Osso cinza; nervo violeta; vaso original vermelho; ramo ilustrativo laranja tracejado.</p>
    {error?<div role="alert">{error}<button onClick={()=>setAttempt(n=>n+1)}>Tentar abrir cortes novamente</button></div>:<>
      <div role="status">{busy?'Calculando corte original…':`${sections.reduce((n,s)=>n+s.segments.length,0)} segmentos de interseção calculados.`}</div>
      <svg role="img" aria-label={`Corte físico da via ${id}`} viewBox={`${-half} ${-half} ${spanCm} ${spanCm}`} data-testid="passage-section" data-busy={String(busy)} data-axis={axis} data-offset-cm={offset} style={{visibility:busy?'hidden':'visible'}}>
        <defs><clipPath id={`clip-${id}-${side}`}><rect x={-half} y={-half} width={spanCm} height={spanCm}/></clipPath></defs>
        <g clipPath={`url(#clip-${id}-${side})`}>
          {sections.map(s=><path key={s.id} data-surface-id={s.id} data-origin={s.origin} data-segments={s.segments.length} d={s.segments.map(([p,q])=>`M${p[a.u]-centre[a.u]},${centre[a.v]-p[a.v]}L${q[a.u]-centre[a.u]},${centre[a.v]-q[a.v]}`).join(' ')} fill="none" stroke={s.layer==='bone'?'#a7b6c1':s.layer==='nerve'?'#bd9cef':s.origin==='imported'?'#ff7389':'#ffbe55'} strokeWidth={spanCm/500} strokeDasharray={s.origin==='illustrative'?`${spanCm/150} ${spanCm/200}`:undefined}/>)}
          {points.map((p,i)=><circle key={i} data-witness={i} cx={p[a.u]-centre[a.u]} cy={centre[a.v]-p[a.v]} r={.055} fill={Math.abs(p[a.normal]-offset)<.001?['#5df5e5','#ff78dc'][i]:'none'} stroke={['#5df5e5','#ff78dc'][i]} strokeWidth={.02}/>)}
          {witness&&axis==='z'&&Math.abs(offset-witness.offsetCm)<1e-7&&<>
            <path data-testid="bone-evidence-contour" d={witness.boneContour.points.map((p,i)=>`${i?'L':'M'}${p[a.u]-centre[a.u]},${centre[a.v]-p[a.v]}`).join(' ')+'Z'} fill="none" stroke="#65f8ef" strokeWidth={spanCm/240}/>
            <path d={witness.nerveContour.points.map((p,i)=>`${i?'L':'M'}${p[a.u]-centre[a.u]},${centre[a.v]-p[a.v]}`).join(' ')+'Z'} fill="none" stroke="#d2a1ff" strokeWidth={spanCm/240}/>
          </>}
          {witness&&Math.abs(offset-witness.pointCm[a.normal])<1e-7&&<path d={`M${-spanCm/100},0h${spanCm/50}M0,${-spanCm/100}v${spanCm/50}`} stroke="white" strokeWidth={spanCm/375}/>}
        </g>
        <path d={`M${-half*.9},${half*.9}h${scaleCm}`} stroke="white" strokeWidth={spanCm/300}/><text x={-half*.9} y={half*.86} fill="white" fontSize={spanCm/46}>{scaleCm*10} mm nominais</text>
      </svg>
      <p>Círculos: projeções dos dois pontos comparados, sem linha de ligação. Vazados quando fora do corte. Triângulos coplanares omitidos: {sections.reduce((n,s)=>n+s.coplanarTriangles,0)}; corte vazio não prova ausência do vaso.</p>
    </>}
    <label>Elo bibliográfico<select aria-label="Elo bibliográfico da inspeção" value={edge} onChange={e=>setEdge(Number(e.target.value))}>{route.links.map((l,i)=><option key={i} value={i}>{names.get(l.from)} ↔ {names.get(l.to)}</option>)}</select></label>
    <p data-testid="passage-distance">Separação mínima garantida pelos limites espaciais: <strong>{(link.aabbLowerBoundCm*10).toFixed(3)} mm nominais</strong>. Distância encontrada na amostra: {(link.sampledUpperBoundCm*10).toFixed(3)} mm. O mínimo global pode ser menor que a amostra. Valor zero não comprova contato ou luz contínua.</p>
    <button onClick={()=>onSelect(link.from)}>Selecionar primeiro vaso</button><button onClick={()=>onSelect(link.to)}>Selecionar segundo vaso</button>
    <details><summary>Proveniência e limites desta medição</summary><p>{link.fromOrigin==='imported'?'Primeira superfície importada':'Primeira superfície ilustrativa'}; {link.toOrigin==='imported'?'segunda importada':'segunda ilustrativa'}.32vértices determinísticos da primeira superfície comparados com todos os triângulos não degenerados da segunda. Triângulo alvo {link.witness.targetTriangle}; não é correspondência anatômica comprovada.</p><p>Fonte: {report.sourceCommit}; {report.license}. {report.attribution}. Hierarquia original preservada; cortes do visor em float32. Óstios, luz, trajeto completo e ponto do forame continuam sem comprovação.</p></details>
    <button disabled={busy||!!error} onClick={exportEvidence}>Exportar evidência da via</button>
    <button disabled={busy||!!error} onClick={()=>{setExpanded(false);onShowPlane({passageId:id,side,axis,offsetCm:offset,centerCm:centre,spanCm,reviewWitness:witness?{id:witness.id,pointCm:witness.pointCm as Point3,sourceTriangle:witness.sourceTriangle}:undefined});}}>Mostrar plano no atlas 3D</button>
  </section>;
}
