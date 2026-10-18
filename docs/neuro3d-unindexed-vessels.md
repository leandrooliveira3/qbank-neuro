# Recuperação de vasos omitidos pelo manifesto — 18/10/2026

## Resultado

Foram recuperadas **28 malhas arteriais existentes na fonte**, mas ausentes
do manifesto de órgãos: 24 cranianas e quatro cervicais. O atlas passa de
1086 para **1114 estruturas importadas**, além das 18 reconstruções didáticas.
Nenhum novo tubo foi desenhado nesta etapa.

O arquivo cardiovascular da revisão já utilizada contém 676 nós de malha,
mas o manifesto nomeia apenas 640. A importação anterior dependia desse
manifesto e, por isso, ignorava 36 nós. A extração atual seleciona 28 nós
com nomes explícitos; oito permanecem excluídos por estarem fora do recorte
ou sem identificação suficiente. A lista exata está em
`neuro3d-unindexed-vessels-audit.json`.

## Adições

- M2 insular esquerdo e M3 esquerdo; os correspondentes direitos já existiam
  sob grafias diferentes no manifesto.
- Ramos temporais anterior, posterior e temporo-occipital bilaterais.
- Artérias dos sulcos central e pré-central bilaterais.
- Artérias pré-frontal, frontobasal lateral e parietal posterior bilaterais.
- Ramos para o giro angular bilaterais, distintos da artéria angular facial.
- Ramos estriados laterais proximais e distais bilaterais.
- Ramos profundo e superficial das artérias cervicais transversas bilaterais,
  distintos da artéria cervical profunda do item 102.

O item **118** agora dá acesso a **34 malhas associadas à ACM**: 24 recuperadas
e dez já presentes. M1, M2 e M3 têm representação bilateral. Ele continua
classificado como parcial: a árvore completa, as variantes e a continuidade
de todos os ramos não foram homologadas.

## Fonte e licença

Fonte: https://github.com/Nurkan1/Anatria-3D

Revisão fixada: `6320bd64df8db2fcfed358a27c85d1fcc1c5913c`.
Arquivo: `public/anatomy/cardiovascular_male.glb`.
SHA-256: `05f373a294ab809b9a628bc1474a66028642997330fddc553a33d4ac6409b757`.

Atribuição preservada: BodyParts3D / DBCLS → Z-Anatomy → Anatria3D →
QBank-Neuro. Os assets adaptados e seus rótulos mantêm CC BY-SA 4.0.
As malhas não foram recentradas, ajustadas individualmente, espelhadas ou
deformadas. O GLB conserva os buffers Draco e as transformações originais.
Não foram importadas definições de enciclopédias, código do aplicativo
externo ou figuras do Neuroangio.

## Atlas e angiografia

As novas malhas participam da lista de estruturas, busca por nome português
ou número, seleção, isolamento, cortes, anatomia 3D, angiografia 3D e projeção
angiográfica 2D. O pacote de projeção usa os mesmos IDs e referencial espacial,
com hash verificado pelo carregador. A busca por **118** inclui os ramos
associados à ACM. A busca textual também encontra as traduções específicas
das novas estruturas.

Não foram adicionados percursos navegáveis ou conexões de fluxo ao simulador.
Presença de uma malha na angiografia do atlas não afirma que uma injeção
seletiva procedural já a opacifique corretamente.

## Conferências

- Identidade de cada nó, unicidade de IDs e preservação da licença/revisão.
- Rejeição de duplicatas exatas de buffers e transformações em relação aos
  vasos existentes; nenhuma duplicata exata foi encontrada.
- Índices de triângulos, hashes e limites das 28 superfícies de projeção.
- Nos 24 nós cranianos recuperados, comparação de distância entre vértices
  com os outros vasos candidatos da ACM do mesmo lado. Não houve candidato
  com mais de 90% dos vértices a menos de 0,01 cm de outra malha.
- A maior distância mínima a outra malha do grupo foi 0,102111 cm. Esse
  número depende da amostragem dos vértices, não certifica continuidade do
  lúmen e não motivou criação de pontes. Relatório:
  `neuro3d-mca-surface-gaps.json`.
- Projeções ortogonais das superfícies originais foram inspecionadas
  internamente. Isso não substitui o teste interativo no navegador.

O inventário de 142 entradas mantém 49 com malhas identificadas, cinco com
reconstruções didáticas, oito parciais, 73 sem geometria e sete com identidade
a reconciliar. Esta revisão amplia a cobertura dentro de entradas parciais;
não preenche falsamente outros números da legenda.

A verificação funcional no navegador foi concluída em desktop e celular.
A homologação anatômica especializada continua pendente. Os rótulos de origem
e a associação dos ramos permanecem explicitamente em revisão.

## Validação desta publicação

Recuperação local em 18/10/2026: o GLB, o pacote angiográfico comprimido, seus
metadados, o inventário e a auditoria coincidem por hash Git com o checkpoint
preparado anteriormente. O cabeçalho de plataforma gzip foi normalizado para
reproduzir exatamente o pacote original; as superfícies não foram modificadas.

TypeScript, 74 testes unitários em 16 arquivos e build de produção aprovados.
Oito testes de navegador passaram no Chrome local com renderização por software:
quatro fluxos em desktop e celular, incluindo busca de 34 malhas pelo número 118,
seleção de M2 esquerdo, anatomia 3D, angiografia 3D, projeção 2D com pixels
destacados, seleção cervical e regressões de isolamento, cortes e navegação.
Nenhum erro de página foi registrado pelos oito testes.

O navegador integrado não fornece WebGL neste ambiente; ele foi usado para
conferir a interface e o acesso à projeção 2D. As verificações 3D utilizaram
o Chrome com SwiftShader. O build mantém o aviso de chunks maiores que 500 kB.

Corrigido um conflito de resolução no Windows: o componente visual passou a
se chamar DeviceCataloguePanel.tsx, distinguindo-o do módulo deviceCatalogue.ts.
Os testes de navegador leem os manifestos como arquivos, evitando carregar
módulos Vite com imports JSON pelo carregador ESM do Node.

Essa validação verifica funcionamento e integridade, não homologa a anatomia
ou a continuidade vascular. Permanecem 73 entradas sem geometria, oito parciais
e sete identidades a reconciliar, listadas em neuro3d-diagram-review.md.
