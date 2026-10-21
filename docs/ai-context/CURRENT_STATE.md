# Estado verificável — 21/10/2026

Base remota desta etapa: `81f679985dc448670ad13f30b0989fa598ac7ac2`, branch feature/neuro3d-atlas, PR 2 rascunho. O checkpoint novo é identificável pelo Git que contém este arquivo; conferir hash/árvore no fechamento. Original e alterações locais alheias preservados. Históricos anteriores em CHECKPOINT_HISTORY e VALIDATION.

## Entregue e verificado funcionalmente

- Atlas detalhado/conceitual, angiografia vinculada, anastomoses, famílias e controle embrionário preservados. Quatro representações embrionárias e 25 vias de estudo não comprovam completude/continuidade luminal.
- Estação com fases manuais guiadas por vídeos Mentice; interação não equivale a mecânica certificada. Vascular Twin orienta Paciente 3D.
- Paciente 3D: DICOM local reconstruído, geometria LPS/mm, cortes/limiar/isosuperfície/exportação; testes sintéticos. Sem reconstrução XA bruta ou segmentação clínica validada.
- Doppler: modelo analítico sintético, espectro/M-mode/controles/exportação; sem FFT real ou diagnóstico.
- REA TCD/Ankyras: avaliação estática; sem execução do software comercial ou corpos IL2CPP recuperados.
- Referências BRAVE pat_1 e VENAT0,10/0,20 independentes com hashes/licenças/affines. Três superfícies e 42 planos nativos já derivados. Auditoria anterior conferiu 5.357.072 valores float32 sem reamostragem.
- Lote atual: plano e marcos físicos no mesmo 3D da fonte; clique no ponto retorna ao corte; lista acessível; registro/exportação conserva câmera/plano/marcos/visibilidade. Sem ajuste do ponto ao vaso ou registro entre fontes/atlas.
- Linhagem Anatria→Qbank: primitiva e transformações do seio reto exatamente preservadas, 1164 vértices/2304 triângulos. Vendor registra CURVE, avaliada em 1152 polígonos antes da triangulação. Não há vínculo por ID FMA/BodyParts3D estabelecido. Ver ../neuro3d-linked-reference-lineage.md.

## Anatomia ainda parcial

1114 originais/1112 ativos, 353 reconstruções; 178 importadas arteriais/63 venosas; 312 identidades/grupos de requisitos. Permanecem **353 IDs sem malha importada ativa** (267 arteriais/86 venosos), sete rótulos sem identidade (107,4,26b,70a,74a,114a,115a) e discordância Galeno–seio reto. Zero aprovações anatômicas. Nenhuma ponte/renomeação/deformação foi aplicada. Oito representações embrionárias adicionais anunciadas anteriormente não recuperadas.

## Validação atual

TypeScript/build e 124 testes unitários/29 arquivos aprovados. Auditor de linhagem executado contra commit fixo; 22 casos únicos de navegador em desktop/Pixel7, capturas inspecionadas. Paciente/Doppler/revisão vascular/roteiros incluídos. Aviso de chunks >500kB permanece. Sem homologação clínica ou exame 3DRA real validado.

## Preview e continuidade

**81f6799 confirmado Ready/Preview** por screenshot do usuário, com branch e commit visíveis; evidência/hash em ../neuro3d-preview-81f6799-evidence.json. Isso supera a pendência anterior desse checkpoint. 403 do conector limita consulta ao time e não impediu deploy automático. Nenhum teste remoto de navegador declarado. O novo checkpoint exige evidência própria; não reinstalar plugin nem presumir autorização ao time.

P0 seguinte: navegação ortogonal da mesma fonte respeitando sete planos por eixo; origem por objeto anterior a Anatria ainda precisa de evidência. CTA Zenodo15697196 é candidato a ensaios independentes de Paciente3D, não preenche identidade do seio reto. P1 permanece ROI/máscara reversível/medidas e validação 3DRA real; depois estudo de dispositivos. P2 Doppler e mecânica avançada. Ver ROADMAP/REFERENCES.

## Prioridade nova — 3D-2D-GS-CA para geometria

Usuário indicou explicitamente os onze ZIPs 3D-2D-GS-CA como referência geométrica preferencial. **Próximo lote geométrico deve começar por essa fonte**, antes de ampliar navegação BRAVE/VENAT; CTA é complementar. Auditoria offline dos10casos/20vistas e60coleções MGP concluída, hashes/CRC/bytes/finitude e projeção algébrica conferidos; três testes Python próprios aprovados. Não executou Matlab/MEX/MGP ou importação na UI. Volumes MHD/RAW e detector RAD/RAW estão em Sv/Sw mm, não DICOMLPS/RAS implícito. Report ../neuro3d-geometry-dataset-review.md; resultados ../neuro3d-gs-ca-geometry-audit.json.

Página BY-NC-ND e guia exige acordo/restringe distribuição; acordo existente não estabelecido. Dados/calibrações/pontos/código de fornecedor permanecem locais, sem redistribuição; preservar essa condição. Próxima etapa: leitor/visor local, VOI/ROI e contrato voxel→mm→detector verificável, sem sobrepor atlas ou reivindicar registro validado. Database_info.xls/ROIs e convenções visuais ainda precisam de verificação. CTA foi reconferido e3cortes reais foram rejeitados pelo leitor por JPEGsemperdas; série184 excede32milhões de voxels. Ver os dois novos relatórios CTA; não declarar integração.
