# QBank-Neuro 3D — integração incremental

Branch: `feature/neuro3d-atlas`. Base consultada: `main` em `f821e3e`.

## O que funciona nesta integração

- Rota livre `/#/tools/neuro3d`, seguindo o padrão das ferramentas existentes; link no menu.
- React 19 / TypeScript, React Three Fiber 9, Three.js e controles de órbita. Atlas e visualizador em chunks carregados sob demanda.
- 12 cenas, 163 identificadores originais e 31 GLBs originais do protótipo v0.2; nenhum scan, livro ou figura reproduzida.
- Seleção por raycasting ou lista acessível; descrição, relevância, incertezas e fontes por estrutura.
- Variantes, comparação lado a lado, camadas, vistas AP/lateral/oblíqua e sequência embrionária discreta em quatro estágios não datados.
- Projeção SVG recuperável quando WebGL ou o carregamento do GLB falham. A projeção não substitui uma angiografia real.
- Busca livre inclusive em objetos exclusivos de variantes; abertura automática da configuração/estágio correspondente.
- 126 entradas de rastreabilidade; matriz V2 integral e especificação Bouthillier preservadas no código.
- 25 questões comentadas, exportação no contrato do importador existente. Progresso versionado em localStorage, importação validada e exportação.

## Cobertura real e pendências

Os 16 módulos e 84 tópicos do pacote **não eram aulas completas**. Esta integração mantém o catálogo e suas cenas vinculadas, com rótulo de conteúdo parcial. Não representa a conclusão científica de todos os capítulos.

Permanecem pendentes: aulas individuais, casos novos e expansão das questões; módulos de física/radioproteção/contrastes e dispositivos com IFUs/licenças atuais; morfogênese contínua, grafo explícito de precursores/descendentes, CFD, correlação angiográfica validada e geometria derivada de exames. A sincronização Supabase do progresso do atlas não foi implementada; o banco e suas políticas não foram alterados. Usuário é informado de armazenamento local.

O service worker existente atende recursos da mesma origem; modelos só ficam disponíveis offline depois de visitados e armazenados pelo navegador. Não há pré-download dos 31 modelos nem promessa de disponibilidade offline integral. Testes com injeção de falhas bloqueiam service workers para não mascarar falhas de rede.

## Revisão científica e fontes

Handoff e dossiês V1/V2 foram lidos; V2 audita 21 afirmações, **não todos os 126 registros**. A descrição de revisão herdada não foi promovida a homologação. Bouthillier C1–C7 permanece a nomenclatura topográfica; Lasjaunias permanece eixo independente. Nenhuma malha foi homologada por especialista.

Seis livros disponíveis para consulta privada; revisão dirigida nesta etapa, não leitura integral. Conferências: Harrigan cap. 1, p. 42 (C6: anel distal até PCom); Krings caso 6, pp. 28–30 (anéis/cave) e caso 7, p. 31 (modelo oftálmico de Lasjaunias); Lasjaunias vol. 1, pp. 1–2 (processos vasculares); Borden introdução, p. 3 (limites da 3DRA); Osborn cap. 1, p. 3 (arco); LINNC 2026 consultado como catálogo, sem adicionar recomendação terapêutica atual a partir dele.

**Divergência documental:** o serviço de leitura e o handoff descreviam Osborn como extrato de 150 páginas. O arquivo efetivamente materializado possui 472 páginas digitalizadas. Não presumir cobertura além das páginas examinadas. Krings materializado: 246 páginas; LINNC: 264; diferenças de contagem em relação ao índice do leitor também foram observadas.

Não foram fornecidos DICOM/3DRA para calibrar geometria, IFUs ou acesso autenticado ao UpToDate. Não se substituiu essa ausência por recomendações clínicas ou especificações de fabricantes inventadas. Fontes bibliográficas existentes foram preservadas para auditoria dirigida futura.

## Verificação reprodutível

```
npm ci
npm run lint
npm run test:neuro3d
npx playwright install chromium
npm run test:neuro3d:e2e
npm run build
```

No ambiente Work, o download padrão Chromium veio truncado. Executou-se o Chromium empacotado via npm em diretório temporário externo ao repositório. A configuração aceita `ATLAS_CHROMIUM_PATH`; bibliotecas do executável, quando necessárias, vêm por `LD_LIBRARY_PATH`. Não há dependência desse caminho em produção. WebGL testado em renderização software SwiftShader e viewport móvel emulado, sem validação em GPU física ou aparelho real.

O preview deve apontar para o commit da branch. **Sem merge em main, sem produção.**
