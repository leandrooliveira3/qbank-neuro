import {it,expect} from 'vitest';
import {parseMhd,parseRad,transform,voxelToWorld,worldToVoxel,projectWorld,detectorRay,rayAtVolumeSlice,renderSlice,validateBox,validateRoi} from './geometry';
import {readGeometryFiles} from './reader';
const mhd=`ObjectType = Image\nNDims = 3\nDimSize = 8 6 4\nElementSpacing = 1 1 1\nPosition = 0 0 0\nOrientation = 1 0 0\n0 1 0\n0 0 1\nAnatomicalOrientation = R P I\nElementByteOrderMSB = False\nElementType = MET_SHORT\nElementDataFile = Case.raw\n`;
const rad=`Size[pixels]: 16 12\nStep[mm]: 1 1\nDataType: float\nTPosition:\n1 0 0 0\n0 1 0 0\n0 0 1 10\n0 0 0 1\nSourcePosition[mm]: 0 0 -10\n`;
it('parses native multiline matrices and rejects invalid encoding, oversized data, external paths and singular transforms',()=>{
 expect(parseMhd(mhd).bytes).toBe(384);expect(parseRad(rad).bytes).toBe(768);
 for(const text of [mhd.replace('False','True'),mhd.replace('Case.raw','../Case.raw'),mhd.replace('8 6 4','16384 16384 16384'),mhd.replace('0 0 1\nAnatomical','0 0\nAnatomical'),mhd.replace('0 0 1\nAnatomical','0 0 0\nAnatomical')])expect(()=>parseMhd(text)).toThrow();
 expect(()=>parseRad(rad.replace('0 0 0 1','0 0 0 0'))).toThrow();
});
it('preserves voxel→Sv→Sw through nonorthogonal affine transforms and source rays through the actual displayed slice',()=>{
 const h=parseMhd(mhd.replace('Position = 0 0 0','Position = 4 -3 2').replace('1 0 0\n0 1 0','1 .1 0\n0 2 0')),p:[number,number,number]=[2.5,1.5,1.25];
 const q=worldToVoxel(voxelToWorld(p,h),h);q.forEach((n,k)=>expect(n).toBeCloseTo(p[k],12));
 const d=parseRad(rad),vol=parseMhd(mhd),projected=projectWorld([3,2,2],d);expect(projected.pixel[0]).toBeCloseTo(5,12);expect(projected.pixel[1]).toBeCloseTo(10/3,12);
 const ray=detectorRay([0,0],d);expect(ray.detectorWorld).toEqual([0,0,10]);expect(rayAtVolumeSlice(projected.pixel,d,vol,2,2)).toEqual([3,2,2]);
 const affineDetector=parseRad(rad.replace('1 0 0 0\n0 1 0 0\n0 0 1 10','1 .01 0 5\n0 1 .02 -2\n.01 0 1 10'));affineDetector.sourceWorld=transform([0,0,-20],affineDetector.toWorld);const invariant=projectWorld(transform([3,2,-8],affineDetector.toWorld),affineDetector);invariant.pixel.forEach((n,k)=>expect(n).toBeCloseTo(projected.pixel[k],10));
 expect(()=>projectWorld([1,2,-10],d)).toThrow();
});
it('keeps native x-fastest intensities and inclusive VOI boundaries for all three planes without flips',()=>{
 const h=parseMhd(mhd),values=new Int16Array(192);for(let z=0;z<4;z++)for(let y=0;y<6;y++)for(let x=0;x<8;x++)values[x+8*(y+6*z)]=x+10*y+100*z;
 const roi:[number,number,number,number,number,number]=[1,4,1,4,1,3];
 for(const axis of [0,1,2]){const r=renderSlice(values,h,axis,2,roi,[0,1000]),[u,v]=r.axes,p=[0,0,0];p[axis]=2;p[u]=1;p[v]=1;expect(r.pixels[0]).toBe(Math.round(255*(p[0]+10*p[1]+100*p[2])/1000));}
 expect(()=>validateBox([0,8,0,5,0,3],h.dimensions)).toThrow();expect(()=>validateRoi([0,16,0,11],[16,12])).toThrow();
});
it('loads a local case with checksums and exact byte counts, preserving fractional target coordinates',async()=>{
 const files=[new File([mhd],'Case.mhd'),new File([new Int16Array(192)],'Case.raw'),new File([rad],'Case_AP.rad'),new File([new Float32Array(192)],'Case_AP.raw'),new File(['2.5 1.5 1.25'],'Case_3D_DSA_Target_Points.txt')];
 const r=await readGeometryFiles(files);expect(r.metadata.targets).toEqual([[2.5,1.5,1.25]]);expect(r.metadata.detectors).toHaveLength(1);expect(r.metadata.digests.every(d=>/^[a-f0-9]{64}$/.test(d.sha256))).toBe(true);
 await expect(readGeometryFiles([...files,new File([mhd],'Case.mhd')])).rejects.toThrow('duplicados');await expect(readGeometryFiles([files[0],new File([new Int16Array(190)],'Case.raw')])).rejects.toThrow('tamanho');
});
