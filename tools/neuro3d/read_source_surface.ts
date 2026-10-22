import fs from 'node:fs';
import crypto from 'node:crypto';
import {createRequire} from 'node:module';
import {Matrix4,Quaternion,Vector3} from 'three';
import {openAnatomy,worldPoint} from '../../features/neuro3d/openAnatomy';
import type {PassageSurface} from '../../features/neuro3d/passageGeometry';
export async function sourceSurfaceReader(){
  const require=createRequire(process.cwd()+'/package.json');const decoder=await require('draco3d').createDecoderModule({});
  const cache=new Map<string,{doc:any;bin:Buffer}>();const sourceFiles=new Map<string,string>();
  function read(id:string):PassageSurface{
    const item=openAnatomy.structures.find(row=>row.id===id);if(!item)throw Error('Unknown source ID '+id);
    if(!cache.has(item.file)){
      const bytes=fs.readFileSync('public/neuro3d/open-anatomy/'+item.file),asset=openAnatomy.assets.find(a=>a.file===item.file)!;
      const hash=crypto.createHash('sha256').update(bytes).digest('hex');if(hash!==asset.sha256||bytes.length!==asset.size)throw Error('Source integrity mismatch');
      const size=bytes.readUInt32LE(12);cache.set(item.file,{doc:JSON.parse(bytes.toString('utf8',20,20+size)),bin:bytes.subarray(28+size)});sourceFiles.set(item.file,hash);
    }
    const {doc,bin}=cache.get(item.file)!;const ni=doc.nodes.findIndex((n:any)=>n.extras?.qbankAnatomyId===id);
    if(ni<0)throw Error('Missing exact source identity '+id);
    const matrix=(i:number,seen=new Set<number>()):Matrix4=>{
      if(seen.has(i))throw Error('Cyclic source hierarchy');seen.add(i);
      const n=doc.nodes[i],local=n.matrix?new Matrix4().fromArray(n.matrix):new Matrix4().compose(new Vector3(...(n.translation??[0,0,0]) as [number,number,number]),new Quaternion(...(n.rotation??[0,0,0,1]) as [number,number,number,number]),new Vector3(...(n.scale??[1,1,1]) as [number,number,number]));
      const parents=doc.nodes.flatMap((p:any,k:number)=>p.children?.includes(i)?[k]:[]);if(parents.length>1)throw Error('Ambiguous hierarchy');return parents.length?matrix(parents[0],seen).multiply(local):local;
    };
    const transform=matrix(ni);
    const positions:number[]=[],indices:number[]=[];
    for(const p of doc.meshes[doc.nodes[ni].mesh].primitives){
      const ext=p.extensions?.KHR_draco_mesh_compression;if(!ext)throw Error('Unsupported primitive');
      const view=doc.bufferViews[ext.bufferView],bytes=bin.subarray(view.byteOffset??0,(view.byteOffset??0)+view.byteLength);
      const db=new decoder.DecoderBuffer(),dec=new decoder.Decoder(),mesh=new decoder.Mesh(),values=new decoder.DracoFloat32Array(),face=new decoder.DracoInt32Array();
      try{db.Init(new Int8Array(bytes),bytes.length);const status=dec.DecodeBufferToMesh(db,mesh);try{if(!status.ok())throw Error(status.error_msg());}finally{decoder.destroy(status);}
        if(!dec.GetAttributeFloatForAllPoints(mesh,dec.GetAttributeByUniqueId(mesh,ext.attributes.POSITION),values))throw Error('Missing positions');
        const base=positions.length/3;
        for(let i=0;i<mesh.num_points();i++)positions.push(...worldPoint(new Vector3(values.GetValue(i*3),values.GetValue(i*3+1),values.GetValue(i*3+2)).applyMatrix4(transform).toArray()));
        for(let i=0;i<mesh.num_faces();i++){dec.GetFaceFromMesh(mesh,i,face);for(let j=0;j<3;j++)indices.push(base+face.GetValue(j));}
      }finally{for(const x of [face,values,mesh,dec,db])decoder.destroy(x);}
    }
    return {id,layer:item.layer,origin:'imported',positions:new Float32Array(positions),indices:new Uint32Array(indices)};
  }
  return {read,sourceFiles};
}
