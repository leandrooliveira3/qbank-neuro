/** Primary interaction references supplied by the user, inspected locally.
 * Samples establish visible UI/workflow evidence, not a calibrated model.
 */
export const primaryVideoSources = [
  { id: 'brain', title: 'Mentice · Brain', file: 'Mentice-Neurovascular-Brain-SnapYT.App.mp4', durationSeconds: 440.97, sha256: '042326a3680c84eb2d6bf6d32a599510c694a3520792d13a23cf8c4b8a4972f2' },
  { id: 'thrombectomy-training', title: 'Mentice · Trombectomia demonstrada', file: 'Mentice-Neurovascular-Thrombectomy-SnapYT.App (1).mp4', durationSeconds: 1338.58, sha256: '47ddc025a3a3d338a24304169c7a2ce539810e2fdf302c495f685237b796dc62' },
  { id: 'thrombectomy-overview', title: 'Mentice · Visão geral da trombectomia', file: 'Mentice-Neurovascular-Thrombectomy-SnapYT.App.mp4', durationSeconds: 133.45, sha256: 'd0b0cf429f069a294d7b329e853be18d1524ff45c0d3c4c83c2fab322d9a8b16' },
] as const;

export interface VideoStudyPhase {
  title: string;
  observation: string;
  sourceId: typeof primaryVideoSources[number]['id'];
  seconds: number;
  available: string;
}

export const thrombectomyPhases: VideoStudyPhase[] = [
  { title: 'Acesso e instrumentos', observation: 'A demonstração apresenta manipulação no arco com cateter multipropósito.', sourceId: 'thrombectomy-training', seconds: 160.63, available: 'Explore a entrada, o perfil do arco e os controles separados de guia e cateter.' },
  { title: 'Seleção carotídea e roadmap', observation: 'Acesso do arco à carótida e roadmap aparecem na sequência demonstrada.', sourceId: 'thrombectomy-training', seconds: 294.49, available: 'Compare Fluoro, DSA e a máscara capturada. Mudanças de projeção podem desalinhar o roadmap.' },
  { title: 'Sistema coaxial', observation: 'A demonstração mostra o avanço de um cateter-guia com balão sobre o sistema de acesso.', sourceId: 'thrombectomy-training', seconds: 562.20, available: 'O modelo possui guia, cateter-guia e microcateter separados. O controle dedicado de balão proximal ainda não foi reproduzido.' },
  { title: 'Dispositivo na oclusão', observation: 'A troca da microguia pelo retriever é indicada na tela.', sourceId: 'thrombectomy-training', seconds: 829.92, available: 'Use o catálogo e o dispositivo genérico. A troca física automática de instrumentos do vídeo ainda não está implementada.' },
  { title: 'Retirada e aspiração', observation: 'A retirada conjunta de retriever e cateter distal aparece no vídeo.', sourceId: 'thrombectomy-training', seconds: 963.78, available: 'Explore as ações de recolher e aspirar. O modelo não reproduz forças medidas nem acoplamento físico de todo o sistema.' },
  { title: 'Controle e encerramento', observation: 'O vídeo mostra uma verificação do resultado e, depois, a retirada final dos dispositivos.', sourceId: 'thrombectomy-training', seconds: 1097.64, available: 'Registre nova aquisição e exporte a sessão. Abertura distal gráfica não equivale a uma classificação clínica de reperfusão.' },
];

export const aneurysmPhases: VideoStudyPhase[] = [
  { title: 'Acesso e injeção de teste', observation: 'O vídeo mostra acesso vascular e uma injeção para verificar a posição.', sourceId: 'brain', seconds: 52.92, available: 'Explore os instrumentos separados e a aquisição de contraste virtual.' },
  { title: 'Roadmap e projeção', observation: 'O aneurisma e a coluna de contraste aparecem com máscara de roadmap.', sourceId: 'brain', seconds: 141.11, available: 'Capture a máscara e ajuste a projeção no console.' },
  { title: 'Planejamento tridimensional', observation: 'A demonstração utiliza 3DRA para escolher projeção e uma ferramenta de medida.', sourceId: 'brain', seconds: 229.30, available: 'A vista atual usa superfícies do atlas. Aquisição rotacional volumétrica e medidas calibradas ainda não estão implementadas.' },
  { title: 'Instrumentos e suporte', observation: 'A tela de procedimento apresenta ferramentas e uma ação para estacionar o balão.', sourceId: 'brain', seconds: 273.40, available: 'Compare o catálogo e os controles coaxiais. A ação de estacionar balão do vídeo ainda não foi reproduzida.' },
  { title: 'Coils e controle visual', observation: 'A sequência mostra as primeiras alças de coil e o preenchimento progressivo do saco.', sourceId: 'brain', seconds: 317.50, available: 'Explore abertura e destaque do coil genérico. O preenchimento é gráfico e não calcula packing density validada.' },
];

export function workflowFor(kind: string) {
  return kind === 'stroke' ? thrombectomyPhases : kind === 'aneurysm' ? aneurysmPhases : [];
}

export function referenceTime(seconds: number) {
  return `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;
}
