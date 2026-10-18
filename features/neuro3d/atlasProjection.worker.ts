import { renderAtlasRadiograph, type AtlasProjectionRequest } from "./atlasRadiograph";
import type { ReferenceSurface } from "./simulation/station/referenceGeometry";
let surfaces: ReferenceSurface[] = [];
self.onmessage = (event: MessageEvent<{kind: "init"; surfaces: ReferenceSurface[]} | {kind: "render"; request: AtlasProjectionRequest}>) => {
  if (event.data.kind === "init") { surfaces = event.data.surfaces; return; }
  const request = event.data.request;
  try {
    const pixels = renderAtlasRadiograph(surfaces, request);
    self.postMessage({id: request.id, pixels}, {transfer: [pixels.buffer]});
  } catch (error) { self.postMessage({id: request.id, error: String(error)}); }
};
