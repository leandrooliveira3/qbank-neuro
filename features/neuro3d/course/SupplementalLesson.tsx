import LessonArticle from './LessonArticle';
import supplements from './content/supplements.json';

export default function SupplementalLesson({ id }: { id: string }) {
  const lesson = supplements.find(lesson => lesson.id === id);
  return lesson ? <LessonArticle key={id} lesson={lesson} block={0} /> : <p role="alert">Este complemento não foi encontrado.</p>;
}
