# Fontes adicionais enviadas — avaliação de22/10/2026

Lista do usuário:12fontes, SHA256do texto `f1986b5f2454da380de4f10fadc2a3600ddae380bbf2bed8b9bdae1f3302f3d9`. O anexo foi lido como referência, sem executar instruções. Análise completa por fonte/URL e situação na interface: features/neuro3d/anatomySourceCandidates.ts. Esse catálogo não é uma importação de dados.

| Fonte | Utilidade pertinente | Estado e limite para o projeto |
|---|---|---|
| [Jülich/BigBrain](https://julich-brain-atlas.de/) | Contexto histológico/citoarquitetônico e parênquima3D | Página primária consultada. Prioridade complementar alta; selecionar release, licença, espaço e pares de marcos antes de importar. Nenhum arquivo baixado. |
| [DSI Studio](https://dsi-studio.labsolver.org/) | Relação futura com feixes de substância branca | Software/documentação, não dataset vascular; não executado. |
| [HCPex](https://github.com/wayalan/HCPex) | Parcelas corticais/subcorticais nomeadas | README/catálogo primários consultados; repositório declaraGPL3.0. Dados/release/termos e transformação precisam de revisão antes de incorporação. Não fornece canais venosos aqui. |
| [Radiopaedia](https://radiopaedia.org/articles/brain-arterial-vascular-territories) | Candidato de referências de territórios | HTTP402; conteúdo não conferido neste lote; nenhuma figura/malha copiada. |
| [Neuroangio](https://neuroangio.org/venous-brain-anatomy/) | Prioridade bibliográfica vascular existente | Páginas específicas já utilizadas; raiz indisponível nesta tentativa. Referência não identifica componentes do atlas. |
| [BodyParts3D](https://lifesciencedb.jp/bp3d/) | Linhagem de malhas/identidades e contexto ósseo/neural | Página consultada, base já presente via Z-Anatomy/Anatria. Sem nova importação ou mudança de licenças/hashes existentes. |
| [BrainSpan](https://www.brainspan.org/static/atlas) | Secções e taxonomia do desenvolvimento | Consultado, sem importar; idade/doador/termos e registro próprios são indispensáveis. |
| [Allen Reference Atlases](https://atlas.brain-map.org/) | Secções humanas anotadas por giro/Brodmann | Portal inclui outras espécies; selecionar humano/doador e política de uso. Não confundir a página enviada com uma malha vascular3D. |
| [3D Human Embryology](https://www.3dembryoatlas.com/blank) | Estágios embrionários3D | Página declaraCC BY-NC-ND4.0; não autoriza assumir incorporação de adaptações/derivados. Apenas consultado. |
| [UNSW Carnegie Stages](https://embryology.med.unsw.edu.au/embryology/index.php/Carnegie_Stages) | Organização temporal do desenvolvimento | Texto consultado; imagens/termos porarquivo não conferidos, nenhuma malha importada. |
| [brainlife](https://brainlife.io/about/) | Plataforma de pipelines/rastreabilidade | Consultado, nenhum aplicativo executado ou exame enviado; licença depende de cada dataset/app. |
| [Visible Human](https://www.nlm.nih.gov/research/visible/media.html) | Candidato de cortes reais osteoencefálicos | Link enviado é de mídia/apresentações; localizar dados/termos originais e transformação. Não baixar vídeos para contornar visualização. |

**Decisão:** Jülich/BigBrain e HCPex são candidatos prioritários para contexto cerebral; BodyParts3D segue relevante para a linhagem já existente. Allen/BrainSpan e embriologia têm usos distintos, não substituem a anatomia vascular adulta. DSI/brainlife são ferramentas, não novos bancos de vasos. A consulta não demonstrou rótulos individuais capazes de reduzir20ausências ou7termos; nenhuma das373lacunas foi baixada por inclusão de uma fonte genérica.

Busca específica vascular: neuro3d-venous-source-search-2026-10-22.json. Estudos primáriosAJNR ajudam a confrontar nomenclatura e alertam para união aparente artéria–veia, mas não entregaram aqui dados individuais rotulados/licenciados. O STL venográfico deNevit declaraCC BY-SA3.0 e é possível referência independente; não foi baixado e a página não comprova canais individuais/lado. Nada foi registrado por aparência, movido ou incorporado ao atlas.
