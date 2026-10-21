import {it,expect} from 'vitest';
import {Scene,Group,Mesh,BufferGeometry,Float32BufferAttribute,MeshBasicMaterial} from 'three';
import {surfaceFromScene} from './fullVascularSurface';
it('retains ancestor and node transforms and the same world centimetres as the original atlas without per-vessel centering',()=>{
  const scene=new Scene(),parent=new Group();parent.position.set(0,.01,0);scene.add(parent);
  const geometry=new BufferGeometry();geometry.setAttribute('position',new Float32BufferAttribute([0,0,0,.1,0,0,0,.1,0],3));geometry.setIndex([0,1,2]);
  const mesh=new Mesh(geometry,new MeshBasicMaterial());mesh.position.set(.1,1.59,.2);mesh.userData.qbankAnatomyId='test';parent.add(mesh);
  const shape=surfaceFromScene(scene,'test','venous');
  const expected=[10,0,20,20,0,20,10,10,20];shape.positions.forEach((v,i)=>expect(v).toBeCloseTo(expected[i],5));
  expect(Array.from(shape.indices)).toEqual([0,1,2]);expect(shape.id).toBe('test');
  expect(()=>surfaceFromScene(scene,'different','venous')).toThrow(/identidade/);
  geometry.dispose();(mesh.material as MeshBasicMaterial).dispose();
});
