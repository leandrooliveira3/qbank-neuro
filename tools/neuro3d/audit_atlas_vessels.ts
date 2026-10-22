/** Bundle with esbuild for Node; run at repository root. No assets are changed.
 * Geometric/interaction evidence is separate from anatomical identification.
 */
import fs from 'node:fs';
import crypto from 'node:crypto';
import {createRequire} from 'node:module';
import {gunzipSync} from 'node:zlib';
import {Matrix4,Quaternion,Vector3,BufferGeometry,Float32BufferAttribute,Mesh,MeshBasicMaterial,DoubleSide,Raycaster,Triangle} from 'three';
import {openAnatomy,worldPoint} from '../../features/neuro3d/openAnatomy';
import {reconstructedVessels} from '../../features/neuro3d/reconstructedVessels';
import {vascularCompleteness,vascularCompletenessCounts} from '../../features/neuro3d/vascularCompleteness';
import {neuroangioReviewSources} from '../../features/neuro3d/neuroangioRequirements';
import {neurovascularPassages,resolvePassage,passagesForVessel,passageBookEvidence} from '../../features/neuro3d/neurovascularPassages';
import {vascularStudyFamily} from '../../features/neuro3d/vascularStudyFamilies';
import {vascularExploration} from '../../features/neuro3d/vascularExploration';
import {structureVisible} from '../../features/neuro3d/atlasInteraction';
import {atlasProjection,fitAtlasField,unprojectAtlasPixel} from '../../features/neuro3d/atlasProjection';
import {projectSpatial} from '../../features/neuro3d/simulation/station/projectionMath';
import metadata from '../../features/neuro3d/reference-surfaces.json';
import distal from '../../features/neuro3d/reference-distal-aca.json';
import landmarks from '../../features/neuro3d/reference-landmarks.json';
import supra from '../../features/neuro3d/reference-supra-aortic.json';
import body from '../../features/neuro3d/reference-body-access.json';
import context from '../../features/neuro3d/reference-craniocervical.json';
import unindexed from '../../features/neuro3d/reference-unindexed-vessels.json';
const sha=(b:Uint8Array)=>crypto.createHash('sha256').update(b).digest('hex');
type Shape={positions:number[];indices:number[]};
const folder='public/neuro3d/open-anatomy/';
const sourceFiles:{file:string;sha256:string}[]=[];
const raw=fs.readFileSync(folder+'reference-surfaces.bin');
if(sha(raw)!==metadata.sha256)throw Error('Base geometry checksum mismatch');
sourceFiles.push({file:'reference-surfaces.bin',sha256:sha(raw)});
const projections=new Map<string,Shape>();
for(const row of metadata.structures)projections.set(row.id,{positions:Array.from({length:row.positionsCount},(_,i)=>raw.readFloatLE(row.positionsOffset+i*4)),indices:Array.from({length:row.indicesCount},(_,i)=>raw.readUInt32LE(row.indicesOffset+i*4))});
for(const pack of [distal,landmarks,supra,body,context,unindexed]){
  const bytes=fs.readFileSync(folder+pack.file);if(sha(bytes)!==pack.sha256)throw Error('Supplement checksum mismatch');
  sourceFiles.push({file:pack.file,sha256:sha(bytes)});
  const shapes=JSON.parse(gunzipSync(bytes).toString()) as (Shape&{id:string})[];
  for(const shape of shapes)projections.set(shape.id,shape);
}
const require=createRequire(process.cwd()+'/package.json');
const decoder=await require('draco3d').createDecoderModule({});
const glbs=new Map<string,{doc:any;bin:Buffer}>();
const worldScale=new Matrix4().makeScale(100,100,100);worldScale.setPosition(0,-160,0);
function original(item:typeof openAnatomy.structures[number]):Shape{
  if(!glbs.has(item.file)){
    const bytes=fs.readFileSync(folder+item.file),asset=openAnatomy.assets.find(a=>a.file===item.file)!;
    if(sha(bytes)!==asset.sha256)throw Error('GLB checksum mismatch '+item.file);
    const length=bytes.readUInt32LE(12);glbs.set(item.file,{doc:JSON.parse(bytes.toString('utf8',20,20+length)),bin:bytes.subarray(28+length)});
    sourceFiles.push({file:item.file,sha256:sha(bytes)});
  }
  const {doc,bin}=glbs.get(item.file)!;const ni=doc.nodes.findIndex((n:any)=>n.name===item.node);
  if(ni<0)throw Error('Missing source node '+item.id);
  function matrix(i:number):Matrix4{
    const n=doc.nodes[i];const local=n.matrix?new Matrix4().fromArray(n.matrix):new Matrix4().compose(new Vector3(...(n.translation??[0,0,0]) as [number,number,number]),new Quaternion(...(n.rotation??[0,0,0,1]) as [number,number,number,number]),new Vector3(...(n.scale??[1,1,1]) as [number,number,number]));
    const parents=doc.nodes.map((p:any,k:number)=>p.children?.includes(i)?k:-1).filter((k:number)=>k>=0);
    if(parents.length>1)throw Error('Ambiguous source hierarchy');
    return parents.length?matrix(parents[0]).multiply(local):local;
  }
  const m=worldScale.clone().multiply(matrix(ni));const positions:number[]=[],indices:number[]=[];
  for(const p of doc.meshes[doc.nodes[ni].mesh].primitives){
    const ext=p.extensions?.KHR_draco_mesh_compression;if(!ext)throw Error('Unsupported source primitive '+item.id);
    const view=doc.bufferViews[ext.bufferView],bytes=bin.subarray(view.byteOffset??0,(view.byteOffset??0)+view.byteLength);
    const db=new decoder.DecoderBuffer(),dec=new decoder.Decoder(),mesh=new decoder.Mesh(),values=new decoder.DracoFloat32Array(),face=new decoder.DracoInt32Array();
    try{
      db.Init(new Int8Array(bytes),bytes.length);const status=dec.DecodeBufferToMesh(db,mesh);if(!status.ok())throw Error(status.error_msg());
      if(!dec.GetAttributeFloatForAllPoints(mesh,dec.GetAttributeByUniqueId(mesh,ext.attributes.POSITION),values))throw Error('Missing positions');
      const offset=positions.length/3;
      for(let i=0;i<mesh.num_points();i++)positions.push(...new Vector3(values.GetValue(i*3),values.GetValue(i*3+1),values.GetValue(i*3+2)).applyMatrix4(m).toArray());
      for(let i=0;i<mesh.num_faces();i++){dec.GetFaceFromMesh(mesh,i,face);for(let k=0;k<3;k++)indices.push(offset+face.GetValue(k));}
    }finally{for(const x of [face,values,mesh,dec,db])decoder.destroy(x);}
  }
  return {positions,indices};
}
const originals=new Map<string,Shape>();
for(const item of openAnatomy.structures.filter(r=>['arterial','venous'].includes(r.layer)))originals.set(item.id,original(item));
for(const item of reconstructedVessels){const shape={positions:Array.from(item.surface.positions),indices:Array.from(item.surface.indices)};originals.set(item.id,shape);projections.set(item.id,shape);}
function metrics(shape:Shape){
  const {positions:p,indices:f}=shape;const n=p.length/3;
  if(!Number.isInteger(n)||!n||f.length%3||!f.length||!p.every(Number.isFinite)||f.some(i=>!Number.isInteger(i)||i<0||i>=n))throw Error('Invalid surface arrays');
  const parent=Array.from({length:n},(_,i)=>i);const root=(i:number):number=>{while(parent[i]!==i){parent[i]=parent[parent[i]];i=parent[i];}return i;};
  let degenerate=0;const edges=new Map<string,number>();
  for(let i=0;i<f.length;i+=3){const a=f[i],b=f[i+1],c=f[i+2];parent[root(b)]=root(a);parent[root(c)]=root(a);
    const va=new Vector3().fromArray(p,a*3),vb=new Vector3().fromArray(p,b*3),vc=new Vector3().fromArray(p,c*3);
    if(vb.sub(va).cross(vc.sub(va)).lengthSq()<1e-16)degenerate++;
    for(const [u,v]of [[a,b],[b,c],[c,a]]){const key=u<v?`${u}:${v}`:`${v}:${u}`;edges.set(key,(edges.get(key)??0)+1);}
  }
  const bounds=[0,1].map(end=>[0,1,2].map(k=>p.reduce((best,v,i)=>i%3===k?(end?Math.max(best,v):Math.min(best,v)):best,end?-Infinity:Infinity)));
  return {vertices:n,triangles:f.length/3,degenerateTriangles:degenerate,indexComponents:new Set(parent.map((_,i)=>root(i))).size,boundaryEdges:[...edges.values()].filter(n=>n===1).length,nonmanifoldEdges:[...edges.values()].filter(n=>n>2).length,boundsCm:bounds};
}
function pickTests(shape:Shape){
  const buffer=new BufferGeometry();buffer.setAttribute('position',new Float32BufferAttribute(shape.positions,3));buffer.setIndex(shape.indices);
  const material=new MeshBasicMaterial({side:DoubleSide}),mesh=new Mesh(buffer,material);mesh.updateMatrixWorld(true);
  let point:Vector3|undefined;
  for(let i=0;i<shape.indices.length;i+=3){const a=new Vector3().fromArray(shape.positions,shape.indices[i]*3),b=new Vector3().fromArray(shape.positions,shape.indices[i+1]*3),c=new Vector3().fromArray(shape.positions,shape.indices[i+2]*3);if(new Triangle(a,b,c).getArea()>1e-8){point=a.add(b).add(c).divideScalar(3);break;}}
  const bounds=metrics(shape).boundsCm;
  const results=([['AP',0,0],['Lateral',90,0],['Oblíqua',31,10]] as const).map(([view,yaw,pitch])=>{
    const fit=fitAtlasField(bounds,yaw,pitch),v=atlasProjection(yaw,pitch,fit.zoom,fit.center);
    if(!point)return {view,hit:false};
    const pixel=projectSpatial(point.toArray() as [number,number,number],v);
    const origin=new Vector3(...unprojectAtlasPixel(pixel[0],pixel[1],200,v)),end=new Vector3(...unprojectAtlasPixel(pixel[0],pixel[1],-200,v));
    return {view,hit:new Raycaster(origin,end.sub(origin).normalize()).intersectObject(mesh,false).length>0};
  });buffer.dispose();material.dispose();return results;
}
function distanceToSurface(point:number[],shape:Shape){
  let squared=Infinity;const query=new Vector3(...point as [number,number,number]),nearest=new Vector3(),triangle=new Triangle();
  for(let i=0;i<shape.indices.length;i+=3){
    triangle.a.fromArray(shape.positions,shape.indices[i]*3);triangle.b.fromArray(shape.positions,shape.indices[i+1]*3);triangle.c.fromArray(shape.positions,shape.indices[i+2]*3);
    triangle.closestPointToPoint(query,nearest);squared=Math.min(squared,nearest.distanceToSquared(query));
  }
  return Math.sqrt(squared);
}
const rows=[];
for(const item of [...openAnatomy.structures,...reconstructedVessels].filter(r=>['arterial','venous'].includes(r.layer))){
  const full=originals.get(item.id)!,projection=projections.get(item.id);if(!projection)throw Error('No projection counterpart '+item.id);
  const m=metrics(full),p=metrics(projection),plan=vascularExploration(item.id,new Set([item.id]),{arterial:0,venous:0})!;
  const parentId='parentId'in item?item.parentId:undefined,parent=parentId?originals.get(parentId):undefined;
  const endpoints='points'in item&&item.points.length?[item.points[0],item.points[item.points.length-1]]:undefined;
  const family=vascularStudyFamily(item.id);
  rows.push({id:item.id,layer:item.layer,origin:'status'in item?'reconstructed':'imported',
    coordinateBasis:'coordinateBasis'in item?item.coordinateBasis:'source GLB original node hierarchy x100, Y-160',
    original:m,projection:p,projectionBoundsDifferenceCm:Math.max(...m.boundsCm.flatMap((b,e)=>b.map((v,k)=>Math.abs(v-p.boundsCm[e][k])))),
    revealedByExplicitAction:structureVisible(item.id,item.layer,plan.opacity,item.id,true,plan.hidden,true,plan.layer),
    isolatedOriginalRayTests:pickTests(full),isolatedProjectionRayTests:pickTests(projection),
    branchAndCourseReview:{studyFamilyRequirements:family.rows.map(row=>({id:row.id,root:row.root,expected:row.expectedIds,missing:row.missingIds,referenceMissing:row.referenceMissingIds.filter(id=>row.expectedIds.includes(id))})),
      allAnatomicalBranchesInventoried:false,fullCourseVerified:false,linkedPassageIds:passagesForVessel(item.id).map(row=>row.id),anastomosisLumenVerified:false},
    studyParentComparison:parent&&endpoints?{parentId,parentOrigin:openAnatomy.structures.some(r=>r.id===parentId)?'imported':'reconstructed',
      axisEndpointToParentSurfaceCm:endpoints.map(point=>distanceToSurface(point,parent)),
      interpretation:'Illustrative axis endpoints to all parent triangles, not tube-wall distance, ostium, drainage, patient correspondence or verified connection.'}:null,
    anatomicalIdentityVerified:false,sourcePatientCorrespondenceVerified:false});
}
const report={schema:1,baseCommit:'353d149586290e97670711ce02e0175fcae5a79d',sourceFiles,
  counts:{vessels:rows.length,imported:rows.filter(r=>r.origin==='imported').length,reconstructed:rows.filter(r=>r.origin==='reconstructed').length,
    rayFailures:rows.filter(r=>[...r.isolatedOriginalRayTests,...r.isolatedProjectionRayTests].some(v=>!v.hit)).length,
    revealFailures:rows.filter(r=>!r.revealedByExplicitAction).length},coverage:vascularCompletenessCounts,
  neuroangioReviews:neuroangioReviewSources,passageBookEvidence,
  passages:neurovascularPassages.flatMap(row=>(['l','r'] as const).map(side=>resolvePassage(row,side))),
  missingGeometry:vascularCompleteness.filter(r=>r.missingIds.length).map(r=>({id:r.id,expected:r.missingIds,references:r.references})),
  vessels:rows,method:'All original imported vascular GLBs Draco-decoded with full node hierarchy; actual simplified projection buffers and all reconstructed surfaces; index topology, finite data, bounds, explicit reveal and six isolated ray tests per identity.',
  limitations:'Index boundaries/components can reflect seams or intended open ends; these are findings, not automatic rejection. Ray tests are CPU geometry tests, not browser tests of every vessel or anatomical validation. No image registration, named-label transfer or comparison to patient-specific vessel identity was established. No coordinates, IDs, bridges or clinical algorithms changed.'};
fs.writeFileSync('docs/neuro3d-atlas-self-audit.json',JSON.stringify(report)+'\n');
console.log(JSON.stringify({counts:report.counts,coverage:report.coverage,files:sourceFiles.length}));
