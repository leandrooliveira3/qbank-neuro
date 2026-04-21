# Sistema Anki-Like - Documentação

## Visão Geral

Sistema completo de spaced repetition equivalente ao Anki, com algoritmo SM-2 Plus aprimorado, sistema de filas avançado, e controle total do usuário.

## Arquitetura

### Tipos de Dados

**FlashcardConfig**
- `learning_steps`: Passos de aprendizado (minutos)
- `relearning_steps`: Passos de reaprendizado (minutos)
- `initial_ease`: Ease factor inicial (padrão: 2.5)
- `min_ease` / `max_ease`: Limites de ease factor
- `interval_modifier`: Multiplicador de intervalo (ajuste global de velocidade)
- `max_interval`: Intervalo máximo em dias
- `auto_flip_enabled`: Virar card automaticamente
- `auto_flip_delay_ms`: Tempo em ms para auto-flip
- `new_cards_per_day`: Limite de novos cards diários
- `review_cards_per_day`: Limite de revisões diárias

**Flashcard (Status)**
- `new`: Card nunca estudado
- `learning`: Card em fase de aprendizado (múltiplos passos)
- `review`: Card em revisão regular (aplicar ease_factor)
- `relearning`: Card que falhou, voltou ao aprendizado
- `mastered`: Card completamente dominado (opcional)

**FlashcardInbox**
- `pending`: Card aguardando aprovação do usuário
- `added`: Card movido para um deck
- `duplicate`: Card detectado como duplicado

**FlashcardDeck**
- Organização de cards por tema/categoria
- Estatísticas de cards por deck

### Estados de Transição

```
Novo Card
    ↓
[Learning Steps] → "good" → Continue steps OR Graduate
                → "hard" → Reset to first step
                → "again" → Relearning
    ↓
Review Card (ease_factor aplicado)
    ↓
- "good" → interval = interval × ease_factor
- "hard" → interval = interval × 1.2
- "again" → Relearning
- "easy" → interval = interval × ease_factor × 1.3 + boost

Relearning (após erro em review)
    ↓
[Relearning Steps] → "good" → Back to Review
                  → "again" → Repeat first step
                  → "hard" → Repeat first step
```

### Algoritmo SM-2 Plus

Implementado em `services/sm2plus.ts`:

1. **Learning Phase**
   - Card novo passa por passos configuráveis (ex: 1m, 10m, 1d)
   - Cada resposta "good" avança para o próximo passo
   - Resposta "hard" reinicia no primeiro passo
   - Resposta "again" vai para relearning

2. **Review Phase**
   - Intervalo = interval × ease_factor (com modifier aplicado)
   - "easy" → +30% de boost no intervalo
   - "good" → mantém ease_factor
   - "hard" → intervalo × 1.2, ease -0.15
   - "again" → relearning

3. **Relearning Phase**
   - Similar ao learning, mas com passos de reaprendizado
   - Sucesso volta para review com intervalo mínimo
   - Falha reinicia o processo

### Deduplicação de Inbox

Hash SHA-256 baseado em: `front + "|" + back`

Se hash já existe nos flashcards do usuário → marcado como `duplicate`
Usuário pode ignorar ou adicionar manualmente se desejar

### Atalhos de Teclado

- **ESPAÇO**: Virar card (flip)
- **1**: Errei (Again) - só funciona com card virado
- **2**: Duro (Hard) - requer flip
- **3**: Bom (Good) - requer flip
- **4**: Fácil (Easy) - requer flip

Atalhos desabilitados durante transições e em modo livre

## Componentes

### Páginas

**StudyFlashcards.tsx**
- Interface de revisão com flip 3D
- Suporte a imagens e oclusões
- Indicador de progresso
- Feedback visual imediato
- Acúmulo de XP

**AdvancedFlashcardConfig.tsx**
- Configuração completa do algoritmo
- Tabs: Learning, Review, Daily Limits, Auto-flip
- Reset para valores padrão
- Persistência por usuário

**FlashcardManagement.tsx**
- Gerenciamento de decks
- Visualização de inbox (pending + duplicates)
- Interface para processar cards do inbox
- Seleção de deck para cada card

**ImportFlashcards.tsx**
- Import direto para inbox (SEM duplicidade automática)
- Suporta: APKG (Anki), CSV, TXT, JSON, MD
- Deduplicação baseada em hash
- Upload de imagens

### Stores

**useFlashcardStore.ts**
- Gerenciamento de config, decks, inbox
- CRUD para decks e cards
- Processamento de inbox
- Reset de progresso (completo, por deck, por card)

### Serviços

**sm2plus.ts**
- Processamento de reviews (SM-2 Plus)
- Funções de estatísticas
- Get cards due/new
- Reset de cards

## Fluxo de Uso

### 1. Primeiro Acesso

1. Usuário vai para `/flashcards`
2. Config padrão é carregada automaticamente
3. Pode customizar em `/flashcards/config`

### 2. Importação de Flashcards

1. Usuário vai para `/flashcards/import`
2. Seleciona arquivo (APKG, CSV, etc)
3. Cards são adicionados ao **Inbox** (não direto ao deck)
4. Usuário revisa em `/flashcards/manage` → Inbox
5. Escolhe um deck e confirma
6. Sistema detecta duplicatas automaticamente
7. Card é adicionado com status `new`

### 3. Criação Manual

1. User adiciona card manualmente no dashboard
2. Card vai direto para inbox (fonte: 'manual')
3. Segue mesmo fluxo de revisão + adição ao deck

### 4. Estudo

1. Usuário acessa `/flashcards/study`
2. Sistema carrega:
   - Cards novos (até limite diário)
   - Cards vencidos (sem limite)
3. Para cada card:
   - Espaço ou clique para virar
   - Botões ou atalhos (1-4) para avaliar
   - Card atualiza interval, ease, status
   - XP acumulado
4. Sessão finaliza com resumo

### 5. Gerenciamento

- **Decks**: criar, editar, deletar
- **Inbox**: revisar, aceitar, rejeitar, detectar duplicatas
- **Reset**: por card, por deck, global (com confirmação)
- **Config**: customizar algoritmo completamente

## Banco de Dados (IndexedDB)

Stores adicionadas:
- `flashcard_configs`: Configurações por usuário
- `flashcard_inbox`: Cards em revisão
- `flashcard_decks`: Decks criados
- `review_history`: Histórico completo de reviews (opcional)

Armazenamento:
- Cards com review_history (array de entradas)
- Cada entry: date, rating, interval, ease_factor
- Permite análise histórica e gráficos de progresso

## Melhorias Implementadas vs Original

### Antes
- Cards iam direto para os decks
- Sem deduplicação
- Sem inbox/revisão de imports
- Sem reset granular
- Config limitada
- Sem atalhos de teclado
- Sem auto-flip

### Depois
- **Inbox System**: Revisão antes de adicionar
- **Deduplicação**: Hash SHA-256, detecta automático
- **Reset Granular**: Por card, deck ou global
- **SM-2 Plus**: Learning + Relearning states
- **Config Avançada**: Controle total do algoritmo
- **Atalhos**: Espaço, 1-4
- **Auto-flip**: Configurável com delay
- **Histórico**: Completo de reviews
- **Decks**: Organização por tema
- **Multi-step Learning**: Passos configuráveis

## Próximas Melhorias (Diferenciais)

1. **IA Suggestions**
   - Sugerir novos flashcards baseado em pontos fracos
   - Identificar cards redundantes

2. **Métricas Avançadas**
   - Taxa de retenção por theme
   - Previsão de domínio
   - Análise de pontos fracos

3. **Visualizações**
   - Gráfico de progresso temporal
   - Distribuição por status
   - Heatmap de revisão

4. **Sincronização com Anki**
   - Export/import mantendo scheduler
   - Sincronização bidirecional

5. **Estudos Adaptativos**
   - Aumentar limite de novos cards se desempenho bom
   - Reduzir se performance ruim
