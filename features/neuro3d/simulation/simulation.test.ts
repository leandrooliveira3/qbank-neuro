import { describe, expect, it } from "vitest";
import { catalogue, embedUrl } from "./catalogue";
import { trainingCases } from "./cases";
import { Device, initialSession, requiredChecks, transition } from "./engine";
import { pointOnRoute, projected } from "./geometry";
import { data } from "../model";
describe("public Mentice catalogue", () => {
  it("accounts for all 165 public uploads and every inclusion/exclusion", () => {
    expect(catalogue.complete).toBe(true);
    expect(catalogue.total_scanned).toBe(165);
    expect(catalogue.videos.length + catalogue.excluded.length).toBe(165);
    const all = [...catalogue.videos, ...catalogue.excluded];
    expect(new Set(all.map((v) => v.id)).size).toBe(165);
    expect(catalogue.videos).toHaveLength(55);
  });
  it("uses verified publisher ids, public embed permission and canonical links", () => {
    for (const v of catalogue.videos) {
      expect(v.channel_id).toBe(catalogue.channel_id);
      expect(v.author).toBe("Mentice");
      expect(v.metadata_checked).toBe(true);
      expect(v.embed_allowed).toBe(true);
      expect(v.url).toBe("https://www.youtube.com/watch?v=" + v.id);
      expect(embedUrl(v.id)).toContain("youtube-nocookie.com/embed/");
    }
    expect(() => embedUrl("../fake")).toThrow();
  });
  it("every case links to verified videos, a scene and bibliographic sources", () => {
    expect(trainingCases).toHaveLength(8);
    for (const c of trainingCases) {
      expect(data.scenes[c.scene]).toBeTruthy();
      for (const id of c.videoIds)
        expect(
          catalogue.videos.find((v) => v.id === id),
          id,
        ).toBeTruthy();
      for (const s of c.sources) expect(data.sources[s]).toBeTruthy();
      expect(c.question.options[c.question.correct]).toBeTruthy();
    }
  });
});
describe("simulation task progression", () => {
  it("does not advance without requested family, position and checks", () => {
    let s = transition(initialSession(), { type: "start" }, "coil");
    s = transition(s, { type: "device", device: "stent" }, "coil");
    expect(transition(s, { type: "next" }, "coil").phase).toBe("selection");
    s = transition(s, { type: "device", device: "coil" }, "coil");
    s = transition(s, { type: "next" }, "coil");
    expect(transition(s, { type: "next" }, "coil").phase).toBe("navigation");
    s = transition(s, { type: "navigate", position: 80 }, "coil");
    for (const id of requiredChecks)
      s = transition(s, { type: "check", id }, "coil");
    s = transition(s, { type: "next" }, "coil");
    expect(s.phase).toBe("deployment");
    expect(transition(s, { type: "next" }, "coil").phase).toBe("deployment");
    s = transition(s, { type: "deploy", amount: 100 }, "coil");
    expect(transition(s, { type: "next" }, "coil").phase).toBe("debrief");
  });
  it("requires rechecking the projection after a scenario event", () => {
    let s = {
      ...initialSession(),
      phase: "deployment" as const,
      checks: [...requiredChecks],
      deployment: 80,
    };
    const r = transition(s, { type: "event", id: "overlap" }, "coil");
    expect(r.phase).toBe("navigation");
    expect(r.deployment).toBe(0);
    expect(r.checks).not.toContain("projection");
    expect(r.events).toEqual(["overlap"]);
  });
  it("clamps artificial position and ignores actions from other phases", () => {
    const s = initialSession();
    expect(transition(s, { type: "deploy", amount: 100 }, "coil")).toEqual(s);
    const nav = { ...s, phase: "navigation" as const };
    expect(
      transition(nav, { type: "navigate", position: 200 }, "coil").position,
    ).toBe(100);
    expect(
      transition(nav, { type: "navigate", position: NaN }, "coil").position,
    ).toBe(0);
    expect(pointOnRoute(-10)).toEqual(pointOnRoute(0));
    expect(projected(pointOnRoute(80), 90).every(Number.isFinite)).toBe(true);
  });
});
