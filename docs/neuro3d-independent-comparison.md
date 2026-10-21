# Comparador independente e reconciliação — 21/10/2026

Base remota conferida: `ad5515dc53067689d5bdf54e514b0caa0d6a572e`, branch `feature/neuro3d-atlas`, PR nº 2 rascunho. A branch local deste lote é `continuation/vascular-comparator`. Nenhuma malha do atlas foi deslocada, renomeada, unida ou substituída.

## Entrega funcional

A aba **Referências vasculares** carrega sob demanda três superfícies derivadas de volumes reais públicos. BRAVE-NET e VENAT têm visores independentes, rotação, zoom, vistas iniciais AP/lateral esquerda/oblíqua, restauração de enquadramento e proveniência. VENAT permite alternar limiares 0,10/0,20. Checksum do arquivo e da geometria comprimida é conferido antes de mostrar a superfície; uma troca de limiar descarta a imagem anterior imediatamente. Falha de integridade impede mostrar ou registrar a superfície e permite repetir o carregamento.

O registro de vistas começa vazio, exige ação explícita e conserva câmera, alvo, zoom, preset, fonte, affine e hashes na exportação JSON. Não representa revisão especializada ou aprovação anatômica. As vistas são renderização de superfície, não DSA, MIP, cortes de intensidade ou reconstrução de projeções XA. Não há sincronização de câmera, sobreposição ou registro com o atlas/entre as fontes. As escalas visuais são independentes; coordenadas físicas permanecem em mm.

## Fontes efetivamente executadas e derivação

| Derivado | Fonte / licença | Triângulos antes → depois | Componentes antes → depois |
|---|---|---:|---:|
| BRAVE-NET 0,5 | Máscara manual binária de `pat_1`, DOI 10.5281/zenodo.3968844, MIT no registro | 209.460 → 45.218 | 434 → 434 |
| VENAT 0,10 | Mapa médio de fração de volume parcial, MNI152, CC BY 4.0 na auditoria anterior | 852.818 → 44.906 | 223 → 223 |
| VENAT 0,20 | Mesmo volume, outro limiar de fração média | 346.844 → 44.924 | 120 → 120 |

BRAVE: ZIP 1.097.082 bytes, MD5 publicado `fdd563d92d0848d991b217289147cbfa` verificado; SHA-256 `b857d129527da9163b2716dd32f5ec73a7b3482174e9149653b274845225aa32`. O ZIP contém vinte máscaras; somente `GroundTruth/pat_1/001_Vessel-Manual-Gold-int.nii.gz` foi derivada para o visor. SHA dessa máscara: `662b162e982eaf51bc9e68e62b181ebc9c16b7e8675ae2caea38650616a7e86d`. Não foi executada inferência BRAVE-NET, treinado modelo ou incorporada imagem de intensidade MRA.

VENAT: download recuperado pelo endereço oficial `https://ndownloader.figshare.com/files/13267316`, 77.294.676 bytes. SHA-256 `af222f62aa94a1bfd873e2822fce0daf472ed632f2c9957b45ad26069be86c35`, idêntico à auditoria anterior. A tentativa pela API sofreu falha TLS e outra rota retornou arquivo vazio; o construtor recusou esse arquivo por hash incompatível. O arquivo completo posterior passou. Não se desativou verificação TLS. A licença foi preservada do registro anteriormente auditado, sem alegar uma nova leitura bem-sucedida da API.

`build_comparison_reference.py` verifica fontes, unidades mm, affine declarado, finitude, volume 3D e faixa [0,1]; BRAVE deve ser binário. Marching cubes em resolução completa → affine NIfTI RAS/mm → simplificação quadrática independente por componente, com preservação de bordas. Não há poda manual de componentes, smoothing ou atribuição de nomes. A primeira experiência de simplificação global perdeu componentes e foi descartada; os arquivos finais preservam todos os componentes detectados. Isso não garante preservação topológica, de ramos finos ou calibre. O visor não serve para medir dimensões clínicas nas superfícies simplificadas.

Affines, bounds, hashes, qform/sform, versões e contagens: `features/neuro3d/comparison/manifest.json`. Créditos/licenças/modificações: `public/neuro3d/comparison/NOTICE.md`. Arquivos públicos são derivados geométricos; NIfTI originais e ambiente Python ficam fora do repositório. A matriz aplicada por nibabel foi conservada; não se reutilizou a matriz física VTK da inspeção anterior, pois os leitores apresentam convenções distintas de eixos/origem. O novo relatório é específico destes derivados.

## Inventário reconciliado no código atual

`reconcile_vascular_inventory.ts` usa os mesmos módulos da aplicação, sem busca por nomes semelhantes. Resultado completo: `neuro3d-inventory-reconciliation.json`.

- 1.114 estruturas importadas nos manifestos; 1.112 ativas (duas faríngeas ascendentes contestadas preservadas em quarentena); 353 reconstruções.
- Malhas vasculares de origem: 178 arteriais e 63 venosas. Zero aprovações anatômicas.
- Matriz: 312 identidades/grupos, sendo 228 arteriais e 84 venosos. São 443 IDs arteriais esperados e 149 venosos; 267 arteriais e 86 venosos sem malha importada ativa.
- 301 IDs são as ilustrações adicionais; 157 identidades/grupos têm apenas essas ilustrações. “Zero IDs sem qualquer representação” não significa completude: 353 IDs continuam sem referência importada e grupos não enumeram cada ramo.
- Diagrama: 43 entradas importadas, 45 reconstruídas, 47 parciais e sete sem identidade conciliada. Não somar entradas do diagrama às identidades/grupos como se fossem vasos adicionais.

## Galeno–seio reto e ramos

Galeno é desenhado por controles arbitrados; o seio reto é superfície importada com rótulo não homologado. O relatório conserva todos os 49 pontos amostrados do eixo ilustrativo e suas distâncias aos vértices da geometria **simplificada para projeção** do seio reto, cujo checksum é verificado. Distância do primeiro ponto: aproximadamente 2,854 cm; do último: 2,191 cm. O último ponto está a 0,184 cm da caixa delimitadora da fonte. Esses números medem objetos diferentes: uma caixa não representa a superfície, eixo não é parede/lúmen e distância a vértices não é distância contínua entre triângulos.

Nenhum dos números certifica a identidade dos objetos, define uma medida clínica ou autoriza uma ponte. A discordância continua aberta; notas aparecem tanto na matriz integral quanto na lista venosa/estrutura selecionada. `parentId` e destinos de drenagem permanecem relações nominais de estudo, sem homologação de óstio ou patência.

A legenda atual Neuroangio foi reaberta: mantém duplicação/discordância de 105/107; não fornece identificação textual explícita de 4, 26b, 70a, 74a, 114a e 115a. Os quatro diagramas haviam sido inspecionados na revisão anterior; não se afirma uma nova inspeção integral de todas as figuras neste lote. As sete entradas permanecem como conflito/rótulo de figura, sem inventar equivalência. Nove fragmentos da maxilar por lado e a cobertura limitada da MMA continuam sem nomes atribuídos automaticamente. A auditoria local anterior dos candidatos `?x.l`/`?x.r` permanece preservada no checkout original.

Fonte primária: https://neuroangio.org/anatomy-and-variants/diagrams-and-drawings/ ; registros independentes: https://zenodo.org/records/3968844 e https://figshare.com/articles/dataset/VENAT_Probability_map_nii_gz/7205960.

## Reprodução

Com os NIfTI originais verificados em pasta separada: `python tools/neuro3d/build_comparison_reference.py --input-dir <pasta>`. Ambiente registrado no manifesto: nibabel 5.4.2, numpy 2.5.4, scikit-image 0.26.0, fast-simplification 0.2.0; SciPy é dependência de inspeção de componentes.

Inventário: `node node_modules/esbuild/bin/esbuild tools/neuro3d/reconcile_vascular_inventory.ts --bundle --platform=node --format=esm --outfile=<temporário.mjs>`, depois executar esse arquivo com a raiz do repo como diretório atual. Relatório determinístico, sem data dinâmica. Conferir hash do binário de projeção antes das medidas.

Próximo lote: inspeção seccional dos volumes originais e marcos de referência para avaliar identidade/relações; manter referenciais separados. Para Galeno–seio reto, revisar a malha original completa e seus marcos osteoencefálicos antes de qualquer ajuste. Preservar todas as frentes de paciente, Doppler e procedimentos conforme ROADMAP.

## Verificação desta etapa

TypeScript, 120 testes unitários em 27 arquivos e build aprovados. No navegador, 18 casos únicos em desktop/Pixel 7: duas execuções de 10 e 12 casos, com quatro casos do comparador repetidos. Incluem integridade, troca de limiar, recusa de corrupção sem superfície antiga, repetição de carregamento, exportação/câmera, achados vasculares, famílias e regressão de paciente/Doppler/roteiros Mentice. Capturas AP, lateral/oblíqua e móvel inspecionadas. Permanece aviso de chunks >500 kB. Validação local/funcional, sem homologação anatômica ou clínica.
