import React,{ Component,useEffect,useMemo,useRef,useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei/core/OrbitControls';
import { BufferGeometry,Float32BufferAttribute,DoubleSide } from 'three';
import JSZip from 'jszip';
import type { PatientVolume } from './dicomVolume';
import './patient.css';

type Metadata=Omit<PatientVolume,'values'>;
interface MeshResult {positions:Float32Array;threshold:number;stride:number;triangles:number}
class GeometryBoundary extends Component<{children:React.ReactNode},{failed:boolean}> {
  state={failed:false};
  static getDerivedStateFromError(){return {failed:true};}
  render(){return this.state.failed?<p role="alert">Visualização 3D indisponível neste navegador. Os cortes e a exportação da superfície continuam disponíveis.</p>:this.props.children;}
}
function Surface({positions}:{positions:Float32Array}) {
  const geometry=useMemo(()=>{
    const display=new Float32Array(positions.length);
    for(let i=0;i<positions.length;i+=3)display.set([-positions[i],positions[i+2],positions[i+1]],i);
    const result=new BufferGeometry();result.setAttribute('position',new Float32BufferAttribute(display,3));result.computeVertexNormals();result.computeBoundingBox();
    const bounds=result.boundingBox!,center=bounds.getCenter(bounds.min.clone()),size=bounds.max.clone().sub(bounds.min).length();
    result.translate(-center.x,-center.y,-center.z);result.scale(8/size,8/size,8/size);
    return result;
  },[positions]);
  useEffect(()=>()=>geometry.dispose(),[geometry]);
  return <mesh geometry={geometry}><meshStandardMaterial color="#71c9e5" side={DoubleSide} roughness={.45}/></mesh>;
}
export default function PatientLab() {
  const worker=useRef<Worker|null>(null),canvas=useRef<HTMLCanvasElement>(null);
  const [metadata,setMetadata]=useState<Metadata>(),[digests,setDigests]=useState<string[]>([]);
  const [error,setError]=useState(''),[busy,setBusy]=useState(false),[mesh,setMesh]=useState<MeshResult>();
  const [threshold,setThreshold]=useState(0),[slice,setSlice]=useState(0);
  useEffect(()=>()=>worker.current?.terminate(),[]);
  function clear(){worker.current?.terminate();worker.current=null;setMetadata(undefined);setDigests([]);setMesh(undefined);setError('');setBusy(false);}
  function load(files:File[]){
    clear();if(!files.length)return;
    if(files.length>2000||files.reduce((sum,file)=>sum+file.size,0)>512_000_000){setError('Selecione até 2.000 arquivos de uma série, com total máximo de 512 MB.');return;}
    setBusy(true);
    try {
      const instance=new Worker(new URL('./patient.worker.ts',import.meta.url),{type:'module'});worker.current=instance;
      instance.onerror=()=>{setBusy(false);setError('Falha no processamento local. Remova o exame e tente novamente.');};
      instance.onmessage=event=>{
        if(worker.current!==instance)return;
        const result=event.data;
        if(result.kind==='ready'){
          const volume=result.metadata as Metadata;setMetadata(volume);setDigests(result.digests);setThreshold(volume.minimum+(volume.maximum-volume.minimum)*.5);setSlice(Math.floor(volume.dimensions[2]/2));setBusy(false);
        }else if(result.kind==='slice')canvas.current?.getContext('2d')?.putImageData(new ImageData(result.pixels,result.width,result.height),0,0);
        else if(result.kind==='mesh'){setMesh(result);setBusy(false);}
        else if(result.kind==='error'){setError(result.error);setBusy(false);}
      };
      instance.postMessage({kind:'load',files});
    }catch{setBusy(false);setError('Não foi possível iniciar o leitor DICOM local.');}
  }
  useEffect(()=>{if(metadata)worker.current?.postMessage({kind:'slice',slice});},[metadata,slice]);
  async function exportSurface(){
    if(!mesh||!metadata)return;
    try {
      const points=mesh.positions;
      const header=`ply\nformat ascii 1.0\ncomment provisional intensity isosurface; coordinates DICOM LPS millimetres\nelement vertex ${points.length/3}\nproperty float x\nproperty float y\nproperty float z\nelement face ${mesh.triangles}\nproperty list uchar int vertex_indices\nend_header\n`;
      const vertices=[];for(let i=0;i<points.length;i+=3)vertices.push(`${points[i]} ${points[i+1]} ${points[i+2]}`);
      const faces=[];for(let i=0;i<points.length/3;i+=3)faces.push(`3 ${i} ${i+1} ${i+2}`);
      const zip=new JSZip();zip.file('surface-lps-mm.ply',header+vertices.join('\n')+'\n'+faces.join('\n')+'\n');
      zip.file('provenance.json',JSON.stringify({schema:1,method:'intensity isosurface; marching cubes',coordinateSystem:metadata.coordinateSystem,origin:metadata.origin,axes:metadata.axes,spacing:metadata.spacing,dimensions:metadata.dimensions,threshold:mesh.threshold,samplingStrideVoxels:mesh.stride,sourceSHA256:digests,anatomicalReview:false,clinicalValidation:false,atlasRegistration:null,deviceRecommendation:null},null,2));
      const url=URL.createObjectURL(await zip.generateAsync({type:'blob'}));const link=document.createElement('a');link.href=url;link.download='paciente3d_previa_nao_revisada.zip';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
    }catch{setError('Não foi possível exportar a prévia.');}
  }
  return <section className="n3-patient" aria-label="Paciente 3D">
    <header><span className="n3-eyebrow">PACIENTE 3D · ANGIOGRAFIA ROTACIONAL</span><h2>Do exame ao modelo revisado</h2>
      <p>Importe uma série DICOM do volume reconstruído. Os arquivos são processados neste navegador e descartados ao sair desta aba.</p></header>
    <div className="patient-import"><label>Selecionar série DICOM<input aria-label="Importar volume DICOM do paciente" type="file" accept=".dcm,.dicom,application/dicom" multiple disabled={busy} onChange={event=>{load(Array.from(event.target.files??[]));event.target.value='';}}/></label>
      <button onClick={clear}>Remover exame</button></div>
    <p className="patient-note">Esta versão lê volumes monocromáticos sem compressão, com posição e orientação físicas, incluindo cortes reconstruídos exportados pelo equipamento. Projeções rotacionais brutas, ZIP e vídeos ainda não são reconstruídos aqui.</p>
    {busy&&<p role="status">Processando o exame localmente…</p>}{error&&<p role="alert">{error}</p>}
    {!metadata&&<div className="patient-empty"><h3>Uma geometria própria para cada paciente</h3><p>O modelo será extraído das intensidades do exame, preservando seu referencial em milímetros. Não serão usados vasos do atlas para preencher partes ausentes.</p><p>Após importar: conferir cortes → ajustar limiar → gerar prévia → revisar segmentação e medidas → comparar cenários.</p></div>}
    {metadata&&<>
      <p data-testid="patient-volume-metadata">{digests.length} arquivo(s) carregado(s). Volume: {metadata.dimensions.join(' × ')} voxels · espaçamento {metadata.spacing.map(value=>value.toFixed(3)).join(' × ')} mm · {metadata.coordinateSystem}</p>
      <div className="patient-layout"><section className="patient-controls">
        <h3>1 · Conferir o exame</h3><canvas ref={canvas} width={metadata.dimensions[0]} height={metadata.dimensions[1]} aria-label="Corte do volume DICOM"/>
        <label>Corte {slice+1} de {metadata.dimensions[2]}<input type="range" aria-label="Corte DICOM" min="0" max={metadata.dimensions[2]-1} value={slice} onChange={event=>setSlice(Number(event.target.value))}/></label>
        <h3>2 · Ajustar a prévia</h3><label>Limiar de intensidade: {threshold.toFixed(2)}<input type="range" aria-label="Limiar da superfície" min={metadata.minimum} max={metadata.maximum} step={(metadata.maximum-metadata.minimum)/500} value={threshold} disabled={busy} onChange={event=>{setThreshold(Number(event.target.value));setMesh(undefined);}}/></label>
        <button disabled={busy} onClick={()=>{setError('');setMesh(undefined);setBusy(true);worker.current?.postMessage({kind:'mesh',threshold});}}>Gerar prévia 3D</button>
        <p>O limiar pode incluir osso, ruído ou estruturas desconectadas. Vasos finos podem desaparecer na amostragem da prévia.</p>
      </section><section className="patient-view" aria-label="Superfície derivada do exame">
        {mesh?<><GeometryBoundary key={mesh.threshold}><Canvas camera={{position:[0,0,12],near:.01,far:100}}><ambientLight intensity={1.4}/><directionalLight position={[5,8,10]} intensity={2}/><Surface positions={mesh.positions}/><OrbitControls makeDefault/></Canvas></GeometryBoundary><p data-testid="patient-mesh-metadata">{mesh.triangles.toLocaleString('pt-BR')} triângulos · amostragem a cada {mesh.stride} voxel(s) · prévia não revisada</p><button onClick={()=>void exportSurface()}>Exportar superfície e proveniência</button></>:<p>Gere a prévia após conferir o volume e escolher o limiar.</p>}
      </section></div>
      <section className="patient-review"><h3>3 · Revisão e planejamento</h3><p>Segmentação vascular dirigida, linhas centrais, medidas de colo e vasos, comparação de dispositivos e técnicas ainda não foram implementadas. A prévia por intensidade não fornece uma escolha automática de tratamento.</p></section>
    </>}
  </section>;
}
