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
