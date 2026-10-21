import {expect,it} from 'vitest';
import {dicomFixture,rotationalVolumeFixture} from '../../../tests/neuro3d/dicom-fixture';
import {parsePatientDicom,assemblePatientVolume,voxelToPatient} from './dicomVolume';
import {patientSurface} from './patientSurface';
const frames=()=>Array.from({length:8},(_,z)=>parsePatientDicom(dicomFixture(z))[0]);

it('uses per-frame physical positions in a reconstructed multi-frame 3D X-ray angiographic object',()=>{
  const source=parsePatientDicom(rotationalVolumeFixture());
  expect(source).toHaveLength(8);expect(source[7].position[0]).toBeCloseTo(14.2);
  const volume=assemblePatientVolume(source);expect(volume.dimensions).toEqual([8,8,8]);expect(volume.spacing[2]).toBeCloseTo(.6);
});

it('orders oblique reconstructed slices in their physical frame with correct row/column spacing',()=>{
  const volume=assemblePatientVolume(frames().reverse());
  expect(volume.dimensions).toEqual([8,8,8]);expect(volume.spacing[0]).toBe(.5);expect(volume.spacing[1]).toBe(.3);expect(volume.spacing[2]).toBeCloseTo(.6);
  voxelToPatient(volume,[2,3,4]).forEach((value,k)=>expect(value).toBeCloseTo([12.4,21,30.9][k]));
  expect(volume.values[3*64+3*8+3]).toBe(1000);
});
it('decodes signed stored bits before applying the rescale transform',()=>{
  const frame=parsePatientDicom(dicomFixture(0,{pixels:Array(64).fill(4095),signed:1,stored:12,slope:2,intercept:-100}))[0];
  expect(frame.pixels[0]).toBe(-102);
});
it('rejects duplicate phases, missing slices and mixed frames rather than filling or registering them',()=>{
  const source=frames();expect(()=>assemblePatientVolume([...source,source[2]])).toThrow(/duplicados|sobrepostas|ausentes|irregular/);
  expect(()=>assemblePatientVolume(source.filter((_,i)=>i!==3))).toThrow(/ausentes|irregular/);
  expect(()=>assemblePatientVolume([...source.slice(0,7),{...source[7],frameOfReference:'other'}])).toThrow(/incompatíveis/);
});
it('rejects 2D angiography and malformed geometry without treating frames as a volume',()=>{
  expect(()=>parsePatientDicom(dicomFixture(0,{sop:'1.2.840.10008.5.1.4.1.1.12.1'}))).toThrow(/projeções/);
  expect(()=>parsePatientDicom(dicomFixture(0,{position:'0\\0'}))).toThrow(/inválidos/);
  expect(()=>parsePatientDicom(new Uint8Array([1,2,3]))).toThrow(/inválido/);
});
it('extracts a finite physical isosurface bounded by acquired voxels and keeps sampling explicit',()=>{
  const volume=assemblePatientVolume(frames()),surface=patientSurface(volume,500);
  expect(surface.triangles).toBeGreaterThan(0);expect(surface.stride).toBe(1);expect(surface.positions.every(Number.isFinite)).toBe(true);
  const bounds=[[10,14.2],[20,23.5],[30,32.1]];
  expect(surface.positions.every((value,i)=>value>=bounds[i%3][0]-1e-4&&value<=bounds[i%3][1]+1e-4)).toBe(true);
  expect(()=>patientSurface(volume,1000)).toThrow(/limiar/);
});
