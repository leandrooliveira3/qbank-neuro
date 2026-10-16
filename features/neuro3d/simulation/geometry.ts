export type Point3 = [number, number, number];
// Original fictitious path, no patient coordinates or morphometric claim.
export const route: Point3[] = [
  [-2.6, -4, 0],
  [-2.5, -2.6, 0.4],
  [-1.8, -1.2, 0.8],
  [-0.6, -0.3, 0.3],
  [0.4, 0.7, -0.5],
  [0.2, 1.8, -0.2],
  [0.9, 3, 0.5],
  [1.9, 4, 0.8],
];
export function pointOnRoute(position: number): Point3 {
  const t =
    (Math.max(0, Math.min(100, Number.isFinite(position) ? position : 0)) /
      100) *
    (route.length - 1);
  const i = Math.min(route.length - 2, Math.floor(t));
  const f = t - i;
  return route[i].map((n, j) => n + (route[i + 1][j] - n) * f) as Point3;
}
export function projected(point: Point3, angle: number): [number, number] {
  const a = (angle * Math.PI) / 180;
  return [
    160 + (point[0] * Math.cos(a) - point[2] * Math.sin(a)) * 29,
    150 - point[1] * 29,
  ];
}
