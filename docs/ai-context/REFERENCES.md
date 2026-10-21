# Auditoria de fontes e uso efetivo — 21/10/2026

## Método e conclusão

Conferidos `package.json`, os imports de `features/`, ferramentas em `tools/neuro3d/`, manifestos e relatórios anteriores, sobre o código publicado `025ef13`. Os links públicos abaixo foram reabertos nesta sessão. Distinguir consultar documentação, preparar adaptador, examinar dados e executar no site.

**Nenhum dos sete links solicitados funciona atualmente como motor integrado do site.** Eles auxiliam pesquisa/especificação; VMTK tem adaptador offline preparado. Paciente 3D usa dicom-parser e Three.js, sem modelo de IA treinado nessas fontes. Não foi demonstrada utilização dos três novos datasets como assets ou casos executados no aplicativo.

## Sete links GitHub

| Fonte primária | Natureza / uso possível | Uso comprovado no projeto | Licença / ação antes de integrar |
|---|---|---|---|
| [Zhao-BJ/Brain_3D_Vessel_Datasets](https://github.com/Zhao-BJ/Brain_3D_Vessel_Datasets) | Índice MIDAS/TubeTK, conversão de anotações e ligação a rótulos BRAVE-NET; não é um reconstrutor 3DRA | Índice consultado; a ligação BRAVE-NET levou agora à máscara pat_1 efetivamente derivada e exibida em Referências vasculares. O conversor TubeTK e modelos de IA não foram executados | Conferir termos de cada dataset e conversor separadamente. Público não implica licença geral de redistribuição |
| [intra3d2019/IntrA](https://github.com/intra3d2019/IntrA) | Malhas/segmentos de aneurismas; imagens MRA originais não publicadas | README/árvore/ferramentas auditados em `../neuro3d-angiography-repository-audit.json` e `../neuro3d-angiography-acquisition.md`; sem malhas/casos importados | Licença específica dos dados ainda não estabelecida neste projeto; não inferir pelo artigo. Não resolve reconstrução DICOM |
| [Chin-Fu-Liu/Arterial_Atlas](https://github.com/Chin-Fu-Liu/Arterial_Atlas) | Territórios arteriais em MNI; não são superfícies do lúmen | Referência candidata para territórios, sem integração de NIfTI/UI | CC BY-SA 4.0 na página. Preservar atribuição/termos e transformação explícita; não substituir vaso individual por território |
| [i-vesseg/VesselVerse-Framework](https://github.com/i-vesseg/VesselVerse-Framework) | Extensão 3D Slicer para edição, versões, comparação e consenso de anotações | Referência para revisão/histórico de segmentação; não há extensão, STAPLE ou modelos executados no portal | Código MIT; termos dos dados/modelos separados. README consultado ainda anuncia dataset como futuro |
| [BlueBrain/vasculature-suite](https://github.com/BlueBrain/vasculature-suite) | Índice de ferramentas: vascpy, VessMorphoVis, formato vascular e BioExplorer | Consulta para processamento de grafos/morfologias, sem integração | Verificar licença e compatibilidade de cada componente; a página agregadora não concede licença única a todos eles |
| [Tópico vessel-segmentation/MATLAB](https://github.com/topics/vessel-segmentation?l=matlab&o=desc&s=) | Página de descoberta, não repositório ou biblioteca única | Busca de candidatos; nenhum pacote MATLAB selecionado/integrado | Cada projeto exige auditoria própria de licença, modalidade e requisitos. Segmentação retinal não equivale a cerebral |
| [iagolessa/vmtk4aneurysms](https://github.com/iagolessa/vmtk4aneurysms) | Morfometria/representação de aneurismas e análise de campos | `tools/neuro3d/analyze_aneurysm_vmtk.py` importa opcionalmente `Aneurysm`, em processo Python separado. CLI/compilação verificadas anteriormente; **morfometria real não executada**, sem ligação à UI | GPLv3, componentes com avisos próprios. Instalação independente VTK/VMTK; preservar termos. Ver `../neuro3d-vmtk4aneurysms.md` |

Evidência negativa com escopo: busca pelos nomes/IDs em `features`, `tools` e `package.json` encontrou somente import opcional VMTK e inspector CTA nas ferramentas offline, não chamadas de pesquisa na aplicação. Os manifestos de anatomia aberta identificam outra linhagem de assets. Isso descreve o checkpoint auditado; futuras integrações devem atualizar esta tabela.

## Três datasets enviados

| Fonte enviada / registro primário | Acesso / modalidade | Estado real e uso permitido a confirmar |
|---|---|---|
| [IEEE 10884618](https://ieeexplore.ieee.org/abstract/document/10884618), [DSCA Zenodo 11255024](https://zenodo.org/records/11255024) | DSA sequencial; registro aberto, arquivos **restritos**, uso acadêmico mediante solicitação | Nenhum download ou pedido enviado. Página IEEE retornou erro 418 nesta revisão; o próprio registro Zenodo associa o artigo e confirma restrição. Sequência DSA não é volume reconstruído 3DRA |
| [Artigo indicado no RePEc](https://ideas.repec.org/a/gam/jdataj/v11y2026i4p74-d1913589.html), [publicação primária Data 11(4),74](https://www.mdpi.com/2306-5729/11/4/74), [Zenodo 15697196](https://zenodo.org/records/15697196) | CTA anotada, não angiografia rotacional; licença CC BY 4.0 segundo inspeção anterior do registro | `../neuro3d-cta-source-index.json` e inspector registram índice remoto de 122 STL. Uma amostra `Annotations/an_184.stl` examinada, sem registro/importação no app. ZIP integral de 25.578.845.008 bytes não baixado. Zenodo não reabriu pela ferramenta web nesta revisão; não alegar reconferência atual de todos os arquivos/licença |
| [Mendeley 9wv3fkxstx/1](https://data.mendeley.com/datasets/9wv3fkxstx/1), DOI 10.17632/9wv3fkxstx.1 | TC/CTA de caso único, incluindo CTA cerebral/coronária; CC BY 4.0 reconfirmada na página | Metadados consultados, arquivos não recuperados/testados. Não inferir máscara vascular, segmentação pronta ou 3DRA. Antes de usar, conferir série/modalidade/geometria, atribuição e desidentificação |

Amostra CTA: SHA-256 `1a98fcc60dfa69aba81619af03f7127c42300b6bfc5d5c2f32c92af5e9d0beeb`, CRC ZIP conferido, 56 pontos/108 triângulos/zero bordas abertas conforme relatório anterior `../neuro3d-dataset-sources.md`. Unidade, topografia, colo e transformação permanecem não estabelecidos. Checksum global publicado do ZIP não foi verificado por download integral. Não converter a amostra em um aneurisma do atlas por aproximação visual.

## Fontes que efetivamente sustentam outras partes

- Malhas anatômicas: BodyParts3D/DBCLS → Z-Anatomy → Anatria3D → Qbank-Neuro, derivados CC BY-SA 4.0; código BSL do aplicativo de origem não copiado. Manifesto `features/neuro3d/open-anatomy.json`, créditos `public/neuro3d/open-anatomy/NOTICE`; decoder Draco Apache-2.0 com avisos. Ver `../neuro3d-open-source-integration.md` e atualizações cranianas/cervicais; contagens antigas são históricas.
- Leitor DICOM: [cornerstonejs/dicomParser](https://github.com/cornerstonejs/dicomParser), MIT, 1.8.21; geometria validada pelo código próprio. Dependências não equivalem a validação clínica.
- VENAT: [Figshare 7205960](https://figshare.com/articles/dataset/VENAT_Probability_map_nii_gz/7205960), Huck et al., DOI 10.1007/s00429-019-01919-4. CC BY 4.0 nos dados. Download/MD5 e inspeção anteriores em `../neuro3d-venat-source-audit.json`; mapa médio em MNI, não rótulos individuais. Superfícies de limiar 0,10/0,20 agora exibidas no comparador independente; volume recuperado e SHA-256 reconferido neste lote.
- BRAVE-NET: [registro indicado pelo índice Zhao](https://zenodo.org/records/3968844); candidato a comparação arterial independente. Máscara manual pat_1 agora verificada e derivada para o comparador. Registro declara MIT; ZIP MD5/SHA e máscara SHA conferidos. Não houve inferência/treino do modelo BRAVE-NET.
- Bouthillier, Lasjaunias, Borden, Krings e Neuroangio: referências de nomenclatura/relações, com consultas dirigidas registradas nos relatórios existentes. Citação não comprova que toda relação do atlas foi validada. PDFs/figuras permanecem em espaço privado.
- Vídeos Mentice e Vascular Twin locais: hashes/tempos/amostragem em `../neuro3d-primary-video-references.md`. Dez quadros amostrados por vídeo, não inspeção quadro a quadro integral. A observação posterior dos anexos supera a antiga limitação de player sem imagem descrita em dataset-sources.
- TCD Simulator ZIP e Ankyras decompilado: avaliações estáticas REA documentadas em `../neuro3d-tcd-reference-review.md` e `../neuro3d-ankyras-review.md`. Sem integração de código/recursos comerciais; dummy assemblies não fornecem algoritmos.

## Uso seguinte, com evidência

Priorizar P0 do ROADMAP: comparadores arteriais/venosos independentes e inventário/angiografia. Para paciente, fontes CTA podem apoiar ensaios de importação/segmentação, mas não substituem um exame 3DRA real. Uma integração só passa a “em uso” após registrar arquivo/versão/licença/hash, processamento, coordenadas, módulo consumidor e verificação reproduzível. Download, treino, inferência, registro no atlas e validação clínica devem ter estados separados.

## Atualização executada — comparador independente

A auditoria inicial acima descrevia a base ad5515d. Agora BRAVE-NET e VENAT estão efetivamente em uso como dados geométricos derivados na nova aba, sem integrar seus modelos de IA. Estados dos sete motores e dos três datasets CTA/DSCA/Mendeley não mudaram. Manifesto em `features/neuro3d/comparison/manifest.json`; licenças/atribuição em `public/neuro3d/comparison/NOTICE.md`; método e limitações em [relatório do lote](../neuro3d-independent-comparison.md). O download VENAT confere o SHA anterior, mas não houve nova leitura bem-sucedida da API de licença.

## Lote seccional — 21/10/2026

BRAVE e VENAT: agora também 21 planos originais selecionados por fonte, sem reamostragem/quantização, com hash por corte e affine em `comparison/sections.json`. Licenças/atribuição/modificações preservadas no NOTICE existente. Não houve nova aquisição de dados nem inferência de IA. Seio reto e contexto vêm dos GLBs originais da linhagem aberta já importada, com hashes conferidos; não foram substituídos por geometria próxima.
