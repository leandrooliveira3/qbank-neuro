# Qbank-neuro 3D — visão permanente

Atualizado em 21/10/2026. Repositório: https://github.com/leandrooliveira3/qbank-neuro. Continuidade imediata: [NEXT_SESSION](NEXT_SESSION.md).

## Objetivo e escopo

Portal de estudo neurovascular com atlas tridimensional, angiografia vinculada, simulação didática endovascular, laboratório de Doppler transcraniano e aba Paciente 3D. O objetivo futuro de estudo individual e comparação de dispositivos/técnicas exige geometria revisada e validação própria; não foi entregue um sistema de decisão clínica.

Prioridade permanente confirmada pelo usuário: concluir e validar anatomia e angiografia antes de priorizar procedimentos avançados. Abranger circulação arterial/venosa cerebral, cervical e arco aórtico; Bouthillier; relações descritas por Lasjaunias; variantes/embriologia; osso, nervos e relações relevantes. Preservar inventário explícito de estruturas ausentes.

Manter planejamento de acessos radial/femoral, arcos I/II/III, cateteres, fios, stents, balões, patologias e casos. Inventário/catalogação não comprovam mecânica, topologia ou eficácia terapêutica.

## Requisitos confirmados pelo usuário

- Etapas longas: implementar, revisar, testar, documentar e publicar preview verificável; sempre entregar próximo prompt pronto.
- Quatro vídeos locais (três Mentice e um Vascular Twin) como referências primárias de interação, preservando proveniência.
- Entrada inicial de Paciente 3D: DICOM de angiografia rotacional 3D. Diferenciar volume reconstruído de projeções XA brutas.
- Doppler em aba própria, baseado na avaliação REA do TCD Simulator.
- Avaliação REA do Ankyras para orientar segmentação, linha central, marcos e medidas, sem inventar algoritmos ausentes dos stubs.
- Auditoria de uso real dos sete links GitHub e três datasets em [REFERENCES](REFERENCES.md).
- Protocolo de continuidade no próprio GitHub, iniciado por AGENTS.md e NEXT_SESSION.

## Tecnologias e critérios de qualidade

React 19, TypeScript 5.8, Vite 6, Three.js/React Three Fiber/Drei, dicom-parser, workers; Vitest e Playwright. O portal também declara Supabase e Google GenAI; não inferir seu uso no fluxo local de DICOM. Infraestrutura de preview: Vercel; PR nº 2 continua rascunho.

Qualidade: coordenadas físicas e escalas explícitas, hashes/licenças/atribuição, erros recuperáveis, descarte de respostas assíncronas obsoletas, testes relevantes e inspeção visual. Separar superfície ilustrativa, malha importada e exame de paciente. Não completar dados ausentes com templates silenciosos. Validação funcional não equivale a validação anatômica, científica ou clínica.

Complete Anatomy, IMAIOS, Mentice e Ankyras são referências de estudo; não presumir autorização para redistribuir seus recursos. Os materiais sincronizados em `sources/` permanecem somente leitura. Histórico técnico anterior permanece em `docs/neuro3d-*.md`.

## Progresso de fontes reais

Comparador independente BRAVE-NET/VENAT implementado em aba própria. São superfícies derivadas com proveniência e coordenadas nativas, não inferência de IA nem registro paciente/atlas. A revisão anatômica continua requisito de conclusão.

## Lote seccional — 21/10/2026

Inspeção seccional acrescentada ao comparador existente: 42 planos nativos BRAVE/VENAT e marcos manuais em RAS/mm, sem registro ao atlas ou aprovação automática.

## Vínculos físicos e evidência de origem

Mesma fonte: corte/marco/superfície compartilham affine e transformação; clique 3D retorna ao plano, exportação conserva estado e visibilidade. Linhagem Anatria→Qbank do seio reto tem primitiva/transformações idênticas; vendor registra CURVE antes de mesh. Identidade por objeto em BodyParts3D/FMA e relação com Galeno continuam sem comprovação. Preview 81f6799 Ready comprovado por screenshot, sem depender da consulta Vercel 403. Relatório: ../neuro3d-linked-reference-lineage.md.

## Prioridade nova — 3D-2D-GS-CA para geometria

Usuário indicou explicitamente os onze ZIPs 3D-2D-GS-CA como referência geométrica preferencial. **Próximo lote geométrico deve começar por essa fonte**, antes de ampliar navegação BRAVE/VENAT; CTA é complementar. Auditoria offline dos10casos/20vistas e60coleções MGP concluída, hashes/CRC/bytes/finitude e projeção algébrica conferidos; três testes Python próprios aprovados. Não executou Matlab/MEX/MGP ou importação na UI. Volumes MHD/RAW e detector RAD/RAW estão em Sv/Sw mm, não DICOMLPS/RAS implícito. Report ../neuro3d-geometry-dataset-review.md; resultados ../neuro3d-gs-ca-geometry-audit.json.

Página BY-NC-ND e guia exige acordo/restringe distribuição; acordo existente não estabelecido. Dados/calibrações/pontos/código de fornecedor permanecem locais, sem redistribuição; preservar essa condição. Próxima etapa: leitor/visor local, VOI/ROI e contrato voxel→mm→detector verificável, sem sobrepor atlas ou reivindicar registro validado. Database_info.xls/ROIs e convenções visuais ainda precisam de verificação. CTA foi reconferido e3cortes reais foram rejeitados pelo leitor por JPEGsemperdas; série184 excede32milhões de voxels. Ver os dois novos relatórios CTA; não declarar integração.

## Prioridade expressa vigente — completude Neuroangio

Usuário elevou completude arterial/venosa clicável no atlas3D/angiografia à prioridade máxima, autorizou auditoria própria e exigiu conferir ramos, curso, anastomoses e forames com Neuroangio/Lasjaunias. O visorGS-CA continua preservado como apoio, após essa prioridade. Novo lote entregou índice/revelação, original2Disolada, auditoria592vasos e nove passagens bibliográficas com contexto. Atlas não declarado completo;20IDs sem geometria e373sem referência, além das identidades anteriores. Relatório:../neuro3d-neuroangio-priority-review.md.

## Vias físicas e consulta venosa recuperada

Inspetor dirigido das quatro vias prioritárias, bilateral, com cortes de malhas originais, plano3D coincidente e evidência exportável.31superfícies/26elos auditados; quatro separações comprovadas no modelo não foram corrigidas artificialmente. Três capítulos venosos com texto dirigido recuperado e seleção por lado. Forames, ramos/curso/lúmen e atlas completo ainda não certificados. Ler ../neuro3d-passage-geometry-review.md.

## Bordas do esfenoide, origem dos modelos e termos venosos

Quatro pontos reais em triângulos do esfenoide e contenção do perfil V2 em quatro planos, com evidência exportável e campo de detalhe. Não certificados nomes de forames/túneis3D. Proveniência de seis vasos conferida; quatro rótulos ósseos são skipped na fonte e ramo esfenoidal é ilustrativo. Sete termos venosos sem correspondência foram explicitados. Relatório:../neuro3d-skull-landmarks-review.md. P0 anatômico e todas as frentes mantidos.


## 21/10/2026 — hierarquia, continuidade amostrada e limite motor

Base7b080470f0ca286700774110062a4d4d2a846a97, árvore5d81326afff7b6b6d289822f47506e1ee484fdce; remoto conferido, branchlocal continuation/contour-continuity. Fonte fixa e referenciais preservados. Ver ../neuro3d-contour-continuity-review.md e features/neuro3d/contour-continuity-evidence.json.

42novas secções V2:18/21contidas porlado, hierarquia pai/filho e orientação original oposta;17transições com triângulos ósseos compartilhados. Últimos3níveis não demonstram contenção. Esfenoide tem162bordas poríndices após excluir4faces degeneradas;32bordas permanecem na cópia diagnóstica de costuras, deslocamento0. Não certifica sólido/vazio/túnel/forame ou continuidade entre amostras. Raízes motoras482vértices/960faces porlado, segmentos curtos separados do esfenoide por≥12,143mm nominais segundo caixas; não são V3 sensitivo nem curso completo do oval.

Sete termos venosos confrontados com7192rótulos ingleses TA2 da fonte fixa (blob71bef934c23d207550ad1f318ec6edd8551cdba4): seis sem correspondência exata, braquial lexical rejeitado por território; grupo pontino genérico não individualiza canal transverso. IDs terminológicos não viram malhas. Zero novas geometrias/identidades aprovadas.20ausências/373lacunas, Galeno, sete rótulos e componentes ICAvidiana/meningo-lacrimal permanecem. Todas as frentesGS-CA/VOI/Paciente3D/Doppler/Mentice/VascularTwin/REA/Ankyras preservadas; dados restritos não redistribuídos.

PróximoP0: localizar32bordas abertas remanescentes e investigar transiçãoZ31,4→31,6 com contexto nativo/oblíquo e fonte óssea rotulada, sem reparar ou estender anatomia por inferência. Consultas bibliográficas não equivalem a ferramentas executadas. O commit que contém esta etapa identifica o novo checkpoint; confirmar hash/árvore/status remoto no fechamento.

Validação final desta etapa:146unitários/37arquivos,42casos únicos de navegador/12arquivos,TypeScript/build aprovados. Capturas desktop/mobile inspecionadas, origem/offset3D/exportação conferidos. Publicação será confirmada por hash/árvore/status exatos no fechamento e comprovante local. Sem validação clínica ou promoção de nomes anatômicos.


## 21/10/2026 — bordas localizadas e cortes oblíquos no atlas

Base97d2a9413bfdba1654d70fedcb02a10d84989580, continuation/skull-boundaries. Entrega e limites em ../neuro3d-skull-boundary-review.md; dados em features/neuro3d/skull-boundary-evidence.json e sphenoid-lineage-evidence.json.32arestas em2grupos16, origem/análise/exportação e sobreposição3D;4cortes oblíquos coincidentes; refinamento31,42→31,44mm. Esfenoide payload/ancestralidade iguais à fonte; defeitos não introduzidos pelo recorte. Não certifica forames/túneis; nenhuma geometria reparada ou vaso criado.

P0seguinte: voltar à completude vascular e fluxos de estudo, buscar fonte individual utilizável para20ausências venosas,373referências e7termos. Não repetir bordas/cortes/auditoria592sem nova evidência. Cadência pedida pelo usuário: lotes integrados e documentação concisa, sem uma etapa por microachado. Galeno/seteIDs/componentes e todas as frentes preservados. Hash do novo checkpoint será confirmado ao publicar, sem merge/force.


## 22/10/2026 — visor GS-CA local e vínculo físico entregue

Basef7a04e68f67b8e25f2155acadd554360ba2ec80e; continuation/gs-ca-workspace. AbaGeometria3D–2D comMHD/RAWsigned16, RAD/RAWfloat32, cortes3eixos/janelas, VOI/ROImanuais, alvosSvfracionários, projeçãoSw→detector e cliqueinverso nocorte, cena3Dcaixa/raio eexportação local. Sem envio/registro noatlas/segmentaçãoclínica. Leia ../neuro3d-gs-ca-viewer.md e agregado devalidação.

153unitários/39arquivos,24casos únicos denavegador/7arquivos,TypeScript/build aprovados; ensaioUIrealcaso1:4projeções×2alvos/3eixos,5hashesRAW iguais à auditoriaanterior,0erros/0nãoGET. Capturas privadas. Precisãoderegistro permanecefalse; não refeitos10casos/592vasos/bordas. TopBrainapenasconsultado, rótulospublicados não individualizam20ausências ou7termos; nenhumdownload/execução/importação.20/373/Galeno/seteIDs/componentes e demaisfrentes mantidos.

PróximoP0: geometria local útil para estudo vascular (VOI/ROI com metadados verificados, isosuperfície/segmentaçãoemSw ou conferência quantitativa de alvos observados). ZIP/XLS automáticos pendentes; não repetir auditoriasprontas. Checkpoint será confirmado porhash/árvore/deployment exatos, sem merge/force.


## 22/10/2026 — estudo vascular local

Etapa seguinte à aba GS-CA: recortes JSON próprios conferidos, prévia Sw e contornos coincidentes entregues; leia neuro3d-gs-ca-study.md. XLS/ZIP originais e validação de segmentação/registro seguem pendentes; anatomia mantém20/373/setetermos/Galeno e demais restrições.


## 22/10/2026 — XLS e componentes

Entregues XLSoriginal porhash/caso, componentes geométricos selecionáveis e recorte nativo passo1 comrestauração; consulte neuro3d-gs-ca-components.md. ZIPautomático e completude anatômica seguempendentes; não repetir estes recursos no próximo lote.


## 22/10/2026 — revisão pessoal e fontes

Revisão pessoalGSCA comJSONvinculado a fonte/malha/parametrização entregue; fontes do novo anexo12avaliadas e catalogadas. Leia neuro3d-gs-ca-review-notes.md e neuro3d-additional-databases.md. Completude20/373/setetermos permanece sem geometria adicional comprovada.


## 22/10/2026 — ZIP local e busca tentorial dirigida

ZIP local GS-CA concluído em lote integrado; referência de implementação/validação em ../neuro3d-gs-ca-zip.md. Anatomia continua P0 com 20/373/sete sem redução. Suplemento tentorial humano concreto catalogado, porém sem licença/segmentações comprovadas. Outras frentes e referenciais preservados.
