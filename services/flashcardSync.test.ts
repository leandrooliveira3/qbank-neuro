import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Flashcard } from '../types';
import { flashcardMutation, type FlashcardMutation } from './flashcardSync';

const { db, select, upsert, remove, session } = vi.hoisted(() => ({
  db: { getAll: vi.fn(), bulkDelete: vi.fn(), saveFlashcardMutations: vi.fn(), reconcileFlashcards: vi.fn() },
  select: vi.fn(), upsert: vi.fn(), remove: vi.fn(), session: vi.fn(),
}));
vi.mock('./localDB', () => ({ localDB: db }));
vi.mock('./supabase', () => ({
  supabase: {
    auth: { getSession: session },
    from: () => ({ select, upsert, delete: remove }),
  },
}));

import { syncEngine } from './syncEngine';

const card: Flashcard = {
  id: 'card', user_id: 'owner', category: 'NRI', bank_name: 'Anatomia', front: 'Pergunta', back: 'Resposta',
  front_image_url: 'https://example.com/card.png', back_image_url: 'https://example.com/card.png',
  image_position: 'back', occlusions: [], status: 'learning', repetitions: 3, interval: 6, ease_factor: 2.3,
  created_at: '2026-10-01T09:00:00Z', next_review: '2026-12-01T10:00:00Z',
};
const legacy: FlashcardMutation = {
  id: 'legacy', table: 'flashcards', data: card, action: 'upsert', timestamp: '2026-11-26T20:00:00Z',
};

beforeEach(() => {
  vi.resetAllMocks();
  session.mockResolvedValue({ data: { session: { user: { id: 'owner' } } } });
  select.mockReturnValue({ eq: () => ({ in: async () => ({ data: [], error: null }) }) });
  upsert.mockResolvedValue({ error: null });
  db.getAll.mockResolvedValue([legacy]);
});

describe('sincronização de flashcards manuais', () => {
  it('envia o nome da coluna do Supabase e só confirma a fila depois do aceite', async () => {
    upsert.mockResolvedValueOnce({ error: { code: 'PGRST204' } });
    expect(await syncEngine.pushLocalChanges('owner')).toBe(false);
    expect(db.bulkDelete).toHaveBeenCalledWith('sync_queue', []);

    expect(await syncEngine.pushLocalChanges('owner')).toBe(true);
    const [payload] = upsert.mock.lastCall[0];
    expect(payload).toMatchObject({
      image_side: 'back', created_at: card.created_at, next_review: card.next_review,
      status: 'learning', interval: 6, repetitions: 3,
    });
    expect(payload).not.toHaveProperty('image_position');
    expect(db.bulkDelete).toHaveBeenLastCalledWith('sync_queue', ['legacy']);
  });

  it('ignora cartões de outra conta e não recria um cartão excluído depois da edição', async () => {
    db.getAll.mockResolvedValue([
      legacy,
      { ...legacy, id: 'delete', action: 'delete', timestamp: '2026-11-26T21:00:00Z' },
      { ...legacy, id: 'other', data: { ...card, user_id: 'other' } },
    ]);
    const inQuery = vi.fn().mockResolvedValue({ error: null });
    remove.mockReturnValue({ eq: (column: string, id: string) => {
      expect([column, id]).toEqual(['user_id', 'owner']);
      return { in: inQuery };
    } });
    expect(await syncEngine.pushLocalChanges('owner')).toBe(true);
    expect(inQuery).toHaveBeenCalledWith('id', ['card']);
    expect(upsert).not.toHaveBeenCalled();
    expect(db.bulkDelete).toHaveBeenCalledWith('sync_queue', ['legacy', 'delete']);
  });

  it('grava alteração de imagem sem tocar no agendamento nem na data de criação', () => {
    const item = flashcardMutation({ ...card, image_side: 'both' }, 'upsert');
    expect(item.data).toMatchObject({
      image_side: 'both', next_review: card.next_review, created_at: card.created_at,
      updated_at: item.timestamp,
    });
    expect(item.data).not.toHaveProperty('image_position');
  });

  it('isola um envio rejeitado e confirma os outros cartões do lote', async () => {
    db.getAll.mockResolvedValue([legacy, { ...legacy, id: 'good', data: { ...card, id: 'good' } }]);
    upsert.mockResolvedValueOnce({ error: { code: 'invalid' } })
      .mockResolvedValueOnce({ error: { code: 'invalid' } })
      .mockResolvedValueOnce({ error: null });
    expect(await syncEngine.pushLocalChanges('owner')).toBe(false);
    expect(db.bulkDelete).toHaveBeenCalledWith('sync_queue', ['good']);
  });
});
