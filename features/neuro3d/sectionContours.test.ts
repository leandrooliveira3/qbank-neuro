import {it,expect} from 'vitest';
import {sectionContours,pointInContour,strictlyEncloses,type SectionLoop} from './sectionContours';
import type {Point3} from './passageGeometry';
const square=(r:number):SectionLoop=>({points:[[-r,-r,0],[r,-r,0],[r,r,0],[-r,r,0]],areaCm2:4*r*r,sourceTriangles:[0,1,2,3]});
it('traces an unordered square without making an open or branched contour closed',()=>{
 const p=square(1).points,segments:[[Point3,Point3],[Point3,Point3],[Point3,Point3],[Point3,Point3]]=[[p[2],p[3]],[p[1],p[0]],[p[2],p[1]],[p[3],p[0]]];
 const result=sectionContours({segments,triangleIds:[8,9,10,11]},0,1);expect(result.loops).toHaveLength(1);expect(result.loops[0].areaCm2).toBe(4);expect(result.loops[0].sourceTriangles.sort((a,b)=>a-b)).toEqual([8,9,10,11]);
 expect(sectionContours({segments:segments.slice(1)},0,1)).toMatchObject({loops:[],openComponents:1});
 expect(sectionContours({segments:[...segments,[[0,0,0],p[0]]]},0,1).branchedComponents).toBe(1);
});
it('distinguishes strict containment, boundary contact, outside and self-crossing loops',()=>{
 const outer=square(2),inner=square(1);expect(strictlyEncloses(outer,inner,0,1)).toBe(true);expect(strictlyEncloses(inner,outer,0,1)).toBe(false);
 expect(strictlyEncloses(outer,{...inner,points:inner.points.map(([x,y])=>[x,y,1])},0,1)).toBe(false);
 expect(pointInContour([2,0,0],outer,0,1)).toBe('boundary');expect(pointInContour([3,0,0],outer,0,1)).toBe('outside');
 const bow:Point3[]=[[-1,-1,0],[1,1,0],[-1,1,0],[1,-1,0]];
 expect(sectionContours({segments:bow.map((p,i)=>[p,bow[(i+1)%4]])},0,1)).toMatchObject({loops:[],invalidLoops:1});
 expect(()=>sectionContours({segments:[]},0,1,0)).toThrow();
});
it('rejects a profile whose vertices are inside but whose edge crosses a concave gap',()=>{
 const points:Point3[]=[[-3,-3,0],[3,-3,0],[3,3,0],[1,3,0],[1,-1,0],[-1,-1,0],[-1,3,0],[-3,3,0]];
 const outer:SectionLoop={points,areaCm2:28,sourceTriangles:[]},inner:SectionLoop={points:[[-2,2,0],[2,2,0],[0,-2,0]],areaCm2:8,sourceTriangles:[]};
 expect(inner.points.every(p=>pointInContour(p,outer,0,1)==='inside')).toBe(true);
 expect(strictlyEncloses(outer,inner,0,1)).toBe(false);
});
