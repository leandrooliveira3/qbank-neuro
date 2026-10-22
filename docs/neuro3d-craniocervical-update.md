# Recuperação craniana e cervical — 18/10/2026

## Resultado

520 elementos adicionais recuperados do atlas masculino de Anatria3D, commit
`6320bd64df8db2fcfed358a27c85d1fcc1c5913c`. O total passa de 566 para **1086
estruturas importadas**, além das 18 reconstruções arteriais didáticas existentes.
São 1104 entradas selecionáveis; regiões e inserções não equivalem a órgãos únicos.

| Camada | Adições |
|---|---:|
| Músculos | 165 |
| Regiões e marcos de superfície | 103 |
| Áreas de inserção muscular | 101 |
| Ligamentos, fáscias e articulações | 41 |
| Linfonodos e tonsilas | 40 |
| Cartilagens e discos | 23 |
| Nervos | 12 |
| Órgãos e ductos cervicofaciais | 9 |
| Glândulas | 8 |
| Cavidades aéreas | 8 |
| Veias | 6 |
| Ossos | 3 |
| Tecido nervoso central | 1 |

Inclui IV e VI pares bilaterais, raízes/troncos superiores do plexo braquial,
tireoide, pineal, glândulas salivares, discos C2–T1, ligamentos cranianos,
cartilagens laríngeas, primeira costela bilateral e T1. As seis veias são
jugulares anteriores, subclávias e braquiocefálicas bilaterais.

## Fonte, licença e seleção

Fonte: https://github.com/Nurkan1/Anatria-3D/tree/6320bd64df8db2fcfed358a27c85d1fcc1c5913c/public/anatomy

Os arquivos masculinos e o manifesto mantêm CC BY-SA 4.0. Atribuição:
BodyParts3D / DBCLS → Z-Anatomy → Anatria3D → QBank-Neuro. LICENSE e NOTICE
acompanham os assets públicos e registram as adaptações. Não foram importados
o código do aplicativo de origem, atlas feminino, livros ou figuras privadas.

`tools/neuro3d/import_craniocervical.py` reproduz a seleção e rejeita outra
revisão da fonte. Critério espacial: minY ≥ 1,32 m, maxY ≥ 1,44 m, |X| < 0,18 m,
mais quatro saídas venosas explicitamente nomeadas. É um recorte reprodutível,
não uma certificação de cobertura anatômica total. Malhas que ultrapassam esse
recorte não foram seccionadas ou reposicionadas para forçar sua inclusão.

Transformações, coordenadas e resolução dos GLBs são preservadas. O pacote
de projeção usa o mesmo referencial em centímetros (Y − 160), com alvo de
4000 faces para osso/vasos/nervos e 1000 para outros contextos. Em 22 estruturas
foi mantida a resolução original porque a simplificação ultrapassava os limites
da fonte em mais de 0,01 cm; cada exceção está registrada no manifesto.

## Acesso e identificação

O painel Inventário inclui uma lista das 520 adições, agrupada por camada,
com seleção da estrutura no modelo. Busca por rótulo inglês/latim, isolamento,
foco, corte e seleção persistente usam os mesmos IDs. As novas camadas de
contexto começam ocultas; selecionar uma estrutura a torna identificável.

As três representações compartilham esses IDs. A angiografia 3D permite
identificar a seleção em dourado. A angiografia 2D apresenta uma anotação
da superfície selecionada. Somente vasos e osso contribuem aos respectivos
sinais de contraste e atenuação; cavidades, músculos, nervos, glândulas,
regiões e inserções não se tornam estruturas opacificadas.

## O que permanece ausente

O inventário arterial mantém **65 entradas pendentes**, **4 grupos parciais**,
**9 entradas com reconstruções didáticas** e **52 com malhas importadas**.
A recuperação de contexto não preenche falsamente esses ramos.
A lista nominal completa das 65 entradas está em
[`neuro3d-anatomy-readiness.md`](neuro3d-anatomy-readiness.md#entradas-ainda-pendentes)
e no Inventário do aplicativo.

Outros rótulos cranianos/cervicais do manifesto não têm nó correspondente
nos arquivos masculinos consultados: paratireoides superiores e inferiores
bilaterais, palato mole, nasofaringe, orofaringe, laringofaringe e mucosa nasal.
`pharynx_j` corresponde a uma superfície degenerada e não foi importado.
Essas omissões são explicitadas no Inventário e no relatório JSON. O relatório
também registra quatro rótulos abdominais sem nó, fora do escopo craniano.

Continuam sem superfícies individuais homologadas os anéis durais, carotid
cave, ligamentos finos paraclinoideos, compartimentos cavernosos, pequenos
ramos meníngeos/perfurantes e suas anastomoses. A geometria importada conserva
rótulos de origem ainda não revisados; não há registro em imagens de pacientes,
validação anatômica independente ou aquisição volumétrica de angiografia.

## Verificação desta revisão

Os testes conferem unicidade de IDs, correspondência com cada nó GLB, hashes,
índices de triângulos, limites e coordenadas de todas as 520 projeções, além
de impedir sinal radiográfico indevido de camadas de contexto.
TypeScript, 64 testes unitários e build de produção aprovados. O build conserva
o aviso anterior de chunks maiores que 500 kB.

A conferência visual no navegador não foi executada nesta sessão: o ambiente
gerenciado não disponibiliza o controle de navegador exigido para a prévia.
Resultados de navegador da revisão anterior não validam estas novas malhas.
O acesso à API de deployments Vercel retornou 403 no projeto existente; não
considerar esta revisão publicada em uma URL até confirmação de deployment.
