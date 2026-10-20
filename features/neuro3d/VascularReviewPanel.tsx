import React, {useMemo,useState} from "react";
import { vascularMeshReview, venousCoverage, vascularChecklist, vascularReviewCounts } from "./vascularReview";
import {maxillaryBranchReview} from "./maxillaryReview";
import {normalize} from "./model";
import VascularCompletenessPanel from "./VascularCompletenessPanel";

export default function VascularReviewPanel({onSelect}:{onSelect:(id:string)=>void}) {
  const [scope,setScope] = useState("complete"), [system,setSystem] = useState("all"), [query,setQuery] = useState("");
  const rows = useMemo(()=>vascularMeshReview.filter(row=>(system === "all" || row.layer === system) && normalize(`${row.name} ${row.id} ${row.note}`).includes(normalize(query))),[system,query]);
  const veins = useMemo(()=>venousCoverage.filter(row=>normalize(`${row.name} ${row.group}`).includes(normalize(query))),[query]);
  const maxillary = useMemo(()=>maxillaryBranchReview.filter(row=>normalize(row.name).includes(normalize(query))),[query]);
  return <div className="nda-diagram-index" data-testid="vascular-review">
    <h3>Revisão vascular integral</h3>
    <p className="nda-help">{vascularReviewCounts.importedArterial} malhas arteriais + {vascularReviewCounts.importedVenous} venosas na fonte; {vascularReviewCounts.reconstructed} reconstruções didáticas. {vascularReviewCounts.disputed} originais retirados por discrepância. Nenhuma aprovação anatômica é inferida do nome ou da integridade do arquivo.</p>
    <label>Lista<select aria-label="Escopo da revisão vascular" value={scope} onChange={e=>setScope(e.target.value)}><option value="complete">Matriz integral · exigências e ausências por lado</option><option value="meshes">Todas as malhas e reconstruções</option><option value="venous">Vasos venosos exigidos e ausências</option><option value="maxillary">Maxilar · ramos e origens</option></select></label>
    <label>Buscar vaso<input aria-label="Buscar na revisão vascular integral" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Galeno, faríngea, lingual…" /></label>
    {scope === "meshes" && <label>Sistema<select aria-label="Sistema da revisão vascular" value={system} onChange={e=>setSystem(e.target.value)}><option value="all">Arterial e venoso</option><option value="arterial">Arterial</option><option value="venous">Venoso</option></select></label>}
    {scope !== "complete" && <p role="status">{scope === "meshes" ? rows.length : scope === "maxillary" ? maxillary.length : veins.length} registros. Verificação de cada estrutura e de suas conexões em andamento.</p>}
    <details><summary>Critérios de conferência individual</summary>{vascularChecklist.map(label=><p key={label}>{label}: revisão pendente até registro específico.</p>)}</details>
    {scope === "complete" && <VascularCompletenessPanel query={query} onSelect={onSelect} />}
    {scope === "maxillary" && maxillary.map(row=><article key={row.key} data-maxillary-branch={row.key}>
      <span className="nda-review-status">{row.status === "missing" ? "Malha individual ausente" : row.status === "partial" ? "Cobertura parcial" : "Presente · origem/curso pendentes"}</span>
      {!!row.illustratedIds.length && <p className="nda-reconstruction-note">Inclui trajetos ilustrativos adicionais; anatomia e coordenadas não validadas.</p>}
      <h4>{row.name}</h4><small>Porção {row.segment.toLowerCase()}</small><p>{row.note}</p>
      {row.missing.length > 0 && <p>Sem geometria individual: {row.missing.join(", ")}</p>}
      {row.ids.map(id=><button key={id} onClick={()=>onSelect(id)}>{id}</button>)}<small>{row.reference}</small>
    </article>)}
    {scope === "meshes" ? rows.map(row=><article key={row.key} data-vascular-key={row.key}>
      <span className="nda-review-status">{row.status === "disputed" ? "Original contestado · retirado" : row.kind === "reconstructed" ? "Reconstrução · revisão pendente" : "Fonte · revisão pendente"}</span>
      <h4>{row.name}</h4><p>{row.note}</p><small>{row.layer === "venous" ? "Venoso" : "Arterial"} · {row.id}</small>
      {row.selectable && <button onClick={()=>onSelect(row.id)}>Inspecionar estrutura</button>}
      <a href={row.reference} target="_blank" rel="noreferrer">Referência do sistema</a>
    </article>) : scope === "venous" && veins.map(row=><article key={row.id} data-venous-requirement={row.id}>
      <span className="nda-review-status">{row.status === "missing" ? "Malha individual ausente" : row.status === "partial" ? "Cobertura parcial" : "Presente · anatomia pendente"}</span>
      {!!row.illustratedIds.length && <p className="nda-reconstruction-note">Inclui trajetos ilustrativos adicionais; anatomia e coordenadas não validadas.</p>}
      <h4>{row.name}</h4><small>{row.group}</small>
      {!!row.drainageTargets.length && <p>Drenagem/comunicações de referência: {row.drainageTargets.map(id=>venousCoverage.find(candidate=>candidate.id === id)?.name ?? id).join("; ")}. São destinos usuais ou alternativos; não se presume que coexistam nem que estejam conectados geometricamente.</p>}
      <p>Conferir trajeto, tributárias, drenagem, comunicações e variantes. Um coletor presente não substitui os seus afluentes. Uma variante não é obrigatória em todos os indivíduos.</p>
      {row.ids.map(id=><button key={id} onClick={()=>onSelect(id)}>{id}</button>)}
      <a href={row.reference} target="_blank" rel="noreferrer">Referência venosa</a>
    </article>)}
    <p className="nda-help">O índice arterial Neuroangio permanece em Inventário. A lista venosa é uma matriz de trabalho expansível; não é uma declaração de que todas as variantes já foram inventariadas ou reconstruídas.</p>
  </div>;
}
