import React, { useEffect, useMemo, useRef, useState } from "react";
import { catalogue, embedUrl, MenticeVideo, timeLabel } from "./catalogue";
import { normalize } from "../model";
export function VideoPlayer({ video }: { video: MenticeVideo }) {
  const [loaded, setLoaded] = useState(false);
  return (
    <section className="n3-videoplayer">
      <div className="n3-videoheader">
        <span className="n3-eyebrow">MENTICE · YOUTUBE · {video.topic}</span>
        <h3>{video.title}</h3>
        <p>
          {timeLabel(video.duration)} ·{" "}
          {video.published
            ? video.published.slice(0, 10)
            : "Data não disponível"}{" "}
          · {video.scope === "neurovascular" ? "Neurovascular" : "Complementar"}
        </p>
      </div>
      {loaded && video.embed_allowed !== false ? (
        <iframe
          title={video.title}
          src={embedUrl(video.id)}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
        />
      ) : (
        <div className="n3-videoposter">
          <span aria-hidden="true">▶</span>
          <p>Conteúdo externo do canal oficial Mentice.</p>
          <button
            onClick={() => setLoaded(true)}
            disabled={video.embed_allowed === false}
          >
            Carregar vídeo do YouTube
          </button>
        </div>
      )}
      <p>
        <a href={video.url} target="_blank" rel="noopener noreferrer">
          Abrir no YouTube ↗
        </a>{" "}
        · Reprodução depende do YouTube, da conexão e das restrições do autor.
      </p>
      <small>
        O vídeo pertence à Mentice. A incorporação não transfere licença,
        certificação ou afiliação ao QBank.{" "}
        {video.metadata_checked
          ? "Autoria e metadados verificados em 16/10/2026."
          : "Metadados individuais pendentes."}{" "}
        Não houve revisão audiovisual integral.
      </small>
    </section>
  );
}
export default function VideoLibrary({
  videoIds,
  onOpenCase,
}: {
  videoIds?: string[];
  onOpenCase?: (topic: string) => void;
}) {
  const [query, setQuery] = useState(""),
    [topic, setTopic] = useState("Todos"),
    [scope, setScope] = useState("todos"),
    [selected, setSelected] = useState<string | null>(null);
  const playerPanel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (selected && playerPanel.current) {
      playerPanel.current.focus({ preventScroll: true });
      playerPanel.current.scrollIntoView({ block: "start" });
    }
  }, [selected]);
  function exportInventory() {
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(catalogue, null, 2)], {
        type: "application/json",
      }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "mentice_inventario_2026-10-16.json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  const candidates = videoIds
    ? catalogue.videos.filter((v) => videoIds.includes(v.id))
    : catalogue.videos;
  const videos = useMemo(
    () =>
      candidates.filter(
        (v) =>
          (topic === "Todos" || v.topic === topic) &&
          (scope === "todos" || v.scope === scope) &&
          normalize(v.title + " " + v.topic).includes(normalize(query)),
      ),
    [candidates, query, topic, scope],
  );
  const active = candidates.find((v) => v.id === selected);
  return (
    <section className="n3-videolibrary">
      <h2>
        {videoIds ? "Vídeos relacionados ao exercício" : "Biblioteca Mentice"}
      </h2>
      {!videoIds && (
        <p>
          {catalogue.total_scanned} vídeos públicos inventariados em{" "}
          {catalogue.scanned_at};{" "}
          {catalogue.videos.filter((v) => v.scope === "neurovascular").length}{" "}
          específicos de neurointervenção e{" "}
          {catalogue.videos.filter((v) => v.scope === "complementar").length}{" "}
          complementares. Catálogo da aba Vídeos, incluindo materiais
          históricos. Triagem por títulos e descrições; a incorporação de um
          vídeo não o torna diretriz clínica.
        </p>
      )}
      {!videoIds && (
        <button onClick={exportInventory}>
          Exportar inventário dos 165 vídeos
        </button>
      )}
      <div className="n3-libraryfilters">
        <label>
          Buscar vídeos
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Trombectomia, coil, Ankyras…"
          />
        </label>
        <label>
          Tema
          <select value={topic} onChange={(e) => setTopic(e.target.value)}>
            <option>Todos</option>
            {Array.from(new Set(candidates.map((v) => v.topic)))
              .sort()
              .map((t) => (
                <option key={t}>{t}</option>
              ))}
          </select>
        </label>
        <label>
          Escopo
          <select value={scope} onChange={(e) => setScope(e.target.value)}>
            <option value="todos">Todos</option>
            <option value="neurovascular">Neurovascular</option>
            <option value="complementar">Complementar</option>
          </select>
        </label>
      </div>
      {active && (
        <div ref={playerPanel} tabIndex={-1} className="n3-activevideo">
          <button onClick={() => setSelected(null)}>Fechar vídeo</button>
          <VideoPlayer key={active.id} video={active} />
        </div>
      )}
      <p aria-live="polite">{videos.length} vídeos neste filtro</p>
      <div className="n3-videogrid">
        {videos.map((v) => (
          <article key={v.id}>
            <small>
              {v.topic} · {timeLabel(v.duration)}
            </small>
            <h3>{v.title}</h3>
            <p>
              {v.kind} ·{" "}
              {v.scope === "neurovascular" ? "Neurovascular" : "Complementar"}
            </p>
            <button onClick={() => setSelected(v.id)}>Selecionar vídeo</button>
            {onOpenCase && (
              <button onClick={() => onOpenCase(v.topic)}>
                Exercícios deste tema
              </button>
            )}
            <a href={v.url} target="_blank" rel="noopener noreferrer">
              YouTube ↗
            </a>
          </article>
        ))}
      </div>
      {!videos.length && <p>Nenhum vídeo encontrado. Ajuste os filtros.</p>}
      <small>
        Fonte:{" "}
        <a href={catalogue.channel} target="_blank" rel="noopener noreferrer">
          canal oficial Mentice
        </a>
        . Vídeos externos exigem internet e só são carregados após sua ação.
      </small>
    </section>
  );
}
