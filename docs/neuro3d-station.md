# Estação procedural virtual Neuro3D

## Escopo atual

A aba **Simulação** em `/#/tools/neuro3d` abre uma estação operada por mouse, toque e teclado, sem hardware externo. Substitui a antiga sequência de oito exercícios e a aba de videoaulas. Os arquivos antigos são históricos; o catálogo Mentice não é carregado nesta estação.

| Caso fictício | Patologia na rede 3D | Interação implementada |
| --- | --- | --- |
| Angiografia | Rede arterial sem lesão | Navegação seletiva e aquisições carotídea e vertebrobasilar |
| Aneurisma de ACI C6 E | Saco conectado ao segmento paraclinoideo | Microcateter e coils; destacamento no saco aumenta ocupação gráfica; fora dele registra comprometimento parental |
| Oclusão de ACM M1 E | Trombo e corte do enchimento distal | Aspiração próxima ao alvo ou retriever expandido distalmente e retirado; nova DSA verifica o resultado gráfico |
| Estenose cervical de ACI E | Estreitamento focal de C1 | Proteção distal, balão e stent; expansão altera a luz representada |

A seleção de dispositivo é livre, não uma resposta única de quiz. Há guia diagnóstico/microguia, curvas genéricas de cateter, microcateter, coil, retriever, aspiração, balão, stent e proteção. Diversor de fluxo é somente visualização conceitual, sem tratamento hemodinâmico implementado. A indicação de tratamento está pressuposta; não há seleção de pacientes, doses ou recomendações de conduta.

## Modelo anatômico e mecânico

`network.ts` monta uma rede navegável a partir das curvas de arco, ACI e polígono de Willis do atlas. Os identificadores anatômicos e Bouthillier C1–C7 permanecem vinculados aos objetos de origem. Lasjaunias continua como base embriológica independente no atlas, sem conversão entre suas classificações.

A montagem transforma referenciais e acrescenta acesso femoral, conexões, ramificações auxiliares e saco aneurismático sintéticos. As junções navegáveis têm continuidade posicional testada. A malha clínica de um paciente não foi reconstruída. A anatomia original do atlas permanece disponível e não foi substituída por esta montagem.

Cada instrumento tem trajetória e profundidade independentes. Rotação escolhe a saída nas bifurcações; avanço/recuo percorre o grafo. Cateter/microcateter dependem de suporte do guia; coil/retriever/diversor dependem do microcateter. O microcateter permanece quando o guia recua. Trajetórias divergentes exigem recuo antes de nova progressão. Guia diagnóstico é limitado à região proximal por regra explícita do cenário.

A curvatura distal varia com perfil, rotação e suporte, limitada por uma estimativa de luz. O indicador de contato é geométrico e adimensional. Não representa força, atrito, torque transmitido ou risco real de perfuração. Seleção de ramo por setores de rotação é uma aproximação de interface, não uma solução de interação parede/instrumento.

## Imagem e controles da hemodinâmica

- Dois monitores sintéticos projetam a mesma geometria dos instrumentos e vasos. Os planos A e B têm angulações RAO/LAO e cranial/caudal independentes, inicialmente em AP e lateral. Mesa, magnificação e colimação ainda são compartilhadas. A máscara preserva as angulações capturadas dos dois planos.
- Pedal momentâneo de fluoroscopia (Espaço ou manter botão pressionado), seleção de 3/7,5/15/30 pulsos por segundo e retenção da última imagem ao soltar. Perda de foco solta o pedal.
- DSA inicia aquisição virtual de quatro segundos após injeção. A representação óssea sintética é retirada no modo subtraído; não há imagens DICOM ou simulação física de raios X.
- Contraste temporário se origina no cateter e percorre os descendentes do grafo, respeitando o corte da oclusão M1. Injeção no acesso femoral não opacifica a circulação cerebral. Não há transporte físico, refluxo, circulação venosa ou análise de fluxo.
- Roadmap captura a geometria, projeção e estado da lesão da imagem contrastada. Movimento do arco/mesa ou zoom preserva a máscara antiga e sinaliza desalinhamento. É preciso nova captura para corrigi-lo.
- RAO/LAO, cranial/caudal, presets AP/lateral/oblíqua, translação da mesa, magnificação, colimação e ganho alteram a imagem. As alterações aparecem na aquisição ativa; com RX pausado, mantém-se a imagem anterior.
- A visão 3D auxiliar e a assistência de bifurcações podem ser desligadas. A estação 2D funciona sem WebGL.

Manipulador: arrastar verticalmente avança/recua, horizontalmente gira; roda do mouse avança/recua, Shift+roda gira. W/S ou setas verticais movimentam; A/D ou setas horizontais giram; 1–4 selecionam instrumento; I injeta contraste; R captura roadmap. Os controles não interceptam edição em campos/selects.

Eventos, tempo RX **simulado**, injeções e manobras ficam no relatório JSON. Encerrar salva registro local versionado e congela as intervenções. Resultado é chamado **objetivo gráfico**, sem nota de competência profissional. Não se calculam dose, mL, packing density, TICI ou NASCET.

## Pesquisa Mentice e limite de acesso

O inventário anterior registrou 165 vídeos públicos e selecionou 55 por título/descrição (38 neurointervenção, 17 fundamentos complementares). Isso foi triagem de metadados; não análise audiovisual.

Nesta revisão, tentaram-se os quatro demonstrativos indexados: `BpPYaBwrbT8` (coiling), `SP0zbOw0fEA` (stroke), `rj6Ok5ywaD0` (carótida) e `czY91bSZPXs` (cateter). Os fluxos e prévias não puderam ser inspecionados: formatos indisponíveis, HTTP 429 e desafio de autenticação/robô. Não foram usados cookies, contas, proxies ou contornos. Portanto **não houve análise dos quadros nem visualização integral desses vídeos**, e não se afirma ter examinado audiovisual de todo o canal.

A referência funcional acessível foi a documentação primária pública do fabricante:

| Fonte | Funcionalidade documental que orientou o escopo | Limite nesta implementação |
| --- | --- | --- |
| [Neurovascular coiling](https://www.mentice.com/software/neurovascular-coiling) | Navegação, imagem biplanar/roadmap, coils e suporte | Sem 3DRA reconstruída, biomecânica ou complicações fisiológicas |
| [Neurovascular thrombectomy](https://www.mentice.com/software/neurovascular-thrombectomy) | Sistema coaxial, aspiração e retriever | Remoção por regra geométrica, sem composição/deformação de trombo |
| [Carotid intervention](https://www.mentice.com/software/carotid-intervention) | Proteção, angioplastia, stent e avaliação por imagem | Proteção como estado do cenário; sem embolização distal ou fisiologia |

Não houve cópia de software, casos, mídia ou algoritmos proprietários. Não há vínculo ou certificação Mentice. Os livros já referenciados no atlas sustentam a vinculação anatômica; não fornecem homologação das regras de simulação. O detalhamento bibliográfico e o estado de rastreabilidade permanecem no módulo do atlas.

## Validação e próximos incrementos

Verificações: TypeScript, testes de motor/contratos, Playwright desktop e viewport móvel e build Vite. Os testes incluem junções, alvos alcançáveis, seleção de ramo, suporte e recuo independentes, navegação completa do acesso ao saco com entrega de coil, regras espaciais, máscara persistente, projeção, pedal, limites da sessão e preservação do atlas. Testar software não equivale a homologar anatomia ou habilidades.

Esta versão é um **protótipo cinemático e gráfico não homologado**, não um equivalente de alta fidelidade da Mentice nem um dispositivo de treinamento profissional validado. Avanço necessário para esse objetivo: revisão presencial das demonstrações acessíveis e validação por neurointervencionistas; geometria homologada; instrumentos orientados e deformáveis com contato/colisão física; IFUs e compatibilidade por modelo; transporte de contraste/fluxo; imagem calibrada e detectores com ajustes independentes; complicações e resposta fisiológica; avaliação de métricas e competência com estudos de validade.

Manter somente preview e PR em revisão. Não integrar à main nem promover produção sem aprovação.
