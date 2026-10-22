# GS-CA local: leitor, visor e vínculo físico 3D–2D

Etapa22/10/2026; basef7a04e68f67b8e25f2155acadd554360ba2ec80e. Branchlocal continuation/gs-ca-workspace criada do remoto; a branch antiga continuation/gs-ca-viewer (353d149) foi preservada. Nenhuma geometria vascular nova criada.20ausências/373referências/sete termos continuam pendentes.

## Fluxo entregue

Aba **Geometria 3D–2D** → selecionar arquivos extraídos de UM caso (MHD+RAW, até4RAD+RAW e opcional3D_DSA_Target_Points.txt) → conferir eixos/corte/janela → VOI/ROI → escolher alvo ou clicar no volume/detector → conferir espaço físico3D → exportar revisão local. Volumes e imagens não são publicados ou enviados ao servidor. Sair da aba/remover caso termina oworker e descarta estado; nada salvo no localStorage ou banco.

CortesX/Y/Z usam x como índice mais rápido, sem espelhamento automático; volume signed16LE, detectorfloat32LE. Sv/Sw emmm, sem conversão silenciosa para LPS/RAS/atlas. Orientação é metadado declarado. Matrizes toWorld na exportação são4×4column-major, vetorescoluna homogêneos. Voxel→Sv inclui espaçamento, Sv→Sw usaOrientation/Position completos. Detector usa inversa afim completa, raio fonte→ponto e plano localz=0. Não se troca inversa por transposta.

Alvos lidos são pontosSv emmm, não índices. Coordenadas fracionárias são preservadas; o corte exibido é o índice inteiro mais próximo e esse índice é exportado separadamente. Não se desloca o alvo para fazê-lo caber no corte. Cliques no detector intersectam o raio com o corte inteiro atual, sem resolver profundidade3D a partir de uma vista. Observações guardam voxel anterior/pixel esperado/pixel observado/diferença em pixels; não calculam precisão de registro certificada.

VOI: seis limites Xmin Xmax Ymin Ymax Zmin Zmax; ROI: quatro limites Umin Umax Vmin Vmax. Inteiroszero, limitesinclusivos; rejeitados fora do campo. Preenchimento manual, sem adaptar automaticamente database_info.xls. Janela ajustável separada para volume e detector. Detector é amostrado explicitamente emstride inteiro até1024px por dimensão; marcadores/cliques voltam a pixelsnativos usandoROI/stride/centros(+0,5somente para rasterCanvas). BordasCSS são descontadas do clique. Não há inversão de pixels oculta.

Cena3D mostra caixa daVOI e raio emSw, centrados visualmente por translação documentada. Não é superfície vascular segmentada, não é modelo clínico de paciente e não está registrada no atlas. A exportaçãoJSON contém contratos/headers/calibração/digests/VOI/ROI/alvo/observações; dados locais de origem não devem ser redistribuídos em desacordo com seus termos. A confirmação manual não altera registrationAccuracyValidated:false, anatomicalIdentityAssigned:false ou atlasTransform:null.

## Memória e integridade

UmMHD porcaso, nomes locais sem caminhos externos, RAW com tamanho exato e rejeição de duplicatas/mistura identificável DatasetN. Até30arquivos/384MB selecionados; volume até224MB, detector até64MB. Estimativa conservadora 2×volume+maiorimagem+8MB limitada a512MB antes da leitura. Não é medição de pico garantida; celularreal com datasetgrande ainda não validado.

Volume100milhõesdevoxels permanece emworker comoInt16Array, sem transferir cópia paraReact. Uma projeçãoFloat32 porvez, nãoquatro. Transferência apenasdeRGBA dos cortes e metadados. SHA256 doRAW3D e cabeçalhos; hash doRAW2D só após abri-lo, com lista explícita dos ainda não lidos. Campos inválidos, matrizes singulares/nãofinitas, codificação/compressão/prefixo não suportados ou floats nãofinitos são rejeitados. Worker/identidade/sequência e chaves do pedido impedem apresentar ou exportar bitmap de outra seleção enquanto recalcula. NenhumMatlab/MEX/C++ ouMGP fornecido executado.

## Validação realizada

153testes unitários/39arquivos aprovados; quatro novos testes cobrem contratos, limites, matrizmultilinha, codificação, singularidade, amostragem3eixos semflip, VOIinclusiva, integridade/nome/tamanho, alvosfracionários, voxel↔Sw e invariância da projeção sob afim não ortogonal. TypeScript/build aprovados; aviso histórico de chunks>500kB permanece.

24casos únicos de navegador em7arquivos, desktop+Pixel7emulado, passaram:4novosGS-CA, PacienteDICOM, BRAVE/VENAT vinculados, angiografia/seleçãoNeuroangio, Doppler, vídeos e bordasoblíquas anteriores. Fluxo novo verificou ROIs, raios, hashes/exportação, erros/recuperação, troca de aba e ausência dePOST. Reexecuções dirigidas não somadas ao total. Testes finais e capturas registrados emVALIDATION.

Caso real1 extraído emcacheprivado a partir doZIP original, sem alterá-lo. Aberto naUI:512×512×391, quatroprojeções, doisprimeiros alvosSv emcada e trêseixos. Cinco hashesRAW calculados pelaapp coincidem com a auditoria anterior. Sem errosde página ou requisiçõesnãoGET no ensaio. Capturas/calbirações/pontos ficam em../artifacts/gs-ca-real-ui, fora dorepo; somente agregado emneuro3d-gs-ca-viewer-validation.json. Inspeção visual de recortesAP/LATDSA/MAX mostrou cruzes sobre regiões vasculares opacificadas, sem inversão grosseira observada nos exemplos. Isso não identifica cada vaso, não quantifica mTRE/mRPD e não certifica a convenção subpixel universal. Não foi refeita a auditoria dos dezcasos.

## Fontes venosas e restrições

Busca dirigida por fontes individuais; TopBrain foi consultado pela página primária indexada (abertura direta403). Seus rótulosvenosos publicados não individualizam os20IDs ausentes ou7termos. Registro emneuro3d-venous-source-candidates.json. Não se baixaram/segmentaram/importaram seus dados, não se executou software associado e não se promoveu identidade do atlas. Fonte candidata independente, inclusive para comparações futuras deGaleno, sem resolver a discordância atual.

FonteGS-CA: https://lit.fe.uni-lj.si/en/research/resources/3D-2D-GS-CA/ (Mitrović ecolaboradores). PáginaCCBY-NC-ND, condições adicionais do guia já documentadas; não foi estabelecido acordo de distribuição. Este lote publica código próprio e agregados, sem arquivos/imagens/matrizes/pontos do fornecedor. Não declare liberação comercial ou redistribua exportações locais. FonteTopBrain: https://topbrain2025.grand-challenge.org/data/; atribuição e permissão comercial conforme página, License.txt não examinado.

## Próxima etapa prioritária

Não refazer leitor,42cortes/bordas/592vasos ou auditoria10casos. Priorizar tornar a geometria importada útil para estudo vascular: VOI/ROI orientadas por metadados com convenções verificadas, segmentação/isosuperfície local emSw com amostragem explícita e/ou revisão quantitativa de alvos manualmente identificados. ZIP/XLS automáticos ainda não implementados. Não criar nomes de vasos a partir desses volumes não rotulados. As20ausências venosas/373referências/setetermos, componentesICAvidiana/meningo-lacrimal, Galeno e seteidentidades permanecem. Todas as frentes anteriores preservadas.
