import { describe, expect, it } from 'vitest';
import manifest from './content/index.json';
import promptIndex from './content/prompts.json';
import { BlockContent, mergeCourseImport, parseCourseImport, searchable } from './model';

const data = import.meta.glob<{ default: BlockContent }>('./content/block-*.json', { eager: true });
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
        expect(module.points.length).toBeGreaterThanOrEqual(6);
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
