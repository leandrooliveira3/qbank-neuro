import priorities from './content/review-priorities.json';
import type { Lesson } from './model';

export const reviewPriorities: Record<string, { recall: string; trap: string }> = priorities;

export default function ReviewTable({ lesson }: { lesson: Lesson }) {
  const priority = reviewPriorities[lesson.id];
  return <div className="nri-course-scroll" tabIndex={0} role="region" aria-label="Conceitos, decorebas e pegadinhas">
    <table>
      <thead><tr><th scope="col">Conceito</th><th scope="col">O que lembrar</th></tr></thead>
      <tbody>
        {priority && <>
          <tr><th scope="row">Decore para a prova</th><td>{priority.recall}</td></tr>
          <tr><th scope="row">Pegadinha de prova</th><td>{priority.trap}</td></tr>
        </>}
        {lesson.points.map(({ concept, takeaway }) => <tr key={`${concept}:${takeaway}`}>
          <th scope="row">{concept}</th><td>{takeaway}</td>
        </tr>)}
      </tbody>
    </table>
  </div>;
}
