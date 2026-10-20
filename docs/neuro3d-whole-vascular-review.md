# Revisão integral arterial e venosa — 20/10/2026

## Escopo e estado real

O usuário exige confronto de todo o sistema vascular relevante à neurorradiologia intervencionista: artérias, seus ramos/perfurantes, arcadas, anastomoses e variantes; veias, tributárias, seios, plexos e vias de drenagem cerebral, craniana, cervical e medular. Os exemplos faríngea ascendente, lingual e maxilar não limitam o escopo.

**Nenhuma aprovação anatômica global foi realizada.** Todas as 241 malhas vasculares originais estão contabilizadas individualmente (178 arteriais, 63 venosas). Há 52 reconstruções didáticas: 18 anteriores da ACI e 34 novas da ACE. A auditoria reúne 293 registros com chaves de proveniência, incluindo originais retirados. Presença, integridade e correspondência de rótulo não significam trajeto correto.

Os 1114 objetos originais continuam nos mesmos arquivos; dois foram excluídos da visualização de referência. O aplicativo tem 1112 estruturas importadas ativas e 52 reconstruções didáticas. O índice arterial Neuroangio de 142 entradas tem 43 importadas, 12 reconstruídas, 16 parciais, 64 ausentes e sete identidades não conciliadas. São entradas de legenda/grupos, não vasos únicos.

## Material efetivamente consultado

- Borden, *3D Angiographic Atlas of Neurovascular Anatomy and Pathology*: figuras 2.1–2.4, páginas impressas 15–18 (PDF 27–30). Inspeção visual dos painéis lateral/frontal de ACE/maxilar; arquivo fornecido pelo usuário.
- Krings, *Neurovascular Anatomy in Interventional Neuroradiology* (2015): caso 30, páginas impressas 150–153 (PDF 164–167), e discussão dos casos 25–27 sobre conexões perigosas. Texto e imagens do caso 30 consultados no arquivo fornecido.
- [Neuroangio — faríngea ascendente](https://neuroangio.org/anatomy-and-variants/ascending-pharyngeal-artery/), incluindo imagens transversais e divisão intracraniana.
- [Neuroangio — lingual](https://neuroangio.org/anatomy-and-variants/lingual-artery/).
- [Neuroangio — mandibulovidiana](https://neuroangio.org/anatomy-and-variants/mandibulovidian-artery/), [meníngea média](https://neuroangio.org/anatomy-and-variants/middle-meningeal-artery/) e [oftálmica](https://neuroangio.org/anatomy-and-variants/ophthalmic-artery/).
- [Neuroangio — sistema venoso](https://neuroangio.org/venous-brain-anatomy/), [sistema profundo](https://neuroangio.org/venous-brain-anatomy/deep-venous-system/) e [fossa posterior](https://neuroangio.org/venous-brain-anatomy/veins-posterior-fossa/).

Os demais PDFs fornecidos foram recuperados para o trabalho, mas não se afirma revisão integral de cada página. Os livros/figuras privados não foram redistribuídos no aplicativo ou repositório.

## Originais contestados e reconstruções da ACE

As malhas originais `ascending_pharyngeal_artery_l/r` têm extensão limitada inferior à base do crânio e grande projeção anterior. A identidade/representatividade do trajeto é contestada à luz da observação do usuário e das referências. Não foram renomeadas como lingual. Elas permanecem intactas nos GLB e na auditoria, mas o atlas ativo passa a usar reconstruções didáticas explicitamente identificadas.

A nova árvore da faríngea inclui tronco faríngeo, ramos inferior/médio/superior, tronco neuromeníngeo, divisões hipoglossa/jugular, timpânica inferior, ramo do lacerado, musculoespinal e clival ascendente. A árvore lingual inclui tronco, profunda da língua, sublingual, dorsais e supra-hióideo. São 17 estruturas por lado, 34 superfícies novas. Os inícios usam o eixo da ACE do próprio lado; cada ramo começa em um ponto do seu pai. A divisão hipoglossa é medial à jugular no modelo.

**Limite essencial:** os pontos intermediários e raios são uma reconstrução de estudo original. Não vieram de segmentação de paciente nem de triangulação de angiogramas calibrados. A anatomia fina dos canais/forames, variantes, calibres e continuidade das anastomoses requer registro osteovascular e revisão multiprojeção. Esses modelos não devem ser apresentados como reconstruções radiológicas reais ou caminhos homologados de cateter. O botão “Isolar árvore didática” mostra seus ramos e mantém ACI/ACE do lado como contexto, em 2D/3D.

## Maxilar e conexões perigosas

Há uma matriz explícita dos ramos das três porções da maxilar: mandibular, pterigóidea e pterigopalatina. A matriz diferencia presença de tronco, presença apenas de terminais e ausência de malha individual. A meníngea acessória não é preenchida por equivalência automática com um rótulo “accessory branch of middle meningeal artery”. A contribuição maxilar do forame redondo não é substituída pelo ramo do ILT. A artéria vidiana precisa de origem discriminada entre maxilar e carótida.

Continuam em revisão: origem e trajeto do tronco maxilar; ramos auricular profunda, timpânica anterior, meníngea acessória, massetérica e pterigóideos; alveolares superiores anterior/média; palatinas menores; pterigovaginal; contribuição maxilar do forame redondo; tronco esfenopalatino e relações dos terminais existentes. Não se declara a árvore completa reconstruída.

As 34 relações bibliográficas do índice arterial continuam sem equivalência automática a luz vascular contínua. A revisão das conexões orbitárias, petrocavernosas, clivais, timpânicas, cervicovértebro-basilares e redes vasa nervorum deve conferir as duas extremidades, marcos ósseos, variantes e visibilidade nas projeções. A proximidade de malhas não abre uma comunicação no simulador.

## Sistema venoso

O novo painel “Vasos” registra as 63 malhas venosas existentes, sem marcar nenhuma como anatomicamente aprovada. A matriz inicial de 66 estruturas/grupos venosos explicita 49 ausências individuais, incluindo Galeno, cerebrais internas, basais, principais tributárias profundas, Trolard/Labbé, redes corticais, parte da fossa posterior, emissárias/plexos e drenagem medular. O JSON contém a lista exata com os IDs esperados.

A matriz inclui destinos usuais/alternativos de drenagem e comunicações para as principais vias profundas, superficiais, seios e órbita, sem criar conexões geométricas ou presumir coexistência das variantes.

As variantes não são obrigatórias em todo indivíduo. Tampouco a não opacificação numa injeção implica ausência anatômica. A matriz é expansível e precisa ser confrontada com o conjunto de referências e variantes; não se declara que ela já contenha toda a nomenclatura possível. Presença de um seio não substitui suas veias tributárias.

## Conferência numérica integral

`audit_vascular_meshes.py` verificou todas as 241 malhas originais decodificadas no referencial preservado. Não encontrou índices inválidos ou posições não finitas. Encontrou 240 malhas com bordas abertas e 95 com múltiplos componentes de vértices. Esses achados não são automaticamente defeitos: cortes de vasos e grupos de ramos podem produzir essas características. Precisam de exame individual, e não de fechamento, união ou suavização automáticos.

A auditoria registra limites, área, componentes, degenerações e distâncias entre superfícies de oito junções declaradas. Na junção sigmoide–jugular bilateral, a distância mínima entre vértices é cerca de 0,68 cm; isso sinaliza conferência do bulbo/junção, sem declarar defeito ou preencher o intervalo automaticamente. A maior diferença entre limites decodificados e metadados é 0,255 cm nos ramos estriados laterais distais; também precisa de revisão antes de usar os limites como marcos finos. Distância pequena não prova luz contínua, origem comum ou sentido de fluxo. Nenhuma malha original foi deformada pela auditoria.

Arquivos rastreáveis: `neuro3d-whole-vascular-review.json`, `neuro3d-vascular-geometry-audit.json`, `neuro3d-diagram-audit.json`. Os dois primeiros derivam dos mesmos objetos usados pelo aplicativo e dos buffers originais decodificados, respectivamente.

## Continuação necessária

1. Confrontar individualmente todas as 178 malhas arteriais e 63 venosas com o material multiprojeção; registrar cada conclusão de identidade, origem/drenagem, trajeto, ramos/tributárias, conexões/variantes e marcos.
2. Refinar as reconstruções da ACE pelo registro osteovascular, incluindo passagem pelos canais/forames. Concluir a maxilar e a rede de anastomoses sem criar comunicações fictícias.
3. Reconstruir/segmentar os vasos venosos ausentes com variantes explícitas; incorporar o restante das redes cerebrais e medulares/perfurantes.
4. Conferir cada lote na anatomia 3D e nas projeções AP, lateral e oblíquas, com licenças e origem dos dados preservadas.
5. A aquisição rotacional/reconstrução volumétrica real, a integração validada de aneurismas e a reprodução exata do vídeo Mentice continuam pendentes.

## Fonte adicional examinada

O repositório público SPL/NAC Brain Atlas foi inspecionado na revisão
`bec24db25aad5f7600e2df3becfb1f883e61ff56`, incluindo a árvore de arquivos e
`labelinfo/brain-atlas-labels-with-metadata.tsv`. Esse conjunto consultado não
confirmou as malhas venosas profundas necessárias; não houve importação.
Isso não é uma afirmação sobre todas as versões do atlas SPL. Referência:
https://www.openanatomy.org/atlas-pages/atlas-spl-nac-brain.html . A licença da
página e a licença de cada dado devem ser preservadas se outra revisão vier
a ser utilizada. Não se presume registro com o atlas atual.

## Verificação funcional deste lote

TypeScript, 88 testes unitários em 20 arquivos e build de produção passaram.
A execução ampla de navegador teve 23/28 casos aprovados. Depois foram
corrigidos a contagem esperada (que ainda fixava 18 reconstruções), o seletor
de nome da faríngea e a captura de roadmap com RX pausado. Os seis fluxos
afetados passaram na repetição em desktop/celular. Assim, os 28 casos
individuais têm execução aprovada nas verificações ampla/focadas; não se
afirma uma nova execução única dos 28 após as correções finais.

Também passaram os testes de arraste/ampliação 2D com persistência de campo
na volta de 3D, bloqueio de injeção antes de carregar a geometria, projeção
biplanar com remoção óssea, identidade das malhas recuperadas e navegação
selar/supra-aórtica. Foram inspecionadas capturas da árvore faríngea em
3D; o enquadramento usa a extensão de todos os seus ramos visíveis quando
a raiz da árvore isolada recebe foco. Esse conjunto verifica funcionamento
e integridade; não valida anatomicamente cada trajeto ou anastomose.


## Ampliação da matriz integral — 20/10/2026

O painel “Vasos” abre agora uma matriz única de 273 identidades/grupos. Ela
inclui todas as identidades vasculares da fonte (também as veias faciais,
retromandibulares, jugulares, cervicais e de acesso), reconstruções, alvos
explícitos do índice arterial, exigências venosas e ramos adicionais. São
118 sem malha individual, zero com apenas parte dos IDs esperados e 155 com
IDs presentes, ainda sem homologação. “Presente” conta identidade de
geometria, não cobertura anatômica completa. Há 223 IDs individuais ausentes,
com discriminação de lado quando aplicável.

Foram explicitadas Heubner e perfurantes mediais, artéria subcalosa, ramos
corticais da ACA, divisões da ACM, talamoperfurantes da ACoP/P1, coroideas
posteriores medial/lateral, ramos temporais/calcarino/esplenial da ACP,
perfurantes e divisões cerebelares, ramos meníngeos e famílias medulares.
Nomes diferentes da fonte não são convertidos por semelhança: as superfícies
occipitais, por exemplo, não homologam automaticamente uma calcarina.
Origem, calibre e número de ramos permanecem variáveis; o índice não exige
a coexistência de variantes em um único indivíduo. Os níveis medulares ainda
precisam de detalhamento individual, além das famílias iniciais.

As entradas da legenda sem alvos explícitos ou com conflito também permanecem
visíveis em seção própria, sem serem somadas como novos vasos aos 273.
A lista exata gerada está em `neuro3d-missing-vascular-identities.md`, e o
JSON integral registra IDs esperados, presentes, ausentes, origem e referências.
Filtros por sistema, família/região e cobertura permitem localizar cada lacuna.

### Achado individual: meníngea média

Foram inspecionadas projeções ortogonais dos buffers originais da meníngea
média, seu ramo acessório rotulado, maxilar e ACI. A superfície denominada
meníngea média tem limites craniocaudais de aproximadamente −3,405 a −1,008 cm
no referencial do atlas (extensão 2,397 cm), bilateralmente. Não demonstra
uma árvore dural frontal/parietal completa. O item 39 passa a **parcial**, e a
limitação aparece ao selecionar o vaso, no painel de revisão e no relatório.
Isso não homologa identidade, óstio ou passagem pelo forame espinhoso.
O ramo acessório rotulado continua distinto da artéria meníngea acessória.
Nenhuma superfície foi alongada, subdividida ou conectada por suposição.

### Comparação bilateral de toda a fonte

A auditoria numérica compara os 111 pares explicitamente lateralizados na
fonte, por reflexão virtual em x=0, medindo distâncias entre vértices nos dois
sentidos. Em 101 pares, a distância máxima fica abaixo de um micrômetro.
É um achado de simetria geométrica do conjunto consultado; não prova simetria
anatômica, origem em paciente ou identidade correta. Não foram usados
espelhamento, deformação ou substituição de vasos no aplicativo. Os outros
dez pares e todas as medidas constam no JSON, sem concluir que assimetria
seja defeito.

### Verificação desta ampliação

92 testes unitários em 21 arquivos e TypeScript passaram. A matriz foi
exercitada no navegador em desktop e celular: ausência bilateral de Heubner,
veia facial da fonte visível, filtro de lacunas, Galeno ausente e distinção
da meníngea acessória. O aviso da meníngea média passou no mesmo fluxo em desktop/celular (2/2).
O primeiro ensaio desse aviso usava um nome de busca incompatível com o
rótulo inglês da fonte; o teste passou a localizar pelo número 39 e pelo
rótulo efetivamente exibido. O build final de produção também passou, com
o aviso já conhecido de chunks maiores que 500 kB. Esses testes verificam o
funcionamento dos registros e controles; não são aprovação anatômica.
