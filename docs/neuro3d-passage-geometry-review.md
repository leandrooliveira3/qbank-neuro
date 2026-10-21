# Vias prioritárias: cortes físicos, separações e revisão venosa

Base: f62c3673dc3f0e010fba08157797e0a83c4a56e3, branch feature/neuro3d-atlas, Vercel SUCCESS reconfirmado. Trabalho local em continuation/passage-geometry, criado do remoto, sem reescrever a branch anterior. Cinco arquivos não rastreados no checkout original preservados.

## Escopo executado

Auditoria direcionada das quatro vias prioritárias, bilateralmente: redondo–ILT, oval/meníngea acessória–ILT, vidiana–ACI petrosa e AMM–lacrimal/oftálmica. Não se repetiu a auditoria dos592vasos, os42cortes BRAVE/VENAT ou a comparação Anatria→Qbank.

[Resultado reproduzível](../features/neuro3d/passage-geometry-audit.json):8contextos,26elos bibliográficos,31superfícies distintas (19importadas completas,12ilustrativas existentes). Três GLBs conferidos por tamanho/SHA256: cardiovascular_head, landmarks_bone e nervous_head. Esfenoide original:3705vértices/7308triângulos. Nomes de forames/canais não aparecem como entidades ósseas individuais nos seis manifestos atuais; a artéria do canal pterigóideo não substitui o canal ósseo.

Cada GLB foi decodificado com identidade exata qbankAnatomyId e hierarquia completa dos nós. Posições finais float32 e índices uint32 foram serializados em little-endian e tiveram SHA256 individual registrado. O navegador confere tanto os arquivos originais quanto esses31derivados antes de mostrar o corte. Nenhuma malha foi deslocada, estendida, renomeada ou conectada. Os dados novos derivam apenas dos recursos do atlas CC-BY-SA-4.0 já distribuídos, com fonte e atribuição preservadas; não incluem dados clínicos restritos.

## O que as medidas comprovam

Para cada elo dirigido,32vértices determinísticos da primeira superfície são comparados com todos os triângulos não degenerados da segunda. Guardam-se vértice, triângulo, coordenadas baricêntricas e os dois pontos. A distância encontrada é um **limite superior** do mínimo global, sem certificar contato, separação global ou lúmen. A distância entre caixas envolventes é um **limite inferior**. Somente se este último for positivo há prova de separação das superfícies representadas.

| Elo | Lado | Limite inferior nominal | Distância da amostra |
|---|---|---:|---:|
| Artéria do canal pterigóideo–ACI | E/D |4,578mm |15,306mm |
| Ramo esfenoidal–lacrimal | E/D |3,788mm |16,013mm |

Esses quatro elos estão espacialmente separados no modelo. Isso não identifica qual rótulo/trajeto está anatomicamente errado, não mede o paciente e não autoriza criar uma ponte. Outros22elos com limite inferior zero continuam inconclusivos. Proximidade na amostra não comprova óstio ou parede contínua. Continuidade luminal e curso completo permanecem não verificados em todos os oito contextos.

Coordenadas são centímetros nominais do atlas, Y superior. Transformação: glTF em metros, hierarquia original, ×100 e Y−160. O inverso dos pontos retorna metros do espaço global da fonte, após a hierarquia; não são vértices locais do objeto. Não houve registro para DICOMLPS/RAS, BRAVE, VENAT ou GS-CA. Algarismos numéricos não representam precisão clínica.

## Inspeção que o usuário pode executar

Forames → Inspecionar cortes e separações abre, sob demanda, o conjunto do lado escolhido. Arquivos são agrupados para decodificar cada GLB uma vez por abertura. Cortes nos três eixos são interseções dos triângulos originais com o plano, calculadas em worker. Osso, nervo, vaso importado e ilustração mantêm cores/traços distintos. Triângulos coplanares são contados e omitidos, sem fechar contornos arbitrariamente. Cortes vazios não provam ausência de vasos.

O campo tem60×60mm nominais, escala10mm, ampliação da inspeção, controle do plano e escolha do elo bibliográfico. Os pontos da comparação são projetados como círculos, vazados quando fora do plano; não há linha que simule uma anastomose. Exportação inclui plano atual, contagens, testemunhos geométricos, hashes, licenças e campos explícitos de não aprovação.

“Mostrar plano no atlas3D” posiciona um quadrado de6cm no mesmo espaço e offset do corte; ele fica fora do grupo que converte as malhas de metros, evitando escala dupla. A sobreposição é identificada como plano de referência e pode aparecer através das superfícies. Não recebe o nome de ponto do forame, não modifica clipping ou anatomia e não intercepta seleção. Pode ser removida; restaurar visão ou revelar outro vaso também a limpa.

Carregamentos são canceláveis; respostas de worker obsoletas são descartadas por sequência. Erro de integridade bloqueia o corte e a exportação e oferece recuperação. O carregador geral vascular mantém a restrição arterial/venosa anterior; o novo carregador agrupado permite contexto ósseo/neural. A projeção angiográfica original isolada continua usando o mesmo contrato.

## Fontes anatômicas confrontadas

Confronto dirigido com [ILT Neuroangio](https://neuroangio.org/anatomy-and-variants/inferolateral-trunk/) e o cache privado do livro original Lasjaunias/Berenstein/terBrugge2001, hash421e89836286424a9642a4442d7cd218be333d8a911004032775e720ff97d327. Reconsultados textos PDF322/p302 (vidiana versus pterigovaginal),437/p418 (ILT/FR/AMA/AMM) e475/p456 (variantes orbitárias/tentoriais). São as páginas dirigidas da etapa anterior; não se declara nova leitura integral ou nova inspeção de todas as figuras. Não se redistribuíram livro, figuras ou texto extenso.

O atlas conserva nove registros/46elos bibliográficos gerais. A auditoria numérica cobre somente26elos das quatro vias prioritárias. Vesálio e vias orbitárias continuam variantes alternativas; C2/C4 não foram certificados por um ponto da ACI inteira. Coordenadas anatômicas próprias dos forames e nervo vidiano individual permanecem pendentes.

## Revisão venosa: consulta recuperada, geometria não inventada

A ferramenta web continuou falhando para os três capítulos. HTTP público direto via Python/urllib recuperou o HTML; extração local corrigiu a leitura de tags autocontidas. Cache completo privado em ../artifacts/venous-source-review. Revisão textual dirigida, sem assistir vídeos ou revisar todas as imagens:

- [Seios](https://neuroangio.org/venous-brain-anatomy/venous-sinuses/): tributárias, emissárias e variabilidade; HTML SHA3d06b02141b9b629de4559719949db52b67115d6c3de7f673cf644d2bef2fed9.
- [Cerebral interna](https://neuroangio.org/venous-brain-anatomy/internal-cerebral-vein/): sistema subependimário, anéis, veia direta lateral e alternativas pela ventricular inferior; SHA1b96ac4a1aa278935bce33366d08522f2ad11c251481dfafc46a3c0858194020.
- [Fossa posterior](https://neuroangio.org/venous-brain-anatomy/veins-posterior-fossa/): URL corrigida a partir do índice, superfícies cerebelares, vermis e canais longitudinais/transversos; SHAf31a0db3712c8e697e0f38a4eeffedea3be206f35d2cfb23a36acb1e24ec844d. O endereço anterior posterior-fossa-veins não é o link do índice.

O índice Neuroangio agora oferece três conjuntos de revisão, seleção por lado e revelação de cada identidade existente, com distinção importada/ilustrativa. Tributárias sem malha continuam ausentes. Termos como atrial medial, canais transversos/interpedunculares e conexões tonsilares ficam explicitamente sem correspondência individual estabelecida. Não foram assimilados a um grupo próximo nem transformados em novas curvas. O inventário atual de20IDs sem geometria/373sem referência permanece; essa contagem não certifica exaustividade de todas as páginas/imagens.

## Validação e continuidade

TypeScript,136unitários/34arquivos e build aprovados. Auditor direcionado executado;24conjuntos de cortes centrais calculados offline. Casos analíticos independentes cobrem interseção, tangência/coplanaridade, distância/baricêntricas e coincidência física do plano3D. 36 casos únicos de navegador aprovados, em10arquivos/desktop e Pixel7. As quatro vias foram abertas nos dois lados, com hashes de31superfícies, cortes nos3eixos, plano3D, exportação e recuperação de corrupção. Também passaram angiografia original, anastomoses, famílias, vínculosBRAVE/VENAT, Paciente3D, Doppler e roteiroMentice. Capturas de redondo/vidiana desktop, oval/meningolacrimal mobile e plano3D desktop/mobile inspecionadas visualmente. Sem teste remoto de navegador. Guardas adicionais confirmam vértices finitos/referenciados e índices válidos em31superfícies; relatório regenerado permaneceu byte a byte idêntico. Aviso de chunks>500kB permanece; o inspetor é carregado sob demanda.

PróximoP0: usar os cortes e os testemunhos para conferir marcos ósseos/neurovasculares multiprojeção e a extensão real das quatro vias. Investigar a proveniência do trajeto vidiano e do ramo esfenoidal antes de qualquer correção; procurar fonte rotulada/licenciada quando a atual não resolver. Não refazer amostragem como se fosse distância global exata. Não fechar lacunas por proximidade. Galeno e sete identidades preservados. GS-CAvisor/VOI, Paciente3D, Doppler, Mentice/VascularTwin e REA/Ankyras continuam mantidos.

Reprodução offline: compilar tools/neuro3d/audit_passage_geometry.ts com esbuild para Node/ESM, BASE_URL definido como "/", e executar na raiz. Draco3d é ferramenta temporária de desenvolvimento já instalada, não nova dependência de produção. Saída versionada em features/neuro3d/passage-geometry-audit.json. npm run lint, npm run test:neuro3d, npm run build e tests/neuro3d/passage-geometry.spec.ts verificam os contratos pertinentes.
