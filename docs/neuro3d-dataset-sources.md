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
