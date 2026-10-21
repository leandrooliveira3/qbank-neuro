import React,{useMemo,useState} from 'react';
import {vascularCompleteness,vascularCompletenessCounts,unmappedVascularDiagramEntries} from './vascularCompleteness';
import {neuroangioReviewSources} from './neuroangioRequirements';
import {normalize} from './model';
import {openAnatomy} from './openAnatomy';
import {reconstructedVessels} from './reconstructedVessels';
import {neurovascularPassages,resolvePassage,passageBookEvidence} from './neurovascularPassages';
const names=new Map([...openAnatomy.structures,...reconstructedVessels].map(row=>[row.id,row.name]));
export default function NeuroangioCoveragePanel({onExplore}:{onExplore:(id:string)=>void}){
  const [query,setQuery]=useState(''),[system,setSystem]=useState('all'),[coverage,setCoverage]=useState('all');
  const rows=useMemo(()=>vascularCompleteness.filter(row=>(system==='all'||row.layer===system)&&
    (coverage==='all'||coverage==='reference-gap'&&row.referenceMissingIds.length>0||coverage==='missing'&&row.missingIds.length>0)&&
    normalize(`${row.id} ${row.name} ${row.group} ${row.expectedIds.join(' ')}`).includes(normalize(query))),[system,coverage,query]);
  function exportAudit(){
    const report={schema:1,scope:'Current explicit inventory; not exhaustive certification of all Neuroangio chapters/images',
      sourceReviews:neuroangioReviewSources,counts:vascularCompletenessCounts,requirements:vascularCompleteness,
      unresolvedDiagram:unmappedVascularDiagramEntries,anatomicalApproval:false,atlasComplete:false,
      passageBookEvidence,passages:neurovascularPassages.flatMap(row=>(['l','r'] as const).map(side=>resolvePassage(row,side))),
      datasetEvidence:[{source:'BRAVE-NET pat_1',use:'Independent manual-label surface/sections',namedVesselCorrespondence:false},
        {source:'VENAT',use:'Independent cohort PVF surface/sections',namedVesselCorrespondence:false},
        {source:'3D-2D-GS-CA',use:'Local physical geometry audit',namedVesselCorrespondence:false,redistributed:false}],
      policy:'No nearest-vessel naming, parent substitution, bridges or source-coordinate changes.'};
    const url=URL.createObjectURL(new Blob([JSON.stringify(report,null,2)],{type:'application/json'}));
    const a=document.createElement('a');a.href=url;a.download='auditoria-atlas-neuroangio.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  return <section aria-label="Cobertura prioritária Neuroangio" className="nda-neuroangio">
    <h3>Atlas vascular · prioridade de completude</h3>
    <p>Explore artérias e veias por identidade e lado. Revelar e isolar ajusta os filtros e o campo das vistas 3D e angiográfica, sem mover o vaso.</p>
    <p>{vascularCompletenessCounts.referenceMissingIndividualIds} identidades sem referência importada ativa; {vascularCompletenessCounts.missingIndividualIds} sem geometria individual. Ilustrações existentes continuam distintas de anatomia derivada de imagem.</p>
    <label>Buscar vaso<input aria-label="Buscar vaso no índice Neuroangio" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Nome em português ou ID…"/></label>
    <label>Sistema<select aria-label="Sistema Neuroangio" value={system} onChange={e=>setSystem(e.target.value)}><option value="all">Artérias e veias</option><option value="arterial">Artérias</option><option value="venous">Veias e seios</option></select></label>
    <label>Evidência<select aria-label="Evidência Neuroangio" value={coverage} onChange={e=>setCoverage(e.target.value)}><option value="all">Todas</option><option value="reference-gap">Referência importada ausente</option><option value="missing">Geometria individual ausente</option></select></label>
    <p role="status">{rows.length} identidades ou grupos encontrados.</p><button onClick={exportAudit}>Exportar auditoria Neuroangio</button>
    <details><summary>Como os datasets apoiam a revisão</summary><p>BRAVE e VENAT fornecem superfícies e cortes independentes; GS-CA fornece geometria 3D–2D local calibrada. Essas fontes ajudam a confrontar o atlas, mas não rotulam automaticamente cada ramo ou veia. Nenhum registro espacial ou identidade individual foi presumido.</p><p>As variantes não coexistem obrigatoriamente no mesmo indivíduo. Revelar uma artéria embrionária ativa seu controle explícito.</p></details>
    {rows.map(row=><article key={`${row.layer}:${row.id}`} data-neuroangio-id={row.id}>
      <h4>{row.name}</h4><small>{row.group}</small>
      <p>{row.missingIds.length?'Geometria individual pendente':row.referenceMissingIds.length?'Inclui reconstrução ilustrativa · referência individual pendente':'Fonte importada · revisão anatômica pendente'}</p>
      {row.ids.map(id=><button key={id} onClick={()=>onExplore(id)} aria-label={`Revelar e isolar ${id}`}>{names.get(id)??id} · revelar e isolar</button>)}
      {row.missingIds.length>0&&<p data-testid="neuroangio-geometry-gap">Sem superfície identificada: {row.missingIds.join(', ')}. Não foi atribuído um vaso próximo ou uma curva arbitrada.</p>}
      {row.findings.map(text=><p key={text} className="nda-reconstruction-note">{text}</p>)}
      <details><summary>Evidência e pendências</summary><p>{row.note}</p>{row.references.map(reference=><a key={reference} href={reference} target="_blank" rel="noreferrer">Fonte anatômica</a>)}</details>
    </article>)}
    <details><summary>Sete identidades do diagrama permanecem em aberto</summary>{unmappedVascularDiagramEntries.filter(row=>row.kind==='figure-label'||row.kind==='source-conflict').map(row=><p key={row.key}>{row.number} · {row.portuguese}</p>)}</details>
  </section>;
}
