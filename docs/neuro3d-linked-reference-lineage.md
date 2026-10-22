# Linhagem do seio reto e vínculo físico das referências — 21/10/2026

Base remota confirmada: `81f679985dc448670ad13f30b0989fa598ac7ac2`, feature/neuro3d-atlas. Checkout local continuation/linked-reference-review; original e alterações alheias preservados. Nenhuma malha anatômica foi modificada.

## Identidade e transformações

O [Anatria-3D no commit fixo](https://github.com/Nurkan1/Anatria-3D/tree/6320bd64df8db2fcfed358a27c85d1fcc1c5913c) foi confrontado com o recorte publicado no Qbank. O manifesto denomina o objeto `straight_sinus` / `Straight sinus` / `Sinus rectus`. A linha TA2 4853 confirma nomenclatura, não homologia geométrica.

A auditoria vendor registra um objeto Blender **CURVE**, nas coleções Cardiovascular, Head e Systemic veins. O relatório de exportação registra 1152 polígonos avaliados; o GLB contém 1164 vértices e 2304 triângulos. O pipeline consultado avalia modificadores/converte para malha, conserva matrix_world e exporta Y-up com Draco. Ele foi lido estaticamente; não executamos Blender nem o aplicativo original.

Comparação executada pelo novo `tools/neuro3d/audit_sinus_lineage.py`: primitiva comprimida, atributos, contagens e transformações são exatamente iguais entre GLB Anatria e recorte Qbank. SHA do GLB upstream: `05f373a294ab809b9a628bc1474a66028642997330fddc553a33d4ac6409b757`; SHA da primitiva Draco de 4462 bytes: `66b50f993988a52892b83d2aba076698d60e6e99fd15676dde76f3507cc31bee`. Translação `[0,1.6025556325912476,-0.019911061972379684]`, rotação identidade, escala unitária, sem matriz/pai adicional. Exibição mantém metros ×100 e Y−160 em centímetros. Arquivos, URLs, tamanhos e SHA completos em [auditoria JSON](neuro3d-sinus-lineage-audit.json).

O NOTICE atribui a linhagem Z-Anatomy/BodyParts3D e licencia os derivados CC BY-SA 4.0. **Não foi estabelecido o identificador FMA/BodyParts3D desse objeto, nem sua proveniência em segmentação individual.** Startup.blend não foi inspecionado independentemente. A constatação CURVE também não reprova/aprova automaticamente a anatomia. A discordância Galeno–seio reto permanece: sem ponte, deslocamento, deformação ou renomeação por proximidade. Sete rótulos irresolvidos e 353 IDs sem referência importada ativa permanecem abertos.

## Mesmo referencial físico, corte → marco → 3D → corte

O comparador existente foi ampliado; seus 42 cortes/volumes/superfícies não foram refeitos. Cada cartão conserva seus próprios marcos e plano carregado. A affine nativa transforma pixel em voxel e RAS/mm. Superfície, quatro cantos do plano e pontos usam a mesma transformação linear de exibição `[-R,S,A]` após subtrair o centro dos bounds da fonte. Cantos são bordas de pixel, de −0,5 a dimensão−0,5; incluem reflexão e anisotropia.

Contorno e marcadores dourados podem ser ocultados e ficam visíveis mesmo quando ocluídos; a interface informa essa sobreposição. Não são ajustados à superfície simplificada: pixel positivo não prova coincidência com parede. Clicar na esfera 3D retorna ao corte original. A lista fornece ação equivalente por teclado. Marcos conservam nome manual, valor, voxel, RAS e SHA da fonte; nomes não constituem aprovação. O registro de vistas exporta câmera, plano, marcos e linkedVisible. É preciso registrar uma vista para capturar seu estado atual. Dados continuam locais e temporários; exportar antes de sair da aba.

Os cartões filtram vínculos pelo SHA da fonte. BRAVE e VENAT continuam independentes entre si e do atlas/paciente. Sem registro ou transferência de identidade; BRAVE é máscara manual, VENAT média de frações parciais.

## Validação executada

TypeScript e build aprovados; 124 unitários/29 arquivos. Novo teste de geometria usa cálculo manual independente com affine anisotrópica/refletida; outro verifica hash/transformação da primitiva atual contra auditoria. Auditor offline executado contra arquivos do commit fixo.

Playwright em build de produção, desktop e Pixel 7: 12 casos (linked-reference, sections, comparison), depois 14 (linked-reference, vascular-review, patient, tcd, video-workflow). Quatro linked-reference repetidos: **22 casos únicos**, todos aprovados. A segunda execução inclui visibilidade exportada. Cliques reais na esfera 3D, retorno ao plano, exportação com mesmos RAS, erros e abas preservadas conferidos. Capturas BRAVE móvel/VENAT desktop inspecionadas. Não são testes clínicos ou homologação anatômica. Aviso de chunks >500 kB permanece.

## Preview

Imagem fornecida pelo usuário confirma **Ready / Preview / feature/neuro3d-atlas / 81f6799**, correspondente ao pai completo conferido. Evidência e SHA da imagem em [registro](neuro3d-preview-81f6799-evidence.json); imagem não redistribuída. O 403 do conector é limitação de consulta ao time e não nega esse deployment automático. Não houve teste de navegador remoto. A evidência não se transfere ao checkpoint novo: confirmar seu status separadamente após publicar, sem reinstalar plugin ou presumir autorização ao time.

## Continuação

Não repetir os 42 cortes nem a comparação primitiva/transformações Anatria→Qbank. Próxima etapa P0: navegação ortogonal vinculada da mesma fonte, explicitando que há apenas sete planos selecionados por eixo; não fabricar cortes/interpolações. Avançar rastreio por objeto para Z-Anatomy/BodyParts3D somente com novas fontes verificáveis. Dataset CTA Zenodo 15697196 permanece candidato a ensaios independentes de Paciente 3D, não solução para a identidade do seio reto.

## Direção mais recente do usuário

3D-2D-GS-CA passa a referência preferencial de geometria, conforme neuro3d-geometry-dataset-review.md. Dez casos auditados localmente, três testes Python próprios aprovados; próximo lote deve começar pelo visor local e contrato físico, mantendo dados/licenças em espaço próprio. CTA fica complementar. Esse direcionamento supera a ordem de próxima tarefa anterior.
