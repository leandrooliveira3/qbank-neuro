# Auditoria própria e prioridade Neuroangio — 21/10/2026

Base publicada confirmada:353d149586290e97670711ce02e0175fcae5a79d, feature/neuro3d-atlas, Vercel SUCCESS. Novo lote em continuation/neuroangio-priority, preservando checkout original e cinco arquivos não rastreados. Sem merge/force ou alteração de fontes sincronizadas.

## Direção expressa do usuário

O usuário elevou a completude arterial/venosa do atlas e da angiografia, com seleção individual, à maior prioridade. Autorizou auditoria própria e validação dos vasos criados por confronto com modelos 3D/atlas. Pediu conferir todos os ramos, extensão do trajeto, anastomoses e passagens por forames, com Neuroangio/Lasjaunias. Isso supera a ordem anterior de começar pelo visor GS-CA. O visor local MHD/RAW/RAD, VOI/ROI e coordenadas físicas continua pendente e preservado; não foi declarado entregue nesta etapa. Nenhuma frente de Paciente3D, Doppler, Mentice/VascularTwin ou REA/Ankyras foi cancelada.

## Auditoria própria executada, vaso por vaso

Ferramenta original `tools/neuro3d/audit_atlas_vessels.ts`, relatório [JSON](neuro3d-atlas-self-audit.json). Doze arquivos de geometria tiveram SHA conferido. Todos os GLBs vasculares ativos foram decodificados com Draco e hierarquia completa dos nós, mantendo matriz de origem e transformação comum metros×100/Y−160. Nenhuma geometria/identidade foi deslocada, renomeada ou conectada artificialmente.

**592 identidades geométricas:239 importadas ativas e353 reconstruídas.** Para cada uma: finitude/índices, faces degeneradas, componentes por índice, bordas, limites, versão simplificada de projeção e seleção em isolamento. Seis raycasts por identidade (AP/lateral/oblíqua, original/projeção):3552 verificações CPU, zero falhas; ação explícita de revelação também conferida para todas. Isso não equivale a testar todas no navegador nem a homologar anatomia.

As353 reconstruções foram confrontadas com todas as faces do respectivo pai de estudo:205 pais importados,148 reconstruídos. Distâncias dos extremos do eixo à superfície do pai registradas individualmente. São achados geométricos, sem provar óstio, continuidade de parede, patência, drenagem ou correlação com um paciente. Relações de estudo não alteram grafo procedural.

Cada vaso agora registra no relatório sua família de ramos/vias esperadas, IDs ausentes e ausência de referência importada por lado. Registra também ligações bibliográficas às passagens e campos separados para trajeto completo/anastomose verificada. Esses campos continuam não comprovados; presença do tronco ou conjunto ilustrativo não passa por todos os ramos reais. Não se declarou exaustividade de variantes.

Achados:28 faces degeneradas,14 em cada malha rotulada artéria central da retina; zero estruturas com arestas não-manifold por índices neste método. Costuras de índices e extremidades abertas não são reprovadas automaticamente. Diferenças de extensão original/projeção incluem retinal direita0,2028cm e PICA esquerda0,1385cm; não são erros de registro ou medidas clínicas. Galeno–seio reto permanece discordante, sem ponte. Sete identidades de diagrama preservadas.

## Melhorias reais no atlas/angiografia

- Novo índice Neuroangio pesquisável, filtro por sistema/evidência e auditoria exportável. Ação explícita **revelar e isolar** remove ocultação da seleção, filtros de família/conexão e cortes, ativa sua camada/sistema, ajusta o campo e mantém o mesmo ID nas vistas. Ativa o controle embrionário somente nessa ação explícita de revelação; seleção comum continua exigindo o checkbox.
- Seleções importadas isoladas passam a poder usar a **malha original completa na projeção2D**, conferida por SHA, com a mesma hierarquia/transformação do3D. Projeção geral e estação procedural conservam seus derivados existentes. PICA original37728triângulos versus699 na projeção geral; seio reto2304 versus699. Nenhum novo dataset clínico é redistribuído.
- Carregamento original cancelável por geração, descarte de respostas obsoletas, erro de integridade visível, botão de reabertura e opção explícita da geometria simplificada. Recursos Three/decoder descartados. Não há fallback silencioso que apresente a simplificação como original.
- Índices anteriores de Vasos/Inventário também usam a revelação explícita. Seleção comum mantém ocultações e foco separados. Família da meníngea média passou a listar ramo cavernoso e da crista esfenoidal, sem tratar conexão oftálmica como ramo obrigatório da AMM.

## Cobertura e fontes Neuroangio

Páginas efetivamente consultadas: [diagramas](https://neuroangio.org/anatomy-and-variants/diagrams-and-drawings/), [índice venoso](https://neuroangio.org/venous-brain-anatomy/), [superficial](https://neuroangio.org/venous-brain-anatomy/superficial-venous-system/), [índice profundo](https://neuroangio.org/venous-brain-anatomy/deep-venous-system/), [Rosenthal](https://neuroangio.org/venous-brain-anatomy/basal-vein-of-rosenthal/). As tentativas dos capítulos venous-sinuses/internal-cerebral-vein/posterior-fossa-veins falharam nesta sessão; não se declara revisão integral deles. Estado em neuroangioRequirements.ts. Não se copiaram imagens das páginas.

Dez canais venosos citados foram acrescentados como exigências individuais: cerebral anterior, temporal inferior, Rolando, temporo-occipital, frontais anteriores, parietal inferior, caudadas posteriores, atriais laterais, seio paracavernoso e seio tentorial. **Não foram criadas curvas para simular que esses20IDs bilaterais têm referência geométrica.** Coletor/canal vizinho não substitui a identidade. A representação como exigência bilateral é catálogo de estudo; não impõe presença/simetria em cada paciente.

Inventário atual:322 identidades/grupos (228 arteriais/94 venosos);612IDs esperados;592 representados sem homologação,20 sem geometria individual;373 sem malha importada ativa (267 arteriais/106 venosos), incluindo reconstruções já existentes. Os números aumentaram pela detecção de lacunas, não pela remoção de vasos. [Reconciliação atual](neuro3d-inventory-reconciliation.json).

## Forames, conteúdos e elos de estudo

Nova seção **Forames** com nove registros,18 conjuntos laterais e46 elos bibliográficos resolvidos aos IDs do atlas. Inclui redondo/V2, oval/V3, Vesálio alternativo, canal vidiano, espinhoso, meningo-orbitário/Hyrtl, fissura orbitária superior, canal hipoglosso e forame jugular. Vasos e contextos ósseos/nervosos disponíveis são selecionáveis; vínculos de retorno aparecem nas fichas vasculares. A ligação AMM–oftálmica inclui contribuição esfenoidal e artéria lacrimal nas25vias anteriores.

As rotas distinguem ACI petrosa C2 (vidiana) e cavernosa C4 (ILT). A meníngea acessória não é inteiramente intracraniana; a via oval não é universal, e Vesálio é uma alternativa descrita, não uma conexão obrigatória simultânea. Vias orbitárias são alternativas, não uma cadeia única. **Não há superfície/coordenada própria dos forames comprovada nesta fonte.** Mostrar esfenoide/V2/V3 é contexto, não marcar o centro do forame. Nervo vidiano individual permanece ausente. ACI inteira não certifica um segmento isolado ou óstio.

Conferência: [ILT Neuroangio](https://neuroangio.org/anatomy-and-variants/inferolateral-trunk/), [oftálmica Neuroangio](https://neuroangio.org/anatomy-and-variants/ophthalmic-artery-old/), [colaterais](https://neuroangio.org/sample-page/neuroangio-topics/intracranial-collateral-pathways/); trabalhos primários Lasjaunias/Moret/Mink1977 PMID876454 e Lasjaunias/Théron1976 PMID959564, resumos consultados.

Livro local original: Lasjaunias/Berenstein/terBrugge, *Clinical Vascular Anatomy and Variations*,2001,789páginas PDF, SHA421e89836286424a9642a4442d7cd218be333d8a911004032775e720ff97d327. Busca textual automática não equivale a leitura integral. Conferidas as páginas PDF293/317/322/437/475/490, correspondentes impressas273/297/302/418/456/471. Páginas317/437/475 também renderizadas e inspecionadas visualmente. Conteúdo/figuras permanecem privados. Evidência dirigida: via alternativa Vesálio p273; rede de base/AMA p297; distinção vidiana–pterigovaginal e ACI petrosa p302; ILT/FR/AMA/AMM Fig5.25,p418; variações tentoriais/orbitárias p456; V2/V3 e suprimento neural p471. Não houve nova leitura integral de todos os capítulos ou consenso especialista.

## Papel dos datasets

BRAVE/VENAT continuam em uso efetivo como superfícies/cortes físicos de referência, em espaços próprios. GS-CA teve auditoria local de geometria3D–2D. Nenhum contém nesta integração rótulos individuais comprovados que autorizem preencher todas as identidades do atlas. Não se estabeleceu registro entre fontes/atlas, transferência de rótulos ou modelo normativo a partir de paciente patológico. Os dados GS-CA e o livro não foram redistribuídos. CTA é complementar; seus limites de compressão/memória permanecem documentados.

## Validação e ponto de continuidade

TypeScript,129unitários/32arquivos e build aprovados; aviso de chunks>500kB permanece. Auditor offline executado integralmente. Validação final deste lote:129 testes unitários em32arquivos, TypeScript e build aprovados;32 casos únicos de navegador aprovados em desktop/Pixel7. A rodada ampla passou30/32; os dois testes de forames passaram após correção do seletor de teste para ID estável e rebuild. Não somar a repetição como novos casos. Capturas de seio reto3D, seio reto2D original, PICA original e contexto foraminal foram inspecionadas visualmente; capturas privadas em ../artifacts/neuroangio-final-captures. Auditor offline integral regenerado no código final. Reavaliação React: efeitos canceláveis, respostas obsoletas descartadas, recursos/decoder liberados, controles rotulados e seleção baseada em IDs. Aviso de chunks>500kB permanece. Estas verificações funcionais não provam continuidade anatômica ou registro clínico. Falhas iniciais: manifesto de contagens desatualizado corrigido por regeneração; botão de recuperação sem pointer-events corrigido; teste de nome de ramo ajustado para ID estável, sem alterar a identidade. Não somar repetições como novos casos.

Próximo lote prioritário: avançar da lista de exigências à comprovação individual de ramos, curso e conexões; obter marcos físicos verificáveis dos forames, manter as20ausências e373lacunas de referência explícitas e investigar fontes rotuladas/licenciadas. Não inferir continuidade por distância pequena ou criar pontes para zerar achados. GS-CA/VOI permanece apoio geométrico, com prioridade subordinada à completude solicitada.
