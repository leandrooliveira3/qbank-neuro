import { ArrowLeft, BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';
import Course from './Course';
import '../neuro3d.css';

export default function CoursePage() {
  return <div className="min-h-screen bg-slate-50">
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white">
      <nav aria-label="Navegação principal" className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-2">
        <Link to="/" className="flex min-h-11 items-center gap-2 rounded-full px-2 text-sm font-semibold text-slate-600 hover:bg-slate-100">
          <ArrowLeft size={18} aria-hidden="true" /> QBank-Neuro
        </Link>
        <span className="text-sm font-black tracking-wide text-slate-900">Neurointervenção</span>
        <BookOpen size={32} aria-hidden="true" className="rounded-lg bg-emerald-50 p-1.5 text-emerald-700" />
      </nav>
    </header>
    <main className="n3 n3-course-shell"><Course /></main>
  </div>;
}
