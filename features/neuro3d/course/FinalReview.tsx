import { Fragment, useMemo, useState, type MouseEventHandler } from 'react';
import { Link } from 'react-router-dom';
import { reviewPriorities } from './ReviewTable';
import { compareReviewToBank } from './reviewCoverage';
import type { Block, CourseQuestion } from './model';

const emptyBank: CourseQuestion[] = [];

export default function FinalReview({ block, questions, failed, lessonLink, quizLink, onFollow }: {
  block: Block;
  questions?: CourseQuestion[];
  failed?: boolean;
  lessonLink: (id: string) => string;
  quizLink: string;
  onFollow: MouseEventHandler<HTMLAnchorElement>;
}) {
  const [expanded, setExpanded] = useState<string>();
  const coverage = useMemo(() => compareReviewToBank(questions ?? emptyBank, reviewPriorities), [questions]);

  return <>
    <div className="nri-course-section-title">
      <p>{questions ? `${questions.length} questões do bloco mapeadas por aula` :
        failed ? 'O banco do bloco não carregou. Recarregue para abrir os complementos.' : 'Carregando conceitos do banco…'}</p>
      <Link to={quizLink} onClick={onFollow}>Praticar as questões do bloco</Link>
    </div>
    <div className="nri-course-scroll nri-final-review" tabIndex={0} role="region"
      aria-label={`Revisão final do bloco ${block.id}`}>
      <table>
        <thead><tr><th scope="col">Aula e tema</th><th scope="col">Pontos centrais e decorebas</th><th scope="col">Pegadinha</th></tr></thead>
        <tbody>{block.lessons.map((lesson) => {
          const priority = reviewPriorities[lesson.id];
          const concepts = coverage.get(lesson.id) ?? [];
          const count = concepts.reduce((total, item) => total + item.questionNumbers.length, 0);
          const isOpen = expanded === lesson.id;
          const detailId = `nri-final-concepts-${lesson.id}`;
          return <Fragment key={lesson.id}>
            <tr>
              <th scope="row"><Link to={lessonLink(lesson.id)} onClick={onFollow}>
                {lesson.id} · {lesson.title}
              </Link>
                {count > 0 && <button type="button" className="nri-final-bank-toggle"
                  aria-expanded={isOpen} aria-controls={isOpen ? detailId : undefined}
                  onClick={() => setExpanded(isOpen ? undefined : lesson.id)}>
                  {isOpen ? 'Recolher' : 'Ver'} conceitos de {count} {count === 1 ? 'questão' : 'questões'}
                </button>}
              </th>
              <td>{priority?.recall}</td><td>{priority?.trap}</td>
            </tr>
            {isOpen && <tr><td colSpan={3} id={detailId}>
              <ul className="nri-final-bank-notes">
                {concepts.map(({ concept, rationale, questionNumbers, alreadyExplicit }) => <li key={questionNumbers[0]}>
                  <small>{questionNumbers.length === 1 ? 'Questão' : 'Questões'} {questionNumbers.join(', ')} do bloco
                    {alreadyExplicit ? ' · já explícito na síntese' : ''}</small>
                  <strong>{concept}</strong>
                  {rationale && <p>{rationale}</p>}
                </li>)}
              </ul>
            </td></tr>}
          </Fragment>;
        })}</tbody>
      </table>
    </div>
  </>;
}
