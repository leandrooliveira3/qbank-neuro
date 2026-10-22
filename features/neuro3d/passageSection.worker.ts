import {sectionSurface,type PassageSurface} from './passageGeometry';
let surfaces:PassageSurface[]=[];
self.onmessage=(event:MessageEvent<{sequence:number;surfaces?:PassageSurface[];axis:number;offset:number}>)=>{
  const request=event.data;
  try{
    if(request.surfaces)surfaces=request.surfaces;
    if(!surfaces.length)throw Error('Superfícies não carregadas.');
    self.postMessage({sequence:request.sequence,sections:surfaces.map(s=>sectionSurface(s,request.axis,request.offset))});
  }catch(error){self.postMessage({sequence:request.sequence,error:String((error as Error).message)});}
};
