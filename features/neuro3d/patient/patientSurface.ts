import { MarchingCubes } from 'three/examples/jsm/objects/MarchingCubes.js';
import { MeshBasicMaterial } from 'three';
import { voxelToPatient, type PatientVolume } from './dicomVolume';

export function patientSurface(volume: PatientVolume, threshold: number) {
  if (!Number.isFinite(threshold) || threshold <= volume.minimum || threshold >= volume.maximum) throw new Error('Escolha um limiar dentro da faixa de intensidades.');
  const stride = Math.max(1, Math.ceil(Math.max(...volume.dimensions)/92));
  const dims = volume.dimensions.map(value=>Math.ceil(value/stride));
  const resolution = Math.max(...dims)+6;
  const material = new MeshBasicMaterial();
  const cubes = new MarchingCubes(resolution,material,false,false,150_000);
  try {
    cubes.field.fill(volume.minimum);
    cubes.isolation = threshold;
    const [width,height] = volume.dimensions;
    for(let z=0;z<dims[2];z++)for(let y=0;y<dims[1];y++)for(let x=0;x<dims[0];x++) {
      cubes.field[(z+2)*resolution*resolution+(y+2)*resolution+x+2] = volume.values[z*stride*width*height+y*stride*width+x*stride];
    }
    cubes.update();
    if (!cubes.count) throw new Error('Nenhuma superfície encontrada neste limiar.');
    if (cubes.count > 450_000) throw new Error('Superfície muito complexa para a prévia local. Ajuste o limiar; o resultado não será truncado.');
    const positions: number[] = [];
    for(let i=0;i<cubes.count;i+=3) {
      const triangle = [0,1,2].map(vertex=>[0,1,2].map(k=>((cubes.positionArray[(i+vertex)*3+k]+1)*resolution/2-2)*stride));
      // Discard padding intersections: never cap a truncated vessel at the field edge.
      if(triangle.some(voxel=>voxel.some((v,k)=>v < -1e-5 || v > (dims[k]-1)*stride+1e-5)))continue;
      for(const voxel of triangle)positions.push(...voxelToPatient(volume,voxel));
    }
    if(!positions.length || !positions.every(Number.isFinite))throw new Error('A superfície não contém triângulos válidos dentro do campo adquirido.');
    return { positions:new Float32Array(positions),stride,triangles:positions.length/9,threshold,coordinateSystem:volume.coordinateSystem };
  } finally { cubes.geometry.dispose();material.dispose(); }
}
