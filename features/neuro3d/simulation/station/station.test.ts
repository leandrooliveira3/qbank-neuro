import { describe, it, expect } from "vitest";
import {
  createStation,
  stationReducer,
  networkFor,
  goalMet,
  projectionKey,
  StationState,
} from "./engine";
import { procedureCases } from "./cases";
import {
  makeNetwork,
  targetTrack,
  locate,
  edgeLength,
  pointAt,
  trackPoints,
  distance,
} from "./network";
import { maskLines, project, lumenFactor } from "./imaging";
describe("atlas network and instrumentation", () => {
  it("uses original Bouthillier segments and joins all navigable junctions continuously", () => {
    for (const aneurysm of [false, true]) {
      const n = makeNetwork(aneurysm);
      for (const side of ["L", "R"])
        for (let i = 1; i <= 7; i++)
          expect(n[`ICA-${side}-C${i}`].anatomicalId).toBe(`ICA-C${i}`);
      for (const v of Object.values(n)) {
        expect(v.points.flat().every(Number.isFinite)).toBe(true);
        for (const child of v.children)
          expect(
            distance(v.points.at(-1)!, n[child].points[0]),
            `${v.id} → ${child}`,
          ).toBeLessThan(0.000001);
      }
    }
  });
  it("every pathological target can be reached through branching anatomy", () => {
    for (const c of procedureCases) {
      const n = networkFor(createStation(c.id)),
        t = targetTrack(n, c.target, c.targetT);
      expect(locate(n, t).edge).toBe(c.target);
      expect(locate(n, t).t).toBeCloseTo(c.targetT);
      expect(trackPoints(n, t).length).toBeGreaterThan(5);
    }
  });
  it("rotation changes branch choice, and unsupported catheters cannot jump ahead", () => {
    const n = makeNetwork(),
      base = targetTrack(n, "arch-4", 1);
    let a = createStation();
    a.tools.wire = base;
    a.wireKind = "Microguia";
    const l = stationReducer(a, { type: "move", delta: 0.2 });
    const r = stationReducer(
      { ...a, rotation: 200 },
      { type: "move", delta: 0.2 },
    );
    expect(l.tools.wire.path).not.toEqual(r.tools.wire.path);
    const b = stationReducer(createStation(), { type: "tool", tool: "micro" });
    expect(
      stationReducer(b, { type: "move", delta: 1 }).tools.micro.depth,
    ).toBe(0);
  });
  it("allows a stationary microcatheter while its guidewire is withdrawn", () => {
    let s = createStation("saccular");
    const n = networkFor(s),
      target = targetTrack(n, "sac", 0.7);
    s = {
      ...s,
      wireKind: "Microguia",
      tools: { ...s.tools, wire: target, micro: target },
    };
    const next = stationReducer(s, { type: "move", delta: -1 });
    expect(next.tools.micro).toEqual(target);
    expect(next.tools.wire.depth).toBeLessThan(target.depth);
  });
});
describe("angiography workstation", () => {
  it("requires contrast for roadmap and marks changed projection stale", () => {
    let s = createStation();
    expect(stationReducer(s, { type: "mask" }).mask).toBeNull();
    const n = networkFor(s);
    s.tools.catheter = targetTrack(n, "ICA-L-C1", 0.8);
    s = stationReducer(s, { type: "mode", mode: "dsa" });
    s = stationReducer(s, { type: "inject" });
    s = stationReducer(s, { type: "mask" });
    expect(s.mask?.edges).toContain("ICA-L-C1");
    expect(maskLines(s, n).length).toBeGreaterThan(1);
    const old = projectionKey(s.mask!.view);
    s = stationReducer(s, { type: "view", patch: { yaw: 30 } });
    expect(projectionKey(s.view)).not.toBe(old);
    expect(projectionKey(s.mask!.view)).toBe(old);
  });
  it("exposure only accumulates while pedal/acquisition is active", () => {
    let s = createStation();
    s = stationReducer(s, { type: "tick", dt: 0.1 });
    expect(s.exposure).toBe(0);
    s = stationReducer(s, { type: "pedal", on: true });
    s = stationReducer(s, { type: "tick", dt: 0.1 });
    expect(s.exposure).toBeCloseTo(0.1);
    s = stationReducer(s, { type: "pedal", on: false });
    s = stationReducer(s, { type: "tick", dt: 0.1 });
    expect(s.exposure).toBeCloseTo(0.1);
  });
  it("table, angle and magnification change the projection", () => {
    const s = createStation();
    const p = pointAt(networkFor(s)["CI-M1L"], 0.5);
    expect(project(p, s.view)).not.toEqual(project(p, { ...s.view, yaw: 60 }));
    expect(project(p, s.view)).not.toEqual(
      project(p, { ...s.view, panY: 4, zoom: 3 }),
    );
  });
});
describe("spatial treatment interaction", () => {
  it("coils only occupy the aneurysm if delivered in the sac; parent deployment is an adverse event", () => {
    let s = createStation("saccular");
    const n = networkFor(s);
    const t = targetTrack(n, "sac", 0.6);
    for (let i = 0; i < 3; i++) {
      s = {
        ...s,
        device: {
          family: "coil",
          track: t,
          open: 1,
          detached: false,
          captured: false,
        },
      };
      s = stationReducer(s, { type: "detach" });
    }
    expect(s.coilFill).toBe(3);
    expect(goalMet(s)).toBe(true);
    const wrong = {
      ...s,
      device: {
        family: "coil" as const,
        track: targetTrack(n, "ICA-L-C6", 0.4),
        open: 1,
        detached: false,
        captured: false,
      },
    };
    expect(stationReducer(wrong, { type: "detach" }).parentCompromised).toBe(
      true,
    );
  });
  it("aspiration away from thrombus does nothing; near the lesion changes the occlusion", () => {
    let s = createStation("m1");
    const n = networkFor(s);
    s = {
      ...s,
      aspirating: true,
      device: {
        family: "aspiration",
        track: targetTrack(n, "ICA-L-C1", 0.5),
        open: 0,
        detached: false,
        captured: false,
      },
    };
    expect(stationReducer(s, { type: "tick", dt: 0.1 }).clot).toBe(true);
    s.device!.track = targetTrack(n, "CI-M1L", 0.55);
    s = stationReducer(s, { type: "tick", dt: 0.1 });
    expect(s.clot).toBe(false);
    s.tools.catheter = targetTrack(n, "ICA-L-C1", 0.8);
    s = stationReducer(s, { type: "tick", dt: 0.1 });
    s = stationReducer(s, { type: "mode", mode: "dsa" });
    s = stationReducer(s, { type: "inject" });
    expect(goalMet(s)).toBe(true);
  });
  it("balloon dilation only updates the stenosis when positioned across it", () => {
    let s = createStation("cas");
    const n = networkFor(s);
    s.device = {
      family: "balloon",
      track: targetTrack(n, "access", 0.2),
      open: 0,
      detached: false,
      captured: false,
    };
    expect(stationReducer(s, { type: "open", delta: 1 }).dilation).toBe(0);
    s.device.track = targetTrack(n, "ICA-L-C1", 0.35);
    s = stationReducer(s, { type: "open", delta: 1 });
    expect(s.dilation).toBeGreaterThan(0.5);
    s.device = {
      family: "stent",
      track: targetTrack(n, "ICA-L-C1", 0.35),
      open: 0,
      detached: false,
      captured: false,
    };
    s = stationReducer(s, { type: "open", delta: 1 });
    expect(s.stented).toBe(true);
    expect(goalMet(s)).toBe(true);
  });
});

describe("complete navigation through the procedural engine", () => {
  it("navigates from femoral entry through actual branches, follows with microcatheter and deploys in the sac", () => {
    let s = stationReducer(createStation("saccular"), {
      type: "wireKind",
      value: "Microguia",
    });
    const n = networkFor(s),
      target = targetTrack(n, "sac", 0.55);
    for (
      let i = 0;
      i < 1500 && s.tools.wire.depth < target.depth - 0.00001;
      i++
    ) {
      const at = locate(n, s.tools.wire),
        idx = target.path.indexOf(at.edge);
      expect(idx).toBeGreaterThanOrEqual(0);
      const next = target.path[idx + 1],
        children = n[at.edge].children;
      if (next) {
        const angle = ((children.indexOf(next) + 0.5) / children.length) * 360;
        s = stationReducer(s, { type: "rotate", delta: angle - s.rotation });
      }
      const remaining = edgeLength(n[at.edge]) * (1 - at.t);
      s = stationReducer(s, {
        type: "move",
        delta: Math.min(
          1.2,
          Math.max(0.001, remaining + 0.001),
          target.depth - s.tools.wire.depth,
        ),
      });
    }
    expect(locate(n, s.tools.wire).edge).toBe("sac");
    s = stationReducer(s, { type: "tool", tool: "micro" });
    for (
      let i = 0;
      i < 1000 && s.tools.micro.depth < target.depth - 0.00001;
      i++
    )
      s = stationReducer(s, {
        type: "move",
        delta: Math.min(1.2, target.depth - s.tools.micro.depth),
      });
    expect(locate(n, s.tools.micro).edge).toBe("sac");
    s = stationReducer(s, { type: "load", family: "coil" });
    for (
      let i = 0;
      i < 1000 && s.device!.track.depth < target.depth - 0.00001;
      i++
    )
      s = stationReducer(s, {
        type: "move",
        delta: Math.min(1.2, target.depth - s.device!.track.depth),
      });
    s = stationReducer(s, { type: "open", delta: 1 });
    s = stationReducer(s, { type: "detach" });
    expect(s.coilFill).toBe(1);
    expect(s.parentCompromised).toBe(false);
  });
  it("narrows only the focal lesion and freezes interventions after session end", () => {
    expect(lumenFactor(0.35, 0.35, 0)).toBeCloseTo(0.35);
    expect(lumenFactor(0.9, 0.35, 0)).toBeCloseTo(1);
    expect(lumenFactor(0.35, 0.35, 1)).toBe(1);
    const done = stationReducer(createStation(), { type: "finish" });
    expect(stationReducer(done, { type: "move", delta: 1 })).toBe(done);
    expect(stationReducer(done, { type: "pedal", on: true }).pedal).toBe(false);
  });
});

it("retriever captures beyond the occlusion and removes thrombus only on proximal withdrawal", () => {
  let s = createStation("m1");
  const n = networkFor(s);
  s.device = {
    family: "retriever",
    track: targetTrack(n, "CI-M1L", 0.9),
    open: 0,
    detached: false,
    captured: false,
  };
  s.active = "device";
  s = stationReducer(s, { type: "open", delta: 1 });
  expect(s.device!.captured).toBe(true);
  expect(s.clot).toBe(true);
  for (let i = 0; i < 80 && s.clot; i++)
    s = stationReducer(s, { type: "move", delta: -0.25 });
  expect(s.clot).toBe(false);
  expect(locate(n, s.device!.track).edge).toContain("ICA-");
  expect(goalMet(s)).toBe(false);
});
