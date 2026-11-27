import type { Flashcard } from '../types';

export const retryDelayMinutes = 10;

export type FlashcardRating = 'again' | 'hard' | 'good' | 'easy';

export function scheduleFlashcard(card: Flashcard, rating: FlashcardRating, profile: string, now = new Date()): Flashcard {
    const factor = profile === 'cramming' ? 0.5 : profile === 'deep' ? 1.5 : 1;
    const ease = card.ease_factor ?? 2.5;
    const repetitions = card.repetitions ?? 0;
    const current = card.interval ?? 0;
    const hard = Math.max(1, Math.ceil((repetitions ? current * 1.2 : 1) * factor));
    const good = Math.max(hard + 1, Math.ceil((repetitions ? current * ease : 3) * factor));
    const easy = Math.max(good + 1, Math.ceil((repetitions ? current * ease * 1.3 : 5) * factor));
    const interval = { again: 0, hard, good, easy }[rating];
    const adjustment = { again: -0.2, hard: -0.15, good: 0, easy: 0.15 }[rating];
    const next = new Date(now);
    if (rating === 'again') next.setTime(next.getTime() + retryDelayMinutes * 60_000);
    else next.setDate(next.getDate() + interval);

    return {
        ...card, interval, ease_factor: Number(Math.min(3.5, Math.max(1.3, ease + adjustment)).toFixed(2)),
        repetitions: rating === 'again' ? 0 : repetitions + 1,
        status: rating === 'again' ? 'learning' : rating === 'easy' ? 'mastered' : 'review',
        next_review: next.toISOString(), last_review: now.toISOString(),
    };
}

type ReviewOptions = {
    type: 'due' | 'new' | 'learning' | 'free';
    bank?: string;
    category?: string;
    limit?: number;
    dailyLimit: number;
    priority?: { activatedAt?: string; topics?: string[]; banks?: string[] };
};

export function reviewQueue(cards: Flashcard[], options: ReviewOptions, now = new Date()): Flashcard[] {
    const due = (card: Flashcard) => Date.parse(card.next_review) <= now.getTime();
    const byDue = (a: Flashcard, b: Flashcard) => Date.parse(a.next_review) - Date.parse(b.next_review) || a.id.localeCompare(b.id);
    const today = now.toDateString();
    const reviewedToday = (card: Flashcard) => Boolean(card.last_review &&
        // Old imports initialized last_review together with created_at.
        !(card.repetitions === 0 && card.last_review === card.created_at) &&
        new Date(card.last_review).toDateString() === today);
    const bank = (card: Flashcard) => card.bank_name || 'Principal';
    const topic = (card: Flashcard) => card.category || 'Sem Categoria';
    const eligible = cards.filter(card => card.status !== 'inactive' &&
        (!options.bank || options.bank === 'Todos' || bank(card) === options.bank) &&
        (!options.category || options.category === 'Todas' || topic(card) === options.category));

    let ordered: Flashcard[];
    if (options.type === 'free') {
        return eligible.sort((a, b) => a.id.localeCompare(b.id)).slice(0, options.limit);
    } else if (options.type === 'new') {
        ordered = eligible.filter(card => card.status === 'new' && due(card)).sort((a, b) =>
            Date.parse(a.created_at || '') - Date.parse(b.created_at || '') || a.id.localeCompare(b.id));
    } else if (options.type === 'learning') {
        ordered = eligible.filter(card => card.status === 'learning' && due(card)).sort(byDue);
    } else {
        const activation = Date.parse(options.priority?.activatedAt || '');
        const age = now.getTime() - activation;
        const priority = age >= 0 && age < 7 * 86_400_000 ? options.priority : undefined;
        const prioritized = (card: Flashcard) => Boolean(priority &&
            (priority.banks?.includes(bank(card)) || priority.topics?.includes(topic(card))));
        const first = eligible.filter(card => prioritized(card) && (due(card) ||
            (card.status !== 'learning' && !reviewedToday(card))))
            .sort((a, b) => Number(due(b)) - Number(due(a)) || byDue(a, b));
        const firstIds = new Set(first.map(card => card.id));
        ordered = [...first, ...eligible.filter(card => due(card) && !firstIds.has(card.id)).sort(byDue)];
    }

    if (options.dailyLimit > 0) {
        const seen = new Set(cards.filter(reviewedToday).map(card => card.id));
        let remaining = Math.max(0, options.dailyLimit - seen.size);
        ordered = ordered.filter(card => {
            if (seen.has(card.id)) return true;
            if (remaining <= 0) return false;
            remaining--;
            return true;
        });
    }
    return ordered.slice(0, options.limit);
}
