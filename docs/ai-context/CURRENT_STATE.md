# Estado verificável — vias físicas e revisão venosa

Atualizado21/10/2026. Base publicada f62c3673dc3f0e010fba08157797e0a83c4a56e3, árvore8548b9dd20e0c804bbb7f08d46d90aa8216145a0, feature/neuro3d-atlas, PR2rascunho, VercelSUCCESS reconfirmado. Local continuation/passage-geometry criado do remoto. Novo checkpoint identificado pelo Git que contém este documento; confirmar hash/árvore/status ao fechar. Checkout original e cinco arquivos não rastreados preservados.

## Prioridade e autorização

Maior prioridade: completude vascular Neuroangio no atlas/angiografia, por identidade/lado, ramos, curso, anastomoses e forames. Auditoria própria explicitamente autorizada; autorização não equivale a aprovação anatômica. Lote longo atual prioriza quatro vias; GS-CAvisor/VOI continua pendente como apoio, sem cancelamento.

## Entrega deste lote

- Inspetor físico das vias redondo–ILT, oval/AMA–ILT, vidiana–ACIpetrosa e AMM–lacrimal/oftálmica, bilateral. Cortes de triângulos originais nos três eixos, contexto ósseo/neural, ilustrações distintas, controle de plano e exportação de evidência.
- Plano de60×60mm nominais no mesmo referencial da vista3D, sem escala dupla, sem marcar ponto de forame ou alterar malhas. Sobreposição explicitamente visível através das superfícies, removível.
- Auditor direcionado:8contextos/26elos/31superfícies (19originais,12ilustrativas),3GLBSHA e31hashes canônicos individuais;24conjuntos centrais de cortes offline. Distância amostrada é limite superior; distância entre caixas é limite inferior. Não se repetiu a auditoria592vasos.
- Quatro separações comprovadas do modelo: vidiana–ACI bilateral com limite inferior4,578mm nominais; ramo esfenoidal–lacrimal bilateral com3,788mm. Não indicam qual identidade está errada nem autorizam pontes. Demais22elos continuam inconclusivos; zero não comprova contato/lúmen.
- Três capítulos venosos recuperados por HTTP público direto após falha web; leitura textual dirigida, não revisão integral de figuras/vídeos. Índice oferece conjuntos por lado e seleção exata de tributárias. URL correta da fossa posterior: veins-posterior-fossa/. Termos adicionais sem identidade estabelecida ficam explícitos.

Relatório principal: [vias físicas](../neuro3d-passage-geometry-review.md); dados: ../../features/neuro3d/passage-geometry-audit.json. Relatório anterior [auditoria592](../neuro3d-neuroangio-priority-review.md) é histórico, não reexecutado neste lote.

## Cobertura e incertezas preservadas

322exigências,612IDs esperados,592representados sem homologação;20sem geometria e373sem referência importada ativa.1114importações originais/1112ativas,353reconstruções mantidas. As20ausências não esgotam os termos ainda não reconciliados das páginas. Galeno–seio reto e sete rótulos107,4,26b,70a,74a,114a,115a permanecem sem comprovação. Nenhuma identidade resolvida, forame certificado ou conexão luminal criada.28faces degeneradas retinais e oito representações embrionárias adicionais históricas continuam pendentes.

## Frentes preservadas

42cortes BRAVE/VENAT e vínculos físicos anteriores, comparador e Anatria→Qbank mantidos; referenciais independentes, sem registro implícito. GS-CA: dez casos auditados; leitor/visor MHD/RAW/RAD, VOI/ROI pendentes. Dados locais restritos não redistribuídos. CTA complementar, limites JPEGsemperdas/memória mantidos.

Paciente3D: DICOM reconstruído local LPSmm, testes sintéticos, sem reconstruçãoXA/3DRA real homologada. Doppler analítico didático, Mentice/VascularTwin, REA/Ankyras e acessos/dispositivos mantidos. Sem FFTreal, recuperação de corpos IL2CPP ou recomendação clínica automática.

## Validação

136unitários/34arquivos, TypeScript/build aprovados; auditor direcionado executado. 36 casos únicos de navegador aprovados, em10arquivos/desktop e Pixel7. As quatro vias foram abertas nos dois lados, com hashes de31superfícies, cortes nos3eixos, plano3D, exportação e recuperação de corrupção. Também passaram angiografia original, anastomoses, famílias, vínculosBRAVE/VENAT, Paciente3D, Doppler e roteiroMentice. Capturas de redondo/vidiana desktop, oval/meningolacrimal mobile e plano3D desktop/mobile inspecionadas visualmente. Sem teste remoto de navegador. Aviso de chunks>500kB permanece. Publicação autorizada de preview, sem merge/force; conferir commit exato.
