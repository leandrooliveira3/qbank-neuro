# Curso NRI 2027 no QBank-Neuro 3D

A aba **Curso NRI 2027** abre em `/#/tools/neuro3d?tab=curso`. A busca indexa nome, código do módulo e conceitos-chave. O link pode incluir bloco, módulo e modo de estudo. Cada bloco carrega seu conteúdo sob demanda.

## Conteúdo

Os 13 blocos e 120 módulos seguem a sequência ministrada nos três históricos de Estudos NRI de 21/11/2026. A ordem do plano v4 foi atualizada com base nesses históricos. Galeno está em 7C–7D. O Bloco 13 reúne AVC isquêmico na primeira metade e aneurismas na segunda. O Bloco 14 continua como suplementar, fora do banco inicial solicitado.

A teoria de cada módulo deriva do conteúdo didático das aulas. Os conceitos-chave foram reescritos em tabelas próprias para recuperação rápida. As referências do bloco estão no fim do módulo.

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
