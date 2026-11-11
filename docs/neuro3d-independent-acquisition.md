# Inspeção independente e vistas de aquisição — 11/11/2026

Base: `29bc66e70f3144c18840eb336711b6ed56493512`, branch `feature/neuro3d-atlas`, PR rascunho 2. Continuação da referência de interação LearnCoronary já consultada no lote anterior. Sem nova fonte clínica, malha, cine ou transformação anatômica.

## Entregas

- Controle para vincular/desvincular inspeção 3D e aquisição 2D. Na inspeção livre, mudanças de câmera não atualizam a aquisição; comandos de aquisição não comandam a câmera. Capturar a inspeção e alinhar à aquisição são ações explícitas. Reativar o vínculo alinha a inspeção à aquisição atual.
- A comparação simultânea usa inspeção ortográfica. A inspeção anatômica isolada pode usar perspectiva; nesse modo, a ampliação equivalente se refere somente ao plano do alvo. O campo/ampliação são preservados em redimensionamentos e comandos. Helpers usados pelo controlador são confrontados com matrizes reais de `Three.OrthographicCamera` e `PerspectiveCamera`, em diferentes proporções de viewport.
- Selecionar/mover na imagem 2D são ferramentas próprias, independentes da ferramenta 3D. Roda e arraste atualizam o campo da aquisição; com vínculo ativo também comandam a inspeção. Camadas e seleção continuam compartilhadas.
- Vistas de aquisição nomeadas: até 50 poses, com centro/ângulos/ampliação, localStorage separado do NRI. Exportação JSON e importação com prévia, validação de esquema/versão/referencial/projeção/tamanho/valores e mesclagem que rejeita conflitos sem sobrescrever. Reimportação idêntica é idempotente. Capturas são apenas poses (`scope=pose-only`), não imagens, dados de paciente, camadas ou métricas. Remoção pode ser desfeita. Escrita recusa coleção modificada por outra aba, preservando-a.
- Falha de WebGL agora distingue esse motivo e oferece continuar na projeção 2D ou tentar novamente o 3D. Não altera flags, autenticação ou proteções do navegador. Captura/alinhamento 3D ficam desabilitados quando a inspeção não abriu.

## Validação

197 testes unitários/47 arquivos aprovados: inclui nove testes de independência/validação/mesclagem de vistas e quatro de geometria/campo. O ensaio ortográfico compara coordenadas de detector para três tamanhos de viewport, cinco poses, três ampliações e três pontos; o ensaio perspectiva compara o plano-alvo, sem afirmar equivalência nos demais planos. TypeScript e build aprovados (aviso histórico de bundles grandes mantido).

Navegador via CUA: WebGL reconfirmado desativado (`GL_VENDOR = Disabled`); desenho e arraste 3D permanecem não validados neste ambiente. Confirmados na interface: fallback 2D com projetor pronto, aquisição independente a 30°, salvar → mudar para lateral → recuperar 30°, remoção/desfazer e persistência após recarregar. Arraste da aquisição alterou o centro de `[0,-3,0]` para `[-3.600820259360343,-0.921065453954848,2.0789345460451516]`, mantendo yaw 30° e modo independente. Estes são valores nominais do atlas, não medidas de paciente. Importação/exportação de vistas tem testes de parser/mesclagem; o seletor de arquivos não foi exercitado nesta rodada.

Nenhum arquivo de `features/neuro3d/preparation` modificado: estado inicial, histórico, checkpoints, gabaritos e dados do navegador preservados. Nenhuma nova avaliação ou revisão NRI registrada. Não foram reduzidas as 20 ausências, 373 lacunas bibliográficas, sete termos não reconciliados ou a pendência Galeno–seio reto. Não repetidas auditorias anatômicas já concluídas.

## Próximo lote

Conferir o hash publicado e seu deployment exato. Validar em navegador com WebGL o arraste 3D, captura/alinhamento, seleção bilateral e troca entre modo vinculado/livre, incluindo redimensionamento real. Ensaiar JSON de vistas por arquivo na UI e layouts móveis. Depois evoluir geometria de aquisição física e cine neuroangiográfico apenas com fonte/licença e convenções comprovadas; a projeção atual continua ortográfica, sem simular injeção seletiva ou atenuação.
