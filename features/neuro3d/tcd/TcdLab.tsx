import React,{useEffect,useRef,useState} from 'react';
import {approaches,targets,patterns,initialTcd,sourceArchiveSHA256,velocityAt,dopplerFrequency,effectivePrf,wrapFrequency,frequencyVelocity,gateStrength,tcdMetrics,type TcdSettings,type Approach} from './model';
import './tcd.css';

function Spectrum({settings,time,frozen,cursor,onCursor}:{settings:TcdSettings;time:number;frozen:boolean;cursor:number;onCursor:(value:number)=>void}){
  const ref=useRef<HTMLCanvasElement>(null),prf=effectivePrf(settings),span=frequencyVelocity(prf/2,settings);
  useEffect(()=>{
    const canvas=ref.current,context=canvas?.getContext('2d');if(!canvas||!context)return;
    const width=800,height=280,left=52,top=20,plotHeight=230,zero=top+plotHeight/2;
    context.fillStyle='#020608';context.fillRect(0,0,width,height);context.font='12px system-ui';context.fillStyle='#9bb2c2';
    context.fillText(`${Math.round(span)} cm/s`,3,top+12);context.fillText(`−${Math.round(span)}`,8,top+plotHeight);context.fillText('0',25,zero+4);
    for(let x=left;x<width;x+=2){
      const at=time-6+(x-left)/(width-left)*6,envelope=dopplerFrequency(velocityAt(at,settings),settings.angle)*(settings.inverted?-1:1);
      for(let n=1;n<=54;n++){
        const frequency=envelope*n/54;if(Math.abs(frequency)<settings.wallFilter)continue;
        const folded=wrapFrequency(frequency,prf),y=zero-folded/prf*plotHeight;
        const noise=.7+.3*Math.sin(x*7.31+n*4.17),power=Math.min(1,gateStrength(settings)*settings.gain*noise*Math.exp(-(((n/54-.65)/.28)**2)));
        if(power<.025)continue;
        context.fillStyle=settings.palette==='gray'?`rgb(${power*255},${power*255},${power*255})`:settings.palette==='thermal'?`rgb(${Math.min(255,power*420)},${Math.max(0,power*360-80)},${power*35})`:`hsl(${240-power*230} 100% ${20+power*45}%)`;
        context.fillRect(x,y,2,3);
      }
    }
    context.strokeStyle='#344e5d';context.beginPath();context.moveTo(left,zero);context.lineTo(width,zero);context.stroke();
    context.fillStyle='#9bb2c2';context.fillText('−6 s',left,274);context.fillText('0 s',765,274);
    if(frozen){const x=left+(width-left)*cursor;context.strokeStyle='#8cffe4';context.beginPath();context.moveTo(x,top);context.lineTo(x,top+plotHeight);context.stroke();}
  },[settings,time,frozen,cursor,prf,span]);
  return <canvas ref={ref} width="800" height="280" aria-label="Espectro Doppler sintético" data-testid="tcd-spectrum" data-frozen={String(frozen)} data-time={time.toFixed(2)} onPointerDown={event=>{if(!frozen)return;const rect=event.currentTarget.getBoundingClientRect();onCursor(Math.max(0,Math.min(1,((event.clientX-rect.left)/rect.width*800-52)/748)));}}/>;
}
function Mmode({settings,time,onDepth}:{settings:TcdSettings;time:number;onDepth:(value:number)=>void}){
  const canvas=useRef<HTMLCanvasElement>(null);
  useEffect(()=>{
    const context=canvas.current?.getContext('2d');if(!context)return;
    context.fillStyle='#020608';context.fillRect(0,0,800,140);
    for(let y=0;y<140;y+=2)for(let x=45;x<800;x+=4){
      const depth=20+y/140*110,strength=gateStrength(settings,depth),value=velocityAt(time-6+(x-45)/755*6,settings);
      if(strength<.03)continue;
      const amplitude=Math.min(1,strength*(.5+Math.abs(value)/200));
      context.fillStyle=value>=0?`rgba(255,75,55,${amplitude})`:`rgba(55,145,255,${amplitude})`;context.fillRect(x,y,4,2);
    }
    context.fillStyle='#adbfcd';context.font='12px system-ui';context.fillText('20 mm',0,12);context.fillText('130',0,137);
    const y=(settings.depth-20)/110*140;context.strokeStyle='#80f2d6';context.beginPath();context.moveTo(40,y);context.lineTo(800,y);context.stroke();
  },[settings,time]);
  return <canvas ref={canvas} width="800" height="140" aria-label="M-mode sintético: selecione a profundidade" onPointerDown={event=>{const rect=event.currentTarget.getBoundingClientRect();onDepth(Math.round(Math.max(20,Math.min(130,20+(event.clientY-rect.top)/rect.height*110))));}}/>;
}

export default function TcdLab(){
  const [settings,setSettings]=useState<TcdSettings>({...initialTcd}),[time,setTime]=useState(8),[frozen,setFrozen]=useState(false),[cursor,setCursor]=useState(.8),[mode,setMode]=useState('pw'),[audio,setAudio]=useState(false);
  const audioRef=useRef<AudioContext|null>(null),oscillator=useRef<OscillatorNode|null>(null),level=useRef<GainNode|null>(null);
  const metrics=tcdMetrics(settings),target=targets.find(row=>row.id===settings.target)!;
  function patch(patch:Partial<TcdSettings>){setSettings(old=>({...old,...patch}));}
  useEffect(()=>{if(frozen)return;const timer=setInterval(()=>setTime(value=>value+.1),100);return()=>clearInterval(timer);},[frozen]);
  useEffect(()=>()=>{oscillator.current?.stop();void audioRef.current?.close();},[]);
  useEffect(()=>{if(oscillator.current&&audioRef.current&&level.current){oscillator.current.frequency.setTargetAtTime(Math.min(3500,Math.max(80,Math.abs(dopplerFrequency(velocityAt(time,settings),settings.angle)))),audioRef.current.currentTime,.04);level.current.gain.setTargetAtTime((audio && !frozen) ? .025*metrics.signal : 0,audioRef.current.currentTime,.03);}},[audio,frozen,time,settings,metrics.signal]);
  async function toggleAudio(){
    if(!audioRef.current){try{const context=new AudioContext(),source=context.createOscillator(),gain=context.createGain();source.type='sine';gain.gain.value=0;source.connect(gain);gain.connect(context.destination);source.start();audioRef.current=context;oscillator.current=source;level.current=gain;}catch{return;}}
    await audioRef.current.resume();setAudio(value=>!value);
  }
  function selectApproach(approach:Approach){const first=targets.find(row=>row.approaches.includes(approach))!;patch({approach,target:first.id,depth:first.depth,probeOffset:0});}
  function restore(){setSettings({...initialTcd});setFrozen(false);setTime(8);setCursor(.8);setAudio(false);}
  function exportStudy(){const data={schema:1,model:'original-analytic-doppler-teaching-v1',referenceArchiveSHA256:sourceArchiveSHA256,settings,displayTime:time,metrics,clinicalValidation:false,fftOfRecordedSignal:false};const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));const link=document.createElement('a');link.href=url;link.download='doppler_estudo_sintetico.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
  const slider=(label:string,key:keyof TcdSettings,min:number,max:number,step=1)=><label key={key}>{label}<output>{settings[key]}</output><input aria-label={label} type="range" min={min} max={max} step={step} value={Number(settings[key])} onChange={event=>patch({[key]:Number(event.target.value)})}/></label>;
  const cursorVelocity=frequencyVelocity(wrapFrequency(dopplerFrequency(velocityAt(time-6+6*cursor,settings),settings.angle),effectivePrf(settings)),settings);
  return <section className="tcd" aria-label="Simulador de Doppler transcraniano">
    <header><div><span className="n3-eyebrow">NEUROSSONOLOGIA · LABORATÓRIO INTERATIVO</span><h2>Doppler transcraniano</h2><p>Explore insonação, profundidade, PRF, espectro e pulsatilidade em um modelo de estudo.</p></div><button onClick={restore}>Reiniciar Doppler</button></header>
    <p className="tcd-note">Sinal e anatomia esquemáticos, gerados por um modelo original. O espectro ilustra uma distribuição analítica; não resulta de FFT de gravação real nem replica o motor hemodinâmico do software de referência.</p>
    <div className="tcd-layout"><fieldset disabled={frozen} className="tcd-controls"><legend>Insonação e instrumento</legend>
      <label>Janela<select aria-label="Janela de insonação" value={settings.approach} onChange={event=>selectApproach(event.target.value as Approach)}>{Object.entries(approaches).map(([id,name])=><option key={id} value={id}>{name}</option>)}</select></label>
      <label>Alvo de estudo<select aria-label="Vaso de estudo Doppler" value={settings.target} onChange={event=>{const row=targets.find(row=>row.id===event.target.value)!;patch({target:row.id,depth:row.depth,probeOffset:0});}}>{targets.filter(row=>row.approaches.includes(settings.approach)).map(row=><option key={row.id} value={row.id}>{row.name}</option>)}</select></label>
      <label>Padrão<select aria-label="Padrão Doppler" value={settings.pattern} onChange={event=>patch({pattern:event.target.value as TcdSettings['pattern']})}>{Object.entries(patterns).map(([id,name])=><option key={id} value={id}>{name}</option>)}</select></label>
      {slider('Profundidade (mm)','depth',20,130)}{slider('Volume de amostra (mm)','sampleVolume',2,15)}{slider('Ângulo idealizado (°)','angle',0,80)}{slider('Desvio da sonda (mm)','probeOffset',-15,15)}{slider('PRF solicitada (Hz)','prf',1000,12000,500)}{slider('Ganho de exibição','gain',.2,2,.1)}{slider('Filtro de parede (Hz)','wallFilter',0,600,20)}{slider('Frequência cardíaca (bpm)','heartRate',40,140)}
      <label>Paleta<select aria-label="Paleta espectral" value={settings.palette} onChange={event=>patch({palette:event.target.value as TcdSettings['palette']})}><option value="thermal">Térmica</option><option value="gray">Cinza</option><option value="color">Colorida</option></select></label>
      <label><input type="checkbox" checked={settings.inverted} onChange={event=>patch({inverted:event.target.checked})}/>Inverter espectro</label><label><input type="checkbox" checked={settings.angleCorrection} onChange={event=>patch({angleCorrection:event.target.checked})}/>Correção angular idealizada</label>
    </fieldset><div className="tcd-main">
      <div className="tcd-toolbar"><button aria-pressed={mode==='pw'} onClick={()=>setMode('pw')}>Espectro PW</button><button aria-pressed={mode==='mmode'} onClick={()=>setMode('mmode')}>Power M-mode didático</button><button aria-pressed={frozen} onClick={()=>setFrozen(value=>!value)}>{frozen?'Retomar Doppler':'Congelar Doppler'}</button><button aria-pressed={audio} onClick={()=>void toggleAudio()}>Áudio sintético {audio?'ligado':'desligado'}</button></div>
      <svg className="tcd-insonation" viewBox="0 0 800 170" role="img" aria-label="Esquema de insonação e volume de amostra"><ellipse cx="400" cy="80" rx="180" ry="65" fill="#122c3d" stroke="#496274"/><path d="M220 80 Q320 20 400 80 Q490 135 580 80" fill="none" stroke="#c96a74" strokeWidth="7"/><path d="M400 80V25M400 80V145" stroke="#c96a74" strokeWidth="5"/><rect x={170+settings.probeOffset*2} y="65" width="28" height="30" fill="#8bcbd7"/><line x1={198+settings.probeOffset*2} y1="80" x2={200+settings.depth*3.5} y2={80+Math.sin(settings.angle*Math.PI/180)*45} stroke="#75e6bc" strokeWidth="2"/><circle cx={200+settings.depth*3.5} cy={80+Math.sin(settings.angle*Math.PI/180)*45} r={settings.sampleVolume} fill="none" stroke="#ffe299"/><text x="20" y="155" fill="#c1d0db">Alvo: {target.name} · posição e trajetos ilustrativos</text></svg>
      {mode==='mmode'&&<Mmode settings={settings} time={time} onDepth={depth=>{if(!frozen)patch({depth});}}/>}
      <Spectrum settings={settings} time={time} frozen={frozen} cursor={cursor} onCursor={setCursor}/>
      <p data-testid="tcd-status" role="status">PRF efetiva: {effectivePrf(settings)} Hz · sinal no volume: {Math.round(metrics.signal*100)}%{metrics.aliasing?' · ALIASING: envoltória ultrapassa Nyquist':''}{metrics.signal<.05?' · volume fora do alvo':''}</p>
      <div className="tcd-metrics" aria-label="Parâmetros de referência do modelo"><span>Pico <b>{metrics.peak.toFixed(1)}</b> cm/s</span><span>Diastólica <b>{metrics.diastolic.toFixed(1)}</b> cm/s</span><span>Média do ciclo <b>{metrics.mean.toFixed(1)}</b> cm/s</span><span>IP <b>{metrics.pi===null?'não aplicável':metrics.pi.toFixed(2)}</b></span></div>
      <p className="tcd-note">Valores da envoltória ideal do exemplo, antes de aliasing e filtro de parede; não são estimativas clínicas extraídas do espectro. A profundidade dos atalhos não define uma faixa diagnóstica.</p>
      {frozen&&<label className="tcd-cursor">Cursor temporal · {cursorVelocity.toFixed(1)} cm/s no sinal dobrado<input aria-label="Cursor do espectro congelado" type="range" min="0" max="1" step=".005" value={cursor} onChange={event=>setCursor(Number(event.target.value))}/></label>}
      <button onClick={exportStudy}>Exportar estudo Doppler</button>
    </div></div>
  </section>;
}
