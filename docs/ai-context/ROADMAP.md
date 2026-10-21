# Roadmap e aceitação

Atualizado em 21/10/2026. Prioridade confirmada: anatomia/angiografia antes de simulação avançada. Estados descrevem evidência, não intenção.

| Prioridade / etapa | Estado | Dependências | Critérios de conclusão |
|---|---|---|---|
| Continuidade V2.0 e auditoria das fontes | Publicado e confirmado em ad5515d | Conferência de links, diff e persistência GitHub | AGENTS + nove documentos existentes, dez fontes com uso/licença/pendência; remoto com árvore conferida; próximo prompt entregue |
| P0.1 Inventário e relações anatômicas | Contagens reconciliadas; relações ainda parciais | Código atual, matrizes e referências multiprojeção | Reconciliar cada estrutura por ID/fonte/estado; corrigir somente com evidência; preservar ausências e incertezas; atualizar matrizes e testes |
| P0.2 Comparador independente arterial/venoso | Visor independente entregue; revisão por marcos/cortes pendente | Dados com licença/hash/affine; BRAVE-NET/VENAT já auditados | Referências em espaço próprio, controles independentes, atribuição, sem registro implícito; revisão AP/lateral/oblíqua e evidências exportáveis |
| P0.3 Angiografia fiel à anatomia revisada | Parcial | P0.1/P0.2 e geometria coerente | Mesmos IDs/geometria/pose no 3D e projeções; esclarecer limites de atenuação; nenhuma imagem obsoleta; revisão visual documentada |
| P1.1 Segmentação revisável do paciente | Prévia por intensidade entregue | Volume reconstruído com geometria física verificável | ROI/componentes, planos ortogonais, edição reversível e proveniência; impedir completar vasos automaticamente com atlas |
| P1.2 Compatibilidade 3DRA real | Não validada | Exame real desidentificado/licenciado e codificação do fabricante | Conferir geometria/SOP/transfer syntax e comparações físicas; declarar rejeições; não confundir com projeções XA |
| P1.3 Linha central, colo e medidas | Planejado | Máscara revisada, marcos e unidades | Medidas reproduzíveis comparadas com referência; erros documentados; VMTK opcional validado separadamente |
| P1.4 Estudo de dispositivos/técnicas | Planejado | P1.3, catálogo, critérios e validação especializada | Explicitar faixa/compatibilidade/incerteza; sem escolher automaticamente a melhor técnica por aparência/limiar |
| P2.1 Doppler | Modelo didático funcional | Anatomia de insonação, especificação de sinais/estimador | Separar sinal ideal de adquirido; FFT real somente quando implementada/testada; ampliar bilateralidade/tendências sem criar diagnóstico implícito |
| P2.2 Mentice / procedimentos avançados | Roteiro e estação básica funcionais | Anatomia/angiografia revisadas e contratos geométricos | Cine/séries/roadmap, controle coaxial/suporte e sequência documentados por vídeo; mecânica específica validada independentemente |

Em P0.1 começar pela discrepância Galeno–seio reto, ramos/identidades pendentes e inventário arterial/venoso atual. Se a identidade não puder ser resolvida com a fonte, manter pendência e avançar no comparador verificável. Não bloquear todas as tarefas por falta de um caso clínico.

Pendências transversais: oito representações embrionárias adicionais perdidas, estruturas essenciais ausentes, licenças individuais dos candidatos, aviso de chunks >500 kB. Não marcar o atlas completo com itens essenciais não resolvidos. Não refazer importações ou avaliações REA já concluídas sem nova evidência.

### Próximo lote P0 após o comparador

Acrescentar inspeção seccional dos volumes de referência e marcos auditáveis para revisão de identidade/curso, sem sobreposição automática ao atlas. Reexaminar o seio reto na geometria original completa e marcos osteoencefálicos; não ajustar a curva de Galeno apenas para zerar distância. Manter as sete identidades do diagrama em aberto até evidência suficiente. Aceitação: coordenadas/affines conservados, evidência multiprojeção, testes e capturas, sem transformar registros de vista em aprovação.

## Lote seccional — 21/10/2026

P0.2: cortes nativos selecionados e marcações físicas entregues; não é navegação por todos os cortes nem validação anatômica. P0.1: seio reto original completo auditado e contexto inspecionável; identidade/junção Galeno continuam pendentes. Próximo P0: rastrear a atribuição/transformações na linhagem BodyParts3D/Z-Anatomy/Anatria e vincular cortes/3D da MESMA fonte por coordenadas físicas, sem registro entre fontes. Preservar sete identidades e todas as frentes de paciente/Doppler/Mentice/Ankyras.

## Estado que supera os próximos lotes anteriores

42 planos e auditoria original entregues em 81f6799; agora a comparação exata Anatria→Qbank e vinculação física corte/marcos/3D também estão entregues. P0.2: marcos/cortes vinculados funcionalmente, revisão anatômica ainda pendente. Próximo lote: navegação ortogonal vinculada da mesma fonte, sem sugerir acesso a cortes que não estão no conjunto selecionado; qualquer expansão exige derivação/hash/affine verificados. P0.1: buscar ID por objeto em Z-Anatomy/BodyParts3D somente com fonte nova; não refazer auditoria de bytes já concluída. Nenhuma identidade foi resolvida. CTA15697196 deve apoiar ensaios independentes físicos de paciente, condicionado à aquisição/verificação, sem substituir 3DRA. Preview 81f6799 Ready por imagem do usuário; 403 não impede os trabalhos.

## Prioridade nova — 3D-2D-GS-CA para geometria

Usuário indicou explicitamente os onze ZIPs 3D-2D-GS-CA como referência geométrica preferencial. **Próximo lote geométrico deve começar por essa fonte**, antes de ampliar navegação BRAVE/VENAT; CTA é complementar. Auditoria offline dos10casos/20vistas e60coleções MGP concluída, hashes/CRC/bytes/finitude e projeção algébrica conferidos; três testes Python próprios aprovados. Não executou Matlab/MEX/MGP ou importação na UI. Volumes MHD/RAW e detector RAD/RAW estão em Sv/Sw mm, não DICOMLPS/RAS implícito. Report ../neuro3d-geometry-dataset-review.md; resultados ../neuro3d-gs-ca-geometry-audit.json.

Página BY-NC-ND e guia exige acordo/restringe distribuição; acordo existente não estabelecido. Dados/calibrações/pontos/código de fornecedor permanecem locais, sem redistribuição; preservar essa condição. Próxima etapa: leitor/visor local, VOI/ROI e contrato voxel→mm→detector verificável, sem sobrepor atlas ou reivindicar registro validado. Database_info.xls/ROIs e convenções visuais ainda precisam de verificação. CTA foi reconferido e3cortes reais foram rejeitados pelo leitor por JPEGsemperdas; série184 excede32milhões de voxels. Ver os dois novos relatórios CTA; não declarar integração.

## Ordem vigente, que supera as listas de próximo lote anteriores

**P0 máximo:** completar atlas3D/angiografia conforme Neuroangio, com identidade/lado, todos os ramos exigidos, extensão do curso, anastomoses e forames selecionáveis. Auditoria própria explicitamente autorizada. Índice/revelação, original2Disolada, auditoria592vasos e nove passagens/contextos entregues; validação anatômica completa permanece pendente.

PróximoP0: estabelecer marcos físicos dos forames e comprovar ramos/conexões prioritários com fontes rotuladas/licenciadas, começando AMM–lacrimal/oftálmica, redondo/ILT, oval/AMA/ILT e vidiana/ACIpetrosa. Revisão venosa incompleta dos capítulos que falharam deve prosseguir. VinteIDs sem geometria e373sem referência não podem ser escondidos por ilustrações. Preservar sete identidades/Galeno e distinguir variantes.

GS-CA: auditoria dos dez casos concluída anteriormente; visor local/VOI/RAD continua pendente como apoio geométrico, após repriorização expressa. BRAVE/VENAT permanecem independentes. P1/P2 de Paciente3D, Doppler, Mentice, dispositivos e REA mantidos; não alegar cancelamento ou conclusão clínica.

## PróximoP0 após inspeção física das vias

Entregues cortes/planos físicos do atlas para8contextos/26elos, hashes por superfície e três conjuntos venosos por lado. P0 não homologado: limites inferiores positivos demonstram separações vidiana–ACI e esfenoidal–lacrimal, não a correção necessária. Próximo lote deve comprovar marcos ósseos nos cortes originais e confrontar a proveniência/extensão dessas vias com Neuroangio/Lasjaunias/fontes rotuladas, sem alterar malhas para zerar distâncias. Revisar os termos venosos não reconciliados e imagens dirigidas quando úteis. Não refazer o inspetor, auditoria592ou42cortes sem evidência nova.20ausências/373lacunas/Galeno/seteIDs e todas as frentes preservadas.

## PróximoP0 após bordas seccionais V2

Entregues quatro bordas reais e contenção de perfis V2 nos cortes; proveniência dos modelos e sete termos venosos explicitados. PróximoP0: continuidade3D e correspondência anatômica V2; raiz motora trigeminal original como contexto adicional do oval, sem confundir com tronco sensitivoV3. Procurar componentes rotulados/licenciados para ICAvidiana e meningo-lacrimal se a fonte não os individualizar. Não refazer testemunhos nem mover ramos ilustrativos22mm para forçar coincidência.20/373/Galeno/seteIDs e demaisfrentes preservados.


## 21/10/2026 — hierarquia, continuidade amostrada e limite motor

Base7b080470f0ca286700774110062a4d4d2a846a97, árvore5d81326afff7b6b6d289822f47506e1ee484fdce; remoto conferido, branchlocal continuation/contour-continuity. Fonte fixa e referenciais preservados. Ver ../neuro3d-contour-continuity-review.md e features/neuro3d/contour-continuity-evidence.json.

42novas secções V2:18/21contidas porlado, hierarquia pai/filho e orientação original oposta;17transições com triângulos ósseos compartilhados. Últimos3níveis não demonstram contenção. Esfenoide tem162bordas poríndices após excluir4faces degeneradas;32bordas permanecem na cópia diagnóstica de costuras, deslocamento0. Não certifica sólido/vazio/túnel/forame ou continuidade entre amostras. Raízes motoras482vértices/960faces porlado, segmentos curtos separados do esfenoide por≥12,143mm nominais segundo caixas; não são V3 sensitivo nem curso completo do oval.

Sete termos venosos confrontados com7192rótulos ingleses TA2 da fonte fixa (blob71bef934c23d207550ad1f318ec6edd8551cdba4): seis sem correspondência exata, braquial lexical rejeitado por território; grupo pontino genérico não individualiza canal transverso. IDs terminológicos não viram malhas. Zero novas geometrias/identidades aprovadas.20ausências/373lacunas, Galeno, sete rótulos e componentes ICAvidiana/meningo-lacrimal permanecem. Todas as frentesGS-CA/VOI/Paciente3D/Doppler/Mentice/VascularTwin/REA/Ankyras preservadas; dados restritos não redistribuídos.

PróximoP0: localizar32bordas abertas remanescentes e investigar transiçãoZ31,4→31,6 com contexto nativo/oblíquo e fonte óssea rotulada, sem reparar ou estender anatomia por inferência. Consultas bibliográficas não equivalem a ferramentas executadas. O commit que contém esta etapa identifica o novo checkpoint; confirmar hash/árvore/status remoto no fechamento.
