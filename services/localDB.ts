import type { Flashcard } from '../types';
import { flashcardMutation, type FlashcardMutation } from './flashcardSync';

const DB_NAME = 'NeuroQBank_Local';
const DB_VERSION = 19; // Increment version for new store

class LocalDB {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    if (this.db) return;
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = (e: any) => {
        const db = e.target.result;
        const stores = [
          'profiles', 'questions', 'flashcards', 'user_answers', 'user_favorites',
          'summaries', 'sync_queue', 'simulation_sessions', 'media_cache',
          'tasks', 'goals', 'focus_sessions', 'planning', 'clinical_reports', 'active_practice_sessions',
          'active_video_session',
          'videos', 'video_progress', 'video_materials', 'video_comments',
          'xp_history',
          'processed_documents',
          'didactic_materials'
        ];
        stores.forEach(s => {
          if (!db.objectStoreNames.contains(s)) db.createObjectStore(s, { keyPath: 'id' });
        });
      };
      request.onsuccess = (e: any) => {
        this.db = e.target.result;
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  }

  private async getStore(name: string, mode: IDBTransactionMode = 'readonly') {
    await this.init();
    return this.db!.transaction(name, mode).objectStore(name);
  }

  async put(storeName: string, data: any): Promise<void> {
    const store = await this.getStore(storeName, 'readwrite');
    return new Promise((resolve) => {
      const req = store.put(data);
      req.onsuccess = () => resolve();
      req.onerror = () => resolve(); // Falha silenciosa para não travar UI
    });
  }

  async bulkPut(storeName: string, items: any[]): Promise<void> {
    if (!items.length) return;
    await this.init();
    const tx = this.db!.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    items.forEach(item => { if (item.id) store.put(item); });
    return new Promise((resolve) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  }

  async getAll(storeName: string): Promise<any[]> {
    const store = await this.getStore(storeName);
    return new Promise((resolve) => {
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => resolve([]);
    });
  }

  async get(storeName: string, id: string): Promise<any> {
    const store = await this.getStore(storeName);
    return new Promise((resolve) => {
      const req = store.get(id);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    });
  }

  async delete(storeName: string, id: string): Promise<void> {
    const store = await this.getStore(storeName, 'readwrite');
    return new Promise((resolve) => {
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => resolve();
    });
  }

  async bulkDelete(storeName: string, ids: string[]): Promise<void> {
    if (!ids.length) return;
    await this.init();
    const tx = this.db!.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    ids.forEach(id => store.delete(id));
    return new Promise((resolve) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  }

  private async flashcardTransaction(
    write: (cards: IDBObjectStore, queue: IDBObjectStore) => void,
  ): Promise<void> {
    await this.init();
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(['flashcards', 'sync_queue'], 'readwrite');
      let writeError: unknown;
      tx.oncomplete = () => resolve();
      tx.onabort = () => reject(writeError ?? tx.error ?? new Error('Falha ao gravar flashcards neste dispositivo.'));
      try {
        write(tx.objectStore('flashcards'), tx.objectStore('sync_queue'));
      } catch (error) {
        writeError = error;
        tx.abort();
      }
    });
  }

  async saveFlashcardMutations(items: FlashcardMutation[]): Promise<void> {
    if (!items.length) return;
    await this.flashcardTransaction((cards, queue) => {
      for (const item of items) {
        if (item.action === 'delete') cards.delete(item.data.id);
        else cards.put(item.data);
        queue.put(item);
      }
    });
  }

  async reconcileFlashcards(userId: string, remoteCards: Flashcard[], snapshotStartedAt: number) {
    const remoteIds = new Set(remoteCards.map(card => card.id));
    await this.flashcardTransaction((cards, queue) => {
      const pending = queue.getAll();
      pending.onsuccess = () => {
        const pendingIds = new Set(pending.result
          .filter(item => item.table === 'flashcards' && item.data?.user_id === userId)
          .map(item => item.data.id));
        const local = cards.getAll();
        local.onsuccess = () => {
          const localCards = new Map<string, Flashcard>(local.result
            .filter(card => card.user_id === userId).map(card => [card.id, card]));
          for (const card of localCards.values()) {
            if (pendingIds.has(card.id) || remoteIds.has(card.id)) continue;
            if (card.image_position && !card.image_side) {
              // Old releases rejected these manual cards because the column name was wrong.
              const recovered = flashcardMutation(card, 'upsert');
              cards.put(recovered.data);
              queue.put(recovered);
              continue;
            }
            if (Date.parse(card.updated_at || card.created_at || '') >= snapshotStartedAt - 5 * 60_000) continue;
            cards.delete(card.id);
          }
          for (const card of remoteCards) {
            if (pendingIds.has(card.id)) continue;
            const localUpdate = Date.parse(localCards.get(card.id)?.updated_at || '');
            const remoteUpdate = Date.parse(card.updated_at || card.last_review || card.created_at || '');
            if (localUpdate >= snapshotStartedAt && localUpdate > remoteUpdate) continue;
            cards.put(card);
          }
        };
      };
    });
  }

  async clearNonFlashcardSyncQueue(): Promise<void> {
    await this.flashcardTransaction((_cards, queue) => {
      const cursor = queue.openCursor();
      cursor.onsuccess = () => {
        const entry = cursor.result;
        if (!entry) return;
        if (entry.value.table !== 'flashcards') entry.delete();
        entry.continue();
      };
    });
  }

  async clear(storeName: string): Promise<void> {
    const store = await this.getStore(storeName, 'readwrite');
    store.clear();
  }
}

export const localDB = new LocalDB();
