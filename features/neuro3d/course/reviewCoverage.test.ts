import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import manifest from './content/index.json';
import priorities from './content/review-priorities.json';
import { compareReviewToBank } from './reviewCoverage';
import type { BlockContent } from './model';

describe('correspondência entre banco e revisão final', () => {
  it.each(manifest)('mapeia as 100 questões do bloco $id uma única vez', (block) => {
    const { questions }: BlockContent = JSON.parse(readFileSync(
      new URL(`./content/block-${block.id}.json`, import.meta.url), 'utf8',
    ));
    const review = compareReviewToBank(questions, priorities);
    expect(new Set(review.keys())).toEqual(new Set(block.lessons.map(({ id }) => id)));
    const mappedNumbers = [...review.values()].flat().flatMap((row) => {
      expect(row.concept.trim()).not.toBe('');
      for (const number of row.questionNumbers) {
        const question = questions[number - 1];
        expect(row.concept).toBe(question.options[question.answer]);
        expect(review.get(question.lesson)).toContain(row);
      }
      return row.questionNumbers;
    }).sort((a, b) => a - b);
    expect(mappedNumbers).toEqual(Array.from({ length: 100 }, (_, index) => index + 1));
  });

  it('destaca complementos e extrai a justificativa correta dos comentários por alternativa', () => {
    const question = {
      id: '1', lesson: '1A', prompt: 'Qual critério?', origin: 'histórico' as const,
      options: ['Primeiro critério', 'Segundo critério', 'Terceiro critério'],
      answer: 1, explanation: 'A. Primeiro comentário.\nB. Correta. Justificativa completa.\nC. Terceiro comentário.',
    };
    const priorities = { '1A': { recall: 'Segundo critério.', trap: 'Justificativa completa.' } };
    const repeated = { ...question, id: '2' };
    const supplemental = {
      ...question, id: '3', answer: 2,
    };
    expect(compareReviewToBank([question, repeated, supplemental], priorities).get('1A')).toEqual([
      { concept: 'Terceiro critério', rationale: 'Terceiro comentário.', questionNumbers: [3], alreadyExplicit: false },
      { concept: 'Segundo critério', rationale: 'Justificativa completa.', questionNumbers: [1, 2], alreadyExplicit: true },
    ]);
  });
});
