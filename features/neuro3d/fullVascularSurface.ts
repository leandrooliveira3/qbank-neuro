import {Mesh,Vector3,type Object3D} from 'three';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import {DRACOLoader} from 'three/examples/jsm/loaders/DRACOLoader.js';
import {openAnatomy,openAssetUrl,worldPoint} from './openAnatomy';
import type {ReferenceSurface} from './simulation/station/referenceGeometry';
import {sha256} from './comparison/geometry';
/** Full source mesh, including node ancestors, using the atlas display transform.
 * Only substitutes the explicitly isolated imported selection in atlas 2D.
 * Never used to extend procedural navigation or rename an image-derived vessel.
 */
export function surfaceFromScene(scene:Object3D,id:string,layer:string):ReferenceSurface{
  scene.updateMatrixWorld(true);const positions:number[]=[],indices:number[]=[];
  scene.traverse(node=>{
    if(!(node instanceof Mesh)||node.userData.qbankAnatomyId!==id)return;
    const p=node.geometry.getAttribute('position'),index=node.geometry.getIndex(),offset=positions.length/3;
    if(!p||p.count>1_000_000)throw Error('Dimensão da malha original não suportada.');
    for(let i=0;i<p.count;i++){const point=new Vector3().fromBufferAttribute(p,i).applyMatrix4(node.matrixWorld);positions.push(...worldPoint(point.toArray()));}
    for(let i=0;i<(index?.count??p.count);i++)indices.push(offset+(index?index.getX(i):i));
  });
  if(!positions.length||indices.length%3||positions.some(v=>!Number.isFinite(v))||indices.some(i=>!Number.isInteger(i)||i<0||i>=positions.length/3))throw Error('Malha original sem identidade ou geometria utilizável.');
  return {id,layer,positions:new Float32Array(positions),indices:new Uint32Array(indices)};
}
export async function loadFullVascularSurface(id:string,signal:AbortSignal){
  const item=openAnatomy.structures.find(row=>row.id===id),asset=item&&openAnatomy.assets.find(row=>row.file===item.file);
  if(!item||!asset||!['arterial','venous'].includes(item.layer))throw Error('Seleção sem malha vascular importada.');
  const response=await fetch(openAssetUrl(item.file),{signal});if(!response.ok)throw Error('Falha ao abrir a malha original.');
  const bytes=await response.arrayBuffer();
  if(bytes.byteLength!==asset.size||await sha256(bytes)!==asset.sha256)throw Error('Integridade da malha original não confirmada.');
  if(signal.aborted)throw new DOMException('Aborted','AbortError');
  const draco=new DRACOLoader().setDecoderPath(openAssetUrl('draco/'));
  const loader=new GLTFLoader().setDRACOLoader(draco);
  let scene:Object3D|undefined;
  try{
    const gltf=await loader.parseAsync(bytes,'');scene=gltf.scene;
    if(signal.aborted)throw new DOMException('Aborted','AbortError');
    return surfaceFromScene(scene,id,item.layer);
  }finally{
    scene?.traverse(node=>{if(node instanceof Mesh){node.geometry.dispose();for(const m of Array.isArray(node.material)?node.material:[node.material])m.dispose();}});
    draco.dispose();
  }
}
