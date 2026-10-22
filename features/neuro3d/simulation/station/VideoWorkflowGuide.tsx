import React, { useState } from 'react';
import { primaryVideoSources, referenceTime, workflowFor } from './videoWorkflows';

export default function VideoWorkflowGuide({ kind }: { kind: string }) {
  const [index, setIndex] = useState(0);
  const phases = workflowFor(kind);
  if (!phases.length) return null;
  const phase = phases[Math.min(index, phases.length - 1)];
  const source = primaryVideoSources.find(row => row.id === phase.sourceId)!;
  return <section className="nvs-video-guide" aria-label="Roteiro baseado nos vídeos fornecidos" data-testid="video-workflow-guide">
    <div className="nvs-guide-heading"><h3>Roteiro do procedimento</h3><span>Etapa de estudo {index + 1} de {phases.length}</span></div>
    <p>Referência principal: demonstrações em vídeo fornecidas. Navegar pelo roteiro não executa ações nem aprova uma etapa clínica.</p>
    <nav aria-label="Etapas do roteiro">
      {phases.map((row, n) => <button key={row.title} aria-current={index === n ? 'step' : undefined} onClick={() => setIndex(n)}>{n + 1} · {row.title}</button>)}
    </nav>
    <article>
      <h4>{phase.title}</h4><p>{phase.observation}</p>
      <small>{source.title} · {referenceTime(phase.seconds)}</small>
      <p>{phase.available}</p>
    </article>
    <div className="nvs-guide-actions">
      <button disabled={index === 0} onClick={() => setIndex(n => Math.max(0, n - 1))}>Etapa anterior</button>
      <button disabled={index === phases.length - 1} onClick={() => setIndex(n => Math.min(phases.length - 1, n + 1))}>Próxima etapa de estudo</button>
    </div>
  </section>;
}
