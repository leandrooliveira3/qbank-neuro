# Paciente 3D — importação e prévia por intensidade

## Funcionalidade entregue

Aba própria, carregada sob demanda. Lê arquivos DICOM localmente em worker; mostra cortes, dimensões e espaçamento; permite ajustar limiar, extrair isosuperfície por marching cubes e exportar PLY + proveniência em ZIP. O exame não é enviado a um servidor, salvo em armazenamento persistente ou incluído em relatórios públicos. Sair da aba descarta os dados carregados.

Entrada preferencial: **volume já reconstruído da angiografia rotacional 3D**. O padrão distingue os volumes reconstruídos das projeções que os originam: [DICOM PS3.3 A.53](https://dicom.nema.org/medical/dicom/current/output/chtml/part03/sect_A.53.html).

Leitor: [dicomParser](https://github.com/cornerstonejs/dicomParser), MIT, versão 1.8.21. Suporta nesta integração imagens monocromáticas sem compressão, 8/16 bits inteiros, little endian implícito/explícito. Classes CT/MR clássicas/enhanced e X-Ray 3D Angiographic são admitidas quando contêm posição/orientação **no paciente**, por corte ou grupos funcionais. A admissão de um SOP Class não garante que toda codificação de fabricante esteja suportada. Metadados de geometria volumétrica alternativa ainda não foram adaptados.

Projeções XA/Enhanced XA, vídeo, ZIP, pixels comprimidos e arquivos sem geometria suficiente são recusados com uma razão explícita. Não existe nesta versão reconstrução tomográfica de projeções rotacionais brutas.

## Integridade física

- Um único Series Instance UID e Frame of Reference UID; sem mistura de séries ou registro automático.
- Ordenação pela posição física ao longo da normal, sem depender do nome ou Instance Number.
- Conferência de eixos ortonormais, dimensões, posições, espaçamentos e rescale. Bits armazenados/sinal são aplicados antes do rescale.
- Rejeição de cortes duplicados, sobrepostos, ausentes, inclinação e espaçamento irregular; nenhuma interpolação para esconder lacunas.
- Coordenadas de exportação **DICOM LPS em milímetros**. Conversão/centralização/escala do visor não alteram as coordenadas exportadas.
- Hash SHA-256 de cada arquivo no relatório exportado; sem nomes de paciente, identificadores de paciente ou nomes dos arquivos.
- Limites locais explícitos: 2.000 arquivos, 512 MB de entrada, 32 milhões de voxels; prévia com passo de amostragem declarado e limite de triângulos. Nunca truncar silenciosamente uma superfície.
- Interseções com padding são removidas para evitar tampas artificiais no limite do campo. A superfície pode permanecer aberta. Ramos finos podem sumir na amostragem.

## Fontes GitHub anteriores e seu papel

Os repositórios foram retomados como candidatos, sem atribuir a eles funcionalidades que não forneceram:

| Fonte | Papel possível | Integração atual |
|---|---|---|
| [Brain_3D_Vessel_Datasets](https://github.com/Zhao-BJ/Brain_3D_Vessel_Datasets) | Datasets/conversores para avaliação | Não constitui um reconstrutor calibrado de projeções 3DRA nem um modelo nomeado do paciente. |
| [IntrA](https://github.com/intra3d2019/IntrA) | Malhas de aneurismas para pesquisa/avaliação, com licença dos dados a confirmar antes de redistribuir | Não usado para substituir o aneurisma do paciente. |
| [VesselVerse](https://github.com/i-vesseg/VesselVerse-Framework) | Edição/versionamento de anotações e consenso no 3D Slicer | Inspiração para a próxima revisão de segmentação; o motor não foi integrado neste lote. |
| [Arterial_Atlas](https://github.com/Chin-Fu-Liu/Arterial_Atlas) | Territórios de irrigação | Território não é superfície luminal individual. |
| [vasculature-suite](https://github.com/BlueBrain/vasculature-suite) | Ferramentas de processamento de redes | Não foi declarado como solver biomecânico validado para estes exames. |

A implementação atual usa dicomParser e Three.js; não contém modelo de IA treinado nesses repositórios. O importador existente `tools/neuro3d/import_vascular_segmentation.py` pode apoiar a futura integração de máscaras revisadas com affine explícita, sem fusão automática ao atlas.

## O que falta para o objetivo solicitado

A prévia de intensidade pode conter osso, ruído, tecidos e componentes desconectados. Ainda não é uma segmentação vascular revisada ou uma anatomia homologada. Não há medidas de colo/diâmetro/tortuosidade, linha central, recomendação de dispositivo/técnica, avaliação de aposição/cobertura ou simulação biomecânica validada.

Próximo lote: segmentação dirigida com seleção de componentes/ROI, comparação com os cortes em múltiplos planos, histórico de operações reversível, importação de máscaras revisadas, relatório de qualidade e teste com DICOM 3DRA real desidentificado. A comparação de técnicas/dispositivos depende da geometria revisada e das medidas conferidas por especialista; não deve anunciar automaticamente uma opção como a melhor.

Os testes atuais usam DICOM sintético oblíquo, sem dados de pacientes. Isso verifica funcionamento e convenções físicas, não precisão clínica em um equipamento real.
