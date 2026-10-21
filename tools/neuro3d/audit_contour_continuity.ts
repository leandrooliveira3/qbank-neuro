import fs from 'node:fs';import crypto from 'node:crypto';
import {sourceSurfaceReader} from './read_source_surface';
import {sectionSurface,surfaceEvidenceBytes,type Point3} from '../../features/neuro3d/passageGeometry';
import {sectionContours,strictlyEncloses} from '../../features/neuro3d/sectionContours';
import {sectionHierarchy,meshTopology,seamTopology,windingAt} from '../../features/neuro3d/sectionHierarchy';
import {openAnatomy} from '../../features/neuro3d/openAnatomy';
const reader=await sourceSurfaceReader(),bone=reader.read('sphenoid_bone');
const sha=(s:typeof bone)=>crypto.createHash('sha256').update(new Uint8Array(surfaceEvidenceBytes(s))).digest('hex');
const bounds=(s:typeof bone)=>[0,1,2].map(k=>{const a=Array.from({length:s.positions.length/3},(_,i)=>s.positions[i*3+k]);return [Math.min(...a),Math.max(...a)];});
const v2=[];
for(const side of ['l','r'] as const){
 const nerve=reader.read(`maxillary_nerve_${side}`),sections=[];
 for(let i=0;i<=20;i++){
  const offsetCm=(280+i*2)/100,bsection=sectionSurface(bone,2,offsetCm),nsection=sectionSurface(nerve,2,offsetCm);
  const b=sectionContours(bsection,0,1),n=sectionContours(nsection,0,1),hierarchy=sectionHierarchy(b.loops,bone,0,1);
  const matches=n.loops.map(neural=>{
   const containers=b.loops.flatMap((loop,index)=>strictlyEncloses(loop,neural,0,1)?[index]:[]).sort((a,c)=>b.loops[a].areaCm2-b.loops[c].areaCm2),index=containers[0];
   const probeCm=[0,1,2].map(k=>neural.points.reduce((s,p)=>s+p[k],0)/neural.points.length) as Point3;
   return {nerveTriangles:neural.sourceTriangles,containerIndex:index??null,containerHierarchy:index===undefined?null:hierarchy[index],probeCm,
    probeRole:'Arithmetic mean of section vertices; diagnostic only, not lumen/foramen centre',boneWindingAtProbe:windingAt(bone,probeCm)};
  });
  sections.push({offsetCm,boneLoops:hierarchy,nerveLoopCount:n.loops.length,matches,
   diagnostics:{boneOpen:b.openComponents,boneBranched:b.branchedComponents,boneInvalid:b.invalidLoops,boneCoplanar:bsection.coplanarTriangles,nerveOpen:n.openComponents,nerveBranched:n.branchedComponents,nerveCoplanar:nsection.coplanarTriangles}});
 }
 // Intersection triangle sharing is a reproducible local continuity witness,
 // not a reconstructed tube and not evidence between unsampled levels.
 const transitions=sections.slice(1).map((s,i)=>{
  const before=sections[i].matches.filter(m=>m.containerHierarchy),after=s.matches.filter(m=>m.containerHierarchy);
  const shared=before.flatMap(a=>after.map(b=>a.containerHierarchy!.sourceTriangles.filter(f=>b.containerHierarchy!.sourceTriangles.includes(f)).length));
  return {fromCm:sections[i].offsetCm,toCm:s.offsetCm,maxSharedBoneTriangles:Math.max(0,...shared),sampledContinuityOnly:true};
 });
 v2.push({side,nerveId:nerve.id,nerveSurfaceSHA256:sha(nerve),sections,transitions,fullTunnelVerified:false,namedForamenVerified:false});
}
const motorRoots=['l','r'].map(side=>{
 const s=reader.read(`motor_root_of_trigeminal_nerve_${side}`),b=bounds(s),boneBounds=bounds(bone),topology=meshTopology(s);
 const levels=Array.from({length:9},(_,i)=>b[2][0]+(b[2][1]-b[2][0])*(i+1)/10);
 return {id:s.id,surfaceSHA256:sha(s),boundsCm:b,topology,boneAabbLowerBoundCm:Math.hypot(...b.map(([min,max],k)=>Math.max(0,min-boneBounds[k][1],boneBounds[k][0]-max))),
  sections:levels.map(offsetCm=>{const cut=sectionSurface(s,2,offsetCm),loops=sectionContours(cut,0,1),boneSection=sectionSurface(bone,2,offsetCm),boneCut=sectionContours(boneSection,0,1);return {offsetCm,nerveClosedProfiles:loops.loops.length,nerveOpenComponents:loops.openComponents,nerveBranchedComponents:loops.branchedComponents,boneSegments:boneSection.segments.length,strictBoneContainers:loops.loops.map(n=>boneCut.loops.filter(o=>strictlyEncloses(o,n,0,1)).length)};}),
  role:'Source-labelled motor root only. Distinct from sensory V3 trunk and mandibular divisions.',completeCourseVerified:false,foramenOvaleVerified:false};
});
const report={schema:1,baseCommit:'7b080470f0ca286700774110062a4d4d2a846a97',sourceCommit:'6320bd64df8db2fcfed358a27c85d1fcc1c5913c',license:'CC-BY-SA-4.0',attribution:openAnatomy.attribution,
 coordinateSystem:'Original atlas cm, Y up; world glTF metres x100, Y-160. No patient registration.',sourceFiles:[...reader.sourceFiles].map(([file,sha256])=>({file,sha256})),boneId:bone.id,boneSurfaceSHA256:sha(bone),boneTopology:meshTopology(bone),boneSeamDiagnostic:seamTopology(bone),v2,motorRoots,
 methods:{hierarchy:'Strict full-edge containment, smallest containing loop is parent; depth is not a tissue label.',orientation:'Compare each loop edge against plane-normal cross original face-normal. Report signed area only if all nonzero edge signs agree.',topology:'Original vertex indices, no welding/healing; edge incidence and orientation, component face counts. Self-intersections not tested.',winding:'Oriented solid-angle sum / 4pi at an explicitly non-anatomical probe; diagnostic, never a solid/void certificate.',continuity:'21 Z sections 28–32 nominal mm, step 0.2mm per side. Shared original bone triangle IDs in consecutive enclosing loops. Discrete samples cannot certify a full tunnel.'},
 namedForamenVerified:false,arterialPassageVerified:false,limits:'No bone/nerve/vessel moved or relabelled. Neither a nested loop nor closed consistently oriented edge topology proves an anatomical foramen or excludes self-intersection. Motor root is not sensory V3. Specific ICA-vidian and meningo-lacrimal components remain unresolved.'};
fs.writeFileSync('features/neuro3d/contour-continuity-evidence.json',JSON.stringify(report)+'\n');
console.log(JSON.stringify({bone:report.boneTopology,v2:v2.map(s=>({side:s.side,enclosed:s.sections.filter(p=>p.matches.some(m=>m.containerIndex!==null)).length,shared:s.transitions.filter(p=>p.maxSharedBoneTriangles>0).length,oriented:s.sections.flatMap(p=>p.matches).filter(m=>m.containerHierarchy?.orientationConsistent).length,winding:s.sections.flatMap(p=>p.matches.map(m=>m.boneWindingAtProbe))})),motor:motorRoots},null,2));
