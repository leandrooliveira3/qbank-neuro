# Roadmap e aceitação

Atualizado em 21/10/2026. Prioridade confirmada: anatomia/angiografia antes de simulação avançada. Estados descrevem evidência, não intenção.

| Prioridade / etapa | Estado | Dependências | Critérios de conclusão |
|---|---|---|---|
| Continuidade V2.0 e auditoria das fontes | Documentos preparados neste checkpoint | Conferência de links, diff e persistência GitHub | AGENTS + nove documentos existentes, dez fontes com uso/licença/pendência; remoto com árvore conferida; próximo prompt entregue |
| P0.1 Inventário e relações anatômicas | Parcial | Código atual, matrizes e referências multiprojeção | Reconciliar cada estrutura por ID/fonte/estado; corrigir somente com evidência; preservar ausências e incertezas; atualizar matrizes e testes |
| P0.2 Comparador independente arterial/venoso | Pendente de recuperação | Dados com licença/hash/affine; BRAVE-NET/VENAT já auditados | Referências em espaço próprio, controles independentes, atribuição, sem registro implícito; revisão AP/lateral/oblíqua e evidências exportáveis |
| P0.3 Angiografia fiel à anatomia revisada | Parcial | P0.1/P0.2 e geometria coerente | Mesmos IDs/geometria/pose no 3D e projeções; esclarecer limites de atenuação; nenhuma imagem obsoleta; revisão visual documentada |
| P1.1 Segmentação revisável do paciente | Prévia por intensidade entregue | Volume reconstruído com geometria física verificável | ROI/componentes, planos ortogonais, edição reversível e proveniência; impedir completar vasos automaticamente com atlas |
| P1.2 Compatibilidade 3DRA real | Não validada | Exame real desidentificado/licenciado e codificação do fabricante | Conferir geometria/SOP/transfer syntax e comparações físicas; declarar rejeições; não confundir com projeções XA |
| P1.3 Linha central, colo e medidas | Planejado | Máscara revisada, marcos e unidades | Medidas reproduzíveis comparadas com referência; erros documentados; VMTK opcional validado separadamente |
| P1.4 Estudo de dispositivos/técnicas | Planejado | P1.3, catálogo, critérios e validação especializada | Explicitar faixa/compatibilidade/incerteza; sem escolher automaticamente a melhor técnica por aparência/limiar |
| P2.1 Doppler | Modelo didático funcional | Anatomia de insonação, especificação de sinais/estimador | Separar sinal ideal de adquirido; FFT real somente quando implementada/testada; ampliar bilateralidade/tendências sem criar diagnóstico implícito |
| P2.2 Mentice / procedimentos avançados | Roteiro e estação básica funcionais | Anatomia/angiografia revisadas e contratos geométricos | Cine/séries/roadmap, controle coaxial/suporte e sequência documentados por vídeo; mecânica específica validada independentemente |

Em P0.1 começar pela discrepância Galeno–seio reto, ramos/identidades pendentes e inventário arterial/venoso atual. Se a identidade não puder ser resolvida com a fonte, manter pendência e avançar no comparador verificável. Não bloquear todas as tarefas por falta de um caso clínico.

Pendências transversais: oito representações embrionárias adicionais perdidas, estruturas essenciais ausentes, licenças individuais dos candidatos, aviso de chunks >500 kB. Não marcar o atlas completo com itens essenciais não resolvidos. Não refazer importações ou avaliações REA já concluídas sem nova evidência.
