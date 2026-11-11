import React, { useState } from "react";
import { data } from "../model";
import { openAnatomy, openAssetUrl } from "../openAnatomy";
import "./study.css";
const references = [
  {
    group: "ANATOMIA E EMBRIOLOGIA",
    title: "Neuroangio",
    url: "https://neuroangio.org/",
    note: "Índice neurovascular e referências específicas já vinculadas às estruturas e às vias do atlas. Consulta bibliográfica não certifica a geometria 3D.",
  },
  {
    group: "GEOMETRIA E PROVENIÊNCIA",
    title: "BodyParts3D → Z-Anatomy → Anatria3D",
    url: openAssetUrl("NOTICE"),
    note: "Cadeia de atribuição dos ativos importados. Preservadas as licenças e transformações dessa linhagem; a licença do LearnCoronary não substitui a licença destes derivados.",
  },
  {
    group: "REFERÊNCIA DE INTERAÇÃO",
    title: "LearnCoronary · Virtual Coronary Angiography",
    url: "https://learncoronary.com/",
    note: "Referência de organização 3D–2D, controles de orientação e apresentação de fontes. Código e recursos visuais não foram copiados.",
  },
  {
    group: "MÉTODO DA REFERÊNCIA",
    title: "LearnCoronary · referências e limitações",
    url: "https://learncoronary.com/references",
    note: "O site descreve projeção perspectiva e câmeras independentes. Este atlas mantém seu modelo ortográfico e seus referenciais próprios.",
  },
  {
    group: "ATIVOS DA REFERÊNCIA",
    title: "LearnCoronary · atribuição anatômica",
    url: "https://learncoronary.com/atlas-attribution.md",
    note: "Documenta malhas nativas e transformação comum. Nenhum modelo coronariano foi usado para preencher anatomia neurovascular.",
  },
  {
    group: "CLÍNICA · BIBLIOGRAFIA DO CURSO",
    title: "UpToDate",
    url: "https://www.uptodate.com/",
    note: "Fonte clínica prioritária do curso. O conteúdo integral não foi consultado nesta etapa de interface; não há nova recomendação clínica ou gabarito atribuído a essa fonte.",
  },
];
export default function References() {
  const [filter, setFilter] = useState("");
  const matches = (s: string) =>
    s.toLocaleLowerCase("pt-BR").includes(filter.toLocaleLowerCase("pt-BR"));
  return (
    <section className="n3-panel" aria-label="Referências e proveniência">
      <span className="n3-eyebrow">LEITURAS · CRÉDITOS · LIMITES</span>
      <h2>Referências do Atlas</h2>
      <p>
        Fontes anatômicas, origem das malhas e decisões de representação
        reunidas para consulta.
      </p>
      <label className="n3-reference-search">
        Buscar referência
        <input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Fonte, autor, geometria…"
        />
      </label>
      <div className="n3-reference-grid">
        {references
          .filter((r) => matches(r.title + " " + r.group + " " + r.note))
          .map((r) => (
            <article key={r.title}>
              <small>{r.group}</small>
              <h3>{r.title}</h3>
              <p>{r.note}</p>
              <a href={r.url} target="_blank" rel="noreferrer">
                Consultar fonte ↗
              </a>
            </article>
          ))}
      </div>
      <h3>Bibliografia já catalogada no protótipo</h3>
      <p>
        Lasjaunias permanece a referência principal de embriologia; Harrigan,
        Osborn e Morris pertencem à bibliografia do curso. Esta lista conserva o
        catálogo existente e não implica releitura integral dos livros nesta
        etapa.
      </p>
      <div className="n3-reference-list">
        {Object.entries(data.sources)
          .filter(([id, text]) => matches(id + " " + text))
          .map(([id, text]) => (
            <p key={id}>
              <strong>{id}</strong> · {text}
            </p>
          ))}
      </div>
      <h3>O que cada representação permite concluir</h3>
      <div className="n3-ref-table">
        <table>
          <thead>
            <tr>
              <th>Representação</th>
              <th>Origem e transformação</th>
              <th>Limite</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Superfícies importadas</td>
              <td>
                {openAnatomy.sourceRepository} · commit{" "}
                {openAnatomy.sourceCommit}
                <br />
                <a
                  href={openAssetUrl("LICENSE")}
                  target="_blank"
                  rel="noreferrer"
                >
                  Licenças dos ativos
                </a>
              </td>
              <td>
                Identidade, ramos finos e relações continuam em revisão;
                existência de malha não demonstra validação anatômica.
              </td>
            </tr>
            <tr>
              <td>Trajetos ilustrativos</td>
              <td>Reconstruções didáticas locais, identificadas na seleção.</td>
              <td>
                Não são segmentações; não certificam calibre, lúmen ou conexões.
              </td>
            </tr>
            <tr>
              <td>Projeção angiográfica do atlas</td>
              <td>
                Superfícies em projeção ortográfica; a comparação 3D–2D usa
                inspeção ortográfica. A inspeção 3D isolada pode usar
                perspectiva. O 2D geral usa a cópia simplificada.
              </td>
              <td>
                Sem atenuação, espalhamento, injeção seletiva, transporte de
                contraste ou movimento fisiológico.
              </td>
            </tr>
            <tr>
              <td>Referências e exames</td>
              <td>
                Datasets independentes e arquivos locais nas abas
                correspondentes.
              </td>
              <td>
                Nenhum registro espacial presumido com o atlas. Cine clínico não
                foi acrescentado nesta etapa.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <p>
        As pendências de Galeno–seio reto, identidades e completude vascular
        permanecem registradas nos painéis Neuroangio, Inventário e Revisão.
      </p>
    </section>
  );
}
