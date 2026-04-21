import { create } from 'zustand';
import { Flashcard, FlashcardConfig, FlashcardInbox, FlashcardDeck, ReviewEntry } from '../types';
import { localDB } from '../services/localDB';
import crypto from 'crypto';

interface FlashcardStore {
  config: FlashcardConfig | null;
  decks: FlashcardDeck[];
  inbox: FlashcardInbox[];
  loadConfig: (userId: string) => Promise<void>;
  saveConfig: (config: FlashcardConfig) => Promise<void>;
  loadDecks: (userId: string) => Promise<void>;
  createDeck: (userId: string, name: string, description?: string) => Promise<string>;
  deleteDeck: (deckId: string) => Promise<void>;
  loadInbox: (userId: string) => Promise<void>;
  addToInbox: (card: Omit<FlashcardInbox, 'id' | 'hash' | 'created_at'>) => Promise<void>;
  moveToInbox: (flashcard: Omit<Flashcard, 'id' | 'user_id'>, source: 'import' | 'manual', userId: string) => Promise<void>;
  processInboxCard: (inboxId: string, deckId: string, userId: string) => Promise<string>;
  deleteFromInbox: (inboxId: string) => Promise<void>;
  resetFlashcardProgress: (cardId: string) => Promise<void>;
  resetDeckProgress: (deckId: string, userId: string) => Promise<void>;
  resetAllProgress: (userId: string) => Promise<void>;
  updateCardReviewEntry: (cardId: string, entry: ReviewEntry) => Promise<void>;
}

const generateHash = (front: string, back: string): string => {
  const combined = `${front}|${back}`;
  return crypto.createHash('sha256').update(combined).digest('hex');
};

export const useFlashcardStore = create<FlashcardStore>((set, get) => ({
  config: null,
  decks: [],
  inbox: [],

  loadConfig: async (userId: string) => {
    const configs = await localDB.getAll('flashcard_configs');
    const config = configs.find(c => c.user_id === userId);
    if (config) {
      set({ config });
    } else {
      const defaultConfig: FlashcardConfig = {
        user_id: userId,
        learning_steps: [1, 10, 1440],
        relearning_steps: [10, 1440],
        initial_ease: 2.5,
        min_ease: 1.3,
        max_ease: 3.5,
        interval_modifier: 1.0,
        max_interval: 36500,
        auto_flip_enabled: false,
        auto_flip_delay_ms: 3000,
        new_cards_per_day: 20,
        review_cards_per_day: 200,
      };
      await localDB.put('flashcard_configs', defaultConfig);
      set({ config: defaultConfig });
    }
  },

  saveConfig: async (config: FlashcardConfig) => {
    await localDB.put('flashcard_configs', config);
    set({ config });
  },

  loadDecks: async (userId: string) => {
    const allDecks = await localDB.getAll('flashcard_decks');
    const userDecks = allDecks.filter(d => d.user_id === userId);
    set({ decks: userDecks });
  },

  createDeck: async (userId: string, name: string, description?: string) => {
    const id = `deck_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const deck: FlashcardDeck = {
      id,
      user_id: userId,
      name,
      description,
      created_at: new Date().toISOString(),
    };
    await localDB.put('flashcard_decks', deck);
    const { decks } = get();
    set({ decks: [...decks, deck] });
    return id;
  },

  deleteDeck: async (deckId: string) => {
    await localDB.delete('flashcard_decks', deckId);
    const { decks } = get();
    set({ decks: decks.filter(d => d.id !== deckId) });
  },

  loadInbox: async (userId: string) => {
    const allInbox = await localDB.getAll('flashcard_inbox');
    const userInbox = allInbox.filter(i => i.user_id === userId);
    set({ inbox: userInbox });
  },

  addToInbox: async (card: Omit<FlashcardInbox, 'id' | 'hash' | 'created_at'>) => {
    const hash = generateHash(card.front, card.back);
    const allFlashcards = await localDB.getAll('flashcards');
    const isDuplicate = allFlashcards.some(
      f => f.user_id === card.user_id && generateHash(f.front, f.back) === hash
    );

    const id = `inbox_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const inboxCard: FlashcardInbox = {
      ...card,
      id,
      hash,
      status: isDuplicate ? 'duplicate' : 'pending',
      created_at: new Date().toISOString(),
    };

    await localDB.put('flashcard_inbox', inboxCard);
    const { inbox } = get();
    set({ inbox: [...inbox, inboxCard] });
  },

  moveToInbox: async (flashcard: Omit<Flashcard, 'id' | 'user_id'>, source: 'import' | 'manual', userId: string) => {
    await get().addToInbox({
      user_id: userId,
      front: flashcard.front,
      back: flashcard.back,
      hint: flashcard.hint,
      source,
    });
  },

  processInboxCard: async (inboxId: string, deckId: string, userId: string) => {
    const inboxCard = await localDB.get('flashcard_inbox', inboxId);
    if (!inboxCard) throw new Error('Card not found in inbox');

    const cardId = `card_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newCard: Flashcard = {
      id: cardId,
      user_id: userId,
      front: inboxCard.front,
      back: inboxCard.back,
      hint: inboxCard.hint,
      deck_id: deckId,
      status: 'new',
      next_review: new Date().toISOString(),
      interval: 0,
      ease_factor: 2.5,
      repetitions: 0,
      created_at: new Date().toISOString(),
      review_history: [],
    };

    await localDB.put('flashcards', newCard);
    await localDB.put('flashcard_inbox', { ...inboxCard, status: 'added' });

    const { inbox } = get();
    set({ inbox: inbox.map(i => i.id === inboxId ? { ...i, status: 'added' } : i) });

    return cardId;
  },

  deleteFromInbox: async (inboxId: string) => {
    await localDB.delete('flashcard_inbox', inboxId);
    const { inbox } = get();
    set({ inbox: inbox.filter(i => i.id !== inboxId) });
  },

  resetFlashcardProgress: async (cardId: string) => {
    const card = await localDB.get('flashcards', cardId);
    if (!card) return;

    const resetCard: Flashcard = {
      ...card,
      status: 'new',
      interval: 0,
      ease_factor: 2.5,
      repetitions: 0,
      next_review: new Date().toISOString(),
      review_history: [],
      last_review: undefined,
    };

    await localDB.put('flashcards', resetCard);
  },

  resetDeckProgress: async (deckId: string, userId: string) => {
    const allCards = await localDB.getAll('flashcards');
    const deckCards = allCards.filter(c => c.user_id === userId && c.deck_id === deckId);

    for (const card of deckCards) {
      await get().resetFlashcardProgress(card.id);
    }
  },

  resetAllProgress: async (userId: string) => {
    const allCards = await localDB.getAll('flashcards');
    const userCards = allCards.filter(c => c.user_id === userId);

    for (const card of userCards) {
      await get().resetFlashcardProgress(card.id);
    }
  },

  updateCardReviewEntry: async (cardId: string, entry: ReviewEntry) => {
    const card = await localDB.get('flashcards', cardId);
    if (!card) return;

    const history = card.review_history || [];
    const updated: Flashcard = {
      ...card,
      review_history: [...history, entry],
    };

    await localDB.put('flashcards', updated);
  },
}));
