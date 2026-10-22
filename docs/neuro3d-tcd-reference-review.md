# Doppler transcraniano — referência, modelo e limites

## Referência fornecida e uso do REA

Arquivo: `H:/TCD/TCD Simulator.zip`, 14.792.304 bytes.
SHA-256: `5373b7c0e86f34f8f56384ff2b2e1fd84b2cffd1d825522ae9d7cd671644e9b9`.

[REA](https://github.com/morluto/rea), versão fixada 6.5.0, executou `inspect-artifact` com sucesso. Evidência local: `ev_0c2fd06648de66627b7fb475730681f4480c270c832f9b416555fd41afd7e893`. O grafo do contêiner tem 392 nós, 399 ocorrências e 398 relações; isso não equivale a uma análise semântica do executável.

Foram lidos estaticamente os guias `Txt/90-Ins.txt`, `90-Dop.txt`, `90-Dop-1.txt`, `90-Dop-2.txt`, `90-Dop-3.txt`, `90-Trd.txt`; rótulos `TCD.txt`, `Img/SetDop.txt` e `Img/SetIns.txt`; configurações e referências visuais dos painéis. O material identifica a interface como TCD Simulator 3.2 e documenta sete abordagens, PW, bilateral, M-mode, imagem colorida, ângulo, profundidade, volume de amostra, PRF, ganho, filtros, congelamento e cursor. Também contém controles de patologias, tendências, autorregulação e reatividade.

O EXE não foi executado. O motor matemático nativo não foi decompilado nem validado. Não houve contorno da ativação/licença. EXE, imagens, sons, textos completos e dados proprietários ficaram nos artefatos locais e não foram redistribuídos no site.

## Implementação original entregue

Aba própria, carregada sob demanda: sete janelas de estudo, alvo compatível com a janela, profundidade, volume de amostra, desvio da sonda, ângulo idealizado, PRF, ganho, filtro de parede, frequência cardíaca e paleta. Espectro PW, M-mode didático com escolha de profundidade, congelamento/cursor, áudio sintético opcional e exportação de parâmetros/proveniência.

As formas de onda são analíticas e arbitradas para exemplos pulsáteis, de velocidade elevada, pulsatilidade elevada e reversão. Os alvos/profundidades são posições ilustrativas do exercício, não intervalos clínicos de diagnóstico. O esquema não é um raycast calibrado sobre vasos reais.

São aplicadas a equação Doppler com frequência de 2 MHz e velocidade acústica de 1.540 m/s, projeção por cosseno, limite de PRF pela profundidade e dobramento de frequência por Nyquist. A média é integrada numericamente ao longo do ciclo da envoltória ideal; o índice de pulsatilidade usa diferença sistólica–diastólica/média. O IP não é apresentado para o exemplo bidirecional de média nula. As métricas são parâmetros do exemplo **antes de aliasing/filtro**, sem alegação de estimador clínico derivado da imagem.

O espectro ilustra uma distribuição analítica; não é FFT de uma aquisição/gravação. Áudio é um tom sintetizado, não um registro de paciente. M-mode é uma distribuição ilustrativa de potência/direção, sem validação de equipamento.

Referências de princípios, separadas dos exemplos arbitrados: [Aaslid et al., registro original](https://pubmed.ncbi.nlm.nih.gov/?term=Noninvasive+transcranial+Doppler+ultrasound+recording+of+flow+velocity+in+basal+cerebral+arteries), [Gosling et al., análise dos índices](https://pubmed.ncbi.nlm.nih.gov/9651969/), [diretriz ASE sobre artefatos/Nyquist](https://www.asecho.org/wp-content/uploads/2026/05/PIIS0894731726000386.pdf).

## Próxima ampliação

Anatomia de insonação registrada/raycast, sinais gravados ou síntese I/Q com FFT real, estimador de envoltória com qualidade explícita, bilateralidade e tendências. Modelos de CO2, autorregulação, ICP, vasoespasmo e êmbolos precisam de especificação e validação próprias; não foram deduzidos de rótulos dos controles.
