import type {LocalGeometry} from './reader';
import {validateBox,validateRoi,type Box3i} from './geometry';

/** Our local review format, not an undocumented adapter for database_info.xls. */
export function importCropReview(text:string,meta:LocalGeometry){
 if(text.length>1_000_000)throw Error('Metadados acima de 1 MB.');
 const r=JSON.parse(text);
 if(!r||r.schema!==1||r.matrixLayout!=='4x4 column-major, homogeneous column vectors'||r.coordinateSystem!=='Native GS-CA Sv/Sw millimetres; no DICOM LPS/RAS or atlas registration'||r.cropConvention!=='zero-based-inclusive')throw Error('Formato ou convenção não comprovada: use a revisão local com índices zero inclusivos.');
 const same=(a:unknown,b:unknown)=>JSON.stringify(a)===JSON.stringify(b);
 if(!same(r.volume,meta.volume))throw Error('Cabeçalho do volume incompatível.');
 if(!Array.isArray(r.sourceDigests))throw Error('Hashes ausentes.');
 for(const digest of meta.digests){
  const matches=r.sourceDigests.filter((d:{name?:string})=>d?.name===digest.name);
  if(matches.length!==1||matches[0].sha256!==digest.sha256||matches[0].bytes!==digest.bytes)throw Error('Hash ou tamanho incompatível: '+digest.name);
 }
 if(!Array.isArray(r.voi)||r.voi.length!==6)throw Error('VOI inválida.');
 const voi=validateBox(r.voi as Box3i,meta.volume.dimensions);
 const detector=meta.detectors.find(d=>d.name===r.selectedDetector);
 if(r.selectedDetector&&!detector)throw Error('Detector não pertence ao caso.');
 let roi:[number,number,number,number]|undefined;
 if(detector){
  if(!Array.isArray(r.detectors)||!r.detectors.some((d:unknown)=>same(d,detector)))throw Error('Calibração do detector incompatível.');
  if(!Array.isArray(r.roi)||r.roi.length!==4)throw Error('ROI inválida.');
  roi=validateRoi(r.roi,detector.header.dimensions);
 }
 // Deliberately ignore imported targets, transforms, claims, windows and executable content.
 return {voi,roi,detectorName:detector?.name};
}
