import { readFileSync } from 'node:fs';

const content = new URL('../../features/neuro3d/course/content/', import.meta.url);
const manifest = JSON.parse(readFileSync(new URL('index.json', content), 'utf8'));
const normalized = (value) => value.normalize('NFD').replace(/\p{Mark}/gu, '')
  .toLocaleLowerCase('pt-BR').replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
const isRecall = ({ prompt }) => /^No contexto de .*qual alternativa descreve corretamente «|^Em .*a qual conceito corresponde a seguinte descrição\?/s.test(prompt);

const rows = [];
const pending = [];
const byLesson = [];
const promptIds = new Map();
for (const { id, lessons } of manifest) {
  const block = JSON.parse(readFileSync(new URL(`block-${id}.json`, content), 'utf8'));
  const previousAlerts = pending.length;
  const row = { bloco: id, aulas: lessons.length, questoes: block.questions.length, conceitos: 0,
    recordacao: 0, historicas: 0, casosReescritos: 0, outrasAutorais: 0, alertas: 0 };
  for (const lesson of block.lessons) {
    const questions = block.questions.filter((question) => question.lesson === lesson.id);
    row.conceitos += lesson.points.length;
    byLesson.push({ aula: lesson.id, titulo: lesson.title, pontos: lesson.points.length, questoes: questions.length,
      recordacao: questions.filter(isRecall).length, casosReescritos: questions.filter(({ revision }) => revision).length });
  }
  for (const question of block.questions) {
    if (isRecall(question)) row.recordacao++;
    else if (question.origin === 'histórico') row.historicas++;
    else if (question.revision) row.casosReescritos++;
    else row.outrasAutorais++;
    const issues = [];
    const stem = normalized(question.prompt);
    const existing = promptIds.get(stem);
    if (existing) issues.push(`Enunciado coincidente após remover pontuação (${existing})`);
    promptIds.set(stem, question.id);
    if (/\b(?:imagem|figura|organograma|vídeo|tabela)\s+(?:acima|abaixo|a seguir|anex[ao]|do enunciado)\b/i.test(question.prompt)
      || /\b(?:na figura|no vídeo|nas imagens)\b/i.test(question.prompt)) {
      issues.push('Possível referência a material externo');
    }
    const options = question.options.map(normalized);
    if (new Set(options).size !== 5 || options.some((option) => !option)) issues.push('Alternativas coincidentes ou vazias');
    if (options[question.answer] === normalized(question.explanation)) issues.push('Comentário apenas repete a resposta');
    if (options.some((option) => /\b(?:qual alternativa|contabilize|enviar respostas|gabarito oculto)\b/.test(option))) {
      issues.push('Possível texto alheio nas alternativas');
    }
    if (issues.length) pending.push({ id: question.id, aula: question.lesson, alertas: issues });
  }
  row.alertas = pending.length - previousAlerts;
  rows.push(row);
}
if (process.argv.includes('--json')) console.log(JSON.stringify({ blocos: rows, aulas: byLesson, alertas: pending }, null, 2));
else console.table(rows);
