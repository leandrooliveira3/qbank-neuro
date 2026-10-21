# Histórico de checkpoints

Acrescentar registros; não apagar os anteriores. Hashes publicados devem ser confirmados no remoto. O commit que cria um documento é identificado pelo Git, sem tentar inserir um hash autorreferente.

## Base recuperada — 21/10/2026

- Repositório: leandrooliveira3/qbank-neuro; branch `feature/neuro3d-atlas`, PR nº 2 rascunho.
- Commit inicial confirmado: `8f599f533a79421d2d065d100dc3d398160443cf`.
- Contexto: lote de 110 testes anunciado no chat anterior interrompido antes de publicar; arquivos/objetos do ambiente anterior indisponíveis. Checkout original preservado.
- Pendências: recuperação parcial, anatomia, comparador e demais solicitações.

## Código dos laboratórios e recuperação parcial — 21/10/2026

- Commit remoto confirmado: `025ef13cca20886cfe8bdc17b83a1957d152ace1`.
- Árvore: `d2bbcfccbccbf267571b130a109bbfb483571925`, igual ao commit local `5a7171d6bfe4efc406de88887a9529c7a6436c13`; metadados diferentes por publicação via conector. Nenhum force push.
- Entrega: controle embrionário, anastomoses/2D obsoleto, roteiros dos vídeos, Paciente 3D DICOM local, Doppler, avaliações REA TCD/Ankyras e relatórios.
- Validação: TypeScript/build, 117 unitários e 36 casos únicos de navegador aprovados; Vercel SUCCESS para o commit. Não houve inspeção remota do navegador nem validação clínica.
- Pendências: anatomia e comparador, 3DRA real, segmentação/medidas, Doppler avançado, mecânica/dispositivos e oito representações adicionais perdidas.

## Auditoria e protocolo V2.0 — 21/10/2026

- Pai remoto confirmado: `025ef13cca20886cfe8bdc17b83a1957d152ace1`; nova branch local `continuation/ai-context` criada dessa base sem reescrever histórico.
- Entrega: AGENTS, nove documentos ai-context, auditoria de sete links/três datasets e atualização dos pontos de entrada antigos. Sem alteração de lógica/recursos do site.
- Prioridade: anatomia e angiografia antes de procedimentos avançados; preservar todas as frentes.
- Validação de fechamento: dez documentos presentes, três links relativos válidos, dez fontes e doze itens de NEXT_SESSION conferidos, diff documental sem erros de whitespace. Hash remoto final deve ser confirmado e informado no relatório; na sessão seguinte registrar esse hash em novo checkpoint, preservando este registro.
- Próximo ponto exato: P0 de inventário/relações e comparador independente descrito em NEXT_SESSION.

## Comparador independente e reconciliação — 21/10/2026

- Checkpoint anterior publicado confirmado: `ad5515dc53067689d5bdf54e514b0caa0d6a572e`, árvore `69d922983d2862b4ceda4ec200fd539a8c6a6915`; branch feature/neuro3d-atlas/PR 2 rascunho.
- Nova branch local continuation/vascular-comparator criada dessa base, preservando original e branches anteriores.
- Entregas: aba independente BRAVE-NET/VENAT, três derivados verificados/licenciados, decoder seguro, vistas/pose/proveniência, reconciliação atual por ID e nota Galeno–seio reto. Nenhuma geometria do atlas alterada.
- Pendências: registro/marcos/cortes, sete identidades, conexão Galeno–seio reto, oito representações embrionárias adicionais e demais frentes preservadas.
- O commit que contém este registro é identificável pelo Git; confirmar hash remoto e árvore ao fechar e informá-los no relatório. Resultados detalhados em VALIDATION e no relatório do comparador.
- Fechamento funcional: TypeScript, 120 unitários/27 arquivos e build aprovados; 18 casos únicos de navegador nesta etapa (execuções de 10 e 12, com quatro repetições), capturas inspecionadas e diff conferido. Nenhuma aprovação anatômica/clinica acrescentada.

## Lote seccional — 21/10/2026

Checkpoint anterior 2cd11d7b528b3d519dcf92776d10b0b8a2022215 confirmado; branch local continuation/sectional-review criada da remota preservando as anteriores. Entrega: 42 planos, marcos físicos, contexto original, auditoria integral do seio reto e documentos. Nenhuma geometria/nomenclatura corrigida por proximidade. Código e dados derivados a publicar em feature/neuro3d-atlas/PR 2 rascunho; conferir hash e árvore no fechamento. Deployment independente ainda depende de acesso ao time; não confundir persistência Git com Vercel pronto.

## Linhagem e vínculos físicos — 21/10/2026

- Checkpoint anterior publicado confirmado:81f679985dc448670ad13f30b0989fa598ac7ac2, árvore25bc16534a1c2eb533b539b0f55f43c969bbd8ca. Screenshot do usuário confirma Ready/Preview, superando pendência anterior; conector403 limita consulta.
- Branch local continuation/linked-reference-review criada dessa base. Original/alterações alheias preservados.
- Entregues: auditoria Anatria→Qbank da primitiva/TRS, evidência CURVE/TA2 com limites anteriores a Anatria, plano/marcos no3D e retorno ao corte, exportação de câmera/plano/marcos/visibilidade. Não alterou malhas/identidades.
- TypeScript/build,124 unitários/29arquivos, auditor offline e22 casos únicos de navegador aprovados; capturas inspecionadas. Todas as frentes mantidas; Galeno/sete IDs/353 lacunas continuam sem aprovação.
- Hash deste checkpoint deve ser confirmado no remoto ao fechar e comunicado no relatório. Registro Git identifica o commit que contém este documento, sem autorreferência. Publicar na feature/neuro3d-atlas, sem merge/force; novo deployment exige evidência própria.

## Prioridade nova — 3D-2D-GS-CA para geometria

Usuário indicou explicitamente os onze ZIPs 3D-2D-GS-CA como referência geométrica preferencial. **Próximo lote geométrico deve começar por essa fonte**, antes de ampliar navegação BRAVE/VENAT; CTA é complementar. Auditoria offline dos10casos/20vistas e60coleções MGP concluída, hashes/CRC/bytes/finitude e projeção algébrica conferidos; três testes Python próprios aprovados. Não executou Matlab/MEX/MGP ou importação na UI. Volumes MHD/RAW e detector RAD/RAW estão em Sv/Sw mm, não DICOMLPS/RAS implícito. Report ../neuro3d-geometry-dataset-review.md; resultados ../neuro3d-gs-ca-geometry-audit.json.

Página BY-NC-ND e guia exige acordo/restringe distribuição; acordo existente não estabelecido. Dados/calibrações/pontos/código de fornecedor permanecem locais, sem redistribuição; preservar essa condição. Próxima etapa: leitor/visor local, VOI/ROI e contrato voxel→mm→detector verificável, sem sobrepor atlas ou reivindicar registro validado. Database_info.xls/ROIs e convenções visuais ainda precisam de verificação. CTA foi reconferido e3cortes reais foram rejeitados pelo leitor por JPEGsemperdas; série184 excede32milhões de voxels. Ver os dois novos relatórios CTA; não declarar integração.

## Neuroangio prioritário, auditoria própria e passagens — 21/10/2026

- Pai publicado353d149586290e97670711ce02e0175fcae5a79d confirmado, árvorebdba44be3c3f45e3d8e94829edcb790b17f5f2ce; VercelSUCCESSviaGitHub. Branchlocal continuation/neuroangio-priority deriva desse pai, preservando branches anteriores/original.
- Usuário alterou prioridade máxima para completude vascular do atlas/angiografia, autorizou auditoria própria e acrescentou ramos/curso/anastomoses/forames. GS-CAvisor preservado pendente.
- Entregas: índice/revelação, original2Disolada, auditoria592vasos,353comparações aos pais,3552raycasts, novas20ausências e nove passagens/46elos bibliográficos. Livro original Lasjaunias dirigido, sem redistribuição. Nenhuma ponte ou identidade anatômica declarada resolvida.
-129unitários/32arquivos,TypeScript/build e auditor offline aprovados; 32casos únicos de navegador aprovados, capturas inspecionadas. Hash do commit que contém este documento e status do novo preview devem ser confirmados no relatório final, sem autorreferência ou merge/force.

## 21/10/2026 — cortes físicos das quatro vias e revisão venosa

Base f62c3673dc3f0e010fba08157797e0a83c4a56e3/VercelSUCCESS reconfirmada; continuation/passage-geometry criada do remoto. Inspetor8contextos/26elos/31superfícies, plano3D e evidência física exportável; quatro separações demonstradas sem pontes. Texto dirigido de três capítulos venosos recuperado com URL/método/hash e conjuntos por lado na UI.20ausências/373lacunas/Galeno/seteIDs mantidos; nenhuma identidade aprovada.136unitários/34arquivos, TypeScript/build, auditor direcionado aprovados; 36casos únicos de navegador aprovados; capturas pertinentes inspecionadas. Publicação em fechamento. Hash/árvore/status do commit que contém este documento devem ser confirmados no relatório final, sem merge/force.

## 21/10/2026 — bordas V2, origem vascular e termos venosos

Base cc947c3e181816be6d91169ac0fcf616fe89dad5/VercelSUCCESS reconfirmada; continuation/skull-landmarks criada do remoto. Quatro bordas reais com contenção do perfil V2 nos cortes, fonte/triângulo/baricêntricas/hash, campo e ponto3D/exportação. Seis vasos iguais à fonte, quatro rótulos ósseos skipped, ramo esfenoidal ilustrativo; sete termos venosos explicitados sem substituições.142unitários/36arquivos e TypeScript/build aprovados; 40casos únicos de navegador aprovados, capturas pertinentes inspecionadas; publicação em fechamento.20/373/Galeno/seteIDs e frentes preservados, nenhuma identidade ou túnel anatômico certificado. Confirmar hash/árvore/status do commit que contém este documento no relatório final, sem merge/force.
