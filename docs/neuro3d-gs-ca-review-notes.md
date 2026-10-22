# Revisão vascular pessoal — 22/10/2026

## Entrega utilizável

A aba Geometria3D–2D agora permite criar, editar, remover/desfazer, exportar, importar e mesclar até100anotações pessoais por caso, com título, descrição, referênciaHTTPS opcional e tipo **hipótese do usuário** ou **observação visual**. Todas mantêm `anatomicalIdentityVerified=false`; o livro também mantém `registrationAccuracyValidated=false`. Não existe promoção de nome para o atlas, diagnóstico ou recomendação de dispositivo. Texto é renderizado pelo React como texto; referência não é buscada automaticamente.

Formato `qbank-gsca-study-notes`, versão1: hashes individuais dos arquivos conhecidos pelo leitor e SHA256 de contexto (cabeçalho completo do volume, matrizes4×4column-major, frame Sv/Sw e fontes), posição voxel contínua/Sw, eixo e corte inteiro, recorte, limiar, resolução, passo, dimensões amostradas e componente. O novo SHA256 da superfície inclui método versionado, parâmetros e bytes de posiçõesSw, vérticesvoxel e IDs de componentes. IDs por tamanho só são reassociados quando hash e parâmetros da malha coincidirem. O hash vincula contexto geométrico; não é assinatura de autoria ou autenticação do conteúdo anotado.

Hash calculado no worker antes de transferir buffers; margem de memória anterior cobre o buffer temporário adicional (até cerca12MB no teto). Não muda coordenadas/malhas ou a regra de arestas exatas. Contexto cobre volume/cortes e cabeçalhos conhecidos, não certifica os RAWs de detector ainda não carregados. A exportação geométrica anterior continua separada e acrescenta hash/resolução da superfície.

ImportaçãoUTF8 até1MB: valida formato, hashes, flagsfalse, limites, ponto fracionário, transformaçãoSw, índice inteiro, amostragem calculada e componentes. Outro caso e alegações de validação são rejeitados; campos desconhecidos não são aplicados. Prévia antes de mesclar; IDs iguais/conteúdo igual não duplicam. Conflitos rejeitam a mesclagem inteira e preservam registros atuais. Anotação de malha ausente/diferente permanece pessoal, com aviso; a identidade não é inferida por proximidade.

Reabrir contexto restaura VOI, ponto contínuo, eixo, limiar e resolução; exige gerar a prévia para conferir o vínculo. Somente depois de coincidir restaura seleção do componente. Editar texto conserva o ponto/superfície originais. Marcadores azuis aparecem no corte inteiro mais próximo, sobre o volume, nunca como nova geometria vascular. Nenhum dado é enviado, gravado emDB/localStorage ou salvo automaticamente; exportar antes de sair/remover caso. Arquivos JSON contendo dados locais continuam privados.

## Validação executada

163unitários/42arquivos e22casos de navegador/4arquivos, desktop+Pixel7emulado; TypeScript/build aprovados. Novos testes cobrem ponto fracionário/afimSw, hash exato versus mesma posição/rank, parâmetros adulterados, URLs inseguras, validação falsa, caso errado, duplicação/conflito sem substituição parcial, edição e remoção/desfazer, reabertura e regeneração. RegressõesGS-CA, Neuroangio e Paciente3D preservadas. Aviso histórico de chunks grandes permanece.

Caso real1: anotação pessoal sobre o componente escolhido naVOI original; volumeSHA confere etapa anterior, ponto fracionário inalterado. Após mudar recorte, reabrir e regenerar recuperou exatamente o hash da malha e o componente. Exportar→remover→importar→mesclar produziu JSON idêntico. Painel e marcadoresX/Y/Z inspecionados; zero erros de página e zero requisiçõesnãoGET. Imagens/calibrações/anotações privadas fora do repo. Não valida mTRE/mRPD, lúmen, identidade vascular ou telefone físico.

## Fontes e frentes preservadas

Busca vascular e lista nova de12fontes: consulte neuro3d-additional-databases.md e neuro3d-venous-source-search-2026-10-22.json. Fontes complementares disponíveis dentro de Neuroangio→Revisão venosa, filtradas por utilidade, com acesso/licença/limites explícitos. Nenhuma nova geometria nomeada importada e nenhum dos20canais ou373referências foi promovido por consulta genérica. Setetermos/Galeno/seteidentidades/ICA-vidiana/meningo-lacrimal, referenciais independentes, GS-CA/Paciente3D/Doppler/Mentice/VascularTwin/REA/Ankyras preservados. Não repetidos592vasos/42cortes/bordas/10volumes; não executado fornecedor. ZIP automático permanece pendente.
