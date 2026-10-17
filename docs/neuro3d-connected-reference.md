# Malhas conectadas, navegação e organização da página

## Modo conectado implementado

A estação abre com **Malhas do atlas · ACI esquerda**. A entrada está dentro
da ACI cervical esquerda, sem inventar um alinhamento do acesso femoral ou
do arco aórtico. O cenário aórtico anterior continua selecionável como base
esquemática. A troca de base reinicia instrumentos, máscara e caso.

O grafo conectado contém a entrada cervical, ACI esquerda, ACM M1 esquerda,
ACA esquerda e oftálmica esquerda. Os eixos derivam das malhas importadas:
voxelização a 0,08 cm, fechamento computacional das extremidades, esqueleto
medial do maior componente conectado, caminho geodésico mais longo e
suavização. O sistema de coordenadas foi preservado: metros glTF × 100 e
Y − 160, igual ao usado no atlas de superfícies.

As rotas não receberam rótulos C1–C7 arbitrários. O atlas de referência não
fornece marcos durais suficientes para segmentação Bouthillier confiável.
As classificações originais permanecem nos cenários didáticos.

O maior caminho medial de cada malha não é uma reconstrução de toda sua
árvore. Ramos visuais adicionais da ACM, ACA e oftálmica podem ser opacificados
por associação anatômica declarada; não são todos navegáveis e não há solver
de fluxo ou cálculo de colaterais.

## Junções e revisão numérica

Os eixos extraídos terminam dentro dos volumes e não coincidem exatamente.
As três junções distais foram ligadas por trechos numéricos explícitos.
No teste com 25 amostras por conector, a maior distância para fora da união
das malhas originais foi aproximadamente 0,074 cm (ACM), 0,053 cm (ACA) e
0,020 cm (oftálmica), dentro do passo de voxelização usado. Esses números
medem concordância computacional com a malha, não precisão anatômica real.

A ligação entre carótida comum e ACI foi excluída deste modo: a distância
externa calculada chegou a aproximadamente 0,32 cm. A ACE também não foi
liberada para navegação, pois parte do eixo extraído saiu da malha em cerca
de 0,19 cm. Não resolver essas lacunas com alinhamento visual ou rótulos de
validação. A conferência por especialista permanece pendente.

## Um referencial para três representações

- O atlas detalhado conserva os GLBs originais recortados.
- A estação usa superfícies de resolução reduzida das mesmas malhas e eixos
  extraídos no mesmo espaço. Instrumentos seguem esses eixos; suas pontas
  projetadas usam a mesma transformação das superfícies.
- A projeção vascular integra espessura das superfícies importadas, em vez
  de tubos de raio uniforme. Crânio e vértebras cervicais vêm das malhas ósseas
  importadas. No modo DSA sintético, a contribuição óssea é retirada.

`reference-surfaces.bin` empacota posições, índices e coordenadas longitudinais.
O carregamento confere tamanho e SHA256. A redução de polígonos serve à
projeção e à estação: até 1.200 faces por estrutura óssea e 700 por vascular;
não se declara preservação de microanatomia abaixo dessa resolução.

A estenose deforma a superfície cervical da ACI em torno do seu eixo; a
expansão modifica essa mesma superfície na visão 3D e na projeção. O trombo
limita a coluna de contraste de M1. Cortes computacionais da coluna são
fechados para evitar artefatos da integral de profundidade. O saco aneurismático
continua sendo uma lesão virtual acrescentada à ACI, não um aneurisma
segmentado de paciente nem uma reconstrução validada de anéis durais.

A projeção é ortográfica e relativa. Contraste, osso, tratamento e imagem
continuam gráficos: sem calibração radiológica, espectro, espalhamento,
subtração logarítmica adquirida, CFD ou biomecânica validada. Não há registro
dessas malhas em imagens reais dos livros ou do Neuroangio nesta revisão.

## Layout e revisão de cobertura

Cabeçalho compacto, navegação mais leve e modelo em área maior. O painel do
atlas reúne Camadas, Estruturas e Revisão, mantendo uma única coluna de
controles. Há predefinições vascular/osteovascular/encéfalo e área 3D ampliável
com saída por Escape. A estação tem console agrupado e, em celular, monitores
deslizáveis para preservar o tamanho de cada imagem.

O painel Revisão registra o inventário dirigido de pequenos ramos e relações
finas. Retiniana central, ciliares, etmoidais, oftálmica e nervos de contexto
estão identificados; relações e variantes seguem pendentes. MHT, ILT, artéria
coroidea anterior e anéis durais/carotid cave não foram identificados como
malhas próprias. Plexo coroide não é usado como substituto da artéria coroidea.
Essa revisão de inventário não é homologação anatômica independente.

Referências dirigidas: Krings, casos 5–9 e 33 (caso 6, pp. 27–28, revisado
anteriormente); Borden, Fig. 5.14; páginas de ACI e oftálmica do Neuroangio.
O índice fornecido pelo usuário continua em `anatomy-requirements.json`.

## Reprodução

Scripts próprios em `tools/neuro3d/`:

1. `decode_reference_meshes.mjs ASSET_DIR DECODED_JSON DRACO_MODULE_PATH`:
   decodifica os GLBs, aplica transforms e corrige winding de reflexões.
   Requer `draco3d` do registro npm.
2. `extract_reference_axes.py DECODED_JSON AXES_JSON`: requer NumPy, SciPy,
   trimesh, scikit-image e rtree. A inspeção de junções foi feita separadamente
   por distância assinada às malhas fechadas computacionalmente.
3. `package_reference_geometry.py DECODED_JSON AXES_JSON REPO_ROOT`: requer
   também fast-simplification. Empacota superfícies e o grafo focado.

Dados e rótulos derivados continuam sob CC BY-SA 4.0, com a atribuição de
`public/neuro3d/open-anatomy/NOTICE`. Código do aplicativo Anatria não foi
incorporado. Mudanças registradas em `reference-data-NOTICE.txt`.


## Validação desta revisão

TypeScript e build Vite aprovados; 37 testes unitários e 24 testes Playwright
em desktop e viewport móvel. Inspeção visual do atlas e da estação. Os testes
cobrem integridade do pacote, continuidade das rotas, localização dos alvos,
recuo independente dos instrumentos, seleção de base, projeções com osso e
DSA sintética, restauração de visão, modo ampliado, cortes e controle de
console por teclado sem acionamento acidental do pedal. Chromium/SwiftShader;
sem GPU física. O build mantém avisos de chunks grandes.
