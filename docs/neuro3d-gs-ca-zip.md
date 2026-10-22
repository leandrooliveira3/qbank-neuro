# Importação ZIP local GS-CA

Base: `167705814d2166f4288de61e5bcaeb163d1fc0cd`. O ZIP acrescenta uma entrada ao leitor existente; não muda geometria, amostragem, coordenadas ou identidade vascular.

## Fluxo utilizável

Em **Geometria 3D–2D → Abrir ZIP de um caso**, escolher um arquivo local, revisar o inventário e a memória estimada, depois **Extrair e abrir caso local**. É possível cancelar a prévia ou interromper o worker com **Remover caso local**. Exportar anotações antes de trocar o caso: a sessão não persiste automaticamente.

O inventário é calculado sem descompressão, pela leitura de pequenas regiões do arquivo. A extração ocorre sequencialmente em worker, somente para MHD/RAW, RAD/RAW e `3D_DSA_Target_Points.txt`. Código, XLS, deslocamentos, outros textos e arquivos aninhados ficam inventariados mas não são extraídos, executados, gravados ou enviados. XLS continua no importador próprio já validado. Cancelar ou sair da aba termina o worker; resultados de workers antigos não são aplicados.

## Contrato e limites

- ZIP clássico, disco único, métodos STORE e DEFLATE; até 192.000.000 bytes comprimidos, 64 entradas, diretório central de 128.000 bytes, expansão declarada total de 384.000.000 bytes e razão por entrada até 250.
- Exatamente um MHD; até 30 arquivos de dados selecionados. Cabeçalhos até 65.536 bytes, alvos até 1 MB, RAW individual até 224 MB; o leitor original mantém seus limites mais específicos e vínculos de tamanho.
- Nomes ASCII simples, caminhos relativos sem segmentos vazios, ponto ou ponto-ponto; sem barras invertidas, volumes Windows, duplicatas sem distinção de maiúsculas, basenames de dados duplicados ou casos DatasetN misturados.
- Sem ZIP64, criptografia, links simbólicos, nomes Unicode alternativos ou métodos adicionais. Cabeçalhos local/central, nomes, tamanhos, CRC e descritores são confrontados; intervalos devem cobrir a área de dados sem sobreposição, prefixo executável ou regiões não inventariadas.
- Prévia de memória: tamanho do arquivo + soma dos dados selecionados + duas vezes a maior entrada + 8 MB, até **768 MiB**. É estimativa conservadora de buffers/copias, não medição ou garantia do pico do navegador. O limite existente de trabalho do leitor é **512 MB**, em fase distinta; não somar interpretações nem prometer suporte a qualquer dispositivo móvel.
- O inventário é recalculado no worker antes da extração. A saída é lida em fluxo com limite pelo tamanho anunciado, tamanho final exato e CRC-32 conferidos. Uma declaração falsa não permite acumulação ilimitada da saída. DEFLATE exige suporte nativo a `DecompressionStream('deflate-raw')`; na ausência, usar arquivos extraídos, sem fallback que contorne os limites.

A revisão geométrica exporta `zipImport`, com inventário/tamanhos/método/CRC e estimativa, além dos SHA-256 já calculados pelo leitor para os arquivos consumidos. RAW de detector continua sendo hasheado quando aberto. Não há SHA-256 do contêiner inteiro; CRC não autentica origem e não substitui hashes, licença ou revisão anatômica. Notas mantêm a vinculação ao conteúdo e à malha, independentemente de terem sido abertos em ZIP ou extraídos.

## Referências técnicas consultadas

- [PKWARE APPNOTE 6.3.10](https://pkware.cachefly.net/webdocs/casestudies/APPNOTE.TXT): estruturas ZIP, diretório, cabeçalhos e descritores. Implementação própria do subconjunto, sem reproduzir a especificação ou código do fornecedor GS-CA.
- [Compression Streams — WHATWG](https://compression.spec.whatwg.org/): interface nativa de descompressão. Nenhuma dependência nova para o importador de produção.
- [Fonte GS-CA](https://lit.fe.uni-lj.si/en/research/resources/3D-2D-GS-CA/): termos originais preservados; nenhum dado, calibração ou código restrito incluído no aplicativo/repositório.

Ver `neuro3d-gs-ca-zip-validation.json` para resultados executados. Isosuperfície/limiar/conectividade e observação pessoal continuam sem comprovar nomes, lúmen, anastomoses ou precisão de registro. Sv/Sw, LPS e atlas continuam separados.
