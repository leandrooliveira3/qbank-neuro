import { useEffect, useState } from 'react';

type Figure = { page: number; width: number; height: number; image: string };
const blocks = import.meta.glob<{ default: Record<string, Figure[]> }>('./content/figures/block-*.json');

export default function LessonFigures({ block, lesson }: { block: number; lesson: string }) {
  const [figures, setFigures] = useState<Figure[]>([]);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let active = true;
    blocks[`./content/figures/block-${block}.json`]().then(({ default: lessons }) => {
      if (active) setFigures(lessons[lesson] ?? []);
    }).catch(() => { if (active) setFailed(true); });
    return () => { active = false; };
  }, [block, lesson]);
  if (failed) return <p role="alert">Falha ao carregar as figuras. Recarregue a aula para tentar novamente.</p>;
  if (!figures.length) return null;
  return <section className="nri-lesson-gallery" aria-label="Figuras da aula">
    <h3>Figuras da aula</h3>
    <div>{figures.map((figure, index) => <figure key={index}>
      <img src={figure.image} width={figure.width} height={figure.height} loading={index ? 'lazy' : 'eager'} alt={`Figura ${index + 1} da aula ${lesson}, página ${figure.page} do material original`} />
      <figcaption>Figura {index + 1} · Aula {lesson} · p. {figure.page}</figcaption>
    </figure>)}</div>
  </section>;
}
