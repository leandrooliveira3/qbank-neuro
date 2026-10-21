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
