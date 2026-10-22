import {describe,it,expect} from 'vitest';
import {sectionSurface,sampledSurfaceDistance,sourceMetres,inspectionPlanePose,type PassageSurface} from './passageGeometry';
import {Euler,Vector3} from 'three';
const surface=(p:number[],i=[0,1,2]):PassageSurface=>({id:'test',layer:'bone',origin:'imported',positions:p,indices:i});
describe('physical passage geometry independent analytic fixtures',()=>{
  it('positions the 60mm 3D reference plane in the same atlas coordinates as the cut',()=>{
    for(const [axis,normal] of [['x',0],['y',1],['z',2]] as const){
      const pose=inspectionPlanePose({passageId:'test',side:'r',axis,centerCm:[1,2,3],offsetCm:4});
      for(const p of [[-3,-3,0],[3,3,0]]){
        const world=new Vector3(...p as [number,number,number]).applyEuler(new Euler(...pose.rotation)).add(new Vector3(...pose.position));
        expect(world.getComponent(normal)).toBeCloseTo(4,12);
      }
    }
  });
  it('intersects a triangle analytically and keeps the third coordinate and source inversion',()=>{
    const s=surface([0,0,0,2,0,2,0,2,2]);
    expect(sectionSurface(s,2,1).segments).toEqual([[[1,0,1],[0,1,1]]]);
    expect(sectionSurface(s,2,3).segments).toEqual([]);
    expect(sourceMetres([2,-3,4])).toEqual([.02,1.57,.04]);
  });
  it('does not fabricate a contour from coplanar triangles or a tangent vertex',()=>{
    expect(sectionSurface(surface([0,0,0,1,0,0,0,1,0]),2,0)).toMatchObject({segments:[],coplanarTriangles:1});
    expect(sectionSurface(surface([0,0,0,1,0,1,0,1,1]),2,0).segments).toEqual([]);
    expect(()=>sectionSurface(surface([]),3,0)).toThrow();
  });
  it('records an analytic distance, witness and barycentric coordinates without certifying a connection',()=>{
    const a=surface([.25,.25,3,.3,.25,3,.25,.3,3]);const b=surface([0,0,0,1,0,0,0,1,0]);
    const result=sampledSurfaceDistance(a,b);
    expect(result.sampledUpperBoundCm).toBe(3);expect(result.aabbLowerBoundCm).toBe(3);
    expect(result.witness.to).toEqual([.25,.25,0]);expect(result.witness.targetBarycentric).toEqual([.5,.25,.25]);
    expect(result.continuousLumenVerified).toBe(false);expect(result.globalSeparationProven).toBe(true);
  });
});
