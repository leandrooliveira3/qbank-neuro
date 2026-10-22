import fs from 'node:fs';import crypto from 'node:crypto';import {Triangle,Vector3} from 'three';
import {sourceSurfaceReader} from './read_source_surface';
import {sectionSurface,sourceMetres,surfaceEvidenceBytes,type Point3} from '../../features/neuro3d/passageGeometry';
import {sectionContours,strictlyEncloses} from '../../features/neuro3d/sectionContours';
import {reconstructedVessels} from '../../features/neuro3d/reconstructedVessels';
import {openAnatomy} from '../../features/neuro3d/openAnatomy';
const reader=await sourceSurfaceReader(),bone=reader.read('sphenoid_bone'),candidates=[];
const hash=(s:typeof bone)=>crypto.createHash('sha256').update(new Uint8Array(surfaceEvidenceBytes(s))).digest('hex');
for(const side of ['l','r'] as const){
 const nerve=reader.read(`maxillary_nerve_${side}`);
 for(const offsetCm of [2.9,3.0]){
  const boneSection=sectionSurface(bone,2,offsetCm),nerveSection=sectionSurface(nerve,2,offsetCm),b=sectionContours(boneSection,0,1),n=sectionContours(nerveSection,0,1);
  const pairs=n.loops.flatMap(neural=>b.loops.filter(osseous=>strictlyEncloses(osseous,neural,0,1)).map(osseous=>({neural,osseous}))).sort((a,b)=>a.osseous.areaCm2-b.osseous.areaCm2);
  if(!pairs.length)throw Error('No strict closed enclosure at selected V2 section');
  const {neural,osseous}=pairs[0];
  // A section centroid only chooses a bone-rim witness; it is never exported as a foramen centre.
  const centroid=[0,1,2].map(k=>neural.points.reduce((sum,p)=>sum+p[k],0)/neural.points.length) as Point3;
  const index=osseous.points.map((p,i)=>({i,d:Math.hypot(...p.map((v,k)=>v-centroid[k]))})).sort((a,b)=>a.d-b.d)[0].i;
  const pointCm=osseous.points[index],sourceTriangle=osseous.sourceTriangles[index],triangle=new Triangle();
  triangle.a.fromArray(bone.positions as number[],bone.indices[sourceTriangle*3]*3);triangle.b.fromArray(bone.positions as number[],bone.indices[sourceTriangle*3+1]*3);triangle.c.fromArray(bone.positions as number[],bone.indices[sourceTriangle*3+2]*3);
  const barycentric=triangle.getBarycoord(new Vector3(...pointCm),new Vector3())!.toArray();
  const residual=triangle.closestPointToPoint(new Vector3(...pointCm),new Vector3()).distanceTo(new Vector3(...pointCm));if(residual>1e-6)throw Error('Bone witness is not on original triangle');
  const id=`v2-rim-${side}-${offsetCm.toFixed(1)}`;
  candidates.push({id,side,route:'rotundum',name:`Borda óssea em revisão · V2 · Z ${(offsetCm*10).toFixed(0)}mm`,
   role:'Actual bone rim witness on a closed section containing the named source V2 profile. NOT the foramen centre or a certified anatomical landmark.',
   pointCm,sourceWorldMetres:sourceMetres(pointCm),axis:'z',offsetCm,sourceTriangle,barycentric,residualCm:residual,
   relatedArterialDistances:['foramen_rotundum_branch','artery_of_foramen_rotundum_from_maxillary'].map(base=>{
     const item=reconstructedVessels.find(r=>r.id===`${base}_${side}`)!,s=item.surface,q=new Vector3(),p=new Vector3(...pointCm);let squared=Infinity,targetTriangle=-1,nearest:Point3=[0,0,0];
     const tri=new Triangle();
     for(let i=0;i<s.indices.length;i+=3){tri.a.fromArray(s.positions as number[],s.indices[i]*3);tri.b.fromArray(s.positions as number[],s.indices[i+1]*3);tri.c.fromArray(s.positions as number[],s.indices[i+2]*3);if(tri.getArea()<1e-14)continue;tri.closestPointToPoint(p,q);if(p.distanceToSquared(q)<squared){squared=p.distanceToSquared(q);targetTriangle=i/3;nearest=q.toArray() as Point3;}}
     return {id:item.id,origin:'illustrative',surfaceSHA256:crypto.createHash('sha256').update(new Uint8Array(surfaceEvidenceBytes({id:item.id,origin:'illustrative',layer:item.layer,...s}))).digest('hex'),pointToAllTrianglesDistanceCm:Math.sqrt(squared),targetTriangle,targetPointCm:nearest,anatomicalPassageVerified:false};
   }),
   boneId:bone.id,nerveId:nerve.id,boneSurfaceSHA256:hash(bone),nerveSurfaceSHA256:hash(nerve),
   boneContour:osseous,nerveContour:neural,strictSectionEnclosure:true,
   contourDiagnostics:{bone:{open:b.openComponents,branched:b.branchedComponents,invalid:b.invalidLoops,coplanar:boneSection.coplanarTriangles},nerve:{open:n.openComponents,branched:n.branchedComponents,invalid:n.invalidLoops,coplanar:nerveSection.coplanarTriangles}},
   nearbyPlaneChecks:[0,1,2].map(axis=>({axis,offsetCm:pointCm[axis],boneSegments:sectionSurface(bone,axis,pointCm[axis]).segments.length,nerveSegments:sectionSurface(nerve,axis,pointCm[axis]).segments.length})),
   namedForamenVerified:false,full3DTunnelVerified:false,arterialPassageVerified:false});
 }
}
const result={schema:1,baseCommit:'cc947c3e181816be6d91169ac0fcf616fe89dad5',license:'CC-BY-SA-4.0',attribution:openAnatomy.attribution,sourceRepository:openAnatomy.sourceRepository,
 sourceCommit:'6320bd64df8db2fcfed358a27c85d1fcc1c5913c',coordinateSystem:'Atlas centimetres, Y up; glTF world metres x100, Y-160. No DICOM registration.',
 weldToleranceCm:1e-6,sourceFiles:[...reader.sourceFiles].map(([file,sha256])=>({file,sha256})),candidates,
 v3Status:'No certified V3 foramen landmark. Available anterior/posterior mandibular divisions do not establish the complete preforaminal V3 trunk; exploratory sections did not establish a named oval aperture.',
 limits:'Two directed Z sections per side are not a complete 3D tunnel audit. Closed contour and strict nerve-profile containment are geometric evidence only. No source geometry changed and no anatomical name assigned by proximity.'};
fs.writeFileSync('features/neuro3d/skull-landmark-evidence.json',JSON.stringify(result)+'\n');console.log(JSON.stringify(candidates.map(c=>({id:c.id,pointCm:c.pointCm,areaCm2:c.boneContour.areaCm2,triangle:c.sourceTriangle,residual:c.residualCm}))));
