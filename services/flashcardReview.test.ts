import { describe, expect, it } from 'vitest';
import type { Flashcard } from '../types';
import { reviewQueue, scheduleFlashcard } from './flashcardReview';

const now = new Date(2026, 10, 27, 10);
const relative = (minutes: number) => new Date(now.getTime() + minutes * 60_000).toISOString();
const card = (id: string, patch: Partial<Flashcard> = {}): Flashcard => ({
    id, user_id: 'user', front: id, back: 'Resposta', status: 'new', interval: 0,
    ease_factor: 2.5, repetitions: 0, next_review: relative(-5), created_at: relative(-1440), ...patch,
});
const ids = (cards: Flashcard[]) => cards.map(card => card.id);

describe('agendamento de flashcards', () => {
    it.each([
        ['standard', [1, 3, 5]],
        ['cramming', [1, 2, 3]],
        ['deep', [2, 5, 8]],
    ])('aplica o perfil %s à primeira avaliação', (profile, intervals) => {
        const scheduled = (['hard', 'good', 'easy'] as const).map(rating => scheduleFlashcard(card('a'), rating, profile, now));
        expect(scheduled.map(result => result.interval)).toEqual(intervals);
        expect(scheduled.map(result => result.repetitions)).toEqual([1, 1, 1]);
    });

    it('agenda a reapresentação em 10 min e limita o fator de facilidade', () => {
        const result = scheduleFlashcard(card('a', { status: 'review', repetitions: 7, ease_factor: 1.31 }), 'again', 'deep', now);
        expect(result).toMatchObject({ status: 'learning', repetitions: 0, ease_factor: 1.3, interval: 0,
            last_review: now.toISOString(), next_review: relative(10) });
        const easy = scheduleFlashcard(card('a', { interval: 10, repetitions: 4, ease_factor: 3.49 }), 'easy', 'standard', now);
        expect(easy).toMatchObject({ status: 'mastered', repetitions: 5, ease_factor: 3.5, interval: 46 });
    });

    it('mantém a ordenação dos vencidos e deixa cartões excedentes com suas datas originais', () => {
        const cards = [card('b'), card('a'), card('c', { next_review: relative(-8) })];
        const original = cards.map(card => card.next_review);
        expect(ids(reviewQueue(cards, { type: 'due', dailyLimit: 2 }, now))).toEqual(['c', 'a']);
        expect(cards.map(card => card.next_review)).toEqual(original);
    });

    it('conta avaliações do dia entre decks e permite rever novamente um erro já devido', () => {
        const cards = [
            card('primeiro', { bank_name: 'Outro', last_review: relative(-35), next_review: relative(1440), repetitions: 1 }),
            card('lapsed', { status: 'learning', last_review: relative(-20) }),
            card('novo'),
        ];
        const options = { type: 'due' as const, bank: 'Principal', dailyLimit: 2 };
        expect(ids(reviewQueue(cards, options, now))).toEqual(['lapsed']);
        expect(ids(reviewQueue(cards, { ...options, type: 'free' }, now))).toEqual(['lapsed', 'novo']);
    });

    it('respeita data de reapresentação mesmo em tema prioritário e deixa a prioridade expirar', () => {
        const cards = [
            card('lapsed', { status: 'learning', next_review: relative(10), category: 'NRI' }),
            card('futuro', { next_review: relative(1440), category: 'NRI' }),
            card('vencido'),
        ];
        const priority = { topics: ['NRI'], activatedAt: relative(-60) };
        expect(ids(reviewQueue(cards, { type: 'due', dailyLimit: 0, priority }, now))).toEqual(['futuro', 'vencido']);
        expect(ids(reviewQueue(cards, { type: 'learning', dailyLimit: 0 }, now))).toEqual([]);
        expect(ids(reviewQueue(cards, { type: 'due', dailyLimit: 0, priority: { ...priority, activatedAt: relative(-10080) } }, now))).toEqual(['vencido']);
    });
});
