# Integração de anatomia aberta — 17/10/2026

## Resultado implementado

A rota `/#/tools/neuro3d` abre a aba **Anatomia detalhada** por padrão.
São 513 estruturas provenientes de malhas do atlas masculino distribuído
com Anatria3D: 128 artérias, 57 estruturas venosas, 38 ósseas, 50 nervos
cranianos e 240 estruturas encefálicas e dos órgãos dos sentidos.

As malhas mantêm os mesmos referenciais e transformações locais de origem.
A transformação de exibição é única para todos os sistemas: escala 100 e
translação Y −160, convertendo metros para unidades de exibição em centímetros.
Não se recentra cada osso ou vaso individualmente. Esse alinhamento é entre
assets do atlas, não registro de imagem de paciente.

Busca por inglês/latim, seleção por lista ou clique, foco da câmera,
isolamento, opacidade por camada, quatro vistas e cortes geométricos foram
implementados com código próprio. Cortes de malhas não são cortes de TC/RM.
Os cenários anteriores continuam na aba Atlas e a estação na aba Simulação.

## Repositórios examinados

| Repositório | Evidência inspecionada | Uso nesta revisão |
| --- | --- | --- |
| [thebuggeddev/anatomy](https://github.com/thebuggeddev/anatomy) | Árvore, README, `public/models/brain.glb` | Candidato de interface/órgão isolado. A árvore consultada não continha licença ou atribuição explícita para o modelo; nenhum arquivo incorporado. |
| [jixiangying/anatomy](https://github.com/jixiangying/anatomy) | README, nomenclatura JSON e árvore de OBJ BodyParts3D/ISA | Fonte alternativa de malhas. O README declara CC BY-SA 2.1 Japan nos dados e relata rótulos/classificação por IA e duplicatas. Nenhum código ou OBJ incorporado nesta revisão. |
| [Nurkan1/Anatria-3D](https://github.com/Nurkan1/Anatria-3D) | Licença, NOTICE, manifesto e GLBs masculinos; documentação de experimento de scanner | Fonte das malhas CC BY-SA 4.0 e do decodificador Draco Apache-2.0. O código do aplicativo tem BSL 1.1, separado dos assets; nenhum código do aplicativo foi copiado. |
| [huang-sir1/radiology-skills](https://github.com/huang-sir1/radiology-skills) | `radiology-annotation/SKILL.md` e `references/mask-geometry.md` | Referência metodológica para identidade de imagem, origem, orientação, escala, transformações e QC. Não é um reconstrutor de vasos nem um modelo de visão executado. |

## Importação reproduzível e direitos dos assets

`tools/neuro3d/import_open_anatomy.py` recebe um checkout do Anatria3D.
O commit de origem está em `features/neuro3d/open-anatomy.json`, junto de
hashes dos arquivos originais e dos recortes, limites por estrutura e licença.
O script copia os buffers Draco selecionados, sem descompressão/recompressão,
preserva transforms e acrescenta identificador estável por nó.

Seleção: estruturas dos caminhos de crânio, mandíbula e vértebras cervicais;
encéfalo, nervos cranianos e órgãos dos sentidos; estruturas cardiovasculares
com máximo Y ≥ 1,48 m e mínimo Y ≥ 1,20 m no atlas. Este último filtro espacial
é um recorte documentado, não uma ontologia completa de neurovasculatura.
Não fundir essa malha com os cenários esquemáticos através de escala visual.

Os três GLBs derivados e os rótulos derivados ficam sob **CC BY-SA 4.0**.
Créditos preservados: BodyParts3D/DBCLS → Z-Anatomy → Anatria3D → QBank-Neuro.
`public/neuro3d/open-anatomy/NOTICE` descreve alterações e atribuição; o crédito
fica visível no atlas. O decoder inclui LICENSE Apache-2.0 e NOTICE próprios.

## Formação da imagem da estação

O incremento de superfícies da estação, iniciado antes desta importação,
substitui o saco esférico por uma superfície ilustrativa assimétrica com colo.
Sua malha também entra na projeção de espessura, em conjunto com os vasos.
O integrador ortográfico soma profundidades orientadas de triângulos fechados;
a opacidade relativa deriva de uma exponencial de atenuação. Máscaras de
roadmap preservam projeção, oclusão e dilatação capturadas.

Isso é um modelo gráfico relativo, sem calibração de raios X, espectro,
espalhamento, aquisição logarítmica DSA, pressão ou CFD. Vasos são componentes
superpostos, sem união volumétrica de bifurcações. O fundo ósseo da estação
ainda é esquemático. **As novas 513 malhas não foram ligadas à mecânica da
estação**, pois isso exige extrair/revisar luzes, eixos e conexões em um único
referencial. Preservar essa distinção evita exibir instrumentos em anatomia
desalinhada.

## Referências dirigidas de anatomia e patologia

- Borden, *3D Angiographic Atlas*, Fig. 5.14, página impressa 117
  (PDF 129): revisão visual e de legenda de aneurisma multilobulado em
  várias projeções. Não se reproduziu a imagem ou o paciente na geometria.
- Krings et al., *Neurovascular Anatomy in Interventional Neuroradiology*,
  caso 6, Fig. 6.1, páginas 27–28 (PDF 41–42): revisão de anéis durais,
  carotid cave e correlação multimodal. As relações osteodurais finas ainda
  não foram reconstruídas/validadas na nova base.
- Neuroangio, [ACI](https://neuroangio.org/anatomy-and-variants/internal-carotid-artery-and-its-aneurysms/)
  e [oftálmica](https://neuroangio.org/anatomy-and-variants/ophthalmic-artery/):
  consulta dirigida de texto. Não confundir leitura textual com revisão de
  todas as imagens dessas páginas.

Os PDFs e figuras de consulta permanecem privados, fora do repositório.

## Limites e próxima integração

513 estruturas não equivalem à lista anatômica obrigatória completa. Rótulos
de origem continuam pendentes de revisão; resoluções e detalhes variam.
Confirmar cobertura de perfurantes, ramos orbitários/petrocavernosos, anéis
durais, anastomoses e vasos medulares antes de declarar completude.

Para correlacionar imagens radiológicas: registrar por imagem a identidade,
projeção, modalidade/fase, orientação e escala conhecida ou desconhecida;
usar pontos anatômicos verificáveis e transformações documentadas. Não
inferir um espaço comum apenas de aparência semelhante. Mostrar sobreposição
somente após conferir a transformação e os marcos em múltiplas vistas.

Não houve merge em main nem produção nesta revisão.
