import { supabase } from './supabase';
import { localDB } from './localDB';
import { flashcardMutation, flashcardPayload, newestFlashcardMutations, type FlashcardMutation } from './flashcardSync';

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
  private flashcardPush: Promise<boolean> = Promise.resolve(false);
  private onStatusChange: (status: SyncStatus) => void = () => {};
  private syncInterval: number | null = null;
  private tableBlacklist = new Set<string>();
  private channel: any = null;

  constructor() {
    if (typeof window !== 'undefined') {
        this.syncInterval = window.setInterval(() => {
            if (document.hasFocus() && navigator.onLine) this.startSync(false, true);
        }, 120000);

        // Retomada automática da sincronização assim que a internet voltar
        window.addEventListener('online', () => {
            console.log('[Sync] Conexão com a internet restabelecida! Retomando sincronização com a nuvem...');
            this.onStatusChange('syncing');
            setTimeout(() => this.startSync(true, true), 800);
            setTimeout(() => this.startSync(true, true), 3500);
        });

        window.addEventListener('offline', () => {
            console.log('[Sync] Dispositivo desconectado da internet. Alterações serão mantidas no cache local.');
            this.onStatusChange('offline');
        });

        // Setup Realtime Broadcast for Cross-Device Sync
        this.channel = supabase.channel('neuro_global_sync');
        this.channel.on('broadcast', { event: 'sync_now' }, (payload: any) => {
            if (payload.payload?.device !== this.getDeviceId()) {
                console.log('[Sync] Resync triggered by another device.');
                this.startSync(false, true); // It's okay to pull data if another device sent a major change, but we should debounce it if needed. Actually let's NOT pull to avoid freeze.
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

  isUserInActiveActivity(): boolean {
    if (typeof window === 'undefined') return false;
    const hash = window.location.hash || '';
    const path = window.location.pathname || '';
    const url = hash + path;
    
    // Answering questions (realizando questões)
    if (url.includes('/practice/session')) return true;
    
    // Studying flashcards (flashcards)
    if (url.includes('/flashcards/study')) return true;
    
    // Simulated exams (simulados)
    if (url.includes('/simulations/session')) return true;
    
    // No menu vídeo aulas ou assistindo vídeos
    if (url.includes('/videos')) return true;
    
    return false;
  }

  setListener(callback: (status: SyncStatus) => void) {
    this.onStatusChange = callback;
  }

  async startSync(force = false, pull = true) {
    if (this.isSyncing) return;
    if (!navigator.onLine) {
      this.onStatusChange('offline');
      return;
    }

    this.isSyncing = true;
    let hadError = false;
    try {
      if (this.isUserInActiveActivity() && !force) pull = false;
      const queueLength = await this.getQueueLength();
      if (queueLength === 0 && !force && !pull) return;

      this.onStatusChange('syncing');
      let userId: string | undefined;
      try {
        const { data: { session } } = await supabase.auth.getSession();
        userId = session?.user?.id;
      } catch (err) {}

      const hasSession = Boolean(userId);
      if (!userId) {
        userId = localStorage.getItem('neuro_last_user_id') || undefined;
      }

      let flashcardsSynced = true;
      if (userId) {
        flashcardsSynced = await this.pushLocalChanges(userId, hasSession);
        if (pull) {
            await this.pullUserData(userId, hasSession);
            if (typeof window !== 'undefined') window.dispatchEvent(new Event('neuro_sync_completed'));
        }
      }
      hadError = !flashcardsSynced;
      this.onStatusChange(!navigator.onLine ? 'offline' : flashcardsSynced ? 'synced' : 'error');
    } catch (error) {
      hadError = true;
      this.onStatusChange(navigator.onLine ? 'error' : 'offline');
    } finally {
      this.isSyncing = false;
      
      // Check if more items were added to the queue while we were syncing
      if (navigator.onLine && await this.hasRetryableChanges().catch(() => false)) {
        setTimeout(() => this.startSync(false, pull), hadError ? 30_000 : 2_000);
      }
    }
  }

  private async pullUserData(userId: string, hasSession: boolean) {
    const tables = Object.keys(USER_COLUMN_MAP);
    for (const table of tables) {
      if (this.tableBlacklist.has(table) || (table === 'flashcards' && !hasSession)) continue;
      try {
        const userCol = USER_COLUMN_MAP[table] || 'user_id';
        
        // Use offset pagination to avoid dropping items
        const snapshotStartedAt = Date.now();
        const allData: any[] = [];
        const PAGE_SIZE = 1000;
        let page = 0;
        let hasMore = true;
        
        while (hasMore) {
          let query = supabase.from(table).select('*').order('id', { ascending: true }).range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
          if (userCol !== 'global') query = query.eq(userCol, userId);
          
          const { data, error } = await query;
          
          if (error) {
            if (table === 'flashcards') throw error;
            // Se a tabela retornar 404 ou Relation Not Found, entra na blacklist desta sessão
            const status = (error as any).status;
            if (status === 404 || error.code === '42P01' || error.code === 'PGRST116') {
                console.warn(`[Sync] Tabela ${table} não disponível no servidor. Ignorando.`);
                this.tableBlacklist.add(table);
            }
            hasMore = false;
            break;
          }
          
          if (data && data.length > 0) {
            allData.push(...data);
            hasMore = data.length === PAGE_SIZE;
            page++;
          } else {
            hasMore = false;
          }
        }
        
        if (table === 'flashcards') {
          await localDB.reconcileFlashcards(userId, allData, snapshotStartedAt);
          continue;
        }

        if (allData.length > 0 || page > 0) {
           const localItems = await localDB.getAll(table);
           const serverIds = new Set(allData.map(d => d.id));
           // If userCol is global, we manage all items. Otherwise, only for this userId.
           const expectedUserId = userCol !== 'global' ? userId : undefined;
           
           const pendingQueue = await localDB.getAll('sync_queue');
           const pendingIds = new Set(pendingQueue.filter(q => q.table === table && q.action === 'upsert').map(q => q.data.id));
           const pendingDeletes = new Set(pendingQueue.filter(q => q.table === table && q.action === 'delete').map(q => q.data?.id || q.data));
           
           const toDelete = localItems.filter(l => {
               if (expectedUserId && l[userCol] !== expectedUserId) return false;
               if (pendingIds.has(l.id)) return false;
               if (pendingDeletes.has(l.id)) return false;
               
               // Protect recently updated local records from read-replica lag wipeouts
               const lastLocalUpdate = new Date(l.updated_at || l.created_at || 0).getTime();
               if (Date.now() - lastLocalUpdate < 5 * 60 * 1000) return false; // Grace period: 5 minutes
               
               return !serverIds.has(l.id);
           }).map(l => l.id);
           
           if (toDelete.length > 0) await localDB.bulkDelete(table, toDelete);

           const safeToPut = allData.filter(d => !pendingIds.has(d.id) && !pendingDeletes.has(d.id));
           
           if (safeToPut.length > 0) await localDB.bulkPut(table, safeToPut);
        }
      } catch (error) {
        if (table === 'flashcards') throw error;
      }
    }
  }

  private async hasRetryableChanges() {
    const queue = await localDB.getAll('sync_queue');
    if (queue.some(item => item.table !== 'flashcards')) return true;
    if (!queue.length) return false;
    const { data } = await supabase.auth.getSession();
    return queue.some(item => item.data?.user_id === data.session?.user?.id);
  }

  private async pushFlashcardChanges(userId: string) {
    const pending = newestFlashcardMutations(await localDB.getAll('sync_queue'), userId);
    let changed = false;
    let failed = false;
    for (let index = 0; index < pending.length; index += 200) {
      const chunk = pending.slice(index, index + 200);
      const { data, error } = await supabase.from('flashcards')
        .select('id, updated_at, last_review, created_at')
        .eq('user_id', userId).in('id', chunk.map(({ latest }) => latest.data.id));
      if (error) {
        console.error('[Sync] Falha ao consultar flashcards:', error);
        failed = true;
        continue;
      }

      const server = new Map(data.map(card => [card.id, card]));
      const acknowledged: string[] = [];
      const upserts: typeof chunk = [];
      const deletes: typeof chunk = [];
      for (const entry of chunk) {
        const { latest } = entry;
        const remote = server.get(latest.data.id);
        if (latest.action === 'delete') deletes.push(entry);
        else if (remote && Date.parse(remote.updated_at || remote.last_review || remote.created_at) >
          Date.parse(latest.timestamp)) acknowledged.push(...entry.queueIds);
        else upserts.push(entry);
      }

      if (deletes.length) {
        const { error: deleteError } = await supabase.from('flashcards').delete().eq('user_id', userId)
          .in('id', deletes.map(({ latest }) => latest.data.id));
        if (deleteError) {
          console.error('[Sync] Falha ao excluir flashcards:', deleteError);
          failed = true;
        } else {
          acknowledged.push(...deletes.flatMap(entry => entry.queueIds));
          changed = true;
        }
      }

      const payloads = upserts.map(({ latest }) => ({
        ...flashcardPayload(latest.data),
        updated_at: latest.timestamp,
      }));
      // Group identical column sets so missing optional values keep their database defaults.
      const byColumns = new Map<string, number[]>();
      payloads.forEach((payload, index) => {
        const columns = Object.keys(payload).filter(key => payload[key] !== undefined).sort().join(',');
        const group = byColumns.get(columns) ?? [];
        group.push(index);
        byColumns.set(columns, group);
      });

      for (const group of byColumns.values()) {
        const { error: batchError } = await supabase.from('flashcards').upsert(group.map(index => payloads[index]));
        if (!batchError) {
          acknowledged.push(...group.flatMap(index => upserts[index].queueIds));
          changed = true;
          continue;
        }
        // Isolate a rejected card so it cannot block the rest of the deck.
        for (const index of group) {
          const { error: cardError } = group.length === 1 ? { error: batchError }
            : await supabase.from('flashcards').upsert(payloads[index]);
          if (cardError) {
            console.error('[Sync] Falha ao enviar flashcard:', cardError);
            failed = true;
          } else {
            acknowledged.push(...upserts[index].queueIds);
            changed = true;
          }
        }
      }
      await localDB.bulkDelete('sync_queue', acknowledged);
    }
    if (changed) this.broadcastChanges();
    return !failed;
  }

  private broadcastChanges() {
    this.channel?.send({
      type: 'broadcast', event: 'sync_now', payload: { device: this.getDeviceId() },
    });
  }

  async pushLocalChanges(userId: string, hasSession?: boolean) {
    if (hasSession === undefined) {
      const { data } = await supabase.auth.getSession();
      hasSession = data.session?.user?.id === userId;
    }
    const push = hasSession ? this.flashcardPush.catch(() => false).then(() => this.pushFlashcardChanges(userId)) : Promise.resolve(false);
    if (hasSession) this.flashcardPush = push;
    await this.pushOtherChanges(userId);
    return push;
  }

  private async pushOtherChanges(userId: string) {
    const queue = (await localDB.getAll('sync_queue')).filter(item => item.table !== 'flashcards');
    if (queue.length === 0) return;

    let hasMadeChanges = false;
    const tables = [...new Set(queue.map(q => q.table))];

    for (const table of tables) {
      if (this.tableBlacklist.has(table)) {
          const toDelete = queue.filter(q => q.table === table).map(q => q.id);
          await localDB.bulkDelete('sync_queue', toDelete);
          continue;
      }
      
      try {
          const userCol = USER_COLUMN_MAP[table] || 'user_id';
          const tableQueue = queue.filter(q => q.table === table);
          
          const upsertItems = tableQueue.filter(q => q.action === 'upsert');
          const deleteItems = tableQueue.filter(q => q.action === 'delete');
          
          if (deleteItems.length > 0) {
              const deleteIds = deleteItems.map(item => item.data.id);
              for (let i = 0; i < deleteIds.length; i += 500) {
                  const chunk = deleteIds.slice(i, i + 500);
                  const { error } = await supabase.from(table).delete().in('id', chunk);
                  if (error && error.code === '42P01') {
                      this.tableBlacklist.add(table);
                      break;
                  }
              }
              if (!this.tableBlacklist.has(table)) {
                  await localDB.bulkDelete('sync_queue', deleteItems.map(item => item.id));
                  hasMadeChanges = true;
              }
          }
          
          if (upsertItems.length > 0 && !this.tableBlacklist.has(table)) {
              const payloads = upsertItems.map(item => {
                  const payload = { ...item.data };
                  if (userCol && userCol !== 'global' && table !== 'profiles') payload[userCol] = userId;
                  return payload;
              });
              
              const validPayloads = [];
              const CHUNK_SIZE = 500;
              for (let i = 0; i < payloads.length; i += CHUNK_SIZE) {
                  const chunkPayloads = payloads.slice(i, i + CHUNK_SIZE);
                  const chunkIds = chunkPayloads.map(p => p.id);
                  
                  const { data: serverExisting, error: checkErr } = await supabase
                      .from(table)
                      .select('id, updated_at, answered_at, last_review, created_at')
                      .in('id', chunkIds);
                      
                  if (checkErr && checkErr.code === '42P01') {
                      this.tableBlacklist.add(table);
                      break;
                  }
                  
                  const existingMap = new Map((serverExisting || []).map(s => [s.id, s]));
                  
                  for (const payload of chunkPayloads) {
                      const existing = existingMap.get(payload.id);
                      
                      const getServerTime = (d: any) => {
                          if (!d) return 0;
                          const t = d.updated_at || d.answered_at || d.last_review || d.created_at;
                          return t ? new Date(t).getTime() : 0;
                      };
                      const getLocalTime = (d: any) => {
                          const t = d.updated_at || d.answered_at || d.last_review || d.created_at;
                          return t ? new Date(t).getTime() : 0;
                      };
            
                      const serverUpdate = getServerTime(existing);
                      const localUpdate = getLocalTime(payload);
            
                      if (existing && serverUpdate > localUpdate) {
                          console.log(`[Sync] Conflito resolvido: Servidor tem versão mais recente para ${table} ${payload.id}`);
                      } else {
                          validPayloads.push(payload);
                      }
                  }
              }
              
              if (this.tableBlacklist.has(table)) {
                  await localDB.bulkDelete('sync_queue', tableQueue.map(item => item.id));
                  continue;
              }
              
              for (let i = 0; i < validPayloads.length; i += CHUNK_SIZE) {
                  const chunk = validPayloads.slice(i, i + CHUNK_SIZE);
                  let error;
                  if (table === 'profiles') {
                      for (const p of chunk) {
                          const { email, ...profileData } = p;
                          const { error: updateErr } = await supabase.from(table).update(profileData).eq('id', p.id);
                          if (updateErr) error = updateErr;
                      }
                  } else {
                      const { error: upsertErr } = await supabase.from(table).upsert(chunk);
                      error = upsertErr;
                  }
                  
                  if (error) {
                      console.error('[Sync] Error pushing bulk upsert to table:', table, error);
                  } else {
                      hasMadeChanges = true;
                  }
              }
              
              await localDB.bulkDelete('sync_queue', upsertItems.map(item => item.id));
          }
      } catch (e) {
          console.error('[Sync] Exception processing table:', table, e);
      }
    }

    if (hasMadeChanges) this.broadcastChanges();
  }

  private async enqueueFlashcards(items: FlashcardMutation[]) {
    await localDB.saveFlashcardMutations(items);
    if (navigator.onLine) setTimeout(() => this.startSync(false, true), 1000);
  }

  async enqueue(table: string, data: any, action: 'upsert' | 'delete' = 'upsert') {
    if (table === 'flashcards') return this.enqueueFlashcards([flashcardMutation(data, action)]);
    if (action === 'delete') await localDB.delete(table, data.id);
    else await localDB.put(table, data);
    await localDB.put('sync_queue', { id: generateId(), table, data, action, timestamp: new Date().toISOString() });
    if (navigator.onLine) setTimeout(() => this.startSync(false, true), 1000);
  }

  async bulkEnqueue(table: string, items: any[]) {
    if (table === 'flashcards') return this.enqueueFlashcards(items.map(card => flashcardMutation(card, 'upsert')));
    await localDB.bulkPut(table, items);
    const syncItems = items.map(d => ({ id: generateId(), table, data: d, action: 'upsert', timestamp: new Date().toISOString() }));
    await localDB.bulkPut('sync_queue', syncItems);
    if (navigator.onLine) setTimeout(() => this.startSync(false, true), 1000);
  }

  async bulkDelete(table: string, items: any[]) {
    if (table === 'flashcards') return this.enqueueFlashcards(items.map(card => flashcardMutation(card, 'delete')));
    await localDB.bulkDelete(table, items.map(i => i.id));
    const syncItems = items.map(d => ({ id: generateId(), table, data: d, action: 'delete', timestamp: new Date().toISOString() }));
    await localDB.bulkPut('sync_queue', syncItems);
    if (navigator.onLine) setTimeout(() => this.startSync(false, true), 1000);
  }

  async getQueueLength() {
    const queue = await localDB.getAll('sync_queue');
    return queue.length;
  }
}

export const syncEngine = new SyncEngine();
