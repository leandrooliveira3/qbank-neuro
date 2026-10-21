# Estado verificável — 21/10/2026

Base de código remoto: `025ef13cca20886cfe8bdc17b83a1957d152ace1`, branch `feature/neuro3d-atlas`, PR [2](https://github.com/leandrooliveira3/qbank-neuro/pull/2). Vercel informou SUCCESS para esse commit. Isso confirma deployment, não uma inspeção do navegador remoto. O checkpoint que contém este documento é identificável pelo histórico Git, sem hash autorreferente.

## Implementado com validação funcional

| Entrega | Evidência | Limite |
|---|---|---|
| Atlas: seleção/camadas, famílias, anastomoses e controle embrionário | `features/neuro3d/`; testes Vitest e navegador; `../neuro3d-continuation-validation.md` | Quatro representações embrionárias existentes e 25 vias de estudo; não equivalem a completude ou continuidade luminal |
| Angiografia vinculada e descarte imediato de quadro 2D antigo | `AtlasAngiography.tsx`, workers, testes de atlas | Superfícies/projeção relativa, sem reconstrução calibrada de raios X |
| Roteiros dos vídeos e monitor único/biplano opcional | `simulation/station/videoWorkflows.ts`, testes `video-workflow.spec.ts` e `simulation.spec.ts` | Navegação manual, sem certificação de fase ou mecânica validada |
| Paciente 3D: DICOM local, cortes/limiar/isosuperfície/exportação | `patient/`, `patient.spec.ts`, `dicomVolume.test.ts` | DICOM sintético; apenas volumes reconstruídos compatíveis; sem segmentação clínica |
| Doppler didático: controles, espectro/M-mode, congelar/cursor/exportação | `tcd/`, `tcd.spec.ts`, `model.test.ts` | Modelo analítico sintético, sem FFT real ou limiares diagnósticos |
| Avaliação estática REA de TCD/Ankyras | `../neuro3d-tcd-reference-review.md`, `../neuro3d-ankyras-review.md` | Não executou software comercial; stubs Ankyras sem corpos dos métodos |

Última validação do aplicativo: 117 unitários/26 arquivos, 36 casos únicos de navegador, TypeScript e build aprovados. Capturas locais inspecionadas. Detalhes e falhas iniciais resolvidas em VALIDATION e relatório original.

## Parcial / implementado sem validação suficiente

- Atlas anatômico: malhas importadas e reconstruções ilustrativas presentes; inventários/revisões continuam abertos. Contagens históricas em `../neuro3d-anatomy-readiness.md` não devem ser tratadas como censo atual sem recalcular o código.
- Discrepância Galeno–seio reto, identificação de ramos e sete identidades do diagrama pendentes. Não há aprovação anatômica global.
- Paciente 3D não possui seleção de componente/ROI, edição reversível de máscara, linha central ou medidas revisadas. Compatibilidade com 3DRA real de fabricante não verificada.
- `tools/neuro3d/analyze_aneurysm_vmtk.py`: adaptador preparado, CLI/compilação previamente verificadas; morfometria VTK/VMTK não executada em saco real.
- Dataset CTA: índice de 122 STL e uma amostra inspecionados conforme relatório anterior; sem importação no aplicativo ou registro no atlas.

## Planejado / dependências em aberto

- P0: reconciliação do inventário arterial/venoso, relações espaciais e angiografia multiprojeção; comparação independente BRAVE-NET/VENAT em espaço próprio.
- P1: revisão de segmentação do paciente e máscaras físicas; depois linha central/marcos/medidas e estudo explícito de dispositivos.
- P2: evolução da insonação/estimador Doppler e simulação avançada guiada pelos vídeos, após a base anatômica necessária.
- Bloqueios de fontes: DSCA exige acesso acadêmico; IntrA e outros dados exigem conferência de licença específica. Não foram enviados pedidos em nome do usuário.
- Ausência de exame 3DRA real desidentificado limita validação em fabricante; não impede melhorar testes/fluxos locais.

## Recuperação e itens descontinuados

O lote anunciado no chat anterior como 110 testes não chegou ao remoto; não foi recuperado integralmente. Oito representações embrionárias adicionais e comparador independente continuam pendentes. Nenhuma frente foi cancelada/descontinuada pelo usuário. Contagens antigas de testes permanecem como histórico, substituídas pelo resultado atual de 117/36.

## Última etapa documental

Auditoria das dez fontes e instalação do protocolo `AGENTS.md` + nove documentos de continuidade. Uso real, fontes e restrições em REFERENCES. A persistência remota deste novo checkpoint deve ser confirmada por leitura da branch; o hash final pertence ao relatório de fechamento e ao próximo registro de histórico.
