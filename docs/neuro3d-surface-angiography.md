# Atlas de superfícies, angiografia e ramos reconstruídos

## Resultado

A aba Atlas abre a mesma base anatômica de superfícies que Anatomia detalhada.
Os cenários históricos de arco, embriologia e variantes permanecem acessíveis
pelo botão “Embriologia e variantes conceituais”. A base importada conserva 513
estruturas; 18 superfícies didáticas bilaterais são acrescentadas separadamente.

A representação Angiografia projeta as superfícies vasculares empacotadas no
mesmo sistema de coordenadas do atlas, usando integração de espessura. Permite
rotação, angulação, ampliação e sobreposição óssea contínua; em zero, apresenta
DSA sintética sem osso. A seleção e o isolamento sobrevivem à mudança de modo.
Os presets de vista orientam ambas as representações; o modo angiográfico tem
ângulos próprios, sem registro em radiografias de paciente. A projeção utiliza
as versões decimadas das superfícies importadas, não cada triângulo do GLB.

Todas as camadas vasculares habilitadas são opacificadas na projeção do atlas.
Isso é uma exploração anatômica projetada, não uma aquisição seletiva. Veias
podem ser ocultadas pelo controle da camada. O corte de exploração continua
restrito à visão 3D. Na estação, a injeção continua dependente da posição do
cateter e do grafo existente. Física de atenuação relativa, sem calibração de
fluoroscopia, espectro, espalhamento ou subtração adquirida.

## Reconstruções didáticas

`reconstructedArteries.ts` define MHT, hipofisária inferior, ramo clival medial,
tentorial marginal, ILT, ramos do forame redondo e oval, ramo anteromedial do ILT
e coroidea anterior, bilateralmente. São curvas suavizadas com seção circular
e afilamento; usam superfícies fechadas com orientação consistente. Os pontos
iniciais do MHT, ILT e coroidea são ancorados explicitamente nos índices
111, 125 e 153 do eixo importado da ACI esquerda. O lado direito é uma reflexão
didática construída, sem alegar variação anatômica individual.

Essas coordenadas são escolhas ilustrativas: não derivam de segmentação das
figuras, registro multimodal, medidas de um paciente ou validação de óstios.
Relações com nervos, dura, forames e perfurantes precisam de revisão específica.
Não inferir segurança de embolização, território funcional ou compartimento
intradural a partir dessas superfícies. Os ramos não são rotas navegáveis.

Atlas e estação recebem a mesma superfície criada. Na estação, os ramos
esquerdos só entram no contraste quando a rota opacificada inclui sua origem
longitudinal na ACI; não se acrescenta enchimento contralateral automático.
As conexões gráficas são superposição de superfícies, sem união volumétrica
ou modelo de fluxo. A revisão anatômica e o inspetor exibem essa proveniência.

Fontes anatômicas dirigidas, consultadas nesta revisão:

- https://neuroangio.org/anatomy-and-variants/meningohypophyseal-trunk/
- https://neuroangio.org/anatomy-and-variants/inferolateral-trunk/
- https://neuroangio.org/anatomy-and-variants/anterior-choroidal-artery/

A consulta foi textual e não constitui reconstrução quantitativa de imagens.
Nenhuma imagem ou modelo comercial foi incorporado.

## Inventário obrigatório

O painel Inventário conserva as 97 entradas originais e explicita outras 27
estruturas embutidas em grupos ou parênteses (124 linhas, com grupos e repetições). Identidades são vinculadas explicitamente, sem considerar
um vaso pai equivalente a um ramo, nem um plexo equivalente à artéria nutridora.
Há quatro estados: malha importada, reconstrução didática, grupo parcialmente
mapeado e pendente. Os grupos originais ainda exigem desdobramento individual;
essas 124 linhas não são contagem de artérias únicas ou cobertura integral.
Os demais sistemas obrigatórios continuam no arquivo anatomy-requirements.json.

Não há comprovação de “nenhuma ausência anatômica”. Persistem, entre outras,
arcadas meníngeas, anastomoses, vasos medulares e perfurantes sem superfície
individual revisada; relações osteodurais não estão validadas.

## Repositórios indicados

Os quatro foram conferidos novamente. O histórico de importação detalha os
arquivos examinados em neuro3d-open-source-integration.md.

| Repositório | Verificação e aplicação |
| --- | --- |
| thebuggeddev/anatomy | Visualizador Three.js e candidato brain.glb examinados anteriormente. Não fornece, na evidência consultada, uma árvore microvascular validada; sem incorporação de assets sem atribuição/licença explícita. |
| jixiangying/anatomy | README atual conferido: 2.234 OBJs BodyParts3D/ISA, dados CC BY-SA 2.1 Japan. A nomenclatura usa classificação/tradução por IA e registra duplicatas. É base alternativa, não evidência de que ramos ausentes nesta seleção existam em alta resolução. Nenhum OBJ novo foi incorporado nesta etapa. |
| Nurkan1/Anatria-3D | Fonte das 513 malhas já incorporadas. README e scanner examinados: o scanner secciona geometria do atlas; não é TC/RM adquirida nem faz registro angiográfico automático. As licenças dos assets são preservadas separadamente do aplicativo. |
| huang-sir1/radiology-skills | README atual conferido; referência metodológica de orientação, geometria, proveniência e QC. Não é um modelo executável de reconstrução vascular ou engine de ray casting. Nenhum modelo de IA de reconstrução foi executado. |

## Validação

Verificação geométrica: superfícies reconstruídas fechadas, índices válidos,
coordenadas finitas; contraste seletivo de ramos esquerdos e exclusão do lado
contralateral/entrada cervical; integridade do inventário. Browser: troca entre
superfícies e projeção, alteração efetiva de pixels com osso, seleção e isolamento,
inspeção da proveniência e inventário responsivo. Não substitui revisão médica.

### Busca adicional de malhas alternativas

A consulta de `data/anatomy_data_simple_refined.json` em jixiangying/anatomy
(commit be67a977abe25a36f59793fda86a506618fd4d27) identificou e permitiu
recuperar os OBJs de coroideas anteriores FJ1658/FJ1658M, seus ramos capsulares
FJ1674/FJ1674M, coroideas posteriores mediais FJ1727/FJ1727M e tireoidianas
inferiores FJ2209/FJ2210. Isso confirma candidatos concretos além da base atual.

Também foram recuperados FJ1682/FJ1682M (ACI) e FJ1695/FJ1695M (oftálmica)
para comparação de coordenadas. Uma tentativa de ajuste de similaridade global
converteu mm/Z-superior em cm/Y-superior e otimizou rotação, translação e escala
única contra as superfícies do atlas atual. Distância de vértice do OBJ à
nuvem de vértices correspondente do atlas (unidirecional, não Hausdorff de
superfícies): mediana 0,558 cm e p95 0,872 cm para ACI; mediana 0,603 cm e
p95 1,671 cm para oftálmica. A otimização local não prova que inexista ajuste
melhor, mas tampouco demonstra registro suficiente para fusão automática.

As oito malhas candidatas não foram fundidas com a base atual. Nenhuma
superfície foi deformada individualmente para mascarar a divergência.
Os identificadores, hashes de origem e resultado exploratório são preservados
em neuro3d-alternative-anatomy-audit.json. O próximo registro exige marcos
homólogos e verificação em múltiplas vistas; uma origem comum BodyParts3D
não basta para assumir coordenadas idênticas depois das adaptações.
