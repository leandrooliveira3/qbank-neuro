import { describe, expect, it } from 'vitest';
import manifest from './content/index.json';
import promptIndex from './content/prompts.json';
import provenance from './content/originals.json';
import type { InlineFigure } from './LessonFigures';
import { MENU_ITEMS } from '../../../constants';
import { BlockContent, courseAttemptKey, mergeCourseImport, parseCourseImport, searchable } from './model';

const data = import.meta.glob<{ default: BlockContent }>('./content/block-*.json', { eager: true });
const imageData = import.meta.glob<{ default: Record<string, InlineFigure[]> }>('./content/figures/block-*.json', { eager: true });
const lessons = new Set(manifest.flatMap((block) => block.lessons.map((lesson) => lesson.id)));
const sample = {
  id: 'teste-1',
  lesson: '8A',
  prompt: 'Que escala mede o déficit neurológico agudo?',
  options: ['NIHSS', 'mRS', 'PHASES', 'UIATS', 'ELAPSS'],
  answer: 0,
  explanation: 'A NIHSS quantifica o déficit neurológico agudo.',
};

describe('currículo e banco NRI', () => {
  it('oferece o curso logo depois do atlas no menu principal', () => {
    const atlas = MENU_ITEMS.findIndex(({ path }) => path === '/tools/neuro3d');
    expect(atlas).toBeGreaterThanOrEqual(0);
    expect(MENU_ITEMS[atlas + 1]).toMatchObject({ name: 'Curso NRI 2027', path: '/tools/nri' });
  });

  it('preserva chaves de resposta antigas quando uma questão ganha nova versão', () => {
    const question = { ...sample, origin: 'revisão' as const };
    expect(courseAttemptKey(question)).toBe(sample.id);
    expect(courseAttemptKey({ ...question, revision: 1 })).toBe(`${sample.id}:v1`);
  });

  it('conecta cada módulo aos seus conteúdos e mantém exatamente 100 questões por bloco', () => {
    const ids = new Set<string>();
    const prompts = new Set<string>();
    expect(manifest).toHaveLength(13);
    expect(lessons.size).toBe(120);
    for (const block of manifest) {
      const content = data[`./content/block-${block.id}.json`].default;
      expect(content.questions).toHaveLength(100);
      expect(content.lessons.map((module) => module.id)).toEqual(block.lessons.map((module) => module.id));
      for (const module of content.lessons) {
        expect(module.theory.length).toBeGreaterThan(1200);
        expect(module.points.length).toBeGreaterThanOrEqual(7);
        expect(new Set(module.points.map(({ concept }) => searchable(concept))).size).toBe(module.points.length);
        expect(content.questions.some((question) => question.lesson === module.id)).toBe(true);
      }
      for (const question of content.questions) {
        expect(block.lessons.some((module) => module.id === question.lesson)).toBe(true);
        expect(new Set(question.options.map(searchable)).size).toBe(5);
        expect(question.options[question.answer]?.length).toBeGreaterThan(0);
        expect(question.explanation.length).toBeGreaterThan(7);
        ids.add(question.id);
        prompts.add(searchable(question.prompt));
      }
    }
    expect(ids.size).toBe(1300);
    expect(prompts).toEqual(new Set(promptIndex));
    expect(promptIndex).toHaveLength(1300);
  });

  it('preserva importações idênticas e rejeita conflitos de conteúdo no mesmo ID', () => {
    const incoming = parseCourseImport([sample], lessons);
    const builtIn = new Set(promptIndex);
    expect(mergeCourseImport(incoming, incoming, builtIn)).toEqual(incoming);
    expect(() => mergeCourseImport(incoming, parseCourseImport([{ ...sample, answer: 2 }], lessons), builtIn)).toThrow(/já pertence/);
  });

  it('rejeita enunciados repetidos, módulos inexistentes e alternativas inválidas', () => {
    expect(() => parseCourseImport({ questions: [sample, { ...sample, id: 'teste-2' }] }, lessons)).toThrow(/repetido/);
    expect(() => parseCourseImport([{ ...sample, lesson: '14A' }], lessons)).toThrow(/desconhecido/);
    expect(() => parseCourseImport([{ ...sample, answer: 1.5 }], lessons)).toThrow(/índice/);
    const duplicated = parseCourseImport([{ ...sample, prompt: promptIndex[0] }], lessons);
    expect(() => mergeCourseImport([], duplicated, new Set(promptIndex))).toThrow(/já presente/);
  });
});

it('vincula os 120 módulos às conversas e valida imagens e fontes na página', () => {
  const { lessons: originalLessons, sources } = provenance;
  expect(new Set(Object.keys(originalLessons))).toEqual(lessons);
  const attached = new Map(sources.map((source) => [source.id, source.pages]));
  for (const ranges of Object.values(originalLessons)) {
    expect(ranges.length).toBeGreaterThan(0);
    for (const range of ranges) {
      expect(range.first).toBeGreaterThanOrEqual(1);
      expect(range.last).toBeGreaterThanOrEqual(range.first);
      expect(range.last).toBeLessThanOrEqual(attached.get(range.source)!);
      expect(range.top).toBeLessThan(809);
      expect(range.bottom).toBeGreaterThan(range.first === range.last ? range.top : 0);
      expect(range.figurePages.every((page) => page >= range.first && page <= range.last)).toBe(true);
    }
  }
  let figures = 0;
  for (const [path, { default: content }] of Object.entries(data)) {
    const imagePath = path.replace('/content/', '/content/figures/');
    const byLesson = imageData[imagePath].default;
    for (const module of content.lessons) {
      expect(module.references?.every(({ url }) => url?.startsWith('https://')) ?? true).toBe(true);
      const anchors = [...module.theory.matchAll(/\]\(\/nri-figures\/([^)]+)\)/g)].map(([, id]) => id);
      expect(anchors.sort()).toEqual(byLesson[module.id].map(({ id }) => id).sort());
      expect(new Set(anchors).size).toBe(anchors.length);
      for (const figure of byLesson[module.id]) {
        expect(figure.page).toBeGreaterThan(0);
        expect(figure.page).toBeLessThanOrEqual(sources[figure.source].pages);
        expect(figure.image).toMatch(/^data:image\/webp;base64,/);
        expect(figure.alt).toBeTruthy();
        figures++;
      }
    }
  }
  expect(figures).toBeGreaterThan(0);
});
