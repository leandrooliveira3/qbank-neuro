# Curso NRI 2027 no QBank-Neuro 3D

A aba **Curso NRI 2027** abre em `/#/tools/neuro3d?tab=curso`. O catálogo apresenta os 13 blocos. Cada bloco lista suas aulas e dá acesso às suas 100 questões. A busca aceita tema, título e código. As páginas de aula têm leitura, sumário, revisão de prova e questões. Anterior e Próxima percorrem também as transições entre blocos.

## Conteúdo

Os 13 blocos e 120 aulas seguem a sequência ministrada nos três históricos de Estudos NRI de 21/11/2026. Galeno está em 7C–7D. O Bloco 13 reúne AVC isquêmico na primeira metade e aneurismas na segunda. O Bloco 14 é suplementar.

Cada aula é HTML acessível a partir do catálogo ou de sua URL. O conteúdo deriva dos 120 trechos de aula e dos três complementos de 2K, 12.1 e 13.10. O cotejo percorreu 1.158 ocorrências de páginas nos três históricos. As tabelas foram recompostas pelas coordenadas das células. Há 43 esquemas didáticos incorporados e 322 referências por aula recuperadas das ligações das conversas. Figuras externas sem autorização de republicação ficam nas fontes correspondentes quando identificadas. O registro de origem `content/originals.json` conserva os hashes e os recortes para auditorias.

URLs antigas com `leitura=original` abrem a aula web. O carregamento sob demanda usa os arquivos do build. Se um arquivo de versão anterior falhar após uma publicação, a página tenta recarregar uma vez. A confirmação do novo build deve preceder a publicação.

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

A verificação abre todas as 120 páginas de aula e os 13 bancos de 100 questões em desktop e emulação Pixel 7. Inclui navegação por link antigo, recarga durante uma falha simulada de arquivo do build, revisão, correção e importação JSON com conflito.
