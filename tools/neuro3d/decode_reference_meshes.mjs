import fs from 'node:fs';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url); const draco=require(process.argv[4] ?? 'draco3d');
const decoder=await draco.createDecoderModule({});
const root=process.argv[2].replace(/\/?$/, '/');
const output={};
function transform(p,n){
 const q=n.rotation??[0,0,0,1], s=n.scale??[1,1,1],t=n.translation??[0,0,0];
 const [x,y,z]=p.map((v,i)=>v*s[i]);const [qx,qy,qz,qw]=q;
 const ix=qw*x+qy*z-qz*y,iy=qw*y+qz*x-qx*z,iz=qw*z+qx*y-qy*x,iw=-qx*x-qy*y-qz*z;
 return [(ix*qw+iw*-qx+iy*-qz-iz*-qy+t[0])*100,(iy*qw+iw*-qy+iz*-qx-ix*-qz+t[1])*100-160,(iz*qw+iw*-qz+ix*-qy-iy*-qx+t[2])*100];
}
for(const file of (process.argv[5]?.split(',') ?? ['cardiovascular_head.glb','skeletal_head.glb'])){
 const raw=fs.readFileSync(root+file);const len=raw.readUInt32LE(12),doc=JSON.parse(raw.subarray(20,20+len)),bin=raw.subarray(28+len);
 for(const node of doc.nodes){
  const prim=doc.meshes[node.mesh].primitives[0],ext=prim.extensions.KHR_draco_mesh_compression,bv=doc.bufferViews[ext.bufferView];
  const bytes=bin.subarray(bv.byteOffset??0,(bv.byteOffset??0)+bv.byteLength);const buffer=new decoder.DecoderBuffer();buffer.Init(new Int8Array(bytes),bytes.length);
  const dec=new decoder.Decoder(),mesh=new decoder.Mesh();const status=dec.DecodeBufferToMesh(buffer,mesh);if(!status.ok())throw Error(status.error_msg());
  const att=dec.GetAttributeByUniqueId(mesh,ext.attributes.POSITION),arr=new decoder.DracoFloat32Array();dec.GetAttributeFloatForAllPoints(mesh,att,arr);
  const positions=[];for(let i=0;i<mesh.num_points();i++)positions.push(transform([arr.GetValue(i*3),arr.GetValue(i*3+1),arr.GetValue(i*3+2)],node));
  const face=new decoder.DracoInt32Array(),faces=[];for(let i=0;i<mesh.num_faces();i++){dec.GetFaceFromMesh(mesh,i,face);const f=[face.GetValue(0),face.GetValue(1),face.GetValue(2)]; if((node.scale??[1,1,1]).reduce((a,b)=>a*b,1)<0)f.reverse(); faces.push(f);}
  output[node.extras.qbankAnatomyId]={positions,faces};
  for(const v of [face,arr,mesh,dec,buffer])decoder.destroy(v);
 }
}
fs.writeFileSync(process.argv[3],JSON.stringify(output));
console.log(Object.keys(output).length,'meshes decoded');
