/** Transport only. Coordinates remain native NIfTI RAS millimetres. */
export function decodeReferenceGeometry(buffer:ArrayBuffer,expected:{vertices:number;triangles:number}) {
  if(buffer.byteLength<12)throw Error('Superfície incompleta.');
  const header=new DataView(buffer);
  if(header.getUint32(0,true)!==0x31525651)throw Error('Formato de superfície inválido.');
  const vertices=header.getUint32(4,true),triangles=header.getUint32(8,true);
  if(vertices!==expected.vertices||triangles!==expected.triangles||vertices>500000||triangles>1000000||buffer.byteLength!==12+vertices*12+triangles*12)throw Error('Dimensões da superfície incompatíveis com a proveniência.');
  const positions=new Float32Array(vertices*3),indices=new Uint32Array(triangles*3);
  for(let i=0;i<positions.length;i++){const value=header.getFloat32(12+i*4,true);if(!Number.isFinite(value))throw Error('Coordenada não finita.');positions[i]=value;}
  for(let i=0;i<indices.length;i++){const value=header.getUint32(12+positions.byteLength+i*4,true);if(value>=vertices)throw Error('Índice de superfície inválido.');indices[i]=value;}
  return {positions,indices};
}
export async function sha256(buffer:ArrayBuffer){return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',buffer)),value=>value.toString(16).padStart(2,'0')).join('');}
export function displayPoint(p:number[]){return [-p[0],p[2],p[1]];}
