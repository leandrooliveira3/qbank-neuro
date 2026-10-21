# Histórico de checkpoints

Acrescentar registros; não apagar os anteriores. Hashes publicados devem ser confirmados no remoto. O commit que cria um documento é identificado pelo Git, sem tentar inserir um hash autorreferente.

## Base recuperada — 21/10/2026

- Repositório: leandrooliveira3/qbank-neuro; branch `feature/neuro3d-atlas`, PR nº 2 rascunho.
- Commit inicial confirmado: `8f599f533a79421d2d065d100dc3d398160443cf`.
- Contexto: lote de 110 testes anunciado no chat anterior interrompido antes de publicar; arquivos/objetos do ambiente anterior indisponíveis. Checkout original preservado.
- Pendências: recuperação parcial, anatomia, comparador e demais solicitações.

## Código dos laboratórios e recuperação parcial — 21/10/2026

- Commit remoto confirmado: `025ef13cca20886cfe8bdc17b83a1957d152ace1`.
- Árvore: `d2bbcfccbccbf267571b130a109bbfb483571925`, igual ao commit local `5a7171d6bfe4efc406de88887a9529c7a6436c13`; metadados diferentes por publicação via conector. Nenhum force push.
- Entrega: controle embrionário, anastomoses/2D obsoleto, roteiros dos vídeos, Paciente 3D DICOM local, Doppler, avaliações REA TCD/Ankyras e relatórios.
- Validação: TypeScript/build, 117 unitários e 36 casos únicos de navegador aprovados; Vercel SUCCESS para o commit. Não houve inspeção remota do navegador nem validação clínica.
- Pendências: anatomia e comparador, 3DRA real, segmentação/medidas, Doppler avançado, mecânica/dispositivos e oito representações adicionais perdidas.

## Auditoria e protocolo V2.0 — 21/10/2026

- Pai remoto confirmado: `025ef13cca20886cfe8bdc17b83a1957d152ace1`; nova branch local `continuation/ai-context` criada dessa base sem reescrever histórico.
- Entrega: AGENTS, nove documentos ai-context, auditoria de sete links/três datasets e atualização dos pontos de entrada antigos. Sem alteração de lógica/recursos do site.
- Prioridade: anatomia e angiografia antes de procedimentos avançados; preservar todas as frentes.
- Validação de fechamento: dez documentos presentes, três links relativos válidos, dez fontes e doze itens de NEXT_SESSION conferidos, diff documental sem erros de whitespace. Hash remoto final deve ser confirmado e informado no relatório; na sessão seguinte registrar esse hash em novo checkpoint, preservando este registro.
- Próximo ponto exato: P0 de inventário/relações e comparador independente descrito em NEXT_SESSION.

## Comparador independente e reconciliação — 21/10/2026

- Checkpoint anterior publicado confirmado: `ad5515dc53067689d5bdf54e514b0caa0d6a572e`, árvore `69d922983d2862b4ceda4ec200fd539a8c6a6915`; branch feature/neuro3d-atlas/PR 2 rascunho.
- Nova branch local continuation/vascular-comparator criada dessa base, preservando original e branches anteriores.
- Entregas: aba independente BRAVE-NET/VENAT, três derivados verificados/licenciados, decoder seguro, vistas/pose/proveniência, reconciliação atual por ID e nota Galeno–seio reto. Nenhuma geometria do atlas alterada.
- Pendências: registro/marcos/cortes, sete identidades, conexão Galeno–seio reto, oito representações embrionárias adicionais e demais frentes preservadas.
- O commit que contém este registro é identificável pelo Git; confirmar hash remoto e árvore ao fechar e informá-los no relatório. Resultados detalhados em VALIDATION e no relatório do comparador.
- Fechamento funcional: TypeScript, 120 unitários/27 arquivos e build aprovados; 18 casos únicos de navegador nesta etapa (execuções de 10 e 12, com quatro repetições), capturas inspecionadas e diff conferido. Nenhuma aprovação anatômica/clinica acrescentada.

## Lote seccional — 21/10/2026

Checkpoint anterior 2cd11d7b528b3d519dcf92776d10b0b8a2022215 confirmado; branch local continuation/sectional-review criada da remota preservando as anteriores. Entrega: 42 planos, marcos físicos, contexto original, auditoria integral do seio reto e documentos. Nenhuma geometria/nomenclatura corrigida por proximidade. Código e dados derivados a publicar em feature/neuro3d-atlas/PR 2 rascunho; conferir hash e árvore no fechamento. Deployment independente ainda depende de acesso ao time; não confundir persistência Git com Vercel pronto.
