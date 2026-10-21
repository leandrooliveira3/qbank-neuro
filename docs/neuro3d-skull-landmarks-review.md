# Evidência óssea dirigida, proveniência vascular e termos venosos

Base publicada: cc947c3e181816be6d91169ac0fcf616fe89dad5, feature/neuro3d-atlas, Vercel SUCCESS reconfirmado. Lote local continuation/skull-landmarks, criado do remoto. Inspetor, cortes e plano3D anteriores foram estendidos com evidências; não reconstruídos. Alterações do checkout original preservadas.

## Progresso verificável nos marcos do esfenoide/V2

Quatro testemunhos de **borda óssea real do modelo**, bilateralmente, em Z=2,9 e3,0cm do atlas. Dados em [skull-landmark-evidence.json](../features/neuro3d/skull-landmark-evidence.json). São pontos sobre triângulos do esfenoide, não centros calculados do nervo rotulados como forames. Coordenadas baricêntricas, triângulo, SHA da superfície e coordenadas globais da fonte em metros permitem reproduzir cada ponto. Resíduo ponto→triângulo menor que1e−6cm; resíduos observados zero na representação float32 auditada.

Nessas quatro secções, o contorno ósseo fechado contém **todo o perfil fechado do nervo maxilar da fonte**, com teste de vértices e de cruzamento de arestas. O algoritmo rejeita componentes abertos, ramificados, degenerados ou com auto-interseção. Soldagem numérica de extremos usa tolerância1e−6cm, não fecha lacunas por interpolação. Segmentos retêm os IDs dos triângulos originais. Oito perfis principais (osso/nervo) e cortes ortogonais no mesmo ponto são reprodutíveis.

**Isso comprova contenção seccional no modelo, não identidade anatômica do forame redondo, um túnel3D completo ou passagem arterial.** Um loop fechado isolado tampouco prova que seu interior seja vazio ósseo: hierarquia/orientação dos contornos e continuidade3D ainda precisam de exame. Flags namedForamenVerified/full3DTunnelVerified/arterialPassageVerified continuam false. A busca exploratória inicial foi dirigida ao lado esquerdo; a evidência selecionada final foi calculada independentemente nos dois lados. Não se declarou levantamento exaustivo de todos os canais ósseos.

| Testemunho | Triângulo do esfenoide | X/Y/Z do atlas em cm, arredondados para leitura |
|---|---:|---|
| V2 esquerda, Z29mm |5093 |1,631928 / −0,918738 /2,9 |
| V2 esquerda, Z30mm |5093 |1,627286 / −0,917191 /3,0 |
| V2 direita, Z29mm |3072 |−1,631928 / −0,918738 /2,9 |
| V2 direita, Z30mm |2892 |−1,627286 / −0,917191 /3,0 |

As coordenadas completas permanecem no JSON. Valores são nominais do atlas, não precisão clínica ou coordenadas de DICOM. Perfis ósseos internos têm área próxima de0,03974/0,04988cm²; não se atribuiu calibre arterial ou diâmetro clínico ao canal.

Distância exata de cada ponto de borda a todas as faces dos ramos **ilustrativos** do redondo: aproximadamente22,02–22,60mm para o lado ILT e22,47–22,96mm para o lado maxilar. São distâncias ponto→superfície, não mínimo global entre malhas ou prova de percurso fisiológico. Esse confronto evidencia a necessidade de rever a relação espacial das ilustrações com o contexto original. Nenhuma curva foi aproximada da borda para zerar a medida.

## Uso no inspetor existente

Forames → redondo → Inspecionar cortes e separações → Evidência óssea dirigida de V2. Cada botão abre o corte nativo da evidência, centraliza o **campo de vista** no ponto real da borda e permite campos de60/20/10mm. Não move anatomia. O contorno ósseo é ciano, o perfil neural violeta e uma cruz branca marca somente o ponto da borda. Destaque do perfil aparece apenas no plano/offset para o qual foi comprovado.

O plano3D conserva posição, normal e extensão do campo; o ponto branco de revisão é mostrado com rótulo explícito de que não é centro do forame. Controles, mudança de eixo/lado, recuperação de erro e exportação anteriores permanecem. A exportação inclui o testemunho, perfis, hashes, baricêntricas, distâncias e a auditoria de proveniência. Carregamento confere compatibilidade dos hashes com as superfícies que já eram verificadas no inspetor.

V3: as divisões mandibulares anterior/posterior não estabelecem o tronco pré-foraminal completo. Nenhum ponto do oval foi certificado. Há raiz motora do trigêmeo individual no manifesto da fonte; sua relação com o oval merece exame próprio, sem equipará-la ao tronco sensitivo V3 ou supor que sua malha contenha todo o percurso.

## Por que os rótulos de forames não geraram superfícies

[Auditoria de proveniência](neuro3d-skull-source-audit.json), ferramenta própria audit_skull_source.py, confrontou o GLB esquelético original e os relatórios fixos Anatria6320bd64df8db2fcfed358a27c85d1fcc1c5913c. skeletal_male.glb:2823900bytes, SHAb49d71788bfa0b4a3188e2954d59728a699b08ec280e70df1c2a95e13d4b81f8, igual ao upstreamSha256 do osso já utilizado no atlas. Relatório skeletal.json:72347bytes, SHA6d848dbf791f996ade98af2cc7a935011111e04a71f2ecae9af700867c2cfd70.

Foramen rotundum.j, Foramen ovale.j, Foramen spinosum.j e Pterygoid canal.j constam como MESH na auditoria de objetos, mas aparecem na lista **skipped** do exportador e não têm nó no GLB. O código do exportador registra esse descarte quando não há polígonos avaliados utilizáveis. Logo, o tipo MESH ou o nome não prova que há uma superfície importável. Startup.blend não foi executado por nós; trata-se de confronto entre relatórios/código/GLB. Não se criaram malhas fictícias para esses nomes.

## Origem/extensão das vias vidiana e esfenoidal–lacrimal

Seis nós vasculares, bilateralmente: artéria do canal pterigóideo, lacrimal e meníngea média. Payload Draco, atributos, transformações, pais e contagens coincidem exatamente entre o GLB original fixo e o recorte Qbank. Não houve mudança de transformação na importação que justifique corrigir visualmente a separação. O vendor registra esses vasos como CURVE, avaliados em malha; isso não comprova segmentação de exame real nem anatomia individual.

O ramo da crista esfenoidal tem outra origem: **três controles ilustrativos** escritos em build_educational_vessels.py/educational-vascular-paths.json, espelhados para o lado direito. Não foi derivado de anastomose em imagem. Hashes dos arquivos e controles exatos constam da auditoria. Não se reinterpretou a lacuna como erro de registro do paciente.

[Neuroangio mandibulovidiana](https://neuroangio.org/anatomy-and-variants/mandibulovidian-artery/) distingue componentes ICA/IMAX e o ramo mandibular; um nome genérico de artéria do canal não prova todo o percurso entre as duas origens. [Página oftálmica](https://neuroangio.org/anatomy-and-variants/ophthalmic-artery-old/) distingue vias meningo-lacrimal, meningo-oftálmica e recorrentes. Essas páginas foram efetivamente abertas nesta etapa. Texto privado Lasjaunias2001 PDF322/p302 reconsultado para distinguir vidiana/pterigovaginal; referências prévias PDF437/p418 e475/p456 mantidas, sem nova alegação de leitura integral. Livro SHA421e89836286424a9642a4442d7cd218be333d8a911004032775e720ff97d327, sem redistribuição.

O inspetor agora explicita os componentes presentes e os papéis ainda não individualizados: contribuição vidiana da ACI petrosa; componente meningo-lacrimal/meníngeo recorrente específico. Não substitui este último automaticamente pelo ramo meníngeo recorrente profundo só pelo nome. Os limites inferiores anteriores,4,578mm vidiana–ACI e3,788mm esfenoidal–lacrimal, permanecem. Nenhuma ponte, nova aresta procedural ou geometria foi acrescentada.

## Reconciliação venosa sem substituições indevidas

Sete termos de textos Neuroangio previamente recuperados foram reconciliados como **sem correspondência individual confirmada**, com fonte, substituições rejeitadas e motivo: atrial medial; caudadas transversas; interpeduncular; pontina transversa; sulco pontomedular; braquial da fossa posterior; tonsilares cerebelares. Catálogo em venousTermReconciliation.ts, visível no índice e incluído na exportação.

A veia braquial da fossa posterior não é as veias braquiais/antebraquial mediana do membro superior no manifesto Anatria. Veias tonsilares cerebelares não são o ramo tonsilar arterial da facial. Canais transversos não se tornam canais longitudinais por proximidade. Nenhuma identidade foi renomeada ou preenchida. Ausências já bilaterais agora exibem o ID do lado correto no painel, sem alterar o inventário20/373. Não se declarou leitura integral das imagens ou vídeos venosos nesta etapa.

## Validação e continuidade

Auditorias dirigidas de proveniência e bordas executadas, sem repetir592vasos/42cortes/comparador/Anatria→Qbank do seio reto. TypeScript,142unitários/36arquivos e build aprovados; 40 casos únicos de navegador aprovados em11arquivos, desktop e Pixel7: rodada ampla38mais dois casos novos de reconciliação/exportação venosa. Repetições dirigidas não somadas. A versão final dos testes ósseos também confere o alvo da câmera no ponto de origem. Capturas nativas das bordas V2 e plano/ponto3D desktop/mobile inspecionadas; em primeira inspeção o ponto era pequeno na visão geral, e o foco da câmera foi ajustado sem mover anatomia. Não houve teste remoto de navegador. Primeiro teste novo falhou por ordenação lexicográfica de números no próprio teste; corrigida para ordenação numérica, sem modificar contornos. Testes analíticos incluem componentes abertos/ramificados, auto-interseção, limite/borda e polígono côncavo no qual vértices interiores não garantem contenção de arestas.

PróximoP0: avaliar continuidade3D dos contornos V2 e raiz motora/contexto do oval; obter prova anatômica multiprojeção antes de promover nomes de forames. Buscar componentes vasculares rotulados/licenciados quando o modelo atual não os individualiza. Não deslocar ramos ilustrativos22mm para coincidirem com a borda. Preservar20ausências/373lacunas, Galeno, sete identidades, referenciais e todas as frentes de GS-CA/VOI, Paciente3D, Doppler, Mentice/VascularTwin e REA/Ankyras. Aviso de chunks>500kB permanece.
