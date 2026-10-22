# Inspeção seccional e seio reto original — 21/10/2026

Base remota: `2cd11d7b528b3d519dcf92776d10b0b8a2022215`, árvore conferida e alterações locais anteriores preservadas; branch local `continuation/sectional-review`. O comparador existente foi ampliado, não reconstruído.

## Cortes nativos e marcos manuais

Na aba Referências vasculares, cada fonte oferece **Inspecionar cortes e marcos**. Foram extraídos 42 planos: sete índices uniformemente distribuídos por eixo nativo I/J/K em cada volume. São cortes selecionados, não navegação por todos os voxels. Cada plano conserva resolução, affine, espaçamento e valores float32 originais, sem interpolação, quantização ou registro no atlas.

BRAVE é máscara binária manual; VENAT é média populacional de fração de volume parcial. Os cortes não são imagens de intensidade MRA/TC nem identificam individualmente veias. Só o brilho de exibição é convertido de [0,1] para cinza 8-bit. A razão física entre pixels controla a exibição, e a direção crescente de cada eixo é explicitada; não presumir orientação/alinhamento comum entre fontes.

Clique/toque em um pixel registra voxel nativo (base zero), RAS/mm, valor float32, nome manual e hash de origem. Enter no corte em foco marca seu centro. Há desfazer e exportação de marcos/proveniência. Fechar/reabrir o painel preserva as marcações enquanto a aba permanece montada; sair da aba não as persiste. Exportar antes de sair. Nomear um marco não aprova a identidade anatômica. Não há associação automática ao atlas.

O carregamento confere SHA-256 antes de decodificar e rejeita cabeçalho, dimensões, valores não finitos/fora de [0,1]. Requisições têm cancelamento e geração; trocar corte/eixo oculta o anterior imediatamente. Arquivo corrompido não reaproveita imagem antiga. Dados seccionais são carregados apenas ao abrir a inspeção, sem afetar os visores de superfície existentes.

`build_reference_sections.py` gera os planos; `verify_reference_sections.py` lê os arquivos distribuídos e confronta **cada valor** com o NIfTI original: 2.207.744 voxels BRAVE e 3.149.328 VENAT, todos exatamente iguais em float32; affines também iguais. Resultado em `neuro3d-sectional-source-audit.json`. Manifesto por corte em `features/neuro3d/comparison/sections.json`; créditos/licenças em `public/neuro3d/comparison/NOTICE.md`.

## Geometria original completa do seio reto

O atalho **Revisar Galeno e seio reto com contexto** usa o atlas existente e sua geometria GLB original, com tálamos, mesencéfalo, polos occipitais, osso occipital, foice/tentório quando disponíveis. Preserva as ocultações manuais. As estruturas de contexto são rótulos de origem sem homologação; não são pontos anatômicos clinicamente validados. Retirar o conjunto usa Mostrar rede vascular completa. A representação 2D continua usando o pacote de projeção simplificado existente, conforme nota visível.

Foi decodificada a geometria original dos arquivos cardiovascular, ósseo, encefálico e de marcos ósseos/durais. O seio reto tem **1.164 vértices e 2.304 triângulos**. Hashes dos GLBs foram confrontados com os manifestos; a primitiva única, contagens dos accessors e ausência de transformação parental adicional foram verificadas antes da análise. Os buffers e transformações do atlas não foram editados.

`audit_straight_sinus.py` calcula, para cada uma das 49 amostras do eixo ilustrativo de Galeno já registrado, o ponto mais próximo considerando **todos os triângulos originais**, inclusive interior de faces e segmentos de borda. Primeiro ponto: 2,852412 cm; último: 2,190661 cm. A análise anterior contra vértices de projeção havia dado 2,853543 e 2,191059 cm; métodos/objetos distintos permanecem documentados separadamente. A análise nova não depende da malha simplificada.

Essas distâncias são de pontos do eixo ilustrativo à superfície original. Não são distância contínua entre eixos ou paredes, diâmetro, óstio, patência ou prova de drenagem. A divergência persiste; não foi criada ponte, deslocada curva ou renomeada malha. Identidade/orientação do rótulo de origem ainda precisam de conferência pela linhagem da fonte e por revisão especializada. Relatório: `neuro3d-straight-sinus-original-audit.json`. Casos analíticos de interior de triângulo, aresta, vértice e degeneração verificam o cálculo em `test_straight_sinus.py`.

As sete identidades do diagrama permanecem abertas; contagens do inventário não mudaram. Paciente 3D, Doppler, Mentice/Vascular Twin e avaliação REA/Ankyras foram preservados.

## Verificação e publicação

TypeScript/build e 122 testes unitários em 28 arquivos aprovados; três testes Python do cálculo geométrico aprovados. A execução ampla de navegador cobriu 22 casos únicos em desktop/Pixel 7. Após melhorar a preservação dos marcos ao fechar o painel, os quatro casos seccionais foram repetidos e passaram; repetições não são somadas como novos casos. Capturas seccionais e de contexto inspecionadas; para o celular, capturar as regiões de inspeção separadamente evita artefatos de uma imagem de página inteira excessivamente alta no ambiente gráfico local. Permanece aviso de chunks >500 kB.

Deployment da base 2cd11d7: GitHub sem status de sucesso; conector Vercel respondeu 403 por falta de acesso ao time `leandros-projects-85e6d34d`, inclusive após o usuário confirmar que o plugin está adicionado. CLI não disponível. Conexão existente e autorização ao time são coisas distintas; não alterar permissões globais nem declarar preview pronto. Publicação do código pode prosseguir no GitHub sem depender dessa consulta.

## Reprodução e próxima tarefa

Com o runtime offline e os NIfTI verificados: executar `build_reference_sections.py --input-dir <pasta>` e `verify_reference_sections.py --input-dir <pasta>`. Para o audit original: `decode_reference_meshes.mjs` com os cinco GLBs descritos, depois `audit_straight_sinus.py --decoded <json>` e `test_straight_sinus.py`. NIfTI originais, geometria intermediária decodificada e runtime continuam fora do repositório.

Próximo: rastrear a identidade/transformações do seio reto na linhagem BodyParts3D → Z-Anatomy → Anatria, confrontar marcos com evidência identificável e ampliar a inspeção entre cortes/3D da mesma fonte. Nenhum ajuste geométrico por proximidade antes dessa evidência. Preservar as sete identidades e todas as frentes do roadmap.
