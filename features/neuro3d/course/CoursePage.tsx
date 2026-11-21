import { Link } from 'react-router-dom';
import Course from './Course';
import '../neuro3d.css';

export default function CoursePage() {
  return <main className="n3 n3-course-shell">
    <div className="n3-topbar">
      <nav aria-label="Navegação principal" className="n3-course-shell-nav">
        <Link to="/">← QBank-Neuro</Link>
      </nav>
    </div>
    <Course />
  </main>;
}
