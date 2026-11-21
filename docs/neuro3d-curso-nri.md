# Curso NRI 2027 no QBank-Neuro 3D

A aba **Curso NRI 2027** abre em `/#/tools/neuro3d?tab=curso`. A busca indexa nome, código do módulo e conceitos-chave. O link pode incluir bloco, módulo e modo de estudo. Cada bloco carrega seu conteúdo sob demanda. Em **Nesta aula**, os títulos funcionam como atalhos dentro da leitura. Módulos, Questões, Matriz e Progresso do protótipo continuam disponíveis dentro de **Acervo do atlas**.

## Conteúdo

Os 13 blocos e 120 módulos seguem a sequência ministrada nos três históricos de Estudos NRI de 21/11/2026. A ordem do plano v4 foi atualizada com base nesses históricos. Galeno está em 7C–7D. O Bloco 13 reúne AVC isquêmico na primeira metade e aneurismas na segunda. O Bloco 14 continua como suplementar, fora do banco inicial solicitado.

**Texto e esquemas** usa a leitura recomposta dos 120 trechos de aulas e dos complementos mapeados de 2K, 12.1 e 13.10. As tabelas foram reconstituídas pelas coordenadas das células no PDF. A versão atual inclui 16 esquemas didáticos das exportações, com descrição acessível e página de origem. Mantém as referências dos módulos e vincula os estudos de desenvolvimento do PHASES, ELAPSS e UIATS na aula 13.7. As tabelas de conceitos-chave permanecem disponíveis para revisão rápida.

**Páginas originais** exibe o recorte da aula diretamente no PDF usado como fonte. Selecione os três arquivos `ChatGPT_Estudo[s]-em-NRI*20261121*.pdf` para habilitar todas as aulas. O leitor verifica o SHA-256 da versão para assegurar as coordenadas, guarda os PDFs no navegador e indica páginas com figuras. Ele exibe também os painéis e as figuras de terceiros presentes nas exportações. A conferência só alcança o que está presente nas páginas exportadas. Aulas e suplementos começam e terminam nas coordenadas registradas em `content/originals.json`.

O banco tem 100 questões por bloco e cinco alternativas por questão. São 569 perguntas autorais recuperadas das avaliações com correção registrada e 731 questões de revisão. A revisão inclui casos clínicos e exercícios de associação a partir dos conceitos-chave. As questões do primeiro bloco foram reescritas porque as opções dos testes interativos não constavam nos PDFs. O banco oferece material para estudo. A revisão científica independente de cada questão e a recuperação de questões dependentes de figuras ficam pendentes.

## Questões JSON

Em **Importar questões JSON**, baixe o modelo ou selecione um arquivo. O formato aceita uma lista ou um objeto com `questions` contendo a lista. Campos de uma questão:

| Campo | Formato |
|---|---|
| `id` | ID estável em letras, números, ponto, hífen ou sublinhado |
| `lesson` | Código do módulo, como `7C` ou `13.3` |
| `prompt` | Enunciado |
| `options` | Cinco alternativas distintas em ordem A–E |
| `answer` | Índice inteiro de 0 a 4 |
| `explanation` | Comentário da resposta |

O arquivo é validado como um lote. Reimportações idênticas são idempotentes. Um conflito de ID ou enunciado preserva o banco anterior. Importações e respostas do curso persistem no navegador. O painel **Preparação NRI 2027** conserva seu próprio histórico.

## Continuidade

O conteúdo carregado pela interface está em `features/neuro3d/course/content/`. Os identificadores existentes vinculam respostas locais às questões. Ao atualizar o conteúdo, conserve IDs de itens equivalentes e reserve IDs novos para novas questões. O teste de integridade confere a distribuição de aulas e questões e o índice de duplicação da importação.

A verificação do lote executou TypeScript, build Vite, 200 testes unitários e quatro testes de navegador em desktop e emulação Pixel 7. Os testes de navegador cobrem navegação, revisão, correção, recarga e importação JSON com conflito.
