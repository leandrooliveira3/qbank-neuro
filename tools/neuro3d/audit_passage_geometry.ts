import fs from 'node:fs';
import crypto from 'node:crypto';
import {openAnatomy,worldPoint} from '../../features/neuro3d/openAnatomy';
import {reconstructedVessels} from '../../features/neuro3d/reconstructedVessels';
import {neurovascularPassages,resolvePassage} from '../../features/neuro3d/neurovascularPassages';
import {sampledSurfaceDistance,sectionSurface,sourceMetres,surfaceEvidenceBytes,type PassageSurface,type Point3} from '../../features/neuro3d/passageGeometry';
import {sourceSurfaceReader} from './read_source_surface';
const reader=await sourceSurfaceReader(),surfaces=new Map<string,PassageSurface>();
const get=(id:string)=>{
  if(!surfaces.has(id)){
    const illustrative=reconstructedVessels.find(row=>row.id===id);
    surfaces.set(id,illustrative?{id,layer:illustrative.layer,origin:'illustrative',...illustrative.surface}:reader.read(id));
    const s=surfaces.get(id)!;
    if(new Set(Array.from(s.indices)).size!==s.positions.length/3||Array.from(s.positions).some(v=>!Number.isFinite(v))||Array.from(s.indices).some(v=>v<0||v>=s.positions.length/3))throw Error('Unused vertex or invalid source geometry: '+id);
  }return surfaces.get(id)!;
};
const principal:Record<string,string>={rotundum:'foramen_rotundum_branch',ovale:'foramen_ovale_branch',vidian:'artery_of_pterygoid_canal',meningolacrimal:'sphenoid_ridge_branch'};
const routes=[];
for(const row of neurovascularPassages.filter(row=>row.id in principal))for(const side of ['l','r'] as const){
  const resolved=resolvePassage(row,side),ids=[...resolved.vesselIds,...resolved.contextIds];ids.forEach(get);
  const id=principal[row.id]+'_'+side,illustrative=reconstructedVessels.find(r=>r.id===id),item=openAnatomy.structures.find(r=>r.id===id);
  const center=(illustrative?illustrative.points[Math.floor(illustrative.points.length/2)]:item!.bounds[0].map((v,k)=>(v+item!.bounds[1][k])/2)).slice() as Point3;
  const inspectionPoint=illustrative?center:worldPoint(center);
  const links=resolved.studyLinks.map(({from,to})=>{
    const a=get(from),b=get(to),measurement=sampledSurfaceDistance(a,b);
    return {from,to,fromOrigin:a.origin,toOrigin:b.origin,...measurement,
      witnessSourceMetres:{from:sourceMetres(measurement.witness.from),to:sourceMetres(measurement.witness.to)}};
  });
  routes.push({id:row.id,side,name:row.name,inspectionPoint,inspectionPointRole:'Branch inspection centre only; NOT a verified foramen location',
    surfaces:ids.map(id=>{const s=get(id);return {id,origin:s.origin,layer:s.layer,vertices:s.positions.length/3,triangles:s.indices.length/3,sha256:crypto.createHash('sha256').update(new Uint8Array(surfaceEvidenceBytes(s))).digest('hex')};}),
    sourceSectionChecks:[0,1,2].map(axis=>({axis,offsetCm:inspectionPoint[axis],sections:ids.map(id=>{const s=sectionSurface(get(id),axis,inspectionPoint[axis]);return {id,segments:s.segments.length,coplanarTriangles:s.coplanarTriangles};})})),
    missingContextIds:resolved.missingContextIds,links,foramenPositionVerified:false,fullCourseVerified:false,anastomosisLumenVerified:false});
  console.log(row.id,side,links.map(l=>`${l.from}->${l.to}:${(l.sampledUpperBoundCm*10).toFixed(3)}mm`).join(' | '));
}
const report={schema:1,baseCommit:'f62c3673dc3f0e010fba08157797e0a83c4a56e3',coordinateSystem:'Atlas centimetres; upstream glTF metres, Y-up, multiplied by100 and Y-160. Not patient LPS/RAS.',
  sourceCommit:openAnatomy.sourceCommit,license:openAnatomy.license,attribution:openAnatomy.attribution,
  sourceFiles:[...reader.sourceFiles].map(([file,sha256])=>({file,sha256})),
  method:'Canonical little-endian float32 positions and uint32 indices hashed per surface.32 deterministic source vertex samples per directed bibliographic link, each compared to all nondegenerate target triangles. Sampled distance is an upper bound; AABB distance is a lower bound. Witnesses retain source vertex/target triangle/barycentric coordinates. Original bone/nerve/vessel cross-sections use full source node hierarchy, not simplified projection.',
  limitations:'Measurements are model geometry, not clinical dimensions. No named foramen coordinate, ostium, wall continuity or lumen has been certified. A zero/near-zero sample does not certify connection; a positive sampled distance alone cannot prove global separation. No source geometry, procedural edge or vascular identity has been changed.',routes};
fs.writeFileSync('features/neuro3d/passage-geometry-audit.json',JSON.stringify(report)+'\n');
console.log(JSON.stringify({routes:routes.length,links:routes.reduce((n,r)=>n+r.links.length,0),files:reader.sourceFiles.size,originalSurfaces:[...surfaces.values()].filter(r=>r.origin==='imported').length}));
