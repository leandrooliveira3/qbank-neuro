import React,{useEffect,useRef,useState} from 'react';
import type {LocalGeometry} from './reader';
import type {Box3i} from './geometry';
import {surfacePlan,type SurfacePreview} from './surface';
export default function GsCaSurfaceControls({worker,meta,voi,onSurface,preset}:{worker:Worker;meta:LocalGeometry;voi:Box3i;onSurface:(surface:SurfacePreview|undefined)=>void;preset?:{token:number;threshold:number;detail:60|90}}){
 const [threshold,setThreshold]=useState(String(Math.round((meta.minimum+meta.maximum)/2))),[detail,setDetail]=useState<60|90>(60),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const sequence=useRef(0),voiKey=JSON.stringify(voi);
 useEffect(()=>{if(preset){++sequence.current;setBusy(false);setThreshold(String(preset.threshold));setDetail(preset.detail);}},[preset]);
 useEffect(()=>{++sequence.current;setBusy(false);setError('');onSurface(undefined);},[voiKey,threshold,detail,onSurface]);
 useEffect(()=>{const listener=(e:MessageEvent)=>{const r=e.data;if(r.sequence!==sequence.current)return;if(r.kind==='surface'){setBusy(false);onSurface(r);}else if(r.kind==='error'&&r.requestKind==='surface'){setBusy(false);setError(r.error);onSurface(undefined);}};worker.addEventListener('message',listener);return()=>worker.removeEventListener('message',listener);},[worker,onSurface]);
 let plan:ReturnType<typeof surfacePlan>|undefined;try{plan=surfacePlan(meta.volume,voi,detail);}catch{}
 return <section aria-label="Prévia vascular local"><h3>Prévia de superfície em Sw</h3><p>Limiar sobre intensidade original, sem identificação automática de vasos. Amostragem pode perder ramos finos; limites da VOI ficam abertos, sem tampas artificiais. Linhas amarelas nos cortes mostram a interseção da mesma malha.</p>
 <label>Limiar da superfície<input type="number" aria-label="Limiar da superfície" value={threshold} onChange={e=>setThreshold(e.target.value)}/></label><label>Resolução da prévia<select aria-label="Resolução da prévia" value={detail} onChange={e=>setDetail(Number(e.target.value) as 60|90)}><option value={60}>Rápida · até 60 intervalos</option><option value={90}>Detalhada · até 90 intervalos</option></select></label>
 <p>Passo máximo: {plan?.stride??'—'} voxel(s) · grade {plan?.sampleDimensions.join(' × ')??'inválida'} · memória adicional estimada {plan?Math.ceil(plan.estimatedWorkingBytes/1e6):'—'} MB; estimativa, não medição de pico. Última amostra inclui cada limite da VOI. Limite: 150 mil triângulos.</p>
 <button disabled={busy||!plan} onClick={()=>{setError('');onSurface(undefined);setBusy(true);worker.postMessage({kind:'surface',sequence:++sequence.current,voi,threshold:threshold.trim()===''?NaN:Number(threshold),detail});}}>Gerar prévia vascular</button><button onClick={()=>{++sequence.current;setBusy(false);onSurface(undefined);}}>Descartar superfície</button>{busy&&<p role="status">Gerando superfície local…</p>}{error&&<p role="alert">{error}</p>}</section>;
}
