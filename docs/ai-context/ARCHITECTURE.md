# Arquitetura e limites

Estado conferido no código-base publicado `025ef13cca20886cfe8bdc17b83a1957d152ace1`, em 21/10/2026. Este checkpoint acrescenta documentação, sem mudar o aplicativo.

| Módulo | Entradas e fluxo | Arquivos principais |
|---|---|---|
| Entrada Neuro3D | Rota `/#/tools/neuro3d`; abas e carregamento dos laboratórios | `features/neuro3d/Neuro3DAtlas.tsx` |
| Anatomia detalhada | Manifestos/GLBs com hashes → camadas/seleção/isolar/cortes → cena Three | `DetailedAtlas.tsx`, `open-anatomy.json`, `anatomicalInventory.ts`, `vascularCompleteness.ts` em `features/neuro3d/` |
| Angiografia do atlas | Superfícies/pose/visibilidade → worker de projeção → imagem vinculada; respostas associadas à solicitação | `AtlasAngiography.tsx`, `atlasProjection.worker.ts`, `atlasProjection.ts`, `atlasRadiograph.ts` |
| Conteúdo ilustrativo | Trajetos e reconstruções originais separados das malhas; controle embrionário explícito | `educationalVessels.ts`, `reconstructedArteries.ts`, `educationalVisibility.ts`, `DangerousAnastomosesPanel.tsx` |
| Estação procedural | Cenários, acesso e rede didática → instrumentos/contraste/DSA/roadmap; roteiro manual referenciado | `features/neuro3d/simulation/`, especialmente `station/ProcedureStation.tsx`, `VideoWorkflowGuide.tsx`, `videoWorkflows.ts` |
| Paciente 3D | Arquivos DICOM locais → worker → volume físico → cortes/limiar → isosuperfície → ZIP PLY/JSON | `features/neuro3d/patient/PatientLab.tsx`, `dicomVolume.ts`, `patient.worker.ts`, `patientSurface.ts` |
| Doppler | Parâmetros e exemplo ideal → modelo analítico sintético → espectro/M-mode/índices/áudio/exportação | `features/neuro3d/tcd/TcdLab.tsx`, `model.ts` |
| Preparação offline | Importação de anatomia/segmentações, auditoria de datasets, adaptador VMTK separado | `tools/neuro3d/`; não são serviços de produção |
| Avaliação REA | Ferramenta de desenvolvimento fixa → evidências estáticas locais → relatórios | `tools/rea/`, `docs/neuro3d-rea-*.json`, relatórios TCD/Ankyras |

## Referenciais e contratos

O atlas mantém transformações comuns de origem; a transformação de exibição não registra pacientes. A estação conserva modelos ilustrativos; nem todo vaso visível constitui rota instrumental contínua. Angiografia de superfícies representa atenuação gráfica relativa, sem cadeia calibrada de aquisição tomográfica.

Paciente 3D exporta DICOM LPS/mm; ordena cortes por posição física e rejeita séries/referenciais misturados, lacunas e geometrias incompatíveis. Rescale e bits assinados são aplicados. Marching cubes usa amostragem declarada e limite de triângulos; não é uma máscara vascular validada. Dados locais descartados ao sair da aba, sem backend/persistência nesse fluxo.

Ferramentas Python de importação devem conservar affine, unidade, origem e proveniência. Nenhuma fusão paciente/atlas é automática. VMTK exige instalação independente e saco aberto delimitado no colo; o adaptador ainda não teve execução morfométrica real validada.

## Infraestrutura e verificação

`package.json` e lockfile fixam dependências do portal; REA tem pacote/lock separados de desenvolvimento. `vite.config.ts` prepara dependências do worker. Vitest cobre lógica; `tests/neuro3d/` e `playwright.config.ts` cobrem desktop/Pixel 7. Vercel publica previews da branch `feature/neuro3d-atlas`. Supabase/GenAI do portal não demonstram integração dos repositórios de pesquisa com o laboratório DICOM.

Não existe serviço clínico de reconstrução de projeções XA, segmentação por IA desses sete repositórios ou solver validado de dispositivos neste checkpoint.

## Comparador independente

`features/neuro3d/comparison/ReferenceComparator.tsx` é carregado sob demanda pela aba Referências vasculares. Fetch de JSON local em `public/neuro3d/comparison/` → SHA do arquivo → envelope gzip/base64 → SHA da geometria comprimida → decoder binário com dimensões/índices/finitude → cena Three. Cada requisição tem AbortController e geração; trocar limiar oculta a superfície anterior. Coordenadas persistem em RAS/mm; centralização de exibição independente. Exportação conserva fontes, affines, hashes e pose da câmera, sem registro entre fontes/atlas. Geradores offline: `build_comparison_reference.py` e `reconcile_vascular_inventory.ts`; ambiente Python fora das dependências do portal.

## Lote seccional — 21/10/2026

`comparison/SectionInspector.tsx` carrega sob demanda planos de `public/neuro3d/comparison/sections/`, confere SHA e usa `sectionGeometry.ts` para valores float32 e mapeamento pixel → voxel → RAS/mm. Sete cortes por eixo/fonte, sem reamostragem. Geração/cancelamento impedem corte antigo. Painel ocultável preserva marcos enquanto montado; exportação local antes de sair da aba. `DetailedAtlas.tsx` acrescenta conjunto de contexto Galeno/seio reto usando os GLBs originais existentes; projeção 2D continua simplificada. Ferramentas offline de extração/verificação e auditoria por triângulos versionadas.

## Vínculo físico e linhagem — estado atual

O texto inicial descreve checkpoint histórico; esta seção registra a ampliação atual. ReferenceCard mantém marks/linkedPlane/showLinked e solicita retorno ao corte por focusRequest. SectionInspector emite somente plano validado, limpa durante carregamento/erro e continua com cancelamento/generation. SectionGeometry compartilha tipos, affine e bordas físicas dos pixels; centeredReferencePoint aplica o mesmo centro e transformação à superfície/plano/marco. LinkedOverlay descarta BufferGeometry ao substituir, filtra sourceSHA e oferece picking; lista é alternativa por teclado. Registro manual de vista captura pose, plane, marks e linkedVisible. Dados temporários, sem backend ou registro entre fontes. Audit_sinus_lineage.py é ferramenta offline própria; upstream pipeline apenas consultado, não executado.

## Prioridade nova — 3D-2D-GS-CA para geometria

Usuário indicou explicitamente os onze ZIPs 3D-2D-GS-CA como referência geométrica preferencial. **Próximo lote geométrico deve começar por essa fonte**, antes de ampliar navegação BRAVE/VENAT; CTA é complementar. Auditoria offline dos10casos/20vistas e60coleções MGP concluída, hashes/CRC/bytes/finitude e projeção algébrica conferidos; três testes Python próprios aprovados. Não executou Matlab/MEX/MGP ou importação na UI. Volumes MHD/RAW e detector RAD/RAW estão em Sv/Sw mm, não DICOMLPS/RAS implícito. Report ../neuro3d-geometry-dataset-review.md; resultados ../neuro3d-gs-ca-geometry-audit.json.

Página BY-NC-ND e guia exige acordo/restringe distribuição; acordo existente não estabelecido. Dados/calibrações/pontos/código de fornecedor permanecem locais, sem redistribuição; preservar essa condição. Próxima etapa: leitor/visor local, VOI/ROI e contrato voxel→mm→detector verificável, sem sobrepor atlas ou reivindicar registro validado. Database_info.xls/ROIs e convenções visuais ainda precisam de verificação. CTA foi reconferido e3cortes reais foram rejeitados pelo leitor por JPEGsemperdas; série184 excede32milhões de voxels. Ver os dois novos relatórios CTA; não declarar integração.

## Estado atual — Neuroangio, detalhe original e passagens

NeuroangioCoveragePanel usa vascularCompleteness e neuroangioRequirements; exporta cobertura/limites/fontes/passagens. vascularExploration prepara ação explícita de revelar/isolar sem mutar geometria/estado original; DetailedAtlas ajusta camadas, filtros, corte e campo. Seleção comum não mudou.

fullVascularSurface confere GLBSHA/tamanho, GLTFLoader/Draco aplica hierarquia completa, converte pela transformação comum do atlas e descarta recursos. AtlasAngiography substitui apenas a superfície importada selecionada quando isolada e opção ativa; render/raycast usam a mesma versão. Chave de quadro/visibilidade inclui o ID original; carregamento oculta quadro antigo e bloqueia picking. Abort/cleanup impedem resultado atrasado, falhas não viram fallback silencioso. Malha geral e grafo procedural permanecem iguais.

neurovascularPassages resolve IDs/lado e elos bibliográficos, separado de fluxo/navegação. NeurovascularPassagesPanel mostra conteúdo, contexto e fontes; DetailedAtlas isola o conjunto de vasos/ossos/nervos e fichas oferecem retorno. Nenhum ponto do forame é inventado. audit_atlas_vessels.ts é ferramenta offline própria, Draco apenas desenvolvimento, sem nova dependência de produção. JSON registra as592identidades, métricas e pendências por ramo/curso/conexão.

## Inspetor de vias e plano físico

PassageGeometryInspector é lazy e usa passage-geometry-audit.json. loadOriginalAtlasSurfaces agrupa IDs por arquivo, confere tamanho/SHA, decodifica uma vez por arquivo e extrai matrizes completas; libera Three/Draco. loadFullVascularSurface conserva restrição vascular anterior. Hashes canônicos float32/uint32 little-endian de todos os originais/ilustrativos do contexto conferidos antes de iniciar worker.

passageSection.worker recebe superfícies uma vez por abertura, calcula interseção triangular no plano e responde por sequência. Mudanças de plano descartam resposta velha; fechamento cancela fetch/encerra worker. Erro bloqueia SVG/exportação e oferece retry. SVG distingue original/ilustrativo e círculo projetado fora do plano; não desenha ponte. Plano3D renderizado por DetailedAtlas no espaço cm global, sem raycast e sem escala dupla; mesma posição/normal, material explícito de sobreposição.

venousStudyReview resolve IDs por lado ou identidade mediana exata; VenousStudyReviewPanel expõe conjuntos/ausências/termos ainda não reconciliados, sem novas arestas procedurais ou geometrias. Exportação Neuroangio inclui revisão dirigida atualizada.
