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


## 21/10/2026 — hierarquia, continuidade amostrada e limite motor

Base7b080470f0ca286700774110062a4d4d2a846a97, árvore5d81326afff7b6b6d289822f47506e1ee484fdce; remoto conferido, branchlocal continuation/contour-continuity. Fonte fixa e referenciais preservados. Ver ../neuro3d-contour-continuity-review.md e features/neuro3d/contour-continuity-evidence.json.

42novas secções V2:18/21contidas porlado, hierarquia pai/filho e orientação original oposta;17transições com triângulos ósseos compartilhados. Últimos3níveis não demonstram contenção. Esfenoide tem162bordas poríndices após excluir4faces degeneradas;32bordas permanecem na cópia diagnóstica de costuras, deslocamento0. Não certifica sólido/vazio/túnel/forame ou continuidade entre amostras. Raízes motoras482vértices/960faces porlado, segmentos curtos separados do esfenoide por≥12,143mm nominais segundo caixas; não são V3 sensitivo nem curso completo do oval.

Sete termos venosos confrontados com7192rótulos ingleses TA2 da fonte fixa (blob71bef934c23d207550ad1f318ec6edd8551cdba4): seis sem correspondência exata, braquial lexical rejeitado por território; grupo pontino genérico não individualiza canal transverso. IDs terminológicos não viram malhas. Zero novas geometrias/identidades aprovadas.20ausências/373lacunas, Galeno, sete rótulos e componentes ICAvidiana/meningo-lacrimal permanecem. Todas as frentesGS-CA/VOI/Paciente3D/Doppler/Mentice/VascularTwin/REA/Ankyras preservadas; dados restritos não redistribuídos.

PróximoP0: localizar32bordas abertas remanescentes e investigar transiçãoZ31,4→31,6 com contexto nativo/oblíquo e fonte óssea rotulada, sem reparar ou estender anatomia por inferência. Consultas bibliográficas não equivalem a ferramentas executadas. O commit que contém esta etapa identifica o novo checkpoint; confirmar hash/árvore/status remoto no fechamento.

Validação final desta etapa:146unitários/37arquivos,42casos únicos de navegador/12arquivos,TypeScript/build aprovados. Capturas desktop/mobile inspecionadas, origem/offset3D/exportação conferidos. Publicação será confirmada por hash/árvore/status exatos no fechamento e comprovante local. Sem validação clínica ou promoção de nomes anatômicos.


## 21/10/2026 — bordas localizadas e cortes oblíquos no atlas

Base97d2a9413bfdba1654d70fedcb02a10d84989580, continuation/skull-boundaries. Entrega e limites em ../neuro3d-skull-boundary-review.md; dados em features/neuro3d/skull-boundary-evidence.json e sphenoid-lineage-evidence.json.32arestas em2grupos16, origem/análise/exportação e sobreposição3D;4cortes oblíquos coincidentes; refinamento31,42→31,44mm. Esfenoide payload/ancestralidade iguais à fonte; defeitos não introduzidos pelo recorte. Não certifica forames/túneis; nenhuma geometria reparada ou vaso criado.

P0seguinte: voltar à completude vascular e fluxos de estudo, buscar fonte individual utilizável para20ausências venosas,373referências e7termos. Não repetir bordas/cortes/auditoria592sem nova evidência. Cadência pedida pelo usuário: lotes integrados e documentação concisa, sem uma etapa por microachado. Galeno/seteIDs/componentes e todas as frentes preservados. Hash do novo checkpoint será confirmado ao publicar, sem merge/force.

Validação final:149unitários/38arquivos;24casos únicos de navegador/7arquivos aprovados, com10reexecuções dirigidas após ajustesvisuais. TypeScript/build e auditores dirigidos aprovados; capturas finais inspecionadas. Sem navegador remoto ou homologação anatômica.


## 22/10/2026 — visor GS-CA local e vínculo físico entregue

Basef7a04e68f67b8e25f2155acadd554360ba2ec80e; continuation/gs-ca-workspace. AbaGeometria3D–2D comMHD/RAWsigned16, RAD/RAWfloat32, cortes3eixos/janelas, VOI/ROImanuais, alvosSvfracionários, projeçãoSw→detector e cliqueinverso nocorte, cena3Dcaixa/raio eexportação local. Sem envio/registro noatlas/segmentaçãoclínica. Leia ../neuro3d-gs-ca-viewer.md e agregado devalidação.

153unitários/39arquivos,24casos únicos denavegador/7arquivos,TypeScript/build aprovados; ensaioUIrealcaso1:4projeções×2alvos/3eixos,5hashesRAW iguais à auditoriaanterior,0erros/0nãoGET. Capturas privadas. Precisãoderegistro permanecefalse; não refeitos10casos/592vasos/bordas. TopBrainapenasconsultado, rótulospublicados não individualizam20ausências ou7termos; nenhumdownload/execução/importação.20/373/Galeno/seteIDs/componentes e demaisfrentes mantidos.

PróximoP0: geometria local útil para estudo vascular (VOI/ROI com metadados verificados, isosuperfície/segmentaçãoemSw ou conferência quantitativa de alvos observados). ZIP/XLS automáticos pendentes; não repetir auditoriasprontas. Checkpoint será confirmado porhash/árvore/deployment exatos, sem merge/force.


## 22/10/2026 — prévia vascular GS-CA e recortes locais

Base `629199a63487e794be742fd7cf940b9f13cb5fde`; branch local `continuation/gs-ca-surface-metadata`, destino `feature/neuro3d-atlas`, sem merge/force. O commit que contém este registro identifica o novo checkpoint; hash remoto/status exatos ficam no comprovante privado da publicação.

Entregues: reimportação JSON da própria revisão com VOI/ROI zero-based inclusivos, prévia antes de aplicar, hashes/cabeçalhos vinculados ao caso; isosuperfície Marching Cubes no worker, Sw nativo, resolução/limiar/memória explícitos, extremidades amostradas, sem tampas de recorte, limite 150 mil triângulos rejeitando malha parcial. Interseções da mesma malha nos cortes X/Y/Z e enquadramento 3D da VOI. Alteração de VOI/limiar/resolução invalida a prévia; alvos fracionários preservados. Exporta parâmetros e proveniência, sem publicar malhas/dados restritos.

156 testes unitários/40 arquivos, 16 casos de navegador/3 arquivos (desktop+Pixel7), TypeScript/build aprovados. Caso real1: três superfícies, recortes reimportados, três eixos, alvo fracionário/hash do volume preservados, zero erros/nãoGET; imagens e calibrações privadas. Aviso histórico de chunks >500kB permanece. Não é validação clínica, mTRE/mRPD ou completude vascular. Ver `../neuro3d-gs-ca-study.md` e agregado de validação.

Importação é do formato próprio explicitamente rotulado; não há conversão automática comprovada de `database_info.xls` ou ZIP. Não inventar equivalência de índices do fornecedor. 20 ausências venosas, 373 lacunas e sete termos não mapeados permanecem; Galeno, sete identidades, ICA-vidiana/meningo-lacrimal e demais frentes preservados. Nenhuma nova geometria anatômica rotulada, ponte, reparo ou registro no atlas. Sem repetição das auditorias prontas e sem execução de código do fornecedor.


## 22/10/2026 — XLS original e componentes GS-CA

Base `cecfb4801ea7244f3bcee6c845d25ea64a233be0`, local `continuation/gs-ca-component-study`, destino feature/neuro3d-atlas sem merge/force. Convenção XLS comprovada no guia seção3.5pp8–9: zero/inclusivo, VOI X/Y/Z e ROI AP/LAT por índices; adapter original com hash da planilha e vínculo dos hashes volume/MHD/RAD, prévia e aplicação. Dez abas comparadas com xlrd independente, sem reaudar volumes. Componentes por aresta exata, seleção/lista/clique3D e contornos; entorno do alvo em passo1 com retorno à VOI anterior. Sem soldagem por tolerância, nomeação ou prova luminal. SheetJS0.20.3 oficial/Apache2.0 fixado, parser sob demanda no worker; formato ES necessário aos workers e revalidado.

159unitários/41arquivos,22casos navegador/4arquivos desktop+Pixel7, TypeScript/build aprovados. Caso real1: XLS/quatroROIs/alvofracionário, superfície3668tri/102componentes, seleção2036tri; entorno12400tri/55componentes em passo1; três cortes/3D e restauração conferidos,0erros/0nãoGET. Dados/recortes/calibrações privados. Ver ../neuro3d-gs-ca-components.md e agregado. ZIP automático/validação anatômica/registro seguem pendentes;20/373/setetermos/Galeno/seteIDs/componentesICAvidiana/meningolacrimal/demaisfrentes mantidos. Nãoexecutado fornecedor, não repetidos592/42/bordas. Commit que contém este arquivo identifica checkpoint; confirmar remoto/status exatos no comprovante privado.


## 22/10/2026 — anotações pessoais e fontes adicionais

Base ea95218c3b420dcc082736c445ebc8ba71e6ce81; local continuation/vascular-review-notes. AnotaçõesGS-CA exportáveis/importáveis, hashes individuais/contexto/malha exata, ponto fracionário/corteinteiro, edição, remoção/desfazer, mesclagem sem sobrescrever conflitos e reabertura dos parâmetros/componentes somente após coincidência geométrica. Sempre hipótese/observação pessoal, flagsanatômica/registrofalse; semDB/envio.163unitários/42arquivos,22casos navegador/4arquivos desktop+Pixel7,TypeScript/build aprovados; caso real1 comJSONidêntico após round-trip ehash/componente/ponto recuperados,0erros/0nãoGET. Capturas privadas.

Lista12fontes do novo anexo avaliada/catalogada emNeuroangio→Revisãovenosa; Jülich/HCPex candidatos de contexto, DSI/brainlife ferramentas nãoexecutadas; Radiopaedia402 eEmbryoCCBYNCND explícitos. Busca dirigida5candidatos não comprovou geometria individual reutilizável:20/373/setetermos inalterados. Galeno/seteIDs/componentesICAvidiana/meningolacrimal/demaisfrentes preservados. Ver ../neuro3d-gs-ca-review-notes.md, ../neuro3d-additional-databases.md e relatório de busca. Não repetidos592/42/bordas/10volumes. ZIPautomático pendente. Checkpoint é identificado pelo commit deste arquivo; remoto/deployment exatos no comprovante privado.
