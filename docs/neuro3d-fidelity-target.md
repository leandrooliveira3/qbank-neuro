# Referência de fidelidade e cobertura — 17/10/2026

## Direção confirmada pelo usuário

O atlas deve ter qualidade anatômica e exploração por camadas comparáveis
ao Complete Anatomy da Elsevier. O alvo é toda a anatomia relevante à
neurorradiologia intervencionista, com estruturas de contexto completas,
e não apenas os grandes vasos ou um polígono de Willis esquemático.

Smart Device é referência de catálogo de dispositivos usualmente empregados.
Não é fonte esperada de malhas, mecanismos físicos ou anatomia. A ausência
de GLBs no pacote não é impedimento para criar modelos próprios dos devices.
Sua lista completa ainda não foi extraída; não inferir produtos de strings
genéricas do aplicativo. Especificações dimensionais e compatibilidades
precisam ser vinculadas a documentação por produto.

Mentice orienta a interação procedural a partir de demonstrações: seleção
e troca de instrumentos, navegação coaxial, imagem biplanar, roadmap,
injeção, posicionamento e implantação. Mouse, toque e teclado substituem
os controles externos. O vídeo oficial localizado é
https://www.youtube.com/watch?v=98BafsAPbbI ; a recuperação falhou nesta
sessão. A documentação foi lida, mas o vídeo não foi assistido.

Livros fornecidos e Neuroangio orientam anatomia, variantes, projeções e
aparência angiográfica. Modelagem original a partir de referências 2D é
possível; reconstrução métrica unívoca não é garantida por uma imagem
isolada. Usar múltiplas projeções e registrar incerteza nas relações não
demonstradas. Não requerer obrigatoriamente que o usuário forneça DICOM.

## Cobertura obrigatória

`features/neuro3d/anatomy-requirements.json` preserva o índice fornecido,
links únicos e números originais. A numeração duplicada e os itens
agrupados devem ser reconciliados, não silenciosamente corrigidos. Todos
começam pendentes: registro no inventário não equivale a malha criada.

Além dos ramos do índice: arco/aorta/acessos, carótidas e vertebrais,
territórios intracranianos e perfurantes, ACE e colaterais perigosas,
circulação orbitária, sistemas venosos profundo/superficial, seios durais,
veias emissárias, circulação medular, osso/base craniana/forames/coluna,
encéfalo/tronco/cerebelo/medula, dura/anéis durais e nervos cranianos.
Normal, variantes e patologias são configurações distintas da mesma base.

## Representações coordenadas

1. Atlas: superfícies detalhadas, proporções e relações corretas, seleção,
   isolamento, camadas, transparência e cortes. Cores e materiais devem ser
   preservados dos modelos, sem substituir tudo por material genérico.
2. Fluoroscopia/angiografia não subtraída: projeção radiográfica da mesma
   anatomia, incluindo osso e instrumentos, contraste seletivo temporal.
3. DSA: máscara e imagem contrastada na mesma geometria. Retirar osso
   somente por lógica de subtração coerente; não usar outro desenho vascular.
4. Roadmap e 3DRA: coerência espacial com a base, projeções e instrumentos.

As fases arterial, parenquimatosa e venosa, tortuosidade, afilamento,
ramificações e lesões fazem parte do alvo. Não adicionar ruído apenas para
disfarçar geometrias esquemáticas. A base atual continua insuficiente.

## Incremento desta revisão

O loader GLB deixa de destruir materiais, mapas e propriedades de superfície
do asset. Materiais são clonados por instância para evitar alterações no
cache compartilhado. Há opacidade ajustável para camadas estruturais,
dura e tecido, inclusive na comparação. Isso prepara a entrada de malhas
detalhadas; não significa que tais malhas já foram produzidas.

## Critério de conclusão

Cada estrutura precisa de identificação estável, relações e fonte/página
ou figura, geometria inspecionável e estado de revisão separado. Conferir
AP, lateral e oblíquas, relações osteodurais e continuidade vascular. Não
declarar toda a anatomia contemplada enquanto houver estruturas pendentes,
nem equivalência visual/procedural com produtos comerciais por passar testes.

## Referências públicas consultadas

- Elsevier: https://www.elsevier.com/products/complete-anatomy
  (modelos dissecáveis, isolamento e exploração espacial; neuroanatomia).
- Mentice: https://www.mentice.com/software/nv-coiling-cases
  (coiling, roadmap/biplano, 3DRA e manipulação de instrumentos).
- Neuroangio: https://neuroangio.org/anatomy-and-variants/
- Neuroangio: https://neuroangio.org/sample-page/neuroangio-topics/introductory-brain-angiography/

As páginas acima foram consultadas; o índice completo e os seis livros não
foram integralmente revistos nesta sessão. Figuras e vídeos usados como
referência não foram incorporados ou redistribuídos no repositório.
