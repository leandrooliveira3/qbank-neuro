# Maxilar: inspeção dos componentes originais

A fonte contém nove componentes de vértices por lado sob o rótulo de maxilar. A enumeração abaixo segue os buffers originais e não atribui identidade anatômica a cada fragmento. Cortes e superfícies agrupadas podem produzir componentes separados; a conectividade dos índices não equivale, sozinha, à continuidade ou interrupção do lúmen. Nenhuma ponte, renomeação ou nova artéria foi criada.

Coordenadas em cm no referencial do atlas (Y original menos 160). Os limites e as distâncias vêm de `audit_vascular_meshes.py`, com hashes das fontes verificados. A extensão de um componente não identifica automaticamente porção mandibular, pterigóidea ou pterigopalatina.

| Lado | Componente | Vértices | Triângulos | Limite mínimo (x, y, z), cm | Limite máximo (x, y, z), cm |
| --- | ---: | ---: | ---: | --- | --- |
| Esquerdo | 1 | 300 | 576 | 2.668; -4.319; 4.893 | 2.765; -4.071; 5.076 |
| Esquerdo | 2 | 588 | 1152 | 2.726; -4.335; 4.521 | 2.931; -3.368; 5.223 |
| Esquerdo | 3 | 444 | 864 | 2.775; -5.182; 5.003 | 2.874; -4.954; 5.727 |
| Esquerdo | 4 | 300 | 576 | 2.704; -5.314; 4.738 | 2.764; -4.852; 4.894 |
| Esquerdo | 5 | 1020 | 2016 | 2.660; -5.372; 4.447 | 3.010; -2.523; 5.836 |
| Esquerdo | 6 | 444 | 864 | 2.617; -4.719; 5.481 | 2.686; -4.376; 5.559 |
| Esquerdo | 7 | 300 | 576 | 2.573; -4.793; 5.694 | 2.652; -4.515; 5.862 |
| Esquerdo | 8 | 732 | 1440 | 2.567; -4.798; 5.192 | 2.943; -2.533; 6.133 |
| Esquerdo | 9 | 732 | 1440 | 2.786; -4.111; 0.137 | 4.479; -2.388; 4.615 |
| Direito | 1 | 300 | 576 | -2.765; -4.319; 4.893 | -2.668; -4.071; 5.076 |
| Direito | 2 | 588 | 1152 | -2.931; -4.335; 4.521 | -2.726; -3.368; 5.223 |
| Direito | 3 | 444 | 864 | -2.874; -5.182; 5.003 | -2.775; -4.954; 5.727 |
| Direito | 4 | 300 | 576 | -2.764; -5.314; 4.738 | -2.704; -4.852; 4.894 |
| Direito | 5 | 1020 | 2016 | -3.010; -5.372; 4.447 | -2.660; -2.523; 5.836 |
| Direito | 6 | 444 | 864 | -2.686; -4.719; 5.481 | -2.617; -4.376; 5.559 |
| Direito | 7 | 300 | 576 | -2.652; -4.793; 5.694 | -2.573; -4.515; 5.862 |
| Direito | 8 | 732 | 1440 | -2.943; -4.798; 5.192 | -2.567; -2.533; 6.133 |
| Direito | 9 | 732 | 1440 | -4.479; -4.111; 0.137 | -2.786; -2.388; 4.615 |

## Vizinhança das malhas nomeadas

As medidas abaixo são mínimos entre vértices das superfícies, não medidas de óstio, lúmen ou fluxo. A origem vidiana, em particular, admite variantes. As duas extremidades e os marcos ósseos continuam em revisão.

| Par candidato | Esquerdo, cm | Direito, cm |
| --- | ---: | ---: |
| middle_meningeal_artery | 0.016490 | 0.016490 |
| inferior_alveolar_artery | 0.016870 | 0.016870 |
| infra_orbital_artery | 0.007314 | 0.007308 |
| anterior_deep_temporal_artery | 0.008514 | 0.008514 |
| posterior_deep_temporal_artery | 0.021492 | 0.021491 |
| posterior_superior_alveolar_artery | 0.091636 | 0.091636 |
| buccal_artery | 0.087876 | 0.087876 |
| descending_palatine_artery | 0.100205 | 0.100205 |
| artery_of_pterygoid_canal | 0.035281 | 0.035282 |

## Confronto anatômico necessário

- Borden, *3D Angiographic Atlas*, figuras 2.2–2.4, páginas impressas 16–18; Krings, casos 25–30, material fornecido.
- Origem da ACE, relação com colo mandibular/pterigóideos e fossa pterigopalatina, óstios e ramos nas projeções complementares.
- A meníngea acessória não foi preenchida pelo rótulo ambíguo “accessory branch of middle meningeal artery”.
- O ramo do forame redondo do ILT não substitui o lado maxilar da comunicação.
- A lista de ramos ausentes continua em `neuro3d-missing-vascular-identities.md`; a função de isolamento exibe as malhas identificadas, sem criar uma árvore geométrica contínua.

Fontes primárias consultadas: [Neuroangio — diagrama](https://neuroangio.org/anatomy-and-variants/diagrams-and-drawings/), [meníngea média](https://neuroangio.org/anatomy-and-variants/middle-meningeal-artery/), [infraorbitária](https://neuroangio.org/anatomy-and-variants/infraorbital-artery/).
