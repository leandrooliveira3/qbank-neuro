# Revisão integral arterial e venosa — 20/10/2026

## Estado atual

Foram adicionadas **301 estruturas ilustrativas originais**: 215 arteriais e 86 venosas. Elas representam todos os **223 IDs individuais anteriormente ausentes** em 118 identidades/grupos, mais 78 representações para os demais alvos nomeados do diagrama. São 157 modelos de identidade, com lateralidade explícita ou posição mediana. O snapshot anterior está em `educational-coverage-baseline.json`; a prova de cobertura usa os IDs exatos e o sistema vascular.

**Não foram recuperadas 301 malhas de repositórios.** As fontes já indexadas não confirmaram geometrias nomeadas utilizáveis para essas identidades. Os novos trajetos são desenhos originais, com pontos e raios arbitrados para estudo no referencial existente. Identidade e relações usam o inventário e as referências Neuroangio. Não houve triangulação calibrada, segmentação de paciente ou registro osteovascular desses trajetos. Nenhuma anatomia foi homologada.

O atlas tem 1112 estruturas importadas ativas e 353 reconstruções (52 anteriores + 301 novas), totalizando 1465 representações. Os 1114 objetos originais permanecem nos arquivos; duas faríngeas ascendentes contestadas continuam preservadas em auditoria e fora da visualização de referência. A licença, os buffers e as transformações originais não foram modificados.

O painel Vasos reúne 594 registros com proveniência: 241 malhas originais (178 arteriais, 63 venosas) e 353 reconstruções. A matriz de 312 identidades/grupos tem representação para seus IDs, mas **301 IDs existem apenas como novas ilustrações, e 353 não têm malha importada ativa**. Os campos `illustratedIds` e `referenceMissingIds` conservam essa distinção. Contagem nominal não mede cobertura de todos os ramos ou precisão anatômica.

O índice Neuroangio mantém 142 entradas: 43 importadas, 45 reconstruídas, 47 parciais e sete não conciliadas. Zero entradas “sem representação” não equivale a completude anatômica: redes e grupos têm exemplos de trajetos; segmentos oftálmicos 6/7 permanecem agrupados. As sete identidades não conciliadas não receberam geometrias inventadas.

## Acesso e interação

As novas identidades estão em Estruturas, Inventário, Vasos e conjuntos de estudo. Selecionar revela o trajeto sem mover a câmera. Isolar revela seu conjunto, preserva ocultações manuais e esconde contextos não vasculares. Focar é uma ação separada. Os trajetos adicionais ficam desligados inicialmente; habilitá-los mostra o conjunto, com variantes separadas por padrão. Uma variante selecionada individualmente pode ser examinada sem habilitar todas.

As mesmas superfícies fechadas são usadas no atlas 3D, angiografia de superfície 3D e projeção sintética 2D. Artérias e veias conservam camadas e filtros distintos. Opacidade zero e ocultação manual retiram também a capacidade de receber cliques. A nota de ilustração permanece visível ao selecionar um novo trajeto.

**Nenhuma adição amplia o grafo procedural de instrumentos ou a injeção seletiva da estação.** A identidade pai/filho dos desenhos é uma relação de estudo, sem inferência de luz contínua, óstio, direção de fluxo, comunicação patente ou coexistência de variantes. Há exclusão explícita das novas identidades no contraste procedural.

## Catálogo, fontes e reprodução

O [catálogo integral](neuro3d-educational-additions.md) lista as 301 identidades adicionais, famílias e referências. `tools/neuro3d/build_educational_vessels.py` conserva os controles e gera `educational-vascular-paths.json`. O construtor usa curvas Catmull–Rom centrípetas e superfícies por quadros transportados; não faz snapping, união booleana ou preenchimento de intervalos de malhas originais.

Fontes de anatomia/topologia:

- [Neuroangio — diagramas e legenda](https://neuroangio.org/anatomy-and-variants/diagrams-and-drawings/).
- [Meníngea acessória](https://neuroangio.org/anatomy-and-variants/accessory-meningeal-artery/), [pterigovaginal](https://neuroangio.org/anatomy-and-variants/pterygovaginal-artery/), [infraorbitária](https://neuroangio.org/anatomy-and-variants/infraorbital-artery/) e páginas arteriais referidas por identidade no catálogo.
- [Veia cerebral interna](https://neuroangio.org/venous-brain-anatomy/internal-cerebral-vein/), [basal de Rosenthal](https://neuroangio.org/venous-brain-anatomy/basal-vein-of-rosenthal/), [veias da fossa posterior](https://neuroangio.org/venous-brain-anatomy/veins-posterior-fossa/) e [sistema venoso](https://neuroangio.org/venous-brain-anatomy/).

Na revisão anterior, foram consultados Borden (figuras 2.1–2.4, páginas impressas 15–18), Krings (caso 30 e discussão 25–27), além das páginas da faríngea ascendente, lingual, MHT, ILT e coroidea anterior. Os livros e imagens privados não foram redistribuídos. As novas curvas são originais CC BY-SA 4.0; as referências não concedem licença para copiar suas figuras.

O repositório Anatria3D permanece na revisão de origem `6320bd64df8db2fcfed358a27c85d1fcc1c5913c`. A recuperação anterior de 28 nós não indexados continua discriminada em [neuro3d-unindexed-vessels.md](neuro3d-unindexed-vessels.md). O SPL/NAC consultado (`bec24db25aad5f7600e2df3becfb1f883e61ff56`) não confirmou malhas venosas profundas nomeadas para este lote. Não se afirma que todas as versões desses projetos estejam esgotadas.

## Auditoria das fontes e limitações preservadas

A auditoria numérica original continua inalterada: 241 malhas, 701 componentes de vértices, zero índices inválidos e zero posições não finitas; 240 malhas abertas e 95 multicomponentes. Não houve fechamento ou união automática. Nove componentes da maxilar por lado não foram renomeados como ramos por suposição. A MMA original tem extensão aproximada de 2,40 cm; as novas ilustrações durais não validam nem corrigem a superfície original.

A distância mínima entre vértices na junção sigmoide–jugular, cerca de 0,68 cm, e a divergência máxima de limites dos estriados laterais distais, 0,255 cm, continuam sendo achados para conferência, sem preenchimento automático. Ver [revisão da maxilar](neuro3d-maxillary-source-review.md), `neuro3d-vascular-geometry-audit.json` e `neuro3d-diagram-audit.json`.

VENAT, TopBrain, NIH CNS Venography, CTA, Mendeley e DSCA conservam exatamente os estados descritos em [fontes por imagem](neuro3d-dataset-sources.md). Nenhum novo volume ou ativo desses conjuntos foi importado neste lote. O mapa médio VENAT não foi convertido em veias individualmente nomeadas.

## O que permanece pendente

1. Identidade das entradas 107, 4, 26b, 70a, 74a, 114a e 115a do diagrama; os seis últimos são números apenas nas figuras.
2. Segmentação individual dos segmentos oftálmicos 6/7; cobertura completa das redes e grupos, incluindo todos os ramos de perfurantes, veias corticais, plexos e vasa nervorum. Uma curva representativa não significa todos os elementos desse grupo.
3. Circulação torácica, lombar e sacral da medula; os novos desenhos medulares cobrem exemplos cervicais, não a medula inteira.
4. Malhas de referência para os 353 IDs sem importação ativa, incluindo os 301 novos desenhos; registro de origem/drenagem, trajeto e relação osteovascular de cada estrutura.
5. Revisão multiprojeção e por imagem seccional de todas as malhas originais e reconstruídas; correção de canais/forames, lateralidade anatômica individual, calibres, variantes e conexões perigosas. Nenhuma aprovação anatômica está registrada.
6. Aquisição/reconstrução rotacional volumétrica verdadeira, aneurismas registrados e reprodução específica do vídeo Mentice.

A [lista exata de ausências de referência](neuro3d-missing-vascular-identities.md) e o JSON integral são gerados da mesma matriz do aplicativo. Nada desta lista é eliminado pela mera presença de uma ilustração.

## Verificação funcional

104 testes unitários em 23 arquivos, TypeScript e build de produção aprovados. Dezesseis casos de navegador passaram em desktop/Pixel 7: seleção sem rotação, camadas ocultas sem seleção, persistência de campo 2D/3D, maxilar, árvore faríngea, inventário, novas veias e variantes opcionais. Capturas de veias profundas e conjuntos arteriais foram inspecionadas. A verificação de superfícies 3D local usa Chromium/SwiftShader; não equivale a validação anatômica. O aviso de chunks acima de 500 kB permanece.
