# Controles e angiografia vinculada — 19/10/2026

## Problemas corrigidos

A seleção alterava automaticamente posição, orientação e distância da câmera.
Além disso, o raycaster recebia superfícies ocultas e ignorava o recorte dos
materiais. A seleção tornava a malha opaca e visível mesmo quando sua camada
estava em zero. Isso permitia que contexto ósseo, muscular e superficial
interceptasse cliques destinados a vasos.

Agora as superfícies ocultas, individualmente ou por camada, não recebem
cliques. Os planos de corte também são respeitados na interseção. Destacar
uma estrutura não substitui sua opacidade nem sua visibilidade. O filtro de
seleção permite artérias, veias/seios, todos os vasos ou todas as estruturas
visíveis. O padrão é artérias; uma superfície de contexto não precisa ser
removida visualmente para deixar de interceptar a seleção vascular.

## Manipulação

| Ação | Controle |
|---|---|
| Identificar sem movimentar a câmera | Selecionar + clique/toque |
| Rotacionar | Girar + arraste; botão direito no modo Selecionar |
| Transladar | Mover + arraste; dois dedos |
| Ampliar | Roda; gesto com dois dedos |
| Enquadrar uma estrutura | Focar seleção, mantendo a direção atual |
| Remover uma sobreposição individual | Ocultar estrutura |
| Remover uma camada inteira | Ocultar camada ou opacidade zero |
| Retornar à configuração inicial | Restaurar visão |

A ferramenta Girar/Mover não seleciona estruturas ao terminar o arraste.
A inércia foi desativada para evitar movimento residual após uma seleção.
Revelar seleção restaura somente a estrutura selecionada e sua camada;
Reexibir ocultas restaura as ocultações individuais explicitamente.

Referências de interação, sem copiar interface ou código:
[IMAIOS — First steps](https://support.imaios.com/hc/en-us/articles/23085476905885-First-steps-with-e-Anatomy),
[Complete Anatomy — Navigating the Model](https://3d4medical.com/fr/support/complete-anatomy/navigating-the-model),
[Complete Anatomy — Infobox](https://3d4medical.com/fr/support/complete-anatomy/infobox-overview).
Fundamento técnico: [Three.js Raycaster](https://threejs.org/docs/pages/Raycaster.html).

## Angiografia 2D/3D

A vista angiográfica 3D usa câmera ortográfica, com a mesma orientação do
detector sintético. Ao alternar entre 2D e 3D são mantidos o ângulo, centro do
campo, ampliação, seleção, camadas e ocultações individuais. A anotação 2D
também deixa de revelar uma seleção pertencente a uma camada oculta.

Esse vínculo é uma etapa funcional de um ambiente angiográfico integrado.
**Não é uma reconstrução volumétrica de aquisição rotacional.** A geometria
ainda vem das superfícies originais do atlas. Aquisição multiprojeção,
reconstrução tomográfica, volume do lúmen, MIP e volume rendering precisam
de implementação e verificação próprias. Não foi adicionado um giro automático
apresentado como reconstrução radiológica.

## Anatomia

O item 72 agora inclui as seis malhas da alveolar inferior e dos ramos
mentuais e milo-hióideos bilaterais, por identificação explícita na fonte.
São quatro associações adicionais de malhas existentes, sem nova geometria.
A cobertura é parcial. O total de 1114 malhas importadas + 18 reconstruções
didáticas não mudou. O inventário tem 45 entradas importadas, cinco
reconstruídas, 12 parciais, 73 sem geometria e sete identidades não conciliadas.

## Verificação

TypeScript, 82 testes unitários em 18 arquivos e build de produção passaram.
O build mantém o aviso de chunks maiores que 500 kB. Os resultados dos testes
de navegador desta publicação são registrados no PR 2. Os 20 casos distintos
de atlas, interação, pose vinculada e malhas recuperadas passaram nas
execuções focadas em desktop/celular. O teste de clique 2D agora escolhe o
interior da superfície e confirma uma área vazia pelo próprio detector, sem
presumir que uma coordenada fixa continue vazia após mudar o campo.
A regressão usa interseções reais do Three.js, incluindo vaso atrás de
contexto invisível, não selecionável e recortado, além de testes da câmera
e da persistência de pose 2D/3D em desktop/celular.

O preview remoto abriu com autenticação existente. Seu navegador de inspeção
informou WebGL desativado; isso limita a inspeção 3D nesse navegador. Os testes
3D locais utilizam Chromium com SwiftShader. Esse resultado verifica a
interação; não homologa a anatomia nem a representação radiológica.

### Limitação de regressão procedural

Na execução ampla de 22 casos de navegador, 18 passaram inicialmente. O teste
supra-aórtico foi atualizado para o novo campo compartilhado e passou em
desktop/celular após a correção de seleção durante atualização da anotação.
Duas falhas permanecem no teste procedural “contrast passage changes the
detector image and roadmap keeps its capture time”: a imagem de angiograma
não apareceu no prazo esperado, em desktop e celular. A estação procedural
não foi alterada nesta revisão. Não se declara a suíte procedural aprovada.
A reprodução fiel do layout Mentice aguarda os quadros do vídeo, conforme
`neuro3d-dataset-sources.md`.
