import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { PropertyBinding } from "three";
import {
  data,
  exportQuestions,
  findStructures,
  modelUrl,
  models,
  parseProgress,
  visibleStructures,
} from "./model";
import topology from "./bouthillier.json";
import traceability from "./traceability.json";
const root = new URL("../../public/neuro3d/models/", import.meta.url);
function glb(file: string) {
  const b = readFileSync(new URL(file, root));
  expect(b.toString("utf8", 0, 4)).toBe("glTF");
  expect(b.readUInt32LE(8)).toBe(b.length);
  return JSON.parse(b.toString("utf8", 20, 20 + b.readUInt32LE(12)));
}
describe("contract of atlas and original GLBs", () => {
  it("preserves all scientific records and non-homologated status", () => {
    expect(data.index).toHaveLength(126);
    expect(traceability.estruturas).toHaveLength(126);
    expect(data.index.every((i) => !i.approved)).toBe(true);
    expect(models).toHaveLength(31);
    expect(Object.keys(data.scenes)).toHaveLength(12);
  });
  it("resolves each GLB mesh to exactly one visible stable identifier", () => {
    for (const m of models) {
      const stage =
        m.scene === "embryo" ? Number(m.configuration.slice(-1)) - 1 : 1;
      const objects = visibleStructures(m.scene, m.configuration, stage);
      const doc = glb(m.file);
      const meshNodes = doc.nodes.filter(
        (n: { mesh?: number }) => n.mesh !== undefined,
      );
      expect(meshNodes.length, m.file).toBe(objects.length);
      for (const n of meshNodes) {
        expect(
          objects.filter(
            (o) =>
              PropertyBinding.sanitizeNodeName(o.name) ===
              PropertyBinding.sanitizeNodeName(n.name),
          ),
          m.file + ":" + n.name,
        ).toHaveLength(1);
      }
      expect(modelUrl(m.scene, m.configuration, stage)).toContain(m.file);
    }
  });
  it("has finite coordinates, sources and unique ids", () => {
    const all = Object.values(data.scenes).flat();
    expect(new Set(all.map((o) => o.id)).size).toBe(all.length);
    for (const o of all) {
      expect(o.points.length).toBeGreaterThan(1);
      expect(o.points.flat().every(Number.isFinite)).toBe(true);
      expect(o.references.length).toBeGreaterThan(0);
      for (const r of o.references) expect(data.sources[r]).toBeTruthy();
    }
  });
  it("preserves Bouthillier continuity and independent embryologic numbering", () => {
    const segments = data.scenes.aci.filter((o) => /^ICA-C[1-7]$/.test(o.id));
    expect(segments.map((o) => o.id)).toEqual(
      Array.from({ length: 7 }, (_, i) => `ICA-C${i + 1}`),
    );
    for (let i = 1; i < segments.length; i++)
      expect(segments[i - 1].points.at(-1)).toEqual(segments[i].points[0]);
    expect(topology.segmentos).toHaveLength(7);
    expect(topology.segmentos[5].proximo.toLowerCase()).toContain(
      "anel dural distal",
    );
  });
  it("filters layers and variants instead of moving unrelated objects", () => {
    expect(visibleStructures("arch", "normal", 1, [])).toEqual([]);
    expect(visibleStructures("arch", "normal", 1).map((o) => o.id)).not.toEqual(
      visibleStructures("arch", "aberrantR", 1).map((o) => o.id),
    );
    expect(visibleStructures("embryo", "normal", 0).length).not.toBe(
      visibleStructures("embryo", "normal", 3).length,
    );
  });
  it("finds accented and variant-only structures across scenes", () => {
    const found = findStructures("oftalmica");
    expect(found.length).toBeGreaterThan(0);
    expect(found.some((o) => o.scene === "orbit")).toBe(true);
  });
  it("exports valid questions compatible with the existing importer", () => {
    const qs = exportQuestions();
    expect(qs).toHaveLength(25);
    for (const q of qs) {
      expect(q.alternativas.length).toBeGreaterThan(1);
      expect(q.alternativas[q.gabarito.charCodeAt(0) - 65]).toBeTruthy();
      expect(q.fontes.every(Boolean)).toBe(true);
    }
  });
  it("rejects malformed progress and recalculates correctness on import", () => {
    expect(() => parseProgress("{}")).toThrow();
    expect(() => parseProgress("{")).toThrow();
    const q = data.questions[0];
    const p = parseProgress(
      JSON.stringify({
        version: 1,
        visited: ["arch", "fake"],
        answers: {
          [q.id]: {
            answer: q.correct,
            correct: false,
            at: "2026-10-16T12:00:00Z",
          },
          evil: { answer: 1 },
        },
      }),
    );
    expect(p.answers[q.id].correct).toBe(true);
    expect(p.visited).toEqual(["arch"]);
    expect(p.answers.evil).toBeUndefined();
  });
});
