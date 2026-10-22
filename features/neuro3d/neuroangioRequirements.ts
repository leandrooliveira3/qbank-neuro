/** Explicit named channels observed in the cited primary pages, not inferred
 * from an unlabeled dataset or assigned to the nearest source surface. */
const superficial='https://neuroangio.org/venous-brain-anatomy/superficial-venous-system/';
const basal='https://neuroangio.org/venous-brain-anatomy/basal-vein-of-rosenthal/';
export const neuroangioAdditionalRequirements=[
  ['anterior_cerebral_vein','Veia cerebral anterior',superficial,'Anterior cerebral vein'],
  ['inferior_temporal_vein','Veia temporal inferior',superficial,'Dominant superficial sylvian vein pattern'],
  ['vein_of_rolando','Veia de Rolando',superficial,'Dominant Rolando'],
  ['temporooccipital_vein','Veia temporo-occipital',superficial,'Pseudo-Labbe dominance'],
  ['anterior_frontal_veins','Veias frontais anteriores',superficial,'Anterior frontal veins'],
  ['inferior_parietal_vein','Veia parietal inferior',superficial,'Sylvian-Labbe collateral pattern'],
  ['posterior_caudate_veins','Veias caudadas posteriores',superficial,'Deep venous tributaries in superficial venous examples'],
  ['lateral_atrial_veins','Veias atriais laterais',superficial,'Superficial cortical venous network'],
  ['paracavernous_sinus','Seio paracavernoso',superficial,'Paracavernous sinus'],
  ['tentorial_sinus','Seio tentorial · canais de drenagem variáveis',basal,'Tentorial sinus drainage'],
].map(([id,name,reference,sourceContext])=>({id,name,reference,sourceContext,layer:'venous' as const,
  group:'Neuroangio · canais nomeados em revisão',expectedIds:[`${id}_l`,`${id}_r`],references:[reference],
  note:'Identidade bibliográfica individual. Grupo/coletor existente não substitui este canal. Lado, configuração e presença variam; representação geométrica e relação com o atlas precisam de comprovação. Nenhuma curva foi criada para preencher a lacuna.'}));
export const neuroangioReviewSources=[
  {url:'https://neuroangio.org/anatomy-and-variants/diagrams-and-drawings/',status:'consulted',scope:'Legenda arterial e rótulos de figura; sete identidades preservadas em aberto'},
  {url:'https://neuroangio.org/venous-brain-anatomy/',status:'consulted',scope:'Índice venoso; território injetado e sequência de opacificação'},
  {url:superficial,status:'consulted',scope:'Canais superficiais nomeados; revisão dirigida, sem declarar levantamento exaustivo de todas as imagens'},
  {url:'https://neuroangio.org/venous-brain-anatomy/deep-venous-system/',status:'consulted',scope:'Índice profundo; tributárias exigem revisão nas páginas específicas'},
  {url:basal,status:'consulted',scope:'Rosenthal e alternativas de drenagem; nomenclatura não identifica superfícies dos datasets'},
  {url:'https://neuroangio.org/venous-brain-anatomy/venous-sinuses/',status:'consulted-directed-text',scope:'21/10/2026: HTML público obtido por HTTP direto após falha do navegador; revisão dirigida de tributárias, emissárias e variabilidade, sem conferir todas as figuras',sha256:'3d06b02141b9b629de4559719949db52b67115d6c3de7f673cf644d2bef2fed9'},
  {url:'https://neuroangio.org/venous-brain-anatomy/internal-cerebral-vein/',status:'consulted-directed-text',scope:'21/10/2026: texto dirigido de grupos subependimários, anéis e alternativas pela veia ventricular inferior; revisão integral de imagens pendente',sha256:'1b96ac4a1aa278935bce33366d08522f2ad11c251481dfafc46a3c0858194020'},
  {url:'https://neuroangio.org/venous-brain-anatomy/veins-posterior-fossa/',status:'consulted-directed-text',scope:'21/10/2026: URL correta obtida pelo índice; texto dirigido de superfícies cerebelares, canais longitudinais e drenagem petrosa; sem assistir vídeos ou revisar todas as imagens',sha256:'f31a0db3712c8e697e0f38a4eeffedea3be206f35d2cfb23a36acb1e24ec844d'},
];
