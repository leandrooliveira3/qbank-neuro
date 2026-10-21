# Estado verificável — prioridade máxima Neuroangio

Atualizado21/10/2026. Base desta etapa353d149586290e97670711ce02e0175fcae5a79d, feature/neuro3d-atlas, PR2rascunho, Vercel SUCCESS confirmado. Novo checkpoint identificável pelo Git que contém este arquivo; hash/árvore/deployment a conferir ao fechar. Local continuation/neuroangio-priority; original/alterações alheias preservados.

## Prioridade e autorização vigentes

Usuário: maior prioridade é completar artérias e veias Neuroangio, clicáveis no atlas3D/angiografia, usando datasets como evidência. Auditoria própria explicitamente autorizada; inclui ramos, trajeto completo, anastomoses e identificação dos forames. A autorização permite executar e registrar validação, sem converter teste técnico em prova anatômica. Visor GS-CA permanece pendente e subordinado a essa prioridade.

## Entrega deste lote

- Índice Neuroangio pesquisável/exportável; ação revelar/isolar ajusta ocultações, filtros, camada, sistema e campo sem mover o vaso. Seleção comum mantém comportamento anterior.
- Malha original importada completa disponível na seleção isolada2D, com SHA/hierarquia/transformação compartilhada do3D. Geral/procedural permanecem simplificados. Sem novos arquivos clínicos no site.
- Auditoria própria592vasos (239importados ativos/353reconstruções),12arquivos de geometria conferidos,3552raycasts CPUsemfalha. Comparação dos353eixos com todas as faces dos respectivos pais;205importados/148reconstruídos. Relação com pai não é conexão luminal.
- Nove registros de forames/passagens,18conjuntos laterais/46elos bibliográficos, com contexto ósseo/neural e seleção de vasos. Rotas redondo–ILT/C4, oval–AMA/ILT, vidiana–C2, espinhoso–AMM/ILT e AMM–lacrimal/oftálmica; Vesálio como alternativa. Forames ainda sem superfícies/coordenadas próprias verificadas; nervo vidiano individual ausente.
- Revisão dirigida Neuroangio e Lasjaunias2001: seis páginas de texto, três também inspecionadas visualmente; livro/figuras privados. Ver ../neuro3d-neuroangio-priority-review.md e ../neuro3d-atlas-self-audit.json.

## Cobertura real, sem equivalência entre presença e completude

322identidades/grupos (228arteriais/94venosos);612IDs esperados,592representados sem homologação. Dez novas exigências venosas expõem20IDs sem geometria.373IDs sem referência importada ativa (267arteriais/106venosos), incluindo reconstruções existentes. 1114importações originais/1112ativas e353reconstruções não mudaram. Zero identidade geométrica aprovada globalmente.

Galeno–seio reto e sete rótulos107,4,26b,70a,74a,114a,115a continuam irresolvidos.28faces degeneradas nas retinais originais (14porlado); achado técnico sem reparo arbitrário. Completo inventário de todos os ramos/variantes, trajetos e anastomoses não foi comprovado. Oito representações embrionárias adicionais históricas não recuperadas.

## Frentes preservadas

42cortes BRAVE/VENAT e vínculos físicos anteriores preservados sem reextração. Fontes independentes, sem registro ao atlas. GS-CA: dez casos auditados, visor local MHD/RAW/RAD e VOI/ROI ainda pendentes; dados locais/BY-NC-ND/guia preservados. Planilha gold-standard inspecionada com leitor XLS temporário; índiceszero, sem redistribuir ROI.

Paciente3D: DICOM local reconstruído/LPSmm, prévia por intensidade, testes sintéticos, sem reconstrução XA ou 3DRA real homologada. CTA: amostras JPEGsemperdas rejeitadas e série acima de32milhões de voxels. Doppler analítico, Mentice/VascularTwin e REA/Ankyras preservados. Sem FFTreal, corpo IL2CPP recuperado ou recomendação automática de dispositivo.

## Validação

TypeScript/build e129unitários/32arquivos aprovados; auditoria geométrica completa executada. 32casos únicos de navegador desktop/Pixel7 aprovados; capturas pertinentes inspecionadas. Ler VALIDATION para escopo e falhas iniciais corrigidas. Aviso de chunks>500kB permanece. Publicar preview sem merge/force e confirmar novo hash/status.
