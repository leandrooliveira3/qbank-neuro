export type Reference = { label: string; url?: string };
export type KeyPoint = { concept: string; takeaway: string };
export type LessonFigure = {
  id: string;
  caption: string;
  alt: string;
  page: number;
  width: number;
  height: number;
  image: string;
};
export type Lesson = {
  id: string;
  title: string;
  theory: string;
  points: KeyPoint[];
  figures?: LessonFigure[];
  references?: Reference[];
};
export type Block = { id: number; title: string; lessons: (Pick<Lesson, 'id' | 'title'> & { topics: string[] })[] };
export type CourseQuestion = {
  id: string;
  lesson: string;
  prompt: string;
  options: string[];
  answer: number;
  explanation: string;
  origin: 'histórico' | 'revisão' | 'importada';
  revision?: number;
  reference?: Reference;
};
export type BlockContent = {
  lessons: Lesson[];
  questions: CourseQuestion[];
  references: Reference[];
  revisionPlan?: { day: string; task: string }[];
};
export type Attempt = { choice: number; correct: boolean };
export type CourseState = { imported: CourseQuestion[]; attempts: Record<string, Attempt> };

const storageKey = 'qbank-neuro3d-course-v1';
const maxImported = 3000;
export const maxImportBytes = 4 * 1024 * 1024;
export const emptyCourse = (): CourseState => ({ imported: [], attempts: {} });
export const courseAttemptKey = ({ id, revision }: CourseQuestion) => revision ? `${id}:v${revision}` : id;
export const searchable = (value: string) =>
  value.normalize('NFD').replace(/\p{Mark}/gu, '').trim().toLocaleLowerCase('pt-BR').replace(/\s+/g, ' ');

function record(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown> : undefined;
}

function boundedText(value: unknown, max: number, field: string) {
  if (typeof value !== 'string' || !value.trim() || value.trim().length > max) {
    throw new Error(`Campo "${field}" inválido.`);
  }
  return value.trim();
}

export function parseCourseImport(value: unknown, lessons: Set<string>): CourseQuestion[] {
  const body = record(value);
  const list = Array.isArray(value) ? value : body?.questions;
  if (!Array.isArray(list) || list.length < 1 || list.length > maxImported) {
    throw new Error('Forneça de 1 a 3.000 questões em uma lista JSON.');
  }
  const ids = new Set<string>();
  const prompts = new Set<string>();
  return list.map((item, index) => {
    try {
      const fields = record(item);
      if (!fields) throw new Error('Esperado um objeto.');
      const lesson = boundedText(fields.lesson, 10, 'lesson').toUpperCase();
      if (!lessons.has(lesson)) throw new Error(`Módulo desconhecido: ${lesson}.`);
      const localId = boundedText(fields.id, 80, 'id').replace(/^importada:/, '');
      if (!/^[a-zA-Z0-9._-]{1,70}$/.test(localId)) throw new Error('Use letras, números, ponto, hífen ou sublinhado no ID.');
      const id = `importada:${localId}`;
      const prompt = boundedText(fields.prompt, 5000, 'prompt');
      const key = searchable(prompt);
      if (ids.has(id) || prompts.has(key)) throw new Error('ID ou enunciado repetido no arquivo.');
      ids.add(id);
      prompts.add(key);
      if (!Array.isArray(fields.options) || fields.options.length !== 5) {
        throw new Error('Informe cinco alternativas.');
      }
      const options = fields.options.map((option) => boundedText(option, 2000, 'options'));
      if (new Set(options.map(searchable)).size !== 5) throw new Error('As alternativas devem ser distintas.');
      const answer = fields.answer;
      if (typeof answer !== 'number' || !Number.isInteger(answer) || answer < 0 || answer > 4) {
        throw new Error('O gabarito deve ser um índice inteiro entre 0 (A) e 4 (E).');
      }
      return { id, lesson, prompt, options, answer, explanation: boundedText(fields.explanation, 8000, 'explanation'), origin: 'importada' };
    } catch (error) {
      throw new Error(`Questão ${index + 1}. ${(error as Error).message}`);
    }
  });
}

export function mergeCourseImport(
  existing: CourseQuestion[],
  incoming: CourseQuestion[],
  builtInPrompts: Set<string>,
) {
  const byId = new Map(existing.map((item) => [item.id, item]));
  const prompts = new Set(existing.map(({ prompt }) => searchable(prompt)));
  for (const question of incoming) {
    const previous = byId.get(question.id);
    if (previous) {
      if (JSON.stringify(previous) !== JSON.stringify(question)) {
        throw new Error(`O ID "${question.id}" já pertence a outra questão. Use um ID diferente.`);
      }
      continue;
    }
    const key = searchable(question.prompt);
    if (prompts.has(key) || builtInPrompts.has(key)) {
      throw new Error(`Enunciado já presente no banco: "${question.prompt.slice(0, 80)}".`);
    }
    byId.set(question.id, question);
    prompts.add(key);
  }
  if (byId.size > maxImported) throw new Error('O banco local comporta até 3.000 questões importadas.');
  return Array.from(byId.values());
}

export function loadCourse(lessons: Set<string>): CourseState {
  try {
    const stored = record(JSON.parse(localStorage.getItem(storageKey) ?? 'null'));
    if (!stored) return emptyCourse();
    const imported = Array.isArray(stored.imported) && stored.imported.length
      ? parseCourseImport(stored.imported, lessons) : [];
    const attempts = Object.fromEntries(Object.entries(record(stored.attempts) ?? {}).flatMap(([id, raw]) => {
      const attempt = record(raw);
      return attempt && typeof attempt.choice === 'number' && Number.isInteger(attempt.choice)
        && attempt.choice >= 0 && attempt.choice < 5 && typeof attempt.correct === 'boolean'
        ? [[id, { choice: attempt.choice, correct: attempt.correct }]] : [];
    }));
    return { imported, attempts };
  } catch {
    return emptyCourse();
  }
}

export function saveCourse(state: CourseState) {
  localStorage.setItem(storageKey, JSON.stringify(state));
}

export function downloadCourseImportTemplate() {
  const sample = [{
    id: 'exemplo-001', lesson: '1A',
    prompt: 'Qual forame é classicamente atravessado pela artéria meníngea média?',
    options: ['Forame oval', 'Forame espinhoso', 'Canal óptico', 'Forame redondo', 'Canal do hipoglosso'],
    answer: 1, explanation: 'A meníngea média normalmente entra no crânio pelo forame espinhoso.',
  }];
  const href = URL.createObjectURL(new Blob([JSON.stringify({ questions: sample }, null, 2)], { type: 'application/json' }));
  const link = document.createElement('a');
  link.href = href;
  link.download = 'modelo-questoes-nri.json';
  link.click();
  setTimeout(() => URL.revokeObjectURL(href), 1000);
}
