import type { Flashcard } from '../types';

export type FlashcardMutation = {
  id: string;
  table: 'flashcards';
  action: 'upsert' | 'delete';
  data: Flashcard;
  timestamp: string;
};

export function flashcardPayload(card: Flashcard): Omit<Flashcard, 'image_position'> {
  const { image_position, ...payload } = card;
  if (image_position && !payload.image_side) payload.image_side = image_position;
  return payload;
}

export function flashcardMutation(data: Flashcard, action: FlashcardMutation['action']): FlashcardMutation {
  const timestamp = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    table: 'flashcards',
    action,
    data: action === 'upsert' ? { ...flashcardPayload(data), updated_at: timestamp } : data,
    timestamp,
  };
}

export function newestFlashcardMutations(queue: FlashcardMutation[], userId: string) {
  const groups = new Map<string, FlashcardMutation[]>();
  for (const item of queue) {
    if (item.table !== 'flashcards' || item.data?.user_id !== userId) continue;
    const group = groups.get(item.data.id) ?? [];
    group.push(item);
    groups.set(item.data.id, group);
  }
  return [...groups.values()].map(group => {
    group.sort((a, b) => a.timestamp.localeCompare(b.timestamp) || a.id.localeCompare(b.id));
    return { latest: group[group.length - 1], queueIds: group.map(item => item.id) };
  });
}
