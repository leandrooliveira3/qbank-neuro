import { supabase } from './supabase';
import { localDB } from './localDB';

export type SyncStatus = 'offline' | 'syncing' | 'synced' | 'error';

const USER_COLUMN_MAP: Record<string, string> = {
  'profiles': 'id',
  'questions': 'created_by',
  'flashcards': 'user_id',
  'user_answers': 'user_id',
  'user_favorites': 'user_id',
  'summaries': 'user_id',
  'active_practice_sessions': 'user_id',
  'simulation_sessions': 'user_id',
  'clinical_reports': 'user_id',
  'tasks': 'user_id',
  'goals': 'user_id',
  'planning': 'user_id',
  'focus_sessions': 'user_id',
  'video_progress': 'user_id',
  'videos': 'global',
  'didactic_materials': 'global',
  'video_materials': 'global',
  'video_comments': 'global',
  'xp_history': 'user_id',
};

const generateId = () => crypto.randomUUID();

class SyncEngine {
  private isSyncing = false;
  private onStatusChange: (status: SyncStatus) => void = () => {};
  private syncInterval: number | null = null;
  private tableBlacklist = new Set<string>();
  private channel: any = null;

  constructor() {
    if (typeof window !== 'undefined') {
        this.syncInterval = window.setInterval(() => {
            if (document.hasFocus()) this.startSync();
        }, 120000); 

        // Setup Realtime Broadcast for Cross-Device Sync
        this.channel = supabase.channel('neuro_global_sync');
        this.channel.on('broadcast', { event: 'sync_now' }, (payload: any) => {
            if (payload.payload?.device !== this.getDeviceId()) {
                console.log('[Sync] Resync triggered by another device.');
                this.startSync();
            }
        }).subscribe();
    }
  }

  private getDeviceId() {
      if (typeof window === 'undefined') return 'server';
      let did = localStorage.getItem('neuro_device_id');
      if (!did) {
          did = crypto.randomUUID();
          localStorage.setItem('neuro_device_id', did);
      }
      return did;
  }

  setListener(callback: (status: SyncStatus) => void) {
    this.onStatusChange = callback;
  }

  async startSync(force = false) {
    if (this.isSyncing || !navigator.onLine) return;
    
    const queueLength = await this.getQueueLength();
    if (queueLength === 0 && !force && Math.random() > 0.3) return; 

    this.isSyncing = true;
    this.onStatusChange('syncing');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;

      if (userId) {
        await this.pushLocalChanges(userId);
        await this.pullUserData(userId, force);
        if (typeof window !== 'undefined') window.dispatchEvent(new Event('neuro_sync_completed'));
      }
      this.onStatusChange('synced');
    } catch (error) {
      // Falha silenciosa
    } finally {
      this.isSyncing = false;
    }
  }

  private async pullUserData(userId: string, force = false) {
    const tables = Object.keys(USER_COLUMN_MAP);
    for (const table of tables) {
      if (this.tableBlacklist.has(table)) continue;
      try {
        const userCol = USER_COLUMN_MAP[table] || 'user_id';
        
        // Use pagination to bypass Supabase 1000 row limit
        const allData: any[] = [];
        const PAGE_SIZE = 1000;
        let page = 0;
        let hasMore = true;
        
        while (hasMore) {
          let query = supabase.from(table).select('*').range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
          if (userCol !== 'global') query = query.eq(userCol, userId);
          
          const { data, error } = await query;
          
          if (error) {
            // Se a tabela retornar 404, entra na blacklist desta sessão
            if (error.status === 404 || error.code === '42P01' || error.code === 'PGRST116') {
                console.warn(`[Sync] Tabela ${table} não disponível no servidor. Ignorando.`);
                this.tableBlacklist.add(table);
            }
            hasMore = false;
            continue;
          }
          
          if (data && data.length > 0) {
            allData.push(...data);
            hasMore = data.length === PAGE_SIZE; // Continue if we got a full page
            page++;
          } else {
            hasMore = false;
          }
        }
        
        if (allData.length > 0 || page > 0) {
           const localItems = await localDB.getAll(table);
           const serverIds = new Set(allData.map(d => d.id));
           // If userCol is global, we manage all items. Otherwise, only for this userId.
           const expectedUserId = userCol !== 'global' ? userId : undefined;
           
           const toDelete = localItems.filter(l => {
               if (expectedUserId && l[userCol] !== expectedUserId) return false;
               return !serverIds.has(l.id);
           }).map(l => l.id);
           
           if (toDelete.length > 0) await localDB.bulkDelete(table, toDelete);
           if (allData.length > 0) await localDB.bulkPut(table, allData);
        }
      } catch (e) {}
    }
  }

  async pushLocalChanges(userId: string) {
    const queue = await localDB.getAll('sync_queue');
    if (queue.length === 0) return;

    let hasMadeChanges = false;

    for (const item of queue) {
      if (this.tableBlacklist.has(item.table)) {
          await localDB.delete('sync_queue', item.id);
          continue;
      }
      try {
        const userCol = USER_COLUMN_MAP[item.table] || 'user_id';
        let err;
        if (item.action === 'upsert') {
          const payload = { ...item.data };
          if (userCol && userCol !== 'global' && item.table !== 'profiles') payload[userCol] = userId;
          
          // Conflict resolution: Check if the server has a newer version before blindly overwriting
          const { data: serverExisting, error: checkErr } = await supabase.from(item.table).select('updated_at, created_at').eq('id', payload.id).maybeSingle();
          const serverUpdateStr = serverExisting?.updated_at || serverExisting?.created_at;
          const serverUpdate = serverUpdateStr ? new Date(serverUpdateStr).getTime() : 0;
          const localUpdateStr = payload.updated_at || payload.created_at;
          const localUpdate = localUpdateStr ? new Date(localUpdateStr).getTime() : 0;

          if (!checkErr && serverUpdate && localUpdate && serverUpdate > localUpdate) {
              console.log(`[Sync] Conflito resolvido: Servidor tem versão mais recente para ${item.table} ${payload.id}`);
              // Do nothing, server wins. Will get pulled afterwards.
          } else {
              const { error } = await supabase.from(item.table).upsert(payload);
              err = error;
          }
        } else if (item.action === 'delete') {
          const { error } = await supabase.from(item.table).delete().eq('id', item.data.id);
          err = error;
        }

        if (!err) {
            await localDB.delete('sync_queue', item.id);
            hasMadeChanges = true;
        } else if (err.status === 404 || err.code === '42P01') {
            this.tableBlacklist.add(item.table);
            await localDB.delete('sync_queue', item.id);
        }
      } catch (e) {
          await localDB.delete('sync_queue', item.id);
      }
    }

    if (hasMadeChanges && this.channel) {
        this.channel.send({
            type: 'broadcast',
            event: 'sync_now',
            payload: { device: this.getDeviceId() }
        });
    }
  }

  async enqueue(table: string, data: any, action: 'upsert' | 'delete' = 'upsert') {
    if (action === 'delete') await localDB.delete(table, data.id);
    else await localDB.put(table, data);
    await localDB.put('sync_queue', { id: generateId(), table, data, action, timestamp: new Date().toISOString() });
    if (navigator.onLine) setTimeout(() => this.startSync(), 1000);
  }

  async bulkEnqueue(table: string, items: any[]) {
    await localDB.bulkPut(table, items);
    const syncItems = items.map(d => ({ id: generateId(), table, data: d, action: 'upsert', timestamp: new Date().toISOString() }));
    await localDB.bulkPut('sync_queue', syncItems);
    if (navigator.onLine) setTimeout(() => this.startSync(), 1000);
  }

  async bulkDelete(table: string, items: any[]) {
    await localDB.bulkDelete(table, items.map(i => i.id));
    const syncItems = items.map(d => ({ id: generateId(), table, data: d, action: 'delete', timestamp: new Date().toISOString() }));
    await localDB.bulkPut('sync_queue', syncItems);
    if (navigator.onLine) setTimeout(() => this.startSync(), 1000);
  }

  async getQueueLength() {
    const queue = await localDB.getAll('sync_queue');
    return queue.length;
  }
}

export const syncEngine = new SyncEngine();
