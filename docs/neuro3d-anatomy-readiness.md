# Estado de revisão da anatomia e angiografia — 18/10/2026

A prioridade confirmada é anatomia e angiografia; a conclusão do simulador fica para depois. O checkpoint funciona nos fluxos de atlas testados, mas não é uma base anatômica completa ou homologada.

## Inventário obrigatório

O índice preserva 130 entradas (inclui números repetidos, grupos, segmentos e anastomoses; não são 130 vasos únicos). O estado calculado pelo mapeamento explícito é:

| Estado | Entradas |
|---|---:|
| Malha importada identificada | 52 |
| Reconstrução didática sem validação anatômica | 9 |
| Grupo parcialmente mapeado | 4 |
| Pendente de malha individual/mapeamento/revisão | 65 |

Esses números não medem exatidão anatômica. Uma artéria principal pode estar presente enquanto seus segmentos ou anastomoses continuam pendentes. Após a recuperação craniana/cervical de 18/10, o atlas contém 1086 estruturas importadas de todos os tipos, mais 18 superfícies arteriais didáticas bilaterais. Os números de estruturas e de entradas do índice medem coisas diferentes. As 520 adições incluem regiões e áreas de inserção: não são 520 vasos ou órgãos únicos. Detalhes em `neuro3d-craniocervical-update.md`.

Foi conferido o manifesto completo da fonte já disponível para ramos arteriais cranianos ainda ausentes: não foram identificadas outras malhas individuais prontas que resolvessem essas pendências arteriais. A recuperação posterior de contexto não muda esse resultado. Os modelos existentes não devem ser renomeados como artérias vizinhas para preencher lacunas. A lista permanece visível no painel Inventário.

## Funcionamento verificado

- TypeScript e build de produção passaram; 62 testes unitários passaram.
- 24 testes de navegador de atlas/angiografia passaram em desktop e celular, com um worker de teste. Cobrem carregamento de GLB e falhas recuperáveis, camadas/cortes, hipófise/crânio/seio cavernoso, identificação por clique, seleção entre abas e representações, arco/campo angiográfico e rotação 3D.
- As malhas suplementares passam por conferência de hash, índices e limites no mesmo referencial da geometria 3D.
- A projeção 2D roda em worker dedicado e descarta resultados superados. Artérias e veias/seios podem ser separadas na representação angiográfica 3D.
- Foram inspecionadas capturas da angiografia com osso e da reconstrução 3D do arco. Esta continua baseada em superfícies, não em volume radiológico adquirido.

A execução ampla anterior incluiu timeouts na estação de simulação e foi interrompida após a mudança de prioridade. Ela não é apresentada como suíte completa aprovada. Os 24 testes acima excluem os testes procedurais de aquisição seletiva/roadmap e o arquivo dedicado ao simulador.

## Ordem da próxima revisão anatômica

1. Relações selares/cavernosas e durais: ACI, nervos, hipófise, clinoides e anéis durais; separar superfície ilustrativa de relação confirmada.
2. Ramos orbitários, meníngeos e conexões ACE–ACI: reconstrução por referências multiprojeção com registro de trajeto, calibre e incerteza, seguida de revisão especializada.
3. Circulação posterior, coroideas posteriores, perfurantes e contexto medular: reconciliar cada item pendente antes de marcar cobertura completa.
4. Angiografia: revisar projeções AP/lateral/oblíquas contra as referências e integrar dados volumétricos abertos registrados, mantendo a distinção entre malha sintética e aquisição real.

## Entradas ainda pendentes

- 9 · anterior meningeal / anterior falcine
- 15 · intercavernous (not shown) see skull base diagram
- 16 · lateral tentorial arcade
- 20 · hypoglossal branch to the odontoid arcade
- 21 · odontoid arcade (ventral epidural arcade of the dens)
- 22 · hypoglossal division, AP artery
- 23 a · jugular division, AP artery origin
- 23b · jugular branch, occipital origin
- 24 · posterior meningeal / tentorium cerebelli branch
- 25 · sigmoid sinus arterial arcade (posterior meningeal system)
- 26 · transverse sinus arterial arcade (posterior meningeal system), 27 – SSS arterial arcade, 28 – transmastoid branch of OA (posterior meningeal system), 29 – OA
- 30 · inferior tympanic branch, AP
- 31 · caroticotympanic branch (remnant hyoid artery)
- 32 · stylomastoid branch (OA or posterior auricular artery)
- 33 · petrous branch, MMA
- 34 · foramen Lacerum branch, AP
- 35 · cavernous branch of MMA – same artery as spinosum branch of ILT
- 40 · sphenoid ridge branch
- 41 · recurrent meningeal branch
- 42 · tentorial branch
- 43 · clival branch, ILT
- 44 · frontal or anterior branch, MMA
- 45 · parietal or posterior branch, MMA
- 46 · petrosquamosal branch, MMA
- 48 · pharyngeal trunk, APA
- 49 · inferior division, APA
- 50 · middle division, APA
- 51 · superior division, APA
- 53 · pterygovaginal artery
- 53a · accessory meningeal artery
- 54 · cutaneous branch (Eustachian branch), AMA
- 69 · lesser palatine
- 70 · lingual
- 73a · submandibular
- 74 · ascending palatine
- 78 · superficial nasal
- 82 · dorsal nasal
- 87 · parietal/posterior br. STA
- 88 · STA / MMA anastomosis
- 89 · OA / MMA anastomosis
- 93 · lateral / posterior spinal artery
- 94 · coronary arteries
- 95 · sulco-commissural arteries
- 96 · hypoglossal nerve br
- 97 · musculospinal br with C1 and C2 AA anastomoses
- 98 · OA C1 nerve root branch
- 99 · OA C1 muscular VA anastomosis
- 100 · C2 muscular br.
- 101 · segmental muscular branches
- 103 · ascending cervical artery and its anastomoses (104) with VA
- 106 · superior thyroid
- 108 · trigeminal
- 6 · Ophthalmic artery · loop intraorbital segment
- 7 · Ophthalmic artery · distal intraorbital segment
- 19 · Lateral clival arcade
- 27 · Superior sagittal sinus arterial arcade
- 28 · Transmastoid branch of occipital artery
- 58 · Middle deep temporal branch
- 59 · Anterior superior alveolar artery
- 61 · Inferior turbinate arterial branches
- 62 · Middle turbinate arterial branches
- 62a · Superior turbinate arterial branches
- 65 · Anterior nasal septal arterial system
- 104 · Ascending cervical–vertebral anastomoses
- 113 · Posterior choroidal arteries

Verificação adicional isolada da estação em desktop: o fluxo de guia/cateter, DSA e roadmap passou; o teste biplanar atingiu as asserções de imagem, mas expirou durante a captura de tela. Esse timeout permanece registrado para a etapa de simulação e não altera o resultado dos 24 testes do atlas.
