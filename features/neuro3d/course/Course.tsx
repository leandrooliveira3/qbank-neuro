import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { BookOpen, ClipboardList, FileText, FileUp, Search, Table2 } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import manifest from './content/index.json';
import {
  Block, BlockContent, CourseQuestion, CourseState, Lesson, downloadCourseImportTemplate,
  loadCourse, maxImportBytes, mergeCourseImport, parseCourseImport, saveCourse, searchable, courseAttemptKey,
} from './model';
import './course.css';
import { formatLesson } from './lessonLayout';

const OriginalMaterial = lazy(() => import('./OriginalMaterial'));
const originalSections = [
  ['cp1', 'Checkpoint CP1'], ['cp2', 'Checkpoint CP2'], ['revisoes', 'Revisões cumulativas'],
  ['provas', 'Provas e auditoria documental'], ['programa', 'Planejamento curricular'], ['complementar', 'Tópicos complementares'],
] as const;

const blocks: Block[] = manifest;
const loaders = import.meta.glob<{ default: BlockContent }>('./content/block-*.json');
const initialQuestionCount = blocks.length * 100;
const curriculum = blocks.flatMap((block) => block.lessons.map((lesson) => ({ block, lesson })));
const lessonIds = new Set(curriculum.map(({ lesson }) => lesson.id));
const modes = [
  { id: 'teoria', label: 'Aula', icon: BookOpen },
  { id: 'material', label: 'Material integral', icon: FileText },
  { id: 'revisao', label: 'Revisão de prova', icon: Table2 },
  { id: 'questoes', label: 'Questões', icon: ClipboardList },
] as const;
type Mode = typeof modes[number]['id'];

function courseLink(block?: number, lesson?: string, mode?: Mode) {
  const params = new URLSearchParams();
  if (block !== undefined) params.set('bloco', String(block));
  if (lesson) params.set('modulo', lesson);
  if (mode && mode !== 'teoria') params.set('estudo', mode);
  const query = params.toString();
  return query ? `/tools/nri?${query}` : '/tools/nri';
}

export default function Course() {
  const [params, setParams] = useSearchParams();
  const supplemental = originalSections.find(([id]) => params.get('material') === id);
  const selected = params.get('modulo')?.toUpperCase();
  const entry = curriculum.find(({ lesson }) => lesson.id === selected);
  const mode = modes.find(({ id }) => id === params.get('estudo'))?.id ?? 'teoria';
  const block = entry?.block ?? blocks.find(({ id }) => String(id) === params.get('bloco'));
  const blockWide = selected === 'TODOS' && mode === 'questoes' && !!block;
  const activeBlockId = blockWide || entry ? block?.id : undefined;
  const [filter, setFilter] = useState('');
  const [course, setCourse] = useState(() => loadCourse(lessonIds));
  const courseRef = useRef(course);
  const [loaded, setLoaded] = useState<{ id: number; data?: BlockContent; error?: boolean }>();
  const [notice, setNotice] = useState('');
  const [importing, setImporting] = useState(false);
  const importInput = useRef<HTMLInputElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const [focusContent, setFocusContent] = useState(false);

  useEffect(() => {
    if (!params.has('leitura')) return;
    const next = new URLSearchParams(params);
    next.delete('leitura');
    setParams(next, { replace: true });
  }, [params, setParams]);

  useEffect(() => {
    if (!activeBlockId) return;
    let active = true;
    const load = loaders[`./content/block-${activeBlockId}.json`];
    load().then(
      ({ default: data }) => { if (active) setLoaded({ id: activeBlockId, data }); },
      () => { if (active) setLoaded({ id: activeBlockId, error: true }); },
    );
    return () => { active = false; };
  }, [activeBlockId]);

  const ready = activeBlockId && loaded?.id === activeBlockId ? loaded : undefined;
  const data = ready?.data;
  const lesson = data?.lessons.find(({ id }) => id === entry?.lesson.id);
  const questions = useMemo(() => data ? [...data.questions, ...course.imported].filter((item) =>
    blockWide ? block?.lessons.some(({ id }) => id === item.lesson) : item.lesson === lesson?.id,
  ) : [], [data, course.imported, block, blockWide, lesson?.id]);
  const needle = searchable(filter);
  const matches = needle ? curriculum.filter(({ block, lesson }) =>
    searchable(`${lesson.id} ${lesson.title} ${block.title} ${lesson.topics.join(' ')}`).includes(needle),
  ) : [];
  const position = entry ? curriculum.indexOf(entry) : -1;
  const prev = position > 0 ? curriculum[position - 1] : undefined;
  const next = position >= 0 ? curriculum[position + 1] : undefined;

  useEffect(() => {
    if (focusContent && heading.current && (!activeBlockId || ready)) {
      heading.current.focus();
      setFocusContent(false);
    }
  }, [focusContent, activeBlockId, ready, selected, mode]);

  function follow() {
    setFilter('');
    setFocusContent(true);
  }

  function persist(nextCourse: CourseState) {
    saveCourse(nextCourse);
    courseRef.current = nextCourse;
    setCourse(nextCourse);
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
    const nextCourse = {
      ...current,
      attempts: { ...current.attempts, [courseAttemptKey(question)]: { choice, correct: choice === question.answer } },
    };
    try {
      persist(nextCourse);
    } catch {
      courseRef.current = nextCourse;
      setCourse(nextCourse);
      setNotice('O navegador não conseguiu guardar a resposta para a próxima sessão.');
    }
  }

  return <section className="nri-course" aria-label="Curso NRI 2027">
    <header className="nri-course-intro">
      <div>
        <h1><Link className="nri-course-home" to={courseLink()} onClick={follow}>Curso NRI 2027</Link></h1>
        <p>{blocks.length} blocos · {lessonIds.size} aulas · {(initialQuestionCount + course.imported.length).toLocaleString('pt-BR')} questões</p>
      </div>
      <div className="nri-course-search">
        <label htmlFor="nri-course-search"><Search size={17} aria-hidden="true" /> Buscar aulas</label>
        <input id="nri-course-search" type="search" value={filter}
          onChange={(event) => setFilter(event.target.value)} placeholder="Galeno, ASPECTS, 6C…" />
      </div>
    </header>

    {needle && <nav className="nri-course-search-results" aria-label="Resultados da busca">
      <h2>{matches.length ? `Resultados (${matches.length})` : 'Nenhuma aula encontrada'}</h2>
      <ul className="nri-lesson-list">
        {matches.map(({ block: foundBlock, lesson: found }) => <li key={found.id}>
          <Link to={courseLink(foundBlock.id, found.id)} onClick={follow}><b>{found.id}</b><span>{found.title}</span></Link>
        </li>)}
      </ul>
    </nav>}

    {!block && !supplemental && <>
      <div className="nri-course-section-title">
        <h2 tabIndex={-1} ref={heading}>Blocos do curso</h2>
        <Link to={courseLink(blocks[0].id, blocks[0].lessons[0].id)} className="nri-course-primary" onClick={follow}>Começar pela aula 1A</Link>
      </div>
      <div className="nri-course-catalog">
        {blocks.map((item) => <Link key={item.id} to={courseLink(item.id)} onClick={follow}>
          <span>Bloco {item.id}</span>
          <strong>{item.title}</strong>
          <small>{item.lessons.length} aulas · 100 questões</small>
        </Link>)}
      </div>
    </>}

    {supplemental && <section className="nri-course-main nri-course-supplement">
      <Link to={courseLink()} onClick={follow}>Todos os blocos</Link>
      <h2>{supplemental[1]}</h2>
      <Suspense fallback={<p role="status">Abrindo material…</p>}>
        <OriginalMaterial key={supplemental[0]} id={supplemental[0]} />
      </Suspense>
    </section>}
    {block && <nav className="nri-course-path" aria-label="Navegação do curso">
      <Link to={courseLink()} onClick={follow}>Todos os blocos</Link>
    </nav>}

    {block && !activeBlockId && <section className="nri-course-main nri-block-index" aria-label={`Bloco ${block.id}`}>
      <p className="nri-course-kicker">Bloco {block.id} · {block.lessons.length} aulas</p>
      <h2 tabIndex={-1} ref={heading}>{block.title}</h2>
      <ol className="nri-lesson-list">
        {block.lessons.map((item) => <li key={item.id}>
          <Link to={courseLink(block.id, item.id)} onClick={follow}><b>{item.id}</b><span>{item.title}</span></Link>
        </li>)}
      </ol>
      <Link to={courseLink(block.id, 'todos', 'questoes')} className="nri-course-primary" onClick={follow}>Questões do bloco</Link>
    </section>}

    {activeBlockId && block && <div className="nri-course-layout">
      <details className="nri-course-nav" key={block.id}>
        <summary>Aulas do bloco {block.id}</summary>
        <ol className="nri-lesson-list">
          {block.lessons.map((item) => <li key={item.id}>
            <Link to={courseLink(block.id, item.id)} onClick={follow} aria-current={entry?.lesson.id === item.id ? 'page' : undefined}>
              <b>{item.id}</b><span>{item.title}</span>
            </Link>
          </li>)}
        </ol>
        <Link to={courseLink(block.id, 'todos', 'questoes')} onClick={follow}>Questões do bloco</Link>
      </details>
      <div className="nri-course-main">
        <p className="nri-course-kicker">Bloco {block.id} · {block.title}</p>
        <h2 className="nri-lesson-title" ref={heading} tabIndex={-1}>{entry ? `${entry.lesson.id} · ${entry.lesson.title}` : 'Questões do bloco'}</h2>
        {entry && <nav aria-label="Modo de estudo" className="nri-course-modes">
          {modes.map(({ id, label, icon: Icon }) => <Link key={id} to={courseLink(block.id, entry.lesson.id, id)}
            aria-current={mode === id ? 'page' : undefined} onClick={follow}>
            <Icon size={17} aria-hidden="true" />{label}
          </Link>)}
        </nav>}
        {notice && <p role="status" className="nri-course-status">{notice}</p>}
        {!ready && <p role="status">Carregando aula e questões…</p>}
        {ready?.error && <div role="alert">
          <p>O bloco não carregou nesta sessão.</p>
          <button type="button" onClick={() => window.location.reload()}>Recarregar curso</button>
        </div>}
        {data && mode === 'questoes' && <Quiz key={`${block.id}:${selected}`} questions={questions} attempts={course.attempts}
          onGrade={grade} blockWide={blockWide} onBlock={() => setParams(new URLSearchParams({ bloco: String(block.id), modulo: 'todos', estudo: 'questoes' }))} />}
        {lesson && mode === 'teoria' && <>
          <p className="nri-original-source"><Link to={`${courseLink(block.id, lesson.id, 'material')}&figuras=1`} onClick={follow}>Figuras e esquemas do material original</Link></p>
          <LessonArticle key={lesson.id} lesson={lesson} />
        </>}
        {lesson && mode === 'material' && <Suspense fallback={<p role="status">Abrindo material…</p>}>
          <OriginalMaterial key={`${lesson.id}:${params.get('figuras')}`} id={lesson.id} figures={params.get('figuras') === '1'} />
        </Suspense>}
        {lesson && mode === 'revisao' && <section className="nri-course-review" aria-label="Revisão da aula">
          <h3>Conceitos-chave para a prova</h3>
          <div className="nri-course-scroll" tabIndex={0} role="region" aria-label="Conceitos e pontos de prova"><table>
            <thead><tr><th scope="col">Conceito</th><th scope="col">O que lembrar</th></tr></thead>
            <tbody>{lesson.points.map(({ concept, takeaway }) => <tr key={concept}><th scope="row">{concept}</th><td>{takeaway}</td></tr>)}</tbody>
          </table></div>
          {data?.revisionPlan && <details className="nri-course-outline nri-block-revision">
            <summary>Plano de revisão do bloco</summary>
            <p>Conte a partir do dia da correção. Reagende para o dia seguinte os erros e os acertos por eliminação.</p>
            <dl>{data.revisionPlan.map(({ day, task }) => <div key={day}>
              <dt>{day}</dt><dd>{task}</dd>
            </div>)}</dl>
          </details>}
        </section>}
        {lesson && data && mode !== 'questoes' && <details className="nri-course-references">
          <summary>Referências da aula</summary>
          <ul>{Array.from(new Map([...data.references, ...(lesson.references ?? [])].map((ref) => [ref.url ?? ref.label, ref])).values())
            .map(({ label, url }) => <li key={url ?? label}>{url ? <a href={url} target="_blank" rel="noreferrer">{label}</a> : label}</li>)}</ul>
        </details>}
        {entry && <nav className="nri-course-pagination" aria-label="Percorrer aulas">
          {prev && <Link to={courseLink(prev.block.id, prev.lesson.id, mode)} onClick={follow}>Aula anterior · {prev.lesson.id}</Link>}
          {next && <Link className="nri-course-primary" to={courseLink(next.block.id, next.lesson.id, mode)} onClick={follow}>Próxima aula · {next.lesson.id}</Link>}
        </nav>}
      </div>
    </div>}

    <footer className="nri-course-tools">
      <Link to="/tools/neuro3d?tab=nri">Histórico da preparação</Link>
      {!block && <details className="nri-course-references nri-course-extra">
        <summary>Checkpoints e material complementar</summary>
        <ul>{originalSections.map(([id, title]) => <li key={id}>
          <Link to={`/tools/nri?material=${id}`} aria-current={supplemental?.[0] === id ? 'page' : undefined}>{title}</Link>
        </li>)}</ul>
      </details>}
      <details className="nri-course-import">
        <summary><FileUp size={16} aria-hidden="true" /> Importar questões JSON</summary>
        <p>As questões importadas ficam no navegador.</p>
        <button type="button" onClick={downloadCourseImportTemplate}>Baixar modelo JSON</button>{' '}
        <input ref={importInput} type="file" accept=".json,application/json" hidden
          onChange={(event) => {
            const file = event.currentTarget.files?.[0];
            event.currentTarget.value = '';
            if (file) void importFile(file);
          }} />
        <button type="button" disabled={importing} onClick={() => importInput.current?.click()}>
          {importing ? 'Importando…' : 'Selecionar arquivo'}
        </button>
        {!activeBlockId && notice && <p role="status">{notice}</p>}
      </details>
    </footer>
  </section>;
}

function LessonArticle({ lesson }: { lesson: Lesson }) {
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
        const figure = lesson.figures?.find(({ id }) => src === `/nri-esquemas/${id}`);
        return figure ? <span className="nri-course-figure" role="group" aria-label={figure.caption}>
          <img src={figure.image} alt={figure.alt} width={figure.width} height={figure.height} loading="lazy" decoding="async" />
          <small>{figure.caption} · Esquema da aula original, p. {figure.page}</small>
        </span> : null;
      },
    }}>{lines.join('\n')}</ReactMarkdown>
  </article>;
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
  const answer = question && retryId !== question.id ? attempts[courseAttemptKey(question)] : undefined;
  const completed = questions.flatMap((item) => attempts[courseAttemptKey(item)] ?? []);
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
        {questions.map((item, idx) => <option key={item.id} value={idx}>{idx + 1} / {questions.length} · {item.lesson}{attempts[courseAttemptKey(item)] ? ' ✓' : ''}</option>)}
      </select></label>
      <span>{completed.length}/{questions.length} respondidas · {correct} acertos</span>
      {!blockWide && <button type="button" onClick={onBlock}>Praticar o bloco inteiro</button>}
    </div>
    <fieldset>
      <legend>{question.prompt}</legend>
      {question.revision && !answer && attempts[question.id] && <p className="nri-course-status">
        Questão revisada. Sua resposta à versão anterior está salva.
      </p>}
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
      {question.reference?.url && <p><a href={question.reference.url} target="_blank" rel="noreferrer">
        {question.reference.label}
      </a></p>}
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
