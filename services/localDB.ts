
const DB_NAME = 'NeuroQBank_Local';
const DB_VERSION = 18; // Increment version for new store

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
          'videos', 'video_progress', 'video_materials', 'video_comments',
          'xp_history',
          'processed_documents',
          'didactic_materials',
          'residencia_questions' // Novo store para Neuro Portal Residência
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

  async clear(storeName: string): Promise<void> {
    const store = await this.getStore(storeName, 'readwrite');
    store.clear();
  }
}

export const localDB = new LocalDB();
