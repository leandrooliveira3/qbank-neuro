# Angiografia 3D, acessos e dispositivos

A interface oferece angiografia 2D e reconstrução angiográfica 3D interativa, com seleção persistente no atlas. A reconstrução 3D usa as malhas originais no referencial compartilhado; não é um volume adquirido por angiografia rotacional. A estação também permite alternar contexto anatômico e representação angiográfica 3D.

## Anatomia e navegação

Foram adicionadas oito malhas originais: aortas torácica e abdominal; ilíacas comum e externa, femoral, axilar, braquial e radial direitas. O total passa a **566 estruturas importadas + 18 reconstruções arteriais ilustrativas = 584 entradas selecionáveis**. Os assets `body_access.glb` e `reference-body-access.bin` preservam o referencial comum e a atribuição BodyParts3D/DBCLS → Z-Anatomy → Anatria3D (CC BY-SA 4.0).

A entrada pode ser cervical esquerda, virtual no arco, femoral direita ou radial direita. Os trajetos novos conectam o acesso ao arco, tronco braquiocefálico, subclávias e carótidas. Cada acesso corporal tem 21 arestas de contexto e quatro arestas intracranianas preexistentes (mais a divisão/saco no cenário de aneurisma). A navegação intracraniana direita e vertebrobasilar ainda precisa ser ampliada. Presença de malha não significa que todo vaso seja navegável.

As linhas centrais derivam de esqueletização voxelizada. Há nove junções numéricas supra-aórticas verificadas com tolerância de 0,08 cm e oito corporais com 0,12 cm, amostradas dentro da união dos lúmens fonte com essa tolerância. Isso não constitui validação anatômica, física ou clínica. Os pontos de entrada são virtuais e não ensinam punção. O grafo de contraste é separado do sentido de navegação: uma injeção periférica não preenche artificialmente o cérebro por seguir o guia em direção retrógrada. O bolus permanece ilustrativo, sem CFD.

## Perfis do arco

Os perfis I, II e III aplicam a mesma deformação suave às malhas e aos trajetos. Usam razões didáticas 0,75, 1,5 e 2,5 entre altura e diâmetro de referência da ACC esquerda. O ponto proximal do eixo braquiocefálico e o diâmetro mediano são aproximações geométricas, não uma mensuração ostial validada. Referência da classificação: [Aortic arch morphometry in living humans](https://pmc.ncbi.nlm.nih.gov/articles/PMC3035863/). Variantes de origem dos ramos são outra classificação.

Não se atribui uma escala validada de dificuldade de cateterização. Os testes verificam a razão nas superfícies reais transformadas, preservação da geometria original, ausência de dobramento pelo limite positivo do Jacobiano e continuidade dos trajetos.

## Catálogo fornecido

O catálogo importado contém 41 classes, 147 entradas comerciais/famílias e 14 kits. O JSON preserva o hash do documento de origem, as dimensões representativas e as observações. O DOCX original não é redistribuído.

É possível pesquisar, adicionar produtos à bancada, preparar um kit e exportar a seleção com a sessão. Classes já disponíveis usam o comportamento genérico correspondente; outros itens ficam explicitamente catalogados com comportamento específico pendente. O nome comercial não altera calibres, forças, compatibilidade ou IFU. Kits preservam a composição textual e pedem escolha dos produtos, sem afirmar compatibilidade automática.

## Continuação técnica

A integração prioritária de REA e a revisão comparativa estão em `neuro3d-rea-integration.md`. Próximos experimentos: VMTK para linhas centrais; volumes CTA/3DRA registrados; BeamAdapter para mecânica; ampliação de ramos navegáveis e revisão anatômica especializada contra o inventário Neuroangio. As ausências anatômicas continuam explicitamente pendentes no inventário.

## Prioridade atual: anatomia e angiografia

Por orientação do usuário em 18/10/2026, a expansão do simulador fica pausada. Seus avanços existentes são um checkpoint experimental, não uma etapa concluída. A liberação da anatomia exige: inventário reconciliado, revisão dos pequenos ramos/relações, verificação das imagens 2D/3D, seleção persistente e testes de navegação do atlas em desktop/mobile. As pendências de malhas e a revisão especializada impedem classificar o atlas como anatomicamente completo ou perfeito.

A angiografia 3D agora permite separar artérias, veias/seios e ambas. A projeção 2D roda em worker dedicado, mantendo geometria comum, anotação dourada e o último ângulo solicitado. Enquanto um cálculo está ativo, apenas o pedido mais recente fica na fila; resultados antigos não substituem a imagem atual. Isso mantém os controles disponíveis durante a rasterização. Não é uma inferência de IA ou aquisição radiológica real.
