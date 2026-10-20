# Fontes de dados avaliadas — 19/10/2026

| Fonte enviada | Acesso e licença observados | Utilização atual e pendências |
|---|---|---|
| [IEEE 10884618 / DSCA](https://ieeexplore.ieee.org/abstract/document/10884618), [registro primário](https://zenodo.org/records/11255024) | Sequências DSA; arquivos restritos, mediante solicitação acadêmica. A licença declarada no registro não libera o acesso aos arquivos. | Não baixado nem redistribuído. Nenhuma solicitação enviada em nome do usuário. |
| [Data 11(4), 74](https://www.mdpi.com/2306-5729/11/4/74), [Zenodo 15697196](https://zenodo.org/records/15697196) | Dataset CTA, CC BY 4.0. Arquivo ZIP de 25.578.845.008 bytes. | Índice do ZIP consultado por HTTP Range: 122 STL identificados. Uma amostra inspecionada; ainda sem registro no atlas. |
| [Mendeley 9wv3fkxstx/1](https://data.mendeley.com/datasets/9wv3fkxstx/1) | TC/CTA DICOM de caso único; CC BY 4.0; contribuinte xuming WANG; DOI 10.17632/9wv3fkxstx.1. | Metadados consultados; arquivos não recuperados. Não presumir segmentações ou árvore vascular pronta. |

## Inspeção efetivamente realizada

O script `tools/neuro3d/inspect_cta_dataset.py` lê o índice remoto do ZIP sem
baixar o arquivo inteiro. O manifesto `neuro3d-cta-source-index.json` registra
os 122 caminhos STL, tamanhos e CRCs. O checksum global MD5 do ZIP é o
publicado pela fonte: **não foi verificado pelo download integral**.

Amostra `Annotations/an_184.stl`: 21.743 bytes, CRC ZIP verificado e SHA-256
`1a98fcc60dfa69aba81619af03f7127c42300b6bfc5d5c2f32c92af5e9d0beeb`.
Leitura VTK: 56 pontos, 108 triângulos e zero arestas de contorno abertas.
Não se estabeleceu unidade, vaso de origem, topografia, colo ou transformação
para as coordenadas do atlas. O arquivo não foi incorporado ao aplicativo.
Uma superfície fechada não pode ser passada diretamente ao analisador
VMTK que exige um saco aberto no colo, nem transplantada para uma artéria
como se a união anatômica estivesse verificada.

Atribuição da fonte CTA: “Open dataset of annotated DICOM images of head CTA
for intracranial aneurysm detection”, DOI 10.5281/zenodo.15697196, distribuído
sob [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/), conforme o
registro. Consultar os autores e a citação completa no próprio registro antes
de redistribuir derivados. Nenhuma validação publicada dos rótulos é
transferida para o simulador.

## Referência visual solicitada

[Mentice Neurovascular Thrombectomy](https://www.youtube.com/watch?v=DYWq_CjsSVw)
foi aberto no navegador. O player apresentou título e duração 2:14, mas
permaneceu sem quadros decodificados (readyState 0), inclusive ao buscar 1:06.
Portanto, ainda não houve inspeção visual suficiente para reproduzir o layout
exato desse vídeo. Não se declara equivalência de interface ou de simulação.
São necessários o vídeo anexado ou capturas dos painéis para concluir essa
comparação visual específica.


## Fontes venosas adicionais efetivamente inspecionadas

| Fonte | Licença e conteúdo verificados | Estado real |
| --- | --- | --- |
| [VENAT](https://figshare.com/articles/dataset/VENAT_Probability_map_nii_gz/7205960), [registro primário](https://api.figshare.com/v2/articles/7205960) | CC BY 4.0 no registro. Mapa médio de frações de volume parcial venoso, 20 participantes, espaço MNI152. | NIfTI de 77.294.676 bytes recuperado e MD5 publicado conferido (`2fcfec7e50e1d7c3f6f5e3e5be4e9d53`). Volume 364 × 436 × 364, voxels 0,5 mm, dados finitos entre 0 e 0,835083. Isosuperfícies nos limiares 0,10/0,20 inspecionadas em projeções ortogonais. Sem registro no atlas, sem rótulos individuais e sem importação no aplicativo. |
| [TopBrain v3](https://zenodo.org/records/21972006) | Uso não comercial permitido com atribuição; uso comercial exige autorização do titular. O `License.txt` e os mapas de classes foram lidos. Há 40 classes CTA e 42 MRA na v1; a v2 tem 36 classes unificadas. | Índice ZIP de 161 entradas examinado por HTTP Range, mais licença e mapas de classes. Não foram baixados os NIfTI de pacientes/máscaras nem incorporados dados ao aplicativo. |
| [NIH 3DPX-003440 — CNS Venography](https://3d.nih.gov/entries/3DPX-003440), Nevit Dilmen | A página indica CC BY-SA e informa que o modelo contém também algumas artérias. A versão específica da licença do arquivo ainda precisa de conferência. | Página e listagem examinadas; arquivos não recuperados nem importados. Um conjunto sem rótulos discriminados não pode ser contabilizado como todas as veias faltantes. |

O VENAT é de Huck e colaboradores: *High resolution atlas of the venous
brain vasculature from 7 T quantitative susceptibility maps*, Brain
Structure and Function (2019), DOI 10.1007/s00429-019-01919-4. A licença dos
dados foi verificada no registro Figshare, separadamente da licença do
artigo/preprint. O mapa médio não é uma segmentação categórica individual;
um limiar de volume parcial não constitui identificação de Galeno, cerebral
interna ou qualquer tributária. A inspeção não preenche as 49 ausências da
matriz venosa.

`tools/neuro3d/inspect_venat_source.py` verifica tamanho/MD5 antes da leitura,
recusa dados não finitos ou fora de [0,1], conserva a matriz física e exporta
opcionalmente superfícies para inspeção em espaço próprio. O relatório
`neuro3d-venat-source-audit.json` registra hashes, dimensões, escala e método.
Não há transformação para o atlas, atribuição individual de nomes ou grafo
navegável. Os NIfTI, superfícies de ensaio e figuras de referência não foram
redistribuídos neste repositório.

A revisão bibliográfica incluiu a [página da cerebral interna do
Neuroangio](https://neuroangio.org/venous-brain-anatomy/internal-cerebral-vein/):
a topografia ventricular e as projeções complementares são parte da
conferência de tributárias, não algo substituído por um coletor presente.
