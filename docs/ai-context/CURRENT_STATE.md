# Estado atual — hierarquia V2 e contexto motor

Última etapa: continuidade/limites descritos ao final deste documento e em ../neuro3d-contour-continuity-review.md. Base7b08047, continuation/contour-continuity. Conteúdo anterior abaixo permanece histórico, não estado de publicação deste lote.

# Estado verificável — testemunhos ósseos e proveniência

Atualizado21/10/2026. Base cc947c3e181816be6d91169ac0fcf616fe89dad5, árvore95dc5b46ea03853cf0df456cdeab90787e4bd23b, feature/neuro3d-atlas/PR2rascunho, VercelSUCCESS reconfirmado. Branchlocal continuation/skull-landmarks criada do remoto. O commit que contém este documento identifica o novo checkpoint; confirmar hash/árvore/deployment no fechamento. Original e cinco arquivos não rastreados preservados.

## Prioridade e autorização

Completude vascular Neuroangio é P0máximo: identidade/lado, ramos, trajeto, anastomoses e forames. Auditoria própria autorizada; evidência técnica não equivale a homologação anatômica. GS-CA/VOI preservado como apoio, sem cancelar demaisfrentes.

## Entrega atual

- Quatro testemunhos reais da borda do esfenoide, dois cortes Z29/30mm por lado, com triângulo/baricêntricas/hash/coordenadas. Contorno ósseo contém todo o perfil V2 nesses planos, sem cruzamento de arestas. Ponto da borda, não centro do nervo renomeado como forame. Nome do forame/túnel3D/passagem arterial seguem não certificados.
- Inspetor existente permite abrir esses pontos, campo60/20/10mm, mostrar perfis nativos e ponto de revisão no mesmo plano3D, exportar evidência. Não move malhas ou registra datasets. Destaque seccional somente no plano para o qual foi comprovado.
- Proveniência dirigida: seis nós vasculares (vidiana, lacrimal, meníngea média bilaterais) têm payload/transformações iguais à fonte fixa. Objetos são CURVE no vendor, não prova de segmentação clínica. Ramo esfenoidal tem três controles ilustrativos locais, não anastomose derivada de imagem.
- Foramen rotundum.j/ovale.j/spinosum.j/Pterygoid canal.j constam como MESH na auditoria, mas são skipped no relatório de exportação e não possuem nó no GLB esquelético. Startup.blend não executado. Nome/tipo de objeto não provam malha utilizável.
- Sete termos venosos mantidos sem correspondência geométrica, com substituições rejeitadas, motivos/fontes e exportação. Ausências bilaterais mostram agora o ID do lado correto. Não criadas geometrias ou identidades para zerar lacunas.

Ler [relatório atual](../neuro3d-skull-landmarks-review.md), [auditoria de fonte](../neuro3d-skull-source-audit.json) e ../../features/neuro3d/skull-landmark-evidence.json. Não refazer essas provas sem mudança/evidência nova.

## Entregas acumuladas e achados mantidos

Inspetor8contextos/26elos/31superfícies e plano3D entregues antes. Cortes originais/ilustrativos separados, GLBSHA e hashes canônicos conferidos; erro/retry/exportação mantidos. Limites inferiores: vidiana–ACI4,578mm e esfenoidal–lacrimal3,788mm nominais, bilaterais. Novos pontos V2 estão a aproximadamente22–23mm das superfícies ilustrativas dos ramos redondos; distância ponto→todas as faces, sem certificar que o ponto é o forame. Nenhuma ponte/deslocamento/renomeação realizada.

322exigências/612IDs esperados/592representados sem homologação,20sem geometria/373sem referência.1114importações originais/1112ativas,353reconstruções mantidas. Sete termos venosos adicionais não certificam exaustividade nem alteraram essas contagens. Galeno–seio reto e sete rótulos107,4,26b,70a,74a,114a,115a seguem sem comprovação.28faces degeneradas retinais e oito representações embrionárias adicionais históricas continuam pendentes.

## Próxima prova necessária

Continuidade3D e correspondência anatômica do contexto V2, antes de nomear o forame. V3: divisões mandibulares não provam todo o tronco pré-foraminal. Raiz motora do trigêmeo individual existe no manifesto; investigar como contexto adicional do oval, sem equiparar ao tronco sensitivoV3. Componentes ICAvidiana e meningo-lacrimal/recorrente ainda não individualizados de forma certificada. Não aproximar ramos ilustrativos da borda para eliminar medidas.

## Frentes preservadas e validação

42cortes/comparadorBRAVE-VENAT, vínculo físico e Anatria→Qbank do seio reto mantidos, espaços independentes. GS-CA dezcasos auditados; visorMHD/RAW/RAD/VOI pendente, dados locais restritos não redistribuídos. CTA complementar, limitescompressão/memória mantidos. Paciente3D DICOMreconstruído LPSmm, Doppler analítico, Mentice/VascularTwin, REA/Ankyras, embriologia/acessos/dispositivos mantidos; sem reconstruçãoXA ou recomendação clínica automática.

TypeScript,142unitários/36arquivos e build aprovados; auditorias dirigidas executadas, sem repetir592vasos. 40 casos únicos de navegador aprovados em11arquivos, desktop e Pixel7: rodada ampla38mais dois casos novos de reconciliação/exportação venosa. Repetições dirigidas não somadas. A versão final dos testes ósseos também confere o alvo da câmera no ponto de origem. Capturas nativas das bordas V2 e plano/ponto3D desktop/mobile inspecionadas; em primeira inspeção o ponto era pequeno na visão geral, e o foco da câmera foi ajustado sem mover anatomia. Não houve teste remoto de navegador. Aviso de chunks>500kB permanece. Preview autorizado sem merge/force, confirmar commit exato.


## 21/10/2026 — hierarquia, continuidade amostrada e limite motor

Base7b080470f0ca286700774110062a4d4d2a846a97, árvore5d81326afff7b6b6d289822f47506e1ee484fdce; remoto conferido, branchlocal continuation/contour-continuity. Fonte fixa e referenciais preservados. Ver ../neuro3d-contour-continuity-review.md e features/neuro3d/contour-continuity-evidence.json.

42novas secções V2:18/21contidas porlado, hierarquia pai/filho e orientação original oposta;17transições com triângulos ósseos compartilhados. Últimos3níveis não demonstram contenção. Esfenoide tem162bordas poríndices após excluir4faces degeneradas;32bordas permanecem na cópia diagnóstica de costuras, deslocamento0. Não certifica sólido/vazio/túnel/forame ou continuidade entre amostras. Raízes motoras482vértices/960faces porlado, segmentos curtos separados do esfenoide por≥12,143mm nominais segundo caixas; não são V3 sensitivo nem curso completo do oval.

Sete termos venosos confrontados com7192rótulos ingleses TA2 da fonte fixa (blob71bef934c23d207550ad1f318ec6edd8551cdba4): seis sem correspondência exata, braquial lexical rejeitado por território; grupo pontino genérico não individualiza canal transverso. IDs terminológicos não viram malhas. Zero novas geometrias/identidades aprovadas.20ausências/373lacunas, Galeno, sete rótulos e componentes ICAvidiana/meningo-lacrimal permanecem. Todas as frentesGS-CA/VOI/Paciente3D/Doppler/Mentice/VascularTwin/REA/Ankyras preservadas; dados restritos não redistribuídos.

PróximoP0: localizar32bordas abertas remanescentes e investigar transiçãoZ31,4→31,6 com contexto nativo/oblíquo e fonte óssea rotulada, sem reparar ou estender anatomia por inferência. Consultas bibliográficas não equivalem a ferramentas executadas. O commit que contém esta etapa identifica o novo checkpoint; confirmar hash/árvore/status remoto no fechamento.

Validação final desta etapa:146unitários/37arquivos,42casos únicos de navegador/12arquivos,TypeScript/build aprovados. Capturas desktop/mobile inspecionadas, origem/offset3D/exportação conferidos. Publicação será confirmada por hash/árvore/status exatos no fechamento e comprovante local. Sem validação clínica ou promoção de nomes anatômicos.
