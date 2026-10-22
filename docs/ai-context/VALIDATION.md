# Validação e limites da evidência

## Aplicativo — lote de 21/10/2026

Código publicado: `025ef13cca20886cfe8bdc17b83a1957d152ace1`, árvore `d2bbcfccbccbf267571b130a109bbfb483571925`. A árvore do commit local anterior `5a7171d` foi conferida igual à remota, apesar de metadados de commit diferentes.

| Verificação executada | Resultado |
|---|---|
| `npm run lint` (TypeScript) | Aprovado |
| `npm run test:neuro3d` | 117 testes, 26 arquivos, aprovados |
| `npm run build` | Aprovado; aviso de chunks >500 kB |
| Playwright em build de produção, desktop/Pixel 7 | 34 casos em execução conjunta + 2 Doppler; 36 casos únicos aprovados |
| Capturas locais Paciente 3D e Doppler | Inspecionadas, Chrome/SwiftShader |
| Status Vercel via GitHub para commit publicado | SUCCESS, deployment concluído; não é teste de navegador remoto |

Evidência detalhada e falhas iniciais corrigidas em [relatório original](../neuro3d-continuation-validation.md). Não somar repetições como novos casos. A contagem de 110 anunciada no chat interrompido não correspondeu ao lote publicado.

## Reprodução de testes relevantes

Na raiz do repositório: `npm run lint`, `npm run test:neuro3d`, `npm run build`. Para navegador iniciar preview local, definir `ATLAS_BASE_URL` com sua URL e, se necessário, `ATLAS_CHROMIUM_PATH` com Chrome instalado; executar `npx playwright test --workers=1 --timeout=90000`. `playwright.config.ts` define desktop e Pixel 7 e usa SwiftShader. Não declarar execução integral de todos os arquivos somente por esse comando estar documentado: o resultado acima corresponde aos arquivos selecionados no lote original.

Arquivos de navegador relevantes: atlas, anastomoses, educational-vessels, families, simulation, acquisition, patient, video-workflow e tcd em `tests/neuro3d/` (conferir nomes reais antes de executar seleções). DICOM de teste sintético inclui obliquidade, bits assinados e multiframe X-Ray 3D.

## Checkpoint documental atual

Escopo: AGENTS, nove documentos ai-context, atualização dos pontos de entrada antigos. Verificação executada: dez documentos presentes e não vazios, três links relativos válidos, dez fontes identificadas, doze itens obrigatórios em NEXT_SESSION, prioridades reconciliadas e `git diff --check` aprovado. Diff somente documental; árvore local/remota deve ser conferida ao publicar. Nenhuma alteração de lógica neste checkpoint; os testes do aplicativo acima pertencem ao lote de código anterior.

## Científico e anatômico

Não houve validação clínica, aferição anatômica global, reconstrução de projeções XA brutas, execução de IA dos sete repositórios, teste com DICOM 3DRA real de fabricante ou recomendação terapêutica. Isosuperfície por intensidade pode conter osso/ruído e perder ramos finos. Doppler é analítico sintético; índices do exemplo ideal não são diagnóstico. VMTK preparado não significa morfometria executada. Licença de artigo não substitui a licença dos dados.

Pendências de Galeno–seio reto, ramos, sete identidades e inventários permanecem abertas. Código, testes de interface e build não resolvem essas identidades. Análise REA foi estática e não recuperou corpos IL2CPP dos métodos Ankyras.

## Lote de comparador independente — 21/10/2026

- `npm run lint`: aprovado no código final.
- `npm run test:neuro3d`: **120 testes/27 arquivos aprovados**. Inclui verificação dos três assets completos, hashes, decoder, índices/finitude/bounds e reconciliação do inventário.
- `npm run build`: aprovado; aviso de chunks >500 kB permanece. Comparador carregado sob demanda; dependências Python não integram produção.
- Playwright em build de produção, desktop/Pixel 7: execução inicial de `comparison.spec.ts vascular-review.spec.ts study-families.spec.ts` → **10 aprovados**. Execução final de `comparison.spec.ts patient.spec.ts tcd.spec.ts video-workflow.spec.ts` → **12 aprovados**. Quatro casos de comparador se repetem (com teste de corrupção/troca de limiar ampliado); total **18 casos únicos**, não 22.
- Capturas AP, lateral/oblíqua e layout móvel inspecionadas; nova faixa distingue referências derivadas de imagem da geometria esquemática. Câmera/pose, exportação e estados de erro recuperáveis conferidos.
- BRAVE ZIP MD5/tamanho e máscara SHA conferidos. VENAT completo corresponde ao SHA auditado. Derivação conservou contagem de componentes: 434, 223 e 120 nas três superfícies. Primeira tentativa de simplificação global perdeu componentes e foi descartada; arquivos finais usam simplificação por componente. Sem certificação de topologia/calibre.
- Inventário recalculado pelo script versionado, usando módulos reais e hash do binário de projeção. Relatório com 312 identidades/grupos, sete entradas não conciliadas e 49 amostras do eixo Galeno. Não é distância contínua entre superfícies ou medida clínica.
- Revisão React: carregamento sob demanda, geometria memorizada e descartada, fetch cancelável por geração, sem resultado obsoleto, erro recuperável, controles rotulados, registro explícito e sem transmissão de exame do paciente.

Este resultado é funcional/local em Chrome/SwiftShader; não comprova alinhamento entre fontes, identificação dos ramos, reconstrução XA, validação anatômica ou clínica. Publicação/árvore remota devem ser conferidas ao fechar; status do deployment não equivale a teste de navegador remoto.

## Lote seccional — 21/10/2026

Nesta etapa: TypeScript/build e 122 unitários/28 arquivos aprovados; três testes Python de interior/aresta/vértice/degeneração aprovados. Verificador offline comparou todos os 5.357.072 valores dos 42 planos com os NIfTI: igualdade exata float32 e affine. Execução ampla de navegador: 22 casos únicos desktop/Pixel 7 (sections, comparison, study-families, vascular-review, patient, tcd, video-workflow). Repetição final de quatro casos seccionais verifica conservação ao fechar painel, não somar como novos. Capturas inspecionadas; sem homologação clínica/anatômica. Geometria completa verificada pelos hashes GLB e contagens/accessors/ausência de pai na primitiva do seio reto. Permanece aviso de chunks >500 kB. Vercel: 403 ao time mesmo com plugin adicionado; GitHub sem sucesso da base; CLI indisponível.

## Lote de linhagem e vínculo físico — resultado atual

TypeScript e build aprovados no código final; 124 unitários/29 arquivos. Audit_sinus_lineage.py executado contra arquivos do commit Anatria fixo: primitiva/transformações exatamente iguais. Novos testes: affine refletida/anisotrópica com resultado calculado independentemente e integridade da primitiva do seio reto.

Playwright em produção: linked-reference+sections+comparison =12 aprovados; linked-reference+vascular-review+patient+tcd+video-workflow =14 aprovados. Quatro linked-reference repetidos, portanto **22 casos únicos** desktop/Pixel7. Segunda execução verifica linkedVisible exportado; clique real na esfera retorna ao corte, RAS preservado. Capturas VENAT desktop/BRAVE móvel inspecionadas. Aviso chunks>500kB permanece; nenhuma validação clínica/anatômica.

Correção da pendência anterior: screenshot do usuário confirma Ready/Preview de 81f6799, branch correspondente, evidência e hash persistidos. Não se declarou navegador remoto ou consulta Vercel bem-sucedida. 403 não nega deploy. Novo checkpoint não herda esse status.

## Prioridade nova — 3D-2D-GS-CA para geometria

Usuário indicou explicitamente os onze ZIPs 3D-2D-GS-CA como referência geométrica preferencial. **Próximo lote geométrico deve começar por essa fonte**, antes de ampliar navegação BRAVE/VENAT; CTA é complementar. Auditoria offline dos10casos/20vistas e60coleções MGP concluída, hashes/CRC/bytes/finitude e projeção algébrica conferidos; três testes Python próprios aprovados. Não executou Matlab/MEX/MGP ou importação na UI. Volumes MHD/RAW e detector RAD/RAW estão em Sv/Sw mm, não DICOMLPS/RAS implícito. Report ../neuro3d-geometry-dataset-review.md; resultados ../neuro3d-gs-ca-geometry-audit.json.

Página BY-NC-ND e guia exige acordo/restringe distribuição; acordo existente não estabelecido. Dados/calibrações/pontos/código de fornecedor permanecem locais, sem redistribuição; preservar essa condição. Próxima etapa: leitor/visor local, VOI/ROI e contrato voxel→mm→detector verificável, sem sobrepor atlas ou reivindicar registro validado. Database_info.xls/ROIs e convenções visuais ainda precisam de verificação. CTA foi reconferido e3cortes reais foram rejeitados pelo leitor por JPEGsemperdas; série184 excede32milhões de voxels. Ver os dois novos relatórios CTA; não declarar integração.

## Lote Neuroangio — validação técnica própria

TypeScript/build e129unitários/32arquivos aprovados. Auditoria offline592vasos (239importados ativos/353reconstruídos),12SHA,3552raycasts CPU em isolamento semfalha;353comparações de eixos aos pais (205importados/148reconstruídos). Não contar raycasts como testes de navegador ou homologação anatômica.28faces degeneradas nas retinais originais,14porlado; sem reparo arbitrário. Achados e limites por vaso em ../neuro3d-atlas-self-audit.json.

Testes novos: hierarquia de transformações original→mundo, revelação sem mutar entradas, lacunas sem substituição, elos/lado/C2C4/variantes dos forames e ramos individuais da meníngea média. Primeiro teste de reconciliação detectou manifesto antigo; regenerado. Primeiro navegador detectou botão de recuperação sem pointer-events; corrigido. Teste de nome traduzido foi alterado para ID estável, sem mudar identidade/modelo. Validação final deste lote:129 testes unitários em32arquivos, TypeScript e build aprovados;32 casos únicos de navegador aprovados em desktop/Pixel7. A rodada ampla passou30/32; os dois testes de forames passaram após correção do seletor de teste para ID estável e rebuild. Não somar a repetição como novos casos. Capturas de seio reto3D, seio reto2D original, PICA original e contexto foraminal foram inspecionadas visualmente; capturas privadas em ../artifacts/neuroangio-final-captures. Auditor offline integral regenerado no código final. Reavaliação React: efeitos canceláveis, respostas obsoletas descartadas, recursos/decoder liberados, controles rotulados e seleção baseada em IDs. Aviso de chunks>500kB permanece. Estas verificações funcionais não provam continuidade anatômica ou registro clínico.

Não houve comprovação anatômica de todos os ramos, trajetos completos, patência, coordenadas individuais dos forames, registro de datasets ou seleção clínica de técnica/dispositivo. Capturas do livro são privadas. Chunk>500kB permanece.

## Lote de vias físicas — base f62c367

136unitários/34arquivos, TypeScript e build aprovados. Auditor direcionado executado:8contextos/26elos/31superfícies,3GLBSHA e31hashes canônicos,24conjuntos de cortes centrais.592vasos não reaudidatos. Casos analíticos independentes: plano triangular, tangência/coplanaridade, distância/baricêntricas, plano3D em coordenadas de corte. Integridade dos dados versionados e separações positivas verificadas.

Fluxo local a verificar: Forames→GLB estático/SHA→Draco/hierarquia→SHA do derivado→worker→SVG/mesmo plano3D→download. Sem API/DB/credencial nova. 36 casos únicos de navegador aprovados, em10arquivos/desktop e Pixel7. As quatro vias foram abertas nos dois lados, com hashes de31superfícies, cortes nos3eixos, plano3D, exportação e recuperação de corrupção. Também passaram angiografia original, anastomoses, famílias, vínculosBRAVE/VENAT, Paciente3D, Doppler e roteiroMentice. Capturas de redondo/vidiana desktop, oval/meningolacrimal mobile e plano3D desktop/mobile inspecionadas visualmente. Sem teste remoto de navegador. Revisão React concluída: carregamento agrupado/paralelo, lazy, worker cancelável por sequência, cleanup, IDs exatos, controles rotulados e exportação bloqueada em erro. Apenas GLBs estáticos, sem API/credencial nova. Primeira verificação desktop comprovou8contextos/hash/exportação; o outro caso falhou apenas por procurar atributo data-isolated inexistente e foi corrigido para observar data-illustrative-visible real. Captura inicial do contêiner recortado pelo scroll foi substituída por captura do SVG ampliado. Não somar reexecuções como novos casos. Sem validação clínica/anatômica por esses testes; chunks>500kB permanecem.

## Lote de testemunhos ósseos — base cc947c3

142unitários/36arquivos,TypeScript/build aprovados; auditorias dirigidas executadas: quatro bordas V2 em duas secções por lado, perfis estritamente contidos, resíduos ponto→triângulo zero nos dados auditados; seis primitivas/TRS iguais à fonte e quatro rótulos de forames skipped. Analíticos: componentes abertos/ramificados, auto-interseção, limite, não coplanaridade, arestas cruzando região côncava apesar de vértices interiores. Primeiro teste falhou apenas por ordenação lexicográfica numérica; corrigido no teste.

40 casos únicos de navegador aprovados em11arquivos, desktop e Pixel7: rodada ampla38mais dois casos novos de reconciliação/exportação venosa. Repetições dirigidas não somadas. A versão final dos testes ósseos também confere o alvo da câmera no ponto de origem. Capturas nativas das bordas V2 e plano/ponto3D desktop/mobile inspecionadas; em primeira inspeção o ponto era pequeno na visão geral, e o foco da câmera foi ajustado sem mover anatomia. Não houve teste remoto de navegador. Revisão React: hashes e IDs exatos, lazy, worker/abort/cleanup, plano compartilhado sem escala dupla, foco explícito da câmera e controles rotulados mantidos. Nenhuma malha vascular/óssea ou dado de paciente alterado. Fluxo: fonte/hashes→perfil original→seleção de borda/foco do campo→plano e ponto3D→exportação com flags de não homologação. Regressão inclui vias/angiografia/contexto/anastomoses, BRAVE/VENAT, Paciente3D, Doppler e Mentice. Capturas finais devem ser inspecionadas. Não somar repetições como casos novos. Sem prova clínica ou certificação de forame por esses testes; chunks>500kB permanecem.


## Lote de hierarquia/continuidade — base7b08047

146testes unitários em37arquivos aprovados; sete testes dirigidos de hierarquia/testemunhos reexecutados após acrescentar verificações da raiz e da nomenclatura. TypeScript e build aprovados. Fixtures: caixa com costuras, casca oca com orientação interna oposta nos3pares de eixos, ordem de segmentos invertida, face com orientação inconsistente, winding interno/externo e ausência de mutação das superfícies. Dados:42secçõesV2,18secções motoras, hashes e flags de não homologação; contador146não soma reexecuções.

Auditores efetivamente executados: tools/neuro3d/audit_contour_continuity.ts (Draco/hash/hierarquia original, topologia por índices e cópia de costuras, faces nulas, incidência, contornos, ângulo sólido diagnóstico, compartilha triângulos em níveis adjacentes) e audit_venous_nomenclature.py (blob fixo e7192rótulos ingleses). Sem refazer592vasos ou dados anteriores. Git diff confirma inalterados public/, reconstruções, quatro testemunhosV2 e auditoria de vias anterior.

42casos únicos de navegador local aprovados em12arquivos, desktop/Pixel7:40regressões aprovadas na rodada ampla e2casos novos aprovados após corrigir o retorno de aba no próprio teste. Não somar repetições como casos novos. Fluxo novo: Forames→21níveisV2→corte/offset→mesmo plano3D→download do relatório; oval→limites da raiz original→seleção exata de origem. Testes anteriores preservam hashes, erro/retry, angiografia original, anastomoses, vínculosBRAVE/VENAT, Paciente3D, Doppler e Mentice. Primeiro teste novo encontrou navegação esperada para Anatomia ao selecionar raiz; foi corrigido para conferir ID selecionado e retornar a Forames antes de mudar lado, sem alterar produto. Capturas desktop/mobileZ28/31,6 e contexto motor bilateral inspecionadas visualmente; plano3D teve offset e seleção original conferidos automaticamente. Sem teste remoto ou validação clínica. Aviso de chunks>500kB permanece.

Revisão React: relatório adicional dentro do inspetor lazy, conferência de hashes contra manifesto, controles rotulados, sem nova chamadaAPI/credencial; fluxo trabalhador/abort/cleanup e plano3D existentes mantidos. IDs terminológicos nunca entram na seleção geométrica.


## Lote de bordas/quadros oblíquos — base97d2a94

149unitários/38arquivos aprovados. Fixtures verificam costuras exatas sem mutação, face removida e sua linhagem, ida/volta de coordenadas oblíquas, coincidência do plano3D nos3eixos da base e rejeição de normalnula. Relatório dirigido verifica32arestas/2grupos16não nomeados e limite31,42→31,44mm. TypeScript/build aprovados; aviso de chunks>500kB permanece.

24casos únicos de navegador aprovados inicialmente em7arquivos, desktop/Pixel7: novo fluxo de bordas/quadros/exportação, quatrotestemunhos e vias anteriores, seleção/angiografia original, pacienteDICOM, Doppler e roteirovídeos. Inspeção das capturas detectou enquadramento amplo da câmera e SVGoblíquo exagerado na ampliação; ajustados apenas câmera/campo de inspeção e dimensão doSVG, sem alterar geometria. Reexecução final de10casos diretamente afetados (skull-boundary,skull-evidence,passage-geometry) aprovada; total permanece24casos únicos. Capturas finais dos cortes ampliados e bordas3D desktop/mobile inspecionadas visualmente; teste novo confere foco da câmera na origem física do plano. Não somar repetições ao total24.

Fluxo: relatório de malhas originais/hashes→seleção de grupo/arestas ou baseoblíqua→mesmo plano e foco no3D→exportação comfaces/aliases/base/limites. NenhumAPI/DB/credencial novo; relatório somente no inspetor lazy, incompatibilidade de manifesto bloqueia controles. Renderer overlay não participa do raycast e não move fonte. Recursos descartados ao desmontar; quadros por eixo antigos preservados.

Auditores novos executados: audit_skull_boundaries.ts e audit_sphenoid_lineage.py. Comparação de payload/ancestralidade do esfenoide é dirigida, sem rodar o main do seio reto ou a auditoria592. Matéria antiga e dados restritos preservados. Sem aprovação clínica/anatômica por esses testes e sem navegador remoto.


## 22/10/2026 — Geometria3D–2D/GS-CA local

153unitários/39arquivos aprovados; quatro novos testes de leitor/projeção/corte reexecutados após reforçar invariância afim não ortogonal e contrato matricial. TypeScript/build aprovados (chunks>500kB histórico).24casos únicos de navegador em7arquivos, desktop/Pixel7:4GS-CA,4PacienteDICOM,4BRAVE/VENAT,6Neuroangio,2Doppler,2vídeos e2bordas. Reexecuções dirigidas dos4casosGS-CA após texto do referencial/atribuição, coordenadasdocanvas descontandobordas e exportação column-major aprovadas; não somar ao total24. Sem novo teste remoto.

Caso real1, fora do contador de fixtures: UI512×512×391/4projeções/2alvosSv iniciais porvista/3eixos. Cinco hashesRAW conferidos contra a auditoria anterior;0erros de página/0requisiçõesnãoGET. Inspecionadas capturasAP/LATDSA/MAX e corteZ, com cruzes sobre regiões opacificadas nos exemplos; sem quantificação mTRE/mRPD, validação universal de convençãopixel ou precisão de registro. Mais1caso real não equivale a reaudar10casos. Somente agregado publicado; imagens, alvos e calibraçõesprivados não entram norepo.

Fluxo novo: seleção local→validação de contrato/tamanho/memória→worker/Int16/hash→RGBAcorte/umFloat32detector→alvofracionário→Sv/Sw→projeção→raio intersectado nocorteinteiro→exportação comflagsfalse. VOI/ROIzero/inclusivos e janela; erro/reimportação; remoção/trocaaba e descarteworker; ausência dePOST verificadas. Fixtures numéricas testam magnificação, inversa completa, afimnãoortogonal, áreas fora do campo/RAW incompatível/duplicação, fontesparalelas e trêsorientações x-fastest semflip.

Revisão React: nova aba lazy e processamento emworker; arraysgrandes não chegam aReact; carregamento de um detector porvez; buffersRGBA transferidos; workerterminado emclear/unmount; identidade+sequência+chave impedem framesobsoletos e exportaçãoenquanto recalcula. Controles rotulados e limitesexplícitos; cena3D protegida porboundary; semAPI/DB/dependência nova. Não executados MGP/Matlab/MEX/REA/Ankyras ou reconstruçãoa partir deprojeções. Não reauditados592vasos, bordas ou42cortes.


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
