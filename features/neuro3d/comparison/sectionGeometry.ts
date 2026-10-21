export interface Plane {axis:number;index:number;uAxis:number;vAxis:number;width:number;height:number;voxelToRASmm:number[][]}
export function decodePlane(buffer:ArrayBuffer,p:Pick<Plane,'width'|'height'>){
  const d=new DataView(buffer);
  if(buffer.byteLength<12||d.getUint32(0,true)!==0x31535651||d.getUint32(4,true)!==p.width||d.getUint32(8,true)!==p.height||buffer.byteLength!==12+p.width*p.height*4)throw Error('Corte incompatível com a proveniência.');
  const values=new Float32Array(p.width*p.height);
  for(let i=0;i<values.length;i++){const v=d.getFloat32(12+i*4,true);if(!Number.isFinite(v)||v<0||v>1)throw Error('Valor de corte inválido.');values[i]=v;}
  return values;
}
export function planePoint(p:Plane,column:number,row:number){
  if(!Number.isInteger(column)||!Number.isInteger(row)||column<0||column>=p.width||row<0||row>=p.height)throw Error('Ponto fora do corte.');
  const voxel=[0,0,0];voxel[p.axis]=p.index;voxel[p.uAxis]=column;voxel[p.vAxis]=p.height-1-row;
  const ras=p.voxelToRASmm.slice(0,3).map(a=>a[0]*voxel[0]+a[1]*voxel[1]+a[2]*voxel[2]+a[3]);
  return {voxel,ras};
}
