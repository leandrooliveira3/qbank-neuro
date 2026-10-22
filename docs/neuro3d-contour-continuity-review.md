# Hierarquia de contornos, continuidade amostrada V2 e raiz motora

Base: `7b080470f0ca286700774110062a4d4d2a846a97`; branch de preview feature/neuro3d-atlas. Fonte Anatria fixa `6320bd64df8db2fcfed358a27c85d1fcc1c5913c`, atlas em cm/Y superior, world glTF metros ×100 e Y−160. CC-BY-SA-4.0 e atribuição de openAnatomy mantidas. Não é registro DICOM. O JSON `features/neuro3d/contour-continuity-evidence.json` contém hashes dos GLBs/superfícies, faces e métodos. Os quatro testemunhos antigos não foram recalculados ou alterados.

## Resultado dirigido e limites

42 secções novas: 21 níveis Z28–32mm nominais por lado, intervalo0,2mm. Em18 níveis por lado (28–31,4mm), um contorno ósseo contém integralmente o perfil V2, com todas as arestas verificadas. O contorno é filho de um contorno externo maior e tem orientação oposta, derivada das normais das faces originais. A ordem arbitrária de travessia do polígono não define a orientação. Em17 transições por lado, os contornos envolventes compartilham triângulos ósseos originais. Z31,6/31,8/32mm não demonstram contenção integral; isso não prova ausência anatômica. Triângulos compartilhados são evidência local discreta, não certificado de túnel ou trajetória entre amostras.

Esfenoide:3705vértices/7308faces. A topologia por índices, excluídas4faces de área nula, apresenta162arestas abertas. Conferência de costuras em cópia diagnóstica, tolerância1e−6cm, encontra3648vértices com deslocamento máximo0 e32arestas abertas remanescentes; as4faces degeneradas continuam excluídas. Sem arestas não manifold ou orientação contraditória nas faces válidas, mas a superfície permanece aberta. Nenhuma soldagem foi aplicada ao atlas. Não foram pesquisadas todas as auto-interseções ou defeitos de vértice; `closedConsistentlyOriented` é só teste de incidência/orientação de arestas. Não chamar isto de sólido certificado.

Winding por ângulo sólido é diagnóstico em média aritmética dos vértices do perfil neural, explicitamente não um centro anatômico e sem garantia de estar dentro de um perfil côncavo. Valores próximos de zero entre aproximadamente−0,000695 e+0,000992 não provam vazio ósseo, especialmente em malha aberta. Não se promoveu forame, centro, túnel completo ou passagem arterial. Todas as aprovações anatômicas permanecem false.

## Raiz motora e oval

`motor_root_of_trigeminal_nerve_l/r`:482vértices/960faces cada, uma componente, sem bordas abertas ou orientação contraditória por índices. ExtensãoZ de aproximadamente−11,792 a−9,892mm, extensãoY3,229mm. São pequenos segmentos rotulados na fonte, não prova de curso completo. Limite inferior entre caixas da raiz e do esfenoide é12,143mm nominais bilateralmente; portanto essa geometria não alcança o esfenoide no espaço atual. Os nove cortesZ por raiz têm um perfil neural fechado, mas zero segmentos ósseos nesse intervalo. Não criar túnel/ponte até o oval; não confundir raiz motora com tronco sensitivoV3 ou divisões mandibulares.

O inspetor existente expõe os21níveis por lado e exporta relatório/triângulos/hashes. A aba oval permite selecionar a raiz original; não injeta essa estrutura em uma cadeia arterial. Plano3D usa o offset físico escolhido; a borda antiga continua ponto de revisão, nunca novo centro. Sem nova comparação entre fontes.

## Reconciliação venosa dirigida

Novo confronto lexical com7192rótulos ingleses do CSV TA2 contido na fonte fixa: SHA de blob Git71bef934c23d207550ad1f318ec6edd8551cdba4 e SHA256 no relatório `features/neuro3d/venous-nomenclature-audit.json`. Pesquisa exata, normalizando apenas vein/veins e caixa; não cobre traduções, latim ou sinônimos.

Seis dos sete termos não têm correspondência inglesa exata. Brachial veins tem correspondência lexical, mas as malhas homônimas do atlas são do membro superior e continuam rejeitadas. Pontine veins (linha terminológica4931) é grupo genérico, sem individualização transversa. Rótulos atriais cardíacos e caudados da porta hepática não são substitutos cerebrais. IDs numéricos terminológicos não viram IDs geométricos. Os sete termos continuam sem geometria/correspondência cerebral confirmada; não reduz20ausências/373lacunas nem certifica exaustividade. Original CSV não redistribuído; direitos de nomenclatura não reatribuídos.

## Fontes consultadas versus ferramentas executadas

- Neuroangio ILT aberto novamente nesta etapa: https://neuroangio.org/anatomy-and-variants/inferolateral-trunk/. Texto contextual de conexões redondo/oval/ILT; não fornece coordenadas da malha. Acesso ao capítulo venoso remoto voltou a expirar; texto dirigido do cache anterior foi consultado, sem nova revisão integral de imagens/vídeos.
- Lasjaunias, Clinical Vascular Anatomy and Variations, PDF437/p418, legenda5.25 reconsultada em extração privada previamente produzida; contexto ILT/redondo/meníngeas, sem execução de segmentação, sem nova inspeção integral do livro ou cópia de figura.
- Anatria: originais GLB decodificados novamente só para esfenoide/V2/raízes motoras, conferência SHA e hierarquia original. CSV TA2 conferido contra blob da árvore fixa. Startup.blend, REA/Ankyras, reconstrução clínica, registroGS-CA ou BRAVE-NET/VENAT não executados nesta etapa.
- Executados: audit_contour_continuity.ts, audit_venous_nomenclature.py, funções matemáticas próprias e validações locais. A auditoria592, o inspetor existente, os quatro pontosV2,42cortesBRAVE/VENAT e linhagem do seio reto não foram refeitos.

## Continuação prioritária

Investigar as32bordas abertas remanescentes do esfenoide e seus triângulos/posição, distinguir abertura anatômica de defeito/exportação sem consertar a malha. Examinar a mudança emZ31,4→31,6mm com cortes oblíquos e face-adjacência se sustentada pela fonte; não prolongar um canal artificialmente. Buscar geometria óssea rotulada/licenciada ou exportação original verificável para validar nomes dos forames; raiz motora pequena não resolve o oval. Persistem componentes específicos ICA-vidiana e meningo-lacrimal/recorrente,20ausências/373lacunas, Galeno e sete rótulos incertos. Preservar todas as frentes.
