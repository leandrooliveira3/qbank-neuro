import React,{useEffect,useRef,useState} from 'react';
import type {VendorCrops} from './vendorCrops';
export default function GsCaVendorCrops({worker,detector,onApply}:{worker:Worker;detector:string;onApply:(crops:VendorCrops)=>void}){
 const [pending,setPending]=useState(false),[error,setError]=useState(''),[crops,setCrops]=useState<VendorCrops>();const sequence=useRef(0);
 useEffect(()=>{const listener=(e:MessageEvent)=>{const r=e.data;if(r.sequence!==sequence.current)return;if(r.kind==='vendorCrops'){setCrops(r.crops);setPending(false);}else if(r.kind==='error'&&r.requestKind==='vendorCrops'){setError(r.error);setPending(false);}};worker.addEventListener('message',listener);return()=>worker.removeEventListener('message',listener);},[worker]);
 return <section aria-label="Recortes originais GS-CA"><h3>Recortes do XLS original</h3><p>Guia GS-CA, páginas 8–9: mínimos e máximos inclusivos X/Y/Z, índices zero; ROI AP/LAT também em pixels zero. Somente a versão conferida do XLS é aceita, vinculada aos hashes do volume e cabeçalhos. Somente recortes são utilizados; fórmulas e macros não são executadas.</p><input aria-label="Importar XLS original GS-CA" type="file" accept=".xls" disabled={pending} onChange={e=>{const file=e.target.files?.[0];e.target.value='';if(!file)return;setError('');setCrops(undefined);setPending(true);worker.postMessage({kind:'vendorCrops',sequence:++sequence.current,file});}}/>
 <button onClick={()=>{++sequence.current;setPending(false);setCrops(undefined);setError('');}}>Limpar prévia do XLS</button>
 {pending&&<p role="status">Conferindo XLS e vínculo com o caso…</p>}{error&&<p role="alert">{error}</p>}
 {crops&&<><p data-testid="gsca-vendor-preview">{crops.sheet} · VOI {crops.voi.join(' ')} · ROI {crops.rois[detector]?.join(' ')??'sem detector'} · zero inclusivo · SHA-256 {crops.sha256}</p><button onClick={()=>onApply(crops)}>Aplicar recortes da fonte</button></>}
 </section>;
}
