# Preparação NRI e estudo de projeções — 10/11/2026

## Entregas

Aba Preparação NRI 2027, em português, com painéis de blocos/aulas, checkpoints, revisões D0/+1/+3/+7/+14, questões objetivas A–E, lacunas, evolução por tema e plano diário de 60 minutos. Persistência IndexedDB local; backup ZIP consultável com estado e originais. Importação com prévia de Markdown/CSV/JSON/DOCX/PDF; JSON/CSV de questões exige cinco alternativas e nunca promove gabaritos recebidos a validados. Sem sincronização ou restauração automática de métricas a partir do backup. PDF sem OCR; máximo 15 MB/200 páginas/2 milhões de caracteres extraídos.

Base consultada diretamente: `NRI_MASTER_2026-11-05.md` da Biblioteca, estado 60/120, blocos 1–6 completos, 7A–7H completos, 7I ministrada aguardando avaliação, 7J não iniciada; 296/298 separado de CP1 29/30, CP2 pendente. Currículo de 13 blocos e 120 aulas consultado em `Curso NRI 2027.docx` (29/10); seu progresso antigo não utilizado. Relatos conversacionais posteriores 74/120, 364/368, CP2 30/30, 9C pendente e R001/R002 12/12 ficam explicitamente não incorporados sem a evidência primária de correção. Não inferidos temas dos dois erros agregados. Gabaritos não fornecidos no mestre não inventados; duas questões autorais recuperadas sem chave.

Avaliações novas ficam pendentes até conferir chave e informar fonte. Aulas concluídas exigem cinco respostas; CP2 completo exige 30. Checkpoints e revisões não entram no histórico das aulas. Correção de pendência acrescenta versão com `supersedes`, preservando a anterior. Aulas incluídas na base e duplicatas são rejeitadas. O calendário usa datas efetivas e nunca conclui por vencimento. Resolução de lacuna exige evidência escrita.

## LearnCoronary como referência de interação

Solicitação adicional do usuário: https://learncoronary.com. Consultados a página inicial, `/references`, `/atlas-attribution.md`, `/equipment` e `/guess-the-vessel` pela ferramenta web. A última página informa recurso futuro; não foi tratada como quiz implementado. Listas de fontes carregadas dinamicamente não foram integralmente auditadas; foram lidas as notas e atribuições disponíveis no HTML/Markdown. Nenhuma malha, vídeo, fotografia ou código coronariano copiado.

Acrescentados painel de orientação com seis presets de estudo, rotação/inclinação/ampliação, esquema SVG do eixo XZ e modo simultâneo 3D–2D no atlas existente. Comandos orientam a câmera; mudanças da câmera atualizam o estado da projeção; seleção e ocultações compartilhadas. Comparação usa o projetor ortográfico existente, com superfícies simplificadas na projeção geral. Nenhuma mudança de coordenadas, registro entre fontes ou calibração DICOM presumida. Presets não representam protocolos neuroangiográficos homologados. Diferença para a perspectiva de fonte pontual descrita no LearnCoronary explicitada.

Aba Referências e fontes reúne cadeia BodyParts3D/Z-Anatomy/Anatria3D, fonte/commit, créditos/licenças locais, Neuroangio, bibliografia catalogada e limites por representação. As licenças dos derivados locais não foram alteradas pela licença atual descrita no site de referência. UpToDate apenas identificado como fonte clínica prioritária; texto integral não consultado nesta etapa técnica.

## Validação e limites

TypeScript e build aprovados. 184 testes unitários em 45 arquivos aprovados, incluindo oito novos de contabilidade/validação e oito casos de poses/presets e reversibilidade da projeção. Mantido aviso prévio de bundles >500 kB. Navegador: painéis e alternância para comparação, mudança para +30° e estado do projetor conferidos. WebGL está desativado no navegador de QA (`GL_VENDOR = Disabled`); não foi possível validar visualmente o desenho 3D nem o arraste de câmera renderizada neste ambiente. Nenhuma mudança de segurança/flags para contornar esse limite. Validação de interface não equivale a validação anatômica ou clínica.

Todas as frentes anatômicas e GS-CA anteriores preservadas. 20 ausências/373 lacunas/sete termos e junção Galeno–seio reto não foram resolvidos por este trabalho.

## Continuação

Conferir publicação do commit exato na branch `feature/neuro3d-atlas`, PR rascunho 2, sem merge/force. Exercitar comparação em navegador com WebGL, seleção bilateral e responsividade; conferir importação de documentos reais e completar dados individualizados do curso somente com correções verificadas. Próxima evolução inspirada na referência: inspeção e aquisição com câmeras explicitamente independentes, geometria perspectiva com testes e convenção física comprovada, e eventual cine neuroangiográfico licenciado, sempre separado do atlas.
