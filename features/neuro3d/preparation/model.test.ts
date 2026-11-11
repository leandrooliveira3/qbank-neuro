import { describe, it, expect } from "vitest";
import {
  initial,
  metrics,
  blocks,
  validate,
  active,
  due,
  parseQuestions,
  csvQuestions,
  grade,
} from "./model";
import type { Session } from "./model";
const make = (p: Partial<Session> = {}): Session => ({
  id: "a",
  kind: "lesson",
  label: "7I",
  topic: "DCI",
  date: "2026-11-05",
  answers: "ABCDE",
  key: "ABCDE",
  validated: false,
  evidence: "",
  ...p,
});
describe("NRI evidence and historical metrics", () => {
  it("preserves 120 lessons, baseline and no inferred review dates", () => {
    expect(blocks.reduce((n, b) => n + b[1], 0)).toBe(120);
    expect(metrics(initial())).toEqual({
      lessons: 60,
      questions: 298,
      correct: 296,
    });
    expect(initial().cycles).toEqual([]);
  });
  it("excludes pending lessons, checkpoints and reviews from course metrics", () => {
    const s = initial();
    s.sessions = [
      make(),
      make({ kind: "review", id: "b", validated: true, evidence: "source" }),
      make({
        kind: "checkpoint",
        id: "c",
        validated: true,
        evidence: "source",
      }),
    ];
    expect(metrics(s)).toEqual(metrics(initial()));
  });
  it("retains the pending version and counts a validated lesson once", () => {
    const s = initial();
    s.sessions = [
      make(),
      make({ id: "b", supersedes: "a", validated: true, evidence: "source" }),
    ];
    expect(active(s)).toHaveLength(1);
    expect(s.sessions).toHaveLength(2);
    expect(metrics(s)).toEqual({ lessons: 61, questions: 303, correct: 301 });
  });
  it("rejects nonexistent/baseline/duplicate lessons and missing evidence", () => {
    expect(() => validate(make({ label: "14A" }), [])).toThrow();
    expect(() => validate(make({ label: "7H" }), [])).toThrow();
    expect(() => validate(make({ validated: true }), [])).toThrow();
    expect(() => validate(make(), [make({ id: "b" })])).toThrow();
  });
  it("requires all 30 CP2 responses before validated completion", () => {
    expect(() =>
      validate(
        make({
          kind: "checkpoint",
          label: "CP2",
          validated: true,
          evidence: "source",
        }),
        [],
      ),
    ).toThrow();
    expect(() =>
      validate(make({ kind: "checkpoint", label: "CP2" }), []),
    ).not.toThrow();
  });
  it("validates alphabet and lengths; computes offsets from D0", () => {
    expect(() => grade("ABC", "ABCDE")).toThrow();
    expect(() => grade("ABCDF", "ABCDE")).toThrow();
    expect(due("2026-11-29", 3)).toBe("2026-12-02");
    expect(due("2026-12-25", 14)).toBe("2027-01-08");
  });
  it("does not trust imported keys", () => {
    expect(
      parseQuestions(
        JSON.stringify([
          {
            stem: "Question",
            topic: "Test",
            options: ["a", "b", "c", "d", "e"],
            key: "A",
            validated: true,
          },
        ]),
      )[0].key,
    ).toBeUndefined();
    expect(() => parseQuestions("[{}]")).toThrow();
  });
  it("handles quoted multiline CSV", () => {
    expect(
      csvQuestions('stem,topic,A,B,C,D,E\n"Text,\nnext",Test,a,b,c,d,e')[0]
        .stem,
    ).toBe("Text,\nnext");
    expect(() => csvQuestions('stem,topic,A,B,C,D,E\n"broken')).toThrow();
  });
});
