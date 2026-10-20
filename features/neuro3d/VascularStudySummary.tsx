import React,{useMemo} from "react";
import {vascularStudyFamily} from "./vascularStudyFamilies";

export default function VascularStudySummary({id,onSelect}:{id:string;onSelect:(id:string)=>void}) {
  const family=useMemo(()=>vascularStudyFamily(id),[id]);
  if(!family.hasBranches) return null;
  return <details className="nda-study-family" data-testid="vascular-study-family"><summary>Ramos e vias de estudo · {family.ids.size} malhas presentes · {family.missingIds.length} IDs ausentes</summary>
    <p>{family.relationNote}</p>
    <p>Isolar ramos de estudo mostra as malhas presentes e seu contexto vascular imediato. Ausências permanecem listadas; não são preenchidas pelo tronco. Osso, músculos e outros contextos não vasculares ficam ocultos durante o isolamento.</p>
    {family.rows.filter(row=>!row.root).map(row=><div key={`${row.layer}:${row.id}`} data-study-member={row.id}>
      <strong>{row.name}</strong>
      {row.ids.map(target=><button key={target} onClick={()=>onSelect(target)}>{target}{row.reconstructedIds.includes(target) ? " · didático não validado" : " · fonte em revisão"}</button>)}
      {!!row.missingIds.length && <p>Sem malha individual: {row.missingIds.join(", ")}</p>}
    </div>)}
    <small>Referências de cada identidade no painel Vasos e no Inventário. O agrupamento é de estudo; não é um grafo de fluxo.</small>
  </details>;
}
