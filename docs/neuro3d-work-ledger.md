# Frentes de trabalho — 21/10/2026

Preferência do usuário: etapas longas, execução até uma entrega verificável e prompt de continuação ao final de cada etapa. Novos pedidos acrescentam frentes; não apagam os anteriores.

| Frente | Entrega deste lote | Próxima obrigação |
|---|---|---|
| Atlas / lote interrompido | Controle embrionário, 25 vias de estudo, correção de imagem 2D obsoleta | Recuperar comparador independente BRAVE-NET/VENAT e demais partes perdidas; manter Galeno–seio reto, ramos e sete identidades pendentes. |
| Simulador Mentice | Roteiros com tempos/fontes, monitor único inicial e referências na exportação | Cine/séries, 3DRA/medidas, suporte proximal, sequência instrumental e mecânica específica. Vídeos são a referência primária. |
| Paciente 3D | DICOM reconstruído local, cortes, limiar, isosuperfície e exportação física/proveniência | Segmentação revisável, ROI/componentes, planos ortogonais, histórico, 3DRA real desidentificado, linha central/medidas e depois comparação de dispositivos. |
| Doppler transcraniano | Aba com controles e modelo didático original, espectro/M-mode, congelamento/cursor, áudio e exportação | Insonação anatômica, FFT/estimador, bilateralidade/tendências e modelos fisiológicos especificados; não confundir com equivalência ao motor original. |
| Ankyras / REA | Inventário ZIP, inspeção do dummy assembly e avaliação de declarações concluídos | Usar os contratos para orientar segmentação, linha central, marcos/medidas e cenários. Os corpos dos algoritmos estão ausentes. Nenhum motor comercial foi integrado. |

Relatórios: `neuro3d-primary-video-references.md`, `neuro3d-patient-workspace.md`, `neuro3d-tcd-reference-review.md`, `neuro3d-ankyras-review.md`. Próximo prompt em `neuro3d-next-step.md`. Checkpoint detalhado local em `TASK_LEDGER.md` da pasta-mãe.

Dados de paciente não são enviados ao backend. Modelos do atlas, exemplos Doppler e prévia do exame têm proveniências separadas. Nenhuma tarefa deste registro representa homologação clínica ou recomendação terapêutica automática.

## Atualização — protocolo V2.0 e auditoria de fontes

Ponto de recuperação vigente: [ai-context/NEXT_SESSION.md](ai-context/NEXT_SESSION.md). Auditoria dos sete links GitHub/três datasets em [REFERENCES](ai-context/REFERENCES.md): fontes consultadas não equivalem a motores integrados; VMTK tem adaptador offline não validado em morfometria real e CTA apenas amostra inspecionada. Anatomia/angiografia são a prioridade permanente antes de simulação avançada. Código do lote publicado em `025ef13cca20886cfe8bdc17b83a1957d152ace1`, deployment Vercel SUCCESS confirmado. Todas as frentes anteriores permanecem.

## Atualização do lote de comparador

BRAVE-NET/VENAT agora têm superfícies verificadas na aba Referências vasculares, em espaços independentes. Inventário recalculado e pendência Galeno–seio reto mantida. Ver ai-context/NEXT_SESSION.md e neuro3d-independent-comparison.md; a próxima tarefa é inspeção seccional/marcos e revisão da geometria original, não recuperação do comparador já entregue.

## Lote seccional concluído

42 planos nativos BRAVE/VENAT, marcos RAS/mm e auditoria dos 2304 triângulos originais do seio reto. Discrepância Galeno e sete identidades preservadas. Próximo: rastrear linhagem da identidade/transformações e vincular cortes/3D da mesma fonte. Ver ai-context/NEXT_SESSION.md e neuro3d-sectional-review.md.


## Continuidade atual — vínculos físicos e linhagem

Leia ai-context/NEXT_SESSION.md e neuro3d-linked-reference-lineage.md. Auditoria Anatria→Qbank e vínculo corte/marco/3D concluídos; não refazer. Galeno e sete identidades permanecem abertos. Preview81f6799 Ready confirmado por imagem do usuário apesar do403 de consulta ao time.

## Direção mais recente do usuário

3D-2D-GS-CA passa a referência preferencial de geometria, conforme neuro3d-geometry-dataset-review.md. Dez casos auditados localmente, três testes Python próprios aprovados; próximo lote deve começar pelo visor local e contrato físico, mantendo dados/licenças em espaço próprio. CTA fica complementar. Esse direcionamento supera a ordem de próxima tarefa anterior.
