import React,{useState} from 'react';
import {dangerousAnastomoses} from './dangerousAnastomoses';
import {openAnatomy} from './openAnatomy';
import {reconstructedVessels} from './reconstructedVessels';
const structures=[...openAnatomy.structures,...reconstructedVessels];
const byId=new Map(structures.map(x=>[x.id,x]));
const labelFor=(id:string)=>byId.get(id)?.name ?? (id === 'falcotentorial_dural_branches_of_pca' ? 'Ramos durais falcotentoriais da artéria cerebral posterior' : id.replaceAll('_',' '));
export function connectionIds(vessels:string[],side:string){return vessels.map(id=>byId.has(`${id}_${side}`)?`${id}_${side}`:id);}
export default function DangerousAnastomosesPanel({onExplore}:{onExplore:(key:string,ids:string[])=>void}){
 const [region,setRegion]=useState('Todas'),[side,setSide]=useState('l'),[search,setSearch]=useState('');
 return <><h3>Anastomoses perigosas · 25 vias de estudo</h3><p>Embolização não alvo pode comprometer visão, cérebro, medula ou nervos cranianos. As relações abaixo orientam estudo anatômico; não comprovam patência, sentido do fluxo ou segurança de uma intervenção.</p>
 <label>Região<select aria-label="Região das anastomoses" value={region} onChange={e=>setRegion(e.target.value)}>{['Todas',...new Set(dangerousAnastomoses.map(x=>x.region))].map(x=><option key={x}>{x}</option>)}</select></label>
 <label>Lado<select aria-label="Lado das anastomoses" value={side} onChange={e=>setSide(e.target.value)}><option value="l">Esquerdo</option><option value="r">Direito</option></select></label>
 <label>Buscar via<input aria-label="Buscar anastomose" value={search} onChange={e=>setSearch(e.target.value)}/></label>
 {dangerousAnastomoses.filter(x=>(region==='Todas'||region===x.region)&&`${x.name} ${x.landmark} ${x.risk}`.toLocaleLowerCase().includes(search.toLocaleLowerCase())).map(row=>{const ids=connectionIds(row.vessels,side),missing=ids.filter(id=>!byId.has(id));return <article key={row.id}><h4>{row.name}</h4><p>Marco: {row.landmark}. Em risco: {row.risk}.</p><p>{row.review}</p><small>Continuidade geométrica não verificada. Explorar apenas isola os vasos disponíveis; não cria pontes nem vias navegáveis.</small>{!!missing.length&&<p>Sem representação individual: {missing.map(labelFor).join(', ')}.</p>}<details><summary>Vasos envolvidos e fonte</summary>{ids.map(id=><p key={id}>{labelFor(id)}</p>)}<a href={row.reference} target="_blank" rel="noreferrer">Revisão anatômica de referência</a></details><button onClick={()=>onExplore(`${row.id}:${side}`,ids.filter(id=>byId.has(id)))}>Explorar vasos desta via</button></article>;})}</>;
}
