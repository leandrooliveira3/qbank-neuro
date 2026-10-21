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
