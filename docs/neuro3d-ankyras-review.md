# Ankyras — análise estática e implicações para Paciente 3D

## Pacote e método

Arquivo fornecido: `E:/Downloads/Ankyras_508_APKPure.apk_Decompiler.com.zip`, 70.461.238 bytes e 12.525 entradas. SHA-256: `81d3aac1f76ed97d2da5dd119ce88729a0b63c1f70869ebd1d2f75d470f35369`.

REA 6.5.0 concluiu o inventário do ZIP e a inspeção estática do assembly de declarações `Assembly-CSharp.dll`. Evidências locais:

- ZIP: `ev_333aace953ef3bad44e053850094e648e893b0f9d3e4f288f1b69d69118449e9`.
- Assembly: `ev_c96766f3e7aca1a3097f59bf643dcaa8241b85fae7df589a77e6ef50e52f24cc`; SHA-256 `4d42178b09180cb470a746c122716f0692c466e9916a99b6956ae666411aa297`.

O próprio `unity/README.txt` informa backend Unity IL2CPP, declarações/endereço de métodos e dummy assemblies. Há recursos não exportados, conforme `DECOMPILATION-NOTES.txt`. Os arquivos C# examinados contêm retornos `default`/`null` e corpos vazios gerados pelo decompilador; **não são implementações recuperadas dos algoritmos**. A arquitetura x86 do DLL dummy não identifica a arquitetura de execução do app Android, indicada pelo pacote como ARM/ARM64.

Nenhum APK/app foi executado, não houve chamadas aos serviços do fabricante, uso de credenciais, alteração de licença ou inclusão do código/ativos proprietários no projeto público.

## O que os artefatos efetivamente sustentam

| Evidência estática | Observação sustentada | O que continua desconhecido |
|---|---|---|
| `SegmentationRequest` / `SegmentationRequester` | Contratos com limites espaciais, limiares mínimo/máximo, suavização e operações de segmentação; há declarações de caminhos remotos e nativos offline. | Implementação, significado/unidades dos parâmetros, precisão e disponibilidade do backend. |
| Declarações `OfflineSegmentationMC` e `OfflineSegmentationRG` | Há nomes de interfaces nativas distintos para dois caminhos de segmentação. | As siglas não provam implementação de marching cubes/region growing nem seus detalhes. Não foram transplantadas como algoritmo. |
| `VesselMeshSegmentation` | Existe fluxo nomeado de obtenção/carregamento da segmentação. | Não prova que o APK contém um segmentador DICOM completo e autônomo. |
| `CenterlineExtractionDialog`, `CenterlineRequest`, `CenterlineDownload` | Seleção proximal/distal, correções e obtenção de linha central aparecem como contratos/declaracões. | Método de extração, preservação de ramos, unidades e validação não recuperados. |
| `CenterLineModificationHistory` | O projeto declara histórico de modificações e operação desfazer/refazer. | A política real e a correção das operações não estão demonstradas pelos stubs. |
| `SkeletonPoint` | Tipos de marcos proximal, colo proximal, colo distal e distal. | Colocação correta dos marcos em um caso real ainda exige revisão. |
| `SaveMorphologyInfo` | Contrato distingue comprimentos e diâmetros de regiões distal, colo e proximal. | Não estabelece algoritmo ou validade das medidas. |
| `FlowDiverterSimulation`, `StentDeployData` | Declarações distinguem posição do stent, regiões, raio, comprimento, encurtamento e múltiplos dispositivos. | Equações, modelos dos dispositivos, parâmetros calibrados e validação clínica não recuperados. |
| `SimulationDataLoader` | Há carregamento de simulações/objetos e declarações para conteúdo offline/remoto. | Não foi demonstrada reconstrução tomográfica de projeções rotacionais brutas. |

## Como isso orienta a implementação original

1. Entrada volumétrica e transformação física verificadas, mantendo os cortes como referência da segmentação. O importador local já entregue é o início desse caminho, sem reutilizar código do app.
2. Segmentação por região/intervalo de intensidade com seleção explícita de componente e histórico reversível. Conferir com os planos originais, sem preencher lacunas por atlas/template.
3. Linha central com entradas/saídas revisadas; separar marcos proximal/distal e limites do colo. Não reduzir uma rede inteira a uma única linha sem registrar o recorte.
4. Medidas seccionais e longitudinais rastreáveis à máscara/volume e aos marcos. Definir unidades e convenções antes da comparação de dispositivos.
5. Camada de dispositivos com catálogo versionado, parâmetros de comprimento/diâmetro, critérios de aplicabilidade e incerteza. Aposicão, encurtamento e sobreposição requerem modelos próprios validados; uma malha visual não os substitui.
6. Comparação de cenários para revisão por especialista, sem afirmar automaticamente a melhor técnica ou transpor a validação do produto comercial para este projeto.

**Resultado da avaliação:** o material ajuda a especificar o fluxo e os contratos de geometria/medidas/dispositivos. Não fornece neste lote um motor executável validado de reconstrução ou planejamento. A função completa solicitada permanece em desenvolvimento, como registrado em `neuro3d-next-step.md` e no registro persistente da tarefa.
