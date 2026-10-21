# Decisões — histórico cumulativo

## 21/10/2026 — consolidação de decisões anteriores

Contexto: recuperação de conversa interrompida e múltiplas frentes. Estas decisões foram relatadas pelo usuário e confrontadas com os arquivos existentes; não representam nova homologação científica.

- Decisão: manter preview em `feature/neuro3d-atlas`, PR nº 2 em rascunho. Justificativa: permitir revisão sem merge em main. Impacto: checkpoints incrementais, sem force push.
- Decisão: referências reais em espaço próprio; não fundir por semelhança visual. Justificativa: registro espacial não demonstrado. Impacto: Galeno–seio reto, ramos e identidades ficam abertos.
- Decisão: vídeos Mentice primários para interação; Vascular Twin para fluxo Paciente 3D. Justificativa: solicitação explícita. Impacto: registrar tempos/hashes e limites; não copiar recursos proprietários.
- Decisão: primeiro dado do paciente é DICOM 3DRA. Justificativa: resposta expressa do usuário. Impacto: leitor atual aceita volume reconstruído suportado; projeções brutas precisam de cadeia distinta.
- Decisão: análise do Ankyras orienta contratos, não implementação dos corpos ausentes IL2CPP. Justificativa: inspeção REA encontrou dummy assemblies. Impacto: segmentação e medidas precisam de implementação verificável própria.
- Decisão: TCD original usado como referência estática, modelo analítico original no site. Justificativa: não foi recuperado motor comercial. Impacto: não declarar equivalência ou FFT real.

## 21/10/2026 — auditoria de fontes e continuidade V2.0

Contexto: usuário solicitou verificar sete links GitHub e três datasets e implementar o prompt mestre anexo.

Decisão: distinguir consulta, ferramenta offline preparada, dados inspecionados e integração em produção. Justificativa: referências em documentos não provam execução no site. Impacto: nenhum dos sete links é declarado motor integrado; VMTK é adaptação offline ainda sem morfometria validada, CTA tem apenas amostra examinada.

Decisão: `AGENTS.md` inicia sessões e `docs/ai-context/NEXT_SESSION.md` é a recuperação principal; manter relatórios anteriores. Justificativa: continuidade não pode depender do histórico integral da conversa ou memória interna. Impacto: atualizar estado, validação, roadmap, decisões e histórico em cada etapa significativa.

Decisão: anatomia 3D e angiografia precedem procedimentos avançados; atualizar prioridade do próximo lote antigo. Justificativa: prioridade permanente expressa no prompt anexo. Impacto: Paciente 3D/Doppler/Mentice/Ankyras permanecem na fila, sem apagar entregas, com dependências anatômicas explícitas.

Decisão: alinhar a nova branch local `continuation/ai-context` ao commit remoto `025ef13` antes deste lote documental. Justificativa: o commit local anterior `5a7171d` tem a mesma árvore do remoto, mas metadados diferentes por publicação via conector. Impacto: preservar ambas as branches, sem reescrever histórico; publicar apenas alterações documentais sobre o pai remoto confirmado.

## 21/10/2026 — comparador, geometria e evidência

Contexto: solicitação de avançar anatomia/angiografia a partir de ad5515d. Decisão: exibir BRAVE e VENAT em espaços nativos independentes, com fontes/affines/hashes e sem alinhamento visual implícito. Justificativa: dados de voluntário e média populacional não têm registro com o atlas. Impacto: referências auxiliam inspeção sem preencher identidades.

Decisão: simplificar cada componente separadamente e conferir contagem antes/depois. Justificativa: primeira tentativa global perdeu componentes e foi descartada. Impacto: todos os componentes finais preservados em contagem, sem garantir topologia, ramos finos ou calibre. Não usar derivados simplificados para medidas clínicas.

Decisão: registrar discrepância Galeno–seio reto por método explícito, sem corrigir coordenadas. Justificativa: eixo arbitrado e vértices de projeção simplificada não validam identidade/lúmen. Impacto: nota visível e pendência preservada. Sete rótulos de diagrama permanecem sem identificação comprovada.

Decisão: vistas exportadas exigem registro manual e incluem pose; carregar uma superfície não marca aprovação. Justificativa: inspeção de interface não equivale a validação anatômica.

## Lote seccional — 21/10/2026

Contexto: continuar de 2cd11d7 sem refazer comparador. Decisão: disponibilizar cortes selecionados completos em vez de interpolar/registrar volumes; manter float32 e contexto físico. Justificativa: validar cada valor nativo e evitar misturar máscara/PVF com intensidade radiológica. Impacto: sete planos por eixo, marcos manuais sem identidade homologada. Decisão: auditar todas as faces originais do seio reto e seus marcos de origem, sem aproximar Galeno; discrepância persiste e exige rastrear a linhagem da fonte. Decisão: conexão Vercel adicionada não substitui autorização ao time; não alterar permissões globais nem bloquear tarefas locais por erro 403.

## 21/10/2026 — fonte exata, vínculo físico e preview

Decisão: preservar a geometria do seio reto. A comparação executada confirma bytes da primitiva e TRS idênticos Anatria→Qbank; o desacordo não autoriza deformação. CURVE/TA2 são evidências de representação/nomenclatura, sem aprovação anatômica ou vínculo FMA presumido. Impacto: Galeno e sete identidades continuam abertos.

Decisão: corte/marcos/3D usam mesma affine e mesmo centro por fonte; sem snapping ou registro entre fontes. Sobreposição dourada continua visível sob oclusão com aviso explícito. Registro de vistas inclui linkedVisible, plano e marcos para interpretação reprodutível.

Decisão: aceitar screenshot Ready do usuário como evidência do preview 81f6799, sem declarar teste remoto executado. 403 é limitação de consulta ao time, não falha do deploy automático. Não reinstalar plugin/alterar permissões; deployment de cada novo hash deve ser verificado separadamente.

## Prioridade nova — 3D-2D-GS-CA para geometria

Usuário indicou explicitamente os onze ZIPs 3D-2D-GS-CA como referência geométrica preferencial. **Próximo lote geométrico deve começar por essa fonte**, antes de ampliar navegação BRAVE/VENAT; CTA é complementar. Auditoria offline dos10casos/20vistas e60coleções MGP concluída, hashes/CRC/bytes/finitude e projeção algébrica conferidos; três testes Python próprios aprovados. Não executou Matlab/MEX/MGP ou importação na UI. Volumes MHD/RAW e detector RAD/RAW estão em Sv/Sw mm, não DICOMLPS/RAS implícito. Report ../neuro3d-geometry-dataset-review.md; resultados ../neuro3d-gs-ca-geometry-audit.json.

Página BY-NC-ND e guia exige acordo/restringe distribuição; acordo existente não estabelecido. Dados/calibrações/pontos/código de fornecedor permanecem locais, sem redistribuição; preservar essa condição. Próxima etapa: leitor/visor local, VOI/ROI e contrato voxel→mm→detector verificável, sem sobrepor atlas ou reivindicar registro validado. Database_info.xls/ROIs e convenções visuais ainda precisam de verificação. CTA foi reconferido e3cortes reais foram rejeitados pelo leitor por JPEGsemperdas; série184 excede32milhões de voxels. Ver os dois novos relatórios CTA; não declarar integração.

## 21/10/2026 — completude máxima e auditoria própria autorizada

Decisão expressa do usuário: priorizar todas as artérias/veias Neuroangio e sua seleção vinculada, acima do visorGS-CA. Autorizou auditoria própria dos modelos criados e confronto com atlas. Incluiu ramos, curso, anastomoses e forames. Impacto: este lote executa auditoria por identidade; GS-CA não cancelado, mas visor ficou pendente por repriorização.

Decisão: não certificar anatomia pelo teste de existência, raycast ou menor distância. Registrar ramo/curso/anastomose separadamente e expor novas ausências. Justificativa: callbacks, topologia por índice e pais de estudo não provam patência nem correspondência individual em datasets não rotulados.

Decisão: malha original completa somente na seleção importada isolada2D, por ação explícita, com verificaçãoSHA e tratamento de falha. Geral/procedural mantidos. Justificativa: perdas mensuradas na projeção simplificada não devem ser apresentadas como detalhe original.

Decisão: identificar forames como registros bibliográficos/contexto enquanto não houver ponto/superfície própria comprovada. Não colocar marcador no centro de um nervo como se fosse forame. Registrar Vesálio como alternativa, C2/C4 separados, sem criar cadeia obrigatória entre variantes. Livro original consultado de forma dirigida, privado.

## 21/10/2026 — limites geométricos e cortes físicos das vias

Decisão: comparar superfícies das quatro vias sem alterar coordenadas. Distância amostrada é limite superior; caixas envolventes oferecem limite inferior. Quatro limites inferiores positivos comprovam separação do modelo, sem decidir qual identidade/canal é incorreto. Nenhuma ponte ou snap autorizado por esses números.

Decisão: o centro inicial dos cortes segue o ramo apenas para inspeção. Não é forame validado. Cortes e quadrado3D compartilham o mesmo referencial/offset em cm, fora do grupo de escala dos GLBs. Sobreposição explícita e removível não é canal, fluxo ou registro entre fontes.

Decisão: recuperar texto venoso por HTTP público após falha da ferramenta web, registrando método/URL correta/SHA e alcance dirigido. Não declarar figuras/vídeos revisados nem assimilar termos ausentes a canais próximos. Inventário20/373 continua explícito e não exaustivo.

## 21/10/2026 — testemunho ósseo não é centro do forame

Decisão: usar pontos reais na borda de triângulos originais, com baricêntricas/hash, e comprovar contenção integral do perfil neural em planos selecionados. Não exportar centroide do nervo como forame. Rejeitar componentes abertos/ramificados, auto-interseção e não coplanaridade; testar arestas além dos vértices. Impacto: evidência seccional verdadeira, nome anatômico/túnel3D/passagem arterial ainda não certificados.

Decisão: manter geometria dos seis vasos cuja primitiva/TRS coincide com a fonte. Rótulos .j de forames constam como MESH mas skipped e ausentes do GLB; não fabricar superfícies. Ramo esfenoidal tem controles autorais, não segmentação. Componentes específicos permanecem papéis não certificados, sem criar identidades para zerar lacunas.

Decisão: sete termos venosos sem correspondência explícita; rejeitar homônimos do braço, artéria tonsilar facial e substituições transverso→longitudinal. IDs ausentes já previstos são exibidos lateralizados sem alterar o inventário20/373.


## 21/10/2026 — hierarquia, continuidade amostrada e limite motor

Base7b080470f0ca286700774110062a4d4d2a846a97, árvore5d81326afff7b6b6d289822f47506e1ee484fdce; remoto conferido, branchlocal continuation/contour-continuity. Fonte fixa e referenciais preservados. Ver ../neuro3d-contour-continuity-review.md e features/neuro3d/contour-continuity-evidence.json.

42novas secções V2:18/21contidas porlado, hierarquia pai/filho e orientação original oposta;17transições com triângulos ósseos compartilhados. Últimos3níveis não demonstram contenção. Esfenoide tem162bordas poríndices após excluir4faces degeneradas;32bordas permanecem na cópia diagnóstica de costuras, deslocamento0. Não certifica sólido/vazio/túnel/forame ou continuidade entre amostras. Raízes motoras482vértices/960faces porlado, segmentos curtos separados do esfenoide por≥12,143mm nominais segundo caixas; não são V3 sensitivo nem curso completo do oval.

Sete termos venosos confrontados com7192rótulos ingleses TA2 da fonte fixa (blob71bef934c23d207550ad1f318ec6edd8551cdba4): seis sem correspondência exata, braquial lexical rejeitado por território; grupo pontino genérico não individualiza canal transverso. IDs terminológicos não viram malhas. Zero novas geometrias/identidades aprovadas.20ausências/373lacunas, Galeno, sete rótulos e componentes ICAvidiana/meningo-lacrimal permanecem. Todas as frentesGS-CA/VOI/Paciente3D/Doppler/Mentice/VascularTwin/REA/Ankyras preservadas; dados restritos não redistribuídos.

PróximoP0: localizar32bordas abertas remanescentes e investigar transiçãoZ31,4→31,6 com contexto nativo/oblíquo e fonte óssea rotulada, sem reparar ou estender anatomia por inferência. Consultas bibliográficas não equivalem a ferramentas executadas. O commit que contém esta etapa identifica o novo checkpoint; confirmar hash/árvore/status remoto no fechamento.


## 21/10/2026 — bordas localizadas e cortes oblíquos no atlas

Base97d2a9413bfdba1654d70fedcb02a10d84989580, continuation/skull-boundaries. Entrega e limites em ../neuro3d-skull-boundary-review.md; dados em features/neuro3d/skull-boundary-evidence.json e sphenoid-lineage-evidence.json.32arestas em2grupos16, origem/análise/exportação e sobreposição3D;4cortes oblíquos coincidentes; refinamento31,42→31,44mm. Esfenoide payload/ancestralidade iguais à fonte; defeitos não introduzidos pelo recorte. Não certifica forames/túneis; nenhuma geometria reparada ou vaso criado.

P0seguinte: voltar à completude vascular e fluxos de estudo, buscar fonte individual utilizável para20ausências venosas,373referências e7termos. Não repetir bordas/cortes/auditoria592sem nova evidência. Cadência pedida pelo usuário: lotes integrados e documentação concisa, sem uma etapa por microachado. Galeno/seteIDs/componentes e todas as frentes preservados. Hash do novo checkpoint será confirmado ao publicar, sem merge/force.
