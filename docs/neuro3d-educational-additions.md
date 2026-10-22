# Vasos e redes ilustrativos adicionais — 20/10/2026

## O que foi adicionado

301 estruturas ilustrativas originais (157 modelos de identidade): todos os 223 IDs individuais que estavam ausentes na matriz anterior, mais 78 representações para alvos nomeados do diagrama. Não são malhas recuperadas de repositórios, segmentações radiológicas ou coordenadas medidas. As 52 reconstruções anteriores continuam separadas na implementação; total de 353 reconstruções e 1112 estruturas importadas ativas (1465 representações).

O GLB cardiovascular fixado foi novamente conferido contra os nós já importados: não restaram nós cranianos/cervicais nomeados com os termos pesquisados para estas ausências. Os dois nós espinais iliolombares restantes ficam fora do recorte cervical e não foram usados como substitutos. Isso não esgota outras versões ou fontes.

A fonte BodyParts3D → Z-Anatomy → Anatria3D e as outras fontes já indexadas não confirmaram malhas nomeadas para esses 301 IDs. O mapeamento de identidade do inventário, a topologia e as referências Neuroangio orientam os desenhos. Os pontos de controle e raios foram arbitrados pelo autor da implementação, no referencial em centímetros do atlas; **não foram extraídos dos diagramas por triangulação, nem obtidos por registro de exames**. Nenhuma anatomia foi homologada.

## Como acessar

- Abra Anatomia detalhada → Estruturas ou Vasos e selecione a identidade. Apenas o trajeto selecionado é revelado quando a camada adicional está desligada.
- “Isolar árvore didática” ou “Isolar ramos de estudo” revela o conjunto e oculta os contextos não vasculares. “Focar seleção” enquadra a extensão visível.
- “Trajetos ilustrativos adicionais” habilita o conjunto geral; as variantes continuam separadas, salvo seleção individual ou opção explícita “Incluir variantes ilustrativas”. Essa opção combina possibilidades de estudo e não representa um indivíduo.
- As mesmas superfícies são usadas em anatomia 3D, angiografia de superfície 3D e projeção sintética 2D. Opacidade zero, ocultação manual e filtro de seleção valem também para as novas veias.
- As adições não ampliam o grafo de instrumentos ou a injeção da estação procedural. Relações pai/filho são de estudo e não comprovam óstios, luz, fluxo ou drenagem.

## Limites e pendências exatas

- Sete entradas permanecem sem identidade geométrica: conflito 107 e números 4, 26b, 70a, 74a, 114a e 115a visíveis apenas nas figuras. Não foram inventados vasos para esses números.
- Segmentos oftálmicos 6 e 7 continuam agrupados na malha original da oftálmica; não foi sobreposto outro tubo para simular segmentação.
- Grupos de perfurantes, ramos corticais, tributárias, redes e plexos têm trajetos representativos, não todos os componentes individualizados.
- As representações medulares são de segmentos cervicais C1–C7; não cobrem a circulação toracolombossacra nem substituem um atlas da medula inteira.
- Arcadas e vias de anastomose são desenhos de relações possíveis. Registro osteovascular, canais/forames, extremidades e calibre continuam pendentes; não se presume comunicação patente.
- As 241 malhas vasculares originais, incluindo as 2 faríngeas contestadas preservadas em auditoria, não foram deformadas nem substituídas por estas adições. Achados da maxilar/MMA e junções venosas continuam em revisão.
- Ter ilustração para um ID não elimina a falta de malha importada ativa. A matriz conserva `referenceMissingIds` e `illustratedIds`; nenhuma aprovação anatômica é inferida de “presente”.
- Não é aquisição/reconstrução rotacional volumétrica verdadeira, nem validação de aneurismas ou reprodução do Mentice.

## Proveniência e reprodutibilidade

`tools/neuro3d/build_educational_vessels.py` conserva os controles originais e gera `educational-vascular-paths.json`. `educationalVessels.ts` suaviza as curvas com Catmull–Rom centrípeta e cria superfícies fechadas com quadros transportados (32 anéis, 10 lados por trajeto); grupos podem conter várias superfícies fechadas independentes, sem união booleana. Os controles direitos são espelhados em x apenas nos desenhos originais novos. **Nenhuma malha importada é espelhada, movida ou unida automaticamente.**

Licença das novas curvas: CC BY-SA 4.0. Referências externas identificam a anatomia/topologia, não licenciam cópia de suas imagens. Não foram copiados figuras, modelos Mentice, segmentações restritas, livros privados ou novos ativos de licença incerta.

## Catálogo integral

| Grupo | Identidade | IDs adicionais | Referência de topologia |
|---|---|---|---|
| Maxilar · mandibular e pterigóidea | Artéria auricular profunda | `deep_auricular_artery_l`, `deep_auricular_artery_r` | [Neuroangio](https://neuroangio.org/anatomy-and-variants/diagrams-and-drawings/) |
| Maxilar · mandibular e pterigóidea | Artéria timpânica anterior | `anterior_tympanic_artery_l`, `anterior_tympanic_artery_r` | [Neuroangio](https://neuroangio.org/anatomy-and-variants/diagrams-and-drawings/) |
| Maxilar · mandibular e pterigóidea | Artéria meníngea acessória | `accessory_meningeal_artery_l`, `accessory_meningeal_artery_r` | [Neuroangio](https://neuroangio.org/anatomy-and-variants/accessory-meningeal-artery/) |
| Maxilar · mandibular e pterigóidea | Artéria massetérica | `masseteric_artery_l`, `masseteric_artery_r` | [Neuroangio](https://neuroangio.org/anatomy-and-variants/diagrams-and-drawings/) |
| Maxilar · mandibular e pterigóidea | Ramos pterigóideos da maxilar | `pterygoid_branches_of_maxillary_artery_l`, `pterygoid_branches_of_maxillary_artery_r` | [Neuroangio](https://neuroangio.org/anatomy-and-variants/diagrams-and-drawings/) |
| Maxilar · pterigopalatina | Artéria alveolar superior anterior | `anterior_superior_alveolar_artery_l`, `anterior_superior_alveolar_artery_r` | [Neuroangio](https://neuroangio.org/anatomy-and-variants/infraorbital-artery/) |
| Maxilar · pterigopalatina | Artéria alveolar superior média · variável | `middle_superior_alveolar_artery_l`, `middle_superior_alveolar_artery_r` | [Neuroangio](https://neuroangio.org/anatomy-and-variants/infraorbital-artery/) |
| Maxilar · pterigopalatina | Artéria palatina menor | `lesser_palatine_artery_l`, `lesser_palatine_artery_r` | [Neuroangio](https://neuroangio.org/anatomy-and-variants/diagrams-and-drawings/) |
| Maxilar · pterigopalatina | Artéria pterigovaginal | `pterygovaginal_artery_l`, `pterygovaginal_artery_r` | [Neuroangio](https://neuroangio.org/anatomy-and-variants/pterygovaginal-artery/) |
| Maxilar · pterigopalatina | Artéria do forame redondo · contribuição maxilar | `artery_of_foramen_rotundum_from_maxillary_l`, `artery_of_foramen_rotundum_from_maxillary_r` | [Neuroangio](https://neuroangio.org/anatomy-and-variants/diagrams-and-drawings/) |
| Maxilar · pterigopalatina | Artéria esfenopalatina | `sphenopalatine_artery_l`, `sphenopalatine_artery_r` | [Neuroangio](https://neuroangio.org/anatomy-and-variants/diagrams-and-drawings/) |
| ACA · córtex e perfurantes | Artéria recorrente de Heubner | `recurrent_artery_of_heubner_l`, `recurrent_artery_of_heubner_r` | [Neuroangio](https://neuroangio.org/anatomy-and-variants/anterior-cerebral-artery/) |
| ACA · córtex e perfurantes | Artérias lenticuloestriadas mediais | `medial_lenticulostriate_arteries_l`, `medial_lenticulostriate_arteries_r` | [Neuroangio](https://neuroangio.org/anatomy-and-variants/anterior-cerebral-artery/) |
| ACA · córtex e perfurantes | Artéria frontopolar | `frontopolar_artery_l`, `frontopolar_artery_r` | [Neuroangio](https://neuroangio.org/anatomy-and-variants/anterior-cerebral-artery/) |
| ACA · córtex e perfurantes | Artéria frontal interna anterior | `anterior_internal_frontal_artery_l`, `anterior_internal_frontal_artery_r` | [Neuroangio](https://neuroangio.org/anatomy-and-variants/anterior-cerebral-artery/) |
| ACA · córtex e perfurantes | Artéria frontal interna média | `middle_internal_frontal_artery_l`, `middle_internal_frontal_artery_r` | [Neuroangio](https://neuroangio.org/anatomy-and-variants/anterior-cerebral-artery/) |
| ACA · córtex e perfurantes | Artéria frontal interna posterior | `posterior_internal_frontal_artery_l`, `posterior_internal_frontal_artery_r` | [Neuroangio](https://neuroangio.org/anatomy-and-variants/anterior-cerebral-artery/) |
| ACA · córtex e perfurantes | Artéria paracentral | `paracentral_artery_l`, `paracentral_artery_r` | [Neuroangio](https://neuroangio.org/anatomy-and-variants/anterior-cerebral-artery/) |
| ACA · córtex e perfurantes | Artéria parietal interna superior | `superior_internal_parietal_artery_l`, `superior_internal_parietal_artery_r` | [Neuroangio](https://neuroangio.org/anatomy-and-variants/anterior-cerebral-artery/) |
| ACA · córtex e perfurantes | Artéria parietal interna inferior | `inferior_internal_parietal_artery_l`, `inferior_internal_parietal_artery_r` | [Neuroangio](https://neuroangio.org/anatomy-and-variants/anterior-cerebral-artery/) |
| ACA · córtex e perfurantes | Artéria subcalosa | `subcallosal_artery` | [Neuroangio](https://neuroangio.org/anatomy-and-variants/anterior-cerebral-artery/) |
| ACM · divisões e córtex | ACM · divisão superior M2 | `middle_cerebral_artery_m2_superior_division_l`, `middle_cerebral_artery_m2_superior_division_r` | [Neuroangio](https://neuroangio.org/anatomy-and-variants/middle-cerebral-artery/) |
| ACM · divisões e córtex | ACM · divisão inferior M2 | `middle_cerebral_artery_m2_inferior_division_l`, `middle_cerebral_artery_m2_inferior_division_r` | [Neuroangio](https://neuroangio.org/anatomy-and-variants/middle-cerebral-artery/) |
| ACM · divisões e córtex | ACM · exemplos de ramos M4 | `middle_cerebral_artery_m4_cortical_branches_l`, `middle_cerebral_artery_m4_cortical_branches_r` | [Neuroangio](https://neuroangio.org/anatomy-and-variants/middle-cerebral-artery/) |
| ACoP e ACP · perfurantes e coroideas | Artérias talamoperfurantes anteriores | `anterior_thalamoperforating_arteries_l`, `anterior_thalamoperforating_arteries_r` | [Neuroangio](https://neuroangio.org/anatomy-and-variants/diagrams-and-drawings/) |
| ACoP e ACP · perfurantes e coroideas | Artérias talamoperfurantes posteriores · P1 | `posterior_thalamoperforating_arteries_l`, `posterior_thalamoperforating_arteries_r` | [Neuroangio](https://neuroangio.org/anatomy-and-variants/diagrams-and-drawings/) |
| ACoP e ACP · perfurantes e coroideas | Artérias talamogeniculadas | `thalamogeniculate_arteries_l`, `thalamogeniculate_arteries_r` | [Neuroangio](https://neuroangio.org/anatomy-and-variants/diagrams-and-drawings/) |
| ACoP e ACP · perfurantes e coroideas | Artéria coroidea posterior medial | `medial_posterior_choroidal_artery_l`, `medial_posterior_choroidal_artery_r` | [Neuroangio](https://neuroangio.org/anatomy-and-variants/diagrams-and-drawings/) |
| ACoP e ACP · perfurantes e coroideas | Artéria coroidea posterior lateral | `lateral_posterior_choroidal_artery_l`, `lateral_posterior_choroidal_artery_r` | [Neuroangio](https://neuroangio.org/anatomy-and-variants/diagrams-and-drawings/) |
| ACP · córtex | Ramo temporal anterior da ACP | `anterior_temporal_branch_of_pca_l`, `anterior_temporal_branch_of_pca_r` | [Neuroangio](https://neuroangio.org/anatomy-and-variants/diagrams-and-drawings/) |
| ACP · córtex | Ramos temporais médios da ACP | `middle_temporal_branches_of_pca_l`, `middle_temporal_branches_of_pca_r` | [Neuroangio](https://neuroangio.org/anatomy-and-variants/diagrams-and-drawings/) |
| ACP · córtex | Ramo temporal posterior da ACP | `posterior_temporal_branch_of_pca_l`, `posterior_temporal_branch_of_pca_r` | [Neuroangio](https://neuroangio.org/anatomy-and-variants/diagrams-and-drawings/) |
| ACP · córtex | Artéria calcarina | `calcarine_artery_l`, `calcarine_artery_r` | [Neuroangio](https://neuroangio.org/anatomy-and-variants/diagrams-and-drawings/) |
| ACP · córtex | Artéria pericalosa posterior · esplenial | `posterior_pericallosal_artery_l`, `posterior_pericallosal_artery_r` | [Neuroangio](https://neuroangio.org/anatomy-and-variants/diagrams-and-drawings/) |
| ACI · sela e coroidea anterior | Artérias hipofisárias superiores | `superior_hypophyseal_arteries_l`, `superior_hypophyseal_arteries_r` | [Neuroangio](https://neuroangio.org/anatomy-and-variants/superior-hypophyseal-artery/) |
| ACI · sela e coroidea anterior | Artéria capsular de McConnell | `capsular_artery_of_mcconnell_l`, `capsular_artery_of_mcconnell_r` | [Neuroangio](https://neuroangio.org/anatomy-and-variants/diagrams-and-drawings/) |
| ACI · sela e coroidea anterior | Coroidea anterior · ramos plexais | `anterior_choroidal_artery_plexal_branches_l`, `anterior_choroidal_artery_plexal_branches_r` | [Neuroangio](https://neuroangio.org/anatomy-and-variants/anterior-choroidal-artery/) |
| ACI · sela e coroidea anterior | Coroidea anterior · perfurantes cisternais | `anterior_choroidal_artery_cisternal_perforators_l`, `anterior_choroidal_artery_cisternal_perforators_r` | [Neuroangio](https://neuroangio.org/anatomy-and-variants/anterior-choroidal-artery/) |
| Cerebelo e tronco · ramos | PICA · divisão medial/vermiana | `medial_branch_of_pica_l`, `medial_branch_of_pica_r` | [Neuroangio](https://neuroangio.org/anatomy-and-variants/diagrams-and-drawings/) |
| Cerebelo e tronco · ramos | PICA · divisão lateral/hemisférica | `lateral_branch_of_pica_l`, `lateral_branch_of_pica_r` | [Neuroangio](https://neuroangio.org/anatomy-and-variants/diagrams-and-drawings/) |
| Cerebelo e tronco · ramos | PICA · perfurantes bulbares | `perforating_branches_of_pica_l`, `perforating_branches_of_pica_r` | [Neuroangio](https://neuroangio.org/anatomy-and-variants/diagrams-and-drawings/) |
| Cerebelo e tronco · ramos | PICA · ramos coroideos | `choroidal_branches_of_pica_l`, `choroidal_branches_of_pica_r` | [Neuroangio](https://neuroangio.org/anatomy-and-variants/diagrams-and-drawings/) |
| Cerebelo e tronco · ramos | Artéria labiríntica · origem AICA ilustrada | `labyrinthine_artery_l`, `labyrinthine_artery_r` | [Neuroangio](https://neuroangio.org/anatomy-and-variants/diagrams-and-drawings/) |
| Cerebelo e tronco · ramos | Artéria subarqueada | `subarcuate_artery_l`, `subarcuate_artery_r` | [Neuroangio](https://neuroangio.org/anatomy-and-variants/diagrams-and-drawings/) |
| Cerebelo e tronco · ramos | AICA · perfurantes | `perforating_branches_of_aica_l`, `perforating_branches_of_aica_r` | [Neuroangio](https://neuroangio.org/anatomy-and-variants/diagrams-and-drawings/) |
| Cerebelo e tronco · ramos | AICA · exemplos de ramos corticais | `cortical_branches_of_aica_l`, `cortical_branches_of_aica_r` | [Neuroangio](https://neuroangio.org/anatomy-and-variants/diagrams-and-drawings/) |
| Cerebelo e tronco · ramos | ACS · ramo vermiano | `vermian_branch_of_superior_cerebellar_artery_l`, `vermian_branch_of_superior_cerebellar_artery_r` | [Neuroangio](https://neuroangio.org/anatomy-and-variants/diagrams-and-drawings/) |
| Cerebelo e tronco · ramos | ACS · ramo hemisférico | `hemispheric_branch_of_superior_cerebellar_artery_l`, `hemispheric_branch_of_superior_cerebellar_artery_r` | [Neuroangio](https://neuroangio.org/anatomy-and-variants/diagrams-and-drawings/) |
| Cerebelo e tronco · ramos | ACS · perfurantes | `perforating_branches_of_superior_cerebellar_artery_l`, `perforating_branches_of_superior_cerebellar_artery_r` | [Neuroangio](https://neuroangio.org/anatomy-and-variants/diagrams-and-drawings/) |
| Cerebelo e tronco · ramos | Vertebral · ramo meníngeo anterior | `anterior_meningeal_branch_of_vertebral_artery_l`, `anterior_meningeal_branch_of_vertebral_artery_r` | [Neuroangio](https://neuroangio.org/anatomy-and-variants/diagrams-and-drawings/) |
| Cerebelo e tronco · ramos | Artéria meníngea posterior · origem vertebral ilustrada | `posterior_meningeal_artery_l`, `posterior_meningeal_artery_r` | [Neuroangio](https://neuroangio.org/anatomy-and-variants/diagrams-and-drawings/) |
| Cervical e medular · C1–C7 ilustrados | Artéria tireoidiana superior | `superior_thyroid_artery_l`, `superior_thyroid_artery_r` | [Neuroangio](https://neuroangio.org/anatomy-and-variants/diagrams-and-drawings/) |
| Cervical e medular · C1–C7 ilustrados | Artéria cervical ascendente | `ascending_cervical_artery_l`, `ascending_cervical_artery_r` | [Neuroangio](https://neuroangio.org/anatomy-and-variants/diagrams-and-drawings/) |
| Cervical e medular · C1–C7 ilustrados | Artéria espinal posterior · segmento cervical | `posterior_spinal_artery_l`, `posterior_spinal_artery_r` | [Neuroangio](https://neuroangio.org/anatomy-and-variants/diagrams-and-drawings/) |
| Cervical e medular · C1–C7 ilustrados | Artéria espinal lateral · segmento cervical | `lateral_spinal_artery_l`, `lateral_spinal_artery_r` | [Neuroangio](https://neuroangio.org/anatomy-and-variants/diagrams-and-drawings/) |
| Cervical e medular · C1–C7 ilustrados | Artérias segmentares espinais · exemplos cervicais | `segmental_spinal_arteries_l`, `segmental_spinal_arteries_r` | [Neuroangio](https://neuroangio.org/anatomy-and-variants/diagrams-and-drawings/) |
| Cervical e medular · C1–C7 ilustrados | Artérias radiculomedulares · exemplos cervicais | `radiculomedullary_arteries_l`, `radiculomedullary_arteries_r` | [Neuroangio](https://neuroangio.org/anatomy-and-variants/diagrams-and-drawings/) |
| Cervical e medular · C1–C7 ilustrados | Artérias radiculopiais · exemplos cervicais | `radiculopial_arteries_l`, `radiculopial_arteries_r` | [Neuroangio](https://neuroangio.org/anatomy-and-variants/diagrams-and-drawings/) |
| Cervical e medular · C1–C7 ilustrados | Artérias radiculomeníngeas · exemplos cervicais | `radiculomeningeal_arteries_l`, `radiculomeningeal_arteries_r` | [Neuroangio](https://neuroangio.org/anatomy-and-variants/diagrams-and-drawings/) |
| Cervical e medular · C1–C7 ilustrados | Artérias sulcocomissurais · exemplos cervicais | `sulcocommissural_arteries_l`, `sulcocommissural_arteries_r` | [Neuroangio](https://neuroangio.org/anatomy-and-variants/diagrams-and-drawings/) |
| ACE · ramos durais e cervicofaciais | Artéria auricular posterior | `posterior_auricular_artery_l`, `posterior_auricular_artery_r` | [Neuroangio](https://neuroangio.org/anatomy-and-variants/diagrams-and-drawings/) |
| ACE · ramos durais e cervicofaciais | Artéria palatina ascendente | `ascending_palatine_artery_l`, `ascending_palatine_artery_r` | [Neuroangio](https://neuroangio.org/anatomy-and-variants/diagrams-and-drawings/) |
| ACE · ramos durais e cervicofaciais | Ramo tonsilar da facial | `tonsillar_branch_of_facial_artery_l`, `tonsillar_branch_of_facial_artery_r` | [Neuroangio](https://neuroangio.org/anatomy-and-variants/diagrams-and-drawings/) |
| ACE · ramos durais e cervicofaciais | Ramo parietal da temporal superficial | `parietal_branch_of_superficial_temporal_artery_l`, `parietal_branch_of_superficial_temporal_artery_r` | [Neuroangio](https://neuroangio.org/anatomy-and-variants/diagrams-and-drawings/) |
| ACE · ramos durais e cervicofaciais | Ramo petroso da meníngea média | `petrosal_branch_of_middle_meningeal_artery_l`, `petrosal_branch_of_middle_meningeal_artery_r` | [Neuroangio](https://neuroangio.org/anatomy-and-variants/diagrams-and-drawings/) |
| ACE · ramos durais e cervicofaciais | Ramo frontal da meníngea média | `frontal_branch_of_middle_meningeal_artery_l`, `frontal_branch_of_middle_meningeal_artery_r` | [Neuroangio](https://neuroangio.org/anatomy-and-variants/diagrams-and-drawings/) |
| ACE · ramos durais e cervicofaciais | Ramo parietal da meníngea média | `parietal_branch_of_middle_meningeal_artery_l`, `parietal_branch_of_middle_meningeal_artery_r` | [Neuroangio](https://neuroangio.org/anatomy-and-variants/diagrams-and-drawings/) |
| ACE · ramos durais e cervicofaciais | Ramo petrosquamoso da meníngea média | `petrosquamosal_branch_of_middle_meningeal_artery_l`, `petrosquamosal_branch_of_middle_meningeal_artery_r` | [Neuroangio](https://neuroangio.org/anatomy-and-variants/diagrams-and-drawings/) |
| ACE · ramos durais e cervicofaciais | Artéria estilomastóidea · origem auricular posterior ilustrada | `stylomastoid_artery_l`, `stylomastoid_artery_r` | [Neuroangio](https://neuroangio.org/anatomy-and-variants/diagrams-and-drawings/) |
| Venoso profundo | Veia cerebral magna · Galeno | `great_cerebral_vein` | [Neuroangio](https://neuroangio.org/venous-brain-anatomy/internal-cerebral-vein/) |
| Venoso profundo | Veia cerebral interna | `internal_cerebral_vein_l`, `internal_cerebral_vein_r` | [Neuroangio](https://neuroangio.org/venous-brain-anatomy/internal-cerebral-vein/) |
| Venoso profundo | Veia basal · Rosenthal | `basal_vein_of_rosenthal_l`, `basal_vein_of_rosenthal_r` | [Neuroangio](https://neuroangio.org/venous-brain-anatomy/basal-vein-of-rosenthal/) |
| Venoso profundo | Veia talamoestriada | `thalamostriate_vein_l`, `thalamostriate_vein_r` | [Neuroangio](https://neuroangio.org/venous-brain-anatomy/internal-cerebral-vein/) |
| Venoso profundo | Veia septal anterior | `anterior_septal_vein_l`, `anterior_septal_vein_r` | [Neuroangio](https://neuroangio.org/venous-brain-anatomy/internal-cerebral-vein/) |
| Venoso profundo | Veia septal posterior | `posterior_septal_vein_l`, `posterior_septal_vein_r` | [Neuroangio](https://neuroangio.org/venous-brain-anatomy/internal-cerebral-vein/) |
| Venoso profundo | Veia lateral direta · via alternativa | `direct_lateral_vein_l`, `direct_lateral_vein_r` | [Neuroangio](https://neuroangio.org/venous-brain-anatomy/internal-cerebral-vein/) |
| Venoso profundo | Veia caudada anterior | `anterior_caudate_vein_l`, `anterior_caudate_vein_r` | [Neuroangio](https://neuroangio.org/venous-brain-anatomy/internal-cerebral-vein/) |
| Venoso profundo | Veia caudada longitudinal | `longitudinal_caudate_vein_l`, `longitudinal_caudate_vein_r` | [Neuroangio](https://neuroangio.org/venous-brain-anatomy/internal-cerebral-vein/) |
| Venoso profundo | Veia coroidea superior | `superior_choroidal_vein_l`, `superior_choroidal_vein_r` | [Neuroangio](https://neuroangio.org/venous-brain-anatomy/internal-cerebral-vein/) |
| Venoso profundo | Veia ventricular inferior | `inferior_ventricular_vein_l`, `inferior_ventricular_vein_r` | [Neuroangio](https://neuroangio.org/venous-brain-anatomy/internal-cerebral-vein/) |
| Venoso profundo | Veia cerebral média profunda | `deep_middle_cerebral_vein_l`, `deep_middle_cerebral_vein_r` | [Neuroangio](https://neuroangio.org/venous-brain-anatomy/internal-cerebral-vein/) |
| Venoso profundo | Veias estriadas inferiores | `inferior_striate_veins_l`, `inferior_striate_veins_r` | [Neuroangio](https://neuroangio.org/venous-brain-anatomy/internal-cerebral-vein/) |
| Venoso profundo | Veia uncal | `uncal_vein_l`, `uncal_vein_r` | [Neuroangio](https://neuroangio.org/venous-brain-anatomy/internal-cerebral-vein/) |
| Venoso superficial | Veia cerebral média superficial · silviana | `superficial_middle_cerebral_vein_l`, `superficial_middle_cerebral_vein_r` | [Neuroangio](https://neuroangio.org/venous-brain-anatomy/) |
| Venoso superficial | Veia anastomótica superior · Trolard | `superior_anastomotic_vein_l`, `superior_anastomotic_vein_r` | [Neuroangio](https://neuroangio.org/venous-brain-anatomy/) |
| Venoso superficial | Veia anastomótica inferior · Labbé | `inferior_anastomotic_vein_l`, `inferior_anastomotic_vein_r` | [Neuroangio](https://neuroangio.org/venous-brain-anatomy/) |
| Venoso superficial | Veias cerebrais superiores · exemplos de pontes | `superior_cerebral_veins_l`, `superior_cerebral_veins_r` | [Neuroangio](https://neuroangio.org/venous-brain-anatomy/) |
| Venoso superficial | Veias cerebrais inferiores · exemplos | `inferior_cerebral_veins_l`, `inferior_cerebral_veins_r` | [Neuroangio](https://neuroangio.org/venous-brain-anatomy/) |
| Venoso profundo | Veias medulares cerebrais · exemplos | `medullary_veins_l`, `medullary_veins_r` | [Neuroangio](https://neuroangio.org/venous-brain-anatomy/internal-cerebral-vein/) |
| Venoso profundo | Veias transcerebrais · exemplos variáveis | `transcerebral_veins_l`, `transcerebral_veins_r` | [Neuroangio](https://neuroangio.org/venous-brain-anatomy/internal-cerebral-vein/) |
| Venoso · fossa posterior | Veia pré-central cerebelar | `precentral_cerebellar_vein` | [Neuroangio](https://neuroangio.org/venous-brain-anatomy/veins-posterior-fossa/) |
| Venoso · fossa posterior | Veia vermiana superior | `superior_vermian_vein` | [Neuroangio](https://neuroangio.org/venous-brain-anatomy/veins-posterior-fossa/) |
| Venoso · fossa posterior | Veias vermianas inferiores | `inferior_vermian_veins_l`, `inferior_vermian_veins_r` | [Neuroangio](https://neuroangio.org/venous-brain-anatomy/veins-posterior-fossa/) |
| Venoso · fossa posterior | Veia petrosa · coletor | `petrosal_vein_l`, `petrosal_vein_r` | [Neuroangio](https://neuroangio.org/venous-brain-anatomy/veins-posterior-fossa/) |
| Venoso · fossa posterior | Veia mesencefálica lateral | `lateral_mesencephalic_vein_l`, `lateral_mesencephalic_vein_r` | [Neuroangio](https://neuroangio.org/venous-brain-anatomy/veins-posterior-fossa/) |
| Venoso · fossa posterior | Veia bulbar lateral | `lateral_medullary_vein_l`, `lateral_medullary_vein_r` | [Neuroangio](https://neuroangio.org/venous-brain-anatomy/veins-posterior-fossa/) |
| Venoso · fossa posterior | Veia da fissura cerebelopontina | `cerebellopontine_fissure_vein_l`, `cerebellopontine_fissure_vein_r` | [Neuroangio](https://neuroangio.org/venous-brain-anatomy/veins-posterior-fossa/) |
| Venoso · fossa posterior | Veias cerebelares hemisféricas superiores · exemplos | `superior_hemispheric_cerebellar_veins_l`, `superior_hemispheric_cerebellar_veins_r` | [Neuroangio](https://neuroangio.org/venous-brain-anatomy/veins-posterior-fossa/) |
| Venoso · fossa posterior | Veias cerebelares hemisféricas inferiores · exemplos | `inferior_hemispheric_cerebellar_veins_l`, `inferior_hemispheric_cerebellar_veins_r` | [Neuroangio](https://neuroangio.org/venous-brain-anatomy/veins-posterior-fossa/) |
| Venoso · fossa posterior | Veia pontomesencefálica anterior | `anterior_pontomesencephalic_vein` | [Neuroangio](https://neuroangio.org/venous-brain-anatomy/veins-posterior-fossa/) |
| Venoso · fossa posterior | Veia pontobulbar anterior | `anterior_pontomedullary_vein` | [Neuroangio](https://neuroangio.org/venous-brain-anatomy/veins-posterior-fossa/) |
| Venoso · seios e base do crânio | Confluência dos seios · torcular | `confluence_of_sinuses` | [Neuroangio](https://neuroangio.org/venous-brain-anatomy/) |
| Venoso · seios e base do crânio | Seio marginal · anel perimagno | `marginal_sinus` | [Neuroangio](https://neuroangio.org/venous-brain-anatomy/) |
| Venoso · seios e base do crânio | Seio falcino persistente · variante | `falcine_sinus` | [Neuroangio](https://neuroangio.org/venous-brain-anatomy/) |
| Venoso · seios e base do crânio | Seio esfenoparietal · representação convencional | `sphenoparietal_sinus_l`, `sphenoparietal_sinus_r` | [Neuroangio](https://neuroangio.org/venous-brain-anatomy/cavernous-sinus/) |
| Venoso · seios e base do crânio | Seio esfenobasal · variante | `sphenobasal_sinus_l`, `sphenobasal_sinus_r` | [Neuroangio](https://neuroangio.org/venous-brain-anatomy/) |
| Venoso · seios e base do crânio | Seio esfenopetroso · variante | `sphenopetrosal_sinus_l`, `sphenopetrosal_sinus_r` | [Neuroangio](https://neuroangio.org/venous-brain-anatomy/) |
| Venoso · emissárias e plexos | Plexo venoso pterigóideo · malha ilustrativa | `pterygoid_venous_plexus_l`, `pterygoid_venous_plexus_r` | [Neuroangio](https://neuroangio.org/venous-brain-anatomy/cavernous-sinus/) |
| Venoso · emissárias e plexos | Veias diploicas · exemplos | `diploic_veins_l`, `diploic_veins_r` | [Neuroangio](https://neuroangio.org/venous-brain-anatomy/) |
| Venoso · emissárias e plexos | Veia emissária mastoidea | `mastoid_emissary_vein_l`, `mastoid_emissary_vein_r` | [Neuroangio](https://neuroangio.org/venous-brain-anatomy/) |
| Venoso · emissárias e plexos | Veias emissárias condilares · exemplos | `condylar_emissary_veins_l`, `condylar_emissary_veins_r` | [Neuroangio](https://neuroangio.org/venous-brain-anatomy/) |
| Venoso · emissárias e plexos | Veia emissária parietal | `parietal_emissary_vein_l`, `parietal_emissary_vein_r` | [Neuroangio](https://neuroangio.org/venous-brain-anatomy/) |
| Venoso · segmento cervical medular | Veia espinal anterior · segmento cervical | `anterior_spinal_vein` | [Neuroangio](https://neuroangio.org/venous-brain-anatomy/) |
| Venoso · segmento cervical medular | Veias espinais posteriores · segmentos cervicais | `posterior_spinal_veins_l`, `posterior_spinal_veins_r` | [Neuroangio](https://neuroangio.org/venous-brain-anatomy/) |
| Venoso · segmento cervical medular | Veias radiculomedulares · exemplos cervicais | `radiculomedullary_veins_l`, `radiculomedullary_veins_r` | [Neuroangio](https://neuroangio.org/venous-brain-anatomy/) |
| Venoso · segmento cervical medular | Rede venosa perimedular · exemplos cervicais | `perimedullary_venous_plexus` | [Neuroangio](https://neuroangio.org/venous-brain-anatomy/) |
| Venoso · segmento cervical medular | Plexo venoso vertebral interno · exemplos cervicais | `internal_vertebral_venous_plexus` | [Neuroangio](https://neuroangio.org/venous-brain-anatomy/) |
| Venoso · segmento cervical medular | Plexo venoso vertebral externo · exemplos cervicais | `external_vertebral_venous_plexus` | [Neuroangio](https://neuroangio.org/venous-brain-anatomy/) |
| Neuroangio · redes orbitárias e durais | Artéria falcina anterior | `anterior_falcine_artery_l`, `anterior_falcine_artery_r` | [Neuroangio](https://neuroangio.org/anatomy-and-variants/diagrams-and-drawings/) |
| Neuroangio · redes orbitárias e durais | Ramos colaterais arteriais para o nervo óptico | `collateral_branches_to_optic_nerve_l`, `collateral_branches_to_optic_nerve_r` | [Neuroangio](https://neuroangio.org/anatomy-and-variants/diagrams-and-drawings/) |
| Neuroangio · redes orbitárias e durais | Conexões arteriais intercavernosas · esquema | `intercavernous_arterial_connections_l`, `intercavernous_arterial_connections_r` | [Neuroangio](https://neuroangio.org/anatomy-and-variants/diagrams-and-drawings/) |
| Neuroangio · redes orbitárias e durais | Arcada tentorial lateral · esquema | `lateral_tentorial_arterial_arcade_l`, `lateral_tentorial_arterial_arcade_r` | [Neuroangio](https://neuroangio.org/anatomy-and-variants/diagrams-and-drawings/) |
| Neuroangio · redes orbitárias e durais | Arcada clival lateral · esquema | `lateral_clival_arterial_arcade_l`, `lateral_clival_arterial_arcade_r` | [Neuroangio](https://neuroangio.org/anatomy-and-variants/diagrams-and-drawings/) |
| Neuroangio · redes orbitárias e durais | Ramo hipoglosso para a arcada odontoidea | `hypoglossal_branch_to_odontoid_arcade_l`, `hypoglossal_branch_to_odontoid_arcade_r` | [Neuroangio](https://neuroangio.org/anatomy-and-variants/diagrams-and-drawings/) |
| Neuroangio · redes orbitárias e durais | Arcada odontoidea epidural ventral · esquema | `odontoid_arterial_arcade_l`, `odontoid_arterial_arcade_r` | [Neuroangio](https://neuroangio.org/anatomy-and-variants/diagrams-and-drawings/) |
| Neuroangio · redes orbitárias e durais | Ramo jugular da occipital | `jugular_branch_of_occipital_artery_l`, `jugular_branch_of_occipital_artery_r` | [Neuroangio](https://neuroangio.org/anatomy-and-variants/diagrams-and-drawings/) |
| Neuroangio · redes orbitárias e durais | Arcada arterial do seio sigmoide · esquema | `sigmoid_sinus_arterial_arcade_l`, `sigmoid_sinus_arterial_arcade_r` | [Neuroangio](https://neuroangio.org/anatomy-and-variants/diagrams-and-drawings/) |
| Neuroangio · redes orbitárias e durais | Arcada arterial do seio transverso · esquema | `transverse_sinus_arterial_arcade_l`, `transverse_sinus_arterial_arcade_r` | [Neuroangio](https://neuroangio.org/anatomy-and-variants/diagrams-and-drawings/) |
| Neuroangio · redes orbitárias e durais | Artéria do seio reto · esquema | `straight_sinus_artery_l`, `straight_sinus_artery_r` | [Neuroangio](https://neuroangio.org/anatomy-and-variants/diagrams-and-drawings/) |
| Neuroangio · redes orbitárias e durais | Arcada arterial do seio sagital superior · esquema | `superior_sagittal_sinus_arterial_arcade_l`, `superior_sagittal_sinus_arterial_arcade_r` | [Neuroangio](https://neuroangio.org/anatomy-and-variants/diagrams-and-drawings/) |
| Neuroangio · redes orbitárias e durais | Ramo transmastóideo da occipital | `transmastoid_branch_of_occipital_artery_l`, `transmastoid_branch_of_occipital_artery_r` | [Neuroangio](https://neuroangio.org/anatomy-and-variants/diagrams-and-drawings/) |
| Neuroangio · redes orbitárias e durais | Artéria caroticotimpânica | `caroticotympanic_artery_l`, `caroticotympanic_artery_r` | [Neuroangio](https://neuroangio.org/anatomy-and-variants/diagrams-and-drawings/) |
| Neuroangio · redes orbitárias e durais | Conexão cavernosa AMM–ILT · lado espinhoso | `cavernous_branch_of_middle_meningeal_artery_l`, `cavernous_branch_of_middle_meningeal_artery_r` | [Neuroangio](https://neuroangio.org/anatomy-and-variants/diagrams-and-drawings/) |
| Neuroangio · redes orbitárias e durais | Artéria da fissura orbital superior | `superior_orbital_fissure_artery_l`, `superior_orbital_fissure_artery_r` | [Neuroangio](https://neuroangio.org/anatomy-and-variants/diagrams-and-drawings/) |
| Neuroangio · redes orbitárias e durais | Ramo da crista esfenoidal | `sphenoid_ridge_branch_l`, `sphenoid_ridge_branch_r` | [Neuroangio](https://neuroangio.org/anatomy-and-variants/diagrams-and-drawings/) |
| Neuroangio · redes orbitárias e durais | Ramo meníngeo recorrente profundo | `deep_recurrent_meningeal_branch_l`, `deep_recurrent_meningeal_branch_r` | [Neuroangio](https://neuroangio.org/anatomy-and-variants/diagrams-and-drawings/) |
| Neuroangio · redes orbitárias e durais | Arcada tentorial clinoidea · esquema | `clinoid_tentorial_arterial_arcade_l`, `clinoid_tentorial_arterial_arcade_r` | [Neuroangio](https://neuroangio.org/anatomy-and-variants/diagrams-and-drawings/) |
| Neuroangio · redes orbitárias e durais | Ramo posterior do ILT | `posterior_branch_of_ilt_l`, `posterior_branch_of_ilt_r` | [Neuroangio](https://neuroangio.org/anatomy-and-variants/diagrams-and-drawings/) |
| Neuroangio · redes orbitárias e durais | Ramo tubário da meníngea acessória | `eustachian_branch_of_accessory_meningeal_artery_l`, `eustachian_branch_of_accessory_meningeal_artery_r` | [Neuroangio](https://neuroangio.org/anatomy-and-variants/diagrams-and-drawings/) |
| Neuroangio · redes orbitárias e durais | Ramos arteriais da concha nasal inferior | `inferior_turbinate_arterial_branches_l`, `inferior_turbinate_arterial_branches_r` | [Neuroangio](https://neuroangio.org/anatomy-and-variants/diagrams-and-drawings/) |
| Neuroangio · redes orbitárias e durais | Ramos arteriais da concha nasal média | `middle_turbinate_arterial_branches_l`, `middle_turbinate_arterial_branches_r` | [Neuroangio](https://neuroangio.org/anatomy-and-variants/diagrams-and-drawings/) |
| Neuroangio · redes orbitárias e durais | Ramos arteriais da concha nasal superior | `superior_turbinate_arterial_branches_l`, `superior_turbinate_arterial_branches_r` | [Neuroangio](https://neuroangio.org/anatomy-and-variants/diagrams-and-drawings/) |
| Neuroangio · redes orbitárias e durais | Sistema septal nasal anterior · esquema | `anterior_nasal_septal_arterial_system_l`, `anterior_nasal_septal_arterial_system_r` | [Neuroangio](https://neuroangio.org/anatomy-and-variants/diagrams-and-drawings/) |
| Neuroangio · redes orbitárias e durais | Ramo submandibular da facial | `submandibular_branch_of_facial_artery_l`, `submandibular_branch_of_facial_artery_r` | [Neuroangio](https://neuroangio.org/anatomy-and-variants/diagrams-and-drawings/) |
| Neuroangio · redes orbitárias e durais | Artéria nasal superficial | `superficial_nasal_artery_l`, `superficial_nasal_artery_r` | [Neuroangio](https://neuroangio.org/anatomy-and-variants/diagrams-and-drawings/) |
| Neuroangio · redes orbitárias e durais | Artéria nasal dorsal | `dorsal_nasal_artery_l`, `dorsal_nasal_artery_r` | [Neuroangio](https://neuroangio.org/anatomy-and-variants/diagrams-and-drawings/) |
| Neuroangio · redes orbitárias e durais | Via temporal superficial–meníngea média · esquema | `sta_mma_anastomotic_pathway_l`, `sta_mma_anastomotic_pathway_r` | [Neuroangio](https://neuroangio.org/anatomy-and-variants/diagrams-and-drawings/) |
| Neuroangio · redes orbitárias e durais | Via occipital–meníngea média · esquema | `oa_mma_anastomotic_pathway_l`, `oa_mma_anastomotic_pathway_r` | [Neuroangio](https://neuroangio.org/anatomy-and-variants/diagrams-and-drawings/) |
| Neuroangio · redes orbitárias e durais | Vasocorona · exemplos cervicais | `vasocorona_l`, `vasocorona_r` | [Neuroangio](https://neuroangio.org/anatomy-and-variants/diagrams-and-drawings/) |
| Neuroangio · redes orbitárias e durais | Ramo arterial para o nervo hipoglosso | `arterial_branch_to_hypoglossal_nerve_l`, `arterial_branch_to_hypoglossal_nerve_r` | [Neuroangio](https://neuroangio.org/anatomy-and-variants/diagrams-and-drawings/) |
| Neuroangio · redes orbitárias e durais | Ramo occipital para a raiz C1 | `occipital_c1_root_branch_l`, `occipital_c1_root_branch_r` | [Neuroangio](https://neuroangio.org/anatomy-and-variants/diagrams-and-drawings/) |
| Neuroangio · redes orbitárias e durais | Via muscular occipital–vertebral em C1 · esquema | `occipital_vertebral_c1_pathway_l`, `occipital_vertebral_c1_pathway_r` | [Neuroangio](https://neuroangio.org/anatomy-and-variants/diagrams-and-drawings/) |
| Neuroangio · redes orbitárias e durais | Ramo muscular em C2 | `c2_muscular_arterial_branch_l`, `c2_muscular_arterial_branch_r` | [Neuroangio](https://neuroangio.org/anatomy-and-variants/diagrams-and-drawings/) |
| Neuroangio · redes orbitárias e durais | Ramos musculares segmentares · exemplos cervicais | `segmental_muscular_arterial_branches_l`, `segmental_muscular_arterial_branches_r` | [Neuroangio](https://neuroangio.org/anatomy-and-variants/diagrams-and-drawings/) |
| Neuroangio · redes orbitárias e durais | Via cervical ascendente–vertebral · esquema | `ascending_cervical_vertebral_pathway_l`, `ascending_cervical_vertebral_pathway_r` | [Neuroangio](https://neuroangio.org/anatomy-and-variants/diagrams-and-drawings/) |
| Variante embrionária | Artéria trigeminal persistente · variante | `persistent_trigeminal_artery_l`, `persistent_trigeminal_artery_r` | [Neuroangio](https://neuroangio.org/anatomy-and-variants/diagrams-and-drawings/) |
| Variante embrionária | Artéria oftálmica ventral persistente · variante | `persistent_ventral_ophthalmic_artery_l`, `persistent_ventral_ophthalmic_artery_r` | [Neuroangio](https://neuroangio.org/anatomy-and-variants/diagrams-and-drawings/) |
