# Validação do lote — 21/10/2026

- TypeScript: aprovado.
- Unitários: **117 testes em 26 arquivos**, aprovados.
- Build de produção: aprovado. Permanece o aviso de chunks acima de 500 kB.
- Navegador: **34 casos aprovados** em execução conjunta sobre build de produção, desktop/Pixel 7, cobrindo atlas, anastomoses, gate embrionário, descarte de quadro 2D antigo, famílias, simulação, bloqueio de injeção sem geometria, importação/exportação DICOM e roteiros de vídeo.
- Após acrescentar Doppler, **dois casos adicionais aprovados**, desktop/Pixel 7, cobrindo profundidade/sinal, aliasing, M-mode, congelamento/cursor e exportação. Paciente 3D e roteiro também tiveram repetições aprovadas no build atualizado; repetições não são somadas aos 36 casos únicos.
- Capturas Paciente 3D e Doppler inspecionadas. Renderização 3D local em Chrome/SwiftShader.

Dois testes antigos de simulação precisavam abrir o painel recolhido de assistência 3D antes de selecionar sua representação. Corrigido o fluxo dos testes e repetida a execução conjunta: todos os 34 casos passaram.

Uma primeira execução de desenvolvimento da importação DICOM foi reiniciada pela otimização tardia do Vite. As dependências do worker foram incluídas na pré-otimização e o caminho foi verificado também no build de produção. As falhas iniciais de seleção/formatação no teste de Doppler foram corrigidas antes da execução aprovada.

Dados DICOM de teste são sintéticos, incluindo volume oblíquo, pixels assinados e objeto 3DRA multiframe. Nenhum exame real foi fornecido/testado neste lote. Não houve validação clínica, aquisição DICOM de fabricante real, recomendação de tratamento ou aferição de precisão anatômica. A avaliação REA é estática e seus limites estão nos relatórios específicos.
