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
