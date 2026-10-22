import type { P3 } from "./simulation/station/network";
import type { View } from "./simulation/station/engine";
import { projectSpatial, WIDTH, HEIGHT } from "./simulation/station/projectionMath";

/** Move the detector field, never the source anatomy. */
export function atlasProjection(yaw: number, pitch: number, zoom: number, center: P3 = [0, 0, 0]): View {
  const view: View = { yaw, pitch, yawB: 90, pitchB: 0, zoom, panX: 0, panY: 0, gain: 1, collimation: 100, boneOpacity: 1 };
  const [x, y] = projectSpatial(center, view);
  return { ...view, panX: (WIDTH / 2 - x) / (12 * zoom), panY: (y - HEIGHT / 2) / (12 * zoom) };
}
export function unprojectAtlasPixel(px: number, py: number, depth: number, view: View): P3 {
  const yaw = view.yaw * Math.PI / 180, pitch = view.pitch * Math.PI / 180;
  const x = (px - WIDTH / 2) / (12 * view.zoom) - view.panX;
  const y = -(py - HEIGHT / 2) / (12 * view.zoom) - view.panY;
  const wy = y * Math.cos(pitch) + depth * Math.sin(pitch);
  const wz = -y * Math.sin(pitch) + depth * Math.cos(pitch);
  return [x * Math.cos(yaw) + wz * Math.sin(yaw), wy, -x * Math.sin(yaw) + wz * Math.cos(yaw)];
}

/** Shift only the detector field; source coordinates and viewing depth stay unchanged. */
export function panAtlasField(center: P3, view: View, dx: number, dy: number): P3 {
  const before = unprojectAtlasPixel(WIDTH / 2, HEIGHT / 2, 0, view);
  const after = unprojectAtlasPixel(WIDTH / 2 - dx, HEIGHT / 2 - dy, 0, view);
  return center.map((value, k) => value + after[k] - before[k]) as P3;
}

/** Keep the world point under the cursor stationary while changing magnification. */
export function zoomAtlasField(center: P3, view: View, zoom: number, px: number, py: number): P3 {
  const before = unprojectAtlasPixel(px, py, 0, view);
  const next = atlasProjection(view.yaw, view.pitch, zoom, center);
  const after = unprojectAtlasPixel(px, py, 0, next);
  return center.map((value, k) => value + before[k] - after[k]) as P3;
}

/** Fit all eight source-world bounding corners in the detector at the current angles. */
export function fitAtlasField(bounds:readonly number[][],yaw:number,pitch:number,padding=32) {
  if(bounds.length !== 2 || bounds.some(row=>row.length !== 3 || row.some(value=>!Number.isFinite(value))) || bounds[0].some((value,k)=>value>bounds[1][k]) || !Number.isFinite(padding) || padding<0 || 2*padding>=Math.min(WIDTH,HEIGHT)) throw new RangeError("Invalid source bounds or detector padding");
  const center=bounds[0].map((value,k)=>(value+bounds[1][k])/2) as P3;
  const view=atlasProjection(yaw,pitch,1,center);
  const corners=bounds.flatMap((_,x)=>bounds.flatMap((_,y)=>bounds.map((_,z)=>projectSpatial([bounds[x][0],bounds[y][1],bounds[z][2]],view))));
  const width=Math.max(...corners.map(p=>p[0]))-Math.min(...corners.map(p=>p[0]));
  const height=Math.max(...corners.map(p=>p[1]))-Math.min(...corners.map(p=>p[1]));
  const zoom=Math.max(.1,Math.min(12,(WIDTH-2*padding)/Math.max(width,1e-8),(HEIGHT-2*padding)/Math.max(height,1e-8)));
  return {center,zoom};
}
