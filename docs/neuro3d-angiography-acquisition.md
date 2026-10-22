# Formação angiográfica, passagem de contraste e entrada de segmentações

## Mudança implementada

Atlas e estação usam uma etapa compartilhada de projeção supersampled 2×2,
com média de área em cada pixel. Isso reduz serrilhamento e perda de pequenas
luzes que ocupam uma fração do pixel. A espessura ocupada é somada por malha
antes de compor a imagem: orientações opostas entre componentes não podem
cancelar vasos em cruzamentos. Interseções de componentes ainda não são uma
união volumétrica; a soma pode superestimar sinal na junção.

A inspeção encontrou extremidades abertas nas superfícies reduzidas, que
produziam pontos escuros dependentes da profundidade absoluta. O projetor
agora sela laços de borda simples com tampas computacionais e reconhece
costuras de vértices coincidentes. Isso vale apenas para integração de imagem;
as tampas não são novos ramos nem correções anatômicas. Bordas ramificadas
não são fechadas por adivinhação.

A redução global a 700 faces havia danificado componentes da pericalosa e
calosomarginal. Para essas quatro artérias bilaterais, foi acrescentado um
pacote com as superfícies originais completas (94.464 faces, 1,25 MB gzip),
extraídas do mesmo GLB do atlas e no mesmo referencial. Tamanho e SHA256 são
conferidos antes de abrir o pacote; as superfícies substituem suas versões
reduzidas na estação e no projetor. A revisão numérica dessas quatro malhas
não encontrou arestas não-manifold; suas extremidades abertas recebem as
mesmas tampas computacionais. A identidade e a anatomia da base continuam
pendentes de revisão independente. Outras estruturas ainda usam as versões
reduzidas e precisam de auditoria de resolução e topologia.

A aquisição sem subtração calcula transmissão exponencial relativa por osso
e contraste. A DSA sintética calcula log(máscara/imagem contrastada) antes da
janela de exibição, mantendo os vasos escuros sobre fundo cinza claro. Há um
pequeno kernel separável para a resposta do detector. Não há textura de osso
inventada, granulação decorativa, dose, cone beam ou calibração espectral.
A projeção continua ortográfica, com imagem de 600×560 e supersampling interno.

Na estação conectada às malhas, um bolo ilustrativo sobe de zero, preenche
progressivamente os ramos alcançáveis e sofre lavagem até 5 s. O atraso entre
rotas segue comprimento de eixo restante/12 cm por segundo; a fração do eixo
na ponta do cateter é registrada na injeção. A velocidade e a curva são
parâmetros educativos escolhidos, não valores medidos nos livros ou resultados
de CFD. O preenchimento varia por rota inteira, sem frente contínua dentro
de cada luz e sem calibração por território. Ramos visuais associados a uma
rota compartilham seu tempo; não se simulam capilares, drenagem venosa seletiva,
fluxo retrógrado ou colaterais não revisadas. O trombo mantém o bloqueio já
implementado. A associação visual foi ampliada para pericalosa, calosomarginal e seus ramos
frontais na ACA, ramo pós-central na ACM e comunicante posterior na ACI.
São malhas já existentes, agora incluídas na opacificação do território pai;
continuam sem eixo navegável próprio, sem conexão volumétrica validada nem
cálculo de direção/fluxo por comunicantes. Não foi acrescentado preenchimento
contralateral automático. O modo esquemático conserva a cinética anterior.

A máscara de roadmap guarda idade do contraste, origem, fração da ponta,
projeção, trombo e dilatação da captura. Uma nova injeção não muda o tempo ou
as concentrações da máscara capturada. As projeções de superfícies ficam em
cache enquanto geometria e câmera forem iguais; variar concentração não
rasteriza novamente todos os triângulos.

## Referências consultadas

- Borden, *3D Angiographic Atlas of Neurovascular Anatomy and Pathology*,
  técnica de 3DRA, páginas impressas 8–10 (PDF 20–22), e Fig. 4.1, p. 49
  (PDF 61). Leitura textual das páginas de técnica e inspeção visual de PDF
  21 e 61. Usados para distinguir opacificação temporal, vistas nativas,
  reconstruções 3D e a importância da posição do cateter. As figuras não
  foram incorporadas ao aplicativo nem reconstruídas quantitativamente.
- Neuroangio, ACI e MHT:
  https://neuroangio.org/anatomy-and-variants/internal-carotid-artery-and-its-aneurysms/
  https://neuroangio.org/anatomy-and-variants/meningohypophyseal-trunk/
  Consulta textual e tentativa de acesso às figuras de comparação de MHT.
  Parte das imagens não pôde ser recuperada; não se declara revisão visual
  completa. A variabilidade do MHT e sua visibilidade limitada em aquisições
  convencionais impedem tratar sua representação didática como angiografia
  normal validada.

## Repositórios indicados e aproveitamento

Commits e estado de execução em neuro3d-angiography-repository-audit.json.
Nenhum código externo foi copiado, nenhum peso de IA foi executado e nenhum
dataset de pacientes foi redistribuído nesta etapa.

| Fonte | Inspeção | Aplicação e limite |
| --- | --- | --- |
| intra3d2019/IntrA | README, árvore, tools/vessels.py e tools/show_ann_data.py | Candidato a casos vasculares e aneurismas baseados em MRA; geometrias ficam em distribuição externa. O repositório não contém os volumes MRA originais. A distribuição externa não foi acessível pelo mecanismo de consulta. Nenhum arquivo de paciente foi baixado/incorporado; permissão dos dados deve ser conferida separadamente da disponibilidade pública do artigo. |
| jongdory/Vessel-Diffusion | README, árvore e scripts/inference.py | Pipeline segmenta TOF e grava NIfTI com affine/header. O novo importador aceita saída NIfTI, preserva coordenadas e rejeita mapas de probabilidade não discretizados. Não fornece pequenos vasos sem imagem de entrada; treinamento/checkpoints não executados. Código principal Apache-2.0, subcomponentes têm avisos próprios. |
| MIAGroupUT/carotid-segmentation | README e docs/Transforms/Segmentation.md | Distingue canal de luz e parede em máscaras MHA. Importador exige seleção de canal e converte LPS físico explicitamente. RM black-blood cervical não é uma árvore intracraniana completa. MIT no código; modelos/dados são externos. |
| dipterix/threeBrain | README e R/fs_import-xform.R | Referência para matrizes explícitas e correlação superfície/volume sem recentrar cada estrutura. Nenhuma transformação MNI/tkRAS foi presumida para o atlas. Visualizador JavaScript declara MPL-2.0; não foi incorporado. |
| caetanope/angio3d | README e src/xray.py/xray1/src/xray.py | Revisão de integração por profundidade e separação de projeção/imagem. Nova implementação própria usa as superfícies neurovasculares existentes, não modelos coronários do projeto. Código MIT. |
| mirthAI/CIS-UNet | README e ScriptedCodes/utils/dataset_processor.py | Pipeline exemplifica segmentação multiclasse em CTA, orientação RAS e tratamento distinto de imagem/rótulo. O importador preserva labels e transformação física, sem reamostragem automática. Aorta/ramos não substituem a microvasculatura cerebral; dados exigem acordo externo, não solicitado nem aceito pelo agente. MIT no código. |
| github.com/topics/mri-segmentation | Página de tópicos | Índice de descoberta, não um dataset nem um método único. Link repetido no pedido foi tratado uma vez. |

## Importação de volumes segmentados

`tools/neuro3d/import_vascular_segmentation.py` converte máscaras com rótulos
explícitos em GLB e manifesto de coordenadas, origem/licença e qualidade.

Aceita NIfTI via nibabel, MHA/MHD via SimpleITK e NPZ contendo `labels` em XYZ,
`affine` 4×4 em mm e `space` RAS/LPS. Os dados multicanais exigem `--channel`.
LPS é convertido a RAS; o affine inteiro (incluindo origem, espaçamento
anisotrópico, rotação e reflexões) é aplicado. O GLB usa metros e Y superior.
Não há centralização, inferência automática de nomes nem fusão com o atlas.

Exemplo para uma máscara previamente produzida e revisada:

```bash
python3 tools/neuro3d/import_vascular_segmentation.py mask.nii.gz labels.json output-segmentation --source-url URL-DA-FONTE --license LICENCA-DOS-DADOS
```

`labels.json` é um objeto explícito, por exemplo:
`{"1":{"name":"Máscara vascular ainda sem identificação por artéria"}}`.
Uma máscara binária não fornece a identidade de todas as artérias. Nenhuma
saída desse script é automaticamente carregada no atlas ou navegável.

O manifesto registra SHA256, affine voxel→RAS/glTF, número de componentes,
fechamento da malha e contato com a borda do volume. A superfície é extraída
sem limpeza que descarte automaticamente componentes pequenos; contato com
a borda indica possível truncamento. A referência espacial e a licença devem
ser verificadas antes de qualquer incorporação posterior. O volume original
fica local e não é enviado pelo script.

As verificações de importação nesta etapa usaram volumes sintéticos declarados,
incluindo voxels anisotrópicos, origem não nula, LPS e rejeição de probabilidades,
labels ausentes e canais ambíguos. Não houve inferência em um paciente real.

## Verificação desta etapa

- TypeScript e build de produção aprovados; aviso pré-existente de chunks grandes.
- 47 testes unitários JavaScript, 28 testes de navegador desktop/mobile e
  2 testes Python de importação aprovados.
- Inspeção visual do atlas projetado e da estação biplanar; integridade do
  pacote distal conferida por tamanho, SHA256 e revisão de bordas/topologia.
- As verificações comprovam comportamento de software e coerência numérica;
  não homologam anatomia, física ou competência técnica do usuário.
