/** Bundle with esbuild --bundle --platform=node --format=esm, then run at repo root. */
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {sourceStructures,openAnatomy,worldPoint} from '../../features/neuro3d/openAnatomy';
import {vascularCompleteness,vascularCompletenessCounts,unmappedVascularDiagramEntries} from '../../features/neuro3d/vascularCompleteness';
import {vascularReviewCounts} from '../../features/neuro3d/vascularReview';
import {anatomicalInventory} from '../../features/neuro3d/anatomicalInventory';
import {reconstructedVessels} from '../../features/neuro3d/reconstructedVessels';
import pack from '../../features/neuro3d/reference-surfaces.json';
const hash=(raw:Uint8Array)=>createHash('sha256').update(raw).digest('hex');
const raw=readFileSync('public/neuro3d/open-anatomy/reference-surfaces.bin');
if(hash(raw)!==pack.sha256)throw Error('Reference projection geometry hash mismatch');
const sinus=pack.structures.find(row=>row.id==='straight_sinus')!;
const positions=Array.from({length:sinus.positionsCount},(_,i)=>raw.readFloatLE(sinus.positionsOffset+i*4));
const galen=reconstructedVessels.find(row=>row.id==='great_cerebral_vein')!;
const straight=openAnatomy.structures.find(row=>row.id==='straight_sinus')!;
const bounds=straight.bounds.map(worldPoint);
const controls=galen.points;
const controlDistances=controls.map((p,index)=>{
  let minimum=Infinity;
  for(let i=0;i<positions.length;i+=3)minimum=Math.min(minimum,Math.hypot(p[0]-positions[i],p[1]-positions[i+1],p[2]-positions[i+2]));
  const aabb=Math.hypot(...p.map((v,k)=>Math.max(bounds[0][k]-v,0,v-bounds[1][k])));
  return {index,pointAtlasCm:p,minimumDistanceToProjectionVerticesCm:minimum,distanceToSourceAABBCm:aabb};
});
const report={schema:1,baseCommit:'ad5515dc53067689d5bdf54e514b0caa0d6a572e',coordinateSystem:'atlas display centimetres; source world x100, Y-160',
  sourceStructures:sourceStructures.length,activeImported:openAnatomy.structures.length,reconstructed:reconstructedVessels.length,
  meshCounts:vascularReviewCounts,coverageCounts:vascularCompletenessCounts,
  bySystem:['arterial','venous'].map(layer=>({layer,requirements:vascularCompleteness.filter(row=>row.layer===layer).length,
    expectedIndividualIds:new Set(vascularCompleteness.filter(row=>row.layer===layer).flatMap(row=>row.expectedIds)).size,
    missingReferenceIds:new Set(vascularCompleteness.filter(row=>row.layer===layer).flatMap(row=>row.referenceMissingIds)).size,
    anatomicalApprovals:0})),
  diagramStates:Object.fromEntries(['imported','reconstructed','partial','missing','unresolved'].map(status=>[status,anatomicalInventory.filter(row=>row.status===status).length])),
  unresolvedDiagram:unmappedVascularDiagramEntries.map(row=>({key:row.key,number:row.number,name:row.portuguese,kind:row.kind,targets:row.targets})),
  galenStraight:{from:'great_cerebral_vein',to:'straight_sinus',fromKind:'hand-authored illustration',toKind:'imported source surface, label unreviewed',
    projectionGeometrySHA256:pack.sha256,projectionTriangles:sinus.indicesCount/3,sourceBoundsAtlasCm:bounds,
    sampledAxisDistances:controlDistances,connectionVerified:false,identityApproved:false,
    interpretation:'Distances compare illustrative axis samples with simplified projection vertices and a source bounding box. Not a continuous surface-to-surface distance, ostium, flow or diagnostic measurement. No snapping, bridge, relabelling or deformation performed.'},
  requirements:vascularCompleteness.map(row=>({id:row.id,layer:row.layer,expectedIds:row.expectedIds,sourceIds:row.sourceIds,reconstructedIds:row.reconstructedIds,referenceMissingIds:row.referenceMissingIds,status:row.status,anatomicalApproval:false}))};
writeFileSync('docs/neuro3d-inventory-reconciliation.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({...report,requirements:undefined,galenStraight:{...report.galenStraight,sampledAxisDistances:[controlDistances[0],controlDistances.at(-1)]}}));
