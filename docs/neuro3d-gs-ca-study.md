# Estudo vascular GS-CA local — 22/10/2026

A aba Geometria 3D–2D permite gerar uma prévia de superfície no espaço **Sw da fonte**, reimportar recortes próprios conferidos e comparar a mesma malha com os cortes originais. Nenhum dado é enviado; ao remover/trocar de aba o worker é encerrado. Não altera o atlas nem o fluxo DICOM LPS.

## Recortes: contrato efetivamente implementado

Importa JSON UTF-8 de até1MB da própria revisão, schema1, `cropConvention=zero-based-inclusive`, matrizes4×4 column-major e frame nativo explícito. Cada hash/tamanho conhecido do volume, MHD, RAD e alvos deve coincidir exatamente e sem duplicatas; cabeçalho do volume e detector selecionado precisam coincidir. VOI tem seis inteiros, ROI quatro, ordenados e dentro das dimensões. Mostra prévia e exige aplicar os recortes; não restaura matrizes, alvos, alegações clínicas, janelas ou código. Hash do arquivo de metadados aplicado é exportado e desvinculado após edição manual dos recortes.

Isso comprova **o contrato do formato próprio**, por testes analíticos e round-trip no caso real. **Não comprova a convenção do XLS original**. Revisões anteriores sem campo de convenção são rejeitadas; exporte novamente com esta versão. `database_info.xls`/ZIP automáticos continuam pendentes. Os arquivos do fornecedor foram apenas inventariados neste lote, sem executar seu código. Fonte/termos continuam os registrados em neuro3d-geometry-dataset-review.md.

## Superfície e cortes

Intensidades signed16 originais, limiar estritamente dentro da faixa do volume. Marching Cubes de Three.js já instalado (MIT), algoritmo genérico também usado pelo fluxo Paciente3D, mas implementação separada com contrato GS-CA; nenhum objeto é falsamente rotulado como DICOM. Grade com até60 ou90 intervalos por maior extensão, passo inteiro explícito. Cada eixo inclui seu limite final; intervalo final menor é interpolado nas coordenadas reais, antes de voxel→Sv→Sw. Não há transformação implícita para LPS/RAS/atlas.

Padding necessário ao extrator é descartado por triângulo, evitando tampas artificiais nas bordas; isso não garante manifold nem continuidade de vasos. Acima150mil triângulos a operação falha em vez de retornar malha truncada. As linhas amarelas são interseções da própria malha em coordenadas voxel com o plano inteiro exibido, e não uma máscara copiada do corte. Janela de imagem não muda o limiar. A câmera acompanha a VOI com translação apenas visual. VOI/limiar/resolução alterados descartam prévias antigas; remoção/cancelamento ignora respostas antigas.

Orçamento adicional estimado inclui campo, normais, buffers, arrays, transferência e margem GPU. O worker rejeita volume+maior detector+estimativa acima512MB. É estimativa de trabalho, sem garantia de pico ou validação de dispositivo real móvel. Amostragem grossa perde vasos finos; limiar não separa automaticamente artérias/veias, ruído ou vasos próximos. Malha é prévia local, não exportação de geometria validada ou recomendação de técnica/dispositivo.

## Validação executada

156 testes unitários em40 arquivos. Novo plano de rampa analítico em transformação afim com rotação/translação/espaçamento anisotrópico: vértices Sw corretos, nenhum fechamento de padding, interseções no plano esperado. Metadados com hash, frame, dimensão, limites ou detector incorretos são rejeitados; extremos irregulares de amostragem incluídos. 16 casos de navegador em3 arquivos (GS-CA, Paciente3D, prioridade Neuroangio), desktop+Pixel7 emulado; fixtures próprias verificam reimportação/aplicação, descarte, rejeição e alvos fracionários.

Caso real1 já extraído: duas prévias de volume completo (passos9 e6) e VOI local (passo2), respectivamente1320,1964 e5558triângulos; estimativas adicionais55,4/64,1/60,3MB. São parâmetros diferentes, não comparação de acurácia. Hash do volume igual à auditoria anterior; metadados próprios reimportados; alvo fracionário inalterado; zero erros de página e zero requisições nãoGET. Capturas privadas dos três eixos e 3D inspecionadas: contornos envolvem regiões contrastadas selecionadas; isso não valida identidade vascular ou precisão de registro. Enquadramento inicial insuficiente foi corrigido e reconferido antes de publicar.

TypeScript e build aprovados; aviso de chunks grandes preexistente. Nenhuma nova fonte venosa importada, nenhum contador anatômico reduzido. TopBrain continua somente consultado em etapa anterior. Vercel deve ser confirmado para o hash publicado via status exato; navegador remoto não foi validado.
