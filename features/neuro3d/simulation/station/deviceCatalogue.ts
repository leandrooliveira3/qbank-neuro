import data from "./device-catalogue.json";
import type { Family, Tool } from "./engine";
export const deviceCatalogue = data;
export type CatalogueRecord = typeof data.records[number];
export interface CatalogueChoice { recordId: string; product: string }
export const catalogueFamilies: Record<string, Family> = {
  s2r1: "retriever", s2r2: "retriever", s2r3: "retriever", s2r4: "aspiration",
  s3r1: "stent", s3r2: "protection", s3r4: "balloon", s5r1: "coil", s5r5: "flow-diverter",
};
export const catalogueTools: Record<string, Tool> = { s1r3: "catheter", s1r4: "wire", s1r5: "catheter", s1r8: "wire", s1r9: "micro" };
export function validCatalogueChoice(choice: CatalogueChoice) {
  return data.records.some((record) => record.id === choice.recordId && record.products.includes(choice.product));
}
export function catalogueBehavior(id: string) {
  return catalogueFamilies[id] ? "Representação genérica da classe" : catalogueTools[id] ? "Navegação com instrumento genérico" : "Catalogado · comportamento específico pendente";
}
