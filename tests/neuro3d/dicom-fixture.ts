/** Generated geometry only. Contains no patient data. */
export function dicomFixture(z:number,options:{sop?:string;frame?:string;position?:string;pixels?:number[];signed?:number;stored?:number;intercept?:number;slope?:number}={}) {
  const element=(group:number,tag:number,vr:string,value:Buffer)=>{
    const long=['OB','OW','SQ','UN'].includes(vr),header=Buffer.alloc(long?12:8);
    header.writeUInt16LE(group);header.writeUInt16LE(tag,2);header.write(vr,4);
    if(long)header.writeUInt32LE(value.length,8);else header.writeUInt16LE(value.length,6);
    return Buffer.concat([header,value]);
  };
  const text=(g:number,t:number,vr:string,value:string)=>element(g,t,vr,Buffer.from(value+(value.length%2?(vr==='UI'?'\0':' '):'')));
  const us=(t:number,value:number)=>{const buffer=Buffer.alloc(2);buffer.writeUInt16LE(value);return element(0x28,t,'US',buffer);};
  const values=options.pixels??Array.from({length:64},(_,i)=>((i%8-3.5)**2+(Math.floor(i/8)-3.5)**2+(z-3.5)**2)<7?1000:0);
  const pixels=Buffer.alloc(128);values.forEach((v,i)=>pixels.writeUInt16LE(v,i*2));
  return Buffer.concat([Buffer.alloc(128),Buffer.from('DICM'),
    text(2,0x10,'UI','1.2.840.10008.1.2.1'),text(8,0x16,'UI',options.sop??'1.2.840.10008.5.1.4.1.1.2'),
    text(0x20,0x0e,'UI','1.2.3.4.5'),text(0x20,0x52,'UI',options.frame??'1.2.3.4.6'),
    text(0x20,0x32,'DS',options.position??`${10+z*.6}\\20\\30`),text(0x20,0x37,'DS','0\\1\\0\\0\\0\\1'),
    us(2,1),text(0x28,4,'CS','MONOCHROME2'),us(0x10,8),us(0x11,8),text(0x28,0x30,'DS','.3\\.5'),
    us(0x100,16),us(0x101,options.stored??16),us(0x102,(options.stored??16)-1),us(0x103,options.signed??0),
    text(0x28,0x1052,'DS',String(options.intercept??0)),text(0x28,0x1053,'DS',String(options.slope??1)),element(0x7fe0,0x10,'OW',pixels)]);
}

export function rotationalVolumeFixture() {
  const base=dicomFixture(0,{sop:'1.2.840.10008.5.1.4.1.1.13.1.1'});
  const item=(data:Buffer)=>{const header=Buffer.alloc(8);header.writeUInt16LE(0xfffe);header.writeUInt16LE(0xe000,2);header.writeUInt32LE(data.length,4);return Buffer.concat([header,data]);};
  const sequence=(group:number,tag:number,data:Buffer)=>{const header=Buffer.alloc(12);header.writeUInt16LE(group);header.writeUInt16LE(tag,2);header.write('SQ',4);header.writeUInt32LE(data.length,8);return Buffer.concat([header,data]);};
  const perFrames=Array.from({length:8},(_,z)=>{
    const value=`${10+z*.6}\\20\\30`,content=Buffer.from(value+(value.length%2?' ':''));
    const header=Buffer.alloc(8);header.writeUInt16LE(0x20);header.writeUInt16LE(0x32,2);header.write('DS',4);header.writeUInt16LE(content.length,6);
    return item(sequence(0x20,0x9113,item(Buffer.concat([header,content]))));
  });
  const count=Buffer.from([0x28,0,8,0,0x49,0x53,2,0,0x38,0x20]);
  const pixels=Buffer.concat(Array.from({length:8},(_,z)=>dicomFixture(z).subarray(-128)));
  const header=Buffer.alloc(12);header.writeUInt16LE(0x7fe0);header.writeUInt16LE(0x10,2);header.write('OW',4);header.writeUInt32LE(pixels.length,8);
  return Buffer.concat([base.subarray(0,-140),count,sequence(0x5200,0x9230,Buffer.concat(perFrames)),header,pixels]);
}
