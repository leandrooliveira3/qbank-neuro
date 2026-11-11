import { describe, it, expect } from "vitest";
import {
  cameraPairAfter,
  checkedPose,
  collection,
  mergeViews,
  parseViews,
  type SavedView,
} from "./savedViews";
const pose = {
  yaw: 31,
  pitch: 10,
  zoom: 1.5,
  center: [2, -3, 4] as [number, number, number],
};
const view = (id = "v1"): SavedView => ({
  id,
  name: "Minha vista",
  createdAt: "2026-11-11T10:00:00Z",
  pose: { ...pose, center: [...pose.center] },
});
describe("independent and linked acquisition", () => {
  it("inspection movement cannot change acquisition when unlinked", () => {
    const fixed = checkedPose(pose),
      r = cameraPairAfter({ ...pose, yaw: -50, zoom: 3 }, false, "inspection");
    expect(r.acquisition).toBeUndefined();
    expect(fixed).toEqual(pose);
    expect(r.inspection?.yaw).toBe(-50);
  });
  it("an independent acquisition change cannot command the inspector", () => {
    expect(
      cameraPairAfter({ ...pose, pitch: -25 }, false, "acquisition"),
    ).toEqual({ acquisition: { ...pose, pitch: -25 } });
  });
  it("linked poses have equal geometry without sharing mutable centers", () => {
    const r = cameraPairAfter(pose, true, "acquisition");
    expect(r.inspection).toEqual(r.acquisition);
    r.inspection!.center[0] = 999;
    expect(r.acquisition!.center[0]).toBe(2);
    expect(pose.center[0]).toBe(2);
  });
});
describe("saved acquisition views", () => {
  it("round-trips names, field and source space without changing unrelated records", () => {
    const s = collection([view()]),
      text = JSON.stringify(s),
      restored = parseViews(text);
    expect(restored).toEqual([view()]);
    expect(collection(restored).projection).toBe("orthographic");
    expect(collection(restored).scope).toBe("pose-only");
    expect(s.views[0].pose.center).toEqual([2, -3, 4]);
  });
  it("rejects a patient/DICOM coordinate space and unsupported projection", () => {
    expect(() =>
      parseViews(
        JSON.stringify({ ...collection([view()]), space: "DICOM-LPS" }),
      ),
    ).toThrow();
    expect(() =>
      parseViews(
        JSON.stringify({ ...collection([view()]), projection: "perspective" }),
      ),
    ).toThrow();
  });
  it("rejects invalid angles, centers and amplification", () => {
    for (const bad of [
      { ...pose, yaw: Infinity },
      { ...pose, pitch: 91 },
      { ...pose, zoom: 0 },
      { ...pose, center: [1, 2] },
      { ...pose, center: [1, NaN, 3] },
    ])
      expect(() => checkedPose(bad)).toThrow();
  });
  it("rejects invalid names, dates, duplicate IDs and oversized collections", () => {
    for (const views of [
      [{ ...view(), name: " " }],
      [{ ...view(), createdAt: "invalid" }],
      [view(), view()],
      [...Array.from({ length: 51 }, (_, i) => view("v" + i))],
    ])
      expect(() => parseViews(JSON.stringify(collection(views)))).toThrow();
    expect(() => parseViews(" ".repeat(100001))).toThrow();
  });
  it("merges idempotently and never overwrites conflicting existing IDs", () => {
    const current = [view()],
      next = view("v2");
    expect(mergeViews(current, [view(), next])).toEqual([view(), next]);
    expect(current).toHaveLength(1);
    expect(() => mergeViews(current, [{ ...view(), name: "Other" }])).toThrow();
    expect(current[0].name).toBe("Minha vista");
  });
  it("preserves the 50-view bound on merged collections", () => {
    const current = Array.from({ length: 50 }, (_, i) => view("v" + i));
    expect(() => mergeViews(current, [view("extra")])).toThrow();
    expect(current).toHaveLength(50);
  });
});
