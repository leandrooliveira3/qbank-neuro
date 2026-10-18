# Revisão de correspondência com os diagramas do Neuroangio — 18/10/2026

Fonte principal desta revisão: https://neuroangio.org/anatomy-and-variants/diagrams-and-drawings/

Foram confrontadas as 130 entradas da legenda atual e inspecionadas as quatro figuras vinculadas. Foram mantidos seis números visíveis apenas nas figuras e seis elementos supra-aórticos de contexto. O índice tem 142 entradas, não 142 vasos únicos. O atlas mantém 1114 estruturas importadas e 18 reconstruções didáticas.

**A compatibilidade geométrica integral ainda não foi atingida.** Os diagramas documentam redes e variantes; não fornecem coordenadas 3D ou calibres medidos. Esta revisão corrige identidade, cobertura e relações bibliográficas, sem apresentar uma correspondência nominal como validação anatômica.

Recuperação de 28 malhas adicionais: [neuro3d-unindexed-vessels.md](neuro3d-unindexed-vessels.md).

## Cobertura

| Estado | Entradas |
|---|---:|
| Malha importada | 49 |
| Reconstrução didática | 5 |
| Representação parcial | 8 |
| Pendente | 73 |
| Identidade a reconciliar | 7 |

Esses totais usam outro recorte que o índice anterior de 130 linhas/65 pendências. O antigo índice tinha duplicatas e subitens omitidos. O aumento de pendências reflete a correção do inventário; não representa perda de malhas.

## Correções

- **109:** variante oftálmica ventral persistente, sem malha correspondente. Retirado o mapeamento incorreto para o conjunto ACA, PCom, coroidea anterior, ACP, SCA, AICA, basilar e ACM.
- **8, 63, 64, 66 e 67:** o grupo etmoidal deixa de ter linha duplicada. A contribuição septal esfenopalatina é distinta das origens etmoidais; suas conexões são relações de rede.
- **17, 18, 36 e 37:** reconstruções de ramos passam a cobertura parcial, sem declarar a arcada/anastomose inteira presente.
- **57–59:** temporal profunda posterior separada dos ramos médio e alveolar superior anterior.
- **42 e 43:** arcada clinoide-tentorial e ramo posterior do ILT, conforme a legenda atual.
- **12a, 14a, 14b, 26a, 37a, 116a e 116b:** subitens antes omitidos acrescentados. Labiríntica e subarqueada são distintas.
- **15, 94 e 96:** conexão arterial intercavernosa não equivale ao seio venoso; coronárias medulares não são coronárias cardíacas; ramo arterial para o hipoglosso não é a malha do nervo.
- **105:** preservadas as duas ocorrências, intercostal suprema e tireoidiana inferior, com chaves distintas.
- **107:** a legenda repete intercostal suprema, mas a figura o posiciona no eixo aórtico torácico. Identidade não conciliada; nenhuma malha é selecionada como correspondência confirmada.
- **4, 26b, 70a, 74a, 114a e 115a:** números identificados nas figuras sem definição explícita na legenda. A identidade fica pendente, inclusive a divergência 26a/26b.
- **118:** cobertura parcial ampliada para 34 malhas associadas à ACM, incluindo M1/M2/M3 bilaterais e ramos corticais/estriados; não equivale à árvore completa homologada.
- **Reconstruções bilaterais:** âncora e fração do eixo carotídeo usam o lado correspondente. O trajeto distal continua ilustrativo, espelhado e transladado à âncora, sem homologação de óstio ou calibre.

## Rede e navegação no aplicativo

O Inventário permite busca exata pelo número, busca textual, filtros de cobertura, seleção das malhas existentes e consulta às origens e relações descritas. A seleção mostra os números correspondentes em qualquer representação do atlas. A busca de estruturas também reconhece os números e os nomes em português.

Foram documentadas 34 relações conceituais com fontes: clivais, MHT–ILT, orbitárias, timpânicas, faciais, nasais, transósseas e cervicais. **Essas relações não acrescentam tubos, continuidade geométrica ou caminhos de fluxo ao simulador.** Presença das duas extremidades não confirma a anastomose no modelo.

## Validação e limites

A implementação e a auditoria local passaram por TypeScript e 71 testes unitários antes de uma interrupção do ambiente de execução. Durante o build/publicação, a execução local ficou indisponível; os arquivos finais foram recuperados e reconstruídos pelo conector GitHub a partir do mesmo estado-base, com nova conferência de contagens, unicidade, referências e identidade arterial. Não se atribui uma nova execução local de TypeScript/testes a esse estado recuperado. O resultado do build remoto deve ser conferido no PR.

A conferência funcional do atlas e angiografia foi concluída em desktop e celular após a recuperação: oito testes de navegador, 74 testes unitários, TypeScript e build aprovados. Detalhes em [neuro3d-unindexed-vessels.md](neuro3d-unindexed-vessels.md). Continuam pendentes a comparação anatômica multiprojeção, a revisão especializada de cada trajeto/óstio/calibre, as relações osteodurais finas e a reconstrução completa das redes ainda ausentes. Não foram deformadas malhas reais para reproduzir proporções de ilustrações. Não foi executada validação clínica.

As figuras de referência foram consultadas, não redistribuídas. A atribuição e CC BY-SA 4.0 das malhas existentes são preservadas. Nenhum livro, imagem de paciente ou figura protegida foi acrescentado ao repositório.

## Lista integral

| Número | Estrutura | Estado | IDs identificados |
|---|---|---|---|
| 1 | Carótida interna | Malha importada | internal_carotid_artery_l, internal_carotid_artery_r |
| 2 | Tronco meningohipofisário | Reconstrução didática | meningohypophyseal_trunk_l, meningohypophyseal_trunk_r |
| 3 | Tronco inferolateral | Reconstrução didática | inferolateral_trunk_l, inferolateral_trunk_r |
| 5 | Artéria oftálmica | Malha importada | ophthalmic_artery_l, ophthalmic_artery_r |
| 6 | Alça intraorbitária da oftálmica | Pendente | — |
| 7 | Oftálmica intraorbitária distal | Pendente | — |
| 8 | Artérias etmoidais, grupo anterior e posterior | Malha importada | anterior_ethmoidal_artery_l, anterior_ethmoidal_artery_r, posterior_ethmoidal_artery_l, posterior_ethmoidal_artery_r |
| 9 | Meníngea anterior e falcina anterior | Pendente | — |
| 10 | Ciliares posteriores curtas | Malha importada | short_posterior_ciliary_arteries_l, short_posterior_ciliary_arteries_r |
| 11 | Ciliares posteriores longas | Malha importada | long_posterior_ciliary_arteries_l, long_posterior_ciliary_arteries_r |
| 12 | Artéria central da retina | Malha importada | central_retinal_artery_l, central_retinal_artery_r |
| 12a | Ramos colaterais para o nervo óptico | Pendente | — |
| 13 | Artéria lacrimal | Malha importada | lacrimal_artery_l, lacrimal_artery_r |
| 14 | Artéria hipofisária inferior | Reconstrução didática | inferior_hypophyseal_artery_l, inferior_hypophyseal_artery_r |
| 14a | Artérias hipofisárias superiores | Pendente | — |
| 14b | Artérias capsulares de McConnell | Pendente | — |
| 15 | Conexões arteriais intercavernosas | Pendente | — |
| 16 | Arcada tentorial lateral, borda petrosa | Pendente | — |
| 17 | Tentorial marginal, Bernasconi-Cassinari | Representação parcial | marginal_tentorial_artery_l, marginal_tentorial_artery_r |
| 18 | Arcada clival medial | Representação parcial | medial_clival_branch_l, medial_clival_branch_r |
| 19 | Arcada clival lateral | Pendente | — |
| 20 | Ramo hipoglossal para a arcada odontoidea | Pendente | — |
| 21 | Arcada odontoidea epidural ventral | Pendente | — |
| 22 | Divisão hipoglossal da faríngea ascendente | Pendente | — |
| 23a | Divisão jugular da faríngea ascendente | Pendente | — |
| 23b | Ramo jugular da occipital | Pendente | — |
| 24 | Meníngea posterior e ramos tentoriais | Pendente | — |
| 25 | Arcada arterial do seio sigmoide | Pendente | — |
| 26 | Arcada arterial do seio transverso | Pendente | — |
| 26a | Artéria do seio reto | Pendente | — |
| 27 | Arcada arterial do seio sagital superior | Pendente | — |
| 28 | Ramo transmastóideo da occipital | Pendente | — |
| 29 | Artéria occipital | Malha importada | occipital_artery_l, occipital_artery_r |
| 30 | Timpânica inferior da faríngea ascendente | Pendente | — |
| 31 | Ramo caroticotimpânico | Pendente | — |
| 32 | Artéria estilomastóidea | Pendente | — |
| 33 | Ramo petroso da meníngea média | Pendente | — |
| 34 | Ramo do forame lacerado da faríngea ascendente | Pendente | — |
| 35 | Conexão cavernosa AMM–ILT pelo forame espinhoso | Pendente | — |
| 36 | Ramo do forame oval do ILT | Representação parcial | foramen_ovale_branch_l, foramen_ovale_branch_r |
| 37 | Artéria do forame redondo, ILT–maxilar | Representação parcial | foramen_rotundum_branch_l, foramen_rotundum_branch_r |
| 37a | Artéria da fissura orbital superior | Pendente | — |
| 38 | Ramo anteromedial do ILT, remanescente oftálmico dorsal | Reconstrução didática | anteromedial_ilt_branch_l, anteromedial_ilt_branch_r |
| 39 | Artéria meníngea média | Malha importada | middle_meningeal_artery_l, middle_meningeal_artery_r |
| 40 | Ramo da crista esfenoidal | Pendente | — |
| 41 | Ramo meníngeo recorrente profundo | Pendente | — |
| 42 | Arcada tentorial clinoidea | Pendente | — |
| 43 | Ramo posterior do ILT | Pendente | — |
| 44 | Ramo frontal ou anterior da meníngea média | Pendente | — |
| 45 | Ramo parietal ou posterior da meníngea média | Pendente | — |
| 46 | Ramo petrosquamoso da meníngea média | Pendente | — |
| 47 | Artéria faríngea ascendente | Malha importada | ascending_pharyngeal_artery_l, ascending_pharyngeal_artery_r |
| 48 | Tronco faríngeo da faríngea ascendente | Pendente | — |
| 49 | Divisão inferior do tronco faríngeo | Pendente | — |
| 50 | Divisão média do tronco faríngeo | Pendente | — |
| 51 | Divisão superior do tronco faríngeo | Pendente | — |
| 52 | Artéria vidiana e canal pterigoideo | Malha importada | artery_of_pterygoid_canal_l, artery_of_pterygoid_canal_r |
| 53 | Artéria pterigovaginal | Pendente | — |
| 53a | Artéria meníngea acessória | Pendente | — |
| 54 | Ramo cutâneo ou tubário da meníngea acessória | Pendente | — |
| 55 | Artéria maxilar | Representação parcial | maxillary_artery_l, maxillary_artery_r |
| 56 | Artéria temporal profunda anterior | Malha importada | anterior_deep_temporal_artery_l, anterior_deep_temporal_artery_r |
| 57 | Artéria temporal profunda posterior | Malha importada | posterior_deep_temporal_artery_l, posterior_deep_temporal_artery_r |
| 58 | Artéria temporal profunda média | Pendente | — |
| 59 | Artéria alveolar superior anterior | Pendente | — |
| 60 | Ramos nasais laterais da esfenopalatina | Malha importada | posterior_lateral_nasal_branches_of_sphenopalatine_artery_l, posterior_lateral_nasal_branches_of_sphenopalatine_artery_r |
| 61 | Ramos para a concha nasal inferior | Pendente | — |
| 62 | Ramos para a concha nasal média | Pendente | — |
| 62a | Ramos para a concha nasal superior | Pendente | — |
| 63 | Ramo medial ou septal da esfenopalatina | Representação parcial | posterior_septal_branches_of_sphenopalatine_artery_l, posterior_septal_branches_of_sphenopalatine_artery_r |
| 64 | Sistema septal nasal posterior | Representação parcial | posterior_septal_branches_of_sphenopalatine_artery_l, posterior_septal_branches_of_sphenopalatine_artery_r |
| 65 | Sistema septal nasal anterior | Pendente | — |
| 66 | Artéria etmoidal posterior | Malha importada | posterior_ethmoidal_artery_l, posterior_ethmoidal_artery_r |
| 67 | Artéria etmoidal anterior | Malha importada | anterior_ethmoidal_artery_l, anterior_ethmoidal_artery_r |
| 68 | Artéria palatina descendente | Malha importada | descending_palatine_artery_l, descending_palatine_artery_r |
| 68a | Artéria palatina maior | Malha importada | greater_palatine_artery_l, greater_palatine_artery_r |
| 69 | Artéria palatina menor | Pendente | — |
| 70 | Artéria lingual | Pendente | — |
| 71 | Artéria submentoniana | Malha importada | submental_artery_l, submental_artery_r |
| 72 | Artéria alveolar inferior | Malha importada | inferior_alveolar_artery_l, inferior_alveolar_artery_r |
| 73 | Artéria facial | Malha importada | facial_artery_l, facial_artery_r |
| 73a | Ramo arterial submandibular | Pendente | — |
| 74 | Artéria palatina ascendente | Pendente | — |
| 75 | Artéria angular | Malha importada | angular_artery_l, angular_artery_r |
| 76 | Artéria labial inferior | Malha importada | inferior_labial_artery_l, inferior_labial_artery_r |
| 77 | Artéria labial superior | Malha importada | superior_labial_artery_l, superior_labial_artery_r |
| 78 | Artéria nasal superficial | Pendente | — |
| 79 | Artéria bucal | Malha importada | buccal_artery_l, buccal_artery_r |
| 80 | Artéria transversa da face | Malha importada | transverse_facial_artery_l, transverse_facial_artery_r |
| 81 | Artéria infraorbital | Malha importada | infra_orbital_artery_l, infra_orbital_artery_r |
| 82 | Artéria nasal dorsal | Pendente | — |
| 83 | Artéria supratroclear | Malha importada | supratrochlear_artery_l, supratrochlear_artery_r |
| 84 | Artéria supraorbital | Malha importada | supra_orbital_artery_l, supra_orbital_artery_r |
| 85 | Artéria temporal superficial | Malha importada | superficial_temporal_artery_l, superficial_temporal_artery_r |
| 86 | Ramo frontal da temporal superficial | Malha importada | frontal_branch_of_superficial_temporal_artery_l, frontal_branch_of_superficial_temporal_artery_r |
| 87 | Ramo parietal da temporal superficial | Pendente | — |
| 88 | Anastomose temporal superficial–meníngea média | Pendente | — |
| 89 | Anastomose occipital–meníngea média | Pendente | — |
| 90 | Artéria vertebral | Malha importada | vertebral_artery_l, vertebral_artery_r |
| 91 | Artéria espinal anterior | Malha importada | anterior_spinal_artery_l, anterior_spinal_artery_r |
| 92 | Artéria cerebelar posteroinferior, PICA | Malha importada | posterior_inferior_cerebellar_artery_l, posterior_inferior_cerebellar_artery_r |
| 93 | Sistema espinal lateral ou posterior | Pendente | — |
| 94 | Vasocorona e artérias circunferenciais medulares | Pendente | — |
| 95 | Artérias sulcocomissurais | Pendente | — |
| 96 | Ramo arterial para o nervo hipoglosso | Pendente | — |
| 97 | Ramo musculoespinal com conexões C1–C2 | Pendente | — |
| 98 | Ramo occipital para a raiz C1 | Pendente | — |
| 99 | Conexão muscular occipital–vertebral em C1 | Pendente | — |
| 100 | Ramo muscular em C2 | Pendente | — |
| 101 | Ramos musculares segmentares | Pendente | — |
| 102 | Artéria cervical profunda | Malha importada | deep_cervical_artery_l, deep_cervical_artery_r |
| 103 | Artéria cervical ascendente | Pendente | — |
| 104 | Anastomoses cervical ascendente–vertebral | Pendente | — |
| 105 | Artéria intercostal suprema | Malha importada | supreme_intercostal_artery_l, supreme_intercostal_artery_r |
| 105 | Artéria tireoidiana inferior | Malha importada | inferior_thyroid_artery_l, inferior_thyroid_artery_r |
| 106 | Artéria tireoidiana superior | Pendente | — |
| 107 | Intercostal suprema: legenda repetida, figura discordante | Identidade a reconciliar | — |
| 108 | Artéria trigeminal persistente | Pendente | — |
| 109 | Artéria oftálmica ventral persistente | Pendente | — |
| 110 | Artéria cerebral anterior | Malha importada | anterior_cerebral_artery_l, anterior_cerebral_artery_r |
| 111 | Artéria comunicante posterior | Malha importada | posterior_communicating_artery_l, posterior_communicating_artery_r |
| 112 | Artéria coroidea anterior | Reconstrução didática | anterior_choroidal_artery_l, anterior_choroidal_artery_r |
| 113 | Artérias coroideas posteriores, medial e lateral | Pendente | — |
| 114 | Artéria cerebral posterior | Malha importada | posterior_cerebral_artery_l, posterior_cerebral_artery_r |
| 115 | Artéria cerebelar superior | Malha importada | superior_cerebellar_artery_l, superior_cerebellar_artery_r |
| 116 | Artéria cerebelar anteroinferior, AICA | Malha importada | anterior_inferior_cerebellar_artery_l, anterior_inferior_cerebellar_artery_r |
| 116a | Artéria labiríntica | Pendente | — |
| 116b | Artéria subarqueada | Pendente | — |
| 117 | Artéria basilar | Malha importada | basilar_artery |
| 118 | Artéria cerebral média, M1 e ramos | Representação parcial | middle_cerebral_artery_m1_segment_l, middle_cerebral_artery_m1_segment_r, middle_cerebral_artery_m3_segment_r, insular_branches_of_middle_cerebral_artery_m2_r, parietal_branches_of_middle_cerebral_artery_l, parietal_branches_of_middle_cerebral_artery_r, temporal_branches_of_middle_cerebral_artery_l, temporal_branches_of_middle_cerebral_artery_r, postcentral_arterial_branch_l, postcentral_arterial_branch_r, insular_branches_of_middle_cerebral_artery_m2_l, middle_cerebral_artery_m3_segment_l, anterior_temporal_branch_of_mca_l, anterior_temporal_branch_of_mca_r, artery_of_central_sulcus_l, artery_of_central_sulcus_r, artery_of_precentral_sulcus_l, artery_of_precentral_sulcus_r, arterial_branch_to_angular_gyrus_l, arterial_branch_to_angular_gyrus_r, distal_lateral_striate_branches_l, distal_lateral_striate_branches_r, lateral_frontobasal_artery_l, lateral_frontobasal_artery_r, posterior_parietal_artery_l, posterior_parietal_artery_r, posterior_temporal_branch_of_mca_l, posterior_temporal_branch_of_mca_r, prefrontal_artery_l, prefrontal_artery_r, proximal_lateral_striate_branches_l, proximal_lateral_striate_branches_r, temporo_occipital_branch_of_mca_l, temporo_occipital_branch_of_mca_r |
| 4 | Rótulo 4 visível apenas na figura | Identidade a reconciliar | — |
| 26b | Rótulo 26b visível apenas na figura | Identidade a reconciliar | — |
| 70a | Rótulo 70a visível apenas na figura | Identidade a reconciliar | — |
| 74a | Rótulo 74a visível apenas na figura | Identidade a reconciliar | — |
| 114a | Rótulo 114a visível apenas na figura | Identidade a reconciliar | — |
| 115a | Rótulo 115a visível apenas na figura | Identidade a reconciliar | — |
| arch | Arco aórtico | Malha importada | aortic_arch |
| brachiocephalic | Tronco braquiocefálico | Malha importada | brachiocephalic_trunk |
| subclavian | Artérias subclávias | Malha importada | right_subclavian_artery, left_subclavian_artery |
| thyrocervical | Troncos tireocervicais | Malha importada | thyrocervical_trunk_l, thyrocervical_trunk_r |
| costocervical | Troncos costocervicais | Malha importada | costocervical_trunk_l, costocervical_trunk_r |
| transverse-cervical | Artérias cervicais transversas | Malha importada | transverse_cervical_artery_l, transverse_cervical_artery_r |

## Pendências e divergências, por extenso

- **6 — Alça intraorbitária da oftálmica**: Pendente.
- **7 — Oftálmica intraorbitária distal**: Pendente.
- **9 — Meníngea anterior e falcina anterior**: Pendente.
- **12a — Ramos colaterais para o nervo óptico**: Ramos ARTERIAIS para o nervo óptico; não são a malha do nervo nem a artéria central da retina..
- **14a — Artérias hipofisárias superiores**: Pendente.
- **14b — Artérias capsulares de McConnell**: Grupo capsular selar distinto das hipofisárias; hipófise não equivale a malha arterial..
- **15 — Conexões arteriais intercavernosas**: Conexão ARTERIAL intercavernosa, não o seio intercavernoso venoso..
- **16 — Arcada tentorial lateral, borda petrosa**: Arcada arterial petrosa distinta da tentorial marginal e do seio petroso superior..
- **17 — Tentorial marginal, Bernasconi-Cassinari**: Há reconstrução de um ramo marginal. A arcada e as conexões MHT–ILT permanecem incompletas..
- **18 — Arcada clival medial**: Há reconstrução de um ramo clival medial; faltam a arcada bilateral e a conexão com a divisão hipoglossal da APA..
- **19 — Arcada clival lateral**: Pendente.
- **20 — Ramo hipoglossal para a arcada odontoidea**: Pendente.
- **21 — Arcada odontoidea epidural ventral**: Pendente.
- **22 — Divisão hipoglossal da faríngea ascendente**: Pendente.
- **23a — Divisão jugular da faríngea ascendente**: Pendente.
- **23b — Ramo jugular da occipital**: Pendente.
- **24 — Meníngea posterior e ramos tentoriais**: Pendente.
- **25 — Arcada arterial do seio sigmoide**: Pendente.
- **26 — Arcada arterial do seio transverso**: Pendente.
- **26a — Artéria do seio reto**: Pendente.
- **27 — Arcada arterial do seio sagital superior**: Pendente.
- **28 — Ramo transmastóideo da occipital**: Pendente.
- **30 — Timpânica inferior da faríngea ascendente**: Pendente.
- **31 — Ramo caroticotimpânico**: Pendente.
- **32 — Artéria estilomastóidea**: Origem variável occipital ou auricular posterior; integra a arcada facial com 33..
- **33 — Ramo petroso da meníngea média**: Pendente.
- **34 — Ramo do forame lacerado da faríngea ascendente**: Pendente.
- **35 — Conexão cavernosa AMM–ILT pelo forame espinhoso**: Cavernoso da AMM e espinhoso do ILT nomeiam extremidades da mesma conexão, não redes independentes..
- **36 — Ramo do forame oval do ILT**: A reconstrução representa apenas a extremidade ILT. Falta a conexão com a meníngea acessória pelo oval..
- **37 — Artéria do forame redondo, ILT–maxilar**: A reconstrução representa apenas a extremidade ILT. Faltam a contribuição maxilar e a conexão completa pelo redondo..
- **37a — Artéria da fissura orbital superior**: Pendente.
- **40 — Ramo da crista esfenoidal**: Pendente.
- **41 — Ramo meníngeo recorrente profundo**: Pendente.
- **42 — Arcada tentorial clinoidea**: A legenda atual especifica arcada clinoide-tentorial, corrigindo o índice antigo inespecífico..
- **43 — Ramo posterior do ILT**: Ramo posterior do ILT na legenda atual; a descrição antiga de ramo clival foi corrigida..
- **44 — Ramo frontal ou anterior da meníngea média**: Pendente.
- **45 — Ramo parietal ou posterior da meníngea média**: Pendente.
- **46 — Ramo petrosquamoso da meníngea média**: Pendente.
- **48 — Tronco faríngeo da faríngea ascendente**: Pendente.
- **49 — Divisão inferior do tronco faríngeo**: Pendente.
- **50 — Divisão média do tronco faríngeo**: Pendente.
- **51 — Divisão superior do tronco faríngeo**: Pendente.
- **53 — Artéria pterigovaginal**: Pendente.
- **53a — Artéria meníngea acessória**: Pendente.
- **54 — Ramo cutâneo ou tubário da meníngea acessória**: Pendente.
- **55 — Artéria maxilar**: A malha maxilar está presente, mas suas subdivisões angiográficas precisam de conferência..
- **58 — Artéria temporal profunda média**: Pendente.
- **59 — Artéria alveolar superior anterior**: Pendente.
- **61 — Ramos para a concha nasal inferior**: Pendente.
- **62 — Ramos para a concha nasal média**: Pendente.
- **62a — Ramos para a concha nasal superior**: Pendente.
- **63 — Ramo medial ou septal da esfenopalatina**: Apenas a contribuição septal esfenopalatina foi mapeada. Etmoidais 66/67 têm outra origem e se conectam à rede; não são sinônimos deste ramo..
- **64 — Sistema septal nasal posterior**: Uma malha de ramo septal não representa todo o sistema septal posterior..
- **65 — Sistema septal nasal anterior**: Pendente.
- **69 — Artéria palatina menor**: Pendente.
- **70 — Artéria lingual**: Pendente.
- **73a — Ramo arterial submandibular**: Pendente.
- **74 — Artéria palatina ascendente**: Pendente.
- **78 — Artéria nasal superficial**: Pendente.
- **82 — Artéria nasal dorsal**: Pendente.
- **87 — Ramo parietal da temporal superficial**: Pendente.
- **88 — Anastomose temporal superficial–meníngea média**: Pendente.
- **89 — Anastomose occipital–meníngea média**: Pendente.
- **93 — Sistema espinal lateral ou posterior**: Pendente.
- **94 — Vasocorona e artérias circunferenciais medulares**: Rede pial circunferencial da medula, não artérias coronárias cardíacas..
- **95 — Artérias sulcocomissurais**: Pendente.
- **96 — Ramo arterial para o nervo hipoglosso**: Ramo ARTERIAL para o XII par, não a malha do nervo hipoglosso..
- **97 — Ramo musculoespinal com conexões C1–C2**: Pendente.
- **98 — Ramo occipital para a raiz C1**: Pendente.
- **99 — Conexão muscular occipital–vertebral em C1**: Pendente.
- **100 — Ramo muscular em C2**: Pendente.
- **101 — Ramos musculares segmentares**: Pendente.
- **103 — Artéria cervical ascendente**: Tronco cervical ascendente distinto das anastomoses 104..
- **104 — Anastomoses cervical ascendente–vertebral**: Pendente.
- **106 — Artéria tireoidiana superior**: Pendente.
- **107 — Intercostal suprema: legenda repetida, figura discordante**: A legenda repete intercostal suprema em 105 e 107; na figura 107 está no eixo aórtico torácico. Identidade pendente de reconciliação..
- **108 — Artéria trigeminal persistente**: Conexão embrionária persistente, não obrigatória em todo adulto..
- **109 — Artéria oftálmica ventral persistente**: Variante oftálmica ventral: conexão ACA/A1 ou ACI supraclinoidea–órbita. Não representa o conjunto de artérias intracranianas 110–118..
- **113 — Artérias coroideas posteriores, medial e lateral**: Grupo medial e lateral. A presença da ACP não preenche essas artérias..
- **116a — Artéria labiríntica**: Ramo labiríntico para o canal acústico interno e ouvido interno, distinto de 116b..
- **116b — Artéria subarqueada**: Ramo osteodural subarqueado no canal subarqueado/petromastóideo, distinto da labiríntica..
- **118 — Artéria cerebral média, M1 e ramos**: M1 e segmentos M2/M3 bilaterais identificados, com ramos corticais e estriados recuperados de nós omitidos pelo manifesto. Cobertura ampliada, mas óstios, continuidade, variantes, distribuição e árvore completa ainda exigem revisão. Apenas parte da estrutura/rede tem representação. A conexão completa permanece pendente.
- **4 — Rótulo 4 visível apenas na figura**: Sem definição explícita na legenda textual. Identidade pendente; não atribuir automaticamente a uma malha..
- **26b — Rótulo 26b visível apenas na figura**: Sem definição explícita na legenda textual. Identidade pendente; não atribuir automaticamente a uma malha..
- **70a — Rótulo 70a visível apenas na figura**: Sem definição explícita na legenda textual. Identidade pendente; não atribuir automaticamente a uma malha..
- **74a — Rótulo 74a visível apenas na figura**: Sem definição explícita na legenda textual. Identidade pendente; não atribuir automaticamente a uma malha..
- **114a — Rótulo 114a visível apenas na figura**: Sem definição explícita na legenda textual. Identidade pendente; não atribuir automaticamente a uma malha..
- **115a — Rótulo 115a visível apenas na figura**: Sem definição explícita na legenda textual. Identidade pendente; não atribuir automaticamente a uma malha..
