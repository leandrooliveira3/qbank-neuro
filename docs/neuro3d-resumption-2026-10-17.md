# Retomada em 17/10/2026

## Estado recuperado

Branch `feature/neuro3d-atlas`, PR #2 em draft, base de retomada
`6323b14f180f384d558505368e0d9042d933cee3`. O handoff anterior à
integração não representa o estado mais recente. O atlas e a estação já
estão integrados; o objetivo pendente é fidelidade anatômica e radiográfica.

## Inspeção local do Smart Device

Arquivo fornecido: `The+Smart+Device_2.0.42_APKPure.xapk_Decompiler.com(1).zip`.
SHA256: `b2724a24059080450d454d681ea2cf5f6056d1bbf93918546a8350ac5c027300`.
Inspeção de 13.220 entradas, manifesto de assets e strings do `libapp.so`.
O pacote contém aplicativo Flutter compilado, recursos visuais e código de
plataforma decompilado. Não foram encontrados arquivos GLB, GLTF, OBJ, FBX
ou STL, nem bancos DB/SQLite nos formatos usuais. As strings incluem
`getDevices`, `DevicesEntity`, `api/remote_backend.dart` e
`/api/setup_search_device`, indicando consulta remota. Isso não prova que
nenhum registro esteja embutido no binário, mas não permite reconstruir ou
declarar completo o catálogo de produtos.

Nenhuma API do Smart Device foi acessada. Binários, imagens, credenciais e
código decompilado não foram adicionados ao repositório. A integração de
produtos exige dados exportados legitimamente e especificações verificadas;
nomes de famílias genéricas não equivalem a produtos com compatibilidade.

## Incremento implementado

Planos A/B com angulações absolutas independentes; máscara mantém ambos os
ângulos capturados e detecta alteração no plano B. Continua a retenção da
última imagem enquanto RX está pausado. Mesa, zoom e colimação permanecem
compartilhados. TypeScript, 29 testes unitários e build Vite aprovados.
O build ainda avisa sobre chunks maiores que 500 kB.

## Próximo trabalho de fidelidade

O renderizador atual usa projeções SVG de curvas e marcadores ósseos
simplificados. Corrigir o arco B não transforma isso em angiografia realista.
A substituição requer malhas vasculares e osteocranianas corregistradas,
proveniência/licença verificadas e revisão anatômica; em seguida, projeção
de atenuação e transporte temporal de contraste. Não basta adicionar ruído
ou texturas aos traços atuais. O atlas pode preservar IDs e nomenclatura
enquanto a geometria é substituída.

Candidato de pesquisa, ainda não importado ou aprovado: NIH 3D,
`https://3d.nih.gov/entries/1564?version=2`, descreve vasos, crânio e
aneurisma basilar. A licença não ficou explícita no texto recuperado;
verificar antes de redistribuir. Neuroangio permanece referência para
correlação angiográfica; disponibilidade pública não demonstra permissão
para redistribuição nem fornece automaticamente geometria 3D.

Manter PR em draft. Sem merge ou produção nesta retomada.
