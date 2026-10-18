import registry from "./diagram-registry.json";
import { openAnatomy } from "./openAnatomy";
import { reconstructedArteries } from "./reconstructedArteries";

/** Exact identity, never substring similarity or territorial proximity.
 * Conceptual relations do not modify procedural contrast/navigation graphs.
 */
export const diagramRegistry = registry;
export const anatomicalInventory = registry.entries.map((entry) => {
  const matches = (id: string) => entry.targets.some((target) => id === target || id === `${target}_l` || id === `${target}_r`);
  const imported = openAnatomy.structures.filter((structure) => matches(structure.id));
  const rebuilt = reconstructedArteries.filter((structure) => matches(structure.id));
  const structures = [...imported, ...rebuilt];
  const unrepresentedTarget = entry.targets.some((target) => !structures.some((structure) => structure.id === target || structure.id === `${target}_l` || structure.id === `${target}_r`));
  const unresolved = entry.kind === "figure-label" || entry.kind === "source-conflict";
  const status = unresolved ? "unresolved" : !structures.length ? "missing"
    : entry.partial || unrepresentedTarget ? "partial" : imported.length ? "imported" : "reconstructed";
  const relations = registry.relations.filter((relation) => relation.fromNumber === entry.number || relation.toNumber === entry.number);
  const geometryNote = status === "unresolved" ? "Divergência ou número sem definição na legenda. Correspondência geométrica não confirmada."
    : status === "partial" ? "Apenas parte da estrutura/rede tem representação. A conexão completa permanece pendente."
    : status === "imported" ? "Malha identificada; trajeto, óstio e relações não homologados."
    : status === "reconstructed" ? "Superfície didática; geometria e calibre não validados."
    : "Sem malha individual identificada; reconstrução e revisão pendentes.";
  return { ...entry, ids: unresolved ? [] : structures.map((item) => item.id), candidateIds: unresolved ? structures.map((item) => item.id) : [], status,
    geometryKinds: [...(imported.length ? ["imported"] : []), ...(rebuilt.length ? ["reconstructed"] : [])],
    relations, note: `${entry.note} ${geometryNote}`.trim(),
  };
});
export const inventoryStatus: Record<string, string> = {
  imported: "Malha importada", reconstructed: "Reconstrução didática", partial: "Representação parcial", missing: "Pendente", unresolved: "Identidade a reconciliar",
};
