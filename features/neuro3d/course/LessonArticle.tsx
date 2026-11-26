import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import ReviewTable from './ReviewTable';
import { formatLesson } from './lessonLayout';
import { useLessonFigures } from './LessonFigures';
import { searchable, type Lesson } from './model';

const sourceNames = ['Estudo em NRI', 'Estudos em NRI · Parte 1', 'Estudos em NRI · Parte 2'];

export default function LessonArticle({ lesson, block }: { lesson: Lesson; block: number }) {
  const { figures, failed, retry } = useLessonFigures(block, lesson.id);
  const lines = formatLesson(lesson.theory);
  const firstLine = lines.findIndex(line => line.trim());
  if (lines[firstLine]?.startsWith('## ')) {
    const normalizeTitle = (value: string) => searchable(value.replace(/^(?:aula\s+)?\w+(?:\.\d+)?\s*[·—:–-]\s*/i, '').replace(/[^\p{L}\p{N} ]/gu, ''));
    if (normalizeTitle(lines[firstLine].slice(3)) === normalizeTitle(lesson.title)) lines[firstLine] = '';
  }
  const outline = lines.flatMap((line, index) =>
    line.startsWith('## ') ? [{ id: `nri-${lesson.id}-${index + 1}`, title: line.slice(3) }] : [],
  );
  return <article className="nri-course-text" aria-label="Conteúdo da aula">
    {outline.length > 1 && <details className="nri-course-outline">
      <summary>Sumário da aula</summary>
      <ol>{outline.map(({ id, title }) => <li key={id}>
        <button type="button" onClick={() => {
          const destination = document.getElementById(id);
          destination?.focus({ preventScroll: true });
          destination?.scrollIntoView({ block: 'start' });
        }}>{title}</button>
      </li>)}</ol>
    </details>}
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={{
      h2: ({ node, ...props }) => <h3 {...props} tabIndex={-1} id={`nri-${lesson.id}-${node?.position?.start.line}`} />,
      h3: ({ node: _node, ...props }) => <h4 {...props} />,
      table: ({ node: _node, ...props }) => <div className="nri-course-scroll" tabIndex={0} role="region" aria-label="Tabela da aula"><table {...props} /></div>,
      img: ({ src }) => {
        const figure = figures.find(({ id }) => src === `/nri-figures/${id}`);
        if (!figure) return <span className="nri-inline-image-status" role={failed ? 'alert' : 'status'}>
          {failed ? <>A figura não carregou. <button type="button" onClick={retry}>Tentar novamente</button></> : 'Carregando figura…'}
        </span>;
        return <span className="nri-course-figure" role="figure" aria-label={figure.caption}>
          <img src={figure.image} alt={figure.alt} width={figure.width} height={figure.height} loading="lazy" decoding="async" />
          <small>{figure.caption} · {sourceNames[figure.source]}, p. {figure.page}</small>
        </span>;
      },
    }}>{lines.join('\n')}</ReactMarkdown>
    {lesson.points.length > 0 && <section className="nri-lesson-takeaways" aria-label="Revisão ao final da aula">
      <h3>Pontos importantes</h3>
      <ReviewTable lesson={lesson} />
    </section>}
  </article>;
}
