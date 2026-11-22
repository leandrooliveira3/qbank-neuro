import { useEffect, useId, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, FileText, Image as ImageIcon, ZoomIn, ZoomOut } from 'lucide-react';
import type { PDFDocumentProxy, RenderTask } from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import data from './content/material-archive.json';

type Box = [number, number, number, number];
type OriginalPage = [volume: number, page: number, sourcePage: number, top: number, bottom: number, images: Box[]];
type Section = { title: string; pages: OriginalPage[] };
type Archive = {
  volumes: { file: string; export: number; bytes: number }[];
  sections: Record<string, Section[]>;
};

const archive = data as unknown as Archive;
const sources = ['Estudo em NRI', 'Estudos em NRI · Parte 1', 'Estudos em NRI · Parte 2'];

export function OriginalMaterial({ id, figures = false }: { id: string; figures?: boolean }) {
  const sectionSelectId = useId();
  const pageSelectId = useId();
  const sections = archive.sections[id] ?? [];
  const [sectionIndex, setSectionIndex] = useState(0);
  const [pageIndex, setPageIndex] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const gallery = sections.flatMap(({ pages }) => pages.flatMap(page => page[5].map(box => ({ page, box }))));
  const [view, setView] = useState<'pages' | 'images'>(figures && gallery.length ? 'images' : 'pages');
  const section = sections[sectionIndex];
  const entry = view === 'images' ? gallery[pageIndex] : section?.pages[pageIndex] && { page: section.pages[pageIndex], box: undefined };
  if (!entry) return <p>Material original indisponível neste recorte.</p>;
  const [volumeIndex, , sourcePage, top, bottom] = entry.page;
  const volume = archive.volumes[volumeIndex];
  const pages = view === 'images' ? gallery.length : section.pages.length;
  function select(next: 'pages' | 'images') {
    setView(next);
    setPageIndex(0);
    setExpanded(false);
  }

  return <section className="nri-original" aria-label="Material integral">
    <div className="nri-original-toolbar">
      <button type="button" aria-pressed={view === 'pages'} onClick={() => select('pages')}><FileText size={16} /> Leitura</button>
      {gallery.length > 0 && <button type="button" aria-pressed={view === 'images'} onClick={() => select('images')}>
        <ImageIcon size={16} /> Figuras ({gallery.length})
      </button>}
      <button type="button" aria-pressed={expanded} onClick={() => setExpanded(!expanded)}>
        {expanded ? <ZoomOut size={16} /> : <ZoomIn size={16} />}{expanded ? 'Ajustar' : 'Ampliar'}
      </button>
    </div>
    {figures && gallery.length === 0 && <p className="nri-original-source">
      Nenhuma figura incorporada na exportação desta aula. A leitura integral está disponível abaixo.
    </p>}
    {view === 'pages' && sections.length > 1 && <div className="nri-original-select">
      <label htmlFor={sectionSelectId}>Trecho</label>
      <select id={sectionSelectId} value={sectionIndex} onChange={event => {
        setSectionIndex(Number(event.target.value));
        setPageIndex(0);
      }}>
        {sections.map(({ title, pages: list }, index) => <option value={index} key={index}>
          {title} · p. {list[0][2]}–{list.at(-1)![2]}
        </option>)}
      </select>
    </div>}
    <div className="nri-original-navigation">
      <button type="button" aria-label={view === 'images' ? 'Figura anterior' : 'Página anterior'} disabled={!pageIndex} onClick={() => setPageIndex(pageIndex - 1)}><ChevronLeft size={19} /></button>
      <div className="nri-original-select">
        <label htmlFor={pageSelectId}>{view === 'images' ? 'Figura' : 'Página'}</label>
        <select id={pageSelectId} value={pageIndex} onChange={event => setPageIndex(Number(event.target.value))}>
          {Array.from({ length: pages }, (_, index) => <option key={index} value={index}>{index + 1} de {pages}</option>)}
        </select>
      </div>
      <button type="button" aria-label={view === 'images' ? 'Próxima figura' : 'Próxima página'} disabled={pageIndex + 1 >= pages} onClick={() => setPageIndex(pageIndex + 1)}><ChevronRight size={19} /></button>
    </div>
    <p className="nri-original-source">{sources[volume.export]} · página {sourcePage} da exportação</p>
    <OriginalPageView key={volume.file} file={volume.file} page={entry.page[1]} bounds={entry.box ?? [24, top, 573, bottom]}
      expanded={expanded} photograph={view === 'images'} />
  </section>;
}

function OriginalPageView({ file, page, bounds, expanded, photograph }: {
  file: string; page: number; bounds: Box; expanded: boolean; photograph: boolean;
}) {
  const surface = useRef<HTMLCanvasElement>(null);
  const [doc, setDoc] = useState<PDFDocumentProxy>();
  const [loadingError, setLoadingError] = useState(false);
  const [renderState, setRenderState] = useState<{ key: string; text?: string; error?: boolean }>();
  const [retry, setRetry] = useState(0);
  const [left, top, right, bottom] = bounds;
  const renderKey = `${file}:${page}:${bounds.join(',')}:${retry}`;

  useEffect(() => {
    let active = true;
    let destroy: (() => Promise<void>) | undefined;
    setDoc(undefined);
    setLoadingError(false);
    import('pdfjs-dist').then(async pdf => {
      if (!active) return;
      pdf.GlobalWorkerOptions.workerSrc = workerUrl;
      const task = pdf.getDocument({ url: `${import.meta.env.BASE_URL}nri-material/${file}`, isEvalSupported: false });
      destroy = () => task.destroy();
      const loaded = await task.promise;
      if (active) setDoc(loaded);
    }).catch(() => { if (active) setLoadingError(true); });
    return () => {
      active = false;
      void destroy?.().catch(() => {});
    };
  }, [file, retry]);

  useEffect(() => {
    if (!doc) return;
    let active = true;
    let task: RenderTask | undefined;
    const render = async () => {
      const documentPage = await doc.getPage(page);
      if (!active || !surface.current) return;
      const canvas = surface.current;
      const view = documentPage.getViewport({ scale: 2 });
      canvas.width = Math.ceil((right - left) * view.scale);
      canvas.height = Math.ceil((bottom - top) * view.scale);
      task = documentPage.render({
        canvas, viewport: view, transform: [1, 0, 0, 1, -left * view.scale, -top * view.scale],
        background: '#fff',
      });
      await task.promise;
      const text = photograph ? '' : (await documentPage.getTextContent()).items.flatMap(item => {
        if (!('str' in item)) return [];
        const y = view.height / view.scale - item.transform[5];
        if (y < top || y > bottom) return [];
        return [item.str, item.hasEOL ? '\n' : ' '];
      }).join('').trim();
      if (active) setRenderState({ key: renderKey, text });
    };
    render().catch(() => { if (active) setRenderState({ key: renderKey, error: true }); });
    return () => { active = false; task?.cancel(); };
  }, [doc, page, left, top, right, bottom, photograph, renderKey]);

  const current = renderState?.key === renderKey ? renderState : undefined;
  const failed = loadingError || current?.error;
  return <>
    {failed ? <div role="alert" className="nri-original-error">
      <p>Não foi possível abrir este trecho.</p>
      <button type="button" onClick={() => setRetry(value => value + 1)}>Tentar novamente</button>
    </div> : !current && <p role="status">Carregando material original…</p>}
    <div className={`nri-original-sheet${expanded ? ' is-expanded' : ''}`} hidden={!current || failed}>
      <canvas ref={surface} role="img" aria-label={photograph ? 'Figura da página original, conforme apresentada na exportação' : 'Página diagramada do material original'} />
    </div>
    {current?.text && !failed && <details className="nri-original-transcription">
      <summary>Texto selecionável da página</summary>
      <p>{current.text}</p>
    </details>}
  </>;
}

export default OriginalMaterial;
