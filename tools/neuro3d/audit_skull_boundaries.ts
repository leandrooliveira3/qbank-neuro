import fs from 'node:fs';import crypto from 'node:crypto';import {Triangle,Vector3} from 'three';
import {sourceSurfaceReader} from './read_source_surface';
import {sourceBoundaries,sectionFrame,obliqueSection,framedSurface} from '../../features/neuro3d/skullBoundary';
import {sectionSurface,surfaceEvidenceBytes,type Point3} from '../../features/neuro3d/passageGeometry';
import {sectionContours,strictlyEncloses} from '../../features/neuro3d/sectionContours';
import {sectionHierarchy} from '../../features/neuro3d/sectionHierarchy';
import previous from '../../features/neuro3d/contour-continuity-evidence.json';
const reader=await sourceSurfaceReader(),bone=reader.read('sphenoid_bone'),boundaries=sourceBoundaries(bone),sides=[];
const hash=(s:typeof bone)=>crypto.createHash('sha256').update(new Uint8Array(surfaceEvidenceBytes(s))).digest('hex');
if(hash(bone)!==previous.boneSurfaceSHA256||boundaries.boundary.length!==32)throw Error('Changed source or boundary definition');
for(const side of ['l','r'] as const){
 const nerve=reader.read(`maxillary_nerve_${side}`),prior=previous.v2.find(r=>r.side===side)!;
 const a=prior.sections.find(s=>s.offsetCm===3.14)!.matches[0].probeCm,b=prior.sections.find(s=>s.offsetCm===3.16)!.matches[0].probeCm;
 const centre=a.map((n,k)=>(n+b[k])/2) as Point3,normal=b.map((n,k)=>n-a[k]) as Point3;
 const distanceToBoundary=(p:Point3)=>Math.min(...boundaries.boundary.map(e=>{const a=new Vector3(...e.pointsCm[0]),b=new Vector3(...e.pointsCm[1]),v=b.clone().sub(a),t=Math.max(0,Math.min(1,new Vector3(...p).sub(a).dot(v)/v.lengthSq()));return a.addScaledVector(v,t).distanceTo(new Vector3(...p));}));
 const fineLevels=Array.from({length:9},(_,i)=>3.142+i*.002).map(z=>{
  const bs=sectionSurface(bone,2,z),ns=sectionSurface(nerve,2,z),bc=sectionContours(bs,0,1),nc=sectionContours(ns,0,1);
  const containers=nc.loops.map(n=>bc.loops.flatMap((o,i)=>strictlyEncloses(o,n,0,1)?[i]:[]));
  return {zCm:z,fullContainment:containers.some(c=>c.length>0),boneOpenComponents:bc.openComponents,boneBranchedComponents:bc.branchedComponents,boneLoops:bc.loops.length,nerveLoops:nc.loops.length};
 });
 const criticalBoneVertices=Array.from({length:bone.positions.length/3},(_,i)=>i).filter(i=>bone.positions[i*3+2]>3.14&&bone.positions[i*3+2]<3.16).map(i=>({sourceVertex:i,pointCm:Array.from(bone.positions).slice(i*3,i*3+3)}));
 const frames=[{name:'transverse-local',frame:sectionFrame(centre,normal)},{name:'longitudinal-local',frame:sectionFrame(centre,[normal[2],0,-normal[0]])}];
 const cuts=frames.map(({name,frame})=>{
  const bs=obliqueSection(bone,frame),ns=obliqueSection(nerve,frame),bc=sectionContours(bs.local,0,1),nc=sectionContours(ns.local,0,1);
  return {id:`${name}-${side}`,name,frame,sections:[bs.local,ns.local],hierarchy:sectionHierarchy(bc.loops,framedSurface(bone,frame),0,1),
   nerveClosedProfiles:nc.loops.length,fullContainment:nc.loops.some(n=>bc.loops.some(o=>strictlyEncloses(o,n,0,1))),boneOpenComponents:bc.openComponents,boneCoplanar:bs.local.coplanarTriangles,
   planeOriginRole:'Mean of previously exported mathematical section probes, not anatomical centre. Normal estimated from the same two probes; no anatomical axis certification.'};
 });
 const tri=new Triangle(),p=new Vector3(...centre),q=new Vector3();let near=Infinity,face=-1,witness:Point3=[0,0,0];
 for(let f=0;f<bone.indices.length/3;f++){tri.a.fromArray(bone.positions as number[],bone.indices[f*3]*3);tri.b.fromArray(bone.positions as number[],bone.indices[f*3+1]*3);tri.c.fromArray(bone.positions as number[],bone.indices[f*3+2]*3);if(tri.getArea()<1e-14)continue;tri.closestPointToPoint(p,q);if(q.distanceTo(p)<near){near=q.distanceTo(p);face=f;witness=q.toArray() as Point3;}}
 sides.push({side,nerveId:nerve.id,nerveSurfaceSHA256:hash(nerve),fineLevels,criticalBoneVertices,cuts,
  probeCm:centre,probeToBoundaryEdgesCm:distanceToBoundary(centre),nearestBone:{sourceTriangle:face,pointCm:witness,distanceCm:near},namedForamenVerified:false});
}
const report={schema:1,baseCommit:'97d2a9413bfdba1654d70fedcb02a10d84989580',sourceCommit:previous.sourceCommit,license:previous.license,attribution:previous.attribution,coordinateSystem:previous.coordinateSystem,
 sourceFiles:[...reader.sourceFiles].map(([file,sha256])=>({file,sha256})),boneSurfaceSHA256:hash(bone),boundaries,sides,
 limits:'No mesh repair, bridges, reidentification or coordinate changes. Boundary graphs are not named foramina; diagnostic oblique coordinates are reversible within the same atlas, not cross-source registration. Point-to-boundary and point-to-triangle distances are not global surface distances. Sampled containment is not tunnel/lumen proof.'};
fs.writeFileSync('features/neuro3d/skull-boundary-evidence.json',JSON.stringify(report)+'\n');console.log(JSON.stringify({groups:boundaries.groups,degenerateFaces:boundaries.degenerateFaces,sides:sides.map(s=>({side:s.side,fine:s.fineLevels,critical:s.criticalBoneVertices,probeToBoundary:s.probeToBoundaryEdgesCm,near:s.nearestBone,cuts:s.cuts.map(c=>({name:c.name,contained:c.fullContainment,profiles:c.nerveClosedProfiles,open:c.boneOpenComponents}))}))},null,2));
