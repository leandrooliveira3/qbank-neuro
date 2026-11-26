## 26/11/2026 — Revisões finais cruzadas com o banco NRI

No Curso NRI, abra Revisões finais e use Ver conceitos de cada aula para conferir o conteúdo cobrado. A numeração segue o simulador do bloco inteiro. Alterações futuras no banco nativo propagam-se automaticamente a partir da mesma fonte. Preserve IDs e versões do gabarito.

## 26/11/2026 — Revisões finais do Curso NRI

Use a revisão final em `/#/tools/nri?revisoes=finais`. Ao corrigir uma aula, atualize também a decoreba e a pegadinha em `features/neuro3d/course/content/review-priorities.json`. Esse dado alimenta três posições na interface. Preserve os 13 blocos curriculares, 120 aulas e 1.300 questões.

## 22/11/2026 — Curso NRI 2027

A revisão local dos 13 blocos corrigiu figuras, navegação e justificativas. O catálogo apresenta 629 imagens recuperadas e localizadores nas 1.300 questões. A auditoria registra o alcance dos localizadores e da conferência clínica. [Resultados da auditoria](../neuro3d-curso-nri-auditoria-final.md).

## 21/11/2026 — Revisão curricular e visual dos 13 blocos NRI

Continue da revisão dos 13 blocos. Preserve o material original, os 13 planos e os IDs das questões. Consulte a matriz para localizar as fontes de cada aula. A auditoria científica independente por alternativa e a recuperação das figuras ausentes nas exportações continuam abertas. [Registro](../neuro3d-curso-nri-auditoria-final.md).

## 21/11/2026 — Material integral do Curso NRI

A continuação curricular permanece no Bloco 7. Para conferir fidelidade documental, abra Material integral na aula e compare a página indicada com a exportação original. Use o manual do curso para atualizar o leitor. [Manual](../neuro3d-curso-nri.md).

## 21/11/2026 — Auditoria dos Blocos 2–6 do Curso NRI

Continuação sugerida na Aula 7A, no Bloco 7. Use as exportações integrais e as referências para verificar cada aula, com atenção à malformação aneurismática da veia de Galeno, à sua distinção de ectasia da veia adulta e às transições de conteúdo entre blocos. [Cotejo](../neuro3d-curso-nri-blocos-2-6.md).

## 21/11/2026 — Auditoria do Bloco 1 do Curso NRI

Para o próximo bloco, use a trilha de cotejo do Bloco 1 como referência. Verifique o texto das aulas nas exportações e confronte o conteúdo com as referências específicas de embriologia antes de editar o Bloco 2. [Registro do cotejo](../neuro3d-curso-nri-bloco-1.md).

## 21/11/2026 — Próxima etapa da auditoria de questões NRI

Use [a matriz atual](../neuro3d-curso-nri-auditoria.md) e `node tools/nri/audit-course.mjs --json`. Priorize o Bloco 1, que ainda tem 82 perguntas de recordação por fórmula. Compare cada questão com a aula e uma fonte científica, incluindo a qualidade de cada distrator, e registre o que foi conferido. Preserve 100 itens por bloco, IDs, a versão das tentativas e a publicação em `feature/neuro3d-atlas`. O acesso do Curso NRI está em `/#/tools/nri`; preserve o redirecionamento histórico.

## 21/11/2026 — Curso NRI no site

Abra o catálogo e confira o hash da publicação. Edite o conteúdo web via [manual do curso](../neuro3d-curso-nri.md). Para completar a auditoria científica, confira gabaritos e comentários separadamente e incorpore as figuras externas com autorização de republicação. Preserve os IDs das questões e a continuidade do atlas.

## 21/11/2026 — Leitura do Curso NRI

Confirme a publicação antes de atribuir estado ao curso. Use [o manual](../neuro3d-curso-nri.md) para editar conteúdo, recortes e figuras. Siga com o cotejo científico de gabaritos e comentários e com o mapeamento de figuras ausentes nas exportações. Preserve IDs, conteúdo autoral, referências primárias e a continuidade do atlas.

## Continuação do curso NRI — 21/11/2026

Leia AGENTS.md e [o manual do curso](../neuro3d-curso-nri.md). Confirme o hash da branch e o preview antes de atribuir estado de publicação. O Curso NRI 2027 tem 13 blocos, 120 módulos, 100 questões por bloco, três modos de estudo e importação local por JSON. Preserve os IDs do banco e o histórico separado da preparação. A próxima frente de conteúdo é auditar gabaritos e adicionar questões de interpretação angiográfica com licença e origem conferidas. Consulte as tarefas de anatomia e interação 3D abaixo para continuar o atlas.

# Próxima sessão — aquisição independente e vistas guardadas

Leia o registro de 11/11/2026 e ../neuro3d-independent-acquisition.md. Não refaça NRI ou vistas guardadas. Priorize validação renderizada com WebGL, JSON por arquivo e responsividade, preservando todas as pendências anatômicas abaixo. A validação 3D continua bloqueada no navegador atual; não alterar proteções/flags para contornar.

# Próxima sessão — Preparação NRI e estudo de projeções

Leia primeiro o registro de 10/11/2026 em CURRENT_STATE e ../neuro3d-nri-and-projection-study.md. Valide a comparação num navegador com WebGL e confira publicação do hash remoto exato. Preserve toda a continuidade anatômica abaixo; não refaça o leitor GS-CA ou auditorias concluídas.

# Próxima sessão — ZIP local e completude vascular

Base `167705814d2166f4288de61e5bcaeb163d1fc0cd`, continuação local `continuation-gsca-zip-20261022`. ZIP local clássico com inventário sem descompressão, conferência local/central/descritores, caminhos e intervalos, limites de expansão/memória, extração seletiva sequencial no worker e CRC/tamanho reais. Prévia/cancelamento e exportação do inventário; arquivos originais preservados, nenhum envio ou execução do fornecedor. Novo limite estimado ZIP 768 MiB é distinto do trabalho de 512 MB do leitor; não é pico medido. Sem nova dependência de produção. Seleção repetida da projeção agora solicita imagem novamente mesmo com ROI original compartilhada.

Busca nova encontrou suplemento DICOM tentorial AJNR2020: metadados públicos GIN 200, revisão 401 e árvore 404; licença e máscaras individuais não comprovadas, nenhum exame baixado. JNET2026 é revisão CC BY-NC, não malha. Estudo JCI experimental é murino; excluída equivalência com adulto humano. Catálogo passa a seis candidatos venosos, mantendo as 12 fontes anteriores. Zero geometria anatômica nova: 20 ausências, 373 lacunas e sete termos mantidos; Galeno, sete identidades, ICA-vidiana/meningo-lacrimal e todas as demais frentes preservados. Ver ../neuro3d-gs-ca-zip.md, ../neuro3d-gs-ca-zip-validation.json e ../neuro3d-tentorial-source-review.json.

Deployment da base não confirmado: GitHub sem status; Vercel 403 no time conhecido. Nenhuma autorização de time, login, reinstalação ou mudança de segurança. Hash remoto e situação do novo checkpoint devem ser lidos no comprovante privado da publicação; não declarar sucesso por inferência.



Validação do lote ZIP:168unitários/43arquivos,26casos únicos navegador/5arquivos desktop+Pixel7,TypeScript/build aprovados. Caso1 em ZIP recuperou notas/malha/ponto e hashes dos quatroRAWs de projeção;0erros/0nãoGET. Ver agregado específico.

## Próximo lote

Continue do último checkpoint remoto confirmado, branch feature/neuro3d-atlas. Leia AGENTS.md e NEXT_SESSION/CURRENT_STATE/ROADMAP/REFERENCES/VALIDATION; confira remoto e preserve os cinco não rastreados do original. Verifique primeiro deployment do hash exato sem repetir tentativas de autenticação: GitHub sem status e Vercel403 não comprovam falha nem sucesso. Não reinstale plugin nem presuma acesso ao time.

ZIP local GS-CA já entregue: não refazer leitor/XLS/componentes/notas/ZIP nem auditorias592/42/bordas/dezcasos. Leia neuro3d-gs-ca-zip.md, seu agregado de validação e neuro3d-tentorial-source-review.json. Priorize fontes individuais rotuladas/licenciadas para20ausências venosas/373lacunas/setetermos. O suplemento tentorial AJNR2020 é candidato concreto, mas metadados200 não comprovam licença/mascaras: revisão401/árvore404. Não contornar autenticação; obtenha release/listagem/licença pública verificável antes de baixar/importar. JNET2026 dá classificação/referência, não geometria; camundongos não preenchem vasos humanos. Jülich/HCPex continuam contexto candidato sem transformação comprovada.

Se não houver nova geometria comprovável, avance em lote funcional substancial na revisão vascular local, como traçado pessoal de ramos em múltiplos cortes com pontos Sv/Sw, medidas e exportação vinculada aos hashes, explicitamente hipótese e sem integrar ao atlas ou certificar continuidade luminal. Aproveite os controles/notas existentes; mantenha coordenadas fracionárias e matrizes4×4column-major. Não mistureSv/Sw,LPS e atlas. PreserveGaleno,seteIDs,ICAvidiana/meningolacrimal,Paciente3D,Doppler,Mentice/VascularTwin,REA/Ankyras. Sem pontes, deslocamentos, equivalência por proximidade, execução de fornecedor ou redistribuição restrita.

Valide fluxos/vistas e dados locais pertinentes, atualize continuidade concisa, publique semmerge/force e entregue hash remoto, deployment efetivamente verificado, ganhos, pendências e próximo prompt.

---

# Próxima sessão — completude e contexto anatômico


## 22/10/2026 — anotações pessoais e fontes adicionais

Base ea95218c3b420dcc082736c445ebc8ba71e6ce81; local continuation/vascular-review-notes. AnotaçõesGS-CA exportáveis/importáveis, hashes individuais/contexto/malha exata, ponto fracionário/corteinteiro, edição, remoção/desfazer, mesclagem sem sobrescrever conflitos e reabertura dos parâmetros/componentes somente após coincidência geométrica. Sempre hipótese/observação pessoal, flagsanatômica/registrofalse; semDB/envio.163unitários/42arquivos,22casos navegador/4arquivos desktop+Pixel7,TypeScript/build aprovados; caso real1 comJSONidêntico após round-trip ehash/componente/ponto recuperados,0erros/0nãoGET. Capturas privadas.

Lista12fontes do novo anexo avaliada/catalogada emNeuroangio→Revisãovenosa; Jülich/HCPex candidatos de contexto, DSI/brainlife ferramentas nãoexecutadas; Radiopaedia402 eEmbryoCCBYNCND explícitos. Busca dirigida5candidatos não comprovou geometria individual reutilizável:20/373/setetermos inalterados. Galeno/seteIDs/componentesICAvidiana/meningolacrimal/demaisfrentes preservados. Ver ../neuro3d-gs-ca-review-notes.md, ../neuro3d-additional-databases.md e relatório de busca. Não repetidos592/42/bordas/10volumes. ZIPautomático pendente. Checkpoint é identificado pelo commit deste arquivo; remoto/deployment exatos no comprovante privado.

## Próximo lote

Continue o Qbank-neuro3D do último checkpoint confirmado, branch feature/neuro3d-atlas. Leia AGENTS.md e docs/ai-context/NEXT_SESSION.md, CURRENT_STATE.md, ROADMAP.md, REFERENCES.md e VALIDATION.md; confira remoto e preserve alteraçõeslocais e cinco arquivos não rastreados no original. Execute lote longo com funcionalidades úteis e completude Neuroangio, sem repetir auditorias prontas.
Leia docs/neuro3d-gs-ca-review-notes.md e agregado de validação. Já entregues anotações pessoaisGSCA emJSON com hashes individuais/contexto/malha exata, ponto fracionário, parâmetros/componentes, edição/remover/desfazer, importação com prévia/mesclagem atômica e reabertura do contexto; nenhuma identidade promovida. Leitor/XLS/componentes/cortes/inspeçãonativa já existem; não refaça.
O usuário enviou12fontes adicionais: leia docs/neuro3d-additional-databases.md, anatomySourceCandidates.ts e neuro3d-venous-source-search-2026-10-22.json. Jülich/BigBrain eHCPex são candidatos de contexto; verificar arquivo/release/licença/espaço e pares de marcos antes de eventual integração independente. DSI/brainlife nãoforamexecutados; Radiopaedia402; EmbryoAtlasCCBYNCND; BodyParts3D já pertence àlinhagem existente. CommonsNevit tem licença declarada, masSTL não baixado nem canais individuais comprovados. Não confunda consulta com importação/execução.
PrioridadeP0: fontes individuais rotuladas/licenciadas para20ausências venosas,373lacunas e7termos. Exijaidentidade/lado/ramos/curso/conexões e não use grupos/homônimos ou geometria poraparência. EstudosAJNR e modelosanotadosCohen são referências/candidatos semativos individuais reutilizáveis confirmados nesta busca. Registre bloqueio específico se faltar prova e avance em função utilizável, comoZIP local com limites prévios à descompressão ou contextoanatômico independente comprovado.
Preserve Galeno,seteidentidades,ICA-vidiana/meningo-lacrimal e todasasfrentes Paciente3D,Doppler,Mentice/VascularTwin,REA/Ankyras. Não crie pontes,mova vasos oumistureSv/Sw,LPS eatlas. Matrizes4×4column-major; ponto contínuo distinto do corteinteiro. Anotações ecomponentes não certificam lúmen,anastomose,mTRE/mRPD ou decisão clínica. Semexecutar fornecedor ouredistribuirrestritos. Não repetir592vasos/42cortes/bordas/10casos semevidência nova.
Validefluxos/vistas afetados comfixtures e dadoslocais pertinentes, atualizecontinuidade concisa, publique preview semmerge/force e entreguehash/deployment confirmados, ganhos,lacunas efetivamente reduzidas/bloqueadas e próximo prompt.
