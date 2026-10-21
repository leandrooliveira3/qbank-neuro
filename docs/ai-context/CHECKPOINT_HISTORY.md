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
