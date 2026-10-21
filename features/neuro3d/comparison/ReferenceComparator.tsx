import React,{Component,lazy,Suspense,useEffect,useMemo,useRef,useState} from 'react';
import {Canvas,useThree} from '@react-three/fiber';
import {OrbitControls} from '@react-three/drei/core/OrbitControls';
import {BufferGeometry,Float32BufferAttribute,DoubleSide,Vector3} from 'three';
import type {OrbitControls as OrbitControlsImpl} from 'three-stdlib';
import manifest from './manifest.json';
import {decodeReferenceGeometry,displayPoint,sha256} from './geometry';
import './comparison.css';

type Surface=typeof manifest.surfaces[number];
const SectionInspector=lazy(()=>import('./SectionInspector'));
type Geometry=ReturnType<typeof decodeReferenceGeometry>;
type View='AP'|'Lateral esquerda'|'Oblíqua';
type Pose={position:number[];up:number[];target:number[];zoom:number};
const sources={brave:{name:'BRAVE-NET · arterial',url:'https://zenodo.org/records/3968844',license:'MIT',credit:'Hilbert, Madai, Akay e colaboradores · 2020',description:'Máscara manual binária de um voluntário MIDAS, pat_1. O volume de intensidade MRA não está incluído nesta visualização.'},venat:{name:'VENAT · venoso',url:'https://figshare.com/articles/dataset/VENAT_Probability_map_nii_gz/7205960',license:'CC BY 4.0',credit:'Huck e colaboradores · VENAT',description:'Mapa médio de frações de volume parcial venoso, em MNI152. Não é uma árvore individual nem rótulos de veias.'}};
class SceneBoundary extends Component<{children:React.ReactNode},{failed:boolean}>{
  state={failed:false};static getDerivedStateFromError(){return {failed:true};}
  render(){return this.state.failed?<p role="alert">Não foi possível exibir a superfície 3D. A proveniência continua disponível.</p>:this.props.children;}
}
function Scene({geometry,view,reset,onPose}:{geometry:Geometry;view:View;reset:number;onPose:(pose:Pose)=>void}){
  const {camera}=useThree();
  const controls=useRef<OrbitControlsImpl>(null);
  const mesh=useMemo(()=>{
    const points=new Float32Array(geometry.positions.length);
    for(let i=0;i<points.length;i+=3)points.set(displayPoint(Array.from(geometry.positions.subarray(i,i+3))),i);
    const g=new BufferGeometry();g.setAttribute('position',new Float32BufferAttribute(points,3));g.setIndex(Array.from(geometry.indices));g.computeVertexNormals();g.computeBoundingBox();g.center();g.computeBoundingSphere();return g;
  },[geometry]);
  useEffect(()=>()=>mesh.dispose(),[mesh]);
  useEffect(()=>{
    const r=mesh.boundingSphere!.radius;
    const direction=view==='AP'?[0,0,1]:view==='Lateral esquerda'?[1,0,0]:[.65,.25,1];
    camera.position.copy(new Vector3(...direction).normalize().multiplyScalar(r*3));camera.up.set(0,1,0);camera.lookAt(0,0,0);
    if('isOrthographicCamera' in camera){camera.zoom=120/r;camera.updateProjectionMatrix();}
  },[camera,mesh,view,reset]);
  return <><ambientLight intensity={1.2}/><directionalLight position={[100,200,300]} intensity={2}/><mesh geometry={mesh}><meshStandardMaterial color="#8dd8eb" side={DoubleSide} roughness={.65}/></mesh><OrbitControls ref={controls} key={`${view}-${reset}`} makeDefault target={[0,0,0]} enablePan enableZoom onChange={()=>onPose({position:camera.position.toArray(),up:camera.up.toArray(),target:controls.current?.target.toArray()??[0,0,0],zoom:camera.zoom})}/></>;
}
function ReferenceCard({kind,onInspection}:{kind:'brave'|'venat';onInspection:(key:string,view:View,pose:Pose)=>void}){
  const [sections,setSections]=useState(false),[sectionsOpened,setSectionsOpened]=useState(false);
  const options=manifest.surfaces.filter(row=>row.kind===kind);
  const [key,setKey]=useState(options[0]?.key??''),[view,setView]=useState<View>('AP'),[reset,setReset]=useState(0),[attempt,setAttempt]=useState(0);
  const surface=options.find(row=>row.key===key),source=sources[kind];
  const [state,setState]=useState<{key:string;geometry?:Geometry;error?:string}>({key:''});
  const generation=useRef(0);
  const pose=useRef<Pose|null>(null);
  useEffect(()=>{
    const id=++generation.current,controller=new AbortController();
    if(!surface)return ()=>controller.abort();
    setState({key:surface.key});
    async function load(){
      try{
        const response=await fetch(`${import.meta.env.BASE_URL}neuro3d/comparison/${surface!.file}`,{signal:controller.signal});
        if(!response.ok)throw Error('Referência indisponível. Tente carregar novamente.');
        const raw=await response.arrayBuffer();if(await sha256(raw)!==surface!.assetSHA256)throw Error('A integridade da referência não confere.');
        const envelope=JSON.parse(new TextDecoder().decode(raw));
        if(envelope.format!=='QVR1-gzip-base64'||typeof envelope.data!=='string'||envelope.data.length>12000000)throw Error('Formato de referência inesperado.');
        const compressed=Uint8Array.from(atob(envelope.data),(c:string)=>c.charCodeAt(0));
        if(await sha256(compressed.buffer)!==surface!.compressedSHA256)throw Error('O checksum da geometria não confere.');
        const decoded=await new Response(new Blob([compressed]).stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer();
        const geometry=decodeReferenceGeometry(decoded,surface!);
        if(id===generation.current&&!controller.signal.aborted)setState({key:surface!.key,geometry});
      }catch(error){if(id===generation.current&&!controller.signal.aborted)setState({key:surface!.key,error:error instanceof Error?error.message:'Falha ao carregar referência.'});}
    }
    void load();return ()=>{controller.abort();generation.current++;};
  },[surface,attempt]);
  const current=state.key===key?state:undefined;
  return <article className="reference-card" aria-label={source.name}>
    <h3>{source.name}</h3><p>{source.description}</p>
    {kind==='venat'&&<label>Fração média para a superfície<select aria-label="Limiar VENAT" value={key} onChange={e=>setKey(e.target.value)}>{options.map(row=><option key={row.key} value={row.key}>{row.threshold.toFixed(2)}</option>)}</select></label>}
    <div className="reference-actions">{(['AP','Lateral esquerda','Oblíqua'] as View[]).map(v=><button key={v} aria-label={`${source.name} · ${v}`} aria-pressed={view===v} onClick={()=>{setView(v);setReset(n=>n+1);}}>{v}</button>)}<button onClick={()=>setReset(n=>n+1)}>Restaurar enquadramento</button></div>
    <div className="reference-scene" data-testid={`${kind}-reference-view`} data-state={current?.geometry?'ready':current?.error?'error':'loading'} data-view={view}>
      {current?.geometry?<SceneBoundary key={key}><Canvas orthographic camera={{position:[0,0,300],near:.1,far:3000}}><Scene geometry={current.geometry} view={view} reset={reset} onPose={value=>{pose.current=value;}}/></Canvas></SceneBoundary>:current?.error?<><p role="alert">{current.error}</p><button onClick={()=>setAttempt(n=>n+1)}>Tentar novamente</button></>:<p role="status">Conferindo e carregando a superfície…</p>}
    </div>
    <p>Vista {view} da superfície · superior para cima. AP: observador anterior; lateral: observador à esquerda do indivíduo. Arraste para girar; use zoom para inspecionar. Não é DSA ou MIP.</p>
    <button aria-expanded={sections} onClick={()=>{setSectionsOpened(true);setSections(v=>!v);}}>{sections?'Fechar cortes':'Inspecionar cortes e marcos'}</button>
    {sectionsOpened&&<div hidden={!sections}><Suspense fallback={<p role="status">Abrindo inspeção seccional…</p>}><SectionInspector kind={kind}/></Suspense></div>}
    {surface&&<><p>{surface.triangles.toLocaleString('pt-BR')} triângulos · {surface.components} componentes geométricos · superfície simplificada. Detalhes finos podem ter sido perdidos.</p><button disabled={!current?.geometry} onClick={()=>{if(pose.current)onInspection(surface.key,view,pose.current);}}>Adicionar vista ao registro</button><details><summary>Origem, coordenadas e processamento</summary><p>{source.credit} · {source.license}</p><a href={source.url} target="_blank" rel="noreferrer">Registro original e licença</a><p>Coordenadas: RAS em mm, affine do NIfTI. Centralização apenas visual, com enquadramento independente. Sem transformação para o atlas ou entre as duas fontes.</p><p>Componentes antes/depois: {surface.original.components}/{surface.components}. Conservação dessa contagem não comprova topologia ou anatomia. Limiar: {surface.threshold}.</p><p className="reference-hash">SHA-256 do volume: {surface.sourceSHA256}</p><pre>{JSON.stringify(surface.voxelToRASmm,null,2)}</pre></details></>}
  </article>;
}
export default function ReferenceComparator(){
  const [inspections,setInspections]=useState<{key:string;view:View;pose:Pose}[]>([]);
  function record(key:string,view:View,pose:Pose){setInspections(old=>[...old.filter(row=>row.key!==key||row.view!==view),{key,view,pose}]);}
  function exportReport(){
    const report={schema:1,sourceRecords:manifest.sources,toolVersions:manifest.toolVersions,sources:manifest.surfaces,recordedViews:inspections,displayTransform:'native RAS mm -> [-R,S,A] mm, minus transformed surface bounds centre; orthographic camera in display mm. View names are presets; pose records manual adjustments.',interpretation:'User-recorded views only; not anatomical approval',atlasRegistration:null,interSourceRegistration:null,clinicalValidation:false};
    const url=URL.createObjectURL(new Blob([JSON.stringify(report,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='referencias-vasculares-proveniencia.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  return <section className="vascular-comparator" aria-label="Referências vasculares independentes"><header><span className="n3-eyebrow">ANATOMIA E ANGIOGRAFIA · FONTES INDEPENDENTES</span><h2>Comparar sem presumir alinhamento</h2><p>Inspecione referências arteriais e venosas em seus próprios espaços. Elas apoiam a revisão do atlas, mas não demonstram por si a identidade de Galeno, de um ramo ou a continuidade de uma junção.</p><p className="reference-notice">As duas fontes representam indivíduos ou populações diferentes. Enquadramentos e escalas visuais são independentes; não comparar distâncias pela tela. Não há sobreposição, registro automático ou preenchimento de vasos do atlas.</p></header><div className="reference-grid"><ReferenceCard kind="brave" onInspection={record}/><ReferenceCard kind="venat" onInspection={record}/></div><section aria-label="Registro de inspeção"><h3>Vistas registradas para revisão</h3><p>Registrar uma vista documenta sua inspeção; não aprova anatomia. Nenhum registro é criado automaticamente ao carregar.</p><p role="status">{inspections.length} vista(s) registrada(s).</p><ul>{inspections.map(row=><li key={`${row.key}-${row.view}`}>{row.key} · {row.view}</li>)}</ul><button onClick={exportReport}>Exportar proveniência e vistas</button><button onClick={()=>setInspections([])}>Limpar registro</button></section></section>;
}
