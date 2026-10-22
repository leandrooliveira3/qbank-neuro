# VMTK para aneurismas e angiografia rotacional — avaliação de 19/10/2026

Fonte solicitada: https://github.com/iagolessa/vmtk4aneurysms

O projeto oferece representação de superfícies aneurismáticas, delimitação
do colo, morfometria e tratamento de campos hemodinâmicos. Usa VTK/VMTK,
MorphMan, NumPy, SciPy e Pandas. A análise desta revisão abrangeu README,
licença, `aneurysms.py` e `vascular_models.py`.

| Arquivo consultado | Blob Git |
|---|---|
| LICENSE | e301836add3915a6396891badd1f455fc45ec63e |
| aneurysms.py | 7fc2fd66a1847b63354bf078b81f4d49c1520b90 |
| vascular_models.py | 1fbac756bc628467f9a9018c54c96f8ebc48e330 |

A licença fornecida é GPLv3 e inclui avisos de componentes VMTK/pypes BSD
e MorphMan GPLv3. O código desse projeto não foi copiado para o aplicativo
React. Foi criado um adaptador original, executado em processo Python
separado, que requer instalação independente das dependências e preserva a
proveniência da entrada e da ferramenta no relatório. Nenhuma malha ou caso
do repositório foi redistribuído nesta etapa.

## Implementação preparada

`tools/neuro3d/analyze_aneurysm_vmtk.py` recebe uma superfície VTP do saco,
aberta e delimitada pelo colo. Confere entrada não vazia e uma única borda
de colo, converte unidades declaradas para centímetros e chama a classe
`Aneurysm` para diâmetro do colo, altura, diâmetro máximo, área, volume,
área do óstio, aspect ratio e bottleneck factor. Resultados não finitos ou
não positivos são rejeitados. Não é um classificador de risco de ruptura.

Exemplo, em um ambiente Python com VTK/VMTK/vmtk4aneurysms instalados:

```bash
python tools/neuro3d/analyze_aneurysm_vmtk.py saco.vtp --output morfometria.json --units mm --location mca-bifurcation --parent-id middle_cerebral_artery_m1_segment_l
```

O relatório conserva hash da superfície e declara `not-registered-to-atlas`,
`not-verified` para a união do colo e `clinicalValidation: false`.
A CLI e sua compilação Python foram verificadas; a execução morfométrica
com VTK/VMTK e um saco real ainda não foi realizada neste ambiente.

## Casos em diferentes topografias

| Topografia preparada no adaptador | Geometria necessária antes de disponibilizar o caso |
|---|---|
| ACI–oftálmica | Segmento da ACI, óstio oftálmico, colo e orientação do saco revisados |
| ACI–comunicante posterior | Junção ACI/PCoA e incorporação de ramos ao colo |
| Comunicante anterior | Complexo A1–ACoA–A2 e lados dominantes |
| Bifurcação da ACM | Bifurcação e ramos envolvidos identificados na geometria |
| Ápice basilar | Junções basilar/ACPs/SCAs e perfurantes pertinentes |
| PICA | Origem e segmento da PICA, colo e contexto da vertebral |

O nome do vaso pai não fornece a posição do colo. Não se colocou uma esfera
em cada território como se fosse um aneurisma anatômico. Os modelos
hemisféricos/hemi-elipsoidais disponibilizados pelo projeto podem ajudar em
experimentos geométricos, mas a implantação no atlas exige registro espacial,
união manifold com o vaso pai, verificação do lúmen, ausência de tampas
internas e revisão anatômica. Só então o mesmo caso poderá alimentar 2D,
3D e o grafo procedural, preservando a topologia e os IDs do colo e ramos.

## Rotacional 3D: etapas restantes

1. Definir a geometria única do lúmen e do aneurisma, registrada e revisada.
2. Gerar uma série de projeções com geometria de aquisição calibrada.
3. Implementar e verificar a reconstrução volumétrica a partir dessa série,
   incluindo resolução e artefatos, separadamente da geometria verdadeira.
4. Usar o mesmo volume para MIP/volume rendering e a segmentação para a
   superfície 3D; comparar projeções reconstruídas com as projeções de entrada.
5. Acrescentar devices e contraste procedural após a anatomia e a imagem
   funcionarem. Mecânica/CFD continuam etapas independentes.

VMTK4aneurysms auxilia a preparação e análise das superfícies; os módulos
consultados não implementam essa cadeia de aquisição/reconstrução rotacional.
Referências: [README](https://github.com/iagolessa/vmtk4aneurysms#readme),
[Aneurysm](https://github.com/iagolessa/vmtk4aneurysms/blob/master/aneurysms.py),
[modelos geométricos](https://github.com/iagolessa/vmtk4aneurysms/blob/master/vascular_models.py),
[licença](https://github.com/iagolessa/vmtk4aneurysms/blob/master/LICENSE).
