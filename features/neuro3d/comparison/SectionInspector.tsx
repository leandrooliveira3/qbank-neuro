import React,{useEffect,useRef,useState} from 'react';
import catalogue from './sections.json';
import {sha256} from './geometry';
import {decodePlane,planePoint,type ReferenceMark,type LinkedPlane} from './sectionGeometry';
export default function SectionInspector({kind,marks,setMarks,onPlaneChange,focusRequest}:{kind:string;marks:ReferenceMark[];setMarks:React.Dispatch<React.SetStateAction<ReferenceMark[]>>;onPlaneChange:(plane:LinkedPlane|undefined)=>void;focusRequest?:{mark:ReferenceMark;revision:number}}){
  const planes=catalogue.sections.filter(p=>p.kind===kind),[axis,setAxis]=useState(2),[ordinal,setOrdinal]=useState(3),[retry,setRetry]=useState(0);
  const choices=planes.filter(p=>p.axis===axis),plane=choices[ordinal];
  const [loaded,setLoaded]=useState<{key:string;values?:Float32Array;error?:string}>({key:''}),[name,setName]=useState('Marco de inspeção');
  const canvas=useRef<HTMLCanvasElement>(null),generation=useRef(0);
  const current=loaded.key===plane.key?loaded:undefined;
  useEffect(()=>{onPlaneChange(current?.values?plane:undefined);},[current,plane,onPlaneChange]);
  useEffect(()=>{
    const controller=new AbortController(),id=++generation.current;setLoaded({key:plane.key});
    async function load(){try{
      const r=await fetch(`${import.meta.env.BASE_URL}neuro3d/comparison/sections/${plane.file}`,{signal:controller.signal});if(!r.ok)throw Error('Corte indisponível.');
      const raw=await r.arrayBuffer();if(await sha256(raw)!==plane.assetSHA256)throw Error('A integridade do corte não confere.');
      const envelope=JSON.parse(new TextDecoder().decode(raw));if(envelope.format!=='QVS1-gzip-base64')throw Error('Formato de corte inválido.');
      const compressed=Uint8Array.from(atob(envelope.data),(s:string)=>s.charCodeAt(0));
      const binary=await new Response(new Blob([compressed]).stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer();
      const values=decodePlane(binary,plane);if(id===generation.current&&!controller.signal.aborted)setLoaded({key:plane.key,values});
    }catch(e){if(id===generation.current&&!controller.signal.aborted)setLoaded({key:plane.key,error:e instanceof Error?e.message:'Falha no corte.'});}}
    void load();return ()=>{controller.abort();generation.current++;};
  },[plane,retry]);
  useEffect(()=>{
    if(!current?.values||!canvas.current)return;
    const ctx=canvas.current.getContext('2d');if(!ctx)return;
    const img=ctx.createImageData(plane.width,plane.height);
    for(let i=0;i<current.values.length;i++){const v=Math.round(current.values[i]*255);img.data.set([v,v,v,255],i*4);}ctx.putImageData(img,0,0);
    ctx.fillStyle='#ffb94c';for(const m of marks.filter(m=>m.key===plane.key)){const x=m.voxel[plane.uAxis],y=plane.height-1-m.voxel[plane.vAxis];ctx.fillRect(x-2,y-2,5,5);}
  },[current,plane,marks]);
  function mark(column:number,row:number){
    if(!current?.values)return;
    const point=planePoint(plane,column,row);setMarks(old=>[...old,{key:plane.key,name:name.trim().slice(0,80)||'Marco sem nome',...point,value:current.values[row*plane.width+column],sourceSHA256:plane.sourceSHA256}]);
  }
  function goToMark(mark:ReferenceMark){
    const target=planes.find(p=>p.key===mark.key);if(!target)return;
    setAxis(target.axis);setOrdinal(planes.filter(p=>p.axis===target.axis).findIndex(p=>p.key===target.key));
  }
  useEffect(()=>{if(focusRequest)goToMark(focusRequest.mark);},[focusRequest]);
  function download(){
    const report={schema:1,kind,sourceSHA256:plane.sourceSHA256,planes:planes.map(p=>({...p})),marks,coordinateSystem:'NIfTI RAS mm; zero-based native voxel indices',anatomicalApproval:false,atlasRegistration:null,semantics:kind==='brave'?'binary manual labels, not MR intensity':'cohort mean partial-volume fractions, not named veins'};
    const url=URL.createObjectURL(new Blob([JSON.stringify(report,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download=`marcos-${kind}-ras-mm.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  return <section aria-label={`Cortes ${kind}`} className="reference-sections"><h4>Cortes originais selecionados</h4><p>Sete cortes nativos por eixo, sem reamostragem. {kind==='brave'?'Máscara manual binária; não é intensidade MRA.':'Fração média de volume parcial; não identifica veias individuais.'} O brilho usa a faixa 0–1; os valores exportados mantêm float32.</p>
    <label>Eixo nativo<select aria-label={`Eixo dos cortes ${kind}`} value={axis} onChange={e=>{setAxis(Number(e.target.value));setOrdinal(3);}}>{['I','J','K'].map((s,i)=><option key={s} value={i}>{s}</option>)}</select></label>
    <label>Corte disponível<select aria-label={`Corte selecionado ${kind}`} value={ordinal} onChange={e=>setOrdinal(Number(e.target.value))}>{choices.map((p,i)=><option key={p.key} value={i}>Índice {p.index} de {p.shape[axis]-1}</option>)}</select></label>
    <div data-testid={`section-${kind}`} data-state={current?.values?'ready':current?.error?'error':'loading'}>
      {current?.values?<canvas ref={canvas} width={plane.width} height={plane.height} aria-label={`Marcar voxel ${kind}`} role="button" tabIndex={0} style={{width:'100%',height:'auto',aspectRatio:`${plane.width*plane.pixelSpacingMm[0]} / ${plane.height*plane.pixelSpacingMm[1]}`}} onClick={e=>{const b=e.currentTarget.getBoundingClientRect();mark(Math.min(plane.width-1,Math.floor((e.clientX-b.left)/b.width*plane.width)),Math.min(plane.height-1,Math.floor((e.clientY-b.top)/b.height*plane.height)));}} onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault();mark(Math.floor(plane.width/2),Math.floor(plane.height/2));}}}/>:current?.error?<><p role="alert">{current.error}</p><button onClick={()=>setRetry(n=>n+1)}>Recarregar corte</button></>:<p role="status">Conferindo corte…</p>}
    </div><p>Horizontal: eixo {['I','J','K'][plane.uAxis]} crescente. Vertical: eixo {['I','J','K'][plane.vAxis]} crescente para cima. Índices nativos, sem alinhamento entre fontes. Espaçamento: {plane.pixelSpacingMm.map(n=>n.toFixed(3)).join(' × ')} mm.</p>
    <label>Nome do marco manual<input aria-label={`Nome do marco ${kind}`} value={name} maxLength={80} onChange={e=>setName(e.target.value)}/></label><p>Clique em um pixel para registrar; com o corte em foco, Enter marca seu centro. O nome informado não comprova identidade anatômica.</p>
    <p role="status">{marks.length} marco(s) manual(is).</p><ul>{marks.map((m,i)=><li key={i}>{m.name} · {m.key} · RAS {m.ras.map(v=>v.toFixed(2)).join(', ')} mm · valor {m.value.toFixed(6)} <button onClick={()=>goToMark(m)}>Voltar ao corte do marco {i+1}</button></li>)}</ul><button onClick={()=>setMarks(old=>old.slice(0,-1))} disabled={!marks.length}>Desfazer último marco</button><button onClick={download}>Exportar marcos e proveniência</button>
  </section>;
}
