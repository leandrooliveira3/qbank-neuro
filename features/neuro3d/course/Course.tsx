import { useEffect, useMemo, useRef, useState } from 'react';
import { BookOpen, ClipboardList, FileUp, Search, Table2 } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import manifest from './content/index.json';
import {
  Block, BlockContent, CourseQuestion, CourseState, downloadCourseImportTemplate,
  loadCourse, maxImportBytes, mergeCourseImport, parseCourseImport, saveCourse, searchable,
} from './model';
import './course.css';

const blocks: Block[] = manifest;
const loaders = import.meta.glob<{ default: BlockContent }>('./content/block-*.json');
const initialQuestionCount = blocks.length * 100;
const lessonIds = new Set(blocks.flatMap(({ lessons }) => lessons.map(({ id }) => id)));
const modes = [
  { id: 'teoria', label: 'Teoria completa', icon: BookOpen },
  { id: 'revisao', label: 'Revisão de prova', icon: Table2 },
  { id: 'questoes', label: 'Questões', icon: ClipboardList },
] as const;
type Mode = typeof modes[number]['id'];

export default function Course() {
  const [params, setParams] = useSearchParams();
  const block = blocks.find(({ id }) => String(id) === params.get('bloco')) ?? blocks[0];
  const selected = params.get('modulo');
  const mode = modes.find(({ id }) => id === params.get('estudo'))?.id ?? 'teoria';
  const lessonId = mode === 'questoes' && selected === 'todos' ? 'todos'
    : block.lessons.find(({ id }) => id === selected)?.id ?? block.lessons[0].id;
  const [filter, setFilter] = useState('');
  const [course, setCourse] = useState(() => loadCourse(lessonIds));
  const courseRef = useRef(course);
  const [loaded, setLoaded] = useState<{ id: number; data?: BlockContent; error?: string }>();
  const [retry, setRetry] = useState(0);
  const [notice, setNotice] = useState('');
  const [importing, setImporting] = useState(false);
  const importInput = useRef<HTMLInputElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const [focusContent, setFocusContent] = useState(false);

  useEffect(() => {
    let active = true;
    setLoaded(undefined);
    const loader = loaders[`./content/block-${block.id}.json`];
    loader().then(
      ({ default: data }) => { if (active) setLoaded({ id: block.id, data }); },
      () => { if (active) setLoaded({ id: block.id, error: 'Falha ao carregar o bloco.' }); },
    );
    return () => { active = false; };
  }, [block.id, retry]);

  const ready = loaded?.id === block.id ? loaded : undefined;
  const data = ready?.data;
  const lesson = data?.lessons.find(({ id }) => id === lessonId);
  const questions = useMemo(() => data ? [...data.questions, ...course.imported]
    .filter((item) => lessonId === 'todos' ? block.lessons.some(({ id }) => id === item.lesson) : item.lesson === lessonId)
    : [], [data, course.imported, block, lessonId]);
  const needle = searchable(filter);
  const matches = needle ? blocks.flatMap((entry) => entry.lessons
    .filter((item) => searchable(`${item.id} ${item.title} ${entry.title} ${item.topics.join(' ')}`).includes(needle))
    .map((item) => ({ item, blockId: entry.id }))) : [];

  useEffect(() => {
    if (focusContent && data) {
      heading.current?.focus();
      setFocusContent(false);
    }
  }, [focusContent, data, lessonId]);

  function select(blockId: number, id: string, nextMode: Mode = mode) {
    setParams((current) => {
      const next = new URLSearchParams(current);
      next.set('tab', 'curso');
      next.set('bloco', String(blockId));
      next.set('modulo', id);
      next.set('estudo', nextMode);
      return next;
    });
  }

  function persist(next: CourseState) {
    saveCourse(next);
    courseRef.current = next;
    setCourse(next);
  }

  async function importFile(file: File) {
    setImporting(true);
    setNotice('');
    try {
      if (file.size > maxImportBytes) throw new Error('O arquivo excede 4 MB.');
      const added = parseCourseImport(JSON.parse(await file.text()), lessonIds);
      const { default: builtInPrompts } = await import('./content/prompts.json');
      const current = courseRef.current;
      const imported = mergeCourseImport(current.imported, added, new Set(builtInPrompts));
      persist({ ...current, imported });
      const count = imported.length - current.imported.length;
      setNotice(count === 0 ? 'As questões desse arquivo já estão no banco.'
        : `${count} ${count === 1 ? 'questão incorporada' : 'questões incorporadas'} neste navegador.`);
    } catch (error) {
      setNotice(`Importação interrompida. ${(error as Error).message}`);
    } finally {
      setImporting(false);
    }
  }

  function grade(question: CourseQuestion, choice: number) {
    const current = courseRef.current;
    const next = {
      ...current,
      attempts: { ...current.attempts, [question.id]: { choice, correct: choice === question.answer } },
    };
    try {
      persist(next);
    } catch {
      courseRef.current = next;
      setCourse(next);
      setNotice('O navegador não conseguiu guardar a resposta para a próxima sessão.');
    }
  }

  const stats = Object.values(course.attempts);
  const lessonIndex = block.lessons.findIndex(({ id }) => id === lessonId);
  return (
    <section className="nri-course" aria-label="Curso NRI 2027">
      <header className="nri-course-intro">
        <div>
          <h2>Curso NRI 2027</h2>
          <p>Neurorradiologia intervencionista</p>
        </div>
        <dl><div><dt>Blocos</dt><dd>{blocks.length}</dd></div>
          <div><dt>Módulos</dt><dd>{lessonIds.size}</dd></div>
          <div><dt>Questões</dt><dd>{(initialQuestionCount + course.imported.length).toLocaleString('pt-BR')}</dd></div>
          <div><dt>Respondidas aqui</dt><dd>{stats.length}</dd></div>
        </dl>
      </header>
      <div className="nri-course-layout">
        <aside className="nri-course-nav">
          <label htmlFor="nri-course-search"><Search size={16} /> Buscar módulos</label>
          <input id="nri-course-search" type="search" value={filter} onChange={(event) => setFilter(event.target.value)} placeholder="Galeno, ASPECTS, 6C…" />
          <label htmlFor="nri-course-block">Bloco</label>
          <select id="nri-course-block" value={block.id} onChange={(event) => {
            const next = blocks.find(({ id }) => id === Number(event.target.value))!;
            setFilter('');
            select(next.id, mode === 'questoes' && lessonId === 'todos' ? 'todos' : next.lessons[0].id);
          }}>
            {blocks.map((entry) => <option key={entry.id} value={entry.id}>{entry.id}. {entry.title}</option>)}
          </select>
          <label htmlFor="nri-course-lesson">Módulo</label>
          <select id="nri-course-lesson" value={lessonId} onChange={(event) => select(block.id, event.target.value)}>
            {mode === 'questoes' && <option value="todos">Todas as questões do bloco</option>}
            {block.lessons.map((item) => <option key={item.id} value={item.id}>{item.id} · {item.title}</option>)}
          </select>
          <nav aria-label={needle ? 'Resultados da busca' : 'Módulos do bloco'} className="nri-course-modules">
            {needle && matches.length === 0 && <p>Nenhum módulo encontrado.</p>}
            {(needle ? matches : block.lessons.map((item) => ({ item, blockId: block.id })))
              .map(({ item, blockId }) => (
                <button key={item.id} type="button" aria-current={lessonId === item.id ? 'page' : undefined}
                  onClick={() => { select(blockId, item.id); setFocusContent(true); }}>
                  <span>{item.id}</span> {item.title}
                </button>
              ))}
          </nav>
          <details className="nri-course-import">
            <summary><FileUp size={16} /> Importar questões JSON</summary>
            <p>As questões e respostas ficam neste navegador. O modelo mostra os campos exigidos.</p>
            <button type="button" onClick={downloadCourseImportTemplate}>Baixar modelo JSON</button>
            <input ref={importInput} type="file" accept=".json,application/json" hidden
              onChange={(event) => {
                const file = event.currentTarget.files?.[0];
                event.currentTarget.value = '';
                if (file) void importFile(file);
              }} />
            <button type="button" disabled={importing} onClick={() => importInput.current?.click()}>
              {importing ? 'Importando…' : 'Selecionar arquivo'}
            </button>
          </details>
          <Link to="/tools/neuro3d?tab=nri">Histórico da preparação NRI</Link>
        </aside>
        <div className="nri-course-main">
          <nav aria-label="Modo de estudo" className="nri-course-modes">
            {modes.map(({ id, label, icon: Icon }) => <button type="button" key={id} aria-pressed={mode === id}
              onClick={() => select(block.id, lessonId === 'todos' && id !== 'questoes' ? block.lessons[0].id : lessonId, id)}>
              <Icon size={17} />{label}
            </button>)}
          </nav>
          <p role="status" className="nri-course-status">{notice}</p>
          {!ready && <p role="status">Carregando o bloco…</p>}
          {ready?.error && <p role="alert">{ready.error} <button type="button" onClick={() => setRetry(retry + 1)}>Tentar novamente</button></p>}
          {data && <>
            <p className="nri-course-kicker">Bloco {block.id} · {block.title}</p>
            <h3 ref={heading} tabIndex={-1}>{lesson ? `${lesson.id} · ${lesson.title}` : 'Questões de todo o bloco'}</h3>
            {mode === 'questoes' && <Quiz key={`${block.id}:${lessonId}`} questions={questions} attempts={course.attempts}
              onGrade={grade} blockWide={lessonId === 'todos'} onBlock={() => select(block.id, 'todos')} />}
            {lesson && mode === 'teoria' && <article className="nri-course-text">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{lesson.theory}</ReactMarkdown>
            </article>}
            {lesson && mode !== 'questoes' && <>
              <h4>Conceitos-chave para a prova</h4>
              <div className="nri-course-table"><table>
                <thead><tr><th scope="col">Conceito</th><th scope="col">O que lembrar</th></tr></thead>
                <tbody>{lesson.points.map(({ concept, takeaway }) => <tr key={concept}><th scope="row">{concept}</th><td>{takeaway}</td></tr>)}</tbody>
              </table></div>
              <details className="nri-course-references"><summary>Referências do bloco</summary>
                <ul>{data.references.map(({ label, url }) => <li key={label}>{url ? <a href={url} target="_blank" rel="noreferrer">{label}</a> : label}</li>)}</ul>
              </details>
              <nav className="nri-course-quizbar" aria-label="Percorrer módulos">
                {lessonIndex > 0 && <button type="button" onClick={() => {
                  select(block.id, block.lessons[lessonIndex - 1].id);
                  setFocusContent(true);
                }}>Módulo anterior</button>}
                <button className="nri-course-primary" type="button" onClick={() => {
                  select(block.id, lesson.id, 'questoes');
                  setFocusContent(true);
                }}>Praticar questões deste módulo</button>
                {lessonIndex < block.lessons.length - 1 && <button type="button" onClick={() => {
                  select(block.id, block.lessons[lessonIndex + 1].id);
                  setFocusContent(true);
                }}>Próximo módulo</button>}
              </nav>
            </>}
          </>}
        </div>
      </div>
    </section>
  );
}

function Quiz({ questions, attempts, onGrade, blockWide, onBlock }: {
  questions: CourseQuestion[];
  attempts: CourseState['attempts'];
  onGrade: (question: CourseQuestion, choice: number) => void;
  blockWide: boolean;
  onBlock: () => void;
}) {
  const [position, setPosition] = useState(0);
  const [choice, setChoice] = useState<number>();
  const [retryId, setRetryId] = useState<string>();
  const index = Math.min(position, questions.length - 1);
  const question = questions[index];
  const answer = question && retryId !== question.id ? attempts[question.id] : undefined;
  const completed = questions.flatMap((item) => attempts[item.id] ?? []);
  const correct = completed.filter((attempt) => attempt.correct).length;
  if (!question) return <p>Nenhuma questão neste recorte.</p>;
  const letter = (number: number) => 'ABCDE'[number];
  function move(next: number) {
    setPosition(next);
    setChoice(undefined);
    setRetryId(undefined);
  }
  return <div className="nri-course-quiz">
    <div className="nri-course-quizbar">
      <label>Questão <select aria-label="Selecionar questão" value={index} onChange={(event) => move(Number(event.target.value))}>
        {questions.map((item, idx) => <option key={item.id} value={idx}>{idx + 1} / {questions.length} · {item.lesson}{attempts[item.id] ? ' ✓' : ''}</option>)}
      </select></label>
      <span>{completed.length}/{questions.length} respondidas · {correct} acertos</span>
      {!blockWide && <button type="button" onClick={onBlock}>Praticar o bloco inteiro</button>}
    </div>
    <fieldset>
      <legend>{question.prompt}</legend>
      {question.options.map((option, idx) => <label key={option} className={
        answer && idx === question.answer ? 'is-correct' : answer && idx === answer.choice ? 'is-incorrect' : ''
      }>
        <input type="radio" name="nri-course-answer" checked={(answer?.choice ?? choice) === idx}
          disabled={Boolean(answer)} onChange={() => setChoice(idx)} />
        <strong>{letter(idx)}.</strong> <span>{option}</span>
      </label>)}
    </fieldset>
    {answer && <section className="nri-course-feedback" aria-live="polite">
      <strong>{answer.correct ? 'Resposta correta.' : 'Resposta incorreta.'} Gabarito {letter(question.answer)}.</strong>
      <p>{question.explanation}</p>
      <small>{question.origin === 'histórico' ? 'Questão autoral recuperada do curso' : question.origin === 'revisão' ? 'Questão autoral de revisão' : 'Questão importada'}</small>
    </section>}
    <div className="nri-course-quizbar">
      <button type="button" onClick={() => move(index - 1)} disabled={index === 0}>Anterior</button>
      {answer ? <button type="button" onClick={() => { setRetryId(question.id); setChoice(undefined); }}>Refazer</button>
        : <button className="nri-course-primary" type="button" disabled={choice === undefined}
          onClick={() => { if (choice !== undefined) { onGrade(question, choice); setRetryId(undefined); } }}>Conferir resposta</button>}
      <button type="button" onClick={() => move(index + 1)} disabled={index === questions.length - 1}>Próxima</button>
    </div>
  </div>;
}
