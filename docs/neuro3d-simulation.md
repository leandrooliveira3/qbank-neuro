# Casos, dispositivos e biblioteca Mentice

## Escopo entregue

Duas abas em `/#/tools/neuro3d`: **Simulação** e **Vídeos Mentice**.

Oito exercícios originais: coil/saco, diversor/vaso parental, retriever/alvo trombótico, aspiração/alvo, stent/estenose, balão/expansão reversível, MAV/angioarquitetura e meníngea média/conexões. Cada um vincula vídeos externos e uma cena do atlas, oferece briefing, seleção da família solicitada, cursor em trajetória fictícia, demonstração gráfica, verificação de projeções, intercorrência de ambiguidade e revisão com fontes. A revisão pode ser salva localmente e exportada.

São interações educacionais originais, não uma reprodução do software, dos casos ou da física proprietária da Mentice. Não têm háptica, resistência/colisão validada, DICOM, simulação hemodinâmica, IFU por produto, dose calculada, packing, TICI ou avaliação de competência clínica. Posições/percentuais são unidades arbitrárias da tarefa. A zona 72–88% é uma regra de progressão da interface, não um limite anatômico de segurança.

O usuário pode girar o modelo, alterar o ângulo de duas projeções, mostrar/ocultar o realce vascular e manipular posição/abertura do dispositivo. O SVG mantém a tarefa disponível quando o 3D não é suportado. Os modelos de coil, cesta, balão, stent e cateter foram gerados por código original e representam famílias genéricas, sem especificações ou marcas.

## Inventário público em 16/10/2026

Fonte: https://www.youtube.com/@Mentice/videos
Canal verificado: `UCD8fhJKXCPwp5C3e-q7Fs5A`.

- A aba **Vídeos** foi percorrida até o fim: **6 páginas, 165 identificadores únicos**. Conferência independente por enumeração de playlist pública e pela paginação do catálogo público.
- Consultaram-se as páginas públicas dos 165 vídeos para título, descrição, autoria, duração, data e permissão de incorporação. **163** devolveram metadados individuais; **2** exigiram login. Os dois foram excluídos do recorte e não se contornou a restrição.
- **55 incorporados**: **38 específicos de neurointervenção** e **17 complementares** (cateteres/acesso, radioproteção, plataformas, criação de casos e avaliação). Os **55** confirmaram canal Mentice e permissão de incorporação na data da consulta.
- **110 excluídos**: vídeos corporativos, cardiovasculares/periféricos ou fora dos fundamentos selecionados. O inventário mantém o título/ID e a decisão de todos os 165 itens.
- Foram incluídos os dois vídeos distintos com títulos semelhantes sobre VIST Ankyras. Não se confundiu igualdade de título com identidade de vídeo.
- A triagem foi textual, pelos títulos e descrições públicas: **não se assistiu integralmente aos 165 vídeos, nem se revisaram integralmente suas transcrições**. Categorias são editoriais e não uma certificação do conteúdo clínico.
- Conteúdo histórico permanece identificado pela data quando disponível. Um vídeo antigo do fabricante não é uma recomendação terapêutica atual nem substitui a IFU.
- Este inventário cobre a aba indicada pelo usuário, **não Shorts, transmissões separadas, vídeos não listados ou privados**.

Catálogo auditável: `features/neuro3d/simulation/mentice-videos.json`, com as inclusões e exclusões. Não há vídeos baixados, áudio, imagens de páginas ou transcrições no repositório.

## Reprodução e direitos

A incorporação usa o player oficial `youtube-nocookie.com` após ação explícita do usuário; antes disso não é feito pedido ao YouTube pela biblioteca. O título/autoria e um link direto sempre aparecem. A reprodução precisa de internet e pode mudar por restrição do autor, região ou conta; o link externo é o caminho alternativo.

Não se suprimiram controles, atribuição, anúncios ou restrições do YouTube. A existência de um vídeo público não foi tratada como licença para re-hospedagem ou para copiar o simulador Mentice. Não há afiliação, endosso ou certificação Mentice implícitos.

Páginas do fabricante consultadas para descrever o contexto de simulação, sem copiar seu motor:
- https://www.mentice.com/neurovascular
- https://www.mentice.com/software/neurovascular-coiling
- https://www.mentice.com/software/neurovascular-thrombectomy

As afirmações anatômicas dos exercícios originais referem-se às fontes já disponíveis no atlas (Harrigan, Krings, Lasjaunias e Borden), indicadas em cada exercício. Não se inferiram diâmetros, pressões, compatibilidade ou condutas clínicas a partir dos vídeos.

## Anexo smartdevice.zip

Arquivo íntegro, com 722 arquivos e aproximadamente 41,7 MB descompactados. Contém um aplicativo Android/Flutter compilado, manifesto, bibliotecas, fontes e recursos de interface; não contém vídeos ou um banco de dispositivos em JSON/CSV/SQLite. Não foi usado como fonte de código, imagens, credenciais ou especificações clínicas. O pacote e seus binários não foram adicionados ao repositório.

## Validação

`npm run lint`, `npm run test:neuro3d`, `npm run test:neuro3d:e2e`, `npm run build`.

O teste do player verifica o endereço e o carregamento por ação explícita, com iframe externo substituído por fixture; não atesta o streaming audiovisual de todos os vídeos. As permissões foram verificadas separadamente nas páginas públicas. Não há validação clínica ou teste háptico.

Resultado desta etapa: 14 testes unitários/contratos e 20 testes de navegador aprovados (desktop e viewport móvel emulado), TypeScript e build aprovados. Inspeção visual desktop/mobile realizada, inclusive redimensionamento de um canvas já carregado. Avisos de chunks grandes existentes permanecem; laboratório e biblioteca são carregados sob demanda.
