import React, {useMemo,useState} from "react";
import {vascularCompleteness,vascularCompletenessCounts,unmappedVascularDiagramEntries} from "./vascularCompleteness";
import {normalize} from "./model";

const groups=[...new Set(vascularCompleteness.map(row=>row.group))].sort((a,b)=>a.localeCompare(b,"pt-BR"));
export default function VascularCompletenessPanel({query,onSelect}:{query:string;onSelect:(id:string)=>void}) {
  const [system,setSystem]=useState("all"),[group,setGroup]=useState("all"),[status,setStatus]=useState("all");
  const rows=useMemo(()=>vascularCompleteness.filter(row=>
    (system === "all" || row.layer === system) && (group === "all" || row.group === group) &&
    (status === "all" || (status === "gaps" ? row.missingIds.length > 0 : row.status === status)) &&
    normalize(`${row.name} ${row.id} ${row.group} ${row.expectedIds.join(" ")}`).includes(normalize(query))),[system,group,status,query]);
  const unmapped=unmappedVascularDiagramEntries.filter(row=>normalize(`${row.label} ${row.number}`).includes(normalize(query)));
  return <section aria-label="Matriz de completude vascular">
    <p>{vascularCompletenessCounts.requirements} identidades/grupos: {vascularCompletenessCounts.missing} sem malha individual, {vascularCompletenessCounts.partial} parciais e {vascularCompletenessCounts.presentUnverified} presentes sem homologação anatômica. As {vascularCompletenessCounts.missingIndividualIds} identidades geométricas ausentes incluem a discriminação por lado.</p>
    <label>Sistema<select aria-label="Sistema da matriz vascular" value={system} onChange={e=>setSystem(e.target.value)}><option value="all">Arterial e venoso</option><option value="arterial">Arterial</option><option value="venous">Venoso</option></select></label>
    <label>Região ou família<select aria-label="Região da matriz vascular" value={group} onChange={e=>setGroup(e.target.value)}><option value="all">Todas as regiões e famílias</option>{groups.map(value=><option key={value} value={value}>{value}</option>)}</select></label>
    <label>Cobertura<select aria-label="Cobertura da matriz vascular" value={status} onChange={e=>setStatus(e.target.value)}><option value="all">Todas</option><option value="gaps">Qualquer ausência individual</option><option value="missing">Sem malha individual</option><option value="partial">Parcial</option><option value="present-unverified">Presente · anatomia pendente</option></select></label>
    <p role="status">{rows.length} identidades/grupos nesta busca.</p>
    {system !== "venous" && group === "all" && status === "all" && <details><summary>Legenda sem correspondência explícita ({unmapped.length} nesta busca)</summary>
      <p>Entradas sobrepostas a exigências nomeadas ou com identidade/ramo ainda não conciliado. Não entram como vasos novos nos totais; não foram descartadas da revisão.</p>
      {unmapped.map(row=><p key={row.key}><a href={row.reference} target="_blank" rel="noreferrer">{row.number} · {row.portuguese}</a> — {row.note || "Exige correspondência individual; não há alvo geométrico explícito."}</p>)}
    </details>}
    {rows.map(row=><article key={`${row.layer}:${row.id}`} data-vascular-requirement={`${row.layer}:${row.id}`}>
      <span className="nda-review-status">{row.status === "missing" ? "Malha individual ausente" : row.status === "partial" ? "Cobertura parcial" : "Presente · anatomia pendente"}</span>
      <h4>{row.name}</h4><small>{row.layer === "arterial" ? "Arterial" : "Venoso"} · {row.group}</small>
      <p>{row.note}</p>
      {row.findings.map(finding=><p className="nda-reconstruction-note" key={finding}>{finding}</p>)}
      {row.missingIds.length > 0 && <p>Sem identidade geométrica individual: {row.missingIds.join(", ")}</p>}
      {row.ids.map(id=><button key={id} onClick={()=>onSelect(id)}>{id}{row.reconstructedIds.includes(id) ? " · reconstrução didática não validada" : " · fonte não homologada"}</button>)}
      <details><summary>Fontes desta exigência</summary>{row.references.map(reference=>reference.startsWith("https://") ? <a key={reference} href={reference} target="_blank" rel="noreferrer">{reference}</a> : <p key={reference}>{reference}</p>)}</details>
    </article>)}
    <p className="nda-help">Matriz expansível de exigências e identidades. Não certifica exaustividade de variantes, capilares, vasa nervorum ou níveis medulares. Um ramo sem malha individual pode estar agrupado em outra superfície; isso exige inspeção antes de adicionar geometria. Os rótulos não criam conexões no simulador.</p>
  </section>;
}
