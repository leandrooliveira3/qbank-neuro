/** Original analytic teaching model. No equations recovered from TCD.exe. */
export const approaches = {
  temporal_r:'Transtemporal direita',temporal_l:'Transtemporal esquerda',
  suboccipital:'Suboccipital',orbital_r:'Transorbitária direita',orbital_l:'Transorbitária esquerda',
  extracranial_r:'Extracraniana direita',extracranial_l:'Extracraniana esquerda',
};
export type Approach=keyof typeof approaches;
export const targets=[
  {id:'mca',name:'ACM · segmento de estudo',depth:55,direction:1,approaches:['temporal_r','temporal_l']},
  {id:'aca',name:'ACA · segmento de estudo',depth:65,direction:-1,approaches:['temporal_r','temporal_l']},
  {id:'pca',name:'ACP · segmento de estudo',depth:65,direction:1,approaches:['temporal_r','temporal_l']},
  {id:'basilar',name:'Basilar · segmento de estudo',depth:95,direction:-1,approaches:['suboccipital']},
  {id:'vertebral',name:'Vertebral · segmento de estudo',depth:65,direction:-1,approaches:['suboccipital']},
  {id:'ophthalmic',name:'Oftálmica · segmento de estudo',depth:45,direction:1,approaches:['orbital_r','orbital_l']},
  {id:'ica',name:'ACI · segmento de estudo',depth:40,direction:1,approaches:['extracranial_r','extracranial_l']},
];
export const patterns={baseline:'Padrão pulsátil de referência',fast:'Velocidade elevada · exemplo',pulsatile:'Pulsatividade elevada · exemplo',reversing:'Fluxo bidirecional · exemplo'};
export interface TcdSettings {
  approach:Approach;target:string;pattern:keyof typeof patterns;depth:number;sampleVolume:number;
  angle:number;probeOffset:number;prf:number;gain:number;wallFilter:number;heartRate:number;
  angleCorrection:boolean;inverted:boolean;palette:'thermal'|'gray'|'color';
}
export const initialTcd:TcdSettings={approach:'temporal_r',target:'mca',pattern:'baseline',depth:55,sampleVolume:5,angle:10,probeOffset:0,prf:6000,gain:1,wallFilter:80,heartRate:72,angleCorrection:false,inverted:false,palette:'thermal'};
export const sourceArchiveSHA256='5373b7c0e86f34f8f56384ff2b2e1fd84b2cffd1d825522ae9d7cd671644e9b9';
const cycleShape=(phase:number)=>Math.min(1,Math.exp(-(((phase-.17)/.07)**2))+.25*Math.exp(-(((phase-.41)/.15)**2)));
export function velocityAt(seconds:number,settings:TcdSettings) {
  const phase=((seconds*settings.heartRate/60)%1+1)%1;
  const target=targets.find(row=>row.id===settings.target)!;
  if(settings.pattern==='reversing')return 55*Math.sin(phase*2*Math.PI);
  const [systolic,diastolic]=settings.pattern==='fast'?[190,65]:settings.pattern==='pulsatile'?[100,10]:[90,32];
  return target.direction*(diastolic+(systolic-diastolic)*cycleShape(phase));
}
export function dopplerFrequency(velocityCms:number,angleDegrees:number){return 2*2_000_000*(velocityCms/100)*Math.cos(angleDegrees*Math.PI/180)/1540;}
export function effectivePrf(settings:TcdSettings){return Math.min(settings.prf,Math.floor(1540/(2*settings.depth/1000)));}
export function wrapFrequency(frequency:number,prf:number){return ((frequency+prf/2)%prf+prf)%prf-prf/2;}
export function frequencyVelocity(frequency:number,settings:TcdSettings){return frequency*1540*100/(4_000_000*(settings.angleCorrection?Math.cos(settings.angle*Math.PI/180):1));}
export function gateStrength(settings:TcdSettings,depth=settings.depth){
  const target=targets.find(row=>row.id===settings.target)!;
  if(!target.approaches.includes(settings.approach))return 0;
  return Math.exp(-.5*((depth-target.depth)/Math.max(2,settings.sampleVolume/2))**2)*Math.exp(-.5*(settings.probeOffset/5)**2);
}
export function tcdMetrics(settings:TcdSettings){
  const period=60/settings.heartRate,values=Array.from({length:1200},(_,i)=>velocityAt(i/1200*period,settings));
  const oriented=values.map(value=>value*(targets.find(row=>row.id===settings.target)!.direction));
  const peak=Math.max(...oriented),diastolic=velocityAt(.99*period,settings)*targets.find(row=>row.id===settings.target)!.direction;
  const mean=oriented.reduce((sum,v)=>sum+v,0)/oriented.length;
  const projection=settings.angleCorrection?1:Math.cos(settings.angle*Math.PI/180);
  return {peak:peak*projection,diastolic:diastolic*projection,mean:mean*projection,
    pi:mean>1&&settings.pattern!=='reversing'?(peak-diastolic)/mean:null,
    aliasing:values.some(value=>Math.abs(dopplerFrequency(value,settings.angle))>=effectivePrf(settings)/2),
    signal:gateStrength(settings),nyquist:frequencyVelocity(effectivePrf(settings)/2,settings)};
}
