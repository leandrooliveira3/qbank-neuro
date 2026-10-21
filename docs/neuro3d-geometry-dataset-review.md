# Referências geométricas locais e CTA — 21/10/2026

## Prioridade confirmada

O usuário indicou os onze ZIPs locais **3D-2D-GS-CA** como fonte preferencial para geometria. Essa prioridade supera o CTA como próximo ensaio geométrico. BRAVE/VENAT e o atlas permanecem em espaços próprios.

Fonte: [Laboratory of Imaging Technologies, University of Ljubljana](https://lit.fe.uni-lj.si/en/research/resources/3D-2D-GS-CA/), Uroš Mitrović e Žiga Špiclin; artigo de Mitrović, Špiclin, Likar e Pernuš, IEEE TMI 32(8),1550–1563 (2013). [Guia primário](https://lit.fe.uni-lj.si/data/research/resources/3D-2D-GS-CA/3D-2D-GS-CA.pdf).

A página declara CC BY-NC-ND, sem versão explícita nessa página. O guia acrescenta acordo assinado e restrição de distribuição. Não foi estabelecido neste projeto se esse acordo existe. A inspeção dos anexos locais não transfere direitos de publicação. Nenhum volume, imagem, ponto-alvo, matriz de calibração ou código do fornecedor foi redistribuído no site/GitHub; publicam-se ferramenta própria, hashes e resultados agregados. Não declarar liberação comercial ou de derivados. Implementações genéricas e ensaios locais podem prosseguir; eventual disponibilização dos dados/derivados exige esclarecer esses termos.

## Executado nos onze anexos

`tools/neuro3d/audit_gs_ca.py` leu os ZIPs originais sem alterá-los/extrair imagens. Conferiu SHA dos onze arquivos; tamanho/CRC/SHA/finitude dos dez volumes e quarenta imagens 2D; dez coleções de 400 deslocamentos; sessenta coleções MGP de matrizes1600×4 e CRC do ZIP gold-standard. Matlab, MEX e C++ fornecidos foram somente consultados como documentação; nenhum executado ou copiado.

Volumes: MHD/RAW signed16 little-endian, 512×512×390/391/396, espaçamento0,464564mm. Imagens: RAD/RAW float32, quatro por caso (DSA/MAX × AP/LAT), com tamanho/espaçamento, transformação detector→mundo e posição da fonte. Não são DICOM diretamente importáveis pela aba atual. Preservamos os espaços Sv/Sw da fonte; `AnatomicalOrientation=R P I` não autoriza converter silenciosamente para DICOM LPS ou NIfTI RAS. Dados originais continuam em E:/Downloads.

A projeção própria usa transformação inversa completa para o detector e interseção raio/plano z=0; não pressupõe rotação perfeitamente ortogonal nem reorienta pixels. Nos20 pares AP/LAT, todos os pontos-alvo projetados caem dentro do detector; a geometria DSA/MAX coincide por vista. Resíduo máximo do retorno ponto→raio:1,2172×10⁻¹³mm, apenas consistência algébrica. **Não é erro de registro medido na imagem, mTRE/mRPD, reprodução do MGP ou comprovação da precisão publicada.** O algoritmo MGP não foi executado. Nenhuma identidade vascular foi atribuída.

Auditoria detalhada: [JSON](neuro3d-gs-ca-geometry-audit.json), sem publicar as calibrações/pontos. Três testes Python próprios aprovados: magnificação analítica, invariância sob transformação rígida do mundo e rejeição de raio paralelo.

## Próximo ensaio geométrico

Priorizar leitor/visor **local** MHD/RAW e RAD/RAW com contratos Sv/Sw explícitos, VOI/ROI do database_info.xls e índiceszero; não confundir resultados MGP com Tg. Vínculo físico voxel→mm→detector e clique inverso deve ser testado com fixtures próprias e depois com os arquivos locais. Os volumes ultrapassam32milhões de voxels; memória/VOI/amostragem precisam de regra explícita, sem mudar silenciosamente unidade/origem. Primeiro validar visualmente alvos e convenções de pixel, sinal e orientação; só então quantificar erro observado. Não reconstruir volume a partir de duas projeções nem registrar no atlas por aparência.

## CTA complementar — reconferência atual

Zenodo15697196 é CTA de aneurismas. API e HTTP Range funcionaram nesta sessão, superando a limitação web anterior. Registro CC BY 4.0;25.578.845.008bytes,122STL. MD5 publicado264ff9ee868c022d108b7c7aa7396d32 **não verificado globalmente**. Índice remoto consultado; três DICOMs, Metadata.csv e an_184.stl recuperados com CRC/SHA. Dados amostrais ficam somente no cache local; campos demográficos/identificadores não são publicados. [Acesso/proveniência](neuro3d-cta-current-access.json) e [compatibilidade executada](neuro3d-cta-patient-sample-audit.json).

Três amostras do caso184: CT Image Storage,512×512,16bits, JPEG Lossless SV1 (transfer syntax1.2.840.10008.1.2.4.70), pixel0,517578125mm. O leitor real parsePatientDicom foi executado e rejeitou as três por compressão, conforme contrato atual. A série tem560entradas e146.800.640voxels estimados pelas dimensões amostradas, acima do limite32milhões. Espaçamento z0,7mm entre0 e1 é observação parcial; continuidade dos560cortes não verificada. STL confere o SHA anterior, sem transformação física com DICOM estabelecida. Não houve montagem de volume, decoder, importação na interface, registro no atlas ou validação clínica. Compatibilidade3DRA real permanece pendente.

Ferramenta offline reproduzível de compatibilidade: `node tools/neuro3d/inspect_cta_patient_sample.cjs ../artifacts/cta-recheck docs/neuro3d-cta-patient-sample-audit.json`. A primeira tentativa de importação direta pelo Node falhou na interoperabilidade CommonJS de dicom-parser; corrigido somente no inspector offline, compilando o leitor TypeScript confiável em memória. Nenhum código do dataset é executado.
