import React, { useMemo, useState } from "react";
import { anatomicalInventory, diagramRegistry, inventoryStatus } from "./anatomicalInventory";
import { openAnatomy } from "./openAnatomy";
import { reconstructedArteries } from "./reconstructedArteries";
import { normalize } from "./model";

const structureNames = new Map([...openAnatomy.structures, ...reconstructedArteries].map((structure) => [structure.id, structure.name]));
const relationNames: Record<string, string> = { anastomosis: "Anastomose descrita", "variant-connection": "Conexão de variante", "group-member": "Membro do grupo" };

export default function DiagramInventory({ onSelect }: { onSelect: (id: string) => void }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const rows = useMemo(() => {
    const needle = normalize(query.trim());
    return anatomicalInventory.filter((row) => (status === "all" || row.status === status)
      && (!needle || (/^\d+[a-z]?$/.test(needle) ? row.number === needle
        : normalize(`${row.number} ${row.label} ${row.portuguese} ${row.note}`).includes(needle))));
  }, [query, status]);
  return <div className="nda-diagram-index" data-testid="diagram-inventory">
    <h3>Correspondência com o Neuroangio</h3>
    <p className="nda-help">{diagramRegistry.entries.filter((row) => row.sourceEvidence === "legend").length} entradas da legenda atual, 6 números apenas nas figuras e 6 referências supra-aórticas adicionais. Revisão de identidade e rede; geometria ainda não homologada.</p>
    <a href={diagramRegistry.sourceUrl} target="_blank" rel="noreferrer">Abrir diagramas e legenda de referência</a>
    <label className="nda-search-label">Buscar número ou estrutura<input aria-label="Buscar no diagrama Neuroangio" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="109, hipofisária, etmoidal…" /></label>
    <label>Representação<select aria-label="Filtrar cobertura do diagrama" value={status} onChange={(event) => setStatus(event.target.value)}>
      <option value="all">Todas ({anatomicalInventory.length})</option>
      {Object.entries(inventoryStatus).map(([key, label]) => <option key={key} value={key}>{label} ({anatomicalInventory.filter((row) => row.status === key).length})</option>)}
    </select></label>
    <p role="status">{rows.length} entradas encontradas</p>
    {(query || status !== "all") && <button onClick={() => { setQuery(""); setStatus("all"); }}>Mostrar todo o índice</button>}
    {rows.map((row) => <article key={row.key} data-diagram-key={row.key}>
      <span className="nda-review-status">{inventoryStatus[row.status]}</span>
      {row.geometryKinds.includes("reconstructed") && row.status === "partial" && <small>Inclui reconstrução didática não validada</small>}
      <h4>{row.number} · {row.portuguese}</h4>
      {row.label !== row.portuguese && <small>{row.label}</small>}
      <p>{row.note}</p>
      {row.ids.map((id) => <button key={id} onClick={() => onSelect(id)}>{structureNames.get(id)}</button>)}
      {row.parent && <p><small>Origem/contexto de referência: {anatomicalInventory.filter((item) => item.number === row.parent && item.sourceEvidence !== "figure-only").map((parent) => <button key={parent.key} onClick={() => { setQuery(parent.number); setStatus("all"); }}>{parent.number} · {parent.portuguese}</button>)}</small></p>}
      {row.relations.length > 0 && <details><summary>Rede e relações descritas ({row.relations.length})</summary>
        <p className="nda-help">Relações bibliográficas. Presença das extremidades não comprova continuidade geométrica, calibre ou sentido de fluxo.</p>
        {row.relations.map((relation, index) => {
          const number = relation.fromNumber === row.number ? relation.toNumber : relation.fromNumber;
          return <div key={index}><small>{relationNames[relation.kind]}</small><p>{relation.note}</p>
            <button onClick={() => { setQuery(number); setStatus("all"); }}>Ver item {number}</button>{" "}
            <a href={relation.reference} target="_blank" rel="noreferrer">Referência da relação</a>
          </div>;
        })}
      </details>}
      <a href={row.reference} target="_blank" rel="noreferrer">Referência anatômica</a>
    </article>)}
  </div>;
}
