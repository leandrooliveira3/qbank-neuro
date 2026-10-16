import type { Device } from "./engine";
export interface TrainingQuestion {
  id: string;
  prompt: string;
  options: string[];
  correct: number;
  explanation: string;
  source: string;
}
export interface TrainingCase {
  id: string;
  title: string;
  topic: string;
  device: Device;
  scene: string;
  variant: string;
  anatomy: "aneurysm" | "clot" | "stenosis" | "shunt" | "branch";
  brief: string;
  objective: string;
  focus: string;
  videoIds: string[];
  sources: string[];
  question: TrainingQuestion;
}
export const trainingCases: TrainingCase[] = [
  {
    id: "coil-sac",
    title: "Coil e saco aneurismático",
    topic: "Coiling",
    device: "coil",
    scene: "disease",
    variant: "aneur",
    anatomy: "aneurysm",
    brief:
      "Modelo fictício de aneurisma sacular em um vaso parental. Este exercício isola a diferença entre ocupar o saco e preservar o vaso parental; não determina indicação de tratamento.",
    objective:
      "Reconhecer a função de um coil e visualizar uma espiral genérica em expansão.",
    focus:
      "Observe saco, colo e vaso parental em duas projeções. O controle é uma animação normalizada, sem cálculo de packing ou resistência.",
    videoIds: ["BpPYaBwrbT8", "98BafsAPbbI", "UbnfGZQ_vgw"],
    sources: ["HARR_DEVICES", "BORDEN_ANGIO"],
    question: {
      id: "coil-q",
      prompt: "Qual propriedade está sendo demonstrada nesta tarefa?",
      options: [
        "Ocupação do saco por espirais",
        "Filtração distal de êmbolos",
        "Aspiração de um trombo",
      ],
      correct: 0,
      explanation:
        "O modelo representa espirais no saco. Volume, estabilidade do coil e preservação de ramos não são calculados.",
      source: "HARR_DEVICES",
    },
  },
  {
    id: "flow-parent",
    title: "Diversor de fluxo no vaso parental",
    topic: "Diversão de fluxo",
    device: "flow-diverter",
    scene: "disease",
    variant: "aneur",
    anatomy: "aneurysm",
    brief:
      "Compare uma malha tubular no vaso parental com a ocupação intrassacular pelo coil. Não há seleção de diâmetro, comprimento, produto ou regime farmacológico.",
    objective:
      "Distinguir suporte tubular no vaso parental de preenchimento do saco.",
    focus:
      "Observe a relação do dispositivo com o colo. A animação não calcula aposição, porosidade, trombose nem alteração de fluxo.",
    videoIds: ["_Zq3gw1lCq8", "mlD-qZWzgnU", "wDsRNG38BI8", "gw5yagme3mA"],
    sources: ["HARR_DEVICES", "KRINGS_CAROTID"],
    question: {
      id: "flow-q",
      prompt:
        "O que falta para interpretar esta animação como simulação específica de um produto?",
      options: [
        "Apenas uma cor mais realista",
        "Dados mecânicos, anatomia calibrada e validação específica",
        "Somente aumentar a velocidade",
      ],
      correct: 1,
      explanation:
        "A malha é genérica. A reprodução visual não valida comportamento mecânico, seleção de produto ou resultado hemodinâmico.",
      source: "HARR_DEVICES",
    },
  },
  {
    id: "retriever-clot",
    title: "Stent retriever e alvo trombótico",
    topic: "Trombectomia",
    device: "retriever",
    scene: "circle",
    variant: "normal",
    anatomy: "clot",
    brief:
      "Um alvo trombótico fictício permite observar a abertura de uma cesta genérica. A tarefa pede essa família de dispositivo; não compara indicações clínicas entre técnicas.",
    objective:
      "Visualizar a expansão de um retriever próximo de um alvo didático.",
    focus:
      "Mover o cursor não reproduz a navegação livre de um microguia. Não existe previsão de captura do trombo, embolização distal ou reperfusão.",
    videoIds: [
      "U1fprbeRliA",
      "DYWq_CjsSVw",
      "SP0zbOw0fEA",
      "petwIx-8KcQ",
      "jlxZg4KbC8Y",
    ],
    sources: ["HARR_DEVICES", "KRINGS_CIRCLE"],
    question: {
      id: "retriever-q",
      prompt: "A abertura da cesta no desenho permite afirmar reperfusão?",
      options: [
        "Sim, o desenho corresponde a TICI 3",
        "Não; visualização do dispositivo não mede reperfusão",
        "Sim, se o cursor chegou a 100%",
      ],
      correct: 1,
      explanation:
        "O exercício não calcula oclusão residual ou reperfusão. Não atribui TICI nem resultado clínico ao movimento.",
      source: "HARR_DEVICES",
    },
  },
  {
    id: "aspiration-target",
    title: "Aspiração: cateter e alvo",
    topic: "Trombectomia",
    device: "aspiration",
    scene: "circle",
    variant: "normal",
    anatomy: "clot",
    brief:
      "Use um cateter genérico para estudar a relação espacial entre sua ponta e um alvo. Não se aplicam pressões, forças ou escolha de calibre.",
    objective:
      "Identificar o papel do lúmen de um cateter de aspiração na demonstração.",
    focus:
      "A animação destaca a ponta do cateter e o alvo. Não simula pressão negativa ou interação trombo-parede.",
    videoIds: ["JVIVviDKws8", "SP0zbOw0fEA", "HdUAVMndoLg"],
    sources: ["HARR_DEVICES", "KRINGS_CIRCLE"],
    question: {
      id: "aspiration-q",
      prompt: "Qual grandeza não é calculada neste exercício?",
      options: [
        "Posição normalizada do cursor",
        "Pressão de aspiração",
        "Número de ações no painel",
      ],
      correct: 1,
      explanation:
        "As únicas medidas são de interação com a interface. Não há pressão, vazão ou força de aspiração simulada.",
      source: "HARR_DEVICES",
    },
  },
  {
    id: "carotid-stent",
    title: "Stent e segmento estenosado",
    topic: "Carótida",
    device: "stent",
    scene: "arch",
    variant: "normal",
    anatomy: "stenosis",
    brief:
      "Uma redução fictícia da luz representa um alvo para estudar a função visual de um suporte tubular. Não é um modelo de decisão entre tratamento clínico, endarterectomia e stent.",
    objective:
      "Reconhecer stent como estrutura de suporte e observar sua expansão.",
    focus:
      "A lesão é conceitual. O exercício não prediz embolização, proteção cerebral, força radial ou estenose residual.",
    videoIds: ["oY3yLa64TSI", "FXhFHS_ozyg", "rj6Ok5ywaD0"],
    sources: ["HARR_DEVICES", "HARR_ARCH"],
    question: {
      id: "stent-q",
      prompt: "O que a expansão representada demonstra?",
      options: [
        "Suporte tubular genérico",
        "Proteção cerebral comprovada",
        "Indicação automática de stent",
      ],
      correct: 0,
      explanation:
        "A animação mostra uma função estrutural genérica. Não valida indicação clínica ou proteção contra embolização.",
      source: "HARR_DEVICES",
    },
  },
  {
    id: "balloon-stenosis",
    title: "Balão: expansão reversível",
    topic: "Estenose intracraniana",
    device: "balloon",
    scene: "circle",
    variant: "normal",
    anatomy: "stenosis",
    brief:
      "Observe um balão em uma anatomia fictícia. A tarefa é reconhecer a diferença entre expansão temporária e implante permanente.",
    objective: "Comparar a expansão reversível do balão com um stent.",
    focus:
      "Não existem curvas de complacência, pressão nominal, limite de ruptura ou compatibilidade de produtos.",
    videoIds: ["jOQCAHuMUuM"],
    sources: ["HARR_DEVICES", "KRINGS_CIRCLE"],
    question: {
      id: "balloon-q",
      prompt: "Qual informação exigiria a IFU específica do balão?",
      options: [
        "Nome da aba do aplicativo",
        "Limites de pressão e compatibilidade",
        "Data de acesso do vídeo",
      ],
      correct: 1,
      explanation:
        "Pressões e compatibilidade dependem do dispositivo e de sua instrução de uso. Estes valores não foram inferidos a partir do vídeo.",
      source: "HARR_DEVICES",
    },
  },
  {
    id: "avm-architecture",
    title: "MAV: pedículo, nidus e drenagem",
    topic: "MAV e FAV",
    device: "microcatheter",
    scene: "disease",
    variant: "avm",
    anatomy: "shunt",
    brief:
      "Um circuito fictício ilustra pedículo, rede e drenagem. O objetivo é reconhecimento de angioarquitetura; não se escolhe um pedículo seguro nem um agente embolizante.",
    objective:
      "Relacionar posição do microcateter com a leitura da angioarquitetura.",
    focus:
      "Não há injeção de agente líquido, previsão de refluxo, penetração no nidus ou oclusão de drenagem.",
    videoIds: ["3Yf0pwksRaw"],
    sources: ["HARR_DEVICES", "LASJ_CORE"],
    question: {
      id: "avm-q",
      prompt: "Por que chegar ao alvo desenhado não define um pedículo seguro?",
      options: [
        "Porque a cor deveria ser outra",
        "Porque relações funcionais, ramos e drenagem exigem avaliação própria",
        "Porque toda MAV tem a mesma drenagem",
      ],
      correct: 1,
      explanation:
        "Trajetos esquemáticos não reproduzem todos os ramos, anastomoses, drenagem e relações funcionais relevantes.",
      source: "LASJ_CORE",
    },
  },
  {
    id: "mma-connections",
    title: "Meníngea média e conexões de risco",
    topic: "Meníngea média",
    device: "microcatheter",
    scene: "orbit",
    variant: "meningo",
    anatomy: "branch",
    brief:
      "Exercício sobre identificação de conexões extracranianas-intracranianas. O vídeo demonstra o módulo da Mentice; o caso original do QBank enfatiza os limites de uma trajetória simplificada.",
    objective: "Relacionar microcateter, território e conexões potenciais.",
    focus:
      "Não há recomendação de embolização, escolha de partícula, ponto de injeção ou avaliação de segurança individual.",
    videoIds: ["KKn0kjTfLUQ", "cedg0jPaVmo"],
    sources: ["KRINGS_DANGER", "HARR_DANGER"],
    question: {
      id: "mma-q",
      prompt: "Uma conexão não desenhada pode ser considerada ausente?",
      options: [
        "Sim, se a animação é 3D",
        "Não; o desenho não é um inventário anatômico exaustivo",
        "Sim, se a ponta estiver estável",
      ],
      correct: 1,
      explanation:
        "Pequenas conexões podem não estar representadas ou visíveis. O atlas mantém essas limitações explícitas.",
      source: "KRINGS_DANGER",
    },
  },
];
