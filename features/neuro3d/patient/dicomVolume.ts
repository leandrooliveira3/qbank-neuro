import { parseDicom, type DataSet } from 'dicom-parser';

export type Point3 = [number, number, number];
export interface DicomFrame {
  series: string; frameOfReference: string; sopClass: string; rows: number; columns: number;
  spacing: number[]; orientation: number[]; position: number[];
  slope: number; intercept: number; pixels: Float32Array;
}
export interface PatientVolume {
  dimensions: Point3; spacing: Point3; origin: Point3; axes: [Point3, Point3, Point3];
  values: Float32Array; minimum: number; maximum: number;
  frameOfReference: string; sourceCount: number; coordinateSystem: 'DICOM LPS mm';
}
const supported = new Set(['1.2.840.10008.5.1.4.1.1.2', '1.2.840.10008.5.1.4.1.1.2.1',
  '1.2.840.10008.5.1.4.1.1.4', '1.2.840.10008.5.1.4.1.1.4.1', '1.2.840.10008.5.1.4.1.1.13.1.1']);
const sequence = (data: DataSet | undefined, tag: string) => data?.elements[tag]?.items?.[0]?.dataSet;
const numbers = (value: string | undefined) => value?.split('\\').map(Number) ?? [];
const vectorValid = (v: number[], length: number) => v.length === length && v.every(Number.isFinite);
const dot = (a: number[], b: number[]) => a.reduce((sum, value, k) => sum + value * b[k], 0);
const cross = (a: number[], b: number[]): Point3 => [a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0]];
const same = (a: number[], b: number[], tolerance = 1e-4) => a.length === b.length && a.every((v, k) => Math.abs(v-b[k]) <= tolerance);

export function parsePatientDicom(bytes: Uint8Array): DicomFrame[] {
  let data: DataSet;
  try { data = parseDicom(bytes); } catch { throw new Error('Arquivo DICOM inválido ou formato não suportado.'); }
  const sopClass = data.string('x00080016') ?? '';
  if (!supported.has(sopClass)) throw new Error('Esta série contém projeções ou outro tipo de imagem. Importe o volume 3D reconstruído da angiografia rotacional; projeções brutas exigem reconstrução calibrada.');
  const transfer = data.string('x00020010');
  if (!['1.2.840.10008.1.2', '1.2.840.10008.1.2.1'].includes(transfer)) throw new Error('Compressão DICOM ainda não suportada. Exporte uma cópia sem compressão para esta versão.');
  const rows = data.uint16('x00280010'), columns = data.uint16('x00280011');
  const count = Number(data.string('x00280008') ?? 1);
  const bits = data.uint16('x00280100'), stored = data.uint16('x00280101'), high = data.uint16('x00280102');
  const signed = data.uint16('x00280103');
  const pixel = data.elements.x7fe00010;
  if (!rows || !columns || rows > 2048 || columns > 2048 || !Number.isInteger(count) || count < 1 || rows*columns*count > 32_000_000) throw new Error('Dimensões inválidas ou volume acima do limite local de 32 milhões de voxels.');
  if (![8,16].includes(bits) || !stored || stored > bits || high !== stored-1 || ![0,1].includes(signed) || data.uint16('x00280002') !== 1 || data.string('x00280004') !== 'MONOCHROME2' || !pixel || pixel.encapsulatedPixelData) throw new Error('Formato de pixels ainda não suportado; use imagem monocromática 8/16 bits sem compressão.');
  const samples = rows*columns*count, needed = samples*bits/8;
  if (pixel.length < needed || pixel.dataOffset + needed > bytes.length) throw new Error('Dados de pixels incompletos.');
  const series = data.string('x0020000e'), frameOfReference = data.string('x00200052');
  if (!series || !frameOfReference) throw new Error('A série não declara seu identificador ou referencial físico.');
  const shared = sequence(data, 'x52009229');
  const perFrame = data.elements.x52009230?.items;
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  return Array.from({ length: count }, (_, frame) => {
    const group = perFrame?.[frame]?.dataSet;
    const value = (seq: string, tag: string) => sequence(group, seq)?.string(tag) ?? sequence(shared, seq)?.string(tag) ?? data.string(tag);
    const spacing = numbers(value('x00289110', 'x00280030'));
    const orientation = numbers(value('x00209116', 'x00200037'));
    const position = numbers(value('x00209113', 'x00200032'));
    const slope = Number(value('x00289145', 'x00281053') ?? 1), intercept = Number(value('x00289145', 'x00281052') ?? 0);
    if (!vectorValid(spacing,2) || spacing.some(v=>v<=0) || !vectorValid(orientation,6) || !vectorValid(position,3) || !Number.isFinite(slope) || slope === 0 || !Number.isFinite(intercept)) throw new Error('Posição, orientação, espaçamento ou transformação dos pixels ausentes/inválidos.');
    const pixels = new Float32Array(rows*columns);
    const mask = 2**stored-1, sign = 2**(stored-1);
    for (let i = 0; i < pixels.length; i++) {
      const offset = pixel.dataOffset + (frame*pixels.length+i)*bits/8;
      let raw = (bits === 8 ? view.getUint8(offset) : view.getUint16(offset,true)) & mask;
      if (signed && raw >= sign) raw -= 2**stored;
      const calibrated = raw*slope+intercept;
      if (!Number.isFinite(calibrated) || Math.abs(calibrated)>3e38) throw new Error('Intensidade inválida no volume.');
      pixels[i] = calibrated;
    }
    return { series, frameOfReference, sopClass, rows, columns, spacing, orientation, position, slope, intercept, pixels };
  });
}

export function assemblePatientVolume(frames: DicomFrame[]): PatientVolume {
  if (frames.length < 3) throw new Error('Selecione pelo menos três cortes do mesmo volume reconstruído.');
  const first = frames[0], x = first.orientation.slice(0,3), y = first.orientation.slice(3,6), z = cross(x,y);
  if (Math.abs(dot(x,x)-1)>1e-4 || Math.abs(dot(y,y)-1)>1e-4 || Math.abs(dot(x,y))>1e-4) throw new Error('Eixos físicos inválidos.');
  if (first.rows*first.columns*frames.length > 32_000_000) throw new Error('Volume acima do limite local de 32 milhões de voxels.');
  for (const frame of frames) {
    if (frame.series !== first.series || frame.frameOfReference !== first.frameOfReference || frame.sopClass !== first.sopClass || frame.rows !== first.rows || frame.columns !== first.columns || !same(frame.spacing, first.spacing) || !same(frame.orientation, first.orientation) || frame.pixels.length !== first.rows*first.columns) throw new Error('Séries, dimensões ou referenciais incompatíveis. Importe um único volume.');
  }
  const sorted = [...frames].sort((a,b)=>dot(a.position,z)-dot(b.position,z));
  const distance = dot(sorted[1].position,z)-dot(sorted[0].position,z);
  if (distance <= 1e-4) throw new Error('Cortes duplicados ou fases sobrepostas. Selecione uma única reconstrução.');
  for (let i = 1; i < sorted.length; i++) {
    const delta = sorted[i].position.map((v,k)=>v-sorted[i-1].position[k]);
    if (Math.abs(dot(delta,z)-distance)>Math.max(.001,distance*.01) || Math.abs(dot(delta,x))>.001 || Math.abs(dot(delta,y))>.001) throw new Error('Cortes ausentes, espaçamento irregular ou volume inclinado. A geometria não será estimada por suposição.');
  }
  const values = new Float32Array(first.rows*first.columns*frames.length);
  let minimum=Infinity, maximum=-Infinity;
  sorted.forEach((frame,n)=>{values.set(frame.pixels,n*frame.pixels.length);for(const value of frame.pixels){if(!Number.isFinite(value))throw new Error('Pixels não finitos.');minimum=Math.min(minimum,value);maximum=Math.max(maximum,value);}});
  if (maximum <= minimum) throw new Error('Volume sem contraste de intensidade utilizável.');
  return { dimensions:[first.columns,first.rows,frames.length], spacing:[first.spacing[1],first.spacing[0],distance], origin:sorted[0].position as Point3, axes:[x as Point3,y as Point3,z], values,minimum,maximum,frameOfReference:first.frameOfReference,sourceCount:frames.length,coordinateSystem:'DICOM LPS mm' };
}

export function voxelToPatient(volume: PatientVolume, voxel: number[]): Point3 {
  return [0,1,2].map(k=>volume.origin[k]+voxel.reduce((sum,v,axis)=>sum+v*volume.spacing[axis]*volume.axes[axis][k],0)) as Point3;
}
