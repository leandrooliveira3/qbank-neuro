import { searchable, type CourseQuestion } from './model';

type Priority = { recall: string; trap: string };
export type ReviewConcept = {
  concept: string;
  rationale: string;
  questionNumbers: number[];
  alreadyExplicit: boolean;
};

function normalizeText(text: string) {
  return searchable(text).replace(/[–—−]/g, '-').replace(/[‘’]/g, "'");
}

function correctRationale(question: CourseQuestion) {
  const paragraphs = question.explanation
    .split(/^\s*([A-E])[.)]\s+/gm);
  const correctLetter = 'ABCDE'[question.answer];
  // Historical questions usually have one commentary per alternative.
  if (paragraphs[1] === 'A' && paragraphs[3] === 'B') {
    for (let index = 1; index < paragraphs.length; index += 2) {
      if (paragraphs[index] === correctLetter) {
        return paragraphs[index + 1].trim().replace(/^corret[ao][.!:]\s*/i, '');
      }
    }
  }
  return question.explanation.trim();
}

export function compareReviewToBank(
  questions: CourseQuestion[], priorities: Record<string, Priority>,
): Map<string, ReviewConcept[]> {
  const lessons = new Map<string, Map<string, ReviewConcept>>();
  questions.forEach((question, index) => {
    const concept = question.options[question.answer];
    const rationale = correctRationale(question);
    const normalizedConcept = normalizeText(concept);
    const normalizedRationale = normalizeText(rationale);
    const key = JSON.stringify([normalizedConcept, normalizedRationale]);
    let concepts = lessons.get(question.lesson);
    if (!concepts) {
      concepts = new Map();
      lessons.set(question.lesson, concepts);
    }
    const existing = concepts.get(key);
    if (existing) {
      existing.questionNumbers.push(index + 1);
      return;
    }

    const priority = priorities[question.lesson];
    const summary = priority ? normalizeText(`${priority.recall} ${priority.trap}`) : '';
    // Literal coverage is conservative. Keep paraphrases in the expanded review.
    const alreadyExplicit = summary.includes(normalizedConcept) &&
      summary.includes(normalizedRationale.replace(/[.!?]+$/, ''));
    concepts.set(key, {
      concept,
      rationale: normalizedConcept === normalizedRationale ? '' : rationale,
      questionNumbers: [index + 1],
      alreadyExplicit,
    });
  });
  return new Map([...lessons].map(([id, concepts]) => [id,
    [...concepts.values()].sort((left, right) => Number(left.alreadyExplicit) - Number(right.alreadyExplicit))]));
}
