# Continuação — registro histórico do lote de laboratórios

Atualização de 21/10/2026: o ponto de entrada vigente é [ai-context/NEXT_SESSION.md](ai-context/NEXT_SESSION.md). O prompt e a ordem de prioridades abaixo são históricos; a prioridade atual é anatomia e angiografia antes de procedimentos avançados, conforme [ROADMAP](ai-context/ROADMAP.md). Preservar todas as frentes descritas neste registro.

## Preferências confirmadas

Trabalhar em etapas longas, incluindo implementação, revisão, testes, documentação e preview. Ao concluir, entregar sempre um prompt pronto para a próxima etapa. Vídeos Mentice fornecidos são a referência primária de interação do simulador. Vascular Twin é a referência de fluxo da aba Paciente 3D. Entrada inicial confirmada: DICOM de angiografia rotacional 3D.

## Base preservada

Branch de preview: `feature/neuro3d-atlas`, PR rascunho nº 2, sem merge na main. Base inicial desta continuação: `8f599f533a79421d2d065d100dc3d398160443cf`. O lote de 110 testes anunciado no chat anterior foi interrompido antes da atualização da branch e não deve ser apresentado como publicado. Seus arquivos/commit locais do ambiente anterior não estavam disponíveis; apenas partes foram reconstruídas nesta continuação.

Trabalho local atual em `qbank-neuro-continuation/`, branch local `continuation/neuro3d-preview`. A pasta `qbank-neuro/` anterior e seus cinco arquivos não rastreados foram preservados. `sources/` é somente leitura.

## Implementado nesta continuação

- Controle explícito para as quatro representações embrionárias que já existiam na base. Seleção, família e variantes gerais não ultrapassam o controle. Não foram recuperadas neste lote as oito novas representações do lote perdido.
- Painel de 25 vias de anastomoses de estudo, lateralidade e limpeza de isolamento. Não comprova continuidade ou cria rotas instrumentais.
- Ocultação imediata de imagem 2D antiga quando a visibilidade muda; associação das respostas do worker às suas próprias solicitações.
- Roteiro do simulador ligado aos tempos dos vídeos, sem aprovação automática de fases, e monitor único inicial com biplano opcional. Referências por hash na exportação de sessão.
- Aba Paciente 3D: leitura local de DICOM reconstruído, cortes, limiar, prévia de isosuperfície, exportação PLY/JSON com coordenadas e proveniência. Dados de paciente não enviados à nuvem nem gravados de forma persistente.

## Próximo lote substancial

1. Expandir Paciente 3D com seleção de componente vascular/ROI, comparação em planos ortogonais e edição reversível da máscara; nunca completar vasos com atlas/template.
2. Incorporar uma máscara vascular revisada preservando affine/Frame of Reference, usando o importador existente quando apropriado. Conferir licenças/implementações dos repositórios candidatos antes de integração.
3. Obter e conferir compatibilidade com DICOM 3DRA real desidentificado, em particular as codificações multi-frame do fabricante. Sintéticos verificam convenções, não equivalência clínica.
4. Só após a revisão geométrica: linha central, medidas de colo/diâmetro/comprimento/tortuosidade e comparação explícita com a faixa dos dispositivos. Não anunciar uma técnica como melhor por um limiar ou pela aparência de uma malha.
5. Continuar o simulador pelos vídeos: cine/séries e roadmap, controles coaxiais, suporte proximal e sequência de dispositivos. Registrar o trecho que justifica cada mudança; manter funções não reproduzidas identificadas.

## Demandas acrescentadas durante o lote

- Doppler transcraniano: aba implementada com modelo analítico original e funções de insonação/espectro/M-mode, baseada em guias estáticos do TCD Simulator. Auditoria REA e limites em `neuro3d-tcd-reference-review.md`. Próximos avanços: anatomia de insonação e estimador/sinais com FFT real, mantendo separado o exemplo ilustrativo.
- Ankyras: REA avaliou o ZIP e o dummy assembly; a avaliação inicial foi concluída e está em `neuro3d-ankyras-review.md`. Os stubs IL2CPP orientam contratos/fluxos, mas não fornecem os corpos dos algoritmos. Priorizar revisão de segmentação, linha central, marcos e medidas antes de simulação de dispositivos. Não usar retornos default como lógica.
- O registro persistente de todas as frentes está no `TASK_LEDGER.md` da pasta-mãe local e no resumo versionado `neuro3d-work-ledger.md`. Atualizar ambos em cada etapa; não abandonar as tarefas anteriores quando chegar uma solicitação nova.

## Pendências preservadas

Discrepância Galeno–seio reto, identificação de ramos, sete identidades do diagrama e revisão anatômica das reconstruções continuam abertas. Comparador independente BRAVE-NET/VENAT e o restante do lote perdido ainda não foram recuperados aqui. Nenhuma homologação clínica, reconstrução de projeções brutas, recomendação terapêutica, registro no atlas ou biomecânica específica de dispositivos foi entregue.

## Prompt pronto para continuar

Continue o Qbank-neuro 3D lendo primeiro TASK_LEDGER.md, PROJECT_STATUS.md e docs/neuro3d-next-step.md. Confira a cópia qbank-neuro-continuation e a branch remota antes de editar. Trabalhe em um lote longo com implementação, testes, inspeção visual, documentação e preview em rascunho. Priorize Paciente 3D: segmentação por componente/ROI, planos ortogonais e histórico reversível, preservando DICOM LPS em mm e proveniência. Use a avaliação REA do Ankyras para especificar contratos de segmentação, linha central, marcos e medidas; os stubs IL2CPP não contêm os algoritmos completos. Entrada confirmada: DICOM de angiografia rotacional 3D; diferencie projeções brutas de volume reconstruído e não complete ausências com atlas. Preserve também o simulador guiado pelos quatro vídeos, o laboratório Doppler baseado na inspeção REA do TCD Simulator e as pendências do atlas. Consulte os repositórios anteriores antes de integrar motores. Não anuncie precisão clínica ou melhor dispositivo/técnica sem evidência. Atualize o registro por tarefa e entregue resultados reais, limitações e o próximo prompt pronto para colar.

## Atualização do lote de comparador

BRAVE-NET/VENAT agora têm superfícies verificadas na aba Referências vasculares, em espaços independentes. Inventário recalculado e pendência Galeno–seio reto mantida. Ver ai-context/NEXT_SESSION.md e neuro3d-independent-comparison.md; a próxima tarefa é inspeção seccional/marcos e revisão da geometria original, não recuperação do comparador já entregue.

## Lote seccional concluído

42 planos nativos BRAVE/VENAT, marcos RAS/mm e auditoria dos 2304 triângulos originais do seio reto. Discrepância Galeno e sete identidades preservadas. Próximo: rastrear linhagem da identidade/transformações e vincular cortes/3D da mesma fonte. Ver ai-context/NEXT_SESSION.md e neuro3d-sectional-review.md.


## Continuidade atual — vínculos físicos e linhagem

Leia ai-context/NEXT_SESSION.md e neuro3d-linked-reference-lineage.md. Auditoria Anatria→Qbank e vínculo corte/marco/3D concluídos; não refazer. Galeno e sete identidades permanecem abertos. Preview81f6799 Ready confirmado por imagem do usuário apesar do403 de consulta ao time.

## Direção mais recente do usuário

3D-2D-GS-CA passa a referência preferencial de geometria, conforme neuro3d-geometry-dataset-review.md. Dez casos auditados localmente, três testes Python próprios aprovados; próximo lote deve começar pelo visor local e contrato físico, mantendo dados/licenças em espaço próprio. CTA fica complementar. Esse direcionamento supera a ordem de próxima tarefa anterior.

## Prioridade atual Neuroangio

Completude vascular clicável, ramos, curso, anastomoses e forames são agora prioridade máxima expressa; auditoria própria autorizada. Índice/revelação, original2Disolada, auditoria592vasos e nove registros de passagens entregues. VinteIDs sem geometria e373sem referência; não homologar por presença. Ler ai-context/NEXT_SESSION.md e neuro3d-neuroangio-priority-review.md. VisorGS-CA pendente, preservado como apoio.

## Continuidade após cortes físicos das vias

A etapa seguinte já entregou o inspetor físico e plano3D coincidente para as quatro vias/lado e recuperou texto dirigido dos três capítulos venosos. Ler neuro3d-passage-geometry-review.md e ai-context/NEXT_SESSION.md. Não repetir essa implementação. Mantidas20ausências/373lacunas e identidades anteriores; quatro separações geométricas demonstradas não autorizam pontes.

## Continuidade após testemunhos ósseos

Quatro bordas V2 com contenção seccional e proveniência dos modelos foram entregues; ler neuro3d-skull-landmarks-review.md e ai-context/NEXT_SESSION.md. Não repetir o inspetor ou essa auditoria sem nova evidência. Nomes de forames/túneis continuam não certificados; próximo foco é continuidade3D/contexto motor do oval.20/373/Galeno/seteIDs e todas as frentes mantidos.
