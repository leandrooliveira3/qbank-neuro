import React, { useMemo, useState } from "react";
import { normalize } from "../../model";
import { deviceCatalogue, catalogueBehavior, catalogueFamilies, catalogueTools, type CatalogueChoice } from "./deviceCatalogue";
import type { Family, StationState } from "./engine";
export default function DeviceCatalogue({ state, onAdd, onKit, onUse }: {
  state: StationState; onAdd: (choice: CatalogueChoice) => void; onKit: (id: string) => void;
  onUse: (choice: CatalogueChoice, family?: Family, tool?: "wire" | "catheter" | "micro") => void;
}) {
  const [search, setSearch] = useState("");
  const options = useMemo(() => deviceCatalogue.records.flatMap((record) => record.products.map((product) => ({ record, product })))
    .filter(({ record, product }) => normalize(`${record.section} ${record.category} ${product}`).includes(normalize(search))), [search]);
  const [choiceKey, setChoiceKey] = useState("");
  const selected = options.find(({ record, product }) => `${record.id}:${product}` === choiceKey) ?? options[0];
  const [kitId, setKitId] = useState(deviceCatalogue.kits[0].id);
  const kit = deviceCatalogue.kits.find((item) => item.id === kitId)!;
  return <details className="nvs-catalogue"><summary>Catálogo de dispositivos e kits · {deviceCatalogue.records.length} classes / {deviceCatalogue.kits.length} kits</summary>
    <p>Dimensões representativas do catálogo fornecido. A seleção comercial não altera calibres ou valida compatibilidade por IFU. O comportamento disponível é indicado em cada item.</p>
    <label>Buscar dispositivo<input aria-label="Buscar dispositivo no catálogo" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Solitaire, Simmons, Onyx…" /></label>
    <label>Produto ou família<select aria-label="Produto do catálogo" value={selected ? `${selected.record.id}:${selected.product}` : ""} onChange={(event) => setChoiceKey(event.target.value)}>{options.length ? options.map(({ record, product }) => <option key={`${record.id}:${product}`} value={`${record.id}:${product}`}>{product} · {record.category}</option>) : <option value="">Nenhum resultado</option>}</select></label>
    {selected && <article data-testid="catalogue-device"><h4>{selected.product}</h4><p>{selected.record.category} · {selected.record.dimensions}</p><p>{selected.record.notes}</p><strong>{catalogueBehavior(selected.record.id)}</strong>
      <div className="nvs-movement"><button onClick={() => onAdd({ recordId: selected.record.id, product: selected.product })}>Adicionar à bancada</button>
        {(catalogueFamilies[selected.record.id] || catalogueTools[selected.record.id]) && <button onClick={() => onUse({recordId: selected.record.id, product: selected.product}, catalogueFamilies[selected.record.id], catalogueTools[selected.record.id] as "wire" | "catheter" | "micro" | undefined)}>Usar representação genérica</button>}</div></article>}
    <label>Kit por procedimento<select aria-label="Kit por procedimento" value={kitId} onChange={(event) => setKitId(event.target.value)}>{deviceCatalogue.kits.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
    <p>{kit.composition}</p><button onClick={() => onKit(kitId)}>Preparar bancada deste kit</button>
    {state.preparedKit && <p data-testid="prepared-kit">Kit preparado: {deviceCatalogue.kits.find((item) => item.id === state.preparedKit)?.name}. Escolha os produtos para compor a bancada.</p>}
    <ul aria-label="Dispositivos na bancada">{state.catalogueTray.map((choice) => <li key={`${choice.recordId}:${choice.product}`}>{choice.product} · {catalogueBehavior(choice.recordId)}</li>)}</ul>
    <small>Fonte: catálogo fornecido pelo usuário. Produtos, dimensões exatas, compatibilidade e disponibilidade precisam de conferência por referência comercial.</small>
  </details>;
}
