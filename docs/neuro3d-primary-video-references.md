# Referências primárias de interação — 21/10/2026

O usuário definiu os três vídeos Mentice como referência primária para criar/modificar o simulador e o Vascular Twin para a nova aba Paciente 3D. Primeiro formato confirmado: **DICOM de angiografia rotacional 3D**. Trabalhar em lotes grandes e sempre entregar um prompt de continuação ao concluir uma etapa.

Os arquivos foram lidos localmente, identificados por SHA-256 e inspecionados em dez quadros distribuídos por vídeo. Isso é inspeção amostrada, não transcrição integral nem revisão quadro a quadro. Não foram incorporados MP4 ou imagens extraídas ao site/repositório público. Originais em `E:/Downloads/`; os contatos de inspeção permanecem nos artefatos locais da tarefa.

| Arquivo | Duração | SHA-256 |
|---|---:|---|
| Mentice-Neurovascular-Brain-SnapYT.App.mp4 | 440,97 s | 042326a3680c84eb2d6bf6d32a599510c694a3520792d13a23cf8c4b8a4972f2 |
| Mentice-Neurovascular-Thrombectomy-SnapYT.App (1).mp4 | 1338,58 s | 47ddc025a3a3d338a24304169c7a2ce539810e2fdf302c495f685237b796dc62 |
| Mentice-Neurovascular-Thrombectomy-SnapYT.App.mp4 | 133,45 s | d0b0cf429f069a294d7b329e853be18d1524ff45c0d3c4c83c2fab322d9a8b16 |
| Vascular-Twin-Neuro-SnapYT.App.mp4 | 444,01 s | cb6c46cf8716caffbb72280eb0c05ee54c28069dc4e21820f7d23d85c95f13a7 |

## Observações e implementação

- Brain: injeção de teste (~0:53), roadmap (~2:21), 3DRA/medidas (~3:49), ferramentas e suporte (~4:33), coils (~5:17–6:46).
- Trombectomia longa: arco/multipropósito (~2:40), seleção carotídea/roadmap (~4:54), sistema com balão-guia (~9:22), troca para retriever (~13:49), retirada do sistema (~16:03), controle (~18:17), retirada final (~20:31).
- Trombectomia curta: variações de arco (~0:43), orientação por fases (~1:23–1:36), avaliações/benchmarks (~1:09). Os benchmarks do produto comercial não foram transferidos como critérios validados.
- Vascular Twin: limiar (~1:38), comparação dos dados/segmentação (~2:22), transformação/conexão com anatomia-base (~4:35–5:20), edição/reset de conexão (~6:04), simulação (~6:48).

Implementado: monitor principal único por padrão, biplano opcional; roteiro navegável de cinco fases para aneurisma e seis para trombectomia, com observação, tempo da fonte e disponibilidade real no modelo. Navegar pelas fases não executa ações ou certifica desempenho. Exportação de sessões registra os vídeos por hash.

Não implementados: aquisição 3DRA volumétrica simulada, medidas calibradas do aneurisma no simulador, park balloon, troca física automática guia/retriever, balão proximal independente, mecânica específica dos dispositivos ou classificação clínica de reperfusão.

No modo Paciente 3D, a geometria deve vir do exame. Conectar uma região do paciente a um template, como aparece no vídeo, não equivale a reconstruir toda a anatomia desse paciente. Esta versão não preenche ausências com vasos do atlas.
