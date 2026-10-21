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
