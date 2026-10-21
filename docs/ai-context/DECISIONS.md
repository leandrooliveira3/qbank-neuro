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
