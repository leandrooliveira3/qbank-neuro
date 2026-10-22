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

## Linhagem consultada e auditor executado neste lote

Anatria-3D fixado em6320bd64df8db2fcfed358a27c85d1fcc1c5913c: manifesto, GLB cardiovascular, NOTICE, pipeline, vendor audit/report e TA2 consultados. URLs/tamanhos/SHA em ../neuro3d-sinus-lineage-audit.json. Ferramenta própria audit_sinus_lineage.py efetivamente executada: primitiva/transformações iguais ao recorte Qbank. Pipeline Blender/exportador upstream foi somente lido; Blender/Startup.blend não executado/inspecionado. CC BY-SA 4.0 preservada; NOTICE atribui Z-Anatomy/BodyParts3D, mas não foi estabelecido ID FMA por objeto. CURVE na auditoria, nome TA2 e hash não aprovam identidade anatômica.

BRAVE/VENAT continuam efetivamente em uso como dados, agora com vínculos físicos da mesma fonte; modelos de IA continuam não executados. Demais sete motores e fontes CTA não passam automaticamente a integrados.

## Prioridade nova — 3D-2D-GS-CA para geometria

Usuário indicou explicitamente os onze ZIPs 3D-2D-GS-CA como referência geométrica preferencial. **Próximo lote geométrico deve começar por essa fonte**, antes de ampliar navegação BRAVE/VENAT; CTA é complementar. Auditoria offline dos10casos/20vistas e60coleções MGP concluída, hashes/CRC/bytes/finitude e projeção algébrica conferidos; três testes Python próprios aprovados. Não executou Matlab/MEX/MGP ou importação na UI. Volumes MHD/RAW e detector RAD/RAW estão em Sv/Sw mm, não DICOMLPS/RAS implícito. Report ../neuro3d-geometry-dataset-review.md; resultados ../neuro3d-gs-ca-geometry-audit.json.

Página BY-NC-ND e guia exige acordo/restringe distribuição; acordo existente não estabelecido. Dados/calibrações/pontos/código de fornecedor permanecem locais, sem redistribuição; preservar essa condição. Próxima etapa: leitor/visor local, VOI/ROI e contrato voxel→mm→detector verificável, sem sobrepor atlas ou reivindicar registro validado. Database_info.xls/ROIs e convenções visuais ainda precisam de verificação. CTA foi reconferido e3cortes reais foram rejeitados pelo leitor por JPEGsemperdas; série184 excede32milhões de voxels. Ver os dois novos relatórios CTA; não declarar integração.

## Auditoria Neuroangio e Lasjaunias deste lote

Páginas dos diagramas, índice venoso, superficial, profundo e Rosenthal consultadas. Dez canais venosos explicitados em neuroangioRequirements.ts; sem curvas inventadas. Alguns capítulos venosos falharam nesta leitura; estados documentados. ILT, oftálmica antiga e colaterais Neuroangio consultados para as passagens. Artigos primários Lasjaunias/Moret/Mink1977 PMID876454 e Lasjaunias/Théron1976 PMID959564: resumos consultados, sem alegar texto integral.

Livro local original Lasjaunias/Berenstein/terBrugge2001,789páginas PDF, SHA421e89836286424a9642a4442d7cd218be333d8a911004032775e720ff97d327. Busca automática por palavras e leitura dirigida das páginasPDF293,317,322,437,475,490 (impressas273,297,302,418,456,471). Três páginas renderizadas/inspecionadas; livro/figuras não redistribuídos. Evidência/limites e referências exatas no relatório ../neuro3d-neuroangio-priority-review.md.

Executado: auditor próprio592vasos com GLBsDraco/12SHA, superfícies de projeção,353comparações a pais e3552raycasts isolados. Original2Disolada usa o mesmo GLB no navegador. Não executou MGP/Matlab, IA dos sete repositórios ou transferência de rótulos BRAVE/VENAT/GS-CA ao atlas. Fontes continuam sem registro entre referenciais.

Planilha database_info.xls dos anexosGS-CA foi lida localmente com xlrd2.0.2 em ambiente temporário, sem dependência do site. VOI/ROI são índiceszero; regiões não redistribuídas. Leitura não equivale à implementação do visor ou validação visual de dadosGS-CA.

## Fontes efetivamente reconsultadas no lote de vias

- Três GLBs locais CC-BY-SA-4.0 foram efetivamente decodificados e conferidos: cardiovascular_head.glb, landmarks_bone.glb, nervous_head.glb.31superfícies/26elos, sem novos dados restritos. Fonte Anatria fixa6320bd64df8db2fcfed358a27c85d1fcc1c5913c e atribuição BodyParts3D/DBCLS→Z-Anatomy→Anatria→Qbank preservadas. Hashes completos em ../../features/neuro3d/passage-geometry-audit.json.
- ILT Neuroangio reaberto pela ferramenta web; textos privados de Lasjaunias PDF322/437/475 reconsultados, mesmos trechos dirigidos da etapa anterior, sem nova leitura integral/redistribuição.
- https://neuroangio.org/venous-brain-anatomy/venous-sinuses/ e /internal-cerebral-vein/ recuperados por HTTP público/Python após falha web; /veins-posterior-fossa/ é a URL correta do índice. Revisão textual dirigida; hashes e método em ../neuro3d-passage-geometry-review.md e neuroangioRequirements.ts. Não assistidos vídeos ou todas as figuras.
- Ferramentas realmente executadas: sourceSurfaceReader/Draco, audit_passage_geometry próprio, interseção/medidas próprias, worker do navegador, Vitest/TypeScript/Vite/Playwright. Não executados VMTK, MEX/MGP, IAsegmentação, REA novo ou reconstrução3DRA neste lote. Datasets independentes e livro preservados.

## Fontes conferidas neste lote de bordas/proveniência

Original Anatria6320bd64df8db2fcfed358a27c85d1fcc1c5913c: skeletal_male.glb e vendor/reports/skeletal.json recuperados por HTTP fixo, SHA/tamanho conferidos contra o upstream já usado. Cardinalidade MESH no vendor não significa geometria: quatro rótulos de forames estão skipped/sem nó GLB. Cardiovascular original/cache confrontado com seis nós do recorte: payload/TRS/pais/atributos iguais, CURVE→mesh segundo fonte. Startup.blend não executado. Hashes em ../neuro3d-skull-source-audit.json.

Neuroangio mandibulovidian-artery e ophthalmic-artery-old efetivamente abertos; texto Lasjaunias PDF322/p302 reconsultado e referências dirigidas anteriores mantidas. Sem figuras/trechos extensos redistribuídos. Textos venosos em cache sustentam os sete termos; manifesto Anatria consultado para rejeitar homônimos braquiais/antebraquiais do membro superior. Não transferiu rótulos de datasets ou executou reconstrução/IA/REA novo.

Ferramentas realmente executadas: read_source_surface/Draco, audit_skull_source.py, audit_skull_landmarks.ts próprios, scan exploratório de contornos no cache privado, Vitest/TypeScript/Vite/Playwright.31superfícies/26elos e auditoria592não refeitos. Recursos ósseos do atlas CC-BY-SA, coord/hashes/atribuição preservados; nenhum asset clínico restrito adicionado.


## 21/10/2026 — hierarquia, continuidade amostrada e limite motor

Base7b080470f0ca286700774110062a4d4d2a846a97, árvore5d81326afff7b6b6d289822f47506e1ee484fdce; remoto conferido, branchlocal continuation/contour-continuity. Fonte fixa e referenciais preservados. Ver ../neuro3d-contour-continuity-review.md e features/neuro3d/contour-continuity-evidence.json.

42novas secções V2:18/21contidas porlado, hierarquia pai/filho e orientação original oposta;17transições com triângulos ósseos compartilhados. Últimos3níveis não demonstram contenção. Esfenoide tem162bordas poríndices após excluir4faces degeneradas;32bordas permanecem na cópia diagnóstica de costuras, deslocamento0. Não certifica sólido/vazio/túnel/forame ou continuidade entre amostras. Raízes motoras482vértices/960faces porlado, segmentos curtos separados do esfenoide por≥12,143mm nominais segundo caixas; não são V3 sensitivo nem curso completo do oval.

Sete termos venosos confrontados com7192rótulos ingleses TA2 da fonte fixa (blob71bef934c23d207550ad1f318ec6edd8551cdba4): seis sem correspondência exata, braquial lexical rejeitado por território; grupo pontino genérico não individualiza canal transverso. IDs terminológicos não viram malhas. Zero novas geometrias/identidades aprovadas.20ausências/373lacunas, Galeno, sete rótulos e componentes ICAvidiana/meningo-lacrimal permanecem. Todas as frentesGS-CA/VOI/Paciente3D/Doppler/Mentice/VascularTwin/REA/Ankyras preservadas; dados restritos não redistribuídos.

PróximoP0: localizar32bordas abertas remanescentes e investigar transiçãoZ31,4→31,6 com contexto nativo/oblíquo e fonte óssea rotulada, sem reparar ou estender anatomia por inferência. Consultas bibliográficas não equivalem a ferramentas executadas. O commit que contém esta etapa identifica o novo checkpoint; confirmar hash/árvore/status remoto no fechamento.

Neuroangio ILT efetivamente reaberto pela ferramenta web; fossa posterior expirou e consulta dirigida usou cache textual anterior. Lasjaunias437/p418 legenda5.25 reconsultada por texto privado, sem nova inspeção integral de imagens. CSV TA2 de tools/asset-pipeline/vendor/TA2.csv da fonte6320bd64, hashGit conferido; não equivale a executar o software Anatria. Executados os dois auditores novos, Draco/leitor, matemática própria e verificações locais; demais ferramentas/datasets permanecem preservados, não reexecutados.


## Bordas do esfenoide

FonteAnatria fixa6320bd64, skeletal_male.glb já recuperado/hashes do manifesto conferidos. Comparação dirigida Sphenoid bone: payload/atributos e ancestralidade inteira iguais ao landmarks_bone.glb. Relatório sphenoid-lineage-evidence.json; auditoria do seio reto não reexecutada (apenas helpers importados sem main). NeuroangioILT reaberto; Lasjaunias437/p418 legenda5.25 reconsultada por texto privado. Não são coordenadas anatômicas dos grafos. Ferramentas próprias executadas listadas no relatório, demais frentes somente preservadas.


## 22/10/2026 — GS-CA local/TopBrain

PáginaGS-CA primária reaberta; arquivoslocais jáauditados utilizados pelaUIrealcaso1, não reauditados10casos. CódigoMatlab/MEX/C++/MGP dofornecedor não executado. Somente agregados novos e código próprio publicados; políticaBY-NC-ND/condiçõesdoguia mantida. TopBrainpágina primária viabuscaindexada, direta403: rótulosvenosos/termos consultados, nenhumdownload ou execução. Candidato não fornece correspondência para20IDs/7termos. Ver ../neuro3d-venous-source-candidates.json e ../neuro3d-gs-ca-viewer-validation.json. Pesquisa porcaudado/interpeduncular retornou também estruturas não vasculares, descartadas; não contarfontes irrelevantes como integração.


## 22/10/2026 — estudo vascular local

Lote22/10: fonte/guia GS-CA previamente consultados continuam referenciados em neuro3d-geometry-dataset-review.md; neste lote arquivos ZIP apenas inventariados e casos locais lidos por ferramenta própria. MarchingCubes do Three.js instalado foi inspecionado/executado sob MIT; sem nova dependência. Nenhum Matlab/MEX/C++ do fornecedor executado, nenhum novo dataset/atlas importado. Ver neuro3d-gs-ca-study.md.


## 22/10/2026 — XLS e componentes

Guia GS-CA seção3.5pp8–9 reaberto e nota de índiceszero/inclusivos confirmada; XLS original lido por xlrd privado e adapter SheetJS. Dez abas com limites iguais; hashes dos pequenos cabeçalhos originais adicionados ao contrato, volumes não reauditados. Documentação oficial SheetJS (instalaçãoNode/formulae) e Viteworker.format consultada; SheetJSCE0.20.3Apache2.0 fixado viaCDNoficial comintegridade no lockfile. Dois scriptsMatlab de resultados apenaslidos, jamaisexecutados. Nenhuma nova fonte venosa importada. Ver ../neuro3d-gs-ca-components.md.
