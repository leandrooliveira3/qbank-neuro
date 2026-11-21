import { useEffect, useRef, useState } from 'react';
import type { PDFDocumentProxy, PDFDocumentLoadingTask, RenderTask } from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { addSource, loadSources, originalLessons, sources, type SourceRange } from './sourceFiles';

export default function OriginalLesson({ lesson }: { lesson: string }) {
  const ranges = originalLessons[lesson];
  const [rangeIndex, setRangeIndex] = useState(0);
  const range = ranges[rangeIndex];
  const [page, setPage] = useState(range.first);
  const [files, setFiles] = useState(new Map<string, Blob>());
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const required = sources.find(({ id }) => id === range.source)!;
  const file = files.get(range.source);

  useEffect(() => {
    let active = true;
    loadSources().then(
      (loaded) => { if (active) setFiles((previous) => new Map([...loaded, ...previous])); },
      () => { if (active) setMessage('O navegador não disponibilizou o armazenamento dos PDFs.'); },
    );
    return () => { active = false; };
  }, []);

  async function importFiles(selected: File[]) {
    setBusy(true);
    const results: string[] = [];
    for (const candidate of selected) {
      try {
        const id = await addSource(candidate);
        setFiles((previous) => new Map(previous).set(id, candidate));
        results.push(`${candidate.name} disponível neste navegador.`);
      } catch (error) {
        results.push(`${candidate.name} · ${(error as Error).message || 'Falha ao guardar o PDF neste navegador.'}`);
      }
    }
    setMessage(results.join(' '));
    setBusy(false);
  }

  return <section className="nri-original" aria-label="Páginas originais">
    {ranges.length > 1 && <label className="nri-source-control">Trecho da aula
      <select value={rangeIndex} onChange={(event) => {
        const next = Number(event.target.value);
        setRangeIndex(next);
        setPage(ranges[next].first);
      }}>
        {ranges.map(({ label }, index) => <option key={label} value={index}>{label}</option>)}
      </select>
    </label>}
    <p className="nri-source-name">{required.name} · {range.first === range.last ? `página ${range.first}` : `páginas ${range.first}–${range.last}`}</p>
    <input ref={input} type="file" accept=".pdf,application/pdf" multiple hidden
      onChange={(event) => {
        const selected = Array.from(event.currentTarget.files ?? []);
        event.currentTarget.value = '';
        if (selected.length) void importFiles(selected);
      }} />
    {!file && <div className="nri-source-empty">
      <p>Selecione o PDF original para ler o trecho da aula com as figuras, esquemas e tabelas da exportação. Você pode selecionar os três arquivos de uma vez. Os PDFs ficam neste navegador.</p>
      <button type="button" disabled={busy} onClick={() => input.current?.click()}>
        {busy ? 'Conferindo PDFs…' : 'Selecionar PDFs originais'}
      </button>
    </div>}
    {message && <p role="status">{message}</p>}
    {file && <>
      <div className="nri-course-quizbar" aria-label="Navegação das páginas">
        <button type="button" disabled={page <= range.first} onClick={() => setPage(page - 1)}>Página anterior</button>
        <label>Página <select value={page} onChange={(event) => setPage(Number(event.target.value))}>
          {Array.from({ length: range.last - range.first + 1 }, (_, index) => range.first + index)
            .map((number) => <option key={number} value={number}>{number}{range.figurePages.includes(number) ? ' · figura' : ''}</option>)}
        </select></label>
        <button type="button" disabled={page >= range.last} onClick={() => setPage(page + 1)}>Próxima página</button>
      </div>
      {range.figurePages.length > 0 && <label className="nri-source-control">Páginas com figuras
        <select value={range.figurePages.includes(page) ? page : ''} onChange={(event) => {
          if (event.target.value) setPage(Number(event.target.value));
        }}>
          <option value="">Ir para uma figura</option>
          {range.figurePages.map((number) => <option key={number} value={number}>Página {number}</option>)}
        </select>
      </label>}
      <SourceCanvas key={range.source} file={file} range={range} page={page} />
    </>}
  </section>;
}

function SourceCanvas({ file, range, page }: { file: Blob; range: SourceRange; page: number }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [document, setDocument] = useState<PDFDocumentProxy>();
  const [openError, setOpenError] = useState('');
  const [renderedPage, setRenderedPage] = useState<number>();
  const [renderError, setRenderError] = useState('');
  const [zoom, setZoom] = useState(false);

  useEffect(() => {
    let active = true;
    let task: PDFDocumentLoadingTask | undefined;
    setDocument(undefined);
    setOpenError('');
    async function open() {
      const pdfjs = await import('pdfjs-dist');
      const bytes = await file.arrayBuffer();
      if (!active) return;
      pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
      task = pdfjs.getDocument({
        data: bytes, isEvalSupported: false, enableXfa: false,
      });
      const source = await task.promise;
      if (active) setDocument(source);
    }
    void open().catch(() => { if (active) setOpenError('Falha ao abrir o PDF original.'); });
    return () => {
      active = false;
      void task?.destroy().catch(() => {});
    };
  }, [file]);

  useEffect(() => {
    if (!document || !canvas.current) return;
    let active = true;
    let task: RenderTask | undefined;
    const target = canvas.current;
    setRenderedPage(undefined);
    setRenderError('');
    async function render() {
      const sourcePage = await document!.getPage(page);
      if (!active) return;
      const original = sourcePage.getViewport({ scale: 1 });
      const viewport = sourcePage.getViewport({ scale: 2 });
      const top = page === range.first ? range.top : 0;
      const bottom = page === range.last ? range.bottom : original.height - 33;
      target.width = Math.ceil(viewport.width);
      target.height = Math.ceil((bottom - top) * viewport.scale);
      task = sourcePage.render({ canvas: target, viewport, transform: [1, 0, 0, 1, 0, -top * viewport.scale] });
      await task.promise;
      if (active) setRenderedPage(page);
    }
    void render().catch(() => { if (active) setRenderError('Não foi possível exibir esta página.'); });
    return () => { active = false; task?.cancel(); };
  }, [document, page, range]);

  const error = openError || renderError;
  return <>
    {error ? <p role="alert">{error}</p> : renderedPage !== page && <p role="status">Carregando página…</p>}
    {renderedPage === page && <button className="nri-zoom" type="button" aria-pressed={zoom} onClick={() => setZoom(!zoom)}>
      {zoom ? 'Ajustar à largura' : 'Ampliar página'}
    </button>}
    <div className={zoom ? 'nri-source-page is-zoomed' : 'nri-source-page'} hidden={renderedPage !== page} tabIndex={0}>
      <canvas ref={canvas} role="img" aria-label={`Página ${page} da aula na exportação original`} />
    </div>
  </>;
}
