# Arquitetura e limites

Estado conferido no código-base publicado `025ef13cca20886cfe8bdc17b83a1957d152ace1`, em 21/10/2026. Este checkpoint acrescenta documentação, sem mudar o aplicativo.

| Módulo | Entradas e fluxo | Arquivos principais |
|---|---|---|
| Entrada Neuro3D | Rota `/#/tools/neuro3d`; abas e carregamento dos laboratórios | `features/neuro3d/Neuro3DAtlas.tsx` |
| Anatomia detalhada | Manifestos/GLBs com hashes → camadas/seleção/isolar/cortes → cena Three | `DetailedAtlas.tsx`, `open-anatomy.json`, `anatomicalInventory.ts`, `vascularCompleteness.ts` em `features/neuro3d/` |
| Angiografia do atlas | Superfícies/pose/visibilidade → worker de projeção → imagem vinculada; respostas associadas à solicitação | `AtlasAngiography.tsx`, `atlasProjection.worker.ts`, `atlasProjection.ts`, `atlasRadiograph.ts` |
| Conteúdo ilustrativo | Trajetos e reconstruções originais separados das malhas; controle embrionário explícito | `educationalVessels.ts`, `reconstructedArteries.ts`, `educationalVisibility.ts`, `DangerousAnastomosesPanel.tsx` |
| Estação procedural | Cenários, acesso e rede didática → instrumentos/contraste/DSA/roadmap; roteiro manual referenciado | `features/neuro3d/simulation/`, especialmente `station/ProcedureStation.tsx`, `VideoWorkflowGuide.tsx`, `videoWorkflows.ts` |
| Paciente 3D | Arquivos DICOM locais → worker → volume físico → cortes/limiar → isosuperfície → ZIP PLY/JSON | `features/neuro3d/patient/PatientLab.tsx`, `dicomVolume.ts`, `patient.worker.ts`, `patientSurface.ts` |
| Doppler | Parâmetros e exemplo ideal → modelo analítico sintético → espectro/M-mode/índices/áudio/exportação | `features/neuro3d/tcd/TcdLab.tsx`, `model.ts` |
| Preparação offline | Importação de anatomia/segmentações, auditoria de datasets, adaptador VMTK separado | `tools/neuro3d/`; não são serviços de produção |
| Avaliação REA | Ferramenta de desenvolvimento fixa → evidências estáticas locais → relatórios | `tools/rea/`, `docs/neuro3d-rea-*.json`, relatórios TCD/Ankyras |

## Referenciais e contratos

O atlas mantém transformações comuns de origem; a transformação de exibição não registra pacientes. A estação conserva modelos ilustrativos; nem todo vaso visível constitui rota instrumental contínua. Angiografia de superfícies representa atenuação gráfica relativa, sem cadeia calibrada de aquisição tomográfica.

Paciente 3D exporta DICOM LPS/mm; ordena cortes por posição física e rejeita séries/referenciais misturados, lacunas e geometrias incompatíveis. Rescale e bits assinados são aplicados. Marching cubes usa amostragem declarada e limite de triângulos; não é uma máscara vascular validada. Dados locais descartados ao sair da aba, sem backend/persistência nesse fluxo.

Ferramentas Python de importação devem conservar affine, unidade, origem e proveniência. Nenhuma fusão paciente/atlas é automática. VMTK exige instalação independente e saco aberto delimitado no colo; o adaptador ainda não teve execução morfométrica real validada.

## Infraestrutura e verificação

`package.json` e lockfile fixam dependências do portal; REA tem pacote/lock separados de desenvolvimento. `vite.config.ts` prepara dependências do worker. Vitest cobre lógica; `tests/neuro3d/` e `playwright.config.ts` cobrem desktop/Pixel 7. Vercel publica previews da branch `feature/neuro3d-atlas`. Supabase/GenAI do portal não demonstram integração dos repositórios de pesquisa com o laboratório DICOM.

Não existe serviço clínico de reconstrução de projeções XA, segmentação por IA desses sete repositórios ou solver validado de dispositivos neste checkpoint.
