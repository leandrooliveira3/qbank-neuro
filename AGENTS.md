# Continuidade do Qbank-neuro 3D

## Inicialização obrigatória

Antes de implementar alterações:
1. Ler `docs/ai-context/NEXT_SESSION.md`.
2. Ler `docs/ai-context/CURRENT_STATE.md`.
3. Consultar `docs/ai-context/PROJECT_MASTER.md`.
4. Consultar `docs/ai-context/DECISIONS.md` e `ROADMAP.md` conforme necessário.
5. Conferir branch, commit, remoto e alterações não commitadas.
6. Confrontar os documentos com o código; investigar divergências.
7. Identificar a próxima tarefa prioritária e suas dependências.
8. Continuar sem repetir etapas concluídas.

## Regras permanentes

- GitHub é a fonte de verdade do código publicado; documentação persistente registra objetivos, decisões e continuidade operacional.
- Distinguir evidência confirmada no código, informação documentada, relato de conversa e hipótese. Código presente não implica teste ou validação científica.
- Nunca declarar conclusão sem validação, inventar testes ou presumir homologação clínica/anatômica.
- Preservar funcionalidades estáveis e decisões científicas aprovadas; justificar mudanças relevantes de arquitetura e acrescentá-las ao histórico.
- Priorizar conclusão e validação da anatomia tridimensional e angiografia antes da simulação procedural avançada. Ausências essenciais impedem declarar o atlas completo.
- Preservar Bouthillier, referências de Lasjaunias, anatomia arterial/venosa/cervical/arco, embriologia, inventários, transformações e registros de topologia. Não renomear estruturas para preencher ausências.
- Preservar planejamento radial/femoral, arcos I–III, catálogo de dispositivos e patologias. Esses recursos não estão todos validados por existirem no planejamento.
- Não misturar coordenadas de atlas, dados de referência em espaço próprio e DICOM LPS em mm sem transformação verificada.
- Vídeos Mentice enviados são referência primária de interação; Vascular Twin orienta Paciente 3D. Inspeção de referências proprietárias não autoriza copiar código/assets.
- Não incluir exames identificáveis, senhas, tokens ou credenciais nos documentos. Dados de paciente permanecem locais no fluxo atual.
- Respeitar instruções de escopo mais específicas. `sources/` do projeto espelhado é somente leitura; preservar alterações não relacionadas.
- Trabalhar em lotes substanciais com validação. Novas solicitações não apagam as frentes anteriores.

## Encerramento de etapa e checkpoint

Executar os testes apropriados; registrar entregas, pendências e ponto exato de interrupção; atualizar CURRENT_STATE, ROADMAP, DECISIONS quando necessário e NEXT_SESSION; acrescentar CHECKPOINT_HISTORY sem apagar registros; publicar checkpoint no fluxo autorizado e confirmar branch/hash remoto; entregar prompt pronto para copiar.

Aplicar também quando o usuário pedir salvar contexto, criar checkpoint, preparar novo chat, continuar em outra conversa ou encerrar sessão. Havendo indicação de limite de contexto, priorizar os documentos. Não prometer detecção exata do limite nem ações após o encerramento.

Fluxo atual: branch `feature/neuro3d-atlas`, PR rascunho nº 2. Sem merge em main, force push, reset destrutivo ou sobrescrita de trabalho alheio. Se remoto indisponível, salvar localmente e declarar persistência remota pendente.

No relatório final informar persistência, repositório/branch/hash confirmado, arquivos alterados, última etapa, pendências, próxima tarefa, validações e prompt. Memória conversacional não substitui estes arquivos versionados.
